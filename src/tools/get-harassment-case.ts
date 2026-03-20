import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getHarassmentCase } from '../lib/services/harassment-service.js';

export function registerGetHarassmentCaseTool(server: McpServer) {
  server.tool(
    'get_harassment_case',
    'あかるい職場応援団のハラスメント裁判例の詳細（概要・判決ポイント・コメント）を取得する。search_harassment_cases で取得した path を指定する。',
    {
      path: z.string().describe(
        '裁判例ページのパス。search_harassment_cases の結果から取得。例: "/foundation/judicail-precedent/xxx"'
      ),
    },
    async (args) => {
      try {
        const result = await getHarassmentCase({ path: args.path });

        return {
          content: [{
            type: 'text' as const,
            text: `# ${result.title}\n\nurl: ${result.url}\n\n${result.body}\n\n---\n出典：あかるい職場応援団（厚生労働省）`,
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
