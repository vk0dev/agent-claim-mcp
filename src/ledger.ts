import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { getDefaultLedgerPath, normalizeClaimPaths } from './paths.js';

export interface ClaimRecord {
  claimId: string;
  agentId: string;
  taskId?: string;
  cwd?: string;
  paths: string[];
  note?: string;
  claimedAt: string;
  expiresAt: string;
}

export interface ClaimLedger {
  version: 1;
  updatedAt: string;
  claims: ClaimRecord[];
}

export interface LoadLedgerOptions {
  ledgerPath?: string;
  now?: string;
}

export interface ClaimInput {
  claimId: string;
  agentId: string;
  taskId?: string;
  cwd?: string;
  paths: string[];
  note?: string;
  claimedAt: string;
  expiresAt: string;
}

export interface ReleaseInput {
  claimId: string;
  agentId: string;
}

export class LedgerConflictError extends Error {
  constructor(message: string, readonly conflicts: ClaimRecord[]) {
    super(message);
    this.name = 'LedgerConflictError';
  }
}

export class LedgerOwnershipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LedgerOwnershipError';
  }
}

export async function loadLedger(options: LoadLedgerOptions = {}): Promise<ClaimLedger> {
  const ledgerPath = options.ledgerPath ?? getDefaultLedgerPath();
  const now = options.now ?? new Date().toISOString();

  const ledger = await readOrInitLedger(ledgerPath, now);
  const pruned = pruneExpiredClaims(ledger, now);

  if (pruned.changed) {
    await persistLedger(ledgerPath, pruned.ledger);
  }

  return pruned.ledger;
}

export async function claimPaths(input: ClaimInput, options: LoadLedgerOptions = {}): Promise<ClaimLedger> {
  const ledgerPath = options.ledgerPath ?? getDefaultLedgerPath();
  const now = options.now ?? input.claimedAt;
  const ledger = await loadLedger({ ledgerPath, now });
  const normalizedPaths = normalizeClaimPaths(input.paths, input.cwd);

  const conflicts = ledger.claims.filter((claim) => claim.paths.some((entry) => normalizedPaths.includes(entry)));
  if (conflicts.length > 0) {
    throw new LedgerConflictError('One or more requested paths are already claimed.', conflicts);
  }

  const nextLedger: ClaimLedger = {
    version: 1,
    updatedAt: now,
    claims: [
      ...ledger.claims,
      {
        claimId: input.claimId,
        agentId: input.agentId,
        taskId: input.taskId,
        cwd: input.cwd,
        paths: normalizedPaths,
        note: input.note,
        claimedAt: input.claimedAt,
        expiresAt: input.expiresAt,
      },
    ],
  };

  await persistLedger(ledgerPath, nextLedger);
  return nextLedger;
}

export async function releaseClaim(input: ReleaseInput, options: LoadLedgerOptions = {}): Promise<ClaimLedger> {
  const ledgerPath = options.ledgerPath ?? getDefaultLedgerPath();
  const now = options.now ?? new Date().toISOString();
  const ledger = await loadLedger({ ledgerPath, now });
  const target = ledger.claims.find((claim) => claim.claimId === input.claimId);

  if (!target) {
    return ledger;
  }

  if (target.agentId !== input.agentId) {
    throw new LedgerOwnershipError(`Claim ${input.claimId} belongs to ${target.agentId}, not ${input.agentId}.`);
  }

  const nextLedger: ClaimLedger = {
    version: 1,
    updatedAt: now,
    claims: ledger.claims.filter((claim) => claim.claimId !== input.claimId),
  };

  await persistLedger(ledgerPath, nextLedger);
  return nextLedger;
}

async function readOrInitLedger(ledgerPath: string, now: string): Promise<ClaimLedger> {
  try {
    const raw = await readFile(ledgerPath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<ClaimLedger>;

    return {
      version: 1,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : now,
      claims: Array.isArray(parsed.claims) ? parsed.claims.map(normalizeClaimRecord) : [],
    };
  } catch (error) {
    if (!isNotFound(error)) {
      throw error;
    }
  }

  const emptyLedger: ClaimLedger = { version: 1, updatedAt: now, claims: [] };
  await persistLedger(ledgerPath, emptyLedger);
  return emptyLedger;
}

function pruneExpiredClaims(ledger: ClaimLedger, now: string): { ledger: ClaimLedger; changed: boolean } {
  const nextClaims = ledger.claims.filter((claim) => claim.expiresAt > now);
  const changed = nextClaims.length !== ledger.claims.length;

  return {
    changed,
    ledger: changed
      ? {
          version: 1,
          updatedAt: now,
          claims: nextClaims,
        }
      : ledger,
  };
}

function normalizeClaimRecord(record: ClaimRecord): ClaimRecord {
  return {
    ...record,
    paths: [...record.paths].sort(),
  };
}

async function persistLedger(ledgerPath: string, ledger: ClaimLedger): Promise<void> {
  await mkdir(path.dirname(ledgerPath), { recursive: true });
  const tmpPath = `${ledgerPath}.tmp`;
  const payload = `${JSON.stringify(ledger, null, 2)}\n`;

  await writeFile(tmpPath, payload, 'utf8');
  await rename(tmpPath, ledgerPath);
}

function isNotFound(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'ENOENT');
}
