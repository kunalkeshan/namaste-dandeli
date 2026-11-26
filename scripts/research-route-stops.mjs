/**
 * One-off OSM Nominatim lookup for schematic route endpoints.
 * Output is for seeding routeStops — not live navigation.
 *
 *   node scripts/research-route-stops.mjs
 */
const PLACES = [
  'Hubballi Airport, Karnataka, India',
  'Dandeli bus stand, Karnataka, India',
  'Alnavar railway station, Karnataka, India',
  'Londa Junction railway station, Karnataka, India',
  'Belagavi Airport, Karnataka, India',
  'Goa Dabolim Airport, India',
];

for (const q of PLACES) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'namaste-dandeli-research/1.0 (local script)' },
  });
  const data = await res.json();
  const hit = data[0];
  console.log(q);
  if (hit) {
    console.log(`  ${hit.display_name}`);
    console.log(`  lat: ${hit.lat}, lon: ${hit.lon}`);
  } else {
    console.log('  (no hit)');
  }
  await new Promise((r) => setTimeout(r, 1100));
}
