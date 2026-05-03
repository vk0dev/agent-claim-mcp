# Agent Claim MCP

[![npm](https://img.shields.io/npm/v/@vk0/agent-claim-mcp)](https://www.npmjs.com/package/@vk0/agent-claim-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Use Agent Claim MCP when multiple coding agents share one worktree and you need a tiny local coordination primitive before edits, not a full orchestration framework. It gives agents one job: claim paths, detect collisions, and release ownership so parallel work stops stomping the same files.

Agent Claim MCP is a local-first MCP server for Claude Code, Cursor, Cline, and other MCP clients that need file ownership coordination without queues, planners, or custom AGENTS.md conventions.

## Why / When to use

Choose this server when your workflow already has task routing, but still needs a simple lock-like primitive at edit time:

- two or more agents can touch the same repo in parallel
- you want collision detection before file edits, not after merge conflicts
- you want claims to expire automatically with TTLs
- you want a narrow primitive that another agent can understand from name + description alone
- you do **not** want a bundled rules engine, queue runner, or orchestration platform

## Install

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

## Tools

### `claim_files`

Create or refresh a local file-claim entry so parallel agents can see ownership before editing and avoid stomping the same worktree paths during active tasks.

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

Only the current owner can release an active claim, whether you target it by `claimId` or by `paths`.

### `whose_claim`

Read the local ledger and explain whether a file path is free or currently claimed, including owner, task, note, and expiry metadata for safe coordination.

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

## Comparison

| Tool | Best at | Where Agent Claim MCP is different |
| --- | --- | --- |
| **Agent Claim MCP** | One narrow coordination primitive for shared worktrees | It only answers: who owns this path, can I claim it, and can I release it? |
| **madebyaris/agent-orchestration** | Broader orchestration patterns, rules, routing, queues, and AGENTS.md-style coordination | Agent Claim MCP does much less on purpose. It does not bundle queueing, planner behavior, or repo policy. It is the smallest local primitive you can compose into another workflow. |

**Choose Agent Claim MCP** when you already have your own tasking layer and only need path ownership coordination.

**Choose a broader orchestration project** when you want one package to define agent rules, work queues, coordination policy, and higher-level execution flow.

## How it works

- claims are stored in a local JSON ledger at `~/.agent-claim-mcp/ledger.json`
- paths are normalized to absolute paths so different agents cannot dodge collisions with relative path tricks
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

## License

[MIT](./LICENSE)
