// app/api/plex/stream/route.ts — Plex HLS stream proxy
// Proxies Plex transcoded HLS streams for browser playback
// CR AudioViz AI · EIN 39-3646201 · May 2026
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const PLEX_URL = process.env.PLEX_URL || "http://192.168.1.50:32400";
const PLEX_TOKEN = process.env.PLEX_TOKEN || "";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const itemId = url.searchParams.get("id");
  const quality = url.searchParams.get("quality") || "8";

  if (!itemId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  if (!PLEX_TOKEN) {
    return NextResponse.json({ error: "PLEX_TOKEN not configured" }, { status: 500 });
  }

  // Get the Plex HLS URL for transcoded streaming
  const sessionId = `javari-${Date.now()}`;
  const plexStreamUrl = `${PLEX_URL}/video/:/transcode/universal/start.m3u8` +
    `?path=/library/metadata/${itemId}` +
    `&mediaIndex=0` +
    `&X-Plex-Token=${PLEX_TOKEN}` +
    `&X-Plex-Client-Identifier=javari-omni-media` +
    `&X-Plex-Session-Identifier=${sessionId}` +
    `&videoQuality=${quality}` +
    `&maxVideoBitrate=20000` +
    `&videoResolution=1920x1080` +
    `&protocol=hls` +
    `&fastSeek=1`;

  return NextResponse.json({
    hlsUrl: plexStreamUrl,
    sessionId,
    note: "Use HLS.js or native video player with this URL",
  });
}