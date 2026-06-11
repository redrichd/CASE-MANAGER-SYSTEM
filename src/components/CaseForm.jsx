import { useState } from 'react';
import { useCases } from '../contexts/CaseContext';
import { useUnits } from '../contexts/UnitContext';
import { useStaff } from '../contexts/StaffContext';
import { calculateDeadline } from '../utils/deadlineCalculator';
import { calculateUnitStats, sortUnits } from '../utils/unitSorter';
import { polishDelayReason, generateDispatchMessage } from '../services/aiService';
import ConfirmDialog from './ConfirmDialog';
import { Sparkles, Copy, Calendar, AlertTriangle, Check, X, Save, UserPlus, Star } from 'lucide-react';
import { parsePastedDateTime } from '../utils/dateTimeParser';
import UnitEditModal from './UnitEditModal';
import { DISPATCH_TYPES, SERVICE_CONTENTS } from '../constants/dispatchConstants';

export default function CaseForm({ activeCase, onClose }) {
  const { cases, addCase, updateCase } = useCases();
  const { units, updateUnit } = useUnits();
  const { staffList } = useStaff();

  // 表單欄位狀態 - 直接從 activeCase 初始化
  const [id, setId] = useState(activeCase?.id || '');
  const [name, setName] = useState(activeCase?.name || '');
  const [gender, setGender] = useState(activeCase?.gender || 'M');
  const [area, setArea] = useState(activeCase?.area || '新莊區');
  const [supervisor, setSupervisor] = useState(activeCase?.supervisor || '');
  const [superApprovalDate, setSuperApprovalDate] = useState(activeCase?.superApprovalDate || '');
  const [approvalDate, setApprovalDate] = useState(activeCase?.approvalDate || '');
  const [submitDate, setSubmitDate] = useState(activeCase?.submitDate || '');
  const [dispatchType, setDispatchType] = useState(activeCase?.dispatchType || '新案_初評');
  const [serviceContent, setServiceContent] = useState(activeCase?.serviceContent || 'BA');
  const [bUnitName, setBUnitName] = useState(activeCase?.bUnitName || '');
  const [dispatchResult, setDispatchResult] = useState(activeCase?.dispatchResult || '');
  const [delayReason, setDelayReason] = useState(activeCase?.delayReason || '');
  const [isUnitCounseling, setIsUnitCounseling] = useState(activeCase?.isUnitCounseling || false);
  const [aUnitNotifyDate, setAUnitNotifyDate] = useState(activeCase?.aUnitNotifyDate || '');
  const [bUnitStartDate, setBUnitStartDate] = useState(activeCase?.bUnitStartDate || '');

  // 個管員打字搜尋狀態
  const initialStaffObj = staffList.find(s => s.name === (activeCase?.supervisor));
  const [supervisorSearchTerm, setSupervisorSearchTerm] = useState(
    initialStaffObj ? `${initialStaffObj.name} (${initialStaffObj.empId})` : activeCase?.supervisor || ''
  );
  const [isSupervisorDropdownOpen, setIsSupervisorDropdownOpen] = useState(false);
  
  // B 單位打字搜尋狀態
  const [bUnitSearchTerm, setBUnitSearchTerm] = useState(activeCase?.bUnitName || '');
  const [isBUnitDropdownOpen, setIsBUnitDropdownOpen] = useState(false);
  
  // UI 狀態
  const [aiPolishing, setAiPolishing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [editUnitOpen, setEditUnitOpen] = useState(false);
  const [isUnitListOpen, setIsUnitListOpen] = useState(false);

  // 處理貼上日期/時間的自動解析
  const handleDatePaste = (setter, type = 'datetime-local') => (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const parsed = parsePastedDateTime(text, type);
    if (parsed) {
      setter(parsed);
    }
  };

  // 1. 在渲染時直接計算完成期限
  const deadlineDate = approvalDate ? calculateDeadline(approvalDate) : '';

  // 2. 在渲染時直接判斷是否逾期
  const isOvertime = (() => {
    if (submitDate && deadlineDate) {
      const submitTime = new Date(submitDate).getTime();
      const deadlineTime = new Date(deadlineDate).getTime();
      return !isNaN(submitTime) && !isNaN(deadlineTime) && submitTime > deadlineTime;
    }
    return false;
  })();

  // 動態產生區域選項：包含所有人員的區域、預設區域與當前個案的區域
  const availableAreas = Array.from(new Set([
    ...staffList.map((s) => s.area),
    ...(activeCase?.area ? [activeCase.area] : []),
    '新莊區',
    '三蘆區',
    '板中永區'
  ].filter(Boolean)));

  // 計算與排序 B 單位下拉選單 (過濾服務項目並隱藏停派單位)
  const statsUnits = calculateUnitStats(units, cases);
  const filteredSortedUnits = sortUnits(statsUnits).filter(
    (u) => u.services && u.services.includes(serviceContent) && !u.isStopped
  );

  // 過濾搜尋 B 單位選項
  const filteredBUnits = filteredSortedUnits.filter((u) => {
    return u.name.toLowerCase().includes(bUnitSearchTerm.toLowerCase());
  });

  // 獨立計算「目前選擇碼別」的輪序表 (派案次數越少越前面)
  const fairRotationUnits = [...filteredSortedUnits].map(u => {
    const successResults = new Set(['服務提供', '服務提供(第二輪)', '出備已派案']);
    const codeCount = cases.filter(c => 
      c.bUnitName === u.name && 
      c.serviceContent === serviceContent && 
      successResults.has(c.dispatchResult)
    ).length;
    return { ...u, codeDispatchCount: codeCount };
  }).sort((a, b) => {
    if (a.codeDispatchCount !== b.codeDispatchCount) {
      return a.codeDispatchCount - b.codeDispatchCount; // 派案次數少的優先 (沒派過的在最前面)
    }
    return a.id.localeCompare(b.id);
  });

  // AI 潤飾白話逾時說明
  const handleAiPolish = async () => {
    if (!delayReason.trim()) return;
    setAiPolishing(true);
    try {
      const polished = await polishDelayReason(delayReason);
      setDelayReason(polished);
    } catch (e) {
      console.error(e);
    } finally {
      setAiPolishing(false);
    }
  };

  // 一鍵生成並複製派案交接短訊
  const handleCopyMessage = async () => {
    const caseData = {
      id,
      name,
      gender,
      supervisor,
      serviceContent,
      bUnitName,
      aUnitNotifyDate,
      bUnitStartDate,
    };
    try {
      const message = await generateDispatchMessage(caseData);
      await navigator.clipboard.writeText(message);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (e) {
      console.error(e);
      alert('複製失敗，請手動複製！');
    }
  };

  // 過濾搜尋個管員選項
  const filteredSupervisors = staffList.filter((s) => {
    const displayName = `${s.name} (${s.empId})`;
    return displayName.toLowerCase().includes(supervisorSearchTerm.toLowerCase());
  });

  const showExternalSupervisor = supervisor && 
    !staffList.some(s => s.name === supervisor) && 
    supervisor.toLowerCase().includes(supervisorSearchTerm.toLowerCase());

  // 儲存個案
  const handleSave = (e) => {
    if (e) e.preventDefault();

    if (!id || !name || !supervisor) {
      alert('請填寫必填欄位 (案號、姓名、個管員)！');
      return;
    }

    // 防呆：逾期時必須填寫逾時說明
    if (isOvertime && !delayReason.trim()) {
      alert('此案件已逾時效，必須填寫「時效逾時說明」！');
      return;
    }

    // 檢查違規停派確認
    if (bUnitName && dispatchResult === '違規停派' && !pendingSave) {
      setWarningMsg(
        `是否確定要將「${bUnitName}」設為違規停派？確認後，該單位的狀態將會自動變更為停派中，並且違規停派次數將會加 1。`
      );
      setShowWarning(true);
      return;
    }

    // 檢查近期重複派案攔截 (單位是否有成功派案紀錄)
    if (bUnitName && !pendingSave) {
      const successResults = new Set(['服務提供', '服務提供(第二輪)', '出備已派案']);
      const duplicateCase = cases.find(
        (c) =>
          c.id !== (activeCase?.id) &&
          c.bUnitName === bUnitName &&
          successResults.has(c.dispatchResult)
      );

      if (duplicateCase) {
        const lastDate = duplicateCase.submitDate || duplicateCase.date;
        setWarningMsg(
          `該單位「${bUnitName}」近期已有成功派案紀錄（上次派案日期：${lastDate.replace('T', ' ')}，案號：${duplicateCase.id}），確定要再次派給此單位嗎？`
        );
        setShowWarning(true);
        return;
      }
    }

    // 準備儲存資料
    const savedData = {
      id,
      name,
      gender,
      supervisor,
      area,
      date: activeCase ? activeCase.date : new Date().toLocaleDateString('zh-TW'),
      superApprovalDate,
      approvalDate,
      deadlineDate,
      submitDate,
      status: isOvertime ? '超時效' : '時效內',
      delayReason: isOvertime ? delayReason : '',
      dispatchType,
      serviceContent,
      bUnitName,
      dispatchResult,
      isUnitCounseling,
      aUnitNotifyDate,
      bUnitStartDate,
      isClosed: activeCase ? activeCase.isClosed : false,
    };

    // 違規停派時，更新單位的 isStopped 狀態為 true
    if (bUnitName && dispatchResult === '違規停派') {
      const targetUnit = units.find(u => u.name === bUnitName);
      if (targetUnit) {
        updateUnit(targetUnit.id, { isStopped: true });
      }
    }

    if (activeCase) {
      updateCase(activeCase.id, savedData);
    } else {
      addCase(savedData);
    }
    onClose();
  };

  const confirmDuplicateSave = () => {
    setPendingSave(true);
    setShowWarning(false);
    setTimeout(() => {
      handleSave();
    }, 50);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-45 p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* 表頭 (符合附圖一白底、左右佈局) */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="text-blue-600">
              <UserPlus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-0">
              新增 / 編輯個案資料
            </h2>
            <span className="text-xs text-slate-400 font-mono ml-2">
              案號：{id}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-4 py-2 border border-slate-250 hover:bg-slate-50 text-slate-600 font-bold rounded-lg text-sm transition shadow-sm cursor-pointer"
            >
              <X className="w-4 h-4 text-slate-500" />
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1 px-4 py-2 bg-[#2563eb] hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition shadow-md shadow-blue-500/10 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              儲存資料
            </button>
          </div>
        </div>

        {/* 表單內容 */}
        <form onSubmit={handleSave} className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          
          {/* 一、個案基本資料 */}
          <div>
            <div className="bg-[#e8f0fe] border-l-4 border-[#2563eb] px-4 py-1.5 rounded-r-lg mb-4">
              <h3 className="text-sm font-bold text-blue-900 m-0">
                一、個案基本資料
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1.5">
                  案主姓名
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-250 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="請輸入姓名"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1.5">
                  性別
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-lg border border-slate-250 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="M">男性</option>
                  <option value="F">女性</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1.5">
                  案號
                </label>
                <input
                  type="text"
                  required
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  readOnly={!!activeCase}
                  className={`w-full rounded-lg border px-3 py-1.5 text-sm ${
                    activeCase 
                      ? 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed' 
                      : 'border-slate-250 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500'
                  }`}
                  placeholder="例: FL20093001"
                />
              </div>

              <div>
                <label htmlFor="supervisor" className="block text-xs font-bold text-slate-650 mb-1.5">
                  個管員
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="supervisor"
                    required
                    value={supervisorSearchTerm}
                    onFocus={() => setIsSupervisorDropdownOpen(true)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSupervisorSearchTerm(val);
                      setIsSupervisorDropdownOpen(true);
                      
                      const matchedStaff = staffList.find(s => 
                        s.name === val || 
                        `${s.name} (${s.empId})` === val
                      );
                      if (matchedStaff) {
                        setSupervisor(matchedStaff.name);
                        setArea(matchedStaff.area || '');
                      } else {
                        setSupervisor(val);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setIsSupervisorDropdownOpen(false);
                        const currentStaff = staffList.find(s => s.name === supervisor);
                        if (currentStaff) {
                          setSupervisorSearchTerm(`${currentStaff.name} (${currentStaff.empId})`);
                          setArea(currentStaff.area || '');
                        } else if (supervisor) {
                          setSupervisorSearchTerm(supervisor);
                        } else {
                          setSupervisorSearchTerm('');
                        }
                      }, 200);
                    }}
                    className="w-full rounded-lg border border-slate-250 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                    placeholder="輸入關鍵字以搜尋個管員..."
                  />
                  {isSupervisorDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                      {filteredSupervisors.length === 0 && !showExternalSupervisor ? (
                        <div className="px-3 py-2 text-sm text-slate-455 italic">
                          查無此個管員
                        </div>
                      ) : (
                        <>
                          {filteredSupervisors.map((s) => (
                            <div
                              key={s.empId}
                              onClick={() => {
                                setSupervisor(s.name);
                                setSupervisorSearchTerm(`${s.name} (${s.empId})`);
                                setArea(s.area || '');
                                setIsSupervisorDropdownOpen(false);
                              }}
                              className="px-3 py-2 text-sm hover:bg-slate-100 cursor-pointer text-slate-700 font-medium flex items-center justify-between"
                            >
                              <span>{s.name} ({s.empId})</span>
                              {s.area && (
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                                  {s.area}
                                </span>
                              )}
                            </div>
                          ))}
                          {showExternalSupervisor && (
                            <div
                              onClick={() => {
                                setSupervisor(supervisor);
                                setSupervisorSearchTerm(supervisor);
                                setIsSupervisorDropdownOpen(false);
                              }}
                              className="px-3 py-2 text-sm hover:bg-slate-100 cursor-pointer text-slate-550 font-medium italic"
                            >
                              {supervisor} (外部/已離職)
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1.5">
                  區域
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={area}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                  placeholder="選擇個管員後自動帶入"
                />
              </div>
            </div>
          </div>

          {/* 二、計畫擬定時效管控 (A個管作業) */}
          <div>
            <div className="bg-[#fef3c7] border-l-4 border-amber-500 px-4 py-1.5 rounded-r-lg mb-4 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-900 m-0">
                二、計畫擬定時效管控 (A個管作業)
              </h3>
            </div>
            
            {/* 2x2 卡片網格 (符合附圖一卡片色彩與左邊粗框樣式) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1 */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-l-[6px] border-[#8b5cf6]">
                <label htmlFor="superApprovalDate" className="block text-xs font-bold text-indigo-900 mb-2">
                  1. 初評第一次督導核定通過日
                </label>
                <input
                  id="superApprovalDate"
                  type="datetime-local"
                  step="1"
                  value={superApprovalDate}
                  onChange={(e) => setSuperApprovalDate(e.target.value)}
                  onPaste={handleDatePaste(setSuperApprovalDate, 'datetime-local')}
                  className="w-full border border-slate-250 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8b5cf6]"
                />
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-l-[6px] border-[#3b82f6]">
                <label htmlFor="approvalDate" className="block text-xs font-bold text-blue-900 mb-2">
                  2. 計畫最初送審日 *
                </label>
                <input
                  id="approvalDate"
                  type="datetime-local"
                  step="1"
                  required
                  value={approvalDate}
                  onChange={(e) => setApprovalDate(e.target.value)}
                  onPaste={handleDatePaste(setApprovalDate, 'datetime-local')}
                  className="w-full border border-slate-250 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                />
              </div>

              {/* Card 3 */}
              <div className="bg-[#fef2f2] border border-red-150 rounded-xl p-4 shadow-sm border-l-[6px] border-[#ef4444] text-[#ef4444]">
                <div className="block text-xs font-bold text-red-900 mb-2">
                  3. 規定完成期限 (系統自動計算) <span className="text-[10px] bg-red-100 px-1.5 py-0.5 rounded text-red-600 font-bold border border-red-200">不可變更</span>
                </div>
                <div className="text-base font-extrabold tracking-wide py-1 text-red-650">
                  {deadlineDate ? deadlineDate.replace('T', ' ') : '年 / 月 / 日 -- : --'}
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-l-[6px] border-[#64748b]">
                <label htmlFor="submitDate" className="block text-xs font-bold text-slate-700 mb-2">
                  4. 照顧計劃審核通過日
                </label>
                <input
                  id="submitDate"
                  type="datetime-local"
                  step="1"
                  value={submitDate}
                  onChange={(e) => setSubmitDate(e.target.value)}
                  onPaste={handleDatePaste(setSubmitDate, 'datetime-local')}
                  className="w-full border border-slate-250 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#64748b]"
                />
              </div>
            </div>
            
            {/* 逾時提醒與填寫區 */}
            {isOvertime && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mt-4 space-y-3">
                <div className="flex items-center gap-2 text-red-650 font-bold">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span className="text-sm">系統檢測：已逾時效，必須填寫逾時說明！</span>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-red-900">
                      時效逾時說明 <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAiPolish}
                      disabled={aiPolishing || !delayReason.trim()}
                      className="inline-flex items-center gap-1 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg transition font-bold disabled:bg-purple-300 cursor-pointer shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {aiPolishing ? 'AI 潤飾中...' : 'AI 潤飾草稿'}
                    </button>
                  </div>
                  <textarea
                    required={isOvertime}
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                    className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[80px]"
                    placeholder="請輸入白話逾時原因（例如：家屬電話無法撥通），點擊上方 AI 潤飾可自動轉換為正式說明..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* 三、派案類別 */}
          <div>
            <div className="bg-[#f3e8ff] border-l-4 border-purple-500 px-4 py-1.5 rounded-r-lg mb-4">
              <h3 className="text-sm font-bold text-purple-900 m-0">
                三、派案類別
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1.5">
                  派案類別
                </label>
                <select
                  value={dispatchType}
                  onChange={(e) => setDispatchType(e.target.value)}
                  className="w-full rounded-lg border border-slate-250 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {DISPATCH_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-650 mb-1.5">
                   服務內容
                 </label>
                 <select
                   value={serviceContent}
                   onChange={(e) => {
                     setServiceContent(e.target.value);
                     setBUnitName('');
                     setBUnitSearchTerm('');
                   }}
                   className="w-full rounded-lg border border-slate-250 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                 >
                   {SERVICE_CONTENTS.map((sc) => (
                     <option key={sc} value={sc}>{sc}</option>
                   ))}
                 </select>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <label htmlFor="bUnitName" className="block text-xs font-bold text-slate-650">
                    指派 B 單位 (依星級排序)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsUnitListOpen(true)}
                    className="text-[10px] text-purple-600 font-bold hover:underline focus:outline-none cursor-pointer"
                  >
                    查看單位輪序表
                  </button>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      id="bUnitName"
                      value={bUnitSearchTerm}
                      onFocus={() => setIsBUnitDropdownOpen(true)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBUnitSearchTerm(val);
                        setIsBUnitDropdownOpen(true);
                        
                        const matchedUnit = filteredSortedUnits.find(u => u.name === val);
                        if (matchedUnit) {
                          setBUnitName(matchedUnit.name);
                        } else {
                          setBUnitName('');
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setIsBUnitDropdownOpen(false);
                          if (bUnitName) {
                            setBUnitSearchTerm(bUnitName);
                          } else {
                            setBUnitSearchTerm('');
                          }
                        }, 200);
                      }}
                      className="w-full rounded-lg border border-slate-250 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-sm"
                      placeholder="輸入關鍵字以搜尋 B 單位..."
                    />
                    {isBUnitDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                        {filteredBUnits.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-slate-400 italic">
                            查無此單位
                          </div>
                        ) : (
                          filteredBUnits.map((u) => {
                            const statusText = u.rating > 0 ? ` (⭐ ${u.rating}星)` : ' (無評分)';
                            return (
                              <div
                                key={u.id}
                                onClick={() => {
                                  setBUnitName(u.name);
                                  setBUnitSearchTerm(u.name);
                                  setIsBUnitDropdownOpen(false);
                                }}
                                className="px-3 py-2 text-sm hover:bg-slate-100 cursor-pointer text-slate-700 font-medium flex items-center justify-between"
                              >
                                <span>{u.name}</span>
                                <span className="text-xs text-amber-500 font-bold shrink-0 ml-2">
                                  {statusText}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                  {bUnitName && (
                    <button
                      type="button"
                      onClick={() => setEditUnitOpen(true)}
                      className="px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition shadow-sm shrink-0 cursor-pointer animate-in fade-in slide-in-from-right-2 duration-200"
                    >
                      編輯單位
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1.5">
                  派案結果
                </label>
                <select
                  value={dispatchResult}
                  onChange={(e) => setDispatchResult(e.target.value)}
                  className="w-full rounded-lg border border-slate-250 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">-- 請選擇結果 --</option>
                  <option value="服務提供">服務提供 (輪排成功)</option>
                  <option value="服務提供(第二輪)">服務提供(第二輪) (輪排成功)</option>
                  <option value="出備已派案">出備已派案 (輪排成功)</option>
                  <option value="案主指定(本單位)">案主指定(本單位) (不計成功)</option>
                  <option value="案主指定(外單位)">案主指定(外單位) (不計成功)</option>
                  <option value="無人力">無人力 (不計成功)</option>
                  <option value="派案後取消">派案後取消 (不計成功)</option>
                  <option value="逾時未回覆">逾時未回覆 (不計成功)</option>
                  <option value="違規停派">違規停派 (增加停派次數)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1.5">
                  A單位照會服務單位日
                </label>
                <input
                  type="date"
                  value={aUnitNotifyDate}
                  onChange={(e) => setAUnitNotifyDate(e.target.value)}
                  onPaste={handleDatePaste(setAUnitNotifyDate, 'date')}
                  className="w-full rounded-lg border border-slate-250 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1.5">
                  B單位預計首次進場日
                </label>
                <input
                  type="date"
                  value={bUnitStartDate}
                  onChange={(e) => setBUnitStartDate(e.target.value)}
                  onPaste={handleDatePaste(setBUnitStartDate, 'date')}
                  className="w-full rounded-lg border border-slate-250 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 py-2 mt-4">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isUnitCounseling}
                  onChange={(e) => setIsUnitCounseling(e.target.checked)}
                  className="rounded border-slate-350 text-purple-650 focus:ring-purple-500 w-4 h-4"
                />
                是否需要單位輔導
              </label>
            </div>
          </div>

          {/* 交接訊息生成區 */}
          {bUnitName && (
            <div className="bg-[#f8fafc] border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-inner">
              <div>
                <h4 className="text-sm font-bold text-slate-800 m-0">
                  派案交接訊息生成器
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 mb-0">
                  一鍵彙整個案與派案資訊，生成禮貌且專業的交接訊息。
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-bold shadow-md shadow-indigo-600/10 transition cursor-pointer"
              >
                {copySuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 animate-bounce" />
                    已複製到剪貼簿！
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    生成並複製交接短訊
                  </>
                )}
              </button>
            </div>
          )}

          {/* 底端操作按鈕 (保留供長表單快速提交) */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-4 py-2 border border-slate-250 hover:bg-slate-50 text-slate-600 font-bold rounded-lg text-sm transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-5 py-2 bg-blue-650 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition cursor-pointer"
            >
              儲存個案
            </button>
          </div>

        </form>
      </div>

      {/* 近期重複派案確認警告對話框 */}
      <ConfirmDialog
        isOpen={showWarning}
        title="近期重複派案提醒"
        message={warningMsg}
        onConfirm={confirmDuplicateSave}
        onCancel={() => setShowWarning(false)}
      />

      {/* 編輯單位模態框 */}
      {bUnitName && editUnitOpen && (
        <UnitEditModal
          unit={units.find((u) => u.name === bUnitName)}
          isOpen={editUnitOpen}
          onClose={() => setEditUnitOpen(false)}
        />
      )}

      {/* 單位輪序表參考彈窗 */}
      {isUnitListOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold text-white mb-0 text-sm">「{serviceContent}」碼別輪序表 (依派案次數排序)</h3>
              <button type="button" onClick={() => setIsUnitListOpen(false)} className="hover:bg-white/20 p-1 rounded-full text-white cursor-pointer transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                {fairRotationUnits.length === 0 ? (
                  <div className="text-sm text-slate-400 text-center py-4">無符合條件之單位</div>
                ) : (
                  fairRotationUnits.map((u, index) => (
                    <div key={u.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-purple-50/50 transition">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 text-sm">{index + 1}. {u.name}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex gap-2">
                          <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                            本碼別派案成功: {u.codeDispatchCount} 次
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-0.5" title={`${u.rating || 0}星`}>
                        {u.rating > 0 ? Array.from({ length: u.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                        )) : <span className="text-xs text-slate-400">無星級</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
