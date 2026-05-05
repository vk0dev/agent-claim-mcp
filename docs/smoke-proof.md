# Local smoke proof for npm-live release checks

Use this short proof path after local changes, before tagging a release, or before asking someone else to retry the GitHub Actions publish or registry-validation job.

## Commands

Run from the repo root:

```bash
npm install
npm run smoke
```

`npm run smoke` already rebuilds the package and runs `scripts/dogfood_smoke.mjs` against the built stdio server.

## Expected success signals

A successful run should end with these concrete signals:

1. **Packaged surface verified**
   - confirms `package.json`, `server.json`, and `dist/server.js` are in sync
2. **Tools discovered**
   - shows exactly these three MCP tools:
     - `claim_files`
     - `release_claim`
     - `whose_claim`
3. **Smoke test passed!**
   - confirms one claim succeeds, one overlapping claim is rejected deterministically, `whose_claim` reports ownership state, and the owner release succeeds

## What to treat as a failure

Stop before publish if any of these happen:

- the packaged surface/version check fails
- the discovered tool list is missing one of the three MCP tools
- the overlap check does not return a conflict
- the run does not end with `Smoke test passed!`

This proof is local-only. It validates the packaged MCP surface and the three-tool coordination flow, but it does not bypass the separate GitHub Actions requirement for an unattended `NODE_AUTH_TOKEN` during npm publish.
