# External proof rerun verdict template for `agent-claim-mcp`

Use this template immediately after vk fixes `NPM_TOKEN` and the publish workflow is rerun.

## Run identity
- Workflow run URL:
- Workflow run id:
- Git ref / tag:
- Head SHA:

## npm-auth precheck
- `Verify npm publish credentials` result:
- Exact warning/error text if not successful:

## Registry step execution
- `Publish to npm with provenance` result:
- `Install mcp-publisher` result:
- `Authenticate to MCP Registry` result:
- `Publish to Official MCP Registry` result:
- Were registry steps actually reached? yes/no

## Package truth
- `npm view @vk0/agent-claim-mcp version`:
- `npm view @vk0/agent-claim-mcp dist-tags --json`:
- Packaged `package.json` version check:
- Packaged `server.json` version check:

## External proof
- Proof branch used: `Official MCP Registry` or `Smithery`
- Final public Official MCP Registry URL / PR / listing if any:
- Final Smithery listing URL if any:
- If the selected branch is still absent, write `ABSENT` and include the exact blocker text or missing-proof reason:

## Final verdict
- Verdict: `PASS` / `SOFT-BLOCKED` / `FAIL`
- One-sentence reason this verdict is truthful:

## Raw evidence links or excerpts
- Workflow log excerpt(s):
- CLI output excerpt(s):
- Any additional evidence link(s):
