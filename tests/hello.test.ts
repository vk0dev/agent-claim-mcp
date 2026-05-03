import { describe, expect, it } from 'vitest';

import { createSandboxServer, createServer } from '../src/createServer.js';

describe('server factory exports', () => {
  it('creates both standard and sandbox server factories', () => {
    expect(createServer()).toBeDefined();
    expect(createSandboxServer()).toBeDefined();
  });
});
