# DOGFOOD.md

## Goal

Prove that `@vk0/agent-claim-mcp` works in a real multi-agent flow before publishing, not just in isolated unit tests.

## What was exercised

### 1. Two-agent overlap protection

Artifact: `docs/two-agent-dogfood-proof.md`

Result:
- Agent A successfully acquired a claim on a shared path.
- Agent B was rejected while that claim was active.
- The operator-facing proof shows the expected conflict payload and the exact command sequence used in the local run.

Why it matters:
- Confirms the core promise of the server, one agent can reserve a bounded path while another agent is prevented from editing the same surface at the same time.

### 2. Expiry and prune recovery

Artifact: `docs/expiry-prune-proof.md`

Result:
- A short-lived claim was allowed to expire.
- The prune path removed stale ownership cleanly.
- A later agent could reclaim the same path after expiry.

Why it matters:
- Confirms the ledger does not stay poisoned forever when an agent disappears or forgets to release a claim.

### 3. Owner-only release rejection

Artifact: `docs/owner-release-proof.md`

Result:
- A non-owner release attempt was rejected.
- The original owner could still release the claim.
- The operator note documents the expected manual behavior when a claim must be cleared safely.

Why it matters:
- Confirms claim release is not silently fail-open and preserves ownership semantics under contention.

## Supporting summary

See `docs/dogfood-report.md` for the checked-in synthesis of all proof artifacts.

## Practical conclusions

- The server is suitable for local-first multi-agent coordination where all agents share one filesystem view.
- The conflict, expiry, and release-owner paths all have real repo artifacts, not placeholder claims.
- This is still a bounded coordination primitive, not a distributed lock manager or workflow engine.

## Known limits seen during dogfood

- Coordination depends on a shared repo root and shared ledger visibility.
- Expiry helps recover from abandoned claims, but operators should still prefer explicit release when possible.
- Publish readiness still depends on separate npm/GitHub release credentials; dogfood only validates runtime behavior.
