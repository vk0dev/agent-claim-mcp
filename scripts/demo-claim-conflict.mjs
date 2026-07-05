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
  const ledgerDir = await mkdtemp(path.join(os.tmpdir(), 'agent-claim-demo-'));
  const ledgerPath = path.join(ledgerDir, 'ledger.json');

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverEntry],
    cwd: packageRoot,
    env: { ...process.env, AGENT_CLAIM_LEDGER_PATH: ledgerPath },
    stderr: 'inherit',
  });

  const client = new Client({ name: 'agent-claim-demo', version: '1.0.0' });
  await client.connect(transport);

  try {
    await out(`${DIM}# Two agents, one worktree, one file collision.${RESET}`, 1100);
    await out(`${BOLD}$ claim_files agent=coder-a path=src/parser.ts${RESET}`, 700);

    const first = await client.callTool({
      name: 'claim_files',
      arguments: { agentId: 'coder-a', taskId: 'task-42', paths: ['src/parser.ts'], note: 'parser cleanup', cwd: '/repo' },
    });
    const claim = first.structuredContent;
    await out(`${GREEN}${BOLD}>>> ok${RESET} ${JSON.stringify({ ok: claim.ok, claimed: claim.claimed, ledgerVersion: claim.ledgerVersion }, null, 2)}`, 1200);
    await out();

    await out(`${BOLD}$ claim_files agent=coder-b paths=src/parser.ts,src/tokenizer.ts${RESET}`, 800);
    const second = await client.callTool({
      name: 'claim_files',
      arguments: { agentId: 'coder-b', taskId: 'task-99', paths: ['src/parser.ts', 'src/tokenizer.ts'], cwd: '/repo' },
    });
    const overlap = second.structuredContent;
    await out(`${RED}${BOLD}>>> conflict${RESET} ${JSON.stringify({ ok: overlap.ok, conflicts: overlap.conflicts, claimed: overlap.claimed }, null, 2)}`, 1500);
    await out();

    await out(`${BOLD}$ whose_claim paths=src/parser.ts,src/tokenizer.ts${RESET}`, 700);
    const third = await client.callTool({
      name: 'whose_claim',
      arguments: { paths: ['src/parser.ts', 'src/tokenizer.ts'], cwd: '/repo' },
    });
    const whose = third.structuredContent;
    await out(`${CYAN}${BOLD}>>> owner check${RESET} ${JSON.stringify(whose, null, 2)}`, 1700);
    await out();
    await out(`${GREEN}${BOLD}Decision first:${RESET} claim before edits, avoid stomping the same file.`, 1600);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
