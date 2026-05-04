# Official MCP Registry validation runbook for `agent-claim-mcp`

This runbook is the **first post-publish validation pass** for `@vk0/agent-claim-mcp`.
It is intentionally specific to this repo's current release flow:

- package: `@vk0/agent-claim-mcp`
- current version source: `package.json`, `server.json`, `src/createServer.ts`
- publish workflow: `.github/workflows/publish.yml`
- registry publish helper in CI: `mcp-publisher login github-oidc` + `mcp-publisher publish`

Important truthfulness note:
- **Do not run this before npm publish exists.**
- The Official MCP Registry validation step is partly blocked until the first real npm package is available.
- The GitHub Actions workflow already treats MCP Registry publish as `continue-on-error`, so this runbook is the follow-up path for checking what actually happened after the tag-driven publish.

## Preconditions

Run this only after all of the following are true:

1. The tag push for the release has happened, for example `v1.0.0`.
2. `.github/workflows/publish.yml` has completed.
3. npm shows the published package version.

## 1. Confirm npm publish actually landed

From the repo root:

```bash
cd ~/projects/agent-claim-mcp
npm view @vk0/agent-claim-mcp version
npm view @vk0/agent-claim-mcp dist-tags --json
```

Expected:
- `version` returns the release version you just shipped.
- `dist-tags.latest` matches that same version.

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

If the registry step printed the warning below, note it verbatim in the evidence section:

```text
::warning::MCP Registry publish failed — may need manual 'mcp-publisher publish'
```

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

This is not a full runtime E2E. It is a quick proof that the package users and registries see contains the expected metadata files.

## 5. Check the Official MCP Registry surface

This repo's current registry integration path is the `mcp-publisher publish` step in CI. So the first validation surface is:

1. the GitHub Actions logs for `Authenticate to MCP Registry`
2. the GitHub Actions logs for `Publish to Official MCP Registry`

If those logs clearly show success, record that as the first-pass verdict.

If they do **not** clearly show success, treat the registry state as **unverified** until you inspect the actual registry follow-up surface produced by `mcp-publisher` for this publish attempt, for example:
- a created/updated registry entry
- a linked PR/change request
- or an explicit failure that still requires a manual `mcp-publisher publish`

Because the exact remote registry artifact may vary, do **not** claim registry success from npm success alone.

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
- but the Official MCP Registry step is warning-only / ambiguous / unverified
- and follow-up is still needed on the registry side

### FAIL
Use this if:
- npm publish did not land
- packaged metadata is wrong
- or the registry publish path shows a concrete failure that prevents claiming availability

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
- Publish workflow URL: `<GitHub Actions run URL>`
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
