// app/api/scan/route.ts
// Javari Omni-Media — Automated Folder Scanner + Metadata Fetcher
// Drop a folder path → Javari scans files → fetches TMDB/MusicBrainz metadata → returns full library
// Date: March 13, 2026 | Henderson Standard

import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const VIDEO_EXTS = new Set(['.mkv','.mp4','.avi','.mov','.wmv','.m4v','.ts','.m2ts','.webm','.flv','.mpg','.mpeg'])
const AUDIO_EXTS = new Set(['.mp3','.flac','.aac','.ogg','.wav','.m4a','.opus','.wma','.alac'])
const IMAGE_EXTS = new Set(['.jpg','.jpeg','.png','.webp','.heic','.heif','.gif','.bmp','.tiff'])
const SUBTITLE_EXTS = new Set(['.srt','.ass','.ssa','.vtt','.sub'])

// Parse filename to extract title + year (handles most naming conventions)
function parseFilename(filename: string): { title: string; year?: number; season?: number; episode?: number; episodeTitle?: string } {
  const name = path.basename(filename, path.extname(filename))

  // TV: Show.Name.S01E02 or Show Name - 1x02 or Show Name S1E2
  const tvMatch = name.match(/^(.+?)[\s._-]+[Ss](\d{1,2})[Ee](\d{1,2})/i)
    || name.match(/^(.+?)[\s._-]+(\d{1,2})x(\d{1,2})/i)
  if (tvMatch) {
    return {
      title: tvMatch[1].replace(/[._]/g, ' ').trim(),
      season: parseInt(tvMatch[2]),
      episode: parseInt(tvMatch[3]),
    }
  }

  // Movie: Title (2024) or Title.2024 or Title.2024.mkv
  const yearMatch = name.match(/^(.+?)[\s._-]+\(?(\d{4})\)?/)
  if (yearMatch) {
    const year = parseInt(yearMatch[2])
    if (year >= 1888 && year <= new Date().getFullYear() + 2) {
      return {
        title: yearMatch[1].replace(/[._]/g, ' ').trim(),
        year,
      }
    }
  }

  return { title: name.replace(/[._]/g, ' ').trim() }
}

// Build TMDB search URL
function tmdbSearchUrl(title: string, type: 'movie' | 'tv', year?: number): string {
  const key = process.env.TMDB_API_KEY || ''
  const q = encodeURIComponent(title)
  const base = `https://api.themoviedb.org/3/search/${type}?api_key=${key}&query=${q}&language=en-US`
  return year ? `${base}&year=${year}` : base
}

async function fetchTMDBMetadata(title: string, type: 'movie' | 'tv', year?: number) {
  const key = process.env.TMDB_API_KEY
  if (!key) return null

  try {
    const res = await fetch(tmdbSearchUrl(title, type, year), { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = await res.json()
    const result = data.results?.[0]
    if (!result) return null

    // Fetch full details
    const detailUrl = `https://api.themoviedb.org/3/${type}/${result.id}?api_key=${key}&language=en-US&append_to_response=credits,videos`
    const detailRes = await fetch(detailUrl, { signal: AbortSignal.timeout(5000) })
    if (!detailRes.ok) return result
    return await detailRes.json()
  } catch {
    return null
  }
}

export interface ScannedItem {
  id: string
  filename: string
  filepath: string
  ext: string
  sizeBytes: number
  type: 'movie' | 'tv' | 'music' | 'photo' | 'other'
  parsed: ReturnType<typeof parseFilename>
  metadata?: {
    tmdbId?: number
    title?: string
    originalTitle?: string
    overview?: string
    releaseDate?: string
    posterPath?: string
    backdropPath?: string
    rating?: number
    genres?: string[]
    runtime?: number
    cast?: { name: string; character: string }[]
    director?: string
    trailer?: string
    tagline?: string
    seasons?: number
    episodes?: number
  }
  error?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { folderPath, libraryType, fetchMetadata = true, maxItems = 500 } = body as {
      folderPath: string
      libraryType: 'movies' | 'tv' | 'music' | 'photos' | 'podcasts'
      fetchMetadata?: boolean
      maxItems?: number
    }

    if (!folderPath) {
      return NextResponse.json({ error: 'Missing folderPath' }, { status: 400 })
    }

    // Import fs dynamically (server-side only)
    const fs = await import('fs/promises')
    const fspath = await import('path')

    let entries: string[] = []
    try {
      const dir = await fs.readdir(folderPath, { recursive: true })
      entries = (dir as string[]).slice(0, maxItems)
    } catch (fsErr: unknown) {
      const msg = fsErr instanceof Error ? fsErr.message : 'Cannot read folder'
      return NextResponse.json({
        error: `Cannot access folder: ${msg}. Check the path is correct and accessible.`,
        suggestion: 'For a Synology NAS, try /volume1/media/Movies or mount the share first.',
      }, { status: 200 })
    }

    const items: ScannedItem[] = []
    const extMap: Record<string, string[]> = { movies: [...VIDEO_EXTS], tv: [...VIDEO_EXTS], music: [...AUDIO_EXTS], photos: [...IMAGE_EXTS], podcasts: [...AUDIO_EXTS] }
    const validExts = new Set(extMap[libraryType] || [...VIDEO_EXTS])

    for (const entry of entries) {
      const ext = fspath.extname(entry).toLowerCase()
      if (!validExts.has(ext)) continue
      if (SUBTITLE_EXTS.has(ext)) continue

      const fullPath = fspath.join(folderPath, entry)
      let sizeBytes = 0
      try {
        const stat = await fs.stat(fullPath)
        if (stat.isDirectory()) continue
        sizeBytes = stat.size
      } catch { continue }

      const parsed = parseFilename(fspath.basename(entry))
      const type = libraryType === 'tv' ? 'tv' : libraryType === 'movies' ? 'movie' : libraryType === 'music' ? 'music' : libraryType === 'photos' ? 'photo' : 'other'

      const item: ScannedItem = {
        id: Buffer.from(fullPath).toString('base64').slice(0, 16),
        filename: fspath.basename(entry),
        filepath: fullPath,
        ext,
        sizeBytes,
        type,
        parsed,
      }

      // Fetch metadata from TMDB if enabled and it's video content
      if (fetchMetadata && (type === 'movie' || type === 'tv') && parsed.title) {
        try {
          const tmdbType = type === 'tv' ? 'tv' : 'movie'
          const meta = await fetchTMDBMetadata(parsed.title, tmdbType, parsed.year)
          if (meta) {
            item.metadata = {
              tmdbId: meta.id,
              title: meta.title || meta.name,
              originalTitle: meta.original_title || meta.original_name,
              overview: meta.overview,
              releaseDate: meta.release_date || meta.first_air_date,
              posterPath: meta.poster_path ? `https://image.tmdb.org/t/p/w500${meta.poster_path}` : undefined,
              backdropPath: meta.backdrop_path ? `https://image.tmdb.org/t/p/w1280${meta.backdrop_path}` : undefined,
              rating: meta.vote_average,
              genres: meta.genres?.map((g: { name: string }) => g.name),
              runtime: meta.runtime,
              cast: meta.credits?.cast?.slice(0, 5).map((c: { name: string; character: string }) => ({ name: c.name, character: c.character })),
              director: meta.credits?.crew?.find((c: { job: string; name: string }) => c.job === 'Director')?.name,
              trailer: meta.videos?.results?.find((v: { type: string; site: string; key: string }) => v.type === 'Trailer' && v.site === 'YouTube')?.key
                ? `https://www.youtube.com/watch?v=${meta.videos.results.find((v: { type: string; site: string; key: string }) => v.type === 'Trailer').key}`
                : undefined,
              tagline: meta.tagline,
              seasons: meta.number_of_seasons,
              episodes: meta.number_of_episodes,
            }
          }
        } catch { /* metadata fetch failed, item still added without metadata */ }
      }

      items.push(item)
    }

    return NextResponse.json({
      success: true,
      folderPath,
      libraryType,
      totalFiles: entries.length,
      importedItems: items.length,
      items,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Scan failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
