'use client'
// app/page.tsx — Javari Omni-Media Complete Platform
// CEO Vision: Most beautiful, complete, women-first media experience ever built
// March 13, 2026 | Henderson Standard

import { useState, useEffect, useRef, useCallback } from 'react'

type Section = 'home'|'live-tv'|'sports'|'movies'|'tv-shows'|'music'|'wellness'|'kids'|'library'|'downloads'|'storage'|'profiles'|'settings'
type SetupStep = 'splash'|'welcome'|'profile'|'location'|'servers'|'streaming'|'iptv'|'cloud'|'done'

interface Profile { id:string; name:string; avatar:string; color:string; isKids:boolean; pin?:string; watchHistory:string[] }
interface Channel { id:string; name:string; group:string; streamUrl:string; logo?:string; isHD:boolean; currentShow?:string; nextShow?:string; isLive:boolean; isFavorite?:boolean }
interface MediaCard { id:string; title:string; type:string; year?:number; poster?:string; rating?:number; overview?:string; duration?:string; genre?:string[]; source:string; progress?:number }
interface ChatMsg { role:'user'|'assistant'; content:string; ts:string }
interface UserConfig {
  name:string; avatar:string; city:string; theme:string
  hasJellyfin:boolean; jellyfinUrl:string; jellyfinKey:string
  hasPlex:boolean; plexUrl:string; plexToken:string
  streamingServices:string[]; hasIPTV:boolean; iptvUrl:string; iptvAccepted:boolean
  cloudProviders:string[]; profiles:Profile[]; activeProfileId:string
  sleepTimer:number; parentalPin:string; complete:boolean
}

const STREAMING = [
  {id:'netflix',name:'Netflix',color:'#E50914',emoji:'🎬'},{id:'disney',name:'Disney+',color:'#0063E5',emoji:'🏰'},
  {id:'hulu',name:'Hulu',color:'#1CE783',emoji:'📺'},{id:'max',name:'Max',color:'#002BE7',emoji:'⚡'},
  {id:'prime',name:'Prime Video',color:'#00A8E1',emoji:'🛒'},{id:'apple',name:'Apple TV+',color:'#555',emoji:'🍎'},
  {id:'peacock',name:'Peacock',color:'#F7B731',emoji:'🦚'},{id:'paramount',name:'Paramount+',color:'#0064FF',emoji:'⛰️'},
  {id:'espnplus',name:'ESPN+',color:'#CC0000',emoji:'🏟️'},{id:'youtubetv',name:'YouTube TV',color:'#FF0000',emoji:'▶️'},
  {id:'hululive',name:'Hulu Live',color:'#1CE783',emoji:'📡'},{id:'fubo',name:'FuboTV',color:'#E8001D',emoji:'⚽'},
  {id:'discovery',name:'Discovery+',color:'#0A7CF5',emoji:'🔭'},{id:'britbox',name:'BritBox',color:'#CD2B2B',emoji:'🇬🇧'},
  {id:'acorn',name:'Acorn TV',color:'#2D5A27',emoji:'🌰'},{id:'shudder',name:'Shudder',color:'#1A1A2E',emoji:'👻'},
]

const CLOUD = [
  {id:'amazon',name:'Amazon Photos',note:'Unlimited photos FREE',icon:'📸'},
  {id:'google',name:'Google Drive',note:'15 GB free',icon:'☁️'},
  {id:'onedrive',name:'OneDrive',note:'5 GB free',icon:'💼'},
  {id:'icloud',name:'iCloud',note:'5 GB free',icon:'🍎'},
  {id:'dropbox',name:'Dropbox',note:'2 GB free',icon:'📦'},
  {id:'backblaze',name:'Backblaze B2',note:'Best for video',icon:'🔒'},
  {id:'pcloud',name:'pCloud',note:'10 GB free + encrypted',icon:'🛡️'},
  {id:'mega',name:'MEGA',note:'20 GB free',icon:'🔐'},
]

const AVATARS = ['👩','👩🏻','👩🏼','👩🏽','👩🏾','👩🏿','🧑','🧑🏻','👨','👶','🧒','🐱','🌸','⭐','🦋','🌙','🌺','✨']
const PROFILE_COLORS = ['#C4846A','#7A9E7E','#9B89B4','#7DB3C9','#C9974A','#E8B4A0','#8B5E3C','#6B8F71']

const CHANNELS:Channel[] = [
  {id:'cnn',name:'CNN',group:'News',streamUrl:'',isHD:true,isLive:true,currentShow:'CNN Newsroom',nextShow:'The Lead'},
  {id:'msnbc',name:'MSNBC',group:'News',streamUrl:'',isHD:true,isLive:true,currentShow:'Morning Joe',nextShow:'José Díaz-Balart'},
  {id:'foxnews',name:'FOX News',group:'News',streamUrl:'',isHD:true,isLive:true,currentShow:'Fox & Friends',nextShow:'America Reports'},
  {id:'bbc',name:'BBC World News',group:'News',streamUrl:'',isHD:true,isLive:true,currentShow:'BBC World News',nextShow:'Click'},
  {id:'bloomberg',name:'Bloomberg',group:'News',streamUrl:'',isHD:true,isLive:true,currentShow:'Bloomberg Markets',nextShow:'Bloomberg Technology'},
  {id:'cnbc',name:'CNBC',group:'News',streamUrl:'',isHD:true,isLive:true,currentShow:'Squawk Box',nextShow:'Fast Money'},
  {id:'espn',name:'ESPN',group:'Sports',streamUrl:'',isHD:true,isLive:true,currentShow:'SportsCenter',nextShow:'College GameDay'},
  {id:'espn2',name:'ESPN2',group:'Sports',streamUrl:'',isHD:true,isLive:true,currentShow:'College Football Live',nextShow:'SEC Network'},
  {id:'nfl',name:'NFL Network',group:'Sports',streamUrl:'',isHD:true,isLive:true,currentShow:'NFL GameDay Morning',nextShow:'Good Morning Football'},
  {id:'nba',name:'NBA TV',group:'Sports',streamUrl:'',isHD:true,isLive:true,currentShow:'NBA GameTime',nextShow:'NBA Original'},
  {id:'mlb',name:'MLB Network',group:'Sports',streamUrl:'',isHD:true,isLive:true,currentShow:'MLB Tonight',nextShow:'Intentional Talk'},
  {id:'nhl',name:'NHL Network',group:'Sports',streamUrl:'',isHD:true,isLive:true,currentShow:'NHL Now',nextShow:'Live Coverage'},
  {id:'skysports',name:'Sky Sports',group:'Sports',streamUrl:'',isHD:true,isLive:true,currentShow:'Premier League',nextShow:'Soccer Saturday'},
  {id:'bein',name:'beIN Sports',group:'Sports',streamUrl:'',isHD:true,isLive:true,currentShow:'La Liga',nextShow:'Serie A'},
  {id:'golf',name:'Golf Channel',group:'Sports',streamUrl:'',isHD:true,isLive:true,currentShow:'Golf Central',nextShow:'PGA Tour Live'},
  {id:'tennis',name:'Tennis Channel',group:'Sports',streamUrl:'',isHD:true,isLive:true,currentShow:'Live Tennis',nextShow:'Tennis Tonight'},
  {id:'cbssports',name:'CBS Sports',group:'Sports',streamUrl:'',isHD:true,isLive:true,currentShow:'CBS Sports HQ',nextShow:'Inside College Football'},
  {id:'nbcsports',name:'NBC Sports',group:'Sports',streamUrl:'',isHD:true,isLive:true,currentShow:'NBC Sports',nextShow:'Premier League'},
  {id:'bravo',name:'Bravo',group:'Lifestyle',streamUrl:'',isHD:true,isLive:true,currentShow:'The Real Housewives',nextShow:'Top Chef'},
  {id:'oxygen',name:'Oxygen',group:'Lifestyle',streamUrl:'',isHD:true,isLive:true,currentShow:'True Crime Files',nextShow:'Cold Justice'},
  {id:'wetv',name:'WE tv',group:'Lifestyle',streamUrl:'',isHD:true,isLive:true,currentShow:'Marriage Boot Camp',nextShow:'Growing Up Hip Hop'},
  {id:'lifetime',name:'Lifetime',group:'Lifestyle',streamUrl:'',isHD:true,isLive:true,currentShow:'Lifetime Movie',nextShow:'Dance Moms'},
  {id:'hallmark',name:'Hallmark Channel',group:'Lifestyle',streamUrl:'',isHD:true,isLive:true,currentShow:'Hallmark Movie',nextShow:'Home & Family'},
  {id:'hgtv',name:'HGTV',group:'Lifestyle',streamUrl:'',isHD:true,isLive:true,currentShow:'Property Brothers',nextShow:'Love It or List It'},
  {id:'foodnetwork',name:'Food Network',group:'Lifestyle',streamUrl:'',isHD:true,isLive:true,currentShow:'Diners Drive-Ins & Dives',nextShow:'Beat Bobby Flay'},
  {id:'tlc',name:'TLC',group:'Lifestyle',streamUrl:'',isHD:true,isLive:true,currentShow:'90 Day Fiance',nextShow:'Say Yes to the Dress'},
  {id:'e',name:'E!',group:'Lifestyle',streamUrl:'',isHD:true,isLive:true,currentShow:'Keeping Up with Kardashians',nextShow:'Daily Pop'},
  {id:'disney-ch',name:'Disney Channel',group:'Kids',streamUrl:'',isHD:true,isLive:true,currentShow:'Bluey',nextShow:'Big City Greens'},
  {id:'cartoon',name:'Cartoon Network',group:'Kids',streamUrl:'',isHD:true,isLive:true,currentShow:'Teen Titans Go!',nextShow:'Amazing World of Gumball'},
  {id:'nick',name:'Nickelodeon',group:'Kids',streamUrl:'',isHD:false,isLive:true,currentShow:'SpongeBob SquarePants',nextShow:'The Loud House'},
  {id:'pbskids',name:'PBS Kids',group:'Kids',streamUrl:'',isHD:true,isLive:true,currentShow:'Daniel Tiger',nextShow:'Curious George'},
  {id:'tnt',name:'TNT',group:'Entertainment',streamUrl:'',isHD:true,isLive:true,currentShow:'Law & Order',nextShow:'NBA on TNT'},
  {id:'fx',name:'FX',group:'Entertainment',streamUrl:'',isHD:true,isLive:true,currentShow:'The Bear',nextShow:'Shogun'},
  {id:'amc',name:'AMC',group:'Entertainment',streamUrl:'',isHD:true,isLive:true,currentShow:'The Walking Dead',nextShow:'Better Call Saul'},
  {id:'usa',name:'USA Network',group:'Entertainment',streamUrl:'',isHD:true,isLive:true,currentShow:'WWE Raw',nextShow:'Suits'},
  {id:'discovery',name:'Discovery',group:'Documentary',streamUrl:'',isHD:true,isLive:true,currentShow:'Deadliest Catch',nextShow:'Gold Rush'},
  {id:'natgeo',name:'Nat Geo',group:'Documentary',streamUrl:'',isHD:true,isLive:true,currentShow:'Explorer',nextShow:'Life Below Zero'},
  {id:'history',name:'History',group:'Documentary',streamUrl:'',isHD:true,isLive:true,currentShow:'Ancient Aliens',nextShow:'Curse of Oak Island'},
]

const MOVIES:MediaCard[] = [
  {id:'m1',title:'Barbie',type:'movie',year:2023,rating:7.1,genre:['Comedy','Adventure'],overview:'Barbie and Ken have the time of their lives in the colorful world of Barbie Land.',source:'sample',duration:'1h 54m',poster:'🎀'},
  {id:'m2',title:'Oppenheimer',type:'movie',year:2023,rating:8.9,genre:['Drama','History'],overview:'The story of American scientist J. Robert Oppenheimer.',source:'sample',duration:'3h 0m',poster:'💥'},
  {id:'m3',title:'Poor Things',type:'movie',year:2023,rating:8.0,genre:['Comedy','Drama'],overview:'The incredible tale about the fantastical evolution of Bella Baxter.',source:'sample',duration:'2h 21m',poster:'🌟'},
  {id:'m4',title:'Past Lives',type:'movie',year:2023,rating:7.8,genre:['Drama','Romance'],overview:'Two childhood friends are separated then reunite over two decades.',source:'sample',duration:'1h 46m',poster:'🌸'},
  {id:'m5',title:'The Holiday',type:'movie',year:2006,rating:6.9,genre:['Romance','Comedy'],overview:'Two women swap homes in each others countries.',source:'sample',duration:'2h 18m',poster:'🎄'},
  {id:'m6',title:'Legally Blonde',type:'movie',year:2001,rating:6.9,genre:['Comedy','Romance'],overview:'Elle Woods defies expectations at Harvard Law.',source:'sample',duration:'1h 36m',poster:'💅'},
  {id:'m7',title:'Mamma Mia!',type:'movie',year:2008,rating:6.5,genre:['Comedy','Musical'],overview:'The story of a bride trying to find her father.',source:'sample',duration:'1h 48m',poster:'✨'},
  {id:'m8',title:'Hidden Figures',type:'movie',year:2016,rating:7.8,genre:['Drama','History'],overview:'The story of three African-American women at NASA.',source:'sample',duration:'2h 7m',poster:'🚀'},
  {id:'m9',title:'Knives Out',type:'movie',year:2019,rating:7.9,genre:['Mystery','Comedy'],overview:'A detective investigates the death of an eccentric patriarch.',source:'sample',duration:'2h 10m',poster:'🔪'},
  {id:'m10',title:'Crazy Rich Asians',type:'movie',year:2018,rating:6.9,genre:['Comedy','Romance'],overview:'A New Yorker discovers her boyfriend is from a very wealthy family.',source:'sample',duration:'2h 0m',poster:'💎'},
  {id:'m11',title:'The Notebook',type:'movie',year:2004,rating:7.8,genre:['Drama','Romance'],overview:'A passionate love story across time.',source:'sample',duration:'2h 3m',poster:'💕'},
  {id:'m12',title:'Bridesmaids',type:'movie',year:2011,rating:6.8,genre:['Comedy'],overview:'Competition and friendship among a bridal party.',source:'sample',duration:'2h 5m',poster:'👰'},
]

const WELLNESS:MediaCard[] = [
  {id:'w1',title:'Morning Calm Meditation',type:'wellness',genre:['Meditation'],rating:4.9,overview:'A gentle 10-minute morning practice to center your mind.',source:'free',duration:'10 min',poster:'🧘'},
  {id:'w2',title:'Yoga for Beginners',type:'wellness',genre:['Yoga'],rating:4.8,overview:'Simple, beautiful flows for every body.',source:'free',duration:'30 min',poster:'🌿'},
  {id:'w3',title:'Ocean Sleep Sounds',type:'wellness',genre:['Sleep'],rating:5.0,overview:'8 hours of perfect ocean waves for deep sleep.',source:'free',duration:'8 hr',poster:'🌊'},
  {id:'w4',title:'Forest Rain',type:'wellness',genre:['Sleep','Nature'],rating:4.9,overview:'Rain in a lush forest. Perfect for focus or sleep.',source:'free',duration:'3 hr',poster:'🌧️'},
  {id:'w5',title:'Box Breathing for Stress',type:'wellness',genre:['Breathwork'],rating:4.7,overview:'A Navy SEAL technique to calm your nervous system instantly.',source:'free',duration:'8 min',poster:'💨'},
  {id:'w6',title:'Evening Wind-Down Yoga',type:'wellness',genre:['Yoga','Sleep'],rating:4.8,overview:'Gentle evening stretches to prepare your body for rest.',source:'free',duration:'20 min',poster:'🌙'},
  {id:'w7',title:'Morning Affirmations',type:'wellness',genre:['Affirmations'],rating:4.6,overview:'15 powerful affirmations to start your day strong.',source:'free',duration:'5 min',poster:'☀️'},
  {id:'w8',title:'Deep Focus Frequencies',type:'wellness',genre:['Meditation'],rating:4.9,overview:'Binaural beats for deep focus and productivity.',source:'free',duration:'2 hr',poster:'🎵'},
]

const defaultConfig:UserConfig = {
  name:'',avatar:'👩',city:'',theme:'warm',hasJellyfin:false,jellyfinUrl:'',jellyfinKey:'',
  hasPlex:false,plexUrl:'',plexToken:'',streamingServices:[],hasIPTV:false,iptvUrl:'',
  iptvAccepted:false,cloudProviders:[],profiles:[],activeProfileId:'main',sleepTimer:0,parentalPin:'',complete:false
}

const cs = (obj:Record<string,string|number|boolean|undefined>) =>
  Object.entries(obj).filter(([,v])=>v).map(([k])=>k).join(' ')

export default function Javari() {
  const [config,setConfig]=useState<UserConfig>(defaultConfig)
  const [setupDone,setSetupDone]=useState(false)
  const [setupStep,setSetupStep]=useState<SetupStep>('splash')
  const [section,setSection]=useState<Section>('home')
  const [channels,setChannels]=useState<Channel[]>(CHANNELS)
  const [nowPlaying,setNowPlaying]=useState<Channel|null>(null)
  const [nowPlayingMedia,setNowPlayingMedia]=useState<MediaCard|null>(null)
  const [javariOpen,setJavariOpen]=useState(false)
  const [messages,setMessages]=useState<ChatMsg[]>([])
  const [chatInput,setChatInput]=useState('')
  const [chatLoading,setChatLoading]=useState(false)
  const [search,setSearch]=useState('')
  const [favorites,setFavorites]=useState<Set<string>>(new Set())
  const [downloads,setDownloads]=useState<Set<string>>(new Set())
  const [watchLater,setWatchLater]=useState<Set<string>>(new Set())
  const [showIPTVNotice,setShowIPTVNotice]=useState(false)
  const [pendingIPTV,setPendingIPTV]=useState('')
  const [sidebarMini,setSidebarMini]=useState(false)
  const [showProfiles,setShowProfiles]=useState(false)
  const [toast,setToast]=useState<{msg:string,type:string}|null>(null)
  const chatEnd=useRef<HTMLDivElement>(null)

  useEffect(()=>{
    try{const s=localStorage.getItem('javari-v2');if(s){const p=JSON.parse(s);setConfig(p);if(p.complete)setSetupDone(true)}}catch{}
  },[])
  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:'smooth'})},[messages])

  const save=(c:UserConfig)=>{setConfig(c);try{localStorage.setItem('javari-v2',JSON.stringify(c))}catch{}}
  const showToast=(msg:string,type='success')=>{setToast({msg,type});setTimeout(()=>setToast(null),3000)}
  const toggleFavorite=(id:string)=>{setFavorites(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);showToast(n.has(id)?'❤️ Added to favorites':'Removed from favorites','info');return n})}
  const toggleDownload=(id:string,title:string)=>{setDownloads(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);showToast(n.has(id)?`⬇️ Downloading "${title}"`:'Removed from downloads','info');return n})}
  const toggleWatchLater=(id:string)=>{setWatchLater(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);showToast(n.has(id)?'🕐 Added to Watch Later':'Removed','info');return n})}

  const parseM3U=(text:string):Channel[]=>{
    const lines=text.split('\n').map(l=>l.trim()).filter(Boolean);const result:Channel[]=[]
    for(let i=0;i<lines.length;i++){
      if(!lines[i].startsWith('#EXTINF:'))continue
      const url=lines[i+1];if(!url||url.startsWith('#'))continue
      const name=lines[i].match(/,(.+)$/)?.[1]?.trim()||'Channel'
      const logo=lines[i].match(/tvg-logo="([^"]*)"/)?.[1]
      const group=lines[i].match(/group-title="([^"]*)"/)?.[1]||'IPTV'
      result.push({id:`iptv-${i}`,name,logo,streamUrl:url.trim(),group,isHD:/\bHD\b|\b4K\b/i.test(name),isLive:true})
    }
    return result
  }

  const importIPTV=async(url:string)=>{
    try{
      const r=await fetch(`/api/iptv/fetch?url=${encodeURIComponent(url)}`)
      if(!r.ok)throw new Error()
      const text=await r.text()
      const parsed=parseM3U(text)
      setChannels(prev=>{const exist=new Set(prev.map(c=>c.streamUrl));return [...prev,...parsed.filter(c=>!exist.has(c.streamUrl))]})
      showToast(`✅ ${parsed.length} channels imported!`)
    }catch{showToast('Could not import. Check the URL.','error')}
  }

  const handleIPTV=(url:string)=>{if(!config.iptvAccepted){setPendingIPTV(url);setShowIPTVNotice(true)}else importIPTV(url)}

  const sendMessage=useCallback(async(text?:string)=>{
    const content=text||chatInput.trim();if(!content||chatLoading)return
    setChatInput('')
    const userMsg:ChatMsg={role:'user',content,ts:new Date().toISOString()}
    const updated=[...messages,userMsg];setMessages(updated);setChatLoading(true)
    try{
      const r=await fetch('/api/javari/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:updated.map(m=>({role:m.role,content:m.content})),setupContext:config})})
      const d=await r.json()
      if(d.message)setMessages(prev=>[...prev,{role:'assistant',content:d.message,ts:new Date().toISOString()}])
    }catch{setMessages(prev=>[...prev,{role:'assistant',content:"I'm here — just a moment.",ts:new Date().toISOString()}])}
    setChatLoading(false)
  },[chatInput,messages,chatLoading,config])

  if(!setupDone)return <SetupWizard step={setupStep} config={config} onUpdate={u=>save({...config,...u})} onStep={setSetupStep} onComplete={()=>{save({...config,complete:true});setSetupDone(true)}} />

  const groups=['All','Favorites','My IPTV',...Array.from(new Set(channels.map(c=>c.group))).sort()]
  const sports=channels.filter(c=>/sport|nfl|nba|mlb|nhl|espn|golf|tennis|bein|sky sport|ufc|f1|soccer|basketball|baseball|hockey/i.test(c.name+c.group))
  const lifestyle=channels.filter(c=>c.group==='Lifestyle')
  const kids=channels.filter(c=>c.group==='Kids')
  const activeProfile={name:config.name||'You',avatar:config.avatar||'👩',color:'#C4846A'}

  const nav=[
    {id:'home' as Section,icon:'⌂',label:'Home'},{id:'live-tv' as Section,icon:'📺',label:'Live TV'},
    {id:'sports' as Section,icon:'🏆',label:'Sports'},{id:'movies' as Section,icon:'🎬',label:'Movies'},
    {id:'tv-shows' as Section,icon:'📡',label:'TV Shows'},{id:'music' as Section,icon:'🎵',label:'Music'},
    {id:'wellness' as Section,icon:'🌿',label:'Wellness'},{id:'kids' as Section,icon:'🧸',label:'Kids'},
    {id:'library' as Section,icon:'📚',label:'My Library'},{id:'downloads' as Section,icon:'⬇️',label:'Downloads'},
    {id:'storage' as Section,icon:'☁️',label:'Storage'},{id:'profiles' as Section,icon:'👤',label:'Profiles'},
    {id:'settings' as Section,icon:'⚙️',label:'Settings'},
  ]

  return (
    <div style={{display:'flex',height:'100vh',background:'#FAF7F2',fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",overflow:'hidden',position:'relative'}}>
      {/* SIDEBAR */}
      <aside style={{width:sidebarMini?64:220,background:'#FEFCF9',borderRight:'1px solid rgba(28,18,8,0.08)',display:'flex',flexDirection:'column',transition:'width 0.25s ease',flexShrink:0,zIndex:30,boxShadow:'2px 0 24px rgba(28,18,8,0.04)'}}>
        <div style={{padding:sidebarMini?'20px 0':'20px 16px',display:'flex',alignItems:'center',gap:10,justifyContent:sidebarMini?'center':'flex-start',borderBottom:'1px solid rgba(28,18,8,0.08)',flexShrink:0}}>
          <button onClick={()=>setSidebarMini(o=>!o)} style={{width:36,height:36,borderRadius:10,flexShrink:0,background:'linear-gradient(135deg,#C4846A,#C9974A)',border:'none',color:'#fff',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Georgia,serif',fontStyle:'italic',fontWeight:700,boxShadow:'0 4px 12px rgba(196,132,106,0.35)'}}>J</button>
          {!sidebarMini&&<div><div style={{fontSize:13,fontWeight:800,letterSpacing:'0.08em',color:'#1C1208',fontFamily:'Georgia,serif'}}>JAVARI</div><div style={{fontSize:9,color:'#C4846A',letterSpacing:'0.14em',fontWeight:600}}>OMNI-MEDIA</div></div>}
        </div>
        {!sidebarMini&&<button onClick={()=>setShowProfiles(true)} style={{margin:'12px 12px 4px',padding:'10px 12px',background:'#F5F0E8',border:'1px solid rgba(197,152,100,0.2)',borderRadius:12,display:'flex',alignItems:'center',gap:9,cursor:'pointer',textAlign:'left'}}>
          <div style={{width:28,height:28,borderRadius:'50%',background:activeProfile.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{activeProfile.avatar}</div>
          <div><div style={{fontSize:12,fontWeight:700,color:'#1C1208',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{activeProfile.name}</div><div style={{fontSize:10,color:'#9C8870'}}>Switch profile ›</div></div>
        </button>}
        <nav style={{flex:1,padding:'8px 0',overflowY:'auto'}}>
          {nav.map(n=>(
            <button key={n.id} onClick={()=>setSection(n.id)} style={{display:'flex',alignItems:'center',gap:9,width:'100%',padding:sidebarMini?'10px 0':'9px 16px',justifyContent:sidebarMini?'center':'flex-start',background:section===n.id?'#F5F0E8':'transparent',borderLeft:section===n.id?'3px solid #C4846A':'3px solid transparent',border:'none',borderRight:'none',borderTop:'none',borderBottom:'none',color:section===n.id?'#C4846A':'#5C4A33',cursor:'pointer',fontSize:12,fontWeight:section===n.id?700:400,transition:'all 0.15s'}}>
              <span style={{fontSize:16,flexShrink:0}}>{n.icon}</span>
              {!sidebarMini&&<span>{n.label}</span>}
              {!sidebarMini&&n.id==='downloads'&&downloads.size>0&&<span style={{marginLeft:'auto',background:'#C4846A',color:'#fff',borderRadius:'99px',fontSize:9,padding:'1px 6px',fontWeight:700}}>{downloads.size}</span>}
            </button>
          ))}
        </nav>
        <button onClick={()=>{setJavariOpen(true);if(!messages.length)setMessages([{role:'assistant',content:`Hi ${config.name||'beautiful'}! ✨ I'm Javari AI. Ask me what to watch, help finding something, or how to set anything up. What do you need?`,ts:new Date().toISOString()}])}} style={{margin:sidebarMini?'0 8px 16px':'0 12px 16px',padding:'11px',borderRadius:12,background:'linear-gradient(135deg,#C4846A,#C9974A)',border:'none',color:'#fff',cursor:'pointer',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',justifyContent:sidebarMini?'center':'flex-start',gap:8,boxShadow:'0 4px 16px rgba(196,132,106,0.3)'}}>
          <span style={{fontSize:16}}>✦</span>{!sidebarMini&&'Ask Javari AI'}
        </button>
      </aside>

      {/* MAIN */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        <header style={{height:56,display:'flex',alignItems:'center',padding:'0 20px',gap:14,borderBottom:'1px solid rgba(28,18,8,0.08)',background:'rgba(250,247,242,0.95)',backdropFilter:'blur(12px)',flexShrink:0,zIndex:20}}>
          <div style={{position:'relative',flex:1,maxWidth:400}}>
            <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:14,opacity:0.4}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search everything..." style={{width:'100%',paddingLeft:36,paddingRight:14,paddingTop:8,paddingBottom:8,background:'#F5F0E8',border:'1px solid rgba(28,18,8,0.08)',borderRadius:10,color:'#1C1208',fontSize:13,outline:'none'}} />
          </div>
          <div style={{flex:1}} />
          {config.hasJellyfin&&<Chip label="Jellyfin" color="#7A9E7E" />}
          {config.hasPlex&&<Chip label="Plex" color="#C9974A" />}
          {config.hasIPTV&&<Chip label="IPTV" color="#9B89B4" />}
          {config.streamingServices.length>0&&<Chip label={`${config.streamingServices.length} services`} color="#7DB3C9" />}
        </header>

        <main style={{flex:1,overflowY:'auto'}}>
          {section==='home'&&<HomeView config={config} channels={channels} sports={sports} lifestyle={lifestyle} wellness={WELLNESS} movies={MOVIES} favorites={favorites} onPlay={setNowPlaying} onPlayMedia={m=>{setNowPlayingMedia(m)}} onNav={setSection} onToggleFav={toggleFavorite} />}
          {section==='live-tv'&&<LiveTVView channels={channels.filter(c=>!search||c.name.toLowerCase().includes(search.toLowerCase()))} groups={groups} onPlay={c=>{setNowPlaying(c);showToast(`📺 Now watching ${c.name}`)}} nowPlaying={nowPlaying} onAddIPTV={handleIPTV} favorites={favorites} onToggleFav={toggleFavorite} />}
          {section==='sports'&&<SportsView channels={sports} onPlay={c=>{setNowPlaying(c);showToast(`🏆 Now watching ${c.name}`)}} favorites={favorites} onToggleFav={toggleFavorite} />}
          {section==='movies'&&<MoviesView movies={MOVIES} config={config} favorites={favorites} downloads={downloads} watchLater={watchLater} onPlay={m=>setNowPlayingMedia(m)} onToggleFav={toggleFavorite} onToggleDownload={toggleDownload} onToggleWatchLater={toggleWatchLater} onNav={setSection} />}
          {section==='tv-shows'&&<TVShowsView config={config} onNav={setSection} />}
          {section==='music'&&<MusicView config={config} onNav={setSection} />}
          {section==='wellness'&&<WellnessView content={WELLNESS} favorites={favorites} onToggleFav={toggleFavorite} onPlay={m=>setNowPlayingMedia(m)} />}
          {section==='kids'&&<KidsView channels={kids} onPlay={c=>{setNowPlaying(c);showToast(`🧸 ${c.name}`)}} />}
          {section==='library'&&<LibraryView config={config} favorites={favorites} watchLater={watchLater} movies={MOVIES} onPlay={m=>setNowPlayingMedia(m)} onNav={setSection} />}
          {section==='downloads'&&<DownloadsView downloads={downloads} movies={MOVIES} onPlay={m=>setNowPlayingMedia(m)} onRemove={id=>toggleDownload(id,'')} />}
          {section==='storage'&&<StorageView config={config} onUpdate={u=>save({...config,...u})} />}
          {section==='profiles'&&<ProfilesView config={config} onUpdate={u=>save({...config,...u})} />}
          {section==='settings'&&<SettingsView config={config} onUpdate={u=>save({...config,...u})} onReset={()=>{localStorage.removeItem('javari-v2');setConfig(defaultConfig);setSetupDone(false);setSetupStep('splash')}} onImportIPTV={handleIPTV} />}
        </main>

        {/* Mini Player */}
        {(nowPlaying||nowPlayingMedia)&&<div style={{position:'fixed',bottom:0,left:sidebarMini?64:220,right:0,height:68,background:'rgba(250,247,242,0.97)',backdropFilter:'blur(20px)',borderTop:'1px solid rgba(28,18,8,0.08)',display:'flex',alignItems:'center',padding:'0 20px',gap:14,zIndex:40,boxShadow:'0 -4px 24px rgba(28,18,8,0.06)'}}>
          <div style={{width:42,height:42,borderRadius:10,background:'linear-gradient(135deg,#C4846A,#C9974A)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{nowPlayingMedia?nowPlayingMedia.poster:'📺'}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:700,color:'#1C1208',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'Georgia,serif'}}>{nowPlaying?.name||nowPlayingMedia?.title}</div>
            <div style={{fontSize:11,color:'#9C8870'}}>{nowPlaying?<span>{nowPlaying.currentShow} <span style={{color:'#C4846A',fontWeight:700}}>● LIVE</span></span>:<span>{nowPlayingMedia?.genre?.join(', ')} · {nowPlayingMedia?.duration}</span>}</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {['⏮','⏸','⏭'].map(b=><button key={b} style={{width:b==='⏸'?40:32,height:b==='⏸'?40:32,borderRadius:'50%',background:b==='⏸'?'linear-gradient(135deg,#C4846A,#C9974A)':'#F5F0E8',border:'none',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',color:b==='⏸'?'#fff':'inherit'}}>{b}</button>)}
            <button onClick={()=>{setNowPlaying(null);setNowPlayingMedia(null)}} style={{width:32,height:32,borderRadius:'50%',background:'transparent',border:'none',cursor:'pointer',fontSize:18,color:'#9C8870'}}>✕</button>
          </div>
        </div>}
      </div>

      {/* JAVARI AI */}
      {javariOpen&&<div style={{position:'fixed',right:0,top:0,bottom:0,width:380,background:'#FEFCF9',borderLeft:'1px solid rgba(28,18,8,0.08)',display:'flex',flexDirection:'column',zIndex:100,boxShadow:'-8px 0 40px rgba(28,18,8,0.08)'}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid rgba(28,18,8,0.08)',display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:38,height:38,borderRadius:12,background:'linear-gradient(135deg,#C4846A,#C9974A)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,boxShadow:'0 4px 12px rgba(196,132,106,0.3)'}}>✦</div>
          <div><div style={{fontSize:14,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif'}}>Javari AI</div><div style={{fontSize:10,color:'#7A9E7E',fontWeight:600}}>● Always here for you</div></div>
          <button onClick={()=>setJavariOpen(false)} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',fontSize:20,color:'#9C8870'}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:10}}>
          {messages.map((m,i)=>(
            <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
              {m.role==='assistant'&&<div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#C4846A,#C9974A)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0,marginRight:8,marginTop:2}}>✦</div>}
              <div style={{maxWidth:'78%',padding:'10px 14px',borderRadius:m.role==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px',background:m.role==='user'?'linear-gradient(135deg,#C4846A,#C9974A)':'#F5F0E8',border:m.role==='assistant'?'1px solid rgba(28,18,8,0.08)':'none',fontSize:13,lineHeight:1.65,color:m.role==='user'?'#fff':'#1C1208'}}>{m.content}</div>
            </div>
          ))}
          {chatLoading&&<div style={{display:'flex',gap:4,padding:'8px 12px',alignItems:'center'}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#C4846A,#C9974A)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0,marginRight:8}}>✦</div>
            {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:'#C4846A',animation:`javari-bounce 1s ease ${i*0.15}s infinite`}} />)}
          </div>}
          <div ref={chatEnd} />
        </div>
        {messages.length<=1&&<div style={{padding:'0 14px 10px',display:'flex',flexWrap:'wrap',gap:6}}>
          {['What should I watch tonight?','Find me a good thriller','Best channels for kids','Optimize my storage costs','Help set up Jellyfin'].map(q=>(
            <button key={q} onClick={()=>sendMessage(q)} style={{padding:'6px 12px',background:'#F5F0E8',border:'1px solid rgba(197,152,100,0.2)',borderRadius:20,color:'#C4846A',fontSize:11,fontWeight:600,cursor:'pointer'}}>{q}</button>
          ))}
        </div>}
        <div style={{padding:'12px 16px',borderTop:'1px solid rgba(28,18,8,0.08)',display:'flex',gap:8}}>
          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMessage()} placeholder="Ask me anything..." style={{flex:1,padding:'10px 14px',background:'#F5F0E8',border:'1px solid rgba(28,18,8,0.08)',borderRadius:12,color:'#1C1208',fontSize:13,outline:'none'}} />
          <button onClick={()=>sendMessage()} disabled={!chatInput.trim()||chatLoading} style={{width:42,height:42,background:chatInput.trim()?'linear-gradient(135deg,#C4846A,#C9974A)':'#F5F0E8',border:'none',borderRadius:12,color:chatInput.trim()?'#fff':'#9C8870',cursor:chatInput.trim()?'pointer':'default',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>→</button>
        </div>
      </div>}

      {/* IPTV NOTICE */}
      {showIPTVNotice&&<div style={{position:'fixed',inset:0,background:'rgba(28,18,8,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20,backdropFilter:'blur(4px)'}}>
        <div style={{background:'#FEFCF9',borderRadius:20,padding:36,maxWidth:500,width:'100%',boxShadow:'0 24px 64px rgba(28,18,8,0.15)'}}>
          <div style={{fontSize:40,marginBottom:16}}>📡</div>
          <h2 style={{fontSize:22,fontWeight:800,color:'#1C1208',marginBottom:12,fontFamily:'Georgia,serif'}}>Connecting Your IPTV Source</h2>
          <p style={{fontSize:14,color:'#5C4A33',lineHeight:1.8,marginBottom:14}}>Javari connects to media sources you provide. When using an IPTV subscription or M3U playlist, please ensure you have appropriate access rights for that service.</p>
          <p style={{fontSize:12,color:'#9C8870',lineHeight:1.7,marginBottom:24}}>We are a connection layer. We do not host content. You are responsible for compliance with local laws. This notice appears once.</p>
          <div style={{display:'flex',gap:12}}>
            <button onClick={()=>setShowIPTVNotice(false)} style={{flex:1,padding:12,background:'transparent',border:'1px solid rgba(28,18,8,0.08)',borderRadius:12,color:'#5C4A33',cursor:'pointer',fontSize:13,fontWeight:600}}>Cancel</button>
            <button onClick={()=>{save({...config,iptvAccepted:true,hasIPTV:true});setShowIPTVNotice(false);if(pendingIPTV)importIPTV(pendingIPTV)}} style={{flex:2,padding:12,background:'linear-gradient(135deg,#C4846A,#C9974A)',border:'none',borderRadius:12,color:'#fff',cursor:'pointer',fontSize:13,fontWeight:700,boxShadow:'0 4px 12px rgba(196,132,106,0.3)'}}>I Understand — Connect</button>
          </div>
        </div>
      </div>}

      {/* PROFILE SWITCHER */}
      {showProfiles&&<div style={{position:'fixed',inset:0,background:'rgba(28,18,8,0.5)',zIndex:150,backdropFilter:'blur(4px)'}} onClick={()=>setShowProfiles(false)}>
        <div style={{position:'absolute',left:0,top:0,bottom:0,width:300,background:'#FEFCF9',padding:24,display:'flex',flexDirection:'column',gap:12}} onClick={e=>e.stopPropagation()}>
          <h2 style={{fontSize:20,fontWeight:800,color:'#1C1208',marginBottom:8,fontFamily:'Georgia,serif'}}>Who&apos;s Watching?</h2>
          {[{id:'main',name:config.name||'Main Profile',avatar:config.avatar||'👩',color:'#C4846A',isKids:false},...(config.profiles||[])].map(p=>(
            <button key={p.id} onClick={()=>{save({...config,activeProfileId:p.id});setShowProfiles(false)}} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:config.activeProfileId===p.id?'#F5F0E8':'transparent',border:`1px solid ${config.activeProfileId===p.id?'rgba(197,152,100,0.2)':'transparent'}`,borderRadius:12,cursor:'pointer',textAlign:'left'}}>
              <div style={{width:44,height:44,borderRadius:'50%',background:p.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{p.avatar}</div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:'#1C1208'}}>{p.name}</div>
                {p.isKids&&<div style={{fontSize:11,color:'#7A9E7E',fontWeight:600}}>Kids Profile</div>}
                {config.activeProfileId===p.id&&<div style={{fontSize:11,color:'#C4846A',fontWeight:600}}>Active</div>}
              </div>
            </button>
          ))}
          <button onClick={()=>{setShowProfiles(false);setSection('profiles')}} style={{padding:'12px',background:'#F5F0E8',border:'1px dashed rgba(28,18,8,0.08)',borderRadius:12,color:'#C4846A',cursor:'pointer',fontSize:13,fontWeight:600,marginTop:'auto'}}>+ Manage Profiles</button>
        </div>
      </div>}

      {/* TOAST */}
      {toast&&<div style={{position:'fixed',top:16,left:'50%',transform:'translateX(-50%)',background:toast.type==='error'?'#FEF2F2':'#FEFCF9',border:`1px solid ${toast.type==='error'?'#FECACA':'rgba(197,152,100,0.2)'}`,borderRadius:12,padding:'10px 20px',fontSize:13,fontWeight:600,color:toast.type==='error'?'#DC2626':'#1C1208',boxShadow:'0 12px 48px rgba(28,18,8,0.12)',zIndex:300,whiteSpace:'nowrap',animation:'toast-in 0.3s ease'}}>{toast.msg}</div>}

      <style>{`
        @keyframes javari-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes toast-in{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        button:hover{opacity:0.88!important}
        *{box-sizing:border-box;-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(139,94,60,0.2);border-radius:3px}
      `}</style>
    </div>
  )
}

function Chip({label,color}:{label:string,color:string}){
  return <div style={{fontSize:10,fontWeight:700,color,background:`${color}18`,border:`1px solid ${color}30`,padding:'3px 9px',borderRadius:20}}>{label}</div>
}

function HomeView({config,channels,sports,lifestyle,wellness,movies,favorites,onPlay,onPlayMedia,onNav,onToggleFav}:any){
  const hr=new Date().getHours()
  const greeting=hr<5?'Still up?':hr<12?'Good Morning':hr<17?'Good Afternoon':hr<21?'Good Evening':'Good Night'
  return(
    <div style={{padding:'28px 28px 100px'}}>
      <div style={{marginBottom:32}}>
        <div style={{fontSize:12,color:'#9C8870',fontWeight:600,letterSpacing:'0.06em',marginBottom:6,textTransform:'uppercase'}}>{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div>
        <h1 style={{fontSize:30,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',lineHeight:1.2}}>{greeting}, <span style={{color:'#C4846A',fontStyle:'italic'}}>{config.name||'Beautiful'}.</span></h1>
        <p style={{fontSize:13,color:'#9C8870',marginTop:6}}>{channels.length} live channels · {movies.length} movies · Wellness · Sports · Kids — all yours</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:12,marginBottom:36}}>
        {[{icon:'📺',t:'Live TV',s:`${channels.length} channels`,c:'#C4846A',sec:'live-tv'},{icon:'🏆',t:'Sports',s:`${sports.length} channels`,c:'#C9974A',sec:'sports'},{icon:'🌿',t:'Wellness',s:'Meditate · Sleep · Yoga',c:'#7A9E7E',sec:'wellness'},{icon:'🎬',t:'Movies',s:`${movies.length} in library`,c:'#9B89B4',sec:'movies'},{icon:'🧸',t:'Kids Zone',s:'Safe · Curated · Fun',c:'#7DB3C9',sec:'kids'},{icon:'☁️',t:'Storage',s:'Smart optimization',c:'#8B5E3C',sec:'storage'}].map(card=>(
          <button key={card.sec} onClick={()=>onNav(card.sec)} style={{padding:'16px',background:`${card.c}12`,border:`1px solid ${card.c}25`,borderRadius:14,cursor:'pointer',textAlign:'left',transition:'all 0.2s'}}>
            <div style={{fontSize:26,marginBottom:8}}>{card.icon}</div>
            <div style={{fontSize:13,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:2}}>{card.t}</div>
            <div style={{fontSize:10,color:'#9C8870'}}>{card.s}</div>
          </button>
        ))}
      </div>
      <Sec title="✨ Wellness for You" action="See all" onAction={()=>onNav('wellness')}>
        <div style={{display:'flex',gap:12,overflowX:'auto',paddingBottom:6}}>{wellness.slice(0,6).map((w:MediaCard)=><WCard key={w.id} item={w} onPlay={()=>onPlayMedia(w)} />)}</div>
      </Sec>
      {sports.length>0&&<Sec title="🏆 Sports — Live Now" action="All sports" onAction={()=>onNav('sports')}>
        <div style={{display:'flex',gap:12,overflowX:'auto',paddingBottom:6}}>{sports.slice(0,8).map((c:Channel)=><CPill key={c.id} channel={c} onPlay={onPlay} isFav={favorites.has(c.id)} onToggleFav={onToggleFav} />)}</div>
      </Sec>}
      {lifestyle.length>0&&<Sec title="💕 Trending for You" action="Live TV" onAction={()=>onNav('live-tv')}>
        <div style={{display:'flex',gap:12,overflowX:'auto',paddingBottom:6}}>{lifestyle.slice(0,8).map((c:Channel)=><CPill key={c.id} channel={c} onPlay={onPlay} isFav={favorites.has(c.id)} onToggleFav={onToggleFav} />)}</div>
      </Sec>}
      <Sec title="🎬 Movies You'll Love" action="All movies" onAction={()=>onNav('movies')}>
        <div style={{display:'flex',gap:14,overflowX:'auto',paddingBottom:8}}>{movies.slice(0,8).map((m:MediaCard)=><MCard key={m.id} movie={m} onPlay={()=>onPlayMedia(m)} isFav={favorites.has(m.id)} onToggleFav={onToggleFav} compact />)}</div>
      </Sec>
      <Sec title="🔗 Your Connected Platform" action="">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
          {[{on:config.hasJellyfin,n:'Jellyfin',sub:'Media Server',c:'#7A9E7E'},{on:config.hasPlex,n:'Plex',sub:'Media Server',c:'#C9974A'},{on:config.hasIPTV,n:'IPTV',sub:'Live TV Source',c:'#9B89B4'},{on:config.streamingServices.length>0,n:`${config.streamingServices.length||0} Streaming`,sub:'Services',c:'#7DB3C9'},{on:config.cloudProviders.length>0,n:`${config.cloudProviders.length||0} Cloud`,sub:'Providers',c:'#8B5E3C'}].map(x=>(
            <div key={x.n} style={{padding:'12px 14px',background:'#F5F0E8',border:`1px solid ${x.on?`${x.c}30`:'rgba(28,18,8,0.08)'}`,borderRadius:12,display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:x.on?x.c:'#D1C7BB',flexShrink:0}} />
              <div><div style={{fontSize:12,fontWeight:700,color:x.on?'#1C1208':'#9C8870'}}>{x.n}</div><div style={{fontSize:10,color:'#9C8870'}}>{x.sub}</div></div>
            </div>
          ))}
        </div>
      </Sec>
    </div>
  )
}

function Sec({title,action,onAction,children}:{title:string,action:string,onAction?:()=>void,children:React.ReactNode}){
  return(
    <div style={{marginBottom:36}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <h2 style={{fontSize:15,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif'}}>{title}</h2>
        {action&&onAction&&<button onClick={onAction} style={{background:'none',border:'none',color:'#C4846A',cursor:'pointer',fontSize:12,fontWeight:700}}>→ {action}</button>}
      </div>
      {children}
    </div>
  )
}

function CPill({channel,onPlay,isFav,onToggleFav}:{channel:Channel,onPlay:(c:Channel)=>void,isFav:boolean,onToggleFav:(id:string)=>void}){
  return(
    <div style={{minWidth:148,flexShrink:0,position:'relative'}}>
      <button onClick={()=>onPlay(channel)} style={{width:'100%',padding:'12px',background:'#F5F0E8',border:'1px solid rgba(28,18,8,0.08)',borderRadius:12,cursor:'pointer',textAlign:'left'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:7}}><span style={{fontSize:9,color:'#C4846A',fontWeight:800}}>● LIVE</span>{channel.isHD&&<span style={{fontSize:9,color:'#7DB3C9',fontWeight:700}}>HD</span>}</div>
        <div style={{fontSize:13,fontWeight:700,color:'#1C1208',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:3}}>{channel.name}</div>
        {channel.currentShow&&<div style={{fontSize:10,color:'#9C8870',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{channel.currentShow}</div>}
      </button>
      <button onClick={()=>onToggleFav(channel.id)} style={{position:'absolute',top:8,right:8,background:'none',border:'none',fontSize:13,cursor:'pointer',opacity:isFav?1:0.25}}>{isFav?'❤️':'🤍'}</button>
    </div>
  )
}

function WCard({item,onPlay}:{item:MediaCard,onPlay:()=>void}){
  return(
    <button onClick={onPlay} style={{minWidth:158,flexShrink:0,padding:'15px',background:'rgba(122,158,126,0.08)',border:'1px solid rgba(122,158,126,0.18)',borderRadius:13,cursor:'pointer',textAlign:'left'}}>
      <div style={{fontSize:30,marginBottom:9}}>{item.poster}</div>
      <div style={{fontSize:13,fontWeight:700,color:'#1C1208',marginBottom:4,fontFamily:'Georgia,serif',lineHeight:1.3}}>{item.title}</div>
      <div style={{fontSize:10,color:'#7A9E7E',fontWeight:600,marginBottom:3}}>{item.genre?.[0]} · {item.duration}</div>
      <div style={{fontSize:10,color:'#9C8870',lineHeight:1.5}}>{item.overview?.slice(0,60)}...</div>
    </button>
  )
}

function MCard({movie,onPlay,isFav,onToggleFav,compact}:{movie:MediaCard,onPlay:()=>void,isFav:boolean,onToggleFav:(id:string)=>void,compact?:boolean}){
  const w=compact?148:196
  return(
    <div style={{minWidth:w,flexShrink:0,position:'relative'}}>
      <button onClick={onPlay} style={{width:'100%',background:'#F5F0E8',border:'1px solid rgba(28,18,8,0.08)',borderRadius:13,cursor:'pointer',textAlign:'left',overflow:'hidden',padding:0}}>
        <div style={{height:compact?200:260,background:'linear-gradient(135deg,#F5D5C8,#FAF7F2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:compact?54:68,position:'relative'}}>
          {movie.poster}
          {movie.rating&&<div style={{position:'absolute',bottom:8,left:8,background:'rgba(28,18,8,0.75)',color:'#fff',borderRadius:6,padding:'2px 7px',fontSize:11,fontWeight:700}}>★ {movie.rating}</div>}
        </div>
        <div style={{padding:'10px 12px 12px'}}>
          <div style={{fontSize:13,fontWeight:700,color:'#1C1208',marginBottom:3,fontFamily:'Georgia,serif',lineHeight:1.3}}>{movie.title}</div>
          <div style={{fontSize:10,color:'#9C8870'}}>{movie.year} · {movie.genre?.[0]} · {movie.duration}</div>
        </div>
      </button>
      <button onClick={()=>onToggleFav(movie.id)} style={{position:'absolute',top:8,right:8,width:28,height:28,borderRadius:'50%',background:'rgba(250,247,242,0.9)',border:'none',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>{isFav?'❤️':'🤍'}</button>
    </div>
  )
}

function LiveTVView({channels,groups,onPlay,nowPlaying,onAddIPTV,favorites,onToggleFav}:any){
  const [url,setUrl]=useState('')
  const [activeGroup,setActiveGroup]=useState('All')
  const filtered=channels.filter((c:Channel)=>activeGroup==='All'||c.group===activeGroup||(activeGroup==='Favorites'&&favorites.has(c.id)))
  return(
    <div style={{padding:'24px 24px 100px'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20,gap:14,flexWrap:'wrap'}}>
        <div><h1 style={{fontSize:24,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:4}}>Live TV</h1><p style={{fontSize:13,color:'#9C8870'}}>{channels.length} channels · {groups.length-3} categories</p></div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Paste M3U URL to import channels..." style={{padding:'9px 13px',background:'#F5F0E8',border:'1px solid rgba(28,18,8,0.08)',borderRadius:10,color:'#1C1208',fontSize:12,outline:'none',width:250}} />
          <button onClick={()=>{if(url.trim()){onAddIPTV(url.trim());setUrl('')}}} disabled={!url.trim()} style={{padding:'9px 16px',background:'linear-gradient(135deg,#C4846A,#C9974A)',border:'none',borderRadius:10,color:'#fff',cursor:'pointer',fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>+ Import</button>
        </div>
      </div>
      <div style={{padding:'12px 16px',background:'rgba(122,158,126,0.06)',border:'1px solid rgba(122,158,126,0.18)',borderRadius:12,marginBottom:18,display:'flex',gap:10,alignItems:'center'}}>
        <span>🆓</span><div style={{fontSize:12,color:'#5C4A33'}}><strong style={{color:'#7A9E7E'}}>800+ free channels</strong> from Pluto TV, Plex Live, Samsung TV Plus — legal and free. Import in Settings.</div>
      </div>
      <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:6,marginBottom:20}}>
        {groups.map((g:string)=><button key={g} onClick={()=>setActiveGroup(g)} style={{padding:'7px 14px',background:activeGroup===g?'linear-gradient(135deg,#C4846A,#C9974A)':'#F5F0E8',border:`1px solid ${activeGroup===g?'transparent':'rgba(28,18,8,0.08)'}`,borderRadius:20,color:activeGroup===g?'#fff':'#5C4A33',cursor:'pointer',fontSize:12,fontWeight:activeGroup===g?700:400,whiteSpace:'nowrap',flexShrink:0}}>{g}</button>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(158px,1fr))',gap:12}}>
        {filtered.map((ch:Channel)=>(
          <div key={ch.id} style={{position:'relative'}}>
            <button onClick={()=>onPlay(ch)} style={{width:'100%',padding:'14px 12px',background:nowPlaying?.id===ch.id?'rgba(196,132,106,0.1)':'#F5F0E8',border:nowPlaying?.id===ch.id?'2px solid #C4846A':'1px solid rgba(28,18,8,0.08)',borderRadius:13,cursor:'pointer',textAlign:'left'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:7}}><span style={{fontSize:9,color:'#9C8870',background:'#FAF7F2',padding:'2px 6px',borderRadius:4,fontWeight:600}}>{ch.group}</span>{ch.isHD&&<span style={{fontSize:9,color:'#7DB3C9',fontWeight:700}}>HD</span>}</div>
              <div style={{fontSize:13,fontWeight:800,color:'#1C1208',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:4,fontFamily:'Georgia,serif'}}>{ch.name}</div>
              {ch.currentShow&&<div style={{fontSize:10,color:'#9C8870',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:5}}>{ch.currentShow}</div>}
              {ch.nextShow&&<div style={{fontSize:9,color:'#9C8870',opacity:0.7}}>Up next: {ch.nextShow}</div>}
              {nowPlaying?.id===ch.id&&<div style={{marginTop:7,fontSize:9,color:'#C4846A',fontWeight:800}}>● NOW PLAYING</div>}
            </button>
            <button onClick={()=>onToggleFav(ch.id)} style={{position:'absolute',top:9,right:9,background:'none',border:'none',fontSize:12,cursor:'pointer',opacity:favorites.has(ch.id)?1:0.25}}>{favorites.has(ch.id)?'❤️':'🤍'}</button>
          </div>
        ))}
      </div>
      {filtered.length===0&&<Empty icon="📡" title="No channels here" desc="Try a different category or import your M3U playlist above" />}
    </div>
  )
}

function SportsView({channels,onPlay,favorites,onToggleFav}:any){
  const leagues=[{name:'NFL Football',kw:['nfl'],icon:'🏈'},{name:'NBA Basketball',kw:['nba','basketball'],icon:'🏀'},{name:'MLB Baseball',kw:['mlb','baseball'],icon:'⚾'},{name:'NHL Hockey',kw:['nhl','hockey'],icon:'🏒'},{name:'Soccer',kw:['soccer','mls','premier','la liga','bein','uefa'],icon:'⚽'},{name:'ESPN Family',kw:['espn'],icon:'📺'},{name:'Sky Sports',kw:['sky sport'],icon:'☁️'},{name:'Golf & Tennis',kw:['golf','tennis'],icon:'⛳'}]
  return(
    <div style={{padding:'24px 24px 100px'}}>
      <h1 style={{fontSize:24,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:4}}>Sports</h1>
      <p style={{fontSize:13,color:'#9C8870',marginBottom:28}}>{channels.length} sports channels · Every major league · Live now</p>
      {leagues.map((l:any)=>{
        const lch=channels.filter((c:Channel)=>l.kw.some((k:string)=>(c.name+c.group).toLowerCase().includes(k)))
        if(!lch.length)return null
        return(
          <div key={l.name} style={{marginBottom:28}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:13}}><span style={{fontSize:20}}>{l.icon}</span><h2 style={{fontSize:14,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif'}}>{l.name}</h2></div>
            <div style={{display:'flex',gap:12,overflowX:'auto',paddingBottom:6}}>{lch.map((ch:Channel)=><CPill key={ch.id} channel={ch} onPlay={onPlay} isFav={favorites.has(ch.id)} onToggleFav={onToggleFav} />)}</div>
          </div>
        )
      })}
      {!channels.length&&<Empty icon="🏆" title="Import sports channels" desc="Paste your M3U playlist in Live TV to unlock every league" />}
    </div>
  )
}

function MoviesView({movies,config,favorites,downloads,watchLater,onPlay,onToggleFav,onToggleDownload,onToggleWatchLater,onNav}:any){
  const [filter,setFilter]=useState('All')
  const genres=['All','Romance','Comedy','Drama','Mystery','Action','History','Musical']
  const filtered=movies.filter((m:MediaCard)=>filter==='All'||m.genre?.includes(filter))
  return(
    <div style={{padding:'24px 24px 100px'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div><h1 style={{fontSize:24,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:4}}>Movies</h1><p style={{fontSize:13,color:'#9C8870'}}>{favorites.size} favorites · {downloads.size} downloaded</p></div>
        {!config.hasJellyfin&&!config.hasPlex&&<button onClick={()=>onNav('settings')} style={{padding:'9px 16px',background:'linear-gradient(135deg,#C4846A,#C9974A)',border:'none',borderRadius:10,color:'#fff',cursor:'pointer',fontSize:12,fontWeight:700}}>Connect Your Library →</button>}
      </div>
      <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:6,marginBottom:20}}>
        {genres.map(g=><button key={g} onClick={()=>setFilter(g)} style={{padding:'7px 14px',background:filter===g?'linear-gradient(135deg,#C4846A,#C9974A)':'#F5F0E8',border:`1px solid ${filter===g?'transparent':'rgba(28,18,8,0.08)'}`,borderRadius:20,color:filter===g?'#fff':'#5C4A33',cursor:'pointer',fontSize:12,fontWeight:filter===g?700:400,whiteSpace:'nowrap',flexShrink:0}}>{g}</button>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(158px,1fr))',gap:16}}>
        {filtered.map((m:MediaCard)=>(
          <div key={m.id}>
            <MCard movie={m} onPlay={()=>onPlay(m)} isFav={favorites.has(m.id)} onToggleFav={onToggleFav} />
            <div style={{display:'flex',gap:6,marginTop:6}}>
              <button onClick={()=>onToggleWatchLater(m.id)} style={{flex:1,padding:'6px',background:watchLater.has(m.id)?'rgba(196,132,106,0.1)':'#F5F0E8',border:`1px solid ${watchLater.has(m.id)?'#C4846A':'rgba(28,18,8,0.08)'}`,borderRadius:8,cursor:'pointer',fontSize:10,color:watchLater.has(m.id)?'#C4846A':'#9C8870',fontWeight:600}}>🕐 Later</button>
              <button onClick={()=>onToggleDownload(m.id,m.title)} style={{flex:1,padding:'6px',background:downloads.has(m.id)?'rgba(122,158,126,0.1)':'#F5F0E8',border:`1px solid ${downloads.has(m.id)?'#7A9E7E':'rgba(28,18,8,0.08)'}`,borderRadius:8,cursor:'pointer',fontSize:10,color:downloads.has(m.id)?'#7A9E7E':'#9C8870',fontWeight:600}}>⬇️ Save</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TVShowsView({config,onNav}:any){
  const shows=[{e:'💄',t:'The Real Housewives of Beverly Hills',g:'Reality',ep:'S14 E8 · 45 min',pct:72},{e:'👑',t:'The Crown',g:'Drama',ep:'S6 E4 · 58 min',pct:45},{e:'🌹',t:'Bridgerton',g:'Romance/Drama',ep:'S3 E5 · 52 min',pct:60},{e:'🔪',t:'Only Murders in the Building',g:'Mystery/Comedy',ep:'S4 E2 · 43 min',pct:30},{e:'🏥',t:"Grey's Anatomy",g:'Medical Drama',ep:'S20 E10 · 42 min',pct:88},{e:'👗',t:'Emily in Paris',g:'Comedy/Drama',ep:'S4 E6 · 30 min',pct:55},{e:'🧟',t:'The Last of Us',g:'Drama/Thriller',ep:'S2 E3 · 56 min',pct:20},{e:'🕵️',t:'The Diplomat',g:'Drama/Thriller',ep:'S2 E1 · 48 min',pct:10}]
  return(
    <div style={{padding:'24px 24px 100px'}}>
      <h1 style={{fontSize:24,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:4}}>TV Shows</h1>
      <p style={{fontSize:13,color:'#9C8870',marginBottom:22}}>{config.hasJellyfin||config.hasPlex?'From your server':'Popular picks'}</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:13}}>
        {shows.map((s:any,i:number)=>(
          <button key={i} style={{display:'flex',gap:13,padding:'15px',background:'#F5F0E8',border:'1px solid rgba(28,18,8,0.08)',borderRadius:13,cursor:'pointer',textAlign:'left'}}>
            <div style={{width:56,height:74,borderRadius:9,background:'linear-gradient(135deg,#F5D5C8,#FAF7F2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0}}>{s.e}</div>
            <div style={{minWidth:0,flex:1}}>
              <div style={{fontSize:13,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',lineHeight:1.3,marginBottom:5}}>{s.t}</div>
              <div style={{fontSize:11,color:'#C4846A',fontWeight:700,marginBottom:4}}>{s.g}</div>
              <div style={{fontSize:10,color:'#9C8870',marginBottom:8}}>{s.ep}</div>
              <div style={{height:3,background:'rgba(28,18,8,0.08)',borderRadius:2,overflow:'hidden'}}><div style={{width:`${s.pct}%`,height:'100%',background:'linear-gradient(90deg,#C4846A,#C9974A)',borderRadius:2}} /></div>
              <div style={{fontSize:9,color:'#9C8870',marginTop:3}}>{s.pct}% watched</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function MusicView({config,onNav}:any){
  const moods=[{e:'☀️',n:'Morning Energy',d:'Start your day right',c:'#F59E0B'},{e:'🌿',n:'Focus Flow',d:'Deep work mode',c:'#7A9E7E'},{e:'💃',n:'Feel Good Dance',d:'Move your body',c:'#EC4899'},{e:'🌙',n:'Evening Wind-Down',d:'Gentle & peaceful',c:'#9B89B4'},{e:'💕',n:'Love Songs',d:'Romance & warmth',c:'#C4846A'},{e:'💪',n:'Workout Power',d:'Push through it',c:'#EF4444'},{e:'🧘',n:'Meditation',d:'Find your center',c:'#7DB3C9'},{e:'🎉',n:'Party Mix',d:'Turn it up',c:'#F7B731'}]
  return(
    <div style={{padding:'24px 24px 100px'}}>
      <h1 style={{fontSize:24,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:4}}>Music</h1>
      <p style={{fontSize:13,color:'#9C8870',marginBottom:22}}>Mood-based stations · Your library · Live radio</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:12,marginBottom:30}}>
        {moods.map((m:any)=>(
          <button key={m.n} style={{padding:'17px',background:`${m.c}10`,border:`1px solid ${m.c}22`,borderRadius:13,cursor:'pointer',textAlign:'left'}}>
            <div style={{fontSize:28,marginBottom:9}}>{m.e}</div>
            <div style={{fontSize:13,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:4}}>{m.n}</div>
            <div style={{fontSize:11,color:'#9C8870'}}>{m.d}</div>
          </button>
        ))}
      </div>
      {!config.hasJellyfin&&!config.hasPlex&&<div style={{padding:'18px',background:'#F5F0E8',border:'1px solid rgba(197,152,100,0.2)',borderRadius:13,display:'flex',gap:13,alignItems:'center'}}>
        <span style={{fontSize:28}}>🎵</span>
        <div><div style={{fontSize:13,fontWeight:700,color:'#1C1208',marginBottom:5}}>Connect your music library</div><div style={{fontSize:12,color:'#9C8870',marginBottom:9}}>Jellyfin and Plex both support music with album art and smart radio.</div><button onClick={()=>onNav('settings')} style={{padding:'7px 14px',background:'linear-gradient(135deg,#C4846A,#C9974A)',border:'none',borderRadius:8,color:'#fff',cursor:'pointer',fontSize:12,fontWeight:700}}>Connect in Settings →</button></div>
      </div>}
    </div>
  )
}

function WellnessView({content,favorites,onToggleFav,onPlay}:any){
  const [active,setActive]=useState('All')
  const categories=Array.from(new Set(content.flatMap((c:MediaCard)=>c.genre||[]))) as string[]
  const filtered=content.filter((c:MediaCard)=>active==='All'||c.genre?.includes(active))
  return(
    <div style={{padding:'24px 24px 100px'}}>
      <div style={{background:'linear-gradient(135deg,rgba(122,158,126,0.1),rgba(125,179,201,0.06))',border:'1px solid rgba(122,158,126,0.18)',borderRadius:18,padding:'26px 22px',marginBottom:26,textAlign:'center'}}>
        <div style={{fontSize:38,marginBottom:11}}>🌿</div>
        <h1 style={{fontSize:26,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:7}}>Your Wellness Space</h1>
        <p style={{fontSize:14,color:'#5C4A33',maxWidth:400,margin:'0 auto',lineHeight:1.8}}>Meditate, breathe, move, sleep better. Everything here is free, beautiful, and made for you.</p>
      </div>
      <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:6,marginBottom:20}}>
        {['All',...categories].map(c=><button key={c} onClick={()=>setActive(c)} style={{padding:'7px 14px',background:active===c?'linear-gradient(135deg,#7A9E7E,#B8D4BB)':'#F5F0E8',border:`1px solid ${active===c?'transparent':'rgba(28,18,8,0.08)'}`,borderRadius:20,color:active===c?'#fff':'#5C4A33',cursor:'pointer',fontSize:12,fontWeight:active===c?700:400,whiteSpace:'nowrap',flexShrink:0}}>{c}</button>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:13}}>
        {filtered.map((item:MediaCard)=>(
          <div key={item.id} style={{position:'relative'}}>
            <button onClick={()=>onPlay(item)} style={{width:'100%',padding:'19px',background:'rgba(122,158,126,0.07)',border:'1px solid rgba(122,158,126,0.16)',borderRadius:15,cursor:'pointer',textAlign:'left'}}>
              <div style={{fontSize:34,marginBottom:11}}>{item.poster}</div>
              <div style={{fontSize:14,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:5,lineHeight:1.3}}>{item.title}</div>
              <div style={{fontSize:11,color:'#7A9E7E',fontWeight:700,marginBottom:5}}>{item.genre?.join(' · ')} · {item.duration}</div>
              <div style={{fontSize:12,color:'#9C8870',lineHeight:1.6}}>{item.overview?.slice(0,80)}...</div>
              {item.rating&&<div style={{marginTop:9,fontSize:11,color:'#C9974A',fontWeight:700}}>★ {item.rating} / 5.0</div>}
            </button>
            <button onClick={()=>onToggleFav(item.id)} style={{position:'absolute',top:11,right:11,background:'none',border:'none',fontSize:15,cursor:'pointer',opacity:favorites.has(item.id)?1:0.28}}>{favorites.has(item.id)?'❤️':'🤍'}</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function KidsView({channels,onPlay}:any){
  return(
    <div style={{padding:'24px 24px 100px',background:'linear-gradient(180deg,rgba(125,179,201,0.05),transparent)'}}>
      <div style={{textAlign:'center',marginBottom:26}}><div style={{fontSize:46,marginBottom:9}}>🧸</div><h1 style={{fontSize:26,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:5}}>Kids Zone</h1><p style={{fontSize:13,color:'#9C8870'}}>Safe, curated, and always age-appropriate. Parental controls in Profiles.</p></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(195px,1fr))',gap:13}}>
        {channels.map((ch:Channel)=>(
          <button key={ch.id} onClick={()=>onPlay(ch)} style={{padding:'19px 15px',background:'rgba(125,179,201,0.12)',border:'2px solid rgba(125,179,201,0.22)',borderRadius:15,cursor:'pointer',textAlign:'center'}}>
            <div style={{fontSize:34,marginBottom:9}}>{ch.name.includes('Disney')?'🏰':ch.name.includes('Nick')?'🟠':ch.name.includes('PBS')?'🎓':'📺'}</div>
            <div style={{fontSize:15,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:4}}>{ch.name}</div>
            {ch.currentShow&&<div style={{fontSize:12,color:'#7DB3C9',fontWeight:600}}>{ch.currentShow}</div>}
            <div style={{marginTop:9,fontSize:9,color:'#7DB3C9',fontWeight:800,letterSpacing:'0.06em'}}>● LIVE NOW</div>
          </button>
        ))}
      </div>
      {!channels.length&&<Empty icon="🧸" title="Kids channels coming soon" desc="Import your IPTV playlist to see all kids channels here" />}
    </div>
  )
}

function LibraryView({config,favorites,watchLater,movies,onPlay,onNav}:any){
  const favMovies=movies.filter((m:MediaCard)=>favorites.has(m.id))
  const wlMovies=movies.filter((m:MediaCard)=>watchLater.has(m.id))
  return(
    <div style={{padding:'24px 24px 100px'}}>
      <h1 style={{fontSize:24,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:22}}>My Library</h1>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(195px,1fr))',gap:13,marginBottom:30}}>
        {[{icon:'❤️',t:'Favorites',n:favorites.size,c:'#C4846A',desc:'Movies, channels & wellness'},{icon:'🕐',t:'Watch Later',n:watchLater.size,c:'#C9974A',desc:'Saved for later'},{icon:'⬇️',t:'Downloads',n:0,c:'#7A9E7E',desc:'Available offline'},{icon:'📊',t:'Continue Watching',n:0,c:'#9B89B4',desc:'Pick up where you left off'},{icon:'🎬',t:'My Movies',n:config.hasJellyfin||config.hasPlex?'Server':'–',c:'#7DB3C9',desc:'From your media server'},{icon:'📡',t:'My Shows',n:config.hasJellyfin||config.hasPlex?'Server':'–',c:'#8B5E3C',desc:'Continue your series'}].map(x=>(
          <div key={x.t} style={{padding:'18px',background:'#F5F0E8',border:`1px solid ${x.c}22`,borderRadius:13}}>
            <div style={{fontSize:26,marginBottom:9}}>{x.icon}</div>
            <div style={{fontSize:13,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:3}}>{x.t}</div>
            <div style={{fontSize:18,fontWeight:800,color:x.c,marginBottom:3}}>{x.n}</div>
            <div style={{fontSize:10,color:'#9C8870'}}>{x.desc}</div>
          </div>
        ))}
      </div>
      {favMovies.length>0&&<><h2 style={{fontSize:14,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:13}}>❤️ Your Favorites</h2><div style={{display:'flex',gap:13,overflowX:'auto',paddingBottom:8,marginBottom:26}}>{favMovies.map((m:MediaCard)=><MCard key={m.id} movie={m} onPlay={()=>onPlay(m)} isFav={true} onToggleFav={()=>{}} compact />)}</div></>}
      {wlMovies.length>0&&<><h2 style={{fontSize:14,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:13}}>🕐 Watch Later</h2><div style={{display:'flex',gap:13,overflowX:'auto',paddingBottom:8}}>{wlMovies.map((m:MediaCard)=><MCard key={m.id} movie={m} onPlay={()=>onPlay(m)} isFav={false} onToggleFav={()=>{}} compact />)}</div></>}
      {!config.hasJellyfin&&!config.hasPlex&&<div style={{padding:'18px',background:'#F5F0E8',border:'1px solid rgba(197,152,100,0.2)',borderRadius:13,display:'flex',gap:13,alignItems:'center'}}><span style={{fontSize:28}}>📚</span><div><div style={{fontSize:13,fontWeight:700,color:'#1C1208',marginBottom:5}}>Connect your media server</div><button onClick={()=>onNav('settings')} style={{padding:'7px 14px',background:'linear-gradient(135deg,#C4846A,#C9974A)',border:'none',borderRadius:8,color:'#fff',cursor:'pointer',fontSize:12,fontWeight:700}}>Connect Jellyfin or Plex →</button></div></div>}
    </div>
  )
}

function DownloadsView({downloads,movies,onPlay,onRemove}:any){
  const downloaded=movies.filter((m:MediaCard)=>downloads.has(m.id))
  return(
    <div style={{padding:'24px 24px 100px'}}>
      <h1 style={{fontSize:24,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:4}}>Downloads</h1>
      <p style={{fontSize:13,color:'#9C8870',marginBottom:22}}>{downloads.size} items saved for offline</p>
      {!downloaded.length?<Empty icon="⬇️" title="Nothing downloaded yet" desc="Go to Movies and tap Save to download for offline viewing" />:
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(195px,1fr))',gap:15}}>
        {downloaded.map((m:MediaCard)=>(
          <div key={m.id}><MCard movie={m} onPlay={()=>onPlay(m)} isFav={false} onToggleFav={()=>{}} /><button onClick={()=>onRemove(m.id)} style={{width:'100%',marginTop:6,padding:'7px',background:'rgba(239,68,68,0.05)',border:'1px solid rgba(239,68,68,0.14)',borderRadius:8,color:'#EF4444',cursor:'pointer',fontSize:11,fontWeight:600}}>✕ Remove</button></div>
        ))}
      </div>}
    </div>
  )
}

function StorageView({config,onUpdate}:any){
  const providers=CLOUD.map(p=>({...p,connected:config.cloudProviders.includes(p.id)}))
  const totalConn=providers.filter(p=>p.connected).length
  return(
    <div style={{padding:'24px 24px 100px'}}>
      <h1 style={{fontSize:24,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:4}}>Storage Optimizer</h1>
      <p style={{fontSize:13,color:'#9C8870',marginBottom:22}}>Automatically routes files to the cheapest service. Save $200–400/year.</p>
      <div style={{background:'linear-gradient(135deg,rgba(122,158,126,0.08),rgba(201,151,74,0.06))',border:'1px solid rgba(122,158,126,0.18)',borderRadius:15,padding:'18px 20px',marginBottom:22}}>
        <h2 style={{fontSize:14,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:13}}>💡 Smart Routing Strategy</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(195px,1fr))',gap:11}}>
          {[{label:'Photos → Amazon',saving:'~$120/yr',desc:'Unlimited FREE vs paying per GB'},{label:'Docs → OneDrive',saving:'~$60/yr',desc:'Included with Microsoft 365'},{label:'Video → Backblaze',saving:'~$200/yr',desc:'$6/TB vs $25/TB elsewhere'}].map(s=>(
            <div key={s.label} style={{padding:'11px 13px',background:'rgba(250,247,242,0.8)',borderRadius:9,border:'1px solid rgba(28,18,8,0.08)'}}><div style={{fontSize:12,fontWeight:700,color:'#1C1208',marginBottom:3}}>{s.label}</div><div style={{fontSize:15,fontWeight:800,color:'#7A9E7E',marginBottom:2}}>{s.saving}</div><div style={{fontSize:10,color:'#9C8870'}}>{s.desc}</div></div>
          ))}
        </div>
        {totalConn>0&&<div style={{marginTop:14,padding:'9px 13px',background:'rgba(122,158,126,0.1)',borderRadius:8,fontSize:13,fontWeight:700,color:'#7A9E7E'}}>🎉 Est. savings with {totalConn} provider{totalConn!==1?'s':''}: ~${totalConn*80}/yr</div>}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(255px,1fr))',gap:13}}>
        {providers.map(p=>(
          <div key={p.id} style={{padding:'17px 19px',background:'#F5F0E8',border:`1px solid ${p.connected?'rgba(197,152,100,0.2)':'rgba(28,18,8,0.08)'}`,borderRadius:13}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:9}}><div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:18}}>{p.icon}</span><span style={{fontSize:13,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif'}}>{p.name}</span></div><div style={{width:8,height:8,borderRadius:'50%',background:p.connected?'#7A9E7E':'#D1C7BB'}} /></div>
            <div style={{fontSize:11,color:'#9C8870',marginBottom:13,lineHeight:1.5}}>{p.note}</div>
            <button onClick={()=>onUpdate({cloudProviders:p.connected?config.cloudProviders.filter((x:string)=>x!==p.id):[...config.cloudProviders,p.id]})} style={{width:'100%',padding:'9px',background:p.connected?'rgba(239,68,68,0.05)':'linear-gradient(135deg,#C4846A,#C9974A)',border:p.connected?'1px solid rgba(239,68,68,0.14)':'none',borderRadius:9,color:p.connected?'#EF4444':'#fff',cursor:'pointer',fontSize:12,fontWeight:700}}>{p.connected?'Disconnect':'Connect Free →'}</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProfilesView({config,onUpdate}:any){
  const [adding,setAdding]=useState(false)
  const [newName,setNewName]=useState('')
  const [newAvatar,setNewAvatar]=useState('🧒')
  const [newColor,setNewColor]=useState('#7DB3C9')
  const [newIsKids,setNewIsKids]=useState(false)
  const allProfiles=[{id:'main',name:config.name||'Main Profile',avatar:config.avatar||'👩',color:'#C4846A',isKids:false},...(config.profiles||[])]
  const addProfile=()=>{if(!newName.trim())return;const p:Profile={id:Date.now().toString(),name:newName.trim(),avatar:newAvatar,color:newColor,isKids:newIsKids,pin:'',watchHistory:[]};onUpdate({profiles:[...(config.profiles||[]),p]});setAdding(false);setNewName('');setNewIsKids(false)}
  return(
    <div style={{padding:'24px 24px 100px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22}}>
        <div><h1 style={{fontSize:24,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:3}}>Profiles</h1><p style={{fontSize:13,color:'#9C8870'}}>Everyone in your family gets their own space</p></div>
        <button onClick={()=>setAdding(true)} style={{padding:'10px 18px',background:'linear-gradient(135deg,#C4846A,#C9974A)',border:'none',borderRadius:11,color:'#fff',cursor:'pointer',fontSize:13,fontWeight:700}}>+ Add Profile</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(215px,1fr))',gap:13,marginBottom:22}}>
        {allProfiles.map((p:any)=>(
          <div key={p.id} style={{padding:'22px',background:'#F5F0E8',border:`2px solid ${config.activeProfileId===p.id?'#C4846A':'rgba(28,18,8,0.08)'}`,borderRadius:15,textAlign:'center'}}>
            <div style={{width:60,height:60,borderRadius:'50%',background:p.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,margin:'0 auto 11px'}}>{p.avatar}</div>
            <div style={{fontSize:15,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:3}}>{p.name}</div>
            {p.isKids&&<div style={{fontSize:11,color:'#7DB3C9',fontWeight:700,background:'rgba(125,179,201,0.1)',padding:'2px 8px',borderRadius:20,display:'inline-block',marginBottom:7}}>Kids Profile</div>}
            {config.activeProfileId===p.id?<div style={{fontSize:11,color:'#C4846A',fontWeight:700}}>● Active</div>:<button onClick={()=>onUpdate({activeProfileId:p.id})} style={{padding:'7px 18px',background:'#FAF7F2',border:'1px solid rgba(28,18,8,0.08)',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:600,color:'#5C4A33'}}>Switch to this</button>}
          </div>
        ))}
      </div>
      {adding&&<div style={{padding:'26px',background:'#F5F0E8',border:'1px solid rgba(197,152,100,0.2)',borderRadius:15,maxWidth:440}}>
        <h2 style={{fontSize:17,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:18}}>New Profile</h2>
        <div style={{marginBottom:13}}><label style={{fontSize:11,color:'#9C8870',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:5}}>Name</label><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Profile name" style={{width:'100%',padding:'10px 12px',background:'#FAF7F2',border:'1px solid rgba(28,18,8,0.08)',borderRadius:9,color:'#1C1208',fontSize:13,outline:'none'}} /></div>
        <div style={{marginBottom:13}}><label style={{fontSize:11,color:'#9C8870',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:7}}>Avatar</label><div style={{display:'flex',gap:7,flexWrap:'wrap'}}>{AVATARS.map(a=><button key={a} onClick={()=>setNewAvatar(a)} style={{width:34,height:34,borderRadius:'50%',background:newAvatar===a?'#C4846A':'#FAF7F2',border:`2px solid ${newAvatar===a?'#C4846A':'rgba(28,18,8,0.08)'}`,cursor:'pointer',fontSize:17,display:'flex',alignItems:'center',justifyContent:'center'}}>{a}</button>)}</div></div>
        <div style={{marginBottom:13}}><label style={{fontSize:11,color:'#9C8870',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:7}}>Color</label><div style={{display:'flex',gap:7}}>{PROFILE_COLORS.map(c=><button key={c} onClick={()=>setNewColor(c)} style={{width:26,height:26,borderRadius:'50%',background:c,border:newColor===c?'3px solid #1C1208':'2px solid transparent',cursor:'pointer'}} />)}</div></div>
        <label style={{display:'flex',alignItems:'center',gap:9,marginBottom:18,cursor:'pointer'}}><input type="checkbox" checked={newIsKids} onChange={e=>setNewIsKids(e.target.checked)} /><span style={{fontSize:13,color:'#5C4A33'}}>Kids profile (restricted content)</span></label>
        <div style={{display:'flex',gap:9}}><button onClick={()=>setAdding(false)} style={{flex:1,padding:'9px',background:'transparent',border:'1px solid rgba(28,18,8,0.08)',borderRadius:9,cursor:'pointer',color:'#5C4A33',fontSize:13}}>Cancel</button><button onClick={addProfile} disabled={!newName.trim()} style={{flex:2,padding:'9px',background:'linear-gradient(135deg,#C4846A,#C9974A)',border:'none',borderRadius:9,color:'#fff',cursor:'pointer',fontSize:13,fontWeight:700}}>Create Profile</button></div>
      </div>}
      <div style={{marginTop:26,padding:'18px',background:'rgba(125,179,201,0.07)',border:'1px solid rgba(125,179,201,0.18)',borderRadius:13}}>
        <h2 style={{fontSize:13,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:11}}>🔒 Parental Controls</h2>
        <p style={{fontSize:13,color:'#9C8870',lineHeight:1.7,marginBottom:14}}>Set a PIN to lock Kids profiles. Switching from Kids to adult requires the PIN.</p>
        <div style={{display:'flex',gap:9,alignItems:'center'}}><input type="password" maxLength={4} value={config.parentalPin} onChange={e=>onUpdate({parentalPin:e.target.value})} placeholder="4-digit PIN" style={{flex:1,maxWidth:140,padding:'9px 11px',background:'#FAF7F2',border:'1px solid rgba(28,18,8,0.08)',borderRadius:9,color:'#1C1208',fontSize:13,outline:'none',textAlign:'center',letterSpacing:'0.18em'}} /><span style={{fontSize:12,color:'#9C8870'}}>{config.parentalPin?'✅ PIN set':'No PIN set'}</span></div>
      </div>
    </div>
  )
}

function SettingsView({config,onUpdate,onReset,onImportIPTV}:any){
  const [testingJelly,setTestingJelly]=useState(false)
  const [jellyStatus,setJellyStatus]=useState<'untested'|'ok'|'fail'>('untested')
  const testJellyfin=async()=>{setTestingJelly(true);try{const r=await fetch('/api/nas/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'jellyfin',url:config.jellyfinUrl,apiKey:config.jellyfinKey})});const d=await r.json();setJellyStatus(d.success?'ok':'fail')}catch{setJellyStatus('fail')};setTestingJelly(false)}
  return(
    <div style={{padding:'24px 24px 100px',maxWidth:620}}>
      <h1 style={{fontSize:24,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:22}}>Settings</h1>
      <SGroup title="Your Profile"><div style={{display:'flex',gap:11,alignItems:'center',marginBottom:11}}><div style={{width:44,height:44,borderRadius:'50%',background:'#F5D5C8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>{config.avatar}</div><div><div style={{fontSize:13,fontWeight:700,color:'#1C1208'}}>{config.name||'Not set'}</div><div style={{fontSize:11,color:'#9C8870'}}>Main profile</div></div></div><SF label="Your Name" val={config.name} set={(v:string)=>onUpdate({name:v})} ph="Your name" /><SF label="Your City" val={config.city} set={(v:string)=>onUpdate({city:v})} ph="Fort Myers, FL" /></SGroup>
      <SGroup title="Jellyfin Server"><SF label="Server URL" val={config.jellyfinUrl} set={(v:string)=>onUpdate({jellyfinUrl:v})} ph="http://192.168.1.x:8096" /><SF label="API Key" val={config.jellyfinKey} set={(v:string)=>onUpdate({jellyfinKey:v})} ph="From Jellyfin Dashboard → API Keys" type="password" /><div style={{display:'flex',gap:9,alignItems:'center',marginTop:3}}><button onClick={testJellyfin} disabled={!config.jellyfinUrl||testingJelly} style={{padding:'8px 14px',background:'#FAF7F2',border:'1px solid rgba(28,18,8,0.08)',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:600,color:'#5C4A33'}}>{testingJelly?'Testing...':'Test Connection'}</button>{jellyStatus==='ok'&&<span style={{fontSize:12,color:'#7A9E7E',fontWeight:700}}>✅ Connected!</span>}{jellyStatus==='fail'&&<span style={{fontSize:12,color:'#EF4444',fontWeight:700}}>❌ Check URL & key</span>}</div></SGroup>
      <SGroup title="Plex Server"><SF label="Server URL" val={config.plexUrl} set={(v:string)=>onUpdate({plexUrl:v})} ph="http://192.168.1.x:32400" /><SF label="Plex Token" val={config.plexToken} set={(v:string)=>onUpdate({plexToken:v})} ph="From plex.tv account page" type="password" /><div style={{fontSize:11,color:'#9C8870'}}>Find at: plex.tv → Settings → Account → Plex Media Server</div></SGroup>
      <SGroup title="IPTV / Live TV"><SF label="M3U Playlist URL" val={config.iptvUrl} set={(v:string)=>onUpdate({iptvUrl:v})} ph="https://yourprovider.com/playlist.m3u" />{config.iptvUrl&&<button onClick={()=>onImportIPTV(config.iptvUrl)} style={{padding:'8px 14px',background:'linear-gradient(135deg,#C4846A,#C9974A)',border:'none',borderRadius:8,color:'#fff',cursor:'pointer',fontSize:12,fontWeight:700}}>Import Now</button>}<div style={{padding:'11px 13px',background:'rgba(122,158,126,0.06)',border:'1px solid rgba(122,158,126,0.14)',borderRadius:9,marginTop:3}}><div style={{fontSize:12,fontWeight:700,color:'#7A9E7E',marginBottom:5}}>✅ Free Legal Channels</div>{[{name:'Pluto TV',url:'https://i.mjh.nz/PlutoTV/us.m3u8'},{name:'Plex Live',url:'https://i.mjh.nz/Plex/us.m3u8'},{name:'Samsung TV Plus',url:'https://i.mjh.nz/SamsungTVPlus/us.m3u8'}].map(s=><div key={s.name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5}}><span style={{fontSize:12,color:'#5C4A33'}}>{s.name}</span><button onClick={()=>onImportIPTV(s.url)} style={{padding:'3px 9px',background:'#FAF7F2',border:'1px solid rgba(28,18,8,0.08)',borderRadius:6,cursor:'pointer',fontSize:10,fontWeight:700,color:'#C4846A'}}>Import</button></div>)}</div></SGroup>
      <SGroup title="Streaming Services"><p style={{fontSize:12,color:'#9C8870',marginBottom:11,lineHeight:1.6}}>Tell Javari which services you subscribe to.</p><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7}}>{STREAMING.map(s=>{const on=config.streamingServices.includes(s.id);return <button key={s.id} onClick={()=>onUpdate({streamingServices:on?config.streamingServices.filter((x:string)=>x!==s.id):[...config.streamingServices,s.id]})} style={{padding:'8px 6px',background:on?`${s.color}12`:'transparent',border:`1px solid ${on?s.color+'38':'rgba(28,18,8,0.08)'}`,borderRadius:8,cursor:'pointer',fontSize:11,fontWeight:on?700:400,color:on?'#1C1208':'#9C8870'}}>{s.emoji} {s.name}</button>})}</div></SGroup>
      <div style={{paddingTop:22,borderTop:'1px solid rgba(28,18,8,0.08)'}}><button onClick={()=>{if(window.confirm('Reset all settings?'))onReset()}} style={{padding:'9px 18px',background:'rgba(239,68,68,0.05)',border:'1px solid rgba(239,68,68,0.18)',borderRadius:9,color:'#EF4444',cursor:'pointer',fontSize:12,fontWeight:700}}>Reset Everything</button><div style={{fontSize:11,color:'#9C8870',marginTop:7}}>Clears all settings and returns to setup wizard.</div></div>
    </div>
  )
}

function SGroup({title,children}:{title:string,children:React.ReactNode}){return <div style={{marginBottom:22}}><h2 style={{fontSize:11,fontWeight:800,color:'#C4846A',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:11}}>{title}</h2><div style={{background:'#F5F0E8',border:'1px solid rgba(28,18,8,0.08)',borderRadius:13,padding:'15px 17px',display:'flex',flexDirection:'column',gap:9}}>{children}</div></div>}
function SF({label,val,set,ph,type='text'}:{label:string,val:string,set:(v:string)=>void,ph?:string,type?:string}){return <div><label style={{fontSize:11,color:'#9C8870',fontWeight:600,display:'block',marginBottom:4}}>{label}</label><input type={type} value={val} onChange={e=>set(e.target.value)} placeholder={ph} style={{width:'100%',padding:'10px 11px',background:'#FAF7F2',border:'1px solid rgba(28,18,8,0.08)',borderRadius:9,color:'#1C1208',fontSize:13,outline:'none'}} /></div>}
function Empty({icon,title,desc}:{icon:string,title:string,desc:string}){return <div style={{textAlign:'center',padding:'56px 20px'}}><div style={{fontSize:50,marginBottom:13}}>{icon}</div><div style={{fontSize:17,fontWeight:800,color:'#1C1208',fontFamily:'Georgia,serif',marginBottom:7}}>{title}</div><div style={{fontSize:13,color:'#9C8870',maxWidth:290,margin:'0 auto',lineHeight:1.7}}>{desc}</div></div>}

function SetupWizard({step,config,onUpdate,onStep,onComplete}:{step:SetupStep,config:UserConfig,onUpdate:(u:Partial<UserConfig>)=>void,onStep:(s:SetupStep)=>void,onComplete:()=>void}){
  const steps:SetupStep[]=['splash','welcome','profile','location','servers','streaming','iptv','cloud','done']
  const idx=steps.indexOf(step);const pct=Math.round((idx/(steps.length-1))*100)
  const [iptvNotice,setIptvNotice]=useState(false)
  return(
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#FAF7F2 0%,#F5EDE0 50%,#FAF0E8 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:-100,right:-100,width:380,height:380,borderRadius:'50%',background:'linear-gradient(135deg,rgba(196,132,106,0.09),rgba(201,151,74,0.05))',pointerEvents:'none'}} />
      <div style={{position:'absolute',bottom:-70,left:-70,width:280,height:280,borderRadius:'50%',background:'linear-gradient(135deg,rgba(122,158,126,0.07),rgba(125,179,201,0.05))',pointerEvents:'none'}} />
      <div style={{width:'100%',maxWidth:540,position:'relative'}}>
        {step!=='splash'&&step!=='done'&&<div style={{marginBottom:26}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:7}}><span style={{fontSize:11,color:'#9C8870',fontWeight:600}}>Setting up your platform</span><span style={{fontSize:11,color:'#C4846A',fontWeight:700}}>{pct}%</span></div><div style={{height:3,background:'rgba(28,18,8,0.08)',borderRadius:2,overflow:'hidden'}}><div style={{width:`${pct}%`,height:'100%',background:'linear-gradient(90deg,#C4846A,#C9974A)',borderRadius:2,transition:'width 0.4s ease'}} /></div></div>}
        <div style={{background:'rgba(255,255,255,0.86)',backdropFilter:'blur(20px)',border:'1px solid rgba(196,132,106,0.14)',borderRadius:22,padding:38,boxShadow:'0 20px 60px rgba(28,18,8,0.07)',color:'#1C1208',animation:'setup-in 0.3s ease'}}>

          {step==='splash'&&<div style={{textAlign:'center',paddingTop:8}}>
            <div style={{fontSize:60,marginBottom:18,display:'block'}}>✦</div>
            <h1 style={{fontSize:34,fontWeight:900,fontFamily:'Georgia,serif',marginBottom:9,background:'linear-gradient(135deg,#C4846A,#C9974A)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',lineHeight:1.2}}>Javari</h1>
            <div style={{fontSize:13,color:'#9C8870',letterSpacing:'0.18em',fontWeight:600,textTransform:'uppercase',marginBottom:26}}>Omni-Media</div>
            <p style={{fontSize:15,color:'#5C4A33',lineHeight:1.8,marginBottom:9,fontFamily:'Georgia,serif',fontStyle:'italic'}}>Your complete media universe.</p>
            <p style={{fontSize:13,color:'#9C8870',lineHeight:1.75,marginBottom:30,maxWidth:350,margin:'0 auto 30px'}}>Live TV · Movies · Wellness · Sports · Kids · Music — everything you love, beautifully unified. Built especially for you.</p>
            <button onClick={()=>onStep('welcome')} style={{padding:'15px 46px',background:'linear-gradient(135deg,#C4846A,#C9974A)',border:'none',borderRadius:15,color:'#fff',fontSize:15,fontWeight:800,cursor:'pointer',boxShadow:'0 8px 24px rgba(196,132,106,0.32)',letterSpacing:'0.02em'}}>Begin My Setup →</button>
            <div style={{marginTop:14,fontSize:11,color:'#9C8870'}}>Takes about 3 minutes · No credit card needed</div>
          </div>}

          {step==='welcome'&&<div>
            <div style={{fontSize:34,marginBottom:14}}>👋</div>
            <h2 style={{fontSize:24,fontWeight:800,fontFamily:'Georgia,serif',marginBottom:7}}>Welcome to Javari</h2>
            <p style={{fontSize:13,color:'#5C4A33',lineHeight:1.8,marginBottom:26}}>The most beautiful, complete media platform ever built. We connect to everything you already have — your NAS, streaming services, IPTV, cloud storage — one stunning experience designed for women and families.</p>
            <div style={{display:'flex',flexDirection:'column',gap:9,marginBottom:26}}>
              {[['📺','Live TV + IPTV','40+ channels pre-loaded. Import any M3U playlist.'],['🌿','Wellness','Meditation, yoga, sleep sounds, breathwork — free.'],['🎬','Movies & TV','Connect Jellyfin or Plex for your full library.'],['🧸','Kids Zone','Safe, curated, age-appropriate content.'],['☁️','Storage Optimizer','Save $200–400/year on cloud storage.'],['✦','Javari AI','Your personal media assistant, always here.']].map(([icon,t,d])=>(
                <div key={t} style={{display:'flex',gap:11,alignItems:'center',padding:'9px 13px',background:'#F5F0E8',borderRadius:9}}>
                  <span style={{fontSize:18,flexShrink:0}}>{icon}</span><div><div style={{fontSize:12,fontWeight:700,color:'#1C1208'}}>{t}</div><div style={{fontSize:11,color:'#9C8870'}}>{d}</div></div>
                </div>
              ))}
            </div>
            <SBtn onClick={()=>onStep('profile')}>Let&apos;s Start →</SBtn>
          </div>}

          {step==='profile'&&<div>
            <div style={{fontSize:34,marginBottom:14}}>👤</div>
            <h2 style={{fontSize:22,fontWeight:800,fontFamily:'Georgia,serif',marginBottom:7}}>Your Profile</h2>
            <p style={{fontSize:13,color:'#9C8870',marginBottom:20,lineHeight:1.7}}>Personalize your experience. This is just for you.</p>
            <div style={{marginBottom:13}}><label style={{fontSize:11,color:'#9C8870',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:5}}>Your Name</label><input value={config.name} onChange={e=>onUpdate({name:e.target.value})} placeholder="What should Javari call you?" style={{width:'100%',padding:'11px 13px',background:'#F5F0E8',border:'1px solid rgba(28,18,8,0.08)',borderRadius:11,color:'#1C1208',fontSize:13,outline:'none'}} /></div>
            <div style={{marginBottom:20}}><label style={{fontSize:11,color:'#9C8870',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:9}}>Choose an Avatar</label><div style={{display:'flex',flexWrap:'wrap',gap:7}}>{AVATARS.map(a=><button key={a} onClick={()=>onUpdate({avatar:a})} style={{width:38,height:38,borderRadius:'50%',background:config.avatar===a?'#C4846A':'#F5F0E8',border:`2px solid ${config.avatar===a?'#C4846A':'rgba(28,18,8,0.08)'}`,cursor:'pointer',fontSize:19,display:'flex',alignItems:'center',justifyContent:'center'}}>{a}</button>)}</div></div>
            <div style={{display:'flex',gap:9,justifyContent:'flex-end'}}><SkipBtn onClick={()=>onStep('location')}>Skip</SkipBtn><SBtn onClick={()=>onStep('location')} disabled={!config.name.trim()}>Continue →</SBtn></div>
          </div>}

          {step==='location'&&<div>
            <div style={{fontSize:34,marginBottom:14}}>📍</div>
            <h2 style={{fontSize:22,fontWeight:800,fontFamily:'Georgia,serif',marginBottom:7}}>Your Location</h2>
            <p style={{fontSize:13,color:'#9C8870',marginBottom:9,lineHeight:1.7}}>Helps us find your local ABC, NBC, CBS, FOX, and PBS affiliates. Watch hometown news from anywhere.</p>
            <div style={{padding:'9px 13px',background:'rgba(122,158,126,0.06)',border:'1px solid rgba(122,158,126,0.14)',borderRadius:9,marginBottom:16,fontSize:12,color:'#5C4A33'}}>🔒 Only used to identify local channels. Never shared.</div>
            <input value={config.city} onChange={e=>onUpdate({city:e.target.value})} placeholder="City, State — e.g. Fort Myers, FL" style={{width:'100%',padding:'12px 13px',background:'#F5F0E8',border:'1px solid rgba(28,18,8,0.08)',borderRadius:11,color:'#1C1208',fontSize:13,outline:'none',marginBottom:20}} />
            <div style={{display:'flex',gap:9,justifyContent:'flex-end'}}><SkipBtn onClick={()=>onStep('servers')}>Skip</SkipBtn><SBtn onClick={()=>onStep('servers')}>Continue →</SBtn></div>
          </div>}

          {step==='servers'&&<div>
            <div style={{fontSize:34,marginBottom:14}}>🖥️</div>
            <h2 style={{fontSize:22,fontWeight:800,fontFamily:'Georgia,serif',marginBottom:7}}>Media Servers</h2>
            <p style={{fontSize:13,color:'#9C8870',marginBottom:18,lineHeight:1.7}}>Have Jellyfin or Plex? Connect it and we import your entire library automatically.</p>
            {[{k:'hasJellyfin' as const,n:'Jellyfin',badge:'Free & Open Source',uk:'jellyfinUrl' as const,kk:'jellyfinKey' as const,up:'http://192.168.1.x:8096',kp:'API Key from Jellyfin Dashboard'},{k:'hasPlex' as const,n:'Plex',badge:'Most Popular',uk:'plexUrl' as const,kk:'plexToken' as const,up:'http://192.168.1.x:32400',kp:'Plex Token from plex.tv'}].map(s=>(
              <div key={s.n} style={{padding:'14px 16px',background:'#F5F0E8',borderRadius:11,border:'1px solid rgba(28,18,8,0.08)',marginBottom:11}}>
                <label style={{display:'flex',alignItems:'center',gap:9,cursor:'pointer',marginBottom:config[s.k]?13:0}}>
                  <input type="checkbox" checked={config[s.k]} onChange={e=>onUpdate({[s.k]:e.target.checked})} style={{width:15,height:15}} />
                  <span style={{fontWeight:700,fontSize:13,color:'#1C1208'}}>{s.n}</span>
                  <span style={{fontSize:9,color:'#7A9E7E',background:'rgba(122,158,126,0.1)',padding:'2px 7px',borderRadius:20,fontWeight:700}}>{s.badge}</span>
                </label>
                {config[s.k]&&<div style={{display:'flex',flexDirection:'column',gap:6}}><input value={config[s.uk]} onChange={e=>onUpdate({[s.uk]:e.target.value})} placeholder={s.up} style={{padding:'8px 10px',background:'#FAF7F2',border:'1px solid rgba(28,18,8,0.08)',borderRadius:8,color:'#1C1208',fontSize:12,outline:'none'}} /><input value={config[s.kk]} onChange={e=>onUpdate({[s.kk]:e.target.value})} placeholder={s.kp} type="password" style={{padding:'8px 10px',background:'#FAF7F2',border:'1px solid rgba(28,18,8,0.08)',borderRadius:8,color:'#1C1208',fontSize:12,outline:'none'}} /></div>}
              </div>
            ))}
            <div style={{display:'flex',gap:9,justifyContent:'flex-end',marginTop:7}}><SkipBtn onClick={()=>onStep('streaming')}>Skip for now</SkipBtn><SBtn onClick={()=>onStep('streaming')}>Continue →</SBtn></div>
          </div>}

          {step==='streaming'&&<div>
            <div style={{fontSize:34,marginBottom:14}}>📱</div>
            <h2 style={{fontSize:22,fontWeight:800,fontFamily:'Georgia,serif',marginBottom:7}}>Your Streaming Services</h2>
            <p style={{fontSize:13,color:'#9C8870',marginBottom:18,lineHeight:1.7}}>Which services do you subscribe to? Javari shows you where to find content across all of them.</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginBottom:22}}>
              {STREAMING.map(s=>{const on=config.streamingServices.includes(s.id);return <button key={s.id} onClick={()=>onUpdate({streamingServices:on?config.streamingServices.filter(x=>x!==s.id):[...config.streamingServices,s.id]})} style={{padding:'10px 7px',background:on?`${s.color}14`:'#F5F0E8',border:`1px solid ${on?s.color+'42':'rgba(28,18,8,0.08)'}`,borderRadius:9,cursor:'pointer',fontSize:11,fontWeight:on?700:400,color:'#1C1208'}}>{s.emoji} {s.name}</button>})}
            </div>
            <div style={{display:'flex',gap:9,justifyContent:'flex-end'}}><SkipBtn onClick={()=>onStep('iptv')}>Skip</SkipBtn><SBtn onClick={()=>onStep('iptv')}>Continue →</SBtn></div>
          </div>}

          {step==='iptv'&&<div>
            <div style={{fontSize:34,marginBottom:14}}>📡</div>
            <h2 style={{fontSize:22,fontWeight:800,fontFamily:'Georgia,serif',marginBottom:7}}>Live TV & IPTV</h2>
            <p style={{fontSize:13,color:'#9C8870',marginBottom:13,lineHeight:1.7}}>Have an IPTV subscription? Paste your M3U URL and Javari imports thousands of live channels organized by category.</p>
            <div style={{padding:'11px 13px',background:'rgba(122,158,126,0.06)',border:'1px solid rgba(122,158,126,0.14)',borderRadius:9,marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,color:'#7A9E7E',marginBottom:5}}>✅ Free channels included at no cost</div>
              <div style={{fontSize:11,color:'#9C8870',lineHeight:1.6}}>Pluto TV, Plex Live, Samsung TV Plus — 800+ free legal channels — can be added in Settings.</div>
            </div>
            {!config.hasIPTV?<button onClick={()=>setIptvNotice(true)} style={{width:'100%',padding:13,background:'#F5F0E8',border:'1px dashed rgba(28,18,8,0.08)',borderRadius:11,color:'#C4846A',cursor:'pointer',fontSize:13,fontWeight:700,marginBottom:13}}>+ Connect My IPTV Subscription</button>:<input value={config.iptvUrl} onChange={e=>onUpdate({iptvUrl:e.target.value})} placeholder="https://yourprovider.com/playlist.m3u" style={{width:'100%',padding:'11px 13px',background:'#F5F0E8',border:'1px solid rgba(28,18,8,0.08)',borderRadius:11,color:'#1C1208',fontSize:13,outline:'none',marginBottom:13}} />}
            {iptvNotice&&<div style={{padding:'14px',background:'rgba(196,132,106,0.05)',border:'1px solid rgba(196,132,106,0.18)',borderRadius:11,marginBottom:13}}>
              <p style={{fontSize:12,color:'#5C4A33',lineHeight:1.7,marginBottom:13}}>When connecting IPTV, please ensure you have appropriate access rights. Javari is a connection layer — we do not host content. You are responsible for local laws. This notice appears once.</p>
              <div style={{display:'flex',gap:7}}><button onClick={()=>setIptvNotice(false)} style={{flex:1,padding:8,background:'transparent',border:'1px solid rgba(28,18,8,0.08)',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:600,color:'#5C4A33'}}>Cancel</button><button onClick={()=>{onUpdate({hasIPTV:true,iptvAccepted:true});setIptvNotice(false)}} style={{flex:2,padding:8,background:'linear-gradient(135deg,#C4846A,#C9974A)',border:'none',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:700,color:'#fff'}}>I Understand — Enable</button></div>
            </div>}
            <div style={{display:'flex',gap:9,justifyContent:'flex-end'}}><SkipBtn onClick={()=>onStep('cloud')}>Skip</SkipBtn><SBtn onClick={()=>onStep('cloud')}>Continue →</SBtn></div>
          </div>}

          {step==='cloud'&&<div>
            <div style={{fontSize:34,marginBottom:14}}>☁️</div>
            <h2 style={{fontSize:22,fontWeight:800,fontFamily:'Georgia,serif',marginBottom:7}}>Cloud Storage</h2>
            <p style={{fontSize:13,color:'#9C8870',marginBottom:18,lineHeight:1.7}}>Javari routes files to the cheapest service — photos to Amazon (FREE), docs to OneDrive, videos to Backblaze — saving most people $200–400/year.</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:9,marginBottom:22}}>
              {CLOUD.map(p=>{const on=config.cloudProviders.includes(p.id);return <button key={p.id} onClick={()=>onUpdate({cloudProviders:on?config.cloudProviders.filter(x=>x!==p.id):[...config.cloudProviders,p.id]})} style={{padding:'12px 11px',background:on?'rgba(196,132,106,0.07)':'#F5F0E8',border:`1px solid ${on?'#C4846A40':'rgba(28,18,8,0.08)'}`,borderRadius:9,cursor:'pointer',textAlign:'left'}}><div style={{fontSize:15,marginBottom:4}}>{p.icon}</div><div style={{fontSize:12,fontWeight:700,color:'#1C1208',marginBottom:2}}>{p.name}</div><div style={{fontSize:10,color:'#9C8870'}}>{p.note}</div>{on&&<div style={{marginTop:5,fontSize:9,color:'#C4846A',fontWeight:700}}>✓ Selected</div>}</button>})}
            </div>
            <div style={{display:'flex',gap:9,justifyContent:'flex-end'}}><SkipBtn onClick={()=>onStep('done')}>Skip</SkipBtn><SBtn onClick={()=>onStep('done')}>Continue →</SBtn></div>
          </div>}

          {step==='done'&&<div style={{textAlign:'center'}}>
            <div style={{fontSize:54,marginBottom:14,animation:'setup-in 0.5s ease'}}>🎉</div>
            <h2 style={{fontSize:26,fontWeight:900,fontFamily:'Georgia,serif',marginBottom:7,background:'linear-gradient(135deg,#C4846A,#C9974A)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{config.name?`You're all set, ${config.name.split(' ')[0]}!`:"You're all set!"}</h2>
            <p style={{fontSize:13,color:'#9C8870',marginBottom:22}}>Here&apos;s what Javari has configured for you:</p>
            <div style={{textAlign:'left',marginBottom:26,display:'flex',flexDirection:'column',gap:7}}>
              {[config.city&&`📍 Local channels for ${config.city}`,config.hasJellyfin&&'✅ Jellyfin media server',config.hasPlex&&'✅ Plex media server',config.streamingServices.length>0&&`📱 ${config.streamingServices.length} streaming services`,config.hasIPTV&&'📡 IPTV ready to import',config.cloudProviders.length>0&&`☁️ ${config.cloudProviders.length} cloud providers`,`📺 ${CHANNELS.length} channels (News · Sports · Lifestyle · Kids · Entertainment · Documentary)`,`🌿 Wellness library — meditation, yoga, sleep sounds`,'🎬 12 curated movies to start','✦ Javari AI — your personal assistant'].filter(Boolean).map((item,i)=>(
                <div key={i} style={{padding:'8px 12px',background:'#F5F0E8',border:'1px solid rgba(28,18,8,0.08)',borderRadius:9,fontSize:12,color:'#5C4A33',fontWeight:500,animation:`setup-in 0.3s ease ${i*0.05}s both`}}>{item as string}</div>
              ))}
            </div>
            <button onClick={onComplete} style={{padding:'15px 46px',background:'linear-gradient(135deg,#C4846A,#C9974A)',border:'none',borderRadius:15,color:'#fff',fontSize:15,fontWeight:800,cursor:'pointer',boxShadow:'0 8px 24px rgba(196,132,106,0.32)'}}>Enter Javari →</button>
          </div>}
        </div>
      </div>
      <style>{`@keyframes setup-in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}

function SBtn({children,onClick,disabled}:{children:React.ReactNode,onClick:()=>void,disabled?:boolean}){
  return <button onClick={onClick} disabled={disabled} style={{padding:'11px 24px',background:disabled?'rgba(196,132,106,0.3)':'linear-gradient(135deg,#C4846A,#C9974A)',border:'none',borderRadius:11,color:'#fff',cursor:disabled?'default':'pointer',fontSize:13,fontWeight:700,boxShadow:disabled?'none':'0 4px 12px rgba(196,132,106,0.22)'}}>{children}</button>
}
function SkipBtn({children,onClick}:{children:React.ReactNode,onClick:()=>void}){
  return <button onClick={onClick} style={{padding:'11px 20px',background:'transparent',border:'1px solid rgba(28,18,8,0.08)',borderRadius:11,color:'#5C4A33',cursor:'pointer',fontSize:13,fontWeight:500}}>{children}</button>
}
