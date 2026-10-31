# Rift Makers — שוברי היבשות · game identity

**One line:** you are the spirit of the mantle, and heat is your only power. Set hot plumes and cold drips burning under a floating slab of living planet, commit to a stretch of deep time, and watch seas, mountains, trenches and volcanoes emerge from the flows. The pebble people (החצצים) tell you what they wish for; you read the evidence and advise them where to settle.

Genre reference (mechanics only): a god game seen as a floating diorama, like Reus's "giant shapes the planet for tiny people with wishes". The difference: you never touch the surface. You shape it **from inside**, through heat, and you can't take time back.

## The four verbs

| Verb | What the player does | Why it is geography |
|---|---|---|
| **Heat** | Drop a hot plume (פלומה חמה) or a cold drip (טפטוף קר) into the glowing mantle under the slab. Each level gives a fixed count of markers. Markers can be moved or lifted until the run starts. | Convection currents (זרמי ערבול) drive the plates: material spreads away from rising heat and is pulled toward sinking cold. |
| **Deep time** | Set a duration with the stepper (`- 6 מיליון שנה +`) and press **▶ הרץ**. Time only runs forward. The readout shows rate × time = distance before you commit. | 1 cm/yr for a million years is 10 km: slow, but it moves continents. |
| **Evidence** | Seismograph stations, the rock hammer, sea-floor age samples, heat-flow probes. Each gives a reading, never an answer. | How geographers know what they can't see. |
| **Advice** | Pin where the villagers settle, build their port or flee from a wave. One choice, then the consequence plays out. | Earthquakes and volcanoes follow plate boundaries; you can prepare, not predict. |

Boundaries **emerge**. The player never picks "pull / push / slide": the model compares the mantle flow on both sides of each seam and the type follows (apart, together or past each other). Continental crust meeting continental crust folds into mountains without volcanoes. Ocean meeting continent dives and builds a trench and an arc, and the arc rises above where the drip pulls the slab down.

## First 30 seconds (level 1)

1. 0–5 s: a starry void, a floating slab of green land. The front wall is cut away and lit: thin crust, orange churning mantle. Convection ribbons drift slowly.
2. 5–12 s: a villager waves a fishing rod: "אנחנו רוצים ים!". The heat tray glows: one hot plume.
3. 12–20 s: drag the plume into the mantle. The ribbons bend around it, and arrows on the surface show the flow spreading away from it.
4. 20–30 s: press **▶ הרץ 4 מיליון שנה**. The land splits along a glowing seam, sinks, and the sea rushes in with stripes of new basalt on either side of the ridge. The villagers cheer and launch a boat.

The tutorial says north is up and east is to the right (map convention, even though the UI is RTL), and a small compass on the slab repeats it.

## Controls

| Action | Mouse / touch | Keyboard |
|---|---|---|
| Orbit / zoom | right-drag or two-finger drag, wheel / pinch | Q / E rotate, + / − zoom |
| Place heat | drag a plume or drip from the tray into the mantle, or select it and tap the slab | 1 plume, 2 drip, then arrows + Enter |
| Remove heat | drag it back to the tray, or tap it and ✕ | Delete |
| Duration | − / + stepper | [ / ] |
| Run deep time | ▶ הרץ | Space |
| Evidence tool | tap the tool, then the slab | 3 / 4 |
| Advice | tap a site pin | Enter on the focused pin |
| Hint (costs a star) | 💡 | H |
| Pause, restart, mute | buttons | Esc or P, R, M |

Physical keys use `event.code`, so a Hebrew keyboard layout works. Restart keeps every heat marker where it was.

## Mistake and retry

A wrong layout makes the wrong landform, never a red X. Want a mountain but put a plume under it? The land sinks, the sea floods in and the villagers end up fishing on the valley floor. One Hebrew line says why ("הפלומה החמה משכה את הלוחות זה מזה…"). **התחילו מחדש** goes back to the start of deep time with your markers still placed, so the next try is a deliberate change. Hints point at evidence (flow arrows, ages, heat-flow, fossils), never at the answer, and cost a star. The final level has no hints and nothing labelled.

## Win and replay

Stars: the result met (1), no mistakes (2), the level's extra: a single run, few samples, the right prediction (3). A hint takes one star off. Levels unlock in order; each world ends with a transfer level, and World 4 ends with the no-hint Land of Israel final. Afterwards, **הזמנות כוכב** offers solver-checked generated commissions.

## Camera

A 3/4 orbit camera over the slab with the cutaway wall facing the player, clamped so the wall stays readable. Camera shake follows quakes (off under reduced motion).

## Art

A floating diorama in a dark starry void. Warm and dramatic: glowing orange magma and convection ribbons in the cutaway, red-hot plumes rising, blue-black drips sinking, cool blue seas, white peaks, dark basalt, cream limestone, pale kurkar. Rifts crack open with glowing seams, folds rise with dust, volcanoes cough smoke rings, the sea floods in with a whoosh. Villagers, the scientist, the dog, boats and houses are Tripo models (villager and scientist rigged and animated); terrain, water, strata, heat and UI are procedural.

## Sound

Procedural WebAudio only: a low mantle drone that rises while time runs, rumbles scaled by magnitude, a crackle when a seam opens, a whoosh when the sea floods, villager chirps (happy / panic), a sting on success. Mute with M.

## Not like the existing games

Mechanics we must not duplicate (from `docs/handoff/EXISTING.md`), and how Rift Makers differs:

| Existing game or sim | Its verb | Rift Makers instead |
|---|---|---|
| PlateBoundaryLab (plate-tectonics) | pick a boundary type and crust types; the landform morphs | no type picker anywhere: heat in the mantle, and the boundary type emerges from the flows |
| EarthLayersDrillLab (earth-structure) | drag a depth slider to drill down; gauges | no depth slider: seismograph stations on the surface, and the liquid layer is inferred from which waves arrive |
| RockCycleExplorer (rocks-minerals) | click processes on a cycle wheel | no process buttons: heat and time make rift basalt, exposed granite and squeezed marble, and the hammer collects them |
| EarthquakeReadinessLab (earthquakes-volcanoes) | spend a preparedness budget, run a quake | no budget: one site choice per town, judged against boundaries you built; 413 is a one-time story unlock |
| IsraelLandformBeltsLab (landform-belts) | drag process chips onto a cross-section | no chips: the belts emerge from heat placement and time; the coastal plain is built automatically by external processes |
| IsraelLandscapeMixerLab (landscape-diversity) | dials for altitude, rain and distance | no dials: the landscape is read from the slab |
| WeatheringErosionLab, RiverFlowSculptorLab | sculpt erosion and rivers | no sculpting: the surface is never edited directly; erosion and deposition happen on their own over deep time |
| Basin Breakers | cut and raise terrain, release water, **rewind** | no terrain cutting, no rewind: time runs forward only |
| Frost & Flame | heat and cold gloves, held and charged | heat is a fixed count of placed markers, never held, charged or metered |
| Storm Proof | probe, assign, size, commit | no sizing or assigning: you place heat, pick a duration, and advise |

## Review checklist: forbidden verbs

Checked against the code (`src/model/session.ts` public methods and `src/ui/`) before each commit:

- [x] No boundary-type picker. `Session` has no method that sets a boundary type; `seamMotion()` derives it.
- [x] No depth or drill slider. Level 2 uses `placeStation` / `fire` / `mark`.
- [x] No rock-cycle buttons. Level 16 has only heat, duration and `hammer(x, z)`.
- [x] No budget sliders. Levels 13, 15 and 18 are choices (`chooseCopy`, `chooseTownSite`), not spending.
- [x] No process chips. Level 18 builds the belts from heat; kurkar is deposited automatically.
- [x] No direct terrain sculpting. The heightfield is generated from plate state only (`terrain.ts`).
- [x] No back-and-forth time scrubbing. `advance()` ignores negative steps, and `setDuration()` is locked once a run starts (tested in `tests/levels.test.ts`).
- [x] 413 is a story unlock in level 15, never something bought.
- [x] Restart keeps heat placements (tested).
