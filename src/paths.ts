import os from 'node:os';
import path from 'node:path';

export const LEDGER_DIRNAME = '.agent-claim-mcp';
export const LEDGER_FILENAME = 'ledger.json';

export function getDefaultLedgerPath(homeDir = os.homedir()): string {
  return path.join(homeDir, LEDGER_DIRNAME, LEDGER_FILENAME);
}

export function normalizeClaimPaths(paths: string[], cwd?: string): string[] {
  const resolved = paths.map((entry) => {
    if (path.isAbsolute(entry)) {
      return path.normalize(entry);
    }

    const base = cwd ? path.resolve(cwd) : process.cwd();
    return path.normalize(path.resolve(base, entry));
  });

  return [...new Set(resolved)].sort();
}
