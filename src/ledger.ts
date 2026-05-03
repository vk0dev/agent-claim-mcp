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
  claimId?: string;
  agentId: string;
  cwd?: string;
  paths?: string[];
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

export async function loadLedgerSnapshot(options: LoadLedgerOptions = {}): Promise<ClaimLedger> {
  const ledgerPath = options.ledgerPath ?? getDefaultLedgerPath();
  const now = options.now ?? new Date().toISOString();
  return readOrInitLedger(ledgerPath, now);
}

export async function claimPaths(input: ClaimInput, options: LoadLedgerOptions = {}): Promise<ClaimLedger> {
  const ledgerPath = options.ledgerPath ?? getDefaultLedgerPath();
  const now = options.now ?? input.claimedAt;
  const ledger = await loadLedger({ ledgerPath, now });
  const normalizedPaths = normalizeClaimPaths(input.paths, input.cwd);
  const conflicts = ledger.claims.filter((claim) => claim.agentId !== input.agentId && claim.paths.some((entry) => normalizedPaths.includes(entry)));

  if (conflicts.length > 0) {
    throw new LedgerConflictError('One or more requested paths are already claimed by another active owner.', conflicts);
  }

  const retainedClaims = ledger.claims.filter(
    (claim) => !(claim.agentId === input.agentId && samePaths(claim.paths, normalizedPaths)),
  );

  const nextLedger: ClaimLedger = {
    version: 1,
    updatedAt: now,
    claims: [
      ...retainedClaims,
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
  const targets = resolveReleaseTargets(ledger, input);

  if (targets.length === 0) {
    return ledger;
  }

  for (const target of targets) {
    if (target.agentId !== input.agentId) {
      throw new LedgerOwnershipError(`Claim ${target.claimId} belongs to ${target.agentId}, not ${input.agentId}.`);
    }
  }

  const targetIds = new Set(targets.map((claim) => claim.claimId));
  const nextLedger: ClaimLedger = {
    version: 1,
    updatedAt: now,
    claims: ledger.claims.filter((claim) => !targetIds.has(claim.claimId)),
  };

  await persistLedger(ledgerPath, nextLedger);
  return nextLedger;
}

export function inspectClaims(
  ledger: ClaimLedger,
  paths: string[],
  cwd?: string,
): Array<{
  path: string;
  claimed: boolean;
  ownerAgentId?: string;
  taskId?: string;
  note?: string;
  expiresAt?: string;
  claimId?: string;
}> {
  const normalizedPaths = normalizeClaimPaths(paths, cwd);

  return normalizedPaths.map((entry) => {
    const owner = ledger.claims.find((claim) => claim.paths.includes(entry));
    if (!owner) {
      return { path: entry, claimed: false };
    }

    return {
      path: entry,
      claimed: true,
      ownerAgentId: owner.agentId,
      taskId: owner.taskId,
      note: owner.note,
      expiresAt: owner.expiresAt,
      claimId: owner.claimId,
    };
  });
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
    ledger: changed ? { version: 1, updatedAt: now, claims: nextClaims } : ledger,
  };
}

function normalizeClaimRecord(record: ClaimRecord): ClaimRecord {
  return { ...record, paths: [...record.paths].sort() };
}

function resolveReleaseTargets(ledger: ClaimLedger, input: ReleaseInput): ClaimRecord[] {
  if (input.claimId) {
    const claim = ledger.claims.find((entry) => entry.claimId === input.claimId);
    return claim ? [claim] : [];
  }

  if (input.paths && input.paths.length > 0) {
    const normalizedPaths = normalizeClaimPaths(input.paths, input.cwd);
    return ledger.claims.filter((claim) => claim.paths.some((entry) => normalizedPaths.includes(entry)));
  }

  return [];
}

function samePaths(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((entry, index) => entry === right[index]);
}

async function persistLedger(ledgerPath: string, ledger: ClaimLedger): Promise<void> {
  await mkdir(path.dirname(ledgerPath), { recursive: true });
  const tmpPath = `${ledgerPath}.tmp`;
  await writeFile(tmpPath, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
  await rename(tmpPath, ledgerPath);
}

function isNotFound(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'ENOENT');
}
