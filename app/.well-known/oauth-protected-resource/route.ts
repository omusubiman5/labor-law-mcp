import { corsHeaders } from "../../../lib/oauth";

export async function GET() {
  const serverUrl = process.env.SERVER_URL;
  return Response.json(
    {
      resource: serverUrl,
      authorization_servers: [serverUrl],
      bearer_methods_supported: ["header"],
    },
    { headers: corsHeaders }
  );
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}
