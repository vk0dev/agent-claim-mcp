#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

export const REGISTRY_STEP_NAMES = [
  'Publish to npm with provenance',
  'Install mcp-publisher',
  'Authenticate to MCP Registry',
  'Publish to Official MCP Registry',
];

export function summarizeRegistrySteps(jobsPayload) {
  const jobs = Array.isArray(jobsPayload?.jobs) ? jobsPayload.jobs : [];
  const allSteps = jobs.flatMap((job) => Array.isArray(job?.steps) ? job.steps : []);

  return REGISTRY_STEP_NAMES.map((name) => {
    const step = allSteps.find((candidate) => candidate?.name === name);
    const conclusion = step?.conclusion ?? 'not_reached';
    return {
      name,
      reached: Boolean(step) && !['skipped', 'not_reached'].includes(conclusion),
      status: step?.status ?? 'not_reached',
      conclusion,
      number: step?.number ?? null,
    };
  });
}

export function inferVerdict(stepSummary, publicProofUrl, smitheryUrl = '') {
  const byName = new Map(stepSummary.map((step) => [step.name, step]));
  const npmPublish = byName.get('Publish to npm with provenance');
  const registryPublish = byName.get('Publish to Official MCP Registry');
  const registryAuth = byName.get('Authenticate to MCP Registry');
  const registryStepsReached = Boolean(registryAuth?.reached || registryPublish?.reached);

  if (smitheryUrl) {
    return 'PASS';
  }

  if (registryAuth?.conclusion === 'failure' || registryPublish?.conclusion === 'failure') {
    return 'FAIL';
  }

  if (registryPublish?.conclusion === 'success' && publicProofUrl) {
    return 'PASS';
  }

  if (npmPublish?.conclusion === 'failure' && !registryStepsReached) {
    return 'SOFT-BLOCKED';
  }

  if (npmPublish?.conclusion === 'failure') {
    return 'FAIL';
  }

  return 'SOFT-BLOCKED';
}

export function renderVerdictPacket({ run, stepSummary, publicProofUrl, smitheryUrl, verdict }) {
  const runUrl = run?.html_url || run?.url || `https://github.com/vk0dev/agent-claim-mcp/actions/runs/${run?.databaseId ?? run?.id ?? 'UNKNOWN'}`;
  const runId = run?.databaseId ?? run?.id ?? 'UNKNOWN';
  const ref = run?.head_branch || run?.headBranch || 'UNKNOWN';
  const sha = run?.head_sha || run?.headSha || 'UNKNOWN';

  const stepLines = stepSummary.map((step) => (
    `- ${step.name}: reached=${step.reached ? 'yes' : 'no'}, status=${step.status}, conclusion=${step.conclusion}`
  )).join('\n');

  return `# External proof rerun verdict packet for agent-claim-mcp\n\n` +
    `- Workflow run URL: ${runUrl}\n` +
    `- Workflow run id: ${runId}\n` +
    `- Git ref: ${ref}\n` +
    `- Head SHA: ${sha}\n\n` +
    `## Registry step summary\n${stepLines}\n\n` +
    `## Public proof\n` +
    `- npm package version check: run \`npm view @vk0/agent-claim-mcp version\` separately and paste the result here\n` +
    `- Official MCP Registry proof URL: ${publicProofUrl || 'ABSENT (record explicit absence if still missing)'}\n` +
    `- Smithery listing URL: ${smitheryUrl || 'ABSENT (record explicit absence if this is not the proof branch)'}\n\n` +
    `## Suggested verdict\n` +
    `- Verdict: ${verdict}\n` +
    `- Rule: PASS requires either successful registry publish plus public registry proof URL, or a live Smithery listing URL. FAIL requires a reached registry auth/publish failure or another post-rerun blocking workflow failure. Pre-rerun npm-secret failures that never reach registry validation remain SOFT-BLOCKED.\n`;
}

function usage() {
  return 'Usage: node scripts/official_registry_rerun_capture.mjs --run-id <github-actions-run-id> [--repo owner/repo] [--public-proof-url <url>] [--smithery-url <url>]';
}

function parseArgs(argv) {
  const args = { repo: 'vk0dev/agent-claim-mcp', publicProofUrl: '', smitheryUrl: '' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg === '--run-id') args.runId = argv[++i];
    else if (arg === '--repo') args.repo = argv[++i];
    else if (arg === '--public-proof-url') args.publicProofUrl = argv[++i];
    else if (arg === '--smithery-url') args.smitheryUrl = argv[++i];
  }
  if (args.help) return args;
  if (!args.runId) {
    throw new Error(usage());
  }
  return args;
}

function ghJson(args) {
  return JSON.parse(execFileSync('gh', args, { encoding: 'utf8' }));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const run = ghJson(['api', `repos/${args.repo}/actions/runs/${args.runId}`]);
  const jobs = ghJson(['api', `repos/${args.repo}/actions/runs/${args.runId}/jobs`]);
  const stepSummary = summarizeRegistrySteps(jobs);
  const verdict = inferVerdict(stepSummary, args.publicProofUrl, args.smitheryUrl);
  process.stdout.write(renderVerdictPacket({ run, stepSummary, publicProofUrl: args.publicProofUrl, smitheryUrl: args.smitheryUrl, verdict }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
