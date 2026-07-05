# Spec: official registry rerun operator checklist for agent-claim-mcp
**Date:** 2026-05-06
**Author:** researcher
**Status:** draft

## Goal
Собрать один короткий operator checklist для следующего честного шага по Official MCP Registry acceptance. Этот документ не пересобирает стратегию заново, а сжимает current repo truth и existing packets в один handoff note: что должно быть true before rerun, что именно запускать, как валидировать outcome, и какие stale placeholders нужно mentally substitute во время rerun.

## Investigation questions
1. Какие preconditions должны быть выполнены до rerun?
2. Какие exact команды и workflow surfaces operator должен использовать?
3. Как выглядит post-rerun validation path и success/fail decision tree?
4. Какие placeholders или stale references в current docs operator должен учитывать?
5. Какой final verdict корректен сейчас?

## Findings

### 1) Exact preconditions before rerun
Before rerun, all of the following must be true:

1. **GitHub Actions secret `NPM_TOKEN` is fixed**
   - It must exist in repo secrets for `vk0dev/agent-claim-mcp`
   - It must be valid for publish access to `@vk0/agent-claim-mcp`
   - Current workflow now fails fast on missing/bad token via `npm whoami`

2. **Current shipped package truth is already intact**
   - package: `@vk0/agent-claim-mcp`
   - version: `1.0.0`
   - server id: `io.github.vk0dev/agent-claim-mcp`
   - npm publish already landed; this rerun is about registry acceptance proof, not first package release

3. **Operator is using the known rerun target**
   - workflow run id: `25282612113`
   - repo: `vk0dev/agent-claim-mcp`

4. **Operator has repo-local validation docs available**
   - `PUBLISHING.md`
   - `docs/official-registry-validation-runbook.md`
   - this checklist

### 2) Exact rerun commands and where to watch

## Preflight locally
Run this first in repo root:
```bash
npm run preflight:registry
```

## Rerun the known workflow
```bash
gh run rerun 25282612113 --repo vk0dev/agent-claim-mcp
```

## Where to watch
Watch the rerun in GitHub Actions for `.github/workflows/publish.yml`.

The most important steps to inspect are:
1. `Verify npm publish credentials`
2. `Publish to npm with provenance`
3. `Install mcp-publisher`
4. `Login to MCP Publisher via GitHub OIDC`
5. `Publish to MCP Registry`

### What to look for
- If step 1 fails, the problem is still `NPM_TOKEN`, not repo code.
- If npm publish succeeds but registry steps warn/fail, registry acceptance remains unproven.
- If rerun reaches registry steps cleanly, move to validation below.

### 3) Exact post-rerun validation steps
Run these checks in order after the rerun:

1. Confirm npm package state is still healthy:
```bash
npm view @vk0/agent-claim-mcp version
npm view @vk0/agent-claim-mcp dist-tags --json
```

2. Pull the published tarball surface:
```bash
npm pack @vk0/agent-claim-mcp --silent
```

3. Validate the packaged metadata using the runbook:
- inspect packaged `package.json`
- inspect packaged `server.json`
- confirm package name/version/server id remain aligned

4. Inspect registry outcome from rerun logs:
- look at `Publish to MCP Registry`
- look at any warning text from `mcp-publisher`
- look for a concrete registry-side success artifact or unmistakable success log path

## Success / fail decision tree
### PASS
Record acceptance only if:
- rerun reaches registry steps, and
- registry publish is clearly successful, or
- there is a concrete registry-side artifact/URL/log proving acceptance

### SOFT-BLOCKED / UNVERIFIED
Record unverified if:
- npm is fine, but registry path only emits warnings or ambiguous outcome
- especially if workflow emits:
```text
::warning::MCP Registry publish failed — may need manual 'mcp-publisher publish'
```

### FAIL
Record fail if:
- `NPM_TOKEN` is still missing/invalid
- rerun does not get past npm auth/publish preconditions
- packaged metadata no longer matches expected repo truth

## 4) Placeholder or stale path references to mentally substitute
Current docs are generally aligned, but operator should remember:

1. **Use the real rerun command with concrete run id**
   - canonical rerun target is:
   ```bash
   gh run rerun 25282612113 --repo vk0dev/agent-claim-mcp
   ```
   - if any older note says only “rerun publish workflow” without the concrete id, use the command above

2. **Do not treat npm success as registry success**
   - some earlier notes may read like “rerun publish after secret fix” is the main step
   - the real bar here is Official MCP Registry acceptance proof, not just a successful npm auth path

3. **If current docs mention template fields or later operator substitution, prefer current concrete values**
   - package: `@vk0/agent-claim-mcp`
   - version: `1.0.0`
   - server id: `io.github.vk0dev/agent-claim-mcp`
   - rerun target: `25282612113`

## 5) Final verdict enum
**READY_FOR_MAIN_OPERATOR_STEP**

Why:
- current repo truth already provides the rerun commands, validation runbook, and failure interpretation
- no bounded coder patch is justified before rerun
- the next honest move is operator-side: fix secret, rerun workflow, validate outcome conservatively

## Crisp operator sequence
1. Fix valid `NPM_TOKEN` in GitHub repo secrets.
2. Run `npm run preflight:registry` locally.
3. Run `gh run rerun 25282612113 --repo vk0dev/agent-claim-mcp`.
4. Watch the five key workflow steps listed above.
5. Run post-rerun npm/package checks.
6. Mark result as PASS only with clear registry proof, otherwise SOFT-BLOCKED / UNVERIFIED.

## No coder task justified now
There is no repo-side gap from current truth that justifies a <=90 min coder task before rerun.

If a future rerun exposes a concrete repo mismatch, then create a new bounded task with exact file targets. Not before.

## Data shapes / Types
```ts
type RegistryChecklistVerdict =
  | 'READY_FOR_MAIN_OPERATOR_STEP'
  | 'READY_FOR_BOUNDED_CODER_TASK'
  | 'HUMAN_EXTERNAL_BLOCKED';

interface RegistryRerunChecklist {
  preconditions: string[];
  rerunCommands: string[];
  validationSteps: string[];
  staleReferenceSubstitutions: string[];
  verdict: RegistryChecklistVerdict;
}
```

## Real samples
### Sample 1
Input:
- `NPM_TOKEN` still broken

Expected output:
- rerun stops at credential verification, classify as fail on secret/workflow precondition

### Sample 2
Input:
- npm publish path succeeds but registry step warns only

Expected output:
- classify as SOFT-BLOCKED / UNVERIFIED, not PASS

### Sample 3
Input:
- operator asks whether docs already contain enough for rerun

Expected output:
- yes, current docs + this checklist are enough, no coder patch first

## Implementation hints (для coder)
- No coder task recommended.
- If later needed, any coder follow-up must cite exact files from the rerun failure, not speculate now.

## Acceptance criteria
- [ ] Checklist file exists with current date
- [ ] Preconditions are explicit
- [ ] Rerun commands and watch points are explicit
- [ ] Validation tree is explicit
- [ ] Stale/path substitutions are called out
- [ ] Verdict is explicit

## Open questions / Risks
- This checklist cannot verify the live secret value or rerun result; it only collapses current repo truth into one handoff note.
- If registry logs remain ambiguous after rerun, a later manual `mcp-publisher` step may still be needed.
- Registry-side success artifact shape may vary, so operator still needs conservative judgment.

## What to do next
1. Исправить valid `NPM_TOKEN` in repo secrets, owner: Main, deadline: 2026-05-06 18:00 PT or before rerunning workflow `25282612113`.
2. Запустить local preflight and workflow rerun exactly as listed here, owner: Main, deadline: 2026-05-06 18:15 PT or immediately after the secret fix.
3. Обновить operator status to PASS only on clear registry proof; otherwise mark SOFT-BLOCKED / UNVERIFIED, owner: Main, deadline: 2026-05-06 18:45 PT or immediately after rerun validation.

## Sources
- `/Users/vkdev/projects/agent-claim-mcp/PUBLISHING.md`
- `/Users/vkdev/projects/agent-claim-mcp/docs/official-registry-validation-runbook.md`
- `/Users/vkdev/projects/agent-claim-mcp/.github/workflows/publish.yml`
- `/Users/vkdev/projects/agent-claim-mcp/business/agent-claim-mcp-official-registry-rerun-packet-2026-05-06.md`
- `/Users/vkdev/projects/agent-claim-mcp/business/agent-claim-mcp-official-registry-validation-packet-2026-05-05.md`
- `/Users/vkdev/.openclaw/workspace/plans/agent-claim-mcp.md`
