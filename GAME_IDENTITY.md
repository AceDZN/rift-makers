# Rift Makers — שוברי היבשות · game identity

**One line:** you are the spirit of the mantle. Crack a floating slab of living planet, push, pull or slide its plates through millions of years, and give the pebble people (החצצים) the sea, the mountain, the volcanic soil and the safe town they asked for.

Genre reference (mechanics only): From Dust's terrain shaping × Reus's "giant shapes the planet for tiny people with wishes". The difference: you shape the planet **from inside**. Water and wind appear only as external processes.

## First minute (level 1)

1. 0–5 s: a dark starry void, a floating diorama slab of green land. The camera drifts in. One Hebrew line: "פתחו את הכדור — גררו את הסכין לאורך הקיר".
2. 5–12 s: drag the glowing knife along the front wall. The rock skirt peels away and the cutaway lights up: thin crust, orange churning mantle, molten outer core, white-hot inner core.
3. 12–20 s: drag the probe down. Each layer reacts as the probe passes (crust crackles, mantle glows and flows, the outer core sloshes, the inner core rings solid) with a one-line label.
4. 20–30 s: a pebble villager waves a fishing rod: "אנחנו רוצים ים!". Draw a crack across the land, pick **משיכה** (pull) and drag the deep-time slider. The land splits along a glowing seam, sinks, the sea rushes in with a whoosh, and basalt stripes appear either side of the new ridge. The villagers cheer and launch a boat.

## Controls

| Verb | Mouse / touch | Keyboard |
|---|---|---|
| Orbit / zoom | right-drag or two-finger drag, wheel / pinch | Q / E rotate, + / − zoom |
| Draw a crack | drag across the slab with the crack tool (snaps to the plate grid) | — |
| Boundary type | tap דחיפה / משיכה / החלקה | 1 / 2 / 3 |
| Plate type | tap a plate badge (יבשתי ↔ אוקייני) when the level allows | — |
| Deep time | drag the slider, or hold ▶ | ← / → step, Space play/pause |
| Place / tag / retrofit | tap the slab, a feature or a house | — |
| Hint (costs a star) | 💡 | H |
| Pause, restart, mute | buttons | Esc or P, R, M |

Physical keys use `event.code`, so a Hebrew keyboard layout works.

## The decision

Every level asks one geographic decision with a visible, delayed consequence: **which kind of boundary, where, for how long**, or **where to spend a small budget before an earthquake you can't time**. The pure model decides; the scene only shows it.

## What changes on screen

The heightfield, the sea, the rock colours, volcanoes, the trench, basalt stripe ages, fault stress meters and the cutaway (convection arrows, the subducting slab, magma) are all generated from the model's state at the current deep time. Scrubbing time backwards undoes it, so experiments are cheap.

## Mistake and retry

A wrong boundary makes the wrong landform, never a red X: villagers who wanted a sea get a mountain and sulk with fishing rods on the peak; a quake without תקן 413 knocks houses down in a slapstick dust puff, then the villagers climb out and rebuild. Each failure plays a short cutaway replay with one Hebrew sentence on the cause, and **נסו שוב** rewinds to the moment before the choice. Hints point at evidence (a fossil, a rock type, sea-floor ages), never at the answer, and cost a star.

## Win and replay

Stars: the wish met (1), met on the first unaided choice (2), and the level's extra (a tight time window, budget left, the youngest rock found) (3). Levels unlock in order; any unlocked level replays from the world map. After a world's transfer level, **הזמנות כוכב** offers solver-checked generated commissions (villager wishes plus a constraint) for that world's mechanics.

## Camera

A 3/4 orbit camera over the slab with the cutaway wall facing the player, clamped so the wall stays readable. West is on the left (map convention) even though the UI is RTL; a small compass on the slab says so. A camera shake follows quakes (off under reduced motion).

## Art

A floating diorama in a dark starry void. Warm and dramatic: glowing orange magma and convection ribbons in the cutaway, cool blue seas, white peaks, dark basalt, cream limestone, pale kurkar dunes. Folds rise with rumble and dust, rifts crack open with glowing seams, volcanoes cough smoke rings, the sea floods in with a whoosh. Characters and props are Tripo models (rigged villagers, dog and scientist); terrain, water, strata and UI are procedural.

## Sound

Procedural WebAudio only: a low mantle drone whose pitch follows the time slider, rumbles scaled by magnitude, a crackle when a seam opens, a whoosh when the sea floods, villager chirps (happy / panic), a cheerful sting on success. Mute with M.

## Not this game

No quiz gates, no multiple-choice walls between play, no delivery loop, no timer pressure while reading. Geological time is compressed and the slider says so ("מיליוני שנים"): nothing here happens in an afternoon.
