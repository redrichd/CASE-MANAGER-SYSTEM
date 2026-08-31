import { isWorkday } from './twCalendar';

/**
 * 計算完成期限
 * @param {string} startIsoString YYYY-MM-DDTHH:mm 格式
 * @returns {string} YYYY-MM-DDTHH:mm 格式 (例如 2026-06-03T12:00)
 */
export function calculateDeadline(startIsoString) {
  if (!startIsoString) return '';
  const startDate = new Date(startIsoString);
  if (isNaN(startDate.getTime())) return '';

  // 1. 判斷是否為下午 (>= 12:00)
  const hours = startDate.getHours();
  const minutes = startDate.getMinutes();
  const isAfternoon = hours > 12 || (hours === 12 && minutes >= 0);
  const requiredDays = isAfternoon ? 3 : 2;

  // 2. 尋找工作日。起日如果是工作日，則算為第 1 天；若不是，則順延至第一個工作日為第 1 天。
  const currentDate = new Date(startDate);
  currentDate.setHours(12, 0, 0, 0);

  let workdaysFound = 1;
  if (!isWorkday(currentDate)) {
    while (!isWorkday(currentDate)) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // 尋找剩餘的工作日
  while (workdaysFound < requiredDays) {
    currentDate.setDate(currentDate.getDate() + 1);
    if (isWorkday(currentDate)) {
      workdaysFound++;
    }
  }

  const yyyy = currentDate.getFullYear();
  const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
  const dd = String(currentDate.getDate()).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd}T12:00`;
}

/**
 * 計算照會時間與首次服務時間之間的工作天數，並判斷超過工作天數
 * @param {string} notifyIso 照會時間 (YYYY-MM-DDTHH:mm 或 YYYY-MM-DD)
 * @param {string} firstServiceIso 首次服務時間 (YYYY-MM-DDTHH:mm 或 YYYY-MM-DD)
 * @param {number} limitDays 規定工作天上限 (預設 3 個工作天)
 * @returns {{ overdueDays: number, isOverdue: boolean, workdaysTaken: number }}
 */
export function calculateWorkdayOverdueDays(notifyIso, firstServiceIso, limitDays = 3) {
  if (!notifyIso || !firstServiceIso) {
    return { overdueDays: 0, isOverdue: false, workdaysTaken: 0 };
  }

  const notifyDate = new Date(notifyIso);
  const firstServiceDate = new Date(firstServiceIso);

  if (isNaN(notifyDate.getTime()) || isNaN(firstServiceDate.getTime())) {
    return { overdueDays: 0, isOverdue: false, workdaysTaken: 0 };
  }

  if (firstServiceDate <= notifyDate) {
    return { overdueDays: 0, isOverdue: false, workdaysTaken: 0 };
  }

  const startDate = new Date(notifyDate);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(firstServiceDate);
  endDate.setHours(0, 0, 0, 0);

  let workdaysTaken = 0;
  const current = new Date(startDate);

  // 跨天走訪，若當天為工作日則採計
  while (current < endDate) {
    current.setDate(current.getDate() + 1);
    if (isWorkday(current)) {
      workdaysTaken++;
    }
  }

  const overdueDays = workdaysTaken > limitDays ? workdaysTaken - limitDays : 0;
  const isOverdue = overdueDays > 0;

  return { overdueDays, isOverdue, workdaysTaken };
}

