/**
 * 労働保険審査会 裁決事案 サービス層
 */

import {
  fetchShinsakaiPage,
  getShinsakaiUrl,
  SHINSAKAI_INDEX_URL,
  SHINSAKAI_CATEGORIES,
} from '../shinsakai-client.js';
import { parseShinsakaiIndex } from '../shinsakai-parser.js';
import type { ShinsakaiDecisionEntry } from '../types.js';

export interface ShinsakaiSearchResponse {
  results: ShinsakaiDecisionEntry[];
  category: string;
  indexUrl: string;
}

/**
 * 裁決事案を検索する
 *
 * カテゴリ指定時はそのカテゴリページを取得、
 * 未指定時は「業務上外」（最も利用頻度が高い）を取得する。
 */
export async function searchShinsakaiDecisions(opts: {
  category?: string;
  fiscalYear?: string;
}): Promise<ShinsakaiSearchResponse> {
  const category = opts.category ?? '業務上外';
  const categoryPath = SHINSAKAI_CATEGORIES[category];

  if (!categoryPath) {
    const validCategories = Object.keys(SHINSAKAI_CATEGORIES).join(', ');
    throw new Error(
      `不明なカテゴリです: 「${category}」。利用可能なカテゴリ: ${validCategories}`
    );
  }

  const indexUrl = getShinsakaiUrl(SHINSAKAI_INDEX_URL);

  try {
    const html = await fetchShinsakaiPage(categoryPath);
    let results = parseShinsakaiIndex(html, category);

    // 年度フィルタ
    if (opts.fiscalYear) {
      results = results.filter((r) =>
        r.fiscalYear.includes(opts.fiscalYear!) || r.title.includes(opts.fiscalYear!)
      );
    }

    return { results, category, indexUrl };
  } catch {
    // フェッチ失敗時はインデックスURLのみ返す
    return { results: [], category, indexUrl };
  }
}

/**
 * 利用可能なカテゴリ一覧を返す
 */
export function getShinsakaiCategories(): string[] {
  return Object.keys(SHINSAKAI_CATEGORIES);
}
