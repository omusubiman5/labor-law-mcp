/** e-Gov API v2 のレスポンス型 */

export interface EgovLawSearchResult {
  law_info: {
    law_id: string;
    law_type: string;
    law_num: string;
    promulgation_date: string;
  };
  revision_info?: {
    law_title: string;
    law_title_kana?: string;
    abbrev?: string;
  };
  current_revision_info?: {
    law_title: string;
    law_title_kana?: string;
    abbrev?: string;
  };
}

export interface EgovLawData {
  law_info: {
    law_id: string;
    law_type: string;
    law_num: string;
    law_num_era?: string;
    law_num_year?: number;
    law_num_type?: string;
    law_num_num?: string;
    promulgation_date: string;
  };
  law_full_text: EgovNode;
}

export interface EgovNode {
  tag: string;
  attr?: Record<string, string>;
  children?: (EgovNode | string)[];
}

/** MHLW 法令等データベース — 検索結果 */

export interface MhlwSearchResult {
  /** 通達タイトル */
  title: string;
  /** dataId（文書の一意識別子） */
  dataId: string;
  /** 制定年月日 */
  date: string;
  /** 種別・番号（例: "基発第0401001号"） */
  shubetsu: string;
}

/** MHLW 法令等データベース — 通達本文 */

export interface MhlwDocument {
  /** ドキュメントタイトル */
  title: string;
  /** 本文テキスト */
  body: string;
  /** dataId */
  dataId: string;
  /** ソースURL */
  url: string;
}

/** ハラスメント裁判例 — 一覧エントリ */

export interface HarassmentCaseEntry {
  /** 裁判例タイトル */
  title: string;
  /** ページパス（例: "/foundation/judicail-precedent/xxx"） */
  path: string;
}

/** ハラスメント裁判例 — 詳細 */

export interface HarassmentCaseDetail {
  /** 裁判例タイトル */
  title: string;
  /** 本文（概要・判決ポイント・コメント） */
  body: string;
}

/** 裁判所判例検索 — 検索結果エントリ */

export interface CourtCaseEntry {
  /** 事件名 */
  caseName: string;
  /** 裁判所名 */
  courtName: string;
  /** 裁判年月日 */
  date: string;
  /** 事件番号 */
  caseNumber: string;
  /** 判例詳細ページURL */
  detailUrl: string;
  /** 全文PDF URL（存在する場合） */
  pdfUrl?: string;
}

/** 労働保険審査会裁決 — 検索結果エントリ */

export interface ShinsakaiDecisionEntry {
  /** 裁決タイトル */
  title: string;
  /** PDF URL */
  pdfUrl: string;
  /** カテゴリ */
  category: string;
  /** 年度 */
  fiscalYear: string;
}

/** 全基連判例 — レジストリエントリ */

export interface ZenkirenCaseEntry {
  /** 事件名 */
  caseName: string;
  /** 裁判所名 */
  courtName: string;
  /** 裁判年月日 */
  date: string;
  /** 概要 */
  summary: string;
  /** 詳細ページURL */
  url: string;
  /** キーワード（検索用） */
  keywords: string[];
}

/** 全基連判例 — 詳細 */

export interface ZenkirenCaseDetail {
  /** 事件名 */
  caseName: string;
  /** 本文テキスト */
  body: string;
  /** ソースURL */
  url: string;
}

/** JAISH 安全衛生情報センター — インデックスエントリ */

export interface JaishIndexEntry {
  /** 通達タイトル */
  title: string;
  /** 通達番号（例: "基発第123号"） */
  number: string;
  /** 発出日 */
  date: string;
  /** ページURL（相対パスまたは絶対URL） */
  url: string;
}

/** JAISH 安全衛生情報センター — 通達本文 */

export interface JaishDocument {
  /** 通達タイトル */
  title: string;
  /** 本文テキスト */
  body: string;
  /** ソースURL */
  url: string;
}
