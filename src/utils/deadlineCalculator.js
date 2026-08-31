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
 * 計算服務單位回覆日與首次服務時間之間的工作天數，並判斷是否超過規定天數 (預設 4.5 個工作天)
 * @param {string} startIso 起始時間 / 服務單位回覆日 (YYYY-MM-DDTHH:mm 或 YYYY-MM-DD)
 * @param {string} endIso 結束時間 / 首次服務日期 (YYYY-MM-DDTHH:mm 或 YYYY-MM-DD)
 * @param {number} limitDays 規定工作天上限 (預設 4.5 個工作天)
 * @returns {{ overdueDays: number, isOverdue: boolean, workingDays: number }}
 */
export function calculateWorkdayOverdueDays(startIso, endIso, limitDays = 4.5) {
  if (!startIso || !endIso) {
    return { overdueDays: 0, isOverdue: false, workingDays: 0 };
  }

  const startDate = new Date(startIso);
  const endDate = new Date(endIso);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { overdueDays: 0, isOverdue: false, workingDays: 0 };
  }

  if (endDate <= startDate) {
    return { overdueDays: 0, isOverdue: false, workingDays: 0 };
  }

  const totalMs = endDate.getTime() - startDate.getTime();

  // 走訪每一天日曆天，計算非工作日（週末與國定假日）在該時間區間內的重疊毫秒數
  let nonWorkingMs = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  const endDay = new Date(endDate);
  endDay.setHours(0, 0, 0, 0);

  while (current <= endDay) {
    if (!isWorkday(current)) {
      const dayStart = new Date(current).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const overlapStart = Math.max(startDate.getTime(), dayStart);
      const overlapEnd = Math.min(endDate.getTime(), dayEnd);

      if (overlapEnd > overlapStart) {
        nonWorkingMs += (overlapEnd - overlapStart);
      }
    }
    current.setDate(current.getDate() + 1);
  }

  const workingMs = Math.max(0, totalMs - nonWorkingMs);
  const rawWorkingDays = workingMs / (1000 * 60 * 60 * 24);
  const workingDays = Math.round(rawWorkingDays * 10) / 10;

  const isOverdue = workingDays > limitDays;
  const overdueDays = workingDays;

  return { overdueDays, isOverdue, workingDays };
}

