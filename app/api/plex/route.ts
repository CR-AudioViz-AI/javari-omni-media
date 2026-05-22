// app/api/plex/route.ts — Plex API proxy
// Fetches library sections and media items from Plex
// CR AudioViz AI · EIN 39-3646201 · May 2026
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const PLEX_URL = process.env.PLEX_URL || "http://192.168.1.50:32400";
const PLEX_TOKEN = process.env.PLEX_TOKEN || "";

async function plexGet(path: string) {
  const url = `${PLEX_URL}${path}${path.includes("?") ? "&" : "?"}X-Plex-Token=${PLEX_TOKEN}`;
  const r = await fetch(url, {
    headers: { "Accept": "application/json", "X-Plex-Token": PLEX_TOKEN },
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`Plex ${r.status}: ${path}`);
  return r.json();
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "libraries";

  if (!PLEX_TOKEN) {
    return NextResponse.json({ error: "PLEX_TOKEN not configured" }, { status: 500 });
  }

  try {
    if (action === "libraries") {
      const data = await plexGet("/library/sections");
      const sections = data.MediaContainer?.Directory || [];
      return NextResponse.json({
        sections: sections.map((s: any) => ({
          id: s.key,
          title: s.title,
          type: s.type,
          count: s.count,
          agent: s.agent,
        }))
      });
    }

    if (action === "section") {
      const sectionId = url.searchParams.get("id") || "1";
      const sort = url.searchParams.get("sort") || "addedAt:desc";
      const limit = url.searchParams.get("limit") || "50";
      const offset = url.searchParams.get("offset") || "0";

      const data = await plexGet(
        `/library/sections/${sectionId}/all?sort=${sort}&X-Plex-Container-Size=${limit}&X-Plex-Container-Start=${offset}`
      );
      const items = data.MediaContainer?.Metadata || [];

      return NextResponse.json({
        total: data.MediaContainer?.totalSize || items.length,
        items: items.map((item: any) => ({
          id: item.ratingKey,
          title: item.title,
          year: item.year,
          type: item.type,
          thumb: item.thumb ? `${PLEX_URL}${item.thumb}?X-Plex-Token=${PLEX_TOKEN}` : null,
          art: item.art ? `${PLEX_URL}${item.art}?X-Plex-Token=${PLEX_TOKEN}` : null,
          summary: item.summary,
          rating: item.rating,
          duration: item.duration,
          addedAt: item.addedAt,
          genres: item.Genre?.map((g: any) => g.tag) || [],
          streamUrl: `/api/plex/stream?id=${item.ratingKey}`,
        }))
      });
    }

    if (action === "item") {
      const itemId = url.searchParams.get("id");
      if (!itemId) return NextResponse.json({ error: "id required" }, { status: 400 });
      const data = await plexGet(`/library/metadata/${itemId}`);
      const item = data.MediaContainer?.Metadata?.[0];
      if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const media = item.Media?.[0];
      const part = media?.Part?.[0];
      return NextResponse.json({
        id: item.ratingKey,
        title: item.title,
        year: item.year,
        summary: item.summary,
        duration: item.duration,
        thumb: item.thumb ? `${PLEX_URL}${item.thumb}?X-Plex-Token=${PLEX_TOKEN}` : null,
        streamUrl: part?.key ? `${PLEX_URL}${part.key}?X-Plex-Token=${PLEX_TOKEN}` : null,
        container: media?.container,
        videoCodec: media?.videoCodec,
        audioCodec: media?.audioCodec,
        width: media?.width,
        height: media?.height,
        bitrate: media?.bitrate,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Plex error" }, { status: 500 });
  }
}