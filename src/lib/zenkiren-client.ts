/**
 * 全基連（全国労働基準関係団体連合会）判例ページ HTTP クライアント
 * https://www.zenkiren.com/
 *
 * ASP.NET WebFormsのため動的検索は不可。
 * 静的レジストリの個別判例ページをfetchする。
 */

import { zenkirenPageCache } from './cache.js';

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
 * 全基連判例ページを取得する（24hキャッシュ）
 */
export async function fetchZenkirenPage(url: string): Promise<string> {
  // SSRF防止: zenkiren.com配下のみ許可
  if (!url.startsWith('https://www.zenkiren.com/')) {
    throw new Error(`不正なURLです。全基連のURLを指定してください: ${url}`);
  }

  const cached = zenkirenPageCache.get(url);
  if (cached) return cached;

  const html = await throttledFetch(url);
  zenkirenPageCache.set(url, html);
  return html;
}
