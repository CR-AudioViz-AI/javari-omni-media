// lib/modules/lifestyle-identity-modules.ts
/**
 * LIFESTYLE & IDENTITY MODULES
 * 
 * Radical inclusion: Every person, every identity, every dream is welcome.
 * With proper safety controls to protect everyone.
 */

import { JavariModule } from './registry'

export const LIFESTYLE_IDENTITY_MODULES: JavariModule[] = [
  
  // ========================================
  // LGBTQIA+ MODULES
  // ========================================
  
  {
    id: 'pride-community',
    name: 'Pride Community Hub',
    shortName: 'Pride Hub',
    description: 'LGBTQIA+ community, resources, events, support, and celebration',
    tagline: 'Your rainbow family awaits',
    icon: 'Rainbow',
    color: '#ff0080',
    category: 'specialized',
    tags: ['lgbtqia', 'community', 'pride', 'support', 'inclusive'],
    keywords: ['gay', 'lesbian', 'bisexual', 'transgender', 'queer', 'pride', 'lgbtq'],
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
      main: '/pride',
      children: ['/pride/community', '/pride/resources', '/pride/events']
    },
    navigationOrder: 20,
    showInNav: true,
    dependsOn: ['javari-core'],
    conflictsWith: [],
    enhances: ['javari-social'],
    features: [
      { id: 'community', name: 'Safe Community', description: 'Connect with LGBTQIA+ community', requiresCredits: false },
      { id: 'resources', name: 'Resources', description: 'Mental health, legal, support resources', requiresCredits: false },
      { id: 'events', name: 'Events', description: 'Pride events, meetups, celebrations', requiresCredits: false },
      { id: 'ally', name: 'Ally Resources', description: 'How to support LGBTQIA+ community', requiresCredits: false }
    ],
    canBeDisabled: false, // LGBTQIA+ content is core to inclusion
    canBeDeleted: false,
    requiresConsent: false,
    gdprCompliant: true,
    coppaCompliant: true,
    pricing: {
      includedInPlans: ['free', 'starter', 'creator', 'pro', 'enterprise'],
      usesCredits: false
    },
    version: '1.0.0',
    releaseDate: new Date('2026-02-20'),
    lastUpdated: new Date('2026-02-20')
  },
  
  // ========================================
  // RACIAL & CULTURAL MODULES
  // ========================================
  
  {
    id: 'black-excellence',
    name: 'Black Excellence Hub',
    shortName: 'Black Excellence',
    description: 'Celebrate Black culture, history, achievements, and community',
    tagline: 'Our stories, our voices, our power',
    icon: 'Users',
    color: '#000000',
    category: 'specialized',
    tags: ['black', 'african-american', 'culture', 'community', 'excellence'],
    keywords: ['black', 'african american', 'culture', 'history', 'community'],
    isEnabled: true,
    isCore: false,
    isBeta: false,
    isNew: false,
    requiresAuth: false,
    requiresAgeVerification: false,
    availablePlans: ['free', 'starter', 'creator', 'pro', 'enterprise'],
    ageRating: 'everyone',
    contentWarnings: [],
    availableRegions: ['global'],
    routes: {
      main: '/black-excellence',
      children: ['/black-excellence/culture', '/black-excellence/history', '/black-excellence/business']
    },
    navigationOrder: 21,
    showInNav: true,
    dependsOn: ['javari-core'],
    conflictsWith: [],
    enhances: [],
    features: [
      { id: 'culture', name: 'Cultural Celebration', description: 'Music, art, literature, fashion', requiresCredits: false },
      { id: 'history', name: 'History & Education', description: 'Learn Black history and achievements', requiresCredits: false },
      { id: 'business', name: 'Black Business Directory', description: 'Support Black-owned businesses', requiresCredits: false },
      { id: 'mentorship', name: 'Mentorship', description: 'Connect for career & personal growth', requiresCredits: false }
    ],
    canBeDisabled: false, // Racial equality content is core
    canBeDeleted: false,
    requiresConsent: false,
    gdprCompliant: true,
    coppaCompliant: true,
    pricing: {
      includedInPlans: ['free', 'starter', 'creator', 'pro', 'enterprise'],
      usesCredits: false
    },
    version: '1.0.0',
    releaseDate: new Date('2026-02-20'),
    lastUpdated: new Date('2026-02-20')
  },
  
  {
    id: 'latino-cultura',
    name: 'Latino Cultura',
    shortName: 'Latino Cultura',
    description: 'Celebrate Latino/Hispanic culture, language, traditions, and community',
    tagline: 'Nuestra cultura, nuestra familia',
    icon: 'Globe',
    color: '#ff6b35',
    category: 'specialized',
    tags: ['latino', 'hispanic', 'culture', 'spanish', 'community'],
    keywords: ['latino', 'hispanic', 'mexican', 'puerto rican', 'spanish'],
    isEnabled: true,
    isCore: false,
    isBeta: false,
    isNew: false,
    requiresAuth: false,
    requiresAgeVerification: false,
    availablePlans: ['free', 'starter', 'creator', 'pro', 'enterprise'],
    ageRating: 'everyone',
    contentWarnings: [],
    availableRegions: ['global'],
    routes: {
      main: '/latino-cultura',
      children: ['/latino-cultura/music', '/latino-cultura/food', '/latino-cultura/traditions']
    },
    navigationOrder: 22,
    showInNav: true,
    dependsOn: ['javari-core'],
    conflictsWith: [],
    enhances: [],
    features: [
      { id: 'music', name: 'Music & Dance', description: 'Reggaeton, salsa, bachata, mariachi', requiresCredits: false },
      { id: 'food', name: 'Food & Recipes', description: 'Traditional recipes and cooking', requiresCredits: false },
      { id: 'language', name: 'Spanish Language', description: 'Learn and practice Spanish', requiresCredits: false },
      { id: 'traditions', name: 'Traditions', description: 'Celebrate cultural traditions', requiresCredits: false }
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
    releaseDate: new Date('2026-02-20'),
    lastUpdated: new Date('2026-02-20')
  },
  
  {
    id: 'asian-heritage',
    name: 'Asian Heritage Hub',
    shortName: 'Asian Heritage',
    description: 'Celebrate Asian cultures, traditions, and communities (East, South, Southeast)',
    tagline: 'Diverse cultures, one community',
    icon: 'Sparkles',
    color: '#ffd700',
    category: 'specialized',
    tags: ['asian', 'culture', 'heritage', 'community', 'diversity'],
    keywords: ['asian', 'chinese', 'indian', 'japanese', 'korean', 'vietnamese', 'filipino'],
    isEnabled: true,
    isCore: false,
    isBeta: false,
    isNew: false,
    requiresAuth: false,
    requiresAgeVerification: false,
    availablePlans: ['free', 'starter', 'creator', 'pro', 'enterprise'],
    ageRating: 'everyone',
    contentWarnings: [],
    availableRegions: ['global'],
    routes: {
      main: '/asian-heritage',
      children: ['/asian-heritage/culture', '/asian-heritage/food', '/asian-heritage/language']
    },
    navigationOrder: 23,
    showInNav: true,
    dependsOn: ['javari-core'],
    conflictsWith: [],
    enhances: [],
    features: [
      { id: 'culture', name: 'Cultural Traditions', description: 'Holidays, customs, celebrations', requiresCredits: false },
      { id: 'food', name: 'Asian Cuisine', description: 'Recipes from across Asia', requiresCredits: false },
      { id: 'language', name: 'Language Learning', description: 'Mandarin, Hindi, Japanese, Korean, etc.', requiresCredits: false },
      { id: 'arts', name: 'Arts & Crafts', description: 'Traditional and modern Asian arts', requiresCredits: false }
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
    releaseDate: new Date('2026-02-20'),
    lastUpdated: new Date('2026-02-20')
  },
  
  // ========================================
  // ADULT LIFESTYLE MODULES (18+)
  // ========================================
  
  {
    id: 'intimacy-wellness',
    name: 'Intimacy & Wellness',
    shortName: 'Intimacy',
    description: 'Sexual health, relationship intimacy, wellness education (18+)',
    tagline: 'Your intimate life, your way',
    icon: 'Heart',
    color: '#ff1493',
    category: 'specialized',
    tags: ['adult', 'intimacy', 'wellness', 'health', 'relationships'],
    keywords: ['sex', 'intimacy', 'wellness', 'relationship', 'health'],
    isEnabled: true,
    isCore: false,
    isBeta: false,
    isNew: false,
    requiresAuth: true,
    requiresAgeVerification: true,
    availablePlans: ['free', 'starter', 'creator', 'pro', 'enterprise'],
    ageRating: '18+',
    contentWarnings: ['adult-themes', 'sexual-health-content'],
    availableRegions: ['US', 'EU', 'global'],
    routes: {
      main: '/intimacy',
      children: ['/intimacy/education', '/intimacy/wellness', '/intimacy/community']
    },
    navigationOrder: 24,
    showInNav: true,
    dependsOn: ['javari-core', 'private-vault'],
    conflictsWith: ['kids-zone'],
    enhances: [],
    features: [
      { id: 'education', name: 'Sexual Education', description: 'Evidence-based sexual health info', requiresCredits: false },
      { id: 'wellness', name: 'Wellness Tools', description: 'Relationship & intimacy guidance', requiresCredits: false },
      { id: 'products', name: 'Wellness Products', description: 'Curated intimate wellness products', requiresCredits: false },
      { id: 'community', name: 'Safe Community', description: 'Anonymous support & discussion', requiresCredits: false }
    ],
    canBeDisabled: true,
    canBeDeleted: true,
    requiresConsent: true, // Must explicitly opt-in
    gdprCompliant: true,
    coppaCompliant: true,
    pricing: {
      includedInPlans: ['free', 'starter', 'creator', 'pro', 'enterprise'],
      usesCredits: false
    },
    version: '1.0.0',
    releaseDate: new Date('2026-02-20'),
    lastUpdated: new Date('2026-02-20')
  },
  
  {
    id: 'kink-lifestyle-safe',
    name: 'Alternative Lifestyle Community',
    shortName: 'Alt Lifestyle',
    description: 'BDSM/kink community with education, safety, and consent focus (18+)',
    tagline: 'Safe, sane, consensual',
    icon: 'Shield',
    color: '#8b0000',
    category: 'specialized',
    tags: ['adult', 'kink', 'bdsm', 'lifestyle', 'community', 'consent'],
    keywords: ['bdsm', 'kink', 'lifestyle', 'alternative', 'community'],
    isEnabled: true,
    isCore: false,
    isBeta: false,
    isNew: false,
    requiresAuth: true,
    requiresAgeVerification: true,
    availablePlans: ['creator', 'pro', 'enterprise'],
    ageRating: '18+',
    contentWarnings: ['adult-themes', 'alternative-lifestyle'],
    availableRegions: ['US', 'EU'],
    routes: {
      main: '/lifestyle',
      children: ['/lifestyle/education', '/lifestyle/safety', '/lifestyle/community']
    },
    navigationOrder: 25,
    showInNav: true,
    dependsOn: ['javari-core', 'private-vault'],
    conflictsWith: ['kids-zone', 'teen-space'],
    enhances: [],
    features: [
      { id: 'education', name: 'Safety Education', description: 'Consent, communication, safety', requiresCredits: false },
      { id: 'resources', name: 'Resources', description: 'Guides, tutorials, best practices', requiresCredits: false },
      { id: 'community', name: 'Community', description: 'Connect with lifestyle community', requiresCredits: false },
      { id: 'events', name: 'Events', description: 'Munches, workshops, conferences', requiresCredits: false }
    ],
    canBeDisabled: true,
    canBeDeleted: true,
    requiresConsent: true, // Must EXPLICITLY opt-in
    gdprCompliant: true,
    coppaCompliant: true,
    pricing: {
      includedInPlans: ['creator', 'pro', 'enterprise'],
      standalonePrice: 9.99,
      usesCredits: false
    },
    version: '1.0.0',
    releaseDate: new Date('2026-02-20'),
    lastUpdated: new Date('2026-02-20')
  },
  
  // ========================================
  // BODY POSITIVITY & ACCEPTANCE
  // ========================================
  
  {
    id: 'body-positive-community',
    name: 'Body Positive Community',
    shortName: 'Body Positive',
    description: 'Celebrate ALL bodies - every size, shape, ability, and appearance',
    tagline: 'Every body is beautiful',
    icon: 'Heart',
    color: '#ff69b4',
    category: 'specialized',
    tags: ['body-positive', 'self-love', 'acceptance', 'community'],
    keywords: ['body positive', 'plus size', 'body acceptance', 'self love'],
    isEnabled: true,
    isCore: false,
    isBeta: false,
    isNew: false,
    requiresAuth: false,
    requiresAgeVerification: false,
    availablePlans: ['free', 'starter', 'creator', 'pro', 'enterprise'],
    ageRating: 'everyone',
    contentWarnings: [],
    availableRegions: ['global'],
    routes: {
      main: '/body-positive',
      children: ['/body-positive/community', '/body-positive/resources']
    },
    navigationOrder: 26,
    showInNav: true,
    dependsOn: ['javari-core'],
    conflictsWith: [],
    enhances: ['mental-health'],
    features: [
      { id: 'community', name: 'Supportive Community', description: 'Connect with body-positive community', requiresCredits: false },
      { id: 'resources', name: 'Resources', description: 'Self-love, acceptance, mental health', requiresCredits: false },
      { id: 'fashion', name: 'Fashion & Style', description: 'Style for all bodies', requiresCredits: false },
      { id: 'fitness', name: 'Joyful Movement', description: 'Movement for health, not weight', requiresCredits: false }
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
    releaseDate: new Date('2026-02-20'),
    lastUpdated: new Date('2026-02-20')
  }
]
