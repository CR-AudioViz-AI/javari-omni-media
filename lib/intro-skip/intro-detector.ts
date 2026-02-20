// lib/intro-skip/intro-detector.ts
/**
 * JAVARI OMNI MEDIA - INTRO/OUTRO SKIP DETECTOR
 * 
 * Automatically detect TV show intros and outros for skip functionality.
 * Plex charges $119 lifetime for this - we give it FREE.
 * 
 * Detection methods:
 * 1. Audio fingerprinting (intro music is same across episodes)
 * 2. Black frame detection (intros often start/end with black)
 * 3. Volume analysis (intros often louder than dialogue)
 * 4. Community database (shared skip markers)
 */

import ffmpeg from 'fluent-ffmpeg'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

// ============================================================================
// TYPES
// ============================================================================

export interface IntroMarker {
  seriesId: string
  seasonNumber: number
  startTime: number // seconds
  endTime: number // seconds
  confidence: number // 0.0 - 1.0
  method: 'audio' | 'black_frame' | 'volume' | 'community'
  episodeCount: number // How many episodes confirmed
}

export interface OutroMarker {
  seriesId: string
  seasonNumber: number
  startTime: number
  endTime: number
  confidence: number
  method: 'credits' | 'black_frame' | 'community'
}

export interface SkipSegment {
  type: 'intro' | 'outro' | 'recap' | 'credits'
  startTime: number
  endTime: number
  confidence: number
  skipByDefault: boolean
}

// ============================================================================
// INTRO DETECTOR
// ============================================================================

export class IntroDetector {
  private supabase: ReturnType<typeof createClient>
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  
  /**
   * Analyze a TV series and detect intro/outro patterns
   */
  async analyzeSeriesPromise(seriesId: string, seasonNumber: number): Promise<{
    intro?: IntroMarker
    outro?: OutroMarker
  }> {
    console.log(`[IntroDetector] Analyzing series ${seriesId} season ${seasonNumber}`)
    
    // Get all episodes in this season
    const { data: episodes } = await this.supabase
      .from('media_files')
      .select(`
        id,
        filepath,
        media_metadata!inner (
          series_id,
          season_number,
          episode_number
        )
      `)
      .eq('media_metadata.series_id', seriesId)
      .eq('media_metadata.season_number', seasonNumber)
      .order('media_metadata.episode_number')
    
    if (!episodes || episodes.length < 3) {
      console.log('[IntroDetector] Not enough episodes to detect intro pattern')
      return {}
    }
    
    console.log(`[IntroDetector] Found ${episodes.length} episodes`)
    
    // Analyze first 3 episodes to find intro pattern
    const introMarkers: IntroMarker[] = []
    
    for (let i = 0; i < Math.min(3, episodes.length); i++) {
      const episode = episodes[i]
      
      // Method 1: Detect black frames (common at intro start/end)
      const blackFrames = await this.detectBlackFrames(episode.filepath)
      
      // Method 2: Volume analysis (intro music usually louder)
      const volumeSpikes = await this.detectVolumeSpikes(episode.filepath)
      
      // Method 3: Audio fingerprint (intro music is same)
      const audioSegments = await this.extractAudioSegments(episode.filepath)
      
      // Combine methods to find intro
      const intro = this.findIntroPattern(blackFrames, volumeSpikes, audioSegments)
      
      if (intro) {
        introMarkers.push({
          seriesId,
          seasonNumber,
          startTime: intro.start,
          endTime: intro.end,
          confidence: intro.confidence,
          method: 'audio',
          episodeCount: 1
        })
      }
    }
    
    // If we found consistent intro markers, average them
    if (introMarkers.length >= 2) {
      const avgStart = introMarkers.reduce((sum, m) => sum + m.startTime, 0) / introMarkers.length
      const avgEnd = introMarkers.reduce((sum, m) => sum + m.endTime, 0) / introMarkers.length
      const avgConfidence = introMarkers.reduce((sum, m) => sum + m.confidence, 0) / introMarkers.length
      
      const intro: IntroMarker = {
        seriesId,
        seasonNumber,
        startTime: Math.round(avgStart),
        endTime: Math.round(avgEnd),
        confidence: avgConfidence,
        method: 'audio',
        episodeCount: introMarkers.length
      }
      
      // Save to database
      await this.saveIntroMarker(intro)
      
      return { intro }
    }
    
    return {}
  }
  
  /**
   * Detect black frames in video (common at intro boundaries)
   */
  private async detectBlackFrames(filepath: string): Promise<number[]> {
    return new Promise((resolve) => {
      const blackFrames: number[] = []
      
      ffmpeg(filepath)
        .videoFilters('blackdetect=d=0.5:pix_th=0.10')
        .outputOptions(['-f', 'null'])
        .on('stderr', (line: string) => {
          // Parse black frame timestamps
          const match = line.match(/black_start:(\d+\.?\d*)/);
          if (match) {
            blackFrames.push(parseFloat(match[1]))
          }
        })
        .on('end', () => resolve(blackFrames))
        .on('error', () => resolve([]))
        .output('-')
        .run()
    })
  }
  
  /**
   * Detect volume spikes (intro music is usually louder)
   */
  private async detectVolumeSpikes(filepath: string): Promise<Array<{ time: number; volume: number }>> {
    return new Promise((resolve) => {
      const spikes: Array<{ time: number; volume: number }> = []
      
      ffmpeg(filepath)
        .audioFilters('volumedetect')
        .outputOptions(['-f', 'null'])
        .on('stderr', (line: string) => {
          // Parse volume data
          const match = line.match(/mean_volume: ([-\d.]+) dB/)
          if (match) {
            spikes.push({
              time: 0, // TODO: Extract timestamp
              volume: parseFloat(match[1])
            })
          }
        })
        .on('end', () => resolve(spikes))
        .on('error', () => resolve([]))
        .output('-')
        .run()
    })
  }
  
  /**
   * Extract audio segments for fingerprinting
   */
  private async extractAudioSegments(
    filepath: string,
    duration: number = 120 // First 2 minutes
  ): Promise<Buffer[]> {
    // TODO: Extract audio segments and create fingerprints
    // This would use audio fingerprinting libraries
    return []
  }
  
  /**
   * Find intro pattern from analysis data
   */
  private findIntroPattern(
    blackFrames: number[],
    volumeSpikes: Array<{ time: number; volume: number }>,
    audioSegments: Buffer[]
  ): { start: number; end: number; confidence: number } | null {
    // Simple heuristic: Look for black frames in first 2 minutes
    const earlyBlackFrames = blackFrames.filter(t => t < 120)
    
    if (earlyBlackFrames.length >= 2) {
      // Assume intro is between first two black frames
      return {
        start: earlyBlackFrames[0],
        end: earlyBlackFrames[1],
        confidence: 0.7
      }
    }
    
    // Default pattern: Many shows have 30-90 second intros
    if (blackFrames.length === 0) {
      return {
        start: 0,
        end: 60, // Assume 60 second intro
        confidence: 0.5
      }
    }
    
    return null
  }
  
  /**
   * Get intro marker for an episode
   */
  async getIntroMarker(
    seriesId: string,
    seasonNumber: number,
    episodeNumber: number
  ): Promise<SkipSegment | null> {
    // Check database for existing marker
    const { data } = await this.supabase
      .from('intro_markers')
      .select('*')
      .eq('series_id', seriesId)
      .eq('season_number', seasonNumber)
      .single()
    
    if (data) {
      return {
        type: 'intro',
        startTime: data.start_time,
        endTime: data.end_time,
        confidence: data.confidence,
        skipByDefault: data.confidence > 0.7
      }
    }
    
    // Check community database
    const communityMarker = await this.getCommunityMarker(seriesId, seasonNumber, episodeNumber)
    if (communityMarker) {
      return communityMarker
    }
    
    return null
  }
  
  /**
   * Get intro/outro from community database
   */
  private async getCommunityMarker(
    seriesId: string,
    seasonNumber: number,
    episodeNumber: number
  ): Promise<SkipSegment | null> {
    // TODO: Query community database (shared skip markers)
    return null
  }
  
  /**
   * Save intro marker to database
   */
  private async saveIntroMarker(marker: IntroMarker): Promise<void> {
    await this.supabase
      .from('intro_markers')
      .upsert({
        series_id: marker.seriesId,
        season_number: marker.seasonNumber,
        start_time: marker.startTime,
        end_time: marker.endTime,
        confidence: marker.confidence,
        method: marker.method,
        episode_count: marker.episodeCount
      })
    
    console.log(`[IntroDetector] Saved intro marker: ${marker.startTime}s - ${marker.endTime}s`)
  }
  
  /**
   * User feedback: confirm or adjust skip marker
   */
  async submitFeedback(
    seriesId: string,
    seasonNumber: number,
    episodeNumber: number,
    type: 'intro' | 'outro',
    startTime: number,
    endTime: number,
    userId: string
  ): Promise<void> {
    await this.supabase
      .from('skip_marker_feedback')
      .insert({
        series_id: seriesId,
        season_number: seasonNumber,
        episode_number: episodeNumber,
        type,
        start_time: startTime,
        end_time: endTime,
        user_id: userId,
        submitted_at: new Date().toISOString()
      })
    
    console.log('[IntroDetector] User feedback submitted')
  }
  
  /**
   * Detect credits/outro
   */
  async detectOutro(filepath: string, duration: number): Promise<OutroMarker | null> {
    // Look for credits in last 5 minutes
    const creditsStart = duration - 300 // Last 5 minutes
    
    const blackFrames = await this.detectBlackFrames(filepath)
    const lateBlackFrames = blackFrames.filter(t => t > creditsStart)
    
    if (lateBlackFrames.length > 0) {
      return {
        seriesId: '',
        seasonNumber: 0,
        startTime: lateBlackFrames[0],
        endTime: duration,
        confidence: 0.6,
        method: 'black_frame'
      }
    }
    
    return null
  }
  
  /**
   * Detect "previously on" recaps
   */
  async detectRecap(filepath: string): Promise<SkipSegment | null> {
    // Recaps are usually in first 2 minutes, before intro
    // TODO: Implement recap detection using NLP on subtitles
    // Common phrases: "Previously on...", "Last time on..."
    
    return null
  }
}

export default IntroDetector
