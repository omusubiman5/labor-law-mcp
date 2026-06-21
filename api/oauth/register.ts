import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  applyCorsHeaders,
  createClientId,
  readRequestBody,
  sendJson,
  sendNoContent,
  signInternalJwt,
} from '../_lib/oauth.js';

interface ClientRegistrationRequest {
  client_name?: string;
  grant_types?: string[];
  redirect_uris?: string[];
  response_types?: string[];
  token_endpoint_auth_method?: string;
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

  const body = (await readRequestBody(req)) as ClientRegistrationRequest;
  const clientId = createClientId();
  const grantTypes = body.grant_types ?? ['authorization_code'];
  const redirectUris = body.redirect_uris ?? [];
  const responseTypes = body.response_types ?? ['code'];
  const tokenEndpointAuthMethod = body.token_endpoint_auth_method ?? 'none';

  const registrationToken = await signInternalJwt(
    {
      client_id: clientId,
      redirect_uris: redirectUris,
      client_name: body.client_name ?? 'unknown',
      grant_types: grantTypes,
      response_types: responseTypes,
      token_endpoint_auth_method: tokenEndpointAuthMethod,
    },
    '365d',
  );

  sendJson(res, 201, {
    client_id: clientId,
    client_secret: registrationToken,
    client_name: body.client_name,
    redirect_uris: redirectUris,
    grant_types: grantTypes,
    response_types: responseTypes,
    token_endpoint_auth_method: tokenEndpointAuthMethod,
  });
}
