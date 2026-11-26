/**
 * Pause / resume the Sanity → Vercel deploy hook, or fire one rebuild.
 *
 * Bulk imports (seed-marketing-pages.mjs) update many documents; a
 * document-level webhook queues one production deploy per document.
 * Pause before import, trigger once after.
 *
 *   node scripts/rebuild-webhook.mjs status
 *   node scripts/rebuild-webhook.mjs pause
 *   node scripts/rebuild-webhook.mjs resume
 *   node scripts/rebuild-webhook.mjs trigger
 *   node scripts/rebuild-webhook.mjs migrate-transaction
 *
 * Auth: SANITY_AUTH_TOKEN or ~/.config/sanity/config.json (sanity login).
 * The Vercel Deploy Hook URL is never stored in this repo — read from the
 * webhook record or set REBUILD_DEPLOY_HOOK for trigger-only runs.
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT = process.env.SANITY_PROJECT_ID ?? 'krbamcti';
const API_VERSION = 'v2025-02-19';
const BASE = `https://${PROJECT}.api.sanity.io/${API_VERSION}`;
const HOOK_NAME = 'Rebuild Site on Publish';

const cmd = process.argv[2] ?? 'status';

function authToken() {
  if (process.env.SANITY_AUTH_TOKEN) return process.env.SANITY_AUTH_TOKEN;
  const path = join(homedir(), '.config/sanity/config.json');
  const cfg = JSON.parse(readFileSync(path, 'utf8'));
  if (!cfg.authToken) throw new Error('Run `sanity login` or set SANITY_AUTH_TOKEN');
  return cfg.authToken;
}

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${authToken()}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return data;
}

async function listHooks() {
  return api(`/hooks/projects/${PROJECT}`);
}

async function findHook() {
  const hooks = await listHooks();
  const hook = hooks.find((h) => h.name === HOOK_NAME);
  if (!hook) throw new Error(`Webhook "${HOOK_NAME}" not found`);
  return hook;
}

async function setDisabled(disabled) {
  const hook = await findHook();
  await api(`/hooks/projects/${PROJECT}/${hook.id}`, {
    method: 'PATCH',
    body: { isDisabledByUser: disabled },
  });
  console.log(disabled ? 'Rebuild webhook paused.' : 'Rebuild webhook resumed.');
}

async function status() {
  const hook = await findHook();
  console.log({
    name: hook.name,
    type: hook.type,
    dataset: hook.dataset,
    disabled: hook.isDisabledByUser || hook.isDisabled,
    includeDrafts: hook.includeDrafts,
    filter: hook.rule?.filter ?? '(none — all document types)',
  });
}

async function trigger() {
  const url = process.env.REBUILD_DEPLOY_HOOK ?? (await findHook()).url;
  const res = await fetch(url, { method: 'POST' });
  console.log(`Deploy hook → HTTP ${res.status}`);
  if (!res.ok) throw new Error(await res.text());
}

/** One transaction webhook rebuild per commit; avoids N deploys per transaction batch. */
async function migrateTransaction() {
  const hook = await findHook();
  if (hook.type === 'transaction') {
    console.log('Already a transaction webhook — nothing to do.');
    return;
  }
  const url = hook.url;
  const dataset = hook.dataset ?? 'production';
  const disabled = hook.isDisabledByUser ?? false;
  await api(`/hooks/projects/${PROJECT}/${hook.id}`, { method: 'DELETE' });
  const created = await api(`/hooks/projects/${PROJECT}`, {
    method: 'POST',
    body: {
      type: 'transaction',
      name: HOOK_NAME,
      url,
      dataset,
      description:
        'One Vercel production rebuild per Sanity transaction (not per document).',
      isDisabledByUser: disabled,
    },
  });
  console.log(
    `Replaced document webhook ${hook.id} with transaction webhook ${created.id}.`,
  );
}

const actions = {
  status,
  pause: () => setDisabled(true),
  resume: () => setDisabled(false),
  trigger,
  'migrate-transaction': migrateTransaction,
};

if (!actions[cmd]) {
  console.error(`Unknown command: ${cmd}`);
  process.exit(1);
}

await actions[cmd]();
