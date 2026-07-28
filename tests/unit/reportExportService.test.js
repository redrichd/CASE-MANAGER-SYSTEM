import { describe, it, expect } from 'vitest';
import {
  formatRocMonth,
  filterCasesByMonth,
  buildSheet1Matrix,
  buildSheet2Matrix,
  buildSheet3Matrix,
  buildSheet4Matrix,
  buildSheet5Matrix
} from '../../src/services/reportExportService';

describe('reportExportService', () => {
  it('correctly converts West year and month to Republic of China year string', () => {
    expect(formatRocMonth(2026, 3)).toBe('115年03月');
    expect(formatRocMonth(2026, 12)).toBe('115年12月');
  });

  it('filters cases by target year and month', () => {
    const mockCases = [
      { id: '1', date: '2026/03/05' },
      { id: '2', date: '2026/04/10' },
      { id: '3', date: '2026-03-20' }
    ];
    const filtered = filterCasesByMonth(mockCases, 2026, 3);
    expect(filtered.length).toBe(2);
    expect(filtered.map(c => c.id)).toEqual(['1', '3']);
  });

  it('generates Sheet 1 matrix with valid structure and columns', () => {
    const mockCases = [
      { id: '1', serviceContent: 'BA,居喘', bUnitName: '大同居服' },
      { id: '2', serviceContent: 'BB', bUnitName: '中山長照' }
    ];
    const matrix = buildSheet1Matrix(mockCases, '悠康機構');
    expect(matrix.length).toBe(2);
    expect(matrix[0][0]).toBe('悠康機構'); // A單位名稱
    expect(matrix[0][1]).toBe(1); // 序號
    expect(matrix[0][5]).toBe('大同居服'); // B單位名稱
    expect(matrix[0][6]).toBe(1); // BA
    expect(matrix[0][14]).toBe(1); // 居喘
  });

  it('generates Sheet 2, 3, 4, and 5 matrices without crashing on empty or filled data', () => {
    const mockCases = [
      {
        id: 'FL20093001',
        name: '王小明',
        area: '新莊區',
        date: '2026/03/01',
        aUnitNotifyDate: '2026/03/01',
        firstServiceDate: '2026/03/04',
        bUnitName: '大同居服',
        serviceContent: 'BA,C',
        referralTarget: '新莊照管中心',
        anomalySummary: '延遲原因說明'
      }
    ];

    const s2 = buildSheet2Matrix(mockCases);
    const s3 = buildSheet3Matrix(mockCases);
    const s4 = buildSheet4Matrix(mockCases);
    const s5 = buildSheet5Matrix(mockCases, '悠康機構', '115年03月');

    expect(s2.length).toBeGreaterThan(0);
    expect(s3.length).toBeGreaterThan(0);
    expect(s4.length).toBeGreaterThan(0);
    expect(s5.length).toBeGreaterThan(0);

    expect(s4[0][1]).toBe('大同居服');
    expect(s4[0][4]).toBe(1); // 1-3天內的派案數

    // 測試全無資料時回傳空陣列
    expect(buildSheet2Matrix([])).toEqual([]);
    expect(buildSheet3Matrix([])).toEqual([]);
    expect(buildSheet4Matrix([])).toEqual([]);
    expect(buildSheet5Matrix([])).toEqual([]);
  });
});

