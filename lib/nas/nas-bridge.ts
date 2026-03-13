// lib/nas/nas-bridge.ts
// Javari Omni-Media - NAS & Local Server Bridge
// Connects to Jellyfin, Plex, Synology, QNAP, and *arr stack
// Date: March 12, 2026

import type { MediaItem } from '@/lib/store/app-store'

// ============================================================================
// JELLYFIN BRIDGE
// ============================================================================

export interface JellyfinConfig {
  url: string
  apiKey: string
  userId?: string
}

export async function jellyfinGetItems(
  config: JellyfinConfig,
  type: 'Movie' | 'Series' | 'Audio' | 'Photo',
  limit = 200
): Promise<MediaItem[]> {
  try {
    // Get user ID if not provided
    let userId = config.userId
    if (!userId) {
      const usersRes = await fetch(`${config.url}/Users`, {
        headers: { 'X-Emby-Token': config.apiKey },
      })
      if (usersRes.ok) {
        const users = await usersRes.json()
        userId = users[0]?.Id
      }
    }
    if (!userId) throw new Error('Could not determine Jellyfin user ID')

    const params = new URLSearchParams({
      IncludeItemTypes: type,
      Recursive: 'true',
      Fields: 'BasicSyncInfo,MediaSources,Overview,People,Genres,Taglines',
      ImageTypeLimit: '1',
      EnableImageTypes: 'Primary,Backdrop',
      Limit: String(limit),
      SortBy: 'DateCreated',
      SortOrder: 'Descending',
    })

    const res = await fetch(
      `${config.url}/Users/${userId}/Items?${params}`,
      { headers: { 'X-Emby-Token': config.apiKey } }
    )
    if (!res.ok) throw new Error(`Jellyfin returned ${res.status}`)

    const data = await res.json()
    return (data.Items || []).map((item: Record<string, unknown>) =>
      jellyfinItemToMedia(item, config, userId as string)
    )
  } catch (err) {
    console.error('[NAS Bridge] Jellyfin error:', err)
    return []
  }
}

function jellyfinItemToMedia(
  item: Record<string, unknown>,
  config: JellyfinConfig,
  userId: string
): MediaItem {
  const baseUrl = config.url
  const id = item.Id as string
  
  let type: MediaItem['type'] = 'movie'
  if (item.Type === 'Series') type = 'tv'
  if (item.Type === 'Audio') type = 'music'
  if (item.Type === 'Photo') type = 'photo'

  const poster = item.ImageTags && (item.ImageTags as Record<string, string>).Primary
    ? `${baseUrl}/Items/${id}/Images/Primary?fillHeight=400&fillWidth=270&quality=90`
    : undefined

  const backdrop = Array.isArray(item.BackdropImageTags) && (item.BackdropImageTags as string[]).length > 0
    ? `${baseUrl}/Items/${id}/Images/Backdrop/0?fillHeight=720&fillWidth=1280&quality=90`
    : undefined

  return {
    id: `jellyfin-${id}`,
    title: item.Name as string || 'Unknown',
    type,
    year: item.ProductionYear as number | undefined,
    poster,
    backdrop,
    overview: item.Overview as string | undefined,
    rating: item.CommunityRating as number | undefined,
    streamUrl: `${baseUrl}/Videos/${id}/stream?static=true&api_key=${config.apiKey}`,
    source: 'jellyfin',
    duration: item.RunTimeTicks
      ? Math.floor((item.RunTimeTicks as number) / 10000000)
      : undefined,
    watched: (item.UserData as Record<string, unknown>)?.Played as boolean | undefined,
    watchProgress:
      (item.UserData as Record<string, unknown>)?.PlaybackPositionTicks
        ? Math.floor(
            ((item.UserData as Record<string, unknown>).PlaybackPositionTicks as number) / 10000000
          )
        : undefined,
    addedAt: item.DateCreated as string || new Date().toISOString(),
    metadata: {
      jellyfinId: id,
      jellyfinUserId: userId,
      genres: item.Genres,
      people: item.People,
    },
  }
}

// ============================================================================
// PLEX BRIDGE
// ============================================================================

export interface PlexConfig {
  url: string
  token: string
}

export async function plexGetLibraries(config: PlexConfig) {
  const res = await fetch(
    `${config.url}/library/sections?X-Plex-Token=${config.token}`,
    { headers: { Accept: 'application/json' } }
  )
  if (!res.ok) throw new Error(`Plex returned ${res.status}`)
  const data = await res.json()
  return data.MediaContainer?.Directory || []
}

export async function plexGetItems(
  config: PlexConfig,
  sectionKey: string,
  limit = 200
): Promise<MediaItem[]> {
  try {
    const res = await fetch(
      `${config.url}/library/sections/${sectionKey}/all?X-Plex-Token=${config.token}&X-Plex-Container-Size=${limit}`,
      { headers: { Accept: 'application/json' } }
    )
    if (!res.ok) throw new Error(`Plex returned ${res.status}`)
    const data = await res.json()
    const items = data.MediaContainer?.Metadata || []
    return items.map((item: Record<string, unknown>) => plexItemToMedia(item, config))
  } catch (err) {
    console.error('[NAS Bridge] Plex error:', err)
    return []
  }
}

function plexItemToMedia(item: Record<string, unknown>, config: PlexConfig): MediaItem {
  const type: MediaItem['type'] =
    item.type === 'show' ? 'tv' : item.type === 'track' ? 'music' : 'movie'

  const poster = item.thumb
    ? `${config.url}${item.thumb}?X-Plex-Token=${config.token}`
    : undefined

  const backdrop = item.art
    ? `${config.url}${item.art}?X-Plex-Token=${config.token}`
    : undefined

  return {
    id: `plex-${item.ratingKey}`,
    title: item.title as string || 'Unknown',
    type,
    year: item.year as number | undefined,
    poster,
    backdrop,
    overview: item.summary as string | undefined,
    rating: item.rating as number | undefined,
    source: 'plex',
    streamUrl: item.Media
      ? `${config.url}${(item.Media as Array<Record<string, unknown>>)[0]?.Part?.[0]?.key}?X-Plex-Token=${config.token}`
      : undefined,
    duration: item.duration ? Math.floor((item.duration as number) / 1000) : undefined,
    watched: (item.viewCount as number || 0) > 0,
    watchProgress: item.viewOffset
      ? Math.floor((item.viewOffset as number) / 1000)
      : undefined,
    addedAt: item.addedAt
      ? new Date((item.addedAt as number) * 1000).toISOString()
      : new Date().toISOString(),
    metadata: {
      plexKey: item.ratingKey,
      genres: item.Genre,
      studio: item.studio,
    },
  }
}

// ============================================================================
// CONNECTION TEST
// ============================================================================

export async function testJellyfinConnection(url: string, apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/nas/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'jellyfin', url, apiKey }),
    })
    const data = await res.json()
    return data.success === true
  } catch {
    return false
  }
}

export async function testPlexConnection(url: string, token: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/nas/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'plex', url, token }),
    })
    const data = await res.json()
    return data.success === true
  } catch {
    return false
  }
}
