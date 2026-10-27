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
- [~] 2. Mission Command Hub (phase `hub`, after START ADVENTURE) — Pragmata-style AAA menu
  - DONE: `src/game/scenes/hub.ts` (starfield, glowing Earth + fresnel atmosphere, Mars/Moon terrain, rocks, haze, parallax, live universe swap by polling `store.get().universe`); store `universe: 'mars'|'moon'`; engine: start→hub, `hub:newgame`→cinematic, nextChapter→hub; HUB/HOWTO/CHAPTERS strings in content.ts; first `HubUI` in Overlays.tsx (menu, Nova bubble, chapters panel, how-to-play, reset).
  - FIXED: HubScene.update() now calls renderer.render (was missing → frozen 3D).
  - APPROVED "Living Hub" visual suite (all background/horizon only, never cover menu, mobile 60fps):
    1. DONE twinkling near-star layer + mouse parallax/brighten (`hubSky.ts`)
    2. DONE shooting stars every 8–14s
    3. DONE distant horizon meteor strike (flash + dust ring), never toward camera
    4. TODO click ground → holographic scan ring + NASA data tag (Mars basalt/iron oxide, Moon regolith/titanium)
    5. TODO click Earth/planet → orbit ring + distance/signal-delay tag
    6. DONE blinking distant rover beacon
    7. DONE floating dust (Mars wind drift, Moon slow float); TODO dust devils
    8. DONE pale sun with blue halo on Mars (real Curiosity blue sunset); TODO hex lens flare on hover
    9. TODO rover wheel tracks (Mars) + Apollo bootprints/LRV tracks (Moon) with dust blowing over
    10. TODO Nova looks toward cursor, waves when idle
    11. TODO idle 20–25s → cinematic drone camera flyby, menu fades; any input returns
    - REJECTED: solar-storm UI glitch, radio static sounds.
  - TODO (next agent, in order):
    a. Camera: look lower so terrain fills bottom third (terrain y≈-3.6); smooth spring parallax.
    b. Mars: drifting red dust particles; Moon: big rotating Earth, crater detail.
    c. Universe switch = smooth cinematic tween (lights/fog/colors/Earth pos over ~1.2s), not instant.
    d. Menu redesign: right side, minimal text `[ 01 // NEW EXPEDITION ]`, `[ 02 // CHAPTER ARCHIVES ]`, `[ 03 // FIELD MANUAL ]`, `[ 04 // SYSTEM PURGE ]` — hover neon underline + sub-info + beep + slight camera zoom; no heavy boxes covering 3D.
    e. Top slim capsule toggle `[ MARS EXPEDITION | MOON EXPEDITION ]`.
    f. Reset: red glitch confirm. How-to-play: Nova hologram card.
    g. Responsive 393px + 1280px, EN+BN.
- [ ] 3. Chapter Journey Map (AAA, Death Stranding/Horizon style): mountaintop vista, glowing trail through valley, GPU-wind cloth flags with beacon rings per chapter, click = camera dolly + DOF, glass hologram briefing card + [INITIATE MISSION], unlock shockwave along trail. Mars chapters: Pathfinder/Sojourner 1997, Opportunity 2004, Spirit 2004. Moon: Apollo 11 1969, Apollo 15 LRV, Artemis.
- [ ] 4. Cinematic descent → Level 1 surface exploration → GTA-style choices with real NASA facts → flag raising.

## Visual inspiration (user refs, Oct 2026) — INSPIRATION ONLY, NEVER COPY
- Sci-fi HUD: huge outline watermark word (MARS/MOON) behind 3D, thin corner brackets, coordinates, live radio waveform "MISSION TRANSMISSION // SIGNAL 01", telemetry tags (Mars 225M km · 7 mo · -63°C; Moon 384,400 km · 3 days · -130°C).
- Chapter/rover panels: dark glass bento cards, rotating 3D rover, battery/health/signal gauges.
- Astro Relic core: spiky glowing particle sphere (Three.js) = the mysterious relic players track.
- Keep our own story, layout and identity; save credits — small focused steps.
- DONE: hub camera now looks down (lookAt y=-2.2) so terrain is visible.

## Dual universe rule
Mars and Moon share ONE engine/mechanics/controls; only visuals, gravity (Mars 0.38g, Moon 0.16g), chapters and Nova lines differ.
