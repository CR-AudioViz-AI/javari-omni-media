// app/api/nas/test/route.ts
// Javari Omni-Media - NAS Connection Test Endpoint
// Date: March 12, 2026

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, url, apiKey, token } = body as {
      type: 'jellyfin' | 'plex'
      url: string
      apiKey?: string
      token?: string
    }

    if (!url) {
      return NextResponse.json({ success: false, error: 'Missing URL' }, { status: 400 })
    }

    if (type === 'jellyfin') {
      const res = await fetch(`${url}/System/Info`, {
        headers: { 'X-Emby-Token': apiKey || '' },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) throw new Error(`Jellyfin returned ${res.status}`)
      const data = await res.json()
      return NextResponse.json({ success: true, serverName: data.ServerName, version: data.Version })
    }

    if (type === 'plex') {
      const res = await fetch(`${url}?X-Plex-Token=${token}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) throw new Error(`Plex returned ${res.status}`)
      const data = await res.json()
      return NextResponse.json({
        success: true,
        serverName: data.MediaContainer?.friendlyName,
        version: data.MediaContainer?.version,
      })
    }

    return NextResponse.json({ success: false, error: 'Unknown type' }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection failed'
    return NextResponse.json({ success: false, error: message }, { status: 200 })
  }
}
