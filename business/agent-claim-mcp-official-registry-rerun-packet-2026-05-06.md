# Spec: official registry rerun packet for agent-claim-mcp
**Date:** 2026-05-06
**Author:** researcher
**Status:** draft

## Goal
Собрать один bounded operator packet для следующего truthful шага по Official MCP Registry acceptance после уже состоявшегося npm publish `1.0.0`. Scope intentionally narrow: только current repo truth, publish workflow, runbook, and existing repo-local verification artifacts. Никаких внешних действий и никаких generic marketplace scans.

## Investigation questions
1. Что уже точно true и shipped по npm/package metadata?
2. Какие exact secret/workflow/operator preconditions остаются перед rerun?
3. Какой clean step-by-step rerun + validation path следует из current repo truth?
4. Есть ли repo-side gap, который оправдывает <=90 min coder task до rerun?
5. Какой final verdict честнее: `READY_FOR_MAIN_OPERATOR_STEP` | `READY_FOR_BOUNDED_CODER_TASK` | `HUMAN_EXTERNAL_BLOCKED`?

## Findings

### Q1: Что уже точно true и shipped for npm/package metadata?
Directly verified from current repo files:
- **npm package is live:** `@vk0/agent-claim-mcp@1.0.0` is already the truthful published package surface (`README.md:10`, `17`; runbook current blocker section)
- **Package name:** `@vk0/agent-claim-mcp` (`package.json:2`)
- **Version:** `1.0.0` (`package.json:3`, `server.json:9`, `README.md:10-20`)
- **MCP/server identifier:** `io.github.vk0dev/agent-claim-mcp` (`package.json:5`, `server.json:3`)
- **Homepage:** `https://vk0dev.github.io/agent-claim-mcp` (`package.json:51`)
- **License:** `MIT` (`package.json:50`)
- **Registry-facing package metadata exists** in both `package.json` and `server.json`
- **README already says not to claim registry acceptance yet** and points to the rerun path (`README.md:10-12`, `19-32`)

This is enough to say the product/package surface is shipped and the open problem is specifically registry acceptance proof, not npm publish truth.

### Q2: Какие exact secret/workflow/operator preconditions remain before rerun?
The remaining preconditions are explicit in current repo truth.

#### Secret precondition
- The GitHub repo secret **`NPM_TOKEN`** must exist and be valid for publish access to `@vk0/agent-claim-mcp`.
- This is enforced in CI by `publish.yml`:
  - missing token produces `::error::Missing required GitHub Actions secret NPM_TOKEN...` (`publish.yml:43-44`)
  - invalid token/auth failure produces `::error::NPM_TOKEN is present but npm authentication failed.` (`publish.yml:49-50`)

#### Workflow precondition
- The rerun target remains workflow run **`25282612113`**.
- Current repo docs consistently point to:
  - `gh run rerun 25282612113 --repo vk0dev/agent-claim-mcp` (`README.md:25`, `PUBLISHING.md:88-91`, runbook current blocker section)

#### Operator precondition
- Before claiming registry acceptance, operator should run the repo-local preflight and use the runbook:
  - `npm run preflight:registry` (`README.md:30`, `PUBLISHING.md:96`, runbook command section)
  - then follow `docs/official-registry-validation-runbook.md`

### Q3: What is the cleanest rerun + validation path from current repo truth?

## Clean step-by-step operator path
1. **Fix the repo secret `NPM_TOKEN`** in GitHub Actions so it is present and valid for publish access to `@vk0/agent-claim-mcp`.
2. In repo local context, run:
   ```bash
   npm run preflight:registry
   ```
3. Rerun the known failed publish workflow:
   ```bash
   gh run rerun 25282612113 --repo vk0dev/agent-claim-mcp
   ```
4. Watch the rerun for these exact steps in `.github/workflows/publish.yml`:
   - `Verify npm publish credentials`
   - `Publish to npm with provenance`
   - `Install mcp-publisher`
   - `Login to MCP Publisher via GitHub OIDC`
   - `Publish to MCP Registry`
5. After rerun, validate with the runbook, in this order:
   - `npm view @vk0/agent-claim-mcp version`
   - `npm view @vk0/agent-claim-mcp dist-tags --json`
   - `npm pack @vk0/agent-claim-mcp --silent`
   - inspect packaged `package.json` and `server.json` as the runbook describes
6. Then inspect the registry outcome honestly:
   - if registry logs clearly show success, or a concrete registry-side artifact/URL exists, record PASS
   - if npm is fine but registry logs remain warning/ambiguous, record **SOFT-BLOCKED** / unverified, not success
   - if the same npm-auth problem remains, the status is still blocked on secret/config, not repo code

### Exact warning text to watch for
Current workflow explicitly tolerates registry-step failure with:
```text
::warning::MCP Registry publish failed — may need manual 'mcp-publisher publish'
```
If this warning appears again, acceptance is **not** proven just because npm succeeded.

### Q4: Is any repo-side gap justifying a <=90 min coder task visible now?
**No bounded coder task is justified from current repo truth.**

Why not:
- README already states the truthful current status and rerun path
- `PUBLISHING.md` already contains the exact secret + rerun guidance
- the official registry runbook already documents validation order and failure interpretation
- `publish.yml` already fails fast on missing/bad `NPM_TOKEN` and exposes the relevant registry steps
- current blocker is operational secret/workflow state, not a missing repo file or absent instruction

So there is **no exact file target** that needs a pre-rerun coder patch right now.

### Q5: Final verdict
**READY_FOR_MAIN_OPERATOR_STEP**

Why:
- current repo truth already encodes the rerun path cleanly
- npm/package metadata is already shipped and consistent
- no <=90 min repo/code fix is evidenced as necessary first
- the next missing move is manual operator work on the GitHub secret + workflow rerun + validation

This is not `READY_FOR_BOUNDED_CODER_TASK` because no repo-side gap was found.
This is not `HUMAN_EXTERNAL_BLOCKED` because the task asked for a packet, and the packet now fully supports the next operator action from current repo truth.

## Exact operator packet
### Canonical identifiers
- **Package:** `@vk0/agent-claim-mcp`
- **Version:** `1.0.0`
- **Server ID:** `io.github.vk0dev/agent-claim-mcp`
- **Homepage:** `https://vk0dev.github.io/agent-claim-mcp`
- **Workflow rerun target:** `25282612113`

### Exact operator commands
```bash
npm run preflight:registry
gh run rerun 25282612113 --repo vk0dev/agent-claim-mcp
```

### Exact docs to follow
- `README.md`
- `PUBLISHING.md`
- `docs/official-registry-validation-runbook.md`
- optionally record outcome with `docs/official-registry-validation-checklist.md`

### Decision rule after rerun
- **PASS only if** registry publish is clearly successful or a concrete registry-side artifact proves the update landed
- **Do not claim acceptance** from npm success alone
- **If warning-only / ambiguous**, record unverified / soft-blocked and stop there

## Data shapes / Types
```ts
type RegistryRerunVerdict =
  | 'READY_FOR_MAIN_OPERATOR_STEP'
  | 'READY_FOR_BOUNDED_CODER_TASK'
  | 'HUMAN_EXTERNAL_BLOCKED';

interface RegistryRerunPacket {
  packageName: string;
  version: string;
  serverId: string;
  rerunWorkflowId: string;
  secretPreconditions: string[];
  operatorSteps: string[];
  repoSideGapFiles: string[];
  verdict: RegistryRerunVerdict;
}
```

## Real samples
### Sample 1
Input:
- repo state where npm package is already live but registry acceptance is unproven

Expected output:
- rerun packet that focuses on secret/workflow validation, not code changes

### Sample 2
Input:
- rerun logs show `MCP Registry publish failed — may need manual 'mcp-publisher publish'`

Expected output:
- treat registry acceptance as unverified, not PASS

### Sample 3
Input:
- operator asks whether a coder task is needed before rerun

Expected output:
- no, because current docs/workflow already cover the rerun path

## Implementation hints (для coder)
- No coder task recommended.
- If a future rerun exposes a specific repo-side mismatch, create a new bounded task with exact file targets then.
- Do not preemptively patch docs or workflow again from this packet alone.

## Acceptance criteria
- [ ] One packet artifact exists at the target path
- [ ] npm/package truths are stated explicitly
- [ ] secret/workflow preconditions are explicit
- [ ] rerun path is step-by-step and grounded in repo files
- [ ] verdict is explicit

## Open questions / Risks
- This packet cannot verify the actual GitHub secret value or live rerun result, only the repo-side truth about what must happen next.
- If `NPM_TOKEN` is fixed but registry publish still warns/fails, the next packet may need to narrow into manual `mcp-publisher` follow-up.
- Registry-side proof surface may vary, so operator still needs to avoid over-claiming from ambiguous logs.

## What to do next
1. Исправить repo secret `NPM_TOKEN` in GitHub Actions for `vk0dev/agent-claim-mcp`, owner: Main, deadline: 2026-05-06 18:00 PT or before rerunning workflow `25282612113`.
2. Запустить `npm run preflight:registry`, then rerun `gh run rerun 25282612113 --repo vk0dev/agent-claim-mcp`, owner: Main, deadline: 2026-05-06 18:15 PT or immediately after the secret fix.
3. Обновить operator status to `registry accepted` only when a clear registry success artifact or log path exists, owner: Main, deadline: 2026-05-06 18:45 PT or immediately after rerun validation.

## Sources
- `/Users/vkdev/projects/agent-claim-mcp/README.md`
- `/Users/vkdev/projects/agent-claim-mcp/package.json`
- `/Users/vkdev/projects/agent-claim-mcp/server.json`
- `/Users/vkdev/projects/agent-claim-mcp/PUBLISHING.md`
- `/Users/vkdev/projects/agent-claim-mcp/docs/official-registry-validation-runbook.md`
- `/Users/vkdev/projects/agent-claim-mcp/.github/workflows/publish.yml`
- `/Users/vkdev/projects/agent-claim-mcp/business/agent-claim-mcp-official-registry-validation-packet-2026-05-05.md`
- `/Users/vkdev/projects/agent-claim-mcp/business/agent-claim-mcp-official-registry-validation-2026-05-04.md`
- `/Users/vkdev/.openclaw/workspace/plans/agent-claim-mcp.md`
