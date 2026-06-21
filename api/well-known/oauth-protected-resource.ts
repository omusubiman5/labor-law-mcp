import type { IncomingMessage, ServerResponse } from 'node:http';
import { applyCorsHeaders, getOAuthConfig, sendJson, sendNoContent } from '../_lib/oauth.js';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  applyCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    sendNoContent(res);
    return;
  }

  const { serverUrl } = getOAuthConfig();
  sendJson(res, 200, {
    resource: `${serverUrl}/mcp`,
    authorization_servers: [serverUrl],
    bearer_methods_supported: ['header'],
    resource_documentation: `${serverUrl}/`,
  });
}
