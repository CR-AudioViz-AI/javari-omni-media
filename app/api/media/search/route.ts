// app/api/media/search/route.ts
// Javari Omni-Media — Universal Media Search API
// Searches public domain + FAST platform links
// No copyrighted content is hosted or served by this API.
// Date: March 13, 2026 | Henderson Standard

import { NextRequest, NextResponse } from 'next/server'
import { universalSearch } from '@/lib/media/universal-search'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''
  const type = searchParams.get('type') || 'any'
  const legal_only = searchParams.get('legal_only') === 'true'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  if (!query.trim()) {
    return NextResponse.json({ error: 'Missing query parameter q' }, { status: 400 })
  }

  const results = await universalSearch({
    query,
    type: type as 'movie' | 'tv' | 'any',
    legal_only,
    limit,
  })

  return NextResponse.json(results)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const results = await universalSearch(body)
    return NextResponse.json(results)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Search failed' }, { status: 500 })
  }
}
