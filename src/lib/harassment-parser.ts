/**
 * あかるい職場応援団 ハラスメント裁判例 HTML パーサー
 *
 * 一覧ページ: リンク一覧を抽出
 * 詳細ページ: 概要・判決ポイント・コメントを抽出
 */

import { stripTags } from './html-utils.js';
import type { HarassmentCaseEntry, HarassmentCaseDetail } from './types.js';

/**
 * 一覧ページからリンク一覧を抽出する
 */
export function parseHarassmentList(html: string): HarassmentCaseEntry[] {
  const results: HarassmentCaseEntry[] = [];

  // <a href="/foundation/judicail-precedent/xxx">タイトル</a> を抽出
  const linkRegex = /<a\s+[^>]*href="(\/foundation\/judicail-precedent\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    const path = match[1];
    const rawText = stripTags(match[2]).trim();

    // 空テキストやナビゲーションリンクを除外
    if (rawText.length < 5) continue;
    // 一覧ページ自体へのリンクを除外
    if (path === '/foundation/judicail-precedent/') continue;

    results.push({
      title: rawText,
      path,
    });
  }

  return results;
}

/**
 * キーワードフィルタ
 */
export function filterHarassmentEntries(
  entries: HarassmentCaseEntry[],
  keyword?: string
): HarassmentCaseEntry[] {
  if (!keyword) return entries;
  const kw = keyword.toLowerCase();
  return entries.filter((e) => e.title.toLowerCase().includes(kw));
}

/**
 * 詳細ページから概要・判決ポイント・コメントを抽出する
 */
export function parseHarassmentDetail(html: string): HarassmentCaseDetail {
  // タイトル
  const titleMatch = html.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/i);
  const title = titleMatch ? stripTags(titleMatch[1]).trim() : '（タイトル不明）';

  // 本文テキストを抽出（メインコンテンツ部分）
  // コンテンツ部分の大まかな抽出
  let bodyHtml = html;

  // <main> or <article> or id="content" 等があればそこから抽出
  const mainMatch = html.match(/<(?:main|article)[^>]*>([\s\S]*?)<\/(?:main|article)>/i);
  if (mainMatch) {
    bodyHtml = mainMatch[1];
  } else {
    const contentMatch = html.match(/id="content"[^>]*>([\s\S]*?)<\/div>/i);
    if (contentMatch) {
      bodyHtml = contentMatch[1];
    }
  }

  // セクションごとに抽出を試みる
  const sections: string[] = [];

  // 「概要」セクション
  const summaryMatch = bodyHtml.match(/(?:概要|事案の概要|事件の概要)([\s\S]*?)(?=(?:判決|ポイント|コメント|<h[23])|$)/i);
  if (summaryMatch) {
    const text = stripTags(summaryMatch[1]).trim();
    if (text) sections.push(`【概要】\n${text}`);
  }

  // 「判決のポイント」セクション
  const pointMatch = bodyHtml.match(/(?:判決のポイント|判旨|裁判所の判断)([\s\S]*?)(?=(?:コメント|解説|<h[23])|$)/i);
  if (pointMatch) {
    const text = stripTags(pointMatch[1]).trim();
    if (text) sections.push(`【判決のポイント】\n${text}`);
  }

  // 「コメント」セクション
  const commentMatch = bodyHtml.match(/(?:コメント|解説)([\s\S]*?)(?=(?:<h[23]|<footer|$))/i);
  if (commentMatch) {
    const text = stripTags(commentMatch[1]).trim();
    if (text) sections.push(`【コメント】\n${text}`);
  }

  // セクション抽出がうまくいかなかった場合はフォールバック
  const body = sections.length > 0
    ? sections.join('\n\n')
    : stripTags(bodyHtml)
        .replace(/\s{3,}/g, '\n\n')
        .trim()
        .slice(0, 5000);

  return { title, body };
}
