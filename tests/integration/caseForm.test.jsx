import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CaseForm from '../../src/components/CaseForm';
import { CaseProvider } from '../../src/contexts/CaseContext';
import { UnitProvider } from '../../src/contexts/UnitContext';
import { StaffProvider } from '../../src/contexts/StaffContext';

const renderWithProviders = (ui) => {
  return render(
    <CaseProvider>
      <UnitProvider>
        <StaffProvider>
          {ui}
        </StaffProvider>
      </UnitProvider>
    </CaseProvider>
  );
};

describe('CaseForm Integration Test', () => {
  it('should render form fields correctly and auto-calculate deadline when approvalDate changes', async () => {
    renderWithProviders(<CaseForm onClose={() => {}} />);
    
    expect(screen.getByText(/案主姓名/)).toBeInTheDocument();
    
    const approvalInput = screen.getByLabelText(/計畫最初送審日/);
    
    await act(async () => {
      fireEvent.change(approvalInput, { target: { value: '2026-06-01T10:00' } });
    });

    const deadlineDiv = screen.getByText('2026-06-02 12:00');
    expect(deadlineDiv).toBeInTheDocument();
  });

  it('should show overtime warning and delay reason field when submitDate is past deadlineDate', async () => {
    renderWithProviders(<CaseForm onClose={() => {}} />);
    
    const approvalInput = screen.getByLabelText(/計畫最初送審日/);
    const submitInput = screen.getByLabelText(/照顧計劃審核通過日/);

    await act(async () => {
      fireEvent.change(approvalInput, { target: { value: '2026-06-01T10:00' } });
      fireEvent.change(submitInput, { target: { value: '2026-06-03T10:00' } });
    });

    expect(screen.getByText(/系統檢測：已逾時效，必須填寫逾時說明/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/請輸入白話逾時原因/)).toBeInTheDocument();
  });

  it('should parse and set datetime correctly when a date string is pasted', async () => {
    renderWithProviders(<CaseForm onClose={() => {}} />);
    
    const approvalInput = screen.getByLabelText(/計畫最初送審日/);
    
    await act(async () => {
      fireEvent.paste(approvalInput, {
        clipboardData: {
          getData: (format) => format === 'text' ? '１１５／０５／０４　１９：３３：１５' : ''
        }
      });
    });

    expect(approvalInput.value.startsWith('2026-05-04T19:33:15')).toBe(true);
  });

  it('should allow aUnitNotifyDate on the same day as approvalDate/submitDate, and block only if earlier', async () => {
    renderWithProviders(<CaseForm onClose={() => {}} />);
    
    const approvalInput = screen.getByLabelText(/計畫最初送審日/);
    const submitInput = screen.getByLabelText(/照顧計劃審核通過日/);
    const notifyInput = screen.getByLabelText(/A單位照會服務單位日/);

    // Set approval date and submit date to 2026-07-06 with time components
    await act(async () => {
      fireEvent.change(approvalInput, { target: { value: '2026-07-06T10:04:33' } });
      fireEvent.change(submitInput, { target: { value: '2026-07-06T11:10:15' } });
    });

    // 1. Same day: 2026-07-06 => Should be valid (no warning text)
    await act(async () => {
      fireEvent.change(notifyInput, { target: { value: '2026-07-06T10:00' } });
    });
    expect(screen.queryByText(/照會日不可早於審核通過日/)).not.toBeInTheDocument();

    // 2. Earlier day: 2026-07-05 => Should trigger warning text
    await act(async () => {
      fireEvent.change(notifyInput, { target: { value: '2026-07-05T10:00' } });
    });
    expect(screen.getByText(/照會日不可早於審核通過日 \(2026-07-06\)/)).toBeInTheDocument();
  });

  it('should auto-calculate overdue days based on aUnitNotifyDate and firstServiceDate, and support anomaly summary dropdown with custom input', async () => {
    renderWithProviders(<CaseForm onClose={() => {}} />);

    // 驗證「服務單位回復日期」已被移除
    expect(screen.queryByText(/服務單位回復日期/)).not.toBeInTheDocument();

    // 驗證第 1 項首次服務日期與第 2 項超過天數
    expect(screen.getByText(/首次服務日期 \(實際進場日\)/)).toBeInTheDocument();
    expect(screen.getByText(/超過天數 \(系統自動計算\)/)).toBeInTheDocument();

    // 設定 A單位照會服務單位日
    const notifyInput = screen.getByLabelText(/A單位照會服務單位日/);
    await act(async () => {
      fireEvent.change(notifyInput, { target: { value: '2026-06-08T09:00' } });
    });

    // 設定首次服務日期
    const firstServiceInput = screen.getByLabelText(/首次服務日期/);
    await act(async () => {
      fireEvent.change(firstServiceInput, { target: { value: '2026-06-15T09:00' } });
    });

    // 驗證自動計算超過天數 (超過 4.5 天會顯示警告與天數)
    expect(screen.getByText(/已超過 4.5 天進場/)).toBeInTheDocument();

    // 驗證原因分類選擇
    const reasonSelect = screen.getByLabelText(/原因分類/);
    await act(async () => {
      fireEvent.change(reasonSelect, { target: { value: '案家' } });
    });

    // 必填提示出現
    expect(screen.getAllByText(/\*必填/).length).toBeGreaterThanOrEqual(2);

    // 驗證異常內容摘述下拉選單選「其他」時出現手動輸入框
    const anomalySummarySelect = screen.getByLabelText(/異常內容摘述/);
    await act(async () => {
      fireEvent.change(anomalySummarySelect, { target: { value: '其他' } });
    });

    const customInput = screen.getByPlaceholderText(/請手動輸入異常內容摘述/);
    expect(customInput).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(customInput, { target: { value: '家屬要求延期' } });
    });
    expect(customInput.value).toBe('家屬要求延期');
  });
});
