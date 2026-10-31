// Turns the ETOPO1 subset (assets-src/relief/etopo1-israel.csv, NOAA, public
// domain) into a small bundled grid: src/data/israel-relief.json.
//   node scripts/build-relief.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const rows = readFileSync('assets-src/relief/etopo1-israel.csv', 'utf8').trim().split('\n').slice(2).map((l) => l.split(',').map(Number));
const lats = [...new Set(rows.map((r) => +r[0].toFixed(4)))].sort((a, b) => b - a); // north first
const lons = [...new Set(rows.map((r) => +r[1].toFixed(4)))].sort((a, b) => a - b); // west first
const elev = new Array(lats.length * lons.length).fill(0);
for (const [la, lo, h] of rows) elev[lats.indexOf(+la.toFixed(4)) * lons.length + lons.indexOf(+lo.toFixed(4))] = Math.round(h);
writeFileSync(
  'src/data/israel-relief.json',
  JSON.stringify({
    source: 'NOAA ETOPO1 (etopo180) via coastwatch.pfeg.noaa.gov ERDDAP, 2 arc-min subsample; public domain',
    north: lats[0],
    west: lons[0],
    stepDeg: +(lons[1] - lons[0]).toFixed(6),
    nLat: lats.length,
    nLon: lons.length,
    elev,
  }),
);
console.log(lats.length, lons.length, Math.min(...elev), Math.max(...elev));
