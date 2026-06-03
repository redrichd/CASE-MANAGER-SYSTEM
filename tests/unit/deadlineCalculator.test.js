import { describe, it, expect } from 'vitest';
import { calculateDeadline } from '../../src/utils/deadlineCalculator';

describe('Deadline Calculator', () => {
  it('should calculate deadline as +2 workdays if start time is before 12:00', () => {
    // 2026-06-01 (Monday) 10:00 < 12:00 -> should be 2026-06-02 (Tuesday) 12:00
    const deadline = calculateDeadline('2026-06-01T10:00');
    expect(deadline).toBe('2026-06-02T12:00');
  });

  it('should calculate deadline as +3 workdays if start time is at or after 12:00', () => {
    // 2026-06-01 (Monday) 12:00 -> should be 2026-06-03 (Wednesday) 12:00
    const deadline1 = calculateDeadline('2026-06-01T12:00');
    expect(deadline1).toBe('2026-06-03T12:00');

    // 2026-06-01 (Monday) 14:30 -> should be 2026-06-03 (Wednesday) 12:00
    const deadline2 = calculateDeadline('2026-06-01T14:30');
    expect(deadline2).toBe('2026-06-03T12:00');
  });

  it('should skip weekends', () => {
    // 2026-06-04 (Thursday) 14:00 (>= 12:00) -> 3 workdays
    // Day 1: 06-04 (Thu)
    // Day 2: 06-05 (Fri)
    // Weekend: 06-06 (Sat, assuming not makeup), 06-07 (Sun)
    // Day 3: 06-08 (Mon)
    // Deadline: 2026-06-08 12:00
    // Wait, 2026-06-06 is actually a makeup workday in 2026!
    // Let's use a week without makeup days to test standard weekend skipping.
    // June 8 (Mon) 14:00 (>= 12:00) -> 3 workdays
    // Day 1: 06-08 (Mon)
    // Day 2: 06-09 (Tue)
    // Day 3: 06-10 (Wed)
    // Deadline: 2026-06-10 12:00 (no weekend skipped)
    
    // Friday June 12 (Fri) 10:00 (< 12:00) -> 2 workdays
    // Day 1: 06-12 (Fri)
    // Weekend: 06-13 (Sat), 06-14 (Sun)
    // Day 2: 06-15 (Mon)
    // Deadline: 2026-06-15 12:00
    const deadline = calculateDeadline('2026-06-12T10:00');
    expect(deadline).toBe('2026-06-15T12:00');
  });

  it('should treat makeup workdays as regular workdays', () => {
    // Friday 2026-06-05 14:00 (>= 12:00) -> 3 workdays
    // Day 1: 06-05 (Fri)
    // Day 2: 06-06 (Sat, makeup workday)
    // Sunday: 06-07 (Sun, non-workday)
    // Day 3: 06-08 (Mon)
    // Deadline: 2026-06-08 12:00
    const deadline = calculateDeadline('2026-06-05T14:00');
    expect(deadline).toBe('2026-06-08T12:00');
  });

  it('should skip holidays', () => {
    // 2026-06-15 (Monday) 14:00 (>= 12:00) -> 3 workdays
    // Day 1: 06-15 (Mon)
    // Day 2: 06-16 (Tue)
    // Day 3: 06-17 (Wed) -> Wait, let's look at holidays.
    // 2026-06-19 (Friday) is a holiday (Dragon boat bridge).
    // Let's set start at 2026-06-17 (Wednesday) 14:00 (>= 12:00) -> 3 workdays
    // Day 1: 06-17 (Wed)
    // Day 2: 06-18 (Thu)
    // Holiday: 06-19 (Fri)
    // Weekend: 06-20 (Sat), 06-21 (Sun)
    // Day 3: 06-22 (Mon)
    // Deadline: 2026-06-22 12:00
    const deadline = calculateDeadline('2026-06-17T14:00');
    expect(deadline).toBe('2026-06-22T12:00');
  });

  it('should handle start date falling on a non-workday', () => {
    // Sunday 2026-06-14 10:00 (< 12:00) -> 2 workdays
    // Since start is Sunday (holiday), the first workday is 2026-06-15 (Monday).
    // Day 1: 2026-06-15 (Mon)
    // Day 2: 2026-06-16 (Tue)
    // Deadline: 2026-06-16 12:00
    const deadline = calculateDeadline('2026-06-14T10:00');
    expect(deadline).toBe('2026-06-16T12:00');
  });
});
