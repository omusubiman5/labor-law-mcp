import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getZenkirenCase } from '../lib/services/zenkiren-service.js';

export function registerGetZenkirenCaseTool(server: McpServer) {
  server.tool(
    'get_zenkiren_case',
    '全基連の判例詳細ページ（事件概要・判決要旨）を取得する。search_zenkiren_cases で取得した url を指定する。',
    {
      url: z.string().describe(
        '判例詳細ページのURL。search_zenkiren_cases の結果から取得。例: "https://www.zenkiren.com/Portals/0/html/jinji/hannrei/shoshi/08736.html"'
      ),
    },
    async (args) => {
      try {
        const result = await getZenkirenCase({ url: args.url });

        return {
          content: [{
            type: 'text' as const,
            text: `# ${result.caseName}\n\nurl: ${result.url}\n\n${result.body}\n\n---\n出典：全国労働基準関係団体連合会`,
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
