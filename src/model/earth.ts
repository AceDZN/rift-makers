// Earth's layers (Workbook's table, earth-structure module), the two kinds of
// seismic waves, and the mantle's convection currents (זרמי ערבול).

export type LayerId = 'crust' | 'upperMantle' | 'lowerMantle' | 'outerCore' | 'innerCore';

export interface Layer {
  id: LayerId;
  he: string;
  /** Depth range in km. */
  top: number;
  bottom: number;
  tempHe: string;
  state: 'solid' | 'liquid';
  noteHe: string;
}

export const EARTH_RADIUS_KM = 6370;

export const LAYERS: Layer[] = [
  { id: 'crust', he: 'קרום', top: 0, bottom: 35, tempHe: 'עד 300°', state: 'solid', noteHe: 'דק וקשה. יבשתי 30–70 ק״מ, אוקייני 5–10 ק״מ, בעיקר בזלת' },
  { id: 'upperMantle', he: 'מעטפת עליונה', top: 35, bottom: 700, tempHe: '1,000–1,500°', state: 'solid', noteHe: 'כאן נעים הלוחות ונמצאים אזורי המגמה' },
  { id: 'lowerMantle', he: 'מעטפת תחתונה', top: 700, bottom: 2900, tempHe: 'עד 3,000°', state: 'solid', noteHe: 'לחץ אדיר: מוצקה למרות החום' },
  { id: 'outerCore', he: 'גלעין חיצוני', top: 2900, bottom: 5100, tempHe: '3,000–5,000°', state: 'liquid', noteHe: 'נוזלי, ברזל וניקל, קשור לשדה המגנטי' },
  { id: 'innerCore', he: 'גלעין פנימי', top: 5100, bottom: EARTH_RADIUS_KM, tempHe: '5,000–6,000°', state: 'solid', noteHe: 'מוצק בגלל לחץ אדיר, אף שהוא החם ביותר' },
];

export function layerAtDepth(depthKm: number): Layer {
  for (const l of LAYERS) if (depthKm < l.bottom) return l;
  return LAYERS[LAYERS.length - 1];
}

/**
 * Two kinds of shock waves (גלי הדף). The modules don't name them, so neither
 * do we: one kind passes through everything, the other stops at liquid.
 * A wave from a quake at angle 0 to a station at `angleDeg` around the planet
 * is modelled as a straight chord; it crosses the liquid outer core when the
 * chord dips below the core's radius.
 */
export function chordMinRadius(angleDeg: number): number {
  const a = (Math.min(Math.abs(angleDeg), 360 - Math.abs(angleDeg)) * Math.PI) / 180;
  return EARTH_RADIUS_KM * Math.cos(a / 2);
}

export const CORE_RADIUS_KM = EARTH_RADIUS_KM - 2900;

export interface StationReading {
  angleDeg: number;
  /** The kind that passes everything always arrives. */
  allArrives: true;
  /** The kind that can't cross liquid arrives only if its path misses the outer core. */
  solidOnlyArrives: boolean;
  /** Deepest point the path reaches, km below the surface. */
  deepestKm: number;
}

export function readStation(angleDeg: number): StationReading {
  const r = chordMinRadius(angleDeg);
  return { angleDeg, allArrives: true, solidOnlyArrives: r > CORE_RADIUS_KM, deepestKm: EARTH_RADIUS_KM - r };
}

/** Beyond this angle the solid-only wave never arrives (its shadow). */
export const SHADOW_START_DEG = (2 * Math.acos(CORE_RADIUS_KM / EARTH_RADIUS_KM) * 180) / Math.PI;

/**
 * Mantle temperature (°C) 300 km down under position x when a hot upwelling
 * (plume) rises at plumeX. Teaching model.
 */
export function mantleTempAt(x: number, plumeX: number, widthKm = 110): number {
  return Math.round(1300 + 420 * Math.exp(-(((x - plumeX) / widthKm) ** 2)));
}

/**
 * Surface flow above a convection upwelling at heatX: material spreads away
 * from it, so a plate west of the heat moves west and one east of it moves east.
 */
export function surfaceFlowDir(x: number, heatX: number): 'W' | 'E' {
  return x < heatX ? 'W' : 'E';
}
