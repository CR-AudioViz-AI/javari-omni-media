// lib/platform/client.ts
// CRAudioVizAI Platform Client — Javari Omni-Media
// All infrastructure calls go through this client to craudiovizai.com
// This app is a thin client. It owns NO infrastructure services.
// Date: March 13, 2026 | Henderson Standard

const PLATFORM_BASE = process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://craudiovizai.com'
const PLATFORM_API = `${PLATFORM_BASE}/api`

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface PlatformResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  cached?: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface MediaMetadata {
  tmdbId?: number
  title?: string
  overview?: string
  releaseDate?: string
  posterPath?: string
  backdropPath?: string
  rating?: number
  genres?: string[]
  runtime?: number
  cast?: { name: string; character: string }[]
  director?: string
  tagline?: string
  seasons?: number
  episodes?: number
  trailer?: string
}

export interface ScanResult {
  success: boolean
  importedItems: number
  items: ScannedItem[]
  error?: string
  suggestion?: string
}

export interface ScannedItem {
  id: string
  filename: string
  filepath: string
  ext: string
  sizeBytes: number
  type: string
  parsed: { title: string; year?: number; season?: number; episode?: number }
  metadata?: MediaMetadata
}

export interface PlexLibrary {
  key: string
  title: string
  type: 'movie' | 'show' | 'artist' | 'photo'
  count: number
  thumb?: string
}

export interface PlexItem {
  id: string
  title: string
  type: string
  year?: number
  thumb?: string
  art?: string
  summary?: string
  rating?: number
  duration?: number
  viewCount?: number
  viewOffset?: number
  grandparentTitle?: string
  parentIndex?: number
  index?: number
  streamUrl?: string
}

// ─── HTTP HELPER ─────────────────────────────────────────────────────────────

async function platformPost<T>(
  path: string,
  body: unknown,
  sessionToken?: string
): Promise<PlatformResponse<T>> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`

    const res = await fetch(`${PLATFORM_API}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      return { success: false, error: err.error || `Platform returned ${res.status}` }
    }

    const data = await res.json()
    return { success: true, data, cached: data._cached }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Platform request failed'
    return { success: false, error: msg }
  }
}

async function platformGet<T>(
  path: string,
  params?: Record<string, string>,
  sessionToken?: string
): Promise<PlatformResponse<T>> {
  try {
    const url = new URL(`${PLATFORM_API}${path}`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    const headers: Record<string, string> = {}
    if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`

    const res = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(10000) })
    if (!res.ok) {
      return { success: false, error: `Platform returned ${res.status}` }
    }
    const data = await res.json()
    return { success: true, data }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Platform request failed'
    return { success: false, error: msg }
  }
}

// ─── 1. JAVARI AI ROUTER ─────────────────────────────────────────────────────

export async function callJavariRouter(
  messages: ChatMessage[],
  context?: Record<string, unknown>,
  taskType = 'media_recommendations',
  sessionToken?: string
): Promise<{ content: string; model?: string; error?: string }> {
  const res = await platformPost<{ content: string; model: string }>(
    '/javari/router',
    { task_type: taskType, messages, context },
    sessionToken
  )

  if (!res.success || !res.data) {
    // Graceful static fallback — never fail silently
    return {
      content: "I'm Javari — your entertainment guide. Ask me what to watch, how to connect your Plex server, or how to add your NAS folders.",
      error: res.error,
    }
  }

  return { content: res.data.content, model: res.data.model }
}

// ─── 2. MEDIA METADATA ───────────────────────────────────────────────────────

export async function fetchMediaMetadata(
  title: string,
  type: 'movie' | 'tv',
  year?: number
): Promise<MediaMetadata | null> {
  const res = await platformPost<MediaMetadata>('/media/metadata', { title, type, year })
  return res.success ? (res.data || null) : null
}

// ─── 3. LIBRARY SCAN ─────────────────────────────────────────────────────────

export async function scanLibraryFolder(
  folderPath: string,
  libraryType: string,
  sessionToken?: string
): Promise<ScanResult> {
  const res = await platformPost<ScanResult>(
    '/media/library/scan',
    { folderPath, type: libraryType, fetchMetadata: true, maxItems: 500 },
    sessionToken
  )

  if (!res.success) {
    return {
      success: false,
      importedItems: 0,
      items: [],
      error: res.error || 'Scan failed',
      suggestion: 'For a Synology NAS, try /volume1/media/Movies — check the path is accessible from the server.',
    }
  }

  return res.data as ScanResult || { success: true, importedItems: 0, items: [] }
}

// ─── 4. PLEX PROXY ───────────────────────────────────────────────────────────

export async function plexProxy(payload: {
  plexUrl: string
  plexToken: string
  action: 'test' | 'libraries' | 'items' | 'stream'
  libraryKey?: string
  limit?: number
  offset?: number
}): Promise<PlatformResponse> {
  // Plex calls go through platform — platform holds token in vault
  // For now: pass through as platform proxies the call
  return platformPost('/media/providers/plex', payload)
}

// ─── 5. IPTV PARSE ───────────────────────────────────────────────────────────

export async function parseIptvPlaylist(
  m3uUrl: string,
  sessionToken?: string
): Promise<PlatformResponse> {
  return platformPost('/media/iptv/parse', { url: m3uUrl }, sessionToken)
}

// ─── 6. STREAMING PROVIDERS ──────────────────────────────────────────────────

export async function getStreamingProviders(
  sessionToken?: string
): Promise<PlatformResponse> {
  return platformGet('/media/providers', undefined, sessionToken)
}

export async function updateStreamingProvider(
  providerId: string,
  connected: boolean,
  sessionToken?: string
): Promise<PlatformResponse> {
  return platformPost('/media/providers', { providerId, connected }, sessionToken)
}

// ─── 7. WATCHLIST ────────────────────────────────────────────────────────────

export async function updateWatchlist(
  action: 'add' | 'remove' | 'get',
  item?: { id: string; title: string; type: string; thumb?: string },
  sessionToken?: string
): Promise<PlatformResponse> {
  return platformPost('/media/watchlist', { action, item }, sessionToken)
}

// ─── 8. WATCH HISTORY ────────────────────────────────────────────────────────

export async function updateWatchHistory(
  item: {
    id: string
    title: string
    type: string
    viewOffset?: number
    duration?: number
    source: 'plex' | 'standalone' | 'streaming'
  },
  sessionToken?: string
): Promise<PlatformResponse> {
  return platformPost('/media/history', { item }, sessionToken)
}

export async function getWatchHistory(
  limit = 20,
  sessionToken?: string
): Promise<PlatformResponse> {
  return platformPost('/media/history', { action: 'get', limit }, sessionToken)
}

// ─── 9. RECOMMENDATIONS ──────────────────────────────────────────────────────

export async function getRecommendations(payload: {
  userId?: string
  libraries?: { label: string; type: string; count: number }[]
  history?: unknown[]
  watchlist?: unknown[]
}, sessionToken?: string): Promise<PlatformResponse> {
  return platformPost('/javari/recommendations', payload, sessionToken)
}

// ─── 10. USER PROFILE ────────────────────────────────────────────────────────

export async function getUserProfile(sessionToken?: string): Promise<PlatformResponse> {
  return platformGet('/users/profile', undefined, sessionToken)
}

export async function updateUserProfile(
  profile: Record<string, unknown>,
  sessionToken?: string
): Promise<PlatformResponse> {
  return platformPost('/users/profile', profile, sessionToken)
}

// ─── PLATFORM HEALTH ─────────────────────────────────────────────────────────

export async function checkPlatformHealth(): Promise<{ online: boolean; latency?: number }> {
  const start = Date.now()
  try {
    const res = await fetch(`${PLATFORM_BASE}/api/health`, { signal: AbortSignal.timeout(5000) })
    return { online: res.ok, latency: Date.now() - start }
  } catch {
    return { online: false }
  }
}

export { PLATFORM_BASE, PLATFORM_API }
