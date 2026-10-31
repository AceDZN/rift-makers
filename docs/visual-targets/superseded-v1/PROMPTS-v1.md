# Visual targets: prompts and provenance

These are **design targets** generated before the scene was built. They are not screenshots of the game. Copy their camera, silhouettes, materials, lighting and HUD hierarchy. Do not copy the generated text, the numbers or the exact geology.

- **Tool:** ChatGPT image generation (gpt-image) in the user's signed-in Chrome, in a tab the art helper opened for itself. All three images come from one chat. Prompts 2 and 3 ask for "the same game and the same art style" so the set stays consistent.
- **Chat URL:** https://chatgpt.com/c/6ae5de80-bae0-83ed-ac10-abbf324dd9e6
- **Date:** 2026-10-31
- **Output size:** 1672 × 941 PNG. This is ChatGPT's 16:9 output; 1536 × 1024 was requested but not produced.
- **Download:** each image was saved with the image viewer's download button, then moved from `~/Downloads` into this folder. The original download filenames are listed below.
- **Attempts:** each image was generated once. None needed regenerating; known gaps are listed under each image.

| File | Download name | SHA-256 |
| --- | --- | --- |
| `01-first-30s.png` | `Opening Sea Rift Game Diorama.png` | `889d11924a127d61dde425ee4ae4025290bd3f7ab80c2a3106850a6fca7fec24` |
| `02-subduction-quake.png` | `Subduction Zone Earthquake Game UI.png` | `78e7f70e78c8b1631f016c33ce706e9a1deaf97dc9e899b89f811c282e093f7f` |
| `03-israel-final.png` | `Israel Geological Rift Diorama Game Map.png` | `1eaf14027d583aa13b8f5664b9f9ea323568d743cf773f4494b586802e728f4a` |

---

## 01-first-30s.png — "pull apart" moment (Level 1, פותחים ים)

**Prompt (exact):**

> Generate an image, landscape 16:9 (1536x1024): a design target for an in-game screenshot of a polished real-3D browser geography game for teens called "Rift Makers" (Hebrew title שוברי היבשות). Stylized, rich, premium indie look like From Dust meets Reus: a living diorama, real 3D depth, warm dramatic lighting, stylized low-poly-ish shapes with rich materials. NOT a worksheet, NOT flat vector art. Scene: the "pull apart" moment. A floating rectangular diorama slab of living planet hangs in a dark starry void, seen from a 3/4 isometric orbit camera from above-front. The front face of the slab is a glowing cutaway showing strata (stylized, not to scale): a thin brown/tan crust at top, a thick orange-red mantle with swirling convection ribbons and glowing magma, a liquid glowing amber outer core, and a bright white-yellow solid inner core band at the bottom. On top of the slab: green lowland that has just split along a fresh glowing orange rift crack; the middle is sinking and flooding into a new turquoise sea, with parallel dark basalt stripes on either side of a central glowing ridge on the new sea floor, a waterfall of sea water pouring in, dust puffs at the cliff edges. Tiny cute round "pebble people" villagers (smooth grey and sand-colored river-stone bodies, big friendly eyes, little arms and legs, tiny leaf scarves) cheer on the shore with raised arms, while one launches a small wooden fishing boat into the new sea; a few small stone houses nearby. Minimal Hebrew right-to-left game HUD with chunky rounded panels, soft drop shadows, navy and cream: top-right a navy pill with the level name "פותחים ים" and 3 stars; top-left round pause and mute buttons; bottom-center a large horizontal "deep time" slider labelled "מיליוני שנים" with a readout "5 ס״מ/שנה × 2 מיליון שנה = 100 ק״מ"; bottom-right a tool tray with three big chunky buttons with icons: push (two arrows meeting) "דחיפה", pull (two arrows apart, highlighted as selected) "משיכה", slide (two opposite parallel arrows) "החלקה". Exciting and inviting, something a 14-year-old would want to play.

**What's off (do not copy):**
- The crust is a thick block layer, not the thin skin the prompt asked for. In the game the crust should be visibly thin relative to the mantle.
- The core is a single glowing dome. The outer and inner core are not separate bands. The game's cutaway should show a liquid outer-core band above a brighter solid inner core, as the pure layer model says.
- The rift runs away from the camera (front to back), so the sea opens toward the horizon. That composition reads well and the basalt stripes are symmetric about the ridge. Keep it.
- Hebrew is correct: "פותחים ים", "מיליוני שנים", "5 ס"מ/שנה × 2 מיליון שנה = 100 ק"מ" (the arithmetic holds), and "דחיפה / משיכה / החלקה". The readout is split over two lines with "=" at the start of line 2. In the real UI, wrap the math in LTR/bdi spans.
- Volcanic islands on the horizon and floating rock debris are extras. The debris is a nice framing device.

## 02-subduction-quake.png — subduction and the quake (later state)

**Prompt (exact):**

> Great. Now a second, separate image in the same game and the same art style, landscape 16:9: design target for a later level, "subduction and the quake". Same floating rectangular diorama slab in a dark starry void, same 3/4 isometric orbit camera, warm dramatic light, real 3D depth, From Dust meets Reus, not flat vector art. On top: on the left a deep blue ocean plate with a dark deep trench running along just offshore; on the right a green-and-brown continent whose coast carries a chain of three smoking cone volcanoes puffing round smoke rings. The front cutaway clearly shows the cold dark-blue-grey ocean slab diving at an angle under the continent and sinking into the orange-red mantle with convection ribbons, and blobs of glowing magma rising from the slab up through the continent crust to feed the volcanoes. A small pebble-people town (cute round grey and sand-colored river-stone villagers with big eyes and leaf scarves) on the continent is shaking: two cartoony houses collapsing in a puff of dust, while other stone houses with a small green shield badge reading "413" stand firm; villagers ducking and covering, one hugging a little barking cream dog with motion lines. A glowing red-orange stress meter bar floats over the fault line near the trench, and a small seismograph station with a drum recorder sits on a hill with a zig-zag trace. Big comic-style quake callout bubble "6.8" with shake lines. Same Hebrew right-to-left HUD style (navy and cream, chunky rounded): top-right navy pill with the level name "רעידה בעיר החוף" and stars, top-left round pause and mute, a coin budget counter pill "תקציב 120" with a gold coin, a vertical stress gauge labelled "מתח", and the bottom-right tool tray with the three chunky buttons "דחיפה" (selected), "משיכה", "החלקה". Dramatic but funny, not scary.

**What's off (do not copy):**
- The trench reads as a cliff step down from the ocean surface rather than a deep V-shaped trough on the sea floor. In the game, model it as a sea-floor trough just offshore.
- Magma rising to the volcanoes is weak. It shows as lava cracks in the continental crust near the coast, not as blobs rising from the slab tip. The game should show melt rising from above the slab at depth up to the volcanic arc.
- The volcanoes sit inland behind the town, not on the coast. That is fine; the arc is inland of the trench.
- The slab is drawn as thick stacked blocks with flow arrows, which reads well. Keep the arrows.
- Extras not asked for:
  - A bottom-left info card titled "אזור הפחתה" with three lines of text. Its Hebrew is correct but it is too much reading for the HUD. Use a one-line toast instead.
  - A rate readout of "10 ס"מ/שנה × 1 מיליון שנה = 100 ק"מ" (the arithmetic holds).
  - A fishing trawler.
- The budget pill renders as `120״` with a stray gershayim. Drop it in the real UI.
- The stress gauge is a vertical bar on a pin pointing at the fault, with a red target ring at the fault. Good. Only two of three stars are lit.

## 03-israel-final.png — building the Land of Israel (final level)

**Prompt (exact):**

> Excellent. Third separate image, same game and same art style, landscape 16:9: design target for the final level, "building the Land of Israel". Same floating rectangular diorama slab in a dark starry void, same 3/4 isometric orbit camera, warm golden late-afternoon light, real 3D depth, From Dust meets Reus, not flat vector art. The top surface shows from west (left) to east (right), in parallel north-south belts: a strip of blue Mediterranean Sea along the left edge with gentle surf; a pale sandy coastal plain with low elongated kurkar (cemented sandstone) ridges and a few orchards; a broad cream-white limestone mountain ridge with rounded hills, terraces and a few olive trees, with small streams flowing down both its west and east sides; then a deep, steep-walled sunken rift valley on the right with a salty turquoise lake far below sea level, its shores crusted with white salt; and a dark basalt plateau with black rocks in the far north-east corner. The front cutaway shows neatly layered cream and tan limestone and chalk strata under the mountain ridge with tiny ammonite fossils visible high up in the ridge, the layers dropping down steeply in step faults at the rift, and orange mantle glow at the bottom of the slab. NOTHING on the land is labeled: no place names, no text on the terrain. Small cute round pebble-people villagers (grey and sand river-stone bodies, big eyes, leaf scarves) and little cream stone houses, several with a small green shield badge reading "413", dotted on the coastal plain and the ridge; one villager points happily at a fossil. Same minimal Hebrew right-to-left HUD style (navy and cream, chunky rounded): top-right navy pill with the level name "בונים את ארץ ישראל" and 3 stars, top-left round pause and mute buttons, bottom-center the "מיליוני שנים" deep-time slider with a readout, bottom-right the tool tray with three chunky buttons "דחיפה", "משיכה" (selected), "החלקה". Calm, proud, finale feeling.

**What's off (do not copy):**
- The ammonites are huge (one is house-sized, on the ridge surface). In the game they should be small fossil props embedded in the strata high in the ridge.
- The kurkar ridges are not distinct from the coastal plain. The plain is just sand, orchards and villages. Add low elongated ridges parallel to the coast procedurally.
- The west–east order is correct: sea, coastal plain, limestone ridge, rift with salt lake, and basalt plateau at the top right (north-east). The rift is a deep V with step faults in the cutaway. The salt lake sits far below the rim with white salt crust. Streams run down both flanks of the ridge. Keep all of this.
- Nothing on the land is labeled; the "413" shields are the only text in the world.
- The readout "1 ס"מ/שנה × 50 מיליון שנה = 500 ק"מ" is arithmetically right but invented. The real readout comes from the model.
