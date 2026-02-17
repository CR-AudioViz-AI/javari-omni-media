import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface MediaItem {
  id: string
  user_id: string
  type: 'movie' | 'tv_episode' | 'music' | 'photo' | 'comic' | 'magazine' | 'ebook' | 'document'
  title: string
  original_filename: string
  file_path: string
  file_size: number
  metadata: {
    year?: number
    season?: number
    episode?: number
    artist?: string
    album?: string
    tmdb_id?: number
    tvdb_id?: number
    duration?: number
    resolution?: string
    codec?: string
  }
  created_at: string
  updated_at: string
}

export interface UploadProgress {
  id: string
  user_id: string
  filename: string
  status: 'uploading' | 'processing' | 'complete' | 'error'
  progress: number
  error_message?: string
  created_at: string
}

// Supabase Storage bucket names
export const STORAGE_BUCKETS = {
  MOVIES: 'movies',
  TV_SHOWS: 'tv-shows',
  MUSIC: 'music',
  PHOTOS: 'photos',
  COMICS: 'comics',
  MAGAZINES: 'magazines',
  EBOOKS: 'ebooks',
  DOCUMENTS: 'documents',
  TEMP: 'temp-uploads'
} as const
