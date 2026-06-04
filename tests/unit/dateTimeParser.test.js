import { describe, it, expect } from 'vitest';
import { toHalfWidth, parsePastedDateTime } from '../../src/utils/dateTimeParser';

describe('dateTimeParser', () => {
  describe('toHalfWidth', () => {
    it('should convert full-width numbers and punctuation to half-width', () => {
      expect(toHalfWidth('１２３')).toBe('123');
      expect(toHalfWidth('：／－')).toBe(':/-');
      expect(toHalfWidth('１１５／０５／０４　１９：３３：１５')).toBe('115/05/04 19:33:15');
    });
  });

  describe('parsePastedDateTime', () => {
    it('should parse half-width ROC calendar with seconds', () => {
      const result = parsePastedDateTime('115/05/04 19:33:15', 'datetime-local');
      expect(result).toBe('2026-05-04T19:33:15');
    });

    it('should parse full-width ROC calendar with seconds', () => {
      const result = parsePastedDateTime('１１５／０５／０４　１９：３３：１５', 'datetime-local');
      expect(result).toBe('2026-05-04T19:33:15');
    });

    it('should parse ROC calendar with spaces and full-width/half-width combinations', () => {
      const result = parsePastedDateTime('民國 115 年 05 月 04 日 19 : 33 : 15', 'datetime-local');
      expect(result).toBe('2026-05-04T19:33:15');
    });

    it('should parse AD calendar with seconds', () => {
      const result = parsePastedDateTime('2026/06/04 15:59:00', 'datetime-local');
      expect(result).toBe('2026-06-04T15:59:00');
    });

    it('should fallback to 00 if seconds are missing', () => {
      const result = parsePastedDateTime('115/05/04 19:33', 'datetime-local');
      expect(result).toBe('2026-05-04T19:33:00');
    });

    it('should parse date only for date-type input', () => {
      const result = parsePastedDateTime('115/05/04 19:33:15', 'date');
      expect(result).toBe('2026-05-04');
    });

    it('should parse date only when no time is provided', () => {
      const result = parsePastedDateTime('115/05/04', 'datetime-local');
      expect(result).toBe('2026-05-04T00:00:00');
    });

    it('should return null for invalid inputs', () => {
      expect(parsePastedDateTime('abc', 'datetime-local')).toBeNull();
      expect(parsePastedDateTime('', 'datetime-local')).toBeNull();
      expect(parsePastedDateTime('115/13/45 19:33:15', 'datetime-local')).toBeNull();
    });
  });
});
