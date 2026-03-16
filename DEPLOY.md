## Claude.ai Web への接続（Vercel デプロイ）

Claude.ai Web（ブラウザ版）に接続するには、Streamable HTTP transport 対応の Vercel デプロイが必要です。

### 1. Vercel にデプロイ

```bash
# Vercel CLI がない場合
npm install -g vercel

# デプロイ
cd labor-law-mcp
vercel --prod
```

デプロイ後、以下のような URL が発行されます：
```
https://labor-law-mcp-xxxx.vercel.app
```

### 2. Claude.ai の設定

1. Claude.ai を開く
2. 左下の「…」→「設定」→「インテグレーション」
3. 「MCPサーバーを追加」をクリック
4. URL に `https://labor-law-mcp-xxxx.vercel.app/mcp` を入力
5. 保存

### 3. 接続確認

Claude.ai のチャットで以下を試す：
```
労働基準法第32条を取得して
```

`get_law` ツールが呼ばれれば接続成功です。
