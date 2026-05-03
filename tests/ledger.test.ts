import { mkdtemp, readFile, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  LedgerConflictError,
  LedgerOwnershipError,
  claimPaths,
  loadLedger,
  releaseClaim,
} from '../src/ledger.js';

async function makeLedgerPath(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'agent-claim-ledger-'));
  return path.join(dir, 'ledger.json');
}

describe('ledger backend', () => {
  it('initializes an empty ledger on first read', async () => {
    const ledgerPath = await makeLedgerPath();

    const ledger = await loadLedger({ ledgerPath, now: '2026-05-03T00:00:00.000Z' });

    expect(ledger.version).toBe(1);
    expect(ledger.claims).toEqual([]);
    expect(ledger.updatedAt).toBe('2026-05-03T00:00:00.000Z');

    const saved = JSON.parse(await readFile(ledgerPath, 'utf8')) as { version: number; claims: unknown[] };
    expect(saved.version).toBe(1);
    expect(saved.claims).toEqual([]);
  });

  it('prunes expired claims when loading', async () => {
    const ledgerPath = await makeLedgerPath();

    await claimPaths(
      {
        claimId: 'expired-claim',
        agentId: 'coder-a',
        cwd: '/repo',
        paths: ['src/a.ts'],
        claimedAt: '2026-05-03T00:00:00.000Z',
        expiresAt: '2026-05-03T00:10:00.000Z',
      },
      { ledgerPath, now: '2026-05-03T00:00:00.000Z' },
    );

    await claimPaths(
      {
        claimId: 'live-claim',
        agentId: 'coder-b',
        cwd: '/repo',
        paths: ['src/b.ts'],
        claimedAt: '2026-05-03T00:00:00.000Z',
        expiresAt: '2026-05-03T01:00:00.000Z',
      },
      { ledgerPath, now: '2026-05-03T00:00:00.000Z' },
    );

    const ledger = await loadLedger({ ledgerPath, now: '2026-05-03T00:30:00.000Z' });

    expect(ledger.claims.map((claim) => claim.claimId)).toEqual(['live-claim']);
  });

  it('overwrites atomically through tmp plus rename', async () => {
    const ledgerPath = await makeLedgerPath();

    await claimPaths(
      {
        claimId: 'claim-1',
        agentId: 'coder-a',
        cwd: '/repo',
        paths: ['src/a.ts'],
        claimedAt: '2026-05-03T00:00:00.000Z',
        expiresAt: '2026-05-03T01:00:00.000Z',
      },
      { ledgerPath, now: '2026-05-03T00:00:00.000Z' },
    );

    await claimPaths(
      {
        claimId: 'claim-2',
        agentId: 'coder-b',
        cwd: '/repo',
        paths: ['src/b.ts'],
        claimedAt: '2026-05-03T00:05:00.000Z',
        expiresAt: '2026-05-03T01:05:00.000Z',
      },
      { ledgerPath, now: '2026-05-03T00:05:00.000Z' },
    );

    const tmpPath = `${ledgerPath}.tmp`;
    await expect(stat(tmpPath)).rejects.toThrow();

    const saved = JSON.parse(await readFile(ledgerPath, 'utf8')) as { claims: Array<{ claimId: string }> };
    expect(saved.claims.map((claim) => claim.claimId)).toEqual(['claim-1', 'claim-2']);
  });

  it('rejects release by a non-owner agent', async () => {
    const ledgerPath = await makeLedgerPath();

    await claimPaths(
      {
        claimId: 'claim-1',
        agentId: 'coder-a',
        cwd: '/repo',
        paths: ['src/a.ts'],
        claimedAt: '2026-05-03T00:00:00.000Z',
        expiresAt: '2026-05-03T01:00:00.000Z',
      },
      { ledgerPath, now: '2026-05-03T00:00:00.000Z' },
    );

    await expect(
      releaseClaim({ claimId: 'claim-1', agentId: 'coder-b' }, { ledgerPath, now: '2026-05-03T00:10:00.000Z' }),
    ).rejects.toBeInstanceOf(LedgerOwnershipError);

    const ledger = await loadLedger({ ledgerPath, now: '2026-05-03T00:10:00.000Z' });
    expect(ledger.claims.map((claim) => claim.claimId)).toEqual(['claim-1']);
  });

  it('enforces multi-path claims as all-or-nothing', async () => {
    const ledgerPath = await makeLedgerPath();

    await claimPaths(
      {
        claimId: 'claim-1',
        agentId: 'coder-a',
        cwd: '/repo',
        paths: ['src/shared.ts'],
        claimedAt: '2026-05-03T00:00:00.000Z',
        expiresAt: '2026-05-03T01:00:00.000Z',
      },
      { ledgerPath, now: '2026-05-03T00:00:00.000Z' },
    );

    await expect(
      claimPaths(
        {
          claimId: 'claim-2',
          agentId: 'coder-b',
          cwd: '/repo',
          paths: ['src/shared.ts', 'src/new.ts'],
          claimedAt: '2026-05-03T00:05:00.000Z',
          expiresAt: '2026-05-03T01:05:00.000Z',
        },
        { ledgerPath, now: '2026-05-03T00:05:00.000Z' },
      ),
    ).rejects.toBeInstanceOf(LedgerConflictError);

    const ledger = await loadLedger({ ledgerPath, now: '2026-05-03T00:05:00.000Z' });
    expect(ledger.claims).toHaveLength(1);
    expect(ledger.claims[0]?.claimId).toBe('claim-1');
    expect(ledger.claims[0]?.paths).toEqual(['/repo/src/shared.ts']);
  });
});
