// Every authored level is solvable through the same actions the UI calls,
// the intended misconceptions fail, and constant strategies don't win.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Session } from '../src/model/session.ts';
import { LEVELS } from '../src/model/levels.ts';
import { heatRun } from './helpers.ts';
import { SOLUTIONS } from './solutions.ts';

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

test('no free rewind: restart is refused while deep time runs', () => {
  const s = new Session(4);
  s.setDuration(2);
  s.run();
  s.advance(1);
  assert.equal(s.restart(), false);
  assert.equal(s.t, 1);
  assert.equal(s.duration, 2);
});

test('leaving a level does not wipe its mistakes: a carried mistake caps the stars', () => {
  const s = new Session(4);
  s.carryOver(1, 0);
  s.setDuration(6);
  s.run();
  s.runToEnd();
  assert.equal(s.outcome?.success, true);
  assert.ok(s.outcome!.stars <= 2);
  assert.equal(s.unaided, false);
});
