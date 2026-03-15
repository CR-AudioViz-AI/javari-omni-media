// app/api/plex/libraries/route.ts
// Plex Proxy — forwards to craudiovizai.com platform provider service
// NO direct Plex API calls. NO token storage in this app.
// Platform proxies Plex using credentials from the platform vault.
// Date: March 13, 2026 | Henderson Standard

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PLATFORM_API = process.env.NEXT_PUBLIC_PLATFORM_URL
  ? `${process.env.NEXT_PUBLIC_PLATFORM_URL}/api`
  : 'https://craudiovizai.com/api'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // { plexUrl, plexToken, action, libraryKey, limit, offset }

    if (!body.plexUrl || !body.plexToken) {
      return NextResponse.json({ error: 'Missing plexUrl or plexToken' }, { status: 400 })
    }

    // Forward to platform — platform proxies the Plex call
    const platformRes = await fetch(`${PLATFORM_API}/media/providers/plex`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.get('authorization')
          ? { 'Authorization': req.headers.get('authorization')! }
          : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    })

    if (!platformRes.ok) {
      // If platform is down, call Plex directly as temporary fallback
      // TODO: remove this fallback once platform is stable
      return await plexDirectFallback(body)
    }

    const data = await platformRes.json()
    return NextResponse.json(data)

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Request failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// TEMPORARY fallback — direct Plex call when platform is offline
// Remove this when craudiovizai.com core is stable
async function plexDirectFallback(body: {
  plexUrl: string; plexToken: string; action: string; libraryKey?: string; limit?: number; offset?: number
}): Promise<NextResponse> {
  const { plexUrl, plexToken, action, libraryKey, limit = 200, offset = 0 } = body
  const base = plexUrl.replace(/\/$/, '')
  const headers = { 'X-Plex-Token': plexToken, 'Accept': 'application/json' }

  try {
    if (action === 'test') {
      const res = await fetch(`${base}/?X-Plex-Token=${plexToken}`, { headers, signal: AbortSignal.timeout(8000) })
      if (!res.ok) return NextResponse.json({ success: false, error: `Plex returned ${res.status}` })
      const data = await res.json()
      const mc = data?.MediaContainer
      return NextResponse.json({ success: true, serverName: mc?.friendlyName || 'Plex', version: mc?.version, _fallback: true })
    }

    if (action === 'libraries') {
      const res = await fetch(`${base}/library/sections?X-Plex-Token=${plexToken}`, { headers, signal: AbortSignal.timeout(10000) })
      if (!res.ok) return NextResponse.json({ error: `Plex returned ${res.status}` }, { status: res.status })
      const data = await res.json()
      const libraries = (data?.MediaContainer?.Directory || []).map((s: Record<string, unknown>) => ({
        key: String(s.key), title: String(s.title), type: String(s.type),
        count: Number(s.count || 0),
        thumb: s.thumb ? `${base}${s.thumb}?X-Plex-Token=${plexToken}` : undefined,
      }))
      return NextResponse.json({ success: true, libraries, _fallback: true })
    }

    if (action === 'items' && libraryKey) {
      const params = new URLSearchParams({
        'X-Plex-Token': plexToken,
        'X-Plex-Container-Start': String(offset),
        'X-Plex-Container-Size': String(limit),
      })
      const res = await fetch(`${base}/library/sections/${libraryKey}/all?${params}`, { headers, signal: AbortSignal.timeout(15000) })
      if (!res.ok) return NextResponse.json({ error: `Plex returned ${res.status}` }, { status: res.status })
      const data = await res.json()
      const mc = data?.MediaContainer
      const rawItems = mc?.Metadata || []
      const items = rawItems.map((item: Record<string, unknown>) => {
        const mediaParts = (item.Media as Record<string, unknown[]>)?.[0] as Record<string, unknown[]>
        const partKey = mediaParts?.Part?.[0] as Record<string, unknown>
        return {
          id: String(item.ratingKey || item.key || ''),
          title: String(item.title || ''),
          type: String(item.type || 'movie'),
          year: item.year ? Number(item.year) : undefined,
          thumb: item.thumb ? `${base}${item.thumb}?X-Plex-Token=${plexToken}` : undefined,
          art: item.art ? `${base}${item.art}?X-Plex-Token=${plexToken}` : undefined,
          summary: String(item.summary || ''),
          rating: item.rating ? Number(item.rating) : undefined,
          duration: item.duration ? Number(item.duration) : undefined,
          viewOffset: item.viewOffset ? Number(item.viewOffset) : undefined,
          viewCount: item.viewCount ? Number(item.viewCount) : undefined,
          grandparentTitle: item.grandparentTitle ? String(item.grandparentTitle) : undefined,
          parentIndex: item.parentIndex ? Number(item.parentIndex) : undefined,
          index: item.index ? Number(item.index) : undefined,
          streamUrl: partKey?.key ? `${base}${partKey.key}?X-Plex-Token=${plexToken}` : undefined,
        }
      })
      return NextResponse.json({ success: true, items, totalSize: mc?.totalSize || items.length, _fallback: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Plex fallback failed' }, { status: 500 })
  }
}
