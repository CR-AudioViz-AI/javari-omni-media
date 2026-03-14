// app/api/plex/libraries/route.ts
// Javari Omni-Media — Plex Library Import
// Fetches all libraries from a Plex server and returns structured data
// Date: March 13, 2026 | Henderson Standard

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export interface PlexLibrary {
  key: string
  title: string
  type: 'movie' | 'show' | 'artist' | 'photo'
  count: number
  thumb?: string
}

export interface PlexMediaItem {
  id: string
  title: string
  type: 'movie' | 'episode' | 'track' | 'photo'
  year?: number
  thumb?: string
  art?: string
  summary?: string
  rating?: number
  duration?: number
  addedAt?: number
  viewCount?: number
  viewOffset?: number
  grandparentTitle?: string // Show name for episodes
  parentIndex?: number      // Season number
  index?: number            // Episode number
  streamUrl?: string
}

export async function POST(req: NextRequest) {
  try {
    const { plexUrl, plexToken, action, libraryKey, limit = 100, offset = 0 } = await req.json()

    if (!plexUrl || !plexToken) {
      return NextResponse.json({ error: 'Missing plexUrl or plexToken' }, { status: 400 })
    }

    const base = plexUrl.replace(/\/$/, '')
    const headers = {
      'X-Plex-Token': plexToken,
      'Accept': 'application/json',
    }

    // Action: test — verify connection
    if (action === 'test') {
      const res = await fetch(`${base}/?X-Plex-Token=${plexToken}`, {
        headers, signal: AbortSignal.timeout(8000)
      })
      if (!res.ok) return NextResponse.json({ success: false, error: `Plex returned ${res.status}` })
      const data = await res.json()
      const mc = data?.MediaContainer
      return NextResponse.json({
        success: true,
        serverName: mc?.friendlyName || 'Plex Media Server',
        version: mc?.version,
        platform: mc?.platform,
      })
    }

    // Action: libraries — get all library sections
    if (action === 'libraries') {
      const res = await fetch(`${base}/library/sections?X-Plex-Token=${plexToken}`, {
        headers, signal: AbortSignal.timeout(10000)
      })
      if (!res.ok) return NextResponse.json({ error: `Plex returned ${res.status}` }, { status: res.status })
      const data = await res.json()
      const sections = data?.MediaContainer?.Directory || []
      const libraries: PlexLibrary[] = sections.map((s: Record<string, unknown>) => ({
        key: String(s.key),
        title: String(s.title),
        type: String(s.type) as PlexLibrary['type'],
        count: Number(s.count || 0),
        thumb: s.thumb ? `${base}${s.thumb}?X-Plex-Token=${plexToken}` : undefined,
      }))
      return NextResponse.json({ success: true, libraries })
    }

    // Action: items — get items from a library
    if (action === 'items' && libraryKey) {
      const params = new URLSearchParams({
        'X-Plex-Token': plexToken,
        'X-Plex-Container-Start': String(offset),
        'X-Plex-Container-Size': String(limit),
      })
      const res = await fetch(`${base}/library/sections/${libraryKey}/all?${params}`, {
        headers, signal: AbortSignal.timeout(15000)
      })
      if (!res.ok) return NextResponse.json({ error: `Plex returned ${res.status}` }, { status: res.status })
      const data = await res.json()
      const mc = data?.MediaContainer
      const rawItems = mc?.Metadata || mc?.Video || mc?.Directory || []
      const totalSize = mc?.totalSize || rawItems.length

      const items: PlexMediaItem[] = rawItems.map((item: Record<string, unknown>) => {
        const key = String(item.key || item.ratingKey || '')
        const ratingKey = String(item.ratingKey || '')
        const thumb = item.thumb
          ? `${base}${item.thumb}?X-Plex-Token=${plexToken}`
          : undefined
        const art = item.art
          ? `${base}${item.art}?X-Plex-Token=${plexToken}`
          : undefined

        // Build stream URL
        const mediaParts = (item as Record<string, unknown[]>).Media?.[0] as Record<string, unknown[]>
        const partKey = mediaParts?.Part?.[0] as Record<string, unknown>
        const streamUrl = partKey?.key
          ? `${base}${partKey.key}?X-Plex-Token=${plexToken}`
          : undefined

        return {
          id: ratingKey || key,
          title: String(item.title || ''),
          type: String(item.type || 'movie') as PlexMediaItem['type'],
          year: item.year ? Number(item.year) : undefined,
          thumb,
          art,
          summary: String(item.summary || ''),
          rating: item.rating ? Number(item.rating) : undefined,
          duration: item.duration ? Number(item.duration) : undefined,
          addedAt: item.addedAt ? Number(item.addedAt) : undefined,
          viewCount: item.viewCount ? Number(item.viewCount) : undefined,
          viewOffset: item.viewOffset ? Number(item.viewOffset) : undefined,
          grandparentTitle: item.grandparentTitle ? String(item.grandparentTitle) : undefined,
          parentIndex: item.parentIndex ? Number(item.parentIndex) : undefined,
          index: item.index ? Number(item.index) : undefined,
          streamUrl,
        }
      })

      return NextResponse.json({ success: true, items, totalSize, offset, limit })
    }

    // Action: stream — get direct stream URL for an item
    if (action === 'stream') {
      const { itemId } = await req.json().catch(() => ({}))
      if (!itemId) return NextResponse.json({ error: 'Missing itemId' }, { status: 400 })
      const streamUrl = `${base}/library/metadata/${itemId}/allLeaves?X-Plex-Token=${plexToken}`
      return NextResponse.json({ success: true, streamUrl })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Request failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
