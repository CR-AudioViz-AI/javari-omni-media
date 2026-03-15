// app/api/javari/chat/route.ts
// Javari AI Chat — thin client, calls craudiovizai.com platform router
// NO direct OpenRouter calls. NO credentials stored here.
// Platform router handles model selection, cost guardrails, and fallbacks.
// Date: March 13, 2026 | Henderson Standard

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PLATFORM_API = process.env.NEXT_PUBLIC_PLATFORM_URL
  ? `${process.env.NEXT_PUBLIC_PLATFORM_URL}/api`
  : 'https://craudiovizai.com/api'

// Static fallbacks — zero cost, zero platform dependency
// Handles the most common setup questions accurately without any API call
const STATIC_RESPONSES = [
  {
    match: (s: string) => /plex.*(connect|setup|token|url)/i.test(s) || /(connect|setup).*plex/i.test(s),
    response: "To connect Plex: Sources → Connect Mode. Enter your server URL (usually http://192.168.1.x:32400) and your Plex token. Find your token: open any movie in Plex → ··· → Get Info → View XML → copy the value after X-Plex-Token= in the URL."
  },
  {
    match: (s: string) => /jellyfin.*(connect|setup|key)/i.test(s),
    response: "To connect Jellyfin: Sources → Connect Mode → enter your server address (http://192.168.1.x:8096) and API key. Find your API key in Jellyfin: Dashboard → API Keys → +."
  },
  {
    match: (s: string) => /folder|nas|scan|standalone|synology/i.test(s),
    response: "To add your NAS library: Sources → Standalone Mode → paste your folder path (e.g. /volume1/media/Movies), pick the type, hit Add & Auto-Scan. Javari scans files and fetches metadata automatically."
  },
  {
    match: (s: string) => /iptv|m3u|channel|playlist/i.test(s),
    response: "To add IPTV channels: Sources → IPTV / M3U → paste your M3U playlist URL. Channels appear in Live TV automatically. You need an active IPTV subscription — Javari doesn't provide channels."
  },
]

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Missing messages' }, { status: 400 })
    }

    const lastMsg = messages[messages.length - 1]?.content || ''

    // Static responses first — no API cost, no latency, no failure mode
    for (const sr of STATIC_RESPONSES) {
      if (sr.match(lastMsg)) {
        return NextResponse.json({
          content: [{ type: 'text', text: sr.response }],
          model: 'javari-static',
          source: 'static',
        })
      }
    }

    // Forward to platform router
    // Platform handles: model selection, OpenRouter call, cost tracking, fallbacks
    try {
      const platformRes = await fetch(`${PLATFORM_API}/javari/router`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Pass through user session token if present
          ...(req.headers.get('authorization')
            ? { 'Authorization': req.headers.get('authorization')! }
            : {}),
        },
        body: JSON.stringify({
          task_type: 'media_recommendations',
          messages,
          context,
        }),
        signal: AbortSignal.timeout(20000),
      })

      if (platformRes.ok) {
        const data = await platformRes.json()
        const text = data.content?.[0]?.text || data.content || data.response || ''
        if (text) {
          return NextResponse.json({
            content: [{ type: 'text', text }],
            model: data.model || 'platform-router',
            source: 'platform',
          })
        }
      }
    } catch {
      // Platform unavailable — fall through to static fallback
    }

    // Final fallback — platform offline or no match
    return NextResponse.json({
      content: [{ type: 'text', text: "I'm Javari — your entertainment guide. Ask me what to watch, how to connect your Plex server, or how to add your NAS folders. The platform router is temporarily unavailable." }],
      model: 'javari-static',
      source: 'fallback',
    })

  } catch (err: unknown) {
    return NextResponse.json({
      content: [{ type: 'text', text: "Something went wrong — try again in a moment." }],
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 200 })
  }
}
