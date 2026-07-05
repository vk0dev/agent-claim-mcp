# Spec: live Smithery verdict for agent-claim-mcp
**Date:** 2026-05-08
**Author:** researcher
**Status:** draft

## Goal
Проверить, существует ли сегодня live public Smithery acceptance path for `agent-claim-mcp`, и меняет ли это remaining external acceptance state настолько, чтобы открывать новый coder task, или truthful lane всё ещё остаётся externally blocked without repo churn.

## Investigation questions
1. Какие exact public Smithery URLs были проверены и что они вернули?
2. Есть ли сегодня live Smithery listing for `agent-claim-mcp`?
3. Если live Smithery listing exists, закрывает ли он remaining external acceptance checkbox?
4. Если listing does not exist, какой smallest truthful next step и кто owner?
5. Обнаружен ли хоть один repo-side metadata gap, который оправдывает later coder task?

## Findings

### Q1: Какие exact public Smithery URLs были проверены и что они вернули?
I checked these exact public Smithery surfaces:

1. `https://smithery.ai/server/agent-claim-mcp`
   - Returned: **404**
   - Final URL: `https://smithery.ai/servers/agent-claim-mcp`
   - Body prefix: `# 404 — Server Not Found`

2. `https://smithery.ai/server/%40vk0%2Fagent-claim-mcp`
   - Returned: **404**
   - Final URL: `https://smithery.ai/md/servers/vk0/agent-claim-mcp`
   - Body prefix: `# 404 — Server Not Found`

3. `https://smithery.ai/servers?q=agent-claim-mcp`
   - Returned: **200**
   - Search page rendered, but no exact `agent-claim-mcp` listing was surfaced in the returned visible result body prefix.

4. `https://smithery.ai/servers?q=%40vk0%2Fagent-claim-mcp`
   - Returned: **200**
   - Search page rendered, but the visible result body prefix surfaced unrelated entries, not `agent-claim-mcp`.

Additionally, CLI-style public search was checked via:
- `npx -y smithery mcp search "@vk0/agent-claim-mcp"`
- `npx -y smithery mcp search "agent-claim-mcp"`
- `npx -y smithery mcp search "agent claim mcp"`

Those searches returned public results, but no exact match line containing `agent-claim-mcp`, `@vk0`, or `vk0` as this package/server.

### Q2: Есть ли сегодня live Smithery listing for `agent-claim-mcp`?
**No live Smithery listing is verified today** from public evidence.

The strongest evidence is direct:
- both candidate direct server URLs returned public `404 — Server Not Found`
- public search surfaces returned generic result pages, but did not surface an exact `agent-claim-mcp` match
- CLI-style Smithery search also did not return an exact listing match

That is not enough to claim live Smithery acceptance.

### Q3: If a live Smithery listing existed, would that satisfy the remaining external acceptance checkbox?
Yes, in principle. The current plan explicitly allows remaining external acceptance proof to be satisfied by **either**:
- Official MCP Registry public validation, **or**
- live Smithery listing

Plan evidence:
- `~/.openclaw/workspace/plans/agent-claim-mcp.md:84-85` keeps the remaining acceptance checkbox as: “at least one of Official MCP Registry validation or live Smithery listing.”

But because no live Smithery listing is verified today, the checkbox remains unfulfilled.

### Q4: If Smithery is not satisfied, what is the smallest truthful next step and owner?
The smallest truthful next step is still **main/operator-side**, not coder-side:

1. keep the current repo state unchanged
2. treat Smithery as **not yet proven live**
3. continue the already-documented operator path on Official MCP Registry (`NPM_TOKEN` fix + rerun `25282612113`)
4. optionally re-check Smithery later only when there is a concrete submission/listing event or a public URL to verify

Owner: **main/operator/founder**, not coder.

### Q5: Was any repo-side metadata gap discovered that justifies a later coder task?
No exact repo-side metadata gap was discovered in this Smithery check.

Current repo truth remains coherent:
- `README.md:10-12` still truthfully says npm is live while Official MCP Registry remains pending and the current next manual step is to fix `NPM_TOKEN` and rerun workflow `25282612113`
- `package.json` remains coherent at `@vk0/agent-claim-mcp@1.0.0`
- `server.json` remains present and aligned with current identity
- `agent-claim-mcp-public-distribution-proof-verdict-2026-05-06.md` already established the truthful split: public npm proof done, external registry/marketplace proof pending

So this live Smithery check does **not** unlock a bounded coder task now.

## Repo evidence anchors
- `~/.openclaw/workspace/plans/agent-claim-mcp.md:3` — plan still `Status: validating`
- `~/.openclaw/workspace/plans/agent-claim-mcp.md:84-85` — remaining external acceptance may be satisfied by Official MCP Registry **or** live Smithery listing
- `~/.openclaw/workspace/plans/agent-claim-mcp.md:88` — do not create new coder work unless a later operator rerun or live marketplace check reveals one exact repo-side file gap
- `README.md:10-12` — npm live, registry pending, next manual step still `NPM_TOKEN` fix + rerun
- `package.json` — `name=@vk0/agent-claim-mcp`, `version=1.0.0`
- `server.json` — current MCP server identity remains aligned
- `business/agent-claim-mcp-public-distribution-proof-verdict-2026-05-06.md` — public npm proof already done, external registry/marketplace proof remains pending

## Data shapes / Types
```ts
type Verdict = 'PASS' | 'SOFT-BLOCKED' | 'FAIL'

interface SmitheryLiveCheck {
  checkedUrls: string[]
  liveListingExists: boolean
  satisfiesExternalAcceptance: boolean
  repoSideGapFound: boolean
  verdict: Verdict
}
```

## Real samples
1. **Direct Smithery candidate URL**
   - Input: `https://smithery.ai/server/agent-claim-mcp`
   - Output: `404 — Server Not Found`
   - Interpretation: no verified live direct listing at that path

2. **Scoped Smithery candidate URL**
   - Input: `https://smithery.ai/server/%40vk0%2Fagent-claim-mcp`
   - Output: `404 — Server Not Found`
   - Interpretation: no verified live vendor-scoped listing at that path either

3. **Repo truth sample**
   - Input: `README.md:10-12`
   - Interpretation: current repo already stays honest about external acceptance being pending; no repo patch is implied by this Smithery result

## Implementation hints (для coder)
No coder task is justified now.

A later coder task should be opened only if one of these becomes true:
- a live Smithery listing appears and reveals one exact stale repo-side statement
- Smithery submission feedback names one exact metadata mismatch in `README.md`, `package.json`, or `server.json`

Neither condition is true today.

## Acceptance criteria
- [x] Memo exists with today’s date
- [x] Exact public Smithery URLs checked are listed
- [x] Verdict tells main whether coder churn is justified now
- [x] No speculative marketplace claim is made

## Open questions / Risks
- This check proves current public Smithery acceptance is **not verified**, but it does not prove whether a private/in-flight Smithery submission may exist elsewhere.
- If Smithery later exposes a canonical listing URL or a submission result page, this memo should be superseded by a narrower live re-check.

## Verdict
**SOFT-BLOCKED**

## Recommended next step
Do not open a coder task now. Keep the lane honest: Smithery does not provide verified public acceptance today, so the smallest truthful next step remains operator-side, with Official MCP Registry rerun still the strongest concrete path unless a real Smithery listing URL appears later.