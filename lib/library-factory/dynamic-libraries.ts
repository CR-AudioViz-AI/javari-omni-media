// lib/library-factory/dynamic-libraries.ts
/**
 * JAVARI OMNI MEDIA - DYNAMIC LIBRARY FACTORY
 * 
 * THE ULTIMATE EXTENSIBILITY:
 * - Traditional media (movies, TV, music)
 * - Special collections (commercials, logos, memes)
 * - Personal content (recipes, patterns, photos)
 * - Event-based (birthdays, funerals, parties)
 * - User-defined (anything they want)
 * 
 * NO COMPETITOR HAS THIS - infinite extensibility.
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// LIBRARY TEMPLATES
// ============================================================================

export const LIBRARY_TEMPLATES = {
  // MEDIA COLLECTIONS
  funny_commercials: {
    name: "Funny Commercials",
    icon: "😂",
    description: "Hilarious commercials and ads",
    category: "entertainment",
    defaultView: "grid",
    metadataFields: ["brand", "product", "year", "country", "campaign"],
    sortOptions: ["date_added", "brand", "year", "popularity"],
    autoTag: true,
    aiEnhanced: true
  },
  
  brand_logos: {
    name: "Brand Logos",
    icon: "🏷️",
    description: "Company logos and branding assets",
    category: "design",
    defaultView: "grid",
    metadataFields: ["company", "industry", "year_created", "designer", "format"],
    sortOptions: ["company", "industry", "year"],
    fileTypes: [".svg", ".png", ".ai", ".eps", ".pdf"],
    autoTag: true
  },
  
  memes: {
    name: "Meme Collection",
    icon: "🤣",
    description: "Viral memes and internet culture",
    category: "entertainment",
    defaultView: "masonry",
    metadataFields: ["meme_name", "origin", "year", "tags", "viral_score"],
    sortOptions: ["date_added", "viral_score", "meme_name"],
    autoTag: true,
    aiEnhanced: true,
    trending: true
  },
  
  vintage_commercials: {
    name: "Vintage Commercials",
    icon: "📺",
    description: "Classic commercials from past decades",
    category: "nostalgia",
    defaultView: "timeline",
    metadataFields: ["brand", "decade", "product_category", "country"],
    sortOptions: ["year", "brand", "decade"],
    autoTag: true
  },
  
  // CREATIVE PATTERNS
  sewing_patterns: {
    name: "Sewing Patterns",
    icon: "🧵",
    description: "Sewing and clothing patterns",
    category: "crafts",
    defaultView: "grid",
    metadataFields: ["pattern_type", "difficulty", "size_range", "designer", "fabric_type"],
    sortOptions: ["pattern_type", "difficulty", "date_added"],
    fileTypes: [".pdf", ".png", ".svg"],
    tags: ["beginner", "intermediate", "advanced", "kids", "adults"]
  },
  
  knitting_patterns: {
    name: "Knitting Patterns",
    icon: "🧶",
    description: "Knitting and crochet patterns",
    category: "crafts",
    defaultView: "grid",
    metadataFields: ["pattern_type", "yarn_weight", "difficulty", "designer"],
    sortOptions: ["pattern_type", "difficulty", "date_added"],
    fileTypes: [".pdf", ".png"]
  },
  
  woodworking_plans: {
    name: "Woodworking Plans",
    icon: "🪵",
    description: "Blueprints and woodworking projects",
    category: "crafts",
    defaultView: "list",
    metadataFields: ["project_type", "skill_level", "materials", "tools_needed", "time_estimate"],
    sortOptions: ["project_type", "skill_level", "date_added"],
    fileTypes: [".pdf", ".dwg", ".skp", ".png"]
  },
  
  // CULINARY
  recipes: {
    name: "Recipe Collection",
    icon: "👨‍🍳",
    description: "Cooking recipes and meal ideas",
    category: "culinary",
    defaultView: "grid",
    metadataFields: ["cuisine", "meal_type", "prep_time", "cook_time", "servings", "difficulty", "dietary"],
    sortOptions: ["cuisine", "meal_type", "prep_time", "date_added"],
    fileTypes: [".pdf", ".txt", ".md", ".png", ".jpg"],
    tags: ["vegetarian", "vegan", "gluten-free", "dairy-free", "keto", "quick", "slow-cooker"],
    smartFilters: ["under_30_min", "easy", "family_friendly"]
  },
  
  cocktail_recipes: {
    name: "Cocktail Recipes",
    icon: "🍹",
    description: "Drink recipes and mixology",
    category: "culinary",
    defaultView: "grid",
    metadataFields: ["drink_type", "base_spirit", "difficulty", "glass_type", "garnish"],
    sortOptions: ["drink_type", "base_spirit", "date_added"],
    tags: ["classic", "tiki", "sour", "stirred", "shaken"]
  },
  
  // EVENTS & MEMORIES
  birthday_slideshows: {
    name: "Birthday Slideshows",
    icon: "🎂",
    description: "Birthday celebration photo slideshows",
    category: "events",
    defaultView: "timeline",
    metadataFields: ["person_name", "birthday_year", "age", "theme", "duration"],
    sortOptions: ["person_name", "birthday_year", "date_created"],
    autoGenerateSlideshow: true,
    musicOptions: true,
    transitionEffects: true
  },
  
  funeral_tributes: {
    name: "Memorial Tributes",
    icon: "🕊️",
    description: "Respectful memorial slideshows",
    category: "events",
    defaultView: "list",
    metadataFields: ["person_name", "birth_year", "passing_year", "theme", "music"],
    sortOptions: ["person_name", "date_created"],
    autoGenerateSlideshow: true,
    themes: ["peaceful", "celebratory", "religious", "nature"],
    musicOptions: true,
    privateByDefault: true
  },
  
  wedding_memories: {
    name: "Wedding Collections",
    icon: "💒",
    description: "Wedding photos and videos",
    category: "events",
    defaultView: "timeline",
    metadataFields: ["couple_names", "wedding_date", "venue", "photographer"],
    sortOptions: ["wedding_date", "couple_names"],
    autoGenerateSlideshow: true,
    faceRecognition: true
  },
  
  family_reunions: {
    name: "Family Reunions",
    icon: "👨‍👩‍👧‍👦",
    description: "Family gathering photos and videos",
    category: "events",
    defaultView: "grid",
    metadataFields: ["event_date", "location", "family_branch", "attendees"],
    sortOptions: ["event_date", "location"],
    faceRecognition: true,
    autoGenerateSlideshow: true
  },
  
  anniversary_celebrations: {
    name: "Anniversary Collections",
    icon: "💝",
    description: "Anniversary photos through the years",
    category: "events",
    defaultView: "timeline",
    metadataFields: ["couple_names", "anniversary_year", "years_together", "theme"],
    sortOptions: ["anniversary_year", "years_together"],
    autoGenerateSlideshow: true
  },
  
  // HOBBIES & INTERESTS
  comic_books: {
    name: "Comic Book Collection",
    icon: "📚",
    description: "Comic books and graphic novels",
    category: "hobbies",
    defaultView: "grid",
    metadataFields: ["publisher", "series", "issue_number", "year", "grade", "value"],
    sortOptions: ["series", "issue_number", "publisher", "year"],
    fileTypes: [".cbr", ".cbz", ".pdf"],
    tags: ["marvel", "dc", "independent", "manga"]
  },
  
  video_game_media: {
    name: "Gaming Media",
    icon: "🎮",
    description: "Game trailers, walkthroughs, streams",
    category: "hobbies",
    defaultView: "grid",
    metadataFields: ["game_title", "platform", "genre", "content_type"],
    sortOptions: ["game_title", "platform", "date_added"],
    tags: ["walkthrough", "review", "speedrun", "lets-play"]
  },
  
  sports_highlights: {
    name: "Sports Highlights",
    icon: "⚽",
    description: "Game highlights and sports clips",
    category: "hobbies",
    defaultView: "list",
    metadataFields: ["sport", "team", "player", "event_date", "tournament"],
    sortOptions: ["sport", "event_date", "team"],
    autoTag: true
  },
  
  // EDUCATIONAL
  tutorials: {
    name: "Tutorial Videos",
    icon: "🎓",
    description: "How-to videos and learning content",
    category: "educational",
    defaultView: "list",
    metadataFields: ["topic", "skill_level", "duration", "instructor", "software"],
    sortOptions: ["topic", "skill_level", "date_added"],
    tags: ["beginner", "intermediate", "advanced"]
  },
  
  language_learning: {
    name: "Language Learning",
    icon: "🗣️",
    description: "Language courses and practice materials",
    category: "educational",
    defaultView: "list",
    metadataFields: ["language", "proficiency_level", "content_type", "duration"],
    sortOptions: ["language", "proficiency_level", "date_added"],
    tags: ["audio", "video", "text", "interactive"]
  },
  
  // PROFESSIONAL
  presentation_templates: {
    name: "Presentation Templates",
    icon: "📊",
    description: "PowerPoint/Keynote templates",
    category: "professional",
    defaultView: "grid",
    metadataFields: ["template_type", "industry", "style", "slide_count"],
    sortOptions: ["template_type", "industry", "date_added"],
    fileTypes: [".pptx", ".key", ".pdf"]
  },
  
  stock_footage: {
    name: "Stock Footage",
    icon: "🎬",
    description: "Stock video clips for projects",
    category: "professional",
    defaultView: "grid",
    metadataFields: ["category", "resolution", "framerate", "duration", "license_type"],
    sortOptions: ["category", "resolution", "date_added"],
    tags: ["4k", "hd", "slow_motion", "time_lapse"]
  },
  
  music_production: {
    name: "Music Production",
    icon: "🎵",
    description: "Loops, samples, and production files",
    category: "professional",
    defaultView: "list",
    metadataFields: ["instrument", "bpm", "key", "genre", "duration"],
    sortOptions: ["instrument", "bpm", "genre"],
    fileTypes: [".wav", ".mp3", ".flac", ".midi"]
  },
  
  // NOSTALGIC
  vintage_tv_clips: {
    name: "Vintage TV Clips",
    icon: "📼",
    description: "Classic TV moments and clips",
    category: "nostalgia",
    defaultView: "timeline",
    metadataFields: ["show_name", "decade", "network", "genre"],
    sortOptions: ["decade", "show_name", "date_added"],
    autoTag: true
  },
  
  retro_games: {
    name: "Retro Game Collection",
    icon: "🕹️",
    description: "Classic video game media",
    category: "nostalgia",
    defaultView: "grid",
    metadataFields: ["console", "year", "genre", "developer"],
    sortOptions: ["console", "year", "game_title"],
    tags: ["nes", "snes", "genesis", "arcade"]
  },
  
  // ARTISTIC
  digital_art: {
    name: "Digital Art Collection",
    icon: "🎨",
    description: "Digital artwork and illustrations",
    category: "artistic",
    defaultView: "masonry",
    metadataFields: ["artist", "medium", "style", "year", "resolution"],
    sortOptions: ["artist", "style", "date_added"],
    fileTypes: [".png", ".jpg", ".psd", ".ai"],
    highRes: true
  },
  
  photography_portfolio: {
    name: "Photography Portfolio",
    icon: "📷",
    description: "Professional photography collection",
    category: "artistic",
    defaultView: "masonry",
    metadataFields: ["photographer", "location", "camera", "lens", "genre"],
    sortOptions: ["photographer", "date_taken", "location"],
    exifData: true,
    highRes: true
  }
}

// ============================================================================
// DYNAMIC LIBRARY FACTORY
// ============================================================================

export class LibraryFactory {
  private supabase: ReturnType<typeof createClient>
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  
  /**
   * Create a new library from template
   */
  async createLibrary(
    userId: string,
    templateId: keyof typeof LIBRARY_TEMPLATES,
    customName?: string
  ): Promise<any> {
    const template = LIBRARY_TEMPLATES[templateId]
    
    console.log(`[LibraryFactory] Creating library: ${template.name}`)
    
    // Create category in database
    const { data: category, error } = await this.supabase
      .from('media_categories')
      .insert({
        id: `${userId}_${templateId}_${Date.now()}`,
        name: customName || template.name,
        type: 'custom',
        icon: template.icon,
        description: template.description,
        is_enabled: true,
        is_core: false,
        metadata: {
          template: templateId,
          ...template
        },
        created_by: userId
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create library: ${error.message}`)
    }
    
    console.log(`[LibraryFactory] Created library: ${category.id}`)
    
    return category
  }
  
  /**
   * Create a custom library (user-defined)
   */
  async createCustomLibrary(
    userId: string,
    name: string,
    icon: string,
    description: string,
    options: {
      metadataFields?: string[]
      sortOptions?: string[]
      fileTypes?: string[]
      tags?: string[]
      defaultView?: 'grid' | 'list' | 'timeline' | 'masonry'
    }
  ): Promise<any> {
    console.log(`[LibraryFactory] Creating custom library: ${name}`)
    
    const { data: category, error } = await this.supabase
      .from('media_categories')
      .insert({
        id: `${userId}_custom_${Date.now()}`,
        name,
        type: 'custom',
        icon,
        description,
        is_enabled: true,
        is_core: false,
        metadata: {
          template: 'custom',
          category: 'user_defined',
          defaultView: options.defaultView || 'grid',
          metadataFields: options.metadataFields || [],
          sortOptions: options.sortOptions || ['date_added', 'name'],
          fileTypes: options.fileTypes || [],
          tags: options.tags || []
        },
        created_by: userId
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create custom library: ${error.message}`)
    }
    
    console.log(`[LibraryFactory] Created custom library: ${category.id}`)
    
    return category
  }
  
  /**
   * Get all available library templates
   */
  getAvailableTemplates(): any[] {
    return Object.entries(LIBRARY_TEMPLATES).map(([id, template]) => ({
      id,
      ...template
    }))
  }
  
  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): any[] {
    return Object.entries(LIBRARY_TEMPLATES)
      .filter(([_, template]) => template.category === category)
      .map(([id, template]) => ({ id, ...template }))
  }
  
  /**
   * Get popular templates
   */
  async getPopularTemplates(): Promise<any[]> {
    // Get most created templates
    const { data } = await this.supabase
      .from('media_categories')
      .select('metadata')
      .eq('type', 'custom')
    
    if (!data) return []
    
    // Count template usage
    const counts: Record<string, number> = {}
    data.forEach(cat => {
      const templateId = cat.metadata?.template
      if (templateId && templateId !== 'custom') {
        counts[templateId] = (counts[templateId] || 0) + 1
      }
    })
    
    // Sort by usage
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => ({
        id,
        ...LIBRARY_TEMPLATES[id as keyof typeof LIBRARY_TEMPLATES],
        userCount: counts[id]
      }))
  }
  
  /**
   * Search templates
   */
  searchTemplates(query: string): any[] {
    const lowerQuery = query.toLowerCase()
    
    return Object.entries(LIBRARY_TEMPLATES)
      .filter(([id, template]) =>
        template.name.toLowerCase().includes(lowerQuery) ||
        template.description.toLowerCase().includes(lowerQuery) ||
        template.category.toLowerCase().includes(lowerQuery) ||
        template.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
      .map(([id, template]) => ({ id, ...template }))
  }
}

export default LibraryFactory
