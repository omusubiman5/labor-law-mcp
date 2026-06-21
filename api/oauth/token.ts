import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  applyCorsHeaders,
  readRequestBody,
  sendJson,
  sendNoContent,
  signInternalJwt,
  verifyInternalJwt,
  verifyPKCE,
} from '../_lib/oauth.js';

interface TokenRequest {
  code?: string;
  code_verifier?: string;
  grant_type?: string;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  applyCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    sendNoContent(res);
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method_not_allowed' });
    return;
  }

  const body = (await readRequestBody(req)) as TokenRequest;
  if (body.grant_type !== 'authorization_code') {
    sendJson(res, 400, { error: 'unsupported_grant_type' });
    return;
  }

  try {
    const payload = await verifyInternalJwt(body.code ?? '');
    const codeChallenge = String(payload.code_challenge ?? '');
    const codeChallengeMethod = String(payload.code_challenge_method ?? 'S256');
    const codeVerifier = body.code_verifier ?? '';

    if (!(await verifyPKCE(codeVerifier, codeChallenge, codeChallengeMethod))) {
      sendJson(res, 400, { error: 'invalid_grant', error_description: 'PKCE verification failed' });
      return;
    }

    const accessToken = await signInternalJwt(
      {
        type: 'access_token',
        sub: payload.client_id,
      },
      '90d',
    );

    sendJson(res, 200, {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 7_776_000,
    });
  } catch {
    sendJson(res, 400, { error: 'invalid_grant', error_description: 'Invalid or expired code' });
  }
}
