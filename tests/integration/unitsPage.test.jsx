import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import Units from '../../src/pages/Units';
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

describe('Units Page Integration Test', () => {
  it('should allow adding a unit with rating and initial comment, and display it in the list', async () => {
    renderWithProviders(<Units />);

    // Click "新增合作單位"
    const addBtn = screen.getByRole('button', { name: /新增合作單位/ });
    await act(async () => {
      fireEvent.click(addBtn);
    });

    // Modal should open
    expect(screen.getByText('新增合作單位', { selector: 'h3' })).toBeInTheDocument();

    // Fill form fields
    const nameInput = screen.getByPlaceholderText('請輸入單位完整名稱');
    const ratingBtns = screen.getAllByRole('button').filter(btn => btn.querySelector('svg.lucide-star'));
    const authorInput = screen.getByPlaceholderText('個管師姓名 (實名)');
    const commentInput = screen.getByPlaceholderText('請輸入留言內容...');

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: '超優秀居家護理所' } });
      // Click 3rd star to set 3 stars
      fireEvent.click(ratingBtns[2]);
      fireEvent.change(authorInput, { target: { value: '王個管' } });
      fireEvent.change(commentInput, { target: { value: '這是一個超級棒的單位！' } });
    });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: '確認建立' });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Check if new unit is added with 3 stars
    expect(screen.getByText('超優秀居家護理所')).toBeInTheDocument();
    
    // Check if rating stars are rendered in unit row (should render 3 stars)
    const unitRow = screen.getByText('超優秀居家護理所').closest('tr');
    const stars = unitRow.querySelectorAll('svg.lucide-star');
    expect(stars.length).toBe(3);

    // Open Edit Modal for this unit
    const editBtn = within(unitRow).getByRole('button', { name: '編輯' });
    await act(async () => {
      fireEvent.click(editBtn);
    });

    // Should see initial comment in the edit modal comments list
    expect(screen.getByText(/王個管/)).toBeInTheDocument();
    expect(screen.getByText(/這是一個超級棒的單位/)).toBeInTheDocument();

    // Select the rating buttons in the Edit modal
    const editRatingBtns = screen.getAllByRole('button').filter(btn => btn.title && btn.title.includes('星'));
    // Click the 3rd star button again (currently rating is 3) to toggle to 0
    await act(async () => {
      fireEvent.click(editRatingBtns[2]);
    });

    // Save changes
    const saveBtn = screen.getByRole('button', { name: /儲存資料/ });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    // The rating stars should be gone (0 stars)
    const updatedStars = unitRow.querySelectorAll('svg.lucide-star');
    expect(updatedStars.length).toBe(0);
  });

  it('should allow admin editing unit stats and resetting them to 0', async () => {
    renderWithProviders(<Units />);

    // Find the first unit row (e.g. U001)
    const unitRow = screen.getByText('ID: U001').closest('tr');
    
    // Click "管理員編輯"
    const adminEditBtn = within(unitRow).getByRole('button', { name: '管理員編輯' });
    await act(async () => {
      fireEvent.click(adminEditBtn);
    });

    // Check modal title
    expect(screen.getByText(/管理員編輯 - /)).toBeInTheDocument();

    // Find form inputs
    const inputs = screen.getAllByRole('spinbutton');
    // Spinbuttons are: 總派案數, 成功輪派數, 指定本單位數, 指定它單位數, 違規停派數
    expect(inputs.length).toBe(5);

    // Modify values
    await act(async () => {
      fireEvent.change(inputs[0], { target: { value: '15' } }); // Dispatch
      fireEvent.change(inputs[1], { target: { value: '8' } });  // Success
      fireEvent.change(inputs[2], { target: { value: '4' } });  // Designated This
      fireEvent.change(inputs[3], { target: { value: '3' } });  // Designated Other
      fireEvent.change(inputs[4], { target: { value: '1' } });  // Stop
    });

    // Save changes
    const saveBtn = screen.getByRole('button', { name: '儲存變更' });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    // Check if table cells updated
    // Table columns:
    // index 0: 順位
    // index 1: 單位名稱
    // index 2: 服務內容
    // index 3: 總派案
    // index 4: 成功輪派
    // index 5: 指定本單位
    // index 6: 指定它單位
    // index 7: 違規停派
    const cellsBeforeReset = unitRow.querySelectorAll('td');
    expect(cellsBeforeReset[3].textContent).toBe('15');
    expect(cellsBeforeReset[4].textContent).toBe('8');
    expect(cellsBeforeReset[5].textContent).toBe('4');
    expect(cellsBeforeReset[6].textContent).toBe('3');
    expect(cellsBeforeReset[7].textContent).toBe('1');

    // Re-open Admin Edit
    await act(async () => {
      fireEvent.click(adminEditBtn);
    });

    // Re-query inputs since the modal was closed and reopened
    const inputs2 = screen.getAllByRole('spinbutton');
    expect(inputs2.length).toBe(5);

    // Click "一鍵歸零"
    const resetBtn = screen.getByRole('button', { name: '一鍵歸零' });
    await act(async () => {
      fireEvent.click(resetBtn);
    });

    // Values of inputs should be "0"
    inputs2.forEach(input => {
      expect(input.value).toBe('0');
    });

    // Save again
    const saveBtn2 = screen.getByRole('button', { name: '儲存變更' });
    await act(async () => {
      fireEvent.click(saveBtn2);
    });

    // Value counts in the row should be updated to 0 (or at least render 0)
    // Note: 0 might match multiple cells, so we can verify the text content
    const cells = unitRow.querySelectorAll('td');
    // dispatchCount (idx 3), successCount (idx 4), designatedThis (idx 5), designatedOther (idx 6), stopCount (idx 7)
    expect(cells[3].textContent).toBe('0');
    expect(cells[4].textContent).toBe('0');
    expect(cells[5].textContent).toBe('0');
    expect(cells[6].textContent).toBe('0');
    expect(cells[7].textContent).toBe('0');
  });
});

