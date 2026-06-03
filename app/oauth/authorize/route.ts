import { NextRequest } from "next/server";
import { getOAuthConfig, signInternalJwt } from "../../../lib/oauth";

export async function GET(req: NextRequest) {
  const { serverUrl, auth0Domain, auth0ClientId } = getOAuthConfig();
  const url = req.nextUrl;

  const clientId = url.searchParams.get("client_id") ?? "";
  const redirectUri = url.searchParams.get("redirect_uri") ?? "";
  const codeChallenge = url.searchParams.get("code_challenge") ?? "";
  const codeChallengeMethod = url.searchParams.get("code_challenge_method") ?? "S256";
  const state = url.searchParams.get("state") ?? "";
  const scope = url.searchParams.get("scope") ?? "";

  // Pack original params into a signed JWT to pass through Auth0's state param
  const statePayload = await signInternalJwt({
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod,
    original_state: state,
    scope,
  }, "10m");

  // Redirect to Auth0
  const auth0Url = new URL(`https://${auth0Domain}/authorize`);
  auth0Url.searchParams.set("response_type", "code");
  auth0Url.searchParams.set("client_id", auth0ClientId);
  auth0Url.searchParams.set("redirect_uri", `${serverUrl}/oauth/callback`);
  auth0Url.searchParams.set("state", statePayload);
  auth0Url.searchParams.set("scope", "openid profile email");

  return Response.redirect(auth0Url.toString(), 302);
}
