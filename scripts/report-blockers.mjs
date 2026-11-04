/**
 * Prints every fact still waiting on Irshad.
 *
 * Uses Vite to resolve the TypeScript content modules, so it sees
 * exactly what the site sees — rather than a second, drifting copy
 * of the same data.
 *
 * The launch runbook is generated from this, never hand-maintained:
 * a hand-kept checklist goes stale the first time someone confirms a
 * fact and forgets to tick the box.
 */
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
});

try {
  const { launchBlockers } = await server.ssrLoadModule('/src/content/index.ts');
  const items = launchBlockers();

  if (items.length === 0) {
    console.log('✓ No unconfirmed facts — nothing is blocked on Irshad.');
  } else {
    console.log(`\n${items.length} fact(s) still unconfirmed:\n`);
    for (const { field, blocker } of items) {
      console.log(`  \x1b[33m${field}\x1b[0m`);
      console.log(`    → ${blocker}\n`);
    }
  }
} finally {
  await server.close();
}
