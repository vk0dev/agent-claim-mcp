# agent-claim-mcp external proof next verdict — 2026-05-12

Verdict: `SOFT-BLOCKED`
Recommended state: `STILL_EXTERNAL`
Coder reopen trigger: `none`

## Scope

One bounded external-proof pass for:
- Official MCP Registry evidence after the documented rerun lane
- exact public Smithery live-listing proof for `agent-claim-mcp`

This pass is intentionally narrow. It does **not** claim external acceptance unless one branch yields a verifiable artifact.

## Sources checked

- Plan: `/Users/vkdev/.openclaw/workspace/plans/agent-claim-mcp.md`
- Runbook: `/Users/vkdev/projects/agent-claim-mcp/docs/official-registry-validation-runbook.md`
- Prior Official Registry verdict: `/Users/vkdev/projects/agent-claim-mcp/business/agent-claim-mcp-official-registry-live-verdict-2026-05-09.md`
- Prior Smithery verdict: `/Users/vkdev/projects/agent-claim-mcp/business/agent-claim-mcp-smithery-live-verdict-2026-05-08.md`
- Workflow evidence: `https://github.com/vk0dev/agent-claim-mcp/actions/runs/25282612113`

## Findings

### 1) Official MCP Registry rerun evidence
No fresh rerun evidence exists today.

Checked:
- `gh run list --repo vk0dev/agent-claim-mcp --workflow 'Publish to npm' --limit 10 --json ...`
- `gh run view 25282612113 --repo vk0dev/agent-claim-mcp --json conclusion,status,jobs,url,displayTitle,workflowName,headSha,headBranch,createdAt,updatedAt`
- `gh run view 25282612113 --repo vk0dev/agent-claim-mcp --log-failed`

Observed:
- The latest publish workflow visible for this lane is still run `25282612113`; no later successful rerun appears in the recent publish-run list.
- Run `25282612113` is still `conclusion: failure`.
- `Publish to npm with provenance` failed with `npm error code ENEEDAUTH` and `NODE_AUTH_TOKEN:` empty in the failed log.
- Because npm auth failed in that run, these later steps were skipped entirely:
  - `Install mcp-publisher`
  - `Authenticate to MCP Registry`
  - `Publish to Official MCP Registry`
  - `Publish to Smithery`

Interpretation:
- This run still provides **no verifiable Official MCP Registry acceptance evidence**.
- The current blocker remains external/operator-controlled credential state, not repo implementation.

### 2) npm public/package identity proof
npm public proof remains intact and consistent with prior truthful state.

Checked:
- `npm view @vk0/agent-claim-mcp version`
- `npm view @vk0/agent-claim-mcp dist-tags --json`
- `npm pack @vk0/agent-claim-mcp --silent`
- Extracted `package/package.json` and `package/server.json` from the packed tarball

Observed:
- npm version = `1.0.0`
- dist-tags = `{ "latest": "1.0.0" }`
- packed `package.json` shows `@vk0/agent-claim-mcp@1.0.0`
- packed `server.json` shows `io.github.vk0dev/agent-claim-mcp@1.0.0`
- repo metadata is aligned in `package.json:2-5` and `server.json:3-18`

Interpretation:
- Public npm distribution is healthy.
- This does **not** elevate the external-proof branch to PASS on its own.

### 3) Smithery exact live-listing proof
No exact public live Smithery listing is verified in this pass.

Checked:
- `https://smithery.ai/server/agent-claim-mcp`
- `https://smithery.ai/server/%40vk0%2Fagent-claim-mcp`
- `https://smithery.ai/servers?q=agent-claim-mcp`

Observed:
- All bounded anonymous web checks hit a Vercel security checkpoint (`429`) instead of a verifiable listing page or an exact search result.
- Because the publish workflow run never reached `Publish to Smithery`, there is also no new CI-side artifact proving a Smithery publish attempt for this lane.

Interpretation:
- Smithery is still **unverified**, not PASS.
- The current ambiguity is external/public-surface noise, not evidence of a repo field mismatch.

## Exact enum choice

`SOFT-BLOCKED`

Why this is not `PASS`:
- There is no fresh Official MCP Registry acceptance artifact.
- There is no verified live Smithery listing URL.

Why this is not `FAIL`:
- npm package identity is live and coherent.
- No broken repo metadata or field-level mismatch was found in this bounded pass.
- The remaining gap is still external/operator-controlled proof capture.

## Repo-mapped trigger for coder

None found.

I did **not** find a concrete field-level repo mismatch that justifies reopening coder work.
If coder work ever reopens from this lane, it should happen only after one of these appears:
1. an Official MCP Registry failure naming one exact metadata field, or
2. a Smithery publish/listing error naming one exact repo-side field, or
3. a verified live URL that requires one exact docs/status update.

None of those artifacts exist in this pass.

## Minimal next step

Stay in `STILL_EXTERNAL` state.

Smallest truthful next operator action:
1. fix or confirm repo secret state for `NPM_TOKEN` if still relevant to the publish lane,
2. rerun `25282612113` or a new equivalent publish workflow that actually reaches registry/Smithery steps,
3. capture exactly one new external artifact from either Official MCP Registry or Smithery.

Until then, do not reopen coder work from this lane.
