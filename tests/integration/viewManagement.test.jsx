import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../../src/App';

describe('App View Management & Searching', () => {
  it('should switch between tabs correctly', async () => {
    render(<App />);

    // 預設應顯示「新增個案」按鈕（即 ActiveCases 視圖）
    expect(screen.getByText('新增個案')).toBeInTheDocument();

    // 點擊「結案」頁籤 (精確匹配，避免匹配到表格內「結案歸檔」按鈕)
    const closedTab = screen.getByRole('button', { name: /^結案$/ });
    await act(async () => {
      fireEvent.click(closedTab);
    });

    // 應顯示「歸檔個案詳細資料」（即 ClosedCases 視圖）
    expect(screen.getByText('歸檔個案詳細資料')).toBeInTheDocument();
    expect(screen.queryByText('新增個案')).not.toBeInTheDocument();
  });

  it('should filter cases based on keyword search', async () => {
    render(<App />);

    // 預設應有「王小明」（活躍個案）
    expect(screen.getByText('王小明')).toBeInTheDocument();

    // 輸入搜尋關鍵字「張大同」
    const searchInput = screen.getByPlaceholderText(/搜尋案號、姓名、督導姓名/);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: '張大同' } });
    });

    // 應僅顯示「張大同」，而「王小明」被過濾
    expect(screen.getByText('張大同')).toBeInTheDocument();
    expect(screen.queryByText('王小明')).not.toBeInTheDocument();
  });
});
