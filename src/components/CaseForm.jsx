import { useState } from 'react';
import { useCases } from '../contexts/CaseContext';
import { useUnits } from '../contexts/UnitContext';
import { useStaff } from '../contexts/StaffContext';
import { calculateDeadline } from '../utils/deadlineCalculator';
import { calculateUnitStats, sortUnits } from '../utils/unitSorter';
import { generateDispatchMessage } from '../services/aiService';
import ConfirmDialog from './ConfirmDialog';
import { Copy, Calendar, AlertTriangle, Check, X, Save, UserPlus, Star } from 'lucide-react';
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
  const initialDispatchResult = activeCase?.dispatchResult === '案主指定(外單位)' ? '外單位自開案' : (activeCase?.dispatchResult || '');
  const [dispatchResult, setDispatchResult] = useState(initialDispatchResult);
  const [secondRoundReason, setSecondRoundReason] = useState(activeCase?.secondRoundReason || '');
  const [delayReason, setDelayReason] = useState(activeCase?.delayReason || '');
  const [isUnitCounseling, setIsUnitCounseling] = useState(activeCase?.isUnitCounseling || false);
  const [aUnitNotifyDate, setAUnitNotifyDate] = useState(activeCase?.aUnitNotifyDate || '');
  const [bUnitStartDate, setBUnitStartDate] = useState(activeCase?.bUnitStartDate || '');
  const [bUnitReplyDate, setBUnitReplyDate] = useState(activeCase?.bUnitReplyDate || '');
  const [firstServiceDate, setFirstServiceDate] = useState(activeCase?.firstServiceDate || '');
  const [overdueDays, setOverdueDays] = useState(
    activeCase?.overdueDays !== undefined && activeCase?.overdueDays !== null
      ? activeCase.overdueDays
      : ''
  );
  const [anomalyReasonType, setAnomalyReasonType] = useState(activeCase?.anomalyReasonType || '');
  const [anomalyDate, setAnomalyDate] = useState(activeCase?.anomalyDate || '');
  const [anomalyCategory, setAnomalyCategory] = useState(activeCase?.anomalyCategory || '');
  const [anomalySummary, setAnomalySummary] = useState(activeCase?.anomalySummary || '');
  const [followUpStatus, setFollowUpStatus] = useState(activeCase?.followUpStatus || '');
  const [otherNote, setOtherNote] = useState(activeCase?.otherNote || '');
  const [remarks, setRemarks] = useState(activeCase?.remarks || '');
  const [referralTarget, setReferralTarget] = useState(activeCase?.referralTarget || '');
  const [referralDate, setReferralDate] = useState(activeCase?.referralDate || '');
  const [referralReplyDate, setReferralReplyDate] = useState(activeCase?.referralReplyDate || '');
  const [hasReferralForm, setHasReferralForm] = useState(activeCase?.hasReferralForm ?? true);
  const [isCMSRecorded, setIsCMSRecorded] = useState(activeCase?.isCMSRecorded ?? true);
  // 紀錄性質切換狀態：'dispatch' (一般派案紀錄) vs 'referral' (轉介服務紀錄)
  const initialCategory = activeCase?.recordCategory || (activeCase?.referralType ? 'referral' : 'dispatch');
  const [recordCategory, setRecordCategory] = useState(initialCategory);

  // 轉介服務專屬欄位狀態
  const [referralType, setReferralType] = useState(activeCase?.referralType || '其他長照服務連結'); // '其他長照服務連結' | '轉介醫事C巷弄長照站連結'
  const [referralUnitName, setReferralUnitName] = useState(activeCase?.referralUnitName || '');
  const [referralReason, setReferralReason] = useState(activeCase?.referralReason || '');
  const [referralFollowUp, setReferralFollowUp] = useState(activeCase?.referralFollowUp || '');
  const [emailSentStatus, setEmailSentStatus] = useState(activeCase?.emailSentStatus || '');
  const [referralRemarks, setReferralRemarks] = useState(activeCase?.referralRemarks || '');
  const [cStationInfo, setCStationInfo] = useState(activeCase?.cStationInfo || '');
  const [reEvalResult, setReEvalResult] = useState(activeCase?.reEvalResult || '');

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



  // 計算與排序 B 單位下拉選單 (過濾服務項目並隱藏停派單位)
  const statsUnits = calculateUnitStats(units, cases);
  const filteredSortedUnits = sortUnits(statsUnits).filter(
    (u) => u.services && u.services.includes(serviceContent) && !u.isStopped
  );

  // 過濾搜尋 B 單位選項
  const filteredBUnits = filteredSortedUnits.filter((u) => {
    return u.name.toLowerCase().includes(bUnitSearchTerm.toLowerCase());
  });

  // 獨立計算「目前選擇碼別」的輪序表 (派案次數越少越前面，不硬性置頂三星或特定單位)
  const YUKANG_NAME = "悠康事業有限公司附設新北市私立悠康居家長照機構";
  const fairRotationUnits = [...filteredSortedUnits].map(u => {
    const codeCount = cases.filter(c => {
      if (c.bUnitName !== u.name || c.serviceContent !== serviceContent) {
        return false;
      }
      const result = c.dispatchResult;
      const isYukang = c.bUnitName === YUKANG_NAME;
      
      // 服務提供
      if (result === '服務提供') return true;
      // 第二輪與出備已派案 (悠康計輪派，外單位被動救援保護不計輪派)
      if (result === '服務提供(第二輪)' || result === '出備已派案') return isYukang;
      // 懲罰挑案條款：逾時未回覆、無人力、單位因素無法接案 -> 照樣計輪派 (+1)
      if (result === '逾時未回覆' || result === '無人力' || result === '單位因素無法接案') return true;
      
      return false;
    }).length;
    return { ...u, codeDispatchCount: codeCount };
  }).sort((a, b) => {
    if (a.codeDispatchCount !== b.codeDispatchCount) {
      return a.codeDispatchCount - b.codeDispatchCount; // 派案次數少的優先 (沒派過的在最前面)
    }
    const ratingA = a.rating || 0;
    const ratingB = b.rating || 0;
    if (ratingA !== ratingB) {
      return ratingB - ratingA;
    }
    return a.id.localeCompare(b.id);
  });
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

  const originalSupervisor = activeCase?.supervisor || '';
  const showExternalSupervisor = originalSupervisor && 
    !staffList.some(s => s.name === originalSupervisor) && 
    originalSupervisor.toLowerCase().includes(supervisorSearchTerm.toLowerCase());

  // 儲存個案 (支援 forceSave 參數防止 React 閉包狀態非同步更新延遲)
  const handleSave = (e, forceSave = false) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    if (!id || !name || !supervisor) {
      alert('請填寫必填欄位 (案號、姓名、個管員)！');
      return;
    }

    // 防呆：逾期時必須填寫逾時說明
    if (isOvertime && !delayReason.trim()) {
      alert('此案件已逾時效，必須填寫「時效逾時說明」！');
      return;
    }

    // 防呆：A單位照會服務單位日不可比照顧計劃審核通過日還要前面 (依據日期 YYYY-MM-DD 比較，同一天視為合法)
    const targetApprovalDate = submitDate || approvalDate;
    if (recordCategory === 'dispatch' && aUnitNotifyDate && targetApprovalDate) {
      const notifyDateStr = aUnitNotifyDate.split('T')[0];
      const targetDateStr = targetApprovalDate.split('T')[0];
      if (notifyDateStr < targetDateStr) {
        alert('「A單位照會服務單位日」不可早於「照顧計畫擬定完成日 (審核通過日)」！');
        return;
      }
    }

    // 防呆：派案結果為「服務提供(第二輪)」、「逾時未回覆」、「無人力」、「單位因素無法接案」時，必須填寫說明原因
    const reasonRequiredResults = ['服務提供(第二輪)', '逾時未回覆', '無人力', '單位因素無法接案'];
    if (reasonRequiredResults.includes(dispatchResult) && !secondRoundReason.trim()) {
      alert(`派案結果為「${dispatchResult}」，必須填寫原因/備註！`);
      return;
    }

    // 檢查違規停派確認
    if (bUnitName && dispatchResult === '違規停派' && !pendingSave && !forceSave) {
      setWarningMsg(
        `是否確定要將「${bUnitName}」設為違規停派？確認後，該單位的狀態將會自動變更為停派中，並且違規停派次數將會加 1。`
      );
      setShowWarning(true);
      return;
    }

    // 檢查近期重複派案攔截 (單位是否有成功派案紀錄)
    if (bUnitName && !pendingSave && !forceSave) {
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
      recordCategory, // 'dispatch' | 'referral'
      ...(recordCategory === 'referral'
        ? {
            serviceContent: referralType === '其他長照服務連結' ? '轉介_其他長照' : '轉介_醫事C',
            referralType,
            referralDate,
            referralReplyDate,
            referralUnitName,
            referralReason,
            referralFollowUp,
            referralTarget,
            emailSentStatus,
            referralRemarks,
            cStationInfo,
            reEvalResult,
            hasReferralForm,
            isCMSRecorded,
            bUnitName: referralUnitName,
            status: '已轉介',
          }
        : {
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
            secondRoundReason: ['服務提供(第二輪)', '逾時未回覆', '無人力', '單位因素無法接案'].includes(dispatchResult) ? secondRoundReason : '',
            isUnitCounseling,
            aUnitNotifyDate,
            bUnitStartDate,
            bUnitReplyDate,
            firstServiceDate,
            overdueDays,
            anomalyReasonType,
            anomalyDate,
            anomalyCategory,
            anomalySummary,
            followUpStatus,
            otherNote,
            remarks,
          }),
      isClosed: activeCase ? activeCase.isClosed : false,
    };

    // 違規停派時，更新單位的 isStopped 狀態為 true 且 stopCount 加 1
    if (bUnitName && dispatchResult === '違規停派') {
      const targetUnit = units.find(u => u.name === bUnitName);
      if (targetUnit) {
        const currentCaseStops = cases.filter(c => c.bUnitName === targetUnit.name && c.dispatchResult === '違規停派').length;
        const currentStopCount = typeof targetUnit.stopCount === 'number' ? targetUnit.stopCount : currentCaseStops;
        updateUnit(targetUnit.id, { 
          isStopped: true,
          stopCount: currentStopCount + 1
        });
      }
    }

    if (activeCase) {
      updateCase(activeCase, savedData);
    } else {
      addCase(savedData);
    }
    onClose();
  };

  const confirmDuplicateSave = () => {
    setPendingSave(true);
    setShowWarning(false);
    handleSave(null, true);
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
          
          {/* 紀錄性質切換按鈕 (派案 vs 轉介) */}
          <div className="bg-slate-100 p-2 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 ml-2">紀錄登載類型：</span>
              <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => setRecordCategory('dispatch')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                    recordCategory === 'dispatch'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  📋 一般派案紀錄 (一~四大項)
                </button>
                <button
                  type="button"
                  onClick={() => setRecordCategory('referral')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                    recordCategory === 'referral'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  🔗 轉介服務紀錄 (連結/清冊專用)
                </button>
              </div>
            </div>
            {recordCategory === 'referral' && (
              <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-lg">
                已啟動轉介登載模式：原本派案一、二、三、四大項免填
              </span>
            )}
          </div>

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
                    autoComplete="off"
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
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setSupervisor(s.name);
                                setSupervisorSearchTerm(`${s.name} (${s.empId})`);
                                setArea(s.area || '');
                                setIsSupervisorDropdownOpen(false);
                              }}
                              className="px-3 py-2 hover:bg-blue-50 text-sm cursor-pointer border-b border-slate-100"
                            >
                              <div className="font-bold text-slate-700">{s.name} ({s.empId})</div>
                              <div className="text-xs text-slate-400">區域：{s.area || '未設區'}</div>
                            </div>
                          ))}
                          {showExternalSupervisor && (
                            <div
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setSupervisor(supervisorSearchTerm);
                                setIsSupervisorDropdownOpen(false);
                              }}
                              className="px-3 py-2 hover:bg-amber-50 text-sm cursor-pointer border-t border-amber-200 text-amber-700 font-bold bg-amber-50/50"
                            >
                              + 使用外單位/自訂個管員：「{supervisorSearchTerm}」
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

          {/* 條件渲染：若選取「轉介服務紀錄」，展示轉介專屬填寫區塊；若選「一般派案紀錄」，展示二、三、四大項 */}
          {recordCategory === 'referral' ? (
            <div className="bg-purple-50/50 border border-purple-200 rounded-2xl p-5 space-y-4">
              <div className="bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center justify-between">
                <h3 className="text-sm font-bold m-0 flex items-center gap-1.5">
                  🔗 轉介服務紀錄登載
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 轉介服務類別控制項 */}
                <div>
                  <label className="block text-xs font-bold text-purple-900 mb-1.5">
                    轉介服務類型
                  </label>
                  <select
                    value={referralType}
                    onChange={(e) => setReferralType(e.target.value)}
                    className="w-full rounded-lg border border-purple-300 px-3 py-2 text-sm bg-white font-bold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="其他長照服務連結">其他長照服務連結</option>
                    <option value="轉介醫事C巷弄長照站連結">轉介醫事C巷弄長照站連結</option>
                  </select>
                </div>

                {/* 轉介日期 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    轉介日期
                  </label>
                  <input
                    type="date"
                    value={referralDate}
                    onChange={(e) => setReferralDate(e.target.value)}
                    onPaste={handleDatePaste(setReferralDate, 'date')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* 轉介回復日期 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    轉介回復日期
                  </label>
                  <input
                    type="date"
                    value={referralReplyDate}
                    onChange={(e) => setReferralReplyDate(e.target.value)}
                    onPaste={handleDatePaste(setReferralReplyDate, 'date')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* 服務單位名稱 (提供自動選取與自行輸入) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    轉介服務單位名稱 / 轉介對象
                  </label>
                  <input
                    type="text"
                    list="referral-units-list"
                    value={referralUnitName}
                    onChange={(e) => setReferralUnitName(e.target.value)}
                    placeholder="點擊或輸入選擇轉介服務單位..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <datalist id="referral-units-list">
                    {units
                      .filter((u) => !u.isStopped && u.services && (u.services.includes('轉介') || u.services.includes('REFERRAL')))
                      .map((u) => (
                        <option key={u.id} value={u.name} />
                      ))}
                  </datalist>
                </div>

                {/* 差異化動態選單 */}
                {referralType === '其他長照服務連結' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      長照轉介資源項目
                    </label>
                    <select
                      value={referralTarget}
                      onChange={(e) => setReferralTarget(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="">-- 請選擇項目 --</option>
                      <optgroup label="【專業資源】">
                        <option value="失智症社區服務據點">失智症社區服務據點</option>
                        <option value="緊急救援">緊急救援</option>
                        <option value="緊急安置">緊急安置</option>
                        <option value="家照服務">家照服務</option>
                        <option value="二手輔具/輔具資源中心">二手輔具/輔具資源中心</option>
                        <option value="急難救助">急難救助</option>
                        <option value="物資補助">物資補助</option>
                        <option value="到宅修繕">到宅修繕</option>
                        <option value="志工關懷訪視">志工關懷訪視</option>
                        <option value="其他說明 (專業資源)">其他說明 (專業資源)</option>
                      </optgroup>
                      <optgroup label="【醫療相關資源】">
                        <option value="居家醫療">居家醫療</option>
                        <option value="安寧緩和">安寧緩和</option>
                        <option value="健保居家護理">健保居家護理</option>
                        <option value="其他說明 (醫療相關資源)">其他說明 (醫療相關資源)</option>
                      </optgroup>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      長照個案轉介資源分類
                    </label>
                    <select
                      value={referralTarget}
                      onChange={(e) => setReferralTarget(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="">-- 請選擇分類 --</option>
                      <option value="2-3級轉介巷弄長照站">2-3級轉介巷弄長照站</option>
                      <option value="複評結果未達2級(結案)">複評結果未達2級(結案)</option>
                      <option value="提供社照C巷弄長照站資訊">提供社照C巷弄長照站資訊</option>
                      <option value="居家/社區照顧服務不符合需求或入住機構">居家/社區照顧服務不符合需求或入住機構</option>
                      <option value="提供住宿式機構資訊">提供住宿式機構資訊</option>
                    </select>
                  </div>
                )}

                {/* 轉介原因摘要 */}
                <div className="col-span-1 md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    轉介原因摘要 (文字備註，無則空白)
                  </label>
                  <textarea
                    rows={2}
                    value={referralReason}
                    onChange={(e) => setReferralReason(e.target.value)}
                    placeholder="請描述轉介原因，若無則空白..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* 轉介追蹤情形 / 轉介追蹤回覆說明 */}
                <div className="col-span-1 md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {referralType === '其他長照服務連結' ? '轉介追蹤回覆說明 (文字備註，無則空白)' : '轉介追蹤情形 (文字備註，無則空白)'}
                  </label>
                  <input
                    type="text"
                    value={referralFollowUp}
                    onChange={(e) => setReferralFollowUp(e.target.value)}
                    placeholder="例: 持續追蹤 / 案家考慮中 / 文字備註，無則空白..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* 僅在「轉介醫事C巷弄長照站連結」顯示信箱寄送與備註欄位 */}
                {referralType === '轉介醫事C巷弄長照站連結' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        當月是否已完成轉介單一併寄至承辦人信箱
                      </label>
                      <input
                        type="text"
                        value={emailSentStatus}
                        onChange={(e) => setEmailSentStatus(e.target.value)}
                        placeholder="文字備註 (如: 已寄出/未寄出)，無則空白..."
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        備註
                      </label>
                      <input
                        type="text"
                        value={referralRemarks}
                        onChange={(e) => setReferralRemarks(e.target.value)}
                        placeholder="文字備註，無則空白..."
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </>
                )}

                {/* 轉介單 / 服務紀錄登記 勾選項 */}
                <div className="col-span-1 md:col-span-3 flex items-center gap-6 py-2 border-t border-purple-200 mt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasReferralForm}
                      onChange={(e) => setHasReferralForm(e.target.checked)}
                      className="rounded border-slate-350 text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    {referralType === '其他長照服務連結'
                      ? '是否有轉介單 (勾選為「是」，未勾選為「否」)'
                      : '填寫轉介單 (勾選為「是」，未勾選為「否」)'}
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isCMSRecorded}
                      onChange={(e) => setIsCMSRecorded(e.target.checked)}
                      className="rounded border-slate-350 text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    {referralType === '其他長照服務連結'
                      ? '是否已完成服務紀錄登載 (勾選為「是」，未勾選為「否」)'
                      : '是否已完成 CMS 系統服務紀錄登記 (勾選為「是」，未勾選為「否」)'}
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <>
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
                  <div className="mb-1.5">
                    <label className="block text-xs font-bold text-red-900">
                      時效逾時說明 <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <textarea
                    required={isOvertime}
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                    className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[80px]"
                    placeholder="請輸入白話逾時原因..."
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
                    指派 B 單位
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
                      autoComplete="off"
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
                                onMouseDown={(e) => {
                                  e.preventDefault();
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
                  <option value="服務提供">服務提供</option>
                  <option value="服務提供(第二輪)">服務提供(第二輪)</option>
                  <option value="出備已派案">出備已派案</option>
                  <option value="案主指定(本單位)">案主指定(本單位)</option>
                  <option value="外單位自開案">外單位自開案</option>
                  <option value="無人力">無人力</option>
                  <option value="逾時未回覆">逾時未回覆</option>
                  <option value="單位因素無法接案">單位因素無法接案</option>
                  <option value="派案後取消">派案後取消</option>
                  <option value="違規停派">違規停派</option>
                </select>
              </div>

              <div>
                <label htmlFor="aUnitNotifyDate" className="block text-xs font-bold text-slate-650 mb-1.5">
                  A單位照會服務單位日
                </label>
                {(() => {
                  const targetApprovalDate = submitDate || approvalDate;
                  const targetDateStr = targetApprovalDate ? targetApprovalDate.split('T')[0] : '';
                  const notifyDateStr = aUnitNotifyDate ? aUnitNotifyDate.split('T')[0] : '';
                  const isNotifyDateInvalid = notifyDateStr && targetDateStr && notifyDateStr < targetDateStr;

                  return (
                    <>
                      <input
                        id="aUnitNotifyDate"
                        type="date"
                        value={aUnitNotifyDate}
                        onChange={(e) => setAUnitNotifyDate(e.target.value)}
                        onPaste={handleDatePaste(setAUnitNotifyDate, 'date')}
                        className={`w-full rounded-lg border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 ${
                          isNotifyDateInvalid
                            ? 'border-rose-500 text-rose-600 focus:ring-rose-500 font-bold'
                            : 'border-slate-250 focus:ring-purple-500'
                        }`}
                      />
                      {isNotifyDateInvalid && (
                        <span className="text-[11px] font-bold text-rose-600 mt-1 block">
                          ⚠️ 照會日不可早於審核通過日 ({targetDateStr})
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>

              {['服務提供(第二輪)', '逾時未回覆', '無人力', '單位因素無法接案'].includes(dispatchResult) && (
                <div className="col-span-1 md:col-span-3">
                  <label htmlFor="secondRoundReason" className="block text-xs font-bold text-slate-650 mb-1.5">
                    {dispatchResult} 原因/備註 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="secondRoundReason"
                    required
                    value={secondRoundReason}
                    onChange={(e) => setSecondRoundReason(e.target.value)}
                    className="w-full rounded-lg border border-slate-250 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder={`請填寫 ${dispatchResult} 原因/備註...`}
                  />
                </div>
              )}

              {dispatchResult && (
                <div className="col-span-1 md:col-span-3 bg-purple-50/70 border border-purple-200/80 rounded-xl p-3 text-xs space-y-2 shadow-sm mt-1">
                  <div className="font-bold text-purple-900 flex items-center gap-1.5">
                    <span>💡 派案結果影響即時預覽</span>
                    <span className="text-[11px] text-purple-600 font-normal">（依據「指派 B 單位」與「派案結果」自動判定）</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700">
                    <div className="flex items-center gap-1.5 bg-white/80 px-3 py-2 rounded-lg border border-purple-100">
                      <span className="font-semibold text-slate-500">BA 內轉率：</span>
                      {serviceContent === 'BA' && ['新案_初評', '新案_出備', '自行發掘'].includes(dispatchType) ? (
                        bUnitName === YUKANG_NAME && dispatchResult === '服務提供' ? (
                          <span className="text-emerald-700 font-bold">✅ 計入分子 (+1 提升內轉率)</span>
                        ) : (
                          <span className="text-rose-600 font-bold">❌ 計入分母，不計分子 (+0)</span>
                        )
                      ) : (
                        <span className="text-slate-500 font-medium">非 BA 新案範疇 (不影響內轉率)</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 bg-white/80 px-3 py-2 rounded-lg border border-purple-100">
                      <span className="font-semibold text-slate-500">輪序次數：</span>
                      {(() => {
                        const isYukang = bUnitName === YUKANG_NAME;
                        if (dispatchResult === '服務提供') {
                          return <span className="text-purple-700 font-bold">次數 +1 (第一輪派案，順位後移)</span>;
                        }
                        if (dispatchResult === '服務提供(第二輪)' || dispatchResult === '出備已派案') {
                          return isYukang ? (
                            <span className="text-purple-700 font-bold">次數 +1 (悠康第二輪/出備案)</span>
                          ) : (
                            <span className="text-emerald-700 font-bold">次數 +0 (外單位被動救援保護，順位不扣)</span>
                          );
                        }
                        if (['逾時未回覆', '無人力', '單位因素無法接案'].includes(dispatchResult)) {
                          return <span className="text-amber-700 font-bold">次數 +1 (順位後移)</span>;
                        }
                        if (['外單位自開案', '案主指定(本單位)'].includes(dispatchResult)) {
                          return <span className="text-blue-700 font-bold">次數 +0 (指定/自開案，不計輪排)</span>;
                        }
                        if (dispatchResult === '派案後取消') {
                          return <span className="text-slate-600 font-bold">次數 +0 (取消派案)</span>;
                        }
                        if (dispatchResult === '違規停派') {
                          return <span className="text-rose-700 font-bold">次數 +0 (自動設為停派中，違規次數 +1)</span>;
                        }
                        return <span className="text-slate-500">次數 +0</span>;
                      })()}
                    </div>
                  </div>
                </div>
              )}
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

          {/* 四、單位回覆時效/異常追蹤 (對應五大表 報表 4 欄位結構) */}
          <div>
            <div className="bg-[#e0f2fe] border-l-4 border-[#0284c7] px-4 py-1.5 rounded-r-lg mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-sky-900 m-0">
                四、單位回覆時效/異常追蹤
              </h3>
              <span className="text-[11px] font-semibold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded">
                報表 4 派案單位追蹤異常回復表
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 原因分類 */}
              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1.5">
                  原因分類 (案家 / 個案 / 單位 / 其他)
                </label>
                <select
                  value={anomalyReasonType}
                  onChange={(e) => setAnomalyReasonType(e.target.value)}
                  className="w-full rounded-lg border border-slate-250 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">-- 無異常 --</option>
                  <option value="案家">案家</option>
                  <option value="個案">個案</option>
                  <option value="單位">單位</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              {/* 異常發生日 (設定日期) */}
              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1.5">
                  異常發生日 (設定日期)
                </label>
                <input
                  type="date"
                  value={anomalyDate}
                  onChange={(e) => setAnomalyDate(e.target.value)}
                  onPaste={handleDatePaste(setAnomalyDate, 'date')}
                  className="w-full rounded-lg border border-slate-250 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* 單位回覆日 */}
              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1.5">
                  服務單位回復日期 (單位回覆日)
                </label>
                <input
                  type="date"
                  value={bUnitReplyDate}
                  onChange={(e) => setBUnitReplyDate(e.target.value)}
                  onPaste={handleDatePaste(setBUnitReplyDate, 'date')}
                  className="w-full rounded-lg border border-slate-250 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* 首次服務日期 */}
              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1.5">
                  首次服務日期 (實際進場日)
                </label>
                <input
                  type="date"
                  value={firstServiceDate}
                  onChange={(e) => setFirstServiceDate(e.target.value)}
                  onPaste={handleDatePaste(setFirstServiceDate, 'date')}
                  className="w-full rounded-lg border border-slate-250 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* 超過天數 (手動輸入天數) */}
              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1.5">
                  超過天數 (請輸入天數)
                </label>
                <input
                  type="number"
                  min="0"
                  value={overdueDays}
                  onChange={(e) => setOverdueDays(e.target.value)}
                  placeholder="例: 3"
                  className="w-full rounded-lg border border-slate-250 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-bold text-slate-800"
                />
              </div>

              {/* 異常事項 (品質類別) */}
              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1.5">
                  異常事項 (品質類別)
                </label>
                <input
                  type="text"
                  value={anomalyCategory}
                  onChange={(e) => setAnomalyCategory(e.target.value)}
                  placeholder="文字備註，若無則空白..."
                  className="w-full rounded-lg border border-slate-250 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* 異常內容摘述 */}
              <div className="col-span-1 md:col-span-3">
                <label className="block text-xs font-bold text-slate-650 mb-1.5">
                  異常內容摘述
                </label>
                <textarea
                  rows={2}
                  value={anomalySummary}
                  onChange={(e) => setAnomalySummary(e.target.value)}
                  placeholder="文字備註，若無則空白..."
                  className="w-full rounded-lg border border-slate-250 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* 後續追蹤/辦理情形 */}
              <div className="col-span-1 md:col-span-3">
                <label className="block text-xs font-bold text-slate-650 mb-1.5">
                  後續追蹤 / 辦理情形
                </label>
                <input
                  type="text"
                  value={followUpStatus}
                  onChange={(e) => setFollowUpStatus(e.target.value)}
                  placeholder="文字備註，若無則空白..."
                  className="w-full rounded-lg border border-slate-250 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* 其他 */}
              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1.5">
                  其他
                </label>
                <input
                  type="text"
                  value={otherNote}
                  onChange={(e) => setOtherNote(e.target.value)}
                  placeholder="文字備註，若無則空白..."
                  className="w-full rounded-lg border border-slate-250 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* 備註 */}
              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1.5">
                  備註
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="文字備註，若無則空白..."
                  className="w-full rounded-lg border border-slate-250 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>
          </>
          )}

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

          {/* 底端操作按鈕 (保留儲存按鈕) */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 mt-4">
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
