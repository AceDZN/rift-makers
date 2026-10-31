// Boundaries emerge from the right heat layout, the intended misconceptions
// fail with their consequence, and constant strategies don't win.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Session } from '../src/model/session.ts';
import { LEVELS } from '../src/model/levels.ts';
import { rng } from '../src/model/geo.ts';
import { energyRatio, shakingRatio } from '../src/model/quake.ts';
import { reasonLine } from '../src/model/explain.ts';
import { heatRun } from './helpers.ts';
import { L3_ANSWERS } from './solutions.ts';

const failed = (s: Session) => !s.outcome?.success;

test('a hot plume under a seam pulls the plates apart', () => {
  const s = heatRun(1, [['plume', 560, 250]]);
  assert.equal(s.motion()!.type, 'pull');
});

test('a cold drip under a seam pulls the plates together', () => {
  const s = heatRun(7, [['drip', 500, 300]], 8);
  assert.equal(s.motion()!.type, 'push');
});

test('a plume and a drip side by side make the plates slide past each other', () => {
  const s = heatRun(9, [['drip', 100, 150], ['plume', 100, 450]], 4.5);
  assert.equal(s.motion()!.type, 'slide');
});

test('continent meets continent: fold mountains, no volcanoes', () => {
  const s = heatRun(7, [['drip', 500, 300]], 6);
  assert.equal(s.terrain().volcanoes.length, 0);
  assert.ok(s.wishStatus().every((w) => w.ok));
});

test('ocean dives under continent: trench offshore and an arc of volcanoes', () => {
  const s = heatRun(8, [['drip', 580, 300]], 4);
  const ter = s.terrain();
  assert.ok(ter.volcanoes.length >= 3);
  assert.ok(Math.min(...ter.elev) < -6000, 'a deep trench');
});

test('level 7: a plume where the mountain was wanted leaves the villagers fishing in the valley', () => {
  const s = heatRun(7, [['plume', 500, 300]], 8);
  assert.equal(s.phase, 'review');
  assert.equal(s.feedback!.line, reasonLine('sulkFishing'));
  assert.match(s.feedback!.line, /דגים בתחתית העמק/);
  assert.ok(s.terrain().water.some((w) => !Number.isNaN(w)), 'the valley flooded');
});

test('2 Richter units ≈ 1,000× the energy and 100× the shaking', () => {
  assert.ok(Math.abs(energyRatio(2) - 1000) / 1000 < 0.01);
  assert.equal(shakingRatio(2), 100);
});

test('site choice: a port near an active boundary fails, the passive coast is quiet', () => {
  const s = new Session(12);
  s.adviseSite(1050, 300);
  assert.ok(!s.outcome);
  s.adviseSite(80, 400);
  assert.equal(s.outcome!.success, true);
  assert.ok(s.siteReport!.nearestKm >= 200);
});

test('rebuilding on the fault line falls even with 413', () => {
  const s = new Session(15);
  s.chooseTownSite('tiberias', 't-fault');
  s.chooseTownSite('jericho', 'j-fan');
  s.chooseTownSite('shechem', 'y-ridge');
  s.runTownQuakes();
  assert.ok(!s.outcome && s.mistakes === 1);
  for (const [t, a, b] of [['tiberias', 't-shore', 't-hill'], ['shechem', 'y-slope', 'y-ridge']] as const) {
    assert.ok(s.siteShaking(a) > s.withstands, `${a} too shaky`);
    assert.ok(s.siteShaking(b) <= s.withstands, `${b} holds`);
    void t;
  }
});

test('final: a town on the rift fault falls', () => {
  const s = heatRun(18, [['drip', 88, 130], ['plume', 180, 50]], 8);
  assert.equal(s.phase, 'sites');
  s.chooseTownSite('coast', 'c-plain');
  s.chooseTownSite('ridge', 'r-scarp');
  s.chooseTownSite('valley', 'v-fault');
  s.runTownQuakes();
  assert.ok(!s.outcome);
});

test('each level has its misconception fail', () => {
  // L2: the inner core is the hottest, but solid
  const s2 = new Session(2);
  for (const a of [40, 100, 160]) s2.placeStation(a);
  s2.fire();
  s2.mark('innerCore');
  assert.ok(!s2.outcome && s2.mistakes === 1);
  // L3: wrong direction
  const s3 = new Session(3);
  s3.predict('W', 'east');
  s3.predict('E', 'west');
  assert.ok(failed(heatRun(3, [], undefined, s3)) && s3.phase === 'review' && !s3.roundWon);
  // L4: too short
  assert.ok(failed(heatRun(4, [], 3)));
  // L5: plume away from the upwelling
  assert.ok(failed(heatRun(5, [['plume', 400, 250]], 3)));
  // L6: dig next to the ridge
  const s6 = new Session(6);
  s6.dig(470, 300);
  assert.ok(!s6.outcome);
  // L8: drip right at the trench puts the arc on the coast; under the town, nothing
  assert.ok(failed(heatRun(8, [['drip', 450, 300]], 4)));
  assert.ok(failed(heatRun(8, [['drip', 760, 300]], 8)));
  // L9: push or pull never rejoin a road; the wrong shear tears it further
  assert.ok(failed(heatRun(9, [['drip', 400, 300]], 2)));
  assert.ok(failed(heatRun(9, [['plume', 100, 150], ['drip', 100, 450]], 4.5)));
  // L10: the decoy island and a plume that isn't between the continents
  const s10 = new Session(10);
  const w = s10.def.wegener!;
  for (const p of w.pieces) if (p.target) s10.movePiece(p.id, p.target.x, p.target.z, p.target.rot);
  s10.movePiece('decoy', 3000, 1800, 0);
  s10.present();
  assert.ok(!s10.accepted);
  s10.movePiece('decoy', 600 * 5, 590 * 5, 0.5);
  s10.present();
  assert.ok(s10.accepted);
  assert.ok(failed(heatRun(10, [['plume', 750, 1750]], undefined, s10)));
  // L11: one drip in the middle fights the natural plume
  assert.ok(failed(heatRun(11, [['drip', 500, 400]])));
  // L13: the big-quake town copying the old town
  const s13 = new Session(13);
  s13.predict('energy', '1000');
  s13.chooseCopy('port-copies');
  s13.runCopyQuakes();
  assert.ok(!s13.outcome);
  // L14: the dune is too low; the far ridge too far
  const s14 = new Session(14);
  s14.chooseCove('mid');
  s14.chooseHill('dune');
  s14.runTsunami();
  assert.ok(!s14.outcome);
  s14.chooseHill('ridge');
  s14.runTsunami();
  assert.ok(!s14.outcome);
  // L16: swapping the heat leaves no marble
  const s16 = heatRun(16, [['plume', 300, 250], ['drip', 600, 250]], 14);
  for (let i = 0; i < 10 && !s16.outcome && s16.phase === 'collect'; i++) s16.hammer(40 + i * 85, 250);
  assert.ok(!s16.collected.has('marble'));
  // L17: lifting the shelf before the sea laid its shells
  assert.ok(failed(heatRun(17, [['drip', 60, 40]], 30)));
  // L18: a drip on the rift turns it into a collision
  assert.ok(failed(heatRun(18, [['drip', 150, 130], ['plume', 180, 50]], 8)));
});

/** Free-heat levels: one plume in the middle, or random heat, must not win. */
const FREE = LEVELS.filter((l) => ['heat', 'rocks', 'fossil', 'israel'].includes(l.kind) && !(l.fixedHeat?.length && !l.plumes && !l.drips && !l.anyHeat));

function tryLayout(id: number, heats: ['plume' | 'drip', number, number][], dur: number): Session {
  const s = new Session(id);
  for (const [k, x, z] of heats) s.placeHeat(k, x, z);
  s.setDuration(dur);
  if (s.run()) s.runToEnd();
  if (s.def.rocks && s.phase === 'collect') {
    const r = rng(id);
    for (let i = 0; i < 10 && s.phase === 'collect'; i++) s.hammer(r() * s.def.base.widthKm, r() * s.def.base.depthKm);
  }
  return s;
}

test('one plume in the middle does not win any free-heat level', () => {
  for (const l of FREE) {
    const kind = (l.plumes ?? 0) > 0 || l.anyHeat ? 'plume' : 'drip';
    for (const dur of [l.duration.min, l.duration.start, l.duration.max]) {
      const s = tryLayout(l.id, [[kind, l.base.widthKm / 2, l.base.depthKm / 2]], dur);
      if (l.id === 1) continue; // the tutorial's seam is off-centre, checked below
      assert.ok(!s.outcome?.success, `level ${l.id} won with one ${kind} in the middle for ${dur} Myr`);
    }
  }
  assert.ok(!tryLayout(1, [['plume', 400, 250]], 4).outcome?.success, 'tutorial: the middle is not the seam');
});

test('random heat rarely wins', () => {
  for (const l of FREE) {
    const r = rng(l.id * 31 + 5);
    let wins = 0;
    const N = 30;
    for (let i = 0; i < N; i++) {
      const heats: ['plume' | 'drip', number, number][] = [];
      const np = l.anyHeat ? Math.floor(r() * (l.anyHeat + 1)) : Math.floor(r() * ((l.plumes ?? 0) + 1));
      const nd = l.anyHeat ? l.anyHeat - np : Math.floor(r() * ((l.drips ?? 0) + 1));
      for (let k = 0; k < np; k++) heats.push(['plume', r() * l.base.widthKm, r() * l.base.depthKm]);
      for (let k = 0; k < nd; k++) heats.push(['drip', r() * l.base.widthKm, r() * l.base.depthKm]);
      const steps = Math.round((l.duration.max - l.duration.min) / l.duration.step);
      const s = tryLayout(l.id, heats, l.duration.min + Math.floor(r() * (steps + 1)) * l.duration.step);
      if (s.outcome?.success) wins++;
    }
    assert.ok(wins / N <= 0.25, `level ${l.id}: random heat won ${wins}/${N}`);
  }
});

test('level 3: every fixed pair of arrows fails a round, and each round has its own answer', () => {
  const dirs = ['east', 'west'] as const;
  for (const w of dirs)
    for (const e of dirs) {
      const s = new Session(3);
      for (let r = 0; r < s.roundCount && !s.outcome; r++) {
        s.nextRound();
        s.predict('W', w);
        s.predict('E', e);
        heatRun(3, [], undefined, s);
        if (!s.roundWon && !s.outcome) break;
      }
      assert.ok(!s.outcome?.success, `always ${w}/${e} must not win`);
    }
  const s = new Session(3);
  assert.equal(s.roundCount, 3);
  for (const [w, e] of L3_ANSWERS) {
    s.nextRound();
    assert.equal(s.plateDir('W'), w);
    assert.equal(s.plateDir('E'), e);
    s.predict('W', w);
    s.predict('E', e);
    heatRun(3, [], undefined, s);
    if (s.roundWon) assert.equal(s.restart(), false, 'no replay of a won round');
  }
  assert.equal(s.outcome?.stars, 3);
});

test('level 7: the longest squeeze is no longer a sure win', () => {
  const s = heatRun(7, [['drip', 500, 300]], 20);
  assert.equal(s.phase, 'review');
  assert.match(s.feedback!.line, /גבוה מדי/);
  const wins = [];
  for (let d = 2; d <= 20; d++) if (heatRun(7, [['drip', 500, 300]], d).outcome?.success) wins.push(d);
  assert.ok(wins.length >= 2 && wins.length <= 4, `winning durations: ${wins}`);
});
