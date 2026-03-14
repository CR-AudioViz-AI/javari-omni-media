// app/api/javari/chat/route.ts
// Javari AI Chat — OpenRouter only (Gemini Flash + 300+ models)
// Do NOT use Claude/Anthropic — too expensive, hallucinates for this use case
// TODO: when core ecosystem live, remove OPENROUTER_API_KEY from Vercel env
//       and route through craudiovizai.com multi-model router instead
// Date: March 13, 2026 | Henderson Standard

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Model preference order — all via OpenRouter, cheapest/fastest first
const MODEL_CASCADE = [
  'google/gemini-flash-1.5',           // Gemini Flash — fast, cheap, good
  'google/gemini-flash-1.5-8b',        // Smaller Gemini — even cheaper
  'meta-llama/llama-3.1-8b-instruct:free', // Llama free tier
  'mistralai/mistral-7b-instruct:free',    // Mistral free tier
  'google/gemma-2-9b-it:free',             // Gemma free tier
]

const SYSTEM_PROMPT = `You are Javari, the AI inside Javari Omni-Media — a unified entertainment platform.

Your job:
- Help users find what to watch or listen to
- Guide users through connecting Plex, Jellyfin, IPTV playlists, and NAS folders  
- Answer questions about their library
- Give short, direct, accurate recommendations

Rules:
- Be warm and direct. No filler phrases.
- Keep responses under 120 words unless asked for more.
- If you don't know, say so. Never make things up.
- Never mention Claude, Anthropic, OpenRouter, or any AI model names.
- You are Javari. That is your only identity.`

// Smart static fallbacks — zero cost, zero hallucination
const STATIC_RESPONSES: Array<{ match: (s: string) => boolean; response: string }> = [
  {
    match: s => /plex.*(connect|setup|token|url)/i.test(s) || /(connect|setup).*plex/i.test(s),
    response: "To connect Plex: go to Sources → Connect Mode. Enter your server URL (usually http://192.168.1.x:32400) and your Plex token. To find your token: open any movie in Plex → ··· → Get Info → View XML → copy the value after X-Plex-Token= in the URL."
  },
  {
    match: s => /jellyfin.*(connect|setup|key)/i.test(s) || /(connect|setup).*jellyfin/i.test(s),
    response: "To connect Jellyfin: Sources → Connect Mode → enter your server address (usually http://192.168.1.x:8096) and API key. Find your API key in Jellyfin Dashboard → API Keys → +."
  },
  {
    match: s => /folder|nas|scan|standalone|synology/i.test(s),
    response: "To add your NAS library: Sources → Standalone Mode → paste your folder path (e.g. /volume1/media/Movies), pick the type, hit Add & Auto-Scan. Javari scans the files and fetches metadata automatically."
  },
  {
    match: s => /iptv|m3u|channel|playlist/i.test(s),
    response: "To add IPTV channels: Sources → IPTV / M3U → paste your M3U playlist URL from your provider. Channels appear in Live TV automatically. Javari doesn't provide channels — you need an active IPTV subscription."
  },
  {
    match: s => /watch|tonight|recommend|suggest|good movie|good show/i.test(s),
    response: "Connect your Plex server or add your NAS folders first, and I'll recommend from your actual library. Or check Live TV — there's likely something on right now."
  },
]

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Missing messages' }, { status: 400 })
    }

    const lastUserMsg = messages[messages.length - 1]?.content || ''

    // Check static responses first — fastest, cheapest, most accurate for setup questions
    for (const sr of STATIC_RESPONSES) {
      if (sr.match(lastUserMsg)) {
        return NextResponse.json({
          content: [{ type: 'text', text: sr.response }],
          model: 'javari-static',
        })
      }
    }

    const orKey = process.env.OPENROUTER_API_KEY || ''
    if (!orKey) {
      return NextResponse.json({
        content: [{ type: 'text', text: "I'm Javari — your entertainment guide. Ask me what to watch, how to connect Plex, or how to add your NAS folders." }],
        model: 'javari-static',
      })
    }

    // Build context string
    const contextStr = context ? `[Your setup: Plex ${context.plexConnected ? 'connected' : 'not connected'}${context.plexLibraries?.length ? `, libraries: ${context.plexLibraries.join(', ')}` : ''}${context.standaloneFolders?.length ? `, folders: ${context.standaloneFolders.map((f: {label:string;type:string;count:number}) => `${f.label}(${f.count})`).join(', ')}` : ''}${context.services?.length ? `, services: ${context.services.join(', ')}` : ''}]` : ''

    const orMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }, i: number) => ({
        role: m.role,
        content: i === 0 && contextStr ? `${contextStr} ${m.content}` : m.content,
      }))
    ]

    // Try each model in cascade order
    for (const model of MODEL_CASCADE) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${orKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://javari-omni-media.vercel.app',
            'X-Title': 'Javari',
          },
          body: JSON.stringify({
            model,
            messages: orMessages,
            max_tokens: 200,
            temperature: 0.65,
          }),
          signal: AbortSignal.timeout(12000),
        })

        if (res.ok) {
          const data = await res.json()
          const text = data.choices?.[0]?.message?.content
          if (text?.trim()) {
            return NextResponse.json({
              content: [{ type: 'text', text: text.trim() }],
              model,
            })
          }
        }
      } catch {
        // Try next model in cascade
        continue
      }
    }

    // All models failed — final static fallback
    return NextResponse.json({
      content: [{ type: 'text', text: "Having a moment — try again in a few seconds. Or ask me something specific like 'how do I connect Plex?'" }],
      model: 'javari-static',
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Request failed'
    return NextResponse.json({
      content: [{ type: 'text', text: "Something went wrong on my end — try again in a moment." }],
      error: message,
    }, { status: 200 })
  }
}
