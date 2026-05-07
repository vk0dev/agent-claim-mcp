# Publishing Playbook

How to release updates and manage marketplace presence for `@vk0/agent-claim-mcp`.
This document is for **any agent** (Claude Code, OpenClaw, Cursor, Cline, or manual).

---

## Releasing an update

```bash
# 1. Version bump — sync in 4 places:
#    package.json, .claude-plugin/plugin.json, server.json, src/createServer.ts

# 2. Update CHANGELOG.md

# 3. Verify
npm run build && npm test && npm run lint && npm run smoke

# 4. Commit + tag + push
git add -A
git commit -m "chore: release vX.Y.Z"
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin main --follow-tags
```

CI does the rest once the required repo secrets are configured correctly: npm publish, GitHub Release, Official MCP Registry, Smithery.

Current truthful status for `v1.0.0`: npm publish is already live, but Official MCP Registry acceptance is still not proven from the repo evidence because workflow `25282612113` did not reach a usable registry-validation finish.

## What updates automatically

| Platform | Mechanism | Delay |
|----------|-----------|-------|
| **npm** | CI `publish.yml` on tag `v*` | ~1 min |
| **GitHub Release** | CI auto | ~1 min |
| **GitHub Pages** | CI `pages.yml` | ~2 min |
| **Official MCP Registry** | CI `publish.yml` step | ~1 min |
| **Smithery** | CI `publish.yml` step | ~1 min |
| **PulseMCP** | Auto from Registry | 1-7 days |
| **Glama / MseeP / MCPServers.org** | Auto-scraping npm | 24-48h |

**Manual steps after the one-time secret setup: effectively zero.** Push tag → workflow handles the rest.

If the publish workflow fails before the registry steps, treat that as a release-infra problem, not a product-code problem.

## First release setup

```bash
# One-time setup for a new project:
gh repo create vk0dev/agent-claim-mcp --public --source=. --push
gh secret set NPM_TOKEN --repo vk0dev/agent-claim-mcp --body $(grep _authToken ~/.npmrc | cut -d= -f2)
gh secret set SMITHERY_API_KEY --repo vk0dev/agent-claim-mcp --body <smithery-key>
gh api repos/vk0dev/agent-claim-mcp/pages -X POST -f build_type=workflow
gh api repos/vk0dev/agent-claim-mcp/topics -X PUT \
  -f "names[]=mcp" -f "names[]=mcp-server" -f "names[]=claude-code" \
  -f "names[]=anthropic" -f "names[]=developer-tools"

# Marketplace first submissions:
# - Awesome MCP Servers: fork + PR via gh CLI
# - mcp.so: submit form (GitHub OAuth)
# - Others: auto-discovery from npm keywords
```

## Version sync locations

1. `package.json` → `"version"`
2. `.claude-plugin/plugin.json` → `"version"`
3. `server.json` → `"version"` (two places: root + packages[0])
4. `src/createServer.ts` → `version:` string

## Required GitHub Secrets

| Secret | Source |
|--------|--------|
| `NPM_TOKEN` | npm token with publish access to `@vk0/agent-claim-mcp` |
| `SMITHERY_API_KEY` | smithery.ai → Account → API Keys |

## Rerun path after fixing secrets

If `.github/workflows/publish.yml` fails with npm auth errors such as `ENEEDAUTH`, fix the repo secret first, then rerun the existing tag workflow instead of creating product-code churn.

Secrets UI: https://github.com/vk0dev/agent-claim-mcp/settings/secrets/actions

Exact secret to fix: `NPM_TOKEN`

Recommended path:

```bash
gh run rerun <failed-run-id> --repo vk0dev/agent-claim-mcp
```

For the known `v1.0.0` incident documented in `business/agent-claim-mcp-official-registry-validation-2026-05-04.md`, the failed run id was `25282612113`, so the exact rerun command is:

```bash
gh run rerun 25282612113 --repo vk0dev/agent-claim-mcp
```

After the rerun succeeds, verify in this order:
- confirm the rerun completed successfully in GitHub Actions
- run `npm run preflight:registry`
- follow `docs/official-registry-validation-runbook.md`
- use `docs/official-registry-validation-checklist.md` only after the registry result is actually observed

do not claim Official MCP Registry acceptance before that evidence exists.

## Required GitHub Variables

| Variable | Value |
|----------|-------|
| `SMITHERY_SERVER_NAME` | `unfucker/agent-claim-mcp` (your Smithery namespace/name) |
