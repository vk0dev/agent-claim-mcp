# agent-claim-mcp public proof docs packet
**Date:** 2026-05-06
**Owner:** content
**Scope:** bounded docs-refresh packet only, no repo edits in this task

## 1) Canonical truth summary
Current canonical split is simple and should stay explicit everywhere:
- **public npm proof is complete** for `@vk0/agent-claim-mcp@1.0.0`
- **external listing / registry proof is still pending**
- no wording should imply Official MCP Registry acceptance or live marketplace listing proof until that separate verification is completed

The safe docs job is not to broaden the story. It is only to keep the README surfaces aligned to this split.

## 2) Touched README / i18n surfaces
### Current repo reality
- maintained English surface exists: `/Users/vkdev/projects/agent-claim-mcp/README.md`
- no maintained localized README files currently exist under the repo root

### Recommended touched surface for the next coder/docs pass
- `/Users/vkdev/projects/agent-claim-mcp/README.md`

### Optional touch only if drift is found during execution
- `docs/official-registry-validation-runbook.md`
- `docs/smoke-proof.md`

Do not create new localized files in the follow-up unless the repo later adds them as maintained surfaces.

## 3) Safe wording to use / wording to avoid
### Safe wording to use
- `@vk0/agent-claim-mcp@1.0.0 is live on npm`
- `the canonical external install path is npx`
- `Official MCP Registry validation is still pending`
- `external listing proof is not complete yet`
- `do not describe the package as registry-accepted until that separate check passes`

### Wording to avoid
- `live in the Official MCP Registry`
- `registry accepted`
- `marketplace listed`
- `fully distributed everywhere`
- `npm and registry launch complete`
- any mention of Smithery, Glama, or mcp.so as if they are already verified live for this package

## 4) Exact file targets and bounded text snippets
### Primary target
**File:** `/Users/vkdev/projects/agent-claim-mcp/README.md`

### Suggested bounded release-status snippet
Use this wording if the current block needs cleanup or tightening:

```md
> Release status: `@vk0/agent-claim-mcp@1.0.0` is live on npm, so the `npx -y @vk0/agent-claim-mcp` install path is the truthful default for external users. Official MCP Registry validation is still pending, so do not describe the package as registry-accepted or marketplace-listed until that separate proof is complete.
```

### Suggested short registry quickstart state block
Use this only if the README still needs a tighter state summary around rerun/verification:

```md
Current truthful state:
- npm `1.0.0` is live
- Official MCP Registry acceptance is still pending
- the external registry proof path still needs a successful rerun and validation pass
```

### Listing-copy drift note
If any README line currently collapses npm proof and registry proof into one combined “launch complete” idea, treat that as drift and tighten only that line. Do not widen into a broader rewrite.

## 5) Suggested tiny follow-up coder task shape
**Title shape:**
`agent-claim-mcp: tighten README public-proof wording to preserve npm-live vs registry-pending split`

**Scope:**
1. inspect `README.md` only
2. tighten the release-status wording if it overstates external listing proof
3. optionally touch one adjacent docs file only if the same wording drift appears there
4. no code changes, no version bump, no new locale creation

**Definition of done:**
- README preserves the split: npm proof done, external listing proof pending
- no speculative marketplace/registry language remains
- no broader product-copy rewrite

## Short operator takeaway
The next docs step should be mechanical, not investigative: keep the npm-live proof visible, keep registry / marketplace proof clearly pending, and resist turning that small cleanup into a larger distribution rewrite.