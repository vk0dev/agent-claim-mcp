# Dogfood report

This report summarizes the local proof artifacts already checked into the repo. It is meant to answer one operator question before first public publish: what safety behavior has been demonstrated locally, and what is still not proven yet?

## Verified scenarios

### 1. Deterministic overlap rejection

**Repro command:**

```bash
npm run dogfood:overlap
```

**What it proves:** when `coder-a` already owns `src/parser.ts`, a mixed overlapping claim from `coder-b` is rejected deterministically instead of partially succeeding.

**Success signal:** the second `claim_files` call returns `ok: false`, the conflict payload names `/repo/src/parser.ts` with `ownerAgentId: "coder-a"`, `claimed` stays empty, and `whose_claim` still shows `src/parser.ts` claimed while `src/tokenizer.ts` remains free.

### 2. Expiry / prune reclaim

**Repro command:**

```bash
npm run dogfood:expiry
```

**What it proves:** a short-lived claim can expire, be pruned by the normal read path, and stop blocking the next agent without manual ledger cleanup.

**Success signal:** the first claim returns `ok: true`, the short-lived claim includes `claimedUntil`, `whose_claim` later reports `src/cache.ts` as `claimed: false`, and a follow-up claim by `coder-b` succeeds with `ok: true` and `conflicts: []`.

### 3. Owner-only release protection

**Repro command:**

```bash
npm run dogfood:release-owner
```

**What it proves:** a non-owner cannot release someone else's live claim to unblock itself.

**Success signal:** the non-owner `release_claim` attempt returns `ok: false`, `released: []`, and `missing: ["/repo/src/queue.ts"]`; `whose_claim` still reports `ownerAgentId: "coder-a"`; then the true owner release succeeds with `released: ["/repo/src/queue.ts"]`.

## Safety guarantees now demonstrated locally

From the current proof set, this repo now demonstrates three core safety properties in a reproducible local environment:

- overlapping claims are rejected before edits begin
- expired claims do not require manual ledger surgery to unblock later work
- only the current owner can release a live claim

Together, these proofs support the narrow product claim that Agent Claim MCP is a small local coordination primitive for shared-worktree edit safety, not a broader orchestration layer.

## Still unproven / next before publish

The first public npm publish is still blocked by the missing unattended `NODE_AUTH_TOKEN` in the GitHub Actions publish path. That is a human/operator setup dependency, not a product-behavior gap, and it is still unresolved.

The current proof set is local and repo-scoped. It demonstrates separate client identities against the same ledger-backed stdio server flow, but it does not yet constitute a real multi-machine proof, a networked coordination proof, or a stress/concurrency benchmark under heavy parallel write pressure. Those limits should stay explicit until separately demonstrated.
