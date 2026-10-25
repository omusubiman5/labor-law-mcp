/**
 * Self-hosted HTTP server (node:http) — dispatches to the Vercel-function
 * handlers under api/ without modification.
 *
 * Routes mirror the public surface of the other *-mcp servers:
 *   /mcp, /api/mcp                    -> MCP endpoint (Bearer auth required)
 *   /oauth/*                          -> OAuth 2.1 endpoints (PKCE)
 *   /.well-known/oauth-*              -> OAuth discovery metadata
 *   everything else                   -> 404
 */

import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from 'node:http';
import mcpHandler from './mcp.js';
import authorizeHandler from './oauth/authorize.js';
import callbackHandler from './oauth/callback.js';
import registerHandler from './oauth/register.js';
import tokenHandler from './oauth/token.js';
import authorizationServerHandler from './well-known/oauth-authorization-server.js';
import protectedResourceHandler from './well-known/oauth-protected-resource.js';

type Handler = (req: IncomingMessage, res: ServerResponse) => unknown;

const routes: Record<string, Handler> = {
  '/mcp': mcpHandler,
  '/api/mcp': mcpHandler,
  '/oauth/authorize': authorizeHandler,
  '/oauth/callback': callbackHandler,
  '/oauth/register': registerHandler,
  '/oauth/token': tokenHandler,
};

const server = createHttpServer((req, res) => {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;

  const handler =
    routes[path] ??
    (path.startsWith('/.well-known/oauth-authorization-server')
      ? authorizationServerHandler
      : path.startsWith('/.well-known/oauth-protected-resource')
        ? protectedResourceHandler
        : undefined);

  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found' }));
    return;
  }

  Promise.resolve(handler(req, res)).catch((error) => {
    console.error('Unhandled handler error:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify({ error: 'internal_server_error' }));
  });
});

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';
server.listen(port, host, () => {
  console.log(`labor-law-mcp HTTP server listening on ${host}:${port}`);
});
