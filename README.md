# labor-law-mcp

日本の労働法・社会保険・労災・安全衛生分野の一次情報へアクセスするための MCP サーバーです。

AI が労務相談や労災相談に回答する際、法令・通達・判例の原文を取得し、利用者自身が根拠を確認できる環境を提供します。

## 課題

日本の労務・社会保険分野では、法改正や行政通達の更新が頻繁に行われています。

LLM 単体では、

* 古い制度に基づく回答
* 存在しない条文の引用
* 存在しない通達の引用
* 判例の誤認識

が発生する可能性があります。

労務・労災・社会保険の相談は、誤った根拠に基づくと不利益に直結します。AI の回答が「それらしく」見えても、根拠となる条文・通達・判例が実在するかは別問題です。

## 解決方法

labor-law-mcp は、法令・通達・判例などの**一次情報へアクセスする仕組み**を提供し、利用者が回答の根拠を確認できるようにします。

### 取得するだけ — 判断は人が行う

labor-law-mcp は「法律相談を行うシステム」ではありません。目的は、

* 法令を取得する
* 通達を取得する
* 判例を取得する
* 根拠を確認する

ことです。判断を行うのは利用者または専門家です。

### 対象領域

**労働法**

* 労働基準法
* 労働契約法
* 労働安全衛生法
* 最低賃金法
* 労働者派遣法
* 育児介護休業法
* 男女雇用機会均等法

**社会保険**

* 健康保険法
* 厚生年金保険法
* 国民年金法
* 雇用保険法
* 労災保険法

**行政資料・判例**

* 厚生労働省通達
* 安全衛生情報センター（JAISH）通達
* 労働保険審査会裁決
* 裁判所判例
* ハラスメント裁判例

## 実例

### ハラスメント相談

質問:

> 上司から毎日人格否定を受けています。パワハラに該当しますか？

AI は即断しません。まず、

* 労働施策総合推進法
* 厚労省パワハラ指針
* 関連裁判例

を取得し、根拠を確認した上で回答を支援します。

### 労災相談

質問:

> 長時間労働による精神疾患は労災になりますか？

まず、

* 労災保険法
* 精神障害の労災認定基準
* 関連通達
* 関連裁決事例

を取得し、制度の確認を支援します。

### 社会保険相談

質問:

> 傷病手当金は受給できますか？

まず、

* 健康保険法
* 厚労省通知
* 関連資料

を取得し、制度確認を支援します。

### 想定される活用シーン

* ハラスメント相談前の論点整理
* 労災申請前の制度確認
* 傷病手当金の制度確認
* 復職支援における制度調査
* 人事部門の法令確認
* 社会保険労務士の調査補助
* 労働組合の調査支援
* AIエージェントによる法令裏取り

## 技術

### セットアップ

本フォークは npm に公開していません。**ソースから clone して利用**するか、**自分で Vercel にデプロイ**してください。

#### ローカル（ソースから）

```bash
git clone https://github.com/omusubiman5/labor-law-mcp.git
cd labor-law-mcp
npm install
npm run build
```

**Claude Desktop** / **Claude Code** の設定に以下を追加:

```json
{
  "mcpServers": {
    "labor-law": {
      "command": "node",
      "args": ["/path/to/labor-law-mcp/dist/index.js"]
    }
  }
}
```

#### セルフホスト（Vercel）＋ Claude.ai（Web）からリモート接続

自分でサーバーを建てて、`https://` の MCP エンドポイントとして公開できます。MCP は Streamable HTTP トランスポートで動作し、Next.js（App Router）の Route Handler（`app/api/mcp/route.ts`）上にステートレスでデプロイされます。

1. このリポジトリを Vercel に import（または `vercel` CLI でデプロイ）
2. **環境変数を設定**（`.env.example` 参照）。OAuth 認証が有効なため未設定だと接続できません。
3. デプロイ後、Claude.ai の設定画面で自分のエンドポイント `https://<your-project>.vercel.app/mcp` を MCP サーバーとして登録

> 末尾の `/mcp` を忘れないこと。`/` のみでは接続できません。

> **ツール使用許可**: Claude.ai で初めてツールが呼ばれると「このツールの実行を許可しますか？」というダイアログが表示されます。**「Allow」をクリック**しないとツールが実行されず、「No approval received」「Denied」エラーになります。「Always allow」を選択すると以降の確認が不要になります。

デプロイ時の注意点（リクエストボディの事前消費、`/mcp` パス、`/MCP` 大文字化対応など）は [docs/vercel-mcp-guide.md](docs/vercel-mcp-guide.md) を参照してください。

> **🔐 認証について**: このエンドポイントは **OAuth 2.1（認可コード + PKCE）** で保護されています（`Authorization: Bearer` 必須、無認証アクセスは 401）。ID プロバイダは **Auth0**（Google Workspace 等を upstream IdP に federate する想定）で、`ALLOWED_EMAILS` に列挙したユーザーのみ認可されます。
>
> **必要な環境変数**（Vercel の Project Settings → Environment Variables に設定。詳細は [`.env.example`](.env.example)）:
>
> | 変数 | 説明 |
> |---|---|
> | `SERVER_URL` | このサーバーの公開 URL（例: `https://<your-project>.vercel.app`） |
> | `AUTH0_DOMAIN` / `AUTH0_CLIENT_ID` / `AUTH0_CLIENT_SECRET` | Auth0 テナント設定 |
> | `OAUTH_SECRET` | 内部 JWT 署名鍵（`openssl rand -base64 32`） |
> | `ALLOWED_EMAILS` | 認可するメールアドレス（カンマ区切り。空にすると全員許可） |
>
> 認証フローのエンドポイント: `/.well-known/oauth-authorization-server`, `/.well-known/oauth-protected-resource`, `/oauth/authorize`, `/oauth/callback`, `/oauth/token`, `/oauth/register`（いずれも `app/` 配下、`lib/oauth.ts` が共通ロジック）。Auth0 側の Allowed Callback URL に `${SERVER_URL}/oauth/callback` を登録すること。

### MCP ツール

| ツール | 説明 |
|---|---|
| `get_law` | e-Gov法令APIから条文を取得。法令名 + 条番号で指定 |
| `search_law` | キーワードで法令を検索 |
| `search_mhlw_tsutatsu` | 厚労省法令等DBから通達をキーワード検索 |
| `get_mhlw_tsutatsu` | 厚労省通達の本文を取得。data_idで指定 |
| `search_jaish_tsutatsu` | JAISH安全衛生情報センターから安衛通達を検索 |
| `get_jaish_tsutatsu` | JAISH安衛通達の本文を取得。URLで指定 |
| `search_harassment_cases` | あかるい職場応援団のハラスメント裁判例を検索 |
| `get_harassment_case` | ハラスメント裁判例の詳細（概要・判決ポイント）を取得 |
| `search_court_cases` | 裁判所の判例データベースを検索（メタデータ+PDF URL） |
| `search_shinsakai_decisions` | 労働保険審査会の裁決事案を検索（カテゴリ別・年度別） |
| `search_zenkiren_cases` | 全基連の主要労働判例を検索（curated subset） |
| `get_zenkiren_case` | 全基連判例の詳細ページを取得 |

### フォーク元からの改良点

本プロジェクトは [kentaroajisaka/labor-law-mcp](https://github.com/kentaroajisaka/labor-law-mcp)（法令・厚労省通達・安衛通達の取得、ローカル接続のみ）のフォークです。本フォークでは主に次を追加しています。

- **`https://` リモート MCP 接続** — Vercel Serverless 上に Streamable HTTP トランスポートでデプロイし、Claude.ai 等から `https://.../mcp` エンドポイント経由で利用できるようにしました（Vercel のリクエストボディ事前消費への対応など、サーバーレス特有の手当てが必要でした。詳細は [docs/vercel-mcp-guide.md](docs/vercel-mcp-guide.md)）。
- **判例・裁判例・裁決の取得** — 裁判所判例DB・ハラスメント裁判例・労働保険審査会裁決・全基連判例の検索/取得ツールを追加。

### 出典

- 法令: [e-Gov法令検索](https://laws.e-gov.go.jp/)（デジタル庁）
- 厚労省通達: [厚生労働省 法令等データベース](https://www.mhlw.go.jp/hourei/)
- 安衛通達: [安全衛生情報センター](https://www.jaish.gr.jp/)（中央労働災害防止協会）
- ハラスメント裁判例: [あかるい職場応援団](https://www.no-harassment.mhlw.go.jp/)（厚生労働省）
- 判例: [裁判所 裁判例情報](https://www.courts.go.jp/app/hanrei_jp/search2)
- 裁決事案: [労働保険審査会 裁決要旨](https://www.mhlw.go.jp/topics/bukyoku/shinsa/roudou/saiketu-youshi/)（厚生労働省）
- 労働判例: [全基連 判例データベース](https://www.zenkiren.com/Portals/0/html/jinji/hannrei/)（全国労働基準関係団体連合会）

厚労省通達の利用は[厚生労働省ホームページの利用規約](https://www.mhlw.go.jp/chosakuken/index.html)に基づきます。

## Disclaimer

本プロジェクトは法律相談、社会保険労務士業務、弁護士業務を代替するものではありません。

法令・通達・判例等の一次情報取得を支援するためのツールです。

最終判断については、弁護士、社会保険労務士その他の専門家へ相談してください。

## 謝辞・参考

本プロジェクトは [kentaroajisaka/labor-law-mcp](https://github.com/kentaroajisaka/labor-law-mcp) をフォークして開発しています。オリジナルの作者および、アーキテクチャのベースとなった以下のプロジェクトに感謝します。

- [kentaroajisaka/labor-law-mcp](https://github.com/kentaroajisaka/labor-law-mcp) — フォーク元
- [tax-law-mcp](https://github.com/kentaroajisaka/tax-law-mcp) — 税法版MCPサーバー（アーキテクチャのベース）
- [e-Gov法令API v2](https://laws.e-gov.go.jp/api/2/swagger-ui) — API仕様

## ライセンス

MIT
