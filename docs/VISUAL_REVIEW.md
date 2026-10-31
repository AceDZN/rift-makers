# Visual review: real captures against the targets

Captures are real browser screenshots at 1280×800 (and 375×740 for phone checks), made by `scripts/drive.mjs`, which plays each level through the game controller. Targets are the generated mockups in `docs/visual-targets/` (design targets, not screenshots). Checklist: `docs/visual-targets/CHECKLIST.md`.

Verdicts: **match** (reads the same), **partial** (the idea is there, the finish is not), **gap** (missing).

## 01 First 30 seconds → `screenshots/L01-plan.png`, `screenshots/L01-end.png`

| Checklist item | Verdict | Notes |
| --- | --- | --- |
| One floating slab, crisp faces, starry void, drifting rock chunks | match | Rock chunks drift beside and behind the slab, never in front of it. |
| Camera 3/4 from the front-left, top and cutaway both visible | match | Fits the slab to any aspect; the slab fills about 60–70% of the width at 1280×800, less than the 80–90% target, so the HUD bars never cover it. |
| Thin crust strata, orange mantle, glowing core | match | Core band glows at the bottom of the cutaway. |
| Plume: bright column from a ring, ribbons that split under the crust | partial | Bright column and ring, convection ribbons follow the heat, but they read as closed loops, not open split ribbons, and there are no big arrows in the cutaway (the arrows are on the surface). |
| Sea opens with waterfalls and dust | partial | The sea opens over the run with a crisp shore and depth colour; no waterfalls or dust puffs yet. |
| Villagers cheer, a boat appears | match | Rigged pebble villagers play their cheer clip; the boat model appears on the new sea. |
| Grass with dark tree clumps, warm light | match | Tree clumps on green land; warm sun from the back with soft shadows; a low sunset glow behind the slab. |
| HUD: round buttons top-left, title pill with stars top-right, timeline, readout `rate × time = distance` in LTR, stepper, big orange run button, heat tray with 1/1 counters | match | Panels are navy, not cream: kept for contrast in a dark scene. |
| No push/pull/slide buttons, budget, depth slider or scrubber | match | |

## 02 Subduction and quake → `screenshots/L08-end.png`, `screenshots/L11-end.png`, `screenshots/L13-end.png`

| Item | Verdict | Notes |
| --- | --- | --- |
| Ocean plate dives, deep trench at the coast | match | The trench is a visible notch in the slab's front face. |
| Arc of volcanoes inland with smoke | match | Smoke sprites rise from the arc; the arc lands over the fields. |
| Shake, red magnitude starburst, seismograph | partial | Camera shake and a magnitude burst; the seismograph station model stands by the towns in levels 12, 13 and 15; the drum trace is a panel line, not an animated drum. |
| Villagers duck/panic, the dog senses the quake | partial | Panic clip plays; the rigged dog (levels 13 and 15) bolts when the ground shakes, but not ahead of it. An observatory watches the arc in levels 8 and 11; a warning tower stands on the cliff in level 14; an ammonite sits by the fossil hunter in level 17; a hot spring steams by the Dead Sea in level 18. |

## 03 Mistake in the valley → `screenshots/L07-mistake.png`

| Item | Verdict | Notes |
| --- | --- | --- |
| Valley opened where a mountain was wanted | match | Level 7 with a plume opens a sea between the villages. |
| Villagers sulk, with fishing rods | partial | They fall and a bubble says "🎣 רצינו הר…"; no fishing-rod props. |
| Card: "oops" title, one–two line explanation, retry and hint | match | "לא בדיוק…", the line about what the plume did, restart (heat stays) and level select. The hint is the 💡 button at the top. |
| Dusk lighting | gap | One lighting setup for all levels. |

## 04 Level select → `screenshots/select.png`

| Item | Verdict | Notes |
| --- | --- | --- |
| Four worlds with numbered levels, stars, locks | match | Cards per world, stars per level, locked levels show a lock and are disabled. |
| Total stars, continue button | match | "★ 17/54" and "המשך · שלב N". |
| A diorama per world and a cut-open globe | gap | The select screen is flat cards over the starry void. |

## 05 Israel final → `screenshots/L18-mid.png`, `screenshots/L18-end.png`

| Item | Verdict | Notes |
| --- | --- | --- |
| Coast with sand, limestone ridge, deep rift with the Dead Sea, dark basalt plateau in the north-east | match | Built by the player's heat; the rift floor comes from real ETOPO1 relief and the Dead Sea settles at −424 m. |
| Cream limestone and kurkar, sandy coast, Mediterranean blue | match | |
| Trees and villages on the ridge | partial | Sparse scrub on limestone; towns appear at the sites the player picks; no terraces or palms. |
| 413 shields on houses | match | The house413 model with a floating green "413" shield (levels 13–15, 18). |
| Plumes and drips glowing in the cutaway with arrows | partial | Columns glow; loops instead of arrows. |
| Slab proportions | partial | The final slab is deeper than it is wide (200 × 260 km) because the rift runs north–south; the target shows a wide slab. |

## Phone width (375×740) → `scratch` captures during the build, re-made by `W=375 H=740 node scripts/drive.mjs`

- Round buttons stack down the left edge; the title keeps its width.
- The heat tray sits above the timeline; the run button stays reachable.
- In the choice levels (14, 15, 18) the pins on the map are the choices; the panel keeps only what is picked, so the slab stays visible.
- The result card sits at the bottom and covers the lower half of the slab: acceptable on a phone, the landscape is visible above it.

## What would close the gaps next

1. Open, splitting convection ribbons and big arrows in the cutaway (target 01, 05).
2. Waterfalls and dust when a sea floods in; fishing-rod props for the level-7 sulk.
3. A diorama level-select screen.
4. Per-world lighting (dusk for mistakes).
