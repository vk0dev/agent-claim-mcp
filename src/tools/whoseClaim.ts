import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { inspectClaims, loadLedger, loadLedgerSnapshot } from '../ledger.js';

export const whoseClaimDescription =
  'Read the local ledger and explain whether a file path is free or currently claimed, including owner, task, note, and expiry metadata for safe coordination.';

const inputSchema = {
  paths: z.array(z.string().min(1)).min(1),
  cwd: z.string().min(1).optional(),
  includeExpired: z.boolean().optional(),
};

export function registerWhoseClaimTool(server: McpServer, ledgerPath?: string): void {
  server.registerTool('whose_claim', { description: whoseClaimDescription, inputSchema }, async (input) => {
    const ledger = input.includeExpired ? await loadLedgerSnapshot({ ledgerPath }) : await loadLedger({ ledgerPath });
    const output = {
      results: inspectClaims(ledger, input.paths, input.cwd),
      ledgerVersion: ledger.version,
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(output) }],
      structuredContent: output,
    };
  });
}
