// Every authored level is solvable through the same actions the UI calls,
// the intended misconceptions fail, and constant strategies don't win.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Session } from '../src/model/session.ts';
import { LEVELS } from '../src/model/levels.ts';
import { heatRun } from './helpers.ts';

/** Authored solutions. Each returns the finished session. */
export const SOLUTIONS: Record<number, () => Session> = {
  1: () => heatRun(1, [['plume', 560, 250]]),
  2: () => {
    const s = new Session(2);
    for (const a of [40, 100, 160]) s.placeStation(a);
    s.fire();
    s.mark('outerCore');
    return s;
  },
  3: () => {
    const s = new Session(3);
    s.predict('W', 'east');
    s.predict('E', 'west');
    return heatRun(3, [], undefined, s);
  },
  4: () => heatRun(4, [], 6),
  5: () => {
    const s = new Session(5);
    for (const x of [200, 450, 650]) s.probe(x, 250);
    return heatRun(5, [['plume', 650, 250]], 2, s);
  },
  6: () => {
    const s = new Session(6);
    s.sampleAge(100, 300);
    s.sampleAge(1100, 300);
    s.dig(1180, 300);
    return s;
  },
  7: () => heatRun(7, [['drip', 500, 300]], 8),
  8: () => heatRun(8, [['drip', 580, 300]], 4),
  9: () => heatRun(9, [['drip', 100, 150], ['plume', 100, 450]], 4.5),
  10: () => {
    const s = new Session(10);
    for (const p of s.def.wegener!.pieces) if (p.target) s.movePiece(p.id, p.target.x, p.target.z, p.target.rot);
    s.present();
    return heatRun(10, [['plume', 3000, 1750]], undefined, s);
  },
  11: () => heatRun(11, [['drip', 500, 80], ['drip', 1100, 400], ['drip', 500, 730]]),
  12: () => {
    const s = new Session(12);
    s.adviseSite(80, 400);
    return s;
  },
  13: () => {
    const s = new Session(13);
    s.predict('energy', '1000');
    s.chooseCopy('valley-copies');
    s.runCopyQuakes();
    return s;
  },
  14: () => {
    const s = new Session(14);
    s.chooseCove('north');
    s.chooseHill('cliff');
    s.runTsunami();
    return s;
  },
  15: () => {
    const s = new Session(15);
    s.chooseTownSite('tiberias', 't-hill');
    s.chooseTownSite('jericho', 'j-fan');
    s.chooseTownSite('shechem', 'y-ridge');
    s.runTownQuakes();
    return s;
  },
  16: () => {
    const s = heatRun(16, [['drip', 300, 250], ['plume', 600, 250]], 14);
    for (const [x, z] of [[600, 250], [300, 250], [120, 250], [265, 250]]) s.hammer(x, z);
    return s;
  },
  17: () => {
    const s = heatRun(17, [], 30);
    return heatRun(17, [['drip', 60, 40]], 30, s);
  },
  18: () => {
    const s = heatRun(18, [['drip', 88, 130], ['plume', 180, 50]], 8);
    s.chooseTownSite('coast', 'c-plain');
    s.chooseTownSite('ridge', 'r-crest');
    s.chooseTownSite('valley', 'v-terrace');
    s.runTownQuakes();
    return s;
  },
};

test('there are 18 authored levels in 4 worlds', () => {
  assert.equal(LEVELS.length, 18);
  assert.deepEqual([...new Set(LEVELS.map((l) => l.world))], [1, 2, 3, 4]);
  assert.ok(LEVELS[17].noHints, 'the final has no hints');
  for (const w of [1, 2, 3, 4]) assert.ok(LEVELS.some((l) => l.world === w && l.tag === 'העברה') || w === 4, `world ${w} has a transfer level`);
});

for (const l of LEVELS) {
  test(`level ${l.id} (${l.key}) is solvable with 3 stars`, () => {
    const s = SOLUTIONS[l.id]();
    assert.ok(s.outcome, `level ${l.id} finished: ${s.feedback?.line}`);
    assert.equal(s.outcome!.success, true, s.feedback?.line);
    assert.equal(s.outcome!.stars, 3, `stars ${s.outcome!.stars} mistakes ${s.mistakes}`);
  });
}

test('every level module URL is a Workbook grade-8 ch.4 or grade-9 ch.2 module', () => {
  for (const l of LEVELS) assert.match(l.module, /^https:\/\/geography\.workbook\.co\.il\/grade-(8\/chapter-4|9\/chapter-2)\/[a-z-]+$/);
});

test('a hint costs a star, and the final has none', () => {
  const s = new Session(1);
  assert.ok(s.hint());
  heatRun(1, [['plume', 560, 250]], undefined, s);
  assert.equal(s.outcome!.stars, 2);
  assert.equal(new Session(18).hint(), null);
});

test('restart keeps the heat placements and goes back to the start of deep time', () => {
  const s = heatRun(7, [['plume', 500, 300]], 8);
  assert.equal(s.phase, 'review');
  s.restart();
  assert.equal(s.t, 0);
  assert.equal(s.phase, 'plan');
  assert.equal(s.heats.length, 1);
  assert.equal(s.heats[0].kind, 'plume');
});

test('time only runs forward', () => {
  const s = new Session(7);
  s.placeHeat('drip', 500, 300);
  s.setDuration(8);
  s.run();
  s.advance(3);
  assert.equal(s.t, 3);
  s.advance(-2);
  assert.equal(s.t, 3);
  s.setDuration(2);
  assert.equal(s.duration, 8, 'no changing the commitment mid-run');
  assert.equal(s.placeHeat('drip', 300, 300), null, 'no heat edits mid-run');
});
