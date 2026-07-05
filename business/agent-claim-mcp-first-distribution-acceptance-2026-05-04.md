# Spec: first external distribution acceptance for agent-claim-mcp
**Date:** 2026-05-04
**Author:** researcher
**Status:** draft

## Goal
Подготовить минимальный и truthful post-publish acceptance plan для `agent-claim-mcp`, чтобы после появления `NPM_TOKEN` main мог сразу сделать первый внешний acceptance check без нового research loop.

## Key findings

### 1. The fastest honest first external acceptance after npm publish is Official MCP Registry validation
This repo already encodes that intent explicitly.

Direct evidence:
- `docs/official-registry-validation-runbook.md` calls Official MCP Registry validation the **first post-publish validation pass** for this repo.
- `PUBLISHING.md` says CI updates:
  - npm
  - GitHub Release
  - GitHub Pages
  - **Official MCP Registry**
  - **Smithery**
- The same `PUBLISHING.md` says Glama / MseeP / MCPServers.org are **auto-scraping npm** with a `24-48h` window.

That makes the ordering clear:
1. npm publish lands
2. Official MCP Registry validation is checked immediately
3. Smithery may also auto-update quickly, but Official Registry is the repo’s explicitly defined acceptance path
4. Glama/mcp.so are slower or more indirect and are not the fastest honest first acceptance

### 2. Automation level by target
| Target | Automation level | Current readiness | Exact next action |
|---|---|---|---|
| **Official MCP Registry** | semi-automatic: CI publishes, human verifies logs + registry outcome | **ready after npm publish** | run the registry validation runbook and record PASS / SOFT-BLOCKED / FAIL |
| **Smithery** | automatic in CI after publish (requires configured secret) | **likely ready after publish** | check whether Smithery step succeeded and page updated, but treat this as secondary to Official Registry |
| **Glama** | passive auto-discovery / scraping | **not suitable as first acceptance** | wait 24-48h; do not use as immediate acceptance gate |
| **mcp.so** | manual form / later discovery path | **not suitable as first acceptance** | not the first post-publish acceptance path |

### 3. Current repo/package/server metadata is already sufficient for the first acceptance path
Current package/server metadata already looks aligned for first publish validation:
- `package.json`
  - `name = @vk0/agent-claim-mcp`
  - `version = 1.0.0`
- `server.json`
  - current schema present
  - package identifier points at `@vk0/agent-claim-mcp`
- README already carries npm badge and publish-status note
- repo includes `docs/official-registry-validation-runbook.md`, which gives an exact post-publish verification sequence

There is **no new repo-side metadata blocker** for the first acceptance check itself.

The real blocker is still external to the repo:
- first npm publish cannot happen until GitHub Actions has valid `NPM_TOKEN`

### 4. The first bounded follow-up after npm publish should be verification, not coding
The smallest truthful next task immediately after npm publish is:
- **main/manual verification task**, not coder task

Reason:
- the repo already has the validation runbook
- the first question after publish is whether npm + Official Registry actually landed
- that is a verification/evidence task, not an implementation task

### 5. Exact Official MCP Registry verification path after publish
Use the repo’s existing runbook.

Primary file:
- `docs/official-registry-validation-runbook.md`

Fast execution checklist from the runbook:
```bash
cd ~/projects/agent-claim-mcp
npm view @vk0/agent-claim-mcp version
npm view @vk0/agent-claim-mcp dist-tags --json
npm pack @vk0/agent-claim-mcp --silent
TARBALL=$(ls -t vk0-agent-claim-mcp-*.tgz | head -n 1)
tar -xOf "$TARBALL" package/server.json | head -n 20
```

Then inspect GitHub Actions release workflow logs for:
- `Publish to npm with provenance`
- `Authenticate to MCP Registry`
- `Publish to Official MCP Registry`

Runbook verdict rules:
- **PASS** if npm version exists, packaged metadata matches, and registry publish/log surface is clearly successful
- **SOFT-BLOCKED** if npm publish succeeded but registry state remains warning-only / ambiguous / unverified
- **FAIL** if npm publish failed, packaged metadata is wrong, or registry publish shows a concrete blocking failure

## Current readiness by target

### Official MCP Registry
**Best first acceptance target.**

Why:
- already built into current CI flow
- explicit repo runbook already exists
- fastest truthful post-publish signal
- can be checked immediately after publish

### Smithery
**Good secondary acceptance, not the first one.**

Why:
- also wired into CI
- useful as an additional marketplace confirmation
- but the repo’s own release docs make Official Registry the first validation pass

### Glama
**Not first acceptance.**

Why:
- `PUBLISHING.md` treats Glama as auto-scraping npm with 24-48h lag
- too slow and indirect for immediate publish acceptance

### mcp.so
**Not first acceptance.**

Why:
- manual submission path in the current playbook
- not immediate and not automated enough for first post-publish acceptance

## Readiness verdict
**READY_AFTER_PUBLISH**

Reason:
- the repo is already prepared for the first external acceptance path
- no extra coder fix is required before that path
- the only remaining precondition is that the first real npm publish must exist

## Recommended next task/action
**Immediately after npm publish:** run a main/manual verification task using `docs/official-registry-validation-runbook.md` and record the result as `PASS`, `SOFT-BLOCKED`, or `FAIL`.

This is the smallest truthful next step.

## What not to do
- do not wait for Glama/mcp.so to decide whether the first publish was externally accepted
- do not open a coder task first unless the verification step finds a concrete metadata failure
- do not widen the acceptance gate into “all marketplaces green” for Phase 2.1

## Sources
- `/Users/vkdev/projects/agent-claim-mcp/docs/official-registry-validation-runbook.md`
- `/Users/vkdev/projects/agent-claim-mcp/PUBLISHING.md`
- `/Users/vkdev/projects/agent-claim-mcp/package.json`
- `/Users/vkdev/projects/agent-claim-mcp/server.json`
- `/Users/vkdev/projects/agent-claim-mcp/README.md`
