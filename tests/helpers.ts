// Shared test helpers: drive a session through the same calls the UI makes.

import type { HeatKind } from '../src/model/heat.ts';
import assert from 'node:assert/strict';
import { Session } from '../src/model/session.ts';

export type H = [HeatKind, number, number];

/** Place heat, commit a duration, run deep time to the end. */
export function heatRun(id: number, heats: H[], duration?: number, s = new Session(id)): Session {
  for (const [k, x, z] of heats) assert.ok(s.placeHeat(k, x, z), `placed ${k} at ${x},${z}`);
  if (duration !== undefined) s.setDuration(duration);
  assert.ok(s.run(), 'run starts');
  s.runToEnd();
  return s;
}
