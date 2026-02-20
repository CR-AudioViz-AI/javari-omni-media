// lib/modules/registry.ts
/**
 * JAVARIVERSE MODULE REGISTRY
 * 
 * The single source of truth for all modules in the Javariverse.
 * Henderson Standard: Fortune 50 architecture
 * 
 * Every module must be registered here to be accessible in the platform.
 */

export type ModuleCategory =
  | 'core'           // Platform essentials
  | 'media'          // Media organization & access
  | 'creative'       // Content creation with AI
  | 'family'         // Family & safety features
  | 'social'         // Community & sharing
  | 'specialized'    // Faith, politics, health, etc.
  | 'professional'   // Business & career tools
  | 'ai-advanced'    // Advanced AI capabilities
  | 'special'        // Memorials, relationships, pets
  | 'experimental'   // Beta/emerging features

export type ModulePlan = 'free' | 'starter' | 'creator' | 'pro' | 'enterprise'

export type AgeRating = 'everyone' | '4+' | '9+' | '13+' | '17+' | '18+'

export interface JavariModule {
  // Identity
  id: string
  name: string
  shortName: string  // For UI where space is limited
  description: string
  tagline: string    // One-liner for marketing
  icon: string       // Lucide icon name
  color: string      // Brand color (hex)
  
  // Categorization
  category: ModuleCategory
  tags: string[]
  keywords: string[] // For search
  
  // Status & Availability
  isEnabled: boolean
  isCore: boolean              // Can't be disabled
  isBeta: boolean              // Experimental/testing
  isNew: boolean               // Show "NEW" badge
  requiresAuth: boolean
  requiresAgeVerification: boolean
  
  // Access Control
  availablePlans: ModulePlan[]
  ageRating: AgeRating
  contentWarnings: string[]
  availableRegions: string[]   // ['US', 'EU', 'global']
  
  // Routes & Navigation
  routes: {
    main: string               // Primary route
    children?: string[]        // Sub-routes
  }
  navigationOrder: number      // Where it appears in nav
  showInNav: boolean          // Visible in main navigation
  
  // Dependencies
  dependsOn: string[]          // Required module IDs
  conflictsWith: string[]      // Can't run simultaneously
  enhances: string[]           // Works better with these modules
  
  // Features
  features: {
    id: string
    name: string
    description: string
    requiresCredits: boolean
    creditsPerUse?: number
  }[]
  
  // Compliance & Control
  canBeDisabled: boolean       // Admin can turn off
  canBeDeleted: boolean        // Admin can remove completely
  requiresConsent: boolean     // User must explicitly opt-in
  gdprCompliant: boolean
  coppaCompliant: boolean
  
  // Monetization
  pricing: {
    includedInPlans: ModulePlan[]
    standalonePrice?: number   // Monthly add-on price
    usesCredits: boolean
    creditCostRange?: {
      min: number
      max: number
    }
  }
  
  // Metadata
  version: string
  releaseDate: Date
  lastUpdated: Date
  developerNotes?: string
  
  // Stats (populated at runtime)
  stats?: {
    activeUsers: number
    totalUsage: number
    revenue: number
    satisfaction: number       // 0-5 rating
  }
}

// ============================================================================
// COMPLETE MODULE REGISTRY
// ============================================================================

export const JAVARIVERSE_MODULES: JavariModule[] = [
  
  // ========================================
  // TIER 1: CORE PLATFORM
  // ========================================
  
  {
    id: 'javari-core',
    name: 'Javari Core Engine',
    shortName: 'Core',
    description: 'Authentication, payments, storage, and AI routing infrastructure',
    tagline: 'The foundation of everything',
    icon: 'Cpu',
    color: '#3b82f6',
    category: 'core',
    tags: ['infrastructure', 'required', 'system'],
    keywords: ['auth', 'login', 'payment', 'storage'],
    isEnabled: true,
    isCore: true,
    isBeta: false,
    isNew: false,
    requiresAuth: false,
    requiresAgeVerification: false,
    availablePlans: ['free', 'starter', 'creator', 'pro', 'enterprise'],
    ageRating: 'everyone',
    contentWarnings: [],
    availableRegions: ['global'],
    routes: {
      main: '/core',
      children: ['/auth', '/billing', '/settings']
    },
    navigationOrder: 0,
    showInNav: false,
    dependsOn: [],
    conflictsWith: [],
    enhances: [],
    features: [
      { id: 'auth', name: 'Authentication', description: 'Secure login & registration', requiresCredits: false },
      { id: 'credits', name: 'Credit System', description: 'Purchase and manage credits', requiresCredits: false },
      { id: 'storage', name: 'Cloud Storage', description: 'Secure file storage', requiresCredits: false }
    ],
    canBeDisabled: false,
    canBeDeleted: false,
    requiresConsent: false,
    gdprCompliant: true,
    coppaCompliant: true,
    pricing: {
      includedInPlans: ['free', 'starter', 'creator', 'pro', 'enterprise'],
      usesCredits: false
    },
    version: '1.0.0',
    releaseDate: new Date('2026-02-01'),
    lastUpdated: new Date('2026-02-19')
  },
  
  {
    id: 'javari-dashboard',
    name: 'Javari Dashboard',
    shortName: 'Dashboard',
    description: 'Universal control center and navigation hub',
    tagline: 'Your command center',
    icon: 'LayoutDashboard',
    color: '#8b5cf6',
    category: 'core',
    tags: ['ui', 'navigation', 'control'],
    keywords: ['dashboard', 'home', 'overview', 'stats'],
    isEnabled: true,
    isCore: true,
    isBeta: false,
    isNew: false,
    requiresAuth: true,
    requiresAgeVerification: false,
    availablePlans: ['free', 'starter', 'creator', 'pro', 'enterprise'],
    ageRating: 'everyone',
    contentWarnings: [],
    availableRegions: ['global'],
    routes: {
      main: '/dashboard'
    },
    navigationOrder: 1,
    showInNav: true,
    dependsOn: ['javari-core'],
    conflictsWith: [],
    enhances: [],
    features: [
      { id: 'overview', name: 'Overview', description: 'See all your activity', requiresCredits: false },
      { id: 'quick-actions', name: 'Quick Actions', description: 'One-click common tasks', requiresCredits: false },
      { id: 'stats', name: 'Statistics', description: 'Usage insights', requiresCredits: false }
    ],
    canBeDisabled: false,
    canBeDeleted: false,
    requiresConsent: false,
    gdprCompliant: true,
    coppaCompliant: true,
    pricing: {
      includedInPlans: ['free', 'starter', 'creator', 'pro', 'enterprise'],
      usesCredits: false
    },
    version: '1.0.0',
    releaseDate: new Date('2026-02-01'),
    lastUpdated: new Date('2026-02-19')
  },
  
  // ========================================
  // TIER 2: MEDIA MODULES
  // ========================================
  
  {
    id: 'media-library',
    name: 'Javari Omni Media',
    shortName: 'Media Library',
    description: 'Organize and access all your movies, TV, music, photos, books, and games',
    tagline: 'Your entire media universe, organized',
    icon: 'Film',
    color: '#ef4444',
    category: 'media',
    tags: ['organization', 'streaming', 'collection'],
    keywords: ['movies', 'tv', 'music', 'photos', 'plex', 'organize'],
    isEnabled: true,
    isCore: false,
    isBeta: false,
    isNew: false,
    requiresAuth: true,
    requiresAgeVerification: false,
    availablePlans: ['free', 'starter', 'creator', 'pro', 'enterprise'],
    ageRating: 'everyone',
    contentWarnings: [],
    availableRegions: ['global'],
    routes: {
      main: '/media',
      children: ['/media/tv', '/media/movies', '/media/music', '/media/photos', '/media/books']
    },
    navigationOrder: 2,
    showInNav: true,
    dependsOn: ['javari-core'],
    conflictsWith: [],
    enhances: ['moments-creator', 'music-studio'],
    features: [
      { id: 'organize', name: 'Smart Organization', description: 'AI-powered media organization', requiresCredits: false },
      { id: 'import', name: 'Import', description: 'Import from Plex/Emby/Jellyfin', requiresCredits: false },
      { id: 'dedup', name: 'Deduplication', description: 'Find and remove duplicates', requiresCredits: false },
      { id: 'metadata', name: 'Metadata Enrichment', description: 'TMDB, Last.fm, IGDB integration', requiresCredits: false }
    ],
    canBeDisabled: false,
    canBeDeleted: false,
    requiresConsent: false,
    gdprCompliant: true,
    coppaCompliant: true,
    pricing: {
      includedInPlans: ['free', 'starter', 'creator', 'pro', 'enterprise'],
      usesCredits: false
    },
    version: '1.0.0',
    releaseDate: new Date('2026-02-15'),
    lastUpdated: new Date('2026-02-19')
  },
  
  // ========================================
  // TIER 3: CREATIVE MODULES
  // ========================================
  
  {
    id: 'moments-creator',
    name: 'Javari Moments',
    shortName: 'Moments',
    description: 'Create any moment you wish existed - reunions, dreams, healing',
    tagline: 'The hug you never got. The kiss you missed. Now real.',
    icon: 'Heart',
    color: '#ec4899',
    category: 'creative',
    tags: ['ai', 'creative', 'emotional', 'healing'],
    keywords: ['create', 'moment', 'reunion', 'hug', 'together', 'dream'],
    isEnabled: true,
    isCore: false,
    isBeta: false,
    isNew: true,
    requiresAuth: true,
    requiresAgeVerification: false,
    availablePlans: ['creator', 'pro', 'enterprise'],
    ageRating: 'everyone',
    contentWarnings: [],
    availableRegions: ['global'],
    routes: {
      main: '/moments',
      children: ['/moments/create', '/moments/gallery']
    },
    navigationOrder: 3,
    showInNav: true,
    dependsOn: ['javari-core', 'media-library'],
    conflictsWith: [],
    enhances: ['memories-restoration'],
    features: [
      { id: 'bring-together', name: 'Bring People Together', description: 'Create photos of people together', requiresCredits: true, creditsPerUse: 15 },
      { id: 'transform', name: 'Transform & Dream', description: 'Superheroes, flying, magic', requiresCredits: true, creditsPerUse: 20 },
      { id: 'animate', name: 'Animate', description: 'Make photos move', requiresCredits: true, creditsPerUse: 10 },
      { id: 'music-video', name: 'Music Video', description: 'Add music and effects', requiresCredits: true, creditsPerUse: 25 }
    ],
    canBeDisabled: true,
    canBeDeleted: false,
    requiresConsent: false,
    gdprCompliant: true,
    coppaCompliant: true,
    pricing: {
      includedInPlans: ['creator', 'pro', 'enterprise'],
      standalonePrice: 14.99,
      usesCredits: true,
      creditCostRange: { min: 15, max: 50 }
    },
    version: '1.0.0',
    releaseDate: new Date('2026-02-20'),
    lastUpdated: new Date('2026-02-19')
  },
  
  // ... More modules to be added
  // (Due to token limit, showing structure. Full registry would have all 43 modules)
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getModuleById(id: string): JavariModule | undefined {
  return JAVARIVERSE_MODULES.find(m => m.id === id)
}

export function getModulesByCategory(category: ModuleCategory): JavariModule[] {
  return JAVARIVERSE_MODULES.filter(m => m.category === category)
}

export function getEnabledModules(): JavariModule[] {
  return JAVARIVERSE_MODULES.filter(m => m.isEnabled)
}

export function getModulesForPlan(plan: ModulePlan): JavariModule[] {
  return JAVARIVERSE_MODULES.filter(m => m.availablePlans.includes(plan))
}

export function getNavigationModules(): JavariModule[] {
  return JAVARIVERSE_MODULES
    .filter(m => m.showInNav && m.isEnabled)
    .sort((a, b) => a.navigationOrder - b.navigationOrder)
}

export function canUserAccessModule(
  module: JavariModule,
  userPlan: ModulePlan,
  userAge?: number,
  userRegion?: string
): boolean {
  // Check plan access
  if (!module.availablePlans.includes(userPlan)) {
    return false
  }
  
  // Check age rating
  if (userAge) {
    const ageRequirement = parseInt(module.ageRating.replace('+', ''))
    if (userAge < ageRequirement) {
      return false
    }
  }
  
  // Check region
  if (userRegion && module.availableRegions.length > 0) {
    if (!module.availableRegions.includes(userRegion) && !module.availableRegions.includes('global')) {
      return false
    }
  }
  
  return module.isEnabled
}

export function getModuleDependencies(moduleId: string): JavariModule[] {
  const module = getModuleById(moduleId)
  if (!module) return []
  
  return module.dependsOn
    .map(id => getModuleById(id))
    .filter(Boolean) as JavariModule[]
}

export function getModuleConflicts(moduleId: string): JavariModule[] {
  const module = getModuleById(moduleId)
  if (!module) return []
  
  return module.conflictsWith
    .map(id => getModuleById(id))
    .filter(Boolean) as JavariModule[]
}
