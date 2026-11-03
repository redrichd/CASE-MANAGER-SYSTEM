// src/constants/dispatchConstants.js
// Centralized constants for dispatch types and service contents

export const DISPATCH_TYPES = [
  "新案_初評",
  "新案_出備",
  "自行發掘",
  "複評",
  "出備轉初評",
];

export const SERVICE_CONTENTS = [
  "BA",
  "BA09",
  "BB",
  "BC",
  "BD",
  "CA",
  "CB",
  "CC",
  "CD",
  "DA",
  "GA03",
  "GA04",
  "GA05",
  "GA06",
  "GA07",
  "GA09",
  "SC09",
  "SC03",
  "轉介",
];

export const SERVICE_AREAS = [
  "新莊區",
  "三重區",
  "永和區",
];

// 轉介服務分類標籤 (專業資源)
export const REFERRAL_SERVICE_ITEMS_PROFESSIONAL = [
  "失智症社區服務據點",
  "緊急救援",
  "緊急安置",
  "家照服務",
  "二手輔具/輔具資源中心",
  "急難救助",
  "物資補助",
  "到宅修繕",
  "志工關懷訪視",
  "其他說明 (專業資源)",
];

// 轉介服務分類標籤 (醫療相關資源)
export const REFERRAL_SERVICE_ITEMS_MEDICAL = [
  "居家醫療",
  "安寧緩和",
  "健保居家護理",
  "其他說明 (醫療相關資源)",
];

// 轉介服務分類標籤 (醫事C巷弄長照站)
export const REFERRAL_SERVICE_ITEMS_C_STATION = [
  "2-3級轉介巷弄長照站",
  "複評結果未達2級(結案)",
  "提供社照C巷弄長照站資訊",
  "居家/社區照顧服務不符合需求或入住機構",
  "提供住宿式機構資訊",
];

// 合併所有轉介服務分類標籤
export const ALL_REFERRAL_SERVICES = [
  ...REFERRAL_SERVICE_ITEMS_PROFESSIONAL,
  ...REFERRAL_SERVICE_ITEMS_MEDICAL,
  ...REFERRAL_SERVICE_ITEMS_C_STATION,
];

