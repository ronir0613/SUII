import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const BASE_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
};

export const POST: APIRoute = async ({ locals }) => {
  try {
    const sessionKv = (env as any).SESSION ?? null;
    const token = crypto.randomUUID();
    const ts = Date.now();
    
    if (sessionKv) {
      await sessionKv.put(token, JSON.stringify({ ts }), { expirationTtl: 60 });
    }

    return new Response(JSON.stringify({ token, ts }), {
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

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
