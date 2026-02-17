import { parseFile } from 'music-metadata'
import { fileTypeFromBuffer } from 'file-type'

export interface VideoMetadata {
  duration?: number
  width?: number
  height?: number
  codec?: string
  bitrate?: number
  fps?: number
}

export interface AudioMetadata {
  duration?: number
  bitrate?: number
  sampleRate?: number
  artist?: string
  album?: string
  title?: string
  year?: number
  genre?: string
}

export interface ImageMetadata {
  width?: number
  height?: number
  format?: string
  dateTaken?: string
}

/**
 * Extract metadata from audio files using music-metadata
 */
export async function extractAudioMetadata(buffer: Buffer): Promise<AudioMetadata> {
  try {
    const metadata = await parseFile(buffer as any)
    
    return {
      duration: metadata.format.duration,
      bitrate: metadata.format.bitrate,
      sampleRate: metadata.format.sampleRate,
      artist: metadata.common.artist,
      album: metadata.common.album,
      title: metadata.common.title,
      year: metadata.common.year,
      genre: metadata.common.genre?.[0]
    }
  } catch (error) {
    console.error('Error extracting audio metadata:', error)
    return {}
  }
}

/**
 * Detect file type from buffer
 */
export async function detectFileType(buffer: Buffer): Promise<string | undefined> {
  try {
    const fileType = await fileTypeFromBuffer(buffer)
    return fileType?.mime
  } catch (error) {
    console.error('Error detecting file type:', error)
    return undefined
  }
}

/**
 * Extract basic file information
 */
export function extractBasicFileInfo(filename: string, size: number) {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  
  // Determine media type from extension
  let mediaType: 'movie' | 'tv_episode' | 'music' | 'photo' | 'comic' | 'magazine' | 'ebook' | 'document' = 'document'
  
  if (['mp4', 'mkv', 'avi', 'mov', 'wmv', 'm4v', 'webm'].includes(ext)) {
    // Check if it's a TV show
    if (filename.match(/s\d{1,2}e\d{1,2}/i) || filename.match(/\d{1,2}x\d{1,2}/i)) {
      mediaType = 'tv_episode'
    } else {
      mediaType = 'movie'
    }
  } else if (['mp3', 'flac', 'wav', 'm4a', 'aac', 'ogg', 'wma'].includes(ext)) {
    mediaType = 'music'
  } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'raw', 'cr2', 'nef'].includes(ext)) {
    mediaType = 'photo'
  } else if (['cbz', 'cbr', 'cb7'].includes(ext)) {
    mediaType = 'comic'
  } else if (['epub', 'mobi', 'azw3'].includes(ext)) {
    mediaType = 'ebook'
  } else if (ext === 'pdf') {
    if (filename.toLowerCase().includes('magazine') || filename.toLowerCase().includes('issue')) {
      mediaType = 'magazine'
    } else {
      mediaType = 'ebook'
    }
  }
  
  return {
    extension: ext,
    mediaType,
    size
  }
}

/**
 * Extract metadata from filename using regex patterns
 */
export function extractMetadataFromFilename(filename: string) {
  const metadata: Record<string, any> = {}
  
  // Extract year (1900-2099)
  const yearMatch = filename.match(/\b(19\d{2}|20\d{2})\b/)
  if (yearMatch) {
    metadata.year = parseInt(yearMatch[1])
  }
  
  // Extract TV show info (S01E05 or 1x05)
  const seMatch = filename.match(/s(\d{1,2})e(\d{1,2})/i)
  const xMatch = filename.match(/(\d{1,2})x(\d{1,2})/i)
  
  if (seMatch) {
    metadata.season = parseInt(seMatch[1])
    metadata.episode = parseInt(seMatch[2])
    // Extract show title (everything before SxxExx)
    const titleMatch = filename.split(/s\d{1,2}e\d{1,2}/i)[0]
    metadata.title = cleanTitle(titleMatch)
  } else if (xMatch) {
    metadata.season = parseInt(xMatch[1])
    metadata.episode = parseInt(xMatch[2])
    const titleMatch = filename.split(/\d{1,2}x\d{1,2}/i)[0]
    metadata.title = cleanTitle(titleMatch)
  } else {
    // Extract movie title (remove year and extension, clean up)
    let title = filename
      .replace(/\.(mp4|mkv|avi|mov|wmv|m4v|webm|mp3|flac|wav|m4a)$/i, '')
      .replace(/\b(19\d{2}|20\d{2})\b.*$/, '')
    metadata.title = cleanTitle(title)
  }
  
  // Extract resolution
  const resMatch = filename.match(/\b(720p|1080p|2160p|4k)\b/i)
  if (resMatch) {
    metadata.resolution = resMatch[1].toLowerCase()
  }
  
  // Extract quality indicators
  const qualityMatch = filename.match(/\b(bluray|brrip|webrip|web-dl|hdtv|dvdrip)\b/i)
  if (qualityMatch) {
    metadata.source = qualityMatch[1].toLowerCase()
  }
  
  return metadata
}

/**
 * Clean title by removing dots, underscores, and extra spaces
 */
function cleanTitle(title: string): string {
  return title
    .replace(/[._]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Generate properly formatted filename based on media type and metadata
 */
export function generateProperFilename(
  originalFilename: string,
  mediaType: string,
  metadata: Record<string, any>
): string {
  const ext = originalFilename.split('.').pop()?.toLowerCase() || 'mp4'
  
  switch (mediaType) {
    case 'movie':
      // Format: "Movie Title (Year).ext"
      const movieTitle = metadata.title || 'Unknown Movie'
      const year = metadata.year || 'Unknown'
      return `${movieTitle} (${year}).${ext}`
    
    case 'tv_episode':
      // Format: "Show Title - S01E05.ext"
      const showTitle = metadata.title || 'Unknown Show'
      const season = String(metadata.season || 1).padStart(2, '0')
      const episode = String(metadata.episode || 1).padStart(2, '0')
      return `${showTitle} - S${season}E${episode}.${ext}`
    
    case 'music':
      // Format: "Artist - Track Title.ext"
      const artist = metadata.artist || 'Unknown Artist'
      const trackTitle = metadata.title || originalFilename.replace(/\.\w+$/, '')
      return `${artist} - ${trackTitle}.${ext}`
    
    default:
      return originalFilename
  }
}
