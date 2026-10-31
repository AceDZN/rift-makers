# Visual target checklist (v2: heat verbs)

Compare real browser captures side by side with the PNGs in this folder. They are design targets, not screenshots. Copy layout, camera, materials and feedback, not generated text.

## Shared across all gameplay targets (01, 02, 03, 05)

- **Camera**
  - 3/4 isometric orbit, about 35–45° down, aimed at the slab's front-left corner.
  - The slab fills about 80–90% of the frame width.
  - The top surface and the front cutaway are both clearly visible.
- **Silhouette**
  - One floating rectangular slab with crisp vertical faces in a dark starry void.
  - A few dark rock chunks drift in the foreground and background.
- **Cutaway (must)**
  - A thin crust: tan/brown/cream block strata.
  - An orange-red mantle with curling convection ribbons and big flow arrows.
  - A bright core glow at the bottom. The game adds separate outer-core and inner-core bands.
  - A **faint placement grid** is drawn on the mantle floor.
- **Heat sources (must)**
  - A hot plume is a bright orange-yellow column rising from a glowing orange ring on the grid. It splits into two ribbons under the crust, with arrows pulling apart.
  - A cold drip is a dark/cyan-blue vortex column sinking to a blue ring. Blue ribbons with arrows converge on it.
  - The drip and the plume are the brightest things in the cutaway.
- **Materials**
  - Green grass and dark tree clumps.
  - Turquoise-to-deep-blue water with white surf.
  - Cream limestone, black basalt, and tan crust blocks with visible seams.
  - Stylized, rich and chunky, not photoreal.
- **Lighting**
  - Warm golden sun from back-right with long soft shadows (03 uses cooler dusk).
  - Magma rim-light on the cutaway.
  - The sunset sky blends into the starry void.
- **Characters**
  - Pebble-people: round grey/sand stones with big eyes, green leaf scarves and stubby limbs.
  - They react in groups: cheer, duck/panic, or sulk with fishing rods.
  - The cream dog appears in quakes.
- **Houses**
  - Small cream/grey stone houses with tile or thatch roofs and lit windows.
  - The "413" variant floats a green shield with white "413" above it.
- **Feedback**
  - Glowing seams on cracks, dust puffs, steam, smoke rings and waterfalls into new seas.
  - Shake arcs and a red starburst magnitude callout.
  - A drum seismograph trace.
- **HUD (Hebrew RTL; navy ≈ #1b2440, cream ≈ #f3ead8; chunky rounded panels with soft shadows)**
  - Top-left: round navy pause and mute buttons, plus a red-ringed round thermometer button "תצוגת חום" (heat view toggle).
  - Top-right: a navy pill with the level name in bold white and 3 gold stars.
  - Bottom-left/center: a cream panel with the label "מיליוני שנים" and a forward-only arrow bar with non-linear ticks.
    - A navy readout box with `rate × time = distance`, in LTR math spans.
    - A `−  N מיליון שנה  +` duration stepper.
    - A big orange play button "▶ הרץ N מיליון שנה".
  - Bottom-right: a cream tray. From the right edge in the full version:
    - Small "ייעוץ" pin button.
    - Small hammer button.
    - Small seismograph button.
    - Big blue "טפטוף קר" (down arrow).
    - Big orange "פלומה חמה" (up arrow).
    - The selected heat button gets a glowing ring. Each heat button has a small "used/allowed" counter pill (e.g. 1/1).
  - **No** push/pull/slide buttons, budget/coins, depth slider or time scrubber.

## 01-first-30s.png — first plume opens a sea

- [ ] A plume column under the centre ridge, pulling apart.
- [ ] A rift sea floods in from waterfalls on both cliffs.
- [ ] Basalt rib stripes mirrored around a glowing ridge, with steam puffs.
- [ ] Villagers cheer on both shores; one pushes a boat into the new sea.
- [ ] HUD: "פותחים ים" with 3 stars; "הרץ 2 מיליון שנה"; "פלומה חמה" selected with a 1/1 counter.
- [ ] Fixes versus the image:
  - Separate outer-core and inner-core bands.
  - The readout stays on one LTR line.

## 02-subduction-quake.png — core action mid-play

- [ ] Ocean plate on the left with surf and a trawler.
- [ ] The ocean slab dives under the continent in the cutaway, with white arrows.
- [ ] A blue drip sinks where the plates converge. Fix: put it at the convergence, not mid-ocean.
- [ ] Offshore trench. Fix: make it a V trough in the sea floor.
- [ ] Three cone volcanoes inland with smoke rings.
- [ ] Glowing melt rises to them. Fix: the melt should rise from above the slab at depth.
- [ ] Shaking town: collapses in dust; "413" houses stand. A villager hugs the dog.
- [ ] Seismograph drum station on a hill; a "6.8" starburst with shake arcs.
- [ ] A green house **advice pin** on a safe far hill with a happy villager.
- [ ] HUD: "רעידה בעיר החוף" with 2 of 3 stars; no budget; "טפטוף קר" selected (1/1); "ייעוץ" pin button.

## 03-mistake-valley.png — failure/consequence

- [ ] Cooler dusk light.
- [ ] Film-strip replay border, and the plume/ribbons highlighted in the cutaway.
- [ ] A wide graben with stepped fault cliffs and a shallow lake on its floor.
- [ ] Five grumpy villagers with fishing rods, a storm cloud, and a speech bubble with a mountain icon.
- [ ] A toppled hut with dust.
- [ ] A cream result card on the right:
  - Navy title bar ("oops: wanted a mountain, got a valley").
  - One explanation line.
  - Big orange retry (circular arrow) and smaller navy hint (bulb).
- [ ] Level pill with 3 empty stars.
- [ ] Dim the HUD tray and time bar while the card shows (the image doesn't).

## 04-level-select.png — progression

- [ ] Starry void with a central globe that has a cake-slice cutaway showing layered crust, mantle with arrows, and core.
- [ ] Four tilted mini-slabs in an arc:
  - Rift sea with plume.
  - Snowy fold mountains with zebra sea floor, and the scientist.
  - Volcano, town and seismograph.
  - Israel belts with a salt-lake rift.
- [ ] They are linked by dotted orange paths.
- [ ] Each world has a navy label and a row of round level nodes: gold with stars when done, grey with a lock when locked.
- [ ] Fixes versus the image:
  - Exactly one pulsing current node.
  - Nodes and worlds ordered **right to left**.
- [ ] HUD: title pill "שוברי היבשות" top-right; settings and mute top-left; stars counter; big orange "המשך" at bottom-center.

## 05-israel-final.png — Land of Israel

- [ ] West → east:
  - Sea with sailboats.
  - Sandy plain with orchards and villages.
  - Terraced cream limestone ridge with streams down both flanks.
  - Deep V rift with a turquoise salt lake and white salt rim.
  - Black columnar basalt at the top right (NE).
- [ ] Cutaway: folded limestone/chalk strata with small fossils high up, step faults into the rift, and plumes and a drip below.
- [ ] No labels on the land. "413" shields and a green advice pin on the ridge.
- [ ] HUD: "בונים את ארץ ישראל" with 3 stars; "הרץ 20 מיליון שנה"; counters 2/2 and 1/1.
- [ ] Fixes versus the image:
  - Small ammonites.
  - Distinct kurkar ridges parallel to the coast.
