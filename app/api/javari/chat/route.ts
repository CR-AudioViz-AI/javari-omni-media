// app/api/javari/chat/route.ts
// Javari AI Chat — OpenRouter only (300+ models including free Gemini Flash)
// Gemini direct API never worked — OpenRouter handles Gemini + everything else
// TODO: when core ecosystem live, route through craudiovizai.com multi-model router
// Date: March 13, 2026 | Henderson Standard

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Model priority: free first, cheap fallbacks, static last
// All via OpenRouter — one key, 300+ models
const MODELS = [
  'google/gemini-flash-1.5:free',        // Gemini Flash — free via OpenRouter
  'meta-llama/llama-3.1-8b-instruct:free', // Llama 3.1 8B — free
  'mistralai/mistral-7b-instruct:free',   // Mistral 7B — free
  'deepseek/deepseek-chat:free',          // DeepSeek — free
]

const JAVARI_SYSTEM = `You are Javari, the AI assistant inside Javari Omni-Media.

Your job: help users find content to watch, set up their library, and navigate the app.

Rules:
- Be warm, direct, and brief. Under 80 words unless asked for more.
- Give specific, accurate answers. Never make things up.
- If you don't know, say so clearly.
- Never mention your model name, Claude, or any AI company.
- You are Javari. Only Javari.

When helping with setup: give exact steps, exact field names, exact paths.
When recommending content: give specific titles with where to watch them.`

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing messages' }, { status: 400 })
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''

    // Build context injection for first message
    const contextNote = context ? [
      context.plexConnected ? `User has Plex connected.` : '',
      context.plexLibraries?.length ? `Plex libraries: ${context.plexLibraries.join(', ')}.` : '',
      context.standaloneFolders?.length ? `Standalone folders: ${context.standaloneFolders.map((f: { label: string; type: string; count: number }) => `${f.label} (${f.count} ${f.type})`).join(', ')}.` : '',
      context.services?.length ? `Streaming services: ${context.services.join(', ')}.` : '',
    ].filter(Boolean).join(' ') : ''

    const orMessages = [
      { role: 'system', content: JAVARI_SYSTEM + (contextNote ? `\n\n[Context: ${contextNote}]` : '') },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'ai' ? 'assistant' : m.role,
        content: m.content,
      }))
    ]

    // Try each free model in priority order
    if (OPENROUTER_API_KEY) {
      for (const model of MODELS) {
        try {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://javari-omni-media.vercel.app',
              'X-Title': 'Javari Omni-Media',
            },
            body: JSON.stringify({
              model,
              messages: orMessages,
              max_tokens: 250,
              temperature: 0.65,
            }),
            signal: AbortSignal.timeout(12000),
          })

          if (res.ok) {
            const data = await res.json()
            const text = data.choices?.[0]?.message?.content
            if (text && text.trim()) {
              return NextResponse.json({
                content: [{ type: 'text', text: text.trim() }],
                model,
              })
            }
          }
        } catch {
          // This model timed out or failed — try next
          continue
        }
      }
    }

    // Static fallback — no API needed, accurate answers to common questions
    const last = messages[messages.length - 1]?.content?.toLowerCase() || ''

    const staticReplies: [RegExp, string][] = [
      [/plex|connect.*server|server.*connect/, "To connect Plex: Sources → Connect Mode → enter your server URL (http://192.168.1.x:32400) and token. Find your token: open Plex → click any item → ··· → Get Info → View XML → copy the value after X-Plex-Token="],
      [/folder|nas|scan|standalone|synology|qnap/, "To add your NAS: Sources → Standalone Mode → paste your folder path (e.g. /volume1/media/Movies) → pick the type → Add & Auto-Scan. Javari fetches all metadata automatically."],
      [/iptv|m3u|channel|playlist/, "To add IPTV channels: Sources → IPTV / M3U → paste your M3U playlist URL → Load Channels. They appear in Live TV immediately."],
      [/watch|tonight|recommend|suggest/, "Connect your Plex server or add a NAS folder first and I can recommend from your actual library. Or check Live TV for what's on right now."],
      [/token|find.*token|where.*token/, "Your Plex token: open Plex in browser → click any movie → ··· → Get Info → View XML → look for X-Plex-Token= in the URL that opens. Copy everything after the = sign."],
      [/jellyfin/, "To connect Jellyfin: Sources → Connect Mode → enter your server address (http://192.168.1.x:8096) and API key. Find your API key in Jellyfin Dashboard → API Keys → +."],
    ]

    for (const [pattern, reply] of staticReplies) {
      if (pattern.test(last)) {
        return NextResponse.json({
          content: [{ type: 'text', text: reply }],
          model: 'static',
        })
      }
    }

    return NextResponse.json({
      content: [{ type: 'text', text: "I'm Javari — your entertainment guide. Ask me what to watch, how to connect your Plex server, add NAS folders, or set up IPTV channels." }],
      model: 'static',
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Request failed'
    return NextResponse.json({
      content: [{ type: 'text', text: "Having a moment — try again in a few seconds." }],
      error: message,
    }, { status: 200 })
  }
}
