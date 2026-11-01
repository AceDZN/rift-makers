import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLevelParam } from '../src/host.ts';
import { LEVELS } from '../src/model/levels.ts';

test('?level=N opens authored level N (1-based); anything else is ignored', () => {
  const n = LEVELS.length;
  assert.equal(n, 18);
  assert.equal(parseLevelParam('?level=1', n), 0);
  assert.equal(parseLevelParam('?level=18', n), 17);
  assert.equal(LEVELS[parseLevelParam('?level=7', n)!].id, 7);
  for (const bad of ['', '?level=0', '?level=19', '?level=-2', '?level=2.5', '?level=abc', '?stage=3']) assert.equal(parseLevelParam(bad, n), null, bad);
});
