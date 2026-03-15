// app/api/media/iptv/parse/route.ts
// Parses user-provided M3U playlists
// Users must provide their own playlists. Javari does not supply IPTV content.
// Date: March 13, 2026 | Henderson Standard

import { NextRequest, NextResponse } from 'next/server'
import { fetchAndParseM3U, parseM3U } from '@/lib/media/iptv-parser'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { url, content } = await req.json()

    // Legal notice acknowledgement required
    const notice = req.headers.get('x-iptv-notice-accepted')
    if (notice !== 'true') {
      return NextResponse.json({
        error: 'Legal notice acknowledgement required',
        notice: 'Javari does not provide or distribute IPTV content. You must have appropriate rights to access any playlist you connect. Acknowledge by setting header x-iptv-notice-accepted: true',
      }, { status: 403 })
    }

    if (url) {
      const result = await fetchAndParseM3U(url)
      return NextResponse.json(result)
    }

    if (content) {
      const result = parseM3U(content)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Provide url or content' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Parse failed' }, { status: 500 })
  }
}
