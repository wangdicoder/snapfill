#!/usr/bin/env node

/**
 * Bundles the injectable entry-point scripts into self-contained IIFE strings
 * and writes them to src/injectable.gen.ts.
 *
 * Run before the main tsup build: `node scripts/bundle-injectables.mjs`
 */

import { buildSync } from 'esbuild';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, '..', 'src');
const scriptsDir = join(srcDir, 'scripts');

function bundleEntry(entryFile) {
  const result = buildSync({
    entryPoints: [join(scriptsDir, entryFile)],
    bundle: true,
    format: 'iife',
    write: false,
    minify: true,
    target: 'es2020',
    platform: 'browser',
  });
  return result.outputFiles[0].text.trim();
}

const formDetectorScript = bundleEntry('formDetector.entry.ts');
const cartDetectorScript = bundleEntry('cartDetector.entry.ts');
const valueCaptureScript = bundleEntry('valueCapture.entry.ts');
const fillScriptTemplate = bundleEntry('fillForm.entry.ts');

const output = `// AUTO-GENERATED — do not edit manually.
// Run \`node scripts/bundle-injectables.mjs\` to regenerate.

export const formDetectorScript = ${JSON.stringify(formDetectorScript)};

export const cartDetectorScript = ${JSON.stringify(cartDetectorScript)};

export const valueCaptureScript = ${JSON.stringify(valueCaptureScript)};

export const fillScriptTemplate = ${JSON.stringify(fillScriptTemplate)};
`;

const outPath = join(srcDir, 'injectable.gen.ts');
writeFileSync(outPath, output, 'utf-8');
console.log(`Generated ${outPath}`);
