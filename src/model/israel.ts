// Real relief for the final level, from the bundled ETOPO1 subset
// (src/data/israel-relief.json; NOAA, public domain; see ASSETS.md).
// The game stylizes the look, never the geography: the rift floor of
// level 18 is read from this grid, and tests compare the built slab with it.

import relief from '../data/israel-relief.json';

/** The level-18 slab spans the rift from the Hula (north edge) to the Arava divide (south edge). */
export const SLAB_NORTH = 33.1;
export const SLAB_SOUTH = 30.3;

/** Lakes are water surfaces in ETOPO1; the rift floor needs their beds (published bathymetry). */
const LAKES = [
  { he: 'ים המלח', surface: -415, maxDepth: 310 },
  { he: 'הכנרת', surface: -216, maxDepth: 43 },
];

export function elevAt(lat: number, lon: number): number {
  const i = Math.round((relief.north - lat) / relief.stepDeg);
  const j = Math.round((lon - relief.west) / relief.stepDeg);
  const ii = Math.min(relief.nLat - 1, Math.max(0, i));
  const jj = Math.min(relief.nLon - 1, Math.max(0, j));
  return relief.elev[ii * relief.nLon + jj];
}

/** Lowest point of the rift valley (35.2–35.8°E) at a latitude. */
export function riftMin(lat: number): number {
  let m = Infinity;
  for (let lon = 35.2; lon <= 35.8; lon += relief.stepDeg) m = Math.min(m, elevAt(lat, lon));
  return m;
}

/** Fraction along the slab (0 north edge, 1 south edge) to latitude. */
export const latOf = (f: number) => SLAB_NORTH - f * (SLAB_NORTH - SLAB_SOUTH);

/** Rift floor profile [fraction, metres] sampled from the data, lake surfaces replaced by bowl-shaped beds. */
export function riftFloorFromRelief(step = 0.04): [number, number][] {
  const pts: [number, number][] = [];
  for (let f = 0; f <= 1 + 1e-9; f += step) pts.push([+f.toFixed(3), riftMin(latOf(f))]);
  for (const lake of LAKES) {
    const run = pts.map((p, i) => (Math.abs(p[1] - lake.surface) <= 3 ? i : -1)).filter((i) => i >= 0);
    run.forEach((i, k) => {
      pts[i][1] = Math.round(lake.surface - lake.maxDepth * Math.sin((Math.PI * (k + 1)) / (run.length + 1)));
    });
  }
  return pts;
}

/** West–east cross-section at a latitude, as [lon, metres]. */
export function crossSection(lat: number, west = 34.5, east = 36.0): [number, number][] {
  const out: [number, number][] = [];
  for (let lon = west; lon <= east + 1e-9; lon += relief.stepDeg) out.push([lon, elevAt(lat, lon)]);
  return out;
}
