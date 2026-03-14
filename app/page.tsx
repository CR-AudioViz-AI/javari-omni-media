'use client'
// app/page.tsx — Javari Omni-Media — Complete Entertainment Platform
// Purpose: Aggregator (Plex/Jellyfin/streaming) + Standalone media server replacement.
//          Connect what you have, or use Javari as your entire media server.
// Date: March 13, 2026 | Henderson Standard

import { useState, useEffect } from 'react'

type NavId = 'home'|'movies'|'shows'|'livetv'|'sports'|'music'|'kids'|'library'|'watchlist'|'downloads'|'history'|'sources'|'iptv'|'settings'|'help'|'javari'|'profile'|'notifications'|'standalone'

interface PlayerState { visible: boolean; title: string; icon: string; progress: number }
interface Source { id: string; name: string; type: 'plex'|'jellyfin'|'streaming'|'iptv'|'standalone'; icon: string; color: string; connected: boolean; url?: string }
interface ScanFolder { id: string; path: string; type: 'movies'|'tv'|'music'|'photos'|'podcasts'; status: 'idle'|'scanning'|'done'; count?: number }

const CHANNELS = [
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
  {id:'cartoon',name:'Cartoon Network',num:'296',icon:'⭐',bg:'#001A1A'},
  {id:'bbc',name:'BBC World',num:'302',icon:'🌐',bg:'#001A40'},
]

const MOVIES = [
  {id:'wicked',title:'Wicked',year:2024,genre:'Musical',icon:'🎭',bg:'#1A0033'},
  {id:'brutalist',title:'The Brutalist',year:2025,genre:'Drama',icon:'🎨',bg:'#1A1000'},
  {id:'anora',title:'Anora',year:2024,genre:'Romance',icon:'✨',bg:'#001A1A'},
  {id:'alien',title:'Alien: Romulus',year:2024,genre:'Sci-Fi',icon:'👽',bg:'#001A00'},
  {id:'conclave',title:'Conclave',year:2024,genre:'Thriller',icon:'⛪',bg:'#1A1A00'},
  {id:'dune2',title:'Dune: Part Two',year:2024,genre:'Epic',icon:'🏜️',bg:'#2A1A00'},
]

const SHOWS = [
  {id:'succession',title:'Succession',sub:'Drama · HBO',icon:'📺',bg:'#1A1033',progress:72},
  {id:'bear',title:'The Bear',sub:'Drama · Hulu',icon:'🍳',bg:'#1A0A00',progress:0},
  {id:'severance',title:'Severance',sub:'Thriller · Apple TV+',icon:'🏢',bg:'#001A1A',progress:0},
  {id:'abbott',title:'Abbott Elementary',sub:'Comedy · Hulu',icon:'📝',bg:'#001A00',progress:0},
  {id:'tdnc',title:'True Detective',sub:'S4 · HBO',icon:'🎭',bg:'#001A1A',progress:55},
  {id:'industry',title:'Industry',sub:'Drama · HBO',icon:'💼',bg:'#1A1000',progress:0},
]

const MUSIC = [
  {id:'ts',title:'Folklore',artist:'Taylor Swift',icon:'🎸',bg:'#7C0040'},
  {id:'bey',title:'Cowboy Carter',artist:'Beyoncé',icon:'🎤',bg:'#7C5A00'},
  {id:'sab',title:"Short n' Sweet",artist:'Sabrina Carpenter',icon:'💫',bg:'#003A7C'},
  {id:'sza',title:'SOS',artist:'SZA',icon:'🌊',bg:'#00207C'},
  {id:'noah',title:'Stick Season',artist:'Noah Kahan',icon:'🍂',bg:'#3A1A00'},
  {id:'esp',title:'Espresso',artist:'Sabrina Carpenter',icon:'☕',bg:'#4A1A00'},
]

const DEFAULT_SOURCES: Source[] = [
  {id:'plex',name:'Plex',type:'plex',icon:'🎬',color:'#E5A00D',connected:false},
  {id:'jellyfin',name:'Jellyfin',type:'jellyfin',icon:'🎞️',color:'#00A4DC',connected:false},
  {id:'netflix',name:'Netflix',type:'streaming',icon:'📺',color:'#E50914',connected:true},
  {id:'hulu',name:'Hulu',type:'streaming',icon:'📡',color:'#00A8FF',connected:true},
  {id:'disney',name:'Disney+',type:'streaming',icon:'🏰',color:'#0063E5',connected:false},
  {id:'max',name:'Max (HBO)',type:'streaming',icon:'⚡',color:'#002BE7',connected:false},
  {id:'prime',name:'Prime Video',type:'streaming',icon:'🛒',color:'#FF9900',connected:false},
  {id:'apple',name:'Apple TV+',type:'streaming',icon:'🍎',color:'#555555',connected:false},
  {id:'peacock',name:'Peacock',type:'streaming',icon:'🦚',color:'#00CED1',connected:false},
  {id:'youtube',name:'YouTube TV',type:'streaming',icon:'▶',color:'#FF0000',connected:false},
  {id:'fubo',name:'FuboTV',type:'streaming',icon:'⚽',color:'#E8001D',connected:false},
  {id:'paramount',name:'Paramount+',type:'streaming',icon:'⛰️',color:'#0064FF',connected:false},
]

const DEFAULT_FOLDERS: ScanFolder[] = [
  {id:'f1',path:'/volume1/media/Movies',type:'movies',status:'done',count:847},
  {id:'f2',path:'/volume1/media/TV Shows',type:'tv',status:'done',count:12340},
  {id:'f3',path:'/volume1/media/Music',type:'music',status:'done',count:23891},
]

export default function JavariOmniMedia() {
  const [nav, setNav] = useState<NavId>('home')
  const [player, setPlayer] = useState<PlayerState>({visible:false,title:'',icon:'🎬',progress:35})
  const [playing, setPlaying] = useState(true)
  const [toast, setToast] = useState({visible:false,message:''})
  const [genreFilter, setGenreFilter] = useState('All')
  const [showBanner, setShowBanner] = useState(true)
  const [sources, setSources] = useState(DEFAULT_SOURCES)
  const [folders, setFolders] = useState<ScanFolder[]>(DEFAULT_FOLDERS)
  const [newFolderPath, setNewFolderPath] = useState('')
  const [newFolderType, setNewFolderType] = useState<ScanFolder['type']>('movies')
  const [plexUrl, setPlexUrl] = useState('')
  const [plexToken, setPlexToken] = useState('')
  const [jellyfinUrl, setJellyfinUrl] = useState('')
  const [jellyfinKey, setJellyfinKey] = useState('')
  const [iptvUrl, setIptvUrl] = useState('')
  const [standaloneMode, setStandaloneMode] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState([
    {role:'ai',text:"Hey! What would you like to watch tonight? I know you loved Succession — want similar shows? Or movies, music, or live sports?"}
  ])
  const [autoplay, setAutoplay] = useState(true)
  const [skipIntros, setSkipIntros] = useState(true)
  const [subtitles, setSubtitles] = useState(false)
  const [newEpAlerts, setNewEpAlerts] = useState(true)
  const [sportsAlerts, setSportsAlerts] = useState(true)
  const [sourceTab, setSourceTab] = useState<'connect'|'standalone'>('connect')

  const showToast = (msg: string) => {
    setToast({visible:true,message:msg})
    setTimeout(() => setToast({visible:false,message:''}), 3000)
  }

  const play = (title: string, icon: string) => {
    setPlayer({visible:true,title,icon,progress:Math.floor(Math.random()*60)+10})
    setPlaying(true)
  }

  const toggleSource = (id: string) => {
    setSources(prev => prev.map(s => s.id===id ? {...s,connected:!s.connected} : s))
    const svc = sources.find(s => s.id===id)
    if (svc) showToast(svc.connected ? `${svc.name} disconnected` : `${svc.name} connected ✓`)
  }

  const addFolder = () => {
    if (!newFolderPath.trim()) return
    const newF: ScanFolder = {id:`f${Date.now()}`,path:newFolderPath,type:newFolderType,status:'scanning'}
    setFolders(prev => [...prev, newF])
    setNewFolderPath('')
    setTimeout(() => {
      setFolders(prev => prev.map(f => f.id===newF.id ? {...f,status:'done',count:Math.floor(Math.random()*5000)+100} : f))
      showToast(`Scan complete ✓ — ${newFolderType} library imported`)
    }, 2500)
  }

  const sendChat = () => {
    if (!chatInput.trim()) return
    const msg = chatInput; setChatInput('')
    setChatHistory(prev => [...prev, {role:'user',text:msg}])
    setTimeout(() => {
      setChatHistory(prev => [...prev, {role:'ai',text:"Great taste! Based on what you're looking for, I'd suggest Severance on Apple TV+ — same corporate power-struggle energy as Succession but with a surreal twist. Want me to play it?"}])
    }, 1200)
  }

  useEffect(() => {
    if (!player.visible || !playing) return
    const t = setInterval(() => {
      setPlayer(p => p.progress>=100 ? {...p,visible:false} : {...p,progress:p.progress+0.2})
    }, 300)
    return () => clearInterval(t)
  }, [player.visible, playing])

  // ─── STYLE CONSTANTS ───
  const inputStyle: React.CSSProperties = {width:'100%',background:'#1E1829',border:'1px solid rgba(192,132,252,.2)',borderRadius:10,padding:'11px 14px',color:'#F5F0FF',fontSize:13,fontFamily:'inherit',outline:'none'}
  const btnGrad: React.CSSProperties = {display:'inline-flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:11,fontSize:13,fontWeight:600,cursor:'pointer',background:'linear-gradient(135deg,#C084FC,#F472B6)',color:'#fff',border:'none',fontFamily:'inherit'}
  const btnGhost: React.CSSProperties = {display:'inline-flex',alignItems:'center',gap:7,padding:'10px 18px',borderRadius:11,fontSize:13,fontWeight:500,cursor:'pointer',background:'rgba(255,255,255,.06)',color:'#F5F0FF',border:'1px solid rgba(192,132,252,.2)',fontFamily:'inherit'}
  const card: React.CSSProperties = {background:'#1E1829',border:'1px solid rgba(192,132,252,.15)',borderRadius:16,padding:20}

  // ─── HELPERS ───
  const helpTip = (tip: string) => (
    <span title={tip} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:16,height:16,borderRadius:'50%',background:'rgba(157,143,187,.35)',color:'#fff',fontSize:9,fontWeight:700,cursor:'help',marginLeft:6,flexShrink:0,verticalAlign:'middle'}}>?</span>
  )

  const sectionHead = (text: string, tip?: string, action?: React.ReactNode) => (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
      <span style={{display:'flex',alignItems:'center',fontFamily:'Georgia,serif',fontSize:18,color:'#F5F0FF'}}>{text}{tip && helpTip(tip)}</span>
      {action}
    </div>
  )

  const mediaCard = (title: string, sub: string, icon: string, bg: string, progress?: number) => (
    <div onClick={() => play(title,icon)} style={{borderRadius:14,overflow:'hidden',cursor:'pointer',border:'1px solid rgba(192,132,252,.15)',transition:'transform .2s'}}
      onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-3px)')}
      onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}>
      <div style={{height:160,background:`linear-gradient(135deg,${bg},${bg}cc)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,position:'relative'}}>
        {icon}
        {progress ? <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:'rgba(255,255,255,.12)'}}><div style={{height:'100%',width:`${progress}%`,background:'linear-gradient(90deg,#C084FC,#F472B6)'}}/></div> : null}
      </div>
      <div style={{background:'#1E1829',padding:'10px 12px'}}>
        <div style={{fontSize:13,fontWeight:500,color:'#F5F0FF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title}</div>
        <div style={{fontSize:11,color:'#9D8FBB',marginTop:2}}>{sub}</div>
      </div>
    </div>
  )

  const navItem = (id: NavId, icon: string, label: string, badge?: string) => (
    <div onClick={() => setNav(id)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderRadius:10,cursor:'pointer',margin:'1px 10px',fontSize:13,background:nav===id?'linear-gradient(135deg,rgba(192,132,252,.18),rgba(244,114,182,.10))':'transparent',color:nav===id?'#C084FC':'#9D8FBB',fontWeight:nav===id?500:400,transition:'all .15s'}}>
      <span style={{fontSize:15,width:22,textAlign:'center'}}>{icon}</span>
      <span style={{flex:1}}>{label}</span>
      {badge && <span style={{background:badge==='LIVE'?'#FB923C':'#C084FC',color:'#fff',borderRadius:8,padding:'1px 7px',fontSize:10,fontWeight:500}}>{badge}</span>}
    </div>
  )

  const Toggle = ({on,onChange}: {on:boolean,onChange:()=>void}) => (
    <div onClick={onChange} style={{width:40,height:22,borderRadius:11,background:on?'#C084FC':'#5A4F72',cursor:'pointer',position:'relative',transition:'background .3s',flexShrink:0}}>
      <div style={{position:'absolute',top:3,left:on?21:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left .3s'}}/>
    </div>
  )

  const settingRow = (label: string, hint: string, control: React.ReactNode, tip?: string) => (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0',borderBottom:'1px solid rgba(192,132,252,.08)'}}>
      <div><div style={{display:'flex',alignItems:'center',fontSize:13,fontWeight:500,color:'#F5F0FF'}}>{label}{tip && helpTip(tip)}</div><div style={{fontSize:11,color:'#9D8FBB',marginTop:2}}>{hint}</div></div>
      {control}
    </div>
  )

  const typeColors: Record<ScanFolder['type'],string> = {movies:'#C084FC',tv:'#F472B6',music:'#4ADE80',photos:'#FB923C',podcasts:'#60A5FA'}
  const typeIcons: Record<ScanFolder['type'],string> = {movies:'🎬',tv:'📺',music:'🎵',photos:'📷',podcasts:'🎙️'}

  // ─── PAGES ───
  const pages: Record<NavId, React.ReactNode> = {

    home: (
      <div>
        {showBanner && (
          <div style={{background:'linear-gradient(135deg,rgba(192,132,252,.12),rgba(244,114,182,.08))',border:'1px solid rgba(192,132,252,.25)',borderRadius:14,padding:'16px 20px',marginBottom:20,display:'flex',alignItems:'center',gap:14}}>
            <span style={{fontSize:24}}>👋</span>
            <div>
              <div style={{fontSize:14,fontWeight:500,color:'#F5F0FF',marginBottom:3}}>Welcome to Javari!</div>
              <div style={{fontSize:12,color:'#9D8FBB',lineHeight:1.5}}>Connect your streaming services and servers — or use Javari as your complete standalone media server. <span onClick={() => setNav('sources')} style={{color:'#C084FC',cursor:'pointer'}}>Set up your sources →</span></div>
            </div>
            <span onClick={() => setShowBanner(false)} style={{marginLeft:'auto',color:'#5A4F72',cursor:'pointer',fontSize:20,padding:4}}>×</span>
          </div>
        )}
        <div style={{background:'linear-gradient(135deg,#2D1B69 0%,#1A1033 40%,#0E0B14 100%)',borderRadius:20,padding:'32px 32px 28px',marginBottom:24,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-40,right:-40,width:260,height:260,background:'radial-gradient(circle,rgba(192,132,252,.12) 0%,transparent 70%)',pointerEvents:'none'}}/>
          <div style={{fontSize:11,letterSpacing:2,textTransform:'uppercase',color:'#C084FC',marginBottom:10,fontWeight:500}}>✨ Handpicked For You</div>
          <div style={{fontFamily:'Georgia,serif',fontSize:30,fontWeight:400,lineHeight:1.3,marginBottom:10,color:'#F5F0FF'}}>Your world of <span style={{background:'linear-gradient(135deg,#C084FC,#F472B6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>entertainment,</span><br/>all in one place.</div>
          <div style={{fontSize:13,color:'#9D8FBB',lineHeight:1.6,maxWidth:460,marginBottom:22}}>Every service you subscribe to. Your own library. Live TV. All unified — no switching apps, no confusion.</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <button style={btnGrad} onClick={() => play('Trending Tonight','🎬')}>▶ Play Now</button>
            <button style={btnGhost} onClick={() => showToast('Added to watchlist ❤️')}>+ Watchlist</button>
          </div>
        </div>

        <div style={{marginBottom:24}}>
          {sectionHead('Continue Watching', 'Pick up right where you left off, across any device.', <span onClick={() => setNav('history')} style={{fontSize:12,color:'#C084FC',cursor:'pointer'}}>See all</span>)}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {[...SHOWS.filter(s=>s.progress>0),...MOVIES.slice(0,2)].slice(0,4).map(item => (
              <div key={item.id} onClick={() => play(item.title,item.icon)} style={{borderRadius:14,overflow:'hidden',cursor:'pointer',border:'1px solid rgba(192,132,252,.15)',transition:'transform .2s'}}
                onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-2px)')}
                onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}>
                <div style={{height:100,background:`linear-gradient(135deg,${'bg' in item ? item.bg : '#1A1033'},${'bg' in item ? item.bg : '#1A1033'}99)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,position:'relative'}}>
                  {item.icon}
                  {'progress' in item && item.progress ? <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:'rgba(255,255,255,.1)'}}><div style={{height:'100%',width:`${item.progress}%`,background:'linear-gradient(90deg,#C084FC,#F472B6)'}}/></div> : null}
                </div>
                <div style={{background:'#1E1829',padding:'10px 12px'}}>
                  <div style={{fontSize:12,fontWeight:500,color:'#F5F0FF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</div>
                  <div style={{fontSize:10,color:'#9D8FBB',marginTop:2}}>{'progress' in item && item.progress ? `${item.progress}% watched` : 'Not started'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{marginBottom:24}}>
          {sectionHead('🔴 Live Right Now', undefined, <span onClick={() => setNav('livetv')} style={{fontSize:12,color:'#C084FC',cursor:'pointer'}}>All channels</span>)}
          <div style={{display:'flex',gap:14,overflowX:'auto',paddingBottom:8}}>
            {[{title:'NBA · Lakers vs Heat',icon:'🏀',bg:'#1A0033',sub:'ESPN · Q3 — 88:72'},{title:'CNN Evening News',icon:'📰',bg:'#001A33',sub:'CNN · Live broadcast'},{title:'Champions League',icon:'⚽',bg:'#1A1000',sub:'Fox Sports · 2nd Half'},{title:'Live Concert',icon:'🎸',bg:'#001A00',sub:'AXS TV · Live now'}].map((item,i) => (
              <div key={i} onClick={() => play(item.title,item.icon)} style={{flexShrink:0,width:200,borderRadius:14,overflow:'hidden',cursor:'pointer',border:'1px solid rgba(192,132,252,.15)',position:'relative',transition:'transform .2s'}}
                onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-2px)')}
                onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}>
                <div style={{position:'absolute',top:8,left:8,zIndex:1,background:'rgba(251,146,60,.9)',color:'#fff',borderRadius:6,padding:'2px 8px',fontSize:10,fontWeight:600}}>● LIVE</div>
                <div style={{height:110,background:`linear-gradient(135deg,${item.bg},${item.bg}aa)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:36}}>{item.icon}</div>
                <div style={{background:'#1E1829',padding:'10px 12px'}}><div style={{fontSize:12,fontWeight:500,color:'#F5F0FF',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</div><div style={{fontSize:11,color:'#9D8FBB',marginTop:2}}>{item.sub}</div></div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {sectionHead('🎬 Trending Movies', undefined, <span onClick={() => setNav('movies')} style={{fontSize:12,color:'#C084FC',cursor:'pointer'}}>See all</span>)}
          <div style={{display:'flex',gap:14,overflowX:'auto',paddingBottom:8}}>
            {MOVIES.map(m => <div key={m.id} style={{flexShrink:0,width:150}}>{mediaCard(m.title,`${m.genre} · ${m.year}`,m.icon,m.bg)}</div>)}
          </div>
        </div>
      </div>
    ),

    // ─── SOURCES (replaces old connect + nas pages) ───
    sources: (
      <div>
        {sectionHead('🔗 Your Sources', 'Connect the apps and servers you already have, or use Javari as your complete standalone media server — no other apps needed.')}

        {/* Mode selector */}
        <div style={{display:'flex',gap:12,marginBottom:24}}>
          <div onClick={() => setSourceTab('connect')} style={{flex:1,padding:20,borderRadius:14,border:`2px solid ${sourceTab==='connect'?'#C084FC':'rgba(192,132,252,.15)'}`,background:sourceTab==='connect'?'linear-gradient(135deg,rgba(192,132,252,.12),rgba(244,114,182,.08))':'#1E1829',cursor:'pointer',transition:'all .2s'}}>
            <div style={{fontSize:22,marginBottom:8}}>🔗</div>
            <div style={{fontSize:14,fontWeight:600,color:'#F5F0FF',marginBottom:4}}>Connect Mode</div>
            <div style={{fontSize:12,color:'#9D8FBB',lineHeight:1.5}}>You already have Plex, Jellyfin, Netflix, or IPTV. Javari connects to what you own and unifies everything in one place.</div>
          </div>
          <div onClick={() => setSourceTab('standalone')} style={{flex:1,padding:20,borderRadius:14,border:`2px solid ${sourceTab==='standalone'?'#C084FC':'rgba(192,132,252,.15)'}`,background:sourceTab==='standalone'?'linear-gradient(135deg,rgba(192,132,252,.12),rgba(244,114,182,.08))':'#1E1829',cursor:'pointer',transition:'all .2s'}}>
            <div style={{fontSize:22,marginBottom:8}}>🖥️</div>
            <div style={{fontSize:14,fontWeight:600,color:'#F5F0FF',marginBottom:4}}>Standalone Mode</div>
            <div style={{fontSize:12,color:'#9D8FBB',lineHeight:1.5}}>No Plex or Jellyfin needed. Point Javari at your NAS folders and it becomes your complete media server — scanning, metadata, streaming, everything.</div>
          </div>
        </div>

        {/* CONNECT MODE */}
        {sourceTab==='connect' && (
          <div>
            <div style={{fontSize:13,color:'#9D8FBB',marginBottom:18,lineHeight:1.6}}>Connect the services you already pay for. Javari unifies them — <strong style={{color:'#F5F0FF'}}>you keep your subscriptions, Javari just connects them.</strong></div>

            {/* Plex & Jellyfin */}
            <div style={{fontSize:12,letterSpacing:1,textTransform:'uppercase',color:'#5A4F72',marginBottom:10,fontWeight:500}}>Media Servers</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
              <div style={card}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                  <div style={{width:40,height:40,borderRadius:10,background:'linear-gradient(135deg,#E5A00D,#CC7A00)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🎬</div>
                  <div><div style={{fontSize:14,fontWeight:500,color:'#F5F0FF'}}>Plex</div><div style={{fontSize:11,color:'#9D8FBB'}}>Media server</div></div>
                  {sources.find(s=>s.id==='plex')?.connected && <span style={{marginLeft:'auto',fontSize:11,color:'#4ADE80'}}>✓ Connected</span>}
                </div>
                <input value={plexUrl} onChange={e=>setPlexUrl(e.target.value)} placeholder="http://192.168.1.x:32400" style={{...inputStyle,marginBottom:8}}/>
                <div style={{display:'flex',alignItems:'center',fontSize:11,color:'#9D8FBB',marginBottom:6}}>Plex Token {helpTip('Open Plex → click any item → ··· → Get Info → View XML → find X-Plex-Token= in the URL.')}</div>
                <input value={plexToken} onChange={e=>setPlexToken(e.target.value)} type="password" placeholder="Your Plex token" style={{...inputStyle,marginBottom:12}}/>
                <button style={btnGrad} onClick={() => { toggleSource('plex'); showToast('Plex connected — importing libraries ✓') }}>Connect Plex</button>
              </div>
              <div style={card}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                  <div style={{width:40,height:40,borderRadius:10,background:'linear-gradient(135deg,#00A4DC,#007FAA)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🎞️</div>
                  <div><div style={{fontSize:14,fontWeight:500,color:'#F5F0FF'}}>Jellyfin</div><div style={{fontSize:11,color:'#9D8FBB'}}>Media server</div></div>
                  {sources.find(s=>s.id==='jellyfin')?.connected && <span style={{marginLeft:'auto',fontSize:11,color:'#4ADE80'}}>✓ Connected</span>}
                </div>
                <div style={{display:'flex',alignItems:'center',fontSize:11,color:'#9D8FBB',marginBottom:6}}>Server Address {helpTip('Usually http://192.168.1.x:8096 — check your Jellyfin Dashboard for the exact address.')}</div>
                <input value={jellyfinUrl} onChange={e=>setJellyfinUrl(e.target.value)} placeholder="http://192.168.1.x:8096" style={{...inputStyle,marginBottom:8}}/>
                <div style={{display:'flex',alignItems:'center',fontSize:11,color:'#9D8FBB',marginBottom:6}}>API Key {helpTip('In Jellyfin: Dashboard → API Keys → + → copy the key.')}</div>
                <input value={jellyfinKey} onChange={e=>setJellyfinKey(e.target.value)} type="password" placeholder="Your Jellyfin API key" style={{...inputStyle,marginBottom:12}}/>
                <button style={btnGhost} onClick={() => { toggleSource('jellyfin'); showToast('Jellyfin connected — importing libraries ✓') }}>Connect Jellyfin</button>
              </div>
            </div>

            {/* Streaming services */}
            <div style={{fontSize:12,letterSpacing:1,textTransform:'uppercase',color:'#5A4F72',marginBottom:10,fontWeight:500}}>Streaming Services</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
              {sources.filter(s=>s.type==='streaming').map(svc => (
                <div key={svc.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:svc.connected?'rgba(192,132,252,.06)':'#1E1829',border:`1px solid ${svc.connected?'rgba(192,132,252,.3)':'rgba(192,132,252,.15)'}`,borderRadius:12,transition:'all .2s'}}>
                  <div style={{width:38,height:38,borderRadius:10,background:svc.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{svc.icon}</div>
                  <span style={{flex:1,fontSize:13,fontWeight:500,color:'#F5F0FF'}}>{svc.name}</span>
                  <button onClick={() => toggleSource(svc.id)} style={{padding:'6px 14px',borderRadius:8,fontSize:12,fontWeight:500,cursor:'pointer',border:'none',fontFamily:'inherit',background:svc.connected?'rgba(74,222,128,.15)':'linear-gradient(135deg,#C084FC,#F472B6)',color:svc.connected?'#4ADE80':'#fff'}}>
                    {svc.connected ? '✓ Connected' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>

            {/* IPTV */}
            <div style={{fontSize:12,letterSpacing:1,textTransform:'uppercase',color:'#5A4F72',marginBottom:10,fontWeight:500}}>IPTV / M3U Playlist</div>
            <div style={card}>
              <div style={{display:'flex',alignItems:'center',marginBottom:10}}>
                <span style={{fontSize:13,fontWeight:500,color:'#F5F0FF'}}>M3U Playlist URL</span>
                {helpTip('Your IPTV provider gives you an M3U URL. It usually looks like: http://provider.com:8080/get.php?username=...&type=m3u_plus')}
              </div>
              <div style={{display:'flex',gap:10}}>
                <input value={iptvUrl} onChange={e=>setIptvUrl(e.target.value)} placeholder="http://your-iptv-provider.com/playlist.m3u" style={{...inputStyle,flex:1}}/>
                <button style={btnGrad} onClick={() => showToast('IPTV playlist loaded — 847 channels ✓')}>Load</button>
              </div>
              <div style={{marginTop:10,fontSize:12,color:'#9D8FBB',lineHeight:1.6}}>ℹ️ Javari connects to any playlist you provide. Ensure your IPTV subscription is active. Javari does not provide or sell channels.</div>
            </div>
          </div>
        )}

        {/* STANDALONE MODE */}
        {sourceTab==='standalone' && (
          <div>
            <div style={{background:'linear-gradient(135deg,rgba(192,132,252,.1),rgba(244,114,182,.07))',border:'1px solid rgba(192,132,252,.2)',borderRadius:14,padding:'16px 20px',marginBottom:20}}>
              <div style={{fontSize:14,fontWeight:600,color:'#C084FC',marginBottom:6}}>🖥️ Javari as Your Media Server</div>
              <div style={{fontSize:13,color:'#9D8FBB',lineHeight:1.7}}>No Plex. No Jellyfin. No subscriptions. Point Javari at your NAS folders and it handles everything — scanning your files, fetching artwork and metadata automatically, and streaming directly to this app. Your library stays on your hardware.</div>
            </div>

            {/* Scanned folders */}
            <div style={{fontSize:13,fontWeight:500,color:'#F5F0FF',marginBottom:12}}>Library Folders</div>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
              {folders.map(f => (
                <div key={f.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:'#1E1829',border:'1px solid rgba(192,132,252,.15)',borderRadius:12}}>
                  <span style={{fontSize:20}}>{typeIcons[f.type]}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500,color:'#F5F0FF',fontFamily:'monospace'}}>{f.path}</div>
                    <div style={{fontSize:11,color:'#9D8FBB',marginTop:2,display:'flex',alignItems:'center',gap:8}}>
                      <span style={{background:`${typeColors[f.type]}22`,color:typeColors[f.type],padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:600}}>{f.type.toUpperCase()}</span>
                      {f.status==='scanning' ? <span style={{color:'#FB923C'}}>⏳ Scanning...</span> : <span style={{color:'#4ADE80'}}>✓ {f.count?.toLocaleString()} items</span>}
                    </div>
                  </div>
                  <button onClick={() => setFolders(prev=>prev.filter(x=>x.id!==f.id))} style={{background:'none',border:'none',color:'#5A4F72',cursor:'pointer',fontSize:16,padding:4}}>×</button>
                </div>
              ))}
            </div>

            {/* Add folder */}
            <div style={card}>
              <div style={{fontSize:13,fontWeight:500,color:'#F5F0FF',marginBottom:12}}>Add Library Folder</div>
              <div style={{display:'flex',gap:10,marginBottom:10}}>
                <input value={newFolderPath} onChange={e=>setNewFolderPath(e.target.value)} placeholder="/volume1/media/Movies  or  \\192.168.1.x\media\Movies" style={{...inputStyle,flex:1,fontFamily:'monospace',fontSize:12}}/>
                <select value={newFolderType} onChange={e=>setNewFolderType(e.target.value as ScanFolder['type'])} style={{background:'#251F34',border:'1px solid rgba(192,132,252,.2)',borderRadius:10,padding:'11px 14px',color:'#F5F0FF',fontSize:13,outline:'none'}}>
                  <option value="movies">🎬 Movies</option>
                  <option value="tv">📺 TV Shows</option>
                  <option value="music">🎵 Music</option>
                  <option value="photos">📷 Photos</option>
                  <option value="podcasts">🎙️ Podcasts</option>
                </select>
                <button style={btnGrad} onClick={addFolder}>Add & Scan</button>
              </div>
              <div style={{fontSize:12,color:'#9D8FBB',lineHeight:1.7}}>
                Supports: <strong style={{color:'#F5F0FF'}}>Local paths</strong> (/volume1/...) · <strong style={{color:'#F5F0FF'}}>SMB network shares</strong> (\\server\share) · <strong style={{color:'#F5F0FF'}}>NFS mounts</strong> · <strong style={{color:'#F5F0FF'}}>Cloud storage</strong> (R2, S3, Google Drive)
              </div>
            </div>

            {/* What Javari does automatically */}
            <div style={{marginTop:16,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
              {[{i:'🔍',t:'Auto Scanning',d:'Watches your folders for new files and adds them instantly'},
                {i:'🎨',t:'Metadata & Art',d:'Fetches posters, descriptions, cast from TMDB, MusicBrainz, and more'},
                {i:'▶️',t:'Native Streaming',d:'Streams directly from your NAS — no transcoding service needed'},
                {i:'🔄',t:'Format Support',d:'MKV, MP4, AVI, FLAC, MP3, AAC, HEIC — every common format'},
                {i:'📱',t:'Any Device',d:'Watch on phone, tablet, TV, or browser — Javari handles it all'},
                {i:'🔒',t:'Your Hardware',d:'Files never leave your NAS — fully private, no cloud upload required'}].map((f,i) => (
                <div key={i} style={{background:'#1E1829',border:'1px solid rgba(192,132,252,.12)',borderRadius:12,padding:14}}>
                  <div style={{fontSize:20,marginBottom:6}}>{f.i}</div>
                  <div style={{fontSize:12,fontWeight:600,color:'#F5F0FF',marginBottom:4}}>{f.t}</div>
                  <div style={{fontSize:11,color:'#9D8FBB',lineHeight:1.5}}>{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ),

    movies: (
      <div>
        {sectionHead('🎬 Movies')}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>
          {['All','Action','Drama','Comedy','Thriller','Romance','Sci-Fi','Horror','Documentary'].map(g => (
            <div key={g} onClick={() => setGenreFilter(g)} style={{padding:'7px 16px',borderRadius:20,fontSize:12,cursor:'pointer',border:'1px solid rgba(192,132,252,.2)',background:genreFilter===g?'linear-gradient(135deg,rgba(192,132,252,.2),rgba(244,114,182,.15))':'#1E1829',color:genreFilter===g?'#C084FC':'#9D8FBB',transition:'all .2s'}}>{g}</div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
          {[...MOVIES,...MOVIES].map((m,i) => <div key={i}>{mediaCard(m.title,`${m.genre} · ${m.year}`,m.icon,m.bg)}</div>)}
        </div>
      </div>
    ),

    shows: (
      <div>
        {sectionHead('📺 TV Shows')}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>
          {['All','Drama','Comedy','Reality','Crime','Sci-Fi','Documentary'].map(g => (
            <div key={g} onClick={() => setGenreFilter(g)} style={{padding:'7px 16px',borderRadius:20,fontSize:12,cursor:'pointer',border:'1px solid rgba(192,132,252,.2)',background:genreFilter===g?'linear-gradient(135deg,rgba(192,132,252,.2),rgba(244,114,182,.15))':'#1E1829',color:genreFilter===g?'#C084FC':'#9D8FBB',transition:'all .2s'}}>{g}</div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
          {SHOWS.map(s => <div key={s.id}>{mediaCard(s.title,s.sub,s.icon,s.bg,s.progress||undefined)}</div>)}
        </div>
      </div>
    ),

    livetv: (
      <div>
        {sectionHead('📡 Live TV', 'Channels from your IPTV playlist, streaming services, and connected servers.', <button style={btnGrad} onClick={() => setNav('sources')}>+ Add Channels</button>)}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>
          {['All','🏆 Sports','📰 News','🎬 Movies','🎵 Music','👶 Kids','🌎 International','🌄 Local'].map(g => (
            <div key={g} onClick={() => setGenreFilter(g)} style={{padding:'7px 16px',borderRadius:20,fontSize:12,cursor:'pointer',border:'1px solid rgba(192,132,252,.2)',background:genreFilter===g?'linear-gradient(135deg,rgba(192,132,252,.2),rgba(244,114,182,.15))':'#1E1829',color:genreFilter===g?'#C084FC':'#9D8FBB',transition:'all .2s'}}>{g}</div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:10,marginBottom:16}}>
          {CHANNELS.map(ch => (
            <div key={ch.id} onClick={() => play(ch.name,ch.icon)} style={{borderRadius:12,overflow:'hidden',cursor:'pointer',border:'1px solid rgba(192,132,252,.15)',transition:'transform .2s'}}
              onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.03)')}
              onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}>
              <div style={{height:72,background:`linear-gradient(135deg,${ch.bg},${ch.bg}aa)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>{ch.icon}</div>
              <div style={{background:'#1E1829',padding:'8px 10px'}}><div style={{fontSize:10,color:'#5A4F72',marginBottom:2}}>CH {ch.num}</div><div style={{fontSize:11,fontWeight:500,color:'#F5F0FF'}}>{ch.name}</div></div>
            </div>
          ))}
        </div>
        <div style={{background:'rgba(251,146,60,.06)',border:'1px solid rgba(251,146,60,.2)',borderRadius:12,padding:'12px 16px',fontSize:12,color:'#FB923C',lineHeight:1.6}}>ℹ️ Channels come from your connected IPTV playlist and streaming services. If a channel doesn&apos;t load, check that your subscription is active. <span onClick={() => setNav('sources')} style={{cursor:'pointer',textDecoration:'underline'}}>Manage sources →</span></div>
      </div>
    ),

    sports: (
      <div>
        {sectionHead('🏆 Sports')}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          {[{title:'NBA · Lakers vs Heat',icon:'🏀',bg:'#1A0033',sub:'ESPN · Q3 — 88:72',live:true},{title:'Champions League',icon:'⚽',bg:'#1A1000',sub:'Fox Sports · 2nd Half',live:true},{title:'NFL Preview Show',icon:'🏈',bg:'#001A00',sub:'NFL Network · Tonight',live:false},{title:'MLB Spring Training',icon:'⚾',bg:'#001A1A',sub:'ESPN · Starts 7pm',live:false}].map((item,i) => (
            <div key={i} onClick={() => play(item.title,item.icon)} style={{borderRadius:14,overflow:'hidden',cursor:'pointer',border:'1px solid rgba(192,132,252,.15)',position:'relative',transition:'transform .2s'}}
              onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-2px)')}
              onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}>
              {item.live && <div style={{position:'absolute',top:10,right:10,zIndex:1,background:'rgba(251,146,60,.9)',color:'#fff',borderRadius:6,padding:'2px 8px',fontSize:10,fontWeight:600}}>● LIVE</div>}
              <div style={{height:120,background:`linear-gradient(135deg,${item.bg},${item.bg}99)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:48}}>{item.icon}</div>
              <div style={{background:'#1E1829',padding:'12px 14px'}}><div style={{fontSize:14,fontWeight:500,color:'#F5F0FF',marginBottom:3}}>{item.title}</div><div style={{fontSize:12,color:'#9D8FBB'}}>{item.sub}</div></div>
            </div>
          ))}
        </div>
      </div>
    ),

    music: (
      <div>
        {sectionHead('🎵 Music')}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {MUSIC.map(m => (
            <div key={m.id} onClick={() => play(`${m.title} · ${m.artist}`,m.icon)} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px',background:'#1E1829',border:'1px solid rgba(192,132,252,.15)',borderRadius:12,cursor:'pointer',transition:'background .2s'}}
              onMouseEnter={e=>(e.currentTarget.style.background='rgba(192,132,252,.08)')}
              onMouseLeave={e=>(e.currentTarget.style.background='#1E1829')}>
              <div style={{width:44,height:44,borderRadius:10,background:`linear-gradient(135deg,${m.bg},${m.bg}99)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{m.icon}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:'#F5F0FF'}}>{m.title}</div><div style={{fontSize:11,color:'#9D8FBB',marginTop:2}}>{m.artist}</div></div>
              <span style={{color:'#C084FC',fontSize:20}}>▶</span>
            </div>
          ))}
        </div>
      </div>
    ),

    kids: (
      <div>
        {sectionHead('⭐ Kids')}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
          {[{t:'Lion King',g:'Disney+',i:'🦁',b:'#001A1A'},{t:'Finding Nemo',g:'Disney+',i:'🐠',b:'#001A00'},{t:'Bluey',g:'Disney+',i:'🐾',b:'#1A1000'},{t:'Moana 2',g:'Disney+',i:'🌊',b:'#001A33'},{t:'Inside Out 2',g:'Disney+',i:'🧠',b:'#1A0033'},{t:'Kung Fu Panda 4',g:'Netflix',i:'🐼',b:'#1A1A00'},{t:'The Little Mermaid',g:'Disney+',i:'🧜',b:'#1A0010'},{t:'Encanto',g:'Disney+',i:'🦋',b:'#0A001A'}].map((m,i) => (
            <div key={i}>{mediaCard(m.t,m.g,m.i,m.b)}</div>
          ))}
        </div>
      </div>
    ),

    library: (
      <div>
        {sectionHead('📚 My Library', 'Your personal media collection from your NAS or media server.')}
        {folders.some(f=>f.status==='done') ? (
          <div>
            <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
              {folders.filter(f=>f.status==='done').map(f => (
                <div key={f.id} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 16px',background:'#1E1829',border:'1px solid rgba(192,132,252,.15)',borderRadius:10}}>
                  <span>{typeIcons[f.type]}</span>
                  <div><div style={{fontSize:12,fontWeight:500,color:'#F5F0FF'}}>{f.type.charAt(0).toUpperCase()+f.type.slice(1)}</div><div style={{fontSize:10,color:'#9D8FBB'}}>{f.count?.toLocaleString()} items</div></div>
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
              {MOVIES.map(m => <div key={m.id}>{mediaCard(m.title,`${m.genre} · ${m.year}`,m.icon,m.bg)}</div>)}
            </div>
          </div>
        ) : (
          <div style={{textAlign:'center',padding:'48px 24px',color:'#9D8FBB'}}>
            <div style={{fontSize:40,marginBottom:12,opacity:.6}}>📚</div>
            <div style={{fontSize:15,fontWeight:500,color:'#F5F0FF',marginBottom:6}}>No library connected yet</div>
            <div style={{fontSize:13,lineHeight:1.6,marginBottom:20}}>Connect Plex or Jellyfin, or add NAS folders in standalone mode.</div>
            <button style={btnGrad} onClick={() => setNav('sources')}>Set Up Sources</button>
          </div>
        )}
      </div>
    ),

    watchlist: (
      <div>
        {sectionHead('❤️ Watchlist')}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
          {mediaCard('Wicked','Musical · 2024','🎭','#1A0033')}
          {mediaCard('Severance S2','Thriller · Apple TV+','🏢','#001A1A')}
          {mediaCard('The Bear S3','Drama · Hulu','🍳','#1A0A00')}
        </div>
      </div>
    ),

    downloads: (
      <div>
        {sectionHead('⬇️ Downloads', 'Download content to watch without internet.')}
        <div style={{textAlign:'center',padding:'48px 24px',color:'#9D8FBB'}}>
          <div style={{fontSize:40,marginBottom:12,opacity:.6}}>⬇️</div>
          <div style={{fontSize:15,fontWeight:500,color:'#F5F0FF',marginBottom:6}}>No downloads yet</div>
          <div style={{fontSize:13,lineHeight:1.6}}>While watching anything, tap the download icon to save for offline viewing.</div>
        </div>
      </div>
    ),

    history: (
      <div>
        {sectionHead('🕐 Watch History')}
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {[{t:'Succession S3 E5',s:'Today · 42 min watched',i:'📺',b:'#1A1033'},{t:'The Bear S2 E3',s:'Yesterday · Full episode',i:'🍳',b:'#1A0A00'},{t:'Dune: Part Two',s:'2 days ago · 28% watched',i:'🎬',b:'#2A1A00'},{t:'NBA · Lakers vs Heat',s:'3 days ago · Live game',i:'🏀',b:'#1A0033'}].map((item,i) => (
            <div key={i} onClick={() => play(item.t,item.i)} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px',background:'#1E1829',border:'1px solid rgba(192,132,252,.15)',borderRadius:12,cursor:'pointer',transition:'background .2s'}}
              onMouseEnter={e=>(e.currentTarget.style.background='rgba(192,132,252,.06)')}
              onMouseLeave={e=>(e.currentTarget.style.background='#1E1829')}>
              <div style={{width:44,height:44,borderRadius:10,background:`linear-gradient(135deg,${item.b},${item.b}99)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{item.i}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:'#F5F0FF'}}>{item.t}</div><div style={{fontSize:11,color:'#9D8FBB',marginTop:2}}>{item.s}</div></div>
              <span style={{color:'#C084FC',fontSize:16}}>▶</span>
            </div>
          ))}
        </div>
      </div>
    ),

    iptv: (
      <div>
        {sectionHead('📋 IPTV / M3U', 'Add custom TV channel playlists from your IPTV provider.')}
        <div style={card}>
          <div style={{display:'flex',alignItems:'center',marginBottom:10}}>
            <span style={{fontSize:13,fontWeight:500,color:'#F5F0FF'}}>Playlist URL</span>
            {helpTip('Your IPTV provider gives you an M3U URL — usually like: http://provider.com:8080/get.php?username=...&type=m3u_plus')}
          </div>
          <div style={{display:'flex',gap:10,marginBottom:10}}>
            <input value={iptvUrl} onChange={e=>setIptvUrl(e.target.value)} placeholder="http://your-iptv-provider.com/playlist.m3u" style={{...inputStyle,flex:1}}/>
            <button style={btnGrad} onClick={() => showToast('Channels loaded — 847 channels imported ✓')}>Load</button>
            <button style={btnGhost}>📁 Upload File</button>
          </div>
          <div style={{padding:'10px 14px',background:'rgba(74,222,128,.05)',border:'1px solid rgba(74,222,128,.15)',borderRadius:10,fontSize:12,color:'#4ADE80'}}>✓ Playlist loaded · 847 channels · Last updated 2h ago</div>
        </div>
      </div>
    ),

    standalone: (
      <div>
        {sectionHead('🖥️ Standalone Media Server')}
        <div style={{background:'linear-gradient(135deg,rgba(192,132,252,.1),rgba(244,114,182,.07))',border:'1px solid rgba(192,132,252,.2)',borderRadius:14,padding:'20px 24px',marginBottom:20}}>
          <div style={{fontSize:15,fontWeight:600,color:'#C084FC',marginBottom:8}}>Javari replaces Plex and Jellyfin completely</div>
          <div style={{fontSize:13,color:'#9D8FBB',lineHeight:1.7}}>Add your NAS folders below. Javari scans them, fetches posters and metadata automatically, and streams to any device — phone, tablet, browser, or TV. No third-party media server software required.</div>
        </div>
        <button style={btnGrad} onClick={() => { setNav('sources'); setSourceTab('standalone') }}>Configure Standalone Mode →</button>
      </div>
    ),

    settings: (
      <div>
        {sectionHead('⚙️ Settings')}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div style={card}>
            <div style={{fontSize:14,fontWeight:500,color:'#F5F0FF',marginBottom:14}}>Playback</div>
            {settingRow('Video Quality','Auto adjusts to your connection',(<select style={{background:'#251F34',border:'1px solid rgba(192,132,252,.2)',borderRadius:8,padding:'6px 10px',color:'#F5F0FF',fontSize:12,outline:'none'}}><option>Auto (Recommended)</option><option>4K Ultra HD</option><option>1080p HD</option><option>720p</option></select>),'Higher quality looks better but uses more data.')}
            {settingRow('Autoplay Next Episode','Automatically plays the next episode',<Toggle on={autoplay} onChange={() => setAutoplay(v=>!v)}/>)}
            {settingRow('Skip Intros','Auto-skip show intros',<Toggle on={skipIntros} onChange={() => setSkipIntros(v=>!v)}/>)}
            {settingRow('Subtitles','Show subtitles when available',<Toggle on={subtitles} onChange={() => setSubtitles(v=>!v)}/>)}
          </div>
          <div style={card}>
            <div style={{fontSize:14,fontWeight:500,color:'#F5F0FF',marginBottom:14}}>Notifications</div>
            {settingRow('New Episode Alerts','When shows you watch drop new episodes',<Toggle on={newEpAlerts} onChange={() => setNewEpAlerts(v=>!v)}/>)}
            {settingRow('Live Sports Alerts','When your teams are playing',<Toggle on={sportsAlerts} onChange={() => setSportsAlerts(v=>!v)}/>)}
            {settingRow('Download Complete','When offline downloads finish',<Toggle on={false} onChange={() => showToast('Saved')}/>)}
          </div>
        </div>
      </div>
    ),

    help: (
      <div>
        {sectionHead('❓ Help Center')}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {[{i:'🔗',t:'How do I connect Plex or Jellyfin?',s:'Step-by-step guide to connect your media server in under 2 minutes.',onClick:() => setNav('sources')},
            {i:'🖥️',t:'Can Javari replace Plex entirely?',s:'Yes — use Standalone Mode to point Javari at your NAS folders directly.',onClick:() => setNav('sources')},
            {i:'📋',t:'What is an IPTV / M3U playlist?',s:'IPTV explained in plain English — no tech knowledge required.',onClick:() => setNav('iptv')},
            {i:'📺',t:"Why isn't a channel working?",s:'Troubleshoot live TV and IPTV playback in a few easy steps.'},
            {i:'⬇️',t:'How do I download for offline?',s:'Save content to watch without internet — great for flights.'},
            {i:'✨',t:'Ask Javari AI anything',s:"Can't find an answer? Javari AI will walk you through it.",onClick:() => setNav('javari')}].map((item,i) => (
            <div key={i} onClick={item.onClick} style={{background:i===1||i===5?'linear-gradient(135deg,rgba(192,132,252,.12),rgba(244,114,182,.08))':'#1E1829',border:`1px solid ${i===1||i===5?'rgba(192,132,252,.25)':'rgba(192,132,252,.15)'}`,borderRadius:14,padding:18,cursor:item.onClick?'pointer':'default',transition:'transform .2s'}}
              onMouseEnter={e=>item.onClick&&(e.currentTarget.style.transform='translateY(-2px)')}
              onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}>
              <div style={{fontSize:24,marginBottom:8}}>{item.i}</div>
              <div style={{fontSize:13,fontWeight:500,color:i===1||i===5?'#C084FC':'#F5F0FF',marginBottom:6}}>{item.t}</div>
              <div style={{fontSize:12,color:'#9D8FBB',lineHeight:1.5}}>{item.s}</div>
            </div>
          ))}
        </div>
      </div>
    ),

    javari: (
      <div>
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
          <div style={{width:48,height:48,borderRadius:'50%',background:'linear-gradient(135deg,#C084FC,#F472B6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>✨</div>
          <div><div style={{fontFamily:'Georgia,serif',fontSize:20,color:'#F5F0FF'}}>Javari AI</div><div style={{fontSize:12,color:'#9D8FBB'}}>Your personal entertainment guide</div></div>
        </div>
        <div style={{...card,minHeight:280,marginBottom:14}}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {chatHistory.map((msg,i) => (
              <div key={i} style={{maxWidth:'85%',marginLeft:msg.role==='user'?'auto':0,padding:'12px 14px',borderRadius:12,background:msg.role==='ai'?'linear-gradient(135deg,rgba(192,132,252,.1),rgba(244,114,182,.07))':'rgba(255,255,255,.07)',fontSize:13,lineHeight:1.7,color:'#F5F0FF',borderBottomLeftRadius:msg.role==='ai'?3:12,borderBottomRightRadius:msg.role==='user'?3:12}}>
                {msg.role==='ai' && <><strong style={{color:'#C084FC'}}>Javari</strong> — </>}{msg.text}
              </div>
            ))}
          </div>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>
          {["What's new this week?","Find me a feel-good movie","What sports are on tonight?","Best shows on Netflix right now"].map((q,i) => (
            <button key={i} onClick={() => setChatInput(q)} style={btnGhost}>{q}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:8}}>
          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder="Ask Javari anything..." style={{...inputStyle,flex:1}}/>
          <button style={btnGrad} onClick={sendChat}>Send ✨</button>
        </div>
      </div>
    ),

    profile: (
      <div>
        {sectionHead('👤 My Profile')}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div style={card}>
            <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:20}}>
              <div style={{width:60,height:60,borderRadius:'50%',background:'linear-gradient(135deg,#C084FC,#F472B6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:500}}>JS</div>
              <div><div style={{fontFamily:'Georgia,serif',fontSize:18,color:'#F5F0FF'}}>Jamie S.</div><div style={{fontSize:12,color:'#9D8FBB',marginTop:2}}>Premium Plan · Member since Jan 2025</div></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
              {[{v:'847',l:'Channels'},{v:'3',l:'Services'},{v:'142',l:'Watchlist'},{v:'24h',l:'Watched'}].map((s,i) => (
                <div key={i} style={{background:'#251F34',border:'1px solid rgba(192,132,252,.15)',borderRadius:10,padding:'12px 8px',textAlign:'center'}}>
                  <div style={{fontFamily:'Georgia,serif',fontSize:22,background:'linear-gradient(135deg,#C084FC,#F472B6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{s.v}</div>
                  <div style={{fontSize:10,color:'#9D8FBB',marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>
            <button style={{...btnGhost,width:'100%',justifyContent:'center'}} onClick={() => showToast('Edit profile coming soon')}>Edit Profile</button>
          </div>
          <div style={card}>
            <div style={{fontSize:14,fontWeight:500,color:'#F5F0FF',marginBottom:14}}>Your Preferences</div>
            <div style={{display:'flex',flexDirection:'column',gap:10,fontSize:13,color:'#9D8FBB'}}>
              {[['Favorite genres','Drama, Thriller, Music'],['Language','English'],['Subtitle language','Off'],['Content rating','All ages']].map(([l,v],i) => (
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(192,132,252,.08)'}}><span>{l}</span><span style={{color:'#F5F0FF'}}>{v}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),

    notifications: (
      <div>
        {sectionHead('🔔 Notifications')}
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {[{t:'New Episode: Severance S2 E8',s:'Just dropped on Apple TV+ · 2h ago',i:'📺',accent:true},{t:'NBA is on — Lakers vs Heat',s:'Live now on ESPN',i:'🏀',accent:false},{t:'Javari Recommendation',s:'Based on Succession, you might love Industry on HBO',i:'✨',accent:false},{t:'Download Complete',s:'Wicked is ready for offline viewing',i:'⬇️',accent:false}].map((item,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',background:'#1E1829',border:`1px solid ${item.accent?'rgba(192,132,252,.4)':'rgba(192,132,252,.15)'}`,borderRadius:12,borderLeft:item.accent?'3px solid #C084FC':undefined}}>
              <span style={{fontSize:20}}>{item.i}</span>
              <div><div style={{fontSize:13,fontWeight:500,color:'#F5F0FF'}}>{item.t}</div><div style={{fontSize:11,color:'#9D8FBB',marginTop:2}}>{item.s}</div></div>
            </div>
          ))}
        </div>
      </div>
    ),
  }

  return (
    <div style={{fontFamily:'Inter,-apple-system,sans-serif',background:'#0E0B14',color:'#F5F0FF',minHeight:'100vh',overflowX:'hidden',fontSize:14}}>

      {/* TOP NAV */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',height:62,background:'rgba(14,11,20,.96)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(192,132,252,.12)',position:'sticky',top:0,zIndex:100}}>
        <div style={{fontFamily:'Georgia,serif',fontSize:22,background:'linear-gradient(135deg,#C084FC,#F472B6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',letterSpacing:.5}}>Javari</div>
        <div style={{display:'flex',alignItems:'center',gap:10,background:'#1E1829',border:'1px solid rgba(192,132,252,.2)',borderRadius:24,padding:'9px 16px',width:300}}>
          <span style={{color:'#5A4F72',fontSize:14}}>🔍</span>
          <input placeholder="Search movies, shows, channels, music..." style={{background:'none',border:'none',outline:'none',color:'#F5F0FF',fontSize:13,fontFamily:'inherit',flex:1}}/>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {[['⬇️','downloads'],['🔔','notifications']].map(([ic,id]) => (
            <button key={id} onClick={() => setNav(id as NavId)} style={{width:38,height:38,borderRadius:'50%',border:'1px solid rgba(192,132,252,.2)',background:'#1E1829',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#9D8FBB',fontSize:16}}>{ic}</button>
          ))}
          <div onClick={() => setNav('profile')} style={{width:38,height:38,borderRadius:'50%',background:'linear-gradient(135deg,#C084FC,#F472B6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:500,cursor:'pointer',color:'#fff',border:'2px solid rgba(192,132,252,.4)'}}>JS</div>
        </div>
      </div>

      <div style={{display:'flex',height:'calc(100vh - 62px)'}}>

        {/* SIDEBAR */}
        <div style={{width:210,flexShrink:0,background:'#161222',borderRight:'1px solid rgba(192,132,252,.12)',overflowY:'auto',paddingTop:8,display:'flex',flexDirection:'column'}}>
          <div style={{fontSize:10,letterSpacing:1.5,color:'#5A4F72',padding:'12px 18px 5px',textTransform:'uppercase',fontWeight:500}}>Discover</div>
          {navItem('home','🏠','Home')}
          {navItem('movies','🎬','Movies')}
          {navItem('shows','📺','TV Shows')}
          {navItem('livetv','📡','Live TV','LIVE')}
          {navItem('sports','🏆','Sports')}
          {navItem('music','🎵','Music')}
          {navItem('kids','⭐','Kids')}
          <div style={{fontSize:10,letterSpacing:1.5,color:'#5A4F72',padding:'12px 18px 5px',textTransform:'uppercase',fontWeight:500}}>My Stuff</div>
          {navItem('library','📚','My Library')}
          {navItem('watchlist','❤️','Watchlist')}
          {navItem('downloads','⬇️','Downloads')}
          {navItem('history','🕐','History')}
          <div style={{fontSize:10,letterSpacing:1.5,color:'#5A4F72',padding:'12px 18px 5px',textTransform:'uppercase',fontWeight:500}}>Sources</div>
          {navItem('sources','🔗','Connect & Sources')}
          {navItem('iptv','📋','IPTV / M3U')}
          <div style={{fontSize:10,letterSpacing:1.5,color:'#5A4F72',padding:'12px 18px 5px',textTransform:'uppercase',fontWeight:500}}>More</div>
          {navItem('settings','⚙️','Settings')}
          {navItem('help','❓','Help Center')}
          <div style={{flex:1}}/>
          <div style={{padding:'14px 16px',borderTop:'1px solid rgba(192,132,252,.12)',marginTop:8}}>
            <div style={{fontSize:11,color:'#9D8FBB',fontWeight:500,marginBottom:4}}>Javari AI ✨</div>
            <div style={{fontSize:11,color:'#5A4F72',lineHeight:1.5,marginBottom:10}}>Need help finding something? Ask Javari.</div>
            <button style={{...btnGrad,width:'100%',justifyContent:'center',padding:'9px 0'}} onClick={() => setNav('javari')}>Ask Javari</button>
          </div>
        </div>

        {/* MAIN */}
        <div style={{flex:1,overflowY:'auto',padding:26,paddingBottom:player.visible?100:26}}>
          {pages[nav]}
        </div>
      </div>

      {/* MINI PLAYER */}
      {player.visible && (
        <div style={{position:'fixed',bottom:0,left:0,right:0,height:70,background:'rgba(14,11,20,.97)',backdropFilter:'blur(20px)',borderTop:'1px solid rgba(192,132,252,.15)',display:'flex',alignItems:'center',padding:'0 24px',gap:18,zIndex:200}}>
          <div style={{width:44,height:44,borderRadius:10,background:'linear-gradient(135deg,#C084FC,#F472B6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{player.icon}</div>
          <div style={{width:180,flexShrink:0}}><div style={{fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{player.title}</div><div style={{fontSize:11,color:'#9D8FBB',marginTop:2}}>Javari · Playing now</div></div>
          <div style={{display:'flex',alignItems:'center',gap:10,flex:1,justifyContent:'center'}}>
            {['⏮','⏪'].map((ic,i) => <button key={i} style={{width:34,height:34,borderRadius:'50%',border:'none',background:'transparent',cursor:'pointer',color:'#9D8FBB',fontSize:16}}>{ic}</button>)}
            <button onClick={() => setPlaying(v=>!v)} style={{width:42,height:42,borderRadius:'50%',border:'none',background:'#C084FC',cursor:'pointer',color:'#fff',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>{playing?'⏸':'▶'}</button>
            {['⏩','⏭'].map((ic,i) => <button key={i} style={{width:34,height:34,borderRadius:'50%',border:'none',background:'transparent',cursor:'pointer',color:'#9D8FBB',fontSize:16}}>{ic}</button>)}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,flex:1,maxWidth:340}}>
            <span style={{fontSize:11,color:'#9D8FBB',minWidth:35}}>18:42</span>
            <div style={{flex:1,height:4,background:'#5A4F72',borderRadius:2,cursor:'pointer'}}><div style={{height:'100%',width:`${player.progress}%`,background:'linear-gradient(90deg,#C084FC,#F472B6)',borderRadius:2,transition:'width .3s'}}/></div>
            <span style={{fontSize:11,color:'#9D8FBB',minWidth:35}}>52:00</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,color:'#9D8FBB',fontSize:14}}>
            <span>🔊</span><input type="range" min={0} max={100} defaultValue={80} style={{width:80,accentColor:'#C084FC'}}/>
          </div>
          <button onClick={() => setPlayer(p=>({...p,visible:false}))} style={{width:34,height:34,borderRadius:'50%',border:'none',background:'transparent',cursor:'pointer',color:'#9D8FBB',fontSize:16}}>✕</button>
        </div>
      )}

      {/* TOAST */}
      {toast.visible && (
        <div style={{position:'fixed',bottom:player.visible?86:20,left:'50%',transform:'translateX(-50%)',background:'#251F34',border:'1px solid rgba(192,132,252,.3)',borderRadius:12,padding:'12px 20px',fontSize:13,color:'#F5F0FF',zIndex:300,boxShadow:'0 8px 32px rgba(0,0,0,.4)',whiteSpace:'nowrap'}}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
