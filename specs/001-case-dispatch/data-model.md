# 資料模型 (Data Model)：長照個案派案管理系統

## 核心實體

### 1. Case (個案)
| 欄位名稱 | 型別 | 說明 | 驗證規則 |
|---------|------|------|----------|
| `id` | String | 案號 (例: FL20093001) | 必填，唯一 |
| `name` | String | 個案姓名 | 必填 |
| `gender` | String | 性別 | `'M'` 或 `'F'` |
| `supervisor` | String | 督導/個管員姓名 | 必填 |
| `approvalDate` | String | 計畫最初送審日 | 格式 `YYYY-MM-DDTHH:mm` |
| `deadlineDate` | String | 系統規定完成期限 | 系統自動計算產出 |
| `submitDate` | String | 照顧計劃審核通過日 | 格式 `YYYY-MM-DDTHH:mm` |
| `status` | String | 時效狀態 | `'時效內'` 或 `'超時效'` |
| `delayReason` | String | 時效逾時說明 | 當 `status` 為 `'超時效'` 時必填 |
| `dispatchType` | String | 派案類別 | `'新案'` 或 `'複評'` |
| `serviceContent` | String | 服務內容 | 例：`'BA'`, `'D'` 等 |
| `bUnitId` | String | 派案 B 單位 ID | 關聯至 Unit |
| `dispatchResult` | String | 派案結果 | 例：`'服務提供'`, `'違規停派'` 等 |
| `isClosed` | Boolean | 是否已結案 | 預設 `false` |

### 2. Unit (派案單位)
| 欄位名稱 | 型別 | 說明 | 驗證規則 |
|---------|------|------|----------|
| `id` | String | 單位唯一識別碼 | 必填，唯一 |
| `name` | String | 單位名稱 | 必填 |
| `services` | Array<String> | 支援服務陣列 | 預設 `['BA']` |
| `isStopped` | Boolean | 是否停派 | 預設 `false` |
| `dispatchCount` | Number | 總派案次數 | 動態計算 |
| `successCount` | Number | 輪派成功次數 | 動態計算 |
| `latestSuccessTime`| Number | 最後接案 Timestamp | 動態計算，用於排序 |

## 狀態轉換

- **活躍個案 -> 結案**: 當使用者觸發結案動作，並通過二次確認防呆後，`isClosed` 設為 `true`。結案後個案進入唯讀狀態，不可復原。
- **單位輪排狀態**:
  - `successCount = 0`: 首發梯隊。
  - `successCount > 0`: 輪值梯隊。
  - `isStopped = true`: 停派梯隊，隱藏或鎖定於清單底部。
