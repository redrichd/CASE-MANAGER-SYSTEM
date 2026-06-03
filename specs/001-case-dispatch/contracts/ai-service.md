# AI Service Contract

本系統透過 `@google/generative-ai` 與 Gemini 互動，內部封裝為 `AiService` 提供以下介面：

## 1. 逾時說明潤飾 (`polishDelayReason`)
- **Input**: `text: string` (原始白話說明)
- **Output**: `Promise<string>` (潤飾後的正式說明，50-100 字)
- **Error Handling**: API 超時或失敗時，拋出例外由 UI 層接手，允許使用者保留原文字。

## 2. 生成交接短訊 (`generateDispatchMessage`)
- **Input**: `caseData: Case` (個案完整物件)
- **Output**: `Promise<string>` (供 Line/Email 複製的專業交接短訊)
