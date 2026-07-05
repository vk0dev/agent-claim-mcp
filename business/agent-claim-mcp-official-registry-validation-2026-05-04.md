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
- `Publish to npm with provenance`: **FAIL in tracked CI run**
  - Evidence from workflow log:
    - `NODE_AUTH_TOKEN:` was empty in the step environment
    - `npm error code ENEEDAUTH`
    - `npm error need auth This command requires you to be logged in to https://registry.npmjs.org/`
    - `npm error need auth You need to authorize this machine using \`npm adduser\``
- `Install mcp-publisher`: not reached / no positive evidence captured from this run
- `Authenticate to MCP Registry`: not reached / no positive evidence captured from this run
- `Publish to Official MCP Registry`: not reached / no positive evidence captured from this run
- Packed tarball used for metadata inspection: `vk0-agent-claim-mcp-1.0.0.tgz`
- Packaged `package.json` check: **PASS**
  - name: `@vk0/agent-claim-mcp`
  - version: `1.0.0`
  - description matches published npm package description
- Packaged `server.json` check: **PASS**
  - name: `io.github.vk0dev/agent-claim-mcp`
  - version: `1.0.0`
  - `server.json.packages[*].identifier` points at `@vk0/agent-claim-mcp`
  - `server.json.packages[*].version` is `1.0.0`
- `npm view @vk0/agent-claim-mcp name version description`: resolved successfully
- `npm view @vk0/agent-claim-mcp dist.unpackedSize`: resolved successfully (`34788`)
- Tarball content sanity check: **PASS**
  - tarball contains `package/package.json`, `package/server.json`, and packaged `dist/` files
- Registry surface URL / PR / listing: none captured yet
- Verdict: **FAIL**
- Exact blocker: first npm publish is now real and the shipped tarball metadata is correct, but the tracked release workflow for `v1.0.0` still failed before any MCP Registry authentication/publish step, and no registry-side artifact was captured to prove Official MCP Registry acceptance. Public npm availability can be claimed; Official MCP Registry acceptance still cannot.

## Commands run

```bash
cd ~/projects/agent-claim-mcp
npm view @vk0/agent-claim-mcp version --json
npm view @vk0/agent-claim-mcp dist-tags --json
rm -f vk0-agent-claim-mcp-*.tgz
npm pack @vk0/agent-claim-mcp --silent
TARBALL=$(ls -t vk0-agent-claim-mcp-*.tgz | head -n 1)
tar -xOf "$TARBALL" package/package.json | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const j=JSON.parse(s); console.log(JSON.stringify({name:j.name,version:j.version,description:j.description}, null, 2));})'
tar -xOf "$TARBALL" package/server.json | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const j=JSON.parse(s); console.log(JSON.stringify({name:j.name,version:j.version,packages:j.packages}, null, 2));})'
npm view @vk0/agent-claim-mcp name version description
npm view @vk0/agent-claim-mcp dist.unpackedSize
tar -tf "$TARBALL" | egrep 'package/(server.json|package.json|dist/)'
gh run list --repo vk0dev/agent-claim-mcp --workflow 'Publish to npm' --limit 10 --json databaseId,displayTitle,headBranch,headSha,event,status,conclusion,url,createdAt,updatedAt
gh run view 25282612113 --repo vk0dev/agent-claim-mcp
gh run view 25282612113 --repo vk0dev/agent-claim-mcp --log
```
