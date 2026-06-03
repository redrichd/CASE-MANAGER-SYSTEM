// 台灣 2026 國定假日與補班日定義 (可依需求擴充)
export const TW_HOLIDAYS = new Set([
  '2026-01-01', // 元旦
  '2026-02-13', // 春節除夕前一日
  '2026-02-16', // 春節
  '2026-02-17', // 春節
  '2026-02-18', // 春節
  '2026-02-19', // 春節
  '2026-02-20', // 春節調整放假
  '2026-02-27', // 和平紀念日調整放假
  '2026-04-02', // 兒童節調整放假
  '2026-04-03', // 民族掃墓節
  '2026-05-01', // 勞動節
  '2026-06-19', // 端午節調整放假
  '2026-09-25', // 中秋節調整放假
]);

export const TW_MAKEUP_WORKDAYS = new Set([
  '2026-02-07', // 春節補班
  '2026-06-06', // 端午補班
  '2026-09-12', // 中秋補班
]);

/**
 * 判斷指定日期是否為工作日
 * @param {Date} date
 * @returns {boolean}
 */
export function isWorkday(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // 1. 先確認是否為補班日 (補班日必為工作日)
  if (TW_MAKEUP_WORKDAYS.has(dateStr)) {
    return true;
  }

  // 2. 確認是否為國定假日
  if (TW_HOLIDAYS.has(dateStr)) {
    return false;
  }

  // 3. 確認是否為週末 (星期六 = 6, 星期日 = 0)
  const day = date.getDay();
  if (day === 0 || day === 6) {
    return false;
  }

  return true;
}
