/**
 * MCP プロンプト定義
 * 社労士実務に沿ったワークフローテンプレートを提供する
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerPrompts(server: McpServer) {
  registerLaborLawResearchPrompt(server);
  registerTsutatsuResearchPrompt(server);
  registerSafetyHealthResearchPrompt(server);
  registerPsychologicalLoadAssessmentPrompt(server);
  registerRousaiStatementDraftPrompt(server);
}

/**
 * 労務法令調査プロンプト
 *
 * 指定テーマについて法令→条文→通達の流れで調査するワークフロー。
 * 社労士の法令調査実務を想定。
 */
function registerLaborLawResearchPrompt(server: McpServer) {
  server.prompt(
    'labor_law_research',
    '労務テーマについて法令・通達を体系的に調査する。法令の根拠条文と行政通達を併せて確認するワークフロー。',
    {
      topic: z.string().describe(
        '調査テーマ。例: "時間外労働の上限規制", "育児休業の取得要件", "社会保険の適用拡大", "有期雇用の無期転換"'
      ),
    },
    async (args) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `以下のテーマについて、労働・社会保険法令の調査を行ってください。

## 調査テーマ
${args.topic}

## 調査手順

1. **関連法令の特定**
   - search_law でテーマに関連する法令を検索
   - 該当する法令名と law_id を確認

2. **根拠条文の取得**
   - get_law で該当法令の関連条文を取得
   - 略称も活用可能（労基法、安衛法、雇保法、健保法、厚年法、育介法、均等法、派遣法 等）
   - 必要に応じて施行令・施行規則の条文も確認

3. **関連通達の検索**（並行して実行）
   - search_mhlw_tsutatsu でテーマに関連する厚労省通達を検索
   - 安全衛生関連の場合は search_jaish_tsutatsu も併用
   - WebSearchで関連する通達・判例の番号や名称も検索

4. **通達本文の確認**
   - get_mhlw_tsutatsu または get_jaish_tsutatsu で重要な通達の本文を取得
   - 本サーバーのツールで見つからない場合は、WebSearchで通達名・番号を特定して再検索

5. **調査結果のまとめ**
   - 根拠法令・条文の一覧
   - 関連通達の要旨
   - 実務上の留意点

## 注意
- 条文は正確に引用すること
- 通達の発出日・番号を明記すること
- 法改正による条文変更がある場合は最新の条文を確認すること`,
          },
        },
      ],
    })
  );
}

/**
 * 通達調査プロンプト
 *
 * 特定テーマの行政通達を重点的に調査するワークフロー。
 * 厚労省法令等DBとJAISH安全衛生情報センターの両方を活用。
 */
function registerTsutatsuResearchPrompt(server: McpServer) {
  server.prompt(
    'tsutatsu_research',
    '行政通達を重点的に調査する。厚労省法令等DBとJAISH安全衛生情報センターから通達を検索・取得する。',
    {
      keyword: z.string().describe(
        '検索キーワード。例: "36協定", "労災認定基準", "パワーハラスメント", "特定化学物質"'
      ),
      scope: z.enum(['all', 'mhlw', 'jaish']).optional().describe(
        '検索範囲。all=両方（デフォルト）, mhlw=厚労省通達のみ, jaish=安衛通達のみ'
      ),
    },
    async (args) => {
      const scope = args.scope ?? 'all';
      const steps: string[] = [];

      if (scope === 'all' || scope === 'mhlw') {
        steps.push(`- search_mhlw_tsutatsu で「${args.keyword}」を検索`);
        steps.push('- 重要な通達は get_mhlw_tsutatsu で本文を取得');
      }
      if (scope === 'all' || scope === 'jaish') {
        steps.push(`- search_jaish_tsutatsu で「${args.keyword}」を検索（安全衛生関連）`);
        steps.push('- 重要な通達は get_jaish_tsutatsu で本文を取得');
      }
      steps.push(`- WebSearchで「${args.keyword}」に関連する通達名・番号も並行検索`);
      steps.push('- 本サーバーのツールで見つからない場合は、WebSearchで特定した情報で再検索');

      return {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: `「${args.keyword}」に関する行政通達を調査してください。

## 調査手順
${steps.join('\n')}

## 出力形式
各通達について以下を整理してください：
- **通達名**（正式名称）
- **発出日・番号**（例: 令和5年3月14日 基発0314第2号）
- **要旨**（通達の主要ポイントを3〜5行で要約）
- **実務への影響**（事業主・社労士として注意すべき点）

## 注意
- 最新の通達を優先すること
- 改正通達がある場合は最新版を確認すること
- 通達の正式な番号と日付を必ず明記すること`,
            },
          },
        ],
      };
    }
  );
}

/**
 * 安全衛生調査プロンプト
 *
 * 労働安全衛生に特化した調査ワークフロー。
 * 安衛法の条文とJAISH通達を中心に調査。
 */
/**
 * 心理的負荷評価プロンプト
 *
 * 精神障害の労災認定基準に基づく心理的負荷評価を支援する。
 * 厚労省「業務による心理的負荷評価表」（令和5年9月改正版）に準拠。
 */
function registerPsychologicalLoadAssessmentPrompt(server: McpServer) {
  server.prompt(
    'psychological_load_assessment',
    '精神障害の労災認定基準に基づき、業務上の出来事の心理的負荷を評価する。厚労省「業務による心理的負荷評価表」（令和5年9月改正版）に準拠。',
    {
      situation: z.string().describe(
        '評価対象の出来事・状況の詳細な説明。例: "上司から毎日のように大声で叱責され、他の社員の面前で人格を否定する発言を受けた"'
      ),
    },
    async (args) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `以下の出来事について、精神障害の労災認定基準に基づく心理的負荷の評価を行ってください。

## 評価対象の出来事
${args.situation}

## 評価手順

### 1. 関連法令・通達の取得
以下を並行して実行すること:
- get_law で「労働者災害補償保険法」の関連条文（第7条等）を取得
- search_mhlw_tsutatsu で「心理的負荷」「精神障害 労災認定」等を検索
- search_harassment_cases で関連するハラスメント裁判例を検索（該当する場合）
- search_zenkiren_cases で類似の判例を検索

### 2. 心理的負荷評価表に基づく分析

以下の厚労省「業務による心理的負荷評価表」（令和5年9月改正版）を参照して評価すること:

【出来事の類型】
①事故や災害の体験 ②仕事の失敗、過重な責任の発生等 ③仕事の量・質
④役割・地位の変化等 ⑤パワーハラスメント ⑥対人関係
⑦セクシュアルハラスメント

【⑤パワーハラスメントの場合の「強」判断例】
✓ 治療を要する程度の暴行を受けた場合
✓ 暴行を執拗に受けた場合
✓ 人格・人間性を否定するような精神的攻撃が執拗に行われた場合
✓ 必要以上に長時間にわたる叱責、他の労働者の面前における大声での威圧的な叱責など、社会通念に照らして許容される範囲を超える精神的攻撃
✓ 中程度の攻撃を受けた場合で、会社に相談しても改善されなかった場合

### 3. 3要件の確認
■ 精神障害の労災認定3要件（すべて必要）:
要件1: 発症前おおむね6か月以内に強い心理的負荷があること
要件2: 対象疾病（うつ病・適応障害等）と診断されていること
要件3: 業務以外の要因で発病したとは認められないこと

### 4. 評価結果の出力
以下の形式で出力すること:
- **出来事の類型**: （上記①〜⑦のいずれか）
- **心理的負荷の強度**: 弱 / 中 / 強（根拠を明記）
- **該当する具体例**: （評価表の具体例との対応）
- **3要件の充足見込み**: （各要件について分析）
- **総合評価**: （労災認定の見込みについての所見）
- **補強すべき証拠**: （認定に向けて収集すべき証拠の助言）

## 注意
- この評価はAIによる参考情報です。正式な判断は主治医・社労士・弁護士に確認してください
- 心理的負荷評価表の参照: https://www.mhlw.go.jp/content/000637497.pdf`,
          },
        },
      ],
    })
  );
}

/**
 * 労災申請書（様式第23号）業務上の出来事記述支援プロンプト
 *
 * 労災申請書の「業務上の出来事」記述の下書きを生成する。
 */
function registerRousaiStatementDraftPrompt(server: McpServer) {
  server.prompt(
    'rousai_statement_draft',
    '労災申請書（様式第23号）の「業務上の出来事」記述の下書きを生成する。精神障害の労災申請に必要な出来事の記述を支援する。',
    {
      incident_date: z.string().describe('出来事の発生日時。例: "令和6年3月15日 午前10時頃"'),
      location: z.string().describe('発生場所。例: "本社3階 営業部オフィス"'),
      perpetrator: z.string().describe('行為者（役職・関係性）。例: "直属の上司（課長）"'),
      behavior: z.string().describe('行為の詳細な内容。例: "会議室で1時間以上にわたり、他の社員5名の前で大声で叱責し、「お前は無能だ」「辞めてしまえ」等の発言を繰り返した"'),
      witnesses: z.string().describe('目撃者情報。例: "同じ部署の社員A、B、Cが同席"'),
      diagnosis: z.string().describe('診断名。例: "適応障害（うつ状態）"'),
      company_response: z.string().optional().describe('会社の対応（任意）。例: "人事部に相談したが対応なし"'),
    },
    async (args) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `以下の情報に基づき、労災申請書（様式第23号）の「業務上の出来事」記述の下書きを作成してください。

## 入力情報
- 発生日時: ${args.incident_date}
- 発生場所: ${args.location}
- 行為者: ${args.perpetrator}
- 行為内容: ${args.behavior}
- 目撃者: ${args.witnesses}
- 診断名: ${args.diagnosis}
- 会社の対応: ${args.company_response ?? '（未記入）'}

## 作成手順

### 1. 関連法令・評価基準の確認
以下を並行して実行すること:
- get_law で「労働者災害補償保険法」第7条を取得
- search_mhlw_tsutatsu で「心理的負荷評価表」「精神障害 労災認定基準」を検索
- search_harassment_cases で類似事案の裁判例を検索

### 2. 記述の下書き生成
以下の形式で「業務上の出来事」の記述案を作成すること:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【様式第23号 業務上の出来事の記述（案）】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

■ 発生日時・場所
（入力情報を元に記述）

■ 業務上の出来事
（入力情報を元に、事実を客観的に記述。
  心理的負荷評価表の「強」に該当する要素を明確に含めること）

■ 目撃者
（目撃者情報を記述）

■ 心理的負荷の評価根拠
（評価表のどの類型・具体例に該当するか、取得した通達を根拠に記述）

■ 発症との因果関係
（出来事と診断の時系列的関連を記述）

■ 会社の対応
（会社の対応状況を記述。対応がない場合もその旨記載）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【注意】この文章はAI支援案です。主治医・社労士・弁護士に確認の上ご使用ください。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 3. 類似判例の参照
search_harassment_cases や search_zenkiren_cases で類似事案を検索し、
認定に有利な要素や注意点を補足すること。

## 注意
- 事実を正確に、客観的に記述すること
- 感情的な表現は避け、具体的な事実（日時・場所・言動・回数・時間等）を明確に記載すること
- 心理的負荷評価表の「強」に該当する要素を意識的に含めること
- この下書きは必ず社労士・弁護士に確認の上、必要な修正を行ってから提出すること`,
          },
        },
      ],
    })
  );
}

function registerSafetyHealthResearchPrompt(server: McpServer) {
  server.prompt(
    'safety_health_research',
    '労働安全衛生に関する法令・通達を調査する。安衛法の条文、安衛則、関連通達を体系的に確認するワークフロー。',
    {
      topic: z.string().describe(
        '調査テーマ。例: "健康診断の実施義務", "化学物質管理", "足場の安全基準", "ストレスチェック制度"'
      ),
    },
    async (args) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `労働安全衛生に関する以下のテーマを調査してください。

## 調査テーマ
${args.topic}

## 調査手順

1. **安衛法の根拠条文**
   - get_law で「安衛法」（労働安全衛生法）の関連条文を取得
   - 必要に応じて「安衛令」（施行令）、「安衛則」（安全衛生規則）も確認

2. **JAISH安衛通達の検索**（並行して実行）
   - search_jaish_tsutatsu でテーマに関連する安衛通達を検索
   - max_pages を増やして古い通達も網羅的に検索
   - WebSearchで関連する通達名・番号も並行検索

3. **厚労省通達の検索**
   - search_mhlw_tsutatsu で関連する厚労省通達も検索（安衛関連の基発通達等）

4. **重要通達の本文確認**
   - get_jaish_tsutatsu / get_mhlw_tsutatsu で重要な通達の詳細を取得
   - 本サーバーのツールで見つからない場合は、WebSearchで特定した情報で再検索

5. **調査結果のまとめ**
   - 法的根拠（安衛法・安衛則の条文）
   - 関連通達の一覧と要旨
   - 事業者の義務・罰則
   - 実務上の対応ポイント

## 注意
- 安全衛生関連は法令と通達の両方が重要
- じん肺法、作業環境測定法など関連法令にも注意
- 最新の法改正・通達改正を反映すること`,
          },
        },
      ],
    })
  );
}
