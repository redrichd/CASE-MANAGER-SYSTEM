/**
 * 報表匯出服務 (5-Tab 完整月報表聚合器與 Web Application 傳輸)
 */

/**
 * 將西元年與月份轉為民國年月字串
 * @param {number} year 西元年 (例如: 2026)
 * @param {number} month 月份 (1~12)
 * @returns {string} 例如: "115年03月"
 */
export function formatRocMonth(year, month) {
  const rocYear = year - 1911;
  const monthPad = String(month).padStart(2, '0');
  return `${rocYear}年${monthPad}月`;
}

/**
 * 計算兩日期字串之間的天數差
 */
function getDaysDiff(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr.replace(/\//g, '-'));
  const end = new Date(endDateStr.replace(/\//g, '-'));
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const diffTime = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}

/**
 * 過濾出指定西元年月之個案
 */
export function filterCasesByMonth(cases = [], year, month) {
  const targetPrefix = `${year}/${String(month).padStart(2, '0')}`;
  const targetIsoPrefix = `${year}-${String(month).padStart(2, '0')}`;

  return cases.filter(item => {
    const caseDate = item.date || item.approvalDate || item.aUnitNotifyDate || '';
    return caseDate.startsWith(targetPrefix) || caseDate.startsWith(targetIsoPrefix);
  });
}

/**
 * 建立 Sheet 1: 派案情形回復表 (2D Array)
 */
export function buildSheet1Matrix(cases = [], aUnitName = "悠康事業有限公司附設新北市私立悠康居家長照機構") {
  const bUnitMap = {};

  cases.forEach(item => {
    const bName = item.bUnitName || '未指定B單位';
    if (!bUnitMap[bName]) {
      bUnitMap[bName] = {
        name: bName,
        ba: 0, bb: 0, bc: 0,
        ca: 0, cb: 0, cc: 0, cd: 0,
        transport: 0,
        homeRespite: 0, dayRespite: 0, instRespite: 0,
        smallScale: 0, cStation: 0, shortRespite: 0,
        remark: item.delayReason || item.stopReason || ''
      };
    }

    const svc = item.serviceContent || '';
    if (svc.includes('BA')) bUnitMap[bName].ba += 1;
    if (svc.includes('BB')) bUnitMap[bName].bb += 1;
    if (svc.includes('BC')) bUnitMap[bName].bc += 1;
    if (svc.includes('CA')) bUnitMap[bName].ca += 1;
    if (svc.includes('CB')) bUnitMap[bName].cb += 1;
    if (svc.includes('CC')) bUnitMap[bName].cc += 1;
    if (svc.includes('CD')) bUnitMap[bName].cd += 1;
    if (svc.includes('交通') || svc.includes('交')) bUnitMap[bName].transport += 1;
    if (svc.includes('居喘')) bUnitMap[bName].homeRespite += 1;
    if (svc.includes('日喘')) bUnitMap[bName].dayRespite += 1;
    if (svc.includes('機喘')) bUnitMap[bName].instRespite += 1;
    if (svc.includes('小規模')) bUnitMap[bName].smallScale += 1;
    if (svc.includes('巷弄') || svc.includes('C')) bUnitMap[bName].cStation += 1;
    if (svc.includes('短照')) bUnitMap[bName].shortRespite += 1;
  });

  const bUnits = Object.values(bUnitMap);
  const totalCases = cases.length;
  const cmsDispatches = cases.filter(c => c.dispatchType !== '當月自行發掘').length;
  const selfDispatches = cases.filter(c => c.dispatchType === '當月自行發掘').length;

  if (bUnits.length === 0) {
    return [[
      aUnitName, 1, totalCases, cmsDispatches, selfDispatches,
      "無派案紀錄", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ""
    ]];
  }

  return bUnits.map((b, index) => [
    index === 0 ? aUnitName : '',
    index + 1,
    index === 0 ? totalCases : '',
    index === 0 ? cmsDispatches : '',
    index === 0 ? selfDispatches : '',
    b.name,
    b.ba, b.bb, b.bc,
    b.ca, b.cb, b.cc, b.cd,
    b.transport,
    b.homeRespite, b.dayRespite, b.instRespite,
    b.smallScale, b.cStation, b.shortRespite,
    b.remark
  ]);
}

/**
 * 建立 Sheet 2: 其他長照服務資源連結表
 */
export function buildSheet2Matrix(cases = [], aUnitName = "悠康事業有限公司附設新北市私立悠康居家長照機構") {
  const referrals = cases.filter(c => c.referralTarget || c.referralDate);
  if (referrals.length === 0) {
    return [[
      1, aUnitName, "新莊區", "115X0000", "", "無轉介單位",
      "無轉介說明", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      "", "無", "否", "否"
    ]];
  }

  return referrals.map((item, index) => [
    index + 1,
    aUnitName,
    item.area || "新莊區",
    item.id || "",
    item.referralDate || item.date || "",
    item.referralTarget || item.bUnitName || "",
    item.anomalySummary || item.delayReason || "轉介資源評估與連結",
    0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    item.referralReplyDate || "",
    item.anomalySummary || "持續追蹤中",
    item.hasReferralForm ? "是" : "否",
    item.isCMSRecorded ? "是" : "否"
  ]);
}

/**
 * 建立 Sheet 3: 轉介醫事C巷弄長照站連結表
 */
export function buildSheet3Matrix(cases = [], aUnitName = "悠康事業有限公司附設新北市私立悠康居家長照機構") {
  const cCases = cases.filter(c => (c.serviceContent || '').includes('C') || (c.referralTarget || '').includes('C站'));

  if (cCases.length === 0) {
    return [[
      1, aUnitName, "", "", "新莊區", "無醫事C單位", "115X0000", "無",
      0, 0, 0, 0, 0, "是", "否", "考量中", ""
    ]];
  }

  return cCases.map((item, index) => [
    index + 1,
    aUnitName,
    item.referralDate || item.date || "",
    item.bUnitReplyDate || "",
    item.area || "新莊區",
    item.bUnitName || item.referralTarget || "醫事C長照站",
    item.id || "",
    item.name || "",
    0, 0, 1, 0, 0,
    item.isCMSRecorded ? "是" : "否",
    item.hasReferralForm ? "是" : "否",
    "穩定服務中",
    item.anomalySummary || ""
  ]);
}

function mapToDropdownServiceItem(rawSvc = '') {
  if (rawSvc.includes('BB') || rawSvc.includes('日照')) return '日照BB碼';
  if (rawSvc.includes('BC') || rawSvc.includes('家托')) return '家托BC碼';
  if (rawSvc.includes('C') || rawSvc.includes('專業')) return '專業C碼';
  if (rawSvc.includes('G') || rawSvc.includes('喘息')) return '喘息G碼';
  return '居服BA碼';
}

/**
 * 建立 Sheet 4: 追蹤B碼服務時效性回復表
 */
export function buildSheet4Matrix(cases = [], aUnitName = "悠康事業有限公司附設新北市私立悠康居家長照機構") {
  const bUnitStats = {};

  cases.forEach(item => {
    const bName = item.bUnitName || '未指定B單位';
    const serviceItem = mapToDropdownServiceItem(item.serviceContent || '');
    const groupKey = `${bName}_${serviceItem}`;

    if (!bUnitStats[groupKey]) {
      bUnitStats[groupKey] = {
        name: bName,
        serviceItem: serviceItem,
        total: 0,
        d1_3: 0, d4_5: 0, d6_7: 0, d8_13: 0, d14plus: 0
      };
    }

    bUnitStats[groupKey].total += 1;
    const diffDays = getDaysDiff(item.aUnitNotifyDate || item.date, item.firstServiceDate || item.bUnitReplyDate);

    if (diffDays <= 3) bUnitStats[groupKey].d1_3 += 1;
    else if (diffDays <= 5) bUnitStats[groupKey].d4_5 += 1;
    else if (diffDays <= 7) bUnitStats[groupKey].d6_7 += 1;
    else if (diffDays <= 13) bUnitStats[groupKey].d8_13 += 1;
    else bUnitStats[groupKey].d14plus += 1;
  });

  const list = Object.values(bUnitStats);
  if (list.length === 0) {
    return [[1, "無B單位紀錄", "居服BA碼", 0, 0, 0, 0, 0, 0]];
  }

  return list.map((item, index) => [
    index + 1,
    item.name,
    item.serviceItem,
    item.total,
    item.d1_3,
    item.d4_5,
    item.d6_7,
    item.d8_13,
    item.d14plus
  ]);
}

/**
 * 建立 Sheet 5: 追蹤服務異常回復表
 */
export function buildSheet5Matrix(cases = [], aUnitName = "悠康事業有限公司附設新北市私立悠康居家長照機構", targetRocMonthStr = "115年03月") {
  const anomalies = cases.filter(c => {
    const replyDays = getDaysDiff(c.aUnitNotifyDate || c.date, c.bUnitReplyDate);
    const serviceDays = getDaysDiff(c.bUnitReplyDate || c.aUnitNotifyDate || c.date, c.firstServiceDate);
    const totalDays = getDaysDiff(c.aUnitNotifyDate || c.date, c.firstServiceDate);
    return replyDays > 3 || serviceDays > 7 || totalDays > 3 || c.anomalySummary || c.delayReason || c.status === '延遲';
  });

  if (anomalies.length === 0) {
    return [[
      1, aUnitName, "三重區", "無異常單位", "115X0000", targetRocMonthStr,
      "BA碼", "案家原因", "", "", "", 0, "無異常", "服務過程順利無延遲異常", "持續服務", "", ""
    ]];
  }

  return anomalies.map((item, index) => {
    const replyDays = getDaysDiff(item.aUnitNotifyDate || item.date, item.bUnitReplyDate);
    const serviceDays = getDaysDiff(item.bUnitReplyDate || item.aUnitNotifyDate || item.date, item.firstServiceDate);
    const maxDays = Math.max(replyDays, serviceDays, getDaysDiff(item.aUnitNotifyDate || item.date, item.firstServiceDate));

    return [
      index + 1,
      aUnitName,
      item.area || "三重區",
      item.bUnitName || "服務單位",
      item.id || "",
      targetRocMonthStr,
      item.serviceContent || "B碼",
      item.anomalyCategory || "個案因素",
      item.date || "",
      item.aUnitNotifyDate || item.date || "",
      `單位回復 ${item.bUnitReplyDate || ''}\n第一次服務 ${item.firstServiceDate || ''}`,
      maxDays > 0 ? maxDays : 4,
      item.anomalyReasonType || (replyDays > 3 ? "單位回復逾期" : "服務開工逾期"),
      item.anomalySummary || item.delayReason || "配合家屬時間排定服務",
      "已開始服務並持續關懷辦理",
      "", ""
    ];
  });
}

/**
 * 執行完整 5-Tab 月報表匯出 (透過 Form POST 直連新頁面，100% 避免 CORS 問題)
 */
export async function exportMonthlyReport({ cases = [], year, month, aUnitName, exportType = 'sheet' }) {
  const rocMonthStr = formatRocMonth(year, month);
  const filteredCases = filterCasesByMonth(cases, year, month);

  const payload = {
    targetMonthStr: rocMonthStr,
    aUnitFullName: aUnitName || "悠康事業有限公司附設新北市私立悠康居家長照機構",
    exportType: exportType, // 'sheet' 或 'excel'
    sheet1Data: buildSheet1Matrix(filteredCases, aUnitName),
    sheet2Data: buildSheet2Matrix(filteredCases, aUnitName),
    sheet3Data: buildSheet3Matrix(filteredCases, aUnitName),
    sheet4Data: buildSheet4Matrix(filteredCases, aUnitName),
    sheet5Data: buildSheet5Matrix(filteredCases, aUnitName, rocMonthStr)
  };

  const gasUrl = import.meta.env.VITE_GAS_REPORT_EXPORT_URL;

  if (!gasUrl) {
    console.warn("⚠️ VITE_GAS_REPORT_EXPORT_URL 未設定，開啟範本網址。");
    const fallbackUrl = exportType === 'excel'
      ? `https://docs.google.com/spreadsheets/d/10gAo61b7d3_V4DMcxApDmfqNiDANAoet5z3vmcxVSrM/export?format=xlsx`
      : `https://docs.google.com/spreadsheets/d/10gAo61b7d3_V4DMcxApDmfqNiDANAoet5z3vmcxVSrM/edit`;

    window.open(fallbackUrl, '_blank');
    return {
      success: true,
      isSimulated: true,
      fileName: `新北市A區月報表_${rocMonthStr}`
    };
  }

  // 建立動態 HTML Form 進行表單提交
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = gasUrl;
  form.target = '_blank'; // 開啟新視窗/新分頁

  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'payload';
  input.value = JSON.stringify(payload);
  form.appendChild(input);

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);

  return {
    success: true,
    fileName: `新北市A區月報表_${rocMonthStr}`
  };
}
