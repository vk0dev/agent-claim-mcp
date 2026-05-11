import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const README_PATH = path.join(process.cwd(), 'README.md');

function readme() {
  return readFileSync(README_PATH, 'utf8');
}

describe('README milestone truth', () => {
  it('keeps the npm-live vs registry-pending split and the narrow product wedge truthful', () => {
    const text = readme();

    expect(text).toContain('Release status: `@vk0/agent-claim-mcp@1.0.0` is live on npm');
    expect(text).toContain('Official MCP Registry validation is still pending');
    expect(text).toContain('do not describe the package as registry-accepted or marketplace-listed');
    expect(text).toContain('the product wedge stays narrow');

    expect(text).toContain('three bounded actions only: claim normalized paths, inspect who owns them, and release by path or claim id');
    expect(text).toContain('Claims live in a local ledger on disk');
    expect(text).toContain('same worktree');
    expect(text).toContain('It is not a hosted lock service, queue, or scheduler');
    expect(text).toContain('do **not** want a bundled rules engine, queue runner, or orchestration platform');

    expect(text).not.toContain('Official MCP Registry acceptance is complete');
    expect(text).not.toContain('registry-accepted today');
    expect(text).toContain('rather than marketplace-verified');
    expect(text).not.toContain('orchestration platform for multi-agent workflows');
  });
});
