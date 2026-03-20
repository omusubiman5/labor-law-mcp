# Vercel で MCP サーバーを構築する際の注意点

Vercel Serverless Functions 上に MCP (Model Context Protocol) サーバーをデプロイする際に遭遇しやすい問題と対策をまとめる。

---

## 0. Claude.ai に登録する URL

Claude.ai の設定画面で MCP サーバーを登録する際、URL は必ず **`/mcp` パスまで含める**こと。

```
https://<your-project>.vercel.app/mcp
```

- 末尾の `/mcp` を省略すると接続エラーになる（`vercel.json` の rewrite が `/mcp` → `/api/mcp` にルーティングするため）
- Vercel がプロジェクト名にサフィックスを付与する場合がある（例: `my-mcp-rho.vercel.app`）ので、Vercel ダッシュボードで実際のドメインを確認すること
- Claude.ai はURL入力時にパスを自動的に大文字化する場合がある（`/mcp` → `/MCP`）。`vercel.json` の rewrites に `/MCP` → `/api/mcp` も追加しておくと安全

### ツール使用許可（重要）

Claude.ai で MCP ツールが初めて呼ばれると、**「このツールの実行を許可しますか？」** というダイアログが表示される。

- **「Allow」をクリック**しないとツールが実行されず、**「No approval received」「Denied」エラー**になる
- このエラーはサーバー側ではなく **Claude.ai のクライアント側**が生成するため、サーバー側では制御不可
- リクエストはサーバーに送信すらされない
- **「Always allow」** を選択すると以降の確認が不要になる

---

## 1. リクエストボディの事前消費問題（最重要）

### 症状
- GET リクエストは正常応答（406 等）するが、POST リクエストが 504 タイムアウト
- ランタイムログに POST のエントリが記録されない（関数内で永久ブロック）

### 原因
Vercel の Node.js Serverless Functions は、リクエストボディを事前にパースして `req.body` に格納する。この過程で生の `IncomingMessage` ストリームは消費済みになる。

MCP SDK の `StreamableHTTPServerTransport.handleRequest(req, res)` は内部で生ストリームからボディを読み取ろうとするため、データが来ない空ストリームを永遠に待ち続ける。

### 対策
**第3引数に pre-parsed ボディを渡す：**

```typescript
// NG: ストリームからボディを読み取ろうとして永久ブロック
await transport.handleRequest(req, res);

// OK: Vercel が事前パースしたボディを直接渡す
await transport.handleRequest(req, res, (req as any).body);
```

SDK のドキュメントにも記載されているパターン：
```typescript
// Using with pre-parsed request body
app.post('/mcp', (req, res) => {
  transport.handleRequest(req, res, req.body);
});
```

---

## 2. Transport の選択

### 推奨: `StreamableHTTPServerTransport`（Node.js 用）

```typescript
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
```

- Node.js の `IncomingMessage` / `ServerResponse` を直接扱える
- Vercel の `@vercel/node` ランタイムと親和性が高い
- SSE レスポンスの書き込みを SDK が管理するため、手動のストリーム制御が不要

### 非推奨: `WebStandardStreamableHTTPServerTransport`

```typescript
// Vercel では避ける
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
```

- Web Standard の `Request` / `Response` を使用するため、Node.js 環境で変換処理が必要
- SSE の `ReadableStream` を手動で `res.write()` にパイプする必要があり、Vercel 環境で正しく完了しない場合がある
- Cloudflare Workers / Deno / Bun 向けの API であり、Vercel Node.js Functions には不向き

---

## 3. `api/mcp.ts` のテンプレート

```typescript
import type { IncomingMessage, ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from '../src/server.js';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, mcp-session-id, Last-Event-ID, mcp-protocol-version',
  'Access-Control-Expose-Headers': 'mcp-session-id, mcp-protocol-version',
};

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value);
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // ステートレス
    });

    const server = createServer();
    await server.connect(transport);

    // ★ Vercel は req.body を事前パース済み。第3引数で渡す。
    await transport.handleRequest(req, res, (req as any).body);
  } catch (error) {
    console.error('MCP handler error:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
    }
    res.end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      }),
    );
  }
}
```

---

## 4. `vercel.json` の設定

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": ".",
  "functions": {
    "api/mcp.ts": {
      "maxDuration": 300
    }
  },
  "rewrites": [
    {
      "source": "/mcp",
      "destination": "/api/mcp"
    }
  ]
}
```

### ポイント

| 項目 | 設定値 | 理由 |
|------|--------|------|
| `buildCommand` | `"npm run build"` | `tsc` でソースをコンパイル。空文字 `""` でも Vercel が自動バンドルするが、明示的にビルドする方が安定 |
| `outputDirectory` | `"."` | Vercel がプロジェクトルートから `api/` を検出できるようにする |
| `maxDuration` | `300` | MCP リクエストは外部 API 呼び出しを含むため長時間化しやすい（Pro プラン以上で有効） |
| `rewrites` | `/mcp` → `/api/mcp` | Claude.ai の MCP 接続 URL を `/mcp` にできる |

---

## 5. `tsconfig.json` の設定

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests", "api"]
}
```

### 重要: `api` を `exclude` に含める

- `api/mcp.ts` は Vercel が独自にバンドルするため、`tsc` のコンパイル対象から除外する
- `rootDir: "./src"` と `api/` が競合してビルドエラーになるのを防ぐ

---

## 6. CORS ヘッダー

Claude.ai からのリモート MCP 接続には以下の CORS ヘッダーが必須：

```typescript
{
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, mcp-session-id, Last-Event-ID, mcp-protocol-version',
  'Access-Control-Expose-Headers':
    'mcp-session-id, mcp-protocol-version',
}
```

- `mcp-session-id`: セッション管理に使用
- `mcp-protocol-version`: プロトコルバージョンのネゴシエーション
- `Last-Event-ID`: SSE 再接続時のイベント ID
- `OPTIONS` プリフライトリクエストには `204` で即応答する

---

## 7. ステートレス設計

Vercel Serverless Functions はリクエストごとに新しいインスタンスが起動される可能性がある。

```typescript
// ステートレスモード: sessionIdGenerator を undefined に設定
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
});
```

- セッション状態をメモリに保持しない
- 各リクエストで `createServer()` + `transport` を新規作成
- インメモリキャッシュ（TTLCache 等）はコールドスタート時にリセットされる（ウォームインスタンスでは維持）

---

## 8. デプロイ時の注意点

### ドメイン名の確認

Vercel はプロジェクト名の衝突時にサフィックスを付与する：

| 期待するURL | 実際に割り当てられるURL |
|------------|----------------------|
| `my-mcp.vercel.app` | `my-mcp-rho.vercel.app` |
| `my-mcp.vercel.app` | `my-mcp-xi.vercel.app` |

**Claude.ai に登録する前に、Vercel ダッシュボードまたは API で実際のドメインを確認すること。**

```bash
# Vercel CLI で確認
vercel ls

# または API
curl https://api.vercel.com/v9/projects/<project-id>/domains \
  -H "Authorization: Bearer <token>"
```

### `package-lock.json` の整合性

- `git rebase` や `git merge` で `package-lock.json` がコンフリクトした場合、`git checkout --theirs` で解決すると依存関係が壊れる可能性がある
- 安全な解決方法：

```bash
# コンフリクトした package-lock.json を削除して再生成
rm -f package-lock.json
npm install
git add package-lock.json
```

### ビルドキャッシュ

- Vercel は前回のデプロイからビルドキャッシュを復元する
- 依存関係を大幅に変更した場合、ダッシュボードからキャッシュをクリアして再デプロイすると安全

---

## 9. デバッグ方法

### 接続テスト（curl）

```bash
# GET テスト（関数が動作しているか確認）
curl -s -w "\nHTTP:%{http_code} TIME:%{time_total}" \
  -X GET https://your-mcp.vercel.app/mcp

# 期待: 406 Not Acceptable（正常動作を示す）

# POST テスト（MCP initialize）
curl -s -w "\nHTTP:%{http_code} TIME:%{time_total}" \
  -X POST https://your-mcp.vercel.app/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"initialize",
    "params":{
      "protocolVersion":"2025-03-26",
      "capabilities":{},
      "clientInfo":{"name":"test","version":"1.0"}
    }
  }'

# 期待: 200 OK + SSE レスポンス（event: message\ndata: {...}）
```

### よくあるエラーと対処

| 症状 | 原因 | 対処 |
|------|------|------|
| GET: 406, POST: 504 タイムアウト | `handleRequest` に pre-parsed body を渡していない | 第3引数に `(req as any).body` を追加 |
| GET: 404 | `vercel.json` の rewrite 設定ミス | `source` / `destination` を確認 |
| ビルドエラー | `api/` が `tsconfig.json` の `include` に含まれている | `exclude: ["api"]` を追加 |
| 504 + ビルドログにエラーなし | `buildCommand: ""` で `dist/` が生成されていない | `buildCommand: "npm run build"` に設定 |
| `ERR_MODULE_NOT_FOUND` | ESM/CJS の不整合 | `package.json` に `"type": "module"` を設定 |
| ランタイムログに記録なし | 間違った URL にリクエストしている | Vercel ダッシュボードで実際のドメインを確認 |

---

## 10. チェックリスト

デプロイ前に以下を確認：

- [ ] `api/mcp.ts` で `handleRequest(req, res, (req as any).body)` と第3引数を渡しているか
- [ ] `StreamableHTTPServerTransport` を使用しているか（`WebStandard〜` ではなく）
- [ ] `sessionIdGenerator: undefined` でステートレスモードにしているか
- [ ] CORS ヘッダーに `mcp-session-id`, `mcp-protocol-version`, `Last-Event-ID` を含めているか
- [ ] `vercel.json` に `buildCommand`, `outputDirectory`, `rewrites` を設定しているか
- [ ] `tsconfig.json` の `exclude` に `api` を含めているか
- [ ] `package.json` に `"type": "module"` があるか
- [ ] Vercel ダッシュボードで実際の production ドメインを確認したか
- [ ] `curl` で GET（406）と POST（200 + SSE）の両方をテストしたか
- [ ] `vercel.json` の rewrites に `/MCP`（大文字）も追加したか
- [ ] Claude.ai でツール呼び出し時に「Allow」を押す必要がある旨をドキュメントに記載したか
