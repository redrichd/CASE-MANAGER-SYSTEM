import { useState } from 'react';
import { FileSpreadsheet, Download, ExternalLink, X, Calendar, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { exportMonthlyReport, formatRocMonth } from '../services/reportExportService';

export default function ReportExportModal({ isOpen, onClose, cases = [] }) {
  const currentDate = new Date();
  const defaultYear = currentDate.getFullYear();
  const defaultMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth();
  const defaultRocYear = (currentDate.getMonth() === 0 ? defaultYear - 1 : defaultYear) - 1911;

  const [rocYear, setRocYear] = useState(defaultRocYear);
  const [month, setMonth] = useState(defaultMonth);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resultData, setResultData] = useState(null);

  if (!isOpen) return null;

  const handleExport = async (actionType) => {
    setExporting(true);
    setErrorMsg('');
    setResultData(null);
    setExportStatus('正在擷取個案與派案資料...');

    try {
      const fullYear = rocYear + 1911;
      setExportStatus(`正在生成 ${formatRocMonth(fullYear, month)} 5張月報表...`);

      const result = await exportMonthlyReport({
        cases,
        year: fullYear,
        month,
        aUnitName: "悠康事業有限公司附設新北市私立悠康居家長照機構"
      });

      setResultData(result);
      setExportStatus('報表生成完成！');

      if (actionType === 'excel' && result.excelDownloadUrl) {
        window.open(result.excelDownloadUrl, '_blank');
      } else if (actionType === 'sheet' && result.sheetUrl) {
        window.open(result.sheetUrl, '_blank');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || '匯出報表時發生錯誤');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transition-all">
        
        {/* Modal 頂部 Header */}
        <div className="bg-gradient-to-r from-[#1e3a8a] to-blue-700 px-6 py-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
              <FileSpreadsheet className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-wide">匯出 5 張月報表 (Google Sheet / Excel)</h3>
              <p className="text-xs text-blue-100/80">自動填入雲端範本並算入月統計數據</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal 內容區 */}
        <div className="p-6 space-y-6">

          {/* 雲端範本提示 */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex gap-3 text-xs text-blue-900">
            <Calendar className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">預設雲端範本 ID：10gAo61b7d3_V4DMcxApDmfqNiDANAoet5z3vmcxVSrM</span>
              系統將針對指定的月報月份，自動複製範本並填入《派案情形回復表》、《其他長照服務資源連結表》、《轉介醫事C》、《時效性回復表》、《異常回復表》共 5 張表。
            </div>
          </div>

          {/* 年月選擇器 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">民國年份</label>
              <select
                value={rocYear}
                onChange={(e) => setRocYear(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition outline-none cursor-pointer"
              >
                {[113, 114, 115, 116, 117].map(y => (
                  <option key={y} value={y}>民國 {y} 年 ({y + 1911})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">月份</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white transition outline-none cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{String(m).padStart(2, '0')} 月</option>
                ))}
              </select>
            </div>
          </div>

          {/* 狀態訊息/載入中 */}
          {exporting && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-800 font-bold animate-pulse">
              <Loader2 className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
              <span>{exportStatus}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-red-700 font-bold">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resultData && !exporting && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>報表產製成功！</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-mono">檔名: {resultData.fileName}</p>
              {resultData.isSimulated && (
                <p className="text-[11px] text-amber-700 font-semibold">
                  (提示: 目前未綁定 VITE_GAS_REPORT_EXPORT_URL，已開啟預設範本頁面)
                </p>
              )}
              {resultData.isNoCorsSent && (
                <p className="text-[11px] text-blue-700 font-semibold">
                  (已透過雲端背景通道成功發送寫入請求至 Google Drive！)
                </p>
              )}
            </div>
          )}

          {/* 按鈕動作區 */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleExport('excel')}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 transition shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              匯出 Excel (.xlsx)
            </button>

            <button
              onClick={() => handleExport('sheet')}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold text-blue-900 bg-blue-50 border border-blue-200 hover:bg-blue-100 active:scale-98 disabled:opacity-50 transition shadow-sm cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-blue-700" />
              開啟 Google Sheet
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
