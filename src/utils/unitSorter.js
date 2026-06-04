/**
 * 計算各單位的派案統計數據
 * @param {Array} units 
 * @param {Array} cases 
 * @returns {Array} 包含統計數據的單位陣列
 */
export function calculateUnitStats(units, cases) {
  const successResults = new Set(['服務提供', '服務提供(第二輪)', '出備已派案']);

  return units.map((unit) => {
    if (unit.overrideStats) {
      return {
        ...unit,
        dispatchCount: typeof unit.overrideStats.dispatchCount === 'number' ? unit.overrideStats.dispatchCount : 0,
        successCount: typeof unit.overrideStats.successCount === 'number' ? unit.overrideStats.successCount : 0,
        designatedThis: typeof unit.overrideStats.designatedThis === 'number' ? unit.overrideStats.designatedThis : 0,
        designatedOther: typeof unit.overrideStats.designatedOther === 'number' ? unit.overrideStats.designatedOther : 0,
        stopCount: typeof unit.overrideStats.stopCount === 'number' ? unit.overrideStats.stopCount : 0,
        latestSuccessTime: unit.overrideStats.latestSuccessTime || 0,
      };
    }

    const unitCases = cases.filter(
      (c) => c.bUnitName === unit.name && c.dispatchResult
    );

    let dispatchCount = unitCases.length;
    let successCount = 0;
    let designatedThis = 0;
    let designatedOther = 0;
    let stopCount = 0;
    let latestSuccessTime = 0;

    unitCases.forEach((c) => {
      const result = c.dispatchResult;
      
      if (successResults.has(result)) {
        successCount++;
        if (c.submitDate) {
          const time = new Date(c.submitDate).getTime();
          if (!isNaN(time) && time > latestSuccessTime) {
            latestSuccessTime = time;
          }
        }
      } else if (result === '案主指定(本單位)') {
        designatedThis++;
      } else if (result === '案主指定(外單位)') {
        designatedOther++;
      } else if (result === '違規停派') {
        stopCount++;
      }
    });

    return {
      ...unit,
      dispatchCount,
      successCount,
      designatedThis,
      designatedOther,
      stopCount,
      latestSuccessTime,
    };
  });
}

/**
 * 依據公平輪序邏輯對單位進行排序
 * @param {Array} unitsWithStats 
 * @returns {Array} 排序後的單位陣列
 */
export function sortUnits(unitsWithStats) {
  const firstTier = [];  // 首發梯隊: successCount = 0 & isStopped = false
  const secondTier = []; // 輪值梯隊: successCount > 0 & isStopped = false
  const stoppedTier = []; // 停派梯隊: isStopped = true

  unitsWithStats.forEach((unit) => {
    if (unit.isStopped) {
      stoppedTier.push(unit);
    } else if (unit.successCount === 0) {
      firstTier.push(unit);
    } else {
      secondTier.push(unit);
    }
  });

  firstTier.sort((a, b) => a.id.localeCompare(b.id));

  secondTier.sort((a, b) => {
    if (a.latestSuccessTime !== b.latestSuccessTime) {
      return a.latestSuccessTime - b.latestSuccessTime;
    }
    return a.id.localeCompare(b.id);
  });

  stoppedTier.sort((a, b) => a.id.localeCompare(b.id));

  return [...firstTier, ...secondTier, ...stoppedTier];
}
