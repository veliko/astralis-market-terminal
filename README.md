# ASTRALIS // Institutional 3D Celestial Ephemeris & Market Cycle Terminal

An institutional-grade interactive 3D Financial Astrology & Market Cycle Terminal built with **Vite**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **Three.js** (`@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`), and **`astronomy-engine`**.

## Project Architecture & Handoff Context

### 1. Core Modules
- **`src/lib/ephemeris.ts`** — Client-side 60fps astronomical & ephemeris engine:
  - Computes true geocentric tropical ecliptic coordinates (`0°–360°` longitude `elon` and 3D ecliptic latitude `elat`) via `Astronomy.GeoVector(body, date, true)` → `Astronomy.Ecliptic(gv)` across Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, plus Mean & True Lunar North/South Nodes.
  - Computes wrap-safe daily angular velocity (`t - 12h` vs `t + 12h`), Retrograde (`Rx`), Stationing (`ST-Rx` / `ST-D` within `±3 days` of zero velocity), Anaretic degree (`29°00'–29°59'`), and lazy-cached unwrapped-longitude **Retrograde Shadow Zone Arcs** (`Pre-Shadow`, `SRx`, `SD`, `Post-Shadow`).
  - Computes geometric aspects (`0° Conjunction`, `180° Opposition`, `90° Square`, `120° Trine`, `60° Sextile`), classifies `APPLYING` vs `SEPARATING` (`t` vs `t + 6h`), detects Solar & Lunar Eclipses (`≤ 18°` from Nodes), scans the **Upcoming 90-Day Inflection Radar**, and refines **±5-Year Macro Inflection Bookmarks**.
- **`src/lib/marketRegime.ts`** — Quantitative financial-cycle translation engine (strictly non-horoscopic):
  - Translates any ephemeris snapshot into an **Executive Tape Posture Banner** (Tension Score `0–100`, active `Rx`, stations, tightest applying hard aspect) and **Three-Horizon Breakdown Cards** (*Secular & Macro Tides*, *Tactical Momentum & Valuation*, *Short-Term Volatility Sparks*).
- **`src/components/CelestialArena3D.tsx`** — Interactive ~70vh 3D Celestial Astrolabe:
  - Sculpted 360° Brushed-Bronze & Obsidian Zodiac Bezel (`1°`/`5°`/`10°` Vernier ticks, 12 × `30°` sign sectors, dynamic `29°` anaretic highlights).
  - Concentric market-timeframe rings (Inner / Middle / Outer), 60-day motion ribbons, reversing crimson `Rx` tangent arrows, glowing shadow-zone arcs (`SD` & `SRx` pins), vaulted 3D aspect laser beams with `APPLYING`/`SEPARATING` energy pulses + postprocessing bloom, zero-portal 60fps non-overlapping 3D HUD badges, planet click-to-focus inspector, and **Geocentric vs. Heliocentric + Sightline View** toggle.
- **`src/components/TimelineController.tsx`** — Persistent ±5-year timeline scrubber, discrete tactical step controls (`-1M`..`+1M`), UTC datetime picker, forward/reverse multi-speed time-lapse (`1d/s`, `7d/s`, `30d/s`), and pre-scanned macro bookmark pills.
- **`src/components/MarketBriefing.tsx`** — Below-the-fold Executive Tape Posture, Three-Horizon Breakdown, 12-Body Ephemeris Strip, sortable Live Active Aspects Matrix, and click-to-scrub Upcoming 90-Day Inflection Radar.
- **`src/lib/ephemeris.test.ts`** — Vitest unit test suite verifying historical/future astronomical checkpoints (Nov 12 2026, Nov 25 2026, Jan–Apr 2027, May–Jun 2028, Solar Eclipse & Radar).

### 2. Local Development & Verification Commands
```bash
npm install
npm test          # Runs Vitest astronomical checkpoint suite (5/5 passing)
npm run build     # Runs strict tsc -b && vite build (outputs ./dist with relative base './')
npm run dev       # Starts local Vite dev server
```

### 3. Instructions for Continuing in the Antigravity `Astralis` Project Thread
1. **Verify Build & Tests:** Run `npm install && npm test && npm run build`.
2. **Enable GitHub Pages Full-Screen Deployment:**
   - `.github/workflows/deploy.yml` is already configured to build `./dist` and deploy to **GitHub Pages** on every push to `main`.
   - Enable GitHub Pages workflow deployment via `gh api`:
     ```bash
     gh api -X POST repos/veliko/astralis-market-terminal/pages -f build_type=workflow
     ```
     (or `PUT` if already enabled, then trigger `.github/workflows/deploy.yml` via `gh workflow run deploy.yml -R veliko/astralis-market-terminal --ref main`).
   - Once the workflow finishes (~45s), the full-screen 3D WebGL terminal will be live at **`https://veliko.github.io/astralis-market-terminal/`**.
