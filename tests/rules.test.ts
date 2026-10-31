// The QA list's rules: rate × time, sea-floor age, how rocks form, and
// the fossil level keeping sea level fixed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { type TerrainInput, displacementKm } from '../src/model/terrain.ts';
import { Session } from '../src/model/session.ts';
import { heatRun } from './helpers.ts';
import { SOLUTIONS } from './solutions.ts';

test('rate × time: 5 cm/yr for 6 Myr is 300 km; 1 cm/yr for 1 Myr is 10 km', () => {
  assert.equal(displacementKm(5, 6), 300);
  assert.equal(displacementKm(1, 1), 10);
});

test('sea floor gets older with distance from the ridge on both sides', () => {
  const s = new Session(6);
  const ridge = s.def.dig!.ridgeX;
  for (const dir of [-1, 1]) {
    let prev = -1;
    for (let d = 20; d < 440; d += 60) {
      const a = s.ageAt(ridge + dir * d, 300);
      assert.ok(a >= prev, `age ${a} at ${d} km (${dir > 0 ? 'east' : 'west'}) not younger than ${prev}`);
      prev = a;
    }
  }
});

test('rocks: basalt where plates part, marble only from limestone, granite only after long deep squeezing', () => {
  const s = SOLUTIONS[16]();
  assert.equal(s.rockAt(600, 250), 'basalt');
  assert.equal(s.rockAt(300, 250), 'granite');
  // the same collision, stopped early: folded layers, no granite yet
  const early = heatRun(16, [['drip', 300, 250], ['plume', 600, 250]], 4);
  assert.notEqual(early.rockAt(300, 250), 'granite');
  // marble appears only next to limestone
  const marble = s.hammered.find((h) => h.rock === 'marble')!;
  assert.ok(marble, 'the solution found marble');
  const fresh = new Session(16);
  assert.notEqual(fresh.rockAt(marble.x, marble.z), 'marble', 'no marble before the squeeze');
});

test('level 17: sea level stays put; the fossils rise because the land does', () => {
  const s = SOLUTIONS[17]();
  const input: TerrainInput = s.terrainInput();
  assert.equal(input.seaLevel ?? 0, 0);
  assert.ok(s.outcome?.success);
});
