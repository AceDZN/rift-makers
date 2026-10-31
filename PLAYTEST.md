# Rift Makers: playtest report

Independent playtest, 2026-10-31, against the dev server at `http://localhost:5243`.

## Method

- Headless Chromium (Playwright, SwiftShader WebGL), 1280×800 and 375×740 (touch, mobile). Scripts and screenshots are in `scratch/playtest/` (`lib.mjs`, `trial.mjs`, `sweep.mjs`, one `lN.mjs` per level, `bypass.mjs`, `select.mjs`).
- All progress came from real input: clicks on HUD buttons, clicks, drags and double-clicks on the canvas, touch taps on map pins, and the keyboard. No `window.game` or session methods were called to change state. Read-only calls: `render_game_to_text()` to observe state, `advanceTime(ms)` to fast-forward animation, and a read-only projection (`slab.toWorld` + `camera.project`) to find where a km point appears on screen, so the script could click what a student would see.
- Levels played: 1, 3, 4, 7, 8, 10, 14, 15, 16 and 18 at 1280×800, and levels 1 and 14 at 375×740. Levels were opened from the select screen or with `?level=N`.
- **The build changed during the session.** `levels.ts`, `israel.ts`, `game.ts`, `hud.ts`, `style.css` and `LEVELS.md` were edited between about 15:46 and 16:14, and Vite reloaded the page several times mid-script. Results describe the build as it ran between about 15:50 and 16:30. Line numbers and coordinates may drift.

## Findings

| # | Severity | Level | What I did | What happened | Expected |
|---|---|---|---|---|---|
| 1 | major | all (verified L4) | Failed L4 at 2 Myr, pressed **לבחירת שלב**, reopened L4 from the select screen, set 6 Myr, ran. | 3★. `mistakes` went back to 0 on re-entry. localStorage recorded `{"level":4,"unaided":true,"mistakes":0,"stars":3}`. **שוב** and a page reload also start a clean session. | Mistakes and runs should persist per level, so trial and error can't earn ★★/★★★, and the "unaided first try" record should be true only for real first tries. |
| 2 | major | L4 (any timed level) | Pressed Space to run, waited ~1 Myr, pressed **R** (also via pause → **התחילו מחדש**), raised the duration, ran again. | Time went back to 0 with no mistake recorded, and the duration could be changed again. The result was 3★ with `runs: 2`, even though the intro says "יש ריצה אחת". | Restart during a run should not undo committed time for free: it should count as a run or a mistake, or be disabled while running ("time only runs forward"). |
| 3 | major | L4 | Pressed + on the stepper. | The readout computes the answer live: "5 ס״מ/שנה × 6 מיליון שנה = 300 ק״מ". You step until it shows 300, with no reasoning. | Either hide the km result until after the run in L4, or show only the rate, so the student does 300 ÷ 50 themselves. |
| 4 | major | L8, L1, L16, L18 | Clicked on the slab with a heat tool or the hammer. | Clicks under any label are swallowed. `#labels > * { pointer-events: auto }` (an ID selector) overrides `.pin.passive` and `.bubble { pointer-events: none }`. L8: the "השדות" label covers the target fields, and 9 drip clicks at x 580–650 placed nothing (`elementFromPoint` = `div.pin.passive`). L1: the bubble "אנחנו רוצים ים!" blocks clicks over the village. L18: during heat planning, town-site pins cover 27 of 130 sampled slab points, including the NE Golan area where the plume belongs; a double-click there placed nothing. L16: old sample labels block new hammer clicks at the same spot. | Passive labels and bubbles should never intercept clicks. Town-site pins in L18 should appear only in the sites phase. |
| 5 | major | L3, L4 | Opened the level and dismissed the intro. | The burning plume and drip (`fixedHeat`) and the flow ribbons are **not drawn** until the first HUD action. The intro says "פלומה חמה וטפטוף קר כבר בוערים" but nothing is visible (`L03-plan-before-click.png` vs `L03-plan-after-one-click.png`; also `L04-plan.png`). `startLevel` never calls `syncHeats`. | Fixed heat and flow should be visible from the start. |
| 6 | major | L3 | Pressed one prediction button. | Surface flow arrows appear and point the way each plate moves, so the prediction is read straight off the slab. The hint ("עקבו אחרי החיצים", −★) points at arrows that are already free. A wrong run's line gives the answer ("הלוח המערבי נע מזרחה"). There is a single layout, so "both plates toward the middle" always wins. | LEVELS.md asks for three sub-rounds, including a mirrored one. Arrows should not show the answer before the commit. |
| 7 | major | L14 phone | 375×740: the choice list is hidden on phone, so the student taps map pins. | The correct pins, "⚓ מפרץ הצוק" and "⛰ הצוק 42 m", sit under the top bar at start (`tappable=false`, top = `topbar`). After any mistake they sit under the error toast, which does not go away. Taps on them did nothing. They become tappable only after dragging the camera down about 160 px. The "8.6" quake burst is half off-screen. | All choices should be reachable on phone without hunting with the camera. |
| 8 | major | L16 | Drip on seam A, plume on seam B, ran 14 Myr, hammered around the slab. | Rock readings don't match what's on screen. "גרניט" and "שיש" were collected from open blue sea floor at the original seam x=300. "בזלת" came from x=150, 450 km from the ridge. Limestone survives only in a thin strip at x<140. With the heat swapped (plume at A), all four samples were basalt and no line explained why. The wrong-sample lines from LEVELS.md ("התקרר מהר על פני השטח", "מאובנים רק בסלעי משקע") never appear; the toast stays "הזמן עצר. קחו את הפטיש…". | Samples should come from the landforms the student can see, and a wrong sample should say why. |
| 9 | major | L10 | Read the board. | The decoy piece is labelled **"האי הסורר"** ("the rogue island"), which names the wrong piece. The two real continents carry identical markers, so matching is trivial. Their start rotation (±0.26 rad ≈ 15°) is already inside `snapDeg` 16°, so rotation is never needed. The correct plume spot (3000, 1750) is the slab centre, where keyboard Enter drops heat. | A neutral name for the decoy, rotation that matters, and a heat answer that isn't the centre default. |
| 10 | major | L14 | Picked the first cove and the first hill. | **מפרץ הצוק** + **הצוק 42 m**, the first item in each row, is the only winning pair, so it gives 3★. The wave height (12 m), the time to the wave (18–20 min) and the walking speed appear only in the hint (−★) or after a failed run ("צריך מקום גבוה מ־12 מ׳", "הליכה: 9 min · עד הגל: 18 min"). | Shuffle or vary the option order, and give the student enough evidence to reason before the first run. |
| 11 | minor | L1 | Plume at the slab centre (400, 250), or east of the village. | "הים ברוחב 83 ק״מ: צר מדי. בקצב הזה צריך יותר זמן." L1's duration is fixed at 4 Myr, so the advice can't be followed. The real fix is moving the plume. | A line that points at plume position when the duration is fixed. |
| 12 | minor | L1, L7 | Random placements by real clicks (`sweep.mjs`). | L1: 6 of 12 valid random plumes won, all with 3★ (anything within ~100 km of the drawn seam). L7: 2 of 14 random heat + duration tries won with 3★. "Drip near seam + maximum 20 Myr" always wins L7 because there is no upper limit. L8: 0 of 14. | LEVELS.md targets ≤5% random wins. L1 is a tutorial, but the seam is already drawn as a dashed line. |
| 13 | minor | L4 | Compared the readout with the judged width. | Readout 175 km → measured sea 187 km. Readout 300 km → 312 km. The judge adds about 12 km that the readout doesn't show. | The same number in the readout and the result. |
| 14 | minor | L14, L15 | Read the map pins. | Pin decluttering pushes stacked pins into the void above the slab, so their arrows no longer point at their place. L15: the three Tiberias pins float above the slab's north edge. L14: the cliff pins float off the slab. The question "which cove is near which hill, which site is on the fault" can't be read from the map. | Pins anchored to their place, with leader lines if they are moved. |
| 15 | minor | L15, L18 | Chose collapsing sites. | Grammar: "השכונה החדשה קרסה ברעידה **בעל קו השבר**" (from `ב` + "על קו השבר"). Only the first collapsed town is explained; Shechem's failing slope is not mentioned until Tiberias is fixed. L18: "שפת המצוק … קרקע רכה מגבירה את הטלטול" calls a cliff edge soft ground. | Correct Hebrew. Explain every collapsed town. |
| 16 | minor | L18 | Read the intro and the fail lines. | The final is "בלי רמזים ובלי תוויות", yet the town-site pins are labelled from the start ("עיר הבקע: על קו השבר"), and fail lines spell out the fix ("חסרה הבזלת בצפון־מזרח, מעבר לבקע", "לבה פרצה במערב"). The judge is mostly x-range rules on heat positions. | Decide whether the final should name the missing belt. |
| 17 | minor | L7, L8 (`anyHeat`) | Looked at the tray. | It shows "פלומה חמה 1/1" and "טפטוף קר 1/1" side by side, which reads as one of each. Only one heat in total is allowed. | One shared counter, e.g. "חום אחד: פלומה או טפטוף". |
| 18 | minor | stars | L10 with 3 mistakes, L14 and L15 with 2. | Still 2★, because the "extra" star is independent of mistakes. One mistake and many mistakes score the same. | Check this is intended. |
| 19 | minor | select | Won L3 through `?level=3` before playing L2. | L3 shows 🔒 with gold stars, and L4 is open. `?level=18` opens a locked final directly; the comment in `host.ts` says this is by design. | A level with stars shouldn't show a lock. |
| 20 | minor | HUD | L1 replay with a hint (2★, best 3★). | The title card draws 2 stars but its `aria-label` says "3 כוכבים". | Consistent label. |
| 21 | minor | phone L1 | 375×740. | The compass "צפון ↑ W ← → E" is off-screen at x −44..3. The "עם סירות!" bubble is clipped on the result screen. The slab's east edge is cut off. | Fit to the narrow width. |
| 22 | minor | L3, L10, L16, L18 | Looked at the time block. | "? ס״מ/שנה × N מיליון שנה = ? ק״מ" shows where it means nothing. In L10 it still shows "?" after the 120 Myr run. | Hide it where there is no single rate. |
| 23 | minor | L14, L12 | Read the units. | Latin units inside Hebrew text: "42 m", "9 min", "km" in the L12 info line. Elsewhere the UI uses מ׳ and ק״מ. | Hebrew units. |
| 24 | minor | console | Every level load. | No errors. Warnings: "THREE.WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead." on each load, and a SwiftShader "GPU stall due to ReadPixels". | Drop the deprecated shadow type. |

### What worked

- The mistake path explains in Hebrew in one to three lines on every level tried. Lines seen:
  - L1: "הזרמים משכו את הלוחות זה אל זה… ים נפתח במקום שהלוחות מתרחקים"
  - L7: "הפלומה החמה משכה את הלוחות זה מזה… עכשיו הם דגים בתחתית העמק"
  - L8: "הלוח הצולל שקע ממש ליד החוף…"
  - L10: "החוף אולי מתאים, אבל המאובנים ורצועות הסלע… שונים"
  - L14: "ברחו לגבעה בגובה 9 מ׳, נמוכה מהגל"
  - L18: "הלוחות נמשכו זה מזה ונפתח ים צר…"
- **התחילו מחדש** kept every heat marker (L1, L10, L16, L18) and the L3 predictions. Dragging a placed marker to a new spot after restart worked.
- Levels 1, 3, 4, 7, 8, 10, 14, 15, 16 and 18 can all be finished by clicking. Level 1 can also be finished keyboard-only: Enter, 1, Enter, →×8, Space gave 3★.
- Pause (Esc or P) freezes time. The stepper, `[`/`]`, digit keys and Delete are ignored while paused or running. Spamming ▶ registers one run.
- Stars save and persist after reload. The best score is kept after a worse replay. Locked levels can't be clicked. Finishing L1 unlocks L2.

## Bypasses tried

| Bypass | Result |
|---|---|
| Random heat placement (real clicks) | L1: 6/12 won, 3★. L7: 2/14, 3★. L8: 0/14. L16 random heat + random hammer: 0/6. L16 right heat + 10 random hammer clicks: 0/4. |
| Spamming run (double-click, 5 more clicks, Space ×3) | No effect: `runs` = 1. |
| Constant strategy: plume at slab centre | L1 fails. L10 **wins** (centre is the answer, and it is where keyboard Enter drops heat). |
| Constant strategy: drip near the middle seam at maximum time | L7 **wins 3★** (20 Myr). L8 fails. |
| Constant strategy: first option in every row | L14 **wins 3★**. L3 fails. L15 fails (it picks "על קו השבר"). L18 sites fail. |
| Constant strategy: both plates "toward each other" | L3 **wins**: one layout, no mirrored round. |
| Clicking pins in order | L14: first cove + first hill = the answer. |
| Rapid double-click on the canvas with a tool | No duplicate heat: the second click toggles selection. In L18 the double-click was swallowed by town-site pins. |
| Keyboard-only | Works for L1 (3★). Enter drops heat at the slab centre, which is the answer in L10. |
| Pausing mid-run | Time freezes, and nothing can be changed while paused. No bypass. |
| **R / restart mid-run** | **Bypass**: rewinds time with no penalty, the duration becomes editable again, and L4 still gives 3★ with 2 runs. |
| **Leaving and re-entering the level** (select screen, **שוב**, or reload) | **Bypass**: mistakes reset to 0, so you can fail, re-enter and win 3★. The learning record is stored as unaided. |
| Changing duration after the run starts (stepper, `[`/`]`) | Blocked: the stepper is disabled and the keys are ignored. |
| Space or ▶ on the review card | Does not run. R restarts, as documented. |
| Reading the L4 readout instead of computing | **Bypass**: the readout shows "= 300 ק״מ" at 6 Myr. |
| Reading the L3 flow arrows | **Bypass**: the arrows show each plate's direction before the commit. |
| Hint | Costs a star as documented (L4 with hint = 2★). |
| Deep link `?level=N` to a locked level | Opens it; documented as intended in `host.ts`. |

## Fixes after the playtest

Status of each finding in the build that follows this report. Every fix is re-checked by `npm test` (64 tests) and a full browser replay (`scripts/drive.mjs`).

| # | Status | What changed |
| --- | --- | --- |
| 1 | fixed | Mistakes and hints are kept per level until the level is won (`progress.pending`) and carried into the next attempt, so leaving and re-entering can't earn ★★★. Test: "carried mistake caps stars". |
| 2 | fixed | Restart is refused while time runs and after the result; the pause card hides it during a run. Test: "no free rewind". |
| 3 | fixed | The readout shows "? ק״מ" until the run ends; the student works out rate × time. |
| 4 | fixed | Labels and bubbles never take clicks (`#labels > * {pointer-events:none}`, only pin buttons opt in). L18 town-site pins appear only in the sites phase. |
| 5 | fixed | Fixed heat and its flow are drawn from the start. |
| 6 | partly | Flow arrows in prediction levels show only with the hint. The mirrored second layout is still open. |
| 7 | fixed | On phones the choice list scrolls inside the card, and the toast no longer covers or blocks pins. |
| 8 | fixed | The hammer reads the landscape as it stands now (crest, sea floor, limestone), and every sample says what rock it is and which family. |
| 9 | fixed | The decoy is "יבשת הדרום"; the pieces start rotated past the snap angle; keyboard Enter drops heat off-centre. |
| 10 | fixed | Options are shuffled per attempt, and the panel shows wave height, time to the wave and walking speed before the first run. |
| 11 | fixed | With a fixed duration the line says to look for where the plates pull apart between the villages. |
| 12 | open | L1 stays forgiving (tutorial). L7 still accepts any duration above the minimum. |
| 13 | open | The judge measures the sea at the shoreline, about 12 km wider than rate × time. |
| 14 | partly | Stacked pins move up at most 2.2 pin heights, so they stay near their place; no leader lines. |
| 15 | fixed | Grammar fixed; cliffs and slopes get their own line; every collapsed town is named. |
| 16 | by design | Left for the lead to decide: the final names the missing belt after a failure, as feedback. |
| 17 | fixed | One shared note in the tray: "חום אחד: פלומה או טפטוף". |
| 18 | by design | The extra star rewards a goal met cleanly; mistakes already cost the no-mistake star. |
| 19 | fixed | A level with stars is never shown locked. |
| 20 | fixed | The title card's label says the stars it draws. |
| 21 | fixed | The compass is kept inside the screen. |
| 22 | fixed | The rate × time readout appears only in levels with one seam and one rate. |
| 23 | fixed | Hebrew units: מ׳, דק׳, ק״מ. |
| 24 | fixed | `PCFShadowMap`. |

Bypasses closed: restart mid-run, re-entering the level, reading the L4 readout, reading the L3 arrows, first option in L14, the centre keyboard drop in L10.
