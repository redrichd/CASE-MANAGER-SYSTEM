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

describe('CaseForm Recent Dispatch Warning', () => {
  it('should trigger warning when dispatching to a unit with recent success case', async () => {
    renderWithProviders(<CaseForm onClose={() => {}} />);

    // 填寫所有必填欄位 (包含 required 的 approvalDate)
    const idInput = screen.getByPlaceholderText(/例: FL20093001/);
    const nameInput = screen.getByPlaceholderText(/請輸入姓名/);
    const supervisorSelect = screen.getByLabelText(/個管員/);
    const approvalInput = screen.getByLabelText(/計畫最初送審日/);
    
    fireEvent.change(idInput, { target: { value: 'FL20093005' } });
    fireEvent.change(nameInput, { target: { value: '林大宇' } });
    fireEvent.change(supervisorSelect, { target: { value: '陳個管' } });
    fireEvent.change(approvalInput, { target: { value: '2026-06-01T10:00' } });

    // 選擇「大同居家照顧服務所」
    const unitSelect = screen.getByLabelText(/指派 B 單位/);
    fireEvent.change(unitSelect, { target: { value: '大同居家照顧服務所' } });

    // 嘗試提交表單
    const saveButton = screen.getByText('儲存個案');
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // 應彈出近期重複派案提醒對話框
    expect(screen.getByText('近期重複派案提醒')).toBeInTheDocument();
    expect(screen.getByText(/該單位「大同居家照顧服務所」近期已有成功派案紀錄/)).toBeInTheDocument();
  });
});
