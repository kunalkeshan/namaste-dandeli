import { defineCliConfig } from 'sanity/cli';

/**
 * Studio-side CLI config.
 *
 * Distinct from the root `sanity.cli.ts`, which carries typegen only
 * and never talks to the Content Lake. This one owns the project
 * connection and deployment; the two have disjoint jobs.
 *
 * `deployment.appId` pins the deployed app so redeploys target the
 * same *.sanity.studio hostname. (`studioHost` is deprecated.)
 */
export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  },
  deployment: {
    appId: process.env.SANITY_STUDIO_APP_ID,
    autoUpdates: true,
  },
});
