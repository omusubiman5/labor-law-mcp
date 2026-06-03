import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { NextRequest } from "next/server";
import { authenticateRequest, corsHeaders } from "../../../lib/oauth";
import { createServer } from "../../../src/server.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ── CORS preflight ──────────────────────────────────────────────────────────
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const authError = await authenticateRequest(req);
  if (authError) return authError;

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });
  const server = createServer();
  await server.connect(transport);
  const response = await transport.handleRequest(req);

  // Attach CORS headers to the MCP response
  for (const [k, v] of Object.entries(corsHeaders)) {
    response.headers.set(k, v);
  }
  return response;
}

export async function GET(req: NextRequest) {
  const authError = await authenticateRequest(req);
  if (authError) return authError;

  return Response.json(
    { name: "labor-law-mcp", version: "0.3.0" },
    { headers: corsHeaders }
  );
}

export async function DELETE(req: NextRequest) {
  const authError = await authenticateRequest(req);
  if (authError) return authError;

  return Response.json(
    { jsonrpc: "2.0", result: {}, id: null },
    { headers: corsHeaders }
  );
}
