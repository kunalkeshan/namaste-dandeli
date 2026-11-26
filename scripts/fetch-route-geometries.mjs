/**
 * Fetch OSRM driving polylines for marketing route maps.
 * Writes scripts/route-geometries.json for seed-marketing-pages.mjs.
 *
 *   node scripts/fetch-route-geometries.mjs
 */
import { writeFileSync } from 'node:fs';

const DEST = { name: 'Dandeli bus stand', lon: 74.618, lat: 15.267 };

const ROUTES = [
  {
    slug: 'hubballi-airport',
    origin: { name: 'Hubballi airport (HBX)', lon: 75.0841, lat: 15.3617 },
  },
  {
    slug: 'hubballi-city',
    origin: { name: 'Hubballi city & station', lon: 75.1597, lat: 15.3478 },
  },
  {
    slug: 'alnavar-junction',
    origin: { name: 'Alnavar Junction', lon: 74.7397, lat: 15.4267 },
  },
  {
    slug: 'londa-junction',
    origin: { name: 'Londa Junction', lon: 74.5185, lat: 15.4053 },
  },
  {
    slug: 'belagavi-airport',
    origin: { name: 'Belagavi airport (IXG)', lon: 74.6183, lat: 15.8593 },
  },
  {
    slug: 'dabolim-goa',
    origin: { name: 'Dabolim airport, Goa (GOI)', lon: 73.8314, lat: 15.3809 },
  },
];

const OSRM = 'https://router.project-osrm.org/route/v1/driving';

function simplify(coords, target = 36) {
  if (coords.length <= target) return coords;
  const step = (coords.length - 1) / (target - 1);
  const out = [];
  for (let i = 0; i < target; i++) {
    const idx = Math.min(coords.length - 1, Math.round(i * step));
    out.push(coords[idx]);
  }
  return out;
}

async function geometry(from) {
  const url =
    `${OSRM}/${from.lon},${from.lat};${DEST.lon},${DEST.lat}` +
    '?overview=full&geometries=geojson';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const data = await res.json();
  const line = data.routes?.[0]?.geometry?.coordinates;
  if (!line?.length) throw new Error('No geometry');
  const simplified = simplify(line);
  const stops = simplified.map(([lng, lat], i) => ({
    _type: 'routeStop',
    _key: `pt${i}`,
    name: i === 0 ? from.name : i === simplified.length - 1 ? DEST.name : `_${i}`,
    lat,
    lng,
    ...(i === simplified.length - 1
      ? {
          note: 'Schematic endpoint — not turn-by-turn navigation.',
        }
      : {}),
  }));
  return stops;
}

const out = {};
for (const r of ROUTES) {
  console.log(r.slug);
  out[r.slug] = await geometry(r.origin);
  await new Promise((resolve) => setTimeout(resolve, 1200));
}

writeFileSync('scripts/route-geometries.json', JSON.stringify(out, null, 2));
console.log('Wrote scripts/route-geometries.json');
