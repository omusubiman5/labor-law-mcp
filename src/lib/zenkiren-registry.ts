/**
 * 全基連（全国労働基準関係団体連合会）主要判例 静的レジストリ
 *
 * zenkiren.com はASP.NET WebFormsのため動的検索が不可。
 * 主要な労働判例のcurated subsetを静的に管理する。
 */

import type { ZenkirenCaseEntry } from './types.js';

export const ZENKIREN_CASES: ZenkirenCaseEntry[] = [
  // パワハラ・メンタルヘルス関連
  {
    caseName: '国・栃木労基署長（D社）事件',
    courtName: '東京高裁',
    date: '平成25年2月27日',
    summary: 'パワーハラスメントによる精神障害の業務起因性が認められ、障害補償給付不支給処分が取り消された事例',
    url: 'https://www.zenkiren.com/Portals/0/html/jinji/hannrei/shoshi/08736.html',
    keywords: ['パワハラ', 'パワーハラスメント', '精神障害', '労災', '業務起因性', '障害補償'],
  },
  {
    caseName: '国・半田労基署長（医療法人B会D病院）事件',
    courtName: '名古屋高裁',
    date: '平成29年11月30日',
    summary: 'パワハラ・退職強要による精神障害について業務起因性が認められた事例',
    url: 'https://www.zenkiren.com/Portals/0/html/jinji/hannrei/shoshi/09160.html',
    keywords: ['パワハラ', 'パワーハラスメント', '退職強要', '精神障害', '労災', '業務起因性'],
  },
  // 解雇関連
  {
    caseName: '日本食塩製造事件',
    courtName: '最高裁第二小法廷',
    date: '昭和50年4月25日',
    summary: '解雇権濫用法理の確立。客観的に合理的な理由を欠き社会通念上相当として是認できない解雇は無効',
    url: 'https://www.zenkiren.com/Portals/0/html/jinji/hannrei/shoshi/00029.html',
    keywords: ['解雇', '解雇権濫用', '解雇無効', 'ユニオンショップ'],
  },
  {
    caseName: '高知放送事件',
    courtName: '最高裁第二小法廷',
    date: '昭和52年1月31日',
    summary: '寝過ごしによるニュース放送事故を理由とする解雇が解雇権の濫用にあたるとされた事例',
    url: 'https://www.zenkiren.com/Portals/0/html/jinji/hannrei/shoshi/00068.html',
    keywords: ['解雇', '解雇権濫用', '普通解雇', '懲戒解雇'],
  },
  // 整理解雇
  {
    caseName: '東洋酸素事件',
    courtName: '東京高裁',
    date: '昭和54年10月29日',
    summary: '整理解雇の四要件（四要素）を示した代表的判例',
    url: 'https://www.zenkiren.com/Portals/0/html/jinji/hannrei/shoshi/00107.html',
    keywords: ['整理解雇', '解雇', '四要件', '四要素', '人員削減'],
  },
  // セクハラ関連
  {
    caseName: '福岡セクシュアル・ハラスメント事件',
    courtName: '福岡地裁',
    date: '平成4年4月16日',
    summary: 'セクハラの違法性を認めた日本初の裁判例。職場環境配慮義務の先駆的判断',
    url: 'https://www.zenkiren.com/Portals/0/html/jinji/hannrei/shoshi/00649.html',
    keywords: ['セクハラ', 'セクシュアルハラスメント', '職場環境', '損害賠償'],
  },
  // 過労死・過労自殺
  {
    caseName: '電通事件',
    courtName: '最高裁第二小法廷',
    date: '平成12年3月24日',
    summary: '長時間労働による自殺について使用者の安全配慮義務違反を認めた最高裁判例。過労自殺の先例',
    url: 'https://www.zenkiren.com/Portals/0/html/jinji/hannrei/shoshi/01011.html',
    keywords: ['過労死', '過労自殺', '長時間労働', '安全配慮義務', '損害賠償', 'うつ病'],
  },
  // 有期雇用・雇止め
  {
    caseName: '日立メディコ事件',
    courtName: '最高裁第一小法廷',
    date: '昭和61年12月4日',
    summary: '有期労働契約の雇止めについて解雇権濫用法理の類推適用を認めた事例',
    url: 'https://www.zenkiren.com/Portals/0/html/jinji/hannrei/shoshi/00325.html',
    keywords: ['雇止め', '有期雇用', '有期契約', '期間満了', '更新拒否'],
  },
  // 配転・出向
  {
    caseName: '東亜ペイント事件',
    courtName: '最高裁第二小法廷',
    date: '昭和61年7月14日',
    summary: '配転命令権の限界を示した最高裁判例。業務上の必要性、不当な動機・目的、著しい不利益の有無で判断',
    url: 'https://www.zenkiren.com/Portals/0/html/jinji/hannrei/shoshi/00305.html',
    keywords: ['配転', '転勤', '配置転換', '配転命令', '人事権'],
  },
  // 賃金・残業代
  {
    caseName: '三菱重工業長崎造船所事件',
    courtName: '最高裁第一小法廷',
    date: '平成12年3月9日',
    summary: '労働時間該当性の判断基準を示した判例。使用者の指揮命令下に置かれた時間は労働時間',
    url: 'https://www.zenkiren.com/Portals/0/html/jinji/hannrei/shoshi/01001.html',
    keywords: ['労働時間', '残業代', '賃金', '指揮命令下', '着替え時間'],
  },
  // 就業規則の不利益変更
  {
    caseName: '秋北バス事件',
    courtName: '最高裁大法廷',
    date: '昭和43年12月25日',
    summary: '就業規則の法的性質と合理的な不利益変更の効力を認めた判例',
    url: 'https://www.zenkiren.com/Portals/0/html/jinji/hannrei/shoshi/00002.html',
    keywords: ['就業規則', '不利益変更', '労働条件', '合理性'],
  },
  {
    caseName: '第四銀行事件',
    courtName: '最高裁第二小法廷',
    date: '平成9年2月28日',
    summary: '就業規則の不利益変更の合理性判断基準を具体化した判例',
    url: 'https://www.zenkiren.com/Portals/0/html/jinji/hannrei/shoshi/00824.html',
    keywords: ['就業規則', '不利益変更', '賃金', '定年', '合理性'],
  },
  // 懲戒処分
  {
    caseName: 'ネスレ日本（懲戒解雇）事件',
    courtName: '最高裁第二小法廷',
    date: '平成18年10月6日',
    summary: '懲戒処分の有効性の判断基準を示した判例。処分時に使用者が認識していた事由のみが対象',
    url: 'https://www.zenkiren.com/Portals/0/html/jinji/hannrei/shoshi/03223.html',
    keywords: ['懲戒', '懲戒解雇', '懲戒処分', '処分事由'],
  },
  // 労働組合・団体交渉
  {
    caseName: '朝日放送事件',
    courtName: '最高裁第三小法廷',
    date: '平成7年2月28日',
    summary: '派遣先が不当労働行為の使用者に該当する場合を示した判例',
    url: 'https://www.zenkiren.com/Portals/0/html/jinji/hannrei/shoshi/00747.html',
    keywords: ['不当労働行為', '使用者', '派遣', '団体交渉', '労働組合'],
  },
  // 均等待遇・同一労働同一賃金
  {
    caseName: 'ハマキョウレックス事件',
    courtName: '最高裁第二小法廷',
    date: '平成30年6月1日',
    summary: '有期契約労働者と無期契約労働者の労働条件の相違が不合理であるかの判断を示した判例',
    url: 'https://www.zenkiren.com/Portals/0/html/jinji/hannrei/shoshi/10088.html',
    keywords: ['同一労働同一賃金', '均等待遇', '有期雇用', '不合理', '手当', '労働契約法20条'],
  },
  {
    caseName: '長澤運輸事件',
    courtName: '最高裁第二小法廷',
    date: '平成30年6月1日',
    summary: '定年後再雇用者と正社員の賃金格差について労契法20条の不合理性を判断した判例',
    url: 'https://www.zenkiren.com/Portals/0/html/jinji/hannrei/shoshi/10089.html',
    keywords: ['同一労働同一賃金', '定年後再雇用', '賃金格差', '不合理', '嘱託', '労働契約法20条'],
  },
];

/**
 * キーワードでレジストリを検索する
 */
export function searchZenkirenRegistry(keyword: string): ZenkirenCaseEntry[] {
  const kw = keyword.toLowerCase();
  return ZENKIREN_CASES.filter((c) =>
    c.caseName.toLowerCase().includes(kw) ||
    c.summary.toLowerCase().includes(kw) ||
    c.keywords.some((k) => k.toLowerCase().includes(kw))
  );
}
