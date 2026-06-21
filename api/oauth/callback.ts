import type { IncomingMessage, ServerResponse } from 'node:http';
import { getAllowedEmails, getOAuthConfig, redirect, signInternalJwt, verifyInternalJwt } from '../_lib/oauth.js';

export const config = {
  maxDuration: 30,
};

interface Auth0TokenResponse {
  access_token?: string;
}

interface Auth0UserInfo {
  email?: string;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const { serverUrl, auth0Domain, auth0ClientId, auth0ClientSecret } = getOAuthConfig();
  const requestUrl = new URL(req.url ?? '/', serverUrl);

  const auth0Code = requestUrl.searchParams.get('code') ?? '';
  const stateJwt = requestUrl.searchParams.get('state') ?? '';
  const error = requestUrl.searchParams.get('error');
  const statePayload = await verifyInternalJwt(stateJwt);

  if (error) {
    redirectWithError(
      res,
      String(statePayload.redirect_uri ?? ''),
      error,
      requestUrl.searchParams.get('error_description') ?? '',
      String(statePayload.original_state ?? ''),
    );
    return;
  }

  const tokenRes = await fetch(`https://${auth0Domain}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: auth0ClientId,
      client_secret: auth0ClientSecret,
      code: auth0Code,
      redirect_uri: `${serverUrl}/oauth/callback`,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Auth0 token exchange failed: ${body}`);
    return;
  }

  const auth0Tokens = (await tokenRes.json()) as Auth0TokenResponse;
  const allowedEmails = getAllowedEmails();
  if (allowedEmails.length > 0) {
    const userinfoRes = await fetch(`https://${auth0Domain}/userinfo`, {
      headers: { Authorization: `Bearer ${auth0Tokens.access_token ?? ''}` },
    });

    if (!userinfoRes.ok) {
      redirectWithError(
        res,
        String(statePayload.redirect_uri ?? ''),
        'access_denied',
        'Failed to verify user identity',
        String(statePayload.original_state ?? ''),
      );
      return;
    }

    const userinfo = (await userinfoRes.json()) as Auth0UserInfo;
    const email = (userinfo.email ?? '').toLowerCase();
    if (!allowedEmails.includes(email)) {
      redirectWithError(
        res,
        String(statePayload.redirect_uri ?? ''),
        'access_denied',
        'User not authorized',
        String(statePayload.original_state ?? ''),
      );
      return;
    }
  }

  const code = await signInternalJwt(
    {
      auth0_access_token: auth0Tokens.access_token,
      code_challenge: statePayload.code_challenge,
      code_challenge_method: statePayload.code_challenge_method,
      client_id: statePayload.client_id,
      redirect_uri: statePayload.redirect_uri,
    },
    '5m',
  );

  const redirectUrl = new URL(String(statePayload.redirect_uri ?? ''));
  redirectUrl.searchParams.set('code', code);
  redirectUrl.searchParams.set('state', String(statePayload.original_state ?? ''));
  redirect(res, redirectUrl.toString());
}

function redirectWithError(
  res: ServerResponse,
  redirectUri: string,
  error: string,
  errorDescription: string,
  state: string,
): void {
  const redirectUrl = new URL(redirectUri);
  redirectUrl.searchParams.set('error', error);
  redirectUrl.searchParams.set('error_description', errorDescription);
  redirectUrl.searchParams.set('state', state);
  redirect(res, redirectUrl.toString());
}
