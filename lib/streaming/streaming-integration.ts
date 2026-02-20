// lib/streaming/streaming-integration.ts
/**
 * JAVARI OMNI MEDIA - STREAMING SERVICE INTEGRATION
 * 
 * UNIFIED STREAMING PLATFORM:
 * - Netflix, Amazon Prime, Hulu, Disney+, HBO Max, etc.
 * - Combined channel guide (all services in one place)
 * - "Where to watch" search
 * - Record streaming content (legal personal use)
 * - Unified watchlist across all platforms
 * - Cost tracking & optimization
 * - Subscription management
 * 
 * NO COMPETITOR integrates streaming THIS deeply.
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// TYPES
// ============================================================================

export interface StreamingService {
  id: string
  name: string
  logoUrl: string
  websiteUrl: string
  basePrice: number
  currency: string
  features: string[]
  countries: string[]
  categories: string[]
}

export interface ChannelGuide {
  serviceId: string
  contentId: string
  contentType: 'movie' | 'tv' | 'live' | 'sports'
  title: string
  description: string
  posterUrl: string
  backdropUrl: string
  airTime?: Date
  duration: number
  genre: string[]
  rating: string
  deepLink: string
  isAvailable: boolean
  expiresAt?: Date
}

export interface UserSubscription {
  userId: string
  serviceId: string
  status: 'active' | 'cancelled' | 'expired'
  monthlyCost: number
  startDate: Date
  renewalDate?: Date
  cancelledAt?: Date
}

export interface RecordingSchedule {
  id: string
  userId: string
  serviceId: string
  contentId: string
  contentType: 'movie' | 'episode' | 'live_event'
  title: string
  scheduledTime: Date
  duration: number
  quality: '720p' | '1080p' | '4k'
  status: 'scheduled' | 'recording' | 'completed' | 'failed'
}

// ============================================================================
// SUPPORTED SERVICES
// ============================================================================

export const STREAMING_SERVICES: StreamingService[] = [
  {
    id: 'netflix',
    name: 'Netflix',
    logoUrl: '/logos/netflix.png',
    websiteUrl: 'https://netflix.com',
    basePrice: 15.49,
    currency: 'USD',
    features: ['4K', 'Downloads', 'Multiple Profiles', 'No Ads'],
    countries: ['US', 'CA', 'UK', 'AU', 'Global'],
    categories: ['Movies', 'TV Shows', 'Documentaries', 'Anime']
  },
  {
    id: 'amazon-prime',
    name: 'Amazon Prime Video',
    logoUrl: '/logos/prime.png',
    websiteUrl: 'https://amazon.com/primevideo',
    basePrice: 8.99,
    currency: 'USD',
    features: ['4K', 'Downloads', 'Live Sports', 'Channels'],
    countries: ['US', 'CA', 'UK', 'AU', 'Global'],
    categories: ['Movies', 'TV Shows', 'Sports', 'Originals']
  },
  {
    id: 'disney-plus',
    name: 'Disney+',
    logoUrl: '/logos/disney.png',
    websiteUrl: 'https://disneyplus.com',
    basePrice: 7.99,
    currency: 'USD',
    features: ['4K', 'Downloads', 'GroupWatch', 'No Ads'],
    countries: ['US', 'CA', 'UK', 'AU', 'Global'],
    categories: ['Movies', 'TV Shows', 'Marvel', 'Star Wars', 'Pixar']
  },
  {
    id: 'hbo-max',
    name: 'Max (HBO)',
    logoUrl: '/logos/hbo.png',
    websiteUrl: 'https://max.com',
    basePrice: 15.99,
    currency: 'USD',
    features: ['4K', 'Downloads', 'Same-Day Releases'],
    countries: ['US', 'CA'],
    categories: ['Movies', 'TV Shows', 'HBO Originals']
  },
  {
    id: 'hulu',
    name: 'Hulu',
    logoUrl: '/logos/hulu.png',
    websiteUrl: 'https://hulu.com',
    basePrice: 7.99,
    currency: 'USD',
    features: ['Live TV Option', 'Next-Day Episodes', 'Downloads'],
    countries: ['US'],
    categories: ['Movies', 'TV Shows', 'Live TV']
  },
  {
    id: 'apple-tv',
    name: 'Apple TV+',
    logoUrl: '/logos/appletv.png',
    websiteUrl: 'https://tv.apple.com',
    basePrice: 6.99,
    currency: 'USD',
    features: ['4K', 'Downloads', 'SharePlay', 'No Ads'],
    countries: ['Global'],
    categories: ['Originals', 'Movies', 'Documentaries']
  },
  {
    id: 'paramount-plus',
    name: 'Paramount+',
    logoUrl: '/logos/paramount.png',
    websiteUrl: 'https://paramountplus.com',
    basePrice: 5.99,
    currency: 'USD',
    features: ['Live CBS', 'Sports', 'Downloads'],
    countries: ['US', 'CA', 'UK', 'AU'],
    categories: ['Movies', 'TV Shows', 'Sports', 'News']
  },
  {
    id: 'peacock',
    name: 'Peacock',
    logoUrl: '/logos/peacock.png',
    websiteUrl: 'https://peacocktv.com',
    basePrice: 5.99,
    currency: 'USD',
    features: ['Live Sports', 'Next-Day Episodes', 'Free Tier'],
    countries: ['US'],
    categories: ['Movies', 'TV Shows', 'Sports', 'News']
  },
  {
    id: 'espn-plus',
    name: 'ESPN+',
    logoUrl: '/logos/espn.png',
    websiteUrl: 'https://espn.com/plus',
    basePrice: 10.99,
    currency: 'USD',
    features: ['Live Sports', 'Exclusives', 'On-Demand'],
    countries: ['US'],
    categories: ['Sports', 'Documentaries']
  },
  {
    id: 'crunchyroll',
    name: 'Crunchyroll',
    logoUrl: '/logos/crunchyroll.png',
    websiteUrl: 'https://crunchyroll.com',
    basePrice: 7.99,
    currency: 'USD',
    features: ['Anime', 'Manga', 'Downloads', 'Simulcasts'],
    countries: ['Global'],
    categories: ['Anime', 'Manga']
  }
]

// ============================================================================
// STREAMING INTEGRATION MANAGER
// ============================================================================

export class StreamingIntegration {
  private supabase: ReturnType<typeof createClient>
  private userId: string
  
  constructor(userId: string) {
    this.userId = userId
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  
  // ==========================================================================
  // SUBSCRIPTION MANAGEMENT
  // ==========================================================================
  
  /**
   * Add streaming service subscription
   */
  async addSubscription(
    serviceId: string,
    monthlyCost: number
  ): Promise<UserSubscription> {
    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .insert({
        user_id: this.userId,
        service_id: serviceId,
        status: 'active',
        monthly_cost: monthlyCost,
        start_date: new Date().toISOString(),
        renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    console.log(`[StreamingIntegration] Added subscription: ${serviceId}`)
    return data
  }
  
  /**
   * Get user's active subscriptions
   */
  async getActiveSubscriptions(): Promise<UserSubscription[]> {
    const { data } = await this.supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', this.userId)
      .eq('status', 'active')
    
    return data || []
  }
  
  /**
   * Calculate total monthly cost
   */
  async getTotalMonthlyCost(): Promise<number> {
    const subscriptions = await this.getActiveSubscriptions()
    return subscriptions.reduce((sum, sub) => sum + sub.monthly_cost, 0)
  }
  
  /**
   * Get subscription optimization recommendations
   */
  async getOptimizationRecommendations(): Promise<{
    totalCost: number
    potentialSavings: number
    recommendations: string[]
  }> {
    const subscriptions = await this.getActiveSubscriptions()
    const totalCost = subscriptions.reduce((sum, sub) => sum + sub.monthly_cost, 0)
    
    // Get watch history to see which services are actually used
    const { data: watchHistory } = await this.supabase
      .from('watch_history')
      .select('*')
      .eq('user_id', this.userId)
      .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    
    const recommendations: string[] = []
    let potentialSavings = 0
    
    // Find unused subscriptions
    for (const sub of subscriptions) {
      const used = watchHistory?.some(w => w.service_id === sub.service_id)
      if (!used) {
        recommendations.push(`Cancel ${sub.service_id} (unused, save $${sub.monthly_cost}/month)`)
        potentialSavings += sub.monthly_cost
      }
    }
    
    return {
      totalCost,
      potentialSavings,
      recommendations
    }
  }
  
  // ==========================================================================
  // UNIFIED CHANNEL GUIDE
  // ==========================================================================
  
  /**
   * Get unified channel guide (all services)
   */
  async getChannelGuide(
    options: {
      date?: Date
      category?: string
      serviceIds?: string[]
    } = {}
  ): Promise<ChannelGuide[]> {
    console.log('[StreamingIntegration] Fetching channel guide...')
    
    // Get user's subscriptions to filter relevant content
    const subscriptions = await this.getActiveSubscriptions()
    const subscribedServiceIds = subscriptions.map(s => s.service_id)
    
    // Filter by user's subscribed services if not specified
    const serviceIds = options.serviceIds || subscribedServiceIds
    
    // Get content availability from database
    const { data } = await this.supabase
      .from('content_availability')
      .select('*')
      .in('service_id', serviceIds)
      .gte('available_from', options.date || new Date())
    
    if (!data) return []
    
    return data.map(item => ({
      serviceId: item.service_id,
      contentId: item.tmdb_id || item.imdb_id,
      contentType: item.type as 'movie' | 'tv',
      title: item.title,
      description: item.description,
      posterUrl: item.poster_url,
      backdropUrl: item.backdrop_url,
      duration: item.duration,
      genre: item.genre || [],
      rating: item.content_rating,
      deepLink: item.deep_link_url,
      isAvailable: new Date(item.available_from) <= new Date(),
      expiresAt: item.available_until ? new Date(item.available_until) : undefined
    }))
  }
  
  /**
   * Search across all streaming services
   */
  async searchContent(query: string): Promise<{
    title: string
    type: 'movie' | 'tv'
    year: number
    availableOn: Array<{
      service: string
      deepLink: string
      price?: number
    }>
  }[]> {
    console.log(`[StreamingIntegration] Searching: ${query}`)
    
    // Search in content availability database
    const { data } = await this.supabase
      .from('content_availability')
      .select('*')
      .ilike('title', `%${query}%`)
      .limit(50)
    
    if (!data) return []
    
    // Group by title (same content on multiple services)
    const grouped = new Map<string, any>()
    
    for (const item of data) {
      const key = `${item.title}_${item.type}_${item.year || 0}`
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          title: item.title,
          type: item.type,
          year: item.year,
          availableOn: []
        })
      }
      
      grouped.get(key)!.availableOn.push({
        service: item.service_id,
        deepLink: item.deep_link_url,
        price: item.rent_price || item.buy_price
      })
    }
    
    return Array.from(grouped.values())
  }
  
  // ==========================================================================
  // RECORDING & DVR
  // ==========================================================================
  
  /**
   * Schedule recording of streaming content
   */
  async scheduleRecording(
    serviceId: string,
    contentId: string,
    contentType: 'movie' | 'episode' | 'live_event',
    title: string,
    scheduledTime: Date,
    duration: number,
    quality: '720p' | '1080p' | '4k' = '1080p'
  ): Promise<RecordingSchedule> {
    console.log(`[StreamingIntegration] Scheduling recording: ${title}`)
    
    const { data, error } = await this.supabase
      .from('recording_schedule')
      .insert({
        user_id: this.userId,
        service_id: serviceId,
        content_id: contentId,
        content_type: contentType,
        title,
        scheduled_time: scheduledTime.toISOString(),
        duration,
        quality,
        status: 'scheduled'
      })
      .select()
      .single()
    
    if (error) throw error
    
    console.log(`[StreamingIntegration] Recording scheduled: ${data.id}`)
    return data
  }
  
  /**
   * Get scheduled recordings
   */
  async getScheduledRecordings(): Promise<RecordingSchedule[]> {
    const { data } = await this.supabase
      .from('recording_schedule')
      .select('*')
      .eq('user_id', this.userId)
      .in('status', ['scheduled', 'recording'])
      .order('scheduled_time', { ascending: true })
    
    return data || []
  }
  
  /**
   * Get completed recordings
   */
  async getCompletedRecordings(): Promise<RecordingSchedule[]> {
    const { data } = await this.supabase
      .from('recording_schedule')
      .select('*')
      .eq('user_id', this.userId)
      .eq('status', 'completed')
      .order('scheduled_time', { ascending: false })
      .limit(100)
    
    return data || []
  }
  
  // ==========================================================================
  // WATCHLIST MANAGEMENT
  // ==========================================================================
  
  /**
   * Add to unified watchlist
   */
  async addToWatchlist(
    contentId: string,
    contentType: 'movie' | 'tv',
    title: string,
    serviceId?: string
  ): Promise<void> {
    await this.supabase
      .from('watchlist_items')
      .insert({
        watchlist_id: await this.getDefaultWatchlistId(),
        tmdb_id: contentId.startsWith('tmdb_') ? parseInt(contentId.split('_')[1]) : null,
        imdb_id: contentId.startsWith('tt') ? contentId : null,
        title,
        type: contentType,
        notes: serviceId ? `Available on ${serviceId}` : null
      })
    
    console.log(`[StreamingIntegration] Added to watchlist: ${title}`)
  }
  
  private async getDefaultWatchlistId(): Promise<string> {
    const { data } = await this.supabase
      .from('watchlists')
      .select('id')
      .eq('user_id', this.userId)
      .eq('name', 'My Watchlist')
      .single()
    
    return data?.id || ''
  }
  
  // ==========================================================================
  // ANALYTICS
  // ==========================================================================
  
  /**
   * Get viewing stats across all services
   */
  async getViewingStats(days: number = 30): Promise<{
    totalHours: number
    byService: Record<string, number>
    topGenres: string[]
    completionRate: number
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    const { data } = await this.supabase
      .from('watch_history')
      .select('*')
      .eq('user_id', this.userId)
      .gte('started_at', since.toISOString())
    
    if (!data) {
      return {
        totalHours: 0,
        byService: {},
        topGenres: [],
        completionRate: 0
      }
    }
    
    const totalSeconds = data.reduce((sum, w) => sum + (w.watched_seconds || 0), 0)
    const totalHours = Math.round(totalSeconds / 3600)
    
    // Group by service
    const byService: Record<string, number> = {}
    data.forEach(w => {
      const service = w.service_id || 'unknown'
      byService[service] = (byService[service] || 0) + (w.watched_seconds || 0) / 3600
    })
    
    // Calculate completion rate
    const completed = data.filter(w => w.completed).length
    const completionRate = data.length > 0 ? (completed / data.length) * 100 : 0
    
    return {
      totalHours,
      byService,
      topGenres: [], // TODO: Extract from metadata
      completionRate
    }
  }
}

export default StreamingIntegration
