import { describe, it, expect } from 'vitest';
import { calculateUnitStats, sortUnits } from '../../src/utils/unitSorter';

describe('Unit Sorter & Stats Calculator', () => {
  const mockUnits = [
    { id: 'U001', name: '單位A', services: ['BA'], isStopped: false },
    { id: 'U002', name: '單位B', services: ['BA', 'D'], isStopped: false },
    { id: 'U003', name: '單位C', services: ['BA'], isStopped: false },
    { id: 'U004', name: '單位D', services: ['D'], isStopped: false },
    { id: 'U005', name: '單位E', services: ['BA'], isStopped: true },
  ];

  const mockCases = [
    {
      id: 'C001',
      bUnitName: '單位A',
      dispatchResult: '服務提供',
      submitDate: '2026-06-01T10:00',
      isClosed: false,
    },
    {
      id: 'C002',
      bUnitName: '單位B',
      dispatchResult: '服務提供(第二輪)',
      submitDate: '2026-06-02T14:00',
      isClosed: false,
    },
    {
      id: 'C003',
      bUnitName: '單位A',
      dispatchResult: '案主指定(本單位)',
      submitDate: '2026-06-03T11:00',
      isClosed: false,
    },
    {
      id: 'C004',
      bUnitName: '單位C',
      dispatchResult: '違規停派',
      submitDate: '2026-06-03T15:00',
      isClosed: false,
    },
  ];

  it('should calculate statistics correctly', () => {
    const stats = calculateUnitStats(mockUnits, mockCases);
    
    const unitA = stats.find(u => u.name === '單位A');
    expect(unitA.dispatchCount).toBe(2);
    expect(unitA.successCount).toBe(1);
    expect(unitA.designatedThis).toBe(1);
    expect(unitA.latestSuccessTime).toBe(new Date('2026-06-01T10:00').getTime());

    const unitC = stats.find(u => u.name === '單位C');
    expect(unitC.dispatchCount).toBe(1);
    expect(unitC.successCount).toBe(0);
    expect(unitC.stopCount).toBe(1);
    expect(unitC.latestSuccessTime).toBe(0);
  });

  it('should override statistics when overrideStats is present', () => {
    const unitsWithOverride = [
      {
        id: 'U001',
        name: '單位A',
        services: ['BA'],
        isStopped: false,
        overrideStats: {
          dispatchCount: 10,
          successCount: 5,
          designatedThis: 3,
          designatedOther: 2,
          stopCount: 1,
          latestSuccessTime: 1234567890
        }
      }
    ];
    const stats = calculateUnitStats(unitsWithOverride, mockCases);
    const unitA = stats.find(u => u.name === '單位A');
    expect(unitA.dispatchCount).toBe(10);
    expect(unitA.successCount).toBe(5);
    expect(unitA.designatedThis).toBe(3);
    expect(unitA.designatedOther).toBe(2);
    expect(unitA.stopCount).toBe(1);
    expect(unitA.latestSuccessTime).toBe(1234567890);
  });

  it('should sort units based on rating and ID', () => {
    const stats = calculateUnitStats(mockUnits, mockCases);
    // 設置不同的 rating 以測試星級排序
    stats[0].rating = 2; // 單位A (U001)
    stats[2].rating = 3; // 單位C (U003)
    
    const sorted = sortUnits(stats);

    // 單位C (3星) 應該最前，其次為 單位A (2星)，其餘0星依 ID 排序
    expect(sorted[0].name).toBe('單位C');
    expect(sorted[1].name).toBe('單位A');
    expect(sorted[2].name).toBe('單位B'); // U002
    expect(sorted[3].name).toBe('單位D'); // U004
    expect(sorted[4].name).toBe('單位E'); // isStopped
  });
});

