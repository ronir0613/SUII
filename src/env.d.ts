/// <reference types="astro/client" />

declare module 'cloudflare:workers' {
  export const env: Env;
}

interface Env {
  LEADERBOARD: any;
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
