// app/api/library/scan/route.ts
/**
 * API ENDPOINT: Library Scan
 * 
 * Starts a library scan for a user's media directory.
 * Returns immediately with job ID for progress tracking.
 */

import { NextRequest, NextResponse } from 'next/server'
import { LibraryScanner } from '@/lib/scanner/library-scanner'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Request validation schema
const ScanRequestSchema = z.object({
  path: z.string().min(1),
  categoryId: z.string().min(1),
  recursive: z.boolean().optional().default(true),
  parallel: z.number().min(1).max(16).optional().default(4)
})

export async function POST(request: NextRequest) {
  try {
    // Get user from session (from craudiovizai.com)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = ScanRequestSchema.parse(body)
    
    // Create scanner
    const scanner = new LibraryScanner(user.id, validatedData.categoryId)
    
    // Start scan in background (fire and forget)
    const scanPromise = scanner.scan({
      path: validatedData.path,
      categoryId: validatedData.categoryId,
      userId: user.id,
      recursive: validatedData.recursive,
      parallel: validatedData.parallel,
      onProgress: async (progress) => {
        // TODO: Send progress via WebSocket or polling endpoint
        console.log(`[API] Scan progress: ${progress.processedFiles}/${progress.totalFiles}`)
      }
    })
    
    // Don't await - return immediately with job ID
    const jobId = `scan_${Date.now()}_${user.id}`
    
    // Store scan job in database for tracking
    await supabase.from('scan_jobs').insert({
      id: jobId,
      user_id: user.id,
      category_id: validatedData.categoryId,
      path: validatedData.path,
      status: 'running',
      started_at: new Date().toISOString()
    })
    
    // Handle completion in background
    scanPromise.then(async (result) => {
      await supabase.from('scan_jobs').update({
        status: 'completed',
        total_files: result.totalFiles,
        processed_files: result.processedFiles,
        errors: result.errors,
        completed_at: new Date().toISOString()
      }).eq('id', jobId)
    }).catch(async (error) => {
      await supabase.from('scan_jobs').update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      }).eq('id', jobId)
    })
    
    return NextResponse.json({
      success: true,
      jobId,
      message: 'Scan started successfully'
    })
    
  } catch (error: any) {
    console.error('[API] Scan error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    // Get job ID from query params
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    
    if (!jobId) {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 })
    }
    
    // Get scan job status
    const { data: job, error } = await supabase
      .from('scan_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()
    
    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      job
    })
    
  } catch (error: any) {
    console.error('[API] Status error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
