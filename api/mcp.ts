import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createServer } from '../src/server.js';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id, Last-Event-ID, mcp-protocol-version',
  'Access-Control-Expose-Headers': 'mcp-session-id, mcp-protocol-version',
};

export default async function handler(req: Request): Promise<Response> {
  // OPTIONS プリフライト
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // リクエストごとに新しいサーバーとトランスポートを生成（ステートレス）
    const transport = new WebStandardStreamableHTTPServerTransport();
    const server = createServer();
    await server.connect(transport);

    const response = await transport.handleRequest(req);

    // CORSヘッダーを追加
    const newHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      newHeaders.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    console.error('MCP handler error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
}

export const config = {
  runtime: 'edge',
};
