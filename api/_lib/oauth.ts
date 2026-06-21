import type { IncomingMessage, ServerResponse } from 'node:http';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

const JWT_ALGORITHM = 'HS256';
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
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: JWT_ALGORITHM, typ: 'JWT' };
  const claims = {
    ...payload,
    iat: now,
    exp: now + parseDurationSeconds(expiresIn),
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = signHmac(signingInput, getOAuthConfig().oauthSecret);

  return `${signingInput}.${signature}`;
}

export async function verifyInternalJwt(token: string): Promise<Record<string, unknown>> {
  const [encodedHeader, encodedPayload, signature, extra] = token.split('.');
  if (!encodedHeader || !encodedPayload || !signature || extra !== undefined) {
    throw new Error('Invalid JWT format');
  }

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = signHmac(signingInput, getOAuthConfig().oauthSecret);
  if (!constantTimeEqual(signature, expectedSignature)) {
    throw new Error('Invalid JWT signature');
  }

  const header = JSON.parse(base64UrlDecode(encodedHeader)) as { alg?: string };
  if (header.alg !== JWT_ALGORITHM) {
    throw new Error('Unsupported JWT algorithm');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Record<string, unknown>;
  const exp = payload.exp;
  if (typeof exp !== 'number' || exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('JWT expired');
  }

  return payload;
}

export async function verifyAccessToken(token: string): Promise<Record<string, unknown>> {
  const payload = await verifyInternalJwt(token);
  if (payload.type !== 'access_token') {
    throw new Error('Invalid token type');
  }
  return payload;
}

export function verifyPKCE(codeVerifier: string, codeChallenge: string, method: string): boolean {
  if (method === 'S256') {
    const digest = createHash('sha256').update(textEncoder.encode(codeVerifier)).digest('base64url');
    return digest === codeChallenge;
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

function parseDurationSeconds(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) {
    throw new Error(`Unsupported duration: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
  };

  return value * multipliers[unit];
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signHmac(signingInput: string, secret: string): string {
  return createHmac('sha256', secret).update(signingInput).digest('base64url');
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
