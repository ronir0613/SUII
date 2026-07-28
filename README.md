# 🐐 SIUUU! - Interactive Web Experience

An interactive soundboard experience where every click spawns dynamic, styled "SIU!" text animations paired with Cristiano Ronaldo's iconic celebration sound.

Live Site: **[clicksiu.buzz](https://clicksiu.buzz)**

---

## ✨ Features

- **Interactive Canvas**: Click anywhere on the screen to spawn a vibrant, randomized "SIU!" text animation.
- **Dynamic Typography**: Every spawned word randomizes its font family (from 27 classic and modern typefaces), font weight, size, letter spacing, and rotation.
- **Organic Audio Effects**: Each click plays the legendary "SIU" sound with subtle variations in playback rate (pitch), volume, and micro-delays to make it feel natural and responsive.
- **Fluid Animations**: Smooth CSS/Framer Motion physics that toss the words into the air before they fade and fall.
- **User Controls**: Includes a sleek, persistent mute/unmute button.
- **SEO & Performance**: Optimized meta tags, custom OpenGraph visuals, Google Analytics integration, and lightning-fast loading times.

---

## 🛠️ Tech Stack

- **Framework**: [Astro](https://astro.build/) (Static Site Generation)
- **Frontend Logic**: [React](https://react.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Deployment & Hosting**: [Cloudflare Pages](https://pages.cloudflare.com/) / [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

---

## 🚀 Getting Started

### Prerequisites

Make sure you have Node.js installed (version `>= 22.12.0` recommended).

### Installation

1. Install the dependencies:
   ```sh
   npm install
   ```

2. Run the development server:
   ```sh
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:4321`.

### Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Astro local dev server |
| `npm run build` | Builds the production site to `./dist/` |
| `npm run preview` | Previews your production build locally |
| `npm run deploy` | Builds the site and deploys it to Cloudflare Pages via Wrangler |
