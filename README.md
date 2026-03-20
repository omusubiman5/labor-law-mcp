# labor-law-mcp

日本の労働・社会保険法令、行政通達、判例・裁判例を取得する MCP サーバー。

Claude が労務の質問に回答する際、**条文や通達のハルシネーションを防止**するために、e-Gov法令API・厚労省法令等DB・安全衛生情報センター・裁判所判例DB等から原文を取得して裏取りさせます。

## 特徴

### 法令・通達
- **法令取得** — e-Gov法令API v2 から条文をMarkdown形式で取得
- **法令検索** — キーワードで法令を横断検索
- **厚労省通達検索・取得** — 厚労省法令等データベースから通達をキーワード検索・本文取得
- **安衛通達検索・取得** — 安全衛生情報センター（JAISH）から安衛法関連通達を検索・取得
- **主要法令プリセット** — 労働基準法・雇用保険法・健康保険法等のlaw_idをハードコード（45法令）
- **略称対応** — 「労基法」「安衛法」「育介法」「健保法」等の略称で指定可能

### 判例・裁判例
- **ハラスメント裁判例** — あかるい職場応援団（厚労省）から裁判例を検索・詳細取得
- **裁判所判例検索** — courts.go.jp判例データベースをキーワード検索（メタデータ+PDF URL）
- **労働保険審査会裁決** — 裁決事案をカテゴリ別・年度別に検索
- **全基連主要判例** — 主要労働判例（解雇・パワハラ・残業代等）のcurated subsetを検索・詳細取得

### プロンプトテンプレート
- **労務法令調査** — 法令→条文→通達の流れで体系的調査
- **通達調査** — 厚労省通達・安衛通達を重点的に調査
- **安全衛生調査** — 安衛法の条文と関連通達を体系的に調査
- **心理的負荷評価** — 精神障害の労災認定基準に基づく心理的負荷評価
- **労災申請書下書き** — 様式第23号の業務上の出来事記述を支援

## MCP ツール

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

## 対応法令（プリセット45法令）

### 労働基準関係
労働基準法、労働基準法施行令、労働基準法施行規則、労働契約法、最低賃金法、賃金支払確保法

### 労働安全衛生関係
労働安全衛生法、労働安全衛生法施行令、労働安全衛生規則、じん肺法

### 労働保険関係
労災保険法、雇用保険法、雇用保険法施行令、雇用保険法施行規則、労働保険徴収法

### 職業安定・雇用対策関係
職業安定法、労働者派遣法、高年齢者雇用安定法、障害者雇用促進法、職業能力開発促進法、中小企業退職金共済法

### 雇用均等・ワークライフバランス関係
男女雇用機会均等法、育児介護休業法、パートタイム・有期雇用労働法、次世代育成支援対策推進法、女性活躍推進法

### 労使関係
労働組合法、労働関係調整法、個別労働紛争解決促進法、労働施策総合推進法（パワハラ防止法）

### 社会保険関係
健康保険法、厚生年金保険法、国民年金法、国民健康保険法、介護保険法、社会保険労務士法 等

### 略称対応

| 略称 | 正式名称 |
|------|----------|
| 労基法 | 労働基準法 |
| 安衛法 | 労働安全衛生法 |
| 派遣法 | 労働者派遣法 |
| 雇保法 | 雇用保険法 |
| 労災法 | 労災保険法 |
| 健保法 | 健康保険法 |
| 厚年法 | 厚生年金保険法 |
| 国年法 | 国民年金法 |
| 育介法 | 育児介護休業法 |
| 均等法 | 男女雇用機会均等法 |
| パート法 | パートタイム・有期雇用労働法 |
| パワハラ防止法 | 労働施策総合推進法 |

## セットアップ

### npx（推奨）

インストール不要。以下の設定をコピペするだけ:

```json
{
  "mcpServers": {
    "labor-law": {
      "command": "npx",
      "args": ["-y", "labor-law-mcp"]
    }
  }
}
```

**Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json` に追加

**Claude Code**: `claude mcp add labor-law -- npx -y labor-law-mcp`

### Claude.ai（Web）からリモート接続

Claude.ai の設定画面で以下の URL を MCP サーバーとして登録:

```
https://labor-law-mcp.vercel.app/mcp
```

> 末尾の `/mcp` を忘れないこと。`/` のみでは接続できません。

> **ツール使用許可**: Claude.ai で初めてツールが呼ばれると「このツールの実行を許可しますか？」というダイアログが表示されます。**「Allow」をクリック**しないとツールが実行されず、「No approval received」「Denied」エラーになります。「Always allow」を選択すると以降の確認が不要になります。

### ローカル（ソースから）

```bash
git clone https://github.com/kentaroajisaka/labor-law-mcp.git
cd labor-law-mcp
npm install
npm run build
```

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

## 使い方の例

### 条文の取得

> 「労働基準法第32条を取得して」

→ `get_law(law_name="労働基準法", article="32")`

### 略称での取得

> 「安衛法の第59条を見せて」

→ `get_law(law_name="安衛法", article="59")`

### 厚労省通達の検索

> 「36協定に関する通達を検索して」

→ `search_mhlw_tsutatsu(keyword="36協定")`

### 厚労省通達の本文取得

> 「data_id: 00tb2035 の通達を読みたい」

→ `get_mhlw_tsutatsu(data_id="00tb2035")`

### 安衛通達の検索

> 「足場に関する安衛通達を検索して」

→ `search_jaish_tsutatsu(keyword="足場")`

### ハラスメント裁判例の検索

> 「パワハラに関する裁判例を検索して」

→ `search_harassment_cases(keyword="パワハラ")`

### 裁判所判例の検索

> 「解雇権濫用に関する判例を検索して」

→ `search_court_cases(keyword="解雇権濫用", case_type="labor")`

### 労働保険審査会の裁決検索

> 「業務上外の裁決事案を検索して」

→ `search_shinsakai_decisions(category="業務上外")`

### 全基連の主要判例検索

> 「過労死に関する判例を検索して」

→ `search_zenkiren_cases(keyword="過労死")`

### 心理的負荷評価（プロンプト）

> psychological_load_assessment プロンプトを使って「上司から毎日大声で叱責された」を評価

### 労災申請書の下書き（プロンプト）

> rousai_statement_draft プロンプトを使って出来事の記述を作成

### ハルシネーション防止ワークフロー

1. Claude が労務の質問に仮回答を作成
2. 引用した条文・通達を `get_law` / `search_mhlw_tsutatsu` / `search_jaish_tsutatsu` で取得
3. 関連する判例を `search_harassment_cases` / `search_court_cases` / `search_zenkiren_cases` で検索
4. 実際の原文と仮回答を照合し、誤りがあれば修正
5. 2-4 を収束するまで繰り返す（最大4ラウンド）

## 出典

- 法令: [e-Gov法令検索](https://laws.e-gov.go.jp/)（デジタル庁）
- 厚労省通達: [厚生労働省 法令等データベース](https://www.mhlw.go.jp/hourei/)
- 安衛通達: [安全衛生情報センター](https://www.jaish.gr.jp/)（中央労働災害防止協会）
- ハラスメント裁判例: [あかるい職場応援団](https://www.no-harassment.mhlw.go.jp/)（厚生労働省）
- 判例: [裁判所 裁判例情報](https://www.courts.go.jp/app/hanrei_jp/search2)
- 裁決事案: [労働保険審査会 裁決要旨](https://www.mhlw.go.jp/topics/bukyoku/shinsa/roudou/saiketu-youshi/)（厚生労働省）
- 労働判例: [全基連 判例データベース](https://www.zenkiren.com/Portals/0/html/jinji/hannrei/)（全国労働基準関係団体連合会）

厚労省通達の利用は[厚生労働省ホームページの利用規約](https://www.mhlw.go.jp/chosakuken/index.html)に基づきます。

## 参考

- [tax-law-mcp](https://github.com/kentaroajisaka/tax-law-mcp) — 税法版MCPサーバー（アーキテクチャのベース）
- [e-Gov法令API v2](https://laws.e-gov.go.jp/api/2/swagger-ui) — API仕様

## ライセンス

MIT
