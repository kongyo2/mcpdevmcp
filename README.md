# @kongyo2/mcpdevmcp

LLMエージェントが他のMCPサーバーを開発、デバッグ、検査するためのMCPサーバーです。

[MCP Inspector](https://github.com/modelcontextprotocol/inspector) CLIの機能をラップし、エージェントが自身の環境から直接プログラム的に他のMCPサーバーの挙動（ツールの確認、リソースの読み取り、プロンプトのテスト）を検証できるようにします。

## 特徴

- **プログラムによる検査**: ターゲットとなるMCPサーバーのツール一覧・実行、リソース一覧・読み取り、プロンプト一覧・取得が可能。
- **エージェントフレンドリー**: LLMエージェントが自律的にMCPサーバーを開発・検証するために設計。
- **柔軟なトランスポート**: `stdio`（ローカルコマンド実行）と `sse`/`http`（リモートURL接続）の両方に対応。

## クイックスタート設定

MCPクライアント（例: `claude_desktop_config.json`）の設定に追加してください：

```json
{
  "mcpServers": {
    "mcpdev": {
      "command": "npx",
      "args": ["-y", "@kongyo2/mcpdevmcp"]
    }
  }
}
```

## 利用可能なツール

すべてのツールは `target` 引数を受け取ります。これにはローカルの実行コマンドまたはリモートURLを指定できます。

### 1. `mcpdev_inspector_list_tools`
ターゲットMCPサーバーで利用可能なすべてのツールを一覧表示します。

```javascript
// 例: リモートサーバーを検査
{
  "target": "https://mcp.deepwiki.com/sse",
  "transport": "sse"
}
```

### 2. `mcpdev_inspector_call_tool`
ターゲットMCPサーバー上の特定のツールを実行します。

```javascript
// 例: ローカルサーバーのツールを実行
{
  "target": "node ./my-server/dist/index.js",
  "transport": "stdio",
  "tool_name": "calculator",
  "tool_args": { "a": 1, "b": 2, "op": "add" }
}
```

### 3. `mcpdev_inspector_list_resources`
ターゲットMCPサーバーのリソース一覧を取得します。

### 4. `mcpdev_inspector_read_resource`
特定のリソースの内容を読み取ります。

### 5. `mcpdev_inspector_list_prompts`
ターゲットMCPサーバーのプロンプト一覧を取得します。

### 6. `mcpdev_inspector_get_prompt`
特定のプロンプトテンプレートを取得します。

## 開発について

このプロジェクトは、高品質かつモダンなTypeScriptのベストプラクティスに基づいて構築されています：

- **TypeScript**: Strictモード, ES2022
- **エラーハンドリング**: `neverthrow` を使用したResult型（ビジネスロジック内での例外スロー禁止）
- **Linting**: `oxlint` による高速なLint

### ビルド

```bash
npm install
npm run build
```

### テスト

```bash
# Inspectorを使用して、このサーバー自身のツール一覧を取得
npx @modelcontextprotocol/inspector --cli --method tools/list node dist/index.js
```

## ライセンス

MIT
