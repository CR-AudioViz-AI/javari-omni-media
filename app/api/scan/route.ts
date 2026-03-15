// app/api/scan/route.ts
// Library Scanner — thin proxy to craudiovizai.com platform scan worker
// NO direct filesystem access. NO direct TMDB calls. NO local processing.
// Platform handles: file discovery, metadata fetch, caching, normalization.
// Date: March 13, 2026 | Henderson Standard

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PLATFORM_API = process.env.NEXT_PUBLIC_PLATFORM_URL
  ? `${process.env.NEXT_PUBLIC_PLATFORM_URL}/api`
  : 'https://craudiovizai.com/api'

export async function POST(req: NextRequest) {
  try {
    const { folderPath, libraryType, fetchMetadata = true, maxItems = 500 } = await req.json()

    if (!folderPath) {
      return NextResponse.json({ error: 'Missing folderPath' }, { status: 400 })
    }

    // Delegate entirely to platform scan worker
    const platformRes = await fetch(`${PLATFORM_API}/media/library/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.get('authorization')
          ? { 'Authorization': req.headers.get('authorization')! }
          : {}),
      },
      body: JSON.stringify({ folderPath, type: libraryType, fetchMetadata, maxItems }),
      signal: AbortSignal.timeout(60000), // Scans can take time
    })

    if (!platformRes.ok) {
      return NextResponse.json({
        success: false,
        error: `Platform scan failed: ${platformRes.status}`,
        suggestion: 'Ensure the platform is running and the folder path is accessible from the platform server.',
      })
    }

    const data = await platformRes.json()
    return NextResponse.json(data)

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Scan request failed'
    return NextResponse.json({
      success: false,
      error: message,
      suggestion: 'Check that the craudiovizai.com platform is reachable.',
    }, { status: 200 })
  }
}
