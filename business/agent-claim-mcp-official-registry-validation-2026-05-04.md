# Official MCP Registry validation evidence

- Repo: `agent-claim-mcp`
- Date: `2026-05-04`
- Release tag: `v1.0.0`
- npm package: `@vk0/agent-claim-mcp`
- Expected version: `1.0.0`
- `npm view @vk0/agent-claim-mcp version --json`: `"1.0.0"`
- `npm view @vk0/agent-claim-mcp dist-tags --json`:
  ```json
  {
    "latest": "1.0.0"
  }
  ```
- Publish workflow: `Publish to npm`
- Publish workflow URL: `https://github.com/vk0dev/agent-claim-mcp/actions/runs/25282612113`
- Workflow run conclusion: `failure`
- `Publish to npm with provenance`: **FAIL**
  - Evidence from workflow log:
    - `npm error code ENEEDAUTH`
    - `npm error need auth This command requires you to be logged in to https://registry.npmjs.org/`
    - `npm error need auth You need to authorize this machine using \`npm adduser\``
- `Install mcp-publisher`: not reached / no positive evidence captured from this failed run
- `Authenticate to MCP Registry`: not reached / no positive evidence captured from this failed run
- `Publish to Official MCP Registry`: not reached / no positive evidence captured from this failed run
- Packed tarball used for metadata inspection: `vk0-agent-claim-mcp-1.0.0.tgz`
- Packaged `package.json` check: **PASS**
  - name: `@vk0/agent-claim-mcp`
  - version: `1.0.0`
- Packaged `server.json` check: **PASS**
  - name: `agent-claim-mcp`
  - version: `1.0.0`
  - `server.json.packages[*].identifier` still points at `@vk0/agent-claim-mcp`
- `npm view @vk0/agent-claim-mcp name version description`: resolved successfully
- `npm view @vk0/agent-claim-mcp dist.unpackedSize`: resolved successfully
- Registry surface URL / PR / listing: none captured yet
- Verdict: **FAIL**
- Exact blocker: public npm visibility now exists, but the tracked `Publish to npm` workflow for `v1.0.0` failed at the npm provenance publish step with `ENEEDAUTH`, and there is no successful Official MCP Registry authentication/publish evidence or registry-side artifact yet. Public npm availability can be claimed; Official MCP Registry acceptance cannot.

## Commands run

```bash
cd ~/projects/agent-claim-mcp
npm view @vk0/agent-claim-mcp version --json
npm view @vk0/agent-claim-mcp dist-tags --json
rm -f vk0-agent-claim-mcp-*.tgz
npm pack @vk0/agent-claim-mcp --silent
TARBALL=$(ls -t vk0-agent-claim-mcp-*.tgz | head -n 1)
tar -xOf "$TARBALL" package/package.json | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const j=JSON.parse(s); console.log(JSON.stringify({name:j.name,version:j.version}, null, 2));})'
tar -xOf "$TARBALL" package/server.json | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const j=JSON.parse(s); console.log(JSON.stringify({name:j.name,version:j.version,packages:j.packages}, null, 2));})'
npm view @vk0/agent-claim-mcp name version description
npm view @vk0/agent-claim-mcp dist.unpackedSize
gh run list --repo vk0dev/agent-claim-mcp --workflow 'Publish to npm' --limit 10 --json databaseId,displayTitle,headBranch,headSha,event,status,conclusion,url,createdAt,updatedAt
gh run view 25282612113 --repo vk0dev/agent-claim-mcp --log
```
