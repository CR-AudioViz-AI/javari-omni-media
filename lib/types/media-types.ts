// lib/types/media-types.ts
/**
 * COMPLETE MEDIA TYPE DEFINITIONS
 * 
 * Includes ALL content types from Plex:
 * - Standard media (movies, TV, music)
 * - Personal content (home videos, photos with faces)
 * - Special categories (adult, foreign, karaoke, etc.)
 */

export type MediaType = 
  // Standard Media
  | 'movie'
  | 'tv-show'
  | 'music'
  | 'audiobook'
  | 'podcast'
  
  // Personal Content (WITH FACES)
  | 'home-video'           // Personal family videos
  | 'home-video-faces'     // Home videos with identified faces
  | 'personal-movie'       // Personal movies/productions
  | 'personal-tv'          // Personal TV shows/series
  | 'music-video-personal' // Personal music videos
  
  // Photos (WITH FACES)
  | 'photo'
  | 'photo-faces'          // Photos with identified faces
  | 'photo-event'          // Event photos (weddings, parties)
  
  // Video Categories
  | 'cartoon'
  | 'documentary'
  | 'comedy'
  | 'foreign-film'
  | 'foreign-tv'
  | 'music-video'
  | 'foreign-music-video'
  | 'commercial'
  | 'karaoke'
  | 'speech'
  | 'stock-video'
  
  // Audio Categories
  | 'radio'
  | 'foreign-radio'
  | 'world-music'
  | 'foreign-audiobook'
  
  // Adult Content (18+)
  | 'adult-movie'
  | 'adult-tv'
  
  // Other
  | 'book'
  | 'comic'
  | 'game'
  | 'other'

export interface MediaCategory {
  id: string
  name: string
  type: MediaType
  icon: string
  description: string
  plexPath?: string
  requiresAgeVerification?: boolean
  supportsFaceRecognition?: boolean
  isPersonalContent?: boolean
}

export const MEDIA_CATEGORIES: MediaCategory[] = [
  
  // ========================================
  // PERSONAL CONTENT (Top Priority)
  // ========================================
  
  {
    id: 'home-videos',
    name: 'Home Videos',
    type: 'home-video',
    icon: 'Video',
    description: 'Personal family videos and home movies',
    plexPath: '/media/HomeVideos',
    supportsFaceRecognition: true,
    isPersonalContent: true
  },
  
  {
    id: 'home-videos-faces',
    name: 'Home Videos (With Faces)',
    type: 'home-video-faces',
    icon: 'Users',
    description: 'Home videos with identified family members',
    supportsFaceRecognition: true,
    isPersonalContent: true
  },
  
  {
    id: 'personal-movies',
    name: 'Personal Movies',
    type: 'personal-movie',
    icon: 'Film',
    description: 'Personal movie productions with family/friends',
    supportsFaceRecognition: true,
    isPersonalContent: true
  },
  
  {
    id: 'personal-tv-shows',
    name: 'Personal TV Shows',
    type: 'personal-tv',
    icon: 'Tv',
    description: 'Personal TV series with family/friends',
    supportsFaceRecognition: true,
    isPersonalContent: true
  },
  
  {
    id: 'personal-music-videos',
    name: 'Personal Music Videos',
    type: 'music-video-personal',
    icon: 'Music',
    description: 'Personal music videos featuring family/friends',
    supportsFaceRecognition: true,
    isPersonalContent: true
  },
  
  {
    id: 'photos',
    name: 'Photos',
    type: 'photo',
    icon: 'Image',
    description: 'Family photos and memories',
    plexPath: '/media/Photos',
    supportsFaceRecognition: true,
    isPersonalContent: true
  },
  
  {
    id: 'photos-faces',
    name: 'Photos (With Faces)',
    type: 'photo-faces',
    icon: 'Users',
    description: 'Photos with identified people',
    supportsFaceRecognition: true,
    isPersonalContent: true
  },
  
  // ========================================
  // STANDARD MEDIA
  // ========================================
  
  {
    id: 'movies',
    name: 'Movies',
    type: 'movie',
    icon: 'Film',
    description: 'Feature films and movies',
    plexPath: '/media/Movies'
  },
  
  {
    id: 'tv-shows',
    name: 'TV Shows',
    type: 'tv-show',
    icon: 'Tv',
    description: 'Television series and episodes',
    plexPath: '/media/TV'
  },
  
  {
    id: 'music',
    name: 'Music',
    type: 'music',
    icon: 'Music',
    description: 'Music albums and tracks',
    plexPath: '/media/Music'
  },
  
  {
    id: 'audiobooks',
    name: 'Audiobooks',
    type: 'audiobook',
    icon: 'Headphones',
    description: 'Audio books and spoken content',
    plexPath: '/media/Audiobooks'
  },
  
  {
    id: 'podcasts',
    name: 'Podcasts',
    type: 'podcast',
    icon: 'Mic',
    description: 'Podcast episodes',
  },
  
  // ========================================
  // VIDEO CATEGORIES
  // ========================================
  
  {
    id: 'cartoons',
    name: 'Cartoons',
    type: 'cartoon',
    icon: 'Smile',
    description: 'Animated shows and movies',
    plexPath: '/media/Cartoons'
  },
  
  {
    id: 'documentaries',
    name: 'Documentaries',
    type: 'documentary',
    icon: 'FileText',
    description: 'Documentary films',
    plexPath: '/media/Documentaries'
  },
  
  {
    id: 'comedy',
    name: 'Comedy',
    type: 'comedy',
    icon: 'Laugh',
    description: 'Comedy specials and standup',
    plexPath: '/media/Comedy'
  },
  
  {
    id: 'foreign-films',
    name: 'Foreign Films',
    type: 'foreign-film',
    icon: 'Globe',
    description: 'International cinema',
    plexPath: '/media/Foreign Films'
  },
  
  {
    id: 'foreign-tv',
    name: 'Foreign TV',
    type: 'foreign-tv',
    icon: 'Globe',
    description: 'International television',
    plexPath: '/media/Foreign TV'
  },
  
  {
    id: 'music-videos',
    name: 'Music Videos',
    type: 'music-video',
    icon: 'Music',
    description: 'Professional music videos',
    plexPath: '/media/MusicVideos'
  },
  
  {
    id: 'foreign-music-videos',
    name: 'Foreign Music Videos',
    type: 'foreign-music-video',
    icon: 'Globe',
    description: 'International music videos',
    plexPath: '/media/Foreign Music Videos'
  },
  
  {
    id: 'commercials',
    name: 'Commercials',
    type: 'commercial',
    icon: 'Megaphone',
    description: 'TV commercials and ads',
    plexPath: '/media/Commercials'
  },
  
  {
    id: 'karaoke',
    name: 'Karaoke',
    type: 'karaoke',
    icon: 'Mic',
    description: 'Karaoke tracks',
    plexPath: '/media/Karaoke'
  },
  
  {
    id: 'speeches',
    name: 'Speeches',
    type: 'speech',
    icon: 'MessageSquare',
    description: 'Speeches and talks',
  },
  
  {
    id: 'stock-video',
    name: 'Stock Video',
    type: 'stock-video',
    icon: 'Video',
    description: 'Stock footage and b-roll',
  },
  
  // ========================================
  // AUDIO CATEGORIES
  // ========================================
  
  {
    id: 'radio',
    name: 'Radio',
    type: 'radio',
    icon: 'Radio',
    description: 'Radio shows and broadcasts',
  },
  
  {
    id: 'foreign-radio',
    name: 'Foreign Radio',
    type: 'foreign-radio',
    icon: 'Globe',
    description: 'International radio content',
  },
  
  {
    id: 'world-music',
    name: 'World Music',
    type: 'world-music',
    icon: 'Globe',
    description: 'International music',
  },
  
  {
    id: 'foreign-audiobooks',
    name: 'Foreign Audiobooks',
    type: 'foreign-audiobook',
    icon: 'Globe',
    description: 'Audiobooks in other languages',
  },
  
  // ========================================
  // ADULT CONTENT (18+)
  // ========================================
  
  {
    id: 'adult-movies',
    name: 'Adult Movies',
    type: 'adult-movie',
    icon: 'Film',
    description: 'Adult films (18+)',
    plexPath: '/media/Adult/Movies',
    requiresAgeVerification: true
  },
  
  {
    id: 'adult-tv',
    name: 'Adult TV',
    type: 'adult-tv',
    icon: 'Tv',
    description: 'Adult television (18+)',
    plexPath: '/media/Adult/TV',
    requiresAgeVerification: true
  },
  
  // ========================================
  // OTHER
  // ========================================
  
  {
    id: 'books',
    name: 'Books',
    type: 'book',
    icon: 'Book',
    description: 'E-books and digital books'
  },
  
  {
    id: 'comics',
    name: 'Comics',
    type: 'comic',
    icon: 'BookOpen',
    description: 'Comic books and graphic novels'
  },
  
  {
    id: 'games',
    name: 'Games',
    type: 'game',
    icon: 'Gamepad',
    description: 'Video games'
  }
]

// Helper functions
export function getCategoryById(id: string): MediaCategory | undefined {
  return MEDIA_CATEGORIES.find(cat => cat.id === id)
}

export function getCategoriesByType(type: MediaType): MediaCategory[] {
  return MEDIA_CATEGORIES.filter(cat => cat.type === type)
}

export function getPersonalCategories(): MediaCategory[] {
  return MEDIA_CATEGORIES.filter(cat => cat.isPersonalContent)
}

export function getCategoriesWithFaceRecognition(): MediaCategory[] {
  return MEDIA_CATEGORIES.filter(cat => cat.supportsFaceRecognition)
}

export function getAdultCategories(): MediaCategory[] {
  return MEDIA_CATEGORIES.filter(cat => cat.requiresAgeVerification)
}
