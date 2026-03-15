'use client'
// app/channels/page.tsx
// Javari Omni-Media — IPTV Channel Grid
// Users paste their own M3U playlist — Javari does not supply IPTV content
// Date: March 13, 2026 | Henderson Standard

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { PlayerSource } from '@/components/player/UniversalPlayer'

const UniversalPlayer = dynamic(() => import('@/components/player/UniversalPlayer'), { ssr: false })

interface Channel {
  id: string
  name: string
  logo?: string
  stream_url: string
  category: string
  is_hls: boolean
  number?: number
}

interface ParsedPlaylist {
  channels: Channel[]
  total: number
  categories: string[]
  by_category: Record<string, Channel[]>
  parse_ms: number
  error?: string
}

const CATEGORY_ICONS: Record<string, string> = {
  'Sports': '🏆', 'News': '📰', 'Movies': '🎬', 'Entertainment': '📺',
  'Kids': '⭐', 'Music': '🎵', 'Documentaries': '🎞️', 'Local': '🌄',
  'International': '🌎', 'default': '📡'
}

export default function ChannelsPage() {
  const [iptvUrl, setIptvUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [playlist, setPlaylist] = useState<ParsedPlaylist | null>(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [activeSource, setActiveSource] = useState<PlayerSource | null>(null)
  const [noticeAccepted, setNoticeAccepted] = useState(false)
  const [showNotice, setShowNotice] = useState(false)
  const [pendingUrl, setPendingUrl] = useState('')
  const [error, setError] = useState('')

  const loadPlaylist = async (url: string) => {
    if (!url.trim()) { setError('Please enter an M3U URL'); return }

    // Show legal notice first if not accepted
    if (!noticeAccepted) {
      setPendingUrl(url)
      setShowNotice(true)
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/media/iptv/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-iptv-notice-accepted': 'true',
        },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setPlaylist(data)
        setActiveCategory('All')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlist')
    } finally {
      setLoading(false)
    }
  }

  const acceptNotice = () => {
    setNoticeAccepted(true)
    setShowNotice(false)
    if (pendingUrl) loadPlaylist(pendingUrl)
  }

  const playChannel = (ch: Channel) => {
    setActiveSource({
      url: ch.stream_url,
      title: ch.name,
      subtitle: ch.category,
      thumbnail: ch.logo,
      type: ch.is_hls ? 'hls' : 'iptv',
      isLive: true,
    })
  }

  const filteredChannels = (() => {
    if (!playlist) return []
    let channels = activeCategory === 'All' ? playlist.channels : (playlist.by_category[activeCategory] || [])
    if (search.trim()) {
      const q = search.toLowerCase()
      channels = channels.filter(ch => ch.name.toLowerCase().includes(q))
    }
    return channels
  })()

  const S = {
    input: { width: '100%', background: '#1E1829', border: '1px solid rgba(192,132,252,.2)', borderRadius: 10, padding: '11px 14px', color: '#F5F0FF', fontSize: 13, fontFamily: 'inherit', outline: 'none' } as React.CSSProperties,
    btnGrad: { padding: '11px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#C084FC,#F472B6)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' } as React.CSSProperties,
  }

  return (
    <div style={{ fontFamily: 'Inter,-apple-system,sans-serif', background: '#0E0B14', color: '#F5F0FF', minHeight: '100vh', padding: 24 }}>

      {/* PLAYER OVERLAY */}
      {activeSource && (
        <UniversalPlayer
          source={activeSource}
          onClose={() => setActiveSource(null)}
          onEnded={() => setActiveSource(null)}
        />
      )}

      {/* LEGAL NOTICE MODAL */}
      {showNotice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#161222', border: '1px solid rgba(192,132,252,.3)', borderRadius: 20, padding: 32, maxWidth: 460, width: '100%' }}>
            <div style={{ fontSize: 22, marginBottom: 12 }}>⚖️</div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 18, color: '#F5F0FF', marginBottom: 16 }}>IPTV Source Notice</div>
            <div style={{ fontSize: 13, color: '#9D8FBB', lineHeight: 1.8, marginBottom: 24 }}>
              Javari does not provide or distribute IPTV content.<br/><br/>
              <strong style={{ color: '#F5F0FF' }}>You are responsible</strong> for ensuring you have appropriate rights to access any playlist you connect. Only connect playlists from services you are subscribed to or authorized to use.<br/><br/>
              This notice appears once per session.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowNotice(false)} style={{ flex: 1, padding: 11, borderRadius: 10, border: '1px solid rgba(192,132,252,.2)', background: 'transparent', color: '#9D8FBB', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={acceptNotice} style={{ ...S.btnGrad, flex: 2 }}>I Understand — Load Channels</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <a href="/" style={{ color: '#9D8FBB', textDecoration: 'none', fontSize: 20 }}>←</a>
        <div>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: 22, color: '#F5F0FF' }}>📡 Live Channels</div>
          <div style={{ fontSize: 12, color: '#9D8FBB', marginTop: 2 }}>
            Paste your IPTV playlist to load channels. Javari does not supply IPTV content.
          </div>
        </div>
      </div>

      {/* PLAYLIST INPUT */}
      <div style={{ background: '#1E1829', border: '1px solid rgba(192,132,252,.15)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#F5F0FF', marginBottom: 10 }}>
          Your M3U Playlist URL
          <span title="Your IPTV provider gives you this link. Usually looks like: http://provider.com:8080/get.php?username=...&type=m3u_plus" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 15, height: 15, borderRadius: '50%', background: 'rgba(157,143,187,.35)', color: '#fff', fontSize: 9, fontWeight: 700, cursor: 'help', marginLeft: 6 }}>?</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={iptvUrl}
            onChange={e => setIptvUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadPlaylist(iptvUrl)}
            placeholder="http://your-iptv-provider.com/get.php?username=...&type=m3u_plus"
            style={{ ...S.input, flex: 1, fontFamily: 'monospace', fontSize: 12 }}
          />
          <button onClick={() => loadPlaylist(iptvUrl)} disabled={loading} style={{ ...S.btnGrad, opacity: loading ? 0.6 : 1 }}>
            {loading ? '⏳ Loading...' : 'Load Channels'}
          </button>
        </div>
        {error && <div style={{ marginTop: 10, fontSize: 12, color: '#EF4444', lineHeight: 1.5 }}>{error}</div>}
      </div>

      {/* PLAYLIST LOADED */}
      {playlist && (
        <div>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ background: '#1E1829', border: '1px solid rgba(192,132,252,.15)', borderRadius: 10, padding: '10px 16px' }}>
              <div style={{ fontSize: 20, fontWeight: 500, color: '#C084FC' }}>{playlist.total.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: '#9D8FBB' }}>Total channels</div>
            </div>
            <div style={{ background: '#1E1829', border: '1px solid rgba(192,132,252,.15)', borderRadius: 10, padding: '10px 16px' }}>
              <div style={{ fontSize: 20, fontWeight: 500, color: '#C084FC' }}>{playlist.categories.length}</div>
              <div style={{ fontSize: 11, color: '#9D8FBB' }}>Categories</div>
            </div>
            <div style={{ background: '#1E1829', border: '1px solid rgba(192,132,252,.15)', borderRadius: 10, padding: '10px 16px' }}>
              <div style={{ fontSize: 20, fontWeight: 500, color: '#C084FC' }}>{playlist.parse_ms}ms</div>
              <div style={{ fontSize: 11, color: '#9D8FBB' }}>Parse time</div>
            </div>
          </div>

          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search channels..."
            style={{ ...S.input, marginBottom: 14 }}
          />

          {/* Category filter */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {['All', ...playlist.categories].map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                border: '1px solid rgba(192,132,252,.2)',
                background: activeCategory === cat ? 'linear-gradient(135deg,rgba(192,132,252,.2),rgba(244,114,182,.15))' : '#1E1829',
                color: activeCategory === cat ? '#C084FC' : '#9D8FBB',
              }}>
                {CATEGORY_ICONS[cat] || CATEGORY_ICONS.default} {cat} {activeCategory !== 'All' && cat !== 'All' ? '' : ''}
              </button>
            ))}
          </div>

          {/* Channel count */}
          <div style={{ fontSize: 12, color: '#9D8FBB', marginBottom: 14 }}>
            Showing {filteredChannels.length} channels{search ? ` matching "${search}"` : activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
          </div>

          {/* Channel grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
            {filteredChannels.slice(0, 200).map(ch => (
              <div
                key={ch.id}
                onClick={() => playChannel(ch)}
                style={{ borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(192,132,252,.15)', transition: 'transform .15s', background: '#1E1829' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <div style={{ height: 64, background: 'linear-gradient(135deg,#1A0033,#1E1829)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, position: 'relative' }}>
                  {ch.logo
                    ? <img src={ch.logo} alt={ch.name} style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    : <span>{CATEGORY_ICONS[ch.category] || '📡'}</span>
                  }
                  {ch.is_hls && (
                    <div style={{ position: 'absolute', top: 4, right: 4, background: '#FB923C', color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 700 }}>HD</div>
                  )}
                </div>
                <div style={{ padding: '8px 10px' }}>
                  {ch.number && <div style={{ fontSize: 9, color: '#5A4F72', marginBottom: 2 }}>CH {ch.number}</div>}
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#F5F0FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</div>
                  <div style={{ fontSize: 9, color: '#9D8FBB', marginTop: 2 }}>{ch.category}</div>
                </div>
              </div>
            ))}
          </div>
          {filteredChannels.length > 200 && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9D8FBB', fontSize: 13 }}>
              Showing first 200 of {filteredChannels.length} channels — use search or category filter to narrow results
            </div>
          )}
        </div>
      )}

      {/* EMPTY STATE */}
      {!playlist && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#9D8FBB' }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📡</div>
          <div style={{ fontSize: 16, color: '#F5F0FF', marginBottom: 8 }}>No channels loaded</div>
          <div style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 420, margin: '0 auto' }}>
            Paste your IPTV M3U playlist URL above. Your IPTV provider will give you this link when you subscribe to their service.
          </div>
        </div>
      )}
    </div>
  )
}
