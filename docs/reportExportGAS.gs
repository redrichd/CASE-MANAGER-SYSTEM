/**
 * Google Apps Script Web App for Case Manager System Report Export
 * 
 * 部署說明：
 * 1. 前往 Google Apps Script (https://script.google.com/) 建立新專案。
 * 2. 將此檔案程式碼複製貼上至 Code.gs。
 * 3. 點擊右上角「部署」->「新增部署作業」。
 * 4. 種類選擇「Web 應用程式 (Web App)」。
 * 5. 設定：
 *    - 執行身分 (Execute as): 我 (Me)
 *    - 誰能存取 (Who has access): 所有人 (Anyone)
 * 6. 部署後將獲得的 Web App URL 設定給 React 專案的 .env:
 *    VITE_GAS_REPORT_EXPORT_URL="https://script.google.com/macros/s/..."
 */

const TEMPLATE_FILE_ID = "1JxBoHr6orfsqyCMpGsBkZuEN8Q8H3u8d";

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const {
      targetMonthStr, // 例: "115年03月"
      aUnitFullName = "悠康事業有限公司附設新北市私立悠康居家長照機構",
      sheet1Data = [],
      sheet2Data = [],
      sheet3Data = [],
      sheet4Data = [],
      sheet5Data = []
    } = contents;

    // 1. 複製雲端硬碟中的 5-Tab 範本檔
    const templateFile = DriveApp.getFileById(TEMPLATE_FILE_ID);
    const newFileName = `新北市A區月報表_${targetMonthStr.replace(/[()]/g, '')}`;
    const newFile = templateFile.makeCopy(newFileName);
    const newSpreadsheet = SpreadsheetApp.openById(newFile.getId());

    // 2. 處理 Sheet 1: 派案情形回復表
    const sheet1 = newSpreadsheet.getSheetByName("派案情形回復表");
    if (sheet1) {
      sheet1.getRange("U2").setValue(`(${targetMonthStr})`);
      if (sheet1Data.length > 0) {
        // 從第 8 列開始填寫資料
        sheet1.getRange(8, 1, sheet1Data.length, sheet1Data[0].length).setValues(sheet1Data);

        // 若資料大於 1 列，對左側固定資訊 (欄 A~E) 執行跨列垂直合併，使圖表邊框美觀
        if (sheet1Data.length > 1) {
          sheet1.getRange(8, 1, sheet1Data.length, 1).mergeVertically(); // A: A單位名稱
          sheet1.getRange(8, 2, sheet1Data.length, 1).mergeVertically(); // B: 序號
          sheet1.getRange(8, 3, sheet1Data.length, 1).mergeVertically(); // C: 單位總在案量
          sheet1.getRange(8, 4, sheet1Data.length, 1).mergeVertically(); // D: 照管當月派案量
          sheet1.getRange(8, 5, sheet1Data.length, 1).mergeVertically(); // E: 當月自行發掘
        }

        // 高亮標註同一或關聯單位（如「悠康」開頭單位設為黃底紅字）
        for (let i = 0; i < sheet1Data.length; i++) {
          const bUnitName = String(sheet1Data[i][5] || '');
          if (bUnitName.includes('悠康')) {
            const cell = sheet1.getRange(8 + i, 6);
            cell.setBackground('#FFFF00').setFontColor('#CC0000').setFontWeight('bold');
          }
        }
      }
    }

    // 3. 處理 Sheet 2: 其他長照服務資源連結表
    const sheet2 = newSpreadsheet.getSheetByName("其他長照服務資源連結表");
    if (sheet2) {
      sheet2.getRange("W1").setValue(`(${targetMonthStr})`);
      if (sheet2Data.length > 0) {
        sheet2.getRange(6, 1, sheet2Data.length, sheet2Data[0].length).setValues(sheet2Data);
      }
    }

    // 4. 處理 Sheet 3: 轉介醫事C巷弄長照站連結表
    const sheet3 = newSpreadsheet.getSheetByName("轉介醫事C巷弄長照站連結表");
    if (sheet3) {
      sheet3.getRange("Q2").setValue(`(${targetMonthStr})`);
      if (sheet3Data.length > 0) {
        sheet3.getRange(5, 1, sheet3Data.length, sheet3Data[0].length).setValues(sheet3Data);
      }
    }

    // 5. 處理 Sheet 4: 追蹤B碼服務時效性回復表
    const sheet4 = newSpreadsheet.getSheetByName("追蹤B碼服務時效性回復表");
    if (sheet4) {
      sheet4.getRange("H1").setValue(`(${targetMonthStr})`);
      sheet4.getRange("C2").setValue(aUnitFullName);
      if (sheet4Data.length > 0) {
        sheet4.getRange(5, 1, sheet4Data.length, sheet4Data[0].length).setValues(sheet4Data);
      }
    }

    // 6. 處理 Sheet 5: 追蹤服務異常回復表
    const sheet5 = newSpreadsheet.getSheetByName("追蹤服務異常回復表");
    if (sheet5) {
      sheet5.getRange("P2").setValue(`(${targetMonthStr})`);
      if (sheet5Data.length > 0) {
        sheet5.getRange(5, 1, sheet5Data.length, sheet5Data[0].length).setValues(sheet5Data);
      }
    }

    SpreadsheetApp.flush();

    // 取得 Google Sheet 檢視連結與 Excel 直接下載連結
    const fileId = newFile.getId();
    const sheetUrl = newSpreadsheet.getUrl();
    const excelDownloadUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`;

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: fileId,
      sheetUrl: sheetUrl,
      excelDownloadUrl: excelDownloadUrl,
      fileName: newFileName
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message || String(error)
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
