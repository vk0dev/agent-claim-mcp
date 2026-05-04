#!/usr/bin/env node
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
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
  const ledgerDir = await mkdtemp(path.join(os.tmpdir(), 'agent-claim-owner-release-demo-'));
  const ledgerPath = path.join(ledgerDir, 'ledger.json');

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverEntry],
    cwd: packageRoot,
    env: { ...process.env, AGENT_CLAIM_LEDGER_PATH: ledgerPath },
    stderr: 'inherit',
  });

  const client = new Client({ name: 'agent-claim-owner-release-demo', version: '1.0.0' });
  await client.connect(transport);

  try {
    await out(`${DIM}# A non-owner tries to release someone else's claim, then the real owner releases it.${RESET}`, 1100);
    await out(`${BOLD}$ claim_files agent=coder-a path=src/queue.ts${RESET}`, 700);

    const first = await client.callTool({
      name: 'claim_files',
      arguments: { agentId: 'coder-a', taskId: 'task-owner', paths: ['src/queue.ts'], cwd: '/repo' },
    });
    const claim = first.structuredContent;
    await out(`${GREEN}${BOLD}>>> owner claim${RESET} ${JSON.stringify({ ok: claim.ok, claimed: claim.claimed, ledgerVersion: claim.ledgerVersion }, null, 2)}`, 1200);
    await out();

    await out(`${BOLD}$ release_claim agent=coder-b path=src/queue.ts${RESET}`, 700);
    const second = await client.callTool({
      name: 'release_claim',
      arguments: { agentId: 'coder-b', paths: ['src/queue.ts'], cwd: '/repo' },
    });
    const rejected = second.structuredContent;
    await out(`${RED}${BOLD}>>> non-owner rejected${RESET} ${JSON.stringify(rejected, null, 2)}`, 1400);
    await out();

    await out(`${BOLD}$ whose_claim paths=src/queue.ts${RESET}`, 700);
    const third = await client.callTool({
      name: 'whose_claim',
      arguments: { paths: ['src/queue.ts'], cwd: '/repo' },
    });
    const whose = third.structuredContent;
    await out(`${CYAN}${BOLD}>>> owner still active${RESET} ${JSON.stringify(whose, null, 2)}`, 1400);
    await out();

    await out(`${BOLD}$ release_claim agent=coder-a path=src/queue.ts${RESET}`, 700);
    const fourth = await client.callTool({
      name: 'release_claim',
      arguments: { agentId: 'coder-a', paths: ['src/queue.ts'], cwd: '/repo' },
    });
    const released = fourth.structuredContent;
    await out(`${GREEN}${BOLD}>>> owner release succeeds${RESET} ${JSON.stringify(released, null, 2)}`, 1400);
    await out();
    await out(`${GREEN}${BOLD}Decision first:${RESET} only the current owner can clear a live claim, so one agent cannot silently unblock itself by releasing another agent's work.`, 1600);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
