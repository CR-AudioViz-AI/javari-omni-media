// lib/access-control/permissions-manager.ts
/**
 * JAVARI OMNI MEDIA - ACCESS CONTROL & PERMISSIONS
 * 
 * COMPLETE CONTROL over who sees what:
 * - User roles (admin, family, guest)
 * - Library restrictions (movies only, TV only, etc.)
 * - Content ratings (G, PG, PG-13, R, etc.)
 * - Age-based filtering
 * - Time-based access (bedtime mode)
 * - Remote vs local access control
 * - Device restrictions
 * - Bandwidth limits
 * 
 * Better than Plex's managed users - more granular, more powerful.
 */

import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// ============================================================================
// TYPES
// ============================================================================

export type UserRole = 'admin' | 'family' | 'friend' | 'guest' | 'restricted'

export type AccessType = 'local' | 'remote' | 'both'

export type ContentRating = 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17' | 'TV-Y' | 'TV-Y7' | 'TV-G' | 'TV-PG' | 'TV-14' | 'TV-MA' | 'NR'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  isPinProtected: boolean
  pin?: string // Encrypted
  parentId?: string // For child accounts
  createdAt: Date
  lastLogin?: Date
}

export interface AccessRestrictions {
  userId: string
  
  // Library access
  allowedCategories: string[] // ['movies', 'tv-shows'] or empty for all
  blockedCategories: string[] // ['adult-movies']
  
  // Content ratings
  maxRating: ContentRating // Max rating they can see
  blockedRatings: ContentRating[] // Specific ratings to block
  
  // Access type
  accessType: AccessType // local, remote, or both
  allowedIPs?: string[] // Whitelist specific IPs
  blockedIPs?: string[] // Blacklist specific IPs
  requireVPN?: boolean // Must use VPN for remote access
  
  // Time restrictions
  timeRestrictions?: TimeRestriction[]
  
  // Device restrictions
  maxDevices?: number // Max concurrent streams
  allowedDevices?: string[] // Device IDs
  blockedDevices?: string[]
  
  // Bandwidth
  maxBitrate?: number // kbps
  maxResolution?: string // '1080p', '720p', etc.
  
  // Features
  canDownload: boolean
  canShare: boolean
  canCreateCollections: boolean
  canEditMetadata: boolean
  canDeleteContent: boolean
  canInviteUsers: boolean
  
  // Parental controls
  requirePinForRatedContent: boolean
  hideAdultContent: boolean
  filterSearchResults: boolean
  showWatchHistory: boolean // Parent can see what kid watches
}

export interface TimeRestriction {
  type: 'bedtime' | 'screen_time' | 'schedule'
  
  // Bedtime mode
  bedtimeStart?: string // "21:00"
  bedtimeEnd?: string // "07:00"
  
  // Screen time limits
  maxMinutesPerDay?: number
  maxMinutesPerWeek?: number
  resetTime?: string // "00:00" (when daily limit resets)
  
  // Schedule (e.g., "only on weekends")
  allowedDays?: number[] // [0, 6] for Sunday and Saturday
  allowedHours?: { start: string; end: string }[]
}

export interface AccessAttempt {
  userId: string
  contentId: string
  contentType: string
  contentRating: string
  timestamp: Date
  allowed: boolean
  reason?: string // Why blocked
  deviceId: string
  ipAddress: string
  location?: string
}

// ============================================================================
// PERMISSIONS MANAGER
// ============================================================================

export class PermissionsManager {
  private supabase: ReturnType<typeof createClient>
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  
  // ==========================================================================
  // USER MANAGEMENT
  // ==========================================================================
  
  /**
   * Create a new user with default restrictions
   */
  async createUser(
    email: string,
    name: string,
    role: UserRole,
    parentId?: string
  ): Promise<UserProfile> {
    console.log(`[PermissionsManager] Creating user: ${name} (${role})`)
    
    // Create user profile
    const { data: user, error } = await this.supabase
      .from('user_profiles')
      .insert({
        email,
        name,
        role,
        parent_id: parentId,
        is_pin_protected: role === 'restricted'
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create user: ${error.message}`)
    }
    
    // Create default restrictions based on role
    await this.setDefaultRestrictions(user.id, role)
    
    return this.mapUserProfile(user)
  }
  
  /**
   * Set default restrictions based on role
   */
  private async setDefaultRestrictions(userId: string, role: UserRole): Promise<void> {
    const defaults: Record<UserRole, Partial<AccessRestrictions>> = {
      admin: {
        allowedCategories: [],
        blockedCategories: [],
        maxRating: 'NC-17',
        accessType: 'both',
        canDownload: true,
        canShare: true,
        canCreateCollections: true,
        canEditMetadata: true,
        canDeleteContent: true,
        canInviteUsers: true,
        requirePinForRatedContent: false,
        hideAdultContent: false,
        filterSearchResults: false,
        showWatchHistory: true
      },
      family: {
        allowedCategories: [],
        blockedCategories: ['adult-movies', 'adult-tv'],
        maxRating: 'R',
        accessType: 'both',
        canDownload: true,
        canShare: true,
        canCreateCollections: true,
        canEditMetadata: false,
        canDeleteContent: false,
        canInviteUsers: false,
        requirePinForRatedContent: false,
        hideAdultContent: true,
        filterSearchResults: true,
        showWatchHistory: true
      },
      friend: {
        allowedCategories: [],
        blockedCategories: ['adult-movies', 'adult-tv'],
        maxRating: 'R',
        accessType: 'remote',
        maxDevices: 2,
        canDownload: false,
        canShare: false,
        canCreateCollections: true,
        canEditMetadata: false,
        canDeleteContent: false,
        canInviteUsers: false,
        requirePinForRatedContent: false,
        hideAdultContent: true,
        filterSearchResults: true,
        showWatchHistory: false
      },
      guest: {
        allowedCategories: ['movies', 'tv-shows'],
        blockedCategories: ['adult-movies', 'adult-tv', 'home-videos'],
        maxRating: 'PG-13',
        accessType: 'local',
        maxDevices: 1,
        canDownload: false,
        canShare: false,
        canCreateCollections: false,
        canEditMetadata: false,
        canDeleteContent: false,
        canInviteUsers: false,
        requirePinForRatedContent: false,
        hideAdultContent: true,
        filterSearchResults: true,
        showWatchHistory: false
      },
      restricted: {
        allowedCategories: ['movies', 'tv-shows', 'cartoons'],
        blockedCategories: ['adult-movies', 'adult-tv'],
        maxRating: 'PG',
        accessType: 'local',
        maxDevices: 1,
        timeRestrictions: [{
          type: 'bedtime',
          bedtimeStart: '21:00',
          bedtimeEnd: '07:00'
        }, {
          type: 'screen_time',
          maxMinutesPerDay: 120,
          resetTime: '00:00'
        }],
        canDownload: false,
        canShare: false,
        canCreateCollections: false,
        canEditMetadata: false,
        canDeleteContent: false,
        canInviteUsers: false,
        requirePinForRatedContent: true,
        hideAdultContent: true,
        filterSearchResults: true,
        showWatchHistory: true
      }
    }
    
    await this.supabase
      .from('access_restrictions')
      .insert({
        user_id: userId,
        ...defaults[role]
      })
  }
  
  // ==========================================================================
  // ACCESS CHECKING
  // ==========================================================================
  
  /**
   * Check if user can access specific content
   */
  async canAccessContent(
    userId: string,
    contentId: string,
    context: {
      deviceId: string
      ipAddress: string
      isLocal: boolean
    }
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Get user restrictions
    const { data: restrictions } = await this.supabase
      .from('access_restrictions')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (!restrictions) {
      return { allowed: false, reason: 'No restrictions found' }
    }
    
    // Get content metadata
    const { data: content } = await this.supabase
      .from('media_files')
      .select(`
        *,
        media_metadata (
          content_rating
        )
      `)
      .eq('id', contentId)
      .single()
    
    if (!content) {
      return { allowed: false, reason: 'Content not found' }
    }
    
    // Check 1: Category restrictions
    if (restrictions.blocked_categories?.includes(content.category_id)) {
      return { allowed: false, reason: 'Category blocked' }
    }
    
    if (restrictions.allowed_categories?.length > 0 && 
        !restrictions.allowed_categories.includes(content.category_id)) {
      return { allowed: false, reason: 'Category not allowed' }
    }
    
    // Check 2: Rating restrictions
    const contentRating = content.media_metadata?.[0]?.content_rating
    if (contentRating && !this.isRatingAllowed(contentRating, restrictions)) {
      return { allowed: false, reason: `Rating ${contentRating} not allowed` }
    }
    
    // Check 3: Access type (local vs remote)
    if (context.isLocal && restrictions.access_type === 'remote') {
      return { allowed: false, reason: 'Remote access only' }
    }
    if (!context.isLocal && restrictions.access_type === 'local') {
      return { allowed: false, reason: 'Local access only' }
    }
    
    // Check 4: IP restrictions
    if (restrictions.allowed_ips?.length > 0 && 
        !restrictions.allowed_ips.includes(context.ipAddress)) {
      return { allowed: false, reason: 'IP not whitelisted' }
    }
    if (restrictions.blocked_ips?.includes(context.ipAddress)) {
      return { allowed: false, reason: 'IP blocked' }
    }
    
    // Check 5: Device restrictions
    if (restrictions.allowed_devices?.length > 0 && 
        !restrictions.allowed_devices.includes(context.deviceId)) {
      return { allowed: false, reason: 'Device not authorized' }
    }
    if (restrictions.blocked_devices?.includes(context.deviceId)) {
      return { allowed: false, reason: 'Device blocked' }
    }
    
    // Check 6: Time restrictions
    const timeCheck = await this.checkTimeRestrictions(userId, restrictions)
    if (!timeCheck.allowed) {
      return timeCheck
    }
    
    // Check 7: Concurrent device limit
    if (restrictions.max_devices) {
      const activeDevices = await this.getActiveDeviceCount(userId)
      if (activeDevices >= restrictions.max_devices) {
        return { allowed: false, reason: 'Maximum devices reached' }
      }
    }
    
    // Log access attempt
    await this.logAccessAttempt({
      userId,
      contentId,
      contentType: content.category_id,
      contentRating: contentRating || 'NR',
      timestamp: new Date(),
      allowed: true,
      deviceId: context.deviceId,
      ipAddress: context.ipAddress
    })
    
    return { allowed: true }
  }
  
  /**
   * Check if a rating is allowed for user
   */
  private isRatingAllowed(
    contentRating: ContentRating,
    restrictions: any
  ): boolean {
    // Check if specifically blocked
    if (restrictions.blocked_ratings?.includes(contentRating)) {
      return false
    }
    
    // Check against max rating
    const ratingOrder: ContentRating[] = [
      'G', 'PG', 'PG-13', 'R', 'NC-17',
      'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'
    ]
    
    const contentIndex = ratingOrder.indexOf(contentRating)
    const maxIndex = ratingOrder.indexOf(restrictions.max_rating)
    
    if (contentIndex === -1 || maxIndex === -1) {
      return true // Unknown rating, allow
    }
    
    return contentIndex <= maxIndex
  }
  
  /**
   * Check time-based restrictions
   */
  private async checkTimeRestrictions(
    userId: string,
    restrictions: any
  ): Promise<{ allowed: boolean; reason?: string }> {
    if (!restrictions.time_restrictions || restrictions.time_restrictions.length === 0) {
      return { allowed: true }
    }
    
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const currentDay = now.getDay()
    
    for (const restriction of restrictions.time_restrictions) {
      // Check bedtime
      if (restriction.type === 'bedtime') {
        if (this.isInTimeRange(currentTime, restriction.bedtime_start, restriction.bedtime_end)) {
          return { allowed: false, reason: 'Bedtime - access restricted' }
        }
      }
      
      // Check screen time limits
      if (restriction.type === 'screen_time') {
        const todayMinutes = await this.getTodayScreenTime(userId)
        if (todayMinutes >= restriction.max_minutes_per_day) {
          return { allowed: false, reason: 'Daily screen time limit reached' }
        }
      }
      
      // Check schedule
      if (restriction.type === 'schedule') {
        if (restriction.allowed_days && !restriction.allowed_days.includes(currentDay)) {
          return { allowed: false, reason: 'Not allowed on this day' }
        }
      }
    }
    
    return { allowed: true }
  }
  
  /**
   * Check if current time is within a range
   */
  private isInTimeRange(current: string, start: string, end: string): boolean {
    if (start < end) {
      return current >= start && current <= end
    } else {
      // Handles overnight ranges (e.g., 21:00 to 07:00)
      return current >= start || current <= end
    }
  }
  
  /**
   * Get today's screen time for user
   */
  private async getTodayScreenTime(userId: string): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data } = await this.supabase
      .from('watch_history')
      .select('watched_seconds')
      .eq('user_id', userId)
      .gte('started_at', today.toISOString())
    
    if (!data) return 0
    
    const totalSeconds = data.reduce((sum, w) => sum + (w.watched_seconds || 0), 0)
    return Math.floor(totalSeconds / 60)
  }
  
  /**
   * Get active device count for user
   */
  private async getActiveDeviceCount(userId: string): Promise<number> {
    // Get active sessions in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    const { data } = await this.supabase
      .from('active_sessions')
      .select('device_id')
      .eq('user_id', userId)
      .gte('last_activity', fiveMinutesAgo.toISOString())
    
    if (!data) return 0
    
    // Count unique devices
    return new Set(data.map(s => s.device_id)).size
  }
  
  // ==========================================================================
  // CONTENT FILTERING
  // ==========================================================================
  
  /**
   * Filter content based on user restrictions
   */
  async filterContent(
    userId: string,
    contentIds: string[]
  ): Promise<string[]> {
    const { data: restrictions } = await this.supabase
      .from('access_restrictions')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (!restrictions) return contentIds
    
    // Get all content metadata
    const { data: content } = await this.supabase
      .from('media_files')
      .select(`
        id,
        category_id,
        media_metadata (content_rating)
      `)
      .in('id', contentIds)
    
    if (!content) return []
    
    // Filter based on restrictions
    return content
      .filter(item => {
        // Category filter
        if (restrictions.blocked_categories?.includes(item.category_id)) {
          return false
        }
        if (restrictions.allowed_categories?.length > 0 && 
            !restrictions.allowed_categories.includes(item.category_id)) {
          return false
        }
        
        // Rating filter
        const rating = item.media_metadata?.[0]?.content_rating
        if (rating && !this.isRatingAllowed(rating, restrictions)) {
          return false
        }
        
        return true
      })
      .map(item => item.id)
  }
  
  // ==========================================================================
  // ADMIN FUNCTIONS
  // ==========================================================================
  
  /**
   * Update user restrictions
   */
  async updateRestrictions(
    userId: string,
    restrictions: Partial<AccessRestrictions>
  ): Promise<void> {
    await this.supabase
      .from('access_restrictions')
      .update(restrictions)
      .eq('user_id', userId)
    
    console.log(`[PermissionsManager] Updated restrictions for user: ${userId}`)
  }
  
  /**
   * Get user restrictions
   */
  async getRestrictions(userId: string): Promise<AccessRestrictions | null> {
    const { data } = await this.supabase
      .from('access_restrictions')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    return data
  }
  
  /**
   * Log access attempt
   */
  private async logAccessAttempt(attempt: AccessAttempt): Promise<void> {
    await this.supabase
      .from('access_attempts')
      .insert(attempt)
  }
  
  /**
   * Get access logs for user
   */
  async getAccessLogs(
    userId: string,
    limit: number = 100
  ): Promise<AccessAttempt[]> {
    const { data } = await this.supabase
      .from('access_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit)
    
    return data || []
  }
  
  // ==========================================================================
  // HELPERS
  // ==========================================================================
  
  private mapUserProfile(data: any): UserProfile {
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      avatar: data.avatar,
      isPinProtected: data.is_pin_protected,
      pin: data.pin,
      parentId: data.parent_id,
      createdAt: new Date(data.created_at),
      lastLogin: data.last_login ? new Date(data.last_login) : undefined
    }
  }
}

export default PermissionsManager
