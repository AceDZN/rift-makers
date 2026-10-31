# Progress

Build log for Rift Makers, newest last. Dates are 2026-10-31 unless noted.

## 1. Scaffold (`f4d5e4e`)

Vite + TypeScript + Three.js, ports 5243 (dev) and 4243 (preview), handoff copies in `docs/handoff/`, Workbook curriculum snapshots, first GAME_IDENTITY.md.

## 2. Heat-driven redesign (`834f6fe`)

The lead session changed the core verb: heat is the player's only power. Rebuilt the model around it:

- `heat.ts`: plumes push, drips pull; each seam reads the local flow across and along it, so the boundary type emerges (pull, push, slide) with a rate in cm/yr.
- `terrain.ts`: base shapes, then each boundary deforms the heightfield (rift, ridge, trench and arc, folding, offset), volcanoes and deposits, then water (sea from the edges, closed basins become lakes).
- `session.ts`: one level's state machine (plan → running → review/done) with forward-only time, restart that keeps heat, hints that cost a star, mistakes deduplicated, and the evidence tools (stations, probes, sea-floor ages, the rock hammer, site advice, quakes, tsunami evacuation).
- `levels.ts`: 18 levels in 4 worlds, calibrated so each authored solution wins and the misconception fails.
- Tests: every level solvable with 3 stars; boundary types emerge; continent–continent has no volcanoes; 2 units ≈ 1,000× energy; site choice; constant and random strategies fail.

## 3. Scene, HUD, controller (`1704bbd`)

One canvas: floating slab with strata walls, mantle cutaway shader with convection ribbons driven by the heats, water shader, heat markers, flow arrows, seams, volcano smoke, Tripo actors with role clips, a globe for level 2. HUD in Hebrew RTL: title and stars, round buttons, timeline (forward only), rate × time readout, duration stepper, run button, heat tray, per-kind panels, intro/result/review/pause cards, level select with stars and locks.

## 4. Browser playtest fixes (`90a797f`)

Played level 1 by hand in the browser pane (success, mistake, hint, restart, drag to move). Fixed: the intro click paused the game (only a running simulation pauses on blur now); camera now fits the slab to any aspect; houses and trees ride their plate (they used to float in the new sea); duplicate toast under the result card; pins that overlapped now stack; the result card sits beside the landscape on wide screens; phone layout (buttons stack down the side, the title keeps its width, pin choices live on the map); water colour by real depth in km. Added `scripts/drive.mjs`, which plays all 18 levels in a real browser through the controller and screenshots each.

## 5. Real relief, visuals (`903040d`)

- Level 18's rift floor is read from a bundled ETOPO1 subset (NOAA, public domain), lake beds from published depths. `tests/israel.test.ts` checks the built slab against the real cross-section and Dead Sea level.
- Bug: a dry basin rim was being filled again as a second, higher lake, so whole valleys flooded in terraces. Fixed with a visited flag; the final now has one Dead Sea at −424 m.
- Visuals toward the targets: tighter camera, stronger relief, sunset glow behind the slab, drifting rock chunks, tree clumps on green land, quieter mantle until you add heat, a glowing core band.

## 6. Docs, rules tests, independent playtest

README, LEVELS.md verified solutions, `tests/rules.test.ts` (rate × time, sea-floor age, rocks, level-17 sea level), visual review, playtest report.

## Open

- Planet commissions (generated, solver-checked levels after the 18).
- Rivers and a fed Kinneret.
- Recorded sound effects.
