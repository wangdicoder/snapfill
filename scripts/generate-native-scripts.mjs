#!/usr/bin/env node

/**
 * Generates JavaScript assets for native Android and iOS libraries.
 * Run after building @snapfill/core: `node scripts/generate-native-scripts.mjs`
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Import from the built @snapfill/core injectable entry
const coreDist = join(root, 'packages/core/dist/injectable.mjs');
const mod = await import(coreDist);

const { snapfillScript, fillScriptTemplate } = mod;

if (!snapfillScript) {
  console.error('ERROR: snapfillScript not found in @snapfill/core/injectable');
  process.exit(1);
}
if (!fillScriptTemplate) {
  console.error('ERROR: fillScriptTemplate not found in @snapfill/core/injectable');
  process.exit(1);
}

const targets = [
  join(root, 'packages/android/src/main/assets'),
  join(root, 'packages/ios/Sources/Snapfill/Resources'),
];

for (const dir of targets) {
  mkdirSync(dir, { recursive: true });

  const detectPath = join(dir, 'snapfill.js');
  writeFileSync(detectPath, snapfillScript, 'utf-8');
  console.log(`  wrote ${detectPath}`);

  const fillPath = join(dir, 'snapfill-fill.js');
  writeFileSync(fillPath, fillScriptTemplate, 'utf-8');
  console.log(`  wrote ${fillPath}`);
}

console.log('\nNative scripts generated successfully.');
