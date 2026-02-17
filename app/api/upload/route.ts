import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabase, STORAGE_BUCKETS } from '@/lib/supabase'
import { 
  extractBasicFileInfo, 
  extractMetadataFromFilename, 
  generateProperFilename,
  extractAudioMetadata
} from '@/lib/metadata-extractor'
import { searchMovie, searchTVShow } from '@/lib/tmdb-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabaseAuth = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabaseAuth.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Step 1: Extract basic file information
    const basicInfo = extractBasicFileInfo(file.name, file.size)
    
    // Step 2: Extract metadata from filename
    const filenameMetadata = extractMetadataFromFilename(file.name)
    
    // Step 3: Process file based on type
    let enrichedMetadata = { ...filenameMetadata }
    
    // For audio files, extract ID3 tags
    if (basicInfo.mediaType === 'music') {
      try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const audioMetadata = await extractAudioMetadata(buffer)
        enrichedMetadata = { ...enrichedMetadata, ...audioMetadata }
      } catch (error) {
        console.error('Error extracting audio metadata:', error)
      }
    }
    
    // For movies/TV, fetch TMDB data
    if (basicInfo.mediaType === 'movie' && filenameMetadata.title) {
      const tmdbData = await searchMovie(
        filenameMetadata.title as string,
        filenameMetadata.year as number | undefined
      )
      
      if (tmdbData) {
        enrichedMetadata.tmdb_id = tmdbData.id
        enrichedMetadata.title = tmdbData.title
        enrichedMetadata.year = new Date(tmdbData.release_date).getFullYear()
        enrichedMetadata.overview = tmdbData.overview
        enrichedMetadata.poster_path = tmdbData.poster_path
        enrichedMetadata.backdrop_path = tmdbData.backdrop_path
        enrichedMetadata.runtime = tmdbData.runtime
      }
    }
    
    if (basicInfo.mediaType === 'tv_episode' && filenameMetadata.title) {
      const tmdbData = await searchTVShow(
        filenameMetadata.title as string,
        filenameMetadata.year as number | undefined
      )
      
      if (tmdbData) {
        enrichedMetadata.tvdb_id = tmdbData.id
        enrichedMetadata.title = tmdbData.name
        enrichedMetadata.overview = tmdbData.overview
        enrichedMetadata.poster_path = tmdbData.poster_path
        enrichedMetadata.backdrop_path = tmdbData.backdrop_path
      }
    }
    
    // Step 4: Generate proper filename
    const properFilename = generateProperFilename(
      file.name,
      basicInfo.mediaType,
      enrichedMetadata
    )
    
    // Step 5: Determine storage bucket
    const bucketMap: Record<string, string> = {
      'movie': STORAGE_BUCKETS.MOVIES,
      'tv_episode': STORAGE_BUCKETS.TV_SHOWS,
      'music': STORAGE_BUCKETS.MUSIC,
      'photo': STORAGE_BUCKETS.PHOTOS,
      'comic': STORAGE_BUCKETS.COMICS,
      'magazine': STORAGE_BUCKETS.MAGAZINES,
      'ebook': STORAGE_BUCKETS.EBOOKS,
      'document': STORAGE_BUCKETS.DOCUMENTS
    }
    
    const bucket = bucketMap[basicInfo.mediaType] || STORAGE_BUCKETS.DOCUMENTS
    const filePath = `${userId}/${Date.now()}-${properFilename}`
    
    // Step 6: Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file to storage', details: uploadError.message },
        { status: 500 }
      )
    }
    
    // Step 7: Save metadata to database
    const { data: mediaItem, error: dbError } = await supabase
      .from('media_items')
      .insert({
        user_id: userId,
        type: basicInfo.mediaType,
        title: enrichedMetadata.title || file.name,
        original_filename: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        metadata: enrichedMetadata
      })
      .select()
      .single()
    
    if (dbError) {
      console.error('Database insert error:', dbError)
      
      // Rollback storage upload
      await supabase.storage.from(bucket).remove([filePath])
      
      return NextResponse.json(
        { error: 'Failed to save metadata to database', details: dbError.message },
        { status: 500 }
      )
    }
    
    // Step 8: Return success response
    return NextResponse.json({
      success: true,
      mediaItem: {
        id: mediaItem.id,
        type: basicInfo.mediaType,
        title: enrichedMetadata.title || file.name,
        originalFilename: file.name,
        properFilename,
        filePath: uploadData.path,
        fileSize: file.size,
        metadata: enrichedMetadata,
        bucket
      }
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
