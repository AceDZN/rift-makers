// Planet commissions: new heat puzzles after the authored levels. They are
// generated offline by scripts/gen-commissions.ts, which keeps a layout only
// when a brute-force solver finds a win and random play rarely wins. The
// bundled parameters (src/data/commissions.json) rebuild each level here.

import type { LevelDef } from './levels.ts';
import { green, hill, registerLevel, splitNS } from './levels.ts';
import { MAT } from './terrain.ts';
import { v } from './geo.ts';
import data from '../data/commissions.json';

export type CommissionKind = 'sea' | 'mountain' | 'arc';

export interface CommissionParams {
  n: number;
  kind: CommissionKind;
  seed: number;
  W: number;
  D: number;
  seamX: number;
  /** sea: villagers each side of the seam; mountain: same; arc: fields and town east of the seam. */
  a: { x: number; z: number };
  b: { x: number; z: number };
  min?: number;
  max?: number;
  minElev?: number;
  dur: { min: number; max: number; step: number };
  solution?: { kind: 'plume' | 'drip'; x: number; z: number; dur: number };
  winShare?: number;
}

export const COMMISSION_BASE_ID = 100;
const URL8 = 'https://geography.workbook.co.il/grade-8/chapter-4/plate-tectonics';

const TITLES: Record<CommissionKind, string> = {
  sea: 'הזמנה: ים במידה',
  mountain: 'הזמנה: הר מושלג',
  arc: 'הזמנה: אדמה געשית',
};

export function commissionDef(p: CommissionParams): LevelDef {
  const id = COMMISSION_BASE_ID + p.n;
  const common = {
    id,
    world: 4 as const,
    key: `commission-${p.n}`,
    title: `${TITLES[p.kind]} ${p.n}`,
    module: URL8,
    tag: 'הזמנה' as const,
    kind: 'heat' as const,
    hintShows: 'flow' as const,
    anyHeat: 1,
    cellKm: 300,
    strength: 4,
    duration: { ...p.dur, start: p.dur.min },
  };
  if (p.kind === 'sea') {
    return {
      ...common,
      intro: `שני כפרים רוצים ים ביניהם, ברוחב ${p.min} עד ${p.max} ק״מ. לא צר יותר ולא רחב יותר: בחרו חום, מקום וזמן.`,
      goal: `ים ברוחב ${p.min}–${p.max} ק״מ בין הכפרים`,
      hint: 'רוחב הים = מהירות × זמן. איזה חום מושך לוחות זה מזה, וכמה זמן צריך?',
      success: 'הלוחות נמשכו זה מזה בדיוק כמה שצריך: מהירות כפול זמן נתנה את רוחב הים.',
      base: green(p.W, p.D, [hill(p.W * 0.15, p.D * 0.2, 60, 700)], p.seed),
      ...splitNS(p.W, p.D, p.seamX),
      villagers: [
        { id: 'a', x: p.a.x, z: p.a.z, wish: { kind: 'seaBetween', other: 'b', min: p.min!, max: p.max! }, says: 'ים, אבל לא אוקיינוס!' },
        { id: 'b', x: p.b.x, z: p.b.z, says: 'נשוט אליכם!' },
      ],
    };
  }
  if (p.kind === 'mountain') {
    return {
      ...common,
      intro: `החצצים רוצים הר גבוה מ־${p.minElev!.toLocaleString('en-US')} מ׳ בין הכפרים. שתי יבשות, חום אחד.`,
      goal: `הר גבוה מ־${p.minElev!.toLocaleString('en-US')} מ׳ בין הכפרים`,
      hint: 'כשיבשת פוגשת יבשת, אף אחת לא צוללת. מה מושך שתי יבשות זו אל זו?',
      success: 'שתי היבשות נדחקו זו אל זו והקרום התקמט להר.',
      base: green(p.W, p.D, [hill(p.W * 0.85, p.D * 0.8, 60, 700)], p.seed),
      ...splitNS(p.W, p.D, p.seamX),
      villagers: [
        { id: 'w', x: p.a.x, z: p.a.z, wish: { kind: 'mountain', r: 140, minElev: p.minElev! }, says: 'הר, בבקשה!' },
        { id: 'e', x: p.b.x, z: p.b.z, wish: { kind: 'mountain', r: 140, minElev: p.minElev! }, says: 'עם שלג!' },
      ],
    };
  }
  return {
    ...common,
    intro: 'ממערב אוקיינוס, ממזרח יבשת. החקלאים רוצים הרי געש מעל השדות, אבל לא בתוך העיר.',
    goal: 'קשת הרי געש מעל השדות ולא מעל העיר',
    hint: 'הלוח הכבד צולל. הרי הגעש קמים במרחק מה מהתעלה, מעל המקום שבו הוא נמס.',
    success: 'הלוח האוקייני צלל, והקשת קמה מעל השדות. העיר שקטה.',
    base: {
      widthKm: p.W,
      depthKm: p.D,
      elev: 380,
      crust: 'continental',
      mat: MAT.grass,
      roughness: 140,
      seed: p.seed,
      shapes: [{ geom: { kind: 'rect', x1: -60, z1: -60, x2: p.seamX, z2: p.D + 60, soft: 30 }, set: -4200, mat: MAT.seafloor, crust: 'oceanic' }],
    },
    ...splitNS(p.W, p.D, p.seamX, 'oceanic', 'continental', ['לוח האוקיינוס', 'לוח היבשת']),
    fields: { x: p.a.x, z: p.a.z, band: 50, town: v(p.b.x, p.b.z), townSafeKm: 90 },
    villagers: [
      { id: 'farm', x: p.a.x, z: p.a.z - 80, says: 'שדות פוריים!' },
      { id: 'town', x: p.b.x, z: p.b.z, says: 'לא הר געש בעיר!' },
    ],
  };
}

export const COMMISSIONS: CommissionParams[] = data as CommissionParams[];
export const COMMISSION_LEVELS: LevelDef[] = COMMISSIONS.map(commissionDef);
for (const d of COMMISSION_LEVELS) registerLevel(d);
