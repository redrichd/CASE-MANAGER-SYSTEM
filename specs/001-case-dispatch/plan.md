# 實作計畫書：長照個案派案管理系統

**分支**: `[001-case-dispatch]` | **日期**: 2026-06-03 | **規格書**: [spec.md](file:///C:/Users/redri/Downloads/ANTIGRAVITY/Case%20Manager%20System/specs/001-case-dispatch/spec.md)

**輸入**: 來自 `/specs/[001-case-dispatch]/spec.md` 的功能規格書

## 摘要

本計畫旨在實作長照個案派案管理系統，主要提供自動化時效計算、公平輪排演算法以及基於 Gemini API 的智慧撰寫輔助功能。前端採用 React 與 Tailwind CSS，資料以 In-Memory 方式暫存，並透過 Context API 統一管理狀態。

## 技術上下文

**語言與版本**: Javascript

**主要依賴項**: React, TailwindCSS, Lucide React, @google/generative-ai

**儲存方案**: 前端 In-Memory (React Context API)

**測試框架**: Vitest 或 Jest (搭配 React Testing Library)

**目標平台**: 現代桌面瀏覽器 (Chrome/Safari)

**專案類型**: 網頁應用程式 (前端單頁應用)

**效能目標**: 列表排序與操作響應時間 < 500ms

**約束與限制**: AI 生成回覆延遲 < 5 秒

**規模/範疇**: 支援約 500 筆個案與 50 個單位資料於前端狀態

## 憲法檢測 (Constitution Check)

*關卡門檻：必須在 Phase 0 研究前通過。在 Phase 1 設計後重新檢查。*

- **I. 程式碼品質與靜態檢查規範**: 通過。需設置 ESLint 與 Prettier 以強制規範品質。
- **II. 測試標準與 TDD 流程**: 通過。針對 `deadlineCalculator` 與輪排邏輯需先撰寫單元測試。
- **III. 使用者體驗一致性**: 通過。將全面採用 Tailwind CSS 並封裝共用 UI 元件。
- **IV. 效能與資源消耗限制**: 通過。資料量不大，In-Memory 處理效能無虞。
- **V. 語系與文件規範**: 通過。本計畫書與各項文件皆採用繁體中文撰寫。

## 專案結構

### 文件結構 (此功能)

```text
specs/001-case-dispatch/
├── plan.md              # 本檔案
├── research.md          # 狀態管理、時效與 API 整合評估
├── data-model.md        # 核心實體結構定義
├── quickstart.md        # 啟動與測試指南
├── contracts/           # API 介面合約定義
│   └── ai-service.md
└── tasks.md             # 任務清單
```

### 原始碼結構 (專案根目錄)

```text
src/
├── components/          # 共用 UI 元件 (表單、按鈕、對話框)
├── contexts/            # React Context (CaseContext, UnitContext)
├── pages/               # 主要視圖 (ActiveCases, ClosedCases, Units)
├── services/            # 外部整合 (AiService)
├── utils/               # 純函式工具 (deadlineCalculator, sorter)
└── hooks/               # 自訂 Hooks
tests/
├── unit/                # 邏輯層單元測試
└── integration/         # 元件整合測試
```

**結構決策**: 採用標準 React SPA 結構，以功能層級劃分。將純邏輯 (utils) 與 UI 邏輯分離，確保核心業務邏輯高度可測試。
