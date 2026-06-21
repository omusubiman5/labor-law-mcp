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
    issuer: serverUrl,
    authorization_endpoint: `${serverUrl}/oauth/authorize`,
    token_endpoint: `${serverUrl}/oauth/token`,
    registration_endpoint: `${serverUrl}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    token_endpoint_auth_methods_supported: ['none'],
    code_challenge_methods_supported: ['S256', 'plain'],
  });
}
