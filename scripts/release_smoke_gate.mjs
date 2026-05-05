#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const pkg = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const server = JSON.parse(readFileSync(path.join(repoRoot, 'server.json'), 'utf8'));

const validationModule = await import(pathToFileURL(path.join(repoRoot, 'dist', 'releaseValidation.js')).href);
const errors = validationModule.validateReleaseMetadata(pkg, server);
if (errors.length > 0) {
  console.error('Release metadata validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const rawPack = execFileSync('npm', ['pack', '--dry-run', '--json'], {
  cwd: repoRoot,
  encoding: 'utf8',
});
const pack = JSON.parse(rawPack);
const packEntry = Array.isArray(pack) ? pack[0] : pack;
const files = new Set((packEntry?.files ?? []).map((entry) => entry.path));

for (const required of ['package.json', 'server.json', 'dist/createServer.js', 'dist/server.js']) {
  if (!files.has(required)) {
    console.error(`npm pack --dry-run output is missing required file: ${required}`);
    process.exit(1);
  }
}

console.log(`Validated package metadata for ${pkg.name}@${pkg.version}`);
console.log('npm pack --dry-run includes required package.json, server.json, and dist entry files');

execFileSync('node', ['scripts/dogfood_smoke.mjs'], {
  cwd: repoRoot,
  stdio: 'inherit',
});
