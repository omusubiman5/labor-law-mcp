/**
 * あかるい職場応援団 ハラスメント裁判例 HTTP クライアント
 * https://www.no-harassment.mhlw.go.jp/
 *
 * UTF-8 HTML。一覧ページと個別判例ページを取得する。
 */

import { harassmentListCache, harassmentDetailCache } from './cache.js';

const BASE_URL = 'https://www.no-harassment.mhlw.go.jp';
const REQUEST_DELAY_MS = 300;

let lastRequestTime = 0;

async function throttledFetch(url: string): Promise<string> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < REQUEST_DELAY_MS) {
    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'labor-law-mcp/0.3.0 (MCP server for Japanese labor law)',
        'Accept-Language': 'ja,en;q=0.9',
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * ハラスメント裁判例一覧ページを取得する（24hキャッシュ）
 */
export async function fetchHarassmentList(): Promise<string> {
  const cacheKey = 'list';
  const cached = harassmentListCache.get(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}/foundation/judicail-precedent/`;
  const html = await throttledFetch(url);
  harassmentListCache.set(cacheKey, html);
  return html;
}

/**
 * ハラスメント裁判例 個別ページを取得する（24hキャッシュ）
 * @param path 判例ページのパス（例: "/foundation/judicail-precedent/xxx"）
 */
export async function fetchHarassmentDetail(path: string): Promise<string> {
  // SSRF防止: judicail-precedent配下のみ許可
  if (!path.startsWith('/foundation/judicail-precedent/')) {
    throw new Error(
      `不正なパスです。ハラスメント裁判例ページのパスを指定してください: ${path}`
    );
  }

  const cached = harassmentDetailCache.get(path);
  if (cached) return cached;

  const url = `${BASE_URL}${path}`;
  const html = await throttledFetch(url);
  harassmentDetailCache.set(path, html);
  return html;
}

/**
 * ハラスメント裁判例の完全URLを生成する
 */
export function getHarassmentUrl(path: string): string {
  return `${BASE_URL}${path}`;
}
