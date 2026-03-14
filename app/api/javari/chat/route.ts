// app/api/javari/chat/route.ts
// Javari AI Chat — uses Gemini Flash (free tier) NOT Claude
// Reason: Claude is too expensive and hallucinates for this use case
// When core ecosystem is live: route through craudiovizai.com multi-model router
// Date: March 13, 2026 | Henderson Standard

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || ''
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''

const JAVARI_SYSTEM = `You are Javari, the AI assistant inside Javari Omni-Media — a unified entertainment platform.

Your job:
- Help users find what to watch, listen to, or play
- Guide users through connecting Plex, Jellyfin, IPTV playlists, and NAS folders
- Answer questions about their library and sources
- Give short, direct recommendations

Rules:
- Be warm and direct. No corporate fluff.
- Keep responses under 100 words unless the user asks for more detail.
- If you don't know something, say so — don't make it up.
- Never mention Claude, Anthropic, or AI model names.
- You are Javari. That is your only identity.`

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing messages' }, { status: 400 })
    }

    // Build context string to inject into first message
    const contextStr = context ? `
[User's current setup:
- Plex connected: ${context.plexConnected ? 'Yes' : 'No'}
- Plex libraries: ${context.plexLibraries?.join(', ') || 'none'}
- Standalone folders: ${context.standaloneFolders?.map((f: { label: string; type: string; count: number }) => `${f.label} (${f.type}, ${f.count} items)`).join(', ') || 'none'}
- Streaming services: ${context.services?.join(', ') || 'none'}]
` : ''

    const userMessages = messages.map((m: { role: string; content: string }, i: number) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: i === 0 && contextStr ? `${contextStr}\n${m.content}` : m.content }]
    }))

    // Try Gemini Flash first (free)
    if (GEMINI_API_KEY) {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: JAVARI_SYSTEM }] },
            contents: userMessages,
            generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
          }),
          signal: AbortSignal.timeout(15000),
        }
      )

      if (geminiRes.ok) {
        const data = await geminiRes.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) {
          return NextResponse.json({
            content: [{ type: 'text', text }],
            model: 'gemini-1.5-flash',
          })
        }
      }
    }

    // Fallback: OpenRouter with a free/cheap model (Llama 3.1 8B)
    if (OPENROUTER_API_KEY) {
      const orMessages = [
        { role: 'system', content: JAVARI_SYSTEM },
        ...messages.map((m: { role: string; content: string }, i: number) => ({
          role: m.role,
          content: i === 0 && contextStr ? `${contextStr}\n${m.content}` : m.content,
        }))
      ]

      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://javari-omni-media.vercel.app',
          'X-Title': 'Javari Omni-Media',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages: orMessages,
          max_tokens: 300,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(15000),
      })

      if (orRes.ok) {
        const data = await orRes.json()
        const text = data.choices?.[0]?.message?.content
        if (text) {
          return NextResponse.json({
            content: [{ type: 'text', text }],
            model: 'llama-3.1-8b',
          })
        }
      }
    }

    // Final fallback: smart static responses (no API needed)
    const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || ''
    let fallback = "I'm Javari — your entertainment guide. Ask me what to watch, how to connect your Plex server, or how to set up your NAS folders."

    if (lastUserMsg.includes('plex') || lastUserMsg.includes('connect')) {
      fallback = "To connect Plex: go to Sources → Connect Mode, enter your server URL (usually http://192.168.1.x:32400) and your Plex token. Find your token by opening any item in Plex → ··· → Get Info → View XML → look for X-Plex-Token in the URL."
    } else if (lastUserMsg.includes('folder') || lastUserMsg.includes('nas') || lastUserMsg.includes('scan')) {
      fallback = "To add your NAS library: Sources → Standalone Mode → paste your folder path (e.g. /volume1/media/Movies), pick the type, hit Add & Auto-Scan. Javari will import everything automatically."
    } else if (lastUserMsg.includes('watch') || lastUserMsg.includes('tonight') || lastUserMsg.includes('recommend')) {
      fallback = "Connect your Plex server or add your NAS folders first, and I'll recommend from your actual library. Or check Live TV for something on right now."
    } else if (lastUserMsg.includes('iptv') || lastUserMsg.includes('channel') || lastUserMsg.includes('m3u')) {
      fallback = "To add IPTV channels: Sources → IPTV / M3U → paste your M3U playlist URL. Your channels will appear in Live TV automatically."
    }

    return NextResponse.json({
      content: [{ type: 'text', text: fallback }],
      model: 'static-fallback',
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Request failed'
    return NextResponse.json({
      content: [{ type: 'text', text: "I'm having a moment — try again in a few seconds." }],
      error: message,
    }, { status: 200 })
  }
}
