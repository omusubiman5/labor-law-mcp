import type { IncomingMessage, ServerResponse } from 'node:http';
import { getOAuthConfig, redirect, signInternalJwt } from '../_lib/oauth.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const { serverUrl, auth0Domain, auth0ClientId } = getOAuthConfig();
  const requestUrl = new URL(req.url ?? '/', serverUrl);

  const clientId = requestUrl.searchParams.get('client_id') ?? '';
  const redirectUri = requestUrl.searchParams.get('redirect_uri') ?? '';
  const codeChallenge = requestUrl.searchParams.get('code_challenge') ?? '';
  const codeChallengeMethod = requestUrl.searchParams.get('code_challenge_method') ?? 'S256';
  const state = requestUrl.searchParams.get('state') ?? '';
  const scope = requestUrl.searchParams.get('scope') ?? '';

  const statePayload = await signInternalJwt(
    {
      client_id: clientId,
      redirect_uri: redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod,
      original_state: state,
      scope,
    },
    '10m',
  );

  const auth0Url = new URL(`https://${auth0Domain}/authorize`);
  auth0Url.searchParams.set('response_type', 'code');
  auth0Url.searchParams.set('client_id', auth0ClientId);
  auth0Url.searchParams.set('redirect_uri', `${serverUrl}/oauth/callback`);
  auth0Url.searchParams.set('state', statePayload);
  auth0Url.searchParams.set('scope', 'openid profile email');

  redirect(res, auth0Url.toString());
}
