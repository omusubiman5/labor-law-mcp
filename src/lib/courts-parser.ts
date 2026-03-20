/**
 * 裁判所判例検索結果 HTML パーサー
 */

import { stripTags } from './html-utils.js';
import type { CourtCaseEntry } from './types.js';

const BASE_URL = 'https://www.courts.go.jp';

/**
 * 判例検索結果ページをパースする
 *
 * courts.go.jpの検索結果はテーブル形式で、各行に
 * 事件名、裁判所名、裁判年月日、事件番号、詳細リンクが含まれる。
 */
export function parseCourtsSearchResults(html: string): CourtCaseEntry[] {
  const results: CourtCaseEntry[] = [];

  // 検索結果のリンクパターン: /app/hanrei_jp/detail2?id=XXXXX
  const rowRegex = /<a\s+[^>]*href="(\/app\/hanrei_jp\/detail2\?id=\d+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = rowRegex.exec(html)) !== null) {
    const detailPath = match[1];
    const linkText = stripTags(match[2]).trim();

    if (!linkText || linkText.length < 3) continue;

    const detailUrl = `${BASE_URL}${detailPath}`;

    // 周辺のテーブル行からメタデータを取得
    const contextStart = Math.max(0, match.index - 500);
    const contextEnd = Math.min(html.length, match.index + match[0].length + 500);
    const context = html.slice(contextStart, contextEnd);

    // 裁判所名の抽出
    const courtMatch = context.match(/(?:最高裁|高[等]?裁|地[方]?裁|家[庭]?裁|簡[易]?裁)[^\s<,、]{0,20}/);
    const courtName = courtMatch ? stripTags(courtMatch[0]).trim() : '';

    // 日付の抽出（令和/平成/昭和 形式）
    const dateMatch = context.match(/(?:令和|平成|昭和)\s*\d{1,2}年\s*\d{1,2}月\s*\d{1,2}日/);
    const date = dateMatch ? dateMatch[0].replace(/\s+/g, '') : '';

    // 事件番号の抽出
    const caseNumMatch = context.match(/(?:令和|平成|昭和)\s*\d{1,2}\s*年\s*[（(]\s*[ァ-ヶー]+\s*[）)]\s*第?\s*\d+\s*号/);
    const caseNumber = caseNumMatch ? caseNumMatch[0].replace(/\s+/g, '') : '';

    // PDF URLの抽出
    const pdfMatch = context.match(/href="([^"]*\.pdf[^"]*)"/i);
    const pdfUrl = pdfMatch
      ? pdfMatch[1].startsWith('http') ? pdfMatch[1] : `${BASE_URL}${pdfMatch[1]}`
      : undefined;

    results.push({
      caseName: linkText,
      courtName,
      date,
      caseNumber,
      detailUrl,
      pdfUrl,
    });
  }

  return results;
}

/**
 * 検索結果の総件数を抽出する
 */
export function parseCourtsSearchCount(html: string): number {
  // 「XX件」パターンを探す
  const countMatch = html.match(/(\d+)\s*件/);
  return countMatch ? parseInt(countMatch[1], 10) : 0;
}
