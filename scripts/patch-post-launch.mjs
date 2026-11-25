/**
 * Surgical Sanity patches after launch confirmations — not a full reimport.
 *
 *   node scripts/patch-post-launch.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';

const CLI = 'node_modules/.bin/sanity';
const PROJECT = 'krbamcti';
const DATASET = 'production';
const ON = '2026-11-26';
const IRSHAD = 'Irshad Khan';
const DIST_SRC =
  'OSRM (router.project-osrm.org & routing.openstreetmap.de); dest: Dandeli bus stand';

const routes = JSON.parse(readFileSync('scripts/.route-measurements.json', 'utf8'));

const mutations = {
  mutations: [
    {
      patch: {
        id: 'siteSettings',
        set: {
          hours: {
            confirmed: true,
            value: 'Call to check availability. He answers early and late',
            confirmedOn: ON,
            source: IRSHAD,
          },
          whatsapp: {
            confirmed: true,
            value: '919449006326',
            confirmedOn: ON,
            source: IRSHAD,
          },
        },
      },
    },
    {
      patch: {
        id: 'assurance-0',
        set: {
          fact: {
            confirmed: false,
            fallback: '',
            blocker:
              'DECIDED: do not publish — other trusted drivers take some trips; the page must not say Irshad always drives.',
          },
        },
      },
    },
    {
      patch: {
        id: 'assurance-1',
        set: {
          title: 'The vehicle number, before pickup',
          body: 'He sends the vehicle number and his number before pickup, so a passenger can forward them to family.',
          fact: {
            confirmed: true,
            value: 'yes',
            confirmedOn: ON,
            source: IRSHAD,
          },
        },
      },
    },
    {
      patch: {
        id: 'assurance-2',
        set: {
          fact: {
            confirmed: false,
            fallback: '',
            blocker:
              'DECIDED: do not publish — no promise that one number is answered at all hours; the hours line is the softer fallback.',
          },
        },
      },
    },
    ...routes.map((r, i) => ({
      patch: {
        id: `route-${i}`,
        set: {
          distance: {
            confirmed: true,
            km: r.km,
            drive: r.drive,
            confirmedOn: ON,
            source: DIST_SRC,
          },
        },
      },
    })),
  ],
};

writeFileSync('tmp-post-launch-mutations.json', JSON.stringify(mutations));
writeFileSync(
  'studio/.patch-post-launch.cjs',
  `const fs = require('node:fs');
const { createClient } = require('@sanity/client');
const client = createClient({
  projectId: '${PROJECT}',
  dataset: '${DATASET}',
  apiVersion: '2026-11-05',
  token: process.env.SANITY_AUTH_TOKEN,
  useCdn: false,
});
const body = JSON.parse(fs.readFileSync('${process.cwd()}/tmp-post-launch-mutations.json','utf8'));
client
  .mutate(body.mutations)
  .then(() => console.log('patched siteSettings, 3 assurances, ${routes.length} routes'))
  .catch((e) => { console.error(e.message); process.exit(1); });
`,
);
try {
  execFileSync(CLI, ['exec', '--with-user-token', '.patch-post-launch.cjs'], {
    stdio: 'inherit',
    cwd: 'studio',
  });
} finally {
  unlinkSync('studio/.patch-post-launch.cjs');
}
console.log('done.');
