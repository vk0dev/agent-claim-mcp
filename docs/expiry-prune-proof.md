# Expiry and prune proof

Use this proof when you want to confirm that a stale claim stops blocking new work without any manual ledger cleanup.

## Command

Run from the repo root:

```bash
npm run dogfood:expiry
```

This command rebuilds the package and runs `scripts/demo-expiry-prune.mjs` against the built stdio server with an isolated temporary ledger.

## Scenario

1. `coder-a` claims `src/cache.ts` with `ttlSeconds=1`
2. the proof waits just past the TTL boundary
3. `whose_claim` reads the same path and triggers the normal expired-claim prune path
4. `coder-b` then claims `src/cache.ts` successfully without manual ledger edits

## Expected success signals

A correct proof run should show these concrete outputs:

- the first `claim_files` call returns `ok: true`
- the short-lived claim includes a `claimedUntil` timestamp
- after the wait, `whose_claim` reports `src/cache.ts` as `claimed: false`
- the follow-up claim by `coder-b` returns:
  - `ok: true`
  - `claimed: ["/repo/src/cache.ts"]`
  - `conflicts: []`
- the run ends with the decision-first line stating that expired claims disappear without manual ledger surgery

## Why this proof matters

This is the smallest reproducible local proof that TTL cleanup is not just a test-only property. It shows operators that stale ownership does not require hand-editing the ledger file before the next agent can keep working.
