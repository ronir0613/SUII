import type { APIRoute } from 'astro';

export const prerender = false;

// ─── types ────────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  name: string;
  score: number;
  ts: number;
}

// ─── constants ────────────────────────────────────────────────────────────────

const MAX_SCORE    = 150;   // reject anything above this as a likely bot/cheat
const TOP_N_STORE  = 100;   // keep top 100 in KV
const TOP_N_RETURN = 10;    // expose top 10 via GET
const KV_KEY       = 'top100';

const BASE_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
};

// ─── helper: resolve KV binding ───────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getKV(locals: any): any | null {
  return locals?.runtime?.env?.LEADERBOARD ?? null;
}

// ─── GET /api/leaderboard ─────────────────────────────────────────────────────
// Returns the top 10 entries as JSON, sorted descending by score.

export const GET: APIRoute = async ({ locals }) => {
  try {
    const kv = getKV(locals);

    // KV not configured (e.g. local dev without wrangler dev) → return empty list
    if (!kv) {
      return new Response(JSON.stringify([]), { headers: BASE_HEADERS });
    }

    const raw = await kv.get(KV_KEY, 'text');
    let entries: LeaderboardEntry[] = [];
    try { entries = raw ? JSON.parse(raw) : []; } catch { /* corrupted KV – start fresh */ }

    return new Response(JSON.stringify(entries.slice(0, TOP_N_RETURN)), {
      headers: BASE_HEADERS,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: 'Server error', detail: msg }), {
      status: 500,
      headers: BASE_HEADERS,
    });
  }
};

// ─── POST /api/leaderboard ────────────────────────────────────────────────────
// Body: { name: string, score: number }
// Validates, appends to KV list, keeps only top 100 by score.
// Returns: { leaderboard: top10, rank: number, inTop10: boolean }

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse body
    let body: { name?: unknown; score?: unknown };
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: BASE_HEADERS,
      });
    }

    const { name, score } = body;

    // ── Validate name ──────────────────────────────────────────────────────
    if (!name || typeof name !== 'string' || !name.trim()) {
      return new Response(JSON.stringify({ error: 'Name is required' }), {
        status: 400,
        headers: BASE_HEADERS,
      });
    }
    const cleanName = (name as string)
      .replace(/[^a-zA-Z0-9 _\-.]/g, '')
      .trim()
      .slice(0, 15);
    if (!cleanName) {
      return new Response(
        JSON.stringify({ error: 'Name contains no valid characters' }),
        { status: 400, headers: BASE_HEADERS }
      );
    }

    // ── Validate score ─────────────────────────────────────────────────────
    // Reject if not an integer, or outside [1, MAX_SCORE]
    if (
      typeof score !== 'number' ||
      !Number.isInteger(score) ||
      score < 1 ||
      score > MAX_SCORE
    ) {
      return new Response(
        JSON.stringify({
          error: `Score must be an integer between 1 and ${MAX_SCORE}`,
        }),
        { status: 400, headers: BASE_HEADERS }
      );
    }

    const kv = getKV(locals);

    // ── KV not configured — graceful degradation for local dev ─────────────
    if (!kv) {
      return new Response(
        JSON.stringify({ leaderboard: [], rank: 0, inTop10: false, dev: true }),
        { headers: BASE_HEADERS }
      );
    }

    // ── Read → append → sort → trim → write ───────────────────────────────
    const ts  = Date.now();
    const raw = await kv.get(KV_KEY, 'text');
    let entries: LeaderboardEntry[] = [];
    try { entries = raw ? JSON.parse(raw) : []; } catch { /* corrupted KV – start fresh */ }

    entries.push({ name: cleanName, score, ts });

    // Sort descending by score; ties resolved by earliest submission
    entries.sort((a, b) => b.score - a.score || a.ts - b.ts);

    const top = entries.slice(0, TOP_N_STORE);
    await kv.put(KV_KEY, JSON.stringify(top));

    // Find the submitted entry's rank (1-indexed; 0 if pushed out of top 100)
    const rank  = top.findIndex(e => e.ts === ts) + 1;
    const top10 = top.slice(0, TOP_N_RETURN);

    return new Response(
      JSON.stringify({ leaderboard: top10, rank, inTop10: rank > 0 && rank <= TOP_N_RETURN }),
      { headers: BASE_HEADERS }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: 'Server error', detail: msg }), {
      status: 500,
      headers: BASE_HEADERS,
    });
  }
};

// ─── OPTIONS — CORS pre-flight ────────────────────────────────────────────────

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
