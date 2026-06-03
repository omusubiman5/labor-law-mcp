import { NextRequest } from "next/server";
import { verifyInternalJwt, verifyPKCE, signInternalJwt, corsHeaders } from "../../../lib/oauth";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  let grantType: string, code: string, codeVerifier: string;

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await req.formData();
    grantType = formData.get("grant_type") as string ?? "";
    code = formData.get("code") as string ?? "";
    codeVerifier = formData.get("code_verifier") as string ?? "";
  } else {
    const body = await req.json();
    grantType = body.grant_type ?? "";
    code = body.code ?? "";
    codeVerifier = body.code_verifier ?? "";
  }

  if (grantType !== "authorization_code") {
    return Response.json(
      { error: "unsupported_grant_type" },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    // Decode the auth code
    const payload = await verifyInternalJwt(code);

    // Verify PKCE
    const valid = await verifyPKCE(
      codeVerifier,
      payload.code_challenge as string,
      payload.code_challenge_method as string
    );
    if (!valid) {
      return Response.json(
        { error: "invalid_grant", error_description: "PKCE verification failed" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Issue our own access token JWT
    const accessToken = await signInternalJwt({
      type: "access_token",
      sub: payload.client_id,
    }, "90d");

    return Response.json(
      {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 7776000,
      },
      { headers: corsHeaders }
    );
  } catch {
    return Response.json(
      { error: "invalid_grant", error_description: "Invalid or expired code" },
      { status: 400, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
