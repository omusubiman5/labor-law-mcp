/**
 * Vercel Serverless Function — Node.js Streamable HTTP transport
 *
 * 各リクエストごとにサーバー + トランスポートを新規作成（ステートレス）
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from '../src/server.js';
import { applyCorsHeaders, authenticateRequest } from './_lib/oauth.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  applyCorsHeaders(res);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (!(await authenticateRequest(req, res))) {
    return;
  }

  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
    });

    const server = createServer();
    await server.connect(transport);

    // Vercel pre-parses the request body, so the raw stream is empty.
    // Pass the pre-parsed body as the third argument.
    await transport.handleRequest(req, res, (req as any).body);
  } catch (error) {
    console.error('MCP handler error:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32603, message: 'Internal server error' },
      id: null,
    }));
  }
}
