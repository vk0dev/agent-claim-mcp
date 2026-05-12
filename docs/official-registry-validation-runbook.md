# Official MCP Registry validation runbook for `agent-claim-mcp`

This runbook is the **first post-publish external-proof validation pass** for `@vk0/agent-claim-mcp`.
It is intentionally specific to this repo's current release flow:

- package: `@vk0/agent-claim-mcp`
- current version source: `package.json`, `server.json`, `src/createServer.ts`
- publish workflow: `.github/workflows/publish.yml`
- registry publish helper in CI: `mcp-publisher login github-oidc` + `mcp-publisher publish`

Important truthfulness note:
- **Do not run this before npm publish exists.**
- The GitHub Actions workflow already treats MCP Registry publish as `continue-on-error`, so this runbook is the follow-up path for checking what actually happened after the tag-driven publish.

Deterministic rerun evidence capture command after vk fixes `NPM_TOKEN` and reruns the tracked workflow:

```bash
node scripts/official_registry_rerun_capture.mjs --run-id 25282612113
```

If a concrete Official MCP Registry proof URL exists, rerun with:

```bash
node scripts/official_registry_rerun_capture.mjs --run-id 25282612113 --public-proof-url <official-registry-proof-url>
```

If the external proof branch is a live Smithery listing instead, run:

```bash
node scripts/official_registry_rerun_capture.mjs --run-id 25282612113 --smithery-url <smithery-listing-url>
```

Redirect the output into the dated verdict packet you want to keep under `business/`.

For a copy-pasteable writeup shape, start from `business/agent-claim-mcp-official-registry-rerun-verdict-template.md` and fill every field from the rerun plus npm/public proof checks.

## Current blocker packet, as of v1.0.0 workflow state

Use this section as the current truthful status packet until a fresh publish rerun reaches the registry steps.

- npm package `@vk0/agent-claim-mcp@1.0.0` is already live.
- GitHub Actions workflow run `25282612113` did **not** reach Official MCP Registry validation.
- The blocking reason was early npm authentication failure from missing or unusable repo secret `NPM_TOKEN`, so no honest registry acceptance claim can be made from that run.
- Commit `349533c` added fail-fast npm auth checks so future reruns stop earlier and more clearly when publish credentials are broken.
- The next truthful operator action is: `gh run rerun 25282612113 --repo vk0dev/agent-claim-mcp` after fixing the repo secret `NPM_TOKEN`.

Until that rerun finishes and reaches the registry steps, the correct status is **SOFT-BLOCKED**, not PASS.

## Preconditions

Run this only after all of the following are true:

1. The release tag push has happened, for example `v1.0.0`.
2. `.github/workflows/publish.yml` has completed for that tag.
3. npm shows the published package version.
4. The workflow attempt you are validating actually reached the MCP Registry authentication or publish steps.

If any of these are false, stop immediately and record **FAIL** for this validation attempt rather than guessing.
If npm is live but the workflow died before registry steps, record **SOFT-BLOCKED** with the blocker packet above instead of pretending validation happened.
A live Smithery listing can also satisfy the external-proof branch even while Official MCP Registry validation is still pending, but record that branch explicitly instead of overclaiming registry acceptance.

## Quick operator path

If you want the shortest honest execution path immediately after first publish:

1. Confirm npm publish landed.
2. Capture the exact GitHub Actions evidence from the publish workflow.
3. Pull the published tarball and verify packaged metadata.
4. Check one lightweight npm discovery surface.
5. Assign one verdict only: **PASS**, **SOFT-BLOCKED**, or **FAIL**.
6. Record which proof branch satisfied the external proof surface: Official MCP Registry or Smithery.
7. Copy the result into [`official-registry-validation-checklist.md`](./official-registry-validation-checklist.md).

The rest of this runbook explains each step and the exact success signal to look for.

## 1. Confirm npm publish actually landed

From the repo root:

```bash
cd ~/projects/agent-claim-mcp
npm view @vk0/agent-claim-mcp version
npm view @vk0/agent-claim-mcp dist-tags --json
```

Expected success signals:
- `version` returns the release version you just shipped.
- `dist-tags.latest` matches that same version.
- neither command returns `E404`.

If npm does **not** show the version yet, stop here. Registry validation is not honest yet because the package is still missing upstream.

## 2. Check the exact publish workflow evidence

Open the GitHub Actions run for the release tag and inspect these steps in `.github/workflows/publish.yml`:

1. `Publish to npm with provenance`
2. `Install mcp-publisher`
3. `Authenticate to MCP Registry`
4. `Publish to Official MCP Registry`

Capture whether each step:
- succeeded
- emitted a warning
- failed but was tolerated by `continue-on-error`

Expected success signals:
- `Publish to npm with provenance` succeeded for the same release tag and same version npm now reports.
- `Install mcp-publisher` succeeded.
- `Authenticate to MCP Registry` either clearly succeeded or clearly emitted the warning/error you will quote.
- `Publish to Official MCP Registry` either clearly succeeded or clearly emitted the warning/error you will quote.

If the registry step printed the warning below, note it verbatim in the evidence section:

```text
::warning::MCP Registry publish failed — may need manual 'mcp-publisher publish'
```

Do **not** collapse warning-only registry output into success just because npm succeeded.

## 3. Validate shipped package metadata from npm

Pull the published tarball locally and inspect the packaged metadata:

```bash
cd ~/projects/agent-claim-mcp
rm -f vk0-agent-claim-mcp-*.tgz
npm pack @vk0/agent-claim-mcp --silent
TARBALL=$(ls -t vk0-agent-claim-mcp-*.tgz | head -n 1)
tar -xOf "$TARBALL" package/package.json | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const j=JSON.parse(s); console.log(JSON.stringify({name:j.name,version:j.version}, null, 2));})'
tar -xOf "$TARBALL" package/server.json | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const j=JSON.parse(s); console.log(JSON.stringify({name:j.name,version:j.version,packages:j.packages}, null, 2));})'
```

Validate manually that:
- `package/package.json` contains `@vk0/agent-claim-mcp`
- the package version matches the release
- `package/server.json` is present in the tarball
- `server.json.version` matches the release
- `server.json.packages[*].identifier` still points at `@vk0/agent-claim-mcp`

Expected success signal:
- both extracted JSON objects show the same shipped version and the expected package identity.

## 4. Do one install/discovery sanity check from npm

Use the published artifact, not the local workspace build:

```bash
npm view @vk0/agent-claim-mcp name version description
npm view @vk0/agent-claim-mcp dist.unpackedSize
```

Optional extra sanity check if you want the tarball contents listed directly:

```bash
tar -tf "$TARBALL" | egrep 'package/(server.json|package.json|dist/)'
```

Expected success signals:
- package name, version, and description resolve from npm
- unpacked size resolves without error
- optional tarball listing contains at least `package/package.json`, `package/server.json`, and packaged `dist/`

This is not a full runtime E2E. It is a quick proof that the package users and registries see contains the expected metadata files.

## 5. Check the Official MCP Registry surface

This repo's current registry integration path is the `mcp-publisher publish` step in CI. So the first validation surface is:

1. the GitHub Actions logs for `Authenticate to MCP Registry`
2. the GitHub Actions logs for `Publish to Official MCP Registry`

If those logs clearly show success, record that as the first-pass verdict.

If they do **not** clearly show success, treat the registry state as **unverified** until you inspect the actual registry follow-up surface produced by `mcp-publisher` for this publish attempt, for example:
- a created or updated registry entry
- a linked PR or change request
- or an explicit failure that still requires a manual `mcp-publisher publish`

Because the exact remote registry artifact may vary, do **not** claim registry success from npm success alone.

Expected success signal:
- either the workflow logs show a clearly successful registry publish path, or you have a concrete registry-side URL or artifact proving the update landed.

## 6. Verdict rules

Use these rules in the eventual finding:

### PASS
All are true:
- npm version exists and matches the tag
- packaged `server.json` and `package.json` match the shipped version
- registry publish logs are clearly successful, or the registry surface shows the expected update

### SOFT-BLOCKED
Use this if:
- npm publish succeeded
- but the Official MCP Registry step is warning-only, ambiguous, or unverified
- and follow-up is still needed on the registry side

### FAIL
Use this if:
- npm publish did not land
- packaged metadata is wrong
- or the registry publish path shows a concrete failure that prevents claiming availability

## 7. Recommended recording format

Use the small template in [`official-registry-validation-checklist.md`](./official-registry-validation-checklist.md) and keep one filled copy in the task finding, release note, or any adjacent maintainer evidence comment.

Minimum recording bar:
- exact shipped version
- exact commands run
- workflow URL
- exact warning or failure text if registry publish was not clean
- one final verdict only

## Evidence note template

Copy this into the eventual task finding or release note comment and fill it in:

```md
## Official MCP Registry validation evidence

- Repo: `agent-claim-mcp`
- Release tag: `vX.Y.Z`
- npm package: `@vk0/agent-claim-mcp`
- Expected version: `X.Y.Z`
- `npm view @vk0/agent-claim-mcp version`: `<output>`
- `npm view @vk0/agent-claim-mcp dist-tags --json`: `<output>`
- Publish workflow URL: `https://github.com/vk0dev/agent-claim-mcp/actions/runs/25282612113`
- `Publish to npm with provenance`: `<pass/fail + note>`
- `Authenticate to MCP Registry`: `<pass/fail/warn + note>`
- `Publish to Official MCP Registry`: `<pass/fail/warn + note>`
- Packaged `server.json` check: `<pass/fail + note>`
- Packaged `package.json` check: `<pass/fail + note>`
- Registry surface URL / PR / listing (if any): `<url or none yet>`
- Verdict: `<PASS | SOFT-BLOCKED | FAIL>`
- If blocked, exact blocker: `<what still prevents a truthful success claim>`
```

## Fast execution checklist

If you just need the shortest honest path right after the first publish:

```bash
cd ~/projects/agent-claim-mcp
npm view @vk0/agent-claim-mcp version
npm view @vk0/agent-claim-mcp dist-tags --json
npm pack @vk0/agent-claim-mcp --silent
TARBALL=$(ls -t vk0-agent-claim-mcp-*.tgz | head -n 1)
tar -xOf "$TARBALL" package/server.json | head -n 20
```

Then inspect the release workflow logs for:
- `Publish to npm with provenance`
- `Authenticate to MCP Registry`
- `Publish to Official MCP Registry`

If npm is present but registry logs are ambiguous, report **SOFT-BLOCKED**, not success.

If npm is present but the workflow never reached registry steps because npm auth failed early, report this exact blocker summary:
- npm package `@vk0/agent-claim-mcp@1.0.0` is live.
- Workflow run `25282612113` failed before Official MCP Registry validation because npm auth failed early.
- Next truthful action after fixing repo secret `NPM_TOKEN`: `gh run rerun 25282612113 --repo vk0dev/agent-claim-mcp`.
- Current verdict: `SOFT-BLOCKED`.
