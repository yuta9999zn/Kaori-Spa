// i18n parity checker — ensures all 5 locale files in every app have the same
// set of keys. Fails fast in CI when a translation is missing or extra.
//
// Run: node tools/i18n-check.mjs

import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const APPS_DIR = 'apps';
const LOCALES = ['vi', 'en', 'ja', 'zh', 'ko'];
const REQUIRED_BASE = 'vi';

function flatKeys(obj, prefix = '') {
  const out = new Set();
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const sub of flatKeys(v, path)) out.add(sub);
    } else {
      out.add(path);
    }
  }
  return out;
}

let hadError = false;

for (const app of await readdir(APPS_DIR)) {
  const messagesDir = join(APPS_DIR, app, 'messages');
  try {
    const stats = await stat(messagesDir);
    if (!stats.isDirectory()) continue;
  } catch {
    continue;
  }

  const baseRaw = await readFile(join(messagesDir, `${REQUIRED_BASE}.json`), 'utf8');
  const baseKeys = flatKeys(JSON.parse(baseRaw));

  for (const loc of LOCALES) {
    if (loc === REQUIRED_BASE) continue;
    let raw;
    try {
      raw = await readFile(join(messagesDir, `${loc}.json`), 'utf8');
    } catch {
      console.error(`✗ ${app}/messages/${loc}.json missing`);
      hadError = true;
      continue;
    }
    const keys = flatKeys(JSON.parse(raw));
    const missing = [...baseKeys].filter(k => !keys.has(k));
    const extra = [...keys].filter(k => !baseKeys.has(k));
    if (missing.length || extra.length) {
      console.error(`✗ ${app}/messages/${loc}.json out of parity with ${REQUIRED_BASE}`);
      if (missing.length) console.error(`  missing: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? ' …' : ''}`);
      if (extra.length) console.error(`  extra:   ${extra.slice(0, 10).join(', ')}${extra.length > 10 ? ' …' : ''}`);
      hadError = true;
    } else {
      console.log(`✓ ${app}/messages/${loc}.json`);
    }
  }
}

if (hadError) {
  console.error('\nSome i18n files are out of parity. Fix the missing/extra keys above.');
  process.exit(1);
}
console.log('\nAll locales in parity. ✓');
