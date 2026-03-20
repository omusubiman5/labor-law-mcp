/**
 * 全基連判例 サービス層
 */

import { fetchZenkirenPage } from '../zenkiren-client.js';
import { parseZenkirenDetail } from '../zenkiren-parser.js';
import { searchZenkirenRegistry } from '../zenkiren-registry.js';
import type { ZenkirenCaseEntry, ZenkirenCaseDetail } from '../types.js';

export interface ZenkirenSearchResponse {
  results: ZenkirenCaseEntry[];
}

/**
 * 全基連判例をキーワード検索する（静的レジストリ）
 */
export async function searchZenkirenCases(opts: {
  keyword: string;
}): Promise<ZenkirenSearchResponse> {
  const results = searchZenkirenRegistry(opts.keyword);
  return { results };
}

/**
 * 全基連判例の詳細ページを取得する
 */
export async function getZenkirenCase(opts: {
  url: string;
}): Promise<ZenkirenCaseDetail> {
  const html = await fetchZenkirenPage(opts.url);
  return parseZenkirenDetail(html, opts.url);
}
