# Spec: live official registry verdict for agent-claim-mcp
**Date:** 2026-05-06
**Author:** researcher
**Status:** draft

## Goal
Дать один свежий truthful verdict по первому внешнему acceptance target для `agent-claim-mcp`: можно ли уже честно считать, что `@vk0/agent-claim-mcp` прошёл acceptance через Official MCP Registry, или этот критерий всё ещё не подтверждён / заблокирован.

## Investigation questions
1. Что сейчас подтверждают live public npm surfaces для `@vk0/agent-claim-mcp`?
2. Видно ли сегодня `io.github.vk0dev/agent-claim-mcp` в Official MCP Registry по публичным endpoint'ам?
3. Достаточно ли этого, чтобы acceptance criterion из плана был отмечен как выполненный?
4. Если нет, какой smallest truthful next step и кто owner?
5. Какой итоговый enum честнее: `PASS` | `SOFT-BLOCKED` | `FAIL`?

## Findings

### Q1: npm package is publicly live and aligned with repo metadata
Current repo truth is internally aligned:
- `server.json` declares server id `io.github.vk0dev/agent-claim-mcp`
- `server.json` package identifier is `@vk0/agent-claim-mcp`
- `server.json` version is `1.0.0`
- `PUBLISHING.md` and `docs/official-registry-validation-runbook.md` both still say Official MCP Registry acceptance is not yet proven from repo evidence alone
- plan file `~/.openclaw/workspace/plans/agent-claim-mcp.md` still leaves the last acceptance checkbox open

Live npm evidence checked today:

1. `https://registry.npmjs.org/@vk0%2Fagent-claim-mcp`
   - returned `HTTP 200`
   - JSON shows `_id = @vk0/agent-claim-mcp`
   - `dist-tags.latest = 1.0.0`
   - package metadata includes `mcpName = io.github.vk0dev/agent-claim-mcp`
   - description/homepage/license are present

2. `npm view @vk0/agent-claim-mcp version dist-tags --json`
   - returned version `1.0.0`
   - returned `dist-tags.latest = 1.0.0`

3. `npm view @vk0/agent-claim-mcp mcpName description homepage license --json`
   - returned `mcpName = io.github.vk0dev/agent-claim-mcp`
   - returned expected description, homepage, and `MIT`

Conclusion for npm: the package is publicly live and consistent with current repo metadata. The remaining uncertainty is not npm publication.

### Q2: Official MCP Registry is not visibly reachable today for `io.github.vk0dev/agent-claim-mcp`
Exact public Official MCP Registry URLs checked today:

1. `https://registry.modelcontextprotocol.io`
   - returned `HTTP 200`
   - root registry surface loads normally (`Official MCP Registry` / `Loading servers...`)
   - this proves the registry surface itself is up, but not that this specific server is listed

2. `https://registry.modelcontextprotocol.io/v0/servers/io.github.vk0dev%2Fagent-claim-mcp/versions`
   - returned `HTTP 404`
   - body: `{"title":"Not Found","status":404,"detail":"Server not found"}`

3. `https://registry.modelcontextprotocol.io/v0/servers?search=io.github.vk0dev/agent-claim-mcp`
   - returned `HTTP 200`
   - body shows `{"servers":[],"metadata":{"count":0}}`

4. `https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.vk0dev/agent-claim-mcp`
   - returned `HTTP 200`
   - body shows `{"servers":[],"metadata":{"count":0}}`

5. `https://registry.modelcontextprotocol.io/v0/servers?search=%40vk0%2Fagent-claim-mcp`
   - returned `HTTP 200`
   - body shows `{"servers":[],"metadata":{"count":0}}`

6. `https://registry.modelcontextprotocol.io/v0.1/servers?search=%40vk0%2Fagent-claim-mcp`
   - did not produce a positive listing result during this pass; timed out with no payload before proving presence

Interpretation:
- I found no current public registry evidence that `io.github.vk0dev/agent-claim-mcp` is live in Official MCP Registry
- this is stronger than “ambiguous logs”: the public registry endpoints checked today do not show the server
- therefore Official MCP Registry acceptance cannot be claimed today

### Q3: The plan acceptance criterion cannot yet be marked satisfied from current allowed evidence
Plan acceptance criterion:
- `At least one of: server.json validated by Official MCP Registry OR live Smithery listing`

From the bounded scope of this task, only npm + Official MCP Registry public surfaces were checked.

What can be marked truthfully today:
- **Official MCP Registry branch:** not satisfied, because the server is not publicly reachable from the checked registry endpoints
- **Smithery branch:** not evaluated in this bounded task, so it cannot be used to mark the criterion satisfied here

Therefore the acceptance criterion as a whole should still remain **not satisfied / unproven** in main planning until a valid alternative proof is recorded.

### Q4: No new coder task is justified; the smallest truthful next step is operator-side rerun / republish validation
No repo-side metadata mismatch surfaced in this pass:
- `server.json` is aligned with the public npm package
- package identity/version are coherent
- existing docs already describe the rerun path and conservative validation rules

That means a new coder task is **not justified** from current evidence.

Smallest truthful next step:
1. main/operator fixes or re-verifies the repo secret `NPM_TOKEN` if needed
2. main/operator reruns workflow `25282612113` for `vk0dev/agent-claim-mcp`
3. main/operator validates whether the rerun actually publishes to Official MCP Registry or yields a concrete registry-side artifact
4. only after public registry reachability exists should acceptance be marked PASS

Owner: **main/operator**

### Q5: Final verdict enum
**SOFT-BLOCKED**

Why this is not `PASS`:
- Official MCP Registry listing is not publicly reachable from the endpoints checked today
- acceptance via registry therefore remains unproven

Why this is not `FAIL`:
- npm package is already live and coherent
- no repo-side metadata defect was found
- the missing part is external acceptance proof / rerun outcome, not a broken product package

## Data shapes / Types
```ts
type LiveVerdict = 'PASS' | 'SOFT-BLOCKED' | 'FAIL';

interface RegistryCheckResult {
  url: string;
  httpStatus: number | 'timeout';
  summary: string;
}
```

## Real samples
### Sample 1: npm package truth
Input:
- `https://registry.npmjs.org/@vk0%2Fagent-claim-mcp`

Expected output:
- `HTTP 200`
- package `@vk0/agent-claim-mcp`
- latest `1.0.0`
- `mcpName = io.github.vk0dev/agent-claim-mcp`

### Sample 2: direct registry versions endpoint
Input:
- `https://registry.modelcontextprotocol.io/v0/servers/io.github.vk0dev%2Fagent-claim-mcp/versions`

Expected output for current live pass:
- `HTTP 404`
- `Server not found`

### Sample 3: registry search fallback
Input:
- `https://registry.modelcontextprotocol.io/v0/servers?search=io.github.vk0dev/agent-claim-mcp`

Expected output for current live pass:
- `HTTP 200`
- empty `servers[]`

## Implementation hints (для coder)
- No coder task recommended now.
- If a future rerun still fails after valid operator-side retry, only then open a bounded coder task against the exact failing file or workflow step.
- If a repo-side gap is later found, likely file targets would be one of:
  - `/Users/vkdev/projects/agent-claim-mcp/server.json`
  - `/Users/vkdev/projects/agent-claim-mcp/.github/workflows/publish.yml`
  - `/Users/vkdev/projects/agent-claim-mcp/package.json`
  but no such gap is evidenced by this pass.

## Acceptance criteria
- [x] Memo exists with today's date
- [x] Public npm surfaces were checked live
- [x] Public Official MCP Registry surfaces were checked live
- [x] Verdict states whether the acceptance criterion can be marked satisfied
- [x] Memo tells main whether a new coder task is justified

## Open questions / Risks
- This memo intentionally does not evaluate Smithery because the dispatch constrained live checks to npm + Official MCP Registry only.
- If main already has separate live Smithery proof, the overall project acceptance checkbox could still be satisfied through that alternate branch, but that proof is outside this memo’s evidence set.
- If a rerun or manual registry publish has already happened after the last documented packet and the public registry has not yet indexed it, the honest status is still unproven until the public surface changes.

## What to do next
1. Перезапустить или верифицировать operator path for workflow `25282612113` and its registry step, owner: Main/operator, deadline: today within the next operator pass.
2. Проверить публичный Official MCP Registry again only after that rerun/manual registry follow-up, owner: Main/operator, deadline: immediately after rerun completes.
3. Не открывать coder task unless rerun exposes a concrete repo-side mismatch in `server.json`, `package.json`, or `.github/workflows/publish.yml`, owner: Main, deadline: only if the operator proof fails again.

## Sources
- `/Users/vkdev/projects/agent-claim-mcp/server.json`
- `/Users/vkdev/projects/agent-claim-mcp/PUBLISHING.md`
- `/Users/vkdev/projects/agent-claim-mcp/docs/official-registry-validation-runbook.md`
- `/Users/vkdev/projects/agent-claim-mcp/business/agent-claim-mcp-official-registry-rerun-packet-2026-05-06.md`
- `/Users/vkdev/projects/agent-claim-mcp/business/agent-claim-mcp-official-registry-rerun-checklist-2026-05-06.md`
- `/Users/vkdev/projects/agent-claim-mcp/business/agent-claim-mcp-first-distribution-acceptance-2026-05-04.md`
- `https://registry.npmjs.org/@vk0%2Fagent-claim-mcp`
- `https://registry.modelcontextprotocol.io`
- `https://registry.modelcontextprotocol.io/v0/servers/io.github.vk0dev%2Fagent-claim-mcp/versions`
- `https://registry.modelcontextprotocol.io/v0/servers?search=io.github.vk0dev/agent-claim-mcp`
- `https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.vk0dev/agent-claim-mcp`
- `https://registry.modelcontextprotocol.io/v0/servers?search=%40vk0%2Fagent-claim-mcp`
