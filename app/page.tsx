'use client'
// app/page.tsx — Javari Omni-Media — Dark Luxury Entertainment Platform
// Purpose: Complete entertainment super-app. Beautiful, simple, intuitive.
// Date: March 13, 2026 | Henderson Standard

import { useState, useEffect } from 'react'

type NavId = 'home'|'movies'|'shows'|'livetv'|'sports'|'music'|'kids'|'library'|'watchlist'|'downloads'|'history'|'connect'|'iptv'|'nas'|'settings'|'help'|'javari'|'profile'|'notifications'

interface PlayerState { visible: boolean; title: string; icon: string; progress: number }
interface ToastState { visible: boolean; message: string }

const CHANNELS = [
  {id:'espn', name:'ESPN', num:'206', icon:'🏀', bg:'#1A0033'},
  {id:'cnn', name:'CNN', num:'200', icon:'📰', bg:'#001A33'},
  {id:'fox', name:'Fox News', num:'205', icon:'🦅', bg:'#1A0000'},
  {id:'nbc', name:'NBC', num:'4', icon:'🦚', bg:'#001A00'},
  {id:'hgtv', name:'HGTV', num:'229', icon:'🏠', bg:'#1A0A00'},
  {id:'food', name:'Food Network', num:'231', icon:'🍳', bg:'#1A1000'},
  {id:'hallmark', name:'Hallmark', num:'312', icon:'💝', bg:'#1A001A'},
  {id:'discovery', name:'Discovery', num:'278', icon:'🦁', bg:'#001A1A'},
  {id:'bravo', name:'Bravo', num:'237', icon:'👑', bg:'#0A001A'},
  {id:'lifetime', name:'Lifetime', num:'252', icon:'🌺', bg:'#1A0010'},
  {id:'cartoon', name:'Cartoon Network', num:'296', icon:'⭐', bg:'#001A1A'},
  {id:'bbc', name:'BBC World', num:'302', icon:'🌐', bg:'#001A40'},
]

const MOVIES = [
  {id:'wicked', title:'Wicked', year:2024, genre:'Musical', icon:'🎭', bg:'#1A0033'},
  {id:'brutalist', title:'The Brutalist', year:2025, genre:'Drama', icon:'🎨', bg:'#1A1000'},
  {id:'anora', title:'Anora', year:2024, genre:'Romance', icon:'✨', bg:'#001A1A'},
  {id:'alien', title:'Alien: Romulus', year:2024, genre:'Sci-Fi', icon:'👽', bg:'#001A00'},
  {id:'conclave', title:'Conclave', year:2024, genre:'Thriller', icon:'⛪', bg:'#1A1A00'},
  {id:'dune2', title:'Dune: Part Two', year:2024, genre:'Epic', icon:'🏜️', bg:'#2A1A00'},
]

const SHOWS = [
  {id:'succession', title:'Succession', sub:'Drama · HBO', icon:'📺', bg:'#1A1033', progress:72},
  {id:'bear', title:'The Bear', sub:'Drama · Hulu', icon:'🍳', bg:'#1A0A00', progress:0},
  {id:'severance', title:'Severance', sub:'Thriller · Apple TV+', icon:'🏢', bg:'#001A1A', progress:0},
  {id:'abbott', title:'Abbott Elementary', sub:'Comedy · Hulu', icon:'📝', bg:'#001A00', progress:0},
  {id:'tdnc', title:'True Detective', sub:'S4 · HBO', icon:'🎭', bg:'#001A1A', progress:55},
  {id:'industry', title:'Industry', sub:'Drama · HBO', icon:'💼', bg:'#1A1000', progress:0},
]

const MUSIC = [
  {id:'ts', title:'Folklore', artist:'Taylor Swift', icon:'🎸', bg:'#7C0040'},
  {id:'bey', title:'Cowboy Carter', artist:'Beyoncé', icon:'🎤', bg:'#7C5A00'},
  {id:'sab', title:"Short n' Sweet", artist:'Sabrina Carpenter', icon:'💫', bg:'#003A7C'},
  {id:'sza', title:'SOS', artist:'SZA', icon:'🌊', bg:'#00207C'},
  {id:'chappell', title:'Stick Season', artist:'Noah Kahan', icon:'🍂', bg:'#3A1A00'},
  {id:'sabrina2', title:'Espresso', artist:'Sabrina Carpenter', icon:'☕', bg:'#4A1A00'},
]

const STREAMING_SERVICES = [
  {id:'netflix', name:'Netflix', icon:'🎬', color:'#E50914', connected:true},
  {id:'hulu', name:'Hulu', icon:'📺', color:'#00A8FF', connected:true},
  {id:'disney', name:'Disney+', icon:'🏰', color:'#0063E5', connected:false},
  {id:'max', name:'Max (HBO)', icon:'⚡', color:'#002BE7', connected:false},
  {id:'prime', name:'Prime Video', icon:'🛒', color:'#FF9900', connected:false},
  {id:'apple', name:'Apple TV+', icon:'🍎', color:'#555555', connected:false},
  {id:'peacock', name:'Peacock', icon:'🦚', color:'#00CED1', connected:false},
  {id:'youtube', name:'YouTube TV', icon:'▶', color:'#FF0000', connected:false},
]

export default function JavariOmniMedia() {
  const [nav, setNav] = useState<NavId>('home')
  const [player, setPlayer] = useState<PlayerState>({visible:false, title:'', icon:'🎬', progress:35})
  const [playing, setPlaying] = useState(true)
  const [toast, setToast] = useState<ToastState>({visible:false, message:''})
  const [genreFilter, setGenreFilter] = useState('All')
  const [iptvUrl, setIptvUrl] = useState('')
  const [jellyfinUrl, setJellyfinUrl] = useState('')
  const [jellyfinKey, setJellyfinKey] = useState('')
  const [plexUrl, setPlexUrl] = useState('')
  const [plexToken, setPlexToken] = useState('')
  const [showBanner, setShowBanner] = useState(true)
  const [services, setServices] = useState(STREAMING_SERVICES)
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState([
    {role:'ai', text:"Hey! What would you like to watch tonight? I know you loved Succession — want me to find similar shows? Or are you in the mood for a movie, some music, or live sports?"}
  ])

  const showToast = (msg: string) => {
    setToast({visible:true, message:msg})
    setTimeout(() => setToast({visible:false, message:''}), 3000)
  }

  const play = (title: string, icon: string) => {
    setPlayer({visible:true, title, icon, progress:Math.floor(Math.random()*60)+10})
    setPlaying(true)
  }

  const toggleService = (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? {...s, connected: !s.connected} : s))
    const svc = services.find(s => s.id === id)
    if (svc) showToast(svc.connected ? `${svc.name} disconnected` : `${svc.name} connected! ✓`)
  }

  const sendChat = () => {
    if (!chatInput.trim()) return
    const userMsg = chatInput
    setChatInput('')
    setChatHistory(prev => [...prev, {role:'user', text: userMsg}])
    setTimeout(() => {
      setChatHistory(prev => [...prev, {role:'ai', text: "Great taste! Based on what you're looking for, I'd suggest checking out Severance on Apple TV+ — it has that same corporate power-struggle energy as Succession but with a surreal twist. Want me to play it now?"}])
    }, 1200)
  }

  useEffect(() => {
    if (!player.visible || !playing) return
    const t = setInterval(() => {
      setPlayer(p => p.progress >= 100 ? {...p, visible:false} : {...p, progress: p.progress + 0.2})
    }, 300)
    return () => clearInterval(t)
  }, [player.visible, playing])

  const navItem = (id: NavId, icon: string, label: string, badge?: string) => (
    <div
      onClick={() => setNav(id)}
      style={{
        display:'flex', alignItems:'center', gap:10, padding:'10px 16px',
        borderRadius:10, cursor:'pointer', margin:'1px 10px', fontSize:13,
        background: nav === id ? 'linear-gradient(135deg,rgba(192,132,252,.18),rgba(244,114,182,.10))' : 'transparent',
        color: nav === id ? '#C084FC' : '#9D8FBB',
        fontWeight: nav === id ? 500 : 400,
        transition:'all .15s',
      }}
    >
      <span style={{fontSize:15, width:22, textAlign:'center'}}>{icon}</span>
      <span style={{flex:1}}>{label}</span>
      {badge && <span style={{background:'#C084FC', color:'#fff', borderRadius:8, padding:'1px 7px', fontSize:10, fontWeight:500}}>{badge}</span>}
    </div>
  )

  const helpTip = (tip: string) => (
    <span title={tip} style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      width:16, height:16, borderRadius:'50%', background:'rgba(157,143,187,.4)',
      color:'#fff', fontSize:9, fontWeight:700, cursor:'help', marginLeft:6, flexShrink:0, verticalAlign:'middle'
    }}>?</span>
  )

  const sectionTitle = (text: string, tip?: string) => (
    <div style={{display:'flex', alignItems:'center', marginBottom:14}}>
      <span style={{fontFamily:'Georgia, serif', fontSize:18, fontWeight:400, color:'#F5F0FF'}}>{text}</span>
      {tip && helpTip(tip)}
    </div>
  )

  const movieCard = (title: string, sub: string, icon: string, bg: string, progress?: number) => (
    <div
      onClick={() => play(title, icon)}
      style={{borderRadius:14, overflow:'hidden', cursor:'pointer', border:'1px solid rgba(192,132,252,.15)', transition:'transform .2s'}}
      onMouseEnter={e => (e.currentTarget.style.transform='translateY(-3px)')}
      onMouseLeave={e => (e.currentTarget.style.transform='translateY(0)')}
    >
      <div style={{height:160, background:`linear-gradient(135deg,${bg},${bg}dd)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, position:'relative'}}>
        {icon}
        {progress ? (
          <div style={{position:'absolute', bottom:0, left:0, right:0, height:3, background:'rgba(255,255,255,.15)'}}>
            <div style={{height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#C084FC,#F472B6)'}}/>
          </div>
        ) : null}
      </div>
      <div style={{background:'#1E1829', padding:'10px 12px'}}>
        <div style={{fontSize:13, fontWeight:500, color:'#F5F0FF', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{title}</div>
        <div style={{fontSize:11, color:'#9D8FBB'}}>{sub}</div>
      </div>
    </div>
  )

  const channelCard = (ch: typeof CHANNELS[0]) => (
    <div
      onClick={() => play(ch.name, ch.icon)}
      style={{borderRadius:12, overflow:'hidden', cursor:'pointer', border:'1px solid rgba(192,132,252,.15)', transition:'transform .2s'}}
      onMouseEnter={e => (e.currentTarget.style.transform='scale(1.03)')}
      onMouseLeave={e => (e.currentTarget.style.transform='scale(1)')}
    >
      <div style={{height:72, background:`linear-gradient(135deg,${ch.bg},${ch.bg}aa)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24}}>{ch.icon}</div>
      <div style={{background:'#1E1829', padding:'8px 10px'}}>
        <div style={{fontSize:10, color:'#5A4F72', marginBottom:2}}>CH {ch.num}</div>
        <div style={{fontSize:11, fontWeight:500, color:'#F5F0FF'}}>{ch.name}</div>
      </div>
    </div>
  )

  const inputStyle: React.CSSProperties = {
    width:'100%', background:'#1E1829', border:'1px solid rgba(192,132,252,.2)',
    borderRadius:10, padding:'11px 14px', color:'#F5F0FF', fontSize:13,
    fontFamily:'inherit', outline:'none',
  }

  const btnGrad: React.CSSProperties = {
    display:'inline-flex', alignItems:'center', gap:7, padding:'10px 20px',
    borderRadius:11, fontSize:13, fontWeight:600, cursor:'pointer',
    background:'linear-gradient(135deg,#C084FC,#F472B6)', color:'#fff', border:'none',
    fontFamily:'inherit', transition:'all .2s',
  }

  const btnGhost: React.CSSProperties = {
    display:'inline-flex', alignItems:'center', gap:7, padding:'10px 18px',
    borderRadius:11, fontSize:13, fontWeight:500, cursor:'pointer',
    background:'rgba(255,255,255,.06)', color:'#F5F0FF', border:'1px solid rgba(192,132,252,.2)',
    fontFamily:'inherit', transition:'all .2s',
  }

  const card: React.CSSProperties = {
    background:'#1E1829', border:'1px solid rgba(192,132,252,.15)', borderRadius:16, padding:20
  }

  const settingRow = (label: string, hint: string, control: React.ReactNode, tip?: string) => (
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid rgba(192,132,252,.08)'}}>
      <div>
        <div style={{display:'flex', alignItems:'center', fontSize:13, fontWeight:500, color:'#F5F0FF'}}>{label}{tip && helpTip(tip)}</div>
        <div style={{fontSize:11, color:'#9D8FBB', marginTop:2}}>{hint}</div>
      </div>
      {control}
    </div>
  )

  const Toggle = ({on, onChange}: {on: boolean, onChange: () => void}) => (
    <div onClick={onChange} style={{width:40, height:22, borderRadius:11, background: on ? '#C084FC' : '#5A4F72', cursor:'pointer', position:'relative', transition:'background .3s', flexShrink:0}}>
      <div style={{position:'absolute', top:3, left: on ? 21 : 3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left .3s'}}/>
    </div>
  )

  const [autoplay, setAutoplay] = useState(true)
  const [skipIntros, setSkipIntros] = useState(true)
  const [subtitles, setSubtitles] = useState(false)
  const [newEpAlerts, setNewEpAlerts] = useState(true)
  const [sportsAlerts, setSportsAlerts] = useState(true)

  // ——— PAGES ———

  const pages: Record<NavId, React.ReactNode> = {

    home: (
      <div>
        {showBanner && (
          <div style={{background:'linear-gradient(135deg,rgba(192,132,252,.12),rgba(244,114,182,.08))', border:'1px solid rgba(192,132,252,.25)', borderRadius:14, padding:'16px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:14}}>
            <span style={{fontSize:24}}>👋</span>
            <div>
              <div style={{fontSize:14, fontWeight:500, color:'#F5F0FF', marginBottom:3}}>Welcome to Javari!</div>
              <div style={{fontSize:12, color:'#9D8FBB', lineHeight:1.5}}>Connect your streaming services, NAS, or IPTV playlist and everything lives right here. <span onClick={() => setNav('connect')} style={{color:'#C084FC', cursor:'pointer'}}>Get started →</span></div>
            </div>
            <span onClick={() => setShowBanner(false)} style={{marginLeft:'auto', color:'#5A4F72', cursor:'pointer', fontSize:20, padding:4}}>×</span>
          </div>
        )}

        <div style={{background:'linear-gradient(135deg,#2D1B69 0%,#1A1033 40%,#0E0B14 100%)', borderRadius:20, padding:'32px 32px 28px', marginBottom:24, position:'relative', overflow:'hidden'}}>
          <div style={{position:'absolute', top:-40, right:-40, width:260, height:260, background:'radial-gradient(circle,rgba(192,132,252,.12) 0%,transparent 70%)', pointerEvents:'none'}}/>
          <div style={{fontSize:11, letterSpacing:2, textTransform:'uppercase', color:'#C084FC', marginBottom:10, fontWeight:500}}>✨ Handpicked For You</div>
          <div style={{fontFamily:'Georgia, serif', fontSize:30, fontWeight:400, lineHeight:1.3, marginBottom:10, color:'#F5F0FF'}}>Your world of <span style={{background:'linear-gradient(135deg,#C084FC,#F472B6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>entertainment,</span><br/>all in one place.</div>
          <div style={{fontSize:13, color:'#9D8FBB', lineHeight:1.6, maxWidth:460, marginBottom:22}}>Movies, live TV, music, sports — from every service you own. No switching apps. No confusion. Just play.</div>
          <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
            <button style={btnGrad} onClick={() => play('Trending Tonight', '🎬')}>▶ Play Now</button>
            <button style={btnGhost} onClick={() => showToast('Added to watchlist ❤️')}>+ Watchlist</button>
          </div>
        </div>

        <div style={{marginBottom:24}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14}}>
            <span style={{display:'flex', alignItems:'center', fontFamily:'Georgia, serif', fontSize:18, color:'#F5F0FF'}}>Continue Watching {helpTip('Pick up right where you left off, on any device.')}</span>
            <span onClick={() => setNav('history')} style={{fontSize:12, color:'#C084FC', cursor:'pointer'}}>See all</span>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12}}>
            {SHOWS.filter(s => s.progress > 0).concat(MOVIES.slice(0,2)).slice(0,4).map(item => (
              <div key={item.id} onClick={() => play(item.title, item.icon)} style={{borderRadius:14, overflow:'hidden', cursor:'pointer', border:'1px solid rgba(192,132,252,.15)', transition:'transform .2s'}}
                onMouseEnter={e => (e.currentTarget.style.transform='translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform='translateY(0)')}>
                <div style={{height:100, background:`linear-gradient(135deg,${item.bg||'#1A1033'},${(item.bg||'#1A1033')}aa)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, position:'relative'}}>
                  {item.icon}
                  {'progress' in item && item.progress ? (
                    <div style={{position:'absolute', bottom:0, left:0, right:0, height:3, background:'rgba(255,255,255,.1)'}}>
                      <div style={{height:'100%', width:`${item.progress}%`, background:'linear-gradient(90deg,#C084FC,#F472B6)'}}/>
                    </div>
                  ) : null}
                </div>
                <div style={{background:'#1E1829', padding:'10px 12px'}}>
                  <div style={{fontSize:12, fontWeight:500, color:'#F5F0FF', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{item.title}</div>
                  <div style={{fontSize:10, color:'#9D8FBB', marginTop:2}}>{'progress' in item && item.progress ? `${item.progress}% watched` : 'Not started'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{marginBottom:24}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14}}>
            <span style={{fontFamily:'Georgia, serif', fontSize:18, color:'#F5F0FF'}}>🔴 Live Right Now</span>
            <span onClick={() => setNav('livetv')} style={{fontSize:12, color:'#C084FC', cursor:'pointer'}}>All channels</span>
          </div>
          <div style={{display:'flex', gap:14, overflowX:'auto', paddingBottom:8}}>
            {[{title:'NBA · Lakers vs Heat', icon:'🏀', bg:'#1A0033', sub:'ESPN · Q3 — 88:72'},
              {title:'CNN Evening News', icon:'📰', bg:'#001A33', sub:'CNN · Live broadcast'},
              {title:'Champions League', icon:'⚽', bg:'#1A1000', sub:'Fox Sports · 2nd Half'},
              {title:'Live Concert', icon:'🎸', bg:'#001A00', sub:'AXS TV · Live now'}].map((item,i) => (
              <div key={i} onClick={() => play(item.title, item.icon)} style={{flexShrink:0, width:200, borderRadius:14, overflow:'hidden', cursor:'pointer', border:'1px solid rgba(192,132,252,.15)', transition:'transform .2s', position:'relative'}}
                onMouseEnter={e => (e.currentTarget.style.transform='translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform='translateY(0)')}>
                <div style={{position:'absolute', top:8, left:8, zIndex:1, background:'rgba(251,146,60,.9)', color:'#fff', borderRadius:6, padding:'2px 8px', fontSize:10, fontWeight:600}}>● LIVE</div>
                <div style={{height:110, background:`linear-gradient(135deg,${item.bg},${item.bg}aa)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36}}>{item.icon}</div>
                <div style={{background:'#1E1829', padding:'10px 12px'}}>
                  <div style={{fontSize:12, fontWeight:500, color:'#F5F0FF', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{item.title}</div>
                  <div style={{fontSize:11, color:'#9D8FBB', marginTop:2}}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14}}>
            <span style={{fontFamily:'Georgia, serif', fontSize:18, color:'#F5F0FF'}}>🎬 Trending Movies</span>
            <span onClick={() => setNav('movies')} style={{fontSize:12, color:'#C084FC', cursor:'pointer'}}>See all</span>
          </div>
          <div style={{display:'flex', gap:14, overflowX:'auto', paddingBottom:8}}>
            {MOVIES.map(m => (
              <div key={m.id} style={{flexShrink:0, width:150}}>
                {movieCard(m.title, `${m.genre} · ${m.year}`, m.icon, m.bg)}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),

    movies: (
      <div>
        {sectionTitle('🎬 Movies')}
        <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:20}}>
          {['All','Action','Drama','Comedy','Thriller','Romance','Sci-Fi','Horror','Documentary'].map(g => (
            <div key={g} onClick={() => setGenreFilter(g)} style={{padding:'7px 16px', borderRadius:20, fontSize:12, cursor:'pointer', border:'1px solid rgba(192,132,252,.2)', background: genreFilter===g ? 'linear-gradient(135deg,rgba(192,132,252,.2),rgba(244,114,182,.15))' : '#1E1829', color: genreFilter===g ? '#C084FC' : '#9D8FBB', transition:'all .2s'}}>{g}</div>
          ))}
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14}}>
          {MOVIES.map(m => <div key={m.id}>{movieCard(m.title, `${m.genre} · ${m.year}`, m.icon, m.bg)}</div>)}
          {MOVIES.map(m => <div key={m.id+'2'}>{movieCard(m.title, `${m.genre} · ${m.year}`, m.icon, m.bg)}</div>)}
        </div>
      </div>
    ),

    shows: (
      <div>
        {sectionTitle('📺 TV Shows')}
        <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:20}}>
          {['All','Drama','Comedy','Reality','Crime','Sci-Fi','Documentary'].map(g => (
            <div key={g} onClick={() => setGenreFilter(g)} style={{padding:'7px 16px', borderRadius:20, fontSize:12, cursor:'pointer', border:'1px solid rgba(192,132,252,.2)', background: genreFilter===g ? 'linear-gradient(135deg,rgba(192,132,252,.2),rgba(244,114,182,.15))' : '#1E1829', color: genreFilter===g ? '#C084FC' : '#9D8FBB', transition:'all .2s'}}>{g}</div>
          ))}
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14}}>
          {SHOWS.map(s => <div key={s.id}>{movieCard(s.title, s.sub, s.icon, s.bg, s.progress || undefined)}</div>)}
        </div>
      </div>
    ),

    livetv: (
      <div>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14}}>
          <span style={{display:'flex', alignItems:'center', fontFamily:'Georgia, serif', fontSize:20, color:'#F5F0FF'}}>📡 Live TV {helpTip('Watch live channels from your IPTV playlist, streaming services, or connected antenna.')}</span>
          <button style={btnGrad} onClick={() => setNav('iptv')}>+ Add Channels</button>
        </div>
        <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:20}}>
          {['All','🏆 Sports','📰 News','🎬 Movies','🎵 Music','👶 Kids','🌎 International','🌄 Local'].map(g => (
            <div key={g} onClick={() => setGenreFilter(g)} style={{padding:'7px 16px', borderRadius:20, fontSize:12, cursor:'pointer', border:'1px solid rgba(192,132,252,.2)', background: genreFilter===g ? 'linear-gradient(135deg,rgba(192,132,252,.2),rgba(244,114,182,.15))' : '#1E1829', color: genreFilter===g ? '#C084FC' : '#9D8FBB', transition:'all .2s'}}>{g}</div>
          ))}
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10, marginBottom:16}}>
          {CHANNELS.map(ch => channelCard(ch))}
        </div>
        <div style={{background:'rgba(251,146,60,.06)', border:'1px solid rgba(251,146,60,.2)', borderRadius:12, padding:'12px 16px', fontSize:12, color:'#FB923C', lineHeight:1.6}}>
          ℹ️ Channels come from your connected IPTV playlist and streaming services. If a channel doesn&apos;t load, check that your subscription is active. <span onClick={() => setNav('iptv')} style={{cursor:'pointer', textDecoration:'underline'}}>Manage sources →</span>
        </div>
      </div>
    ),

    sports: (
      <div>
        {sectionTitle('🏆 Sports')}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
          {[{title:'NBA · Lakers vs Heat', icon:'🏀', bg:'#1A0033', sub:'ESPN · Q3 — 88:72', live:true},
            {title:'Champions League', icon:'⚽', bg:'#1A1000', sub:'Fox Sports · 2nd Half', live:true},
            {title:'NFL Preview Show', icon:'🏈', bg:'#001A00', sub:'NFL Network · Tonight', live:false},
            {title:'MLB Spring Training', icon:'⚾', bg:'#001A1A', sub:'ESPN · Starts at 7pm', live:false}].map((item,i) => (
            <div key={i} onClick={() => play(item.title, item.icon)} style={{borderRadius:14, overflow:'hidden', cursor:'pointer', border:'1px solid rgba(192,132,252,.15)', position:'relative', transition:'transform .2s'}}
              onMouseEnter={e => (e.currentTarget.style.transform='translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform='translateY(0)')}>
              {item.live && <div style={{position:'absolute', top:10, right:10, zIndex:1, background:'rgba(251,146,60,.9)', color:'#fff', borderRadius:6, padding:'2px 8px', fontSize:10, fontWeight:600}}>● LIVE</div>}
              <div style={{height:120, background:`linear-gradient(135deg,${item.bg},${item.bg}99)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:48}}>{item.icon}</div>
              <div style={{background:'#1E1829', padding:'12px 14px'}}>
                <div style={{fontSize:14, fontWeight:500, color:'#F5F0FF', marginBottom:3}}>{item.title}</div>
                <div style={{fontSize:12, color:'#9D8FBB'}}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),

    music: (
      <div>
        {sectionTitle('🎵 Music')}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          {MUSIC.map(m => (
            <div key={m.id} onClick={() => play(`${m.title} · ${m.artist}`, m.icon)} style={{display:'flex', alignItems:'center', gap:14, padding:'12px 16px', background:'#1E1829', border:'1px solid rgba(192,132,252,.15)', borderRadius:12, cursor:'pointer', transition:'all .2s'}}
              onMouseEnter={e => (e.currentTarget.style.background='rgba(192,132,252,.08)')}
              onMouseLeave={e => (e.currentTarget.style.background='#1E1829')}>
              <div style={{width:44, height:44, borderRadius:10, background:`linear-gradient(135deg,${m.bg},${m.bg}99)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0}}>{m.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13, fontWeight:500, color:'#F5F0FF'}}>{m.title}</div>
                <div style={{fontSize:11, color:'#9D8FBB', marginTop:2}}>{m.artist}</div>
              </div>
              <span style={{color:'#C084FC', fontSize:20, cursor:'pointer'}}>▶</span>
            </div>
          ))}
        </div>
      </div>
    ),

    kids: (
      <div>
        {sectionTitle('⭐ Kids')}
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14}}>
          {[{t:'Lion King',g:'Disney+',i:'🦁',b:'#001A1A'},{t:'Finding Nemo',g:'Disney+',i:'🐠',b:'#001A00'},
            {t:'Bluey',g:'Disney+',i:'🐾',b:'#1A1000'},{t:'Moana 2',g:'Disney+',i:'🌊',b:'#001A33'},
            {t:'Inside Out 2',g:'Disney+',i:'🧠',b:'#1A0033'},{t:'Kung Fu Panda 4',g:'Netflix',i:'🐼',b:'#1A1A00'},
            {t:'The Little Mermaid',g:'Disney+',i:'🧜',b:'#1A0010'},{t:'Encanto',g:'Disney+',i:'🦋',b:'#0A001A'}].map((m,i) => (
            <div key={i}>{movieCard(m.t, m.g, m.i, m.b)}</div>
          ))}
        </div>
      </div>
    ),

    library: (
      <div>
        {sectionTitle('📚 My Library', 'Connect your home NAS or media server to see your personal collection here.')}
        <div style={{textAlign:'center', padding:'48px 24px', color:'#9D8FBB'}}>
          <div style={{fontSize:40, marginBottom:12, opacity:.6}}>💾</div>
          <div style={{fontSize:15, fontWeight:500, color:'#F5F0FF', marginBottom:6}}>Your personal collection goes here</div>
          <div style={{fontSize:13, lineHeight:1.6, marginBottom:20}}>Connect your NAS or home server to see all your personal movies, music, and photos in one place.</div>
          <button style={btnGrad} onClick={() => setNav('nas')}>Connect My Server</button>
        </div>
      </div>
    ),

    watchlist: (
      <div>
        {sectionTitle('❤️ Watchlist')}
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14}}>
          {movieCard('Wicked', 'Musical · 2024', '🎭', '#1A0033')}
          {movieCard('Severance S2', 'Thriller · Apple TV+', '🏢', '#001A1A')}
          {movieCard('The Bear S3', 'Drama · Hulu', '🍳', '#1A0A00')}
        </div>
      </div>
    ),

    downloads: (
      <div>
        {sectionTitle('⬇️ Downloads', 'Download content to watch without internet — great for flights and travel.')}
        <div style={{textAlign:'center', padding:'48px 24px', color:'#9D8FBB'}}>
          <div style={{fontSize:40, marginBottom:12, opacity:.6}}>⬇️</div>
          <div style={{fontSize:15, fontWeight:500, color:'#F5F0FF', marginBottom:6}}>No downloads yet</div>
          <div style={{fontSize:13, lineHeight:1.6}}>While watching anything, tap the download icon to save it for offline viewing.</div>
        </div>
      </div>
    ),

    history: (
      <div>
        {sectionTitle('🕐 Watch History')}
        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          {[{t:'Succession S3 E5', s:'Today · 42 min watched', i:'📺', b:'#1A1033'},
            {t:'The Bear S2 E3', s:'Yesterday · Full episode', i:'🍳', b:'#1A0A00'},
            {t:'Dune: Part Two', s:'2 days ago · 28% watched', i:'🎬', b:'#2A1A00'},
            {t:'NBA · Lakers vs Heat', s:'3 days ago · Live game', i:'🏀', b:'#1A0033'}].map((item,i) => (
            <div key={i} onClick={() => play(item.t, item.i)} style={{display:'flex', alignItems:'center', gap:14, padding:'12px 16px', background:'#1E1829', border:'1px solid rgba(192,132,252,.15)', borderRadius:12, cursor:'pointer', transition:'background .2s'}}
              onMouseEnter={e => (e.currentTarget.style.background='rgba(192,132,252,.06)')}
              onMouseLeave={e => (e.currentTarget.style.background='#1E1829')}>
              <div style={{width:44, height:44, borderRadius:10, background:`linear-gradient(135deg,${item.b},${item.b}99)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0}}>{item.i}</div>
              <div><div style={{fontSize:13, fontWeight:500, color:'#F5F0FF'}}>{item.t}</div><div style={{fontSize:11, color:'#9D8FBB', marginTop:2}}>{item.s}</div></div>
              <span style={{marginLeft:'auto', color:'#C084FC', fontSize:16}}>▶</span>
            </div>
          ))}
        </div>
      </div>
    ),

    connect: (
      <div>
        <div style={{display:'flex', alignItems:'center', marginBottom:6}}>
          <span style={{fontFamily:'Georgia, serif', fontSize:20, color:'#F5F0FF'}}>🔗 Connect Your Apps</span>
          {helpTip('Connect the services you already pay for. Javari brings them together — you keep your subscriptions, Javari just connects them.')}
        </div>
        <div style={{fontSize:13, color:'#9D8FBB', marginBottom:22, lineHeight:1.6}}>Connect once — then watch everything from here. <strong style={{color:'#F5F0FF'}}>You keep your subscriptions. Javari just connects them.</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          {services.map(svc => (
            <div key={svc.id} style={{display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background: svc.connected ? 'rgba(192,132,252,.06)' : '#1E1829', border:`1px solid ${svc.connected ? 'rgba(192,132,252,.3)' : 'rgba(192,132,252,.15)'}`, borderRadius:14, transition:'all .2s'}}>
              <div style={{width:44, height:44, borderRadius:12, background:svc.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0}}>{svc.icon}</div>
              <div style={{flex:1}}><div style={{fontSize:14, fontWeight:500, color:'#F5F0FF'}}>{svc.name}</div></div>
              <button onClick={() => toggleService(svc.id)} style={{padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer', border:'none', fontFamily:'inherit', background: svc.connected ? 'rgba(74,222,128,.15)' : 'linear-gradient(135deg,#C084FC,#F472B6)', color: svc.connected ? '#4ADE80' : '#fff', transition:'all .2s'}}>
                {svc.connected ? '✓ Connected' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>
    ),

    iptv: (
      <div>
        <div style={{display:'flex', alignItems:'center', marginBottom:6}}>
          <span style={{fontFamily:'Georgia, serif', fontSize:20, color:'#F5F0FF'}}>📋 IPTV & M3U Playlists</span>
          {helpTip('IPTV lets you add custom TV channels using a playlist link. Your IPTV provider will give you an M3U URL. Just paste it here.')}
        </div>
        <div style={{fontSize:13, color:'#9D8FBB', marginBottom:18, lineHeight:1.6}}>Have an IPTV subscription? Paste your M3U link and your channels appear in Live TV automatically. No setup required.</div>
        <div style={{background:'rgba(251,146,60,.06)', border:'1px solid rgba(251,146,60,.2)', borderRadius:12, padding:'12px 16px', marginBottom:18, fontSize:12, color:'#FB923C', lineHeight:1.6}}>
          ℹ️ Javari connects to any playlist you provide. Make sure your IPTV subscription is active and authorized for your use. Javari does not provide or sell channels — this appears once.
        </div>
        <div style={{...card, marginBottom:14}}>
          <div style={{display:'flex', alignItems:'center', marginBottom:4}}>
            <span style={{fontSize:14, fontWeight:500, color:'#F5F0FF'}}>Playlist 1</span>
            {helpTip('Your M3U URL looks like: http://provider.com:8080/get.php?username=...&password=...&type=m3u_plus — your provider gives you this.')}
          </div>
          <div style={{fontSize:12, color:'#9D8FBB', marginBottom:10}}>Paste your M3U URL below</div>
          <input value={iptvUrl} onChange={e => setIptvUrl(e.target.value)} placeholder="http://your-iptv-provider.com/playlist.m3u" style={inputStyle}/>
          <div style={{display:'flex', gap:10, marginTop:12}}>
            <button style={btnGrad} onClick={() => showToast('Channels loading... ✓')}>Load Channels</button>
            <button style={btnGhost}>📁 Upload File</button>
          </div>
          <div style={{marginTop:14, padding:12, background:'rgba(74,222,128,.05)', border:'1px solid rgba(74,222,128,.15)', borderRadius:10, fontSize:12, color:'#4ADE80'}}>
            ✓ Playlist loaded · 847 channels · Last updated 2h ago
          </div>
        </div>
        <div style={card}>
          <div style={{fontSize:14, fontWeight:500, color:'#F5F0FF', marginBottom:4}}>+ Add Another Playlist</div>
          <div style={{fontSize:12, color:'#9D8FBB', marginBottom:10}}>Up to 5 playlists supported</div>
          <input placeholder="Paste another M3U URL..." style={inputStyle}/>
          <button style={{...btnGhost, marginTop:10}}>Add Playlist</button>
        </div>
      </div>
    ),

    nas: (
      <div>
        <div style={{display:'flex', alignItems:'center', marginBottom:6}}>
          <span style={{fontFamily:'Georgia, serif', fontSize:20, color:'#F5F0FF'}}>💾 My NAS / Home Server</span>
          {helpTip('Connect your Synology, QNAP, or any computer running Plex or Jellyfin. Javari imports your media library automatically.')}
        </div>
        <div style={{fontSize:13, color:'#9D8FBB', marginBottom:22, lineHeight:1.6}}>Connect your home server and your personal movies, music, and photos appear right alongside your streaming services.</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
          <div style={card}>
            <div style={{display:'flex', alignItems:'center', marginBottom:14}}>
              <span style={{fontSize:14, fontWeight:500, color:'#F5F0FF'}}>Jellyfin</span>
              {helpTip('Jellyfin is free media server software. If it\'s running on your NAS, enter the address shown in your Jellyfin dashboard.')}
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              <div>
                <div style={{display:'flex', alignItems:'center', fontSize:12, color:'#9D8FBB', marginBottom:6}}>Server Address {helpTip('Usually: http://192.168.1.100:8096 — check your Jellyfin dashboard.')}</div>
                <input value={jellyfinUrl} onChange={e => setJellyfinUrl(e.target.value)} placeholder="http://192.168.1.x:8096" style={inputStyle}/>
              </div>
              <div>
                <div style={{display:'flex', alignItems:'center', fontSize:12, color:'#9D8FBB', marginBottom:6}}>API Key {helpTip('In Jellyfin: Dashboard → API Keys → + → Copy the key.')}</div>
                <input value={jellyfinKey} onChange={e => setJellyfinKey(e.target.value)} type="password" placeholder="Your Jellyfin API key" style={inputStyle}/>
              </div>
              <button style={btnGrad} onClick={() => showToast('Connecting to Jellyfin...')}>Connect & Import Library</button>
            </div>
          </div>
          <div style={card}>
            <div style={{display:'flex', alignItems:'center', marginBottom:14}}>
              <span style={{fontSize:14, fontWeight:500, color:'#F5F0FF'}}>Plex</span>
              {helpTip('If you use Plex, sign in here and Javari will import your Plex libraries automatically.')}
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              <div>
                <div style={{fontSize:12, color:'#9D8FBB', marginBottom:6}}>Plex Server URL</div>
                <input value={plexUrl} onChange={e => setPlexUrl(e.target.value)} placeholder="http://192.168.1.x:32400" style={inputStyle}/>
              </div>
              <div>
                <div style={{display:'flex', alignItems:'center', fontSize:12, color:'#9D8FBB', marginBottom:6}}>Plex Token {helpTip('In Plex: click any item → Get Info → View XML → find X-Plex-Token in the URL.')}</div>
                <input value={plexToken} onChange={e => setPlexToken(e.target.value)} type="password" placeholder="Your Plex token" style={inputStyle}/>
              </div>
              <button style={btnGhost} onClick={() => showToast('Connecting to Plex...')}>Connect Plex</button>
            </div>
          </div>
        </div>
      </div>
    ),

    settings: (
      <div>
        {sectionTitle('⚙️ Settings')}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
          <div style={card}>
            <div style={{fontSize:14, fontWeight:500, color:'#F5F0FF', marginBottom:14}}>Playback</div>
            {settingRow('Video Quality', 'Auto adjusts to your connection', (
              <select style={{background:'#251F34', border:'1px solid rgba(192,132,252,.2)', borderRadius:8, padding:'6px 10px', color:'#F5F0FF', fontSize:12, outline:'none'}}>
                <option>Auto (Recommended)</option><option>4K Ultra HD</option><option>1080p HD</option><option>720p</option>
              </select>
            ), 'Higher quality looks better but uses more data. Auto is recommended for most users.')}
            {settingRow('Autoplay Next Episode', 'Automatically plays the next episode', <Toggle on={autoplay} onChange={() => setAutoplay(v => !v)}/>)}
            {settingRow('Skip Intros', 'Auto-skip show intros', <Toggle on={skipIntros} onChange={() => setSkipIntros(v => !v)}/>)}
            {settingRow('Subtitles', 'Show subtitles when available', <Toggle on={subtitles} onChange={() => setSubtitles(v => !v)}/>)}
          </div>
          <div style={card}>
            <div style={{fontSize:14, fontWeight:500, color:'#F5F0FF', marginBottom:14}}>Notifications</div>
            {settingRow('New Episode Alerts', 'When shows you watch drop new episodes', <Toggle on={newEpAlerts} onChange={() => setNewEpAlerts(v => !v)}/>)}
            {settingRow('Live Sports Alerts', 'When your teams are playing', <Toggle on={sportsAlerts} onChange={() => setSportsAlerts(v => !v)}/>)}
            {settingRow('Download Complete', 'When offline downloads finish', <Toggle on={false} onChange={() => showToast('Notification preference saved')}/>)}
          </div>
        </div>
      </div>
    ),

    help: (
      <div>
        {sectionTitle('❓ Help Center')}
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12}}>
          {[
            {i:'🔗', t:'How do I connect Netflix or Hulu?', s:'Step-by-step guide to connect your streaming services in under 2 minutes.', onClick: () => setNav('connect')},
            {i:'📋', t:'What is an IPTV / M3U playlist?', s:'IPTV explained in plain English — no tech knowledge required.', onClick: () => setNav('iptv')},
            {i:'💾', t:'How do I add my home library?', s:'Connect your NAS or media server so your personal collection lives here too.', onClick: () => setNav('nas')},
            {i:'📺', t:"Why isn't a channel working?", s:'Troubleshoot live TV and IPTV playback issues in a few easy steps.'},
            {i:'⬇️', t:'How do I download for offline?', s:'Save content to watch without internet — on a plane or on the go.'},
            {i:'✨', t:'Ask Javari AI anything', s:"Can't find an answer? Javari AI will walk you through it in plain language.", onClick: () => setNav('javari')},
          ].map((item,i) => (
            <div key={i} onClick={item.onClick} style={{background: i===5 ? 'linear-gradient(135deg,rgba(192,132,252,.12),rgba(244,114,182,.08))' : '#1E1829', border:`1px solid ${i===5 ? 'rgba(192,132,252,.25)' : 'rgba(192,132,252,.15)'}`, borderRadius:14, padding:18, cursor: item.onClick ? 'pointer' : 'default', transition:'transform .2s'}}
              onMouseEnter={e => item.onClick && (e.currentTarget.style.transform='translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform='translateY(0)')}>
              <div style={{fontSize:24, marginBottom:8}}>{item.i}</div>
              <div style={{fontSize:13, fontWeight:500, color: i===5 ? '#C084FC' : '#F5F0FF', marginBottom:6}}>{item.t}</div>
              <div style={{fontSize:12, color:'#9D8FBB', lineHeight:1.5}}>{item.s}</div>
            </div>
          ))}
        </div>
      </div>
    ),

    javari: (
      <div>
        <div style={{display:'flex', alignItems:'center', gap:14, marginBottom:20}}>
          <div style={{width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#C084FC,#F472B6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22}}>✨</div>
          <div>
            <div style={{fontFamily:'Georgia, serif', fontSize:20, color:'#F5F0FF'}}>Javari AI</div>
            <div style={{fontSize:12, color:'#9D8FBB'}}>Your personal entertainment guide</div>
          </div>
        </div>
        <div style={{...card, minHeight:280, marginBottom:14}}>
          <div style={{display:'flex', flexDirection:'column', gap:12}}>
            {chatHistory.map((msg, i) => (
              <div key={i} style={{maxWidth:'85%', marginLeft: msg.role==='user' ? 'auto' : 0, padding:'12px 14px', borderRadius:12, background: msg.role==='ai' ? 'linear-gradient(135deg,rgba(192,132,252,.1),rgba(244,114,182,.07))' : 'rgba(255,255,255,.07)', fontSize:13, lineHeight:1.7, color:'#F5F0FF', borderBottomLeftRadius: msg.role==='ai' ? 3 : 12, borderBottomRightRadius: msg.role==='user' ? 3 : 12}}>
                {msg.role==='ai' && <><strong style={{color:'#C084FC'}}>Javari</strong> — </>}{msg.text}
              </div>
            ))}
          </div>
        </div>
        <div style={{display:'flex', flexWrap:'wrap', gap:8, marginBottom:12}}>
          {["What's new this week?", "Find me a feel-good movie", "What sports are on tonight?", "Best shows on Netflix right now"].map((q,i) => (
            <button key={i} onClick={() => { setChatInput(q); }} style={btnGhost}>{q}</button>
          ))}
        </div>
        <div style={{display:'flex', gap:8}}>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key==='Enter' && sendChat()} placeholder="Ask Javari anything..." style={{...inputStyle, flex:1}}/>
          <button style={btnGrad} onClick={sendChat}>Send ✨</button>
        </div>
      </div>
    ),

    profile: (
      <div>
        {sectionTitle('👤 My Profile')}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
          <div style={card}>
            <div style={{display:'flex', alignItems:'center', gap:16, marginBottom:20}}>
              <div style={{width:60, height:60, borderRadius:'50%', background:'linear-gradient(135deg,#C084FC,#F472B6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:500}}>JS</div>
              <div>
                <div style={{fontFamily:'Georgia, serif', fontSize:18, color:'#F5F0FF'}}>Jamie S.</div>
                <div style={{fontSize:12, color:'#9D8FBB', marginTop:2}}>Premium Plan · Member since Jan 2025</div>
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16}}>
              {[{v:'847', l:'Channels'},{v:'3', l:'Services'},{v:'142', l:'Watchlist'},{v:'24h', l:'Watched'}].map((s,i) => (
                <div key={i} style={{background:'#251F34', border:'1px solid rgba(192,132,252,.15)', borderRadius:10, padding:'12px 8px', textAlign:'center'}}>
                  <div style={{fontFamily:'Georgia, serif', fontSize:22, background:'linear-gradient(135deg,#C084FC,#F472B6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>{s.v}</div>
                  <div style={{fontSize:10, color:'#9D8FBB', marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>
            <button style={{...btnGhost, width:'100%', justifyContent:'center'}} onClick={() => showToast('Edit profile coming soon')}>Edit Profile</button>
          </div>
          <div style={card}>
            <div style={{fontSize:14, fontWeight:500, color:'#F5F0FF', marginBottom:14}}>Your Preferences</div>
            <div style={{display:'flex', flexDirection:'column', gap:10, fontSize:13, color:'#9D8FBB'}}>
              {[['Favorite genres','Drama, Thriller, Music'],['Language','English'],['Subtitle language','Off'],['Content rating','All ages']].map(([l,v],i) => (
                <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(192,132,252,.08)'}}>
                  <span>{l}</span><span style={{color:'#F5F0FF'}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),

    notifications: (
      <div>
        {sectionTitle('🔔 Notifications')}
        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          {[{t:'New Episode: Severance S2 E8', s:'Just dropped on Apple TV+ · 2h ago', i:'📺', accent:true},
            {t:'NBA is on — Lakers vs Heat', s:'Live now on ESPN', i:'🏀', accent:false},
            {t:'Javari Recommendation', s:'Based on Succession, you might love Industry on HBO', i:'✨', accent:false},
            {t:'Download Complete', s:'Wicked is ready for offline viewing', i:'⬇️', accent:false}].map((item,i) => (
            <div key={i} style={{display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:'#1E1829', border:`1px solid ${item.accent ? 'rgba(192,132,252,.4)' : 'rgba(192,132,252,.15)'}`, borderRadius:12, borderLeft: item.accent ? '3px solid #C084FC' : undefined}}>
              <span style={{fontSize:20}}>{item.i}</span>
              <div><div style={{fontSize:13, fontWeight:500, color:'#F5F0FF'}}>{item.t}</div><div style={{fontSize:11, color:'#9D8FBB', marginTop:2}}>{item.s}</div></div>
            </div>
          ))}
        </div>
      </div>
    ),
  }

  return (
    <div style={{fontFamily:'Inter, -apple-system, sans-serif', background:'#0E0B14', color:'#F5F0FF', minHeight:'100vh', overflowX:'hidden', fontSize:14}}>

      {/* TOP NAV */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:62, background:'rgba(14,11,20,.96)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(192,132,252,.12)', position:'sticky', top:0, zIndex:100}}>
        <div style={{fontFamily:'Georgia, serif', fontSize:22, background:'linear-gradient(135deg,#C084FC,#F472B6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:.5}}>Javari</div>
        <div style={{display:'flex', alignItems:'center', gap:10, background:'#1E1829', border:'1px solid rgba(192,132,252,.2)', borderRadius:24, padding:'9px 16px', width:300}}>
          <span style={{color:'#5A4F72', fontSize:14}}>🔍</span>
          <input placeholder="Search movies, shows, channels, music..." style={{background:'none', border:'none', outline:'none', color:'#F5F0FF', fontSize:13, fontFamily:'inherit', flex:1}}/>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          {[['⬇️','downloads'],['🔔','notifications']].map(([ic, id]) => (
            <button key={id} onClick={() => setNav(id as NavId)} style={{width:38, height:38, borderRadius:'50%', border:'1px solid rgba(192,132,252,.2)', background:'#1E1829', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#9D8FBB', fontSize:16, transition:'all .2s'}}>
              {ic}
            </button>
          ))}
          <div onClick={() => setNav('profile')} style={{width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#C084FC,#F472B6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:500, cursor:'pointer', color:'#fff', border:'2px solid rgba(192,132,252,.4)'}}>JS</div>
        </div>
      </div>

      <div style={{display:'flex', height:'calc(100vh - 62px)'}}>

        {/* SIDEBAR */}
        <div style={{width:210, flexShrink:0, background:'#161222', borderRight:'1px solid rgba(192,132,252,.12)', overflowY:'auto', paddingTop:8, display:'flex', flexDirection:'column'}}>
          <div style={{fontSize:10, letterSpacing:1.5, color:'#5A4F72', padding:'12px 18px 5px', textTransform:'uppercase', fontWeight:500}}>Discover</div>
          {navItem('home','🏠','Home')}
          {navItem('movies','🎬','Movies')}
          {navItem('shows','📺','TV Shows')}
          {navItem('livetv','📡','Live TV','LIVE')}
          {navItem('sports','🏆','Sports')}
          {navItem('music','🎵','Music')}
          {navItem('kids','⭐','Kids')}
          <div style={{fontSize:10, letterSpacing:1.5, color:'#5A4F72', padding:'12px 18px 5px', textTransform:'uppercase', fontWeight:500}}>My Stuff</div>
          {navItem('library','📚','My Library')}
          {navItem('watchlist','❤️','Watchlist')}
          {navItem('downloads','⬇️','Downloads')}
          {navItem('history','🕐','History')}
          <div style={{fontSize:10, letterSpacing:1.5, color:'#5A4F72', padding:'12px 18px 5px', textTransform:'uppercase', fontWeight:500}}>Sources</div>
          {navItem('connect','🔗','Connect Apps')}
          {navItem('iptv','📋','IPTV / M3U')}
          {navItem('nas','💾','My NAS / Server')}
          <div style={{fontSize:10, letterSpacing:1.5, color:'#5A4F72', padding:'12px 18px 5px', textTransform:'uppercase', fontWeight:500}}>More</div>
          {navItem('settings','⚙️','Settings')}
          {navItem('help','❓','Help Center')}
          <div style={{flex:1}}/>
          <div style={{padding:'14px 16px', borderTop:'1px solid rgba(192,132,252,.12)', marginTop:8}}>
            <div style={{fontSize:11, color:'#9D8FBB', fontWeight:500, marginBottom:4}}>Javari AI ✨</div>
            <div style={{fontSize:11, color:'#5A4F72', lineHeight:1.5, marginBottom:10}}>Need help finding something? Ask Javari.</div>
            <button style={{...btnGrad, width:'100%', justifyContent:'center', padding:'9px 0'}} onClick={() => setNav('javari')}>Ask Javari</button>
          </div>
        </div>

        {/* MAIN */}
        <div style={{flex:1, overflowY:'auto', padding:26, paddingBottom: player.visible ? 100 : 26}}>
          {pages[nav]}
        </div>
      </div>

      {/* MINI PLAYER */}
      {player.visible && (
        <div style={{position:'fixed', bottom:0, left:0, right:0, height:70, background:'rgba(14,11,20,.97)', backdropFilter:'blur(20px)', borderTop:'1px solid rgba(192,132,252,.15)', display:'flex', alignItems:'center', padding:'0 24px', gap:18, zIndex:200}}>
          <div style={{width:44, height:44, borderRadius:10, background:'linear-gradient(135deg,#C084FC,#F472B6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0}}>{player.icon}</div>
          <div style={{width:180, flexShrink:0}}>
            <div style={{fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{player.title}</div>
            <div style={{fontSize:11, color:'#9D8FBB', marginTop:2}}>Javari · Playing now</div>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:10, flex:1, justifyContent:'center'}}>
            {['⏮','⏪'].map((ic,i) => <button key={i} style={{width:34, height:34, borderRadius:'50%', border:'none', background:'transparent', cursor:'pointer', color:'#9D8FBB', fontSize:16}}>{ic}</button>)}
            <button onClick={() => setPlaying(v => !v)} style={{width:42, height:42, borderRadius:'50%', border:'none', background:'#C084FC', cursor:'pointer', color:'#fff', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center'}}>{playing ? '⏸' : '▶'}</button>
            {['⏩','⏭'].map((ic,i) => <button key={i} style={{width:34, height:34, borderRadius:'50%', border:'none', background:'transparent', cursor:'pointer', color:'#9D8FBB', fontSize:16}}>{ic}</button>)}
          </div>
          <div style={{display:'flex', alignItems:'center', gap:10, flex:1, maxWidth:340}}>
            <span style={{fontSize:11, color:'#9D8FBB', minWidth:35}}>18:42</span>
            <div style={{flex:1, height:4, background:'#5A4F72', borderRadius:2, cursor:'pointer'}}>
              <div style={{height:'100%', width:`${player.progress}%`, background:'linear-gradient(90deg,#C084FC,#F472B6)', borderRadius:2, transition:'width .3s'}}/>
            </div>
            <span style={{fontSize:11, color:'#9D8FBB', minWidth:35}}>52:00</span>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:8, color:'#9D8FBB', fontSize:14}}>
            <span>🔊</span>
            <input type="range" min={0} max={100} defaultValue={80} style={{width:80, accentColor:'#C084FC'}}/>
          </div>
          <button onClick={() => setPlayer(p => ({...p, visible:false}))} style={{width:34, height:34, borderRadius:'50%', border:'none', background:'transparent', cursor:'pointer', color:'#9D8FBB', fontSize:16}}>✕</button>
        </div>
      )}

      {/* TOAST */}
      {toast.visible && (
        <div style={{position:'fixed', bottom: player.visible ? 86 : 20, left:'50%', transform:'translateX(-50%)', background:'#251F34', border:'1px solid rgba(192,132,252,.3)', borderRadius:12, padding:'12px 20px', fontSize:13, color:'#F5F0FF', zIndex:300, boxShadow:'0 8px 32px rgba(0,0,0,.4)', whiteSpace:'nowrap'}}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
