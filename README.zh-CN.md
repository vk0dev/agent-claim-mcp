# Agent Claim MCP

[![npm](https://img.shields.io/npm/v/@vk0/agent-claim-mcp)](https://www.npmjs.com/package/@vk0/agent-claim-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**语言:** [English](./README.md) · [日本語](./README.ja.md) · 简体中文 · [Русский](./README.ru.md) · [Español](./README.es.md)

当多个编码 agent 共享同一个 worktree,而你需要的是一个在编辑之前使用的小型本地协调原语、而不是一整套编排框架时,请使用 Agent Claim MCP。它只给 agent 一件事做: claim 路径、检测冲突、release 所有权,让并行工作不再互相踩踏同一批文件。

Agent Claim MCP 是一个 local-first 的 MCP 服务器,面向 Claude Code、Cursor、Cline 以及其他需要文件所有权协调、但不需要队列、规划器或自定义 AGENTS.md 约定的 MCP 客户端。当前发布面只围绕三个有边界的动作: claim 规范化后的路径、查询这些路径归谁所有、按路径或 claim id 进行 release,并对跨会话的冲突给出显式报告。

> 发布状态: `@vk0/agent-claim-mcp@1.0.0` 已在 npm 上线,因此 `npx -y @vk0/agent-claim-mcp` 这条安装路径现在是对外部用户而言真实可用的默认方式。Phase 5 的外部证明可以由 Official MCP Registry 验证或 Smithery 的在线列表二者之一满足,但在这两种公开产物中的任意一个被显式验证之前,当前的证明状态仍然是 pending。Official MCP Registry 验证仍在等待中,所以在能够引用真实的 registry 或 Smithery 证明 URL 之前,请不要把这个包描述为 registry-accepted 或 marketplace-listed。
>
> 里程碑的真实情况: 产品切入点保持狭窄 —— 3 个 tools 加一个本地 JSON ledger,用于共享 worktree 的冲突预防,而不是一个更宽泛的编排平台。
>
> 当前的下一个手动步骤: 完成 Official MCP Registry 证明所需的人工 rerun 与验证流程,然后记录那次运行得出的结论,而不是根据 npm 可用性来推断已被接受。

## Registry rerun quickstart

当前的真实状态:
- npm `1.0.0` 已上线
- Official MCP Registry 的接受仍然 pending
- workflow `25282612113` 没有完成 registry 验证路径
- 仓库已经越过了早前的 `NPM_TOKEN` secret 修复步骤,但 registry 证明仍需要人工 rerun 加验证,之后才能被视为已接受

准确的 rerun 命令:

```bash
gh run rerun 25282612113 --repo vk0dev/agent-claim-mcp
```

rerun 之后,按以下顺序验证:
1. 在 GitHub Actions 中确认 rerun 已成功完成
2. 运行 `npm run preflight:registry`
3. 按照 `docs/official-registry-validation-runbook.md` 操作
4. 只有在这之后,才把 registry 的接受记录为已证明

操作员捷径: 使用 runbook 中的 [Quick operator path](./docs/official-registry-validation-runbook.md#quick-operator-path) 获取从 rerun 到验证的准确顺序,并且把 npm-live 状态与 registry-proof 状态当作两件独立的事来对待。

## Why / When to use

如果你的工作流已经有任务路由,但在编辑时仍然需要一个简单的、类似锁的原语,就选择这个服务器:

- 两个或更多 agent 可能并行接触同一个仓库
- 你想在文件编辑之前检测冲突,而不是在 merge 冲突之后
- 你希望 claim 通过 TTL 自动过期
- 你想要一个足够狭窄的原语,让另一个 agent 仅凭 name + description 就能理解
- 你**不**想要捆绑的规则引擎、队列运行器或编排平台

## Installation

对外的规范安装路径是已发布的 npm 包:

```json
{
  "mcpServers": {
    "agent-claim": {
      "command": "npx",
      "args": ["-y", "@vk0/agent-claim-mcp"]
    }
  }
}
```

状态说明: npm 安装今天就可用,但 Official MCP Registry 验证以及 Smithery 等市场证明尚未建立,所以请把这个包首先当作 npm-available,而不是 marketplace-verified。

如果你是从本地 checkout 而不是已发布的包进行开发,也可以让 MCP 客户端直接指向构建好的 `dist/server.js`。

```json
{
  "mcpServers": {
    "agent-claim": {
      "command": "node",
      "args": ["/absolute/path/to/agent-claim-mcp/dist/server.js"]
    }
  }
}
```

第二个示例仅用于本地开发。在 Windows 上,请让 MCP 客户端指向你自己机器上构建好的 `dist/server.js` 路径,而不是照抄 POSIX 路径。

使用本地路径之前先构建一次:

```bash
cd /Users/vkdev/projects/agent-claim-mcp
npm ci
npm run build
```

### Claude Code

把 stdio 服务器加入你的 Claude Code MCP 配置:

```json
{
  "mcpServers": {
    "agent-claim": {
      "command": "npx",
      "args": ["-y", "@vk0/agent-claim-mcp"]
    }
  }
}
```

### Claude Desktop

Claude Desktop 在 macOS 上使用 `~/Library/Application Support/Claude/claude_desktop_config.json`,在 Windows 上使用 `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agent-claim": {
      "command": "npx",
      "args": ["-y", "@vk0/agent-claim-mcp"]
    }
  }
}
```

保存 `claude_desktop_config.json` 之后,请完全重启 Claude Desktop,让它重新加载 MCP 服务器配置。

### Cursor

```json
{
  "mcpServers": {
    "agent-claim": {
      "command": "npx",
      "args": ["-y", "@vk0/agent-claim-mcp"]
    }
  }
}
```

### Cline

```json
{
  "mcpServers": {
    "agent-claim": {
      "command": "npx",
      "args": ["-y", "@vk0/agent-claim-mcp"]
    }
  }
}
```

## Limitations

这个服务器有意保持狭窄并且 local-first。当你的 agent 共享同一个文件系统视图时安装它,而不是当你需要分布式协调时。

- claim 保存在磁盘上的本地 ledger 中,因此它只能协调那些能读写同一个 worktree 的会话。
- 它不是托管的锁服务、队列或调度器,也不会自行在多台机器之间复制 claim。
- TTL 过期是一种保护性清理,不能替代更高层的任务所有权或人工审查。
- 路径规范化减少了路径形态不一致的问题,但 agent 仍然需要指向同一个仓库根目录或 `cwd`,claim 才能对得上。
- 如果你的工作流需要跨主机协调、集中审计策略或强制审批,请把这个服务器与独立的编排层组合使用,而不是把 claim ledger 拉伸到它的边界之外。

关于发布之前的真实多 agent 运行,请参阅 [DOGFOOD.md](./DOGFOOD.md) 以及 [docs/dogfood-report.md](./docs/dogfood-report.md) 中的证明产物。

## Tools

### `claim_files`

创建或刷新一条本地 file-claim 记录,让并行的 agent 能在编辑之前看到所有权,避免在活跃任务期间踩踏同一个 worktree 中的路径。冲突响应是显式的,因此跨会话的重叠 claim 不会停留在隐式状态或仅存在于内存中。

**Input**

```json
{
  "agentId": "coder-a",
  "taskId": "task-123",
  "paths": ["src/foo.ts", "src/bar.ts"],
  "ttlSeconds": 3600,
  "note": "working on parser cleanup",
  "cwd": "/repo"
}
```

**Output**

```json
{
  "ok": true,
  "claimed": ["/repo/src/bar.ts", "/repo/src/foo.ts"],
  "conflicts": [],
  "ledgerVersion": 1,
  "claimedUntil": "2026-05-03T16:00:00.000Z"
}
```

如果请求中的任何路径已经被另一个活跃的所有者 claim,这个 tool 会返回 `ok: false` 并且不写入任何内容。

### `release_claim`

移除当前 agent 拥有的既有 claim,让已完成、已暂停或已重新分配的工作不再阻止其他 agent 安全地编辑同一批路径。

**Input**

```json
{
  "agentId": "coder-a",
  "paths": ["src/foo.ts"],
  "cwd": "/repo"
}
```

**Output**

```json
{
  "ok": true,
  "released": ["/repo/src/foo.ts"],
  "missing": [],
  "ledgerVersion": 1
}
```

只有当前所有者可以 release 一条活跃的 claim,无论你是通过 `claimId` 还是通过规范化的 `paths` 来定位它,因此在真实的多 agent 运行之后,清理仍然有效,并且各种路径形态的变体都能得到一致解析。

### `whose_claim`

读取本地 ledger,并说明某个文件路径是空闲的还是当前已被 claim,包括所有者、任务、note 和过期时间等元数据,以便在共享同一个 worktree 的不同会话之间安全协调。

**Input**

```json
{
  "paths": ["src/foo.ts", "src/bar.ts"],
  "cwd": "/repo",
  "includeExpired": false
}
```

**Output**

```json
{
  "results": [
    {
      "path": "/repo/src/bar.ts",
      "claimed": false
    },
    {
      "path": "/repo/src/foo.ts",
      "claimed": true,
      "ownerAgentId": "coder-a",
      "taskId": "task-123",
      "note": "working on parser cleanup",
      "expiresAt": "2026-05-03T16:00:00.000Z",
      "claimId": "2a08b70c-4203-44a2-b833-31592472de1e"
    }
  ],
  "ledgerVersion": 1
}
```

## Real samples

### 1. coder-A claim `foo.ts`

```json
{
  "tool": "claim_files",
  "arguments": {
    "agentId": "coder-A",
    "taskId": "task-42",
    "paths": ["src/foo.ts"],
    "note": "refactoring the claim parser",
    "cwd": "/repo"
  }
}
```

```json
{
  "ok": true,
  "claimed": ["/repo/src/foo.ts"],
  "conflicts": [],
  "ledgerVersion": 1,
  "claimedUntil": "2026-05-03T16:00:00.000Z"
}
```

### 2. coder-B 在同一个文件上发生冲突

```json
{
  "tool": "claim_files",
  "arguments": {
    "agentId": "coder-B",
    "paths": ["src/foo.ts", "src/new.ts"],
    "cwd": "/repo"
  }
}
```

```json
{
  "ok": false,
  "claimed": [],
  "conflicts": [
    {
      "path": "/repo/src/foo.ts",
      "ownerAgentId": "coder-A",
      "expiresAt": "2026-05-03T16:00:00.000Z"
    }
  ],
  "ledgerVersion": 1,
  "claimedUntil": "2026-05-03T16:00:00.000Z"
}
```

### 3. coder-A release 这个文件

```json
{
  "tool": "release_claim",
  "arguments": {
    "agentId": "coder-A",
    "paths": ["src/foo.ts"],
    "cwd": "/repo"
  }
}
```

```json
{
  "ok": true,
  "released": ["/repo/src/foo.ts"],
  "missing": [],
  "ledgerVersion": 1
}
```

## Troubleshooting

### `claim_files` 返回 `ok: false`

这意味着请求的路径中至少有一个已经被另一个活跃所有者 claim,因此没有写入任何新内容。查看 `conflicts` 数组,了解具体重叠的规范化路径和当前的 `ownerAgentId`,然后在重试之前用 `whose_claim` 检查同样的路径。

```json
{
  "tool": "whose_claim",
  "arguments": {
    "paths": ["src/foo.ts", "src/new.ts"],
    "cwd": "/repo"
  }
}
```

即使只有一个路径冲突,混合请求仍然是 all-or-nothing。请拆分工作,或者等当前所有者 release 冲突的路径。

### 用 claim id 调用 `release_claim` 返回 `missing: ["..."]`

那个 claim id 在 release 时刻并不存在于本地 ledger 的活跃记录中。它可能已经被 release、已经过期,或者从未在这台机器上存在过。这不会被当作部分成功来处理。

### 用 paths 调用 `release_claim` 返回 `released: []`

如果 `ok` 仍然是 `true` 但 `released` 为空,说明请求的规范化路径没有匹配到任何属于调用者的活跃 claim。`missing` 数组会告诉你哪些规范化路径没有匹配上。

当你不确定某个路径是空闲、被其他 agent 拥有、还是已经从 ledger 中消失时,请先使用 `whose_claim`。

### release 别人的 claim

只有当前所有者可以 release 一条活跃的 claim。如果另一个 agent 仍然拥有该路径,请用 `whose_claim` 检查,与该所有者协调,或者等待 TTL 过期。

## Comparison

| Tool | 擅长的事 | Agent Claim MCP 的不同之处 |
| --- | --- | --- |
| **Agent Claim MCP** | 为共享 worktree 提供的一个狭窄的协调原语 | 它只回答: 这个路径归谁所有、我能不能 claim 它、我能不能 release 它? |
| **madebyaris/agent-orchestration** | 更宽泛的编排模式、规则、路由、队列以及 AGENTS.md 风格的协调 | Agent Claim MCP 有意做得少得多。它不捆绑队列、规划器行为或仓库策略。它是你能组合进其他工作流的最小本地原语。 |

**选择 Agent Claim MCP**,当你已经有自己的任务分派层,只需要路径所有权协调时。

**选择更宽泛的编排项目**,当你想用一个包定义 agent 规则、工作队列、协调策略和更高层的执行流程时。

## FAQ

<details>
<summary><strong>什么时候 agent 应该选它,而不是每个 agent 一个 git branch 或 worktree?</strong></summary>

当多个 agent 有意共享同一个 checkout 和同一个文件系统视图时选择 claim —— 因为它们复用同一份 `node_modules`、构建产物或一个正在运行的 dev 服务器,或者因为任务分派层本来就是按文件而不是按 branch 来切分工作。branch-per-agent 和 worktree-per-agent 靠复制状态来防止碰撞,并把冲突推迟到 merge 时刻;claim 则通过在第一次编辑之前声明路径所有权来防止碰撞,不需要额外的 checkout,也没有 merge 步骤。如果你的工作流已经把每个 agent 隔离在各自的 branch 或 worktree 中,你可能根本不需要这个服务器。
</details>

<details>
<summary><strong>claim 和真正的锁或 git worktree 隔离有什么区别?</strong></summary>

claim 是一条建议性(advisory)的所有权记录,不是被强制执行的文件系统锁。没有任何东西在物理上阻止一个行为不端的进程写入已被 claim 的路径;这里的约束是协作式的,而这恰恰是 MCP agent 能够遵守的契约: 编辑前调用 `claim_files`,尊重 `ok: false`,完成后 release。worktree 隔离更强,但也更重 —— 多份 checkout、重复的状态,以及只在 merge 时才浮出水面的冲突。两者可以组合使用: 用 worktree 承载长期存在的并行工作流,在任何一个被多个 agent 触碰的 worktree 内部使用 claim。
</details>

<details>
<summary><strong>TTL 到底做了什么? claim 过期时会发生什么?</strong></summary>

每条 claim 都携带一个 TTL(`ttlSeconds`,默认 3600),过期的 claim 会在下一次 ledger 读取或写入时被自动清理。这意味着一个崩溃、被 kill 或被遗弃的会话永远不可能无限期地阻塞一个路径 —— 最坏情况就是一个 TTL 窗口。过期是保护性清理,不是任务交接: 仍在积极工作的 agent 应当刷新自己的 claim(用相同的 `agentId` 重新 claim 相同的路径),而不是一开始就要求一个非常长的 TTL。
</details>

<details>
<summary><strong>发生冲突时,准确地说会发生什么?</strong></summary>

`claim_files` 是 all-or-nothing。如果请求的任何路径已经被另一条活跃的 claim 拥有,这个 tool 会返回 `ok: false`,不写入任何内容 —— 包括同一请求中那些没有冲突的路径 —— 并把每个冲突的规范化路径连同当前的 `ownerAgentId` 和 `expiresAt` 一起列在 `conflicts` 数组中。没有排队,没有重试,也没有强制接管。下一步做什么由调用方 agent 决定: 拆分这批路径、用 `whose_claim` 检查所有者、通过自己的任务分派层协调,或者等待 release 或 TTL 过期。
</details>

<details>
<summary><strong>它能在不同的 MCP 客户端之间同时工作吗,比如 Claude Code 加 Cursor?</strong></summary>

可以,只要所有客户端都在同一台机器上以同一个用户运行。每个 MCP 客户端会启动自己的服务器进程,但所有进程都通过原子的 temp-file-plus-rename 写入收敛到同一份磁盘上的 ledger,因此在 Claude Code 会话中创建的 claim 对 Cursor 或 Cline 会话立即可见。agent 唯一需要保持一致的是路径形态: 传入能解析到同一个仓库根目录的 `cwd` 或绝对路径,让规范化在客户端之间对齐。
</details>

<details>
<summary><strong>状态存在哪里? 有任何东西离开我的机器吗?</strong></summary>

全部状态都保存在一个本地 JSON ledger 中,位于 `~/.agent-claim-mcp/ledger.json`。没有守护进程,没有后台进程,没有网络监听,没有遥测,也没有云同步 —— 服务器只在 tool 被调用时读写那个文件。这同时也是产品的边界: claim 协调的是共享同一个文件系统视图的会话,跨主机协调被明确排除在范围之外。
</details>

<details>
<summary><strong>我能 release 或抢走另一个 agent 拥有的 claim 吗?</strong></summary>

不能。`release_claim` 只会移除属于调用方 `agentId` 的活跃 claim,无论是通过 `claimId` 还是通过规范化路径来定位。如果另一个 agent 仍然拥有某个路径,你的选择是: 用 `whose_claim` 检查它、通过你的任务分派层与那个所有者协调、或者等待 TTL 过期。这让这个原语保持可预测: 所有权只会因为显式的 release 或过期而改变,绝不会被悄悄接管。
</details>

## How it works

- claim 保存在位于 `~/.agent-claim-mcp/ledger.json` 的本地 JSON ledger 中
- 路径会被规范化为绝对路径,因此不同的 agent 无法用相对路径技巧或路径形态变体来躲避碰撞检测
- 跨会话的重叠 claim 通过同一份 ledger 解析,而不是依赖内存中的协调
- 过期的 claim 会在读取和写入时被自动清理
- 写入使用 temp-file plus rename 语义来实现原子更新

## Development

```bash
npm ci
npm run build
npm test
npm run smoke
```

## Packaging

npm 包预期至少包含:

- `README.md`
- `server.json`
- 编译后的 `dist/`

发布前使用这个检查:

```bash
npm pack --dry-run
```

## Publish prerequisites

预期的发布路径是版本 tag push 之后运行的 GitHub Actions 发布任务。要让无人值守的 npm publish 步骤成功,workflow 必须从为 npm 发布配置的仓库 secret 中接收到一个非空的 `NODE_AUTH_TOKEN`。

如果 CI 中 `NODE_AUTH_TOKEN` 缺失或为空,即使包本身已经就绪,第一次 npm publish 尝试也会以 `ENEEDAUTH` 失败。在重试发布之前,请确认 GitHub 仓库 secret 存在并已映射到 publish 任务,而不是尝试在本地重跑 publish 步骤。

关于打 tag 之前的本地证明路径,请运行 [`docs/smoke-proof.md`](./docs/smoke-proof.md) 中的简短 smoke 检查清单。

关于发布后的第一次外部接受检查,请使用 [`docs/official-registry-validation-runbook.md`](./docs/official-registry-validation-runbook.md) 中的维护者 runbook,以及 [`docs/official-registry-validation-checklist.md`](./docs/official-registry-validation-checklist.md) 中的简短记录模板。

## License

[MIT](./LICENSE)
