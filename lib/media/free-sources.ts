// lib/media/free-sources.ts
// Javari Omni-Media — Free & Legal Content Source Index
// This app does NOT host or distribute any copyrighted media.
// These are public-facing streaming services and public domain libraries.
// Users are responsible for the legality of any sources they add.
// Date: March 13, 2026 | Henderson Standard

export type SourceType = 'FAST' | 'public_domain' | 'educational' | 'user_added'

export interface FreeSource {
  id: string
  name: string
  type: SourceType
  website: string
  logo: string
  description: string
  content_types: ('movies' | 'tv' | 'news' | 'sports' | 'docs' | 'kids' | 'music')[]
  region: string[]
  api_supported: boolean
  requires_account: boolean
  requires_library_card?: boolean
  download_allowed?: boolean
  api_base?: string
  search_url?: string
  featured?: boolean
}

// ─── FAST SERVICES (Free Ad-Supported Streaming TV) ────────────────────────

export const FAST_SERVICES: FreeSource[] = [
  {
    id: 'pluto',
    name: 'Pluto TV',
    type: 'FAST',
    website: 'https://pluto.tv',
    logo: '📺',
    description: '250+ live channels and thousands of movies and shows — completely free.',
    content_types: ['movies', 'tv', 'news', 'sports', 'docs', 'kids'],
    region: ['US', 'CA', 'UK', 'DE', 'ES', 'FR', 'AU'],
    api_supported: true,
    requires_account: false,
    api_base: 'https://api.pluto.tv/v2',
    featured: true,
  },
  {
    id: 'tubi',
    name: 'Tubi',
    type: 'FAST',
    website: 'https://tubitv.com',
    logo: '🎬',
    description: '50,000+ movies and TV shows, 200+ live news and sports channels — free.',
    content_types: ['movies', 'tv', 'news', 'sports', 'kids'],
    region: ['US', 'CA', 'AU', 'MX'],
    api_supported: false,
    requires_account: false,
    featured: true,
  },
  {
    id: 'freevee',
    name: 'Amazon Freevee',
    type: 'FAST',
    website: 'https://www.amazon.com/adlp/freevee',
    logo: '🟡',
    description: 'Amazon\'s free streaming tier — movies, TV originals, and live channels.',
    content_types: ['movies', 'tv', 'news'],
    region: ['US', 'UK', 'DE'],
    api_supported: false,
    requires_account: true,
    featured: true,
  },
  {
    id: 'roku-channel',
    name: 'The Roku Channel',
    type: 'FAST',
    website: 'https://therokuchannel.roku.com',
    logo: '📡',
    description: 'Free streaming with live TV, on-demand movies, and Roku Originals.',
    content_types: ['movies', 'tv', 'news', 'kids'],
    region: ['US', 'CA', 'UK'],
    api_supported: false,
    requires_account: false,
  },
  {
    id: 'plex-free',
    name: 'Plex Free Movies & TV',
    type: 'FAST',
    website: 'https://www.plex.tv/watch-free',
    logo: '🟠',
    description: 'Free movies, TV shows, and 300+ live channels — no subscription needed.',
    content_types: ['movies', 'tv', 'news', 'docs'],
    region: ['US', 'CA', 'UK', 'AU', 'NZ'],
    api_supported: true,
    requires_account: false,
    api_base: 'https://api.plex.tv',
    featured: true,
  },
  {
    id: 'xumo',
    name: 'Xumo Play',
    type: 'FAST',
    website: 'https://xumo.tv',
    logo: '🔵',
    description: '190+ free live channels across news, sports, movies, and entertainment.',
    content_types: ['movies', 'tv', 'news', 'sports'],
    region: ['US'],
    api_supported: false,
    requires_account: false,
  },
  {
    id: 'sling-free',
    name: 'Sling Freestream',
    type: 'FAST',
    website: 'https://watch.sling.com/1/free',
    logo: '🎯',
    description: '400+ free channels and 45,000+ on-demand titles — no subscription.',
    content_types: ['movies', 'tv', 'news', 'sports', 'kids'],
    region: ['US'],
    api_supported: false,
    requires_account: false,
  },
  {
    id: 'crackle',
    name: 'Crackle',
    type: 'FAST',
    website: 'https://www.crackle.com',
    logo: '⚡',
    description: 'Free movies and originals — Sony-backed streaming platform.',
    content_types: ['movies', 'tv'],
    region: ['US'],
    api_supported: false,
    requires_account: false,
  },
  {
    id: 'redbox',
    name: 'Redbox Free Live TV',
    type: 'FAST',
    website: 'https://www.redbox.com',
    logo: '🔴',
    description: 'Free live TV channels and on-demand movies — no subscription.',
    content_types: ['movies', 'tv', 'news'],
    region: ['US'],
    api_supported: false,
    requires_account: false,
  },
  {
    id: 'filmrise',
    name: 'FilmRise',
    type: 'FAST',
    website: 'https://filmrise.com',
    logo: '🎞️',
    description: 'Free classics, documentaries, true crime, and international content.',
    content_types: ['movies', 'tv', 'docs'],
    region: ['US', 'CA', 'UK'],
    api_supported: false,
    requires_account: false,
  },
  {
    id: 'vudu-free',
    name: 'Vudu Free',
    type: 'FAST',
    website: 'https://www.vudu.com/content/movies/uxpage/Free-Movies-On-Vudu/1',
    logo: '💜',
    description: 'Thousands of free movies and TV episodes with ads — no subscription.',
    content_types: ['movies', 'tv'],
    region: ['US'],
    api_supported: false,
    requires_account: false,
  },
  {
    id: 'samsung-plus',
    name: 'Samsung TV Plus',
    type: 'FAST',
    website: 'https://www.samsung.com/us/televisions-home-theater/tvs/tv-plus/',
    logo: '📱',
    description: '250+ free live TV channels — built into Samsung TVs and available on web.',
    content_types: ['movies', 'tv', 'news', 'sports', 'music'],
    region: ['US', 'CA', 'UK', 'DE', 'FR'],
    api_supported: false,
    requires_account: false,
  },
  {
    id: 'kanopy',
    name: 'Kanopy',
    type: 'educational',
    website: 'https://www.kanopy.com',
    logo: '🎓',
    description: 'Free films through your library — art house cinema, documentaries, classics.',
    content_types: ['movies', 'docs'],
    region: ['US', 'CA', 'AU', 'UK', 'NZ'],
    api_supported: false,
    requires_account: true,
    requires_library_card: true,
  },
  {
    id: 'hoopla',
    name: 'Hoopla',
    type: 'educational',
    website: 'https://www.hoopladigital.com',
    logo: '📚',
    description: 'Library-powered streaming — movies, TV, music, audiobooks, and comics.',
    content_types: ['movies', 'tv', 'music', 'docs'],
    region: ['US', 'CA', 'AU'],
    api_supported: true,
    requires_account: true,
    requires_library_card: true,
  },
]

// ─── PUBLIC DOMAIN SOURCES ─────────────────────────────────────────────────

export const PUBLIC_DOMAIN_SOURCES: FreeSource[] = [
  {
    id: 'internet-archive',
    name: 'Internet Archive',
    type: 'public_domain',
    website: 'https://archive.org',
    logo: '🏛️',
    description: 'Millions of free movies, music, books, and historical recordings — all public domain or open license.',
    content_types: ['movies', 'tv', 'music', 'docs'],
    region: ['GLOBAL'],
    api_supported: true,
    requires_account: false,
    download_allowed: true,
    api_base: 'https://archive.org/advancedsearch.php',
    search_url: 'https://archive.org/search?query=',
    featured: true,
  },
  {
    id: 'prelinger',
    name: 'Prelinger Archive',
    type: 'public_domain',
    website: 'https://archive.org/details/prelinger',
    logo: '📽️',
    description: '6,000+ ephemeral films — industrial, educational, promotional, and amateur. All public domain.',
    content_types: ['movies', 'docs'],
    region: ['GLOBAL'],
    api_supported: true,
    requires_account: false,
    download_allowed: true,
    api_base: 'https://archive.org/advancedsearch.php',
    featured: true,
  },
  {
    id: 'nasa-media',
    name: 'NASA Media Library',
    type: 'public_domain',
    website: 'https://images.nasa.gov',
    logo: '🚀',
    description: 'NASA images, videos, and audio files — all in the public domain.',
    content_types: ['movies', 'docs'],
    region: ['GLOBAL'],
    api_supported: true,
    requires_account: false,
    download_allowed: true,
    api_base: 'https://images-api.nasa.gov',
  },
  {
    id: 'loc-video',
    name: 'Library of Congress',
    type: 'public_domain',
    website: 'https://www.loc.gov/film-and-videos/',
    logo: '🦅',
    description: 'Historical films, newsreels, and recordings from the Library of Congress collection.',
    content_types: ['movies', 'docs'],
    region: ['GLOBAL'],
    api_supported: true,
    requires_account: false,
    download_allowed: true,
    api_base: 'https://www.loc.gov/film-and-videos/?fo=json',
  },
  {
    id: 'open-culture',
    name: 'Open Culture Film Collection',
    type: 'public_domain',
    website: 'https://www.openculture.com/freemoviesonline',
    logo: '🎭',
    description: '1,150+ free classic films — Chaplin, Kubrick, Bergman, noir, silent era, and more.',
    content_types: ['movies'],
    region: ['GLOBAL'],
    api_supported: false,
    requires_account: false,
    download_allowed: true,
  },
  {
    id: 'european-archive',
    name: 'European Archive',
    type: 'public_domain',
    website: 'https://www.europeanarchive.eu',
    logo: '🇪🇺',
    description: 'European historical footage, newsreels, and cultural films — public domain.',
    content_types: ['movies', 'docs'],
    region: ['EU', 'GLOBAL'],
    api_supported: false,
    requires_account: false,
    download_allowed: true,
  },
]

// ─── EDUCATIONAL SOURCES ───────────────────────────────────────────────────

export const EDUCATIONAL_SOURCES: FreeSource[] = [
  {
    id: 'pbs',
    name: 'PBS',
    type: 'educational',
    website: 'https://www.pbs.org/video/',
    logo: '🔵',
    description: 'Free streaming of PBS shows — Frontline, Nova, Masterpiece, and more.',
    content_types: ['docs', 'tv', 'kids'],
    region: ['US'],
    api_supported: false,
    requires_account: false,
  },
  {
    id: 'natgeo-free',
    name: 'National Geographic Free',
    type: 'educational',
    website: 'https://www.nationalgeographic.com/tv/shows',
    logo: '🌍',
    description: 'Free clips and full episodes from National Geographic.',
    content_types: ['docs'],
    region: ['US', 'GLOBAL'],
    api_supported: false,
    requires_account: false,
  },
]

// ─── ALL SOURCES COMBINED ──────────────────────────────────────────────────

export const ALL_FREE_SOURCES: FreeSource[] = [
  ...FAST_SERVICES,
  ...PUBLIC_DOMAIN_SOURCES,
  ...EDUCATIONAL_SOURCES,
]

export const FEATURED_SOURCES = ALL_FREE_SOURCES.filter(s => s.featured)

export function getSourcesByType(type: SourceType): FreeSource[] {
  return ALL_FREE_SOURCES.filter(s => s.type === type)
}

export function getSourceById(id: string): FreeSource | undefined {
  return ALL_FREE_SOURCES.find(s => s.id === id)
}

export function getSourcesForRegion(region: string): FreeSource[] {
  return ALL_FREE_SOURCES.filter(s => s.region.includes(region) || s.region.includes('GLOBAL'))
}
