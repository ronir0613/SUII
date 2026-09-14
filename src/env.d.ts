/// <reference types="astro/client" />

// Minimal KV interface — avoids needing @cloudflare/workers-types as a dep.
// After running `npx wrangler kv namespace create LEADERBOARD` and setting the
// ID in wrangler.jsonc, run `npx wrangler types` to regenerate properly.
interface KVNamespace {
  get(key: string, type?: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

interface Env {
  LEADERBOARD: KVNamespace;
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
