import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const cwd = process.cwd();
const ledgerDir = await mkdtemp(path.join(os.tmpdir(), 'agent-claim-smoke-'));
const ledgerPath = path.join(ledgerDir, 'ledger.json');

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['dist/server.js'],
  cwd,
  env: { ...process.env, AGENT_CLAIM_LEDGER_PATH: ledgerPath },
  stderr: 'inherit',
});

const client = new Client({ name: 'smoke-test', version: '0.1.0' });

async function run() {
  await client.connect(transport);

  const tools = await client.listTools();
  const toolNames = tools.tools.map((tool) => tool.name).sort();
  console.log('Tools discovered:', toolNames);

  const expected = ['claim_files', 'release_claim', 'whose_claim'];
  if (JSON.stringify(toolNames) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected tool list: ${JSON.stringify(toolNames)}`);
  }

  const claim = await client.callTool({
    name: 'claim_files',
    arguments: { agentId: 'smoke-agent-a', paths: ['src/smoke.ts'], cwd: '/repo' },
  });
  console.log('claim_files:', JSON.stringify(claim.structuredContent ?? claim.content, null, 2));

  const overlap = await client.callTool({
    name: 'claim_files',
    arguments: { agentId: 'smoke-agent-b', paths: ['src/smoke.ts', 'src/other.ts'], cwd: '/repo' },
  });
  console.log('claim_files overlap:', JSON.stringify(overlap.structuredContent ?? overlap.content, null, 2));

  const whose = await client.callTool({
    name: 'whose_claim',
    arguments: { paths: ['src/smoke.ts', 'src/other.ts'], cwd: '/repo' },
  });
  console.log('whose_claim:', JSON.stringify(whose.structuredContent ?? whose.content, null, 2));

  const release = await client.callTool({
    name: 'release_claim',
    arguments: { agentId: 'smoke-agent-a', paths: ['src/smoke.ts'], cwd: '/repo' },
  });
  console.log('release_claim:', JSON.stringify(release.structuredContent ?? release.content, null, 2));

  if (!claim.structuredContent?.ok) {
    throw new Error('Expected first claim to succeed');
  }

  if (overlap.structuredContent?.ok !== false) {
    throw new Error('Expected overlapping second claim to fail deterministically');
  }

  if (JSON.stringify(overlap.structuredContent.conflicts) !== JSON.stringify([
    {
      path: '/repo/src/smoke.ts',
      ownerAgentId: 'smoke-agent-a',
      expiresAt: overlap.structuredContent.conflicts?.[0]?.expiresAt,
    },
  ])) {
    throw new Error(`Unexpected overlap conflicts: ${JSON.stringify(overlap.structuredContent.conflicts)}`);
  }

  if (whose.structuredContent?.results?.[0]?.claimed !== false || whose.structuredContent?.results?.[1]?.ownerAgentId !== 'smoke-agent-a') {
    throw new Error(`Unexpected whose_claim overlap state: ${JSON.stringify(whose.structuredContent)}`);
  }

  if (release.structuredContent?.ok !== true) {
    throw new Error('Expected owner release to succeed');
  }

  await client.close();
  console.log('Smoke test passed!');
}

run().catch(async (error) => {
  console.error('Smoke test failed:', error instanceof Error ? error.stack ?? error.message : String(error));
  try {
    await client.close();
  } catch {}
  process.exit(1);
});
