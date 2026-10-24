# ASTRO RELIC — MASTER AI CONTEXT (Confidential, delete after project)

> For any AI (Lovable, Google AI Studio, Cursor, Claude): read this fully before touching code.
> Tagline: "Abandoned but Not Forgotten" — "Every machine has a mission. Every mission leaves a story."
> Goal: NASA Space Apps 2026.

## 1. Vision
- Emotional, scientifically accurate 3D interactive storytelling — NOT a generic game, NOT a Wikipedia clone.
- Rovers, landers, antennas are characters with legacy. NASA's real history is truth.
- Guide: **Nova** — AI companion, space-radio voice, reverent toward historic machines.
- Tone: cinematic, melancholic yet inspiring, bilingual (English + natural emotional Bengali).
- Strategy: **Vertical Slice** — perfect ONE complete journey (Mars Pathfinder + Sojourner) before adding anything else. Only Mars and Moon in the solar map.

## 2. Historical guardrails (AI must NEVER invent history)
Mars Pathfinder & Sojourner:
- Launch: 4 Dec 1996 · Landing: **4 July 1997**, Ares Vallis (19.33° N, 33.55° W), airbag landing
- Lander renamed: Carl Sagan Memorial Station
- Sojourner: 10.5 kg, 6 wheels, rocker-bogie, APXS spectrometer
- Planned life: rover 7 sols, lander 30 sols · Actual: ~83 sols
- Last signal: **27 Sept 1997**
- Returned 16,500+ images, millions of weather measurements; first wheeled vehicle on another planet
Apollo 11 (later chapter): 20 July 1969, Tranquility Base.

## 3. Technical rules
- TanStack Start v1 + React 19 + Vite 7 + Tailwind v4 (`src/styles.css`). Never use react-router-dom.
- 3D: custom Three.js engine `src/game/engine.ts`; scenes in `src/game/scenes/` (home, solar, marsFocus, marsWorld).
- Game code uses browser APIs → keep it behind the client-only lazy mount (`src/routes/index.tsx`, `src/components/game/Game.tsx`). Never import `src/game/*` or `src/state/store` from SSR code.
- UI: `src/components/Overlays.tsx`, `SolarHUD.tsx`. Text: `src/data/content.ts`, `story.ts` (always EN + BN).
- Save: localStorage key `astro-relic`. Assets: `public/images/` via `/images/...`.
- Mobile-first (~393px wide). Strict TypeScript, no `any`.
- Engine decision: keep Three.js; ADD Rapier 3D physics later (Mars gravity 3.7 m/s²). No Babylon/PlayCanvas/Unity/Unreal.
- AI (later): Gemini Flash through server function, only verified NASA facts.

## 4. Roadmap (work ONE element at a time to save credits)
1. Homepage — NASA Mission Control look:
   a. Top telemetry bar (DSN ONLINE, 8.4 GHz, SOL 001, Ares Vallis) + sound/language toggles
   b. Hero title + "INITIATE EXPEDITION" glowing button
   c. Mars weather glass widget (-63°C, 610 Pa, Tau 0.45)
   d. 3D background polish (sun flare, parallax, Nova drone)
2. Solar map tutorial by Nova (move → Mars → Moon → choose)
3. Cinematic descent + "Occupy Mars" quality surface (dust, fog, dunes, rocks, shadows, helmet HUD)
4. Pathfinder/Sojourner 3D hotspots + Chapters 01–05
5. Journey Flags + Nova AI live voice + crisis mode (separate mode)

## 5. Workflow
Lovable ⇄ GitHub (code bank) ⇄ Google AI Studio / Cursor. Work in one tool at a time, push when done.

## Progress log
- [x] Project migrated from github.com/morsalin-rifat/astro-relic
- [x] 1a Top telemetry bar (DSN ONLINE, FREQ 8.4 GHz, RELIC PROTOCOL V2.4 · SOL 001 · ARES VALLIS · live UTC clock · sound waveform toggle + BN/EN switch; audio.beep() UI blip; strings in TELEMETRY in content.ts; .telemetry-bar/wave/blinkdot in styles.css) — homepage only, compact at 393px
- [x] 1b Home screen REDESIGNED — "Magical Interactive Starfield" (replaces old Earth/solar home): GPU twinkle shader stars, mouse-reactive near stars (brighten + drift + stardust trail), periodic shooting star, glowing procedural Mars, Nova bot waving bottom-right, camera parallax; new HomeUI: badge "A NASA SPACE APPS STORY ADVENTURE", floating glow ASTRO RELIC title, tagline EN+BN, glowing pulsing "START ADVENTURE / মহাকাশ যাত্রা শুরু" button (hover beep), star-play hint; styles: .astro-badge/.astro-title/.cta-adventure + keyframes titlefloat/cta-pulse; flow unchanged (start → journey choice → cinematic). Old cta/ctaSub strings kept for other references.
- [ ] 2. Universe screen (Mars/Moon choose) + Nova tutorial (next)
