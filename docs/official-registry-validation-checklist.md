# Official MCP Registry validation checklist

Use this immediately after the first successful npm publish of `@vk0/agent-claim-mcp`. Phase 5 external proof is satisfied by either Official MCP Registry validation or a live Smithery listing.

Source of truth runbook:
- [`official-registry-validation-runbook.md`](./official-registry-validation-runbook.md)

## Preconditions

- [x] Release tag was pushed, for example `vX.Y.Z`
- [x] `.github/workflows/publish.yml` completed for that tag
- [x] `npm view @vk0/agent-claim-mcp version` returns a real published version
- [x] `npm view @vk0/agent-claim-mcp dist-tags --json` shows `latest` for that version

If any box above is false, stop and record **FAIL** for this validation attempt.

## Commands run

```bash
cd ~/projects/agent-claim-mcp
npm view @vk0/agent-claim-mcp version
npm view @vk0/agent-claim-mcp dist-tags --json
npm pack @vk0/agent-claim-mcp --silent
TARBALL=$(ls -t vk0-agent-claim-mcp-*.tgz | head -n 1)
tar -xOf "$TARBALL" package/package.json | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const j=JSON.parse(s); console.log(JSON.stringify({name:j.name,version:j.version}, null, 2));})'
tar -xOf "$TARBALL" package/server.json | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const j=JSON.parse(s); console.log(JSON.stringify({name:j.name,version:j.version,packages:j.packages}, null, 2));})'
npm view @vk0/agent-claim-mcp name version description
npm view @vk0/agent-claim-mcp dist.unpackedSize
```

## Workflow evidence

- Publish workflow URL: `https://github.com/vk0dev/agent-claim-mcp/actions/runs/25282612113`
- `Publish to npm with provenance`: `FAIL` (`NODE_AUTH_TOKEN` empty, `npm error code ENEEDAUTH`)
- `Install mcp-publisher`: `not reached`
- `Authenticate to MCP Registry`: `not reached`
- `Publish to Official MCP Registry`: `not reached`

If present, quote this warning verbatim:

```text
::warning::MCP Registry publish failed — may need manual 'mcp-publisher publish'
```

## Packaged metadata checks

- `package/package.json` name/version: `PASS` (`@vk0/agent-claim-mcp`, `1.0.0`)
- `package/server.json` version: `PASS` (`io.github.vk0dev/agent-claim-mcp`, `1.0.0`)
- `server.json.packages[*].identifier`: `PASS` (`@vk0/agent-claim-mcp`)
- Proof branch used: `Official MCP Registry` or `Smithery`
- Official MCP Registry surface URL / PR / listing (if any): `none captured yet`
- Smithery listing URL (if any): `none captured yet`

## Verdict

Choose exactly one:

- [ ] **PASS**
- [ ] **SOFT-BLOCKED**
- [x] **FAIL**

### PASS rule

Use PASS only if npm publish landed, packaged metadata matches the shipped version, and at least one truthful external proof branch is satisfied: either registry publish is clearly successful with a concrete registry-side artifact, or a live Smithery listing URL is captured.

### SOFT-BLOCKED rule

Use SOFT-BLOCKED if npm publish landed but neither proof branch is fully evidenced yet, for example registry publish is warning-only/ambiguous/still unverified and no live Smithery listing URL has been captured.

### FAIL rule

Use FAIL if npm publish did not land, packaged metadata is wrong, or the selected proof branch clearly failed in a way that prevents a truthful external-proof claim.

## Final note

- Exact blocker or success note: `npm 1.0.0 is live and tarball metadata is correct, but the tracked v1.0.0 publish workflow failed before any MCP Registry auth/publish step and no registry-side acceptance artifact was captured, so Official MCP Registry acceptance still cannot be claimed truthfully.`
