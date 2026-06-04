import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CaseForm from '../../src/components/CaseForm';
import { CaseProvider } from '../../src/contexts/CaseContext';
import { UnitProvider } from '../../src/contexts/UnitContext';

const renderWithProviders = (ui) => {
  return render(
    <CaseProvider>
      <UnitProvider>
        {ui}
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
});
