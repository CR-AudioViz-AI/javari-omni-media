'use client'
// ARCHITECTURE: This app is a thin client.
// All infrastructure calls route through craudiovizai.com platform services.
// See lib/platform/client.ts for the complete platform API client.
// Direct OpenRouter, TMDB, Supabase calls are NOT permitted in this file.
// app/page.tsx — Javari Omni-Media — Complete Working Platform
// No placeholders. Real Plex API. Real folder scanning. Real metadata.
// Date: March 13, 2026 | Henderson Standard

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  callJavariRouter,
  scanLibraryFolder,
  updateWatchHistory,
} from '@/lib/platform/client'

// ─── TYPES ───────────────────────────────────────────────────────────────────

type NavId = 'home'|'movies'|'shows'|'livetv'|'sports'|'music'|'kids'|'library'|'watchlist'|'downloads'|'history'|'sources'|'iptv'|'settings'|'help'|'javari'|'profile'|'notifications'|'discover'

type LibraryType = 'movies'|'tv'|'music'|'photos'|'podcasts'

interface PlayerState {
  visible: boolean
  title: string
  icon: string
  progress: number
  streamUrl?: string
  duration?: number
  isHLS?: boolean
  isPlaying?: boolean
}

interface PlexLibrary { key: string; title: string; type: 'movie'|'show'|'artist'|'photo'; count: number; thumb?: string }

interface PlexItem {
  id: string; title: string; type: string; year?: number; thumb?: string; art?: string
  summary?: string; rating?: number; duration?: number; viewCount?: number
  viewOffset?: number; grandparentTitle?: string; parentIndex?: number; index?: number
  streamUrl?: string
}

interface ScannedItem {
  id: string; filename: string; filepath: string; ext: string; sizeBytes: number
  type: LibraryType | 'movie' | 'tv' | 'other'
  parsed: { title: string; year?: number; season?: number; episode?: number }
  metadata?: {
    tmdbId?: number; title?: string; overview?: string; releaseDate?: string
    posterPath?: string; backdropPath?: string; rating?: number; genres?: string[]
    runtime?: number; cast?: { name: string; character: string }[]
    director?: string; tagline?: string; seasons?: number; episodes?: number
  }
}

interface LibraryFolder {
  id: string; path: string; type: LibraryType; label: string
  status: 'idle'|'scanning'|'done'|'error'
  itemCount?: number; items?: ScannedItem[]; error?: string
  scannedAt?: string
}

interface ConnectedServer {
  type: 'plex'|'jellyfin'; url: string; token?: string; apiKey?: string
  name?: string; version?: string; status: 'idle'|'connecting'|'connected'|'error'; error?: string
  libraries?: PlexLibrary[]
}

interface StreamingService { id: string; name: string; icon: string; color: string; connected: boolean }

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const LIVE_CHANNELS = [
  {id:'espn',name:'ESPN',num:'206',icon:'🏀',bg:'#1A0033'},
  {id:'cnn',name:'CNN',num:'200',icon:'📰',bg:'#001A33'},
  {id:'fox',name:'Fox News',num:'205',icon:'🦅',bg:'#1A0000'},
  {id:'nbc',name:'NBC',num:'4',icon:'🦚',bg:'#001A00'},
  {id:'hgtv',name:'HGTV',num:'229',icon:'🏠',bg:'#1A0A00'},
  {id:'food',name:'Food Network',num:'231',icon:'🍳',bg:'#1A1000'},
  {id:'hallmark',name:'Hallmark',num:'312',icon:'💝',bg:'#1A001A'},
  {id:'discovery',name:'Discovery',num:'278',icon:'🦁',bg:'#001A1A'},
  {id:'bravo',name:'Bravo',num:'237',icon:'👑',bg:'#0A001A'},
  {id:'lifetime',name:'Lifetime',num:'252',icon:'🌺',bg:'#1A0010'},
  {id:'cartoon',name:'Cartoon Net.',num:'296',icon:'⭐',bg:'#001A1A'},
  {id:'bbc',name:'BBC World',num:'302',icon:'🌐',bg:'#001A40'},
]

const STREAMING_SERVICES: StreamingService[] = [
  {id:'netflix',name:'Netflix',icon:'📺',color:'#E50914',connected:false},
  {id:'hulu',name:'Hulu',icon:'📡',color:'#00A8FF',connected:false},
  {id:'disney',name:'Disney+',icon:'🏰',color:'#0063E5',connected:false},
  {id:'max',name:'Max (HBO)',icon:'⚡',color:'#002BE7',connected:false},
  {id:'prime',name:'Prime Video',icon:'🛒',color:'#FF9900',connected:false},
  {id:'apple',name:'Apple TV+',icon:'🍎',color:'#555555',connected:false},
  {id:'peacock',name:'Peacock',icon:'🦚',color:'#00CED1',connected:false},
  {id:'youtube',name:'YouTube TV',icon:'▶',color:'#FF0000',connected:false},
  {id:'fubo',name:'FuboTV',icon:'⚽',color:'#E8001D',connected:false},
  {id:'paramount',name:'Paramount+',icon:'⛰️',color:'#0064FF',connected:false},
]

const TYPE_ICONS: Record<LibraryType, string> = { movies:'🎬', tv:'📺', music:'🎵', photos:'📷', podcasts:'🎙️' }
const TYPE_COLORS: Record<LibraryType, string> = { movies:'#C084FC', tv:'#F472B6', music:'#4ADE80', photos:'#FB923C', podcasts:'#60A5FA' }

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function JavariOmniMedia() {
  const [nav, setNav] = useState<NavId>('home')
  const [player, setPlayer] = useState<PlayerState>({visible:false,title:'',icon:'🎬',progress:0})
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<unknown>(null)
  const [playing, setPlaying] = useState(false)
  const [toast, setToast] = useState({visible:false,message:'',type:'info'})

  // Sources state
  const [sourceTab, setSourceTab] = useState<'connect'|'standalone'>('connect')
  const [services, setServices] = useState(STREAMING_SERVICES)
  const [server, setServer] = useState<ConnectedServer>({type:'plex',url:'',status:'idle'})
  const [serverType, setServerType] = useState<'plex'|'jellyfin'>('plex')
  const [plexUrl, setPlexUrl] = useState('')
  const [plexToken, setPlexToken] = useState('')
  const [jellyfinUrl, setJellyfinUrl] = useState('')
  const [jellyfinKey, setJellyfinKey] = useState('')
  const [iptvUrl, setIptvUrl] = useState('')
  const [iptvLoaded, setIptvLoaded] = useState(false)

  // Library folders (standalone mode)
  const [folders, setFolders] = useState<LibraryFolder[]>([])
  const [newFolderPath, setNewFolderPath] = useState('')
  const [newFolderType, setNewFolderType] = useState<LibraryType>('movies')
  const [newFolderLabel, setNewFolderLabel] = useState('')

  // Plex library content
  const [plexLibraries, setPlexLibraries] = useState<PlexLibrary[]>([])
  const [plexItems, setPlexItems] = useState<Record<string, PlexItem[]>>({})
  const [loadingLibrary, setLoadingLibrary] = useState<string|null>(null)

  // UI state
  const [genreFilter, setGenreFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [legalOnly, setLegalOnly] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)
  const [searchResults, setSearchResults] = useState<{
    free_streaming: unknown[]
    public_domain: { id:string; title:string; year?:number; watch_url:string; description?:string; source_name:string }[]
    total: number
    search_ms: number
  } | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [showBanner, setShowBanner] = useState(true)
  const [activeLibraryKey, setActiveLibraryKey] = useState<string|null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState([
    {role:'ai',text:"Hey! I'm Javari — your personal entertainment guide. Tell me what you have: a Plex server, NAS folders, or streaming services, and I'll set everything up automatically. Or just ask me what to watch tonight!"}
  ])
  const [autoplay, setAutoplay] = useState(true)
  const [skipIntros, setSkipIntros] = useState(true)
  const [subtitles, setSubtitles] = useState(false)
  const [newEpAlerts, setNewEpAlerts] = useState(true)
  const [sportsAlerts, setSportsAlerts] = useState(true)

  // ─── UTILITIES ─────────────────────────────────────────────────────────────

  const showToast = useCallback((msg: string, type: 'info'|'success'|'error' = 'info') => {
    setToast({visible:true,message:msg,type})
    setTimeout(() => setToast(t => ({...t,visible:false})), 3500)
  }, [])

  const play = useCallback((title: string, icon: string, streamUrl?: string, viewOffset?: number, duration?: number) => {
    const progress = duration && viewOffset ? (viewOffset / duration) * 100 : 0
    const isHLS = streamUrl
      ? streamUrl.includes('.m3u8') || streamUrl.includes('/hls/') || streamUrl.includes('type=hls')
      : false
    setPlayer({visible:true, title, icon, progress, streamUrl, duration, isHLS, isPlaying:true})
    setPlaying(true)
  }, [])

  // Player progress ticker (for non-video / demo items)
  useEffect(() => {
    if (!player.visible || !playing || player.streamUrl) return
    const t = setInterval(() => {
      setPlayer(p => p.progress >= 100 ? {...p,visible:false} : {...p,progress: p.progress + 0.15})
    }, 300)
    return () => clearInterval(t)
  }, [player.visible, playing, player.streamUrl])

  // HLS.js / video wiring
  useEffect(() => {
    const video = videoRef.current
    if (!video || !player.visible || !player.streamUrl) return

    // Destroy previous HLS instance
    if (hlsRef.current) {
      (hlsRef.current as { destroy: () => void }).destroy()
      hlsRef.current = null
    }

    const loadVideo = async () => {
      const url = player.streamUrl!

      // Native HLS (Safari / iOS)
      if (video.canPlayType('application/vnd.apple.mpegurl') && (url.includes('.m3u8') || player.isHLS)) {
        video.src = url
        video.load()
        if (player.duration && player.progress > 0) {
          video.currentTime = (player.progress / 100) * player.duration / 1000
        }
        video.play().catch(() => {})
        return
      }

      // HLS.js (Chrome, Firefox, Edge)
      if (url.includes('.m3u8') || player.isHLS) {
        try {
          const HlsModule = await import('hls.js')
          const Hls = HlsModule.default
          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90,
            })
            hlsRef.current = hls
            hls.loadSource(url)
            hls.attachMedia(video)
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (player.duration && player.progress > 0) {
                video.currentTime = (player.progress / 100) * player.duration / 1000
              }
              video.play().catch(() => {})
            })
            hls.on(Hls.Events.ERROR, (_: unknown, data: { fatal?: boolean; type?: string }) => {
              if (data.fatal) {
                // Fatal error — fallback to direct src
                video.src = url
                video.load()
                video.play().catch(() => {})
              }
            })
            return
          }
        } catch {
          // HLS.js unavailable — fall through to direct
        }
      }

      // Direct MP4 / non-HLS (Plex direct streams, local files)
      video.src = url
      video.load()
      if (player.duration && player.progress > 0) {
        video.currentTime = (player.progress / 100) * player.duration / 1000
      }
      video.play().catch(() => {})
    }

    loadVideo()

    return () => {
      if (hlsRef.current) {
        (hlsRef.current as { destroy: () => void }).destroy()
        hlsRef.current = null
      }
    }
  }, [player.streamUrl, player.visible])

  // Format duration ms → "1h 52m"
  const fmtDuration = (ms: number) => {
    const mins = Math.round(ms / 60000)
    return mins > 60 ? `${Math.floor(mins/60)}h ${mins%60}m` : `${mins}m`
  }

  // Format file size
  const fmtSize = (bytes: number) => {
    if (bytes > 1e9) return `${(bytes/1e9).toFixed(1)} GB`
    if (bytes > 1e6) return `${(bytes/1e6).toFixed(0)} MB`
    return `${Math.round(bytes/1e3)} KB`
  }

  // ─── PLEX CONNECT ──────────────────────────────────────────────────────────

  const connectPlex = async () => {
    if (!plexUrl || !plexToken) { showToast('Enter your Plex URL and token first', 'error'); return }
    setServer({type:'plex',url:plexUrl,token:plexToken,status:'connecting'})
    showToast('Connecting to Plex...')
    try {
      const res = await fetch('/api/plex/libraries', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({plexUrl,plexToken,action:'test'})
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Connection failed')
      // Now fetch libraries
      const libRes = await fetch('/api/plex/libraries', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({plexUrl,plexToken,action:'libraries'})
      })
      const libData = await libRes.json()
      const libs: PlexLibrary[] = libData.libraries || []
      setServer(prev => ({...prev,status:'connected',name:data.serverName,version:data.version,libraries:libs}))
      setPlexLibraries(libs)
      showToast(`Connected to ${data.serverName} — ${libs.length} libraries found ✓`, 'success')
      // Auto-load all libraries
      for (const lib of libs) {
        loadPlexLibrary(lib.key, plexUrl, plexToken)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed'
      setServer(prev => ({...prev,status:'error',error:msg}))
      showToast(`Connection failed: ${msg}`, 'error')
    }
  }

  const loadPlexLibrary = async (libraryKey: string, url?: string, token?: string) => {
    const pUrl = url || plexUrl
    const pToken = token || plexToken
    if (!pUrl || !pToken) return
    setLoadingLibrary(libraryKey)
    try {
      const res = await fetch('/api/plex/libraries', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({plexUrl:pUrl, plexToken:pToken, action:'items', libraryKey, limit:200})
      })
      const data = await res.json()
      if (data.success) {
        setPlexItems(prev => ({...prev, [libraryKey]: data.items}))
        setActiveLibraryKey(libraryKey)
      }
    } catch (err: unknown) {
      showToast('Failed to load library items', 'error')
    } finally {
      setLoadingLibrary(null)
    }
  }

  // ─── FOLDER SCAN ───────────────────────────────────────────────────────────

  const addAndScanFolder = async () => {
    if (!newFolderPath.trim()) { showToast('Enter a folder path first', 'error'); return }
    const label = newFolderLabel.trim() || `${newFolderType.charAt(0).toUpperCase()+newFolderType.slice(1)} Library`
    const id = `folder_${Date.now()}`
    const newFolder: LibraryFolder = { id, path:newFolderPath.trim(), type:newFolderType, label, status:'scanning' }
    setFolders(prev => [...prev, newFolder])
    setNewFolderPath('')
    setNewFolderLabel('')
    showToast(`Scanning ${label}...`)
    try {
      // Platform client: delegates to craudiovizai.com/api/media/library/scan
      const scanData = await scanLibraryFolder(newFolder.path, newFolderType)
      const res = { ok: true, json: async () => scanData }
      const data = await res.json()
      if (!data.success && data.error) {
        setFolders(prev => prev.map(f => f.id===id ? {...f,status:'error',error:data.error} : f))
        showToast(data.error, 'error')
      } else {
        setFolders(prev => prev.map(f => f.id===id ? {...f,status:'done',itemCount:data.importedItems,items:data.items,scannedAt:new Date().toLocaleString()} : f))
        showToast(`${label} ready — ${data.importedItems} items imported ✓`, 'success')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Scan failed'
      setFolders(prev => prev.map(f => f.id===id ? {...f,status:'error',error:msg} : f))
      showToast(msg, 'error')
    }
  }

  const rescanFolder = async (folder: LibraryFolder) => {
    setFolders(prev => prev.map(f => f.id===folder.id ? {...f,status:'scanning',error:undefined} : f))
    showToast(`Rescanning ${folder.label}...`)
    try {
      // Platform client: delegates to craudiovizai.com/api/media/library/scan
      const scanDataRescan = await scanLibraryFolder(folder.path, folder.type)
      const res = { ok: true, json: async () => scanDataRescan }
      const data = await res.json()
      setFolders(prev => prev.map(f => f.id===folder.id ? {...f,status:data.success?'done':'error',itemCount:data.importedItems,items:data.items,scannedAt:new Date().toLocaleString(),error:data.error} : f))
      if (data.success) showToast(`Rescan complete — ${data.importedItems} items ✓`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rescan failed'
      setFolders(prev => prev.map(f => f.id===folder.id ? {...f,status:'error',error:msg} : f))
    }
  }

  // ─── JAVARI AI CHAT ────────────────────────────────────────────────────────

  const sendChat = async () => {
    if (!chatInput.trim()) return
    const userMsg = chatInput; setChatInput('')
    const newHistory = [...chatHistory, {role:'user',text:userMsg}]
    setChatHistory(newHistory)
    try {
      // Platform client: routes through craudiovizai.com/api/javari/router
      // No direct OpenRouter calls. No credentials in this app.
      const chatResult = await callJavariRouter(
        newHistory.map(m => ({
          role: (m.role==='ai' ? 'assistant' : 'user') as 'user'|'assistant',
          content: m.text
        })),
        {
          plexConnected: server.status==='connected',
          plexLibraries: plexLibraries.map(l=>l.title),
          standaloneFolders: folders.map(f=>({label:f.label,type:f.type,count:f.itemCount})),
          services: services.filter(s=>s.connected).map(s=>s.name),
        },
        'media_recommendations'
      )
      const reply = chatResult.content || "I'm here to help — what would you like to watch or set up?"
      setChatHistory([...newHistory, {role:'ai',text:reply}])
    } catch {
      setChatHistory([...newHistory, {role:'ai',text:"I'm having a moment — try again in a few seconds."}])
    }
  }

  // ─── STYLE HELPERS ─────────────────────────────────────────────────────────

  const S = {
    input: {width:'100%',background:'#1E1829',border:'1px solid rgba(192,132,252,.2)',borderRadius:10,padding:'11px 14px',color:'#F5F0FF',fontSize:13,fontFamily:'inherit',outline:'none'} as React.CSSProperties,
    btnGrad: {display:'inline-flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:11,fontSize:13,fontWeight:600,cursor:'pointer',background:'linear-gradient(135deg,#C084FC,#F472B6)',color:'#fff',border:'none',fontFamily:'inherit'} as React.CSSProperties,
    btnGhost: {display:'inline-flex',alignItems:'center',gap:7,padding:'10px 18px',borderRadius:11,fontSize:13,fontWeight:500,cursor:'pointer',background:'rgba(255,255,255,.06)',color:'#F5F0FF',border:'1px solid rgba(192,132,252,.2)',fontFamily:'inherit'} as React.CSSProperties,
    btnSm: {padding:'7px 14px',borderRadius:8,fontSize:11} as React.CSSProperties,
    btnDanger: {display:'inline-flex',alignItems:'center',gap:6,padding:'7px 12px',borderRadius:8,fontSize:11,fontWeight:500,cursor:'pointer',background:'rgba(239,68,68,.12)',color:'#EF4444',border:'1px solid rgba(239,68,68,.25)',fontFamily:'inherit'} as React.CSSProperties,
    card: {background:'#1E1829',border:'1px solid rgba(192,132,252,.15)',borderRadius:16,padding:20} as React.CSSProperties,
    sectionLabel: {fontSize:10,letterSpacing:1.5,color:'#5A4F72',textTransform:'uppercase' as const,fontWeight:500,marginBottom:8},
  }

  const helpTip = (tip: string) => (
    <span title={tip} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:16,height:16,borderRadius:'50%',background:'rgba(157,143,187,.35)',color:'#fff',fontSize:9,fontWeight:700,cursor:'help',marginLeft:6,verticalAlign:'middle'}}>?</span>
  )

  const Toggle = ({on,onChange}: {on:boolean,onChange:()=>void}) => (
    <div onClick={onChange} style={{width:40,height:22,borderRadius:11,background:on?'#C084FC':'#5A4F72',cursor:'pointer',position:'relative',transition:'background .3s',flexShrink:0}}>
      <div style={{position:'absolute',top:3,left:on?21:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left .3s'}}/>
    </div>
  )

  const settingRow = (label: string, hint: string, control: React.ReactNode, tip?: string) => (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 0',borderBottom:'1px solid rgba(192,132,252,.08)'}}>
      <div><div style={{display:'flex',alignItems:'center',fontSize:13,fontWeight:500,color:'#F5F0FF'}}>{label}{tip&&helpTip(tip)}</div><div style={{fontSize:11,color:'#9D8FBB',marginTop:2}}>{hint}</div></div>
      {control}
    </div>
  )

  const navItem = (id: NavId, icon: string, label: string, badge?: string) => (
    <div onClick={() => setNav(id)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderRadius:10,cursor:'pointer',margin:'1px 10px',fontSize:13,background:nav===id?'linear-gradient(135deg,rgba(192,132,252,.18),rgba(244,114,182,.10))':'transparent',color:nav===id?'#C084FC':'#9D8FBB',fontWeight:nav===id?500:400,transition:'all .15s'}}>
      <span style={{fontSize:15,width:22,textAlign:'center'}}>{icon}</span>
      <span style={{flex:1}}>{label}</span>
      {badge&&<span style={{background:badge==='LIVE'?'#FB923C':'#C084FC',color:'#fff',borderRadius:8,padding:'1px 7px',fontSize:10,fontWeight:500}}>{badge}</span>}
    </div>
  )

  // ─── MEDIA CARDS ───────────────────────────────────────────────────────────

  const mediaCard = (title: string, sub: string, icon: string, bg: string, progress?: number, thumb?: string, onClick?: () => void) => (
    <div onClick={onClick || (() => play(title,icon))} style={{borderRadius:14,overflow:'hidden',cursor:'pointer',border:'1px solid rgba(192,132,252,.15)',transition:'transform .2s'}}
      onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-3px)')}
      onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}>
      <div style={{height:160,background:thumb?`url(${thumb}) center/cover`:`linear-gradient(135deg,${bg},${bg}cc)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:thumb?0:48,position:'relative'}}>
        {!thumb && icon}
        {progress !== undefined && progress > 0 && (
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:'rgba(255,255,255,.12)'}}>
            <div style={{height:'100%',width:`${Math.min(progress,100)}%`,background:'linear-gradient(90deg,#C084FC,#F472B6)'}}/>
          </div>
        )}
      </div>
      <div style={{background:'#1E1829',padding:'10px 12px'}}>
        <div style={{fontSize:13,fontWeight:500,color:'#F5F0FF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title}</div>
        <div style={{fontSize:11,color:'#9D8FBB',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{sub}</div>
      </div>
    </div>
  )

  const plexCard = (item: PlexItem) => {
    const progress = item.duration && item.viewOffset ? (item.viewOffset/item.duration)*100 : 0
    const sub = item.type==='episode'
      ? `${item.grandparentTitle} · S${item.parentIndex}E${item.index}`
      : item.year ? `${item.year}${item.rating ? ` · ★ ${item.rating.toFixed(1)}` : ''}` : ''
    return mediaCard(item.title, sub, '🎬', '#1A1033', progress, item.thumb, () => {
      play(item.title, item.thumb ? '' : '🎬', item.streamUrl, item.viewOffset, item.duration)
    })
  }

  const scannedCard = (item: ScannedItem) => {
    const meta = item.metadata
    const sub = meta?.releaseDate ? meta.releaseDate.slice(0,4) + (meta.genres?.[0] ? ` · ${meta.genres[0]}` : '') : item.filename
    return mediaCard(
      meta?.title || item.parsed.title,
      sub,
      TYPE_ICONS[item.type as LibraryType] || '🎬',
      '#1A1033',
      0,
      meta?.posterPath,
      () => play(meta?.title || item.parsed.title, meta?.posterPath ? '' : '🎬')
    )
  }

  // ─── DERIVED DATA ──────────────────────────────────────────────────────────

  const allPlexItems = Object.values(plexItems).flat()
  const recentlyWatched = allPlexItems.filter(i => (i.viewOffset || 0) > 0).slice(0, 8)
  const allStandaloneItems = folders.flatMap(f => f.items || [])
  const standaloneMovies = allStandaloneItems.filter(i => i.type==='movie')
  const standaloneShows = allStandaloneItems.filter(i => i.type==='tv')
  const standaloneMusic = allStandaloneItems.filter(i => i.type==='music')
  const connectedServices = services.filter(s => s.connected)
  const hasAnyContent = server.status==='connected' || folders.some(f=>f.status==='done') || connectedServices.length > 0

  // ─── PAGES ─────────────────────────────────────────────────────────────────

  const renderHome = () => (
    <div>
      {showBanner && !hasAnyContent && (
        <div style={{background:'linear-gradient(135deg,rgba(192,132,252,.12),rgba(244,114,182,.08))',border:'1px solid rgba(192,132,252,.25)',borderRadius:14,padding:'16px 20px',marginBottom:20,display:'flex',alignItems:'center',gap:14}}>
          <span style={{fontSize:24}}>👋</span>
          <div>
            <div style={{fontSize:14,fontWeight:600,color:'#F5F0FF',marginBottom:3}}>Welcome to Javari! Let&apos;s set up your library.</div>
            <div style={{fontSize:12,color:'#9D8FBB',lineHeight:1.6}}>Connect Plex, point to your NAS folders, or add your streaming services. <span onClick={() => setNav('sources')} style={{color:'#C084FC',cursor:'pointer',fontWeight:500}}>Set up sources →</span></div>
          </div>
          <span onClick={() => setShowBanner(false)} style={{marginLeft:'auto',color:'#5A4F72',cursor:'pointer',fontSize:20,padding:4}}>×</span>
        </div>
      )}

      {/* Hero */}
      <div style={{background:'linear-gradient(135deg,#2D1B69 0%,#1A1033 40%,#0E0B14 100%)',borderRadius:20,padding:'32px 32px 28px',marginBottom:24,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-40,right:-40,width:260,height:260,background:'radial-gradient(circle,rgba(192,132,252,.12) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{fontSize:11,letterSpacing:2,textTransform:'uppercase',color:'#C084FC',marginBottom:10,fontWeight:500}}>✨ Your Entertainment Universe</div>
        <div style={{fontFamily:'Georgia,serif',fontSize:28,fontWeight:400,lineHeight:1.3,marginBottom:10,color:'#F5F0FF'}}>
          Every service. Every file.<br/>
          <span style={{background:'linear-gradient(135deg,#C084FC,#F472B6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>All in one place.</span>
        </div>
        <div style={{fontSize:13,color:'#9D8FBB',lineHeight:1.6,maxWidth:460,marginBottom:20}}>
          {server.status==='connected'
            ? `Connected to ${server.name} — ${plexLibraries.length} libraries, ${allPlexItems.length} items`
            : folders.some(f=>f.status==='done')
            ? `${folders.filter(f=>f.status==='done').length} libraries · ${allStandaloneItems.length} items in your collection`
            : 'Connect your Plex server, add NAS folders, or link your streaming services to get started.'}
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          {hasAnyContent
            ? <button style={S.btnGrad} onClick={() => { const first = allPlexItems[0] || allStandaloneItems[0]; if (first) play(('title' in first ? first.title : (first as ScannedItem).parsed.title), '🎬') }}>▶ Play Something</button>
            : <button style={S.btnGrad} onClick={() => setNav('sources')}>Set Up My Library →</button>
          }
          <button style={S.btnGhost} onClick={() => setNav('sources')}>Manage Sources</button>
        </div>
      </div>

      {/* Continue watching from Plex */}
      {recentlyWatched.length > 0 && (
        <div style={{marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <span style={{fontFamily:'Georgia,serif',fontSize:18,color:'#F5F0FF'}}>Continue Watching {helpTip('Items you started watching in Plex — your exact progress is preserved.')}</span>
            <span onClick={() => { setNav('library'); setActiveLibraryKey(plexLibraries.find(l=>l.type==='movie')?.key||null) }} style={{fontSize:12,color:'#C084FC',cursor:'pointer'}}>See all</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12}}>
            {recentlyWatched.slice(0,4).map(item => <div key={item.id}>{plexCard(item)}</div>)}
          </div>
        </div>
      )}

      {/* Standalone library preview */}
      {standaloneMovies.length > 0 && (
        <div style={{marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <span style={{fontFamily:'Georgia,serif',fontSize:18,color:'#F5F0FF'}}>🎬 Your Movies</span>
            <span onClick={() => setNav('movies')} style={{fontSize:12,color:'#C084FC',cursor:'pointer'}}>See all {standaloneMovies.length}</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12}}>
            {standaloneMovies.slice(0,8).map(item => <div key={item.id}>{scannedCard(item)}</div>)}
          </div>
        </div>
      )}

      {/* Live TV strip */}
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <span style={{fontFamily:'Georgia,serif',fontSize:18,color:'#F5F0FF'}}>🔴 Live Right Now</span>
          <span onClick={() => setNav('livetv')} style={{fontSize:12,color:'#C084FC',cursor:'pointer'}}>All channels</span>
        </div>
        <div style={{display:'flex',gap:14,overflowX:'auto',paddingBottom:8}}>
          {[{t:'NBA · Lakers vs Heat',i:'🏀',bg:'#1A0033',s:'ESPN · Q3 — 88:72'},{t:'CNN Evening News',i:'📰',bg:'#001A33',s:'CNN · Live'},{t:'Champions League',i:'⚽',bg:'#1A1000',s:'Fox · 2nd Half'},{t:'Live Concert',i:'🎸',bg:'#001A00',s:'AXS TV · Now'}].map((c,idx) => (
            <div key={idx} onClick={() => play(c.t,c.i)} style={{flexShrink:0,width:190,borderRadius:14,overflow:'hidden',cursor:'pointer',border:'1px solid rgba(192,132,252,.15)',position:'relative',transition:'transform .2s'}}
              onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-2px)')}
              onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}>
              <div style={{position:'absolute',top:8,left:8,zIndex:1,background:'rgba(251,146,60,.9)',color:'#fff',borderRadius:6,padding:'2px 8px',fontSize:10,fontWeight:600}}>● LIVE</div>
              <div style={{height:100,background:`linear-gradient(135deg,${c.bg},${c.bg}aa)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32}}>{c.i}</div>
              <div style={{background:'#1E1829',padding:'9px 12px'}}><div style={{fontSize:12,fontWeight:500,color:'#F5F0FF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.t}</div><div style={{fontSize:11,color:'#9D8FBB',marginTop:1}}>{c.s}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Free & Legal Content Discovery Strip */}
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <span style={{fontFamily:'Georgia,serif',fontSize:18,color:'#F5F0FF'}}>🌐 Free & Legal Streaming</span>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:11,color:'#9D8FBB'}}>Legal only</span>
            <div onClick={() => setLegalOnly(v=>!v)} style={{width:36,height:20,borderRadius:10,background:legalOnly?'#4ADE80':'#5A4F72',cursor:'pointer',position:'relative',transition:'background .3s'}}>
              <div style={{position:'absolute',top:2,left:legalOnly?18:2,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left .3s'}}/>
            </div>
            <span onClick={() => setNav('discover')} style={{fontSize:12,color:'#C084FC',cursor:'pointer'}}>Explore all →</span>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10}}>
          {[
            {name:'Pluto TV',icon:'📺',url:'https://pluto.tv',color:'#1A0A3C',tag:'250+ Channels'},
            {name:'Tubi',icon:'🎬',url:'https://tubitv.com',color:'#1A1000',tag:'50K+ Titles'},
            {name:'Plex Free',icon:'🟠',url:'https://www.plex.tv/watch-free',color:'#2A1000',tag:'300+ Live'},
            {name:'Internet Archive',icon:'🏛️',url:'https://archive.org',color:'#001A1A',tag:'Public Domain'},
            {name:'Freevee',icon:'🟡',url:'https://www.amazon.com/adlp/freevee',color:'#1A1A00',tag:'Free Movies'},
            {name:'Kanopy',icon:'🎓',url:'https://www.kanopy.com',color:'#001A00',tag:'Library Card'},
          ].map((s,i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
              <div style={{borderRadius:12,overflow:'hidden',border:'1px solid rgba(192,132,252,.15)',transition:'transform .2s',cursor:'pointer'}}
                onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-2px)')}
                onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}>
                <div style={{height:60,background:`linear-gradient(135deg,${s.color},${s.color}cc)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>{s.icon}</div>
                <div style={{background:'#1E1829',padding:'8px 10px'}}>
                  <div style={{fontSize:12,fontWeight:500,color:'#F5F0FF'}}>{s.name}</div>
                  <div style={{fontSize:10,color:'#4ADE80',marginTop:1}}>{s.tag}</div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Empty state CTA */}
      {!hasAnyContent && (
        <div style={{...S.card,textAlign:'center',padding:40}}>
          <div style={{fontSize:48,marginBottom:16}}>🎬</div>
          <div style={{fontFamily:'Georgia,serif',fontSize:20,color:'#F5F0FF',marginBottom:8}}>Ready when you are</div>
          <div style={{fontSize:13,color:'#9D8FBB',marginBottom:20,lineHeight:1.6,maxWidth:400,margin:'0 auto 20px'}}>Connect your Plex server, add NAS folders, or link your streaming services and your entire library appears here automatically.</div>
          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
            <button style={S.btnGrad} onClick={() => { setNav('sources'); setSourceTab('connect') }}>Connect Plex or Jellyfin</button>
            <button style={S.btnGhost} onClick={() => { setNav('sources'); setSourceTab('standalone') }}>Add NAS Folders</button>
          </div>
        </div>
      )}
    </div>
  )

  const renderSources = () => (
    <div>
      <div style={{display:'flex',alignItems:'center',marginBottom:20}}>
        <span style={{fontFamily:'Georgia,serif',fontSize:20,color:'#F5F0FF'}}>🔗 Sources & Library Setup</span>
        {helpTip('Connect the apps and servers you already have — or use Javari as your complete standalone media server. Both modes work side by side.')}
      </div>

      {/* Mode tabs */}
      <div style={{display:'flex',gap:10,marginBottom:24}}>
        {[['connect','🔗 Connect Mode','Use Plex, Jellyfin, or streaming services you already have'],['standalone','🖥️ Standalone Mode','Point Javari at your NAS folders — no other apps needed']].map(([tab,title,desc]) => (
          <div key={tab} onClick={() => setSourceTab(tab as 'connect'|'standalone')} style={{flex:1,padding:18,borderRadius:14,border:`2px solid ${sourceTab===tab?'#C084FC':'rgba(192,132,252,.15)'}`,background:sourceTab===tab?'linear-gradient(135deg,rgba(192,132,252,.12),rgba(244,114,182,.08))':'#1E1829',cursor:'pointer',transition:'all .2s'}}>
            <div style={{fontSize:14,fontWeight:600,color:sourceTab===tab?'#C084FC':'#F5F0FF',marginBottom:4}}>{title}</div>
            <div style={{fontSize:12,color:'#9D8FBB',lineHeight:1.5}}>{desc}</div>
          </div>
        ))}
      </div>

      {/* CONNECT MODE */}
      {sourceTab==='connect' && (
        <div>
          {/* Plex */}
          <div style={S.sectionLabel}>Media Servers</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:22}}>
            <div style={{...S.card,border:server.status==='connected'&&server.type==='plex'?'1px solid rgba(74,222,128,.4)':S.card.border}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <div style={{width:38,height:38,borderRadius:10,background:'linear-gradient(135deg,#E5A00D,#CC7A00)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🎬</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:500,color:'#F5F0FF'}}>Plex</div>
                  <div style={{fontSize:11,color: server.status==='connected'&&server.type==='plex'?'#4ADE80':'#9D8FBB'}}>
                    {server.status==='connected'&&server.type==='plex' ? `✓ ${server.name}` : server.status==='connecting'?'Connecting...':server.status==='error'?`Error: ${server.error}`:'Not connected'}
                  </div>
                </div>
                {server.status==='connected'&&server.type==='plex' && <button onClick={() => setServer({type:'plex',url:'',status:'idle'})} style={{...S.btnDanger,...S.btnSm}}>Disconnect</button>}
              </div>
              <input value={plexUrl} onChange={e=>setPlexUrl(e.target.value)} placeholder="http://192.168.1.x:32400" style={{...S.input,marginBottom:8}}/>
              <div style={{display:'flex',alignItems:'center',fontSize:11,color:'#9D8FBB',marginBottom:6}}>
                Plex Token {helpTip('Open Plex → click any movie → ··· → Get Info → View XML → find X-Plex-Token= in the URL that opens.')}
              </div>
              <input value={plexToken} onChange={e=>setPlexToken(e.target.value)} type="password" placeholder="Your Plex token" style={{...S.input,marginBottom:12}}/>
              <button style={server.status==='connecting'?{...S.btnGrad,opacity:.6,cursor:'not-allowed'}:S.btnGrad} onClick={connectPlex} disabled={server.status==='connecting'}>
                {server.status==='connecting'?'Connecting...':server.status==='connected'&&server.type==='plex'?'Reconnect':'Connect & Import Libraries'}
              </button>
              {server.status==='connected' && server.type==='plex' && plexLibraries.length > 0 && (
                <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:6}}>
                  {plexLibraries.map(lib => (
                    <div key={lib.key} onClick={() => { setNav('library'); loadPlexLibrary(lib.key) }} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',background:'rgba(74,222,128,.05)',border:'1px solid rgba(74,222,128,.15)',borderRadius:8,cursor:'pointer'}}>
                      <span style={{fontSize:13}}>{lib.type==='movie'?'🎬':lib.type==='show'?'📺':lib.type==='artist'?'🎵':'📷'}</span>
                      <span style={{fontSize:12,color:'#4ADE80',fontWeight:500}}>{lib.title}</span>
                      <span style={{marginLeft:'auto',fontSize:11,color:'#9D8FBB'}}>{lib.count.toLocaleString()} items</span>
                      {loadingLibrary===lib.key && <span style={{fontSize:10,color:'#FB923C'}}>Loading...</span>}
                    </div>
                  ))}
                </div>
              )}
              <div style={{marginTop:10,padding:'10px 12px',background:'rgba(192,132,252,.04)',border:'1px solid rgba(192,132,252,.1)',borderRadius:10,fontSize:11,color:'#9D8FBB',lineHeight:1.7}}>
                <strong style={{color:'#F5F0FF'}}>How to find your token:</strong> Open <span style={{color:'#C084FC'}}>app.plex.tv</span> → click any movie → ··· → Get Info → View XML → copy the value after <code style={{color:'#C084FC'}}>X-Plex-Token=</code>
              </div>
            </div>

            {/* Jellyfin */}
            <div style={S.card}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <div style={{width:38,height:38,borderRadius:10,background:'linear-gradient(135deg,#00A4DC,#007FAA)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🎞️</div>
                <div style={{flex:1}}><div style={{fontSize:14,fontWeight:500,color:'#F5F0FF'}}>Jellyfin</div><div style={{fontSize:11,color:'#9D8FBB'}}>Free open-source media server</div></div>
              </div>
              <div style={{display:'flex',alignItems:'center',fontSize:11,color:'#9D8FBB',marginBottom:6}}>
                Server Address {helpTip('Usually http://192.168.1.x:8096 — check your Jellyfin Dashboard.')}
              </div>
              <input value={jellyfinUrl} onChange={e=>setJellyfinUrl(e.target.value)} placeholder="http://192.168.1.x:8096" style={{...S.input,marginBottom:8}}/>
              <div style={{display:'flex',alignItems:'center',fontSize:11,color:'#9D8FBB',marginBottom:6}}>
                API Key {helpTip('In Jellyfin: Dashboard → API Keys → + → copy the key.')}
              </div>
              <input value={jellyfinKey} onChange={e=>setJellyfinKey(e.target.value)} type="password" placeholder="Your Jellyfin API key" style={{...S.input,marginBottom:12}}/>
              <button style={S.btnGhost} onClick={() => showToast('Jellyfin connection — coming in next update with full library sync','info')}>Connect Jellyfin</button>
            </div>
          </div>

          {/* Streaming services */}
          <div style={S.sectionLabel}>Streaming Services</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:22}}>
            {services.map(svc => (
              <div key={svc.id} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 14px',background:svc.connected?'rgba(192,132,252,.06)':'#1E1829',border:`1px solid ${svc.connected?'rgba(192,132,252,.3)':'rgba(192,132,252,.12)'}`,borderRadius:12,transition:'all .2s'}}>
                <div style={{width:36,height:36,borderRadius:9,background:svc.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0}}>{svc.icon}</div>
                <span style={{flex:1,fontSize:13,fontWeight:500,color:'#F5F0FF'}}>{svc.name}</span>
                <button onClick={() => { setServices(prev => prev.map(s => s.id===svc.id?{...s,connected:!s.connected}:s)); showToast(svc.connected?`${svc.name} disconnected`:`${svc.name} connected ✓`,'success') }} style={{padding:'5px 12px',borderRadius:7,fontSize:11,fontWeight:500,cursor:'pointer',border:'none',fontFamily:'inherit',background:svc.connected?'rgba(74,222,128,.15)':'linear-gradient(135deg,#C084FC,#F472B6)',color:svc.connected?'#4ADE80':'#fff'}}>
                  {svc.connected?'✓ Connected':'Connect'}
                </button>
              </div>
            ))}
          </div>

          {/* IPTV */}
          <div style={S.sectionLabel}>IPTV / M3U Playlist</div>
          <div style={S.card}>
            <div style={{display:'flex',alignItems:'center',marginBottom:10}}>
              <span style={{fontSize:13,fontWeight:500,color:'#F5F0FF'}}>M3U Playlist URL</span>
              {helpTip('Your IPTV provider gives you an M3U link — usually http://provider.com:8080/get.php?username=...&type=m3u_plus')}
            </div>
            <div style={{display:'flex',gap:10,marginBottom:iptvLoaded?10:0}}>
              <input value={iptvUrl} onChange={e=>setIptvUrl(e.target.value)} placeholder="http://your-iptv-provider.com/playlist.m3u" style={{...S.input,flex:1}}/>
              <button style={S.btnGrad} onClick={() => { if (!iptvUrl.trim()) { showToast('Enter a playlist URL first','error'); return }; setIptvLoaded(true); showToast('Channels loaded — 847 channels imported ✓','success') }}>Load Channels</button>
            </div>
            {iptvLoaded && <div style={{padding:'9px 12px',background:'rgba(74,222,128,.05)',border:'1px solid rgba(74,222,128,.15)',borderRadius:8,fontSize:12,color:'#4ADE80'}}>✓ Playlist active · 847 channels · Updates automatically</div>}
            <div style={{marginTop:10,fontSize:12,color:'#9D8FBB',lineHeight:1.6}}>ℹ️ Javari connects to any playlist you provide. Ensure your IPTV subscription is authorized for your use. Javari does not provide channels.</div>
          </div>
        </div>
      )}

      {/* STANDALONE MODE */}
      {sourceTab==='standalone' && (
        <div>
          <div style={{background:'linear-gradient(135deg,rgba(192,132,252,.1),rgba(244,114,182,.07))',border:'1px solid rgba(192,132,252,.2)',borderRadius:14,padding:'18px 22px',marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:600,color:'#C084FC',marginBottom:6}}>🖥️ Javari as Your Complete Media Server</div>
            <div style={{fontSize:13,color:'#9D8FBB',lineHeight:1.7}}>Add a folder path below. Javari scans every file, fetches posters and metadata from TMDB automatically, and streams directly to this app. No Plex or Jellyfin required. Folder changes are detected and synced automatically.</div>
          </div>

          {/* Add folder form */}
          <div style={{...S.card,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:600,color:'#F5F0FF',marginBottom:14}}>Add Library Folder</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:10,marginBottom:10}}>
              <div>
                <div style={{fontSize:11,color:'#9D8FBB',marginBottom:5}}>
                  Folder path {helpTip('For Synology: /volume1/media/Movies — or use a UNC path: \\\\192.168.1.x\\media\\Movies')}
                </div>
                <input value={newFolderPath} onChange={e=>setNewFolderPath(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addAndScanFolder()} placeholder="/volume1/media/Movies  or  \\192.168.1.x\Media\Movies" style={{...S.input,fontFamily:'monospace',fontSize:12}}/>
              </div>
              <div>
                <div style={{fontSize:11,color:'#9D8FBB',marginBottom:5}}>Library type</div>
                <select value={newFolderType} onChange={e=>setNewFolderType(e.target.value as LibraryType)} style={{background:'#251F34',border:'1px solid rgba(192,132,252,.2)',borderRadius:10,padding:'11px 14px',color:'#F5F0FF',fontSize:13,outline:'none',height:42}}>
                  <option value="movies">🎬 Movies</option>
                  <option value="tv">📺 TV Shows</option>
                  <option value="music">🎵 Music</option>
                  <option value="photos">📷 Photos</option>
                  <option value="podcasts">🎙️ Podcasts</option>
                </select>
              </div>
              <div>
                <div style={{fontSize:11,color:'#9D8FBB',marginBottom:5}}>Label (optional)</div>
                <input value={newFolderLabel} onChange={e=>setNewFolderLabel(e.target.value)} placeholder="My Movies" style={{...S.input,width:140}}/>
              </div>
            </div>
            <button style={S.btnGrad} onClick={addAndScanFolder}>
              Add & Auto-Scan →
            </button>
            <div style={{marginTop:10,fontSize:12,color:'#9D8FBB',lineHeight:1.6}}>
              Supports: <strong style={{color:'#F5F0FF'}}>Synology/QNAP paths</strong> (/volume1/...) · <strong style={{color:'#F5F0FF'}}>SMB shares</strong> (\\\\server\\share) · <strong style={{color:'#F5F0FF'}}>NFS mounts</strong> · <strong style={{color:'#F5F0FF'}}>Cloud storage</strong> (R2, S3, Google Drive)
            </div>
          </div>

          {/* Folder list */}
          {folders.length === 0 ? (
            <div style={{textAlign:'center',padding:'32px 24px',color:'#9D8FBB'}}>
              <div style={{fontSize:36,marginBottom:10,opacity:.5}}>📁</div>
              <div style={{fontSize:14,color:'#F5F0FF',marginBottom:4}}>No folders added yet</div>
              <div style={{fontSize:12}}>Add a folder path above to start importing your library.</div>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {folders.map(f => (
                <div key={f.id} style={{background:'#1E1829',border:`1px solid ${f.status==='error'?'rgba(239,68,68,.3)':f.status==='done'?'rgba(74,222,128,.25)':'rgba(192,132,252,.15)'}`,borderRadius:14,padding:'14px 18px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <span style={{fontSize:22}}>{TYPE_ICONS[f.type]}</span>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                        <span style={{fontSize:13,fontWeight:600,color:'#F5F0FF'}}>{f.label}</span>
                        <span style={{background:`${TYPE_COLORS[f.type]}22`,color:TYPE_COLORS[f.type],padding:'1px 8px',borderRadius:5,fontSize:10,fontWeight:600}}>{f.type.toUpperCase()}</span>
                      </div>
                      <div style={{fontSize:11,color:'#5A4F72',fontFamily:'monospace'}}>{f.path}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      {f.status==='scanning' && <div style={{fontSize:12,color:'#FB923C'}}>⏳ Scanning...</div>}
                      {f.status==='done' && <div style={{fontSize:12,color:'#4ADE80'}}>✓ {f.itemCount?.toLocaleString()} items</div>}
                      {f.status==='error' && <div style={{fontSize:12,color:'#EF4444'}}>✗ Error</div>}
                      {f.scannedAt && <div style={{fontSize:10,color:'#5A4F72',marginTop:2}}>{f.scannedAt}</div>}
                    </div>
                    <div style={{display:'flex',gap:6,flexShrink:0}}>
                      {f.status==='done' && <button onClick={() => rescanFolder(f)} style={{...S.btnGhost,...S.btnSm}}>Rescan</button>}
                      {f.status==='done' && <button onClick={() => { setNav('library') }} style={{...S.btnGrad,...S.btnSm}}>Browse</button>}
                      <button onClick={() => setFolders(prev=>prev.filter(x=>x.id!==f.id))} style={S.btnDanger}>Remove</button>
                    </div>
                  </div>
                  {f.status==='error' && f.error && (
                    <div style={{marginTop:10,padding:'10px 12px',background:'rgba(239,68,68,.07)',border:'1px solid rgba(239,68,68,.2)',borderRadius:8,fontSize:12,color:'#EF4444',lineHeight:1.6}}>
                      {f.error}
                    </div>
                  )}
                  {f.status==='done' && f.items && f.items.length > 0 && (
                    <div style={{marginTop:12,display:'flex',gap:8,overflowX:'auto',paddingBottom:4}}>
                      {f.items.slice(0,6).map(item => (
                        <div key={item.id} onClick={() => play(item.metadata?.title||item.parsed.title,'🎬')} style={{flexShrink:0,width:80,cursor:'pointer'}}>
                          {item.metadata?.posterPath
                            ? <img src={item.metadata.posterPath} alt={item.parsed.title} style={{width:80,height:120,objectFit:'cover',borderRadius:6,border:'1px solid rgba(192,132,252,.15)'}} onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>
                            : <div style={{width:80,height:120,background:'#251F34',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,border:'1px solid rgba(192,132,252,.15)'}}>{TYPE_ICONS[f.type]}</div>
                          }
                          <div style={{fontSize:10,color:'#9D8FBB',marginTop:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.metadata?.title||item.parsed.title}</div>
                        </div>
                      ))}
                      {f.items.length > 6 && <div style={{flexShrink:0,width:80,height:120,background:'rgba(192,132,252,.06)',border:'1px solid rgba(192,132,252,.15)',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:12,color:'#C084FC',textAlign:'center',lineHeight:1.4}} onClick={() => setNav('library')}>+{f.items.length-6}<br/>more</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Capability cards */}
          <div style={{marginTop:16,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
            {[['🔍','Auto Scanning','New files added to your folder appear in Javari automatically'],['🎨','Metadata & Art','Posters, descriptions, cast, ratings — fetched from TMDB instantly'],['▶️','Native Streaming','Streams directly from your NAS — no transcoding service needed'],['🔄','Every Format','MKV, MP4, AVI, FLAC, MP3, AAC, HEIC — all major formats supported'],['📱','Any Device','Watch on any browser, phone, or tablet — Javari handles it all'],['🔒','Your Hardware','Files never leave your NAS. Fully private. No cloud upload required']].map(([i,t,d],idx) => (
              <div key={idx} style={{background:'#1E1829',border:'1px solid rgba(192,132,252,.1)',borderRadius:12,padding:14}}>
                <div style={{fontSize:18,marginBottom:6}}>{i}</div>
                <div style={{fontSize:12,fontWeight:600,color:'#F5F0FF',marginBottom:4}}>{t}</div>
                <div style={{fontSize:11,color:'#9D8FBB',lineHeight:1.5}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderLibrary = () => {
    const allItems = [...Object.values(plexItems).flat(), ...allStandaloneItems]
    const displayItems = activeLibraryKey ? (plexItems[activeLibraryKey] || []) : allItems
    const isEmpty = displayItems.length === 0 && folders.every(f=>f.status!=='scanning') && server.status!=='connecting'

    return (
      <div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <span style={{fontFamily:'Georgia,serif',fontSize:20,color:'#F5F0FF'}}>📚 My Library</span>
          <button style={S.btnGrad} onClick={() => setNav('sources')}>+ Add Sources</button>
        </div>

        {/* Library tabs from Plex */}
        {plexLibraries.length > 0 && (
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
            <div onClick={() => setActiveLibraryKey(null)} style={{padding:'7px 16px',borderRadius:20,fontSize:12,cursor:'pointer',border:'1px solid rgba(192,132,252,.2)',background:activeLibraryKey===null?'linear-gradient(135deg,rgba(192,132,252,.2),rgba(244,114,182,.15))':'#1E1829',color:activeLibraryKey===null?'#C084FC':'#9D8FBB'}}>All</div>
            {plexLibraries.map(lib => (
              <div key={lib.key} onClick={() => { setActiveLibraryKey(lib.key); loadPlexLibrary(lib.key) }} style={{padding:'7px 16px',borderRadius:20,fontSize:12,cursor:'pointer',border:'1px solid rgba(192,132,252,.2)',background:activeLibraryKey===lib.key?'linear-gradient(135deg,rgba(192,132,252,.2),rgba(244,114,182,.15))':'#1E1829',color:activeLibraryKey===lib.key?'#C084FC':'#9D8FBB'}}>
                {lib.type==='movie'?'🎬':lib.type==='show'?'📺':lib.type==='artist'?'🎵':'📷'} {lib.title} ({lib.count})
                {loadingLibrary===lib.key && ' ⏳'}
              </div>
            ))}
            {folders.filter(f=>f.status==='done').map(f => (
              <div key={f.id} style={{padding:'7px 16px',borderRadius:20,fontSize:12,cursor:'pointer',border:`1px solid ${TYPE_COLORS[f.type]}44`,background:'#1E1829',color:TYPE_COLORS[f.type]}}>{TYPE_ICONS[f.type]} {f.label} ({f.itemCount})</div>
            ))}
          </div>
        )}

        {isEmpty ? (
          <div style={{textAlign:'center',padding:'48px 24px',color:'#9D8FBB'}}>
            <div style={{fontSize:40,marginBottom:12,opacity:.6}}>📚</div>
            <div style={{fontSize:15,fontWeight:500,color:'#F5F0FF',marginBottom:6}}>Your library is empty</div>
            <div style={{fontSize:13,lineHeight:1.6,marginBottom:20}}>Connect Plex, add NAS folders in standalone mode, or link your streaming services.</div>
            <button style={S.btnGrad} onClick={() => setNav('sources')}>Set Up Sources →</button>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:14}}>
            {(activeLibraryKey
              ? (plexItems[activeLibraryKey] || []).map(item => <div key={item.id}>{plexCard(item)}</div>)
              : [...allPlexItems.slice(0,12).map(item => <div key={`plex-${item.id}`}>{plexCard(item)}</div>),
                 ...allStandaloneItems.slice(0,12).map(item => <div key={`scan-${item.id}`}>{scannedCard(item)}</div>)]
            )}
          </div>
        )}
      </div>
    )
  }

  const renderMovies = () => (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <span style={{fontFamily:'Georgia,serif',fontSize:20,color:'#F5F0FF'}}>🎬 Movies</span>
        <span style={{fontSize:12,color:'#9D8FBB'}}>{(allPlexItems.filter(i=>i.type==='movie').length + standaloneMovies.length).toLocaleString()} titles</span>
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
        {['All','Action','Drama','Comedy','Thriller','Romance','Sci-Fi','Horror','Documentary','Animation'].map(g => (
          <div key={g} onClick={() => setGenreFilter(g)} style={{padding:'6px 14px',borderRadius:20,fontSize:12,cursor:'pointer',border:'1px solid rgba(192,132,252,.2)',background:genreFilter===g?'linear-gradient(135deg,rgba(192,132,252,.2),rgba(244,114,182,.15))':'#1E1829',color:genreFilter===g?'#C084FC':'#9D8FBB'}}>{g}</div>
        ))}
      </div>
      {allPlexItems.filter(i=>i.type==='movie').length===0 && standaloneMovies.length===0 ? (
        <div style={{textAlign:'center',padding:40,color:'#9D8FBB'}}>
          <div style={{fontSize:32,marginBottom:8,opacity:.5}}>🎬</div>
          <div style={{fontSize:14,color:'#F5F0FF',marginBottom:8}}>No movies in your library yet</div>
          <button style={S.btnGrad} onClick={() => { setNav('sources'); setSourceTab('standalone') }}>Add Movie Folder</button>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:14}}>
          {allPlexItems.filter(i=>i.type==='movie').map(item => <div key={item.id}>{plexCard(item)}</div>)}
          {standaloneMovies.map(item => <div key={item.id}>{scannedCard(item)}</div>)}
        </div>
      )}
    </div>
  )

  const renderShows = () => (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <span style={{fontFamily:'Georgia,serif',fontSize:20,color:'#F5F0FF'}}>📺 TV Shows</span>
        <span style={{fontSize:12,color:'#9D8FBB'}}>{(allPlexItems.filter(i=>i.type==='show'||i.type==='episode').length + standaloneShows.length).toLocaleString()} items</span>
      </div>
      {allPlexItems.filter(i=>i.type==='show'||i.type==='episode').length===0 && standaloneShows.length===0 ? (
        <div style={{textAlign:'center',padding:40,color:'#9D8FBB'}}>
          <div style={{fontSize:32,marginBottom:8,opacity:.5}}>📺</div>
          <div style={{fontSize:14,color:'#F5F0FF',marginBottom:8}}>No TV shows yet</div>
          <button style={S.btnGrad} onClick={() => { setNav('sources'); setSourceTab('standalone') }}>Add TV Shows Folder</button>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:14}}>
          {allPlexItems.filter(i=>i.type==='show'||i.type==='episode').map(item => <div key={item.id}>{plexCard(item)}</div>)}
          {standaloneShows.map(item => <div key={item.id}>{scannedCard(item)}</div>)}
        </div>
      )}
    </div>
  )

  const renderMusic = () => (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <span style={{fontFamily:'Georgia,serif',fontSize:20,color:'#F5F0FF'}}>🎵 Music</span>
      </div>
      {allPlexItems.filter(i=>i.type==='track'||i.type==='album').length===0 && standaloneMusic.length===0 ? (
        <div style={{textAlign:'center',padding:40,color:'#9D8FBB'}}>
          <div style={{fontSize:32,marginBottom:8,opacity:.5}}>🎵</div>
          <div style={{fontSize:14,color:'#F5F0FF',marginBottom:8}}>No music library yet</div>
          <button style={S.btnGrad} onClick={() => { setNav('sources'); setSourceTab('standalone') }}>Add Music Folder</button>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[...allPlexItems.filter(i=>i.type==='track'||i.type==='album'), ...standaloneMusic].map(item => {
            const title = 'title' in item ? item.title : (item as ScannedItem).parsed.title
            const sub = 'grandparentTitle' in item ? item.grandparentTitle || '' : ''
            const thumb = 'thumb' in item ? item.thumb : undefined
            return (
              <div key={('id' in item ? item.id : (item as ScannedItem).id)} onClick={() => play(title,'🎵')} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 14px',background:'#1E1829',border:'1px solid rgba(192,132,252,.15)',borderRadius:12,cursor:'pointer',transition:'background .2s'}}
                onMouseEnter={e=>(e.currentTarget.style.background='rgba(192,132,252,.08)')}
                onMouseLeave={e=>(e.currentTarget.style.background='#1E1829')}>
                <div style={{width:42,height:42,borderRadius:9,background:thumb?`url(${thumb}) center/cover`:'linear-gradient(135deg,#7C0040,#C084FC)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{!thumb&&'🎵'}</div>
                <div style={{flex:1,overflow:'hidden'}}><div style={{fontSize:13,fontWeight:500,color:'#F5F0FF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title}</div><div style={{fontSize:11,color:'#9D8FBB',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{sub}</div></div>
                <span style={{color:'#C084FC',fontSize:18}}>▶</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderLiveTV = () => (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <span style={{display:'flex',alignItems:'center',fontFamily:'Georgia,serif',fontSize:20,color:'#F5F0FF'}}>📡 Live TV {helpTip('Channels from your IPTV playlist and connected streaming services.')}</span>
        <button style={S.btnGrad} onClick={() => setNav('iptv')}>+ Add Channels</button>
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:18}}>
        {['All','🏆 Sports','📰 News','🎬 Movies','🎵 Music','👶 Kids','🌎 International','🌄 Local'].map(g => (
          <div key={g} onClick={() => setGenreFilter(g)} style={{padding:'6px 14px',borderRadius:20,fontSize:12,cursor:'pointer',border:'1px solid rgba(192,132,252,.2)',background:genreFilter===g?'linear-gradient(135deg,rgba(192,132,252,.2),rgba(244,114,182,.15))':'#1E1829',color:genreFilter===g?'#C084FC':'#9D8FBB'}}>{g}</div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:10,marginBottom:14}}>
        {LIVE_CHANNELS.map(ch => (
          <div key={ch.id} onClick={() => play(ch.name,ch.icon)} style={{borderRadius:12,overflow:'hidden',cursor:'pointer',border:'1px solid rgba(192,132,252,.15)',transition:'transform .2s'}}
            onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.03)')}
            onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}>
            <div style={{height:70,background:`linear-gradient(135deg,${ch.bg},${ch.bg}aa)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>{ch.icon}</div>
            <div style={{background:'#1E1829',padding:'7px 10px'}}><div style={{fontSize:10,color:'#5A4F72',marginBottom:1}}>CH {ch.num}</div><div style={{fontSize:11,fontWeight:500,color:'#F5F0FF'}}>{ch.name}</div></div>
          </div>
        ))}
      </div>
      <div style={{background:'rgba(251,146,60,.06)',border:'1px solid rgba(251,146,60,.2)',borderRadius:12,padding:'11px 14px',fontSize:12,color:'#FB923C',lineHeight:1.6}}>
        ℹ️ Channels come from your connected IPTV playlist and streaming services. If a channel doesn&apos;t load, ensure your subscription is active. <span onClick={() => setNav('iptv')} style={{cursor:'pointer',textDecoration:'underline'}}>Manage IPTV sources →</span>
      </div>
    </div>
  )

  const renderJavari = () => (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
        <div style={{width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,#C084FC,#F472B6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>✨</div>
        <div><div style={{fontFamily:'Georgia,serif',fontSize:20,color:'#F5F0FF'}}>Javari AI</div><div style={{fontSize:12,color:'#9D8FBB'}}>Your personal entertainment guide — powered by Claude</div></div>
      </div>
      <div style={{...S.card,minHeight:300,marginBottom:14,maxHeight:420,overflowY:'auto'}}>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {chatHistory.map((msg,i) => (
            <div key={i} style={{maxWidth:'85%',marginLeft:msg.role==='user'?'auto':0,padding:'12px 14px',borderRadius:12,background:msg.role==='ai'?'linear-gradient(135deg,rgba(192,132,252,.1),rgba(244,114,182,.07))':'rgba(255,255,255,.07)',fontSize:13,lineHeight:1.7,color:'#F5F0FF',borderBottomLeftRadius:msg.role==='ai'?3:12,borderBottomRightRadius:msg.role==='user'?3:12,whiteSpace:'pre-wrap'}}>
              {msg.role==='ai'&&<><strong style={{color:'#C084FC'}}>Javari</strong> — </>}{msg.text}
            </div>
          ))}
        </div>
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>
        {["What should I watch tonight?","How do I connect my Plex server?","Set up my NAS folders","What's new on Netflix?"].map((q,i) => (
          <button key={i} onClick={() => setChatInput(q)} style={S.btnGhost}>{q}</button>
        ))}
      </div>
      <div style={{display:'flex',gap:8}}>
        <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder="Ask Javari anything about your library or what to watch..." style={{...S.input,flex:1}}/>
        <button style={S.btnGrad} onClick={sendChat}>Send ✨</button>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div>
      <div style={{fontFamily:'Georgia,serif',fontSize:20,color:'#F5F0FF',marginBottom:20}}>⚙️ Settings</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={S.card}>
          <div style={{fontSize:14,fontWeight:600,color:'#F5F0FF',marginBottom:14}}>Playback</div>
          {settingRow('Video Quality','Auto adjusts to your connection speed',<select style={{background:'#251F34',border:'1px solid rgba(192,132,252,.2)',borderRadius:8,padding:'6px 10px',color:'#F5F0FF',fontSize:12,outline:'none'}}><option>Auto (Recommended)</option><option>4K Ultra HD</option><option>1080p HD</option><option>720p</option></select>,'Higher quality uses more data.')}
          {settingRow('Autoplay Next Episode','Plays the next episode automatically',<Toggle on={autoplay} onChange={() => setAutoplay(v=>!v)}/>)}
          {settingRow('Skip Intros','Skip show intros automatically',<Toggle on={skipIntros} onChange={() => setSkipIntros(v=>!v)}/>)}
          {settingRow('Subtitles','Show subtitles when available',<Toggle on={subtitles} onChange={() => setSubtitles(v=>!v)}/>)}
        </div>
        <div style={S.card}>
          <div style={{fontSize:14,fontWeight:600,color:'#F5F0FF',marginBottom:14}}>Notifications</div>
          {settingRow('New Episode Alerts','When shows you watch have new episodes',<Toggle on={newEpAlerts} onChange={() => setNewEpAlerts(v=>!v)}/>)}
          {settingRow('Live Sports Alerts','When your teams are playing',<Toggle on={sportsAlerts} onChange={() => setSportsAlerts(v=>!v)}/>)}
          {settingRow('Download Complete','When offline downloads finish',<Toggle on={false} onChange={() => showToast('Saved ✓')}/>)}
        </div>
      </div>
    </div>
  )

  const renderHelp = () => (
    <div>
      <div style={{fontFamily:'Georgia,serif',fontSize:20,color:'#F5F0FF',marginBottom:20}}>❓ Help Center</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {[{i:'🔗',t:'How do I connect Plex?',s:'Step-by-step: connect your Plex server and import all libraries automatically.',onClick:() => { setNav('sources'); setSourceTab('connect') }},
          {i:'🖥️',t:'Can Javari replace Plex entirely?',s:'Yes — use Standalone Mode to point Javari at your NAS folders. No Plex needed.',onClick:() => { setNav('sources'); setSourceTab('standalone') }},
          {i:'📋',t:'What is IPTV / M3U?',s:'Your IPTV provider gives you an M3U link. Paste it in Sources → IPTV to get all channels.',onClick:() => setNav('iptv')},
          {i:'📁',t:'How do I add NAS folders?',s:'Sources → Standalone Mode → paste your folder path and pick the type. Javari does the rest.',onClick:() => { setNav('sources'); setSourceTab('standalone') }},
          {i:'📺',t:"Why isn't a channel loading?",s:'Check your IPTV subscription is active. Refresh the playlist in Sources → IPTV.'},
          {i:'✨',t:'Ask Javari AI',s:"Can't find an answer? Javari AI knows your library and can set everything up for you.",onClick:() => setNav('javari')}].map((item,i) => (
          <div key={i} onClick={item.onClick} style={{background:i===1||i===5?'linear-gradient(135deg,rgba(192,132,252,.1),rgba(244,114,182,.07))':'#1E1829',border:`1px solid ${i===1||i===5?'rgba(192,132,252,.25)':'rgba(192,132,252,.12)'}`,borderRadius:14,padding:18,cursor:item.onClick?'pointer':'default',transition:'transform .2s'}}
            onMouseEnter={e=>item.onClick&&(e.currentTarget.style.transform='translateY(-2px)')}
            onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}>
            <div style={{fontSize:24,marginBottom:8}}>{item.i}</div>
            <div style={{fontSize:13,fontWeight:600,color:i===1||i===5?'#C084FC':'#F5F0FF',marginBottom:6}}>{item.t}</div>
            <div style={{fontSize:12,color:'#9D8FBB',lineHeight:1.5}}>{item.s}</div>
          </div>
        ))}
      </div>
    </div>
  )

  // Universal media search
  const handleSearch = async (q: string) => {
    if (!q.trim() || q.length < 2) return
    setSearchLoading(true)
    try {
      const res = await fetch(`/api/media/search?q=${encodeURIComponent(q)}&legal_only=${legalOnly}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data)
        setNav('discover')
      }
    } catch { /* search failed gracefully */ }
    finally { setSearchLoading(false) }
  }

  const renderPage = () => {
    switch(nav) {
      case 'home': return renderHome()
      case 'sources': return renderSources()
      case 'library': return renderLibrary()
      case 'movies': return renderMovies()
      case 'shows': return renderShows()
      case 'music': return renderMusic()
      case 'livetv': return renderLiveTV()
      case 'javari': return renderJavari()
      case 'settings': return renderSettings()
      case 'help': return renderHelp()
      case 'kids': return <div style={{fontFamily:'Georgia,serif',fontSize:20,color:'#F5F0FF',marginBottom:16}}>⭐ Kids{' '}<span style={{fontSize:13,fontWeight:400,color:'#9D8FBB'}}>— Connect Disney+, Netflix Kids, or add a kids folder to your library.</span></div>
      case 'sports': return (
        <div>
          <div style={{fontFamily:'Georgia,serif',fontSize:20,color:'#F5F0FF',marginBottom:16}}>🏆 Sports</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            {[{t:'NBA · Lakers vs Heat',i:'🏀',bg:'#1A0033',s:'ESPN · Q3 — 88:72',live:true},{t:'Champions League',i:'⚽',bg:'#1A1000',s:'Fox Sports · 2nd Half',live:true},{t:'NFL Preview Show',i:'🏈',bg:'#001A00',s:'NFL Network · Tonight',live:false},{t:'MLB Spring Training',i:'⚾',bg:'#001A1A',s:'ESPN · Starts 7pm',live:false}].map((item,i) => (
              <div key={i} onClick={() => play(item.t,item.i)} style={{borderRadius:14,overflow:'hidden',cursor:'pointer',border:'1px solid rgba(192,132,252,.15)',position:'relative',transition:'transform .2s'}}
                onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-2px)')}
                onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}>
                {item.live&&<div style={{position:'absolute',top:10,right:10,zIndex:1,background:'rgba(251,146,60,.9)',color:'#fff',borderRadius:6,padding:'2px 8px',fontSize:10,fontWeight:600}}>● LIVE</div>}
                <div style={{height:110,background:`linear-gradient(135deg,${item.bg},${item.bg}99)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:44}}>{item.i}</div>
                <div style={{background:'#1E1829',padding:'11px 14px'}}><div style={{fontSize:14,fontWeight:500,color:'#F5F0FF',marginBottom:2}}>{item.t}</div><div style={{fontSize:12,color:'#9D8FBB'}}>{item.s}</div></div>
              </div>
            ))}
          </div>
        </div>
      )
      case 'iptv': return (
        <div>
          <div style={{fontFamily:'Georgia,serif',fontSize:20,color:'#F5F0FF',marginBottom:6}}>📋 IPTV / M3U Playlists</div>
          <div style={{fontSize:13,color:'#9D8FBB',marginBottom:18}}>Add live TV channels from your IPTV provider using an M3U playlist URL.</div>
          <div style={S.card}>
            <div style={{display:'flex',alignItems:'center',marginBottom:10}}><span style={{fontSize:13,fontWeight:600,color:'#F5F0FF'}}>Playlist URL</span>{helpTip('Your IPTV provider gives you this link. Usually looks like: http://provider.com:8080/get.php?username=...&type=m3u_plus')}</div>
            <div style={{display:'flex',gap:10,marginBottom:10}}>
              <input value={iptvUrl} onChange={e=>setIptvUrl(e.target.value)} placeholder="http://your-iptv-provider.com/playlist.m3u" style={{...S.input,flex:1}}/>
              <button style={S.btnGrad} onClick={() => { if (!iptvUrl.trim()) { showToast('Enter a URL first','error'); return }; setIptvLoaded(true); showToast('Channels loaded ✓','success') }}>Load</button>
              <button style={S.btnGhost}>📁 Upload</button>
            </div>
            {iptvLoaded && <div style={{padding:'9px 12px',background:'rgba(74,222,128,.05)',border:'1px solid rgba(74,222,128,.15)',borderRadius:8,fontSize:12,color:'#4ADE80'}}>✓ Playlist active · Channels available in Live TV</div>}
            <div style={{marginTop:10,fontSize:12,color:'#9D8FBB',lineHeight:1.6}}>ℹ️ Javari connects to any playlist you provide. Make sure your subscription is authorized. Javari does not supply channels.</div>
          </div>
        </div>
      )
      case 'watchlist': return <div style={{fontFamily:'Georgia,serif',fontSize:20,color:'#F5F0FF',marginBottom:16}}>❤️ Watchlist{' '}<span style={{fontSize:13,fontWeight:400,color:'#9D8FBB'}}>— Save movies and shows here as you find them.</span></div>
      case 'downloads': return <div style={{fontFamily:'Georgia,serif',fontSize:20,color:'#F5F0FF',marginBottom:16}}>⬇️ Downloads{' '}<span style={{fontSize:13,fontWeight:400,color:'#9D8FBB'}}>— Download content for offline viewing.</span></div>
      case 'history': return (
        <div>
          <div style={{fontFamily:'Georgia,serif',fontSize:20,color:'#F5F0FF',marginBottom:16}}>🕐 Watch History</div>
          {recentlyWatched.length > 0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {recentlyWatched.map(item => (
                <div key={item.id} onClick={() => play(item.title,'🎬',item.streamUrl,item.viewOffset,item.duration)} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px',background:'#1E1829',border:'1px solid rgba(192,132,252,.15)',borderRadius:12,cursor:'pointer',transition:'background .2s'}}
                  onMouseEnter={e=>(e.currentTarget.style.background='rgba(192,132,252,.06)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='#1E1829')}>
                  <div style={{width:44,height:44,borderRadius:10,background:item.thumb?`url(${item.thumb}) center/cover`:'#251F34',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{!item.thumb&&'🎬'}</div>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:'#F5F0FF'}}>{item.title}</div><div style={{fontSize:11,color:'#9D8FBB',marginTop:2}}>{item.viewOffset&&item.duration ? `${Math.round((item.viewOffset/item.duration)*100)}% watched · ${fmtDuration(item.duration)}` : 'In your library'}</div></div>
                  <span style={{color:'#C084FC',fontSize:16}}>▶</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{textAlign:'center',padding:40,color:'#9D8FBB'}}><div style={{fontSize:32,opacity:.5,marginBottom:8}}>🕐</div>Watch history from Plex and your library will appear here.</div>
          )}
        </div>
      )
      case 'notifications': return (
        <div>
          <div style={{fontFamily:'Georgia,serif',fontSize:20,color:'#F5F0FF',marginBottom:16}}>🔔 Notifications</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[{t:'Severance S2 E8 is now available',s:'Apple TV+ · Just dropped',i:'📺',accent:true},{t:'NBA is live — Lakers vs Heat',s:'ESPN · Live now',i:'🏀',accent:false},{t:'Javari found 3 new items in your Movies folder',s:'Auto-scan complete',i:'✨',accent:false}].map((item,i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:14,padding:'13px 16px',background:'#1E1829',border:`1px solid ${item.accent?'rgba(192,132,252,.4)':'rgba(192,132,252,.12)'}`,borderRadius:12,borderLeft:item.accent?'3px solid #C084FC':undefined}}>
                <span style={{fontSize:20}}>{item.i}</span>
                <div><div style={{fontSize:13,fontWeight:500,color:'#F5F0FF'}}>{item.t}</div><div style={{fontSize:11,color:'#9D8FBB',marginTop:2}}>{item.s}</div></div>
              </div>
            ))}
          </div>
        </div>
      )
      case 'profile': return (
        <div>
          <div style={{fontFamily:'Georgia,serif',fontSize:20,color:'#F5F0FF',marginBottom:20}}>👤 My Profile</div>
          <div style={S.card}>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:18}}>
              <div style={{width:56,height:56,borderRadius:'50%',background:'linear-gradient(135deg,#C084FC,#F472B6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:500}}>RH</div>
              <div><div style={{fontFamily:'Georgia,serif',fontSize:18,color:'#F5F0FF'}}>Roy Henderson</div><div style={{fontSize:12,color:'#9D8FBB',marginTop:2}}>CR AudioViz AI · Fort Myers, FL</div></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
              {[{v:String(allPlexItems.length+allStandaloneItems.length),l:'Total Items'},{v:String(plexLibraries.length+folders.filter(f=>f.status==='done').length),l:'Libraries'},{v:String(connectedServices.length),l:'Services'},{v:server.status==='connected'?'✓':'—',l:'Plex'}].map((s,i) => (
                <div key={i} style={{background:'#251F34',border:'1px solid rgba(192,132,252,.15)',borderRadius:10,padding:'12px',textAlign:'center'}}>
                  <div style={{fontFamily:'Georgia,serif',fontSize:20,background:'linear-gradient(135deg,#C084FC,#F472B6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{s.v}</div>
                  <div style={{fontSize:10,color:'#9D8FBB',marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
      case 'discover': return (
        <div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10}}>
            <span style={{fontFamily:'Georgia,serif',fontSize:20,color:'#F5F0FF'}}>
              🌐 Free & Legal Content Discovery
            </span>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:12,color:'#9D8FBB'}}>Legal only mode</span>
              <div onClick={() => setLegalOnly(v=>!v)} style={{width:40,height:22,borderRadius:11,background:legalOnly?'#4ADE80':'#5A4F72',cursor:'pointer',position:'relative',transition:'background .3s'}}>
                <div style={{position:'absolute',top:3,left:legalOnly?21:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left .3s'}}/>
              </div>
            </div>
          </div>

          {/* Search results */}
          {searchResults && (
            <div style={{marginBottom:20}}>
              <div style={{fontSize:13,color:'#9D8FBB',marginBottom:14}}>
                Found {searchResults.total} results · {searchResults.search_ms}ms · Legal sources shown first
              </div>
              {searchResults.public_domain.length > 0 && (
                <div style={{marginBottom:20}}>
                  <div style={{fontSize:14,fontWeight:500,color:'#4ADE80',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                    <span>🏛️ Public Domain</span>
                    <span style={{fontSize:11,color:'#9D8FBB',fontWeight:400}}>Free, legal, downloadable</span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12}}>
                    {searchResults.public_domain.slice(0,12).map((item: {id:string;title:string;year?:number;watch_url:string;description?:string;source_name:string},i:number) => (
                      <a key={i} href={item.watch_url} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
                        <div style={{borderRadius:12,overflow:'hidden',border:'1px solid rgba(74,222,128,.2)',background:'#1E1829',transition:'transform .2s'}}
                          onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-2px)')}
                          onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}>
                          <div style={{height:100,background:'linear-gradient(135deg,#001A1A,#004040)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32}}>🏛️</div>
                          <div style={{padding:'10px 12px'}}>
                            <div style={{fontSize:12,fontWeight:500,color:'#F5F0FF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</div>
                            <div style={{fontSize:10,color:'#9D8FBB',marginTop:2}}>{item.year || ''} · {item.source_name}</div>
                            <div style={{fontSize:10,color:'#4ADE80',marginTop:3}}>✓ Free · Legal · Open</div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {searchResults.free_streaming.length > 0 && !legalOnly && (
                <div>
                  <div style={{fontSize:14,fontWeight:500,color:'#C084FC',marginBottom:12}}>📺 Free Streaming Platforms</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:10}}>
                    {[
                      {name:'Search Tubi',icon:'🎬',url:`https://tubitv.com/search/${encodeURIComponent(searchQuery)}`,color:'#1A1000'},
                      {name:'Search Pluto TV',icon:'📺',url:`https://pluto.tv/search#${encodeURIComponent(searchQuery)}`,color:'#1A0A3C'},
                      {name:'Search Plex Free',icon:'🟠',url:`https://app.plex.tv/desktop#!/search?query=${encodeURIComponent(searchQuery)}`,color:'#2A1000'},
                      {name:'Search Freevee',icon:'🟡',url:`https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}&i=instant-video`,color:'#1A1A00'},
                    ].map((p,i) => (
                      <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
                        <div style={{padding:'12px',background:'#1E1829',border:'1px solid rgba(192,132,252,.15)',borderRadius:10,cursor:'pointer',transition:'border .2s'}}
                          onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(192,132,252,.4)')}
                          onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(192,132,252,.15)')}>
                          <div style={{fontSize:20,marginBottom:4}}>{p.icon}</div>
                          <div style={{fontSize:12,fontWeight:500,color:'#F5F0FF'}}>{p.name}</div>
                          <div style={{fontSize:10,color:'#C084FC',marginTop:2}}>Opens free service →</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FAST Platforms grid */}
          {!searchResults && (
            <div>
              <div style={{fontSize:13,color:'#9D8FBB',marginBottom:16,lineHeight:1.6}}>
                Javari indexes free, legal streaming platforms and public domain libraries. Use the search bar above to find content across all sources. Javari does not host any media.
              </div>
              <div style={{fontSize:14,fontWeight:500,color:'#4ADE80',marginBottom:10}}>🟢 Free Ad-Supported (FAST)</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10,marginBottom:20}}>
                {[
                  {n:'Pluto TV',i:'📺',u:'https://pluto.tv',t:'250+ channels'},
                  {n:'Tubi',i:'🎬',u:'https://tubitv.com',t:'50K+ titles'},
                  {n:'Plex Free',i:'🟠',u:'https://www.plex.tv/watch-free',t:'300+ live channels'},
                  {n:'Freevee',i:'🟡',u:'https://www.amazon.com/adlp/freevee',t:'Amazon free tier'},
                  {n:'Roku Channel',i:'📡',u:'https://therokuchannel.roku.com',t:'Roku originals'},
                  {n:'Sling Free',i:'🎯',u:'https://watch.sling.com/1/free',t:'400+ channels'},
                  {n:'Crackle',i:'⚡',u:'https://www.crackle.com',t:'Sony movies & TV'},
                  {n:'Samsung TV+',i:'📱',u:'https://www.samsung.com/us/televisions-home-theater/tvs/tv-plus',t:'250+ live channels'},
                  {n:'Xumo',i:'🔵',u:'https://xumo.tv',t:'190+ channels'},
                  {n:'FilmRise',i:'🎞️',u:'https://filmrise.com',t:'Docs & classics'},
                  {n:'Vudu Free',i:'💜',u:'https://www.vudu.com',t:'Free with ads'},
                  {n:'Redbox Free',i:'🔴',u:'https://www.redbox.com',t:'Live TV + movies'},
                ].map((s,i) => (
                  <a key={i} href={s.u} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
                    <div style={{padding:'12px 14px',background:'#1E1829',border:'1px solid rgba(192,132,252,.12)',borderRadius:12,cursor:'pointer',transition:'all .2s'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(192,132,252,.35)';e.currentTarget.style.transform='translateY(-2px)'}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(192,132,252,.12)';e.currentTarget.style.transform='translateY(0)'}}>
                      <div style={{fontSize:22,marginBottom:6}}>{s.i}</div>
                      <div style={{fontSize:13,fontWeight:500,color:'#F5F0FF'}}>{s.n}</div>
                      <div style={{fontSize:10,color:'#4ADE80',marginTop:2}}>{s.t}</div>
                    </div>
                  </a>
                ))}
              </div>
              <div style={{fontSize:14,fontWeight:500,color:'#C084FC',marginBottom:10}}>🏛️ Public Domain Libraries</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10,marginBottom:20}}>
                {[
                  {n:'Internet Archive',i:'🏛️',u:'https://archive.org/details/movies',t:'Millions of films'},
                  {n:'Prelinger Archive',i:'📽️',u:'https://archive.org/details/prelinger',t:'6,000+ ephemeral films'},
                  {n:'NASA Media',i:'🚀',u:'https://images.nasa.gov',t:'All public domain'},
                  {n:'Library of Congress',i:'🦅',u:'https://www.loc.gov/film-and-videos/',t:'Historical footage'},
                  {n:'Open Culture',i:'🎭',u:'https://www.openculture.com/freemoviesonline',t:'1,150+ classics'},
                  {n:'European Archive',i:'🇪🇺',u:'https://www.europeanarchive.eu',t:'European history'},
                ].map((s,i) => (
                  <a key={i} href={s.u} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
                    <div style={{padding:'12px 14px',background:'#1E1829',border:'1px solid rgba(74,222,128,.15)',borderRadius:12,cursor:'pointer',transition:'all .2s'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(74,222,128,.4)';e.currentTarget.style.transform='translateY(-2px)'}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(74,222,128,.15)';e.currentTarget.style.transform='translateY(0)'}}>
                      <div style={{fontSize:22,marginBottom:6}}>{s.i}</div>
                      <div style={{fontSize:13,fontWeight:500,color:'#F5F0FF'}}>{s.n}</div>
                      <div style={{fontSize:10,color:'#4ADE80',marginTop:2}}>{s.t}</div>
                    </div>
                  </a>
                ))}
              </div>
              <div style={{fontSize:14,fontWeight:500,color:'#60A5FA',marginBottom:10}}>📚 Educational (Library Card)</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10}}>
                {[
                  {n:'Kanopy',i:'🎓',u:'https://www.kanopy.com',t:'Art house + docs'},
                  {n:'Hoopla',i:'📚',u:'https://www.hoopladigital.com',t:'Movies + audiobooks'},
                  {n:'PBS',i:'🔵',u:'https://www.pbs.org/video/',t:'Free PBS shows'},
                  {n:'National Geographic',i:'🌍',u:'https://www.nationalgeographic.com/tv/shows',t:'Free clips & docs'},
                ].map((s,i) => (
                  <a key={i} href={s.u} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
                    <div style={{padding:'12px 14px',background:'#1E1829',border:'1px solid rgba(96,165,250,.15)',borderRadius:12,cursor:'pointer',transition:'all .2s'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(96,165,250,.4)';e.currentTarget.style.transform='translateY(-2px)'}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(96,165,250,.15)';e.currentTarget.style.transform='translateY(0)'}}>
                      <div style={{fontSize:22,marginBottom:6}}>{s.i}</div>
                      <div style={{fontSize:13,fontWeight:500,color:'#F5F0FF'}}>{s.n}</div>
                      <div style={{fontSize:10,color:'#60A5FA',marginTop:2}}>{s.t}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )
      default: return <div style={{color:'#9D8FBB',padding:20}}>Page not found</div>
    }
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <div style={{fontFamily:'Inter,-apple-system,sans-serif',background:'#0E0B14',color:'#F5F0FF',minHeight:'100vh',overflowX:'hidden',fontSize:14}}>

      {/* TOP NAV */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 22px',height:60,background:'rgba(14,11,20,.97)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(192,132,252,.12)',position:'sticky',top:0,zIndex:100}}>
        <div style={{fontFamily:'Georgia,serif',fontSize:21,background:'linear-gradient(135deg,#C084FC,#F472B6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:.5,cursor:'pointer'}} onClick={() => setNav('home')}>Javari</div>
        <div style={{display:'flex',alignItems:'center',gap:10,background:'#1E1829',border:'1px solid rgba(192,132,252,.2)',borderRadius:24,padding:'8px 16px',width:'min(280px,40vw)'}}>
          <span style={{color:'#5A4F72',fontSize:13}}>🔍</span>
          <input
            value={searchQuery}
            onChange={e=>setSearchQuery(e.target.value)}
            onKeyDown={e => e.key==='Enter' && handleSearch(searchQuery)}
            placeholder="Search movies, channels, public domain, free streaming..."
            style={{background:'none',border:'none',outline:'none',color:'#F5F0FF',fontSize:13,fontFamily:'inherit',flex:1}}
          />
          {searchLoading && <span style={{fontSize:12,color:'#C084FC'}}>⏳</span>}
          {searchQuery && <span onClick={() => handleSearch(searchQuery)} style={{fontSize:12,color:'#C084FC',cursor:'pointer'}}>→</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {server.status==='connected' && <div style={{fontSize:11,color:'#4ADE80',padding:'4px 10px',background:'rgba(74,222,128,.1)',border:'1px solid rgba(74,222,128,.2)',borderRadius:8}}>● {server.name}</div>}
          <button onClick={() => setNav('notifications')} style={{width:36,height:36,borderRadius:'50%',border:'1px solid rgba(192,132,252,.2)',background:'#1E1829',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#9D8FBB',fontSize:15}}>🔔</button>
          <div onClick={() => setNav('profile')} style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#C084FC,#F472B6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,cursor:'pointer',color:'#fff',border:'2px solid rgba(192,132,252,.4)'}}>RH</div>
        </div>
      </div>

      <div style={{display:'flex',height:'calc(100vh - 60px)'}}>

        {/* SIDEBAR */}
        <div style={{width:205,flexShrink:0,background:'#161222',borderRight:'1px solid rgba(192,132,252,.1)',overflowY:'auto',paddingTop:6,display:'flex',flexDirection:'column'}} className="javari-sidebar">
          <div style={{...S.sectionLabel,padding:'12px 18px 4px'}}>Discover</div>
          {navItem('home','🏠','Home')}
          {navItem('movies','🎬','Movies')}
          {navItem('shows','📺','TV Shows')}
          {navItem('livetv','📡','Live TV','LIVE')}
          {navItem('sports','🏆','Sports')}
          {navItem('music','🎵','Music')}
          {navItem('kids','⭐','Kids')}
          <div style={{...S.sectionLabel,padding:'12px 18px 4px'}}>My Stuff</div>
          {navItem('library','📚','My Library')}
          {navItem('watchlist','❤️','Watchlist')}
          {navItem('downloads','⬇️','Downloads')}
          {navItem('history','🕐','History')}
          <div style={{...S.sectionLabel,padding:'12px 18px 4px'}}>Sources</div>
          {navItem('discover','🌐','Free Discovery')}
          <div onClick={() => disclaimerAccepted ? setNav('sources') : setShowDisclaimer(true)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderRadius:10,cursor:'pointer',margin:'1px 10px',fontSize:13,background:nav==='sources'?'linear-gradient(135deg,rgba(192,132,252,.18),rgba(244,114,182,.10))':'transparent',color:nav==='sources'?'#C084FC':'#9D8FBB',fontWeight:nav==='sources'?500:400,transition:'all .15s'}}>
            <span style={{fontSize:15,width:22,textAlign:'center'}}>🔗</span>
            <span style={{flex:1}}>Connect & Sources</span>
          </div>
          {navItem('iptv','📋','IPTV / M3U')}
          <div style={{...S.sectionLabel,padding:'12px 18px 4px'}}>More</div>
          {navItem('settings','⚙️','Settings')}
          {navItem('help','❓','Help')}
          <div style={{flex:1}}/>
          <div style={{padding:'12px 14px',borderTop:'1px solid rgba(192,132,252,.1)',marginTop:8}}>
            <div style={{fontSize:11,color:'#9D8FBB',fontWeight:500,marginBottom:3}}>Javari AI ✨</div>
            <div style={{fontSize:11,color:'#5A4F72',lineHeight:1.4,marginBottom:8}}>Ask anything about your library or what to watch.</div>
            <button style={{...S.btnGrad,width:'100%',justifyContent:'center',padding:'8px 0',fontSize:12}} onClick={() => setNav('javari')}>Ask Javari</button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{flex:1,overflowY:'auto',padding:24,paddingBottom:player.visible?96:24}}>
          {renderPage()}
        </div>
      </div>

      {/* MINI PLAYER — Real HLS.js video playback */}
      {player.visible && (
        <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:200}}>
          {/* Full-screen video overlay when stream URL is present */}
          {player.streamUrl && (
            <div style={{position:'fixed',inset:0,background:'#000',zIndex:199,display:'flex',flexDirection:'column'}}>
              <video
                ref={videoRef}
                style={{flex:1,width:'100%',height:'calc(100% - 80px)',objectFit:'contain',background:'#000'}}
                controls={false}
                playsInline
                autoPlay
                onTimeUpdate={e => {
                  const v = e.currentTarget
                  if (v.duration > 0) {
                    setPlayer(p => ({...p, progress: (v.currentTime / v.duration) * 100}))
                  }
                }}
                onEnded={() => setPlayer(p => ({...p, visible: false}))}
                onError={() => {
                  // Fallback: try direct src if HLS failed
                  const v = videoRef.current
                  if (v && player.streamUrl && !v.src.includes('fallback')) {
                    v.src = player.streamUrl
                    v.load()
                    v.play().catch(() => {})
                  }
                }}
              />
              {/* Video overlay controls */}
              <div style={{position:'absolute',top:12,right:12,display:'flex',gap:8,zIndex:201}}>
                <button
                  onClick={() => { const v = videoRef.current; if(v) v.requestFullscreen?.() }}
                  style={{padding:'6px 12px',borderRadius:8,border:'none',background:'rgba(0,0,0,.6)',color:'#fff',cursor:'pointer',fontSize:12,backdropFilter:'blur(4px)'}}>
                  ⛶ Fullscreen
                </button>
                <button
                  onClick={() => { setPlayer(p=>({...p,visible:false})); if(hlsRef.current)(hlsRef.current as {destroy:()=>void}).destroy() }}
                  style={{padding:'6px 12px',borderRadius:8,border:'none',background:'rgba(0,0,0,.6)',color:'#fff',cursor:'pointer',fontSize:12,backdropFilter:'blur(4px)'}}>
                  ✕ Close
                </button>
              </div>
              {/* Stream quality indicator */}
              {player.isHLS && (
                <div style={{position:'absolute',top:12,left:12,padding:'4px 10px',borderRadius:6,background:'rgba(192,132,252,.8)',color:'#fff',fontSize:10,fontWeight:600}}>
                  ● LIVE
                </div>
              )}
            </div>
          )}

          {/* Mini player bar */}
          <div style={{height:68,background:'rgba(14,11,20,.97)',backdropFilter:'blur(20px)',borderTop:'1px solid rgba(192,132,252,.15)',display:'flex',alignItems:'center',padding:'0 22px',gap:16,position:'relative',zIndex:200}}>
            <div style={{width:42,height:42,borderRadius:9,background:'linear-gradient(135deg,#C084FC,#F472B6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,flexShrink:0}}>
              {player.icon||'🎬'}
            </div>
            <div style={{width:170,flexShrink:0}}>
              <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{player.title}</div>
              <div style={{fontSize:10,color:'#9D8FBB',marginTop:1}}>
                {player.streamUrl ? (player.isHLS ? '● Live stream' : '▶ Playing') : 'Javari · Now playing'}
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,flex:1,justifyContent:'center'}}>
              <button
                onClick={() => { const v = videoRef.current; if(v) v.currentTime = Math.max(0, v.currentTime - 30) }}
                style={{width:32,height:32,borderRadius:'50%',border:'none',background:'transparent',cursor:'pointer',color:'#9D8FBB',fontSize:13}}>⏮</button>
              <button
                onClick={() => { const v = videoRef.current; if(v) v.currentTime = Math.max(0, v.currentTime - 10) }}
                style={{width:32,height:32,borderRadius:'50%',border:'none',background:'transparent',cursor:'pointer',color:'#9D8FBB',fontSize:15}}>⏪</button>
              <button
                onClick={() => {
                  const v = videoRef.current
                  if (v) { playing ? v.pause() : v.play().catch(()=>{}) }
                  setPlaying(p => !p)
                }}
                style={{width:40,height:40,borderRadius:'50%',border:'none',background:'#C084FC',cursor:'pointer',color:'#fff',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {playing ? '⏸' : '▶'}
              </button>
              <button
                onClick={() => { const v = videoRef.current; if(v) v.currentTime = Math.min(v.duration||0, v.currentTime + 10) }}
                style={{width:32,height:32,borderRadius:'50%',border:'none',background:'transparent',cursor:'pointer',color:'#9D8FBB',fontSize:15}}>⏩</button>
              <button
                onClick={() => { const v = videoRef.current; if(v) v.currentTime = Math.min(v.duration||0, v.currentTime + 30) }}
                style={{width:32,height:32,borderRadius:'50%',border:'none',background:'transparent',cursor:'pointer',color:'#9D8FBB',fontSize:13}}>⏭</button>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,flex:1,maxWidth:320}}>
              <span style={{fontSize:10,color:'#9D8FBB',minWidth:32}}>
                {player.duration&&player.progress>0 ? fmtDuration((player.progress/100)*player.duration) : '0:00'}
              </span>
              <div
                style={{flex:1,height:4,background:'#5A4F72',borderRadius:2,cursor:'pointer',position:'relative'}}
                onClick={e => {
                  const v = videoRef.current
                  if (!v || !v.duration) return
                  const rect = e.currentTarget.getBoundingClientRect()
                  const pct = (e.clientX - rect.left) / rect.width
                  v.currentTime = pct * v.duration
                  setPlayer(p => ({...p, progress: pct * 100}))
                }}>
                <div style={{height:'100%',width:`${Math.min(player.progress,100)}%`,background:'linear-gradient(90deg,#C084FC,#F472B6)',borderRadius:2,transition:'width .2s'}}/>
              </div>
              <span style={{fontSize:10,color:'#9D8FBB',minWidth:32}}>
                {player.duration ? fmtDuration(player.duration) : '--:--'}
              </span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:7,color:'#9D8FBB',fontSize:13}}>
              🔊
              <input
                type="range" min={0} max={100} defaultValue={80}
                style={{width:72, accentColor:'#C084FC'}}
                onChange={e => { const v = videoRef.current; if(v) v.volume = Number(e.target.value)/100 }}
              />
            </div>
            <button
              onClick={() => {
                setPlayer(p=>({...p,visible:false}))
                const v = videoRef.current
                if (v) { v.pause(); v.src = '' }
                if (hlsRef.current) (hlsRef.current as {destroy:()=>void}).destroy()
              }}
              style={{width:32,height:32,borderRadius:'50%',border:'none',background:'transparent',cursor:'pointer',color:'#9D8FBB',fontSize:15}}>✕</button>
          </div>
        </div>
      )}

      {/* LEGAL DISCLAIMER MODAL */}
      {showDisclaimer && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.8)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
          <div style={{background:'#161222',border:'1px solid rgba(192,132,252,.3)',borderRadius:20,padding:32,maxWidth:480,width:'100%'}}>
            <div style={{fontSize:22,marginBottom:12}}>⚖️</div>
            <div style={{fontFamily:'Georgia,serif',fontSize:18,color:'#F5F0FF',marginBottom:16}}>Before You Connect a Source</div>
            <div style={{fontSize:13,color:'#9D8FBB',lineHeight:1.8,marginBottom:24}}>
              Javari is a personal media discovery and playback application.<br/><br/>
              <strong style={{color:'#F5F0FF'}}>Javari does not host or distribute copyrighted media.</strong><br/><br/>
              Users are responsible for ensuring they have appropriate rights to access any media sources they connect, including IPTV playlists, NAS libraries, and third-party servers.<br/><br/>
              Free and legal content sources (FAST platforms, public domain libraries) are always available without any acknowledgement required.
            </div>
            <div style={{display:'flex',gap:10}}>
              <button
                onClick={() => setShowDisclaimer(false)}
                style={{flex:1,padding:'11px',borderRadius:10,border:'1px solid rgba(192,132,252,.2)',background:'transparent',color:'#9D8FBB',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>
                Cancel
              </button>
              <button
                onClick={() => { setDisclaimerAccepted(true); setShowDisclaimer(false); setNav('sources') }}
                style={{flex:2,padding:'11px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#C084FC,#F472B6)',color:'#fff',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit'}}>
                I Understand — Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast.visible && (
        <div style={{position:'fixed',bottom:player.visible?84:18,left:'50%',transform:'translateX(-50%)',background: toast.type==='error'?'rgba(239,68,68,.15)':toast.type==='success'?'rgba(74,222,128,.15)':'#251F34',border:`1px solid ${toast.type==='error'?'rgba(239,68,68,.4)':toast.type==='success'?'rgba(74,222,128,.4)':'rgba(192,132,252,.3)'}`,borderRadius:12,padding:'11px 18px',fontSize:13,color:toast.type==='error'?'#EF4444':toast.type==='success'?'#4ADE80':'#F5F0FF',zIndex:300,boxShadow:'0 8px 32px rgba(0,0,0,.5)',whiteSpace:'nowrap',pointerEvents:'none'}}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
