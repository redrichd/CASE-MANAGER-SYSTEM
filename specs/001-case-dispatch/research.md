# 實作前研究與技術評估：長照個案派案管理系統

## 1. 狀態管理 (In-Memory State Management)
- **Decision**: 使用 React Context API 搭配 `useReducer`。
- **Rationale**: 系統目前無後端資料庫，需在前端維持個案列表、B 單位清單以及時效等狀態。由於有跨元件狀態共享需求（例如：從新增表單到列表視圖的資料傳遞），Context API 配合 `useReducer` 提供輕量且結構化的解決方案，符合單一資料流原則。
- **Alternatives considered**: 
  - Redux: 對於初期 In-Memory 系統過於龐大。
  - Zustand: 較輕量且適合，但 Context API 內建於 React，無需額外依賴即可完成。

## 2. 時效計算引擎 (Deadline Calculation)
- **Decision**: 實作自訂的純函式工具模組 `deadlineCalculator.js`。
- **Rationale**: 時效計算需考量週末、國定假日 (TW_HOLIDAYS) 以及補班日 (TW_MAKEUP_WORKDAYS)。使用純函式易於撰寫單元測試，確保時效計算 100% 準確。
- **Alternatives considered**: 
  - date-fns / dayjs 擴充：可以結合第三方套件，但假日邏輯具備高度在地化與定製化特性，自訂實作更具彈性。

## 3. Gemini API 整合
- **Decision**: 使用官方 `@google/generative-ai` SDK，並將 API Key 暫存於環境變數。
- **Rationale**: 官方 SDK 提供良好的介面與錯誤處理機制。
- **Alternatives considered**: 
  - 直打 REST API：需手動處理 HTTP 請求，較為繁瑣。
