'use client'

// app/page.tsx
// Javari Omni-Media - Complete Application
// Date: March 12, 2026

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Section = 'home' | 'live-tv' | 'sports' | 'movies' | 'tv-shows' | 'music' | 'library' | 'storage' | 'settings'
type SetupStep = 'welcome' | 'location' | 'servers' | 'streaming' | 'iptv' | 'cloud' | 'complete'

interface Channel {
  id: string; name: string; logo?: string; streamUrl: string
  group: string; isHD: boolean; currentShow?: string
}

interface SetupConfig {
  city: string
  hasJellyfin: boolean; jellyfinUrl: string; jellyfinKey: string
  hasPlex: boolean; plexUrl: string; plexToken: string
  streamingServices: string[]
  hasIPTV: boolean; iptvUrl: string; iptvNoticeAccepted: boolean
  cloudProviders: string[]
  complete: boolean
}

interface ChatMessage { role: 'user' | 'assistant'; content: string; timestamp: string }

const STREAMING_SERVICES = [
  { id: 'netflix', name: 'Netflix', color: '#E50914' },
  { id: 'disney', name: 'Disney+', color: '#113CCF' },
  { id: 'hulu', name: 'Hulu', color: '#1CE783' },
  { id: 'hbo', name: 'Max', color: '#002BE7' },
  { id: 'prime', name: 'Prime Video', color: '#00A8E1' },
  { id: 'apple', name: 'Apple TV+', color: '#888' },
  { id: 'peacock', name: 'Peacock', color: '#F7B731' },
  { id: 'paramount', name: 'Paramount+', color: '#0064FF' },
  { id: 'espn', name: 'ESPN+', color: '#CC0000' },
  { id: 'youtubetv', name: 'YouTube TV', color: '#FF0000' },
  { id: 'hulu-live', name: 'Hulu Live', color: '#1CE783' },
  { id: 'fubo', name: 'FuboTV', color: '#E8001D' },
]

const CLOUD_PROVIDERS = [
  { id: 'amazon', name: 'Amazon Photos', note: 'FREE unlimited photos' },
  { id: 'google', name: 'Google Drive', note: '15GB free' },
  { id: 'onedrive', name: 'OneDrive', note: '5GB free' },
  { id: 'backblaze', name: 'Backblaze B2', note: 'Cheapest for video' },
  { id: 'icloud', name: 'iCloud', note: '5GB free' },
  { id: 'dropbox', name: 'Dropbox', note: '2GB free' },
]

const SAMPLE_CHANNELS: Channel[] = [
  { id: 'cnn', name: 'CNN', group: 'News', streamUrl: '', isHD: true, currentShow: 'CNN Newsroom' },
  { id: 'espn', name: 'ESPN', group: 'Sports', streamUrl: '', isHD: true, currentShow: 'SportsCenter' },
  { id: 'fox-news', name: 'FOX News', group: 'News', streamUrl: '', isHD: true, currentShow: 'Fox & Friends' },
  { id: 'nfl', name: 'NFL Network', group: 'Sports', streamUrl: '', isHD: true, currentShow: 'NFL GameDay' },
  { id: 'nba', name: 'NBA TV', group: 'Sports', streamUrl: '', isHD: true, currentShow: 'NBA GameTime' },
  { id: 'mlb', name: 'MLB Network', group: 'Sports', streamUrl: '', isHD: true, currentShow: 'MLB Tonight' },
  { id: 'sky-sports', name: 'Sky Sports', group: 'Sports', streamUrl: '', isHD: true, currentShow: 'Premier League' },
  { id: 'bein', name: 'beIN Sports', group: 'Sports', streamUrl: '', isHD: true, currentShow: 'La Liga' },
  { id: 'golf', name: 'Golf Channel', group: 'Sports', streamUrl: '', isHD: true, currentShow: 'Golf Central' },
  { id: 'msnbc', name: 'MSNBC', group: 'News', streamUrl: '', isHD: true, currentShow: 'Morning Joe' },
  { id: 'bloomberg', name: 'Bloomberg', group: 'News', streamUrl: '', isHD: true, currentShow: 'Bloomberg Markets' },
  { id: 'bbc', name: 'BBC World News', group: 'News', streamUrl: '', isHD: true, currentShow: 'BBC World News' },
  { id: 'discovery', name: 'Discovery', group: 'Documentary', streamUrl: '', isHD: true, currentShow: 'Deadliest Catch' },
  { id: 'history', name: 'History', group: 'Documentary', streamUrl: '', isHD: true, currentShow: 'Ancient Aliens' },
  { id: 'food', name: 'Food Network', group: 'Lifestyle', streamUrl: '', isHD: true, currentShow: 'Diners Drive-Ins' },
  { id: 'hgtv', name: 'HGTV', group: 'Lifestyle', streamUrl: '', isHD: true, currentShow: 'Property Brothers' },
  { id: 'cartoon', name: 'Cartoon Network', group: 'Kids', streamUrl: '', isHD: true, currentShow: 'Teen Titans' },
  { id: 'nick', name: 'Nickelodeon', group: 'Kids', streamUrl: '', isHD: false, currentShow: 'SpongeBob' },
  { id: 'tnt', name: 'TNT', group: 'Entertainment', streamUrl: '', isHD: true, currentShow: 'Law & Order' },
  { id: 'fx', name: 'FX', group: 'Entertainment', streamUrl: '', isHD: true, currentShow: 'The Bear' },
  { id: 'amc', name: 'AMC', group: 'Movies', streamUrl: '', isHD: true, currentShow: 'The Walking Dead' },
  { id: 'tennis', name: 'Tennis Channel', group: 'Sports', streamUrl: '', isHD: true, currentShow: 'Live Tennis' },
  { id: 'espn2', name: 'ESPN2', group: 'Sports', streamUrl: '', isHD: true, currentShow: 'College Football' },
  { id: 'cbssports', name: 'CBS Sports', group: 'Sports', streamUrl: '', isHD: true, currentShow: 'CBS Sports HQ' },
]

const defaultConfig: SetupConfig = {
  city: '', hasJellyfin: false, jellyfinUrl: '', jellyfinKey: '',
  hasPlex: false, plexUrl: '', plexToken: '',
  streamingServices: [], hasIPTV: false, iptvUrl: '', iptvNoticeAccepted: false,
  cloudProviders: [], complete: false,
}

export default function App() {
  const [setupDone, setSetupDone] = useState(false)
  const [setupStep, setSetupStep] = useState<SetupStep>('welcome')
  const [config, setConfig] = useState<SetupConfig>(defaultConfig)
  const [section, setSection] = useState<Section>('home')
  const [channels, setChannels] = useState<Channel[]>(SAMPLE_CHANNELS)
  const [activeGroup, setActiveGroup] = useState('All')
  const [nowPlaying, setNowPlaying] = useState<Channel | null>(null)
  const [javariOpen, setJavariOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [iptvUrl, setIptvUrl] = useState('')
  const [iptvLoading, setIptvLoading] = useState(false)
  const [showNotice, setShowNotice] = useState(false)
  const [pendingUrl, setPendingUrl] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const s = localStorage.getItem('jom-config')
      if (s) { const p = JSON.parse(s); setConfig(p); if (p.complete) setSetupDone(true) }
    } catch {}
  }, [])

  useEffect(() => { chatRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const save = (c: SetupConfig) => { setConfig(c); try { localStorage.setItem('jom-config', JSON.stringify(c)) } catch {} }

  const parseM3U = (text: string): Channel[] => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const result: Channel[] = []
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith('#EXTINF:')) continue
      const url = lines[i + 1]
      if (!url || url.startsWith('#')) continue
      const name = lines[i].match(/,(.+)$/)?.[1]?.trim() || 'Channel'
      const logo = lines[i].match(/tvg-logo="([^"]*)"/)?.[1]
      const group = lines[i].match(/group-title="([^"]*)"/)?.[1] || 'IPTV'
      result.push({ id: `iptv-${i}-${Date.now()}`, name, logo, streamUrl: url.trim(), group, isHD: /\bHD\b|\b4K\b/i.test(name) })
    }
    return result
  }

  const importIPTV = async (url: string) => {
    if (!url.trim()) return
    setIptvLoading(true)
    try {
      const r = await fetch(`/api/iptv/fetch?url=${encodeURIComponent(url)}`)
      if (!r.ok) throw new Error('Fetch failed')
      const text = await r.text()
      const parsed = parseM3U(text)
      setChannels(prev => {
        const existing = new Set(prev.map(c => c.streamUrl))
        return [...prev, ...parsed.filter(c => !existing.has(c.streamUrl))]
      })
      alert(`✅ Loaded ${parsed.length} channels`)
    } catch { alert('❌ Could not load that playlist. Check the URL.') }
    finally { setIptvLoading(false) }
  }

  const handleAddIPTV = (url: string) => {
    if (!config.iptvNoticeAccepted) { setPendingUrl(url); setShowNotice(true) }
    else { importIPTV(url) }
  }

  const sendMessage = useCallback(async (text?: string) => {
    const content = text || input.trim()
    if (!content || aiLoading) return
    setInput('')
    const userMsg: ChatMessage = { role: 'user', content, timestamp: new Date().toISOString() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setAiLoading(true)
    try {
      const r = await fetch('/api/javari/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated.map(m => ({ role: m.role, content: m.content })), setupContext: config }),
      })
      const d = await r.json()
      if (d.message) setMessages(prev => [...prev, { role: 'assistant', content: d.message, timestamp: new Date().toISOString() }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Can't reach Javari AI right now. Check ANTHROPIC_API_KEY is set in your environment.", timestamp: new Date().toISOString() }])
    }
    setAiLoading(false)
  }, [input, messages, aiLoading, config])

  if (!setupDone) return (
    <Wizard step={setupStep} config={config}
      onUpdate={u => save({ ...config, ...u })}
      onStep={setSetupStep}
      onComplete={() => { save({ ...config, complete: true }); setSetupDone(true) }} />
  )

  const groups = ['All', 'Favorites', ...Array.from(new Set(channels.map(c => c.group))).sort()]
  const filtered = channels
    .filter(c => activeGroup === 'All' || c.group === activeGroup)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))

  const sports = channels.filter(c => /sport|nfl|nba|mlb|nhl|espn|golf|tennis|bein|sky sport|ufc|f1|formula/i.test(c.name + c.group))

  const nav: { id: Section; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: '⌂' },
    { id: 'live-tv', label: 'Live TV', icon: '📺' },
    { id: 'sports', label: 'Sports', icon: '🏆' },
    { id: 'movies', label: 'Movies', icon: '🎬' },
    { id: 'tv-shows', label: 'TV Shows', icon: '📡' },
    { id: 'music', label: 'Music', icon: '🎵' },
    { id: 'library', label: 'Library', icon: '📚' },
    { id: 'storage', label: 'Storage', icon: '☁️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#070b13', color: '#e2e8f0', fontFamily: '"DM Sans",system-ui,sans-serif', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{ width: collapsed ? 60 : 210, background: '#0c1120', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', transition: 'width 0.2s', flexShrink: 0, zIndex: 20 }}>
        <div style={{ padding: collapsed ? '18px 0' : '18px 14px', display: 'flex', alignItems: 'center', gap: 8, justifyContent: collapsed ? 'center' : 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => setCollapsed(o => !o)} style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', color: '#fff', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>J</button>
          {!collapsed && <div><div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', color: '#fff' }}>JAVARI</div><div style={{ fontSize: 9, color: '#4b5563', letterSpacing: '0.1em' }}>OMNI-MEDIA</div></div>}
        </div>
        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setSection(n.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: collapsed ? '9px 0' : '9px 14px', justifyContent: collapsed ? 'center' : 'flex-start', background: section === n.id ? 'rgba(59,130,246,0.12)' : 'transparent', borderLeft: section === n.id ? '2px solid #3b82f6' : '2px solid transparent', border: 'none', color: section === n.id ? '#93c5fd' : '#6b7280', cursor: 'pointer', fontSize: 12, fontWeight: section === n.id ? 600 : 400 }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{n.icon}</span>
              {!collapsed && n.label}
            </button>
          ))}
        </nav>
        <button onClick={() => { setJavariOpen(true); if (!messages.length) setMessages([{ role: 'assistant', content: "Hey! I'm Javari. Ask me anything — what to watch, how to set up your NAS, find a sports channel, or optimize your storage.", timestamp: new Date().toISOString() }]) }} style={{ margin: collapsed ? '0 6px 12px' : '0 10px 12px', padding: '9px', borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 6 }}>
          <span style={{ fontSize: 14 }}>✦</span>{!collapsed && 'Ask Javari AI'}
        </button>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(7,11,19,0.95)', backdropFilter: 'blur(10px)', flexShrink: 0 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ flex: 1, maxWidth: 360, padding: '7px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#e2e8f0', fontSize: 12, outline: 'none' }} />
          <div style={{ flex: 1 }} />
          {config.hasJellyfin && <Chip label="Jellyfin" color="#6366f1" />}
          {config.hasPlex && <Chip label="Plex" color="#f59e0b" />}
          {config.hasIPTV && <Chip label="IPTV" color="#a78bfa" />}
          <Chip label={`${channels.length} ch`} color="#34d399" />
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {section === 'home' && <HomeView config={config} channels={channels} sports={sports} onPlay={setNowPlaying} onNav={setSection} />}
          {section === 'live-tv' && <LiveTVView channels={filtered} groups={groups} activeGroup={activeGroup} onGroup={setActiveGroup} onPlay={setNowPlaying} nowPlaying={nowPlaying} onAddIPTV={handleAddIPTV} iptvLoading={iptvLoading} />}
          {section === 'sports' && <SportsView channels={sports} onPlay={setNowPlaying} />}
          {section === 'movies' && <PlaceholderView icon="🎬" title="Movies" desc="Connect your Jellyfin or Plex server in Settings to browse your movie library with full metadata, posters, and ratings." cta={config.hasJellyfin || config.hasPlex ? "Library connected — loading..." : "Connect a server in Settings"} onCta={() => setSection('settings')} />}
          {section === 'tv-shows' && <PlaceholderView icon="📡" title="TV Shows" desc="All your series with episode tracking, continue watching, and automatic new episode alerts." cta="Connect a server in Settings" onCta={() => setSection('settings')} />}
          {section === 'music' && <PlaceholderView icon="🎵" title="Music" desc="Your complete music library. Connect Jellyfin or Plex to access every album with art, playlists, and smart radio." cta="Connect a server in Settings" onCta={() => setSection('settings')} />}
          {section === 'library' && <LibraryView config={config} />}
          {section === 'storage' && <StorageView config={config} onUpdate={u => save({ ...config, ...u })} />}
          {section === 'settings' && <SettingsView config={config} onUpdate={u => save({ ...config, ...u })} onReset={() => { localStorage.removeItem('jom-config'); setConfig(defaultConfig); setSetupDone(false); setSetupStep('welcome') }} />}
        </main>

        {/* Mini Player */}
        <AnimatePresence>
          {nowPlaying && (
            <motion.div initial={{ y: 70, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 70, opacity: 0 }} style={{ position: 'fixed', bottom: 0, left: collapsed ? 60 : 210, right: 0, height: 64, background: 'rgba(8,12,22,0.98)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12, zIndex: 40 }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📺</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nowPlaying.name}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{nowPlaying.currentShow || nowPlaying.group} · <span style={{ color: '#34d399' }}>● LIVE</span></div>
              </div>
              <button onClick={() => setNowPlaying(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 18 }}>⏹</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* IPTV Notice */}
      <AnimatePresence>
        {showNotice && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 32, maxWidth: 500, width: '100%' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>ℹ️</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Connecting Your IPTV Source</h2>
              <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.8, marginBottom: 14 }}>Javari Omni-Media connects to media sources you provide. Please ensure you have appropriate access rights for any IPTV subscription or M3U playlist you connect. Content licensing laws vary by country and region.</p>
              <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.8, marginBottom: 24 }}>We are a connection layer — like a web browser. We do not host, provide, or endorse specific content. You are responsible for compliance with the laws of your region.</p>
              <p style={{ fontSize: 12, color: '#4b5563', marginBottom: 20, fontStyle: 'italic' }}>This notice is shown once.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowNotice(false)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#9ca3af', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button onClick={() => { const c = { ...config, iptvNoticeAccepted: true, hasIPTV: true }; save(c); setShowNotice(false); if (pendingUrl) importIPTV(pendingUrl) }} style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>I Understand — Connect</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Javari AI */}
      <AnimatePresence>
        {javariOpen && (
          <motion.div initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }} transition={{ type: 'spring', damping: 26, stiffness: 220 }} style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 370, background: 'rgba(8,12,22,0.99)', backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✦</div>
              <div><div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Javari AI</div><div style={{ fontSize: 10, color: '#34d399' }}>● Ready</div></div>
              <button onClick={() => setJavariOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '82%', padding: '9px 13px', borderRadius: m.role === 'user' ? '13px 13px 3px 13px' : '13px 13px 13px 3px', background: m.role === 'user' ? 'linear-gradient(135deg,#3b82f6,#8b5cf6)' : 'rgba(255,255,255,0.05)', border: m.role === 'assistant' ? '1px solid rgba(255,255,255,0.07)' : 'none', fontSize: 13, lineHeight: 1.65, color: '#e2e8f0' }}>{m.content}</div>
                </div>
              ))}
              {aiLoading && <div style={{ display: 'flex', gap: 4, padding: '8px 12px' }}>{[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', animation: `bounce 1s ease ${i*0.15}s infinite` }} />)}</div>}
              <div ref={chatRef} />
            </div>
            {messages.length <= 1 && (
              <div style={{ padding: '0 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['What can I watch tonight?','Find sports channels','Help set up my NAS','Optimize my storage'].map(q => (
                  <button key={q} onClick={() => sendMessage(q)} style={{ padding: '5px 11px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 20, color: '#93c5fd', fontSize: 11, cursor: 'pointer' }}>{q}</button>
                ))}
              </div>
            )}
            <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 7 }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Ask Javari anything..." style={{ flex: 1, padding: '9px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#e2e8f0', fontSize: 13, outline: 'none' }} />
              <button onClick={() => sendMessage()} disabled={!input.trim() || aiLoading} style={{ width: 38, height: 38, background: input.trim() ? 'linear-gradient(135deg,#3b82f6,#8b5cf6)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 9, color: '#fff', cursor: input.trim() ? 'pointer' : 'default', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}input::placeholder{color:#374151}@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
    </div>
  )
}

function Chip({ label, color }: { label: string; color: string }) {
  return <div style={{ fontSize: 10, fontWeight: 600, color, background: color + '18', padding: '3px 8px', borderRadius: 5, border: `1px solid ${color}30` }}>{label}</div>
}

// HOME VIEW
function HomeView({ config, channels, sports, onPlay, onNav }: { config: SetupConfig; channels: Channel[]; sports: Channel[]; onPlay: (c: Channel) => void; onNav: (s: Section) => void }) {
  const hr = new Date().getHours()
  const greeting = hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening'
  const news = channels.filter(c => c.group === 'News')
  return (
    <div style={{ padding: '24px 24px 100px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{greeting}{config.city ? `, ${config.city.split(',')[0]}` : ''}</h1>
      <p style={{ fontSize: 12, color: '#4b5563', marginBottom: 28 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {channels.length} channels</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14, marginBottom: 36 }}>
        {[
          { icon: '📺', t: 'Live TV', s: `${channels.length} channels`, c: '#3b82f6', sec: 'live-tv' as Section },
          { icon: '🏆', t: 'Sports', s: `${sports.length} channels`, c: '#f59e0b', sec: 'sports' as Section },
          { icon: '🎬', t: 'Movies', s: config.hasJellyfin || config.hasPlex ? 'Connected' : 'Connect server', c: '#ec4899', sec: 'movies' as Section },
          { icon: '☁️', t: 'Storage', s: config.cloudProviders.length > 0 ? `${config.cloudProviders.length} providers` : 'Optimize now', c: '#34d399', sec: 'storage' as Section },
        ].map(card => (
          <button key={card.sec} onClick={() => onNav(card.sec)} style={{ padding: 18, background: `${card.c}12`, border: `1px solid ${card.c}28`, borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{card.t}</div>
            <div style={{ fontSize: 11, color: '#4b5563' }}>{card.s}</div>
          </button>
        ))}
      </div>
      {sports.length > 0 && <ChannelRow title="🏆 Sports Live Now" channels={sports.slice(0,10)} onPlay={onPlay} onMore={() => onNav('sports')} />}
      {news.length > 0 && <ChannelRow title="📰 News Live Now" channels={news.slice(0,10)} onPlay={onPlay} onMore={() => onNav('live-tv')} />}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 14 }}>Your Platform</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
          {[
            { on: config.hasJellyfin, n: 'Jellyfin', c: '#6366f1' },
            { on: config.hasPlex, n: 'Plex', c: '#f59e0b' },
            { on: config.hasIPTV, n: 'IPTV', c: '#a78bfa' },
            { on: config.streamingServices.length > 0, n: `${config.streamingServices.length || 0} streaming`, c: '#ec4899' },
            { on: config.cloudProviders.length > 0, n: `${config.cloudProviders.length || 0} cloud`, c: '#34d399' },
          ].map(x => (
            <div key={x.n} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${x.on ? x.c + '28' : 'rgba(255,255,255,0.04)'}`, borderRadius: 9, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: x.on ? x.c : '#1f2937', flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: x.on ? '#d1d5db' : '#4b5563', fontWeight: x.on ? 600 : 400 }}>{x.n}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ChannelRow({ title, channels, onPlay, onMore }: { title: string; channels: Channel[]; onPlay: (c: Channel) => void; onMore: () => void }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{title}</h2>
        <button onClick={onMore} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12 }}>See all →</button>
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
        {channels.map(ch => (
          <button key={ch.id} onClick={() => onPlay(ch)} style={{ minWidth: 140, padding: '12px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, cursor: 'pointer', textAlign: 'left', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: '#34d399', fontWeight: 700 }}>● LIVE</span>
              {ch.isHD && <span style={{ fontSize: 9, color: '#3b82f6' }}>HD</span>}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</div>
            {ch.currentShow && <div style={{ fontSize: 10, color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 3 }}>{ch.currentShow}</div>}
          </button>
        ))}
      </div>
    </div>
  )
}

// LIVE TV VIEW
function LiveTVView({ channels, groups, activeGroup, onGroup, onPlay, nowPlaying, onAddIPTV, iptvLoading }: { channels: Channel[]; groups: string[]; activeGroup: string; onGroup: (g: string) => void; onPlay: (c: Channel) => void; nowPlaying: Channel | null; onAddIPTV: (url: string) => void; iptvLoading: boolean }) {
  const [url, setUrl] = useState('')
  return (
    <div style={{ padding: '22px 22px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 14, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 3 }}>Live TV</h1>
          <p style={{ fontSize: 12, color: '#4b5563' }}>{channels.length} channels · Free channels pre-loaded</p>
        </div>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="M3U URL — paste to import channels" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#e2e8f0', fontSize: 12, outline: 'none', width: 260 }} />
          <button onClick={() => { if (url.trim()) { onAddIPTV(url.trim()); setUrl('') } }} disabled={!url.trim() || iptvLoading} style={{ padding: '8px 14px', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', borderRadius: 7, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{iptvLoading ? '...' : '+ Import'}</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 6, marginBottom: 20 }}>
        {groups.map(g => <button key={g} onClick={() => onGroup(g)} style={{ padding: '5px 13px', background: activeGroup === g ? 'linear-gradient(135deg,#3b82f6,#8b5cf6)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 20, color: activeGroup === g ? '#fff' : '#6b7280', cursor: 'pointer', fontSize: 11, fontWeight: activeGroup === g ? 600 : 400, whiteSpace: 'nowrap', flexShrink: 0 }}>{g}</button>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(148px,1fr))', gap: 10 }}>
        {channels.map(ch => (
          <button key={ch.id} onClick={() => onPlay(ch)} style={{ padding: '14px 11px', background: nowPlaying?.id === ch.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.02)', border: nowPlaying?.id === ch.id ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(255,255,255,0.05)', borderRadius: 10, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: 9, color: '#4b5563', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 3 }}>{ch.group}</span>
              {ch.isHD && <span style={{ fontSize: 9, color: '#3b82f6' }}>HD</span>}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{ch.name}</div>
            {ch.currentShow && <div style={{ fontSize: 10, color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.currentShow}</div>}
            {nowPlaying?.id === ch.id && <div style={{ marginTop: 7, fontSize: 9, color: '#34d399', fontWeight: 700 }}>● PLAYING</div>}
          </button>
        ))}
      </div>
    </div>
  )
}

// SPORTS VIEW
function SportsView({ channels, onPlay }: { channels: Channel[]; onPlay: (c: Channel) => void }) {
  const leagues = [
    { name: 'NFL', kw: ['nfl','network'], icon: '🏈' },
    { name: 'NBA', kw: ['nba','basketball'], icon: '🏀' },
    { name: 'MLB', kw: ['mlb','baseball'], icon: '⚾' },
    { name: 'NHL', kw: ['nhl','hockey'], icon: '🏒' },
    { name: 'Soccer', kw: ['soccer','mls','premier','la liga','bein','uefa','fifa'], icon: '⚽' },
    { name: 'ESPN', kw: ['espn'], icon: '📺' },
    { name: 'Sky Sports', kw: ['sky sport'], icon: '☁️' },
    { name: 'Other', kw: ['golf','tennis','f1','formula','ufc','boxing','olympic','cbssports'], icon: '🏆' },
  ]
  return (
    <div style={{ padding: '22px 22px 100px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Sports</h1>
      <p style={{ fontSize: 12, color: '#4b5563', marginBottom: 28 }}>{channels.length} sports channels · Every major league</p>
      {leagues.map(l => {
        const lch = channels.filter(c => l.kw.some(k => (c.name+c.group).toLowerCase().includes(k)))
        if (!lch.length) return null
        return (
          <div key={l.name} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{l.icon} {l.name}</h2>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
              {lch.map(ch => (
                <button key={ch.id} onClick={() => onPlay(ch)} style={{ minWidth: 140, padding: '12px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, cursor: 'pointer', textAlign: 'left', flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: '#34d399', fontWeight: 700, marginBottom: 6 }}>● LIVE</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</div>
                  {ch.currentShow && <div style={{ fontSize: 10, color: '#4b5563', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.currentShow}</div>}
                </button>
              ))}
            </div>
          </div>
        )
      })}
      {!channels.length && <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4b5563' }}><div style={{ fontSize: 48, marginBottom: 14 }}>🏆</div><div style={{ fontSize: 16, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>Import Your IPTV Playlist</div><p style={{ fontSize: 13, maxWidth: 300, margin: '0 auto', lineHeight: 1.7 }}>Go to Live TV and paste your M3U URL to unlock NFL, NBA, MLB, NHL, international soccer, and every other sport.</p></div>}
    </div>
  )
}

function LibraryView({ config }: { config: SetupConfig }) {
  return (
    <div style={{ padding: '22px 22px 100px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 22 }}>My Library</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14 }}>
        {[
          { icon: '🎬', t: 'Movies', ok: config.hasJellyfin || config.hasPlex, src: config.hasJellyfin ? 'Jellyfin' : config.hasPlex ? 'Plex' : 'Connect a server' },
          { icon: '📡', t: 'TV Shows', ok: config.hasJellyfin || config.hasPlex, src: config.hasJellyfin ? 'Jellyfin' : config.hasPlex ? 'Plex' : 'Connect a server' },
          { icon: '🎵', t: 'Music', ok: config.hasJellyfin || config.hasPlex, src: 'Via media server' },
          { icon: '📸', t: 'Photos', ok: config.cloudProviders.includes('amazon') || config.cloudProviders.includes('google'), src: 'Amazon Photos or Google Drive' },
          { icon: '📚', t: 'Audiobooks', ok: false, src: 'Connect Readarr / Booksonic' },
          { icon: '🎙️', t: 'Podcasts', ok: false, src: 'Add RSS feeds' },
        ].map(x => (
          <div key={x.t} style={{ padding: 20, background: 'rgba(255,255,255,0.02)', border: `1px solid ${x.ok ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{x.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 5 }}>{x.t}</div>
            <div style={{ fontSize: 11, color: x.ok ? '#34d399' : '#4b5563' }}>{x.ok ? `✓ ${x.src}` : x.src}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StorageView({ config, onUpdate }: { config: SetupConfig; onUpdate: (u: Partial<SetupConfig>) => void }) {
  const providers = [
    { id: 'amazon', n: 'Amazon Photos', best: 'Photos', cost: 'FREE unlimited', c: '#00A8E1' },
    { id: 'google', n: 'Google Drive', best: 'Documents', cost: '$2.99/mo (100GB)', c: '#4285F4' },
    { id: 'onedrive', n: 'OneDrive', best: 'Office files', cost: '$1.99/mo (100GB)', c: '#0078D4' },
    { id: 'backblaze', n: 'Backblaze B2', best: 'Videos/Archives', cost: '$6/TB/mo', c: '#D63B2F' },
    { id: 'icloud', n: 'iCloud', best: 'Apple devices', cost: '$0.99/mo (50GB)', c: '#888' },
    { id: 'dropbox', n: 'Dropbox', best: 'Shared projects', cost: '$9.99/mo (2TB)', c: '#0061FF' },
  ]
  return (
    <div style={{ padding: '22px 22px 100px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Storage Optimizer</h1>
      <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 22, lineHeight: 1.7 }}>Stop paying for the same file three times. Javari routes each file type to the cheapest service automatically. Most users save $200–400/year.</p>
      <div style={{ padding: 18, background: 'linear-gradient(135deg,rgba(52,211,153,0.07),rgba(59,130,246,0.07))', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 10, marginBottom: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#34d399', marginBottom: 10 }}>💡 Smart Routing</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: 6 }}>
          {[['📸 Photos','Amazon Photos — FREE unlimited'],['📄 Documents','OneDrive — cheapest/GB'],['🎬 Videos','Backblaze B2 — lowest cost'],['🎵 Music','Local NAS (free)']].map(([t,r]) => <div key={t} style={{ fontSize: 11, color: '#6b7280' }}><span style={{ color: '#d1d5db', fontWeight: 600 }}>{t}</span> → {r}</div>)}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
        {providers.map(p => {
          const on = config.cloudProviders.includes(p.id)
          return (
            <div key={p.id} style={{ padding: 18, background: 'rgba(255,255,255,0.02)', border: `1px solid ${on ? p.c+'35' : 'rgba(255,255,255,0.05)'}`, borderRadius: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: on ? '#fff' : '#9ca3af' }}>{p.n}</div>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: on ? p.c : '#1f2937' }} />
              </div>
              <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 3 }}>Best for: {p.best}</div>
              <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 12 }}>{p.cost}</div>
              <button onClick={() => onUpdate({ cloudProviders: on ? config.cloudProviders.filter(x => x !== p.id) : [...config.cloudProviders, p.id] })} style={{ width: '100%', padding: '7px', background: on ? 'rgba(255,59,48,0.08)' : `${p.c}14`, border: `1px solid ${on ? 'rgba(255,59,48,0.18)' : p.c+'25'}`, borderRadius: 7, color: on ? '#f87171' : p.c, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>{on ? 'Disconnect' : 'Connect'}</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SettingsView({ config, onUpdate, onReset }: { config: SetupConfig; onUpdate: (u: Partial<SetupConfig>) => void; onReset: () => void }) {
  return (
    <div style={{ padding: '22px 22px 100px', maxWidth: 580 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 24 }}>Settings</h1>
      <Sect title="Media Servers">
        <Field label="Jellyfin URL" val={config.jellyfinUrl} set={v => onUpdate({ jellyfinUrl: v })} ph="http://192.168.1.x:8096" />
        <Field label="Jellyfin API Key" val={config.jellyfinKey} set={v => onUpdate({ jellyfinKey: v })} ph="From Jellyfin Dashboard → API Keys" type="password" />
        <Field label="Plex URL" val={config.plexUrl} set={v => onUpdate({ plexUrl: v })} ph="http://192.168.1.x:32400" />
        <Field label="Plex Token" val={config.plexToken} set={v => onUpdate({ plexToken: v })} ph="From plex.tv account page" type="password" />
      </Sect>
      <Sect title="Location">
        <Field label="Your City" val={config.city} set={v => onUpdate({ city: v })} ph="Fort Myers, FL" />
      </Sect>
      <Sect title="IPTV">
        <Field label="M3U Playlist URL" val={config.iptvUrl} set={v => onUpdate({ iptvUrl: v })} ph="https://yourprovider.com/playlist.m3u" />
      </Sect>
      <div style={{ paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => { if (confirm('Reset all setup?')) onReset() }} style={{ padding: '9px 18px', background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.18)', borderRadius: 8, color: '#f87171', cursor: 'pointer', fontSize: 12 }}>Reset Setup</button>
      </div>
    </div>
  )
}

function Sect({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 12 }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>{children}</div>
    </div>
  )
}

function Field({ label, val, set, ph, type='text' }: { label: string; val: string; set: (v: string) => void; ph?: string; type?: string }) {
  return (
    <div>
      <label style={{ fontSize: 11, color: '#6b7280', marginBottom: 3, display: 'block' }}>{label}</label>
      <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph} style={{ width: '100%', padding: '9px 11px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#e2e8f0', fontSize: 12, outline: 'none' }} />
    </div>
  )
}

function PlaceholderView({ icon, title, desc, cta, onCta }: { icon: string; title: string; desc: string; cta: string; onCta: () => void }) {
  return (
    <div style={{ padding: '60px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 18 }}>{icon}</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>{title}</h1>
      <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.8, maxWidth: 400, marginBottom: 24 }}>{desc}</p>
      <button onClick={onCta} style={{ padding: '11px 26px', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', borderRadius: 9, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{cta}</button>
    </div>
  )
}

// SETUP WIZARD
function Wizard({ step, config, onUpdate, onStep, onComplete }: { step: SetupStep; config: SetupConfig; onUpdate: (u: Partial<SetupConfig>) => void; onStep: (s: SetupStep) => void; onComplete: () => void }) {
  const steps: SetupStep[] = ['welcome','location','servers','streaming','iptv','cloud','complete']
  const idx = steps.indexOf(step)
  const pct = (idx / (steps.length - 1)) * 100
  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 25% 50%,rgba(59,130,246,0.12) 0%,transparent 55%),radial-gradient(ellipse at 75% 50%,rgba(139,92,246,0.12) 0%,transparent 55%),#070b13', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: '"DM Sans",system-ui,sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        {step !== 'welcome' && step !== 'complete' && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden' }}>
              <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.35 }} style={{ height: '100%', background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)', borderRadius: 1 }} />
            </div>
          </div>
        )}
        <motion.div key={step} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: 36, color: '#e2e8f0' }}>
          {step === 'welcome' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 18 }}>✦</div>
              <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 10, background: 'linear-gradient(135deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Javari Omni-Media</h1>
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.8, marginBottom: 10 }}>The only platform that connects to everything you already have — your NAS, streaming services, IPTV, cloud storage — and brings it all into one experience.</p>
              <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 28 }}>Setup takes about 3 minutes. Javari AI configures everything automatically.</p>
              <button onClick={() => onStep('location')} style={{ padding: '13px 36px', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', borderRadius: 11, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Build My System →</button>
            </div>
          )}
          {step === 'location' && (
            <div>
              <div style={{ fontSize: 30, marginBottom: 14 }}>📍</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Your Location</h2>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 22, lineHeight: 1.7 }}>Helps us find your local ABC, NBC, CBS, FOX affiliates. You can watch your hometown channels from anywhere in the world.</p>
              <input value={config.city} onChange={e => onUpdate({ city: e.target.value })} placeholder="e.g. Fort Myers, FL or Cincinnati, OH" style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: '#e2e8f0', fontSize: 14, outline: 'none', marginBottom: 20 }} />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Btn secondary onClick={() => onStep('servers')}>Skip</Btn>
                <Btn onClick={() => onStep('servers')}>Continue →</Btn>
              </div>
            </div>
          )}
          {step === 'servers' && (
            <div>
              <div style={{ fontSize: 30, marginBottom: 14 }}>🖥️</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Media Servers</h2>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 22, lineHeight: 1.7 }}>Connect Jellyfin, Plex, or Emby. We'll import your entire library with full metadata automatically.</p>
              <div style={{ padding: 18, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', marginBottom: config.hasJellyfin ? 14 : 0 }}>
                  <input type="checkbox" checked={config.hasJellyfin} onChange={e => onUpdate({ hasJellyfin: e.target.checked })} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Jellyfin</span>
                  <span style={{ fontSize: 10, color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '2px 7px', borderRadius: 4 }}>Free — Recommended</span>
                </label>
                {config.hasJellyfin && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <input value={config.jellyfinUrl} onChange={e => onUpdate({ jellyfinUrl: e.target.value })} placeholder="http://192.168.1.x:8096" style={{ padding: '9px 11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#e2e8f0', fontSize: 12, outline: 'none' }} />
                    <input value={config.jellyfinKey} onChange={e => onUpdate({ jellyfinKey: e.target.value })} placeholder="API Key from Jellyfin Dashboard → API Keys" type="password" style={{ padding: '9px 11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#e2e8f0', fontSize: 12, outline: 'none' }} />
                  </div>
                )}
              </div>
              <div style={{ padding: 18, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 22 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', marginBottom: config.hasPlex ? 14 : 0 }}>
                  <input type="checkbox" checked={config.hasPlex} onChange={e => onUpdate({ hasPlex: e.target.checked })} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Plex</span>
                </label>
                {config.hasPlex && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <input value={config.plexUrl} onChange={e => onUpdate({ plexUrl: e.target.value })} placeholder="http://192.168.1.x:32400" style={{ padding: '9px 11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#e2e8f0', fontSize: 12, outline: 'none' }} />
                    <input value={config.plexToken} onChange={e => onUpdate({ plexToken: e.target.value })} placeholder="Plex Token from plex.tv" type="password" style={{ padding: '9px 11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#e2e8f0', fontSize: 12, outline: 'none' }} />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Btn secondary onClick={() => onStep('streaming')}>Skip</Btn>
                <Btn onClick={() => onStep('streaming')}>Continue →</Btn>
              </div>
            </div>
          )}
          {step === 'streaming' && (
            <div>
              <div style={{ fontSize: 30, marginBottom: 14 }}>📱</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Streaming Services</h2>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 22, lineHeight: 1.7 }}>Which services do you subscribe to? Javari shows you where to find content across all of them.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9, marginBottom: 24 }}>
                {STREAMING_SERVICES.map(s => {
                  const on = config.streamingServices.includes(s.id)
                  return <button key={s.id} onClick={() => onUpdate({ streamingServices: on ? config.streamingServices.filter(x => x !== s.id) : [...config.streamingServices, s.id] })} style={{ padding: '11px 7px', background: on ? `${s.color}18` : 'rgba(255,255,255,0.02)', border: on ? `1px solid ${s.color}50` : '1px solid rgba(255,255,255,0.05)', borderRadius: 9, color: on ? '#fff' : '#6b7280', cursor: 'pointer', fontSize: 11, fontWeight: on ? 600 : 400 }}>{on ? '✓ ' : ''}{s.name}</button>
                })}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Btn secondary onClick={() => onStep('iptv')}>Skip</Btn>
                <Btn onClick={() => onStep('iptv')}>Continue →</Btn>
              </div>
            </div>
          )}
          {step === 'iptv' && (
            <IPTVWizardStep config={config} onUpdate={onUpdate} onNext={() => onStep('cloud')} />
          )}
          {step === 'cloud' && (
            <div>
              <div style={{ fontSize: 30, marginBottom: 14 }}>☁️</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Cloud Storage</h2>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 22, lineHeight: 1.7 }}>Javari routes your files to the cheapest service — photos to Amazon (free), docs to OneDrive, videos to Backblaze — saving $200–400/year.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 9, marginBottom: 24 }}>
                {CLOUD_PROVIDERS.map(p => {
                  const on = config.cloudProviders.includes(p.id)
                  return (
                    <button key={p.id} onClick={() => onUpdate({ cloudProviders: on ? config.cloudProviders.filter(x => x !== p.id) : [...config.cloudProviders, p.id] })} style={{ padding: '12px', background: on ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)', border: on ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.05)', borderRadius: 9, color: on ? '#93c5fd' : '#6b7280', cursor: 'pointer', fontSize: 12, fontWeight: on ? 600 : 400, textAlign: 'left' }}>
                      <div>{on ? '✓ ' : ''}{p.name}</div>
                      <div style={{ fontSize: 10, color: '#4b5563', marginTop: 3 }}>{p.note}</div>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Btn secondary onClick={() => onStep('complete')}>Skip</Btn>
                <Btn onClick={() => onStep('complete')}>Continue →</Btn>
              </div>
            </div>
          )}
          {step === 'complete' && (
            <div style={{ textAlign: 'center' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 14 }} style={{ fontSize: 52, marginBottom: 18 }}>🎉</motion.div>
              <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, background: 'linear-gradient(135deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Ready to Go</h2>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Here's what Javari set up for you:</p>
              <div style={{ textAlign: 'left', marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  config.city && `📍 Local channels — ${config.city}`,
                  config.hasJellyfin && '🟢 Jellyfin connected',
                  config.hasPlex && '🟠 Plex connected',
                  config.streamingServices.length > 0 && `📱 ${config.streamingServices.length} streaming services tracked`,
                  config.hasIPTV && '📡 IPTV ready',
                  config.cloudProviders.length > 0 && `☁️ ${config.cloudProviders.length} cloud providers for optimization`,
                  '✦ 24 demo channels pre-loaded (import your M3U for thousands more)',
                  '✦ Javari AI ready to help',
                ].filter(Boolean).map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} style={{ padding: '9px 13px', background: 'rgba(255,255,255,0.03)', borderRadius: 7, fontSize: 12, color: '#d1d5db' }}>
                    {item as string}
                  </motion.div>
                ))}
              </div>
              <button onClick={onComplete} style={{ padding: '14px 44px', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Enter Javari Omni-Media →</button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function IPTVWizardStep({ config, onUpdate, onNext }: { config: SetupConfig; onUpdate: (u: Partial<SetupConfig>) => void; onNext: () => void }) {
  const [notice, setNotice] = useState(false)
  return (
    <div>
      <div style={{ fontSize: 30, marginBottom: 14 }}>📡</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>IPTV & Live TV</h2>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 18, lineHeight: 1.7 }}>Have an IPTV subscription? Paste your M3U URL for thousands of live channels organized by category.</p>
      <div style={{ padding: 14, background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.12)', borderRadius: 8, marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#34d399', marginBottom: 6 }}>✓ Free channels included automatically</div>
        <div style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.6 }}>Pluto TV, Plex Live, Samsung TV Plus, Tubi, Stirr — 800+ free legal channels pre-loaded.</div>
      </div>
      {!config.hasIPTV ? (
        <button onClick={() => { if (!config.iptvNoticeAccepted) setNotice(true); else onUpdate({ hasIPTV: true }) }} style={{ width: '100%', padding: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#e2e8f0', cursor: 'pointer', fontSize: 13, marginBottom: 18 }}>+ Connect My IPTV Subscription</button>
      ) : (
        <input value={config.iptvUrl} onChange={e => onUpdate({ iptvUrl: e.target.value })} placeholder="https://yourprovider.com/playlist.m3u" style={{ width: '100%', padding: '11px 13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, color: '#e2e8f0', fontSize: 13, outline: 'none', marginBottom: 18 }} />
      )}
      {notice && (
        <div style={{ padding: 18, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 9, marginBottom: 18 }}>
          <p style={{ fontSize: 12, color: '#93c5fd', lineHeight: 1.7, marginBottom: 14 }}>When connecting an IPTV subscription, please ensure you have appropriate access rights for that service. Content laws vary by region. Javari connects to sources you provide — we don't host or endorse specific content. This notice appears once.</p>
          <div style={{ display: 'flex', gap: 9 }}>
            <button onClick={() => setNotice(false)} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#6b7280', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
            <button onClick={() => { onUpdate({ hasIPTV: true, iptvNoticeAccepted: true }); setNotice(false) }} style={{ flex: 2, padding: '8px', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', borderRadius: 7, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>I Understand — Enable IPTV</button>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Btn secondary onClick={onNext}>Skip</Btn>
        <Btn onClick={onNext}>Continue →</Btn>
      </div>
    </div>
  )
}

function Btn({ children, onClick, secondary }: { children: React.ReactNode; onClick: () => void; secondary?: boolean }) {
  return <button onClick={onClick} style={{ padding: '9px 22px', background: secondary ? 'transparent' : 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: secondary ? '1px solid rgba(255,255,255,0.08)' : 'none', borderRadius: 9, color: secondary ? '#6b7280' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: secondary ? 400 : 600 }}>{children}</button>
}
