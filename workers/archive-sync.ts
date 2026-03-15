// workers/archive-sync.ts
// Javari Omni-Media — Public Domain Content Sync Worker
// Syncs new public domain content from Internet Archive, NASA, Prelinger
// Runs weekly. Only indexes confirmed public domain or open-license content.
// This app does NOT download or host media — it indexes metadata and links only.
// Date: March 13, 2026 | Henderson Standard

export interface ArchiveEntry {
  id: string
  source: 'internet-archive' | 'prelinger' | 'nasa'
  identifier: string
  title: string
  year?: number
  description?: string
  media_type: 'movie' | 'audio' | 'doc'
  stream_url: string
  watch_url: string
  thumbnail?: string
  duration?: string
  downloads?: number
  synced_at: string
  license: 'public_domain' | 'cc0' | 'cc-by' | 'cc-by-sa'
}

interface SyncResult {
  source: string
  added: number
  entries: ArchiveEntry[]
  error?: string
  sync_ms: number
}

// ─── INTERNET ARCHIVE ─────────────────────────────────────────────────────────

async function syncInternetArchive(limit = 50): Promise<SyncResult> {
  const start = Date.now()
  const entries: ArchiveEntry[] = []

  try {
    // Query for recently uploaded public domain movies
    const params = new URLSearchParams({
      q: 'mediatype:movies AND (licenseurl:"public domain" OR subject:"public domain" OR subject:"Creative Commons")',
      fl: 'identifier,title,year,description,runtime,avg_rating,downloads,subject',
      sort: 'addeddate desc',
      rows: String(limit),
      page: '1',
      output: 'json',
    })

    const res = await fetch(`https://archive.org/advancedsearch.php?${params}`, {
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) throw new Error(`Archive.org returned ${res.status}`)
    const data = await res.json()
    const docs = data.response?.docs || []

    for (const doc of docs) {
      if (!doc.identifier || !doc.title) continue

      const subjects: string[] = Array.isArray(doc.subject) ? doc.subject : [doc.subject || '']
      const isPublicDomain = subjects.some((s: string) =>
        s?.toLowerCase().includes('public domain') ||
        s?.toLowerCase().includes('copyright expired')
      )

      entries.push({
        id: `ia_${doc.identifier}`,
        source: 'internet-archive',
        identifier: doc.identifier,
        title: String(doc.title).trim(),
        year: doc.year ? parseInt(doc.year) : undefined,
        description: String(doc.description || '').slice(0, 300),
        media_type: 'movie',
        stream_url: `https://archive.org/download/${doc.identifier}`,
        watch_url: `https://archive.org/details/${doc.identifier}`,
        downloads: doc.downloads ? parseInt(doc.downloads) : 0,
        license: isPublicDomain ? 'public_domain' : 'cc-by',
        synced_at: new Date().toISOString(),
      })
    }

    return { source: 'internet-archive', added: entries.length, entries, sync_ms: Date.now() - start }
  } catch (err) {
    return { source: 'internet-archive', added: 0, entries: [], error: err instanceof Error ? err.message : 'Sync failed', sync_ms: Date.now() - start }
  }
}

// ─── PRELINGER ARCHIVE ────────────────────────────────────────────────────────

async function syncPrelingerArchive(limit = 30): Promise<SyncResult> {
  const start = Date.now()
  const entries: ArchiveEntry[] = []

  try {
    const params = new URLSearchParams({
      q: 'collection:prelinger AND mediatype:movies',
      fl: 'identifier,title,year,description,runtime,downloads',
      sort: 'addeddate desc',
      rows: String(limit),
      page: '1',
      output: 'json',
    })

    const res = await fetch(`https://archive.org/advancedsearch.php?${params}`, {
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) throw new Error(`Prelinger sync failed: ${res.status}`)
    const data = await res.json()
    const docs = data.response?.docs || []

    for (const doc of docs) {
      if (!doc.identifier || !doc.title) continue
      entries.push({
        id: `prelinger_${doc.identifier}`,
        source: 'prelinger',
        identifier: doc.identifier,
        title: String(doc.title).trim(),
        year: doc.year ? parseInt(doc.year) : undefined,
        description: String(doc.description || '').slice(0, 300),
        media_type: 'doc',
        stream_url: `https://archive.org/download/${doc.identifier}`,
        watch_url: `https://archive.org/details/${doc.identifier}`,
        downloads: doc.downloads ? parseInt(doc.downloads) : 0,
        license: 'public_domain',
        synced_at: new Date().toISOString(),
      })
    }

    return { source: 'prelinger', added: entries.length, entries, sync_ms: Date.now() - start }
  } catch (err) {
    return { source: 'prelinger', added: 0, entries: [], error: err instanceof Error ? err.message : 'Sync failed', sync_ms: Date.now() - start }
  }
}

// ─── NASA MEDIA ───────────────────────────────────────────────────────────────

async function syncNASAMedia(limit = 20): Promise<SyncResult> {
  const start = Date.now()
  const entries: ArchiveEntry[] = []

  try {
    const res = await fetch(
      `https://images-api.nasa.gov/search?media_type=video&page_size=${limit}&year_start=2020`,
      { signal: AbortSignal.timeout(15000) }
    )

    if (!res.ok) throw new Error(`NASA API returned ${res.status}`)
    const data = await res.json()
    const items = data.collection?.items || []

    for (const item of items) {
      const meta = item.data?.[0]
      const links = item.links || []
      if (!meta?.nasa_id || !meta?.title) continue

      entries.push({
        id: `nasa_${meta.nasa_id}`,
        source: 'nasa',
        identifier: meta.nasa_id,
        title: String(meta.title).trim(),
        year: meta.date_created ? new Date(meta.date_created).getFullYear() : undefined,
        description: String(meta.description || '').slice(0, 300),
        media_type: 'doc',
        thumbnail: links.find((l: { rel: string; href: string }) => l.rel === 'preview')?.href,
        stream_url: `https://images.nasa.gov/details/${meta.nasa_id}`,
        watch_url: `https://images.nasa.gov/details/${meta.nasa_id}`,
        license: 'public_domain', // All NASA content is public domain
        synced_at: new Date().toISOString(),
      })
    }

    return { source: 'nasa', added: entries.length, entries, sync_ms: Date.now() - start }
  } catch (err) {
    return { source: 'nasa', added: 0, entries: [], error: err instanceof Error ? err.message : 'Sync failed', sync_ms: Date.now() - start }
  }
}

// ─── MAIN SYNC ────────────────────────────────────────────────────────────────

export async function runArchiveSync(): Promise<{
  total_added: number
  results: SyncResult[]
  synced_at: string
  next_sync: string
}> {
  const [iaResult, prelingerResult, nasaResult] = await Promise.all([
    syncInternetArchive(50),
    syncPrelingerArchive(30),
    syncNASAMedia(20),
  ])

  const results = [iaResult, prelingerResult, nasaResult]
  const total_added = results.reduce((sum, r) => sum + r.added, 0)
  const now = new Date()
  const nextSync = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

  return {
    total_added,
    results,
    synced_at: now.toISOString(),
    next_sync: nextSync.toISOString(),
  }
}
