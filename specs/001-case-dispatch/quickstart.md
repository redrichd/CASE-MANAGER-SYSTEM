# Quickstart：長照個案派案管理系統

## 系統需求
- Node.js (v18+)
- npm 或 yarn

## 安裝與執行

1. **安裝依賴**
   ```bash
   npm install
   ```
2. **環境變數設定**
   建立 `.env` 檔案並填寫 Gemini API 金鑰：
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
3. **啟動開發伺服器**
   ```bash
   npm run dev
   ```
4. **開啟瀏覽器**
   導覽至 `http://localhost:5173`。

## 測試指令
執行單元測試以驗證時效計算與輪排邏輯：
```bash
npm run test
```
