import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  searchShinsakaiDecisions,
  getShinsakaiCategories,
} from '../lib/services/shinsakai-service.js';

export function registerSearchShinsakaiDecisionsTool(server: McpServer) {
  server.tool(
    'search_shinsakai_decisions',
    '労働保険審査会の裁決事案（要旨）を検索する。業務上外認定、障害等級、給付基礎日額等のカテゴリ別・年度別に裁決一覧とPDF URLを取得する。',
    {
      category: z.string().optional().describe(
        `カテゴリ名。省略時は「業務上外」。利用可能: ${getShinsakaiCategories().join(', ')}`
      ),
      fiscal_year: z.string().optional().describe(
        '年度で絞り込み。例: "令和5年度", "平成30年度"'
      ),
    },
    async (args) => {
      try {
        const result = await searchShinsakaiDecisions({
          category: args.category,
          fiscalYear: args.fiscal_year,
        });

        if (result.results.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `「${result.category}」カテゴリ${args.fiscal_year ? `（${args.fiscal_year}）` : ''}の裁決事案が見つかりませんでした。\n\n裁決要旨一覧: ${result.indexUrl}\n\n利用可能なカテゴリ: ${getShinsakaiCategories().join(', ')}`,
            }],
          };
        }

        const lines = result.results.map((r, i) =>
          `${i + 1}. **${r.title}**\n   カテゴリ: ${r.category}\n   ${r.fiscalYear ? `年度: ${r.fiscalYear}\n   ` : ''}URL: ${r.pdfUrl}`
        );

        return {
          content: [{
            type: 'text' as const,
            text: `# 労働保険審査会 裁決事案: 「${result.category}」\n\n${result.results.length}件\n\n${lines.join('\n\n')}\n\n---\n裁決要旨一覧: ${result.indexUrl}\n※ PDF本文を読むにはWebFetchでURLを取得してください。\n出典：厚生労働省 労働保険審査会`,
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
