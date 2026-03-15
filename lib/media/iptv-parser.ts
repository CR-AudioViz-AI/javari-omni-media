// lib/media/iptv-parser.ts
// Javari Omni-Media — IPTV M3U Parser
// Parses user-provided M3U playlists into normalized channel objects.
// This app does NOT bundle any IPTV playlists.
// Users must provide their own playlists and are responsible for their legality.
// Date: March 13, 2026 | Henderson Standard

export interface IPTVChannel {
  id: string
  name: string
  logo?: string
  stream_url: string
  category: string
  language?: string
  country?: string
  is_hls: boolean
  epg_id?: string
  number?: number
}

export interface ParsedPlaylist {
  channels: IPTVChannel[]
  total: number
  categories: string[]
  by_category: Record<string, IPTVChannel[]>
  parse_ms: number
  errors: string[]
}

// Category normalization map
const CATEGORY_MAP: Record<string, string> = {
  // Sports
  'sport': 'Sports', 'sports': 'Sports', 'nfl': 'Sports', 'nba': 'Sports',
  'soccer': 'Sports', 'football': 'Sports', 'basketball': 'Sports',
  'baseball': 'Sports', 'hockey': 'Sports', 'tennis': 'Sports', 'golf': 'Sports',
  // News
  'news': 'News', 'information': 'News', 'infotainment': 'News',
  // Movies & Entertainment
  'movies': 'Movies', 'movie': 'Movies', 'cinema': 'Movies', 'films': 'Movies',
  'entertainment': 'Entertainment', 'general': 'Entertainment',
  // Kids
  'kids': 'Kids', 'children': 'Kids', 'family': 'Kids',
  // Music
  'music': 'Music',
  // Documentaries
  'documentary': 'Documentaries', 'documentaries': 'Documentaries', 'nature': 'Documentaries',
  // Local
  'local': 'Local', 'regional': 'Local',
  // International
  'international': 'International', 'foreign': 'International',
}

function normalizeCategory(raw: string): string {
  const lower = raw.toLowerCase().trim()
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return value
  }
  return raw.trim() || 'Entertainment'
}

export function parseM3U(content: string): ParsedPlaylist {
  const start = Date.now()
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
  const channels: IPTVChannel[] = []
  const errors: string[] = []

  let i = 0
  let channelNum = 1

  while (i < lines.length) {
    const line = lines[i]

    if (!line.startsWith('#EXTINF:')) {
      i++
      continue
    }

    // Find the stream URL on the next non-comment line
    let streamUrl = ''
    let j = i + 1
    while (j < lines.length && lines[j].startsWith('#')) j++
    if (j < lines.length) streamUrl = lines[j]

    if (!streamUrl || !streamUrl.startsWith('http')) {
      i++
      continue
    }

    try {
      // Parse attributes from #EXTINF line
      const nameMatch = line.match(/,(.+)$/)
      const name = nameMatch?.[1]?.trim() || `Channel ${channelNum}`

      const logoMatch = line.match(/tvg-logo="([^"]*)"/)
      const groupMatch = line.match(/group-title="([^"]*)"/)
      const langMatch = line.match(/tvg-language="([^"]*)"/)
      const countryMatch = line.match(/tvg-country="([^"]*)"/)
      const epgMatch = line.match(/tvg-id="([^"]*)"/)
      const numMatch = line.match(/tvg-chno="([^"]*)"/)

      const rawCategory = groupMatch?.[1] || ''
      const category = normalizeCategory(rawCategory)

      const is_hls = streamUrl.includes('.m3u8') ||
        streamUrl.includes('/hls/') ||
        streamUrl.includes('type=hls') ||
        streamUrl.includes('/live/')

      channels.push({
        id: `ch_${Buffer.from(streamUrl).toString('base64').slice(0, 12)}`,
        name,
        logo: logoMatch?.[1] || undefined,
        stream_url: streamUrl,
        category,
        language: langMatch?.[1] || undefined,
        country: countryMatch?.[1] || undefined,
        is_hls,
        epg_id: epgMatch?.[1] || undefined,
        number: numMatch ? parseInt(numMatch[1]) : channelNum,
      })

      channelNum++
      i = j + 1
    } catch (err) {
      errors.push(`Line ${i}: ${err instanceof Error ? err.message : 'Parse error'}`)
      i++
    }
  }

  // Group by category
  const by_category: Record<string, IPTVChannel[]> = {}
  for (const ch of channels) {
    if (!by_category[ch.category]) by_category[ch.category] = []
    by_category[ch.category].push(ch)
  }

  const categories = Object.keys(by_category).sort()

  return {
    channels,
    total: channels.length,
    categories,
    by_category,
    parse_ms: Date.now() - start,
    errors,
  }
}

// Fetch and parse a remote M3U playlist (server-side only)
export async function fetchAndParseM3U(url: string): Promise<ParsedPlaylist & { fetch_ms: number; error?: string }> {
  const fetchStart = Date.now()

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Javari/1.0 (Media Player)',
        'Accept': 'application/x-mpegurl, application/vnd.apple.mpegurl, */*',
      },
    })

    if (!res.ok) {
      return {
        channels: [], total: 0, categories: [], by_category: {},
        parse_ms: 0, errors: [`HTTP ${res.status}: ${res.statusText}`],
        fetch_ms: Date.now() - fetchStart,
        error: `Could not fetch playlist: HTTP ${res.status}`,
      }
    }

    const content = await res.text()
    const parsed = parseM3U(content)

    return {
      ...parsed,
      fetch_ms: Date.now() - fetchStart,
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Fetch failed'
    return {
      channels: [], total: 0, categories: [], by_category: {},
      parse_ms: 0, errors: [msg],
      fetch_ms: Date.now() - fetchStart,
      error: `Could not fetch playlist: ${msg}`,
    }
  }
}
