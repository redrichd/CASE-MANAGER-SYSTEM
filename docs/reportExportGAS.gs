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

const TEMPLATE_FILE_ID = "10gAo61b7d3_V4DMcxApDmfqNiDANAoet5z3vmcxVSrM";

function doPost(e) {
  try {
    let contents;
    if (e.parameter && e.parameter.payload) {
      contents = JSON.parse(e.parameter.payload);
    } else if (e.postData && e.postData.contents) {
      contents = JSON.parse(e.postData.contents);
    } else {
      throw new Error("找不到有效的報表資料");
    }

    const {
      targetMonthStr, // 例: "115年03月"
      aUnitFullName = "悠康事業有限公司附設新北市私立悠康居家長照機構",
      sheet1Data = [],
      sheet2Data = [],
      sheet3Data = [],
      sheet4Data = [],
      sheet5Data = [],
      exportType = "sheet" // 'sheet' 或 'excel'
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
        sheet1.getRange(8, 1, sheet1Data.length, sheet1Data[0].length).setValues(sheet1Data);

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
      sheet4.getRange("A3").setValue(`(${targetMonthStr})`);
      sheet4.getRange("C3").setValue(aUnitFullName);
      if (sheet4Data.length > 0) {
        sheet4.getRange(7, 1, sheet4Data.length, sheet4Data[0].length).setValues(sheet4Data);
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

    const fileId = newFile.getId();
    const sheetUrl = newSpreadsheet.getUrl();
    const excelDownloadUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`;
    const targetRedirectUrl = (exportType === 'excel') ? excelDownloadUrl : sheetUrl;

    // 回傳包含自動跳轉指令的 HTML
    return HtmlService.createHtmlOutput(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>正在開啟月報表...</title>
        </head>
        <body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f1f5f9; color: #1e293b;">
          <div style="text-align: center; background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; max-width: 400px;">
            <div style="width: 48px; h-48px; margin: 0 auto 16px; background: #2563eb; color: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold;">✓</div>
            <h2 style="color: #1e3a8a; margin: 0 0 8px 0; font-size: 20px;">月報表生成成功！</h2>
            <p style="color: #64748b; font-size: 14px; margin: 0 0 20px 0;">正在自動為您開啟新建的 5 張表格...</p>
            <a href="${targetRedirectUrl}" target="_self" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px;">如果頁面未自動跳轉，請點此開啟</a>
            <script>
              setTimeout(function() {
                window.location.href = "${targetRedirectUrl}";
              }, 500);
            </script>
          </div>
        </body>
      </html>`
    );

  } catch (error) {
    return HtmlService.createHtmlOutput(`<h3>生成失敗: ${error.message}</h3>`);
  }
}
