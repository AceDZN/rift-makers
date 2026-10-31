# Rift Makers — שוברי היבשות

A 3D god-game in Hebrew for grades 8–9 geography. You rule a small floating slab of planet, but heat is your only power: put **hot plumes** and **cold drips** in the mantle, commit how many million years to run, and watch the plates part, collide or slide on their own. Then read what happened (seismographs, the rock hammer, sea-floor ages) and advise the pebble villagers where to live.

Curriculum: Workbook grade 8, chapter 4 (earth structure, plate tectonics, earthquakes and volcanoes, rocks and minerals) and grade 9, chapter 2 (landform belts, landscape diversity). See [CURRICULUM.md](CURRICULUM.md).

## Run it

```bash
npm install
```

```bash
npm run dev
```

The dev server is on http://localhost:5243. Add `?level=N` to jump to a level (1–18).

```bash
npm test
```

```bash
npm run build
```

```bash
npm run preview
```

`npm run build` makes an offline static site in `dist/` (relative paths, no backend, no analytics, no keys). `npm run preview` serves it on port 4243.

To replay every level in a real browser through the game controller and save screenshots (needs the dev server running):

```bash
node scripts/drive.mjs http://localhost:5243 docs/screenshots
```

## Controls

| Action | Mouse / touch | Keyboard |
| --- | --- | --- |
| Pick hot plume / cold drip | tap the button in the tray | `1` / `2` |
| Place heat | tap the slab | — |
| Move heat | drag it | arrow keys (selected heat) |
| Remove heat | the ✕ button | `Delete` |
| Duration | − / + | `[` / `]` |
| Run deep time (forward only) | the orange run button | `Space` |
| Orbit / zoom | drag empty space, pinch, wheel | `Q` / `E`, `+` / `−` |
| Hint (costs a star) | 💡 | `H` |
| Restart (heat stays) | in the review card | `R` |
| Pause / mute | top-left buttons | `P` or `Esc` / `M` |

Keys use physical positions, so they work with a Hebrew keyboard layout. North is up (away from you) and east is to the right; the tutorial says so and a compass sits on the slab.

## What is implemented

- **18 levels in 4 worlds**, each with a transfer level and a final with no hints. Every level is solvable with 3 stars through the same calls the UI makes (`tests/solutions.ts`), and plays through in a real browser (`scripts/drive.mjs`). See [LEVELS.md](LEVELS.md).
- **Emergent boundaries:** the model in `src/model/` turns heat into mantle flow, flow into plate motion along each seam, and motion into a boundary type (pulling apart, pushing together, sliding). There is no boundary-type picker, depth slider, rock-cycle button, budget or time scrubber.
- **Pure model, tested:** 43 tests (`npm test`) cover all levels, each boundary type from the right heat, continent–continent collisions without volcanoes, subduction with trench and arc, the level-7 "fishing in the valley" mistake, 2 Richter units ≈ 1,000× energy, site choice versus boundaries, constant and random strategies failing, rate × time, sea-floor age, rock rules, and the final slab against real relief.
- **3D scene:** one WebGL canvas with a floating slab, strata walls, a mantle cutaway whose convection ribbons follow your heat, a glowing core, water with depth colour, tree clumps, volcano smoke, seams and flow arrows. Tripo models: rigged pebble villagers (idle, cheer, panic, fall, build, walk), a rigged scientist, a rigged dog, houses with a "413" variant, boat, seismograph, warning tower, hot spring, ammonite, observatory, trees. See [ASSETS.md](ASSETS.md).
- **Real relief for Israel:** level 18's rift floor comes from bundled NOAA ETOPO1 data (public domain), and tests check the built slab against the real belts and Dead Sea level.
- **Feedback:** a one- or two-line Hebrew explanation after every mistake; restart keeps your heat so you change it on purpose; stars = 1 + no mistakes + a goal met cleanly − a hint.
- **Accessibility:** Hebrew RTL with Rubik bundled, numbers in LTR spans, feedback never by colour alone (icons and words), mute, pause (and auto-pause when the tab is hidden during a run), reduced motion (follows the system setting), keyboard play, works at phone width.
- **Progress and learning events:** stars per level and first-attempt events (unaided or hinted, mistakes) stay in `localStorage`; nothing leaves the browser.
- **Test hooks:** `window.render_game_to_text()` and a deterministic `window.advanceTime(ms)`.

## Planned, not built yet

- Generated "planet commissions" after the 18 levels (new layouts checked by the solver before they are offered).
- Rivers (the Jordan and a Kinneret that fills from them); today only the Dead Sea forms as a closed lake.
- A sound pass with recorded effects; the current sounds are synthesized.

## Deploying to Vercel

The game is a static site. Nothing is deployed unless you choose to.

1. Push this repository to GitHub (it is at `AceDZN/rift-makers`).
2. In Vercel, **Add New → Project** and import the repository.
3. Framework preset: **Vite**. Build command `npm run build`, output directory `dist`.
4. No environment variables are needed. Deploy.

Or from a terminal with the Vercel CLI:

```bash
npx vercel --prod
```

## Docs

- [GAME_IDENTITY.md](GAME_IDENTITY.md): the four verbs, the first 30 seconds, what this game is not.
- [LEVELS.md](LEVELS.md): every level, its misconception and its verified solution.
- [CURRICULUM.md](CURRICULUM.md): Workbook modules and facts.
- [ASSETS.md](ASSETS.md): models, credits, relief data.
- [docs/VISUAL_REVIEW.md](docs/VISUAL_REVIEW.md): real screenshots against the visual targets.
- [PLAYTEST.md](PLAYTEST.md): the independent playtest.
- [progress.md](progress.md): build log.
