/**
 * 全基連 判例詳細ページ HTML パーサー
 */

import { stripTags } from './html-utils.js';
import type { ZenkirenCaseDetail } from './types.js';

/**
 * 判例詳細ページをパースする
 */
export function parseZenkirenDetail(html: string, url: string): ZenkirenCaseDetail {
  // タイトル抽出
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const caseName = titleMatch
    ? stripTags(titleMatch[1]).trim().replace(/\s*[-–|].*$/, '')
    : '（事件名不明）';

  // メインコンテンツ抽出
  // zenkiren.comは比較的シンプルなHTML構造
  let bodyHtml = html;

  // id="dnn_ctr***_ContentPane" 等のDotNetNukeコンテンツ領域
  const contentMatch = html.match(/id="[^"]*ContentPane[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
  if (contentMatch) {
    bodyHtml = contentMatch[1];
  } else {
    // フォールバック: <body>内のメイン部分
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
      bodyHtml = bodyMatch[1];
    }
  }

  // テキスト抽出とクリーンアップ
  const body = stripTags(bodyHtml)
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+$/gm, '')
    .trim()
    .slice(0, 8000); // 長すぎる場合は切り詰め

  return { caseName, body, url };
}
