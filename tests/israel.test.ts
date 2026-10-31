// The final slab is checked against bundled real relief (ETOPO1, public
// domain): the belts run in the right order and the Dead Sea sits where and
// as low as it really does (stylized, not to the metre).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SOLUTIONS } from './solutions.ts';
import { crossSection, latOf, riftMin, SLAB_NORTH, SLAB_SOUTH } from '../src/model/israel.ts';
import { cellAt } from '../src/model/terrain.ts';
import { v } from '../src/model/geo.ts';

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

test('real relief: coast, ridge, rift and plateau in that order at 31.7°N', () => {
  const xs = crossSection(31.7);
  const band = (a: number, b: number) => xs.filter(([lon]) => lon >= a && lon <= b).map(([, e]) => e);
  const coast = mean(band(34.6, 34.8));
  const ridge = Math.max(...band(35.0, 35.3));
  const rift = Math.min(...band(35.4, 35.6));
  const east = Math.max(...band(35.7, 35.9));
  assert.ok(coast < 150 && ridge > 600 && rift < -380 && east > 600, JSON.stringify({ coast, ridge, rift, east }));
});

test('the built Israel slab has the same belts as the real relief', () => {
  const s = SOLUTIONS[18]();
  const t = s.terrain();
  const z = ((SLAB_NORTH - 31.7) / (SLAB_NORTH - SLAB_SOUTH)) * s.def.base.depthKm;
  const row = (a: number, b: number) => {
    const out: number[] = [];
    for (let x = a; x <= b; x += 4) out.push(t.elev[cellAt(t, v(x, z))]);
    return out;
  };
  const coast = mean(row(25, 55));
  const ridge = Math.max(...row(60, 115));
  const rift = Math.min(...row(138, 162));
  const east = Math.max(...row(170, 198));
  assert.ok(coast < ridge - 400, `coast ${coast} well below ridge ${ridge}`);
  assert.ok(rift < coast - 300 && rift < east - 600, `rift ${rift} is the lowest belt`);
});

test('the Dead Sea is the lowest place, where and about as low as it really is', () => {
  const s = SOLUTIONS[18]();
  const t = s.terrain();
  // real: lowest latitude along the rift
  let realF = 0;
  let realMin = Infinity;
  for (let f = 0; f <= 1; f += 0.02) {
    const m = riftMin(latOf(f));
    if (m < realMin) [realMin, realF] = [m, f];
  }
  // game: deepest lake water along the rift
  let gameF = 0;
  let lakeTop = NaN;
  let deepest = Infinity;
  for (let z = 0; z <= s.def.base.depthKm; z += 5) {
    for (let x = 130; x <= 170; x += 4) {
      const k = cellAt(t, v(x, z));
      if (t.waterKind[k] === 2 && t.elev[k] < deepest) [deepest, gameF, lakeTop] = [t.elev[k], z / s.def.base.depthKm, t.water[k]];
    }
  }
  assert.ok(Math.abs(gameF - realF) < 0.1, `lake at ${gameF.toFixed(2)} vs real ${realF.toFixed(2)}`);
  assert.ok(Math.abs(lakeTop - realMin) < 80, `lake surface ${Math.round(lakeTop)} m vs real ${realMin} m`);
});
