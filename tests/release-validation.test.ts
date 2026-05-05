import { describe, expect, it } from 'vitest';

import { validateReleaseMetadata } from '../src/releaseValidation.js';

describe('validateReleaseMetadata', () => {
  it('accepts aligned package and server publish metadata', () => {
    expect(
      validateReleaseMetadata(
        { name: '@vk0/agent-claim-mcp', version: '1.0.0' },
        {
          name: 'io.github.vk0dev/agent-claim-mcp',
          version: '1.0.0',
          packages: [
            {
              identifier: '@vk0/agent-claim-mcp',
              version: '1.0.0',
              transport: { type: 'stdio' },
            },
          ],
        },
      ),
    ).toEqual([]);
  });

  it('reports mismatched packaged publish metadata clearly', () => {
    expect(
      validateReleaseMetadata(
        { name: '@vk0/agent-claim-mcp', version: '1.0.0' },
        {
          name: 'io.github.vk0dev/agent-claim-mcp',
          version: '1.0.1',
          packages: [
            {
              identifier: '@vk0/wrong-name',
              version: '1.0.2',
              transport: { type: 'http' },
            },
          ],
        },
      ),
    ).toEqual([
      'server.json version 1.0.1 must match package.json version 1.0.0',
      'server.json package identifier @vk0/wrong-name must match package.json name @vk0/agent-claim-mcp',
      'server.json package version 1.0.2 must match package.json version 1.0.0',
      'server.json package transport.type http must be stdio',
    ]);
  });
});
