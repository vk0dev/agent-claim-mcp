# Two-agent dogfood proof

Use this proof when you want the narrowest local demonstration of the repo's core wedge: one agent claims a file, a second agent tries to claim the same file in the same worktree, and the overlap is blocked deterministically.

## Command

Run from the repo root:

```bash
npm run dogfood:overlap
```

This command rebuilds the package and runs `scripts/demo-claim-conflict.mjs` against the built stdio server with an isolated temporary ledger.

## Scenario

1. `coder-a` claims `src/parser.ts`
2. `coder-b` tries to claim both `src/parser.ts` and `src/tokenizer.ts`
3. the overlapping request is rejected because `src/parser.ts` is already owned by `coder-a`
4. `whose_claim` shows that `src/parser.ts` is still owned by `coder-a` while `src/tokenizer.ts` remains free

## Expected success signals

A correct proof run should show these concrete outputs:

- first `claim_files` call returns `ok: true`
- second `claim_files` call returns `ok: false`
- the conflict payload includes:
  - `path: "/repo/src/parser.ts"`
  - `ownerAgentId: "coder-a"`
- the overlap response keeps `claimed: []`, proving the mixed request is all-or-nothing
- `whose_claim` reports:
  - `src/parser.ts` as claimed by `coder-a`
  - `src/tokenizer.ts` as unclaimed
- the run ends with the decision-first summary line telling the operator to claim before edits

## Why this proof matters

This is the smallest reproducible local artifact for the product promise. It shows that overlapping edits in the same worktree are blocked before file changes begin, without needing a broader orchestration layer, external service, or publish workflow.
