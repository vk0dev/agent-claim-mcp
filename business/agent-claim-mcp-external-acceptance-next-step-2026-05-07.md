# Spec: external acceptance next step for agent-claim-mcp
**Date:** 2026-05-07
**Author:** researcher
**Status:** draft

## Goal
Коротко определить самый честный следующий external acceptance path для `agent-claim-mcp` после уже подтверждённого public npm proof `@vk0/agent-claim-mcp@1.0.0`, и прямо ответить: нужен ли coder, или следующий ход остаётся operator/secret/external only.

## Investigation questions
1. Какой single highest-confidence external acceptance path сейчас strongest?
2. Блокер repo-side, secret/operator-side, или fully marketplace-side?
3. Есть ли exact repo-side gap, который честно оправдывает bounded coder task?
4. Если repo-side gap нет, какой exact operator next step остаётся?

## Current repo and public truth
- `package.json` still shows `@vk0/agent-claim-mcp@1.0.0`.
- Public npm proof remains live.
- `server.json` still identifies the server as `io.github.vk0dev/agent-claim-mcp`.
- Official MCP Registry public endpoint still returns:
  - `404 {"title":"Not Found","status":404,"detail":"Server not found"}` for `https://registry.modelcontextprotocol.io/v0/servers/io.github.vk0dev%2Fagent-claim-mcp/versions`
- Registry search by server id and by npm package still does not show a live accepted listing.
- Smithery canonical candidate currently returns `404 — Server Not Found`.
- Glama is not a stronger truthful next path here than the registry rerun path; no verified acceptance surface there changes the main conclusion.

## Single highest-confidence next external acceptance path
**Official MCP Registry rerun**

Why this is still the strongest next path:
1. The plan is already split correctly: npm distribution proof is done, but external acceptance is still pending.
2. The public registry path is the most important truthful missing acceptance surface right now.
3. Existing repo-local docs already point to the registry rerun workflow as the next real move.
4. Smithery is not currently a better anchor because it is also not publicly accepted from current evidence.

## Blocker classification
**Primary blocker: secret/operator-side**

Why:
- Existing acceptance docs already narrowed the likely failure to the publish / registry lane, not to missing product code.
- Prior rerun packet and live verdict already converged on the same truth: public registry acceptance is absent even though npm is live.
- Current public evidence does not point to one exact broken README/server/package surface that would explain the missing registry listing.

Secondary nuance:
- after an operator rerun, the remaining state may still end up marketplace/external-only if the registry accepts slowly or requires manual follow-up
- but the current next move is still **operator rerun first**, not “wait passively” and not “open coder task”

## Repo-side gap check
**No repo-side gap is currently justified from public and repo-local evidence.**

What I checked:
- package truth is coherent at `1.0.0`
- server identity remains coherent at `io.github.vk0dev/agent-claim-mcp`
- prior docs/runbooks for registry verification already exist
- there is no new current evidence naming one exact file/field mismatch that would justify code or docs churn

### Therefore
**Do not open a coder task now.**

The standard for opening a coder task here should remain:
- a later rerun or marketplace response identifies one exact repo-side defect
- and that defect maps to one exact file/line surface, for example `server.json`, `package.json`, or one precise docs claim

That evidence is not present right now.

## Exact operator next step
1. Re-run the official registry publish path for the existing `1.0.0` release using the already documented runbook / workflow.
2. Verify the specific publish workflow lane tied to the known failing run and secret path.
3. After rerun, re-check the same public registry endpoints:
   - `.../v0/servers/io.github.vk0dev%2Fagent-claim-mcp/versions`
   - registry search by server id
   - registry search by npm package
4. Only if the rerun completes cleanly and the public endpoints still remain empty should the state be upgraded from operator rerun to marketplace/external-only follow-up.

## Most truthful bounded recommendation
**READY_FOR_OPERATOR_RERUN**

Why:
- npm public proof is already done
- registry/marketplace public proof is still absent
- current evidence does not justify a repo patch first
- the next honest move is to re-run the registry acceptance path, not to guess new code changes

## If a coder task ever becomes justified later
Only open it if one exact repo-side defect is named after rerun, for example:
- malformed or incomplete registry metadata in `server.json`
- mismatched package/server identity proven by a registry-side error
- one exact README/PUBLISHING instruction that blocks operator execution

No such exact defect is evidenced now.

## Data shapes / Types
```ts
type ExternalAcceptanceVerdict =
  | 'WAIT_FOR_SECRET_FIX'
  | 'READY_FOR_OPERATOR_RERUN'
  | 'OPEN_REPO_PATCH_FIRST'
  | 'MARKETPLACE_EXTERNAL_ONLY';

interface ExternalAcceptanceState {
  npmProofLive: boolean;
  officialRegistryAccepted: boolean;
  smitheryAccepted: boolean;
  blockerClass: 'repo_side' | 'secret_operator_side' | 'external_marketplace_side';
  verdict: ExternalAcceptanceVerdict;
}
```

## Real samples
### Sample 1
Input:
- npm package live
- public registry endpoint returns 404 server not found

Expected output:
- do not claim acceptance; recommend operator rerun first

### Sample 2
Input:
- repo metadata looks coherent
- no exact broken file/field is identified

Expected output:
- do not open coder task

### Sample 3
Input:
- Smithery also lacks a public accepted page

Expected output:
- registry rerun remains the strongest next acceptance path

## Implementation hints (для coder)
- No coder task should start from this memo.
- If main wants a next move, it should be operator rerun only.
- File:line targets intentionally omitted because there is no justified repo patch from current evidence.

## Acceptance criteria
- [x] File exists at `/Users/vkdev/projects/agent-claim-mcp/business/agent-claim-mcp-external-acceptance-next-step-2026-05-07.md`
- [x] Single highest-confidence external acceptance path is named
- [x] Blocker class is explicit
- [x] Repo-side gap is either named exactly or explicitly ruled out
- [x] Final verdict enum is explicit and bounded

## Open questions / Risks
- This memo does not prove whether the rerun will succeed; it only identifies the most truthful next lane.
- If the rerun succeeds internally but public registry visibility still lags, the next state may become marketplace/external-only without implying repo drift.
- Smithery may still matter later, but it is not the strongest acceptance path right now.

## What to do next
1. Запустить documented official-registry rerun path for the existing `1.0.0` release, owner: Main / operator, deadline: 2026-05-07 12:00 PT.
2. Проверить те же public registry endpoints сразу после rerun и ещё раз after short propagation window, owner: Main / operator, deadline: 2026-05-07 13:00 PT.
3. Обновить решение по coder dispatch only after rerun или marketplace response назовут один exact repo-side defect, owner: Main, deadline: 2026-05-07 18:00 PT.

## Sources
- `/Users/vkdev/.openclaw/workspace/plans/agent-claim-mcp.md`
- `/Users/vkdev/projects/agent-claim-mcp/business/agent-claim-mcp-public-distribution-proof-verdict-2026-05-06.md`
- `/Users/vkdev/projects/agent-claim-mcp/business/agent-claim-mcp-first-distribution-acceptance-2026-05-04.md`
- `/Users/vkdev/.openclaw/workspace/business/agent-claim-mcp-official-registry-verification-packet-2026-05-05.md`
- `/Users/vkdev/projects/agent-claim-mcp/PUBLISHING.md`
- `/Users/vkdev/projects/agent-claim-mcp/business/agent-claim-mcp-official-registry-live-verdict-2026-05-06.md`
- `https://registry.modelcontextprotocol.io/v0/servers/io.github.vk0dev%2Fagent-claim-mcp/versions`
- `https://registry.modelcontextprotocol.io/v0/servers?search=io.github.vk0dev/agent-claim-mcp`
- `https://registry.modelcontextprotocol.io/v0/servers?search=%40vk0%2Fagent-claim-mcp`
- `https://smithery.ai/servers/unfucker/agent-claim-mcp`
