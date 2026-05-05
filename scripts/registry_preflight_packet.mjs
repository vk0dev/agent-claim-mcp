#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const KNOWN_FAILED_RUN_ID = '25282612113';
const RERUN_COMMAND = `gh run rerun ${KNOWN_FAILED_RUN_ID} --repo vk0dev/agent-claim-mcp`;
const RUNBOOK_PATH = 'docs/official-registry-validation-runbook.md';
const CHECKLIST_PATH = 'docs/official-registry-validation-checklist.md';

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relPath), 'utf8'));
}

function readText(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function exists(relPath) {
  return fs.existsSync(path.join(repoRoot, relPath));
}

function check(condition, okMessage, failMessage, failures) {
  if (condition) return `OK: ${okMessage}`;
  failures.push(failMessage);
  return `FAIL: ${failMessage}`;
}

const failures = [];
const pkg = readJson('package.json');
const server = readJson('server.json');
const createServerSource = readText('src/createServer.ts');
const workflowSource = readText('.github/workflows/publish.yml');
const publishingSource = readText('PUBLISHING.md');

const sourceVersionMatch = createServerSource.match(/version:\s*['"]([^'"]+)['"]/);
const sourceNameMatch = createServerSource.match(/name:\s*['"]([^'"]+)['"]/);

const packageVersion = pkg.version;
const packageName = pkg.name;
const packageMcpName = pkg.mcpName;
const serverName = server.name;
const serverVersion = server.version;
const serverPackage = server.packages?.[0] ?? {};
const sourceVersion = sourceVersionMatch?.[1] ?? null;
const sourceName = sourceNameMatch?.[1] ?? null;

const checks = [
  check(packageName === '@vk0/agent-claim-mcp', 'package.json name matches expected npm package', `package.json name drifted: ${packageName}`, failures),
  check(packageMcpName === 'io.github.vk0dev/agent-claim-mcp', 'package.json mcpName matches expected registry identity', `package.json mcpName drifted: ${packageMcpName}`, failures),
  check(serverName === 'io.github.vk0dev/agent-claim-mcp', 'server.json name matches expected registry identity', `server.json name drifted: ${serverName}`, failures),
  check(serverVersion === packageVersion, 'server.json version matches package.json', `server.json version ${serverVersion} does not match package.json ${packageVersion}`, failures),
  check(serverPackage.identifier === packageName, 'server.json package identifier matches package.json name', `server.json package identifier drifted: ${serverPackage.identifier}`, failures),
  check(serverPackage.version === packageVersion, 'server.json package version matches package.json', `server.json package version ${serverPackage.version} does not match package.json ${packageVersion}`, failures),
  check(sourceVersion === packageVersion, 'src/createServer.ts version matches package.json', `src/createServer.ts version ${sourceVersion} does not match package.json ${packageVersion}`, failures),
  check(sourceName === 'agent-claim-mcp', 'src/createServer.ts runtime name is stable', `src/createServer.ts runtime name drifted: ${sourceName}`, failures),
  check(workflowSource.includes('Publish to npm with provenance'), 'publish workflow still contains npm publish step', 'publish workflow is missing the npm publish step', failures),
  check(workflowSource.includes('Authenticate to MCP Registry'), 'publish workflow still contains MCP Registry auth step', 'publish workflow is missing MCP Registry auth step', failures),
  check(workflowSource.includes('Publish to Official MCP Registry'), 'publish workflow still contains MCP Registry publish step', 'publish workflow is missing MCP Registry publish step', failures),
  check(exists(RUNBOOK_PATH), `${RUNBOOK_PATH} exists`, `${RUNBOOK_PATH} is missing`, failures),
  check(exists(CHECKLIST_PATH), `${CHECKLIST_PATH} exists`, `${CHECKLIST_PATH} is missing`, failures),
  check(publishingSource.includes(RERUN_COMMAND), 'PUBLISHING.md already documents the canonical rerun command', 'PUBLISHING.md is missing the canonical rerun command', failures),
];

const verdict = failures.length === 0 ? 'READY_LOCAL' : 'BLOCKED_LOCAL';

console.log('agent-claim-mcp publish-rerun preflight packet');
console.log('=============================================');
console.log(`verdict: ${verdict}`);
console.log(`package: ${packageName}@${packageVersion}`);
console.log(`server_identity: ${serverName}`);
console.log(`runtime_name: ${sourceName}`);
console.log(`runtime_version: ${sourceVersion}`);
console.log(`workflow_rerun_command: ${RERUN_COMMAND}`);
console.log(`registry_validation_runbook: ${RUNBOOK_PATH}`);
console.log(`registry_validation_checklist: ${CHECKLIST_PATH}`);
console.log('');
console.log('checks:');
for (const line of checks) console.log(`- ${line}`);
console.log('');
console.log('next_step:');
console.log('- Fix or confirm the GitHub repo secret NPM_TOKEN for vk0dev/agent-claim-mcp.');
console.log(`- Rerun the failed publish workflow: ${RERUN_COMMAND}`);
console.log(`- After rerun completion, execute ${RUNBOOK_PATH} and record exactly one PASS / SOFT-BLOCKED / FAIL packet using ${CHECKLIST_PATH}.`);
console.log('');
if (failures.length > 0) {
  console.log('blocking_issues:');
  for (const failure of failures) console.log(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('blocking_issues:');
  console.log('- None in local repo metadata. External publish/registry proof still depends on the GitHub secret being fixed before rerun.');
}
