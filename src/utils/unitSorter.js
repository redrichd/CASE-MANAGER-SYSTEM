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
      }
    });

    const caseStopCount = unitCases.filter(c => c.dispatchResult === '違規停派').length;
    const stopCount = typeof unit.stopCount === 'number' ? unit.stopCount : caseStopCount;

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
 * 依據星級評分對單位進行排序 (星級越高越前面，同星級依 ID 排序)
 * @param {Array} unitsWithStats 
 * @returns {Array} 排序後的單位陣列
 */
export function sortUnits(unitsWithStats) {
  const activeUnits = [];
  const stoppedUnits = [];

  unitsWithStats.forEach((unit) => {
    if (unit.isStopped) {
      stoppedUnits.push(unit);
    } else {
      activeUnits.push(unit);
    }
  });

  // 排序活躍單位：優先依據星級 (由大到小)，其次依據 ID
  activeUnits.sort((a, b) => {
    const ratingA = a.rating || 0;
    const ratingB = b.rating || 0;
    if (ratingA !== ratingB) {
      return ratingB - ratingA;
    }
    return a.id.localeCompare(b.id);
  });

  // 排序停派單位：依據 ID
  stoppedUnits.sort((a, b) => a.id.localeCompare(b.id));

  return [...activeUnits, ...stoppedUnits];
}
