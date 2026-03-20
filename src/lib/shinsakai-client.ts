/**
 * 労働保険審査会 裁決事案 HTTP クライアント
 * https://www.mhlw.go.jp/topics/bukyoku/shinsa/roudou/
 *
 * 裁決要旨一覧ページをカテゴリ別・年度別に取得する。
 */

import { shinsakaiCache } from './cache.js';

const BASE_URL = 'https://www.mhlw.go.jp';
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
 * 裁決要旨一覧トップページのパス
 */
export const SHINSAKAI_INDEX_URL = '/topics/bukyoku/shinsa/roudou/saiketu-youshi/';

/**
 * カテゴリ別インデックスページURL
 * 厚労省サイトの裁決要旨はカテゴリ（業務上外、障害等級等）と年度でマトリクス構成
 */
export const SHINSAKAI_CATEGORIES: Record<string, string> = {
  '業務上外': '/topics/bukyoku/shinsa/roudou/saiketu-youshi/gyoumu.html',
  '障害等級': '/topics/bukyoku/shinsa/roudou/saiketu-youshi/shougai.html',
  '給付基礎日額': '/topics/bukyoku/shinsa/roudou/saiketu-youshi/kyuuhu.html',
  '療養': '/topics/bukyoku/shinsa/roudou/saiketu-youshi/ryouyou.html',
  '休業': '/topics/bukyoku/shinsa/roudou/saiketu-youshi/kyuugyou.html',
  '遺族': '/topics/bukyoku/shinsa/roudou/saiketu-youshi/izoku.html',
  '特別加入': '/topics/bukyoku/shinsa/roudou/saiketu-youshi/tokubetsu.html',
  '第三者行為': '/topics/bukyoku/shinsa/roudou/saiketu-youshi/daisansha.html',
  '雇用保険': '/topics/bukyoku/shinsa/roudou/saiketu-youshi/koyou.html',
};

/**
 * 裁決要旨一覧ページを取得する（24hキャッシュ）
 */
export async function fetchShinsakaiPage(path: string): Promise<string> {
  // SSRF防止
  if (!path.startsWith('/topics/bukyoku/shinsa/roudou/')) {
    throw new Error(`不正なパスです: ${path}`);
  }

  const cached = shinsakaiCache.get(path);
  if (cached) return cached;

  const url = `${BASE_URL}${path}`;
  const html = await throttledFetch(url);
  shinsakaiCache.set(path, html);
  return html;
}

/**
 * 完全URLを生成する
 */
export function getShinsakaiUrl(path: string): string {
  return `${BASE_URL}${path}`;
}
