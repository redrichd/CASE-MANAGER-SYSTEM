/**
 * 將全形字元轉換為半形字元，並將全形空格轉換為半形空格
 * @param {string} str
 * @returns {string}
 */
export function toHalfWidth(str) {
  if (!str) return '';
  return str
    .replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/\u3000/g, ' ');
}

/**
 * 解析複製貼上的日期時間字串，支援民國年、西元年、全形半形、各種分隔符號
 * @param {string} inputStr 輸入的字串，例如 "115/05/04 19:33:15" 或 "１１５／０５／０４　１９：３３：１５"
 * @param {'date' | 'datetime-local'} type 目標輸入欄位類型
 * @returns {string | null} 格式化後的結果字串 (YYYY-MM-DD 或 YYYY-MM-DDTHH:mm:ss)，解析失敗傳回 null
 */
export function parsePastedDateTime(inputStr, type = 'datetime-local') {
  if (!inputStr) return null;
  
  // 1. 轉為半形並去除前後空格
  const cleaned = toHalfWidth(inputStr).trim();
  
  // 2. 提取所有連續數字
  const parts = cleaned.match(/\d+/g);
  if (!parts || parts.length < 3) {
    return null;
  }
  
  // 3. 解析年、月、日
  let year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  // 驗證月、日合理性
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  
  // 民國年轉換 (小於 1000 視為民國年)
  if (year < 1000) {
    year += 1911;
  }
  
  const yyyy = String(year);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  
  if (type === 'date') {
    return `${yyyy}-${mm}-${dd}`;
  }
  
  // 4. 解析時、分、秒
  const hour = parts[3] ? parseInt(parts[3], 10) : 0;
  const minute = parts[4] ? parseInt(parts[4], 10) : 0;
  const second = parts[5] ? parseInt(parts[5], 10) : 0;
  
  // 驗證時間合理性
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
    return null;
  }
  
  const hh = String(hour).padStart(2, '0');
  const min = String(minute).padStart(2, '0');
  const ss = String(second).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
}
