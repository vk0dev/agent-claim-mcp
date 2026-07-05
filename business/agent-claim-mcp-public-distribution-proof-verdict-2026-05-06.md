# Spec: public distribution proof verdict for agent-claim-mcp
**Date:** 2026-05-06
**Author:** researcher
**Status:** draft

## Goal
Зафиксировать один канонический verdict по уже достигнутому public distribution proof для `agent-claim-mcp`, примирить его с ещё незакрытым registry acceptance checkbox, и дать main конкретную рекомендацию: держать текущий validating milestone как есть или разделить его на более точные подmilestone без нового coder churn.

## Investigation questions
1. Какой strongest truthful public distribution proof уже есть сегодня?
2. Достаточно ли этого proof, чтобы честно закрыть более узкий milestone even if Official MCP Registry remains unproven?
3. Слишком ли coarse текущее acceptance language в плане?
4. Нужен ли сейчас какой-либо coder task?
5. Какой итоговый enum честнее: `KEEP_VALIDATING` | `SPLIT_MILESTONE_AND_CONTINUE` | `READY_FOR_PHASE_REVIEW`?

## Findings

### Q1: The strongest truthful public distribution proof already achieved today is live npm distribution, not registry acceptance
Current strongest public proof is narrower than the plan’s final checkbox, but it is still real and externally visible.

What is already publicly proven:
- `@vk0/agent-claim-mcp@1.0.0` is live on npm
- the live package identity matches repo metadata and `server.json`
- the package is publicly discoverable and installable from the canonical public package surface

Grounding from current artifacts:
- `~/.openclaw/workspace/plans/agent-claim-mcp.md` already says `npm: @vk0/agent-claim-mcp (live at 1.0.0)` and marks the npm acceptance checkbox complete
- `~/projects/agent-claim-mcp/business/agent-claim-mcp-first-distribution-acceptance-2026-05-04.md` explicitly treated post-publish acceptance as a separate later step and assumed npm publish itself had already become the base public proof
- `~/projects/agent-claim-mcp/business/agent-claim-mcp-official-registry-live-verdict-2026-05-06.md` reconfirmed that npm proof is healthy while Official MCP Registry remains unproven
- `~/projects/agent-claim-mcp/PUBLISHING.md` says current truthful status for `v1.0.0` is: npm publish is already live, but Official MCP Registry acceptance is still not proven

This means the strongest truthful public distribution proof today is:
**public npm distribution at `@vk0/agent-claim-mcp@1.0.0`, with aligned package/server identity.**

That is a real milestone, but it is not the same as marketplace/registry acceptance.

### Q2: Yes, this proof justifies marking a narrower milestone as done
The narrow milestone that can already be treated as done is:
- **public package distribution proof achieved**

Why this narrower milestone is already earned:
- the package is public on the main intended public package surface (npm)
- repo/package/server identity is coherent
- no evidence in current artifacts suggests npm drift or broken public package metadata
- the remaining blocker is about downstream acceptance/discovery surfaces, not about first public distribution itself

What this narrower milestone does **not** prove:
- Official MCP Registry validation
- live Smithery proof
- “first marketplace acceptance” in the plan’s current wording

So the honest interpretation is:
- **distribution proof done**
- **registry/marketplace proof still pending**

### Q3: The current plan acceptance checkbox is too coarse and should be split on the next plan edit
The exact acceptance line that is now too coarse is in `~/.openclaw/workspace/plans/agent-claim-mcp.md`:

- `[ ] At least one of: server.json validated by Official MCP Registry OR live Smithery listing.`

Why this line is too coarse now:
1. It mixes two different classes of proof into one checkbox:
   - public distribution proof
   - downstream marketplace/registry acceptance proof
2. It hides the fact that one important external milestone is already real today:
   - npm public distribution
3. It makes the whole project look more blocked than it actually is, even though the package is already live and externally visible on npm
4. It encourages churn around one still-missing acceptance branch instead of recognizing the already-achieved public proof layer

### Recommended split for the next plan edit
Main should keep the project in validating status overall, but split the acceptance language into two milestones:

**Milestone A — Public distribution proof**
- package publicly live on npm
- package/server identity aligned
- canonical install surface exists

**Milestone B — External registry/marketplace proof**
- at least one of:
  - Official MCP Registry public validation
  - live Smithery listing

This split would preserve truth without inflating the phase to “done”.

### Q4: No coder task is justified right now
No coder task is justified from current evidence.

Why:
- the gap is not code implementation
- the gap is not missing repo metadata proven by this pass
- the gap is not documentation absence, because `PUBLISHING.md` and the registry verification docs already describe the operator path
- the next move is still operator-side rerun / external proof gathering

So the correct immediate owner remains:
- **main/operator**, not coder

### Q5: Final verdict enum
**SPLIT_MILESTONE_AND_CONTINUE**

Why this is not `KEEP_VALIDATING`:
- keeping the exact current checkbox unchanged preserves truth, but it hides the real completed milestone we already have
- it is less decision-useful for main than a split

Why this is not `READY_FOR_PHASE_REVIEW`:
- the still-open registry/marketplace proof means the broader validating phase is not ready to be treated as fully reviewed/accepted
- there is still unresolved external acceptance work

Why `SPLIT_MILESTONE_AND_CONTINUE` fits best:
- it acknowledges the real public npm proof already achieved
- it keeps the broader validation phase honest
- it avoids inventing coder work where none is justified
- it gives main one precise next edit to make planning language match reality

## Data shapes / Types
```ts
type PublicDistributionVerdict =
  | 'KEEP_VALIDATING'
  | 'SPLIT_MILESTONE_AND_CONTINUE'
  | 'READY_FOR_PHASE_REVIEW';

interface AcceptanceSplitRecommendation {
  currentAcceptanceLine: string;
  publicDistributionProofDone: boolean;
  registryProofDone: boolean;
  coderTaskJustified: boolean;
  verdict: PublicDistributionVerdict;
}
```

## Real samples
### Sample 1: already-earned proof
Input:
- npm package public and aligned with repo metadata
- registry proof still absent

Expected output:
- mark public distribution as achieved
- keep registry proof pending

### Sample 2: too-coarse acceptance language
Input:
- single checkbox mixes registry/marketplace proof into one final gate

Expected output:
- recommend splitting into distribution proof vs registry/marketplace proof

### Sample 3: coder-task decision
Input:
- no repo-side defect surfaced in current artifacts

Expected output:
- no coder task justified now

## Implementation hints (для coder)
- No coder task recommended.
- If a later operator rerun exposes a concrete mismatch, only then create a bounded coder task with exact file targets.
- This memo does not surface any current file:line implementation gap.

## Acceptance criteria
- [x] Memo exists with today's date
- [x] Strongest current public distribution proof is named explicitly
- [x] Recommendation says whether to split the current plan acceptance language
- [x] Memo states whether a coder task is justified now
- [x] Final verdict enum is explicit

## Open questions / Risks
- This memo intentionally does not re-open live Smithery verification; it only reconciles current planning language with already-established npm proof and today’s registry SOFT-BLOCKED verdict.
- If main already has separate live Smithery proof later, the external registry/marketplace milestone could close without changing the public distribution milestone.
- The plan should remain overall `Status: validating` until the external registry/marketplace proof milestone closes.

## What to do next
1. На следующем plan edit split acceptance language in `~/.openclaw/workspace/plans/agent-claim-mcp.md` into `public distribution proof` and `external registry/marketplace proof`, owner: Main, deadline: next bounded plan refresh today.
2. Keep overall project status validating while the external proof milestone remains open, owner: Main, deadline: until registry or Smithery proof is actually recorded.
3. Do not create coder work now; only trigger operator rerun / external proof follow-up, owner: Main/operator, deadline: next operator pass after plan wording refresh.

## Sources
- `/Users/vkdev/.openclaw/workspace/plans/agent-claim-mcp.md`
- `/Users/vkdev/projects/agent-claim-mcp/business/agent-claim-mcp-first-distribution-acceptance-2026-05-04.md`
- `/Users/vkdev/projects/agent-claim-mcp/business/agent-claim-mcp-official-registry-live-verdict-2026-05-06.md`
- `/Users/vkdev/projects/agent-claim-mcp/PUBLISHING.md`
