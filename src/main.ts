import './style.css';
import { Game } from './game/game.ts';
import { Hud } from './ui/hud.ts';
import { initHost, parseLevelParam, postToHost } from './host.ts';
import { LEVELS } from './model/levels.ts';

declare global {
  interface Window {
    render_game_to_text: () => string;
    advanceTime: (ms: number) => void;
    game: Game;
  }
}

initHost('rift-makers');

const stage = document.getElementById('stage')!;
const labels = document.getElementById('labels')!;
const hudRoot = document.getElementById('hud')!;
const game = new Game(stage, labels);
const hud = new Hud(hudRoot, game);

window.game = game;
window.render_game_to_text = () => game.textState();
window.advanceTime = (ms: number) => {
  manual = true;
  game.advanceTime(ms);
  hud.frame();
};

window.addEventListener('keydown', (e) => {
  if ((e.target as HTMLElement)?.tagName === 'BUTTON' && (e.code === 'Enter' || e.code === 'Space')) return;
  game.key(e);
});

const deep = parseLevelParam(location.search, LEVELS.length);
if (deep !== null) game.startLevel(deep + 1);
else game.exitToSelect();

let manual = false;
let last = performance.now();
function loop(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!manual) {
    game.step(dt);
    game.render();
  }
  hud.frame();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
postToHost({ type: 'ready' });
