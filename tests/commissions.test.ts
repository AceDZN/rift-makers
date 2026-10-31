// Planet commissions: every bundled one is solvable with its stored layout,
// was kept only because random play rarely wins, and refuses a lazy layout.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COMMISSIONS, COMMISSION_LEVELS } from '../src/model/commissions.ts';
import { Session } from '../src/model/session.ts';

test('there are planet commissions of all three kinds', () => {
  assert.ok(COMMISSIONS.length >= 6);
  assert.deepEqual([...new Set(COMMISSIONS.map((c) => c.kind))].sort(), ['arc', 'mountain', 'sea']);
});

for (const [i, c] of COMMISSIONS.entries()) {
  const id = COMMISSION_LEVELS[i].id;
  test(`commission ${c.n} (${c.kind}) wins with its solver layout and is not easy by luck`, () => {
    const sol = c.solution!;
    const s = new Session(id);
    assert.ok(s.placeHeat(sol.kind, sol.x, sol.z));
    s.setDuration(sol.dur);
    assert.ok(s.run());
    s.runToEnd();
    assert.equal(s.outcome?.success, true, s.feedback?.line);
    assert.ok(c.winShare! <= 0.15, `win share ${c.winShare}`);
  });
  test(`commission ${c.n} (${c.kind}): the opposite heat in the same place fails`, () => {
    const sol = c.solution!;
    const s = new Session(id);
    s.placeHeat(sol.kind === 'plume' ? 'drip' : 'plume', sol.x, sol.z);
    s.setDuration(sol.dur);
    s.run();
    s.runToEnd();
    assert.notEqual(s.outcome?.success, true);
  });
}
