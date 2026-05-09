# agent-claim-mcp Official MCP Registry live verdict — 2026-05-09

Verdict: `SOFT-BLOCKED`

## Scope

Public acceptance check for the already-live package identity:
- MCP server id: `io.github.vk0dev/agent-claim-mcp`
- npm package: `@vk0/agent-claim-mcp@1.0.0`

This check intentionally uses only public or operator-available evidence and does **not** claim Official MCP Registry acceptance unless the live public surface proves it.

## Exact endpoints and artifacts checked

1. npm package version
   - Command: `npm view @vk0/agent-claim-mcp version`
   - Result: `1.0.0`

2. npm dist-tags
   - Command: `npm view @vk0/agent-claim-mcp dist-tags --json`
   - Result: `{ "latest": "1.0.0" }`

3. npm tarball/package identity proof
   - Command: `npm pack @vk0/agent-claim-mcp --silent`
   - Result: public tarball for `1.0.0` was retrievable
   - Verified inside tarball:
     - `package/package.json` present
     - `package/server.json` present
     - `package/dist/` present
     - `package.json` name/version matched `@vk0/agent-claim-mcp@1.0.0`
     - `server.json` name/version matched the shipped server metadata

4. Historical publish workflow run used by the registry-proof lane
   - URL: `https://github.com/vk0dev/agent-claim-mcp/actions/runs/25282612113`
   - Command: `gh run view 25282612113 --repo vk0dev/agent-claim-mcp --json conclusion,status,jobs,url,displayTitle,workflowName,headSha,headBranch`
   - Result: run is publicly visible but concluded with failure in the publish lane, so it does not provide acceptance proof for the Official MCP Registry

5. Failed publish log slice for the same workflow
   - Command: `gh run view 25282612113 --repo vk0dev/agent-claim-mcp --log-failed`
   - Result: failed publish log remains consistent with the earlier documented blocker, so this run cannot be reused as proof that the registry accepted the package

6. Public registry surface checks for the MCP server id
   - URL checked: `https://registry.modelcontextprotocol.io/v0/servers/io.github.vk0dev/agent-claim-mcp`
   - Result: HTTP 404
   - URL checked: `https://registry.modelcontextprotocol.io/v0.1/servers/io.github.vk0dev/agent-claim-mcp`
   - Result: HTTP 404
   - URL checked: `https://modelcontextprotocol.io/registry/io.github.vk0dev/agent-claim-mcp`
   - Result: HTTP 404

## Interpretation

What is proven now:
- npm public distribution is real and live at `@vk0/agent-claim-mcp@1.0.0`
- the public tarball contains the expected shipped package and `server.json` metadata

What is **not** proven now:
- a live Official MCP Registry listing for `io.github.vk0dev/agent-claim-mcp`
- a successful public registry-acceptance workflow run that can be cited as acceptance proof

Because the package is live on npm but the public registry acceptance surface is still absent, and the known workflow proof lane remains failed rather than accepted, the truthful operator verdict is `SOFT-BLOCKED` rather than `PASS`.

## Next operator action

The next truthful action is still the previously established one: fix the unattended publish credential / workflow proof lane, rerun the official registry publish/validation workflow, and only then re-check the public registry surface for a live listing before claiming acceptance.
