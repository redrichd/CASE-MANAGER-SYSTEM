import { describe, it, expect } from 'vitest';
import { polishDelayReason, generateDispatchMessage } from '../../src/services/aiService';

describe('AI Service (Fallback mode)', () => {
  it('should return a valid formal fallback delay reason if gemini is not configured', async () => {
    const rawReason = '家屬不接電話';
    const polished = await polishDelayReason(rawReason);
    expect(polished).toContain('家屬不接電話');
    expect(polished.length).toBeGreaterThan(20);
  });

  it('should return a formatted template for dispatch message if gemini is not configured', async () => {
    const caseData = {
      id: 'FL20093001',
      name: '王小明',
      gender: 'M',
      supervisor: '陳督導',
      serviceContent: 'BA',
      bUnitName: '大同居家照顧服務所',
      aUnitNotifyDate: '2026-06-01',
      bUnitStartDate: '2026-06-05',
    };

    const message = await generateDispatchMessage(caseData);
    expect(message).toContain('FL20093001');
    expect(message).toContain('王小明');
    expect(message).toContain('大同居家照顧服務所');
    expect(message).toContain('BA');
  });
});
