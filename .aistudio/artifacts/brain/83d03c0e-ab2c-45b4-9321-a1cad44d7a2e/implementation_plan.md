# Implementation Plan — Dynamic Background Animations for Universe Scene

Add rich, interactive 3D background visual effects (starfield parallax, comets, and distant horizon impact flashes) to make the space scene vibrant, cinematic, and responsive.

## Proposed Features

### 1. Interactive Two-Layer Starfield & Parallax

- **Deep Space Layer**: High-density twinkling stars with GPU-based phase shimmer.
- **Foreground Interactive Layer**: Near-camera stars reacting to mouse speed and cursor movement with depth parallax, brightness boost, and subtle particle sparkles.

### 2. Comets & Shooting Stars

- **Periodic Spawns**: Every 3–6 seconds, a fast comet streaks across deep space.
- **Neon Trail Effect**: Glowing cyan-gold leading head with a fading trailing line/ribbon that smoothly dissolves.

### 3. Distant Horizon Meteor Impacts

- **Horizon Strike**: Occasional distant meteor descending toward the horizon ridge (every 12–18s).
- **Shockwave & Flash**: Soft non-intrusive neon horizon flash + expanding subtle dust/ring pulse that gracefully dissolves without obscuring UI cards.

### 4. Additional Polish Ideas

- **Satellite Orbital Crossing**: A faint satellite / orbital probe crossing over Earth's limb.
- **Atmospheric Solar Wind Ionization**: Subtle pulsing aurora-like shimmer on Earth's atmospheric rim.

## Proposed Code Changes

### `src/game/scenes/hub.ts`

- Add two-layer starfield logic with CPU/GPU parallax offset in `update()`.
- Add `ShootingStarSystem` class/module inside `hub.ts` managing comet trajectories and trailing geometry.
- Add `HorizonImpactSystem` managing distant meteor entry, horizon flash sprites, and expanding ring meshes.

## Verification Plan

- Run `compile_applet` and `lint_applet` to verify zero build errors or memory leaks.
- Test in both Mars and Moon modes to verify clean performance (60fps) and non-intrusive visuals.
