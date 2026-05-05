# Agent Claim MCP

[![npm](https://img.shields.io/npm/v/@vk0/agent-claim-mcp)](https://www.npmjs.com/package/@vk0/agent-claim-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Use Agent Claim MCP when multiple coding agents share one worktree and you need a tiny local coordination primitive before edits, not a full orchestration framework. It gives agents one job: claim paths, detect collisions, and release ownership so parallel work stops stomping the same files.

Agent Claim MCP is a local-first MCP server for Claude Code, Cursor, Cline, and other MCP clients that need file ownership coordination without queues, planners, or custom AGENTS.md conventions. The current release surface centers on three bounded actions only: claim normalized paths, inspect who owns them, and release by path or claim id with explicit conflict reporting across separate sessions.

> Temporary publish-status note: `@vk0/agent-claim-mcp` is not on npm yet until the first tagged release publishes successfully. Until that happens, `npx -y @vk0/agent-claim-mcp` will fail for external users. Early testers should run it from this local repo checkout and the workspace flow already used for internal dogfooding.

## Why / When to use

Choose this server when your workflow already has task routing, but still needs a simple lock-like primitive at edit time:

- two or more agents can touch the same repo in parallel
- you want collision detection before file edits, not after merge conflicts
- you want claims to expire automatically with TTLs
- you want a narrow primitive that another agent can understand from name + description alone
- you do **not** want a bundled rules engine, queue runner, or orchestration platform

## Installation

Until the first npm publish lands, treat the `npx -y @vk0/agent-claim-mcp` snippets below as the **post-publish** path.
For the current truthful pre-publish state, point your MCP client at this local checkout's built CLI instead:

```json
{
  "mcpServers": {
    "agent-claim": {
      "command": "node",
      "args": ["/Users/vkdev/projects/agent-claim-mcp/dist/server.js"]
    }
  }
}
```

That hardcoded path is a macOS-style local example. On Windows, point your MCP client at the built `dist/server.js` path on your own machine instead of copying the POSIX path literally.

Build once before using the local path:

```bash
cd /Users/vkdev/projects/agent-claim-mcp
npm ci
npm run build
```

After the first successful npm publish, the `npx` snippets below become the canonical external install path again.

### Claude Code

Add the stdio server to your Claude Code MCP config:

```json
{
  "mcpServers": {
    "agent-claim": {
      "command": "npx",
      "args": ["-y", "@vk0/agent-claim-mcp"]
    }
  }
}
```

### Claude Desktop

Claude Desktop uses `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS and `%APPDATA%\Claude\claude_desktop_config.json` on Windows:

```json
{
  "mcpServers": {
    "agent-claim": {
      "command": "npx",
      "args": ["-y", "@vk0/agent-claim-mcp"]
    }
  }
}
```

After saving `claude_desktop_config.json`, fully restart Claude Desktop so it reloads the MCP server configuration.

### Cursor

```json
{
  "mcpServers": {
    "agent-claim": {
      "command": "npx",
      "args": ["-y", "@vk0/agent-claim-mcp"]
    }
  }
}
```

### Cline

```json
{
  "mcpServers": {
    "agent-claim": {
      "command": "npx",
      "args": ["-y", "@vk0/agent-claim-mcp"]
    }
  }
}
```

## Limitations

This server is intentionally narrow and local-first. Install it when your agents share one filesystem view, not when you need distributed coordination.

- Claims live in a local ledger on disk, so they only coordinate sessions that can read and write the same worktree.
- It is not a hosted lock service, queue, or scheduler, and it does not replicate claims across machines by itself.
- TTL expiry is protective cleanup, not a substitute for higher-level task ownership or human review.
- Path normalization reduces shape mismatches, but agents still need to point at the same repo root or `cwd` for claims to line up.
- If your workflow needs cross-host coordination, central audit policy, or mandatory approvals, pair this server with a separate orchestration layer instead of stretching the claim ledger beyond its scope.

For a real multi-agent run before publishing, see [DOGFOOD.md](./DOGFOOD.md) and the proof artifacts in [docs/dogfood-report.md](./docs/dogfood-report.md).

## Tools

### `claim_files`

Create or refresh a local file-claim entry so parallel agents can see ownership before editing and avoid stomping the same worktree paths during active tasks. Conflict responses are explicit, so overlapping claims across separate sessions do not stay implicit or in-memory only.

**Input**

```json
{
  "agentId": "coder-a",
  "taskId": "task-123",
  "paths": ["src/foo.ts", "src/bar.ts"],
  "ttlSeconds": 3600,
  "note": "working on parser cleanup",
  "cwd": "/repo"
}
```

**Output**

```json
{
  "ok": true,
  "claimed": ["/repo/src/bar.ts", "/repo/src/foo.ts"],
  "conflicts": [],
  "ledgerVersion": 1,
  "claimedUntil": "2026-05-03T16:00:00.000Z"
}
```

If any requested path is already claimed by another active owner, the tool returns `ok: false` and writes nothing.

### `release_claim`

Remove an existing claim owned by the current agent so finished, paused, or reassigned work stops blocking other agents from safely editing the same paths.

**Input**

```json
{
  "agentId": "coder-a",
  "paths": ["src/foo.ts"],
  "cwd": "/repo"
}
```

**Output**

```json
{
  "ok": true,
  "released": ["/repo/src/foo.ts"],
  "missing": [],
  "ledgerVersion": 1
}
```

Only the current owner can release an active claim, whether you target it by `claimId` or by normalized `paths`, so cleanup works after real multi-agent runs and path-shape variants resolve consistently.

### `whose_claim`

Read the local ledger and explain whether a file path is free or currently claimed, including owner, task, note, and expiry metadata for safe coordination across separate sessions sharing the same worktree.

**Input**

```json
{
  "paths": ["src/foo.ts", "src/bar.ts"],
  "cwd": "/repo",
  "includeExpired": false
}
```

**Output**

```json
{
  "results": [
    {
      "path": "/repo/src/bar.ts",
      "claimed": false
    },
    {
      "path": "/repo/src/foo.ts",
      "claimed": true,
      "ownerAgentId": "coder-a",
      "taskId": "task-123",
      "note": "working on parser cleanup",
      "expiresAt": "2026-05-03T16:00:00.000Z",
      "claimId": "2a08b70c-4203-44a2-b833-31592472de1e"
    }
  ],
  "ledgerVersion": 1
}
```

## Real samples

### 1. coder-A claims `foo.ts`

```json
{
  "tool": "claim_files",
  "arguments": {
    "agentId": "coder-A",
    "taskId": "task-42",
    "paths": ["src/foo.ts"],
    "note": "refactoring the claim parser",
    "cwd": "/repo"
  }
}
```

```json
{
  "ok": true,
  "claimed": ["/repo/src/foo.ts"],
  "conflicts": [],
  "ledgerVersion": 1,
  "claimedUntil": "2026-05-03T16:00:00.000Z"
}
```

### 2. coder-B collides on the same file

```json
{
  "tool": "claim_files",
  "arguments": {
    "agentId": "coder-B",
    "paths": ["src/foo.ts", "src/new.ts"],
    "cwd": "/repo"
  }
}
```

```json
{
  "ok": false,
  "claimed": [],
  "conflicts": [
    {
      "path": "/repo/src/foo.ts",
      "ownerAgentId": "coder-A",
      "expiresAt": "2026-05-03T16:00:00.000Z"
    }
  ],
  "ledgerVersion": 1,
  "claimedUntil": "2026-05-03T16:00:00.000Z"
}
```

### 3. coder-A releases the file

```json
{
  "tool": "release_claim",
  "arguments": {
    "agentId": "coder-A",
    "paths": ["src/foo.ts"],
    "cwd": "/repo"
  }
}
```

```json
{
  "ok": true,
  "released": ["/repo/src/foo.ts"],
  "missing": [],
  "ledgerVersion": 1
}
```

## Troubleshooting

### `claim_files` returns `ok: false`

This means at least one requested path is already claimed by another active owner, so nothing new was written. Check the `conflicts` array for the exact overlapping normalized paths and the current `ownerAgentId`, then inspect the same paths with `whose_claim` before retrying.

```json
{
  "tool": "whose_claim",
  "arguments": {
    "paths": ["src/foo.ts", "src/new.ts"],
    "cwd": "/repo"
  }
}
```

If one path collides, a mixed request is still all-or-nothing. Split the work or wait for the current owner to release the conflicting path.

### `release_claim` with a claim id returns `missing: ["..."]`

That claim id was not active in the local ledger at release time. It may already be released, expired, or never existed on this machine. This is not treated as a partial success.

### `release_claim` with paths returns `released: []`

If `ok` is still `true` but `released` is empty, the requested normalized paths did not match any active claim owned by the caller. The `missing` array tells you which normalized paths were not matched.

Use `whose_claim` first when you are unsure whether the path is free, owned by another agent, or already gone from the ledger.

### Releasing someone else’s claim

Only the current owner can release an active claim. If another agent still owns the path, inspect it with `whose_claim`, coordinate with that owner, or wait for the TTL to expire.

## Comparison

| Tool | Best at | Where Agent Claim MCP is different |
| --- | --- | --- |
| **Agent Claim MCP** | One narrow coordination primitive for shared worktrees | It only answers: who owns this path, can I claim it, and can I release it? |
| **madebyaris/agent-orchestration** | Broader orchestration patterns, rules, routing, queues, and AGENTS.md-style coordination | Agent Claim MCP does much less on purpose. It does not bundle queueing, planner behavior, or repo policy. It is the smallest local primitive you can compose into another workflow. |

**Choose Agent Claim MCP** when you already have your own tasking layer and only need path ownership coordination.

**Choose a broader orchestration project** when you want one package to define agent rules, work queues, coordination policy, and higher-level execution flow.

## How it works

- claims are stored in a local JSON ledger at `~/.agent-claim-mcp/ledger.json`
- paths are normalized to absolute paths so different agents cannot dodge collisions with relative path tricks or path-shape variants
- overlapping claims across separate sessions resolve through the same ledger instead of relying on in-memory coordination
- expired claims are pruned automatically on reads and writes
- writes use temp-file plus rename semantics for atomic updates

## Development

```bash
npm ci
npm run build
npm test
npm run smoke
```

## Packaging

The npm package is expected to ship at least:

- `README.md`
- `server.json`
- compiled `dist/`

Use this check before release:

```bash
npm pack --dry-run
```

## Publish prerequisites

The expected publish path is the GitHub Actions release job that runs after a version tag push. For the unattended npm publish step to succeed, the workflow must receive a non-empty `NODE_AUTH_TOKEN` from the repo secret configured for npm publishing.

If `NODE_AUTH_TOKEN` is missing or empty in CI, the first npm publish attempt fails with `ENEEDAUTH` even when the package itself is ready. Before retrying a release, confirm the GitHub repository secret is present and mapped into the publish job rather than trying to re-run publish steps locally.

For the local proof path before tagging, run the short smoke checklist in [`docs/smoke-proof.md`](./docs/smoke-proof.md).

For the first post-publish external acceptance check, use the maintainer runbook in [`docs/official-registry-validation-runbook.md`](./docs/official-registry-validation-runbook.md) and the short recording template in [`docs/official-registry-validation-checklist.md`](./docs/official-registry-validation-checklist.md).

## License

[MIT](./LICENSE)
