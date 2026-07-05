import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerTools } from './tools/index.js';

export interface CreateServerOptions {
  ledgerPath?: string;
}

export function createServer(options: CreateServerOptions = {}): McpServer {
  const server = new McpServer({
    name: 'agent-claim-mcp',
    version: '1.0.1',
  });

  registerTools(server, options.ledgerPath);
  return server;
}

export const createSandboxServer = createServer;
