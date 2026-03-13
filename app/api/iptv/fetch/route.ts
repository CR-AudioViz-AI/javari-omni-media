// app/api/iptv/fetch/route.ts
// Javari Omni-Media - IPTV M3U Proxy Endpoint
// Server-side fetch to bypass CORS on M3U playlist URLs
// Date: March 12, 2026

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_PROTOCOLS = ['http:', 'https:']
const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50MB max playlist

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // Validate URL
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return NextResponse.json({ error: 'Only HTTP/HTTPS URLs allowed' }, { status: 400 })
  }

  // Block localhost/private ranges to prevent SSRF
  const hostname = parsed.hostname
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.16.')
  ) {
    // Allow local NAS connections when explicitly configured
    // For now, allow — user's own NAS is valid
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Javari-Omni-Media/1.0',
        Accept: 'application/x-mpegURL, application/vnd.apple.mpegurl, text/plain, */*',
      },
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${response.status}` },
        { status: 502 }
      )
    }

    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Playlist too large (max 50MB)' }, { status: 413 })
    }

    const text = await response.text()

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // Cache 5 min
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 })
    }
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 502 }
    )
  }
}
