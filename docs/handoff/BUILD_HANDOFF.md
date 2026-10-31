# Rift Makers — שוברי היבשות — build handoff

Read `../COMMON.md` first. Repo `/Users/acedzn/dev/AceDZN-exp/rift-makers` → public `AceDZN/rift-makers`, port 5243 (preview 4243).

## Promise

A god game in deep time, in the style of From Dust and Reus. On a floating slab of living planet, with a glowing **cutaway** down the side showing crust, mantle and core, you're the spirit of the mantle. Draw a crack across the land, choose **push**, **pull** or **slide**, and scrub the deep-time slider by millions of years. Continents crash together and fold into mountains. An ocean plate dives under a continent and leaves a trench and a ring of smoking volcanoes. A rift tears open, sinks into a valley and floods into a new sea with stripes of young basalt. A transform fault rips a river sideways. Your tiny villagers (the **חצצים**, pebble people) want things: a sea to fish, fertile volcanic soil, a hot spring, a mountain for snow. They panic when stress builds on a fault, and if you've left them in the wrong place without Standard 413 retrofits, the quake knocks their houses down in a slapstick way they can recover from. The finale has you build the Land of Israel: the sandy kurkar coastal plain, the limestone mountain ridge whose marine fossils rose 700 m above the sea, the sinking rift with the lowest point on land, and Golan basalt.

Map evidence: From Dust × Reus (related, density 0.681); From Dust × WorldBox (0.713) and Teardown × From Dust (0.761, crowded) are the alternatives. Keep it different from River Carver (a reserve idea): here you shape the planet from inside. Water and wind only show up as external processes.

## Curriculum (Workbook grade 8 chapter 4, grade 9 chapter 2)

Grade 8 ch. 4: [earth-structure](https://geography.workbook.co.il/grade-8/chapter-4/earth-structure), [plate-tectonics](https://geography.workbook.co.il/grade-8/chapter-4/plate-tectonics), [earthquakes-volcanoes](https://geography.workbook.co.il/grade-8/chapter-4/earthquakes-volcanoes), [rocks-minerals](https://geography.workbook.co.il/grade-8/chapter-4/rocks-minerals).
Grade 9 ch. 2: [landform-belts](https://geography.workbook.co.il/grade-9/chapter-2/landform-belts), [landscape-diversity](https://geography.workbook.co.il/grade-9/chapter-2/landscape-diversity). Optional: [weathering-erosion](https://geography.workbook.co.il/grade-8/chapter-5/weathering-erosion) for the external processes.
Snapshots are in `/Users/acedzn/idea-plotter/reports/geography-games-2026-10-31/curriculum/`.

Rules, from the modules (pure TS; the heightfield is generated from this state):
- **Structure:** crust (קרום), mantle (מעטפת) with magma (מגמה), liquid outer core and solid inner core (solid because of pressure, though hotter). Scientists "see" inside with seismic waves (גלי הדף, a seismograph), and that's how we know the outer core is liquid. The magnetic field is tied to the core. **Internal vs. external processes:** internal ones (tectonics, volcanism) build relief; external ones (weathering, erosion, deposition) wear it down.
- **Plate tectonics:** convection currents in the mantle (זרמי ערבול) drive the plates at **2–7 cm per year**: slow, but millions of years move continents thousands of km (game math: distance = rate × time, shown on the slider). There are three boundary types, each with its own landforms:
  - **Divergent (מתרחקים):** a mid-ocean ridge (the Mid-Atlantic), a new sea floor that's younger near the ridge, and rift valleys.
  - **Convergent (מתקרבים):** continent–continent makes fold mountains (the Himalaya is still rising, while the old Appalachians are low and eroded); ocean under continent is **subduction** (סובדוקציה): trench, magma, a volcanic arc and strong quakes (the Ring of Fire around the Pacific).
  - **Transform (מחליקים זה לצד זה):** earthquakes, offset features.
  - Wegener's continental drift: the evidence (fitting coastlines, fossils, rocks) and why the scientific critique mattered.
- **The Syrian-African rift (הבקע הסורי-אפריקני):** the African and Arabian plates. **Workbook uses two framings:** plate-tectonics says the plates "move apart (~5–7 mm/yr)", and landform-belts says they "move side by side and the ground between them sank". Teach exactly the Workbook wording in each level and don't contradict either. The game can model the Dead Sea rift as plates sliding past each other with a sinking block between them, which shows both facts. It explains the Jordan Valley, the Kinneret, the Dead Sea (the lowest point on land), the Gulf of Eilat, Israel's earthquakes and the 1927 Jordan Valley quake.
- **Earthquakes and volcanoes:** stress builds along boundaries and is released as a quake; magma erupts there too, so both cluster along plate boundaries. Focus vs. epicenter (מוקד, מוקד-על if the module uses it; check). **Richter** measures energy objectively: 2 units = ~100× the shaking and ~1,000× the energy (module). **Mercalli** measures damage, which depends on construction. That's why Haiti's 7.0 killed far more than Japan's 9.0. Quakes can't be predicted precisely; Israel prepares with **Standard 413** (תקן 413, earthquake-resistant construction required for new buildings; it reduces damage and doesn't predict quakes). Tsunami (צונאמי).
- **Rocks and the rock cycle:** igneous (יסוד: basalt cools fast at the surface, granite slowly underground), sedimentary (משקע: limestone, chalk, fossils form under seas), metamorphic (תמורה: marble from limestone under heat and pressure); one cycle connecting them all. Marine fossils in the Jerusalem hills, 700+ m up, mean an ancient sea and later uplift.
- **Israel's landform belts:** the coastal plain (מישור החוף), sand and kurkar ridges carried by rivers, sea and wind (deposition); the mountain ridge (אזור ההר), limestone and chalk, the national watershed (קו פרשת המים) with streams flowing west to the Mediterranean and east to the Jordan rift; the rift (הבקע), a sunken block hundreds of metres below sea level. Golan basalt points to volcanism.
- Hebrew terms: קרום, מעטפת, גלעין חיצוני / פנימי, מגמה, לבה, לוח טקטוני, גבול לוחות, זרמי ערבול, רכס מרכז-אוקייני, סובדוקציה, שבר, בקע, נדידת היבשות, רעידת אדמה, מוקד, סולם ריכטר, סולם מרקלי, תקן 413, צונאמי, הר געש, טבעת האש, סלעי יסוד / משקע / תמורה, מחזור הסלעים, מאובן, בזלת, גיר, קירטון, שיש, כורכר, רצועות האורך, פרשת מים, תהליכים פנימיים / חיצוניים.

Misconceptions to catch: plates move fast or only during quakes; the crust "floats on lava"; all mountains are volcanoes; every collision makes volcanoes (continent–continent mostly doesn't); a higher magnitude always means more deaths; quakes can be predicted precisely; fossils on mountains mean the sea once rose that high (rather than the land rising); every rock is the same "stone"; the core is liquid all the way through.

## Loop and controls

- **Shape:** an isometric/orbit camera over the slab. Draw a boundary (snapping to the plate grid), pick its type (push/pull/slide) and the plate types (oceanic/continental) when the level allows, then scrub the **deep-time slider** (million years; the HUD shows rate × time = km moved). The terrain, sea, volcanoes and faults grow from the pure model in real time. The cutaway updates (convection arrows, magma, a subducting slab).
- **Villagers and wishes:** the חצצים move in, drawn by sea/soil/springs/snow. They build houses, which you can upgrade to "413" from a small budget, and they fear stress meters on faults. Quakes trigger when stress crosses a threshold (deterministic in tests, with telegraphed signs in play: cracks, a nervous dog).
- **Probe tools** (later worlds): a seismograph probe (which waves arrive where), a rock hammer (identify igneous/sedimentary/metamorphic in the cutaway), and a time-lapse camera.
- **Consequences:** a wrong boundary type makes the wrong landform. Villagers who wanted a sea get a mountain and sulk with fishing rods on a peak. A quake with no 413 retrofits brings slapstick collapses and dust, then villagers climbing out and rebuilding (never death or gore). Each comes with a replay of the cutaway and one Hebrew line ("this is a collision between two continents; no plate sinks, so there are no volcanoes").
- Hint (logged, costs a star): highlights the evidence (fossil, rock type, ages of the sea floor) and never the boundary type.

## Levels (author exactly; tests prove each; 18 total)

**World 1 — Inside the Earth · בבטן כדור הארץ** (earth-structure)
1. **Slice it open:** cut the cutaway and drop a probe through the crust, mantle, outer core and inner core. Each layer reacts (tutorial).
2. **Liquid or solid:** seismograph puzzle. Place three stations, see which waves don't cross the outer core, and mark the liquid layer.
3. **The convection engine:** heat the mantle under the slab. The convection cells start, and the plates above move in the direction of the surface flow. Predict which way the two plates will move before you scrub time.
4. **Inside or outside:** a living landscape. Tag what's being shaped by internal forces (a volcano, an uplift) and by external ones (a river canyon, dunes); a wrong tag mis-sculpts the landscape.
5. **Transfer, the quiet planet:** a new planet. From probe data alone, decide where the plates' engine is and where the first boundary will open.

**World 2 — Plates on the Move · לוחות בתנועה** (plate-tectonics)
6. **Pull apart:** open an ocean. A mid-ocean ridge rises and basalt stripes form; the sea floor is youngest at the ridge. Villagers want a fishing sea of a given width: compute the time from 5 cm/yr.
7. **Continent meets continent:** fold the Himalaya. No volcanoes appear, and the peak keeps rising. Compare with an old range that's eroded and low (the time slider shows erosion winning).
8. **Ocean dives under:** subduction. A trench, a volcanic arc and strong quakes. The villagers want fertile volcanic soil but not on the fault: place them.
9. **Slide past:** a transform fault tears a river and a road sideways. Use it to reconnect a split village.
10. **Transfer, Wegener's puzzle:** reassemble the scattered continents using coastline fit, fossil types and rock belts, then run time forward to today. The critics (rigged scientist NPCs) only accept the fit when the evidence matches.

**World 3 — Shake and Burn · רועד ובוער** (earthquakes-volcanoes)
11. **Ring of Fire:** place volcano and quake observatories where the activity will be. Boundaries only; a wrong placement wastes the budget.
12. **Magnitude:** two quakes 2 units apart. Predict which village shakes 100× more and prepare it.
13. **Haiti or Japan:** the same budget, two towns. The bigger quake with 413 buildings does less damage than the smaller one without them, and you choose where to spend.
14. **Tsunami:** a subduction quake offshore. Place warning towers and high-ground paths before the wave.
15. **Transfer, Jordan Valley 1927:** a historical setting. The quake on the rift: retrofit Jerusalem and the valley towns, then run the recorded event. It can't be predicted precisely, so the stars come from preparation, not timing.

**World 4 — Rocks and the Land of Israel · סלעים וארץ ישראל** (rocks-minerals, landform-belts)
16. **The rock forge:** make basalt (fast-cooling lava), granite (slow underground), limestone with fossils (sea floor) and marble (pressure and heat on limestone). The cycle is one loop and every rock can become another.
17. **Fossils at 700 m:** the Jerusalem hills hold marine fossils. Lay down sediment under an ancient sea, then uplift. Villagers who think "the sea was 700 m deep" are proven wrong by the cutaway.
18. **Final, building the Land of Israel (no hints):** a blank slab between the sea and the desert. Create the rift (the sinking block between sliding plates, the lowest point on land), the limestone ridge (the watershed, with streams going west and east), the kurkar coastal plain (deposition from the sea, rivers and wind) and Golan basalt. Then survive a final rift quake with 413 towns. Nothing is labeled.

After the authored levels work, add generated "planet commissions" from a solver (villager wishes + a constraint). Verify each is solvable, and verify that "always push" and "random boundaries" fail.

## 3D and art

A floating diorama slab in a dark, starry void, warm and dramatic: glowing orange magma and convection ribbons in the cutaway, cool blue seas, white peaks, dark basalt, cream limestone, and pale kurkar dunes. Satisfying deformation: folds rise with rumble and dust, rifts crack open with glowing seams, volcanoes cough smoke rings, the sea floods in with a whoosh. The terrain is procedural from the pure model (folding and rifting as smooth heightfield operations plus layered strata in the cutaway); the final Israel slab is checked against bundled SRTM relief for the right belts and the Dead Sea depth (stylized). Tripo (search the library and assets first, then generate): **rigged חצצים villagers** (Mixamo: idle, cheer, panic, fall/get-up, build), a **rigged dog** that senses quakes (quadruped), **rigged scientist NPCs** (Wegener and a critic), houses with a "413" upgrade variant, a seismograph station, a volcano observatory, a fishing boat, a hot spring, a fossil ammonite prop and the tsunami warning tower.

## Acceptance

In the first 30 seconds: slice the slab open, see the glowing layers, drop the probe, then draw your first crack and *pull*. The land splits, sinks and floods into a new sea with basalt stripes while the villagers cheer and launch a boat. Then in Level 7, try *pull* where the villagers asked for a mountain and they end up fishing on a valley floor, with the one-line explanation. All layer, boundary, landform, rate × time, magnitude/energy, damage and rock-cycle results come from the pure modules. Tests cover all 18 levels, the three boundary types and their landforms, continent–continent without volcanoes, the 2-unit = ~1,000× energy rule, 413 vs. magnitude, and that a constant strategy fails.
