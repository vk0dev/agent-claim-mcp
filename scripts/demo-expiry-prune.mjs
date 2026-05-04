#!/usr/bin/env node
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const packageRoot = process.cwd();
const serverEntry = path.join(packageRoot, 'dist', 'server.js');

const out = async (line = '', ms = 450) => {
  process.stdout.write(`${line}\n`);
  await sleep(ms);
};

async function main() {
  const ledgerDir = await mkdtemp(path.join(os.tmpdir(), 'agent-claim-expiry-demo-'));
  const ledgerPath = path.join(ledgerDir, 'ledger.json');

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverEntry],
    cwd: packageRoot,
    env: { ...process.env, AGENT_CLAIM_LEDGER_PATH: ledgerPath },
    stderr: 'inherit',
  });

  const client = new Client({ name: 'agent-claim-expiry-demo', version: '1.0.0' });
  await client.connect(transport);

  try {
    await out(`${DIM}# One short-lived claim expires, then a second agent reclaims the same path.${RESET}`, 1100);
    await out(`${BOLD}$ claim_files agent=coder-a path=src/cache.ts ttlSeconds=1${RESET}`, 700);

    const first = await client.callTool({
      name: 'claim_files',
      arguments: { agentId: 'coder-a', taskId: 'task-expire', paths: ['src/cache.ts'], ttlSeconds: 1, cwd: '/repo' },
    });
    const claim = first.structuredContent;
    await out(`${GREEN}${BOLD}>>> short-lived claim${RESET} ${JSON.stringify({ ok: claim.ok, claimed: claim.claimed, claimedUntil: claim.claimedUntil }, null, 2)}`, 1300);
    await out();

    await out(`${BOLD}$ wait 1.2s for TTL expiry${RESET}`, 500);
    await sleep(1200);
    await out(`${YELLOW}${BOLD}>>> expired${RESET} original claim should now be prunable on the next read/write`, 1100);
    await out();

    await out(`${BOLD}$ whose_claim paths=src/cache.ts${RESET}`, 700);
    const second = await client.callTool({
      name: 'whose_claim',
      arguments: { paths: ['src/cache.ts'], cwd: '/repo' },
    });
    const whose = second.structuredContent;
    await out(`${CYAN}${BOLD}>>> pruned view${RESET} ${JSON.stringify(whose, null, 2)}`, 1300);
    await out();

    await out(`${BOLD}$ claim_files agent=coder-b path=src/cache.ts${RESET}`, 700);
    const third = await client.callTool({
      name: 'claim_files',
      arguments: { agentId: 'coder-b', taskId: 'task-reclaim', paths: ['src/cache.ts'], cwd: '/repo' },
    });
    const reclaim = third.structuredContent;
    await out(`${GREEN}${BOLD}>>> reclaimed cleanly${RESET} ${JSON.stringify({ ok: reclaim.ok, claimed: reclaim.claimed, conflicts: reclaim.conflicts }, null, 2)}`, 1400);
    await out();
    await out(`${GREEN}${BOLD}Decision first:${RESET} expired claims disappear without manual ledger surgery, so the next agent can continue safely.`, 1600);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
