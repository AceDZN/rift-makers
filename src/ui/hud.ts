// The Hebrew RTL interface around the canvas. Numbers and units sit in LTR
// spans. Every control is a real button (keyboard and screen reader).

import type { Game } from '../game/game.ts';
import { LEVELS, WORLDS } from '../model/levels.ts';
import { COMMISSION_LEVELS } from '../model/commissions.ts';
import { LAYERS } from '../model/earth.ts';
import { isUnlocked } from '../game/progress.ts';
import { ROCK_HE } from '../model/rocks.ts';
import { displacementKm } from '../model/terrain.ts';

const ICON = {
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a8.5 8.5 0 0 1 0 13"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6"/></svg>',
  heat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0z"/><circle cx="12" cy="17" r="2" fill="#ff6a1a" stroke="none"/></svg>',
  hint: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
  plume: '<svg viewBox="0 0 24 24"><path d="M12 2l6 8h-4v12h-4V10H6z" fill="#ffb347"/></svg>',
  drip: '<svg viewBox="0 0 24 24"><path d="M12 22l-6-8h4V2h4v12h4z" fill="#7fc0ff"/></svg>',
  seismo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h4l2-6 3 12 3-9 2 5 2-2h4"/></svg>',
  hammer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4l6 6-3 3-6-6zM11 7L3 15l3 3 8-8"/></svg>',
  probe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v14"/><circle cx="12" cy="19" r="3" fill="#ff6a1a" stroke="none"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/><path d="M9 11l3-3 3 3v3H9z"/></svg>',
  dig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M8 11l4 4 4-4M5 20h14"/></svg>',
};

const fmt = (n: number) => (Math.round(n * 100) / 100).toLocaleString('he-IL');
const ltr = (s: string | number) => `<span class="ltr">${s}</span>`;
const starsHtml = (n: number) => [0, 1, 2].map((i) => (i < n ? '★' : '<span class="off">★</span>')).join('');

export class Hud {
  private root: HTMLElement;
  private game: Game;
  private lastVersion = -1;
  private fill: HTMLElement | null = null;
  private commit: HTMLElement | null = null;

  constructor(root: HTMLElement, game: Game) {
    this.root = root;
    this.game = game;
  }

  frame() {
    if (this.game.version !== this.lastVersion) {
      this.lastVersion = this.game.version;
      this.render();
    }
    const s = this.game.session;
    if (s && this.fill) {
      const max = this.timeMax();
      this.fill.style.width = `${Math.min(100, (s.t / max) * 100)}%`;
      if (this.commit) {
        const start = s.phase === 'running' ? s.runStart : s.t;
        this.commit.style.left = `${(start / max) * 100}%`;
        this.commit.style.width = `${Math.min(100, (s.duration / max) * 100)}%`;
        this.commit.style.display = s.phase === 'plan' || s.phase === 'running' ? '' : 'none';
      }
      const tlab = this.root.querySelector('.tnow');
      if (tlab) tlab.innerHTML = ltr(fmt(s.t));
    }
  }

  private timeMax(): number {
    const s = this.game.session!;
    return s.def.chainMaxMyr ?? Math.max(s.def.duration.max, 0.0001);
  }

  private render() {
    const g = this.game;
    this.root.innerHTML = '';
    this.fill = null;
    this.commit = null;
    if (g.screen === 'select') return this.renderSelect();
    const s = g.session;
    if (!s) return;
    this.renderTop();
    // the result and review cards already carry the line
    if (s.feedback && !g.showIntro && !s.outcome && s.phase !== 'review') this.renderToast();
    this.renderBottom();
    if (g.showIntro) this.renderIntro();
    else if (s.outcome) this.renderResult();
    else if (s.phase === 'review') this.renderReview();
    else if (g.paused) this.renderPause();
  }

  private el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }

  private button(cls: string, html: string, onClick: () => void, opts: { label?: string; disabled?: boolean; pressed?: boolean } = {}): HTMLButtonElement {
    const b = this.el('button', cls, html);
    b.type = 'button';
    if (opts.label) b.setAttribute('aria-label', opts.label);
    if (opts.disabled) b.disabled = true;
    if (opts.pressed !== undefined) b.setAttribute('aria-pressed', String(opts.pressed));
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });
    return b;
  }

  // ───────── top ─────────

  private renderTop() {
    const g = this.game;
    const s = g.session!;
    const top = this.el('div', 'topbar');
    const title = this.el('div', 'title-card');
    const best = g.progress.stars[s.def.id] ?? 0;
    title.innerHTML = `<div class="title-row"><span>${s.def.id > 100 ? '' : ltr(s.def.id) + '. '}${s.def.title}</span><span class="stars" aria-label="${best} כוכבים">${starsHtml(s.outcome?.stars ?? best)}</span></div><div class="goal">${s.def.goal}</div>`;
    top.appendChild(title);
    const btns = this.el('div', 'round-btns');
    btns.appendChild(this.button('rbtn', ICON.pause + '<span class="cap">עצירה</span>', () => {
      g.paused = true;
      g.touch();
    }, { label: 'עצירה' }));
    btns.appendChild(this.button('rbtn', (g.audio.muted ? ICON.mute : ICON.sound) + '<span class="cap">צליל</span>', () => g.toggleMute(), { label: g.audio.muted ? 'הפעלת צליל' : 'השתקה', pressed: g.audio.muted }));
    if (g.slab) btns.appendChild(this.button(`rbtn ${g.heatView ? 'on' : ''}`, ICON.heat + '<span class="cap">תצוגת חום</span>', () => g.toggleHeatView(), { label: 'תצוגת חום', pressed: g.heatView }));
    if (!s.def.noHints) btns.appendChild(this.button('rbtn', ICON.hint + '<span class="cap">רמז (−★)</span>', () => g.hint(), { label: 'רמז, עולה כוכב', disabled: !!s.outcome }));
    top.appendChild(btns);
    this.root.appendChild(top);
  }

  private renderToast() {
    const f = this.game.session!.feedback!;
    const t = this.el('div', `toast ${f.tone}`);
    t.setAttribute('role', 'status');
    t.innerHTML = `<span class="ico" aria-hidden="true">${f.tone === 'good' ? '✓' : f.tone === 'bad' ? '!' : 'i'}</span><span>${f.line}</span>`;
    this.root.appendChild(t);
  }

  // ───────── bottom ─────────

  private renderBottom() {
    const g = this.game;
    const s = g.session!;
    const d = s.def;
    const bar = this.el('div', 'bottombar');
    const heatLevel = ['heat', 'predict', 'wegener', 'rocks', 'fossil', 'israel'].includes(d.kind);

    if (heatLevel && !(d.kind === 'wegener' && !s.accepted)) {
      const showTime = !(d.duration.fixed && d.duration.max === 0);
      if (showTime) bar.appendChild(this.timeBlock());
      bar.appendChild(this.tray());
    }
    if (d.kind === 'predict' && s.phase === 'plan') bar.appendChild(this.predictPanel());
    if (d.kind === 'seismo') bar.appendChild(this.seismoPanel());
    if (d.kind === 'dig') bar.appendChild(this.digPanel());
    if (d.kind === 'wegener' && !s.accepted) bar.appendChild(this.wegenerPanel());
    if (d.kind === 'site' && d.site?.kind === 'quakes') bar.appendChild(this.info(s.siteReport ? `בעיר הנמל הורגשו ${ltr(s.siteReport.felt)} רעידות ב־1,000 שנה. המרחק מהגבול הקרוב: ${ltr(s.siteReport.nearestKm + ' km')}` : 'הקישו על החוף כדי לייעץ איפה לבנות את עיר הנמל. אחר כך נריץ 1,000 שנים של רעידות.'));
    if (d.kind === 'copy') bar.appendChild(this.copyPanel());
    if (d.site?.kind === 'tsunami') bar.appendChild(this.tsunamiPanel());
    if ((d.site?.kind === 'rebuild' || (d.kind === 'israel' && s.phase === 'sites'))) bar.appendChild(this.townsPanel());
    if (d.rocks && (s.phase === 'collect' || s.hammered.length)) bar.appendChild(this.rocksPanel());
    if (d.fossil) bar.appendChild(this.fossilPanel());
    this.root.appendChild(bar);
  }

  private info(html: string): HTMLElement {
    return this.el('div', 'panel', `<div class="qlabel" style="max-width:520px;line-height:1.45">${html}</div>`);
  }

  private timeBlock(): HTMLElement {
    const g = this.game;
    const s = g.session!;
    const d = s.def;
    const wrap = this.el('div', 'panel timeblock');
    const tl = this.el('div', 'timeline');
    const max = this.timeMax();
    const ticks = [0, max / 4, max / 2, (3 * max) / 4, max].map((x) => `<span>${fmt(x)}</span>`).join('');
    tl.innerHTML = `<div class="lbl">מיליוני שנים · עכשיו <span class="tnow">${ltr(fmt(s.t))}</span></div><div class="tbar" role="progressbar" aria-label="זמן עמוק" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${s.t}"><div class="fill"></div><div class="commit"></div></div><div class="tticks">${ticks}</div>`;
    this.fill = tl.querySelector('.fill');
    this.commit = tl.querySelector('.commit');
    wrap.appendChild(tl);
    // readout: rate × time = distance
    const m = s.boundaries()[0];
    const rate = d.fixedRate ?? (s.phase !== 'plan' || s.t > 0 ? m?.rateCmYr : undefined);
    const ro = this.el('div', 'readout');
    const rateTxt = rate !== undefined ? ltr(`${fmt(rate)}`) : '?';
    const km = rate !== undefined ? ltr(fmt(displacementKm(rate, s.duration))) : '?';
    ro.innerHTML = `<div class="eq">${rateTxt} ס״מ/שנה × ${ltr(fmt(s.duration))} מיליון שנה</div><div class="km">= ${km} ק״מ</div>`;
    ro.setAttribute('aria-label', 'קצב כפול זמן שווה מרחק');
    wrap.appendChild(ro);
    if (!d.duration.fixed) {
      const st = this.el('div', 'stepper');
      const can = s.phase === 'plan';
      st.appendChild(this.button('', '+', () => g.stepDuration(1), { label: 'יותר זמן', disabled: !can }));
      st.appendChild(this.el('div', 'val', `<b>${ltr(fmt(s.duration))}</b><small>מיליון שנה</small>`));
      st.appendChild(this.button('', '−', () => g.stepDuration(-1), { label: 'פחות זמן', disabled: !can }));
      wrap.appendChild(st);
    }
    const label = s.phase === 'running' ? 'הזמן רץ…' : `הרץ ${fmt(s.duration)} מיליון שנה`;
    wrap.appendChild(this.button('runbtn', `<span class="play" aria-hidden="true">▶</span><span>${label}</span>`, () => g.run(), { disabled: !s.canRun(), label }));
    return wrap;
  }

  private tray(): HTMLElement {
    const g = this.game;
    const s = g.session!;
    const d = s.def;
    const tray = this.el('div', 'panel tray');
    const plan = s.phase === 'plan';
    const anyLeft = (k: 'plume' | 'drip') => (d.anyHeat !== undefined ? d.anyHeat : ((k === 'plume' ? d.plumes : d.drips) ?? 0)) > 0;
    for (const k of ['plume', 'drip'] as const) {
      if (!anyLeft(k)) continue;
      const left = Math.max(0, s.heatLeft(k));
      const total = d.anyHeat ?? (k === 'plume' ? d.plumes : d.drips) ?? 0;
      const b = this.button(
        `tool ${k} ${g.tool === k ? 'active' : ''}`,
        `${ICON[k]}<span>${k === 'plume' ? 'פלומה חמה' : 'טפטוף קר'}</span><span class="count">${ltr(`${left}/${total}`)}</span>`,
        () => g.setTool(k),
        { disabled: !plan || !s.canPlaceHeat(k), pressed: g.tool === k, label: `${k === 'plume' ? 'פלומה חמה' : 'טפטוף קר'}, נשארו ${left}` },
      );
      tray.appendChild(b);
    }
    if (g.selectedHeat && plan) tray.appendChild(this.button('tool', '<span style="font-size:24px">✕</span><span>הסרת חום</span>', () => g.removeSelectedHeat(), { label: 'הסרת החום הנבחר' }));
    if (d.seamAtPlume) {
      const left = (d.probes ?? 4) - s.probes.length;
      tray.appendChild(this.button(`tool ${g.tool === 'probe' ? 'active' : ''}`, `${ICON.probe}<span>גשוש זרם חום</span><span class="count">${ltr(left)}</span>`, () => g.setTool('probe'), { disabled: !plan || left <= 0, pressed: g.tool === 'probe' }));
    }
    if (d.rocks) {
      tray.appendChild(this.button(`tool ${s.phase === 'collect' ? 'active' : ''}`, `${ICON.hammer}<span>פטיש סלעים</span>`, () => g.setTool('hammer'), { disabled: s.phase !== 'collect' }));
    }
    if (!tray.children.length) tray.style.display = 'none';
    return tray;
  }

  private predictPanel(): HTMLElement {
    const g = this.game;
    const s = g.session!;
    const p = this.el('div', 'panel choices');
    p.appendChild(this.el('span', 'qlabel', 'לאן ינוע כל לוח?'));
    for (const q of s.def.predict ?? []) {
      p.appendChild(this.el('span', 'qlabel', q.he + ':'));
      for (const o of q.options) {
        const sel = s.predictions[q.key] === o.id;
        p.appendChild(this.button(`choice ${sel ? 'sel' : ''}`, o.he + (sel ? '<span class="tick">✓</span>' : ''), () => g.act((ss) => ss.predict(q.key, o.id)), { pressed: sel }));
      }
    }
    return p;
  }

  private seismoPanel(): HTMLElement {
    const g = this.game;
    const s = g.session!;
    const p = this.el('div', 'panel choices');
    const n = s.def.seismo!.stations;
    p.appendChild(this.el('span', 'qlabel', `תחנות: ${ltr(`${s.stations.length}/${n}`)} · הקישו על שפת הכדור כדי להציב`));
    p.appendChild(this.button('runbtn', '<span class="play">〰</span><span>הפעילו רעידה</span>', () => g.act((ss) => ss.fire()), { disabled: s.stations.length < n || !!s.outcome }));
    if (s.fired) {
      const r = s.readings.map((x) => `${ltr(x.angleDeg + '°')}: ${x.solidOnlyArrives ? 'שני הגלים' : 'רק גל אחד'}`).join(' · ');
      p.appendChild(this.el('span', 'qlabel', r));
      p.appendChild(this.el('span', 'qlabel', 'סמנו את השכבה הנוזלית:'));
      for (const L of LAYERS) {
        p.appendChild(this.button(`choice ${s.marked === L.id ? 'sel' : ''}`, L.he, () => {
          g.act((ss) => ss.mark(L.id));
          g.globe?.mark(L.id);
        }));
      }
    }
    return p;
  }

  private digPanel(): HTMLElement {
    const g = this.game;
    const s = g.session!;
    const p = this.el('div', 'panel tray');
    const left = s.def.dig!.samples - s.probes.length;
    p.appendChild(this.button(`tool ${g.tool === 'age' ? 'active' : ''}`, `${ICON.hammer}<span>דגימת גיל</span><span class="count">${ltr(left)}</span>`, () => g.setTool('age'), { disabled: left <= 0 || !!s.outcome, pressed: g.tool === 'age' }));
    p.appendChild(this.button(`tool ${g.tool === 'dig' ? 'active' : ''}`, `${ICON.dig}<span>שליחת החפירה</span>`, () => g.setTool('dig'), { disabled: !!s.outcome, pressed: g.tool === 'dig' }));
    return p;
  }

  private wegenerPanel(): HTMLElement {
    const g = this.game;
    const s = g.session!;
    const p = this.el('div', 'panel choices');
    p.appendChild(this.el('span', 'qlabel', g.selectedPiece ? 'גררו את היבשת, סובבו אותה:' : 'בחרו יבשת וגררו אותה למקום.'));
    const id = g.selectedPiece;
    p.appendChild(this.button('choice', '⟲ סיבוב', () => id && g.act((ss) => ss.rotatePiece(id, -0.06)), { disabled: !id }));
    p.appendChild(this.button('choice', '⟳ סיבוב', () => id && g.act((ss) => ss.rotatePiece(id, 0.06)), { disabled: !id }));
    p.appendChild(this.button('runbtn', '<span class="play">📜</span><span>הציגו למבקרים</span>', () => g.act((ss) => ss.present())));
    return p;
  }

  private copyPanel(): HTMLElement {
    const g = this.game;
    const s = g.session!;
    const p = this.el('div', 'panel choices');
    const q = s.def.predict![0];
    p.appendChild(this.el('span', 'qlabel', q.he));
    for (const o of q.options) {
      const sel = s.predictions.energy === o.id;
      p.appendChild(this.button(`choice ${sel ? 'sel' : ''}`, o.he, () => g.act((ss) => ss.predict('energy', o.id)), { pressed: sel }));
    }
    p.appendChild(this.el('span', 'qlabel', 'מי מעתיקה את שיטת הבנייה של מי?'));
    const opts = [
      { id: 'valley-copies', he: 'עיר העמק בונה כמו עיר הנמל' },
      { id: 'port-copies', he: 'עיר הנמל בונה כמו עיר העמק' },
    ];
    for (const o of opts) {
      const sel = s.copyChoice === o.id;
      p.appendChild(this.button(`choice ${sel ? 'sel' : ''}`, o.he, () => g.act((ss) => ss.chooseCopy(o.id)), { pressed: sel }));
    }
    p.appendChild(this.button('runbtn', '<span class="play">〰</span><span>הרעידות מגיעות</span>', () => g.act((ss) => ss.runCopyQuakes()), { disabled: !s.copyChoice || !s.predictions.energy || !!s.outcome }));
    if (s.quakeReport) {
      const lines = s.quakeReport.towns.map((t) => `${s.def.copy!.towns.find((x) => x.id === t.town)!.he}: ${ltr(`${t.standing}/${t.total}`)} בתים עומדים · מרקלי ${ltr(t.mercalli)}`).join('<br>');
      p.appendChild(this.el('span', 'qlabel', lines));
    }
    return p;
  }

  private tsunamiPanel(): HTMLElement {
    const g = this.game;
    const s = g.session!;
    const st = s.def.site!;
    const p = this.el('div', 'panel choices');
    p.appendChild(this.el('span', 'qlabel', 'בחרו מפרץ לנמל וגבעה למילוט (גם על המפה):'));
    for (const c of st.sites) {
      const sel = s.cove === c.id;
      p.appendChild(this.button(`choice ${sel ? 'sel' : ''}`, '⚓ ' + c.he, () => g.act((ss) => ss.chooseCove(c.id)), { pressed: sel }));
    }
    for (const h of st.hills!) {
      const sel = s.hill === h.id;
      p.appendChild(this.button(`choice ${sel ? 'sel' : ''}`, `⛰ ${h.he} ${ltr(h.elev + ' m')}`, () => g.act((ss) => ss.chooseHill(h.id)), { pressed: sel }));
    }
    p.appendChild(this.button('runbtn', '<span class="play">🌊</span><span>רעידה בתעלה</span>', () => g.act((ss) => ss.runTsunami()), { disabled: !s.cove || !s.hill || !!s.outcome }));
    if (s.evac) p.appendChild(this.el('span', 'qlabel', `הליכה: ${ltr(Math.round(s.evac.walkMin) + ' min')} · עד הגל: ${ltr(Math.round(s.evac.warningMin) + ' min')}`));
    return p;
  }

  private townsPanel(): HTMLElement {
    const g = this.game;
    const s = g.session!;
    const d = s.def;
    const towns = d.site?.towns ?? d.israel!.towns;
    const sites = d.site?.sites ?? d.israel!.sites;
    const p = this.el('div', 'panel choices');
    for (const t of towns) {
      p.appendChild(this.el('span', 'qlabel', t.he + ':'));
      for (const sid of t.sites) {
        const st = sites.find((x) => x.id === sid)!;
        const sel = s.townSites[t.id] === sid;
        p.appendChild(this.button(`choice ${sel ? 'sel' : ''}`, st.he, () => g.act((ss) => ss.chooseTownSite(t.id, sid)), { pressed: sel }));
      }
    }
    const ready = towns.every((t) => s.townSites[t.id]);
    p.appendChild(this.button('runbtn', '<span class="play">〰</span><span>הרעידה הבאה בבקע</span>', () => g.act((ss) => ss.runTownQuakes()), { disabled: !ready || !!s.outcome }));
    return p;
  }

  private rocksPanel(): HTMLElement {
    const s = this.game.session!;
    const r = s.def.rocks!;
    const p = this.el('div', 'panel');
    const list = r.targets.map((t) => `<span class="${s.collected.has(t) ? 'got' : ''}">${s.collected.has(t) ? '✓ ' : '○ '}${ROCK_HE[t]}</span>`).join('');
    p.innerHTML = `<div class="checklist">${list}</div><div class="qlabel" style="margin-top:6px">דגימות שנשארו: ${ltr(r.samples - s.hammered.length)}</div>`;
    return p;
  }

  private fossilPanel(): HTMLElement {
    const s = this.game.session!;
    const f = s.fossilState();
    const top = f.topM === null ? 'אין עדיין שכבות צדפים' : `שכבות הצדפים בגובה ${ltr(Math.round(f.topM) + ' m')}`;
    return this.el('div', 'panel', `<div class="qlabel">שכבות: ${ltr(f.layers)} · ${top} · היעד: ${ltr('700 m')} · עברו ${ltr(fmt(s.t))} מתוך ${ltr(100)} מיליון שנה</div>`);
  }

  // ───────── cards ─────────

  private overlay(card: HTMLElement) {
    const o = this.el('div', 'overlay');
    o.appendChild(card);
    this.root.appendChild(o);
    const first = card.querySelector<HTMLButtonElement>('button.primary') ?? card.querySelector('button');
    first?.focus({ preventScroll: true });
  }

  private renderIntro() {
    const g = this.game;
    const s = g.session!;
    const c = this.el('div', 'card');
    c.setAttribute('role', 'dialog');
    c.setAttribute('aria-label', s.def.title);
    const world = WORLDS.find((w) => w.id === s.def.world)!;
    let extra = '';
    if (s.def.id === 1) extra = '<p class="note">צפון למעלה ומזרח ימינה, כמו במפה. גררו כדי לסובב את המצלמה, וגלגלו או צבטו כדי להתקרב.</p>';
    if (s.def.noHints) extra = '<p class="note">שלב הגמר: בלי רמזים ובלי תוויות.</p>';
    c.innerHTML = `<div class="note">${world.he} · ${s.def.tag}</div><h2>${s.def.title}</h2><p>${s.def.intro}</p><div class="goalbox">🎯 ${s.def.goal}</div>${extra}`;
    const row = this.el('div', 'row');
    row.appendChild(this.button('btn primary', 'יוצאים לדרך', () => {
      g.audio.unlock();
      g.showIntro = false;
      g.touch();
    }));
    row.appendChild(this.button('btn', 'לבחירת שלב', () => g.exitToSelect()));
    c.appendChild(row);
    this.overlay(c);
  }

  private renderResult() {
    const g = this.game;
    const s = g.session!;
    const c = this.el('div', 'card');
    c.setAttribute('role', 'dialog');
    c.innerHTML = `<div class="bigstars" aria-label="${s.outcome!.stars} כוכבים">${starsHtml(s.outcome!.stars)}</div><h2>הצלחה!</h2><p>${s.outcome!.line}</p>${s.hints ? '<p class="note">רמז אחד עלה כוכב.</p>' : ''}`;
    const row = this.el('div', 'row');
    const id = s.def.id;
    const next = id < LEVELS.length || COMMISSION_LEVELS.some((l) => l.id === id + 1) ? id + 1 : null;
    if (next) row.appendChild(this.button('btn primary', id > 100 ? 'להזמנה הבאה' : 'לשלב הבא', () => g.startLevel(next)));
    else if (id === LEVELS.length) {
      row.appendChild(this.button('btn primary', 'בניתם את ארץ ישראל! לבחירת שלב', () => g.exitToSelect()));
      if (COMMISSION_LEVELS.length) row.appendChild(this.button('btn', 'הזמנות כוכב חדשות', () => g.startLevel(COMMISSION_LEVELS[0].id)));
    } else row.appendChild(this.button('btn primary', 'כל ההזמנות הושלמו! לבחירת שלב', () => g.exitToSelect()));
    row.appendChild(this.button('btn', 'שוב', () => g.startLevel(s.def.id)));
    row.appendChild(this.button('btn', 'לבחירת שלב', () => g.exitToSelect()));
    c.appendChild(row);
    // the result stays readable: put the card low so the landscape shows
    const o = this.el('div', 'overlay aside');
    o.appendChild(c);
    this.root.appendChild(o);
    (row.firstElementChild as HTMLButtonElement)?.focus({ preventScroll: true });
  }

  private renderReview() {
    const g = this.game;
    const s = g.session!;
    const c = this.el('div', 'card');
    c.setAttribute('role', 'dialog');
    c.innerHTML = `<h2>לא בדיוק…</h2><p>${s.feedback?.line ?? ''}</p><p class="note">התחלה מחדש מחזירה את הזמן להתחלה. החום נשאר במקום, כדי שתוכלו לשנות אותו בכוונה.</p>`;
    const row = this.el('div', 'row');
    row.appendChild(this.button('btn primary', 'התחילו מחדש', () => g.restart()));
    row.appendChild(this.button('btn', 'לבחירת שלב', () => g.exitToSelect()));
    c.appendChild(row);
    const o = this.el('div', 'overlay aside');
    o.appendChild(c);
    this.root.appendChild(o);
    (row.firstElementChild as HTMLButtonElement)?.focus({ preventScroll: true });
  }

  private renderPause() {
    const g = this.game;
    const c = this.el('div', 'card');
    c.setAttribute('role', 'dialog');
    c.innerHTML = '<h2>עצירה</h2>';
    const row = this.el('div', 'row');
    row.appendChild(this.button('btn primary', 'המשך', () => {
      g.paused = false;
      g.touch();
    }));
    row.appendChild(this.button('btn', 'התחילו מחדש', () => {
      g.paused = false;
      g.restart();
    }));
    row.appendChild(this.button('btn', 'לבחירת שלב', () => g.exitToSelect()));
    row.appendChild(this.button('btn', g.audio.muted ? 'הפעלת צליל' : 'השתקה', () => g.toggleMute()));
    row.appendChild(this.button('btn', g.reducedMotion ? 'תנועה מלאה' : 'פחות תנועה', () => g.toggleReducedMotion()));
    c.appendChild(row);
    this.overlay(c);
  }

  // ───────── level select ─────────

  private renderSelect() {
    const g = this.game;
    const wrap = this.el('div', 'select');
    wrap.innerHTML = '<h1>שוברי היבשות</h1><p class="sub">חום הוא הכוח היחיד שלכם. הניחו פלומות וטפטופים, הריצו את הזמן, וקראו את הנוף.</p>';
    const worlds = this.el('div', 'worlds');
    for (const w of WORLDS) {
      const box = this.el('div', 'world', `<h3>${w.he} <span class="en ltr">${w.en}</span></h3>`);
      for (const l of LEVELS.filter((x) => x.world === w.id)) {
        const open = isUnlocked(g.progress, l.id);
        const st = g.progress.stars[l.id] ?? 0;
        const b = this.button(
          'lvl',
          `<span class="num">${ltr(open ? l.id : '🔒')}</span><span class="name">${l.title}<span class="tag">${l.tag}</span></span><span class="st">${starsHtml(st)}</span>`,
          () => g.startLevel(l.id),
          { disabled: !open, label: `${l.id}. ${l.title}${open ? '' : ', נעול'}` },
        );
        box.appendChild(b);
      }
      worlds.appendChild(box);
    }
    if (COMMISSION_LEVELS.length) {
      const open = isUnlocked(g.progress, COMMISSION_LEVELS[0].id);
      const box = this.el('div', 'world commissions', `<h3>הזמנות כוכב <span class="en ltr">Planet commissions</span></h3><p class="note">${open ? 'שלבים שנוצרו במחשב ונבדקו שיש להם פתרון.' : 'נפתחות אחרי שלב הגמר.'}</p>`);
      const list = this.el('div', 'clist');
      box.appendChild(list);
      if (open) for (const l of COMMISSION_LEVELS) {
        const st = g.progress.stars[l.id] ?? 0;
        const b = this.button(
          'lvl',
          `<span class="num">${ltr(l.id - 100)}</span><span class="name">${l.title}<span class="tag">${l.tag}</span></span><span class="st">${starsHtml(st)}</span>`,
          () => g.startLevel(l.id),
          { label: l.title },
        );
        list.appendChild(b);
      }
      worlds.appendChild(box);
    }
    wrap.appendChild(worlds);
    const row = this.el('div', 'row');
    row.style.justifyContent = 'center';
    // continue at the first open level without stars, else the last open one
    const open = LEVELS.filter((l) => isUnlocked(g.progress, l.id));
    const next = open.find((l) => !(g.progress.stars[l.id] ?? 0)) ?? open[open.length - 1];
    const total = LEVELS.reduce((a, l) => a + (g.progress.stars[l.id] ?? 0), 0);
    row.appendChild(this.el('span', 'total-stars', `<span aria-hidden="true">★</span> <span class="ltr">${total}/${LEVELS.length * 3}</span>`));
    row.appendChild(this.button('btn primary big', `${total ? 'המשך' : 'מתחילים'} · שלב ${ltr(next.id)}`, () => g.startLevel(next.id)));
    row.appendChild(this.button('btn', g.audio.muted ? 'הפעלת צליל' : 'השתקה', () => g.toggleMute()));
    wrap.appendChild(row);
    this.root.appendChild(wrap);
  }
}
