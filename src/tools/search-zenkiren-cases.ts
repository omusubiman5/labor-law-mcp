import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { searchZenkirenCases } from '../lib/services/zenkiren-service.js';

export function registerSearchZenkirenCasesTool(server: McpServer) {
  server.tool(
    'search_zenkiren_cases',
    '全基連（全国労働基準関係団体連合会）の主要労働判例を検索する。解雇、パワハラ、残業代、就業規則変更等の代表的判例のcurated subsetを検索。動的検索は不可のため収録判例のみ対象。',
    {
      keyword: z.string().describe(
        '検索キーワード。例: "解雇", "パワハラ", "残業代", "就業規則", "セクハラ", "配転", "過労死", "同一労働同一賃金"'
      ),
    },
    async (args) => {
      try {
        const result = await searchZenkirenCases({ keyword: args.keyword });

        if (result.results.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `「${args.keyword}」に一致する判例がレジストリに見つかりませんでした。\n\n全基連の判例データベースで直接検索できます:\nhttps://www.zenkiren.com/Portals/0/html/jinji/hannrei/\n\n※ 本ツールはcurated subsetのみ対象です。裁判所判例検索（search_court_cases）やWebSearchも併用してください。`,
            }],
          };
        }

        const lines = result.results.map((r, i) =>
          `${i + 1}. **${r.caseName}**\n   裁判所: ${r.courtName}\n   裁判年月日: ${r.date}\n   概要: ${r.summary}\n   url: ${r.url}`
        );

        return {
          content: [{
            type: 'text' as const,
            text: `# 全基連 主要判例検索結果: 「${args.keyword}」\n\n${result.results.length}件\n\n${lines.join('\n\n')}\n\n---\n※ 本ツールは主要判例のcurated subsetのみ対象です。\n※ 詳細ページの本文を読むには get_zenkiren_case で url を指定してください。\n全基連判例DB: https://www.zenkiren.com/Portals/0/html/jinji/hannrei/\n出典：全国労働基準関係団体連合会`,
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
