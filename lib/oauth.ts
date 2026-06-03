import { SignJWT, jwtVerify } from "jose";

// ── Config ──────────────────────────────────────────────────────────────────
export function getOAuthConfig() {
  const serverUrl = process.env.SERVER_URL;
  const auth0Domain = process.env.AUTH0_DOMAIN;
  const auth0ClientId = process.env.AUTH0_CLIENT_ID;
  const auth0ClientSecret = process.env.AUTH0_CLIENT_SECRET;
  const auth0Audience = process.env.AUTH0_AUDIENCE ?? "https://mcp-servers";
  const oauthSecret = process.env.OAUTH_SECRET;

  if (!serverUrl || !auth0Domain || !auth0ClientId || !auth0ClientSecret || !oauthSecret) {
    throw new Error("Missing OAuth env vars");
  }

  return { serverUrl, auth0Domain, auth0ClientId, auth0ClientSecret, auth0Audience, oauthSecret };
}

// ── Internal JWT (for auth codes, client registrations) ─────────────────────
const encoder = new TextEncoder();

function getSecret() {
  return encoder.encode(getOAuthConfig().oauthSecret);
}

export async function signInternalJwt(payload: Record<string, unknown>, expiresIn = "10m") {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifyInternalJwt(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload;
}

// ── Access token verification (our own JWT) ─────────────────────────────────
export async function verifyAccessToken(token: string): Promise<Record<string, unknown>> {
  const { payload } = await jwtVerify(token, getSecret());
  if (payload.type !== "access_token") {
    throw new Error("Invalid token type");
  }
  return payload as Record<string, unknown>;
}

// ── PKCE ────────────────────────────────────────────────────────────────────
export async function verifyPKCE(codeVerifier: string, codeChallenge: string, method: string) {
  if (method === "S256") {
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(codeVerifier));
    const computed = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    return computed === codeChallenge;
  }
  return codeVerifier === codeChallenge; // plain
}

// ── CORS headers ────────────────────────────────────────────────────────────
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Mcp-Session-Id",
};

// ── Auth middleware ─────────────────────────────────────────────────────────
export async function authenticateRequest(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const { serverUrl } = getOAuthConfig();
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32001, message: "Unauthorized" },
        id: null,
      }),
      {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "WWW-Authenticate": `Bearer resource_metadata="${serverUrl}/.well-known/oauth-protected-resource"`,
        },
      }
    );
  }

  const token = authHeader.slice(7);
  try {
    await verifyAccessToken(token);
    return null; // authenticated
  } catch {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32001, message: "Invalid token" },
        id: null,
      }),
      {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
}
