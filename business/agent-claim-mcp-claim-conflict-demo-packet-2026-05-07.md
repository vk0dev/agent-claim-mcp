# Agent Claim MCP — claim-conflict demo packet
**Date:** 2026-05-07
**Owner:** creator
**Primary story:** claim-conflict core wedge
**Product:** `@vk0/agent-claim-mcp@1.0.0`

## Why this is the right demo story
Use the narrow claim-conflict flow as the single demo story.

This remains the clearest explanation of why the product exists:
- one agent claims a file
- a second agent collides on the same path
- `whose_claim` explains who owns it and why work should pause

That is the entire wedge. Do not expand into broader orchestration or planner language.

## Truth boundaries
Keep these claims strict:
- npm package is live: `@vk0/agent-claim-mcp@1.0.0`
- Official MCP Registry validation is still pending
- Do not call it registry-accepted, marketplace-listed, or distribution-complete
- Do not imply queueing, planning, task routing, or multi-agent orchestration beyond file-claim coordination
- Do not imply anything beyond the three-tool surface: `claim_files`, `release_claim`, `whose_claim`

## Exact asset set
- **GIF:** `/Users/vkdev/projects/agent-claim-mcp/docs/demo-claim-conflict.gif`
- **Cast:** `/Users/vkdev/projects/agent-claim-mcp/docs/demo-claim-conflict.cast`
- **Generator script:** `/Users/vkdev/projects/agent-claim-mcp/scripts/demo-claim-conflict.mjs`

## Exact sequence to show
1. Open with two agents sharing one worktree.
2. Show `coder-a` claiming `src/parser.ts` successfully.
3. Show `coder-b` attempting an overlapping claim that includes `src/parser.ts`.
4. Show the deterministic conflict response with no partial write.
5. Show `whose_claim` on `src/parser.ts` and `src/tokenizer.ts`.
6. End on the takeaway that one path is owned and the other remains free.

## Exact rerun recipe
```bash
cd /Users/vkdev/projects/agent-claim-mcp
node scripts/demo-claim-conflict.mjs
asciinema rec --overwrite -q -c 'node scripts/demo-claim-conflict.mjs' docs/demo-claim-conflict.cast
~/.local/bin/agg --speed 1.0 --theme monokai docs/demo-claim-conflict.cast docs/demo-claim-conflict.gif
```

## Recommended caption hooks
Choose one concise caption only.

### Recommended caption
**Claim before edits: one agent owns the file, the second sees the conflict instantly.**

### Acceptable alternates
- **Stop file collisions before they turn into merge cleanup.**
- **A tiny local claim ledger for shared worktrees.**
- **See ownership before two agents stomp the same path.**

## Alt text
**Agent Claim MCP demo showing one agent claiming a file, a second agent receiving a conflict on the same path, and whose_claim revealing the current owner and free path.**

## Proof points to preserve
- The first claim succeeds cleanly.
- The second overlapping claim returns `ok: false`.
- No partial writes happen on collision.
- `whose_claim` gives concrete ownership clarity, not just a generic error.
- The free path remains visibly free.

## Presenter framing
If a human needs one spoken line before the clip, use this:

> Agent Claim MCP does one job: before two coding agents edit the same repo path, it lets one claim ownership, blocks overlapping claims, and tells the next agent exactly who currently owns the file.

## What not to say
Avoid these phrases:
- multi-agent orchestrator
- planning framework
- task router
- distributed lock service
- workflow engine
- registry-approved package
- marketplace-ready proof complete

## Optional supporting note for a submission form
If a form asks about release/distribution state, use this short note:

> npm is live at `@vk0/agent-claim-mcp@1.0.0`. Official MCP Registry validation is still pending, so this visual packet reflects the truthful npm-live / registry-pending state.

## Why this packet should execute without re-research
Everything needed is already fixed here:
- exact demo story
- exact asset paths
- exact rerun commands
- exact caption choices
- exact honesty boundaries
- exact framing for npm-live / registry-pending status
