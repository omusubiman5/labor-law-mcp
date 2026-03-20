import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { searchCourtCases } from '../lib/services/courts-service.js';

export function registerSearchCourtCasesTool(server: McpServer) {
  server.tool(
    'search_court_cases',
    '裁判所（courts.go.jp）の判例データベースを検索する。労働事件・行政事件等の判例をキーワード検索し、メタデータとPDF URLを返す。PDF本文の解析は行わない。',
    {
      keyword: z.string().describe(
        '検索キーワード。例: "解雇権濫用", "パワハラ 損害賠償", "未払残業代", "労災 因果関係"'
      ),
      case_type: z.enum(['labor', 'administrative', 'civil', 'criminal']).optional().describe(
        '判例種別で絞り込み。labor=労働, administrative=行政, civil=民事, criminal=刑事。省略時は全種別。'
      ),
      page: z.number().optional().describe(
        'ページ番号（1始まり）'
      ),
    },
    async (args) => {
      try {
        const result = await searchCourtCases({
          keyword: args.keyword,
          caseType: args.case_type,
          page: args.page,
        });

        if (result.results.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `「${args.keyword}」に一致する判例が見つかりませんでした。\n\n裁判所判例検索ページで直接検索できます:\n${result.searchUrl}\n\nキーワードを変えて再検索してください。`,
            }],
          };
        }

        const lines = result.results.map((r, i) => {
          const parts = [`${i + 1}. **${r.caseName}**`];
          if (r.courtName) parts.push(`   裁判所: ${r.courtName}`);
          if (r.date) parts.push(`   裁判年月日: ${r.date}`);
          if (r.caseNumber) parts.push(`   事件番号: ${r.caseNumber}`);
          parts.push(`   詳細: ${r.detailUrl}`);
          if (r.pdfUrl) parts.push(`   PDF: ${r.pdfUrl}`);
          return parts.join('\n');
        });

        return {
          content: [{
            type: 'text' as const,
            text: `# 裁判所判例検索結果: 「${args.keyword}」\n\n${result.totalCount > 0 ? `${result.totalCount}件` : `${result.results.length}件表示`}\n\n${lines.join('\n\n')}\n\n---\n検索URL: ${result.searchUrl}\n※ PDF本文を読むにはWebFetchでPDF URLを取得してください。\n出典：裁判所 裁判例情報`,
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `エラー: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    }
  );
}
