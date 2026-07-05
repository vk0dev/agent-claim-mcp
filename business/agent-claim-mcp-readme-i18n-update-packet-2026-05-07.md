# agent-claim-mcp README + i18n update packet
**Date:** 2026-05-07
**Owner:** content
**Scope:** bounded post-release docs guidance only

## Public truths to emphasize now
These are the current public truths that should stay consistent across any future README or localized wording pass:

1. **The npm package is live**
- `@vk0/agent-claim-mcp@1.0.0` is publicly available on npm
- the truthful default external install path is `npx -y @vk0/agent-claim-mcp`

2. **The product wedge stays intentionally minimal**
- the clearest differentiator is still the narrow 3-tool surface
- the product solves one coordination job only: claim paths, inspect claims, release claims
- the JSON-ledger-first local scope remains part of the product story, not a missing feature set

3. **Registry / marketplace proof is still pending**
- public npm distribution proof is complete
- external registry proof is not complete yet
- no wording should imply Official MCP Registry acceptance or live marketplace coverage until separately verified

## Wording that must avoid overstating registry / marketplace status
Avoid any wording like:
- "registry accepted"
- "listed everywhere"
- "live across registries and marketplaces"
- "launch complete"
- "officially approved by the MCP Registry"
- any unverified mention of Smithery, Glama, or mcp.so as if those are already proven live surfaces for this package

Safe wording patterns:
- "npm is live"
- "Official MCP Registry proof is still pending"
- "external listing proof is still pending"
- "do not describe the package as registry-accepted until that separate verification succeeds"

## Ready-to-use bullets for a later README / localized follow-up
### English README
- keep the release-status block explicit about the split: npm-live, registry-pending
- keep the install path simple: `npx` for public use, local `dist/server.js` only as a development alternative
- keep the product story narrow around the 3-tool coordination surface

### Localized follow-up
Current repo reality:
- maintained English surface exists: `README.md`
- no maintained localized README files currently exist under the repo root

If localized surfaces are added later, mirror only these meanings:
- npm proof is complete
- external registry proof is still pending
- 3-tool wedge remains the clearest product frame
- no marketplace overclaiming

## Exact file targets for any future docs pass
Primary likely target:
- `/Users/vkdev/projects/agent-claim-mcp/README.md`

Optional docs touch only if drift appears there too:
- `/Users/vkdev/projects/agent-claim-mcp/docs/smoke-proof.md`
- registry/runbook docs that still collapse npm proof and registry proof into one combined milestone

## Suggested tiny follow-up task shape
**Title shape:**
`agent-claim-mcp: keep README wording aligned to npm-live and registry-pending split`

**Bounded scope:**
1. inspect `README.md`
2. tighten only the lines that could overstate external proof
3. optionally touch one adjacent docs file if the same drift appears there
4. no code changes, no version bump, no new locale creation

## Past experiment context worth preserving
- **2026-05-02 positioning:** minimal scope with 3 tools and a JSON ledger — keep. The minimal surface is still the clearest differentiator and the easiest proof path.

## Short operator takeaway
The next docs step should stay mechanical: keep public npm proof visible, keep external registry proof clearly pending, and keep the 3-tool JSON-ledger wedge as the main product frame instead of widening into a bigger marketplace story.