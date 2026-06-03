import { getGeminiModel } from './geminiClient';

/**
 * 潤飾逾時說明
 * @param {string} text 白話文草稿
 * @returns {Promise<string>} 潤飾後的正式說明 (50-100字)
 */
export async function polishDelayReason(text) {
  if (!text) return '';
  
  const model = getGeminiModel();
  if (!model) {
    return `因「${text}」，致個管員未能於規定時效內完成個案派案程序。後續將持續與相關單位及案家進行溝通與聯繫，並儘速補齊相關手續以維護個案服務權益。`;
  }

  try {
    const prompt = `請將以下關於長照派案逾時的白話草稿，潤飾為符合台灣長照A單位公文與個案紀錄規範的正式說明（字數控制在 50 至 100 字之間，使用繁體中文，且不要包含任何引號、前言或後續解釋）："${text}"`;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    return responseText;
  } catch (error) {
    console.error('Gemini API Error:', error);
    return `因「${text}」，致個管員未能於規定時效內完成個案派案程序。後續將持續與相關單位及案家進行溝通與聯繫，並儘速補齊相關手續以維護個案服務權益。`;
  }
}

/**
 * 生成派案交接訊息
 * @param {object} caseData 個案資料
 * @returns {Promise<string>} 交接訊息
 */
export async function generateDispatchMessage(caseData) {
  const genderText = caseData.gender === 'M' ? '男' : '女';
  const localMessage = `您好，以下為長照個案派案交接資訊，請協助確認，謝謝！
----------------------------------
【個案交接資訊】
案號：${caseData.id || '（未填）'}
姓名：${caseData.name || '（未填）'}
性別：${genderText}
個管員：${caseData.supervisor || '（未填）'}
服務內容：${caseData.serviceContent || '（未填）'}
指派單位：${caseData.bUnitName || '（未填）'}
照會日期：${caseData.aUnitNotifyDate || '（未填）'}
預計進場時效：${caseData.bUnitStartDate || '（未填）'}
----------------------------------
如有任何問題，歡迎隨時與我聯繫！`;

  const model = getGeminiModel();
  if (!model) {
    return localMessage;
  }

  try {
    const prompt = `請依據以下個案資料，生成一份禮貌且專業的 B 單位派案交接短訊（適合 Line 或 Email 發送，使用繁體中文，請直接輸出內容，不要包含額外的說明文字）：
    案號：${caseData.id}
    姓名：${caseData.name}
    性別：${genderText}
    服務內容：${caseData.serviceContent}
    指派單位：${caseData.bUnitName}
    個管員：${caseData.supervisor}
    照會日期：${caseData.aUnitNotifyDate}
    預計進場時效：${caseData.bUnitStartDate}`;
    
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Gemini API Error:', error);
    return localMessage;
  }
}
