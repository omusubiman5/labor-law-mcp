import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';

const textEncoder = new TextEncoder();

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, mcp-session-id, Last-Event-ID, mcp-protocol-version',
  'Access-Control-Expose-Headers': 'mcp-session-id, mcp-protocol-version',
};

export interface OAuthConfig {
  serverUrl: string;
  auth0Domain: string;
  auth0ClientId: string;
  auth0ClientSecret: string;
  auth0Audience: string;
  oauthSecret: string;
}

export function getOAuthConfig(): OAuthConfig {
  const serverUrl = process.env.SERVER_URL;
  const auth0Domain = process.env.AUTH0_DOMAIN;
  const auth0ClientId = process.env.AUTH0_CLIENT_ID;
  const auth0ClientSecret = process.env.AUTH0_CLIENT_SECRET;
  const auth0Audience = process.env.AUTH0_AUDIENCE ?? 'https://mcp-servers';
  const oauthSecret = process.env.OAUTH_SECRET;

  if (!serverUrl || !auth0Domain || !auth0ClientId || !auth0ClientSecret || !oauthSecret) {
    throw new Error('Missing OAuth env vars');
  }

  return {
    serverUrl: trimTrailingSlash(serverUrl),
    auth0Domain,
    auth0ClientId,
    auth0ClientSecret,
    auth0Audience,
    oauthSecret,
  };
}

export function applyCorsHeaders(res: ServerResponse): void {
  for (const [key, value] of Object.entries(corsHeaders)) {
    res.setHeader(key, value);
  }
}

export function sendJson(res: ServerResponse, statusCode: number, body: unknown, headers: Record<string, string> = {}): void {
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

export function sendNoContent(res: ServerResponse): void {
  res.writeHead(204);
  res.end();
}

export function redirect(res: ServerResponse, location: string): void {
  res.writeHead(302, { Location: location });
  res.end();
}

export function createClientId(): string {
  return randomUUID();
}

export async function readRequestBody(req: IncomingMessage): Promise<unknown> {
  const parsedBody = (req as IncomingMessage & { body?: unknown }).body;
  if (parsedBody !== undefined) {
    return parsedBody;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  const contentType = req.headers['content-type'] ?? '';

  if (!rawBody) {
    return {};
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(rawBody));
  }

  return JSON.parse(rawBody) as unknown;
}

export function getHeader(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export async function signInternalJwt(payload: Record<string, unknown>, expiresIn = '10m'): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifyInternalJwt(token: string): Promise<Record<string, unknown>> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload;
}

export async function verifyAccessToken(token: string): Promise<Record<string, unknown>> {
  const payload = await verifyInternalJwt(token);
  if (payload.type !== 'access_token') {
    throw new Error('Invalid token type');
  }
  return payload;
}

export async function verifyPKCE(codeVerifier: string, codeChallenge: string, method: string): Promise<boolean> {
  if (method === 'S256') {
    const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(codeVerifier));
    const computed = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return computed === codeChallenge;
  }
  return codeVerifier === codeChallenge;
}

export async function authenticateRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const authHeader = getHeader(req, 'authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    const { serverUrl } = getOAuthConfig();
    res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${serverUrl}/.well-known/oauth-protected-resource"`);
    sendJson(res, 401, {
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Unauthorized' },
      id: null,
    });
    return false;
  }

  try {
    await verifyAccessToken(authHeader.slice('Bearer '.length));
    return true;
  } catch {
    sendJson(res, 401, {
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Invalid token' },
      id: null,
    });
    return false;
  }
}

export function getAllowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function getSecret(): Uint8Array {
  return textEncoder.encode(getOAuthConfig().oauthSecret);
}
