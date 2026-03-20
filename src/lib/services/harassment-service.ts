/**
 * ハラスメント裁判例 サービス層
 */

import {
  fetchHarassmentList,
  fetchHarassmentDetail,
  getHarassmentUrl,
} from '../harassment-client.js';
import {
  parseHarassmentList,
  filterHarassmentEntries,
  parseHarassmentDetail,
} from '../harassment-parser.js';
import type { HarassmentCaseEntry, HarassmentCaseDetail } from '../types.js';

export interface HarassmentSearchResponse {
  results: (HarassmentCaseEntry & { url: string })[];
  total: number;
}

/**
 * ハラスメント裁判例を検索する
 */
export async function searchHarassmentCases(opts: {
  keyword?: string;
  page?: number;
}): Promise<HarassmentSearchResponse> {
  const html = await fetchHarassmentList();
  const allEntries = parseHarassmentList(html);
  const filtered = filterHarassmentEntries(allEntries, opts.keyword);

  // ページネーション
  const pageSize = 15;
  const page = Math.max(1, opts.page ?? 1);
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return {
    results: paged.map((e) => ({
      ...e,
      url: getHarassmentUrl(e.path),
    })),
    total: filtered.length,
  };
}

/**
 * ハラスメント裁判例の詳細を取得する
 */
export async function getHarassmentCase(opts: {
  path: string;
}): Promise<HarassmentCaseDetail & { url: string }> {
  const html = await fetchHarassmentDetail(opts.path);
  const detail = parseHarassmentDetail(html);
  const url = getHarassmentUrl(opts.path);

  return { ...detail, url };
}
