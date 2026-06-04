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
});
