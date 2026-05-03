import crypto from 'node:crypto';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { claimPaths, LedgerConflictError } from '../ledger.js';
import { normalizeClaimPaths } from '../paths.js';

export const claimFilesDescription =
  'Create or refresh a local file-claim entry so parallel agents can see ownership before editing and avoid stomping the same worktree paths during active tasks.';

const inputSchema = {
  agentId: z.string().min(1).describe('Stable agent or session identifier.'),
  taskId: z.string().min(1).optional().describe('Optional task linkage for the claim.'),
  paths: z.array(z.string().min(1)).min(1).describe('One or more repo-relative or absolute paths.'),
  ttlSeconds: z.number().int().positive().optional().describe('Optional TTL in seconds, defaults to 3600.'),
  note: z.string().min(1).optional().describe('Optional human hint describing the claim.'),
  cwd: z.string().min(1).optional().describe('Optional repo root for path normalization.'),
};

export function registerClaimFilesTool(server: McpServer, ledgerPath?: string): void {
  server.registerTool('claim_files', { description: claimFilesDescription, inputSchema }, async (input) => {
    const claimedAt = new Date().toISOString();
    const ttlSeconds = input.ttlSeconds ?? 3600;
    const claimedUntil = new Date(Date.parse(claimedAt) + ttlSeconds * 1000).toISOString();

    try {
      const ledger = await claimPaths(
        {
          claimId: crypto.randomUUID(),
          agentId: input.agentId,
          taskId: input.taskId,
          cwd: input.cwd,
          paths: input.paths,
          note: input.note,
          claimedAt,
          expiresAt: claimedUntil,
        },
        { ledgerPath, now: claimedAt },
      );

      const output = {
        ok: true,
        claimed: normalizeClaimPaths(input.paths, input.cwd),
        conflicts: [] as Array<{ path: string; ownerAgentId: string; expiresAt: string }>,
        ledgerVersion: ledger.version,
        claimedUntil,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(output) }],
        structuredContent: output,
      };
    } catch (error) {
      if (error instanceof LedgerConflictError) {
        const output = {
          ok: false,
          claimed: [] as string[],
          conflicts: error.conflicts.flatMap((claim) =>
            claim.paths
              .filter((entry) => normalizeClaimPaths(input.paths, input.cwd).includes(entry))
              .map((path) => ({ path, ownerAgentId: claim.agentId, expiresAt: claim.expiresAt })),
          ),
          ledgerVersion: 1,
          claimedUntil,
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
