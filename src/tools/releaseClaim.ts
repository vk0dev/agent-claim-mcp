import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { LedgerOwnershipError, loadLedger, releaseClaim } from '../ledger.js';
import { normalizeClaimPaths } from '../paths.js';

export const releaseClaimDescription =
  'Remove an existing claim owned by the current agent so finished, paused, or reassigned work stops blocking other agents from safely editing the same paths.';

const inputSchema = {
  agentId: z.string().min(1),
  claimId: z.string().min(1).optional(),
  paths: z.array(z.string().min(1)).min(1).optional(),
  cwd: z.string().min(1).optional(),
};

export function registerReleaseClaimTool(server: McpServer, ledgerPath?: string): void {
  server.registerTool('release_claim', { description: releaseClaimDescription, inputSchema }, async (input) => {
    const before = await loadLedger({ ledgerPath });
    const targetPaths = input.paths ? normalizeClaimPaths(input.paths, input.cwd) : [];
    const matchingClaims = before.claims.filter((claim) => {
      if (input.claimId) {
        return claim.claimId === input.claimId;
      }

      return targetPaths.some((entry) => claim.paths.includes(entry));
    });

    try {
      const ledger = await releaseClaim(input, { ledgerPath });
      const released = input.claimId
        ? matchingClaims.flatMap((claim) => claim.paths)
        : targetPaths.filter((entry) => matchingClaims.some((claim) => claim.paths.includes(entry)));
      const missing = input.claimId
        ? matchingClaims.length === 0
          ? [input.claimId]
          : []
        : targetPaths.filter((entry) => !matchingClaims.some((claim) => claim.paths.includes(entry)));
      const output = { ok: true, released, missing, ledgerVersion: ledger.version };

      return {
        content: [{ type: 'text', text: JSON.stringify(output) }],
        structuredContent: output,
      };
    } catch (error) {
      if (error instanceof LedgerOwnershipError) {
        const output = {
          ok: false,
          released: [] as string[],
          missing: input.claimId ? [] : targetPaths,
          ledgerVersion: before.version,
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(output) }],
          structuredContent: output,
        };
      }

      throw error;
    }
  });
}
