// The 18 authored levels. Data only; rules live in session.ts and the model
// modules. Distances km, elevations m, rates cm/yr, time Myr.
//
// The player's verbs (handoff, "Not like the existing games"): place heat
// (hot plume / cold drip), commit a forward-only duration, read evidence
// (seismograph, rock hammer, sea-floor ages, heat-flow probes) and advise the
// villagers where to settle. Never: pick a boundary type, drag a depth slider,
// click rock-cycle processes, spend a budget, drag process chips, sculpt.

import type { BaseSpec, RiftProfile, Shape } from './terrain.ts';
import { MAT } from './terrain.ts';
import type { Heat, Plate, Seam } from './heat.ts';
import { rectPoly } from './heat.ts';
import type { LayerId } from './earth.ts';
import { type Vec2, v } from './geo.ts';
import { riftFloorFromRelief } from './israel.ts';

export type Kind =
  | 'heat' // place heat, commit a duration, judge the landscape
  | 'seismo' // stations around the planet, mark the liquid layer
  | 'predict' // heat already burning: commit predictions, then run
  | 'dig' // read sea-floor ages, choose the dig site
  | 'wegener' // assemble by evidence, then heat runs time to today
  | 'site' // advise a site, then a recorded run of quakes / a wave
  | 'copy' // which town copies whose building
  | 'rocks' // heat makes rocks; collect them with the hammer
  | 'fossil' // shallow sea, then uplift; read the strata
  | 'israel'; // final

export type Wish =
  | { kind: 'sea'; r: number }
  | { kind: 'seaBetween'; other: string; min: number; max: number }
  | { kind: 'mountain'; r: number; minElev: number; maxElev?: number };

export interface Villager {
  id: string;
  x: number;
  z: number;
  wish?: Wish;
  says?: string;
}

export interface Site {
  id: string;
  he: string;
  x: number;
  z: number;
  /** Ground under the site amplifies shaking: firm rock 1, valley fill >1. */
  ground?: number;
}

export interface Piece {
  id: string;
  he: string;
  outline: Vec2[];
  start: { x: number; z: number; rot: number };
  target: { x: number; z: number; rot: number } | null;
  fossils: string[];
  rockBelt: string;
  color: string;
}

export interface LevelDef {
  id: number;
  world: 1 | 2 | 3 | 4;
  key: string;
  title: string;
  module: string;
  tag: 'הדרכה' | 'קל' | 'בינוני' | 'מאתגר' | 'העברה' | 'גמר' | 'הזמנה';
  kind: Kind;
  intro: string;
  goal: string;
  hint: string;
  /** What the hint highlights in the scene (evidence, never the answer). */
  hintShows?: 'flow' | 'ages' | 'heatflow' | 'coast' | 'fossils' | 'faults' | 'rocks' | 'none';
  success: string;
  base: BaseSpec;
  relief?: number;
  // plates and heat
  plates?: Plate[];
  seams?: Seam[];
  fixedHeat?: Heat[];
  plumes?: number;
  drips?: number;
  /** Either kind, this many in total (overrides plumes/drips). */
  anyHeat?: number;
  heatSnapKm?: number;
  cellKm?: number;
  /** Flow strength (cm/yr scale). */
  strength?: number;
  /** Fixed relative rate (cm/yr) when the level states it ("the plates move 5 cm per year"). */
  fixedRate?: number;
  /** Drift already going on at a seam (cm/yr), added to what the heat makes. */
  baseMotion?: Record<string, { normal: number; tangential: number }>;
  /** Runs chain: time keeps going forward from where the last run stopped, up to this total. */
  chainMaxMyr?: number;
  /** A seam opens at the player's plume (no seams before). */
  seamAtPlume?: { upwellingX: number; toleranceKm: number; rateCmYr: number };
  // deep time
  duration: { min: number; max: number; step: number; start: number; fixed?: boolean };
  villagers?: Villager[];
  visibleKm?: number;
  noHints?: boolean;
  // kind-specific
  seismo?: { stations: number };
  predict?: { key: string; he: string; options: { id: string; he: string }[]; answer: string }[];
  /** Prediction rounds, each with its own burning heat; all must be right. The last round's line is `success`. */
  rounds?: { fixedHeat: Heat[]; line: string }[];
  probes?: number;
  dig?: { samples: number; minAgeMyr: number; ridgeX: number; spreadMyr: number; rateCmYr: number };
  fields?: { x: number; z: number; band: number; town: Vec2; townSafeKm: number };
  road?: { northX: number; southX: number; faultZ: number; tolKm: number };
  wegener?: { pieces: Piece[]; snapKm: number; snapDeg: number; minDriftKm: number };
  ring?: { villages: Site[]; minArcKm: number };
  site?: SiteLevel;
  copy?: CopyLevel;
  rocks?: { targets: RockId[]; shelf: { x1: number; x2: number }; samples: number };
  fossil?: { targetM: number; layerMyr: number; layers: number; upliftMPerMyr: number };
  israel?: IsraelLevel;
}

export type RockId = 'basalt' | 'granite' | 'limestone' | 'marble';

export interface SiteLevel {
  kind: 'quakes' | 'tsunami' | 'rebuild';
  sites: Site[];
  /** For 'quakes': the site must be this far from every active boundary. */
  safeKm?: number;
  /** For 'tsunami': hills and timing. */
  hills?: { id: string; he: string; x: number; z: number; elev: number }[];
  tsunami?: { arrivalMin: number; runupM: number; sirenDelayMin: number; walkKmPerMin: number; pathFactor: number };
  /** For 'rebuild': towns, each picks one of its sites; possible next quakes. */
  towns?: { id: string; he: string; sites: string[] }[];
  quakes?: { magnitude: number; x: number; z: number; depthKm: number }[];
  houseStrength?: number;
}

export interface CopyLevel {
  towns: { id: string; he: string; x: number; z: number; code413: boolean; quake: { magnitude: number; x: number; z: number; depthKm: number } }[];
  houses: number;
  minStanding: number;
}

export interface IsraelLevel {
  sites: Site[];
  towns: { id: string; he: string; sites: string[] }[];
  quake: { magnitude: number; depthKm: number };
  ridgeBand: [number, number];
  coastBand: [number, number];
  golan: { xMin: number; zMax: number };
}

// ───────── helpers ─────────

export const green = (w: number, d: number, shapes: Shape[] = [], seed = 3): BaseSpec => ({
  widthKm: w,
  depthKm: d,
  elev: 320,
  crust: 'continental',
  mat: MAT.grass,
  shapes,
  roughness: 140,
  seed,
});

export const hill = (x: number, z: number, r: number, h: number, mat: number = MAT.rock): Shape => ({
  geom: { kind: 'circle', x, z, r, soft: r },
  add: h,
  profile: 'cone',
  mat: mat as Shape['mat'],
});

/** Two plates split by a north–south seam at x. */
export function splitNS(w: number, d: number, x: number, west: Plate['crust'] = 'continental', east: Plate['crust'] = 'continental', names = ['הלוח המערבי', 'הלוח המזרחי']) {
  const plates: Plate[] = [
    { id: 'W', he: names[0], poly: rectPoly(-1, -1, x, d + 1), crust: west },
    { id: 'E', he: names[1], poly: rectPoly(x, -1, w + 1, d + 1), crust: east },
  ];
  const seams: Seam[] = [{ id: 's1', p0: v(x, 0), p1: v(x, d), plates: ['W', 'E'] }];
  return { plates, seams };
}

/** Two plates split by an east–west seam at z. */
function splitEW(w: number, d: number, z: number) {
  const plates: Plate[] = [
    { id: 'N', he: 'הלוח הצפוני', poly: rectPoly(-1, -1, w + 1, z), crust: 'continental' },
    { id: 'S', he: 'הלוח הדרומי', poly: rectPoly(-1, z, w + 1, d + 1), crust: 'continental' },
  ];
  const seams: Seam[] = [{ id: 's1', p0: v(0, z), p1: v(w, z), plates: ['N', 'S'] }];
  return { plates, seams };
}

const x5 = (p: Piece): Piece => ({
  ...p,
  outline: p.outline.map((q) => v(q.x * 5, q.z * 5)),
  start: { ...p.start, x: p.start.x * 5, z: p.start.z * 5 },
  target: p.target ? { ...p.target, x: p.target.x * 5, z: p.target.z * 5 } : null,
});

const URL8 = 'https://geography.workbook.co.il/grade-8/chapter-4/';
const URL9 = 'https://geography.workbook.co.il/grade-9/chapter-2/';

// The rift floor comes from real relief (ETOPO1, see israel.ts and ASSETS.md).
const ISRAEL_RIFT: RiftProfile = {
  widthKm: 22,
  fullAtKm: 45,
  floor: riftFloorFromRelief(),
};

// ───────── levels ─────────

const L1 = splitNS(800, 500, 560);
const L3 = splitNS(1000, 500, 500);
// Three layouts with different answers (apart, both the same way, together), so no fixed pair of arrows wins them all.
const L3_ROUNDS: { fixedHeat: Heat[]; line: string }[] = [
  {
    fixedHeat: [{ id: 'p', kind: 'plume', x: 500, z: 250, fixed: true }],
    line: 'מעל הפלומה החומר החם עלה והתפשט לשני הצדדים, ומשך את הלוחות זה מזה. עכשיו החום בוער במקום אחר.',
  },
  {
    fixedHeat: [{ id: 'd', kind: 'drip', x: 100, z: 250, fixed: true }, { id: 'p', kind: 'plume', x: 900, z: 250, fixed: true }],
    line: 'הזרם רץ מהפלומה במזרח אל הטפטוף במערב, ושני הלוחות נגררו יחד מערבה. סיבוב אחרון.',
  },
  {
    fixedHeat: [{ id: 'p', kind: 'plume', x: 100, z: 250, fixed: true }, { id: 'd', kind: 'drip', x: 480, z: 250, fixed: true }],
    line: '',
  },
];
const L4 = splitNS(1200, 600, 600);
const L6 = splitNS(1200, 600, 450, 'oceanic', 'oceanic');
const L7 = splitNS(1000, 600, 500);
const L8 = splitNS(1000, 600, 450, 'oceanic', 'continental', ['לוח האוקיינוס', 'לוח היבשת']);
const L9 = splitEW(800, 600, 300);
const L16p: Plate[] = [
  { id: 'W', he: 'הלוח המערבי', poly: rectPoly(-1, -1, 300, 501), crust: 'continental' },
  { id: 'M', he: 'הלוח האמצעי', poly: rectPoly(300, -1, 600, 501), crust: 'continental' },
  { id: 'E', he: 'הלוח המזרחי', poly: rectPoly(600, -1, 901, 501), crust: 'continental' },
];
const L16s: Seam[] = [
  { id: 'A', p0: v(300, 0), p1: v(300, 500), plates: ['W', 'M'] },
  { id: 'B', p0: v(600, 0), p1: v(600, 500), plates: ['M', 'E'] },
];

// Ring of Fire: an ocean plate ringed on three sides by continents; open to the west.
const RING_PLATES: Plate[] = [
  { id: 'O', he: 'לוח האוקיינוס', poly: [v(-1, 170), v(1000, 170), v(1000, 640), v(-1, 640)], crust: 'oceanic' },
  { id: 'N', he: 'יבשת הצפון', poly: [v(-1, -1), v(1201, -1), v(1201, 170), v(-1, 170)], crust: 'continental' },
  { id: 'E', he: 'יבשת המזרח', poly: [v(1000, 170), v(1201, 170), v(1201, 640), v(1000, 640)], crust: 'continental' },
  { id: 'S', he: 'יבשת הדרום', poly: [v(-1, 640), v(1201, 640), v(1201, 801), v(-1, 801)], crust: 'continental' },
];
const RING_SEAMS: Seam[] = [
  { id: 'north', p0: v(0, 170), p1: v(1000, 170), plates: ['O', 'N'], segment: true },
  { id: 'east', p0: v(1000, 170), p1: v(1000, 640), plates: ['O', 'E'], segment: true },
  { id: 'south', p0: v(0, 640), p1: v(1000, 640), plates: ['O', 'S'], segment: true },
];
const RING_BASE = (seed: number): BaseSpec => ({
  widthKm: 1200,
  depthKm: 800,
  elev: -4300,
  crust: 'oceanic',
  mat: MAT.seafloor,
  roughness: 160,
  seed,
  shapes: [
    { geom: { kind: 'rect', x1: -80, z1: -80, x2: 1280, z2: 150, soft: 30 }, set: 350, mat: MAT.grass, crust: 'continental' },
    { geom: { kind: 'rect', x1: 1020, z1: -80, x2: 1280, z2: 880, soft: 30 }, set: 420, mat: MAT.grass, crust: 'continental' },
    { geom: { kind: 'rect', x1: -80, z1: 660, x2: 1280, z2: 880, soft: 30 }, set: 330, mat: MAT.grass, crust: 'continental' },
    { geom: { kind: 'rect', x1: -80, z1: 230, x2: 90, z2: 580, soft: 40 }, set: 240, mat: MAT.sand, crust: 'continental' },
    hill(560, 60, 50, 700),
    hill(1130, 420, 50, 800),
  ],
});
const RING_SOLVED: Heat[] = [
  { id: 'nat', kind: 'plume', x: 400, z: 400, fixed: true },
  { id: 'd1', kind: 'drip', x: 500, z: 80, fixed: true },
  { id: 'd2', kind: 'drip', x: 1100, z: 400, fixed: true },
  { id: 'd3', kind: 'drip', x: 500, z: 730, fixed: true },
];

export const LEVELS: LevelDef[] = [
  // ───────────── World 1: Inside the Earth ─────────────
  {
    id: 1,
    world: 1,
    key: 'first-plume',
    title: 'הפלומה הראשונה',
    module: URL8 + 'plate-tectonics',
    tag: 'הדרכה',
    kind: 'heat',
    intro: 'אתם רוח המעטפת. חום הוא הכוח היחיד שלכם. החצצים רוצים ים: הניחו פלומה חמה מתחת לאדמה, והריצו את הזמן.',
    goal: 'ים ברוחב 100 ק״מ לפחות בין שני הכפרים',
    hint: 'החומר החם עולה ומתפשט לצדדים. איפה צריך לחמם כדי ששני הלוחות יימשכו זה מזה?',
    hintShows: 'flow',
    success: 'מעל הפלומה הלוחות נמשכו לשני הצדדים, הקרקע צנחה והים נכנס. בקרקעית נוצרה בזלת חדשה.',
    base: green(800, 500, [hill(130, 110, 70, 900), hill(740, 420, 50, 900), hill(250, 400, 60, 600)]),
    ...L1,
    plumes: 1,
    drips: 0,
    cellKm: 260,
    strength: 3.2,
    duration: { min: 4, max: 4, step: 1, start: 4, fixed: true },
    villagers: [
      { id: 'a', x: 470, z: 250, wish: { kind: 'seaBetween', other: 'b', min: 100, max: 600 }, says: 'אנחנו רוצים ים!' },
      { id: 'b', x: 660, z: 240, says: 'עם סירות!' },
    ],
  },
  {
    id: 2,
    world: 1,
    key: 'liquid',
    title: 'נוזל או מוצק',
    module: URL8 + 'earth-structure',
    tag: 'קל',
    kind: 'seismo',
    intro: 'רעידה פרצה בראש הכדור. הציבו שלוש תחנות סייסמוגרף על השפה, הפעילו רעידה, וראו אילו גלי הדף מגיעים.',
    goal: 'הציבו 3 תחנות, הפעילו רעידה וסמנו את השכבה הנוזלית',
    hint: 'סוג אחד של גלים לא עובר דרך נוזל. איפה על הכדור הוא לא מגיע? מה הוא היה צריך לחצות כדי להגיע לשם?',
    hintShows: 'none',
    success: 'הגל שלא עובר בנוזל נעצר בגלעין החיצוני. כך יודעים שהוא נוזלי, והגלעין הפנימי מוצק.',
    base: green(800, 500),
    duration: { min: 0, max: 0, step: 1, start: 0, fixed: true },
    seismo: { stations: 3 },
  },
  {
    id: 3,
    world: 1,
    key: 'which-way',
    title: 'לאן?',
    module: URL8 + 'plate-tectonics',
    tag: 'בינוני',
    kind: 'predict',
    intro: 'החום כבר בוער מתחת ללוחות, ובכל סיבוב במקום אחר. סירות החצצים עוגנות על קו המפגש. לאן ינוע כל לוח? שלושה סיבובים.',
    goal: 'בכל סיבוב: התחייבו לכיוון של כל לוח, ואז הריצו 4 מיליון שנה',
    hint: 'עקבו אחרי החיצים של זרמי הערבול: מהפלומה החומר זורם החוצה, ואל הטפטוף הקר הוא זורם פנימה.',
    hintShows: 'flow',
    success: 'שני הלוחות נגררו אל הטפטוף הקר והתנגשו: במקום המעגן קם רכס הרים. טוב שהזזתם את הסירות.',
    base: green(1000, 500, [
      { geom: { kind: 'circle', x: 500, z: 250, r: 60, soft: 30 }, set: -40, mat: MAT.seafloor },
      hill(120, 380, 70, 700),
      hill(880, 120, 80, 800),
    ], 5),
    ...L3,
    fixedHeat: L3_ROUNDS[0].fixedHeat,
    rounds: L3_ROUNDS,
    cellKm: 250,
    strength: 4,
    duration: { min: 4, max: 4, step: 1, start: 4, fixed: true },
    predict: [
      { key: 'W', he: 'הלוח המערבי', options: [{ id: 'west', he: '← מערבה' }, { id: 'east', he: 'מזרחה →' }], answer: 'east' },
      { key: 'E', he: 'הלוח המזרחי', options: [{ id: 'west', he: '← מערבה' }, { id: 'east', he: 'מזרחה →' }], answer: 'west' },
    ],
    villagers: [{ id: 'boat', x: 500, z: 250, says: 'להזיז את הסירות?' }],
  },
  {
    id: 4,
    world: 1,
    key: 'slow-but-sure',
    title: 'לאט אבל בטוח',
    module: URL8 + 'plate-tectonics',
    tag: 'בינוני',
    kind: 'heat',
    intro: 'הפלומה כבר בוערת והלוחות נעים 5 ס״מ בשנה. החצצים רוצים שני חופים במרחק 300 ק״מ, לעונת הדייג. יש ריצה אחת.',
    goal: 'קבעו כמה זמן להריץ: חופים במרחק 280–320 ק״מ',
    hint: 'מרחק = קצב × זמן. 1 ס״מ בשנה במשך מיליון שנה הם 10 ק״מ.',
    hintShows: 'none',
    success: '5 ס״מ בשנה × 6 מיליון שנה = 300 ק״מ. איטי, אבל במשך מיליוני שנים הלוחות מזיזים יבשות.',
    base: green(1200, 600, [hill(150, 140, 80, 900), hill(1060, 470, 90, 1000)], 9),
    ...L4,
    fixedHeat: [{ id: 'p', kind: 'plume', x: 600, z: 300, fixed: true }],
    fixedRate: 5,
    cellKm: 300,
    strength: 4,
    duration: { min: 1, max: 12, step: 0.5, start: 2 },
    villagers: [
      { id: 'w', x: 520, z: 300, wish: { kind: 'seaBetween', other: 'e', min: 280, max: 320 }, says: '300 ק״מ, לא פחות ולא יותר!' },
      { id: 'e', x: 680, z: 300, says: 'שהנמל יישאר בהישג יד!' },
    ],
  },
  {
    id: 5,
    world: 1,
    key: 'quiet-planet',
    title: 'העברה: הכוכב השקט',
    module: URL8 + 'earth-structure',
    tag: 'העברה',
    kind: 'heat',
    intro: 'כוכב חדש בלי גבולות לוחות. רק גשושי זרם-חום יגלו איפה המעטפת כבר עולה. החצצים צריכים ים בין שני הכפרים.',
    goal: 'מדדו את זרם החום, הניחו פלומה אחת, ופתחו בקע בין הכפרים',
    hint: 'במקום שהמעטפת חמה ביותר, החומר כבר עולה. פלומה שם תעיר את המנוע.',
    hintShows: 'heatflow',
    success: 'הפלומה הוצבה מעל הזרם העולה, והסדק הראשון נפתח בדיוק שם: גבול מתרחק.',
    base: {
      widthKm: 1000,
      depthKm: 500,
      elev: 260,
      crust: 'continental',
      mat: MAT.desert,
      roughness: 180,
      seed: 11,
      shapes: [hill(180, 120, 90, 700, MAT.rock), hill(860, 380, 90, 650, MAT.rock)],
    },
    plates: [{ id: 'P', he: 'הלוח', poly: rectPoly(-1, -1, 1001, 501), crust: 'continental' }],
    seams: [],
    seamAtPlume: { upwellingX: 650, toleranceKm: 60, rateCmYr: 4 },
    plumes: 1,
    drips: 0,
    probes: 4,
    duration: { min: 1, max: 6, step: 0.5, start: 2 },
    villagers: [
      { id: 'w', x: 560, z: 250, wish: { kind: 'seaBetween', other: 'e', min: 40, max: 240 }, says: 'ים בינינו!' },
      { id: 'e', x: 760, z: 250, says: 'נחכה בחוף!' },
    ],
  },

  // ───────────── World 2: Plates on the Move ─────────────
  {
    id: 6,
    world: 2,
    key: 'zebra',
    title: 'קרקעית זברה',
    module: URL8 + 'plate-tectonics',
    tag: 'קל',
    kind: 'dig',
    intro: 'אוקיינוס רחב עם פסי בזלת. האוצר העתיק של החצצים קבור בקרקעית העתיקה ביותר. דגמו גילים ושלחו את החפירה.',
    goal: 'מצאו את הקרקעית העתיקה ביותר ושלחו לשם את החפירה',
    hint: 'קרקעית חדשה נוצרת ברכס שבאמצע ומתרחקת ממנו. איפה הסלע הספיק לנסוע הכי רחוק?',
    hintShows: 'ages',
    success: 'הקרקעית צעירה ברכס ומזדקנת ככל שמתרחקים ממנו. הקצה הרחוק ביותר מהרכס הוא העתיק ביותר.',
    base: { widthKm: 1200, depthKm: 600, elev: -4600, crust: 'oceanic', mat: MAT.seafloor, shapes: [], roughness: 120, seed: 61 },
    ...L6,
    fixedHeat: [{ id: 'p', kind: 'plume', x: 450, z: 300, fixed: true }],
    fixedRate: 2.5,
    duration: { min: 60, max: 60, step: 1, start: 60, fixed: true },
    dig: { samples: 3, minAgeMyr: 52, ridgeX: 450, spreadMyr: 60, rateCmYr: 2.5 },
  },
  {
    id: 7,
    world: 2,
    key: 'collision',
    title: 'יבשת פוגשת יבשת',
    module: URL8 + 'plate-tectonics',
    tag: 'בינוני',
    kind: 'heat',
    intro: 'החצצים רוצים הר מושלג לחג השלג, בין שני הכפרים. ממזרח עומד רכס ישן, אבל הוא נשחק ונמוך. ולא גבוה מדי: מעל 5,000 מ׳ אין מספיק אוויר לגולשים.',
    goal: 'הר בגובה 3,500–5,000 מ׳ עם שלג בין הכפרים',
    hint: 'מה קורה ללוחות מעל פלומה חמה, ומה מעל טפטוף קר? ואם שתי יבשות נפגשות, האם אחת מהן צוללת?',
    hintShows: 'flow',
    success: 'הטפטוף הקר משך את שתי היבשות זו אל זו. אף לוח לא צלל, לכן נוצרו הרי קימוט בלי הרי געש, וההר עדיין מתרומם.',
    base: green(1000, 600, [
      { id: 'old', geom: { kind: 'line', pts: [v(800, 40), v(940, 260)], w: 120, soft: 60 }, add: 3300, profile: 'ridge', mat: MAT.rock, erodeTauMyr: 9 },
      hill(140, 470, 70, 700),
    ], 13),
    ...L7,
    anyHeat: 1,
    cellKm: 300,
    strength: 4,
    duration: { min: 2, max: 20, step: 1, start: 4 },
    villagers: [
      { id: 'w', x: 380, z: 330, wish: { kind: 'mountain', r: 140, minElev: 3500, maxElev: 5000 }, says: 'הר עם שלג, בבקשה!' },
      { id: 'e', x: 620, z: 330, wish: { kind: 'mountain', r: 140, minElev: 3500, maxElev: 5000 }, says: 'מגלשות, אבל שיהיה אוויר!' },
    ],
    visibleKm: 60,
  },
  {
    id: 8,
    world: 2,
    key: 'subduction',
    title: 'אוקיינוס צולל',
    module: URL8 + 'plate-tectonics',
    tag: 'בינוני',
    kind: 'heat',
    intro: 'ממערב קרקעית אוקיינוס כבדה, ממזרח יבשת. החקלאים רוצים אדמה געשית פורייה בשדות, אבל לא הר געש בתוך העיר.',
    goal: 'תעלה מול החוף, וקשת הרי געש מעל השדות ולא מעל העיר',
    hint: 'הלוח הכבד צולל לתוך המעטפת. הרי הגעש קמים מעל המקום שבו הלוח הצולל שוקע לעומק ונמס.',
    hintShows: 'flow',
    success: 'הלוח האוקייני צלל מתחת ליבשת: תעלה עמוקה מול החוף, וקשת הרי געש מעל השדות. האדמה הגעשית פורייה.',
    base: {
      widthKm: 1000,
      depthKm: 600,
      elev: 380,
      crust: 'continental',
      mat: MAT.grass,
      roughness: 140,
      seed: 17,
      shapes: [
        { geom: { kind: 'rect', x1: -60, z1: -60, x2: 450, z2: 660, soft: 30 }, set: -4200, mat: MAT.seafloor, crust: 'oceanic' },
        hill(880, 120, 70, 900),
      ],
    },
    ...L8,
    anyHeat: 1,
    cellKm: 300,
    strength: 4,
    duration: { min: 1, max: 8, step: 0.5, start: 2 },
    fields: { x: 580, z: 300, band: 50, town: v(760, 300), townSafeKm: 90 },
    villagers: [
      { id: 'farm', x: 580, z: 220, says: 'שדות לאדמה פורייה!' },
      { id: 'town', x: 760, z: 300, says: 'רק לא הר געש בעיר!' },
    ],
  },
  {
    id: 9,
    world: 2,
    key: 'transform',
    title: 'מחליקים זה לצד זה',
    module: URL8 + 'plate-tectonics',
    tag: 'מאתגר',
    kind: 'heat',
    intro: 'קו שבר חצה את הכפר. החצי הצפוני של הכביש והנחל זז מזרחה, והחצאים כבר לא נפגשים.',
    goal: 'החליקו את הלוחות כך שהכביש יתחבר מחדש',
    hint: 'כדי לחבר את הכביש, הלוח הצפוני צריך לנוע מערבה ביחס לדרומי. איפה פלומה דוחפת, ואיפה טפטוף מושך?',
    hintShows: 'flow',
    success: 'בגבול מחליק הלוחות נעים זה לצד זה: לא נוצר הר ולא ים, אבל נהרות וכבישים נקרעים והאדמה רועדת.',
    base: green(800, 600, [
      { id: 'roadN', geom: { kind: 'line', pts: [v(520, -40), v(520, 300)], w: 10, soft: 4 }, mat: MAT.road, paintOnly: true },
      { id: 'roadS', geom: { kind: 'line', pts: [v(400, 300), v(400, 640)], w: 10, soft: 4 }, mat: MAT.road, paintOnly: true },
      { id: 'riverN', geom: { kind: 'line', pts: [v(240, -40), v(260, 150), v(250, 300)], w: 14, soft: 8 }, carve: 120, mat: MAT.river },
      { id: 'riverS', geom: { kind: 'line', pts: [v(130, 300), v(120, 450), v(150, 640)], w: 14, soft: 8 }, carve: 120, mat: MAT.river },
      { geom: { kind: 'line', pts: [v(-40, 300), v(840, 300)], w: 6, soft: 3 }, mat: MAT.fault, paintOnly: true },
      hill(680, 120, 70, 900),
      hill(700, 480, 60, 700),
    ], 21),
    ...L9,
    plumes: 1,
    drips: 1,
    cellKm: 280,
    strength: 6,
    duration: { min: 0.5, max: 8, step: 0.25, start: 1 },
    road: { northX: 520, southX: 400, faultZ: 300, tolKm: 15 },
    villagers: [
      { id: 'n', x: 560, z: 230, says: 'החצי השני של הכפר בדרום!' },
      { id: 's', x: 440, z: 370, says: 'הכביש נקטע!' },
    ],
    visibleKm: 30,
  },
  {
    id: 10,
    world: 2,
    key: 'wegener',
    title: 'העברה: הפאזל של וגנר',
    module: URL8 + 'plate-tectonics',
    tag: 'העברה',
    kind: 'wegener',
    intro: 'וגנר טוען שהיבשות היו פעם מחוברות. המבקרים יקבלו רק התאמה עם ראיות: קווי חוף, מאובנים ורצועות סלע.',
    goal: 'הרכיבו את היבשות לפי הראיות, ואז הניחו חום שיריץ אותן עד היום',
    hint: 'לא מספיק שהחוף מתאים. השוו את סמלי המאובנים ואת צבעי רצועות הסלע משני צדי החיבור.',
    hintShows: 'fossils',
    success: 'החוף, המאובנים ורצועות הסלע מתאימים, וזרמי הערבול מתחת הם הכוח שוגנר לא הכיר.',
    base: { widthKm: 6000, depthKm: 3500, elev: -4200, crust: 'oceanic', mat: MAT.seafloor, shapes: [], roughness: 200, seed: 23 },
    relief: 0.5,
    plumes: 1,
    drips: 0,
    heatSnapKm: 250,
    cellKm: 1500,
    strength: 2.6,
    duration: { min: 120, max: 120, step: 10, start: 120, fixed: true },
    wegener: {
      snapKm: 220,
      snapDeg: 16,
      minDriftKm: 2200,
      pieces: [
        x5({
          id: 'sa',
          he: 'יבשת המערב',
          color: '#7fae5a',
          outline: [v(-150, -230), v(40, -260), v(110, -150), v(150, -60), v(120, 30), v(80, 120), v(30, 230), v(-60, 270), v(-140, 120), v(-170, -60)],
          start: { x: 230, z: 340, rot: 0.6 },
          target: { x: 470, z: 350, rot: 0 },
          fossils: ['mesosaurus', 'glossopteris'],
          rockBelt: 'red',
        }),
        x5({
          id: 'af',
          he: 'יבשת המזרח',
          color: '#c9a35b',
          outline: [v(-110, -250), v(120, -270), v(190, -100), v(170, 120), v(90, 260), v(-40, 280), v(-80, 150), v(-110, 30), v(-150, -60)],
          start: { x: 880, z: 330, rot: -0.55 },
          target: { x: 730, z: 350, rot: 0 },
          fossils: ['mesosaurus', 'glossopteris'],
          rockBelt: 'red',
        }),
        x5({
          id: 'decoy',
          he: 'יבשת הדרום',
          color: '#9a8fb5',
          outline: [v(-60, -120), v(40, -140), v(70, -60), v(50, 40), v(10, 120), v(-60, 130), v(-90, 30)],
          start: { x: 600, z: 590, rot: 0.52 },
          target: null,
          fossils: ['trilobite'],
          rockBelt: 'blue',
        }),
      ],
    },
  },

  // ───────────── World 3: Shake and Burn ─────────────
  {
    id: 11,
    world: 3,
    key: 'ring-of-fire',
    title: 'טבעת האש',
    module: URL8 + 'earthquakes-volcanoes',
    tag: 'בינוני',
    kind: 'heat',
    intro: 'אוקיינוס מוקף כפרים. פלומה טבעית דוחפת אותו החוצה. סגרו את האוקיינוס בטפטופים קרים, כך שבכל חוף תיווצר תעלה.',
    goal: 'כל שלושת הגבולות סביב האוקיינוס מתנגשים, והרי הגעש רחוקים מהכפרים',
    hint: 'כל גבול צריך משהו שימשוך את שני הלוחות שלו זה אל זה. טפטוף אחד באמצע נלחם בפלומה הטבעית.',
    hintShows: 'flow',
    success: 'האוקיינוס צולל בכל החופים: תעלות, הרי געש ורעידות מסביב, בדיוק כמו טבעת האש סביב האוקיינוס השקט.',
    base: RING_BASE(29),
    relief: 0.8,
    plates: RING_PLATES,
    seams: RING_SEAMS,
    fixedHeat: [{ id: 'nat', kind: 'plume', x: 400, z: 400, fixed: true }],
    drips: 3,
    plumes: 0,
    cellKm: 260,
    strength: 4,
    duration: { min: 5, max: 5, step: 1, start: 5, fixed: true },
    ring: {
      minArcKm: 45,
      villages: [
        { id: 'vn', he: 'כפר הצפון', x: 300, z: 40 },
        { id: 've', he: 'כפר המזרח', x: 1150, z: 260 },
        { id: 'vs', he: 'כפר הדרום', x: 760, z: 760 },
      ],
    },
  },
  {
    id: 12,
    world: 3,
    key: 'where-to-build',
    title: 'איפה לבנות?',
    module: URL8 + 'earthquakes-volcanoes',
    tag: 'קל',
    kind: 'site',
    intro: 'מפת הלוחות שבניתם. כפר צומח מבקש מקום לעיר נמל חדשה. בחרו מקום אחד, ונריץ 1,000 שנים של רעידות.',
    goal: 'עיר נמל על החוף, רחוק מכל גבול לוחות פעיל',
    hint: 'רעידות והרי געש מתרכזים בעיקר לאורך גבולות לוחות. האם יש חוף שאין לידו גבול?',
    hintShows: 'faults',
    success: 'החוף המערבי הוא חלק מאותו לוח כמו האוקיינוס, בלי גבול: שקט. לאורך הגבולות רעד כל הזמן.',
    base: RING_BASE(31),
    relief: 0.8,
    plates: RING_PLATES,
    seams: RING_SEAMS,
    fixedHeat: RING_SOLVED,
    cellKm: 260,
    strength: 4,
    duration: { min: 5, max: 5, step: 1, start: 5, fixed: true },
    site: { kind: 'quakes', safeKm: 200, sites: [] },
  },
  {
    id: 13,
    world: 3,
    key: 'bigger-not-deadlier',
    title: 'חזקה יותר, לא קטלנית יותר',
    module: URL8 + 'earthquakes-volcanoes',
    tag: 'בינוני',
    kind: 'copy',
    intro: 'שתי ערים. עיר הנמל בנויה בבנייה עמידה ותספוג רעידה של 9.0 בים. עיר העמק בנויה בבנייה ישנה ותספוג 7.0 קרוב. מי צריכה ללמוד ממי?',
    goal: 'בחרו מי מעתיק את שיטת הבנייה של מי, וצפו במפת הנזק',
    hint: 'סולם ריכטר מודד אנרגיה. סולם מרקלי מודד נזק, והנזק תלוי גם בבנייה.',
    hintShows: 'none',
    success: 'הרעידה החזקה פי 1,000 באנרגיה גרמה לפחות נזק, כי העיר נבנתה עמידה. הבנייה, לא רק העוצמה, קובעת את הנזק.',
    base: {
      widthKm: 700,
      depthKm: 450,
      elev: 300,
      crust: 'continental',
      mat: MAT.grass,
      roughness: 150,
      seed: 37,
      shapes: [
        { geom: { kind: 'rect', x1: -60, z1: -60, x2: 160, z2: 520, soft: 60 }, set: -3800, mat: MAT.seafloor, crust: 'oceanic' },
        hill(560, 120, 70, 800),
        { geom: { kind: 'line', pts: [v(480, -40), v(530, 500)], w: 8, soft: 4 }, mat: MAT.fault, paintOnly: true },
      ],
    },
    duration: { min: 0, max: 0, step: 1, start: 0, fixed: true },
    copy: {
      houses: 6,
      minStanding: 4,
      towns: [
        { id: 'port', he: 'עיר הנמל', x: 250, z: 170, code413: true, quake: { magnitude: 9.0, x: 40, z: 160, depthKm: 30 } },
        { id: 'valley', he: 'עיר העמק', x: 520, z: 310, code413: false, quake: { magnitude: 7.0, x: 505, z: 300, depthKm: 10 } },
      ],
    },
    predict: [
      {
        key: 'energy',
        he: 'פי כמה יותר אנרגיה ברעידה של 9.0 מאשר ב־7.0?',
        options: [{ id: '2', he: 'פי 2' }, { id: '100', he: 'פי 100' }, { id: '1000', he: 'פי 1,000 בערך' }],
        answer: '1000',
      },
    ],
  },
  {
    id: 14,
    world: 3,
    key: 'tsunami',
    title: 'צונאמי',
    module: URL8 + 'earthquakes-volcanoes',
    tag: 'מאתגר',
    kind: 'site',
    intro: 'תעלה צוללת מול החוף. החצצים בונים נמל דייגים חדש. בחרו מפרץ, ובחרו לאן בורחים כשהגל מגיע. הגל יחסוך רק בחירה נכונה.',
    goal: 'בחרו מפרץ לנמל וגבעה למילוט: גבוהה מהגל וקרובה מספיק',
    hint: 'אחרי רעידה בתעלה יש עד הגל בערך 20 דקות. הגל יעלה 12 מ׳. בהליכה עוברים בערך 1.2 ק״מ ב־18 דקות.',
    hintShows: 'coast',
    success: 'הנמל נבנה ליד צוק גבוה. כשהים נסוג פתאום מהחוף, בורחים מיד לגובה, והגל לא מגיע.',
    base: {
      widthKm: 14,
      depthKm: 9,
      elev: 6,
      crust: 'continental',
      mat: MAT.grass,
      roughness: 2,
      seed: 41,
      shapes: [
        { geom: { kind: 'rect', x1: -2, z1: -2, x2: 3.2, z2: 11, soft: 1.2 }, set: -40, mat: MAT.seafloor, crust: 'oceanic' },
        { geom: { kind: 'circle', x: 3.4, z: 1.6, r: 0.8, soft: 0.5 }, set: -6, mat: MAT.seafloor },
        { geom: { kind: 'circle', x: 3.4, z: 4.6, r: 0.8, soft: 0.5 }, set: -6, mat: MAT.seafloor },
        { geom: { kind: 'circle', x: 3.4, z: 7.6, r: 0.8, soft: 0.5 }, set: -6, mat: MAT.seafloor },
        { geom: { kind: 'rect', x1: 3.0, z1: -2, x2: 4.2, z2: 11, soft: 0.6 }, set: 2, mat: MAT.sand },
        { geom: { kind: 'circle', x: 4.75, z: 1.25, r: 0.45, soft: 0.5 }, add: 36, profile: 'cone', mat: MAT.rock },
        { geom: { kind: 'circle', x: 4.9, z: 4.4, r: 0.35, soft: 0.3 }, add: 3, profile: 'cone', mat: MAT.dunes },
        { geom: { kind: 'circle', x: 6.1, z: 5.2, r: 0.5, soft: 0.5 }, add: 30, profile: 'cone', mat: MAT.rock },
        { geom: { kind: 'circle', x: 5.9, z: 8.4, r: 0.5, soft: 0.5 }, add: 32, profile: 'cone', mat: MAT.rock },
        { geom: { kind: 'circle', x: 10.5, z: 4.5, r: 2.4, soft: 2 }, add: 55, profile: 'cone', mat: MAT.rock },
      ],
    },
    relief: 1,
    duration: { min: 0, max: 0, step: 1, start: 0, fixed: true },
    site: {
      kind: 'tsunami',
      sites: [
        { id: 'north', he: 'מפרץ הצוק', x: 4.35, z: 1.6 },
        { id: 'mid', he: 'מפרץ הדיונה', x: 4.35, z: 4.6 },
        { id: 'south', he: 'מפרץ הדקלים', x: 4.35, z: 7.6 },
      ],
      hills: [
        { id: 'cliff', he: 'הצוק', x: 4.75, z: 1.25, elev: 42 },
        { id: 'dune', he: 'הדיונה', x: 4.9, z: 4.4, elev: 9 },
        { id: 'knoll', he: 'הגבעה', x: 6.1, z: 5.2, elev: 36 },
        { id: 'palms', he: 'גבעת הדקלים', x: 5.9, z: 8.4, elev: 38 },
        { id: 'ridge', he: 'הרכס הרחוק', x: 10.5, z: 4.5, elev: 61 },
      ],
      tsunami: { arrivalMin: 20, runupM: 12, sirenDelayMin: 2, walkKmPerMin: 0.083, pathFactor: 1.25 },
    },
  },
  {
    id: 15,
    world: 3,
    key: 'jordan-1927',
    title: 'העברה: עמק הירדן 1927',
    module: URL8 + 'earthquakes-volcanoes',
    tag: 'העברה',
    kind: 'site',
    intro: 'ב־1927 רעידה בבקע פגעה קשות בטבריה, ביריחו ובשכם. היום בונים בערים האלה שכונות חדשות לפי תקן 413. אי אפשר לדעת מתי ואיפה בבקע תהיה הרעידה הבאה.',
    goal: 'בחרו לכל עיר מקום לשכונה החדשה, כך שתעמוד בכל רעידה אפשרית בבקע',
    hint: 'אפשר לדעת לאורך איזה קו יהיו הרעידות, לא מתי. בנייה עמידה עוזרת, אבל לא על קו השבר עצמו.',
    hintShows: 'faults',
    success: 'רעידות אי אפשר לחזות, אבל אפשר להתכונן: בונים בתקן 413, רחוק מקו השבר, על קרקע יציבה.',
    base: {
      widthKm: 160,
      depthKm: 220,
      elev: 500,
      crust: 'continental',
      mat: MAT.limestone,
      roughness: 60,
      seed: 43,
      shapes: [
        { geom: { kind: 'rect', x1: -20, z1: -20, x2: 20, z2: 240, soft: 14 }, set: -300, mat: MAT.seafloor, crust: 'oceanic' },
        { geom: { kind: 'rect', x1: 15, z1: -20, x2: 45, z2: 240, soft: 20 }, set: 60, mat: MAT.sand },
        { geom: { kind: 'line', pts: [v(85, -20), v(80, 240)], w: 34, soft: 20 }, add: 450, profile: 'ridge', mat: MAT.limestone },
        { geom: { kind: 'line', pts: [v(118, -20), v(118, 240)], w: 18, soft: 12 }, set: -300, mat: MAT.desert },
        { geom: { kind: 'circle', x: 118, z: 30, r: 9, soft: 6 }, set: -260, mat: MAT.desert },
        { geom: { kind: 'circle', x: 118, z: 200, r: 14, soft: 8 }, set: -760, mat: MAT.desert },
        { geom: { kind: 'rect', x1: 128, z1: -20, x2: 180, z2: 240, soft: 20 }, set: 700, mat: MAT.desert },
        { geom: { kind: 'line', pts: [v(118, -20), v(118, 240)], w: 3, soft: 2 }, mat: MAT.fault, paintOnly: true },
      ],
    },
    relief: 1.6,
    duration: { min: 0, max: 0, step: 1, start: 0, fixed: true },
    site: {
      kind: 'rebuild',
      houseStrength: 0.044,
      towns: [
        { id: 'tiberias', he: 'טבריה', sites: ['t-fault', 't-shore', 't-hill'] },
        { id: 'jericho', he: 'יריחו', sites: ['j-fault', 'j-fan'] },
        { id: 'shechem', he: 'שכם', sites: ['y-ridge', 'y-slope'] },
      ],
      sites: [
        { id: 't-fault', he: 'על קו השבר', x: 118, z: 36, ground: 3 },
        { id: 't-shore', he: 'חוף האגם', x: 112, z: 30, ground: 2 },
        { id: 't-hill', he: 'הגבעה ממערב', x: 104, z: 42, ground: 1 },
        { id: 'j-fault', he: 'על קו השבר', x: 117, z: 170, ground: 3 },
        { id: 'j-fan', he: 'מניפת הסחף', x: 108, z: 166, ground: 1 },
        { id: 'y-ridge', he: 'רכס ההר', x: 84, z: 150, ground: 1 },
        { id: 'y-slope', he: 'המדרון התלול', x: 104, z: 152, ground: 2.4 },
      ],
      quakes: [
        { magnitude: 6.6, x: 118, z: 40, depthKm: 10 },
        { magnitude: 6.6, x: 118, z: 110, depthKm: 10 },
        { magnitude: 6.6, x: 118, z: 170, depthKm: 10 },
      ],
    },
  },

  // ───────────── World 4: Rocks and the Land of Israel ─────────────
  {
    id: 16,
    world: 4,
    key: 'rock-orders',
    title: 'הזמנות סלעים',
    module: URL8 + 'rocks-minerals',
    tag: 'מאתגר',
    kind: 'rocks',
    intro: 'החצצים הזמינו: בזלת לאבני ריחיים, גרניט למגדל, גיר לבתים ושיש לפסל. גרמו לכוכב לייצר אותם, ואספו בפטיש.',
    goal: 'הניחו חום, הריצו את הזמן, ואספו בפטיש בזלת, גרניט, גיר עם מאובנים ושיש',
    hint: 'בזלת: לבה שמתקררת מהר בבקע. גרניט: מגמה שמתקררת לאט עמוק מתחת להרים, ונחשפת אחרי זמן רב. שיש: גיר שנמעך בהתנגשות.',
    hintShows: 'rocks',
    success: 'כל סלע נוצר בתהליך אחר, וכולם קשורים במחזור אחד: סלעי יסוד, משקע ותמורה הופכים זה לזה לאורך מיליוני שנים.',
    base: green(900, 500, [
      { id: 'shelf', geom: { kind: 'rect', x1: 40, z1: -40, x2: 300, z2: 540, soft: 30 }, set: -60, mat: MAT.limestone },
      hill(760, 130, 70, 800),
    ], 47),
    plates: L16p,
    seams: L16s,
    plumes: 1,
    drips: 1,
    cellKm: 220,
    strength: 1.2,
    duration: { min: 2, max: 20, step: 1, start: 4 },
    rocks: { targets: ['basalt', 'granite', 'limestone', 'marble'], shelf: { x1: 40, x2: 300 }, samples: 10 },
  },
  {
    id: 17,
    world: 4,
    key: 'fossils-700',
    title: 'מאובנים בגובה 700',
    module: URL8 + 'rocks-minerals',
    tag: 'מאתגר',
    kind: 'fossil',
    intro: 'החצצים מצאו צדפים על הר, יותר מ־700 מ׳ מעל הים, ובטוחים שהים היה עמוק 700 מ׳. לפני 100 מיליון שנה היה כאן ים רדוד.',
    goal: 'הביאו את שכבות הצדפים לגובה 700 מ׳ לפחות, והראו בחתך מה קרה',
    hint: 'קודם הים צריך זמן להשקיע שכבות של צדפים. מה ירים אותן אחר כך?',
    hintShows: 'fossils',
    success: 'הים היה רדוד. שכבות הגיר עם הצדפים הורמו בתנועת הלוחות: היבשה עלתה, לא הים.',
    base: {
      widthKm: 120,
      depthKm: 80,
      elev: -60,
      crust: 'continental',
      mat: MAT.seafloor,
      roughness: 20,
      seed: 53,
      shapes: [
        { geom: { kind: 'rect', x1: -20, z1: -20, x2: 22, z2: 100, soft: 10 }, set: -200, mat: MAT.seafloor, crust: 'oceanic' },
        { geom: { kind: 'rect', x1: 98, z1: -20, x2: 140, z2: 100, soft: 10 }, set: 120, mat: MAT.desert },
      ],
    },
    relief: 3,
    anyHeat: 1,
    heatSnapKm: 10,
    duration: { min: 10, max: 50, step: 10, start: 10 },
    chainMaxMyr: 100,
    fossil: { targetM: 700, layerMyr: 10, layers: 3, upliftMPerMyr: 26 },
  },
  {
    id: 18,
    world: 4,
    key: 'land-of-israel',
    title: 'גמר: בונים את ארץ ישראל',
    module: URL9 + 'landform-belts',
    tag: 'גמר',
    kind: 'israel',
    intro: 'לוח בין הים התיכון למדבר: הלוח האפריקני במערב, הלוח הערבי במזרח. בנו את הנוף בחום ובזמן, ואז בחרו מקומות לערים לפני רעידת הבקע.',
    goal: 'צרו בקע, רכס גיר, מישור חוף ובזלת בצפון־מזרח, ואז בחרו מקומות בטוחים לערים',
    hint: '',
    success: 'מישור חוף של חול וכורכר, רכס גיר עם קו פרשת המים, בקע שוקע עם הנקודה הנמוכה ביותר ביבשה, ובזלת הגולן. זו ארץ ישראל.',
    base: {
      widthKm: 200,
      depthKm: 260,
      elev: 60,
      crust: 'continental',
      mat: MAT.limestone,
      roughness: 25,
      seed: 59,
      shapes: [
        { geom: { kind: 'rect', x1: -40, z1: -40, x2: 25, z2: 300, soft: 12 }, set: -500, mat: MAT.seafloor, crust: 'oceanic' },
        { geom: { kind: 'rect', x1: 172, z1: -40, x2: 240, z2: 300, soft: 26 }, set: 650, mat: MAT.desert },
      ],
    },
    relief: 2,
    plates: [
      { id: 'AF', he: 'הלוח האפריקני', poly: rectPoly(-1, -1, 150, 261), crust: 'continental' },
      { id: 'AR', he: 'הלוח הערבי', poly: rectPoly(150, -1, 201, 261), crust: 'continental' },
    ],
    seams: [{ id: 'rift', p0: v(150, 0), p1: v(150, 260), plates: ['AF', 'AR'], rift: ISRAEL_RIFT }],
    // Arabia already drifts north past Africa: the Red Sea opening behind it (off the map, south)
    baseMotion: { rift: { normal: 0, tangential: 1.1 } },
    plumes: 2,
    drips: 2,
    heatSnapKm: 10,
    cellKm: 90,
    strength: 1.2,
    duration: { min: 2, max: 14, step: 1, start: 4 },
    noHints: true,
    israel: {
      ridgeBand: [60, 115],
      coastBand: [25, 60],
      golan: { xMin: 150, zMax: 100 },
      quake: { magnitude: 6.4, depthKm: 12 },
      towns: [
        { id: 'coast', he: 'עיר החוף', sites: ['c-plain', 'c-cliff'] },
        { id: 'ridge', he: 'עיר ההר', sites: ['r-crest', 'r-scarp'] },
        { id: 'valley', he: 'עיר הבקע', sites: ['v-fault', 'v-terrace'] },
      ],
      sites: [
        { id: 'c-plain', he: 'מישור החוף', x: 42, z: 120, ground: 1.2 },
        { id: 'c-cliff', he: 'מצוק הכורכר', x: 30, z: 170, ground: 1.2 },
        { id: 'r-crest', he: 'פסגת הרכס', x: 88, z: 140, ground: 1 },
        { id: 'r-scarp', he: 'שפת המצוק', x: 132, z: 140, ground: 2.2 },
        { id: 'v-fault', he: 'על קו השבר', x: 150, z: 60, ground: 3 },
        { id: 'v-terrace', he: 'מדרגת הסלע', x: 138, z: 50, ground: 1.2 },
      ],
    },
  },
];

export const WORLDS = [
  { id: 1, he: 'בבטן כדור הארץ', en: 'Inside the Earth' },
  { id: 2, he: 'לוחות בתנועה', en: 'Plates on the Move' },
  { id: 3, he: 'רועד ובוער', en: 'Shake and Burn' },
  { id: 4, he: 'סלעים וארץ ישראל', en: 'Rocks and the Land of Israel' },
] as const;

/** Levels made after the authored 18 (planet commissions) register here. */
const EXTRA = new Map<number, LevelDef>();
export function registerLevel(d: LevelDef) {
  EXTRA.set(d.id, d);
}

export function levelById(id: number): LevelDef {
  const l = LEVELS.find((x) => x.id === id) ?? EXTRA.get(id);
  if (!l) throw new Error(`no level ${id}`);
  return l;
}

export const LAYER_IDS: LayerId[] = ['crust', 'upperMantle', 'lowerMantle', 'outerCore', 'innerCore'];
