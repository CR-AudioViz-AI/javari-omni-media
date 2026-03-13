// lib/iptv/iptv-manager.ts
// Javari Omni-Media - IPTV & Live TV Engine
// Parses M3U playlists, manages channels, fetches EPG data
// Date: March 12, 2026

import type { Channel, EPGEntry } from '@/lib/store/app-store'

// ============================================================================
// M3U PARSER
// ============================================================================

interface RawChannel {
  name: string
  logo?: string
  groupTitle?: string
  tvgId?: string
  tvgCountry?: string
  tvgLanguage?: string
  streamUrl: string
  isHD: boolean
}

export function parseM3U(content: string): RawChannel[] {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean)
  const channels: RawChannel[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.startsWith('#EXTINF:')) continue

    const streamUrl = lines[i + 1]
    if (!streamUrl || streamUrl.startsWith('#')) continue

    // Parse attributes from #EXTINF line
    const nameMatch = line.match(/,(.+)$/)
    const logoMatch = line.match(/tvg-logo="([^"]*)"/)
    const groupMatch = line.match(/group-title="([^"]*)"/)
    const tvgIdMatch = line.match(/tvg-id="([^"]*)"/)
    const tvgCountryMatch = line.match(/tvg-country="([^"]*)"/)
    const tvgLanguageMatch = line.match(/tvg-language="([^"]*)"/)

    const name = nameMatch?.[1]?.trim() || 'Unknown Channel'
    const isHD = /\bHD\b|\b4K\b|\bUHD\b/i.test(name) || /\bHD\b/i.test(line)

    channels.push({
      name,
      logo: logoMatch?.[1] || undefined,
      groupTitle: groupMatch?.[1] || categorizeChannel(name),
      tvgId: tvgIdMatch?.[1] || undefined,
      tvgCountry: tvgCountryMatch?.[1] || undefined,
      tvgLanguage: tvgLanguageMatch?.[1] || 'en',
      streamUrl: streamUrl.trim(),
      isHD,
    })
  }

  return channels
}

function categorizeChannel(name: string): string {
  const n = name.toLowerCase()
  if (/sport|nfl|nba|mlb|nhl|espn|fox sport|sky sport|bein|dazn|ufc|wrestling/.test(n)) return 'Sports'
  if (/news|cnn|bbc|fox news|msnbc|cnbc|abc news|nbc news|cbs news|bloomberg|reuters/.test(n)) return 'News'
  if (/kids|cartoon|disney|nickelodeon|toon|junior|baby|children/.test(n)) return 'Kids'
  if (/movie|cinema|film|hbo|showtime|starz|cinemax|amc/.test(n)) return 'Movies'
  if (/music|mtv|vh1|hits|radio/.test(n)) return 'Music'
  if (/comedy|funny/.test(n)) return 'Comedy'
  if (/docu|discovery|national geo|history|science|nature/.test(n)) return 'Documentary'
  if (/local|abc|nbc|cbs|fox|pbs|wfla|wink|wbbm|wkrn|wsoc/.test(n)) return 'Local'
  if (/uk|bbc|itv|channel 4|sky/.test(n)) return 'International'
  if (/es|español|univision|telemundo|latina/.test(n)) return 'Spanish'
  return 'General'
}

export function rawToChannel(raw: RawChannel, index: number): Channel {
  return {
    id: `ch-${index}-${raw.name.replace(/\s+/g, '-').toLowerCase()}`,
    name: raw.name,
    logo: raw.logo,
    streamUrl: raw.streamUrl,
    group: raw.groupTitle || 'General',
    country: raw.tvgCountry,
    language: raw.tvgLanguage,
    isHD: raw.isHD,
    isLive: true,
    epgId: raw.tvgId,
  }
}

// ============================================================================
// FREE PUBLIC CHANNEL SOURCES
// These are 100% legal, publicly available streams
// ============================================================================

export const FREE_CHANNEL_SOURCES = [
  {
    name: 'Pluto TV (Free)',
    url: 'https://i.mjh.nz/PlutoTV/us.m3u8',
    description: '300+ free ad-supported channels',
    legal: true,
    requiresNotice: false,
  },
  {
    name: 'Plex Live TV (Free)',
    url: 'https://i.mjh.nz/Plex/us.m3u8',
    description: '200+ free Plex channels',
    legal: true,
    requiresNotice: false,
  },
  {
    name: 'Samsung TV Plus (Free)',
    url: 'https://i.mjh.nz/SamsungTVPlus/us.m3u8',
    description: '180+ free Samsung channels',
    legal: true,
    requiresNotice: false,
  },
  {
    name: 'Tubi (Free)',
    url: 'https://i.mjh.nz/Tubi/us.m3u8',
    description: '40+ free Tubi live channels',
    legal: true,
    requiresNotice: false,
  },
  {
    name: 'Stirr (Free)',
    url: 'https://i.mjh.nz/Stirr/all.m3u8',
    description: '70+ free Stirr channels including local news',
    legal: true,
    requiresNotice: false,
  },
]

// ============================================================================
// LEGAL NOTICE — shown once when user connects non-verified sources
// ============================================================================

export const IPTV_LEGAL_NOTICE = `
Javari Omni-Media connects to media sources you provide.

When connecting your own IPTV subscription or M3U playlist, please ensure 
you have the appropriate rights or licenses to access the content provided 
by that service. Content licensing laws vary by country and region.

Javari Omni-Media does not provide, host, or endorse any specific IPTV 
service or content. We are a connection layer only — the same way a web 
browser connects to websites without endorsing their content.

By continuing, you confirm you understand this and will use this feature 
in accordance with the laws of your region.
`.trim()

// ============================================================================
// CHANNEL FETCHER
// ============================================================================

export async function fetchChannelsFromUrl(url: string): Promise<Channel[]> {
  try {
    const response = await fetch(`/api/iptv/fetch?url=${encodeURIComponent(url)}`)
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
    const text = await response.text()
    const raw = parseM3U(text)
    return raw.map((r, i) => rawToChannel(r, i))
  } catch (err) {
    console.error('[IPTV] Failed to fetch channels:', err)
    throw err
  }
}

export async function loadFreeChannels(): Promise<Channel[]> {
  const allChannels: Channel[] = []
  let offset = 0

  for (const source of FREE_CHANNEL_SOURCES) {
    try {
      const response = await fetch(
        `/api/iptv/fetch?url=${encodeURIComponent(source.url)}`
      )
      if (!response.ok) continue
      const text = await response.text()
      const raw = parseM3U(text)
      const channels = raw.map((r, i) => ({
        ...rawToChannel(r, i + offset),
        group: `${source.name} — ${rawToChannel(r, i + offset).group}`,
      }))
      allChannels.push(...channels)
      offset += raw.length
    } catch {
      // Source unavailable, continue
    }
  }

  return allChannels
}

// ============================================================================
// SPORT GROUPS — helps users find sports fast
// ============================================================================

export const SPORTS_KEYWORDS = [
  'NFL', 'NBA', 'MLB', 'NHL', 'MLS', 'UEFA', 'FIFA',
  'ESPN', 'Fox Sports', 'CBS Sports', 'NBC Sports',
  'Sky Sports', 'beIN Sports', 'DAZN', 'TNT Sports',
  'Golf Channel', 'Tennis', 'Formula 1', 'F1',
  'UFC', 'WWE', 'Boxing', 'Olympics',
]

export function isSportsChannel(channel: Channel): boolean {
  const text = `${channel.name} ${channel.group}`.toLowerCase()
  return SPORTS_KEYWORDS.some((k) => text.includes(k.toLowerCase()))
}

// ============================================================================
// LOCAL CHANNEL DETECTION
// Identifies local broadcast channels by US market
// ============================================================================

export const US_MARKETS: Record<string, string[]> = {
  'Fort Myers, FL': ['WINK', 'WFTX', 'WBBH', 'WGCU', 'WZVN', 'WXCW'],
  'Cincinnati, OH': ['WKRC', 'WCPO', 'WLWT', 'WXIX', 'WPTO', 'WSTR'],
  'Miami, FL': ['WSVN', 'WPLG', 'WTVJ', 'WFOR', 'WPBT', 'WSFL'],
  'New York, NY': ['WABC', 'WCBS', 'WNBC', 'WNYW', 'WPIX', 'WNET'],
  'Los Angeles, CA': ['KABC', 'KCBS', 'KNBC', 'KTTV', 'KCAL', 'KCET'],
  'Chicago, IL': ['WLS', 'WBBM', 'WMAQ', 'WFLD', 'WGN', 'WTTW'],
  'Houston, TX': ['KTRK', 'KHOU', 'KPRC', 'KRIV', 'KIAH', 'KUHT'],
  'Phoenix, AZ': ['KNXV', 'KPHO', 'KPNX', 'KSAZ', 'KTVK', 'KAET'],
  'Philadelphia, PA': ['WPVI', 'KYW', 'WCAU', 'WTXF', 'WPHL', 'WHYY'],
  'Dallas, TX': ['WFAA', 'KTVT', 'KXAS', 'KDFW', 'KERA', 'KTXA'],
}

export function getLocalChannels(channels: Channel[], market: string): Channel[] {
  const callLetters = US_MARKETS[market] || []
  if (!callLetters.length) return []
  return channels.filter((ch) =>
    callLetters.some((call) => ch.name.toUpperCase().includes(call))
  )
}
