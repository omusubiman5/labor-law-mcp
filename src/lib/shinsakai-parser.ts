/**
 * 労働保険審査会 裁決事案 HTML パーサー
 */

import { stripTags } from './html-utils.js';
import type { ShinsakaiDecisionEntry } from './types.js';

const BASE_URL = 'https://www.mhlw.go.jp';

/**
 * カテゴリ別インデックスページから裁決リンクを抽出する
 */
export function parseShinsakaiIndex(
  html: string,
  category: string
): ShinsakaiDecisionEntry[] {
  const results: ShinsakaiDecisionEntry[] = [];

  // PDFリンクまたはHTMLリンクを抽出
  const linkRegex = /<a\s+[^>]*href="([^"]*(?:\.pdf|\.html?)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1];
    const text = stripTags(match[2]).trim();

    if (!text || text.length < 3) continue;

    // 相対URLを絶対URLに変換
    if (href.startsWith('/')) {
      href = `${BASE_URL}${href}`;
    } else if (!href.startsWith('http')) {
      href = `${BASE_URL}/topics/bukyoku/shinsa/roudou/saiketu-youshi/${href}`;
    }

    // 年度を抽出
    const yearMatch = text.match(/(?:令和|平成|昭和)\s*\d{1,2}\s*年度?/);
    const fiscalYear = yearMatch ? yearMatch[0].replace(/\s+/g, '') : '';

    results.push({
      title: text,
      pdfUrl: href,
      category,
      fiscalYear,
    });
  }

  return results;
}

/**
 * トップページからカテゴリリンクを抽出する
 */
export function parseShinsakaiTop(html: string): string[] {
  const links: string[] = [];
  const linkRegex = /<a\s+[^>]*href="(\/topics\/bukyoku\/shinsa\/roudou\/saiketu-youshi\/[^"]+)"[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    if (!links.includes(match[1])) {
      links.push(match[1]);
    }
  }

  return links;
}
