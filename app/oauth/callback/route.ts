import { NextRequest } from "next/server";
import { getOAuthConfig, verifyInternalJwt, signInternalJwt } from "../../../lib/oauth";

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

export async function GET(req: NextRequest) {
  const { serverUrl, auth0Domain, auth0ClientId, auth0ClientSecret } = getOAuthConfig();
  const url = req.nextUrl;

  const auth0Code = url.searchParams.get("code") ?? "";
  const stateJwt = url.searchParams.get("state") ?? "";
  const error = url.searchParams.get("error");

  // Decode original params
  const statePayload = await verifyInternalJwt(stateJwt);

  // If Auth0 returned an error, redirect back to client with the error
  if (error) {
    const redirectUri = statePayload.redirect_uri as string;
    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.set("error", error);
    redirectUrl.searchParams.set("error_description", url.searchParams.get("error_description") ?? "");
    redirectUrl.searchParams.set("state", statePayload.original_state as string);
    return Response.redirect(redirectUrl.toString(), 302);
  }

  // Exchange Auth0 code for Auth0 tokens
  const tokenRes = await fetch(`https://${auth0Domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: auth0ClientId,
      client_secret: auth0ClientSecret,
      code: auth0Code,
      redirect_uri: `${serverUrl}/oauth/callback`,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    return new Response(`Auth0 token exchange failed: ${err}`, { status: 502 });
  }

  const auth0Tokens = await tokenRes.json();

  // Verify user email against allowlist
  if (ALLOWED_EMAILS.length > 0) {
    const userinfoRes = await fetch(`https://${auth0Domain}/userinfo`, {
      headers: { Authorization: `Bearer ${auth0Tokens.access_token}` },
    });
    if (!userinfoRes.ok) {
      const redirectUri = statePayload.redirect_uri as string;
      const redirectUrl = new URL(redirectUri);
      redirectUrl.searchParams.set("error", "access_denied");
      redirectUrl.searchParams.set("error_description", "Failed to verify user identity");
      redirectUrl.searchParams.set("state", statePayload.original_state as string);
      return Response.redirect(redirectUrl.toString(), 302);
    }
    const userinfo = await userinfoRes.json();
    const email = (userinfo.email ?? "").toLowerCase();
    if (!ALLOWED_EMAILS.includes(email)) {
      const redirectUri = statePayload.redirect_uri as string;
      const redirectUrl = new URL(redirectUri);
      redirectUrl.searchParams.set("error", "access_denied");
      redirectUrl.searchParams.set("error_description", "User not authorized");
      redirectUrl.searchParams.set("state", statePayload.original_state as string);
      return Response.redirect(redirectUrl.toString(), 302);
    }
  }

  // Generate our own auth code containing the Auth0 access token
  const ourCode = await signInternalJwt({
    auth0_access_token: auth0Tokens.access_token,
    code_challenge: statePayload.code_challenge,
    code_challenge_method: statePayload.code_challenge_method,
    client_id: statePayload.client_id,
    redirect_uri: statePayload.redirect_uri,
  }, "5m");

  // Redirect back to claude.ai
  const redirectUri = statePayload.redirect_uri as string;
  const redirectUrl = new URL(redirectUri);
  redirectUrl.searchParams.set("code", ourCode);
  redirectUrl.searchParams.set("state", statePayload.original_state as string);

  return Response.redirect(redirectUrl.toString(), 302);
}
