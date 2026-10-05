import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { UnitProvider, useUnits } from '../../src/contexts/UnitContext';
import { StaffProvider, useStaff } from '../../src/contexts/StaffContext';
import { CaseProvider, useCases } from '../../src/contexts/CaseContext';
import { SERVICE_AREAS } from '../../src/constants/dispatchConstants';

describe('Area Migration to 永和區 Test', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('SERVICE_AREAS should include 永和區 and not 板中永區', () => {
    expect(SERVICE_AREAS).toContain('永和區');
    expect(SERVICE_AREAS).not.toContain('板中永區');
  });

  it('StaffContext should migrate legacy local_areas and local_staff_list from 板中永區 to 永和區', () => {
    localStorage.setItem(
      'local_areas',
      JSON.stringify(['新莊區', '三重區', '板中永區'])
    );
    localStorage.setItem(
      'local_staff_list',
      JSON.stringify([
        { empId: '999', name: '測試員', gender: 'F', area: '板中永區', title: '個管員' }
      ])
    );

    const { result } = renderHook(() => useStaff(), {
      wrapper: StaffProvider,
    });

    expect(result.current.areas).toContain('永和區');
    expect(result.current.areas).not.toContain('板中永區');

    const migratedStaff = result.current.staffList.find(s => s.empId === '999');
    expect(migratedStaff).toBeDefined();
    expect(migratedStaff.area).toBe('永和區');
  });

  it('UnitContext should migrate legacy local_units with 板中永區 to 永和區', () => {
    localStorage.setItem(
      'local_units',
      JSON.stringify([
        { id: 'U999', name: '測試機構', services: ['BA'], serviceAreas: ['三重區', '板中永區'], isStopped: false, comments: [] }
      ])
    );

    const { result } = renderHook(() => useUnits(), {
      wrapper: UnitProvider,
    });

    const migratedUnit = result.current.units.find(u => u.id === 'U999');
    expect(migratedUnit).toBeDefined();
    expect(migratedUnit.serviceAreas).toContain('永和區');
    expect(migratedUnit.serviceAreas).not.toContain('板中永區');
  });

  it('CaseContext should migrate legacy cases with 板中永區 to 永和區', () => {
    localStorage.setItem(
      'local_cases',
      JSON.stringify([
        { id: 'CASE999', name: '王老伯', area: '板中永區', isClosed: false }
      ])
    );

    const { result } = renderHook(() => useCases(), {
      wrapper: CaseProvider,
    });

    const migratedCase = result.current.cases.find(c => c.id === 'CASE999');
    expect(migratedCase).toBeDefined();
    expect(migratedCase.area).toBe('永和區');
  });
});
