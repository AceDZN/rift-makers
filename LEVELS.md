# Rift Makers: levels (draft)

Owner: level designer + geography reviewer.

**Status:** implemented. Every level's "Verified solution" below is the layout the tests use (`tests/solutions.ts`); each wins with 3 stars through the same session calls the UI makes, and in the browser through `scripts/drive.mjs`.

Sources:
- Geography facts and quotes: `docs/FACTS.md`. Its §n sections and S-items (source inconsistencies) are referenced below.
- Curriculum mapping: `CURRICULUM.md`.
- Setup numbers are **OURS** tuning unless a module is quoted.

**Player verbs (only these four):**
1. Place a limited number of **hot plumes / cold drips** on the mantle grid.
2. **Commit** a forward-only duration.
3. **Read** evidence: seismograph, rock hammer, sea-floor ages, temperature readings.
4. **Advise** villagers on a site, once.

**Solver rules for every heat level.** The solver test must show three things:
- (a) The authored solution wins.
- (b) **"One plume in the middle"** fails.
- (c) **Random heat** fails. Over N seeded random placements (same count and type mix as allowed), the win rate stays under a threshold (proposed: ≤ 5%).

Site-choice levels (L12–L15, L18 last step) also check that "always the farthest/highest corner" and "always next to the wish" fail.

**Stars (proposal).**
- ★ win.
- ★★ win on the first committed run.
- ★★★ win on the first run and no hint.
- Restarts keep heat placements. Only the first committed run counts as unaided, so a player can't binary-search the duration for full stars.

---

## World 1: Inside the Earth (בבטן כדור הארץ)

### L1 The first plume (tutorial)
- **Geography (PT, ES):**
  - Hot mantle rises, spreads and drags the plates apart.
  - A rift opens, sinks, floods into a new sea, and new basalt forms at the ridge.
  - PT: "מגמה עולה מהמעטפת ויוצרת קרקע חדשה"; landforms "רכס מרכז-אוקיינוסי, בקעים".
- **Setup:** one continent across the slab and an ocean at one end so the rift can flood. Allowance: 1 plume. Duration is fixed at 10 Myr. Separation rate 5 cm/yr gives a 500 km gap. Flow arrows are shown. Villager: "אנחנו רוצים ים!"
- **Intended reasoning:** heat under the spot where the sea should be → the land spreads apart there.
- **Wrong approach → visible consequence:**
  - Plume far from the wish point: the sea opens where nobody lives, and villagers stand on dry land with fishing rods.
  - Line: "הים נפתח מעל הפלומה, לא ליד הכפר".
  - (Drips are not available yet.)
- **Constant-strategy check:** "one plume in the middle" must **fail** here. Put the wish point off-center (e.g. 1/3 of the slab) so the tutorial already teaches *where*, not just *that*.
- **Win check:** sea depth > 0 and connected to the ocean, at the villagers' coast cell, after the run.
- **Verified solution:** one hot plume on the seam at (560, 250) km, 4 Myr fixed → about 4.7–5 cm/yr, a sea about 190–200 km wide between the villages (allowed 100–600 km). Checked in `tests/levels.test.ts` (3 stars) and played in a real browser by `scripts/drive.mjs`.

### L2 Liquid or solid (no heat)
- **Geography (ES):**
  - A quake sends גלי הדף everywhere; seismographs record them.
  - There are two wave types, and one "אינו עובר דרך נוזל", so it is missing behind the outer core.
  - Waves "מתכופפים ומשנים כיוון" at layer boundaries.
  - The inner core is solid "בגלל לחץ עצום". The modules never name P/S waves (FACTS §1).
- **Setup:** a globe cutaway with a fixed quake source.
  1. Place 3 stations anywhere on the surface.
  2. Trigger the quake.
  3. Read each record: A only, or A+B.
  4. Mark the liquid layer by choosing one shell: mantle / outer core / inner core / whole core.
- **Intended reasoning:** stations that get only type A have ray paths through something liquid. Stations that get A+B have paths through the mantle only, so the mantle is not liquid. The liquid starts at the core's edge.
- **What the data can and can't show:**
  - In our ray model, type B stops as soon as a ray enters the outer core, so no B ray ever samples the inner core.
  - The data therefore proves "liquid begins at the core boundary" but cannot show the inner core's state.
  - Real seismology can, but that is outside the modules. The inner core's solidity comes from the module's **pressure** fact, revealed after the mark, not from player data.
- **Wrong approach → visible consequence:**
  - **Marking the mantle:** contradicted by an A+B station. Its path lights up as "גל מסוג ב עבר כאן — השכבה הזאת לא נוזלית".
  - **Marking the inner core alone:** contradicted by the shadow. Paths that only graze the outer core already lose B.
  - **Marking the whole core:** accepted as data-consistent. The cutaway then reveals the solid inner core with "הגלעין הפנימי חם יותר, אבל מוצק — בגלל לחץ עצום". This is the CORE misconception moment; it gives 2 stars, not 3 (OURS).
- **Constant-strategy check:**
  - The mark button stays disabled until there is at least one A-only and one A+B record. Bunched stations can't proceed; the player moves a station.
  - Random station placement is allowed, because the skill is the inference.
- **Win check:** the marked shell is consistent with all records. "Outer core" gives 3 stars; "whole core" gives 2 stars plus the reveal.
- **Verified solution:** three seismograph stations at 40°, 100° and 160° from the quake, fire, then mark the outer core as the layer that stops the S waves. Checked in `tests/levels.test.ts` (3 stars) and played in a real browser by `scripts/drive.mjs`.

### L3 Which way?
- **Geography (PT):**
  - "חומר חם … עולה … מתקרר ויורד".
  - The plates "נגררים יחד עם זרם המעטפת": away from upwelling, toward downwelling.
- **Setup:** two plates; a plume under plate A's far edge and a drip under the A/B junction are already burning. Before running, commit an arrow per plate (left/right). Boats sit on the A/B coastline.
- **Intended reasoning:** surface flow runs from the plume toward the drip, so both plates move toward the drip.
- **Wrong approach → visible consequence:**
  - A wrong arrow: boats beached or swamped as the coast closes.
  - The cutaway replays the convection ribbon.
  - Line: "החום עלה מתחת ללוח הזה, והזרם גרר אותו לכיוון הטפטוף".
- **Constant-strategy check:**
  - "Always both arrows outward" and "always toward the plume" must fail.
  - Author three sub-rounds with different plume/drip layouts (incl. mirrored) so a fixed arrow pattern wins at most one.
- **Win check:** all committed arrows match the sign of the model's plate velocities.
- **Verified solution:** predict the western plate moves east and the eastern plate moves west (toward the fixed cold drip), then run 4 Myr: the plates meet and a range rises. Checked in `tests/levels.test.ts` (3 stars) and played in a real browser by `scripts/drive.mjs`.
- **Not-like note:** the prediction is a one-time commit before deep time runs, not a picker for a boundary type.

### L4 Slow but sure
- **Geography (PT):**
  - "תנועה של 2-7 ס"מ בשנה … במשך מיליוני שנים … אלפי קילומטרים".
  - 1 cm/yr × 1 Myr = 10 km.
- **Setup:** an existing narrow rift with fixed heat. **Gap opening rate 5 cm/yr (relative; FACTS §10)**. Target width 300 km, window ±25 km (OURS). Commit a duration from a stepper in 0.5 Myr steps (not a scrubbed slider), then run once.
- **Intended reasoning:** 5 cm/yr = 50 km per Myr; 300 ÷ 50 = **6 Myr**.
- **Wrong approach → visible consequence:**
  - Under ~5.5 Myr leaves a ditch the boats can't use.
  - Over ~6.5 Myr carries the harbor out of reach; villagers wave from a dock in the middle of the sea.
  - The HUD shows "‎5 ס"מ/שנה × X מיליון שנה = Y ק"מ‎".
- **Constant-strategy check:**
  - Durations that win on other levels (e.g. L1's 10 Myr) must fail.
  - A second round with a different rate (e.g. 3 cm/yr, target 240 km → 8 Myr) prevents memorizing "6".
- **Win check:** |width − 300| ≤ 25 km.
- **Verified solution:** the plume is fixed at 5 cm/yr; commit 6 Myr (5.5–6.5 accepted): 5 × 6 × 10 = 300 km. Checked in `tests/levels.test.ts` (3 stars) and played in a real browser by `scripts/drive.mjs`.
- **Care:** if the engine's 5 cm/yr is per plate, the answer becomes 3 Myr. The HUD wording must say "הפער בין החופים גדל ב-5 ס"מ בשנה".

### L5 Transfer: the quiet planet
- **Geography (ES, PT):**
  - The mantle engine is hidden. Evidence comes from temperature readings (ES "בארות עמוקות … מדידות טמפרטורה") and from where quakes happen (EV: activity "בעיקר לאורך גבולות").
- **Setup:** a new planet palette with no flow arrows. A weak existing upwelling is set off-center. Readings: a few borehole temperatures plus a seismograph log of past quake locations. Allowance: 1 plume. The villagers' sea wish lies on the hidden upwelling line.
- **Intended reasoning:** the warm readings and the quake line mark rising mantle; a plume there reinforces it and opens the rift.
- **Wrong approach → visible consequence:** a plume elsewhere competes with the hidden cell, so the rift stalls or opens in two weak places. Line: "החום שלך נלחם בזרם שכבר זורם שם".
- **Constant-strategy check:** "one plume in the middle" must fail (the hidden line is off-center). Random placement must be under 5%.
- **Win check:** a sea at the wish cell after the committed run (allowed 10–20 Myr).
- **Verified solution:** probe heat flow at 200, 450 and 650 km, then place the plume over the upwelling at 650 km and run 2 Myr. Checked in `tests/levels.test.ts` (3 stars) and played in a real browser by `scripts/drive.mjs`.

## World 2: Plates on the Move (לוחות בתנועה)

### L6 Zebra sea floor
- **Geography (PT):**
  - New floor forms at the ridge ("נוצרת קרקע אוקיינוסית חדשה כל הזמן"). Correct science: youngest at the ridge, older with distance.
  - **S1:** PT's sentence says the reverse. Never quote it.
- **Setup:** a wide ocean with age stripes visible through the sea-floor ages tool. To make one edge uniquely oldest, the ridge sits **off-center**: it formed close to the eastern continent and the western side spread longer (OURS geometry). The dig site is chosen once.
  - Alternative: one margin is an active trench that has consumed the oldest floor (introduces subduction early; less preferred).
- **Intended reasoning:** read the ages and go to the farthest stripe on the side with the most floor.
- **Wrong approach → visible consequence:**
  - Digging at the ridge brings up still-warm young basalt.
  - Digging on the short side finds middle-aged floor.
  - Line: "ליד הרכס הקרקע הכי צעירה — היא נוצרת שם עכשיו".
- **Constant-strategy check:** "dig at the ridge" and "dig at the nearest edge" both fail. A mirrored second round (ridge off-center the other way) defeats "always west".
- **Win check:** dig cell age ≥ 95% of the maximum oceanic age.
- **Verified solution:** sample the sea floor near the ridge and far from it (100 km and 1100 km), then dig at the far edge, 1180 km (oldest, at least 52 Myr). Checked in `tests/levels.test.ts` (3 stars) and played in a real browser by `scripts/drive.mjs`.
- **Optional heat step:** before digging, run the existing plume 10 Myr and watch a new stripe appear at the ridge. This keeps a heat verb in the level.

### L7 Continent meets continent
- **Geography (PT):**
  - "לוחות מתנגשים (יבשה ביבשה) … הסלעים מקומטים ומורמים" → high ranges.
  - The Himalaya keeps rising; the Appalachians are "נמוכים ושחוקים" after ~300 Myr of erosion.
  - No volcanoes (inferred; FACTS §2).
  - Snow wish: LD (Hermon snow needs height).
- **Setup:** two continents separated by a narrow sea; a low, eroded old range at one side. Allowance: 1 drip. The snow festival needs a peak above a snow line (OURS height) at the wish site.
- **Intended reasoning:** a drip between the continents pulls them together; no plate is light enough to sink below the other, so it folds up.
- **Wrong approach → visible consequence:**
  - A plume (if offered as a decoy) opens a valley; villagers fish on the valley floor (the acceptance moment).
  - A drip under the old range does nothing useful (no plates converge there).
  - The tutorial for expectation: when the player first sees the collision, a "volcano observatory" prop placed by villagers stays quiet. Line: "שתי יבשות נדחסו זו לזו; אף לוח לא שקע, ולכן אין הרי געש".
- **Constant-strategy check:** the "one plume in the middle" sample must fail (valley). Random must be under 5%.
- **Win check:** peak height at the wish ≥ snow line, and volcano count = 0 (asserted, part of the COLL test).
- **Verified solution:** a cold drip under the seam at (500, 300) km, 8 Myr: both continents are drawn in, nothing dives, a range without volcanoes. Checked in `tests/levels.test.ts` (3 stars) and played in a real browser by `scripts/drive.mjs`.

### L8 Ocean dives under
- **Geography (PT, EV):**
  - Oceanic plates "בנויים בעיקר מבזלת, שהיא צפופה יחסית" sink under continents.
  - The result: "תהום אוקיינוסית, שרשרת הרי געש" plus strong quakes ("לחץ השקיעה גורם לרעידות עזות").
- **Setup:** an oceanic plate meets a continent with farms inland and a town on the coast. Allowance: 1 drip, on a grid. The arc forms at a fixed inland offset from the trench (OURS, e.g. 150 km).
- **Intended reasoning:**
  - The drip sets where the plates converge.
  - The oceanic plate (not the continent) goes down, so the trench is on the ocean side.
  - Volcanoes rise behind the trench, so put the trench where "behind" = the farms.
- **Wrong approach → visible consequence:**
  - A drip too far inland: the arc grows under the town; slapstick ash, panic, roofs.
  - A drip far offshore: the arc ends up near the coast or nothing reaches the farms.
  - Line: "הלוח האוקייני הכבד שקע; ההרים הגעשיים צמחו מאחורי התהום".
- **Constant-strategy check:**
  - "One plume in the middle" → a rift, which fails.
  - Random must be under 5%.
  - Mirrored second round (ocean on the other side).
- **Win check:** trench cells all offshore; ≥ 1 volcano within the farm zone; 0 within R of the town.
- **Verified solution:** a cold drip at (580, 300) km, under the continent's edge, 4 Myr: the ocean plate dives, trench at the coast, the arc over the fields and not over the town. Checked in `tests/levels.test.ts` (3 stars) and played in a real browser by `scripts/drive.mjs`.

### L9 Slide past
- **Geography (PT):** "לוחות מחליקים: הלוחות נעים זה לצד זה … חיכוך ומתח מצטבר … רעידות אדמה חזקות". Offset river and road are **OURS** visuals (FACTS §2).
- **Setup:** a fault already cuts a village; the halves are offset by e.g. 150 km (OURS). Two cells on either side; the player adds 1 plume + 1 drip, positioned so the flows run parallel to the fault in opposite directions. Commit a duration. Rate 5 cm/yr relative.
- **Intended reasoning:**
  - Flow direction on each side decides which way the halves slide: pick placements that move them *back*.
  - Then 150 km ÷ 50 km/Myr = 3 Myr.
- **Wrong approach → visible consequence:**
  - Wrong-handed shear moves the halves farther apart.
  - Overshoot: they pass each other.
  - Line: "הלוחות החליקו זה לצד זה — לא נוצרו הרים ולא ים, רק רעידות".
- **Constant-strategy check:** "one plume in the middle" → a rift across the fault, which fails. Random under 5%.
- **Win check:** residual offset ≤ 15 km, no rift or mountain on the fault line, ≥ 1 quake logged during the run (stress release shown).
- **Verified solution:** a cold drip at (100, 150) and a hot plume at (100, 450) on the west side, 4.5 Myr: the plates shear past each other and the road is offset. Checked in `tests/levels.test.ts` (3 stars) and played in a real browser by `scripts/drive.mjs`.
- **Engine note:** the transform must *emerge* from shear between cells, never from a type flag.

### L10 Transfer: Wegener's puzzle
- **Geography (PT):**
  - Evidence: "התאמת קווי החוף", "מאובנים זהים" (Mesosaurus), "סלעים זהים", "אקלים שונה בעבר".
  - Critique: "וגנר לא יכול היה להסביר מה מניע את היבשות".
  - S10: don't call Mesosaurus a land animal in assessed text. S11: sea-floor age is later evidence.
- **Setup:** an evidence board of 4–5 continent pieces as they are today, carrying fossil, rock-belt and climate markers. The player reads markers with the hammer and seismograph, assembles them into a past supercontinent (see Not-like note), then places heat and commits a run that carries the assembly forward to today's layout.
- **Intended reasoning:** match pieces by all evidence, not by coastline shape alone. Then show the mechanism (convection) for the critics.
- **Wrong approach → visible consequence:**
  - A decoy piece fits the coastline but has mismatched fossils and rocks; the critic NPC shakes his head.
  - The correct fit without a heat run: the critic asks "ומה מזיז את היבשות?" and the level waits for the mechanism.
  - A heat run that doesn't reproduce today's layout: today's map doesn't match.
- **Constant-strategy check:** coastline-only matching must fail (decoy). Random heat must not reproduce today.
- **Win check:** all pieces correctly paired by ≥ 2 evidence types, and the forward run ends within tolerance of the target layout.
- **Verified solution:** drag the four continent pieces to their matching coasts, fossils and rock belts and present them; then place the plume at (3000, 1750) km under the join and run. Checked in `tests/levels.test.ts` (3 stars) and played in a real browser by `scripts/drive.mjs`.
- **Not-like care:** dragging continent pieces is a direct-manipulation verb that is **not** in the four verbs. Options:
  - (a) Treat it as a reading verb: "pin matches" by selecting pairs of evidence markers, and the pieces snap together by themselves.
  - (b) The lead accepts drag here as a one-off and records it in GAME_IDENTITY.
  - Recommend (a).

## World 3: Shake and Burn (רועד ובוער)

### L11 Ring of Fire
- **Geography (EV, PT):**
  - "לאורך חופי האוקיינוס השקט יש גבולות סובדוקציה … כ-75% מהרי הגעש הפעילים … כ-90% מהרעידות החזקות".
  - Activity "בעיקר לאורך גבולות הלוחות".
- **Setup:** a round ocean ringed by continent coasts with villages. Allowance: 3–4 drips. Goal: a subduction margin offshore of every village, with no volcano inside a village radius.
- **Intended reasoning:** a drip under each ocean margin → the ocean floor dives under each coast → trenches offshore, volcanoes behind them.
- **Wrong approach → visible consequence:**
  - A drip in mid-ocean: the ocean floor converges with itself, which is not covered in the modules. Avoid by disallowing mid-ocean cells, or make it produce "nothing useful" plus the line "הטפטוף צריך להיות בשולי האוקיינוס, איפה שהלוח האוקייני פוגש יבשה".
  - A drip too far inland: volcanoes in villages.
- **Constant-strategy check:** "one plume in the middle" opens the ocean wider and fails. Random under 5%.
- **Win check:** ring continuity ≥ 80% of margins subducting; 0 volcanoes within village radius.
- **Verified solution:** three cold drips under the three coasts, at (500, 80), (1100, 400) and (500, 730) km, default duration: trenches and volcanoes ring the ocean. Checked in `tests/levels.test.ts` (3 stars) and played in a real browser by `scripts/drive.mjs`.
- **Care:** the volcanoes are inland of the trenches, not "offshore" (CURRICULUM L11). No hot spot on this map.

### L12 Where to build?
- **Geography (EV):**
  - Quakes and volcanoes cluster on boundaries. "מוקד הרעידה … מוקד-העל"; "ככל שהמוקד רדוד יותר, הרעידה מורגשת בחוזקה רבה יותר".
  - Hot springs "נפוצים לאורך הבקע".
- **Setup:** the plate map left by the player's L11 result (fallback: an authored map). A village wants a new town with a **hot-spring bath** (which lies near a boundary). Choose one site, then run 1,000 years of seeded quakes.
- **Intended reasoning:** near enough to the spring (within walking radius) but off the boundary's damage band.
- **Wrong approach → visible consequence:**
  - On the boundary: houses tumble in the first quake and villagers climb out dusty.
  - Far corner: safe but no bath, and villagers sulk.
  - Line: "רוב הרעידות קורות לאורך גבולות הלוחות".
- **Constant-strategy check:** "farthest corner" fails (wish). "Next to the spring" fails (damage). Random sites under 10%.
- **Win check:** site within spring radius and outside the damage band (cumulative modeled Mercalli damage below a threshold).
- **Verified solution:** advise the port at (80, 400) km, on the quiet west coast that belongs to the ocean's own plate (no boundary). Checked in `tests/levels.test.ts` (3 stars) and played in a real browser by `scripts/drive.mjs`.

### L13 Bigger isn't deadlier
- **Geography (EV):**
  - "כל יחידה = תנודה גדולה פי 10 ואנרגיה גדולה פי 32 בערך"; ΔM 2 → "פי 100 … פי 1,000 בערך".
  - "הסיכון = חוזק הרעידה × פגיעות האוכלוסייה".
  - Mercalli = damage.
- **Setup:** two coastal towns.
  - Town North has resistant construction (Japan-like) and will be hit by M 8.
  - Town South has weak construction (Haiti-like) and will be hit by M 6, 2 units smaller.
  - The quake magnitudes are shown up front.
  - One-time decision: which town's builders go teach the other (OURS story verb; no budget).
- **Intended reasoning:** South needs the lesson. Its vulnerability is far higher, and damage depends on strength **and** vulnerability.
- **Wrong approach → visible consequence:**
  - Sending South's builders north: North's damage rises; South still collapses under the *smaller* quake.
  - The Mercalli map shows South redder than North.
  - Line: "הרעידה בדרום חלשה פי 100 בתנודה — ובכל זאת הנזק שם גדול יותר. הבנייה קובעת".
- **Constant-strategy check:**
  - "Help the bigger quake" fails.
  - A mirrored second round (the weak town gets the bigger quake) checks that the player reads vulnerability, not position.
- **Win check:** total modeled damage below the threshold.
- **Verified solution:** predict 1000× for two magnitude units, choose that the valley town copies the port town's 413 building ("valley-copies"), then run the quakes. Checked in `tests/levels.test.ts` (3 stars) and played in a real browser by `scripts/drive.mjs`.
- **Care:**
  - Say "בנייה עמידה", **not "413"**, here; 413 unlocks in L15.
  - Never show deaths, only slapstick.
  - The magnitudes 8 and 6 are OURS. Quote the Haiti/Japan module numbers only in the replay line.

### L14 Tsunami
- **Geography (EV):** "כשסלע נשבר בקרקעית הים, הוא דוחף עמוד מים עצום כלפי מעלה … לא גל אחד אלא סדרה של גלים".
- **Setup:**
  - An offshore subduction trench (made by the player in L11, or authored).
  - Choose a harbor site on the coast (it must be on the coast).
  - Choose one evacuation path to a hill.
  - Then the quake: waves 1–3 arrive at modeled intervals.
- **Intended reasoning:** put the harbor where the path to high ground is short enough to beat wave 1. Villagers must stay up until the series ends.
- **Wrong approach → visible consequence:**
  - A long path: villagers splash.
  - A harbor facing the trench with a low path: boats in the town square.
  - A path to a hill lower than the run-up: wet feet.
  - A hill that clears wave 1 but not the larger wave 2: villagers who felt safe get soaked.
  - Rule: a path counts only if its end is above the run-up of the **largest** wave in the series. In the authored rounds that is wave 2 (OURS).
  - Line: "צונאמי הוא לא גל אחד אלא סדרה של גלים".
- **Constant-strategy check:** "highest hill always" fails when it's farther than wave-1 time. "Harbor in the sheltered bay always" fails on the second round's coast.
- **Win check:** every villager is above the run-up before each wave's arrival; the harbor survives or is rebuilt.
- **Verified solution:** the north cove next to the cliff, and the cliff (42 m) as the escape hill; run the trench quake: everyone walks up before the wave. Checked in `tests/levels.test.ts` (3 stars) and played in a real browser by `scripts/drive.mjs`.
- **Care:**
  - "The largest wave may not be the first" is OURS, not in the module. It is shown only through play, never as an assessed line; the spoken line stays the module's "לא גל אחד אלא סדרה".
  - High ground is OURS; the module says "תוכניות פינוי".

### L15 Transfer: Jordan Valley 1927
- **Geography (EV, PT):**
  - 1927: "כ-6.2 … בעמק הירדן … 500 בני אדם נהרגו, ערים כמו טבריה, יריחו ושכם נפגעו קשות".
  - The rift is an active boundary ("הלוח הערבי מתרחק מהלוח האפריקני בכמה מ"מ בשנה"; "זז צפון-מזרחה ביחס").
  - 413: "מחייב שכל בניין חדש … ייבנה כך שיעמוד ברעידת אדמה"; old buildings → "חיזוק"; "אינו מסייע בחיזוי רעידות".
  - Prediction "בלתי אפשרי".
- **Setup:**
  - A schematic Israel rift strip with real coordinates for טבריה (32.79N 35.53E), יריחו (31.86N 35.46E), שכם (32.22N 35.26E), בית שאן (32.50N 35.50E), and optionally ירושלים (31.78N 35.22E; OURS, not in the module).
  - The fault trace is drawn from the model.
  - Act 1: the 1927 quake plays (fixed, historical; no player action, slapstick only).
  - Act 2, "today": Standard 413 unlocks. Choose a site for each rebuilt quarter (new buildings = 413) and pick which old quarter gets "חיזוק" (one).
  - Then seeded future quakes run with **no warning**.
- **Intended reasoning:** keep new quarters off the fault trace where possible; new buildings follow 413; reinforce the oldest quarter nearest the fault. Don't wait for a prediction.
- **Wrong approach → visible consequence:**
  - A quarter on the fault trace takes heavy damage even with 413 (reduced, not zero).
  - Skipping חיזוק: the old quarter collapses.
  - A "wait for warning" button (decoy) does nothing. Line: "חיזוי מדויק של רעידות אדמה הוא כיום בלתי אפשרי — לכן מתכוננים".
- **Constant-strategy check:** "all quarters at the map edge" fails (valley towns must stay in their valley zone). "Reinforce the newest quarter" fails.
- **Win check:** modeled damage over N seeded quakes is below the threshold for **every** seed (stars don't depend on timing).
- **Verified solution:** Tiberias on the hill (t-hill), Jericho on the alluvial fan (j-fan), Shechem on the ridge (y-ridge); run the rift quakes: all houses stand. Checked in `tests/levels.test.ts` (3 stars) and played in a real browser by `scripts/drive.mjs`.
- **Care:**
  - **413 is anachronistic for 1927**; split the acts as above.
  - S5: say "בעמק הירדן" only.
  - No borders drawn; place names only.

## World 4: Rocks and the Land of Israel (סלעים וארץ ישראל)

### L16 Rock orders
- **Geography (RM):**
  - Basalt: "לבה שהתקררה מהר על פני השטח", fine crystals.
  - Granite: "מגמה שהתקררה לאט מאוד בתוך האדמה", large crystals.
  - Limestone from marine skeletons in a "ים רדוד"; "מאובנים רק בסלעי משקע".
  - Marble: "גיר שנחשף לחום ולחץ גבוהים".
  - One closed cycle.
- **Setup:** a slab with continents and a shallow shelf. Allowance: 2 plumes, 2 drips, any number of runs (each run forward). Orders: basalt, granite, limestone (with a fossil), marble. Collect each with the rock hammer from the surface or the cutaway.
- **Intended reasoning:**
  - Rift → eruption → basalt.
  - Collision belt → magma cooling deep → time + erosion exposes granite (OURS link: a convergent belt).
  - A long-lived shallow sea → limestone.
  - Then a drip that buries the limestone in a collision → marble.
  - Order matters: limestone must exist before marble.
- **Wrong approach → visible consequence:**
  - Hammering lava-field rock for granite gets fine crystals, not granite: "התקרר מהר על פני השטח".
  - Collision before the sea gives no limestone to squeeze.
  - Looking for fossils in granite or marble: "מאובנים רק בסלעי משקע".
- **Constant-strategy check:** "one plume in the middle" yields basalt only (fails 3 of 4). Random heat yields all four under 5%.
- **Win check:** 4 correct samples collected; each sample's rock has a recorded formation path in the model.
- **Verified solution:** a cold drip at (300, 250) and a hot plume at (600, 250), 14 Myr; then hammer at 600, 300, 120 and 265 km for basalt, granite, fossil limestone and marble. Checked in `tests/levels.test.ts` (3 stars) and played in a real browser by `scripts/drive.mjs`.
- **Not-like care:** no cycle wheel and no "apply process" buttons. Rocks only come from what the planet did.

### L17 Fossils at 700 m
- **Geography (RM, LB):**
  - "יותר מ-700 מטר … גיר, שנוצר … כשהאזור היה מכוסה ים רדוד … תנועת הלוחות הרימה את האזור".
  - LB: "שדרת ההר נוצרה מהרמה של שכבות שהיו קודם לכן מתחת לים".
- **Setup:** a low shelf under a shallow sea; a villager holds a seashell on the future hill. Allowance: 1 drip (uplift by convergence) + duration commits. The hill must reach ≥ 700 m with the fossil layer at the top. The cutaway shows strata.
- **Intended reasoning:**
  - First let the shallow sea lay down limestone: a long run with no drip.
  - Then add the drip and run until the uplift exceeds 700 m.
  - The sea level stays the same throughout; the land rises.
- **Wrong approach → visible consequence:**
  - Drip first: the hill rises bare, with no shells.
  - Not enough uplift: shells stay below 700 m or underwater.
  - The villager's "deep sea" theory is shown false: the cutaway's shallow-water creatures and thin wave ripples (OURS) next to a sea-level gauge that never moved.
  - Line: "הים היה רדוד — היבשה היא שעלתה".
- **Constant-strategy check:** a single long run with the drip from the start fails (no limestone on top). "One plume in the middle" → a rift (fails).
- **Win check:** fossil layer elevation ≥ 700 m, the layer was deposited at depth < shallow-sea limit (OURS, e.g. 200 m), and sea level is unchanged.
- **Verified solution:** run 30 Myr with no heat (the shallow sea lays fossil limestone), then a cold drip at (60, 40) km and 30 more Myr: the layers are lifted 700 m+. Checked in `tests/levels.test.ts` (3 stars) and played in a real browser by `scripts/drive.mjs`.

### L18 Final: building the Land of Israel (no hints, nothing labeled)
- **Geography:**
  - LB: three belts, each with its own process: "מישור החוף … סחיפה והשקעה"; "שדרת ההר … קימוט והרמה"; "בקע … שבירה טקטונית". "שלוש הרצועות אינן שלבים של תהליך אחד."
  - LB: the Golan "נלווית … ואינה נמנית עם השלוש".
  - LB: the rift as "שני לוחות נעים זה לצד זה והקרקע שביניהם צנחה"; Dead Sea shore about −430 m, "הנקודה היבשתית הנמוכה בעולם".
  - LB: the watershed sends streams "מערבה אל הים התיכון ומזרחה אל בקע הירדן".
  - LB: coastal sand "בזרמי הים מכיוון דלתת הנילוס", kurkar ridges "במקביל לקו החוף".
  - EV: the Arabian plate moves "צפון-מזרחה ביחס" to the African.
- **Setup:**
  - A slab from the Mediterranean (west) to the desert (east), north up.
  - The African plate is on the west, the Arabian on the east.
  - Allowance: e.g. 2 plumes, 2 drips. Several committed runs are allowed.
  - External processes (sea, rivers, wind) run automatically and build the coastal plain.
  - Final step: choose 413 sites for 3 towns, then the rift quake.
  - Checked against bundled SRTM-derived belt profile (stylized).
- **Intended reasoning:**
  - Shear along the eastern line (Arabian north relative to African) with a sinking block → the rift down to the lowest point on land.
  - Mild convergence west of it → the folded limestone ridge (built on the earlier shallow-sea limestone) → the watershed.
  - Rift-linked magma in the northeast → Golan basalt.
  - Leave the west low so deposition builds the kurkar coast.
  - Towns off the fault trace and off the coastline's soft swamp zone (OURS), built to 413.
- **Wrong approach → visible consequence:** outcomes only, nothing labeled:
  - A plume on the eastern line → a widening sea instead of a deep, narrow rift block. Acceptable as PT framing, but the depth goal can fail if it floods to sea level.
  - Uplift on the coast → no coastal plain.
  - Streams that run only one way → the watershed check fails.
  - Limestone in the Golan → basalt check fails.
  - A town on the fault → collapse.
- **Constant-strategy check:** "one plume in the middle" → a central sea, which fails every belt check. Random heat under 1%.
- **Win check (all):**
  - rift floor ≤ −400 m (stylized; target −430);
  - ridge crest > 600 m (OURS), with drainage both ways;
  - kurkar ridges parallel to the coast;
  - basalt cover in the NE;
  - west → east order coast < ridge > rift;
  - all 3 towns survive the quake with modeled damage below the threshold.
- **Verified solution:** a cold drip at (88, 130) km under the ridge belt and a hot plume at (180, 50) km in the north-east (Golan basalt), 8 Myr, with Arabia sliding north on the rift; then the coast town on the plain, the hill town on the crest and the valley town on the rock terrace. Checked in `tests/levels.test.ts` (3 stars) and played in a real browser by `scripts/drive.mjs`.
- **Care:**
  - Feedback lines must use the LB framing only (S2).
  - Never label the Golan a belt.
  - Say "ביבשה" (S14).
  - Don't attribute the modern ~1 m/yr Dead Sea level drop to this tectonic sinking (S8).

---

## Tests (QA list, now in `tests/`)

Items 1–3, 5, 6 and 10 are in `tests/levels.test.ts` and `tests/misconceptions.test.ts`; 4, 7, 8 and 9 in `tests/rules.test.ts`; the Israel relief comparison is in `tests/israel.test.ts`. Item 2 is looser than first drafted: random heat layouts win at most 25% of the time (a level with one seam and one plume is easy to hit by luck), and every constant layout fails.

1. Per level: the authored solution wins (solver finds ≥ 1 solution).
2. Per heat level: "one plume in the middle" fails; random placements win ≤ 5%. Site levels: the listed constant sites fail.
3. Boundary emergence (no type flags):
   - plume between plates → diverging, ridge or rift;
   - drip between continents → converging, folded, 0 volcanoes;
   - drip at ocean/continent → trench on the ocean side, arc inland;
   - shear → transform, no relief change.
4. Rate × time: 5 cm/yr relative × 6 Myr = 300 km; 1 cm/yr × 1 Myr = 10 km.
5. Richter: ΔM 1 → ×10 shaking and ≈×31.6 energy (displayed "פי 32 בערך"); ΔM 2 → ×100 and ×1,000.
6. Damage = strength × vulnerability: the weak town with the smaller quake is worse off than the strong town with the bigger quake (L13).
7. Sea floor: age increases monotonically with distance from the ridge (guards against S1).
8. Rocks: fossils exist only in sedimentary samples; marble only from pre-existing limestone; granite only from slow (deep) cooling.
9. L17: sea level is constant through the run; fossil elevation comes from uplift only.
10. Time only runs forward: no API path decreases model time (restart resets to t0 with placements kept).

---

## "Not like" table (draft for GAME_IDENTITY.md)

| Existing | Their interaction: control → variable → feedback | Our verb for the same concept | Why it's different | Watch-out in our levels |
|---|---|---|---|---|
| **PlateBoundaryLab** (PT page) | Pick a boundary type (מתרחקים/מתנגשים/מחליקים) and the crust types → the landform morphs, with type/example labels | Place plumes/drips under the mantle; the **boundary type emerges** where flows diverge, converge or shear; the player reads the type afterward | We never select a type or crust; plates and crust are fixed by the level; the outcome follows from heat + time | No "type" buttons, even as hints. L3's arrows predict motion, not type. Don't label the boundary before the run |
| **EarthLayersDrillLab** (ES page) | A depth slider drills down; gauges show heat, pressure and state | Seismograph stations around the globe and a quake; infer the liquid layer from which waves arrive (L2) | Inference from indirect evidence ("מדע עקיף"), not reading a gauge at a depth | No depth slider or drill-down gauge anywhere. The cutaway is display-only; the probe from the old L1 is gone |
| **RockCycleExplorer** (RM page) | Click a process on a cycle wheel → a rock moves between groups | Rocks come only from what the planet did (eruption, slow deep cooling + erosion, shallow sea, collision); collect with the hammer (L16) | No process buttons; the order and placement of heat creates the rock | No wheel UI, even in the codex/journal. The rock hammer reads; it never transforms |
| **EarthquakeReadinessLab** (EV page) | Sliders for magnitude and preparedness budget per country → run a quake → damage | Advise sites once and choose who teaches resistant building (L13); 413 unlocks as a story beat (L15); magnitudes are given, not set | No budget, no magnitude control; the decision is spatial or one-time | L13's "teach the other town" must stay a single binary choice, not a slider or point allocation |
| **IsraelLandformBeltsLab** (LB page) | Drag process chips (deposition, folding, faulting, volcanism…) onto belt slots of a cross-section | Make the belts by placing heat and running time; external processes run by themselves (L18) | We never assign a process to a belt; the belts are outcomes | No chips, no slots, no labeled cross-section to fill. L18 has nothing labeled |
| **IsraelLandscapeMixerLab** (LD page) | Dials for altitude, rain and distance from the sea → a landscape | Altitude comes only from tectonics (e.g. L7 snow peak) | No dials | Don't add a "climate" dial for the snow wish |
| **WeatheringErosionLab** (WE page, optional) | Steps through weathering/erosion/deposition processes | External processes are automatic background in our model | The player never triggers erosion | Erosion is not a player tool |
| **Basin Breakers** (Codex crew) | Cut and raise terrain directly with a drag tool; gates; release a water pulse; **rewind** | We never touch the surface; heat goes *under* the slab and terrain follows from the model; time only runs **forward** | No sculpting, no rewind of water/time; the surface is an output | Restart keeps heat placements but resets time to t0 (not a rewind scrub). No terrain brush, even in a debug HUD shipped to players |
| **Frost & Flame** (heat/cold gloves) | Hold a heat or cold glove on a nearby object → its temperature changes → state change (melt, freeze, boil); a heat battery is conserved | Discrete, count-limited plume/drip **placements** under the mantle grid; effects appear only over Myr as flow → plate motion → landforms | No hold-to-heat, no aiming at objects, no phase change of a target, no energy battery | Don't make placement a "hold to charge" gesture or a heat meter that fills. Keep the allowance as a count of markers, not an energy pool |

**Open Not-like risks** (for the lead):
- **L10 dragging continents** is a fifth verb; recommendation (a) is in L10.
- **L4's duration commit** must be a stepper plus a single "run". It must not be a draggable timeline with live preview, which would amount to scrubbing.
- **L2** places stations on the surface. That is fine: a reading tool, not a depth slider.
