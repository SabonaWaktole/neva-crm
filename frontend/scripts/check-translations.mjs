#!/usr/bin/env node
/**
 * Translation catalogue check.
 *
 * Two independent jobs:
 *
 *   1. COMPLETENESS — every key present in `en` must exist in every other
 *      language. A missing key still renders (i18next falls back to English),
 *      so nothing breaks visibly; that is exactly why it needs a check rather
 *      than a bug report.
 *
 *   2. REVIEW STATUS — every non-English string must appear in that language's
 *      `.reviewed.json` allowlist before the language may be called
 *      production-ready. Machine-detectable on purpose: "has this been
 *      reviewed?" should be a command, not somebody's recollection.
 *
 * Usage:
 *   node scripts/check-translations.mjs             report only, always exit 0
 *   node scripts/check-translations.mjs --strict    exit 1 if anything is
 *                                                   missing or unreviewed
 *
 * --strict is a RELEASE gate, not a build gate. It is expected to fail until a
 * native review happens, so wiring it into CI as a blocking step today would
 * just paint the build red for a known, accepted state. See TD-019.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'locales');
const SOURCE_LANGUAGE = 'en';

const strict = process.argv.includes('--strict');

/** Flattens nested catalogue objects into dotted `a.b.c` paths. */
function flatten(value, prefix = '') {
  if (value === null || typeof value !== 'object') return { [prefix]: value };
  return Object.entries(value).reduce((acc, [key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return Object.assign(acc, flatten(child, path));
  }, {});
}

function readCatalogue(language) {
  const dir = join(root, language);
  const keys = {};
  for (const file of readdirSync(dir)) {
    // Dotfiles are metadata (.reviewed.json), not translations.
    if (!file.endsWith('.json') || file.startsWith('.')) continue;
    const ns = basename(file, '.json');
    const parsed = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    for (const [path, value] of Object.entries(flatten(parsed))) {
      keys[`${ns}:${path}`] = value;
    }
  }
  return keys;
}

function readReviewed(language) {
  const path = join(root, language, '.reviewed.json');
  if (!existsSync(path)) return new Set();
  const parsed = JSON.parse(readFileSync(path, 'utf8'));
  return new Set(parsed.reviewed ?? []);
}

const languages = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const source = readCatalogue(SOURCE_LANGUAGE);
const sourceKeys = Object.keys(source).sort();

console.log(`Source language: ${SOURCE_LANGUAGE} (${sourceKeys.length} keys)\n`);

let failed = false;

for (const language of languages) {
  if (language === SOURCE_LANGUAGE) continue;

  const catalogue = readCatalogue(language);
  const reviewed = readReviewed(language);

  const missing = sourceKeys.filter((key) => !(key in catalogue));
  const extra = Object.keys(catalogue).filter((key) => !(key in source));
  const translated = Object.keys(catalogue);
  const unreviewed = translated.filter((key) => !reviewed.has(key));

  const pct = translated.length && sourceKeys.length
    ? Math.round(((sourceKeys.length - missing.length) / sourceKeys.length) * 100)
    : 0;

  console.log(`── ${language} ─────────────────────────────`);
  console.log(`   translated : ${sourceKeys.length - missing.length}/${sourceKeys.length} (${pct}%)`);
  console.log(`   reviewed   : ${translated.length - unreviewed.length}/${translated.length}`);

  if (missing.length) {
    failed = true;
    console.log(`   MISSING (${missing.length}) — these fall back to English:`);
    for (const key of missing.slice(0, 15)) console.log(`     - ${key}`);
    if (missing.length > 15) console.log(`     … and ${missing.length - 15} more`);
  }

  if (extra.length) {
    failed = true;
    console.log(`   ORPHANED (${extra.length}) — no longer in ${SOURCE_LANGUAGE}:`);
    for (const key of extra.slice(0, 15)) console.log(`     - ${key}`);
    if (extra.length > 15) console.log(`     … and ${extra.length - 15} more`);
  }

  if (unreviewed.length) {
    failed = true;
    console.log(`   UNREVIEWED (${unreviewed.length}) — not yet checked by a native speaker.`);
    console.log(`   This language must NOT be presented as production-ready. See TD-019.`);
  }

  console.log('');
}

if (failed && strict) {
  console.error('FAIL: catalogues are incomplete or unreviewed.');
  process.exit(1);
}

if (failed) {
  console.log('Reporting only (pass --strict to fail on the above).');
}
