# Agent Claim MCP

[![npm](https://img.shields.io/npm/v/@vk0/agent-claim-mcp)](https://www.npmjs.com/package/@vk0/agent-claim-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**Languages:** [English](./README.md) · 日本語 · [简体中文](./README.zh-CN.md) · [Русский](./README.ru.md) · [Español](./README.es.md)

Agent Claim MCP は、複数のコーディングエージェントがひとつの worktree を共有していて、フルサイズのオーケストレーションフレームワークではなく、編集前に使う小さなローカル調整プリミティブが必要なときに使います。エージェントに与える仕事はひとつだけです: パスを claim し、衝突を検出し、所有権を release することで、並行作業が同じファイルを踏み荒らすのを止めます。

Agent Claim MCP は、Claude Code、Cursor、Cline などの MCP クライアント向けの local-first な MCP サーバーで、キューもプランナーも独自の AGENTS.md 規約も持たずにファイル所有権の調整だけを行います。現在のリリース面は 3 つの限定されたアクションに集中しています: 正規化されたパスを claim する、誰がそれを所有しているかを調べる、そしてパスまたは claim id で release する — 別々のセッション間の衝突は明示的にレポートされます。

> リリース状況: `@vk0/agent-claim-mcp@1.0.0` は npm で公開済みのため、`npx -y @vk0/agent-claim-mcp` というインストールパスが外部ユーザー向けの正直なデフォルトになりました。Phase 5 の external proof は Official MCP Registry のバリデーションまたは Smithery のライブリスティングのどちらかで満たせますが、そのどちらかの公開アーティファクトが明示的に検証されるまで、現在の proof 状態は pending のままです。Official MCP Registry のバリデーションはまだ pending なので、実際の registry または Smithery の proof URL を引用できるまで、このパッケージを registry-accepted や marketplace-listed と説明しないでください。
>
> マイルストーンの真実: プロダクトの wedge は狭いままです。共有 worktree の衝突防止のための 3 つの tools とローカル JSON ledger であり、より広いオーケストレーションプラットフォームではありません。
>
> 現在の次の手動ステップ: Official MCP Registry proof のための人間による rerun と検証パスを完了させ、npm の可用性から受理を推測するのではなく、その実行結果の判定を記録することです。

## Registry rerun quickstart

現在の正直な状態:
- npm `1.0.0` は公開済み
- Official MCP Registry の受理はまだ pending
- workflow `25282612113` は registry バリデーションパスを完了しなかった
- リポジトリは以前の `NPM_TOKEN` secret 修正ステップは通過済みですが、registry proof を accepted として扱うには、人間による rerun と検証がまだ必要です

正確な rerun コマンド:

```bash
gh run rerun 25282612113 --repo vk0dev/agent-claim-mcp
```

rerun のあと、この順序で検証してください:
1. GitHub Actions で rerun が正常に完了したことを確認する
2. `npm run preflight:registry` を実行する
3. `docs/official-registry-validation-runbook.md` に従う
4. それが済んで初めて registry の受理を proven として記録する

オペレーター向けショートカット: runbook の [Quick operator path](./docs/official-registry-validation-runbook.md#quick-operator-path) を使うと rerun から検証までの正確な順序がわかります。また、npm-live の状態と registry-proof の状態は別のものとして扱ってください。

## Why / When to use

タスクのルーティングは既にあるが、編集時にシンプルな lock 的プリミティブがまだ必要なワークフローには、このサーバーを選んでください:

- 2 つ以上のエージェントが同じリポジトリに並行して触れる可能性がある
- merge コンフリクトの後ではなく、ファイル編集の前に衝突検出がほしい
- claim が TTL で自動的に期限切れになってほしい
- 別のエージェントが name + description だけで理解できる狭いプリミティブがほしい
- バンドルされたルールエンジン、キューランナー、オーケストレーションプラットフォームは**いらない**

## Installation

外部向けの正規のインストールパスは、公開済みの npm パッケージです:

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

状況メモ: npm でのインストールは今日から使えますが、Official MCP Registry のバリデーションや Smithery などのマーケットプレイスの proof はまだ確立されていません。このパッケージは marketplace-verified ではなく、まず npm-available として扱ってください。

公開パッケージではなくローカルのチェックアウトから開発している場合は、MCP クライアントをビルド済みの `dist/server.js` に直接向けることもできます。

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

2 つ目の例はローカル開発専用です。Windows では、POSIX パスをそのままコピーするのではなく、自分のマシン上のビルド済み `dist/server.js` のパスを MCP クライアントに指定してください。

ローカルパスを使う前に一度ビルドします:

```bash
cd /Users/vkdev/projects/agent-claim-mcp
npm ci
npm run build
```

### Claude Code

Claude Code の MCP 設定に stdio サーバーを追加します:

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

Claude Desktop は macOS では `~/Library/Application Support/Claude/claude_desktop_config.json`、Windows では `%APPDATA%\Claude\claude_desktop_config.json` を使います:

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

`claude_desktop_config.json` を保存したら、MCP サーバー設定を再読み込みさせるために Claude Desktop を完全に再起動してください。

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

このサーバーは意図的に狭く、local-first です。エージェントたちがひとつのファイルシステムビューを共有しているときにインストールするものであり、分散協調が必要なときのものではありません。

- claim はディスク上のローカル ledger に保存されるため、同じ worktree を読み書きできるセッション間でのみ調整が成立します。
- これはホスト型のロックサービス、キュー、スケジューラーではなく、claim を単独でマシン間にレプリケートすることもありません。
- TTL による期限切れは保護的なクリーンアップであり、より上位のタスク所有権や人間によるレビューの代わりではありません。
- パス正規化は形の食い違いを減らしますが、claim を一致させるには、エージェントが同じリポジトリルートまたは `cwd` を指す必要があります。
- ワークフローにクロスホストの協調、中央監査ポリシー、必須の承認が必要なら、claim ledger をスコープ外まで引き伸ばすのではなく、別のオーケストレーションレイヤーとこのサーバーを組み合わせてください。

公開前の実際のマルチエージェント実行については、[DOGFOOD.md](./DOGFOOD.md) と [docs/dogfood-report.md](./docs/dogfood-report.md) の proof アーティファクトを参照してください。

## Tools

### `claim_files`

ローカルの file-claim エントリを作成または更新し、並行するエージェントが編集前に所有権を確認できるようにして、アクティブなタスク中に同じ worktree のパスを踏み荒らすのを防ぎます。コンフリクトのレスポンスは明示的なので、別々のセッション間で重なった claim が暗黙のまま、あるいは in-memory だけに留まることはありません。

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

リクエストしたパスのいずれかが別のアクティブな所有者によって既に claim されている場合、tool は `ok: false` を返し、何も書き込みません。

### `release_claim`

現在のエージェントが所有する既存の claim を削除し、完了・一時停止・再割り当てされた作業が、他のエージェントによる同じパスの安全な編集をブロックし続けないようにします。

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

アクティブな claim を release できるのは現在の所有者だけです。`claimId` で指定しても正規化された `paths` で指定しても同じなので、実際のマルチエージェント実行後のクリーンアップが機能し、パス形状のバリアントも一貫して解決されます。

### `whose_claim`

ローカル ledger を読み取り、ファイルパスが空いているのか現在 claim されているのかを、所有者・タスク・note・期限のメタデータとともに説明します。同じ worktree を共有する別々のセッション間での安全な調整のためのものです。

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

### 1. coder-A が `foo.ts` を claim する

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

### 2. coder-B が同じファイルで衝突する

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

### 3. coder-A がファイルを release する

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

### `claim_files` が `ok: false` を返す

リクエストしたパスの少なくともひとつが別のアクティブな所有者によって既に claim されているため、新しいものは何も書き込まれなかったという意味です。`conflicts` 配列で、重なっている正確な正規化パスと現在の `ownerAgentId` を確認し、リトライする前に `whose_claim` で同じパスを調べてください。

```json
{
  "tool": "whose_claim",
  "arguments": {
    "paths": ["src/foo.ts", "src/new.ts"],
    "cwd": "/repo"
  }
}
```

ひとつのパスが衝突しても、混在リクエストは依然として all-or-nothing です。作業を分割するか、現在の所有者が衝突パスを release するのを待ってください。

### claim id を指定した `release_claim` が `missing: ["..."]` を返す

その claim id は、release の時点でローカル ledger 内でアクティブではありませんでした。既に release 済みか、期限切れか、そもそもこのマシンには存在しなかった可能性があります。これは部分的な成功としては扱われません。

### paths を指定した `release_claim` が `released: []` を返す

`ok` が `true` のままなのに `released` が空の場合、リクエストされた正規化パスは、呼び出し元が所有するアクティブな claim のどれとも一致しませんでした。`missing` 配列を見れば、どの正規化パスが一致しなかったかがわかります。

パスが空いているのか、別のエージェントが所有しているのか、既に ledger から消えているのか自信がないときは、まず `whose_claim` を使ってください。

### 他人の claim を release する

アクティブな claim を release できるのは現在の所有者だけです。別のエージェントがまだそのパスを所有している場合は、`whose_claim` で調べるか、その所有者と調整するか、TTL の期限切れを待ってください。

## Comparison

| Tool | 得意なこと | Agent Claim MCP との違い |
| --- | --- | --- |
| **Agent Claim MCP** | 共有 worktree のためのひとつの狭い調整プリミティブ | 答える問いはこれだけです: このパスは誰が所有しているか、claim できるか、release できるか? |
| **madebyaris/agent-orchestration** | より広いオーケストレーションパターン、ルール、ルーティング、キュー、AGENTS.md 風の調整 | Agent Claim MCP は意図的にずっと少ないことしかしません。キューイングもプランナー的な振る舞いもリポジトリポリシーもバンドルしません。他のワークフローに組み込める最小のローカルプリミティブです。 |

**Agent Claim MCP を選ぶ**のは、独自のタスキングレイヤーが既にあり、パス所有権の調整だけが必要なとき。

**より広いオーケストレーションプロジェクトを選ぶ**のは、エージェントルール、ワークキュー、調整ポリシー、より上位の実行フローをひとつのパッケージで定義したいとき。

## FAQ

<details>
<summary><strong>エージェントごとの git branch や worktree ではなく、これを選ぶべきなのはいつ?</strong></summary>

複数のエージェントが意図的にひとつのチェックアウトとひとつのファイルシステムビューを共有しているとき — 同じ `node_modules`、ビルド成果物、起動中の dev サーバーを使い回しているとき、あるいはタスキングレイヤーが branch 単位ではなくファイル単位で作業を分割しているときに claim を選んでください。branch-per-agent や worktree-per-agent は、状態をコピーしてコンフリクトを merge 時まで先送りすることで衝突を防ぎます。claim は、最初の編集の前にパス所有権を宣言することで衝突を防ぎ、追加のチェックアウトも merge ステップも不要です。ワークフローが既に各エージェントを独自の branch や worktree に隔離しているなら、このサーバーはまったく必要ないかもしれません。
</details>

<details>
<summary><strong>claim は本物の lock や git worktree の隔離とどう違う?</strong></summary>

claim は勧告的(advisory)な所有権レコードであり、強制されるファイルシステムロックではありません。行儀の悪いプロセスが claim 済みのパスに書き込むことを物理的に妨げるものは何もありません。強制は協調的であり、それこそが MCP エージェントが守れる契約です: 編集前に `claim_files` を呼ぶ、`ok: false` を尊重する、終わったら release する。worktree の隔離はより強力ですが重いです — 別々のチェックアウト、重複した状態、merge 時になって初めて表面化するコンフリクト。ふたつは組み合わせられます: 長寿命の並行ストリームには worktree を、複数のエージェントが触れるひとつの worktree の内側では claim を使ってください。
</details>

<details>
<summary><strong>TTL は実際に何をしていて、claim が期限切れになると何が起こる?</strong></summary>

すべての claim は TTL(`ttlSeconds`、デフォルト 3600)を持ち、期限切れの claim は次の ledger の読み取りまたは書き込み時に自動的に整理されます。つまり、クラッシュした、kill された、放置されたセッションがパスを永遠にブロックすることはありません — 最悪でも TTL ひとつぶんの時間窓です。期限切れは保護的なクリーンアップであり、タスクの引き継ぎではありません: まだ作業中のエージェントは、最初から非常に長い TTL を要求するのではなく、自分の claim を更新(同じ `agentId` で同じパスを再度 claim)すべきです。
</details>

<details>
<summary><strong>コンフリクト時には正確に何が起こる?</strong></summary>

`claim_files` は all-or-nothing です。リクエストしたパスのいずれかが別のアクティブな claim に所有されている場合、tool は `ok: false` を返し、何も書き込まず — 同じリクエスト内の衝突していないパスも含めて — 衝突した各正規化パスを、現在の `ownerAgentId` と `expiresAt` とともに `conflicts` 配列に列挙します。キューイングもリトライも強制的な乗っ取りもありません。次に何をするかは呼び出し元のエージェントが決めます: バッチを分割する、`whose_claim` で所有者を調べる、独自のタスキングレイヤーで調整する、release または TTL の期限切れを待つ。
</details>

<details>
<summary><strong>Claude Code と Cursor のように、異なる MCP クライアントで同時に動く?</strong></summary>

はい。すべてのクライアントが同じマシン上で同じユーザーとして動いている限りは。各 MCP クライアントは自分のサーバープロセスを起動しますが、すべてのプロセスは atomic な temp-file-plus-rename 書き込みで同じディスク上の ledger に収束するため、Claude Code セッションで作られた claim は Cursor や Cline のセッションからも即座に見えます。エージェントが一貫させるべきなのはパスの形だけです: 同じリポジトリルートに解決される `cwd` または絶対パスを渡し、クライアント間で正規化が揃うようにしてください。
</details>

<details>
<summary><strong>状態はどこに保存され、何かがマシンの外に出ていく?</strong></summary>

すべての状態は `~/.agent-claim-mcp/ledger.json` にあるひとつのローカル JSON ledger に保存されます。デーモンもバックグラウンドプロセスもネットワークリスナーもテレメトリーもクラウド同期もありません — サーバーは tool が呼ばれたときにだけそのファイルを読み書きします。これはプロダクトの境界線でもあります: claim はひとつのファイルシステムビューを共有するセッションを調整するものであり、クロスホストの協調は明示的にスコープ外です。
</details>

<details>
<summary><strong>別のエージェントが所有する claim を release したり奪ったりできる?</strong></summary>

いいえ。`release_claim` は、`claimId` で指定しても正規化パスで指定しても、呼び出し元の `agentId` が所有するアクティブな claim だけを削除します。別のエージェントがまだそのパスを所有している場合の選択肢は、`whose_claim` で調べる、タスキングレイヤーを通じてその所有者と調整する、TTL の期限切れを待つ、のいずれかです。これがプリミティブを予測可能に保ちます: 所有権が変わるのは明示的な release か期限切れによってのみで、静かな乗っ取りは決して起こりません。
</details>

## How it works

- claim は `~/.agent-claim-mcp/ledger.json` にあるローカル JSON ledger に保存されます
- パスは絶対パスに正規化されるため、相対パスのトリックやパス形状のバリアントで異なるエージェントが衝突を回避することはできません
- 別々のセッション間で重なった claim は、in-memory の調整に頼るのではなく、同じ ledger を通じて解決されます
- 期限切れの claim は読み取りと書き込みのたびに自動的に整理されます
- 書き込みは atomic な更新のために temp-file plus rename セマンティクスを使います

## Development

```bash
npm ci
npm run build
npm test
npm run smoke
```

## Packaging

npm パッケージは少なくとも以下を含むことが期待されます:

- `README.md`
- `server.json`
- コンパイル済みの `dist/`

リリース前にこのチェックを使ってください:

```bash
npm pack --dry-run
```

## Publish prerequisites

想定されている publish パスは、バージョンタグの push 後に実行される GitHub Actions のリリースジョブです。無人での npm publish ステップが成功するには、npm publishing 用に設定されたリポジトリ secret から、workflow が空でない `NODE_AUTH_TOKEN` を受け取る必要があります。

CI で `NODE_AUTH_TOKEN` が欠落しているか空の場合、パッケージ自体は準備できていても、最初の npm publish の試行は `ENEEDAUTH` で失敗します。リリースをリトライする前に、publish ステップをローカルで再実行しようとするのではなく、GitHub リポジトリの secret が存在し publish ジョブにマップされていることを確認してください。

タグ付け前のローカル proof パスについては、[`docs/smoke-proof.md`](./docs/smoke-proof.md) の短い smoke チェックリストを実行してください。

publish 後の最初の external acceptance チェックには、[`docs/official-registry-validation-runbook.md`](./docs/official-registry-validation-runbook.md) のメンテナー用 runbook と、[`docs/official-registry-validation-checklist.md`](./docs/official-registry-validation-checklist.md) の短い記録テンプレートを使ってください。

## License

[MIT](./LICENSE)
