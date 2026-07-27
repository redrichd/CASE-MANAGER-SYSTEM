# 資料模型 (Data Model)：長照個案派案管理系統

## 核心實體

### 1. Case (個案)
| 欄位名稱 | 型別 | 說明 | 驗證規則 |
|---------|------|------|----------|
| `id` | String | 案號 (例: FL20093001) | 必填，唯一 |
| `name` | String | 個案姓名 | 必填 |
| `gender` | String | 性別 | `'M'` 或 `'F'` |
| `supervisor` | String | 督導/個管員姓名 | 必填 |
| `area` | String | 責任區域 | 依個管員自動帶入 |
| `superApprovalDate` | String | 初評第一次督導核定通過日 | 格式 `YYYY-MM-DDTHH:mm` |
| `approvalDate` | String | 計畫最初送審日 | 格式 `YYYY-MM-DDTHH:mm` |
| `deadlineDate` | String | 系統規定完成期限 | 系統自動計算產出 |
| `submitDate` | String | 照顧計劃審核通過日 | 格式 `YYYY-MM-DDTHH:mm` |
| `status` | String | 時效狀態 | `'時效內'` 或 `'超時效'` |
| `delayReason` | String | 時效逾時說明 | 當 `status` 為 `'超時效'` 時必填 |
| `dispatchType` | String | 派案類別 | `'新案_初評'`, `'複評'`, `'自行發掘'` 等 |
| `serviceContent` | String | 服務內容 | 例：`'BA'`, `'D'` 等 |
| `bUnitName` | String | 派案 B 單位名稱 | 關聯至 Unit |
| `dispatchResult` | String | 派案結果 | 例：`'服務提供'`, `'違規停派'` 等 |
| `secondRoundReason` | String | 第二輪/無法接案原因說明 | 特定派案結果時必填 |
| `aUnitNotifyDate` | String | A單位照會服務單位日 | 格式 `YYYY-MM-DD` |
| `bUnitStartDate` | String | B單位預計首次進場日 | 格式 `YYYY-MM-DD` |
| `bUnitReplyDate` | String | B單位回復日期 (單位回覆日) | 格式 `YYYY-MM-DD`，五大表欄位 |
| `firstServiceDate` | String | 第一次服務日期 (實際進場日) | 格式 `YYYY-MM-DD`，五大表欄位 |
| `anomalyReasonType` | String | 異常原因分類 | `'單位因素'`, `'案家因素'`, `'其他因素'` |
| `anomalyCategory` | String | 異常事項/品質類別 | 例：`超過天數`/`配合家屬時間` |
| `anomalySummary` | String | 異常內容摘要與處置情形 | 異常狀況詳細文字紀錄 |
| `referralTarget` | String | 轉介資源項目 | 例：`失智據點`, `緊急救援`, `家照服務` 等 |
| `hasReferralForm` | Boolean | 是否有轉介單 | 預設 `true` |
| `isCMSRecorded` | Boolean | 是否完成 CMS 服務紀錄登記 | 預設 `true` |
| `isUnitCounseling` | Boolean | 是否需要單位輔導 | 預設 `false` |
| `isClosed` | Boolean | 是否已結案 | 預設 `false` |

### 2. Unit (派案單位)
| 欄位名稱 | 型別 | 說明 | 驗證規則 |
|---------|------|------|----------|
| `id` | String | 單位唯一識別碼 | 必填，唯一 |
| `name` | String | 單位名稱 | 必填 |
| `services` | Array<String> | 支援服務陣列 | 預設 `['BA']` |
| `isStopped` | Boolean | 是否停派 | 預設 `false` |
| `stopCount` | Number | 違規停派次數 | 違規停派時觸發 +1 |
| `rating` | Number | 單位評等星級 (1-5) | 可由管理者/編輯彈窗調整 |
| `codeDispatchCount` | Number | 該服務碼別成功派案次數 | 動態計算，用於碼別輪序 |

## 狀態轉換

- **活躍個案 -> 結案**: 當使用者觸發結案動作，並通過二次確認防呆後，`isClosed` 設為 `true`。個案移至「已結案存檔」頁面。
- **結案個案 -> 資料補全與重複編輯**: 結案個案保持 `isClosed: true` 歸檔狀態，但使用者隨時可在「已結案存檔」頁點擊「編輯」或「補全」開啟表單更新任何欄位（如 B單位回復日期、轉介資源等）。
- **結案個案 -> 恢復在案 (Reopen)**: 點擊「重開」按鈕並確認後，系統呼叫 `reopenCase` 將 `isClosed` 變更為 `false`，個案重新回歸「進行中個案」列表。
- **單位輪排狀態**:
  - 成功次數為 0: 首發梯隊（悠康機構優先，其餘次數少者優先）。
  - 違規停派: 自動變更 `isStopped = true` 且 `stopCount + 1`。
