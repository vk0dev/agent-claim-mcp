import { execFile } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { beforeAll, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repoCwd = '/Users/vkdev/projects/agent-claim-mcp';

async function makeLedgerPath(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'agent-claim-tools-'));
  return path.join(dir, 'ledger.json');
}

async function connectClient(ledgerPath: string): Promise<Client> {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/server.js'],
    cwd: repoCwd,
    env: { ...process.env, AGENT_CLAIM_LEDGER_PATH: ledgerPath },
    stderr: 'inherit',
  });
  const client = new Client({ name: 'agent-claim-mcp-tests', version: '1.0.0' });
  await client.connect(transport);
  return client;
}

beforeAll(async () => {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath) {
    await execFileAsync('node', [npmExecPath, 'run', 'build'], { cwd: repoCwd, env: process.env });
    return;
  }

  await execFileAsync('npm', ['run', 'build'], { cwd: repoCwd, env: process.env });
});

describe.sequential('agent claim MCP tools', () => {
  it('claims files on the happy path and exposes all registered tool names', async () => {
    const ledgerPath = await makeLedgerPath();
    const client = await connectClient(ledgerPath);

    try {
      const tools = await client.listTools();
      expect(tools.tools.map((tool) => tool.name).sort()).toEqual(['claim_files', 'release_claim', 'whose_claim']);

      const result = await client.callTool({
        name: 'claim_files',
        arguments: {
          agentId: 'coder-a',
          taskId: 'task-1',
          paths: ['src/a.ts', 'src/b.ts'],
          ttlSeconds: 600,
          note: 'pairing slice',
          cwd: '/repo',
        },
      });

      expect(result.structuredContent).toMatchObject({
        ok: true,
        claimed: ['/repo/src/a.ts', '/repo/src/b.ts'],
        conflicts: [],
        ledgerVersion: 1,
      });
      expect((result.structuredContent as { claimedUntil: string }).claimedUntil).toMatch(/Z$/);
    } finally {
      await client.close();
    }
  });

  it('rejects a collision without partial writes', async () => {
    const ledgerPath = await makeLedgerPath();
    const client = await connectClient(ledgerPath);

    try {
      await client.callTool({
        name: 'claim_files',
        arguments: {
          agentId: 'coder-a',
          paths: ['src/shared.ts'],
          cwd: '/repo',
        },
      });

      const collision = await client.callTool({
        name: 'claim_files',
        arguments: {
          agentId: 'coder-b',
          paths: ['src/shared.ts', 'src/new.ts'],
          cwd: '/repo',
        },
      });

      expect(collision.structuredContent).toEqual({
        ok: false,
        claimed: [],
        conflicts: [
          {
            path: '/repo/src/shared.ts',
            ownerAgentId: 'coder-a',
            expiresAt: expect.any(String),
          },
        ],
        ledgerVersion: 1,
        claimedUntil: expect.any(String),
      });

      const whose = await client.callTool({
        name: 'whose_claim',
        arguments: { paths: ['src/shared.ts', 'src/new.ts'], cwd: '/repo' },
      });

      expect(whose.structuredContent).toEqual({
        ledgerVersion: 1,
        results: [
          {
            path: '/repo/src/new.ts',
            claimed: false,
          },
          {
            path: '/repo/src/shared.ts',
            claimed: true,
            ownerAgentId: 'coder-a',
            taskId: undefined,
            note: undefined,
            expiresAt: expect.any(String),
            claimId: expect.any(String),
          },
        ],
      });
    } finally {
      await client.close();
    }
  });

  it('reads back owner, task, note, and expiry metadata via whose_claim', async () => {
    const ledgerPath = await makeLedgerPath();
    const client = await connectClient(ledgerPath);

    try {
      await client.callTool({
        name: 'claim_files',
        arguments: {
          agentId: 'coder-a',
          taskId: 'task-42',
          paths: ['src/report.ts'],
          note: 'metadata check',
          cwd: '/repo',
        },
      });

      const whose = await client.callTool({
        name: 'whose_claim',
        arguments: { paths: ['src/report.ts'], cwd: '/repo' },
      });

      expect(whose.structuredContent).toEqual({
        ledgerVersion: 1,
        results: [
          {
            path: '/repo/src/report.ts',
            claimed: true,
            ownerAgentId: 'coder-a',
            taskId: 'task-42',
            note: 'metadata check',
            expiresAt: expect.any(String),
            claimId: expect.any(String),
          },
        ],
      });
    } finally {
      await client.close();
    }
  });

  it('keeps multi-path claims all-or-nothing when a mixed request collides', async () => {
    const ledgerPath = await makeLedgerPath();
    const client = await connectClient(ledgerPath);

    try {
      await client.callTool({
        name: 'claim_files',
        arguments: {
          agentId: 'coder-a',
          paths: ['src/owned.ts'],
          cwd: '/repo',
        },
      });

      await client.callTool({
        name: 'claim_files',
        arguments: {
          agentId: 'coder-b',
          paths: ['src/owned.ts', 'src/fresh.ts'],
          cwd: '/repo',
        },
      });

      const whose = await client.callTool({
        name: 'whose_claim',
        arguments: { paths: ['src/owned.ts', 'src/fresh.ts'], cwd: '/repo' },
      });

      expect(whose.structuredContent).toEqual({
        ledgerVersion: 1,
        results: [
          { path: '/repo/src/fresh.ts', claimed: false },
          {
            path: '/repo/src/owned.ts',
            claimed: true,
            ownerAgentId: 'coder-a',
            taskId: undefined,
            note: undefined,
            expiresAt: expect.any(String),
            claimId: expect.any(String),
          },
        ],
      });
    } finally {
      await client.close();
    }
  });

  it('smoke tests claim, inspect, and release end-to-end over stdio MCP transport', async () => {
    const ledgerPath = await makeLedgerPath();
    const client = await connectClient(ledgerPath);

    try {
      const claim = await client.callTool({
        name: 'claim_files',
        arguments: { agentId: 'coder-a', paths: ['src/smoke.ts'], cwd: '/repo' },
      });
      expect(claim.structuredContent).toMatchObject({ ok: true, claimed: ['/repo/src/smoke.ts'] });

      const whose = await client.callTool({
        name: 'whose_claim',
        arguments: { paths: ['src/smoke.ts'], cwd: '/repo' },
      });
      expect(whose.structuredContent).toMatchObject({
        results: [{ path: '/repo/src/smoke.ts', claimed: true, ownerAgentId: 'coder-a' }],
      });

      const release = await client.callTool({
        name: 'release_claim',
        arguments: { agentId: 'coder-a', paths: ['src/smoke.ts'], cwd: '/repo' },
      });
      expect(release.structuredContent).toEqual({
        ok: true,
        released: ['/repo/src/smoke.ts'],
        missing: [],
        ledgerVersion: 1,
      });
    } finally {
      await client.close();
    }
  });
});
