import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { createServer } from './createServer.js';

async function main(): Promise<void> {
  const server = createServer({ ledgerPath: process.env.AGENT_CLAIM_LEDGER_PATH });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
