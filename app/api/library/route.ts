// app/api/library/route.ts — Omni-Media library persistence
// Stores Plex/TMDB metadata in Supabase for faster loads
// CR AudioViz AI · EIN 39-3646201 · May 2026
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kteobfyferrukqeolofj.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function supabase(method: string, table: string, body?: any, params?: string) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${params ? `?${params}` : ""}`;
  const r = await fetch(url, {
    method,
    headers: {
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": method === "POST" ? "resolution=merge-duplicates" : "",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) return null;
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const section = url.searchParams.get("section") || "movies";
  const limit = parseInt(url.searchParams.get("limit") || "50");

  // Fetch from Supabase cache
  const items = await supabase("GET", "media_library",
    undefined,
    `section=eq.${section}&order=added_at.desc&limit=${limit}`
  );

  if (items && items.length > 0) {
    return NextResponse.json({ source: "cache", section, items, count: items.length });
  }

  // Cache miss — return empty, client will fetch from Plex
  return NextResponse.json({ source: "miss", section, items: [], count: 0 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { items, section } = body;

  if (!items || !Array.isArray(items)) {
    return NextResponse.json({ error: "items array required" }, { status: 400 });
  }

  // Upsert all items
  const rows = items.map((item: any) => ({
    plex_id: item.ratingKey || item.id,
    title: item.title,
    year: item.year,
    section,
    thumb: item.thumb,
    art: item.art,
    summary: item.summary,
    rating: item.rating,
    genres: item.genres,
    tmdb_id: item.tmdb_id,
    added_at: item.addedAt ? new Date(item.addedAt * 1000).toISOString() : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  await supabase("POST", "media_library", rows);

  return NextResponse.json({ success: true, upserted: rows.length });
}