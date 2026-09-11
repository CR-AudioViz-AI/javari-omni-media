// app/page.tsx — Javari Omni-Media
// Plex replacement with AI metadata and dynamic libraries
// CR AudioViz AI · EIN 39-3646201 · May 2026
"use client";
import { useState, useEffect } from "react";

export default function OmniMediaHome() {
  const [mode, setMode] = useState<"connect"|"standalone">("connect");
  const [plexUrl, setPlexUrl] = useState("");
  const [plexToken, setPlexToken] = useState("");
  const [libraries, setLibraries] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [activeLib, setActiveLib] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function connectPlex() {
    if (!plexUrl) return;
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ action: "libraries" });
      if (plexToken) params.set("token", plexToken);
      const res = await fetch(`/api/plex?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setLibraries(data.sections || []);
    } catch (e: any) {
      setError(e.message || "Connection failed. Check URL and token.");
    }
    setLoading(false);
  }

  async function loadLibrary(lib: any) {
    setActiveLib(lib); setLoading(true); setItems([]);
    try {
      const res = await fetch(`/api/plex?action=section&id=${lib.id}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch { setError("Failed to load library."); }
    setLoading(false);
  }

  const filtered = items.filter(i =>
    !search || i.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight:"100vh", background:"#080812", color:"#e2e8f0", fontFamily:"system-ui" }}>
      <nav data-app-chrome style={{ background:"#1E3A5F", padding:"0 20px", height:52, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontWeight:900, color:"#00B4D8", fontSize:16 }}>Javari</span>
          <span style={{ color:"rgba(0,180,216,0.5)" }}>·</span>
          <span style={{ color:"#9CA3AF", fontSize:13 }}>Omni-Media</span>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {[["connect","🔗 Connect"],["standalone","📁 Standalone"]].map(([m,l]) => (
            <button key={m} onClick={() => setMode(m as any)}
              style={{ background: mode===m ? "rgba(0,180,216,0.15)" : "transparent", color: mode===m ? "#00B4D8" : "#6B7280", border:`1px solid ${mode===m ? "rgba(0,180,216,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius:6, padding:"4px 12px", fontSize:12, cursor:"pointer", fontFamily:"system-ui" }}>
              {l}
            </button>
          ))}
        </div>
      </nav>

      <div style={{ display:"flex", minHeight:"calc(100vh - 52px)" }}>
        {/* Sidebar */}
        <div style={{ width:240, background:"#0A0E1A", borderRight:"1px solid rgba(0,180,216,0.08)", padding:16, flexShrink:0 }}>
          {mode === "connect" ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <h2 style={{ fontSize:13, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 4px" }}>Plex Server</h2>
              <input value={plexUrl} onChange={e => setPlexUrl(e.target.value)}
                placeholder="http://192.168.1.50:32400"
                style={{ background:"#172D48", border:"1px solid rgba(0,180,216,0.15)", borderRadius:7, padding:"8px 10px", color:"#e2e8f0", fontSize:12, outline:"none", fontFamily:"system-ui" }} />
              <input value={plexToken} onChange={e => setPlexToken(e.target.value)}
                placeholder="Plex Token (optional)"
                style={{ background:"#172D48", border:"1px solid rgba(0,180,216,0.15)", borderRadius:7, padding:"8px 10px", color:"#e2e8f0", fontSize:12, outline:"none", fontFamily:"system-ui" }} />
              <button onClick={connectPlex} disabled={loading || !plexUrl}
                style={{ background: !plexUrl ? "#0F1F32" : "#1E3A5F", color: !plexUrl ? "#374151" : "#00B4D8", border:"1px solid rgba(0,180,216,0.2)", borderRadius:7, padding:"8px", fontSize:12, fontWeight:700, cursor: !plexUrl ? "not-allowed" : "pointer", fontFamily:"system-ui" }}>
                {loading ? "Connecting..." : "Connect"}
              </button>
              {error && <p style={{ fontSize:11, color:"#FF0800", margin:0 }}>{error}</p>}
              {libraries.length > 0 && (
                <div style={{ marginTop:8 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:"#374151", margin:"0 0 6px" }}>LIBRARIES</p>
                  {libraries.map(lib => (
                    <button key={lib.id} onClick={() => loadLibrary(lib)}
                      style={{ display:"flex", width:"100%", alignItems:"center", gap:8, background: activeLib?.id === lib.id ? "rgba(0,180,216,0.1)" : "transparent", border:"none", borderRadius:6, padding:"7px 8px", cursor:"pointer", fontFamily:"system-ui", marginBottom:2 }}>
                      <span style={{ fontSize:16 }}>{lib.type === "movie" ? "🎬" : lib.type === "show" ? "📺" : lib.type === "artist" ? "🎵" : "📁"}</span>
                      <span style={{ fontSize:12, color: activeLib?.id === lib.id ? "#00B4D8" : "#9CA3AF", textAlign:"left" }}>{lib.title}</span>
                      <span style={{ fontSize:10, color:"#374151", marginLeft:"auto" }}>{lib.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 style={{ fontSize:13, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 8px" }}>NAS / Local</h2>
              <p style={{ fontSize:12, color:"#374151" }}>
                Scan from your home lab Ubuntu server (192.168.1.50) or Synology DeathStar (192.168.1.141).
              </p>
              <a href="/api/plex?action=libraries" style={{ display:"block", marginTop:12, background:"rgba(0,180,216,0.1)", color:"#00B4D8", borderRadius:7, padding:"8px", fontSize:12, fontWeight:700, textDecoration:"none", textAlign:"center" }}>
                Auto-detect Libraries
              </a>
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{ flex:1, padding:"20px 24px" }}>
          {activeLib && (
            <>
              <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center" }}>
                <h1 style={{ margin:0, fontSize:20, fontWeight:800, color:"#fff" }}>{activeLib.title}</h1>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  style={{ marginLeft:"auto", background:"#0F1F32", border:"1px solid rgba(0,180,216,0.15)", borderRadius:7, padding:"7px 12px", color:"#e2e8f0", fontSize:13, outline:"none", fontFamily:"system-ui", width:200 }} />
              </div>
              {loading ? (
                <p style={{ color:"#6B7280" }}>Loading {activeLib.title}...</p>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:12 }}>
                  {filtered.slice(0, 100).map(item => (
                    <a key={item.id} href={item.streamUrl || "#"}
                      style={{ background:"#0F1F32", borderRadius:10, overflow:"hidden", textDecoration:"none", display:"block", cursor:"pointer" }}>
                      {item.thumb ? (
                        <img src={item.thumb} alt={item.title} style={{ width:"100%", aspectRatio:"2/3", objectFit:"cover", display:"block" }}
                          onError={(e: any) => { e.target.style.display="none"; }} />
                      ) : (
                        <div style={{ aspectRatio:"2/3", background:"#172D48", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>
                          {activeLib.type === "movie" ? "🎬" : "📺"}
                        </div>
                      )}
                      <div style={{ padding:"8px 10px" }}>
                        <div style={{ fontSize:12, fontWeight:600, color:"#e2e8f0", marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.title}</div>
                        <div style={{ fontSize:10, color:"#374151" }}>{item.year}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
          {!activeLib && !loading && (
            <div style={{ textAlign:"center", padding:"80px 24px", color:"#374151" }}>
              <div style={{ fontSize:56, marginBottom:16 }}>📺</div>
              <p style={{ fontSize:15 }}>Connect your Plex server or scan a local path to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}