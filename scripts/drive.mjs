// Plays every level in a real browser through the game controller (the same
// calls the HUD makes), steps time with window.advanceTime and saves a
// screenshot before and after each solution. Never injects a win state.
//
//   node scripts/drive.mjs [baseUrl] [outDir] [levels...]
//   e.g. node scripts/drive.mjs http://localhost:5243 docs/screenshots 1 7 18

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:5243';
const out = process.argv[3] ?? 'docs/screenshots';
const only = process.argv.slice(4).map(Number);
const width = Number(process.env.W ?? 1280);
const height = Number(process.env.H ?? 800);
mkdirSync(out, { recursive: true });

// Each step is run inside the page; `g` is window.game.
const heat = (list, dur) => ({ heat: list, dur });
const act = (src) => ({ act: src });
const PLAN = {
  1: [heat([['plume', 560, 250]])],
  2: [act(`s => { for (const a of [40, 100, 160]) s.placeStation(a); s.fire(); }`), { wait: 3000 }, act(`s => s.mark('outerCore')`)],
  3: [act(`s => { s.predict('W', 'east'); s.predict('E', 'west'); }`), heat([])],
  4: [heat([], 6)],
  5: [act(`s => { for (const x of [200, 450, 650]) s.probe(x, 250); }`), heat([['plume', 650, 250]], 2)],
  6: [act(`s => { s.sampleAge(100, 300); s.sampleAge(1100, 300); }`), { shot: 'mid' }, act(`s => s.dig(1180, 300)`)],
  7: [heat([['drip', 500, 300]], 8)],
  8: [heat([['drip', 580, 300]], 4)],
  9: [heat([['drip', 100, 150], ['plume', 100, 450]], 4.5)],
  10: [act(`s => { for (const p of s.def.wegener.pieces) if (p.target) s.movePiece(p.id, p.target.x, p.target.z, p.target.rot); }`), { shot: 'mid' }, act(`s => s.present()`), heat([['plume', 3000, 1750]])],
  11: [heat([['drip', 500, 80], ['drip', 1100, 400], ['drip', 500, 730]])],
  12: [act(`s => s.adviseSite(80, 400)`)],
  13: [act(`s => { s.predict('energy', '1000'); s.chooseCopy('valley-copies'); }`), { shot: 'mid' }, act(`s => s.runCopyQuakes()`), { wait: 4000 }],
  14: [act(`s => { s.chooseCove('north'); s.chooseHill('cliff'); }`), { shot: 'mid' }, act(`s => s.runTsunami()`), { wait: 4000 }],
  15: [act(`s => { s.chooseTownSite('tiberias', 't-hill'); s.chooseTownSite('jericho', 'j-fan'); s.chooseTownSite('shechem', 'y-ridge'); }`), { shot: 'mid' }, act(`s => s.runTownQuakes()`), { wait: 4000 }],
  16: [heat([['drip', 300, 250], ['plume', 600, 250]], 14), act(`s => { for (const [x, z] of [[600, 250], [300, 250], [120, 250], [265, 250]]) s.hammer(x, z); }`)],
  17: [heat([], 30), { shot: 'mid' }, heat([['drip', 60, 40]], 30)],
  18: [heat([['drip', 88, 130], ['plume', 180, 50]], 8), { shot: 'mid' }, act(`s => { s.chooseTownSite('coast', 'c-plain'); s.chooseTownSite('ridge', 'r-crest'); s.chooseTownSite('valley', 'v-terrace'); s.runTownQuakes(); }`), { wait: 4000 }],
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
page.setDefaultTimeout(120000);
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

const results = [];
for (const id of Object.keys(PLAN).map(Number)) {
  if (only.length && !only.includes(id)) continue;
  const tag = String(id).padStart(2, '0');
  await page.goto(`${base}/?level=${id}`);
  await page.waitForFunction(() => window.game?.session);
  await page.evaluate(() => window.advanceTime(800));
  await page.screenshot({ path: `${out}/L${tag}-intro.png` });
  await page.keyboard.press('Enter');
  await page.evaluate(() => window.advanceTime(1200));
  await page.screenshot({ path: `${out}/L${tag}-plan.png` });
  for (const step of PLAN[id]) {
    if (step.heat) {
      await page.evaluate(({ heat, dur }) => {
        const g = window.game;
        for (const [k, x, z] of heat) g.placeHeat(k, x, z);
        if (dur !== undefined) g.setDuration(dur);
        g.run();
        for (let i = 0; i < 400 && g.session.phase === 'running'; i++) g.advanceTime(100);
        g.advanceTime(1500);
      }, step);
    } else if (step.act) {
      await page.evaluate((src) => {
        window.game.act(eval(src));
        window.advanceTime(600);
      }, step.act);
    } else if (step.wait) {
      await page.evaluate((ms) => window.advanceTime(ms), step.wait);
    } else if (step.shot) {
      await page.screenshot({ path: `${out}/L${tag}-${step.shot}.png` });
    }
  }
  await page.evaluate(() => window.advanceTime(1500));
  await page.screenshot({ path: `${out}/L${tag}-end.png` });
  const st = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  results.push({ id, phase: st.phase, outcome: st.outcome?.success ?? null, stars: st.outcome?.stars ?? 0, line: st.feedback?.line ?? '' });
}
await browser.close();
for (const r of results) console.log(`L${r.id}\t${r.outcome ? 'WIN' : 'NO '}\t${r.stars}★\t${r.phase}\t${r.line.slice(0, 70)}`);
if (errors.length) console.log('console errors:\n' + [...new Set(errors)].join('\n'));
process.exit(results.every((r) => r.outcome) && !errors.length ? 0 : 1);
