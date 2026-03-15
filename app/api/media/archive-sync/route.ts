// app/api/media/archive-sync/route.ts
// Triggers the public domain archive sync worker
// Date: March 13, 2026 | Henderson Standard

import { NextRequest, NextResponse } from 'next/server'
import { runArchiveSync } from '@/workers/archive-sync'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  // Simple token check — in production, use platform auth
  const auth = req.headers.get('authorization')
  if (!auth?.includes('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runArchiveSync()
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Sync failed' }, { status: 500 })
  }
}
