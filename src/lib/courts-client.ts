/**
 * 裁判所判例検索 HTTP クライアント
 * https://www.courts.go.jp/
 *
 * GET検索でメタデータ+PDF URLを返却する。PDF本文の解析は行わない。
 */

import { courtsSearchCache } from './cache.js';

const BASE_URL = 'https://www.courts.go.jp';
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
  const timeout = setTimeout(() => controller.abort(), 30_000);

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
 * 裁判所判例検索を実行する（30分キャッシュ）
 */
export async function fetchCourtsSearch(params: {
  keyword: string;
  page?: number;
  hanreiSyu?: string;
}): Promise<string> {
  const page = params.page ?? 1;
  const searchParams = new URLSearchParams({
    page: String(page),
    sort: '1',
    filter: encodeURIComponent(params.keyword),
  });

  // 判例種別（労働=4）
  if (params.hanreiSyu) {
    searchParams.set('hanreiSyu', params.hanreiSyu);
  }

  const cacheKey = searchParams.toString();
  const cached = courtsSearchCache.get(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}/app/hanrei_jp/search2?${searchParams.toString()}`;
  const html = await throttledFetch(url);
  courtsSearchCache.set(cacheKey, html);
  return html;
}

/**
 * 裁判所判例検索のURLを生成する（フォールバック用）
 */
export function getCourtsSearchUrl(keyword: string): string {
  return `${BASE_URL}/app/hanrei_jp/search2?page=1&sort=1&filter=${encodeURIComponent(keyword)}`;
}
