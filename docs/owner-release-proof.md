# Owner-only release proof

Use this proof when you want to confirm that one agent cannot release another agent's live claim and silently take over the same path.

## Command

Run from the repo root:

```bash
npm run dogfood:release-owner
```

This command rebuilds the package and runs `scripts/demo-owner-release.mjs` against the built stdio server with an isolated temporary ledger.

## Scenario

1. `coder-a` claims `src/queue.ts`
2. `coder-b` tries to release that same claimed path
3. the non-owner release attempt is rejected by returning `ok: false`, no released paths, and the normalized path in `missing` for that caller
4. `whose_claim` confirms that `coder-a` still owns the live claim
5. `coder-a` then releases the path successfully

## Expected success signals

A correct proof run should show these concrete outputs:

- the first `claim_files` call returns `ok: true`
- the non-owner `release_claim` response shows:
  - `ok: false`
  - `released: []`
  - `missing: ["/repo/src/queue.ts"]`
- the subsequent `whose_claim` output still reports:
  - `claimed: true`
  - `ownerAgentId: "coder-a"`
- the owner `release_claim` response ends with:
  - `released: ["/repo/src/queue.ts"]`
  - `missing: []`
- the run ends with the decision-first summary stating that only the current owner can clear a live claim

## Why this proof matters

This is the smallest reproducible local proof that owner safety is enforced in practice, not just in docs. It shows operators that a second agent cannot clear another agent's live claim to force progress around active work.
