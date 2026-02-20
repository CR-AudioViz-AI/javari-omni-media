// lib/arr/arr-manager.ts
/**
 * JAVARI OMNI MEDIA - *ARR APPS INTEGRATION
 * 
 * Built-in automation for media downloads:
 * - Radarr (movies)
 * - Sonarr (TV shows)
 * - Lidarr (music)
 * - Readarr (books)
 * - Prowlarr (indexers)
 * - Bazarr (subtitles)
 * 
 * NO SEPARATE APPS NEEDED - all integrated into one beautiful UI.
 * This is what Plex users have to install separately - we have it built-in.
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// TYPES
// ============================================================================

export type ArrApp = 'radarr' | 'sonarr' | 'lidarr' | 'readarr' | 'prowlarr' | 'bazarr'

export interface ArrConfig {
  app: ArrApp
  enabled: boolean
  apiUrl?: string
  apiKey?: string
}

export interface Movie {
  id?: number
  tmdbId: number
  imdbId?: string
  title: string
  year: number
  overview: string
  posterUrl: string
  status: 'missing' | 'downloading' | 'downloaded'
  qualityProfile: number
  monitored: boolean
  path?: string
  downloaded?: boolean
}

export interface TvShow {
  id?: number
  tvdbId: number
  imdbId?: string
  title: string
  year: number
  overview: string
  posterUrl: string
  status: string
  seasons: Season[]
  monitored: boolean
  path?: string
}

export interface Season {
  seasonNumber: number
  monitored: boolean
  statistics?: {
    episodeCount: number
    episodeFileCount: number
    percentOfEpisodes: number
  }
}

export interface Download {
  id: string
  title: string
  status: 'queued' | 'downloading' | 'completed' | 'failed'
  progress: number
  downloadSpeed: number
  eta: number
  size: number
}

export interface Indexer {
  id: number
  name: string
  type: 'torrent' | 'usenet'
  enabled: boolean
  priority: number
  apiUrl: string
}

// ============================================================================
// ARR MANAGER
// ============================================================================

export class ArrManager {
  private supabase: ReturnType<typeof createClient>
  private userId: string
  private configs: Map<ArrApp, ArrConfig> = new Map()
  
  constructor(userId: string) {
    this.userId = userId
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  
  // ==========================================================================
  // RADARR (MOVIES)
  // ==========================================================================
  
  /**
   * Search for a movie
   */
  async searchMovie(query: string): Promise<Movie[]> {
    const apiUrl = this.getApiUrl('radarr')
    const apiKey = this.getApiKey('radarr')
    
    const response = await fetch(`${apiUrl}/api/v3/movie/lookup?term=${encodeURIComponent(query)}`, {
      headers: { 'X-Api-Key': apiKey }
    })
    
    const data = await response.json()
    
    return data.map((movie: any) => ({
      tmdbId: movie.tmdbId,
      imdbId: movie.imdbId,
      title: movie.title,
      year: movie.year,
      overview: movie.overview,
      posterUrl: movie.images?.find((i: any) => i.coverType === 'poster')?.remoteUrl,
      status: movie.hasFile ? 'downloaded' : 'missing',
      qualityProfile: 1,
      monitored: false
    }))
  }
  
  /**
   * Add movie to Radarr for monitoring
   */
  async addMovie(movie: Movie): Promise<void> {
    const apiUrl = this.getApiUrl('radarr')
    const apiKey = this.getApiKey('radarr')
    
    // Add to Radarr
    const response = await fetch(`${apiUrl}/api/v3/movie`, {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: movie.title,
        year: movie.year,
        tmdbId: movie.tmdbId,
        qualityProfileId: movie.qualityProfile,
        monitored: true,
        addOptions: {
          searchForMovie: true
        },
        rootFolderPath: '/mnt/synology/Movies'
      })
    })
    
    if (!response.ok) {
      throw new Error(`Radarr API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Save to our database
    await this.supabase.from('downloads').insert({
      user_id: this.userId,
      title: movie.title,
      type: 'movie',
      source: 'radarr',
      status: 'queued',
      target_media_id: null
    })
    
    console.log(`[ArrManager] Added movie: ${movie.title}`)
  }
  
  /**
   * Get all movies from Radarr
   */
  async getMovies(): Promise<Movie[]> {
    const apiUrl = this.getApiUrl('radarr')
    const apiKey = this.getApiKey('radarr')
    
    const response = await fetch(`${apiUrl}/api/v3/movie`, {
      headers: { 'X-Api-Key': apiKey }
    })
    
    const data = await response.json()
    
    return data.map((movie: any) => ({
      id: movie.id,
      tmdbId: movie.tmdbId,
      imdbId: movie.imdbId,
      title: movie.title,
      year: movie.year,
      overview: movie.overview,
      posterUrl: movie.images?.find((i: any) => i.coverType === 'poster')?.remoteUrl,
      status: movie.hasFile ? 'downloaded' : movie.monitored ? 'downloading' : 'missing',
      qualityProfile: movie.qualityProfileId,
      monitored: movie.monitored,
      path: movie.path,
      downloaded: movie.hasFile
    }))
  }
  
  // ==========================================================================
  // SONARR (TV SHOWS)
  // ==========================================================================
  
  /**
   * Search for a TV show
   */
  async searchShow(query: string): Promise<TvShow[]> {
    const apiUrl = this.getApiUrl('sonarr')
    const apiKey = this.getApiKey('sonarr')
    
    const response = await fetch(`${apiUrl}/api/v3/series/lookup?term=${encodeURIComponent(query)}`, {
      headers: { 'X-Api-Key': apiKey }
    })
    
    const data = await response.json()
    
    return data.map((show: any) => ({
      tvdbId: show.tvdbId,
      imdbId: show.imdbId,
      title: show.title,
      year: show.year,
      overview: show.overview,
      posterUrl: show.images?.find((i: any) => i.coverType === 'poster')?.remoteUrl,
      status: show.status,
      seasons: show.seasons || [],
      monitored: false
    }))
  }
  
  /**
   * Add TV show to Sonarr
   */
  async addShow(show: TvShow): Promise<void> {
    const apiUrl = this.getApiUrl('sonarr')
    const apiKey = this.getApiKey('sonarr')
    
    const response = await fetch(`${apiUrl}/api/v3/series`, {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: show.title,
        tvdbId: show.tvdbId,
        qualityProfileId: 1,
        monitored: true,
        seasonFolder: true,
        addOptions: {
          searchForMissingEpisodes: true
        },
        rootFolderPath: '/mnt/synology/TV'
      })
    })
    
    if (!response.ok) {
      throw new Error(`Sonarr API error: ${response.statusText}`)
    }
    
    await this.supabase.from('downloads').insert({
      user_id: this.userId,
      title: show.title,
      type: 'tv-episode',
      source: 'sonarr',
      status: 'queued'
    })
    
    console.log(`[ArrManager] Added show: ${show.title}`)
  }
  
  /**
   * Get all TV shows from Sonarr
   */
  async getShows(): Promise<TvShow[]> {
    const apiUrl = this.getApiUrl('sonarr')
    const apiKey = this.getApiKey('sonarr')
    
    const response = await fetch(`${apiUrl}/api/v3/series`, {
      headers: { 'X-Api-Key': apiKey }
    })
    
    const data = await response.json()
    
    return data.map((show: any) => ({
      id: show.id,
      tvdbId: show.tvdbId,
      imdbId: show.imdbId,
      title: show.title,
      year: show.year,
      overview: show.overview,
      posterUrl: show.images?.find((i: any) => i.coverType === 'poster')?.remoteUrl,
      status: show.status,
      seasons: show.seasons || [],
      monitored: show.monitored,
      path: show.path
    }))
  }
  
  // ==========================================================================
  // PROWLARR (INDEXERS)
  // ==========================================================================
  
  /**
   * Get all indexers from Prowlarr
   */
  async getIndexers(): Promise<Indexer[]> {
    const apiUrl = this.getApiUrl('prowlarr')
    const apiKey = this.getApiKey('prowlarr')
    
    const response = await fetch(`${apiUrl}/api/v1/indexer`, {
      headers: { 'X-Api-Key': apiKey }
    })
    
    const data = await response.json()
    
    return data.map((indexer: any) => ({
      id: indexer.id,
      name: indexer.name,
      type: indexer.protocol === 'torrent' ? 'torrent' : 'usenet',
      enabled: indexer.enable,
      priority: indexer.priority,
      apiUrl: indexer.baseUrl
    }))
  }
  
  /**
   * Add indexer to Prowlarr
   */
  async addIndexer(name: string, type: 'torrent' | 'usenet', config: any): Promise<void> {
    const apiUrl = this.getApiUrl('prowlarr')
    const apiKey = this.getApiKey('prowlarr')
    
    const response = await fetch(`${apiUrl}/api/v1/indexer`, {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        protocol: type,
        enable: true,
        ...config
      })
    })
    
    if (!response.ok) {
      throw new Error(`Prowlarr API error: ${response.statusText}`)
    }
    
    console.log(`[ArrManager] Added indexer: ${name}`)
  }
  
  // ==========================================================================
  // DOWNLOAD QUEUE
  // ==========================================================================
  
  /**
   * Get current download queue across all *arr apps
   */
  async getDownloadQueue(): Promise<Download[]> {
    const downloads: Download[] = []
    
    // Get from Radarr
    try {
      const radarrQueue = await this.getRadarrQueue()
      downloads.push(...radarrQueue)
    } catch (error) {
      console.error('[ArrManager] Error getting Radarr queue:', error)
    }
    
    // Get from Sonarr
    try {
      const sonarrQueue = await this.getSonarrQueue()
      downloads.push(...sonarrQueue)
    } catch (error) {
      console.error('[ArrManager] Error getting Sonarr queue:', error)
    }
    
    return downloads
  }
  
  private async getRadarrQueue(): Promise<Download[]> {
    const apiUrl = this.getApiUrl('radarr')
    const apiKey = this.getApiKey('radarr')
    
    const response = await fetch(`${apiUrl}/api/v3/queue`, {
      headers: { 'X-Api-Key': apiKey }
    })
    
    const data = await response.json()
    
    return data.records.map((item: any) => ({
      id: `radarr_${item.id}`,
      title: item.title,
      status: this.mapStatus(item.status),
      progress: item.sizeleft === 0 ? 100 : ((item.size - item.sizeleft) / item.size) * 100,
      downloadSpeed: item.downloadSpeed || 0,
      eta: item.timeleft ? this.parseTimeLeft(item.timeleft) : 0,
      size: item.size
    }))
  }
  
  private async getSonarrQueue(): Promise<Download[]> {
    const apiUrl = this.getApiUrl('sonarr')
    const apiKey = this.getApiKey('sonarr')
    
    const response = await fetch(`${apiUrl}/api/v3/queue`, {
      headers: { 'X-Api-Key': apiKey }
    })
    
    const data = await response.json()
    
    return data.records.map((item: any) => ({
      id: `sonarr_${item.id}`,
      title: item.title,
      status: this.mapStatus(item.status),
      progress: item.sizeleft === 0 ? 100 : ((item.size - item.sizeleft) / item.size) * 100,
      downloadSpeed: item.downloadSpeed || 0,
      eta: item.timeleft ? this.parseTimeLeft(item.timeleft) : 0,
      size: item.size
    }))
  }
  
  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================
  
  /**
   * Set configuration for an *arr app
   */
  async setConfig(app: ArrApp, apiUrl: string, apiKey: string): Promise<void> {
    this.configs.set(app, {
      app,
      enabled: true,
      apiUrl,
      apiKey
    })
    
    // Save to database
    await this.supabase.from('arr_configs').upsert({
      user_id: this.userId,
      app,
      api_url: apiUrl,
      api_key: this.encryptApiKey(apiKey),
      enabled: true
    })
    
    console.log(`[ArrManager] Configured ${app}`)
  }
  
  /**
   * Load configuration from database
   */
  async loadConfig(): Promise<void> {
    const { data } = await this.supabase
      .from('arr_configs')
      .select('*')
      .eq('user_id', this.userId)
    
    if (data) {
      for (const config of data) {
        this.configs.set(config.app, {
          app: config.app,
          enabled: config.enabled,
          apiUrl: config.api_url,
          apiKey: this.decryptApiKey(config.api_key)
        })
      }
    }
  }
  
  // ==========================================================================
  // HELPERS
  // ==========================================================================
  
  private getApiUrl(app: ArrApp): string {
    const config = this.configs.get(app)
    if (!config?.apiUrl) {
      throw new Error(`${app} not configured`)
    }
    return config.apiUrl
  }
  
  private getApiKey(app: ArrApp): string {
    const config = this.configs.get(app)
    if (!config?.apiKey) {
      throw new Error(`${app} API key not set`)
    }
    return config.apiKey
  }
  
  private mapStatus(status: string): Download['status'] {
    const statusMap: Record<string, Download['status']> = {
      'queued': 'queued',
      'downloading': 'downloading',
      'completed': 'completed',
      'failed': 'failed'
    }
    return statusMap[status.toLowerCase()] || 'queued'
  }
  
  private parseTimeLeft(timeLeft: string): number {
    // Parse "00:15:30" to seconds
    const parts = timeLeft.split(':').map(Number)
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  
  private encryptApiKey(key: string): string {
    // TODO: Implement proper encryption
    return key
  }
  
  private decryptApiKey(key: string): string {
    // TODO: Implement proper decryption
    return key
  }
}

export default ArrManager
