# Visual targets: prompts and provenance

These are **design targets** generated before the scene was built. They are not screenshots of the game. Copy their camera, silhouettes, materials, lighting and HUD layout. Do not copy their generated Hebrew, numbers or exact geology: the generated Hebrew is often wrong.

- **Tool:** ChatGPT image generation (gpt-image) in the user's signed-in Chrome, in the art helper's own tab. Everything was generated in one chat, and each prompt asks for "the same game and the same art style".
- **Chat URL:** https://chatgpt.com/c/6ae5de80-bae0-83ed-ac10-abbf324dd9e6
- **Date:** 2026-10-31
- **Output size:** 1672 × 941 PNG (ChatGPT's 16:9 output; 1536 × 1024 was asked for and not produced).
- **Download:** the image viewer's download button, then moved from `~/Downloads` into this folder.

## Design change on 2026-10-31 (v1 → v2)

The first set (v1) showed the old push/pull/slide tool tray, a time slider and a budget counter. The handoff was rewritten the same afternoon:

- The player places **hot plumes** and **cold drips** on a mantle grid.
- The player commits a **forward-only** duration.
- The player reads evidence (seismograph, rock hammer).
- The player advises villagers with a map pin.
- There are no boundary-type buttons, no time scrubbing and no budget.

All targets were therefore redone with the new HUD (v2). The v1 images and docs are kept in `superseded-v1/` for history only; do not build from them.

ChatGPT treated the v2 prompts for 01, 02 and 05 as **edits** of the matching v1 images. They kept the v1 composition and only changed the HUD and cutaway, which is why those scenes match v1 closely.

| File | Role | Download name | Attempts | SHA-256 |
| --- | --- | --- | --- | --- |
| `01-first-30s.png` | first 30 s: plume opens a sea | `Rifting Ocean Basin Game Diorama.png` | v1 + v2 | `d20a383d71ab21af1ce9aaabfb7356d4b78a00578d309e91c7c850eb83af7939` |
| `02-subduction-quake.png` | core action mid-play: drip, trench, quake, advice pin | `Volcanic Subduction Zone Simulation.png` | v1 + v2 | `f0e4b8e4e2be006111d54fbf9cf85720d6053585a00e43fc99f773b511253bc9` |
| `03-mistake-valley.png` | failure/consequence: plume under the "mountain" villagers | `Failed Rift Valley_ Magma's Mistake.png` | 1 | `9dfc9d4a82fe2f35dbcceb7169c7c7a3ab4cbb63cf1d64ec5338af203721e20b` |
| `04-level-select.png` | level select / progression | `Earth Science Adventure Level Select.png` | 1 | `98e36306e53b72dd6d67ec02c807642949d887232cb1fa47e88a70df5589b0b2` |
| `05-israel-final.png` | final level, Land of Israel | `Building Israel_ Earth in Motion.png` | v1 + v2 | `fd34c198fafddc08878da757c9690186eed3b542e9efd18399435c2b321639ad` |

The superseded v1 prompts are in `superseded-v1/PROMPTS-v1.md`; they also describe the scene in more detail.

---

## 01-first-30s.png — first plume opens a sea (Level 1)

**Prompt (exact, v2):**

> The game design changed: the player no longer picks push/pull/slide. The player is the spirit of the mantle and places heat under the crust. Please make a NEW version of the first image (same game, same art style, same scene, landscape 16:9, design target): the same floating diorama slab in a dark starry void, 3/4 isometric orbit camera, warm dramatic From Dust meets Reus lighting, real 3D depth, not flat vector art. On top: green lowland split by a fresh glowing orange rift that is sinking and flooding into a new turquoise sea, parallel dark basalt stripes either side of a central glowing ridge, waterfalls pouring in, dust puffs; cute round pebble-people villagers (grey and sand river-stone bodies, big eyes, green leaf scarves) cheering on both shores, one launching a small wooden fishing boat. The front cutaway: a THIN brown/tan crust at the top, a thick orange-red mantle, a liquid glowing amber outer-core band and a separate bright white-yellow solid inner-core band at the bottom. In the mantle, directly under the rift, a tall glowing orange-yellow HOT PLUME column rises from deep down and spreads sideways under the crust in two curling convection ribbons with flow arrows pulling the two sides apart; a small glowing placement marker ring sits at the base of the plume on a faint grid drawn on the mantle. Hebrew right-to-left HUD, navy and cream, chunky rounded panels with soft shadows: top-right navy pill with the level name "פותחים ים" and 3 stars; top-left round pause and mute buttons and a small round "heat view" toggle with a thermometer icon; bottom-center a forward-only deep-time bar (a progress track with a small arrow, no slider knob) with a navy readout "5 ס״מ/שנה × 2 מיליון שנה = 100 ק״מ", small − and + duration buttons, and a big chunky orange play button reading "▶ הרץ 2 מיליון שנה"; bottom-right a cream tool tray with two big chunky heat buttons: "פלומה חמה" (orange flame rising up icon, selected with glowing ring, small counter "1/1") and "טפטוף קר" (blue drop sinking down icon), plus two small round evidence tool buttons: a seismograph icon and a rock hammer icon. No push/pull/slide buttons.

**Keep:**
- The hot plume rises from a glowing ring on the mantle grid straight up into the ridge.
- The two convection loops have big arrows pulling apart.
- The crust is now visibly thinner.
- HUD:
  - The red thermometer "תצוגת חום" toggle.
  - The forward-arrow time bar with ticks 0/0.5/1/2.
  - The navy readout box, and the −/value/+ stepper.
  - The big orange "הרץ 2 מיליון שנה" button.
  - The tray: big orange "פלומה חמה" (selected, 1/1) and big blue "טפטוף קר", with small seismograph and hammer buttons.

**What's off:**
- The core is still one glowing dome; there is no separate outer-core band. Build both bands.
- The readout splits "= 100 ק"מ" onto a second line, with RTL ordering. Use LTR spans in the real UI.
- The time bar still looks like a slider track. Keep it a progress bar that fills only while time runs.

## 02-subduction-quake.png — core action mid-play: cold drip, trench, quake

**Prompt (exact, v2):**

> Great. Now a NEW version of the second image (subduction and the quake) with the new heat-based HUD, same game and same art style, landscape 16:9, design target. Same floating diorama slab in a dark starry void, same 3/4 isometric orbit camera, warm dramatic light, real 3D depth. On top: on the left a deep blue ocean plate with a deep V-shaped trench in the sea floor just offshore; on the right a green-and-brown continent with a chain of three smoking cone volcanoes puffing round white smoke rings a little inland from the coast. The front cutaway: the cold dark-blue-grey ocean slab diving at an angle under the continent into the orange-red mantle; directly under the trench a dark blue COLD DRIP column sinks downward from the slab into the mantle with cool blue convection ribbons and flow arrows pulling the plates together, a small blue placement marker ring at its base on a faint grid drawn on the mantle; blobs of glowing magma rise from above the diving slab at depth up to feed the volcanoes. A pebble-people town (cute round grey and sand river-stone villagers with big eyes and leaf scarves) on the continent is shaking: two cartoony houses collapse in a puff of dust while other stone houses with a green shield badge reading "413" stand firm; villagers ducking, one hugging a little barking cream dog with motion lines. A small seismograph station with a drum recorder on a hill shows a zig-zag trace. A big comic "6.8" quake starburst with shake arcs. On a safe green hill farther from the coast, a big glowing map pin with a small house icon marks where the player advised the villagers to build, with a happy villager next to it. Same Hebrew right-to-left HUD, navy and cream, chunky rounded: top-right navy pill "רעידה בעיר החוף" with stars; top-left round pause, mute and "heat view" thermometer toggle; NO budget or coins counter; bottom-center a forward-only deep-time bar with readout "10 ס״מ/שנה × 1 מיליון שנה = 100 ק״מ", − and + duration buttons and a big orange "▶ הרץ 1 מיליון שנה" button; bottom-right the cream tool tray with two big heat buttons "פלומה חמה" (orange up arrow) and "טפטוף קר" (blue down arrow, selected with glowing ring), plus small round seismograph and rock hammer buttons, and a small "ייעוץ" advice pin button. Dramatic but funny, not scary.

**Keep:**
- The cutaway:
  - A blue cold-drip vortex sinks from a blue ring on the mantle grid.
  - Blue convection loops flow on the ocean side and orange loops on the continent side.
  - The ocean slab dives under the continent with white flow arrows.
- The town:
  - Collapses in dust.
  - Two green "413" shields.
  - A villager hugs the cream dog.
- The seismograph drum station on the hill.
- The "6.8" starburst.
- A **green house map pin** with a happy villager on the far hill (advice).
- No budget counter.
- The tray, from the right:
  - ייעוץ (pin)
  - סלעים (hammer)
  - מדידות (seismograph)
  - טפטוף קר (selected, 1/1)
  - פלומה חמה

**What's off:**
- The drip sits under the ocean plate, well left of the trench. In the model the drip goes where the plates converge.
- The trench still reads as a coastal cliff, not a V trough in the sea floor.
- Magma reaches the volcanoes as lava cracks in the crust, not as blobs rising from the slab at depth.
- The evidence labels "סלעים" and "מדידות" were invented by the generator. Use the game's own terms.

## 03-mistake-valley.png — failure/consequence moment

**Prompt (exact):**

> Excellent. Now a NEW third image, same game, same art style, same heat-based HUD, landscape 16:9, design target: the FAILURE / consequence moment. The villagers asked for a mountain, but the player placed a hot plume under them, so the land pulled apart instead. Same floating diorama slab, same 3/4 orbit camera, but slightly cooler dusk light. On top: a wide sunken rift valley with steep fault cliffs on both sides and a shallow lake on the valley floor; on the valley floor a group of pebble-people villagers (round grey and sand river-stone bodies, big eyes, leaf scarves) sit grumpily with tiny fishing rods dangling into the shallow lake, one with a sulky face and a small storm cloud above its head, another pointing up at an empty speech bubble showing a small mountain icon (what they wanted); a toppled little stone house lies in the valley with a dust puff. The cutaway shows the glowing orange hot plume column under the valley spreading apart in two convection ribbons, with the plume and ribbons outlined in a pulsing replay highlight, and a faint "rewind replay" film-strip border at the edges of the screen. A rounded cream result card in the middle-right, navy title "אופס! רצו הר, קיבלו בקעה", one short Hebrew explanation line "הפלומה החמה משכה את הלוחות לצדדים — הקרום שקע", and two chunky buttons: orange "נסה שוב" with a circular arrow and a smaller navy "רמז" with a lightbulb. Same HUD: top-right navy level pill "ההר של הסבתא" with empty stars, top-left pause, mute and thermometer heat-view toggle, bottom-center the forward-only deep-time bar dimmed, bottom-right the heat tool tray dimmed. Funny and gentle, not harsh.

**Keep:**
- Dusk light.
- A wide graben with stepped fault cliffs and a small lake on the floor.
- Five grumpy villagers fishing. One has a storm cloud and one a speech bubble with a mountain icon.
- A collapsed hut.
- Film-strip edges for the replay.
- The plume in the cutaway with its pull-apart arrows.
- The result card: navy title bar, one explanation line, a big orange "נסה שוב" and a smaller navy "רמז".
- Level pill with three empty stars.

**What's off:**
- The HUD tray and time bar are not dimmed.
- The dash in the explanation line is flipped by RTL wrapping.
- The slider label is misspelled "מילנוני".
- The level name "ההר של הסבתא" is a placeholder invented in the prompt, not a level from the handoff.

## 04-level-select.png — level select / progression

**Prompt (exact):**

> Wonderful. Now a fourth image, same game and same art style, landscape 16:9, design target: the LEVEL SELECT / progression screen. A slowly rotating small 3D planet floats in the dark starry void at the center, with one wedge cut out like a cake slice showing glowing layers (crust, orange mantle, amber outer core, bright inner core). Around the planet, four floating diorama-slab "worlds" are arranged in an arc like islands, each a small chunky slab with a cutaway: World 1 "בבטן כדור הארץ" (a slab with a glowing plume and a new rift sea), World 2 "לוחות בתנועה" (a slab with folded snowy mountains and zebra-striped sea floor), World 3 "רועד ובוער" (a slab with a smoking volcano ring and a little seismograph station), World 4 "סלעים וארץ ישראל" (a slab with cream limestone ridge, a deep rift with a turquoise salt lake and dark basalt). Each world has a navy-and-cream rounded label with its Hebrew name and a row of small round numbered level nodes (1–5, 6–10, 11–15, 16–18) connected by a dotted path; completed nodes are gold with 1–3 small stars, the current node pulses orange, later nodes are grey with a small lock. World 4 is still mostly locked. Tiny pebble-people villagers stand on the slabs waving, and a little rigged scientist with a moustache and fur parka holding a map stands next to World 2. Hebrew right-to-left HUD: top-right big navy title pill "שוברי היבשות", top-left round settings and mute buttons, top-center a small total stars counter "★ 21/54", bottom-center a big chunky orange "המשך" (continue) button. Warm rim light on the slabs, magical and inviting, something a 13-year-old wants to explore.

**Keep:**
- A central globe with a cake-slice cutaway (crust, mantle with arrows, core).
- Four tilted world slabs arranged in an arc above and around it, linked by dotted orange paths.
- Navy name labels.
- Gold numbered nodes with star rows and grey locked nodes.
- The scientist with a map on World 2, and villagers waving.
- Title pill "שוברי היבשות" with a globe icon.
- Stars counter "21/54", settings and mute.
- A big orange "המשך".

**What's off:**
- The worlds and level nodes run left to right (1 on the left). In the RTL UI, order them right to left.
- Three nodes pulse as "current" (5, 8 and 13). There should be one.
- World numbers are written "1." in front of the name. Use the game's own world labels.

## 05-israel-final.png — final level, building the Land of Israel

**Prompt (exact, v2):**

> Great. Finally a NEW version of the "building the Land of Israel" final-level image with the new heat-based HUD, same game and same art style, landscape 16:9, design target. Same floating diorama slab in a dark starry void, 3/4 isometric orbit camera, warm golden late-afternoon light. Top surface from west (left) to east (right) in parallel north-south belts: blue Mediterranean strip with surf; pale sandy coastal plain with low elongated kurkar sandstone ridges running parallel to the coast and a few orchards; a broad cream limestone mountain ridge with terraces and olive trees, small streams flowing down both its west and east flanks; a deep steep-walled sunken rift valley with a salty turquoise lake far below the rim ringed by white salt crust; a dark basalt plateau in the far north-east corner. The front cutaway: neatly layered cream and tan limestone and chalk strata gently folded under the ridge with SMALL ammonite fossils embedded high in the upper layers, the layers dropping in step faults into the rift, and in the mantle below two glowing orange-yellow hot plume columns and one dark blue cold drip with convection ribbons and arrows showing the plates sliding past each other along the rift. NOTHING on the land is labeled. Small pebble-people villagers (round grey and sand river-stone bodies, big eyes, leaf scarves) and little cream stone houses with green "413" shield badges on the coastal plain and the ridge; one villager points happily at a small fossil; a glowing green advice map pin with a house icon sits on the safe ridge. Same Hebrew right-to-left HUD, navy and cream, chunky rounded: top-right navy level pill "בונים את ארץ ישראל" with 3 stars; top-left pause, mute and the red thermometer heat-view toggle; bottom-center the forward-only deep-time bar with readout "1 ס״מ/שנה × 20 מיליון שנה = 200 ק״מ", − and + duration buttons and a big orange "▶ הרץ 20 מיליון שנה" button; bottom-right the cream tool tray with the big "פלומה חמה" (orange up arrow, counter 2/2) and "טפטוף קר" (blue down arrow, counter 1/1) buttons and small round seismograph, rock hammer and advice-pin buttons. Calm, proud, finale feeling.

**Keep:**
- West-to-east belts:
  - Sea with sailboats.
  - Sandy plain with villages and orchards.
  - Terraced limestone ridge with streams down both flanks.
  - A deep V rift with a turquoise salt lake ringed by white salt.
  - Black columnar basalt at the top right (north-east).
- Cutaway: folded cream/tan strata, step faults into the rift, two plume columns, and one blue drip under the rift.
- "413" shields and a green advice pin on the ridge.
- No labels on the land.
- Tray counters 2/2 and 1/1.

**What's off:**
- The ammonites are still huge: one is house-sized on the ridge surface, and big ones sit in the cutaway. Keep fossils small.
- There are no distinct kurkar ridges. Add them procedurally.
- The heat layout is invented by the generator. The real solution comes from the model.
