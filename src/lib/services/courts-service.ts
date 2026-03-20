/**
 * 裁判所判例検索 サービス層
 */

import { fetchCourtsSearch, getCourtsSearchUrl } from '../courts-client.js';
import { parseCourtsSearchResults, parseCourtsSearchCount } from '../courts-parser.js';
import type { CourtCaseEntry } from '../types.js';

/** 判例種別コード */
const CASE_TYPE_MAP: Record<string, string> = {
  labor: '4',          // 労働
  administrative: '3', // 行政
  civil: '2',          // 民事
  criminal: '1',       // 刑事
};

export interface CourtsSearchResponse {
  results: CourtCaseEntry[];
  totalCount: number;
  searchUrl: string;
}

/**
 * 裁判所判例を検索する
 */
export async function searchCourtCases(opts: {
  keyword: string;
  caseType?: string;
  page?: number;
}): Promise<CourtsSearchResponse> {
  const hanreiSyu = opts.caseType ? CASE_TYPE_MAP[opts.caseType] : undefined;
  const searchUrl = getCourtsSearchUrl(opts.keyword);

  try {
    const html = await fetchCourtsSearch({
      keyword: opts.keyword,
      page: opts.page,
      hanreiSyu,
    });

    const results = parseCourtsSearchResults(html);
    const totalCount = parseCourtsSearchCount(html);

    return { results, totalCount, searchUrl };
  } catch {
    // 検索が失敗した場合は検索URLのみ返す
    return { results: [], totalCount: 0, searchUrl };
  }
}
