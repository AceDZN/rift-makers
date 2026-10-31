# Rift Makers (שוברי היבשות): curriculum map (draft 2: heat-only design)

## Sources

Scope comes from the Workbook geography modules. Snapshots are in `docs/curriculum/`. On 31 October 2026 we also checked the live module JSON, and every URL below equals the module's `canonicalUrl`.

The snapshots leave out tables. `docs/FACTS.md` holds:
- the table data and the exact Hebrew wording;
- the source inconsistencies **S1–S18**, which must never become assessed facts;
- design notes for the heat-only verbs (§10).

Level mechanics, solutions and wrong-approach checks are in `LEVELS.md`.

Two labels used throughout:
- **OURS** marks our content or tuning. When the game presents it as science, it shows the tag **"העשרה"** (COMMON: "When something isn't in the Workbook module … label it … as an extra").
- **⚠ Care** marks a claim that needs exact wording or that touches a FACTS S-item.

## Module keys

| Key | Module | Workbook sim on that page (not our verb; see LEVELS.md "Not like") |
|---|---|---|
| ES | [earth-structure](https://geography.workbook.co.il/grade-8/chapter-4/earth-structure) | EarthLayersDrillLab |
| PT | [plate-tectonics](https://geography.workbook.co.il/grade-8/chapter-4/plate-tectonics) | PlateBoundaryLab |
| EV | [earthquakes-volcanoes](https://geography.workbook.co.il/grade-8/chapter-4/earthquakes-volcanoes) | EarthquakeReadinessLab |
| RM | [rocks-minerals](https://geography.workbook.co.il/grade-8/chapter-4/rocks-minerals) | RockCycleExplorer |
| WE | [weathering-erosion](https://geography.workbook.co.il/grade-8/chapter-5/weathering-erosion) (optional) | WeatheringErosionLab |
| LB | [landform-belts](https://geography.workbook.co.il/grade-9/chapter-2/landform-belts) | IsraelLandformBeltsLab |
| LD | [landscape-diversity](https://geography.workbook.co.il/grade-9/chapter-2/landscape-diversity) | IsraelLandscapeMixerLab |

## Misconception codes

From the handoff:

| Code | Misconception |
|---|---|
| FAST | Plates move fast, or only during quakes |
| LAVA | The crust floats on lava |
| VOLC | All mountains are volcanoes |
| COLL | Every collision makes volcanoes |
| MAG | A higher magnitude always means more deaths |
| PRED | Quakes can be predicted precisely, or 413 predicts them |
| SEA | Fossils on mountains mean the sea rose that high |
| ROCK | Every rock is the same "stone" |
| CORE | The core is liquid all the way through |

Extra codes (OURS, each grounded in a module line in FACTS §9):

| Code | Misconception |
|---|---|
| LIN | Richter treated as linear |
| DMG | Richter treated as damage |
| INEX | Internal and external processes mixed up |
| BND | Quakes and volcanoes expected anywhere |
| ONEWAVE | A tsunami is one wave |
| EVID | A good-looking fit is enough, with no mechanism |
| HEAT | Heat makes mountains directly: "hot = high" |

The core model maps to the curriculum like this (PT: "זרמי ערבול … הלוחות נגררים יחד עם זרם המעטפת"):
- A plume is upwelling, so the plates move away from it.
- A drip is downwelling, so the plates move toward it.
- Where flows diverge you get מתרחקים; where they converge, מתנגשים; where they shear, מחליקים.

The boundary type is never chosen; it is read from the result.

Rate math: 1 cm/yr × 1 Myr = 10 km. Richter: shaking ×10^ΔM, energy ×10^(1.5ΔM).

---

## World 1: Inside the Earth (בבטן כדור הארץ)

### L1 The first plume
- **Modules:** PT, ES
- **Skill:** rising mantle (a plume) drags plates apart → a rift sinks and floods into a new sea → basalt forms at the ridge.
- **Scenario:** tutorial. One continent, and villagers who want a sea. Flow arrows are shown.
- **State/action:**
  - Plume position → divergence line.
  - Committed duration × rate → gap width.
  - The gap sinks below sea level and floods.
- **Feedback on mistake:** a drip, or a plume off to the side, gives no sea where they asked; the villagers sulk on dry land. Too short a run leaves a narrow dry rift.
- **Misconceptions:** FAST, HEAT
- **Transfer evidence:** none (tutorial). The first unaided placement is logged.
- **⚠ Care:**
  - Basalt stripes are a visual. The modules never mention magnetic stripes (FACTS §2).
  - The module's divergent example includes "הבקע הסורי-אפריקני", so a continental rift → sea is consistent.

### L2 Liquid or solid
- **Modules:** ES
- **Skill:** infer that the outer core is liquid from seismic waves (גלי הדף + סיסמוגרף).
- **Scenario:** place 3 seismograph stations around the planet, trigger a quake, then mark the liquid layer. The cutaway reveals the answer only after the marking matches the data.
- **State/action:** each station's ray path → which of the **2 wave types** arrive. The type "שאינו עובר דרך נוזל" is missing behind the outer core.
- **Feedback on mistake:**
  - Marking the whole core contradicts the data: "הגלעין הפנימי מוצק בגלל לחץ עצום".
  - Marking the mantle fails because type B arrives through it.
- **Misconceptions:** CORE, LAVA
- **Transfer evidence:** a second quake source moves the shadow, and the same layer is marked unaided.
- **⚠ Care:**
  - The module never names P/S waves. Use "גל מסוג א / ב". P/S may appear only as העשרה, never assessed.
  - Module wording is "אחד הסוגים אינו מגיע לצד השני מנקודות מסוימות".

### L3 Which way?
- **Modules:** PT, ES
- **Skill:** plates move away from rising mantle and toward sinking mantle (convection cells).
- **Scenario:** one plume and one drip are already placed. Commit a direction arrow for each plate, then run time; boats are on the line.
- **State/action:** cell rotation → surface flow → plate velocity sign. Rate shown at 2–7 cm/yr.
- **Feedback on mistake:** boats end up on the wrong shore, with a replay of the ribbon: "חומר חם עולה, מתקרר ויורד; הלוחות נגררים עם הזרם".
- **Misconceptions:** HEAT, FAST, LAVA
- **Transfer evidence:** a mirrored or rotated layout predicted unaided.
- **⚠ Care:** the module illustration says the currents "דוחפים … ומפרידים" while PT prose says "נגררים". Keep "נגררים" in the text.

### L4 Slow but sure
- **Modules:** PT
- **Skill:** distance = rate × time; slow rates across millions of years.
- **Scenario:** the shores must be 300 km apart. The rate is 5 cm/yr. Commit a duration and run once.
- **State/action:** 300 km ÷ (5 cm/yr = 50 km/Myr) = **6 Myr**.
- **Feedback on mistake:** a short run leaves a ditch; a long run sends the harbor drifting out of reach. The HUD shows rate × time = km.
- **Misconceptions:** FAST
- **Transfer evidence:** a second target with a different rate inside 2–7 cm/yr (OURS).
- **⚠ Care:**
  - The 5 cm/yr must be the **gap-opening (relative) rate**. If each plate moves 5 cm/yr away from the plume, the gap opens at 10 cm/yr and the answer is 3 Myr (FACTS §10).
  - 5 cm/yr is OURS but inside the module's 2-7. The module's real ocean example is the Atlantic at 2.5 cm/yr.

### L5 Transfer: the quiet planet
- **Modules:** ES, PT
- **Skill:** use evidence (temperature readings, quake locations) to find the existing upwelling, then open the first rift where the villagers need a sea.
- **Scenario:** a new planet with no flow arrows, only borehole and probe temperatures plus seismograph data.
- **State/action:** a plume placed on the hottest line, with quakes aligned along it, reinforces the existing flow → a rift where wanted. A plume elsewhere fights the existing flow and stalls.
- **Feedback on mistake:** the rift opens in the wrong place or stalls. The hint highlights the temperature readings only.
- **Misconceptions:** HEAT, FAST
- **Transfer evidence:** a correct unaided first placement on unfamiliar geometry.
- **⚠ Care:**
  - ES lists real methods: "בארות עמוקות … מדידות טמפרטורה ישירות", "חקר לבה", "מדידות גרביטציה". Present heat readings as one of these.
  - A "heat-flow map" as a named instrument is OURS (העשרה).

## World 2: Plates on the Move (לוחות בתנועה)

### L6 Zebra sea floor
- **Modules:** PT
- **Skill:** new sea floor forms at the ridge and is youngest there; it is oldest far from the ridge.
- **Scenario:** a wide ocean with age stripes. The villagers' oldest treasure is in the oldest crust. Read the stripes and send the dig.
- **State/action:** sea-floor ages tool → age = distance from the ridge ÷ the spreading rate.
- **Feedback on mistake:** digging at the ridge finds fresh, still-warm basalt: "בו נוצרת קרקע אוקיינוסית חדשה כל הזמן".
- **Misconceptions:** FAST (ages in Myr)
- **Transfer evidence:** a second ocean with an off-center ridge.
- **⚠ Care:**
  - **S1:** the PT sentence "צעירים יותר ככל שמתרחקים" is reversed. Never quote it.
  - With symmetric spreading both edges are equally old, so the level needs an asymmetry (see LEVELS.md).

### L7 Continent meets continent
- **Modules:** PT, LD
- **Skill:** a drip between two continents → collision (מתנגשים, יבשה ביבשה) → folded high mountains, no volcanoes. An old, inactive range erodes low.
- **Scenario:** two continents and one drip. Villagers want snow on a young peak.
- **State/action:**
  - Converging flow → uplift while the drip runs.
  - Erosion acts all the time.
  - The old range has no uplift.
- **Feedback on mistake:** a plume instead gives a valley; the villagers fish on the valley floor. A player who expects volcanoes gets: "הטפטוף משך שתי יבשות זו אל זו; אף לוח לא שקע, ולכן אין הרי געש".
- **Misconceptions:** COLL, VOLC, HEAT
- **Transfer evidence:** shown unlabeled profiles, the player picks the active range ("הר גבוה ומחודד = פעיל עדיין").
- **⚠ Care:**
  - "No volcanoes" is an inference from the PT table, not a quote (FACTS §2).
  - Himalaya and Appalachians wording as in PT.

### L8 Ocean dives under
- **Modules:** PT, EV, RM
- **Skill:** ocean–continent convergence → the denser oceanic plate sinks (סובדוקציה) → an offshore trench (תהום), an inland volcanic arc and strong quakes.
- **Scenario:** place the drip so the trench is offshore and the arc's fertile soil forms under the farms, not the town.
- **State/action:**
  - Drip position → convergence line.
  - The oceanic side sinks by density.
  - Arc offset inland = f(slab dip) (OURS).
- **Feedback on mistake:**
  - The arc lands under the town, giving slapstick ash and quakes.
  - The trench lands onshore and is impossible; the drip pulls the coast down.
- **Misconceptions:** COLL (reverse case), BND
- **Transfer evidence:** a mirrored coast solved unaided.
- **⚠ Care:**
  - Fertile volcanic soil is module-grounded only for Golan basalt (RM "שדות הבזלת הפוריים", LB "קרקע כהה ופורייה"). For an arc it is a general extension (העשרה).

### L9 Slide past
- **Modules:** PT
- **Skill:** flows sliding past each other give a לוחות מחליקים boundary. It builds friction and stress, and quakes; it makes no mountains and no new sea.
- **Scenario:** a river and road were torn sideways. Run just enough time to realign a split village.
- **State/action:**
  - Shear direction (from the heat layout) × rate × time = offset.
  - Stress releases in quakes.
- **Feedback on mistake:** the wrong shear direction pulls the halves farther apart; too much time overshoots.
- **Misconceptions:** FAST
- **Transfer evidence:** naming San Andreas as this type (PT).
- **⚠ Care:** offset rivers and roads are **not in the modules**. They are a visual consequence; never teach "offset features" as curriculum.

### L10 Transfer: Wegener's puzzle
- **Modules:** PT
- **Skill:**
  - Evidence: coastline fit, Mesosaurus fossils, matching rock layers, past climate.
  - The critique: the missing mechanism.
- **Scenario:** fit the scattered continents, then run heat forward to today. The critic NPCs accept only when the evidence matches **and** the mechanism is shown.
- **State/action:** fit score = coast + fossil + rock-belt agreement. Acceptance also needs the convection mechanism run.
- **Feedback on mistake:** a pretty coast fit with mismatched fossils or rocks is rejected. Fit with no mechanism gets the critic's line: "אבל מה מניע את היבשות?"
- **Misconceptions:** EVID
- **Transfer evidence:** a new continent set with unlabeled evidence.
- **⚠ Care:**
  - PT's critique is about the **mechanism**, not the fit (FACTS §2). The handoff's "accept the fit when all evidence matches" must add the mechanism step.
  - S10: Mesosaurus was not a land reptile.
  - S11: sea-floor age is later evidence.
  - Moving continent pieces is a fifth verb; see LEVELS.md "Not like".

## World 3: Shake and Burn (רועד ובוער)

### L11 Ring of Fire
- **Modules:** EV, PT
- **Skill:** subduction all around an ocean → trenches and volcanoes ring it ("כ-75% … כ-90%"). Activity is "בעיקר לאורך גבולות הלוחות".
- **Scenario:** an ocean ringed by villages. Close it with drips so the trenches form offshore of every village.
- **State/action:** a drip under each margin → subduction along it. Volcanoes rise on the overriding plate, behind the trench.
- **Feedback on mistake:** a drip in the middle of the ocean → no ring, or a trench in the wrong place → the arc under a village.
- **Misconceptions:** BND, COLL
- **Transfer evidence:** a different ocean shape solved unaided.
- **⚠ Care:**
  - Volcanoes form **inland of the trench** on the continent. "Volcanoes offshore" is true only for island arcs, which are not in the modules.
  - Keep hot spots out of this map, or show one as the labeled exception ("נקודה חמה", EV).

### L12 Where to build?
- **Modules:** EV
- **Skill:** quakes and volcanoes cluster on boundaries; choose a site accordingly. Terms: מוקד הרעידה / מוקד-העל.
- **Scenario:** the L11 plate map. A village asks for a town site; 1,000 years of quakes then run.
- **State/action:**
  - Distance from the boundary → quake count and intensity at the site.
  - The town still needs its wish, e.g. a hot spring, which occurs along the rift (EV).
- **Feedback on mistake:** a site on the boundary gets slapstick collapses; a site far out loses its wish.
- **Misconceptions:** BND, PRED
- **Transfer evidence:** the L15 sites.
- **⚠ Care:** the run is 1,000 years, not Myr. Label the time scale. Quake timing is random in play and seeded in tests.

### L13 Bigger isn't deadlier
- **Modules:** EV
- **Skill:**
  - Richter is logarithmic: ΔM 2 → ×100 shaking, ≈×1,000 energy.
  - Damage depends on strength × vulnerability.
  - Mercalli measures damage.
- **Scenario:** two towns are hit by quakes 2 units apart. Choose which town's builders teach the other; then watch the Mercalli damage map.
- **State/action:** damage = strength × vulnerability (EV formula). Resistant construction lowers vulnerability.
- **Feedback on mistake:** sending the lesson the wrong way: the weak town is flattened by the *smaller* quake. Then: "ההבדל בין 100 ל-10,000 הרוגים באותה עוצמה … מוכנות ואיכות בנייה" (paraphrase; no deaths shown).
- **Misconceptions:** MAG, DMG, LIN
- **Transfer evidence:** for one quake, the player predicts different Mercalli readings in two towns.
- **⚠ Care:**
  - Standard 413 is unlocked only in L15, so here say **"בנייה עמידה"**, not "413" (sequencing).
  - Japan's deaths were "בעיקר בגלל הצונאמי". Don't model Japan's losses as shaking.

### L14 Tsunami
- **Modules:** EV
- **Skill:** a seabed break pushes up a water column → "לא גל אחד אלא סדרה של גלים". Warning and evacuation.
- **Scenario:** an offshore subduction trench. Choose the harbor site and the high-ground path before the quake.
- **State/action:**
  - Wave arrival time by distance.
  - Run-up by coast exposure.
  - Villagers are safe only if the path reaches above the run-up before the first wave **and** they stay there through the series.
- **Feedback on mistake:** villagers return after wave 1 and wave 2 soaks them, or the harbor faces the trench.
- **Misconceptions:** ONEWAVE, PRED
- **Transfer evidence:** a new coastline.
- **⚠ Care:** "high ground" is OURS. The module has "תוכניות פינוי" and Japan's "מערכות התרעה".

### L15 Transfer: Jordan Valley 1927
- **Modules:** EV, PT
- **Skill:**
  - The rift is an active boundary (PT/EV framing: the Arabian plate moving away from the African, "כמה מ"מ בשנה"; EV "צפון-מזרחה ביחס").
  - Quakes can't be predicted precisely.
  - 413 for new buildings; חיזוק for old ones.
- **Scenario:** the ~6.2 quake. Afterward, choose rebuild sites; Standard 413 unlocks.
- **State/action:** fault distance plus construction class → damage in the next modeled quakes. Stars come from placement and construction, never timing.
- **Feedback on mistake:** a site on the fault trace, or old unreinforced houses, collapse (slapstick). Waiting for a warning prompts "חיזוי מדויק … הוא כיום בלתי אפשרי".
- **Misconceptions:** PRED, MAG
- **Transfer evidence:** real places and a changed map, no overlays.
- **⚠ Care:**
  - **Module towns are טבריה, יריחו, שכם** (plus the risk areas עמק הירדן, בית שאן). Jerusalem is not named, so its new quarter is OURS.
  - S5: "עמק הירדן הצפוני" vs. "ליד ים המלח". Say only "בעמק הירדן / בבקע".
  - **Standard 413 did not exist in 1927** (outside the modules; FACTS §10). Frame the unlock as "today" ("היום ישראל בונה לפי תקן 413"), not as the 1927 rebuild.
  - Show place names only, no borders (COMMON politics rule). Use real coordinates.

## World 4: Rocks and the Land of Israel (סלעים וארץ ישראל)

### L16 Rock orders
- **Modules:** RM, PT
- **Skill:**
  - Rocks form by process: basalt from fast-cooling lava (פרץ), granite from slow cooling deep down (תהום), limestone with fossils in a shallow sea, marble from limestone under heat and pressure.
  - One cycle.
- **Scenario:** villagers order basalt, granite, limestone and marble. Make the planet produce each, then collect it with the rock hammer.
- **State/action:**
  - Rift eruption → basalt.
  - Deep magma under a convergent belt + erosion over time → exposed granite.
  - Long shallow sea → limestone (fossils).
  - Limestone buried in a collision → marble.
- **Feedback on mistake:**
  - Hammering granite for fossils: "מאובנים רק בסלעי משקע".
  - Basalt where granite was ordered: "התקרר מהר על פני השטח".
- **Misconceptions:** ROCK
- **Transfer evidence:** a fifth order (e.g. quartzite from sandstone) solved unaided.
- **⚠ Care:**
  - "Granite under a mountain belt" is OURS detail. The module only says "בתוך האדמה … לאט".
  - Use only יסוד / משקע / תמורה, never the table's alternative names (S7).
  - Don't assess גיר = קירטון.

### L17 Fossils at 700 m
- **Modules:** RM, LB
- **Skill:** marine fossils "יותר מ-700 מטר" up in the Jerusalem hills come from a **shallow** sea plus uplift by plate motion (LB: "הרמה של שכבות שהיו קודם לכן מתחת לים").
- **Scenario:** villagers think the sea was 700 m deep. Run a shallow sea, then uplift, and show the strata.
- **State/action:**
  - Shallow-sea duration → limestone thickness with shallow fossils.
  - Converging flow → folding and uplift ≥ 700 m.
  - Sea level never rises 700 m.
- **Feedback on mistake:** uplift before the sea gives a bare mountain with no shells; no uplift leaves the shells underwater. The cutaway shows shallow-water fauna: "הים היה רדוד; היבשה עלתה".
- **Misconceptions:** SEA
- **Transfer evidence:** a second fossil layer at another height.
- **⚠ Care:** limestone ages differ across modules ("כ-100", "100-70", Cretaceous). Don't assess them (S13).

### L18 Final: the Land of Israel (no hints)
- **Modules:** LB, PT, EV, RM, LD, WE
- **Skill:**
  - Three belts, three processes: coastal plain = deposition (external); mountain ridge = folding and uplift of marine limestone with the watershed; rift = tectonic breaking and sinking to the lowest point on land.
  - Golan basalt = volcanism.
  - Safe 413 sites.
- **Scenario:** the African and Arabian plates, from the sea to the desert. Use heat and time to make the rift, the ridge and the Golan. The coast builds itself from external processes. Then choose 413 sites before the rift quake. Nothing is labeled.
- **State/action:**
  - Shear plus sinking between the plates → rift floor ≈ −430 m.
  - Convergence → ridge, with drainage west and east.
  - Rift magma → Golan basalt.
  - External processes → kurkar ridges parallel to the coast.
- **Feedback on mistake:** outcomes only:
  - a ridge on the coast,
  - streams draining one way,
  - limestone in the Golan,
  - towns on the fault trace.
- **Misconceptions:** all
- **Transfer evidence:** an unaided west-to-east sequence and a quake survived.
- **⚠ Care:**
  - Use the **LB framing** here: "נעים זה לצד זה והקרקע שביניהם צנחה". Never contradict PT's "מתרחקים" (S2).
  - **Golan "אינה נמנית עם השלוש"**: never call it a fourth belt.
  - Dead Sea wording is "הנקודה הנמוכה ביותר ביבשה" (S14). The ~1 m/yr modern level drop is human-caused, not tectonic (S8).
  - The coastal sand comes from the Nile via sea currents, plus streams and wind. The model produces it on its own; no process chips.

---

## Hebrew terms: handoff vs. modules

| Handoff | Modules | Use |
|---|---|---|
| מתקרבים | **not used**; "לוחות מתנגשים (יבשה ביבשה / אוקיינוס ביבשה)" | מתנגשים |
| מחליקים זה לצד זה | "לוחות מחליקים", "נעים זה לצד זה" | לוחות מחליקים |
| רכס מרכז-אוקייני | "רכס מרכז-אוקיינוסי", "רכס מרכז האטלנטי" | רכס מרכז-אוקיינוסי |
| מוקד / מוקד-על | "מוקד הרעידה", "מוקד-העל" (table: "מוקד-על"); no אפיצנטר | as in the modules |
| פרשת מים | "קו פרשת המים הארצי" (LB), "קו פרשת מים" (WE) | קו פרשת המים |
| אזור ההר | LB uses both "שדרת ההר" and "אזור ההר" | שדרת ההר |
| גלי הדף | "גלי הדף" + "סיסמוגרף"; no P/S | גלי הדף |
| זרמי ערבול | "זרמי ערבול (זרמי קונבקציה)" | זרמי ערבול |
| hot plume / cold drip | not module terms | OURS UI words, e.g. "פלומה חמה" / "טפטוף קר". Explain as "חומר חם עולה" / "חומר קר יורד" (PT) |
| סלעי יסוד / משקע / תמורה | yes; table alternates (מרתף/ראשית, שכבה/אגירה, מטמורפוזה) | only יסוד / משקע / תמורה |
| גיר, קירטון | RM "גיר (קירטון)"; LB "הגיר והקירטון" | both words, never assessed as equal |
| תקן 413 | "תקן 413" for new buildings; "חיזוק" for old | "בנייה לפי תקן 413" / "חיזוק מבנה" |

## Not claimed

- No Ministry of Education approval or endorsement. Workbook modules define scope only.
- No measured learning gains; no student evaluation has been run.
- Time is compressed and labeled (Myr per run; 1,000 years in L12). Rates are shown in real units.
- Maps, the Israel slab and planet geometry are schematic. Relief is stylized from public-domain data; only the west/east, coast/ridge/rift relations and the stylized Dead Sea depth are kept.
- Convection is a simplified game model (plumes and drips on a grid). It is not a geophysical simulation.
- Villager behavior, damage numbers, tsunami run-up and quake timing are simplified models (OURS).
- Historical events (1927, Haiti 2010, Japan 2011) use only the module figures quoted in FACTS.md.
