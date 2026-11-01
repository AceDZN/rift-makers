// The workbook bridge in a real embed: a localhost parent page with the built
// game (dist/) in an iframe at ?level=7, a level locked in a fresh save. Checks
// `ready` → `level-start` → `level-complete` in that order after a real win
// played through the game controller, and that a standalone page posts nothing.
// Usage: npm run build && node tests/host-embed.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

// the game, served from a sub-path like the release CDN (relative base)
const game = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/games\/rift-makers\/test\//, '/');
  try {
    const file = normalize(join(DIST, path.endsWith('/') ? path + 'index.html' : path));
    if (!file.startsWith(DIST)) throw new Error('outside dist');
    const body = await readFile(file);
    res.setHeader('content-type', TYPES[extname(file)] ?? 'application/octet-stream');
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end();
  }
});
await new Promise((r) => game.listen(0, '127.0.0.1', r));
const GAME_ORIGIN = `http://127.0.0.1:${game.address().port}`;
const GAME = `${GAME_ORIGIN}/games/rift-makers/test/`;

const parent = createServer((_, res) => {
  res.setHeader('content-type', 'text/html');
  res.end(`<body style="margin:0"><script>window.msgs=[];addEventListener('message',e=>msgs.push({origin:e.origin,...e.data}))</script><iframe id="g" src="${GAME}?level=7" style="width:100vw;height:100vh;border:0"></iframe></body>`);
});
await new Promise((r) => parent.listen(0, '127.0.0.1', r));

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const missing = [];
page.on('response', (r) => r.status() >= 400 && missing.push(r.url()));
await page.goto(`http://127.0.0.1:${parent.address().port}/`);
const frame = await (await page.waitForSelector('#g')).contentFrame();
await frame.waitForFunction(() => window.game && window.render_game_to_text);
await page.waitForFunction(() => window.msgs.some((m) => m.type === 'ready'), null, { timeout: 60000 });
const opened = JSON.parse(await frame.evaluate(() => window.render_game_to_text()));
// play the level's verified solution through the same calls the HUD makes
await frame.evaluate(() => {
  const g = window.game;
  g.showIntro = false;
  g.placeHeat('drip', 500, 300);
  g.setDuration(6);
  g.run();
  for (let i = 0; i < 400 && g.session.phase === 'running'; i++) g.advanceTime(100);
  g.advanceTime(1500);
});
await page.waitForFunction(() => window.msgs.some((m) => m.type === 'level-complete'), null, { timeout: 30000 });
const msgs = await page.evaluate(() => window.msgs);
console.log('opened on level', opened.level?.id ?? opened.level);
console.log(msgs.map((m) => `${m.type}${m.level ? ' L' + m.level : ''}${m.stars ? ' ★' + m.stars : ''}`).join(', '));
const types = msgs.map((m) => m.type).filter((t) => t !== 'error');
const ok =
  msgs.every((m) => m.source === 'workbook-game' && m.slug === 'rift-makers' && m.version === 1 && m.origin === GAME_ORIGIN) &&
  !msgs.some((m) => m.type === 'error') &&
  types.join(',') === 'ready,level-start,level-complete' &&
  msgs.some((m) => m.type === 'level-start' && m.level === 7) &&
  msgs.some((m) => m.type === 'level-complete' && m.level === 7 && m.stars >= 1 && m.durationMs > 0) &&
  !missing.length;

// standalone: no parent, nothing posted and no errors (the embed's context is closed first so
// its software-rendered scene doesn't starve the new page)
await page.context().close();
const solo = await (await browser.newContext()).newPage();
const errs = [];
solo.on('pageerror', (e) => errs.push(String(e)));
await solo.goto(GAME + '?level=2', { waitUntil: 'domcontentloaded' });
await solo.waitForFunction(() => window.game);
await solo.waitForTimeout(1500);
if (missing.length) console.log('missing files', missing);
console.log(ok && !errs.length ? 'bridge OK' : 'bridge FAILED', errs);
await browser.close();
game.close();
parent.close();
process.exit(ok && !errs.length ? 0 : 1);
