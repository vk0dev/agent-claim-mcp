# Spec: official registry validation packet after npm auth rerun prerequisites for agent-claim-mcp
**Date:** 2026-05-05
**Author:** researcher
**Status:** draft

## Goal
Дать main exact post-rerun validation packet для первого truthful Official MCP Registry acceptance check after `gh run rerun 25282612113 --repo vk0dev/agent-claim-mcp`, once the npm auth blocker is removed. Этот packet не про repo changes и не про новые marketplace steps. Он только про: prerequisite, exact validation sequence, exact evidence to capture, verdict matrix `PASS / SOFT-BLOCKED / FAIL`, safe proof surfaces, and forbidden claims if the rerun still does not reach registry steps.

## Investigation questions
1. Какой exact rerun prerequisite must be true before validation starts?
2. Какой exact validation sequence должен выполнить main после rerun?
3. Какие evidence artifacts и commands обязательно capture?
4. Какие exact rules отличают `PASS`, `SOFT-BLOCKED`, и `FAIL`?
5. Какие claims всё ещё запрещены до registry proof?

## Findings

### Q1: exact rerun prerequisite
The validation packet becomes active only after this prerequisite is true:

- repo secret `NPM_TOKEN` is fixed so the publish workflow can pass the explicit auth gate added in commit `349533c`
- main runs:
```bash
gh run rerun 25282612113 --repo vk0dev/agent-claim-mcp
```
- canonical run URL format for that run id:
  - `https://github.com/vk0dev/agent-claim-mcp/actions/runs/25282612113`
- the rerun advances past:
  - `Verify npm publish credentials`
  - `Publish to npm with provenance`

Why this is the correct prerequisite:
- `.github/workflows/publish.yml` now explicitly fail-fast checks for missing/bad npm auth via `NODE_AUTH_TOKEN` and `npm whoami`
- current plan note says the honest autonomous lane stays closed until valid repo secret exists and that rerun reaches registry steps
- previous validation evidence shows the older run failed before any registry step, so it cannot be reused as registry acceptance proof

### Q2: exact validation sequence after rerun
Run the sequence below in order.

#### 1) Confirm the rerun actually got past npm auth and npm publish
Inspect workflow run `25282612113` after rerun at `https://github.com/vk0dev/agent-claim-mcp/actions/runs/25282612113` and capture outcomes for:
- `Verify npm publish credentials`
- `Publish to npm with provenance`
- `Install mcp-publisher`
- `Authenticate to MCP Registry`
- `Publish to Official MCP Registry`

#### 2) Re-confirm live npm truth
```bash
cd ~/projects/agent-claim-mcp
npm view @vk0/agent-claim-mcp version --json
npm view @vk0/agent-claim-mcp dist-tags --json
npm view @vk0/agent-claim-mcp name version description
npm view @vk0/agent-claim-mcp dist.unpackedSize
```

#### 3) Re-check packaged metadata from the published tarball
```bash
cd ~/projects/agent-claim-mcp
rm -f vk0-agent-claim-mcp-*.tgz
npm pack @vk0/agent-claim-mcp --silent
TARBALL=$(ls -t vk0-agent-claim-mcp-*.tgz | head -n 1)
tar -xOf "$TARBALL" package/package.json | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const j=JSON.parse(s); console.log(JSON.stringify({name:j.name,version:j.version,description:j.description}, null, 2));})'
tar -xOf "$TARBALL" package/server.json | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const j=JSON.parse(s); console.log(JSON.stringify({name:j.name,version:j.version,packages:j.packages}, null, 2));})'
tar -tf "$TARBALL" | egrep 'package/(server.json|package.json|dist/)'
```

#### 4) Check registry-side evidence bar
Use the runbook truth standard:
- registry success is proven only if workflow logs clearly show successful registry auth/publish, **or** a concrete registry-side artifact exists
- warning-only or ambiguous logs are not enough for `PASS`
- do not claim any success until the rerun clearly reaches the registry steps and the evidence above is captured

### Q3: exact evidence to capture
Main should record all of the following in the verdict packet or adjacent evidence note:

1. **Workflow URL** for the rerun of `25282612113` (canonical format: `https://github.com/vk0dev/agent-claim-mcp/actions/runs/25282612113`)
2. Step outcomes for:
   - `Verify npm publish credentials`
   - `Publish to npm with provenance`
   - `Install mcp-publisher`
   - `Authenticate to MCP Registry`
   - `Publish to Official MCP Registry`
3. Exact warning/error text, if any
4. `npm view` outputs for version and dist-tags
5. Tarball extraction outputs for packaged `package.json` and `server.json`
6. Registry surface URL / PR / listing, if one exists
7. One final verdict only: `PASS`, `SOFT-BLOCKED`, or `FAIL`

### Q4: exact verdict matrix
## PASS
Use **PASS** only if all are true:
- rerun passes `Verify npm publish credentials`
- rerun shows `Publish to npm with provenance` success
- packaged `package.json` and `server.json` still match `1.0.0` and `@vk0/agent-claim-mcp`
- `Authenticate to MCP Registry` shows clear success or at least no ambiguity blocking the next step
- `Publish to Official MCP Registry` shows clear success **or** a concrete registry-side artifact proves acceptance landed

## SOFT-BLOCKED
Use **SOFT-BLOCKED** if all are true:
- npm publish truth is still good
- packaged metadata is correct
- but registry publish is warning-only, ambiguous, or unverified
- and follow-up is still needed on the registry side before acceptance can be claimed

Typical examples:
- workflow prints `::warning::MCP Registry publish failed — may need manual 'mcp-publisher publish'`
- registry step logs do not clearly prove acceptance
- no concrete registry artifact is visible yet

## FAIL
Use **FAIL** if any are true:
- rerun still fails the npm auth gate
- rerun never reaches registry steps because publish workflow fails earlier
- published package metadata is wrong
- registry path shows a concrete blocking failure that prevents truthful availability claim

### Q5: safe proof surfaces and forbidden claims
## Safe to cite after rerun
These remain safe truth surfaces when they are backed by direct evidence:
- npm package existence at `@vk0/agent-claim-mcp`
- `server.json` identity `io.github.vk0dev/agent-claim-mcp`
- workflow URL and exact step outcomes
- concrete registry-side artifact, if one exists

## Do not claim before proof
Do **not** claim any of the following unless the rerun evidence actually proves them:
1. **Do not claim Official MCP Registry acceptance from npm success alone.**
2. **Do not claim registry success if the rerun never reaches registry steps.**
3. **Do not collapse warning-only registry output into success.**
4. **Do not use Smithery / Glama / other discovery surfaces as substitute proof for Official MCP Registry acceptance.**
5. **Do not cite the earlier failed workflow run as if it were superseded unless the rerun evidence is attached.**

## Data shapes / Types
```ts
interface RegistryValidationPacket {
  rerunPrerequisite: string;
  rerunCommand: string;
  workflowUrl: string;
  npmChecks: string[];
  tarballChecks: string[];
  registryChecks: string[];
  verdict: 'PASS' | 'SOFT-BLOCKED' | 'FAIL';
  safeProofSurfaces: string[];
  forbiddenClaims: string[];
}
```

## Real samples

### Sample 1: rerun prerequisite in workflow
From `.github/workflows/publish.yml`:
```yaml
- name: Verify npm publish credentials
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```
with fail-fast checks for missing token and failed `npm whoami`.

### Sample 2: current package truth
From `server.json`:
```json
{
  "name": "io.github.vk0dev/agent-claim-mcp",
  "version": "1.0.0",
  "packages": [
    {
      "identifier": "@vk0/agent-claim-mcp",
      "version": "1.0.0",
      "transport": { "type": "stdio" }
    }
  ]
}
```

### Sample 3: current known failed-run boundary
Current recorded failure from the earlier validation evidence:
- workflow run `25282612113`
- failed before registry steps
- previous truth bar therefore remained `FAIL`, not registry success

## Implementation hints (для coder)
No coder task is requested from this packet.

This packet is for main/operator execution after the external npm auth blocker is removed.

## Acceptance criteria
- [ ] Packet names the exact rerun prerequisite.
- [ ] Packet gives exact validation sequence after rerun.
- [ ] Packet gives exact `PASS / SOFT-BLOCKED / FAIL` matrix.
- [ ] Packet names safe proof surfaces and forbidden claims before proof.

## Open questions / Risks
- The rerun may pass npm auth but still leave registry acceptance ambiguous because `mcp-publisher` steps are `continue-on-error`.
- The registry-side artifact shape may vary, so operator must prefer direct concrete evidence over assumption.
- If the rerun ID remains the same logical run with appended attempts, operator should capture the exact rerun attempt context in screenshots/log snippets, not just the base run URL.

## Action summary for main
1. Fix repo `NPM_TOKEN` so the auth gate can pass.
2. Run:
```bash
gh run rerun 25282612113 --repo vk0dev/agent-claim-mcp
```
3. Follow the exact packet sequence above.
4. Record only one final verdict: `PASS`, `SOFT-BLOCKED`, or `FAIL`.
5. Do not claim Official MCP Registry acceptance until rerun evidence proves it.

## Sources
- `/Users/vkdev/.openclaw/workspace/plans/agent-claim-mcp.md`
- `/Users/vkdev/projects/agent-claim-mcp/README.md`
- `/Users/vkdev/projects/agent-claim-mcp/server.json`
- `/Users/vkdev/projects/agent-claim-mcp/PUBLISHING.md`
- `/Users/vkdev/projects/agent-claim-mcp/docs/official-registry-validation-runbook.md`
- `/Users/vkdev/projects/agent-claim-mcp/.github/workflows/publish.yml`
- `/Users/vkdev/projects/agent-claim-mcp/business/agent-claim-mcp-first-distribution-acceptance-2026-05-04.md`
- `/Users/vkdev/projects/agent-claim-mcp/business/agent-claim-mcp-official-registry-validation-2026-05-04.md`
