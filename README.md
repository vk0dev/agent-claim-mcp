# Agent Claim MCP

[![npm](https://img.shields.io/npm/v/@vk0/agent-claim-mcp)](https://www.npmjs.com/package/@vk0/agent-claim-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**Languages:** English · [日本語](./README.ja.md) · [简体中文](./README.zh-CN.md) · [Русский](./README.ru.md) · [Español](./README.es.md)

Use Agent Claim MCP when multiple coding agents share one worktree and you need a tiny local coordination primitive before edits, not a full orchestration framework. It gives agents one job: claim paths, detect collisions, and release ownership so parallel work stops stomping the same files.

Agent Claim MCP is a local-first MCP server for Claude Code, Cursor, Cline, and other MCP clients that need file ownership coordination without queues, planners, or custom AGENTS.md conventions. The current release surface centers on three bounded actions only: claim normalized paths, inspect who owns them, and release by path or claim id with explicit conflict reporting across separate sessions.

> Release status: `@vk0/agent-claim-mcp@1.0.0` is live on npm, so the `npx -y @vk0/agent-claim-mcp` install path is now the truthful default for external users. Phase 5 external proof may be satisfied by either Official MCP Registry validation or a live Smithery listing, but the current proof state remains pending until one of those public artifacts is explicitly verified. Official MCP Registry validation is still pending, so do not describe the package as registry-accepted or marketplace-listed until a real registry or Smithery proof URL is cited.
>
> Milestone truth: the product wedge stays narrow, 3 tools plus a local JSON ledger for shared-worktree collision prevention, not a broader orchestration platform.
>
> Current next manual step: complete the pending human rerun and verification path for Official MCP Registry proof, then record the verdict from that run instead of assuming acceptance from npm availability.

## Registry rerun quickstart

Current truthful state:
- npm `1.0.0` is live
- Official MCP Registry acceptance is still pending
- workflow `25282612113` did not complete the registry validation path
- the repo is now past the earlier `NPM_TOKEN` secret-fix step, but the registry proof still needs a human rerun plus verification before it can be treated as accepted

Exact rerun command:

```bash
gh run rerun 25282612113 --repo vk0dev/agent-claim-mcp
```

After the rerun, verify in this order:
1. confirm the rerun completed successfully in GitHub Actions
2. run `npm run preflight:registry`
3. follow `docs/official-registry-validation-runbook.md`
4. only then record registry acceptance as proven

Operator shortcut: use the runbook's [Quick operator path](./docs/official-registry-validation-runbook.md#quick-operator-path) for the exact rerun-to-verification order, and treat npm-live status as separate from registry-proof status.

## Why / When to use

Choose this server when your workflow already has task routing, but still needs a simple lock-like primitive at edit time:

- two or more agents can touch the same repo in parallel
- you want collision detection before file edits, not after merge conflicts
- you want claims to expire automatically with TTLs
- you want a narrow primitive that another agent can understand from name + description alone
- you do **not** want a bundled rules engine, queue runner, or orchestration platform

## Installation

The canonical external install path is now the published npm package:

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

Status note: npm install is live today, but Official MCP Registry validation and Smithery/other marketplace proof are still not established, so treat the package as npm-available first rather than marketplace-verified.

If you are developing from a local checkout instead of the published package, you can still point your MCP client at the built `dist/server.js` directly.

```json
{
  "mcpServers": {
    "agent-claim": {
      "command": "node",
      "args": ["/absolute/path/to/agent-claim-mcp/dist/server.js"]
    }
  }
}
```

That second example is for local development only. On Windows, point your MCP client at the built `dist/server.js` path on your own machine instead of copying a POSIX path literally.

Build once before using the local path:

```bash
cd /Users/vkdev/projects/agent-claim-mcp
npm ci
npm run build
```

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

## FAQ

<details>
<summary><strong>When should an agent pick this over a git branch or worktree per agent?</strong></summary>

Pick claims when multiple agents intentionally share one checkout and one filesystem view — because they reuse the same `node_modules`, build artifacts, or a running dev server, or because the tasking layer already splits work by files rather than by branches. Branch-per-agent and worktree-per-agent prevent collisions by copying state and deferring conflicts to merge time; claims prevent collisions by declaring path ownership before the first edit, with no extra checkouts and no merge step. If your workflow already isolates each agent in its own branch or worktree, you may not need this server at all.
</details>

<details>
<summary><strong>How is a claim different from a real lock or from git worktree isolation?</strong></summary>

A claim is an advisory ownership record, not an enforced filesystem lock. Nothing physically prevents a misbehaving process from writing to a claimed path; enforcement is cooperative, which is exactly the contract MCP agents can follow: call `claim_files` before editing, respect `ok: false`, release when done. Worktree isolation is stronger but heavier — separate checkouts, duplicated state, and conflicts that only surface at merge. The two compose: use worktrees for long-lived parallel streams, and claims inside any single worktree that more than one agent touches.
</details>

<details>
<summary><strong>What do TTLs actually do, and what happens when a claim expires?</strong></summary>

Every claim carries a TTL (`ttlSeconds`, default 3600), and expired claims are pruned automatically on the next ledger read or write. That means a crashed, killed, or abandoned session can never block a path forever — the worst case is one TTL window. Expiry is protective cleanup, not task handoff: an agent still actively working should refresh its own claim (re-claim the same paths under the same `agentId`) instead of asking for a very long TTL up front.
</details>

<details>
<summary><strong>What exactly happens on a conflict?</strong></summary>

`claim_files` is all-or-nothing. If any requested path is already owned by another active claim, the tool returns `ok: false`, writes nothing — including the non-conflicting paths in the same request — and lists each colliding normalized path with its current `ownerAgentId` and `expiresAt` in the `conflicts` array. There is no queueing, no retry, and no forced takeover. The calling agent decides what to do next: split the batch, inspect the owner with `whose_claim`, coordinate through its own tasking layer, or wait for release or TTL expiry.
</details>

<details>
<summary><strong>Does it work across different MCP clients at the same time, like Claude Code plus Cursor?</strong></summary>

Yes, as long as all clients run on the same machine as the same user. Each MCP client spawns its own server process, but every process converges on the same on-disk ledger with atomic temp-file-plus-rename writes, so a claim made from a Claude Code session is visible to a Cursor or Cline session immediately. The one thing agents must keep consistent is path shape: pass a `cwd` or absolute paths that resolve to the same repo root, so normalization lines up across clients.
</details>

<details>
<summary><strong>Where is the state stored, and does anything leave my machine?</strong></summary>

All state lives in one local JSON ledger at `~/.agent-claim-mcp/ledger.json`. There is no daemon, no background process, no network listener, no telemetry, and no cloud sync — the server only reads and writes that file when a tool is called. This is also the boundary of the product: claims coordinate sessions that share one filesystem view, and cross-host coordination is explicitly out of scope.
</details>

<details>
<summary><strong>Can I release or steal a claim owned by another agent?</strong></summary>

No. `release_claim` only removes active claims owned by the calling `agentId`, whether targeted by `claimId` or by normalized paths. If another agent still owns a path, your options are to inspect it with `whose_claim`, coordinate with that owner through your tasking layer, or wait for the TTL to expire. This keeps the primitive predictable: ownership changes only by explicit release or by expiry, never by a quiet takeover.
</details>

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
