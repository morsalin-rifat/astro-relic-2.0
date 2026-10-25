# Universe Screen — Mars / Moon Choose + Nova Guide

Next step of the master plan (AI_MASTER_CONTEXT.md, item 2). After the magical starfield home screen, the player picks a world: Mars (playable, Chapter 01) or Moon (locked, coming soon). Nova the guide bot teaches kids how to interact — PUBG/GTA-style "click here" guidance.

## What the player sees

Flow: Home "START ADVENTURE" → **Universe screen** → click glowing Mars → cinematic descent (already built).

1. **3D scene (new `src/game/scenes/universe.ts`)**
   - Deep-space starfield with gentle drift + parallax (mouse moves camera slightly).
   - **Mars**: large red 3D planet on the left, slow rotation, warm orange glow sprite, faint atmosphere rim. Brightens + scales up slightly on pointer hover; a pulsing halo ring invites the click.
   - **Moon**: smaller grey cratered planet on the right, cold blue-grey rim light, dimmer. A subtle lock badge + "UNLOCKS AFTER MARS" label.
   - A thin dotted orbit path from the player's viewpoint toward Mars (subtle storytelling: "this is where we go first").
2. **Nova guide (tutorial, first visit only)**
   - Uses the existing dialogue system (`store.say`) with the existing NOVA_* strings, reworded for this screen:
     - "Hi! I'm Nova." → "These are two worlds." → "Move your mouse — the planets will shine." → "Click Mars when you are ready."
   - A big friendly animated arrow bounces pointing at Mars while the tutorial is active (2D overlay arrow, kid-friendly).
   - Nova's small glowing 3D presence floats near Mars (reuse `buildNova`, hidden placeholder pattern from home scene style — no full 3D model, focal point stays on planets).
   - "SKIP GUIDE" button (already exists for solar phase — retarget it here). Tutorial completion saved to localStorage (`tutorialDone`, already persisted).
3. **Labels (EN + BN)**
   - Under Mars: "MARS — Lost explorers. Forgotten missions." (existing `UI.mars`/`UI.marsDesc`), "🚩 PATHFINDER / SOJOURNER" chip.
   - Under Moon: "MOON — Machines, instruments, and forgotten hardware." + 🔒 LOCKED (existing strings, reused).
   - Screen title: "CHOOSE YOUR JOURNEY" (existing `UI.chooseJourney`).
   - New strings added to `src/data/content.ts` only where needed (e.g. planet hover hint).

## What gets removed / rewired

- **Old solar system is retired from the main flow** (the user already rejected it): the `JourneyChoice` 2D overlay panel is deleted; choosing a world now happens directly in the 3D universe scene.
- Engine rewiring in `src/game/engine.ts`:
  - `start` event → transition to `'universe'` (new phase) instead of `'solar'`.
  - New phase `'universe'` added to `Phase` type; `choose:mars` still → cinematic.
  - Clicking Moon (locked) → gentle shake + Nova says "Complete the previous mission first" (`UI.completeFirst`, reused).
- **`solar.ts` (MarsScene) is NOT deleted** — the chapter map (`'map'` phase) still reuses it. Only the old `'solar'` phase usage is dropped from the flow. SolarHUD and solar-only tutorial dialogue strings stay untouched for now.

## Files touched

- `src/game/scenes/universe.ts` — new scene (planets, starfield, hover/click).
- `src/state/store.ts` — add `'universe'` to Phase.
- `src/game/engine.ts` — phase wiring, `start` → universe.
- `src/components/Overlays.tsx` — new UniverseUI labels + Nova arrow overlay; delete `JourneyChoice` panel; retarget SKIP GUIDE.
- `src/data/content.ts` — reworded Nova tutorial strings for this screen (EN+BN), any new UI strings.
- `src/styles.css` — arrow bounce animation, planet-label styles.
- `AI_MASTER_CONTEXT.md` — progress log: mark 2 done/in-progress.

## Verification

- Typecheck passes; Playwright screenshots at 393px (mobile-first) and 1280px for the universe screen, EN + BN, hover state and locked Moon state.
- Full flow check: home → START ADVENTURE → universe → click Mars → cinematic begins.
