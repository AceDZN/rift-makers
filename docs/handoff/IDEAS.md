# Geography 3D games (Claude Code lead): ten ideas, three picks, one duplicate removed

31 October 2026. The user asked for 5–8 fun, real-3D, web-based educational games, with at least three geography games for Hebrew-speaking students in grades 7–9 on the Workbook geography curriculum ([grade 7](https://geography.workbook.co.il/grade-7), [grade 8](https://geography.workbook.co.il/grade-8), [grade 9](https://geography.workbook.co.il/grade-9)), each with its own builder thread. The plan was to find the best 10 ideas on the Idea Plotter map, pick the best 3 and build them, each with 10–20+ levels.

**Two things changed the plan the same day:**
1. A Codex planning chat ran the same commission in parallel and launched **Windshift Riders**, **Basin Breakers** and **Rush Hour Israel** (its files: `handoffs/geography-2026-10-31/`, `reports/geography-games-2026-10-31/`). Both sessions wrote into those folders, so this lead's files moved to `handoffs/geography-claude-2026-10-31/` and here.
2. The user's rule: "You must make sure the games you suggest are not the same as the games we built already for the workbook … Last thing I want is to duplicate mechanics in our different games." The inventory is in [`EXISTING.md`](EXISTING.md): one interactive sim on each of the 72 Workbook geography modules, plus the three Codex games.

Result: **Cloud Shepherd is paused**, because it duplicated Windshift Riders (flight over Israel's weather: breezes, windward/lee, rain shadow). **Tilt World and Rift Makers continue with reworked verbs** so they don't reuse the Workbook sims' interactions. Five geography games are now in progress across both sessions.

## The curriculum and what suits 3D

| Grade | Chapters | Fit for a fun 3D game |
|---|---|---|
| 7: human geography | 1 globalization, 2 spatial inequality, 3 population, 4 migration, 5 rural and urban settlements | Mostly maps and data. Rush Hour Israel now covers city structure, location factors and core/periphery. |
| 8: earth sciences | 1 universe and solar system, **2 earth's motions**, **3 weather and climate**, **4 internal processes**, 5 weathering, erosion and landforms, 6 natural resources | The strongest 3D material. Windshift Riders covers weather; Basin Breakers covers water and erosion. |
| 9: Israel | 1 Israel in the Middle East, **2 landscape systems**, 3 the water system, 4 population and settlements, 5 economy and infrastructure, 6 environment and sustainability | Landform belts and the rain gradient are real 3D relief. Basin Breakers covers the water system; Rush Hour Israel covers transport. |

40 module snapshots are in [`../geography-games-2026-10-31/curriculum/`](../geography-games-2026-10-31/curriculum/) (files `grade-N_chapter-M_<module>.md`; the `g7-*`/`g8-*`/`g9-*` files there are the Codex chat's). They were fetched from the Workbook Markdown API on 31 Oct 2026.

## What the map showed

1. **Explorer** (Idea Plotter at http://localhost:3010, with the full 73,466-game map loaded in the built-in browser). The From Dust inspector shows originality 54.2 %, closest twin 0.701 (The God), and a typical twin of 0.709. Seed originality percentiles are in [`seed-originality.txt`](seed-originality.txt): Outer Wilds 96.8, Gorogoa 96.1, Solar Ash 95.2, Alba 94.5, Flower 74.7, Katamari Damacy REROLL 69.3, From Dust 54.2, Reus 51.8; crowded: Teardown 7.7, Townscaper 12.9, Dorfromantik 12.9, ISLANDERS 15.4, Mini Metro 20.2.
2. **Blend measurement.** I measured 24 pairs with the map's own blend code ([`measure-pairs.py`](measure-pairs.py), the same metrics as the math rounds, on the pinned 73,466-game corpus): [`pair-evidence.csv`](pair-evidence.csv) / [`.json`](pair-evidence.json). 19 pairs pass the relatedness gate. Lower density means an emptier region.

| Blend (seeds) | Topic | Density ↓ | Used for |
|---|---|---:|---|
| Flower × Katamari Damacy REROLL | weather, climate | 0.614 | #1 Cloud Shepherd, **paused** (duplicates Windshift Riders) |
| **Outer Wilds × Solar Ash** | earth's motions, seasons | **0.617** | **Tilt World** |
| Alba × Firewatch | Israel landscapes | 0.623 | Landscape Detective |
| Firewatch × A Short Hike | Israel landscapes | 0.627 | (Landscape Detective alt.) |
| Plague Inc: Evolved × Mini Metro | migration, globalization | 0.657 | Push & Pull |
| Kerbal Space Program × Outer Wilds | solar system | 0.679 | Slingshot Atlas |
| **From Dust × Reus** | plate tectonics, landform belts | **0.681** | **Rift Makers** |
| Timberborn × Station to Station | Israel's water system | 0.700 | Water Grid (now covered by Basin Breakers) |
| From Dust × Timberborn | erosion, landforms | 0.701 | River Carver (overlaps Basin Breakers / RiverFlowSculptorLab) |
| Townscaper × Frostpunk | city structure | 0.744 | City in Layers (now covered by Rush Hour Israel) |
| Dome Keeper × Deep Rock Galactic | earth structure, rocks | 0.748 | Deep Drill (overlaps EarthLayersDrillLab) |

Failed relatedness: Untitled Goose Game × Flower, Katamari × From Dust, Pacific Drive × Mars First Logistics, Timberborn × Mini Metro and Descenders × From Dust. These figures are measured evidence only: G1 is pending, there was no optimizer run, and no originality is certified.

## The ten ideas, after the duplicate check

Scores 1–5: Fun, Geography drives play, 3D matters, Build, Gap. "Dup" names what an idea collides with.

| # | Idea | Topic (grade) | Total | Dup | Status |
|---|---|---|:-:|---|---|
| 1 | Cloud Shepherd | weather + Israel's climate | 24 | Windshift Riders (core flight over the same weather), SeaBreezeLab, IsraelRainTransectLab, ClimatographDetectiveLab | **paused** |
| 2 | **Tilt World — עולם נטוי** | earth's motions (8 ch. 2) + sun energy (8 ch. 3) | 24 | was: SeasonTiltOrbitLab / DayNightSpinExplorer / MoonPhaseTideLab drag verbs, AlbedoBalanceLab, ClimatographDetectiveLab | **building; verbs reworked** |
| 3 | **Rift Makers — שוברי היבשות** | tectonics, quakes, rocks (8 ch. 4) + landform belts (9 ch. 2) | 23 | was: PlateBoundaryLab picker, EarthLayersDrillLab, RockCycleExplorer, EarthquakeReadinessLab, IsraelLandformBeltsLab; Basin Breakers' terrain sculpting | **building; verbs reworked** |
| 4 | Landscape Detective | Israel landscapes (9 ch. 1–2, 4) | 21 | partly CulturalLandscapeReaderLab / GlobalLandscapeSpotterLab / IsraelLandscapeMixerLab (reading a scene); the GeoGuessr place-the-pin loop is new | candidate |
| 5 | Water Grid | water system (9 ch. 2–3) | 20 | Basin Breakers | dropped |
| 6 | River Carver | erosion, landforms (8 ch. 5) | 20 | Basin Breakers, RiverFlowSculptorLab | dropped |
| 7 | Slingshot Atlas | universe and solar system (8 ch. 1) | 19 | partly OrbitalSpeedExplorer; a gravity-assist flight is new | candidate |
| 8 | Push & Pull | migration + globalization (7 ch. 1, 4) | 18 | MigrationPushPullLab (push/pull balance) | weak |
| 9 | City in Layers | city structure (7 ch. 5) | 17 | Rush Hour Israel, CityBellSkylineLab | dropped |
| 10 | Deep Drill | earth structure, rocks (8 ch. 4) | 17 | EarthLayersDrillLab | dropped |

### Tilt World — reworked
A pocket-sized Earth and a solar-powered photographer robot hunting sky events. **The Earth, the Sun and the Moon can never be spun, dragged or dialed**: that's what the Workbook sims do. Time only moves forward, through commitments: sleep a number of hours or days chosen before you see the result, or take one ticket on the calendar train to a date. You win by working out where and when an event happens, committing, and getting there on foot. Albedo becomes a predict-then-shoot thermal photo, and the climograph level becomes "Where am I?" (latitude from the noon Sun). No cloth glider (Rooftop Radio).

### Rift Makers — reworked
A god game where **heat is your only power**. You place hot plumes and cold drips in the mantle, commit a stretch of deep time, and the boundaries *emerge* from the flows: you never pick a boundary type (PlateBoundaryLab). There's no drill slider, no rock-cycle buttons, no preparedness budget, no process chips and no direct terrain sculpting. Rocks are produced by the conditions you create, and villagers ask you where to settle on the plate map you made.

## Why Cloud Shepherd isn't replaced automatically

With the Codex chat's three games, five geography games are already in progress, which is inside the user's 5–8 range. A third Claude Code game would come from the candidates above. Landscape Detective (GeoGuessr-style deduction in 3D Israeli landscapes) is the strongest distinct one, and Slingshot Atlas (solar-system gravity assists) is the other. The user decides whether to add one.

All of these are hypotheses until students play them.
