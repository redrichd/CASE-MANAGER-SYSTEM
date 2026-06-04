import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
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

describe('UnitEditModal Integration Test', () => {
  it('should allow opening the modal and adding comments to a selected unit', async () => {
    renderWithProviders(<CaseForm onClose={() => {}} />);
    
    // Select a B Unit
    const bUnitSelect = screen.getByLabelText(/指派 B 單位/);
    await act(async () => {
      fireEvent.change(bUnitSelect, { target: { value: '大同居家照顧服務所' } });
    });

    // Check if Edit Unit button appears
    const editBtn = screen.getByRole('button', { name: '編輯單位' });
    expect(editBtn).toBeInTheDocument();

    // Click Edit Unit button
    await act(async () => {
      fireEvent.click(editBtn);
    });

    // Check if modal opens
    expect(screen.getByText(/編輯單位 - 大同居家照顧服務所/)).toBeInTheDocument();

    // Add a comment
    const authorInput = screen.getByPlaceholderText(/姓名 \(實名\)/);
    const contentTextarea = screen.getByPlaceholderText(/留言內容/);
    const addCommentBtn = screen.getByRole('button', { name: '新增留言' });

    await act(async () => {
      fireEvent.change(authorInput, { target: { value: '張三' } });
      fireEvent.change(contentTextarea, { target: { value: '測試留言內容' } });
      fireEvent.click(addCommentBtn);
    });

    // Expect comment to be in the list
    expect(screen.getByText('張三')).toBeInTheDocument();
    expect(screen.getByText('測試留言內容')).toBeInTheDocument();

    // Close/Save modal
    const modalContainer = screen.getByText(/編輯單位 - 大同居家照顧服務所/).closest('.fixed');
    const saveBtn = within(modalContainer).getByRole('button', { name: /儲存/ });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    // Modal should be closed
    expect(screen.queryByText(/編輯單位 - 大同居家照顧服務所/)).not.toBeInTheDocument();
  });
});
