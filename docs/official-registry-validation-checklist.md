# Official MCP Registry validation checklist

Use this immediately after the first successful npm publish of `@vk0/agent-claim-mcp`.

Source of truth runbook:
- [`official-registry-validation-runbook.md`](./official-registry-validation-runbook.md)

## Preconditions

- [ ] Release tag was pushed, for example `vX.Y.Z`
- [ ] `.github/workflows/publish.yml` completed for that tag
- [ ] `npm view @vk0/agent-claim-mcp version` returns a real published version
- [ ] `npm view @vk0/agent-claim-mcp dist-tags --json` shows `latest` for that version

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

- Publish workflow URL: `<paste URL>`
- `Publish to npm with provenance`: `<pass/fail + note>`
- `Install mcp-publisher`: `<pass/fail + note>`
- `Authenticate to MCP Registry`: `<pass/fail/warn + note>`
- `Publish to Official MCP Registry`: `<pass/fail/warn + note>`

If present, quote this warning verbatim:

```text
::warning::MCP Registry publish failed — may need manual 'mcp-publisher publish'
```

## Packaged metadata checks

- `package/package.json` name/version: `<pass/fail + note>`
- `package/server.json` version: `<pass/fail + note>`
- `server.json.packages[*].identifier`: `<pass/fail + note>`
- Registry surface URL / PR / listing (if any): `<url or none yet>`

## Verdict

Choose exactly one:

- [ ] **PASS**
- [ ] **SOFT-BLOCKED**
- [ ] **FAIL**

### PASS rule

Use PASS only if npm publish landed, packaged metadata matches the shipped version, and registry publish is clearly successful or has a concrete registry-side artifact.

### SOFT-BLOCKED rule

Use SOFT-BLOCKED if npm publish landed but registry publish is warning-only, ambiguous, or still unverified.

### FAIL rule

Use FAIL if npm publish did not land, packaged metadata is wrong, or registry publish clearly failed in a way that prevents a truthful availability claim.

## Final note

- Exact blocker or success note: `<write one concise sentence>`
