'use client'
// components/player/UniversalPlayer.tsx
// Javari Omni-Media — Universal Streaming Player
// Supports: HLS (.m3u8), MP4, IPTV streams, Plex direct play
// Works on desktop, mobile, tablet, and TV browsers
// Omni does not host media — it plays streams from legal/user-supplied sources
// Date: March 13, 2026 | Henderson Standard

import { useEffect, useRef, useState, useCallback } from 'react'

export interface PlayerSource {
  url: string
  title: string
  subtitle?: string
  thumbnail?: string
  type?: 'hls' | 'mp4' | 'iptv' | 'plex' | 'auto'
  startAt?: number        // seconds to resume from
  duration?: number       // total duration in seconds
  isLive?: boolean
}

export interface PlayerProps {
  source: PlayerSource | null
  onClose?: () => void
  onProgress?: (currentTime: number, duration: number) => void
  onEnded?: () => void
  autoPlay?: boolean
  embedded?: boolean      // true = inline player, false = fullscreen overlay
}

interface HlsLevel { height: number; bitrate: number; index: number }

// ─── SMART RESUME STORE ───────────────────────────────────────────────────────

const RESUME_KEY = 'javari_resume_positions'

function savePosition(url: string, seconds: number) {
  try {
    const store = JSON.parse(localStorage.getItem(RESUME_KEY) || '{}')
    store[url] = { seconds, savedAt: Date.now() }
    // Keep only last 200 entries
    const entries = Object.entries(store)
    if (entries.length > 200) {
      entries.sort((a, b) => (b[1] as { savedAt: number }).savedAt - (a[1] as { savedAt: number }).savedAt)
      localStorage.setItem(RESUME_KEY, JSON.stringify(Object.fromEntries(entries.slice(0, 200))))
    } else {
      localStorage.setItem(RESUME_KEY, JSON.stringify(store))
    }
  } catch { /* localStorage unavailable */ }
}

function loadPosition(url: string): number {
  try {
    const store = JSON.parse(localStorage.getItem(RESUME_KEY) || '{}')
    const entry = store[url]
    if (!entry) return 0
    // Expire positions older than 90 days
    if (Date.now() - entry.savedAt > 90 * 24 * 60 * 60 * 1000) return 0
    return entry.seconds || 0
  } catch { return 0 }
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function UniversalPlayer({
  source,
  onClose,
  onProgress,
  onEnded,
  autoPlay = true,
  embedded = false,
}: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<unknown>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressSaveRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(true)
  const [controlsTimer, setControlsTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [isPiP, setIsPiP] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [qualities, setQualities] = useState<HlsLevel[]>([])
  const [currentQuality, setCurrentQuality] = useState(-1) // -1 = auto
  const [showQualityMenu, setShowQualityMenu] = useState(false)
  const [resumeFrom, setResumeFrom] = useState(0)
  const [showResumePrompt, setShowResumePrompt] = useState(false)

  const fmtTime = (s: number) => {
    if (!isFinite(s)) return '--:--'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
      : `${m}:${String(sec).padStart(2,'0')}`
  }

  const resetControls = useCallback(() => {
    setShowControls(true)
    if (controlsTimer) clearTimeout(controlsTimer)
    const t = setTimeout(() => setShowControls(false), 3000)
    setControlsTimer(t)
  }, [controlsTimer])

  // ─── LOAD SOURCE ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current
    if (!video || !source?.url) return

    setError(null)
    setBuffering(true)
    setQualities([])
    setCurrentQuality(-1)

    // Destroy existing HLS instance
    if (hlsRef.current) {
      (hlsRef.current as { destroy: () => void }).destroy()
      hlsRef.current = null
    }

    const url = source.url
    const isHLS = url.includes('.m3u8') || url.includes('/hls/') ||
      url.includes('type=hls') || source.type === 'hls' || source.type === 'iptv'

    // Check smart resume position
    const startAt = source.startAt || 0
    const savedPos = loadPosition(url)
    if (savedPos > 30 && !source.isLive && savedPos < (source.duration || Infinity) - 10) {
      setResumeFrom(savedPos)
      setShowResumePrompt(true)
    }

    const seekAndPlay = (seekTo: number) => {
      if (seekTo > 0) video.currentTime = seekTo
      if (autoPlay) video.play().catch(() => {})
    }

    const loadVideo = async () => {
      // Native HLS (Safari, iOS)
      if (video.canPlayType('application/vnd.apple.mpegurl') && isHLS) {
        video.src = url
        video.load()
        video.addEventListener('loadedmetadata', () => seekAndPlay(startAt), { once: true })
        return
      }

      // HLS.js for Chrome, Firefox, Edge
      if (isHLS) {
        try {
          const HlsMod = await import('hls.js')
          const Hls = HlsMod.default
          if (!Hls.isSupported()) {
            video.src = url
            video.load()
            video.addEventListener('loadedmetadata', () => seekAndPlay(startAt), { once: true })
            return
          }

          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: source.isLive || false,
            backBufferLength: source.isLive ? 30 : 90,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
          })
          hlsRef.current = hls

          hls.loadSource(url)
          hls.attachMedia(video)

          hls.on(Hls.Events.MANIFEST_PARSED, (_: unknown, data: { levels: HlsLevel[] }) => {
            setBuffering(false)
            const levels = data.levels.map((l: HlsLevel, i: number) => ({
              height: l.height,
              bitrate: l.bitrate,
              index: i,
            })).sort((a, b) => b.height - a.height)
            setQualities(levels)
            seekAndPlay(startAt)
          })

          hls.on(Hls.Events.ERROR, (_: unknown, data: { fatal?: boolean; type?: string; details?: string }) => {
            if (data.fatal) {
              setError(`Stream error: ${data.details || data.type || 'unknown'}. The stream may be offline or unavailable.`)
              setBuffering(false)
            }
          })

          hls.on(Hls.Events.LEVEL_SWITCHED, (_: unknown, data: { level: number }) => {
            setCurrentQuality(data.level)
          })

          return
        } catch {
          // HLS.js unavailable — try direct
        }
      }

      // Direct MP4 / non-HLS
      video.src = url
      video.load()
      video.addEventListener('loadedmetadata', () => seekAndPlay(startAt), { once: true })
    }

    loadVideo()

    return () => {
      if (hlsRef.current) {
        (hlsRef.current as { destroy: () => void }).destroy()
        hlsRef.current = null
      }
      if (progressSaveRef.current) clearInterval(progressSaveRef.current)
    }
  }, [source?.url])

  // ─── PERIODIC POSITION SAVE ───────────────────────────────────────────────

  useEffect(() => {
    if (!source?.url || source.isLive) return
    progressSaveRef.current = setInterval(() => {
      const video = videoRef.current
      if (video && video.currentTime > 5) {
        savePosition(source.url, video.currentTime)
      }
    }, 10000) // Save every 10s
    return () => { if (progressSaveRef.current) clearInterval(progressSaveRef.current) }
  }, [source?.url])

  // ─── VIDEO EVENT HANDLERS ─────────────────────────────────────────────────

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    setCurrentTime(video.currentTime)
    onProgress?.(video.currentTime, video.duration || 0)
  }

  const handleDurationChange = () => {
    const video = videoRef.current
    if (video?.duration && isFinite(video.duration)) setDuration(video.duration)
  }

  const handlePlay = () => { setPlaying(true); setBuffering(false) }
  const handlePause = () => setPlaying(false)
  const handleWaiting = () => setBuffering(true)
  const handleCanPlay = () => setBuffering(false)
  const handleEnded = () => {
    setPlaying(false)
    if (source?.url) savePosition(source.url, 0) // Reset position on complete
    onEnded?.()
  }

  const handleVideoError = () => {
    setError('Unable to play this stream. It may be offline, geoblocked, or require authentication.')
    setBuffering(false)
  }

  // ─── CONTROLS ─────────────────────────────────────────────────────────────

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    playing ? video.pause() : video.play().catch(() => {})
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    video.currentTime = pct * duration
    setCurrentTime(pct * duration)
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100
    setVolume(v)
    if (videoRef.current) videoRef.current.volume = v
    if (v > 0) setMuted(false)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !muted
    setMuted(!muted)
  }

  const toggleFullscreen = () => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  const togglePiP = async () => {
    const video = videoRef.current
    if (!video) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        setIsPiP(false)
      } else {
        await video.requestPictureInPicture()
        setIsPiP(true)
      }
    } catch { /* PiP not supported */ }
  }

  const setQuality = (index: number) => {
    const hls = hlsRef.current as { currentLevel: number } | null
    if (hls) hls.currentLevel = index
    setCurrentQuality(index)
    setShowQualityMenu(false)
  }

  const skipSeconds = (secs: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, Math.min(duration || Infinity, video.currentTime + secs))
  }

  // ─── KEYBOARD NAVIGATION (TV support) ─────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!source) return
      resetControls()
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); break
        case 'ArrowRight': e.preventDefault(); skipSeconds(10); break
        case 'ArrowLeft': e.preventDefault(); skipSeconds(-10); break
        case 'ArrowUp': e.preventDefault(); setVolume(v => Math.min(1, v + 0.1)); if (videoRef.current) videoRef.current.volume = Math.min(1, volume + 0.1); break
        case 'ArrowDown': e.preventDefault(); setVolume(v => Math.max(0, v - 0.1)); if (videoRef.current) videoRef.current.volume = Math.max(0, volume - 0.1); break
        case 'm': toggleMute(); break
        case 'f': toggleFullscreen(); break
        case 'Escape': onClose?.(); break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [source, playing, volume])

  // ─── FULLSCREEN CHANGE ────────────────────────────────────────────────────

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  if (!source) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const containerStyle: React.CSSProperties = embedded
    ? { position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 12, overflow: 'hidden' }
    : { position: 'fixed', inset: 0, background: '#000', zIndex: 500, display: 'flex', flexDirection: 'column' }

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      onMouseMove={resetControls}
      onTouchStart={resetControls}
      onClick={e => { if (e.target === e.currentTarget) togglePlay() }}
    >
      {/* VIDEO ELEMENT */}
      <video
        ref={videoRef}
        style={{ flex: 1, width: '100%', height: embedded ? '100%' : 'calc(100% - 72px)', objectFit: 'contain', background: '#000', cursor: showControls ? 'default' : 'none' }}
        playsInline
        autoPlay={autoPlay}
        muted={muted}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onPlay={handlePlay}
        onPause={handlePause}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        onError={handleVideoError}
        onClick={togglePlay}
      />

      {/* BUFFERING SPINNER */}
      {buffering && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.3)', pointerEvents: 'none' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(192,132,252,.3)', borderTop: '3px solid #C084FC', borderRadius: '50%', animation: 'spin 1s linear infinite' }}/>
        </div>
      )}

      {/* ERROR STATE */}
      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.85)', padding: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 14, color: '#F5F0FF', fontWeight: 500, marginBottom: 8, textAlign: 'center' }}>Playback Error</div>
          <div style={{ fontSize: 12, color: '#9D8FBB', textAlign: 'center', lineHeight: 1.6, maxWidth: 400, marginBottom: 20 }}>{error}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setError(null); if (videoRef.current) { videoRef.current.load(); videoRef.current.play().catch(()=>{}) } }} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#C084FC', color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Retry</button>
            {onClose && <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(192,132,252,.3)', background: 'transparent', color: '#9D8FBB', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Close</button>}
          </div>
        </div>
      )}

      {/* RESUME PROMPT */}
      {showResumePrompt && (
        <div style={{ position: 'absolute', bottom: 90, right: 20, background: 'rgba(14,11,20,.95)', border: '1px solid rgba(192,132,252,.3)', borderRadius: 12, padding: '14px 18px', zIndex: 10 }}>
          <div style={{ fontSize: 12, color: '#F5F0FF', marginBottom: 10 }}>Resume from {fmtTime(resumeFrom)}?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = resumeFrom; setShowResumePrompt(false) }} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#C084FC', color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Resume</button>
            <button onClick={() => setShowResumePrompt(false)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(192,132,252,.2)', background: 'transparent', color: '#9D8FBB', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Start over</button>
          </div>
        </div>
      )}

      {/* LIVE BADGE */}
      {source.isLive && (
        <div style={{ position: 'absolute', top: 16, left: 16 }}>
          <span style={{ padding: '4px 10px', borderRadius: 6, background: '#FB923C', color: '#fff', fontSize: 11, fontWeight: 700 }}>● LIVE</span>
        </div>
      )}

      {/* TOP BAR (title + close) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 20px', background: 'linear-gradient(to bottom, rgba(0,0,0,.8) 0%, transparent 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: showControls ? 1 : 0, transition: 'opacity .3s', pointerEvents: showControls ? 'auto' : 'none' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#F5F0FF' }}>{source.title}</div>
          {source.subtitle && <div style={{ fontSize: 12, color: '#9D8FBB', marginTop: 2 }}>{source.subtitle}</div>}
        </div>
        {onClose && (
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.5)', color: '#fff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        )}
      </div>

      {/* QUALITY MENU */}
      {showQualityMenu && qualities.length > 0 && (
        <div style={{ position: 'absolute', bottom: 90, right: 20, background: 'rgba(14,11,20,.97)', border: '1px solid rgba(192,132,252,.2)', borderRadius: 12, overflow: 'hidden', zIndex: 10 }}>
          <div style={{ padding: '8px 14px', fontSize: 11, color: '#9D8FBB', borderBottom: '1px solid rgba(192,132,252,.1)' }}>Quality</div>
          <div onClick={() => setQuality(-1)} style={{ padding: '8px 20px', fontSize: 13, color: currentQuality === -1 ? '#C084FC' : '#F5F0FF', cursor: 'pointer', background: currentQuality === -1 ? 'rgba(192,132,252,.1)' : 'transparent' }}>
            Auto {currentQuality === -1 ? '✓' : ''}
          </div>
          {qualities.map(q => (
            <div key={q.index} onClick={() => setQuality(q.index)} style={{ padding: '8px 20px', fontSize: 13, color: currentQuality === q.index ? '#C084FC' : '#F5F0FF', cursor: 'pointer', background: currentQuality === q.index ? 'rgba(192,132,252,.1)' : 'transparent' }}>
              {q.height}p {currentQuality === q.index ? '✓' : ''}
            </div>
          ))}
        </div>
      )}

      {/* CONTROLS BAR */}
      <div style={{ position: embedded ? 'absolute' : 'relative', bottom: 0, left: 0, right: 0, padding: '16px 20px 12px', background: 'linear-gradient(to top, rgba(0,0,0,.9) 0%, transparent 100%)', opacity: showControls ? 1 : 0, transition: 'opacity .3s', pointerEvents: showControls ? 'auto' : 'none' }}>

        {/* PROGRESS BAR */}
        {!source.isLive && (
          <div onClick={handleSeek} style={{ height: 4, background: 'rgba(255,255,255,.2)', borderRadius: 2, cursor: 'pointer', marginBottom: 12, position: 'relative' }}
            onMouseEnter={e => { (e.currentTarget.style.height = '6px'); e.currentTarget.style.marginBottom = '11px' }}
            onMouseLeave={e => { (e.currentTarget.style.height = '4px'); e.currentTarget.style.marginBottom = '12px' }}>
            <div style={{ height: '100%', width: `${Math.min(progress, 100)}%`, background: 'linear-gradient(90deg,#C084FC,#F472B6)', borderRadius: 2, transition: 'width .2s' }}/>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* PLAY/PAUSE */}
          <button onClick={togglePlay} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: '#C084FC', color: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {playing ? '⏸' : '▶'}
          </button>

          {/* SKIP BACK 10s */}
          {!source.isLive && (
            <button onClick={() => skipSeconds(-10)} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ⏪
            </button>
          )}

          {/* SKIP FORWARD 10s */}
          {!source.isLive && (
            <button onClick={() => skipSeconds(10)} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.1)', color: '#fff', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ⏩
            </button>
          )}

          {/* TIME */}
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.8)', minWidth: 90 }}>
            {fmtTime(currentTime)} {!source.isLive && duration > 0 ? `/ ${fmtTime(duration)}` : ''}
          </span>

          <div style={{ flex: 1 }} />

          {/* VOLUME */}
          <button onClick={toggleMute} style={{ width: 32, height: 32, border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 16 }}>
            {muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
          </button>
          <input type="range" min={0} max={100} value={Math.round(volume * 100)} onChange={handleVolume}
            style={{ width: 70, accentColor: '#C084FC' }} />

          {/* QUALITY */}
          {qualities.length > 0 && (
            <button onClick={() => setShowQualityMenu(v => !v)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>
              {currentQuality === -1 ? 'Auto' : `${qualities[currentQuality]?.height || '?'}p`} ⚙
            </button>
          )}

          {/* PIP */}
          {'pictureInPictureEnabled' in document && (
            <button onClick={togglePiP} title="Picture in Picture" style={{ width: 32, height: 32, border: 'none', background: 'transparent', color: isPiP ? '#C084FC' : '#fff', cursor: 'pointer', fontSize: 14 }}>
              ⧉
            </button>
          )}

          {/* FULLSCREEN */}
          <button onClick={toggleFullscreen} title="Fullscreen (F)" style={{ width: 32, height: 32, border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 16 }}>
            {isFullscreen ? '⛶' : '⛶'}
          </button>
        </div>

        {/* KEYBOARD HINT */}
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 6, textAlign: 'right' }}>
          Space: play/pause · ← →: seek 10s · ↑↓: volume · F: fullscreen · M: mute · Esc: close
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        video::-webkit-media-controls { display: none !important; }
        video::-webkit-media-controls-enclosure { display: none !important; }
      `}</style>
    </div>
  )
}
