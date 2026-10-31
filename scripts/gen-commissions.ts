// Generates planet commissions and keeps only the fair ones: a brute-force
// solver tries every heat kind, a grid of positions and every duration; a
// layout is kept when at least one try wins and at most MAX_SHARE of all
// tries win (so random play rarely does). Writes src/data/commissions.json.
//   npx tsx scripts/gen-commissions.ts [count]

import { writeFileSync } from 'node:fs';
import { type CommissionKind, type CommissionParams, commissionDef } from '../src/model/commissions.ts';
import { registerLevel } from '../src/model/levels.ts';
import { Session } from '../src/model/session.ts';

const COUNT = Number(process.argv[2] ?? 9);
const MAX_SHARE = 0.15;
let seed = 20261031;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a: number, b: number, step = 10) => a + Math.round((rnd() * (b - a)) / step) * step;

function propose(n: number, kind: CommissionKind): CommissionParams {
  const W = 1000;
  const D = 600;
  const z = pick(220, 380);
  if (kind === 'sea') {
    const seamX = pick(380, 620);
    const min = pick(120, 260, 20);
    return { n, kind, seed: n * 31, W, D, seamX, a: { x: seamX - pick(60, 110), z }, b: { x: seamX + pick(60, 110), z: z + pick(-40, 40) }, min, max: min + pick(100, 160, 20), dur: { min: 1, max: 10, step: 1 } };
  }
  if (kind === 'mountain') {
    const seamX = pick(380, 620);
    return { n, kind, seed: n * 31, W, D, seamX, a: { x: seamX - pick(90, 130), z }, b: { x: seamX + pick(90, 130), z }, minElev: pick(2500, 3800, 100), dur: { min: 2, max: 16, step: 2 } };
  }
  const seamX = pick(300, 520);
  const fieldsX = seamX + pick(110, 170);
  return { n, kind, seed: n * 31, W, D, seamX, a: { x: fieldsX, z }, b: { x: Math.min(W - 60, fieldsX + pick(160, 240)), z }, dur: { min: 1, max: 8, step: 1 } };
}

function solve(p: CommissionParams) {
  const d = commissionDef(p);
  registerLevel(d);
  const wins: { kind: 'plume' | 'drip'; x: number; z: number; dur: number }[] = [];
  let tries = 0;
  for (const kind of ['plume', 'drip'] as const) {
    for (let x = 40; x <= p.W - 40; x += 40) {
      for (const z of [p.D * 0.35, p.D * 0.65]) {
        for (let dur = p.dur.min; dur <= p.dur.max; dur += p.dur.step) {
          const s = new Session(d.id);
          s.placeHeat(kind, x, z);
          s.setDuration(dur);
          s.run();
          s.runToEnd();
          tries++;
          if (s.outcome?.success) wins.push({ kind, x, z: Math.round(z), dur });
        }
      }
    }
  }
  return { wins, tries };
}

const kinds: CommissionKind[] = ['sea', 'mountain', 'arc'];
const out: CommissionParams[] = [];
for (let attempt = 0; out.length < COUNT && attempt < COUNT * 8; attempt++) {
  const n = out.length + 1;
  const p = propose(n, kinds[(n - 1) % 3]);
  const { wins, tries } = solve(p);
  const share = wins.length / tries;
  console.log(`#${n} ${p.kind} seam ${p.seamX}: ${wins.length}/${tries} wins (${(share * 100).toFixed(1)}%)`);
  if (!wins.length || share > MAX_SHARE) continue;
  p.solution = wins[Math.floor(wins.length / 2)];
  p.winShare = +share.toFixed(3);
  out.push(p);
}
writeFileSync('src/data/commissions.json', JSON.stringify(out, null, 1) + '\n');
console.log(`kept ${out.length}`);
