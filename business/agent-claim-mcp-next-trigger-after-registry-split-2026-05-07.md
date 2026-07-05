# Spec: next trigger after registry-proof split for agent-claim-mcp
**Date:** 2026-05-07
**Author:** researcher
**Status:** draft

## Goal
Проверить, unlocked ли после уже принятого split между public npm proof и external registry proof хоть один честный autonomous repo-side task, или truthful next state по-прежнему сводится к ожиданию founder/operator action: fix `NPM_TOKEN` и rerun workflow `25282612113`.

## Investigation questions
1. Что именно current plan-of-record считает truthful Phase 2.0 state после registry-proof split?
2. Согласованы ли current README, `PUBLISHING.md` и registry runbook с этим split state?
3. Есть ли один exact repo-side stale surface или missing operator artifact, который можно чинить до founder secret fix?
4. Если repo-side gap нет, какой exact next trigger остаётся strongest?
5. Оправдан ли сейчас хоть один bounded coder task?

## Findings

### Q1: Что именно current plan-of-record считает truthful Phase 2.0 state после registry-proof split?
Plan-of-record однозначно удерживает проект в validating state и не открывает новый repo-side lane до operator rerun или live marketplace signal.

Ключевые anchors:
- `~/.openclaw/workspace/plans/agent-claim-mcp.md:3-4` — `Status: validating`, `Current Phase: 2.0`
- `~/.openclaw/workspace/plans/agent-claim-mcp.md:77` — canonical post-secret-fix brief already exists, current recommended enum remains `WAIT_FOR_SECRET_FIX`, and “no repo patch is required before rerun”
- `~/.openclaw/workspace/plans/agent-claim-mcp.md:88` — public npm distribution proof is already done, external registry/marketplace proof remains pending, and **do not create new coder work from this lane unless a later operator rerun or live marketplace check reveals one exact repo-side file gap**

This means the plan already encodes the anti-churn answer: current autonomous repo-side lane is closed unless a concrete file-level contradiction appears.

### Q2: Согласованы ли current README, `PUBLISHING.md` и registry runbook с этим split state?
Да. Current repo truth is internally aligned and repeats the same next step without contradiction.

#### README
- `README.md:10` — npm is live, Official MCP Registry validation is still pending, and the package should not be described as registry-accepted or marketplace-listed
- `README.md:12` — exact next manual step is to fix repo `NPM_TOKEN` and rerun workflow `25282612113`
- `README.md:25` — exact rerun command is present: `gh run rerun 25282612113 --repo vk0dev/agent-claim-mcp`
- `README.md:34` — operator is pointed to the runbook quick path

#### PUBLISHING
- `PUBLISHING.md:28` — current truthful status says npm publish is live, but Official MCP Registry acceptance is still not proven because workflow `25282612113` did not reach a usable registry-validation finish
- `PUBLISHING.md:84` — exact secret to fix is `NPM_TOKEN`
- `PUBLISHING.md:95` — exact rerun command is present
- `PUBLISHING.md:104` — explicit anti-overclaim note: do not claim Official MCP Registry acceptance before evidence exists

#### Official registry runbook
- `docs/official-registry-validation-runbook.md:23` — next truthful operator action is to rerun `25282612113` after fixing `NPM_TOKEN`
- `docs/official-registry-validation-runbook.md:25` — until that rerun reaches registry steps, the correct state is `SOFT-BLOCKED`, not PASS
- `docs/official-registry-validation-runbook.md:207` — the publish workflow URL is already substituted with the real run URL `https://github.com/vk0dev/agent-claim-mcp/actions/runs/25282612113`

So the main repo surfaces are already coherent. I did not find one surface saying “registry accepted” while another says “pending”, nor one surface still carrying a stale rerun placeholder.

### Q3: Есть ли один exact repo-side stale surface или missing operator artifact, который можно чинить до founder secret fix?
Нет. On current HEAD, I did not find one exact repo-side stale statement or missing operator artifact that would justify a bounded coder/docs task before the secret fix.

Why no repo-side task is justified:
1. The public milestone split is already documented in the plan and recent business memos.
2. README already points external users and operators to the truthful npm-live / registry-pending state.
3. `PUBLISHING.md` already names the failing run, the exact secret, and the rerun command.
4. The registry runbook already carries the real run URL and the correct `SOFT-BLOCKED` state.
5. The recent business memos agree with the same shape:
   - `agent-claim-mcp-public-distribution-proof-verdict-2026-05-06.md` says public npm proof is done and no coder task is justified now.
   - `agent-claim-mcp-external-acceptance-next-step-2026-05-07.md` says the strongest next path is operator rerun first and no exact repo-side gap is evidenced now.

### Q4: Если repo-side gap нет, какой exact next trigger остаётся strongest?
The strongest next trigger is still human/operator-side, not repo-side:

> founder/operator fixes GitHub repo secret `NPM_TOKEN`, reruns workflow `25282612113`, and only then produces new evidence from registry steps or public registry endpoints.

That trigger can unlock one of two later states:
1. **No repo gap still** → keep operator/external follow-up only.
2. **Exact repo-side defect revealed** → then and only then open one bounded coder/docs task with file target(s).

Until the rerun produces that evidence, the next truthful state is waiting for the human trigger rather than inventing new autonomous work.

### Q5: Оправдан ли сейчас хоть один bounded coder task?
No. There is no smallest truthful patch to recommend right now.

If a later rerun exposes a concrete defect, likely candidate surfaces would be one of:
- `server.json`
- `package.json`
- `README.md`
- `PUBLISHING.md`
- `docs/official-registry-validation-runbook.md`

But current evidence does not name any exact stale field, wrong URL, contradictory status line, or missing operator instruction on those files.

## Data shapes / Types
```ts
type Verdict = 'READY_FOR_CODER' | 'WAIT_FOR_HUMAN_TRIGGER' | 'HUMAN_EXTERNAL_ONLY'

interface NextTriggerAudit {
  verdict: Verdict
  planState: 'validating'
  npmProofDone: boolean
  registryProofDone: boolean
  exactRepoGapFound: boolean
  nextTrigger: string
}
```

## Real samples
1. **Plan sample**
   - Input: `~/.openclaw/workspace/plans/agent-claim-mcp.md:77,88`
   - Expected interpretation: no repo patch is required before rerun; no new coder work unless later evidence reveals one exact repo-side file gap

2. **README sample**
   - Input: `README.md:10-12,25,34`
   - Expected interpretation: npm-live / registry-pending split and the rerun path are already documented for users and operators

3. **Runbook sample**
   - Input: `docs/official-registry-validation-runbook.md:23-25,207`
   - Expected interpretation: current state is explicitly `SOFT-BLOCKED`, and the real rerun workflow URL is already present

## Implementation hints (для coder)
No coder task recommended now.

If a later rerun produces an exact repo-side contradiction, the future task must name:
- the single failing surface
- exact file target(s)
- smallest truthful patch only

Current evidence does not meet that bar.

## Acceptance criteria
- [x] Memo exists at the required path
- [x] Current plan split and repo truth were checked against each other
- [x] Exact file:line evidence supports the no-drift conclusion
- [x] Final verdict says plainly whether any autonomous repo-side task is unlocked now

## Open questions / Risks
- This audit does not prove the rerun will succeed. It only proves that current repo-side documentation and operator surfaces are already coherent enough that no additional autonomous repo patch is justified first.
- If the rerun succeeds internally but public registry visibility still lags, the next state may shift from `WAIT_FOR_HUMAN_TRIGGER` to `HUMAN_EXTERNAL_ONLY` without implying repo drift.
- If the rerun fails with a new exact registry-side message that names one metadata defect, this memo should be superseded by a narrower file-targeted follow-up.

## Verdict
**WAIT_FOR_HUMAN_TRIGGER**

## Recommended next step
Do not open a coder/docs task now. Wait for the founder/operator trigger only: fix repo secret `NPM_TOKEN`, rerun workflow `25282612113`, then re-audit only if that rerun or the public registry surface reveals one exact repo-side file gap.