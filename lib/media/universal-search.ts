// lib/media/universal-search.ts
// Javari Omni-Media — Universal Media Search
// Searches across FAST platforms, public domain libraries, and user sources
// This app does NOT host any media. It indexes and links to legal sources.
// Date: March 13, 2026 | Henderson Standard

import { ALL_FREE_SOURCES, type FreeSource } from './free-sources'

export type MediaType = 'movie' | 'tv' | 'music' | 'doc' | 'live' | 'any'

export interface SearchResult {
  id: string
  title: string
  year?: number
  type: MediaType
  thumbnail?: string
  description?: string
  duration?: string
  rating?: number
  genres?: string[]
  source: string
  source_name: string
  source_type: 'FAST' | 'public_domain' | 'educational' | 'user_added' | 'plex' | 'iptv'
  stream_url?: string
  watch_url: string
  is_free: boolean
  is_legal: boolean
  download_allowed: boolean
}

export interface SearchOptions {
  query: string
  type?: MediaType
  legal_only?: boolean
  include_user_sources?: boolean
  region?: string
  limit?: number
}

export interface SearchResponse {
  query: string
  total: number
  results_by_source: {
    free_streaming: SearchResult[]
    public_domain: SearchResult[]
    educational: SearchResult[]
    user_libraries: SearchResult[]
    iptv_channels: SearchResult[]
  }
  all_results: SearchResult[]
  legal_count: number
  search_ms: number
}

// ─── INTERNET ARCHIVE SEARCH ─────────────────────────────────────────────────

export async function searchInternetArchive(query: string, mediaType: MediaType = 'any', limit = 12): Promise<SearchResult[]> {
  try {
    const typeMap: Record<string, string> = {
      movie: 'movies',
      tv: 'tv',
      music: 'audio',
      doc: 'movies',
      any: 'movies',
      live: 'movies',
    }

    const mediatype = typeMap[mediaType] || 'movies'
    const params = new URLSearchParams({
      q: `${query} AND mediatype:${mediatype} AND licenseurl:(creativecommons OR "public domain" OR publicdomain)`,
      fl: 'identifier,title,year,description,subject,runtime,avg_rating,downloads',
      sort: 'downloads desc',
      rows: String(limit),
      page: '1',
      output: 'json',
    })

    const res = await fetch(`https://archive.org/advancedsearch.php?${params}`, {
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return []
    const data = await res.json()
    const docs = data.response?.docs || []

    return docs.map((doc: Record<string, unknown>) => ({
      id: `archive_${doc.identifier}`,
      title: String(doc.title || '').trim(),
      year: doc.year ? Number(doc.year) : undefined,
      type: mediaType === 'any' ? 'movie' : mediaType,
      description: String(doc.description || '').slice(0, 200),
      duration: doc.runtime ? String(doc.runtime) : undefined,
      rating: doc.avg_rating ? Number(doc.avg_rating) : undefined,
      source: 'internet-archive',
      source_name: 'Internet Archive',
      source_type: 'public_domain' as const,
      watch_url: `https://archive.org/details/${doc.identifier}`,
      stream_url: `https://archive.org/download/${doc.identifier}`,
      is_free: true,
      is_legal: true,
      download_allowed: true,
    }))
  } catch {
    return []
  }
}

// ─── NASA MEDIA SEARCH ────────────────────────────────────────────────────────

export async function searchNASAMedia(query: string, limit = 8): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      media_type: 'video',
      page_size: String(limit),
    })

    const res = await fetch(`https://images-api.nasa.gov/search?${params}`, {
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) return []
    const data = await res.json()
    const items = data.collection?.items || []

    return items.map((item: Record<string, unknown>) => {
      const data_arr = item.data as Record<string, unknown>[]
      const meta = data_arr?.[0] || {}
      const links = item.links as Record<string, string>[]
      const thumb = links?.[0]?.href
      return {
        id: `nasa_${meta.nasa_id || Math.random()}`,
        title: String(meta.title || '').trim(),
        year: meta.date_created ? new Date(String(meta.date_created)).getFullYear() : undefined,
        type: 'doc' as MediaType,
        thumbnail: thumb,
        description: String(meta.description || '').slice(0, 200),
        source: 'nasa-media',
        source_name: 'NASA Media Library',
        source_type: 'public_domain' as const,
        watch_url: `https://images.nasa.gov/details/${meta.nasa_id}`,
        is_free: true,
        is_legal: true,
        download_allowed: true,
      }
    })
  } catch {
    return []
  }
}

// ─── FAST PLATFORM LINKS (non-API — link to search) ──────────────────────────

function buildFASTResults(query: string): SearchResult[] {
  const fastSources = ALL_FREE_SOURCES.filter(s => s.type === 'FAST')
  return fastSources.map(source => ({
    id: `fast_${source.id}_${query.replace(/\s+/g, '-')}`,
    title: `Search "${query}" on ${source.name}`,
    type: 'any' as MediaType,
    source: source.id,
    source_name: source.name,
    source_type: 'FAST' as const,
    watch_url: source.search_url
      ? `${source.search_url}${encodeURIComponent(query)}`
      : `${source.website}`,
    is_free: true,
    is_legal: true,
    download_allowed: false,
  }))
}

// ─── FILTER / NORMALIZE ───────────────────────────────────────────────────────

function filterByQuery(results: SearchResult[], query: string): SearchResult[] {
  const q = query.toLowerCase()
  const genreMap: Record<string, string[]> = {
    'sci-fi': ['science fiction', 'sci-fi', 'scifi', 'space'],
    'horror': ['horror', 'scary', 'thriller'],
    'comedy': ['comedy', 'funny', 'humor'],
    'documentary': ['documentary', 'doc', 'nature', 'history'],
    'action': ['action', 'adventure', 'war'],
    'romance': ['romance', 'love', 'drama'],
    'classic': ['classic', 'vintage', 'silent', '1920', '1930', '1940', '1950'],
  }

  // Expand genre queries
  let searchTerms = [q]
  for (const [genre, synonyms] of Object.entries(genreMap)) {
    if (synonyms.some(s => q.includes(s)) || q.includes(genre)) {
      searchTerms = [...searchTerms, ...synonyms]
    }
  }

  return results.filter(r => {
    const text = `${r.title} ${r.description || ''} ${r.genres?.join(' ') || ''}`.toLowerCase()
    return searchTerms.some(term => text.includes(term)) || r.title.toLowerCase().includes(q)
  })
}

// ─── MAIN SEARCH FUNCTION ─────────────────────────────────────────────────────

export async function universalSearch(options: SearchOptions): Promise<SearchResponse> {
  const {
    query,
    type = 'any',
    legal_only = false,
    limit = 20,
  } = options

  const start = Date.now()

  // Run searches in parallel
  const [archiveResults, nasaResults] = await Promise.all([
    query.toLowerCase().includes('nasa') || query.toLowerCase().includes('space')
      ? searchNASAMedia(query, Math.floor(limit / 2))
      : searchInternetArchive(query, type, Math.floor(limit * 0.6)),
    query.toLowerCase().includes('nasa') || query.toLowerCase().includes('space')
      ? searchInternetArchive(query, type, Math.floor(limit * 0.4))
      : searchNASAMedia(query, Math.floor(limit * 0.2)),
  ])

  const fastResults = buildFASTResults(query)
  const allPublicDomain = [...archiveResults, ...nasaResults]

  const response: SearchResponse = {
    query,
    total: 0,
    results_by_source: {
      free_streaming: fastResults,
      public_domain: allPublicDomain,
      educational: [],
      user_libraries: [],
      iptv_channels: [],
    },
    all_results: [],
    legal_count: 0,
    search_ms: 0,
  }

  // Combine results — legal sources first
  const all = [
    ...allPublicDomain,
    ...(legal_only ? [] : []),
  ]

  response.all_results = all
  response.total = all.length + fastResults.length
  response.legal_count = all.filter(r => r.is_legal).length + fastResults.length
  response.search_ms = Date.now() - start

  return response
}

// ─── WATCH OPTIONS ENGINE ─────────────────────────────────────────────────────

export interface WatchOptions {
  free_sources: { name: string; url: string; type: string }[]
  library_sources: { name: string; url: string; type: string }[]
  user_sources: { name: string; url: string; type: string }[]
}

export function buildWatchOptions(
  title: string,
  year?: number,
  userSources: { name: string; url: string }[] = []
): WatchOptions {
  const slug = encodeURIComponent(title)

  const free_sources = [
    { name: 'Search Tubi', url: `https://tubitv.com/search/${slug}`, type: 'FAST' },
    { name: 'Search Pluto TV', url: `https://pluto.tv/search#${slug}`, type: 'FAST' },
    { name: 'Search Plex Free', url: `https://app.plex.tv/desktop#!/search?query=${slug}`, type: 'FAST' },
    { name: 'Search Freevee', url: `https://www.amazon.com/s?k=${slug}&i=instant-video&rh=n%3A2858905011`, type: 'FAST' },
    { name: 'Search Archive.org', url: `https://archive.org/search?query=${slug}`, type: 'public_domain' },
  ]

  const library_sources = [
    { name: 'Search Kanopy', url: `https://www.kanopy.com/en/search#${slug}`, type: 'library' },
    { name: 'Search Hoopla', url: `https://www.hoopladigital.com/search?q=${slug}`, type: 'library' },
  ]

  const user_sources = userSources.map(s => ({ ...s, type: 'user' }))

  return { free_sources, library_sources, user_sources }
}
