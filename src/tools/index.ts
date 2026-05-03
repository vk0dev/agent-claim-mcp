import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerClaimFilesTool } from './claimFiles.js';
import { registerReleaseClaimTool } from './releaseClaim.js';
import { registerWhoseClaimTool } from './whoseClaim.js';

export function registerTools(server: McpServer, ledgerPath?: string): void {
  registerClaimFilesTool(server, ledgerPath);
  registerReleaseClaimTool(server, ledgerPath);
  registerWhoseClaimTool(server, ledgerPath);
}
