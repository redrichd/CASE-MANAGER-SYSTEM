# 任務列表：長照個案派案管理系統

**輸入**: 來自 `/specs/001-case-dispatch/` 的設計文件

**前提條件**: plan.md (必填), spec.md (使用者故事必填), research.md, data-model.md, contracts/

**測試**: 本專案遵循憲法規範，實施測試驅動開發 (TDD) 的精神。所有核心邏輯皆包含測試任務，且需先撰寫測試確保失敗後再實作。

**組織結構**: 任務依使用者故事 (User Story) 進行分組，以便獨立實作和測試每個故事。

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**: 代表可並行執行（不同檔案，無相依關係）
- **[Story]**: 該任務所屬的使用者故事（例如：US1, US2, US3, US4）
- 描述中需包含確切的檔案路徑

---

## Phase 1: 專案設定 (共享基礎設施)

**目的**: 專案初始化與基礎結構建立

- [x] T001 根據實作計畫書建立專案目錄結構
- [x] T002 初始化具有 React、Tailwind CSS、Lucide React 依賴項的專案
- [x] T003 [P] 設定 ESLint 與 Prettier 代碼格式化工具以規範品質
- [x] T004 [P] 設定 Vitest 測試框架於 package.json

---

## Phase 2: 基礎建設 (阻擋性前提任務)

**目的**: 在實作任何使用者故事之前，「必須」完成的核心基礎建設

**⚠️ 關鍵警告**: 在此階段完成前，不得開始任何使用者故事的工作。

- [x] T005 實作共用 Context 管理 In-Memory 狀態（個案與單位資料）於 src/contexts/CaseContext.jsx 與 src/contexts/UnitContext.jsx
- [x] T006 [P] 實作共用 Dialog 與防呆確認元件於 src/components/ConfirmDialog.jsx
- [x] T007 [P] 實作台灣假日與補班日判定常數與邏輯於 src/utils/twCalendar.js
- [x] T008 配置全域環境變數與 API 客戶端於 src/services/geminiClient.js

**檢查點**: 基礎建設就緒——使用者故事實作現在可以並行開始。

---

## Phase 3: 使用者故事 1 - 個案建立與時效管控 (優先級：P1) 🎯 MVP

**目標**: 實作個案建立表單與自動時效展延計算，並在逾期時強制要求填寫逾時說明。

**獨立測試方法**: 執行時效計算單元測試，並於網頁輸入照專起日，檢查是否正確顯示中午 12:00 完成期限及逾期攔截。

### 使用者故事 1 的測試

> **注意：必須先編寫這些測試，並確保在實作前測試失敗**

- [x] T009 [P] [US1] 於 tests/unit/deadlineCalculator.test.js 撰寫自動時效展延計算邏輯的單元測試
- [x] T010 [P] [US1] 於 tests/integration/caseForm.test.js 撰寫個案表單輸入與逾時攔截的整合測試

### 使用者故事 1 的實作

- [x] T011 [P] [US1] 實作時效計算工具函式於 src/utils/deadlineCalculator.js
- [x] T012 [P] [US1] 建立個案表單元件於 src/components/CaseForm.jsx，整合時效計算與逾期時強制要求填寫 delayReason 邏輯
- [x] T013 [US1] 整合 CaseForm.jsx 至主頁面以供新增與編輯個案

**檢查點**: 此時，使用者故事 1 應該是完全可用且能獨立測試的。

---

## Phase 4: 使用者故事 2 - 公平輪排派案 (優先級：P1)

**目標**: 實作 B 單位公平輪排排序邏輯（首發、輪值、停派梯隊）與重複派案二次確認。

**獨立測試方法**: 執行排序演算法單元測試，並在個案編輯派案時選擇近期已成功派案的單位，檢查是否彈出警告。

### 使用者故事 2 的測試

- [x] T014 [P] [US2] 於 tests/unit/unitSorter.test.js 撰寫輪排排序演算法與過濾邏輯的單元測試
- [x] T015 [P] [US2] 於 tests/integration/dispatchWarning.test.js 撰寫重複派案二次確認的整合測試

### 使用者故事 2 的實作

- [x] T016 [P] [US2] 實作單位排序與過濾算法工具函式於 src/utils/unitSorter.js
- [x] T017 [US2] 於 src/components/CaseForm.jsx 整合 B 單位下拉選單，根據服務內容過濾並隱藏停派單位
- [x] T018 [US2] 於 src/components/CaseForm.jsx 實作重複派案攔截與警告對話框邏輯

**檢查點**: 此時，使用者故事 1 和故事 2 都應該能獨立運作。

---

## Phase 5: 使用者故事 3 - AI 智能輔助撰寫 (優先級：P2)

**目標**: 整合 Gemini API，實作白話逾時說明潤飾為正式公文說明，以及一鍵生成派案交接短訊。

**獨立測試方法**: 點擊潤飾按鈕，檢查逾時說明是否轉換為 50-100 字正式文字；點擊交接按鈕，檢查剪貼簿中是否有複製的完整交接簡訊。

### 使用者故事 3 的測試

- [x] T019 [P] [US3] 於 tests/unit/aiService.test.js 撰寫 AI 服務的 Mock 單元測試

### 使用者故事 3 的實作

- [x] T020 [P] [US3] 實作 AI 整合服務於 src/services/aiService.js，包含潤飾逾時說明與生成交接短訊
- [x] T021 [US3] 於 src/components/CaseForm.jsx 整合 AI 潤飾按鈕與交接短訊生成/複製功能

**檢查點**: 使用者故事 1, 2, 3 現在都應該能獨立運作。

---

## Phase 6: 使用者故事 4 - 案件狀態與列表管理 (優先級：P2)

**目標**: 實作個案、結案、單位三大分頁視圖切換與全域關鍵字模糊搜尋，以及結案防呆鎖定。

**獨立測試方法**: 點擊各頁籤切換，於搜尋列輸入關鍵字測試模糊搜尋，並操作個案結案檢查是否移至結案分頁且唯讀。

### 使用者故事 4 的測試

- [x] T022 [P] [US4] 於 tests/integration/viewManagement.test.js 撰寫分頁切換與模糊搜尋的整合測試

### 使用者故事 4 的實作

- [x] T023 [P] [US4] 實作個案列表視圖元件於 src/pages/ActiveCases.jsx，支援搜尋與編輯/結案操作
- [x] T024 [P] [US4] 實作已結案列表視圖元件於 src/pages/ClosedCases.jsx，呈現唯讀狀態
- [x] T025 [P] [US4] 實作單位狀態列表視圖元件於 src/pages/Units.jsx，顯示統計數據與排序順位
- [x] T026 [US4] 於主要應用程式元件 src/App.jsx 整合導覽列與分頁切換邏輯

**檢查點**: 所有使用者故事現在都應該能獨立運作。

---

## Phase 7: 收尾與跨功能考量

**目的**: 影響多個使用者故事的改進與優化

- [x] T027 於 docs/ 中更新系統使用說明文檔
- [x] T028 程式碼清理與 ESLint 靜態檢查修正
- [x] T029 執行 quickstart.md 驗證前端應用啟動與測試是否正常

---

## 依賴關係與執行順序

### 階段依賴關係

- **專案設定 (Phase 1)**: 無相依性——可立即開始。
- **基礎建設 (Phase 2)**: 依賴設定階段完成——會「阻擋」所有使用者故事的實作。
- **使用者故事 (Phase 3+)**: 均依賴基礎建設階段的完成。
  - 各使用者故事隨後可並行進行（若有人力分工）。
  - 或按優先順序（P1 → P2）依序實作。
- **收尾階段 (Final Phase)**: 依賴於所有選定實作的使用者故事完成。

### 使用者故事相依性

- **使用者故事 1 (P1)**: 可在基礎建設（Phase 2）完成後開始——不依賴其他故事。
- **使用者故事 2 (P1)**: 可在基礎建設（Phase 2）完成後開始——在表單中整合，但邏輯獨立。
- **使用者故事 3 (P2)**: 依賴 US1（於表單中提供 AI 潤飾）與 US2。
- **使用者故事 4 (P2)**: 依賴 US1、US2、US3 元件完整性，用以呈現並搜尋所有資料。

### 並行機會

- 所有標記為 [P] 的任務可以並行開發。例如，在 US1 階段，`deadlineCalculator.test.js` 的撰寫 (T009) 可以與 `caseForm.test.js` 的撰寫 (T010) 並行。

---

## 並行範例：使用者故事 1

```bash
# 同時啟動使用者故事 1 的所有測試：
任務: "於 tests/unit/deadlineCalculator.test.js 撰寫自動時效展延計算邏輯的單元測試"
任務: "於 tests/integration/caseForm.test.js 撰寫個案表單輸入與逾時攔截的整合測試"

# 同時啟動使用者故事 1 的核心邏輯與表單元件：
任務: "實效計算工具函式於 src/utils/deadlineCalculator.js"
任務: "建立個案表單元件於 src/components/CaseForm.jsx"
```

---

## 實作策略

### MVP 優先 (僅限使用者故事 1)

1. 完成 Phase 1: 專案設定
2. 完成 Phase 2: 基礎建設 (關鍵——阻擋所有故事)
3. 完成 Phase 3: 使用者故事 1 (個案建立與時效管控)
4. **停止並驗證**: 獨立測試使用者故事 1 確保時效管控合規。
