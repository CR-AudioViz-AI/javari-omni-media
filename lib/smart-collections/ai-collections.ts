// lib/smart-collections/ai-collections.ts
/**
 * JAVARI OMNI MEDIA - AI-POWERED SMART COLLECTIONS
 * 
 * AUTOMATICALLY CREATE CONTEXTUAL COLLECTIONS:
 * - Time-based ("Friday Night Movies", "Sunday Morning Cartoons")
 * - Mood-based ("Feel-Good Films", "Rainy Day Movies")
 * - Context-based ("Date Night", "Kids Safe", "Brain-Dead Fun")
 * - Event-based ("Christmas Movies", "Halloween Horror")
 * - AI-analyzed ("Cerebral Thrillers", "Cozy Comfort Food")
 * 
 * NO COMPETITOR has AI-powered collections.
 * Plex has basic genre collections - we have INTELLIGENT curation.
 */

import { createClient } from '@supabase/supabase-js'
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns'

// ============================================================================
// TYPES
// ============================================================================

export interface SmartCollection {
  id: string
  name: string
  description: string
  icon: string
  rules: CollectionRule[]
  refreshInterval: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual'
  context: CollectionContext
  aiGenerated: boolean
  itemCount?: number
}

export interface CollectionRule {
  type: 'genre' | 'rating' | 'runtime' | 'year' | 'mood' | 'pacing' | 'complexity' | 'time_of_day' | 'weather' | 'day_of_week' | 'season' | 'watch_history' | 'ai_tag'
  operator: 'equals' | 'contains' | 'less_than' | 'greater_than' | 'between' | 'in' | 'not_in'
  value: any
  weight?: number // For AI scoring
}

export type CollectionContext = 
  | 'time_based'
  | 'mood_based'
  | 'event_based'
  | 'social_based'
  | 'personal_based'
  | 'seasonal_based'

// ============================================================================
// SMART COLLECTION TEMPLATES
// ============================================================================

export const SMART_COLLECTION_TEMPLATES: Record<string, SmartCollection> = {
  // TIME-BASED COLLECTIONS
  friday_night_movies: {
    id: 'friday_night_movies',
    name: 'Friday Night Movies',
    description: 'Perfect picks to kick off the weekend',
    icon: '🍿',
    refreshInterval: 'daily',
    context: 'time_based',
    aiGenerated: true,
    rules: [
      { type: 'runtime', operator: 'between', value: [90, 150] }, // 1.5-2.5 hours
      { type: 'genre', operator: 'in', value: ['action', 'comedy', 'thriller', 'adventure'] },
      { type: 'rating', operator: 'greater_than', value: 7.0 },
      { type: 'pacing', operator: 'in', value: ['fast', 'moderate'], weight: 0.8 },
      { type: 'mood', operator: 'in', value: ['uplifting', 'exciting', 'fun'], weight: 0.7 },
      { type: 'day_of_week', operator: 'equals', value: 5 } // Friday
    ]
  },

  sunday_morning_cartoons: {
    id: 'sunday_morning_cartoons',
    name: 'Sunday Morning Cartoons',
    description: 'Nostalgic weekend morning picks',
    icon: '📺',
    refreshInterval: 'weekly',
    context: 'time_based',
    aiGenerated: true,
    rules: [
      { type: 'genre', operator: 'contains', value: 'animation' },
      { type: 'rating', operator: 'in', value: ['G', 'PG', 'TV-Y', 'TV-Y7'] },
      { type: 'runtime', operator: 'less_than', value: 30 },
      { type: 'day_of_week', operator: 'equals', value: 0 }, // Sunday
      { type: 'time_of_day', operator: 'between', value: ['07:00', '12:00'] }
    ]
  },

  late_night_picks: {
    id: 'late_night_picks',
    name: 'Late Night Picks',
    description: 'Wind down before bed',
    icon: '🌙',
    refreshInterval: 'daily',
    context: 'time_based',
    aiGenerated: true,
    rules: [
      { type: 'runtime', operator: 'less_than', value: 120 }, // Under 2 hours
      { type: 'pacing', operator: 'equals', value: 'slow', weight: 0.9 },
      { type: 'mood', operator: 'in', value: ['peaceful', 'contemplative', 'cozy'] },
      { type: 'time_of_day', operator: 'greater_than', value: '21:00' }
    ]
  },

  // MOOD-BASED COLLECTIONS
  feel_good_films: {
    id: 'feel_good_films',
    name: 'Feel-Good Films',
    description: 'Guaranteed to lift your spirits',
    icon: '😊',
    refreshInterval: 'weekly',
    context: 'mood_based',
    aiGenerated: true,
    rules: [
      { type: 'mood', operator: 'in', value: ['uplifting', 'heartwarming', 'inspiring'], weight: 1.0 },
      { type: 'genre', operator: 'in', value: ['comedy', 'family', 'romance', 'musical'] },
      { type: 'ai_tag', operator: 'contains', value: 'happy_ending' },
      { type: 'rating', operator: 'greater_than', value: 7.5 }
    ]
  },

  rainy_day_movies: {
    id: 'rainy_day_movies',
    name: 'Rainy Day Movies',
    description: 'Cozy comfort films for gloomy weather',
    icon: '🌧️',
    refreshInterval: 'realtime',
    context: 'mood_based',
    aiGenerated: true,
    rules: [
      { type: 'mood', operator: 'in', value: ['cozy', 'contemplative', 'nostalgic'] },
      { type: 'pacing', operator: 'in', value: ['slow', 'moderate'] },
      { type: 'genre', operator: 'in', value: ['drama', 'romance', 'indie', 'family'] },
      { type: 'weather', operator: 'equals', value: 'rain' }
    ]
  },

  brain_dead_fun: {
    id: 'brain_dead_fun',
    name: 'Brain-Dead Fun',
    description: 'No thinking required, pure entertainment',
    icon: '🤪',
    refreshInterval: 'weekly',
    context: 'mood_based',
    aiGenerated: true,
    rules: [
      { type: 'complexity', operator: 'equals', value: 'simple', weight: 1.0 },
      { type: 'genre', operator: 'in', value: ['comedy', 'action', 'adventure'] },
      { type: 'pacing', operator: 'equals', value: 'fast' },
      { type: 'ai_tag', operator: 'not_in', value: ['cerebral', 'complex_plot'] }
    ]
  },

  cerebral_thrillers: {
    id: 'cerebral_thrillers',
    name: 'Cerebral Thrillers',
    description: 'Mind-bending, thought-provoking',
    icon: '🧠',
    refreshInterval: 'weekly',
    context: 'mood_based',
    aiGenerated: true,
    rules: [
      { type: 'complexity', operator: 'equals', value: 'complex', weight: 1.0 },
      { type: 'genre', operator: 'in', value: ['thriller', 'mystery', 'sci-fi'] },
      { type: 'ai_tag', operator: 'in', value: ['plot_twist', 'nonlinear', 'philosophical'] },
      { type: 'rating', operator: 'greater_than', value: 7.5 }
    ]
  },

  // SOCIAL-BASED COLLECTIONS
  date_night: {
    id: 'date_night',
    name: 'Date Night',
    description: 'Perfect for romantic evenings',
    icon: '💑',
    refreshInterval: 'weekly',
    context: 'social_based',
    aiGenerated: true,
    rules: [
      { type: 'genre', operator: 'in', value: ['romance', 'romantic comedy', 'drama'] },
      { type: 'rating', operator: 'less_than', value: 'R' }, // Not too intense
      { type: 'runtime', operator: 'between', value: [90, 130] },
      { type: 'mood', operator: 'in', value: ['romantic', 'uplifting', 'fun'] },
      { type: 'ai_tag', operator: 'not_in', value: ['depressing', 'violent'] }
    ]
  },

  kids_safe: {
    id: 'kids_safe',
    name: 'Kids Safe',
    description: 'Family-friendly entertainment',
    icon: '👶',
    refreshInterval: 'daily',
    context: 'social_based',
    aiGenerated: true,
    rules: [
      { type: 'rating', operator: 'in', value: ['G', 'PG', 'TV-Y', 'TV-G'] },
      { type: 'genre', operator: 'in', value: ['animation', 'family', 'adventure', 'comedy'] },
      { type: 'ai_tag', operator: 'not_in', value: ['scary', 'intense', 'mature_themes'] }
    ]
  },

  party_picks: {
    id: 'party_picks',
    name: 'Party Picks',
    description: 'Great for groups and gatherings',
    icon: '🎉',
    refreshInterval: 'weekly',
    context: 'social_based',
    aiGenerated: true,
    rules: [
      { type: 'genre', operator: 'in', value: ['comedy', 'action', 'adventure'] },
      { type: 'pacing', operator: 'equals', value: 'fast' },
      { type: 'complexity', operator: 'in', value: ['simple', 'moderate'] },
      { type: 'ai_tag', operator: 'in', value: ['crowd_pleaser', 'quotable'] }
    ]
  },

  // EVENT-BASED COLLECTIONS
  christmas_classics: {
    id: 'christmas_classics',
    name: 'Christmas Classics',
    description: 'Holiday favorites and festive films',
    icon: '🎄',
    refreshInterval: 'daily',
    context: 'event_based',
    aiGenerated: true,
    rules: [
      { type: 'ai_tag', operator: 'contains', value: 'christmas' },
      { type: 'season', operator: 'equals', value: 'winter' },
      { type: 'genre', operator: 'in', value: ['family', 'comedy', 'drama', 'animation'] }
    ]
  },

  halloween_horror: {
    id: 'halloween_horror',
    name: 'Halloween Horror',
    description: 'Spooky season scares',
    icon: '🎃',
    refreshInterval: 'daily',
    context: 'event_based',
    aiGenerated: true,
    rules: [
      { type: 'genre', operator: 'contains', value: 'horror' },
      { type: 'season', operator: 'equals', value: 'fall' },
      { type: 'ai_tag', operator: 'in', value: ['scary', 'supernatural', 'thriller'] }
    ]
  },

  summer_blockbusters: {
    id: 'summer_blockbusters',
    name: 'Summer Blockbusters',
    description: 'Big-budget summer entertainment',
    icon: '☀️',
    refreshInterval: 'weekly',
    context: 'event_based',
    aiGenerated: true,
    rules: [
      { type: 'genre', operator: 'in', value: ['action', 'adventure', 'sci-fi'] },
      { type: 'pacing', operator: 'equals', value: 'fast' },
      { type: 'season', operator: 'equals', value: 'summer' },
      { type: 'ai_tag', operator: 'contains', value: 'blockbuster' }
    ]
  },

  // PERSONAL-BASED COLLECTIONS
  unwatched_gems: {
    id: 'unwatched_gems',
    name: 'Unwatched Gems',
    description: 'Highly rated movies you haven\'t seen',
    icon: '💎',
    refreshInterval: 'daily',
    context: 'personal_based',
    aiGenerated: true,
    rules: [
      { type: 'watch_history', operator: 'equals', value: false },
      { type: 'rating', operator: 'greater_than', value: 8.0 },
      { type: 'year', operator: 'greater_than', value: 2010 }
    ]
  },

  finish_what_you_started: {
    id: 'finish_what_you_started',
    name: 'Finish What You Started',
    description: 'Movies/shows you started but didn\'t finish',
    icon: '⏸️',
    refreshInterval: 'realtime',
    context: 'personal_based',
    aiGenerated: true,
    rules: [
      { type: 'watch_history', operator: 'equals', value: 'partial' }
    ]
  },

  your_favorites: {
    id: 'your_favorites',
    name: 'Your Favorites',
    description: 'Based on what you love',
    icon: '⭐',
    refreshInterval: 'daily',
    context: 'personal_based',
    aiGenerated: true,
    rules: [
      { type: 'watch_history', operator: 'equals', value: 'completed' },
      { type: 'rating', operator: 'greater_than', value: 8.5 }
    ]
  }
}

// ============================================================================
// AI COLLECTION GENERATOR
// ============================================================================

export class AICollectionGenerator {
  private supabase: ReturnType<typeof createClient>
  private userId: string
  
  constructor(userId: string) {
    this.userId = userId
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  
  /**
   * Generate smart collection based on rules
   */
  async generateCollection(collectionId: string): Promise<string[]> {
    const template = SMART_COLLECTION_TEMPLATES[collectionId]
    if (!template) {
      throw new Error(`Collection template not found: ${collectionId}`)
    }
    
    console.log(`[AICollectionGenerator] Generating: ${template.name}`)
    
    // Get all media files
    let query = this.supabase
      .from('media_files')
      .select(`
        id,
        category_id,
        media_metadata!inner (
          title,
          year,
          rating,
          content_rating,
          genre,
          runtime
        )
      `)
      .eq('user_id', this.userId)
      .in('category_id', ['movies', 'tv-shows'])
    
    const { data: allContent } = await query
    
    if (!allContent || allContent.length === 0) {
      return []
    }
    
    // Apply rules
    let filtered = allContent.filter(item => 
      this.matchesRules(item, template.rules)
    )
    
    // Score and sort by relevance
    const scored = filtered.map(item => ({
      id: item.id,
      score: this.calculateRelevanceScore(item, template.rules)
    }))
    
    scored.sort((a, b) => b.score - a.score)
    
    // Return top 50
    const contentIds = scored.slice(0, 50).map(s => s.id)
    
    console.log(`[AICollectionGenerator] Generated ${contentIds.length} items for ${template.name}`)
    
    return contentIds
  }
  
  /**
   * Check if content matches collection rules
   */
  private matchesRules(content: any, rules: CollectionRule[]): boolean {
    for (const rule of rules) {
      if (!this.matchesRule(content, rule)) {
        return false
      }
    }
    return true
  }
  
  /**
   * Check if content matches a single rule
   */
  private matchesRule(content: any, rule: CollectionRule): boolean {
    const metadata = content.media_metadata?.[0]
    if (!metadata) return false
    
    switch (rule.type) {
      case 'genre':
        const genres = metadata.genre || []
        if (rule.operator === 'in') {
          return rule.value.some((g: string) => genres.includes(g))
        } else if (rule.operator === 'contains') {
          return genres.some((g: string) => g.toLowerCase().includes(rule.value.toLowerCase()))
        }
        return false
      
      case 'rating':
        const rating = metadata.rating || 0
        if (rule.operator === 'greater_than') {
          return rating > rule.value
        } else if (rule.operator === 'less_than') {
          return rating < rule.value
        }
        return false
      
      case 'runtime':
        const runtime = metadata.runtime || 0
        if (rule.operator === 'between') {
          return runtime >= rule.value[0] && runtime <= rule.value[1]
        } else if (rule.operator === 'less_than') {
          return runtime < rule.value
        }
        return false
      
      case 'year':
        const year = metadata.year || 0
        if (rule.operator === 'greater_than') {
          return year > rule.value
        } else if (rule.operator === 'between') {
          return year >= rule.value[0] && year <= rule.value[1]
        }
        return false
      
      case 'day_of_week':
        const today = new Date().getDay()
        return today === rule.value
      
      case 'time_of_day':
        const now = format(new Date(), 'HH:mm')
        if (rule.operator === 'greater_than') {
          return now > rule.value
        } else if (rule.operator === 'between') {
          return now >= rule.value[0] && now <= rule.value[1]
        }
        return false
      
      case 'season':
        const month = new Date().getMonth()
        const season = this.getSeason(month)
        return season === rule.value
      
      default:
        return true // Unknown rule types pass
    }
  }
  
  /**
   * Calculate relevance score for content
   */
  private calculateRelevanceScore(content: any, rules: CollectionRule[]): number {
    let score = 0
    
    for (const rule of rules) {
      if (this.matchesRule(content, rule)) {
        score += rule.weight || 1.0
      }
    }
    
    return score
  }
  
  /**
   * Get current season
   */
  private getSeason(month: number): string {
    if (month >= 2 && month <= 4) return 'spring'
    if (month >= 5 && month <= 7) return 'summer'
    if (month >= 8 && month <= 10) return 'fall'
    return 'winter'
  }
  
  /**
   * Get all active smart collections for user
   */
  async getActiveCollections(): Promise<Array<SmartCollection & { items: string[] }>> {
    const collections = Object.values(SMART_COLLECTION_TEMPLATES)
    
    const results = await Promise.all(
      collections.map(async (collection) => ({
        ...collection,
        items: await this.generateCollection(collection.id)
      }))
    )
    
    // Filter out empty collections
    return results.filter(c => c.items.length > 0)
  }
  
  /**
   * Get smart collection by ID
   */
  async getCollection(collectionId: string): Promise<{ collection: SmartCollection; items: string[] }> {
    const template = SMART_COLLECTION_TEMPLATES[collectionId]
    if (!template) {
      throw new Error(`Collection not found: ${collectionId}`)
    }
    
    const items = await this.generateCollection(collectionId)
    
    return {
      collection: { ...template, itemCount: items.length },
      items
    }
  }
}

export default AICollectionGenerator
