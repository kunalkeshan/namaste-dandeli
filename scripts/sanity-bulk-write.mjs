/**
 * One Vercel production rebuild after bulk Sanity writes.
 *
 * See docs/deploy-on-publish.md — "Bulk writes and deployment storms".
 *
 *   import { withSingleProductionRebuild, skipRebuildPause } from './sanity-bulk-write.mjs';
 *
 *   if (DRY) process.exit(0);
 *   withSingleProductionRebuild(() => runImportOrMutate(), {
 *     skip: skipRebuildPause(process.argv),
 *   });
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS = dirname(fileURLToPath(import.meta.url));

export const NO_REBUILD_PAUSE_FLAG = '--no-rebuild-pause';

export function skipRebuildPause(argv = process.argv) {
  return (
    argv.includes(NO_REBUILD_PAUSE_FLAG) || process.env.SANITY_NO_REBUILD_PAUSE === '1'
  );
}

function rebuildWebhook(subcmd) {
  execFileSync('node', [join(SCRIPTS, 'rebuild-webhook.mjs'), subcmd], {
    stdio: 'inherit',
  });
}

/** Pause Sanity→Vercel hook, run work, trigger one deploy, resume hook. */
export function withSingleProductionRebuild(run, { skip = false } = {}) {
  if (skip) {
    run();
    return;
  }
  try {
    rebuildWebhook('pause');
    run();
    rebuildWebhook('trigger');
  } finally {
    rebuildWebhook('resume');
  }
}
