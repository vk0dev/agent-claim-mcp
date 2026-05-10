# Spec: post-rerun Official MCP Registry verdict packet for `agent-claim-mcp`
**Date:** 2026-05-10
**Scope:** one bounded evidence pass immediately after vk fixes `NPM_TOKEN` and reruns workflow `25282612113` or triggers an equivalent fresh publish run.

## Goal
Capture one truthful final verdict for Official MCP Registry acceptance after the secret fix and rerun, without changing repo code or guessing from partial evidence.

## Preconditions
Only run this packet after all of the following are true:

1. vk confirms the repo secret fix for `NPM_TOKEN` is in place.
2. A rerun or replacement publish workflow exists for the same release surface.
3. `npm view @vk0/agent-claim-mcp version` still returns the shipped version expected for this lane.

If any precondition is false, stop and record `SOFT-BLOCKED` with the missing prerequisite.

## Canonical evidence sources
Use these sources only:

- Workflow run page for the rerun, based on the original tracked run:
  - original failed run: `https://github.com/vk0dev/agent-claim-mcp/actions/runs/25282612113`
  - rerun target: either the rerun of that workflow or the exact new workflow run URL if GitHub created a new run id
- Repo workflow definition: `.github/workflows/publish.yml`
- Repo runbook/checklist truth:
  - `docs/official-registry-validation-runbook.md`
  - `docs/official-registry-validation-checklist.md`
  - `PUBLISHING.md`
- Existing verdict context:
  - `business/agent-claim-mcp-official-registry-live-verdict-2026-05-09.md`

## Workflow evidence checklist
Capture the exact rerun evidence for these workflow steps, using the step names as they appear in `.github/workflows/publish.yml`:

1. `Publish to npm with provenance`
2. `Install mcp-publisher`
3. `Authenticate to MCP Registry`
4. `Publish to Official MCP Registry`

For each step, record:

- status: `success` / `failure` / `skipped` / `not reached`
- one concrete proof line from the log
- if failed, the exact blocking error text

Also record:

- rerun workflow URL
- rerun workflow run id
- git ref / tag used by the rerun
- whether the run was a rerun of `25282612113` or a new workflow run

## Public proof checklist
After the rerun completes, collect the minimum public evidence set:

1. `npm view @vk0/agent-claim-mcp version`
2. `npm view @vk0/agent-claim-mcp dist-tags --json`
3. Any public Official MCP Registry proof URL that now exists for this package, server, PR, or listing
4. If no public registry proof URL exists, record that absence explicitly instead of guessing

Accepted public proof examples:

- Official MCP Registry package/listing URL
- Registry PR URL created by publisher flow
- Public registry-facing artifact URL referenced directly by successful workflow logs

Do not treat npm-only success as registry acceptance proof.

## Exact verdict rules
Choose exactly one verdict.

### PASS
Use `PASS` only if all of the following are true:

- `Publish to npm with provenance` succeeded
- `Authenticate to MCP Registry` succeeded or the flow otherwise reached a clearly successful registry publish path
- `Publish to Official MCP Registry` succeeded
- at least one concrete public registry-side proof URL or artifact exists and is recorded
- no contradictory failure text remains in the rerun logs

### SOFT-BLOCKED
Use `SOFT-BLOCKED` if all npm/package truth remains good, but registry acceptance still cannot be claimed with public evidence. Typical cases:

- npm publish succeeded, but registry publish step is warning-only or ambiguous
- registry auth succeeded, but publish result has no public proof URL yet
- workflow says success, but the registry-side artifact is still missing or unverifiable
- rerun never happened, even though the secret fix may have happened

### FAIL
Use `FAIL` if any of the following are true:

- `Publish to npm with provenance` fails in the rerun
- registry auth or publish clearly fails with blocking error text
- rerun uses the wrong ref/tag or otherwise does not actually test the intended release lane
- packaged or published metadata contradicts the shipped release truth

## Where to record the verdict
After the evidence pass, update or create exactly one verdict artifact in `business/` that states:

- rerun workflow URL and run id
- step-by-step registry evidence summary
- public proof URL or explicit absence
- final verdict: `PASS` / `SOFT-BLOCKED` / `FAIL`
- one short plain-English reason why that verdict is truthful

Preferred target: append a new dated follow-up verdict file rather than mutating the older `2026-05-09` verdict in place, unless the operator explicitly wants the older file superseded.

## Minimal verifier path
The verifier should not patch repo code. The bounded pass is:

1. Open rerun workflow URL.
2. Capture statuses/log proof for the four registry-relevant steps.
3. Run npm truth commands.
4. Check for public registry artifact URL or explicit absence.
5. Write the final dated verdict note in `business/`.

## Recommended handoff text for main
"After `NPM_TOKEN` is fixed and the publish workflow is rerun, execute the post-rerun registry verdict packet in `business/agent-claim-mcp-post-rerun-registry-verdict-spec-2026-05-10.md`. Record the rerun URL/run id, the four registry-related workflow step outcomes, any public registry proof URL or explicit absence, then assign exactly one verdict: PASS, SOFT-BLOCKED, or FAIL." 
