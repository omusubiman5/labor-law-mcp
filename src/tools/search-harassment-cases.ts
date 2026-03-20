import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { searchHarassmentCases } from '../lib/services/harassment-service.js';

export function registerSearchHarassmentCasesTool(server: McpServer) {
  server.tool(
    'search_harassment_cases',
    'あかるい職場応援団（厚労省）のハラスメント裁判例データベースを検索する。パワハラ・セクハラ・マタハラ等の裁判例を検索可能。',
    {
      keyword: z.string().optional().describe(
        '検索キーワード（タイトルに含まれる語で絞り込み）。例: "パワハラ", "解雇", "精神的攻撃", "セクハラ"。省略時は全件一覧を返す。'
      ),
      page: z.number().optional().describe(
        'ページ番号（1始まり、1ページ15件）'
      ),
    },
    async (args) => {
      try {
        const result = await searchHarassmentCases({
          keyword: args.keyword,
          page: args.page,
        });

        if (result.results.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `${args.keyword ? `「${args.keyword}」に一致する` : ''}ハラスメント裁判例が見つかりませんでした。キーワードを変えて再検索してください。`,
            }],
          };
        }

        const lines = result.results.map((r, i) => {
          const num = ((args.page ?? 1) - 1) * 15 + i + 1;
          return `${num}. **${r.title}**\n   path: \`${r.path}\`\n   url: ${r.url}`;
        });

        return {
          content: [{
            type: 'text' as const,
            text: `# ハラスメント裁判例検索結果${args.keyword ? `: 「${args.keyword}」` : ''}\n\n${result.total}件中 ${result.results.length}件表示（ページ${args.page ?? 1}）\n\n${lines.join('\n\n')}\n\n---\n※ 詳細を読むには get_harassment_case で path を指定してください。\n出典：あかるい職場応援団（厚生労働省）`,
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
