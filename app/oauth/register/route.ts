import { NextRequest } from "next/server";
import { signInternalJwt, corsHeaders } from "../../../lib/oauth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const clientId = crypto.randomUUID();

  // Encode registration as a signed JWT so we can verify it later without storage
  const registrationToken = await signInternalJwt(
    {
      client_id: clientId,
      redirect_uris: body.redirect_uris ?? [],
      client_name: body.client_name ?? "unknown",
      grant_types: body.grant_types ?? ["authorization_code"],
      response_types: body.response_types ?? ["code"],
      token_endpoint_auth_method: body.token_endpoint_auth_method ?? "none",
    },
    "365d"
  );

  return Response.json(
    {
      client_id: clientId,
      client_secret: registrationToken,
      client_name: body.client_name,
      redirect_uris: body.redirect_uris,
      grant_types: body.grant_types ?? ["authorization_code"],
      response_types: body.response_types ?? ["code"],
      token_endpoint_auth_method: body.token_endpoint_auth_method ?? "none",
    },
    { status: 201, headers: corsHeaders }
  );
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
