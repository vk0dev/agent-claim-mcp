# agent-claim-mcp Official MCP Registry rerun verdict — 2026-05-13

Verdict: `SOFT-BLOCKED`

## Scope
One bounded external-proof pass for Official MCP Registry acceptance only, using the post-rerun verdict spec and current publishing runbook.

## Run inspected
- Original failed run: `25282612113`
- Run URL: `https://github.com/vk0dev/agent-claim-mcp/actions/runs/25282612113`
- Current status in this pass: latest visible `Publish to npm` workflow run for this lane, updated at `2026-05-12T14:35:24Z`
- Rerun or replacement? **Rerun of `25282612113`**. The same workflow run id shows fresh completed job/step timestamps on 2026-05-12, so the rerun did happen, but it still failed before any registry publish step could run.

## Required workflow step outcomes
From `gh run view 25282612113 --repo vk0dev/agent-claim-mcp --json jobs`:

1. **Publish to npm with provenance** → `failure`
2. **Install mcp-publisher** → not reached / skipped
3. **Authenticate to MCP Registry** → not reached / skipped
4. **Publish to Official MCP Registry** → not reached / skipped

Supporting failed-log evidence:
- `gh run view 25282612113 --repo vk0dev/agent-claim-mcp --log-failed`
- failure is still at npm auth with `ENEEDAUTH`

## npm truth
Commands checked:
- `npm view @vk0/agent-claim-mcp version`
- `npm view @vk0/agent-claim-mcp dist-tags --json`

Observed:
- version = `1.0.0`
- dist-tags = `{ "latest": "1.0.0" }`

Interpretation:
- npm package is live
- this does **not** prove Official MCP Registry acceptance

## Public registry proof surface
Checked public proof URLs:
- `https://registry.modelcontextprotocol.io/v0/servers/io.github.vk0dev/agent-claim-mcp`
- `https://registry.modelcontextprotocol.io/v0/servers/io.github.vk0dev/agent-claim-mcp/versions`
- `https://modelcontextprotocol.io/registry/io.github.vk0dev/agent-claim-mcp`

Observed:
- no public registry proof was confirmed in this pass
- checked URLs returned public absence / 404 rather than acceptance evidence

## Why verdict is SOFT-BLOCKED
The rerun did happen, but it did not clear the precondition needed to reach registry publication.

Runbook anchors:
- `PUBLISHING.md:28` says Official MCP Registry acceptance is not yet proven from repo evidence
- `PUBLISHING.md:78-96` says the correct next step is to fix `NPM_TOKEN` and rerun run `25282612113`
- `PUBLISHING.md:98-104` says not to claim registry acceptance before post-rerun evidence exists

Current truthful state:
- rerun evidence exists on the original workflow run id `25282612113`, updated 2026-05-12
- the rerun still failed at `Publish to npm with provenance` with npm auth failure (`ENEEDAUTH`), so the registry steps stayed skipped
- therefore there is still no registry acceptance artifact to record as PASS or FAIL
- the missing prerequisite remains: fix the npm auth/secret path so a later rerun can actually reach the registry steps

## Exact next step
1. Confirm the npm auth/secret path is actually fixed in repo secrets/environment.
2. Run:
   ```bash
   gh run rerun 25282612113 --repo vk0dev/agent-claim-mcp
   ```
3. Re-check the same four workflow steps and only then record PASS or FAIL.

## Repo-side coder trigger
None from this pass.

This is still a release-infra / external-proof lane, not a product-code lane.
