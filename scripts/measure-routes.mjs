/**
 * Double-measure driving routes (two OSRM endpoints) for launch blockers.
 * Endpoints: Dandeli bus stand. Run: node scripts/measure-routes.mjs
 */
const DEST = { name: 'Dandeli bus stand', lon: 74.618, lat: 15.267 };

const ORIGINS = [
  { id: 0, name: 'Hubballi Airport (HBX)', lon: 75.0841, lat: 15.3617 },
  { id: 1, name: 'Hubballi city & station', lon: 75.1597, lat: 15.3478 },
  { id: 2, name: 'Alnavar Junction', lon: 74.7397, lat: 15.4267 },
  { id: 3, name: 'Londa Junction', lon: 74.5185, lat: 15.4053 },
  { id: 4, name: 'Belagavi Airport (IXG)', lon: 74.6183, lat: 15.8593 },
  { id: 5, name: 'Dabolim Airport, Goa (GOI)', lon: 73.8314, lat: 15.3809 },
  { id: 6, name: 'Mopa Airport, Goa (GOX)', lon: 73.8706, lat: 15.744 },
  { id: 7, name: 'Dharwad', lon: 75.0119, lat: 15.0186 },
];

const SERVERS = [
  { name: 'project-osrm', path: 'https://router.project-osrm.org/route/v1/driving' },
  {
    name: 'openstreetmap-de',
    path: 'https://routing.openstreetmap.de/routed-car/route/v1/driving',
  },
];

async function measure(path, from, to) {
  const url = `${path}/${from.lon},${from.lat};${to.lon},${to.lat}` + '?overview=false';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${path} HTTP ${res.status}`);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error(`${path}: ${data.code}`);
  const r = data.routes[0];
  return { km: Math.round(r.distance / 100) / 10, minutes: Math.round(r.duration / 60) };
}

function formatDrive(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

function agree(a, b) {
  const kmDiff = Math.abs(a.km - b.km);
  const kmOk = kmDiff <= Math.max(2, 0.03 * Math.max(a.km, b.km));
  const minOk = Math.abs(a.minutes - b.minutes) <= 10;
  return {
    kmOk,
    minOk,
    ok: kmOk && minOk,
    kmDiff,
    minDiff: Math.abs(a.minutes - b.minutes),
  };
}

const results = [];
for (const o of ORIGINS) {
  const pair = await Promise.all(SERVERS.map((s) => measure(s.path, o, DEST)));
  const cmp = agree(pair[0], pair[1]);
  const avgKm = Math.round(((pair[0].km + pair[1].km) / 2) * 10) / 10;
  const avgMin = Math.round((pair[0].minutes + pair[1].minutes) / 2);
  results.push({
    id: o.id,
    from: o.name,
    osrm1: pair[0],
    osrm2: pair[1],
    agree: cmp,
    publish: cmp.ok ? { km: avgKm, drive: formatDrive(avgMin) } : null,
  });
  console.log(`\n${o.name} → Dandeli`);
  for (const [i, s] of SERVERS.entries()) {
    console.log(`  ${s.name}: ${pair[i].km} km, ${pair[i].minutes} min`);
  }
  console.log(
    cmp.ok
      ? `  ✓ publish ${avgKm} km · ${formatDrive(avgMin)}`
      : `  ✗ skip (km Δ ${cmp.kmDiff.toFixed(1)}, min Δ ${cmp.minDiff})`,
  );
}

console.log('\n--- publish payload ---');
console.log(JSON.stringify(results, null, 2));
