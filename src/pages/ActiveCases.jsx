import React, { useState } from 'react';
import { useCases } from '../contexts/CaseContext';
import { useStaff } from '../contexts/StaffContext';
import CaseForm from '../components/CaseForm';
import ConfirmDialog from '../components/ConfirmDialog';
import { Search, UserPlus, Edit3, Archive, MapPin, Tag, ChevronDown, ChevronRight, Layers, Users, FileText } from 'lucide-react';

export default function ActiveCases() {
  const { cases, closeCase } = useCases();
  const { staffList } = useStaff();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('全部');
  const [selectedServiceCode, setSelectedServiceCode] = useState('全部');
  const [expandedCaseIds, setExpandedCaseIds] = useState(new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [confirmCloseTarget, setConfirmCloseTarget] = useState(null);

  // 獲取所有人員實際服務的區域以做動態篩選
  const staffAreas = Array.from(new Set(staffList.map((s) => s.area).filter(Boolean)));

  // 獲取目前所有非結案個案中出現過的所有服務碼別 (動態分類)
  const availableServiceCodes = Array.from(
    new Set(cases.filter((c) => !c.isClosed && c.serviceContent).map((c) => c.serviceContent))
  ).sort();

  // 篩選進行中個案（依區域、服務碼別、搜尋關鍵字）
  const filteredActiveCases = cases.filter((c) => {
    if (c.isClosed) return false;
    if (selectedArea !== '全部' && c.area !== selectedArea) return false;
    if (selectedServiceCode !== '全部' && c.serviceContent !== selectedServiceCode) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchId = (c.id || '').toLowerCase().includes(term);
      const matchName = (c.name || '').toLowerCase().includes(term);
      const matchSupervisor = (c.supervisor || '').toLowerCase().includes(term);
      const matchService = (c.serviceContent || '').toLowerCase().includes(term);
      if (!matchId && !matchName && !matchSupervisor && !matchService) return false;
    }
    return true;
  });

  // 即時統計數據（依案號之總個案數 與 總服務項目數）
  const totalUniqueCases = new Set(filteredActiveCases.map((c) => c.id)).size;
  const totalServiceItems = filteredActiveCases.length;

  // 依「案號 (id)」分組個案，實現同案號多碼別摺疊
  const groupedCasesMap = new Map();
  filteredActiveCases.forEach((c) => {
    if (!groupedCasesMap.has(c.id)) {
      groupedCasesMap.set(c.id, []);
    }
    groupedCasesMap.get(c.id).push(c);
  });

  const groupedCasesList = Array.from(groupedCasesMap.entries()).map(([caseId, items]) => ({
    caseId,
    items,
    primaryItem: items[0],
  }));

  const toggleExpand = (caseId) => {
    setExpandedCaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(caseId)) {
        next.delete(caseId);
      } else {
        next.add(caseId);
      }
      return next;
    });
  };

  const handleEdit = (c) => {
    setEditingCase(c);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setEditingCase(null);
    setIsFormOpen(true);
  };

  const triggerCloseCase = (target) => {
    setConfirmCloseTarget(target);
  };

  const confirmClose = () => {
    if (confirmCloseTarget) {
      closeCase(confirmCloseTarget);
      setConfirmCloseTarget(null);
    }
  };

  // 格式化日期時間為 YYYY/MM/DD HH:mm
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';
    const parts = dateTimeStr.split('T');
    const datePart = parts[0].replace(/-/g, '/');
    const timePart = parts[1] || '';
    return `${datePart} ${timePart}`;
  };

  return (
    <div className="space-y-6">
      
      {/* 頂部操作列：新增按鈕、區域篩選、碼別篩選、統計數據與搜尋列 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-[#f8fafc] border border-slate-200 rounded-xl p-3 mb-4 gap-4">
        
        {/* 左側操作與動態篩選群組 */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleNew}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-sm transition shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-blue-500" />
            新增個案
          </button>

          {/* 區域篩選 */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm shadow-sm">
            <MapPin className="w-4 h-4 text-red-500 shrink-0" />
            <span className="font-bold text-slate-650 shrink-0">區域：</span>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="border-none bg-transparent focus:outline-none font-bold text-slate-700 cursor-pointer text-sm"
            >
              <option value="全部">全部區域</option>
              {staffAreas.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          {/* 碼別篩選 (可快速打字/選取) */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm shadow-sm">
            <Tag className="w-4 h-4 text-purple-500 shrink-0" />
            <span className="font-bold text-slate-650 shrink-0">碼別：</span>
            <select
              value={selectedServiceCode}
              onChange={(e) => setSelectedServiceCode(e.target.value)}
              className="border-none bg-transparent focus:outline-none font-bold text-purple-700 cursor-pointer text-sm min-w-[90px]"
            >
              <option value="全部">全部碼別</option>
              {availableServiceCodes.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>

          {/* 即時統計數據標籤 (緊鄰區域與碼別篩選) */}
          <div className="flex items-center gap-3 bg-slate-100/90 border border-slate-250/70 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-700">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>總個案數：</span>
              <span className="text-blue-700 font-extrabold text-sm">{totalUniqueCases}</span>
              <span className="text-slate-500 font-normal">人</span>
            </div>
            <div className="h-3.5 w-[1px] bg-slate-300"></div>
            <div className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>總服務項目：</span>
              <span className="text-purple-700 font-extrabold text-sm">{totalServiceItems}</span>
              <span className="text-slate-500 font-normal">項</span>
            </div>
          </div>
        </div>
        
        {/* 右側關鍵字搜尋列 */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-slate-600">搜尋：</span>
          <div className="relative">
            <input
              type="text"
              placeholder="搜尋案號、姓名、個管員姓名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-slate-250 pl-3 pr-8 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-64 shadow-inner"
            />
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* 列表區塊（同案號碼別折疊） */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f1f5f9] border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <th className="px-3 py-3 w-16 text-center">功能</th>
                <th className="px-3 py-3 w-16 text-center">展開</th>
                <th className="px-6 py-3 w-28 text-center">區域</th>
                <th className="px-6 py-3 w-40">案號</th>
                <th className="px-6 py-3 w-40">姓名</th>
                <th className="px-6 py-3">計畫最初送審日 *</th>
                <th className="px-6 py-3 w-40">規定完成期限</th>
                <th className="px-6 py-3 text-center w-28">時效狀態</th>
                <th className="px-6 py-3 w-28">主責個管</th>
                <th className="px-6 py-3 text-center w-28">基本作業</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {groupedCasesList.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-slate-400">
                    目前無符合條件之個案
                  </td>
                </tr>
              ) : (
                groupedCasesList.map(({ caseId, items, primaryItem }) => {
                  const isExpanded = expandedCaseIds.has(caseId) || selectedServiceCode !== '全部';
                  const hasMultiple = items.length > 1;

                  return (
                    <React.Fragment key={caseId}>
                      {/* 主要個案列 */}
                      <tr className={`hover:bg-slate-50/70 transition ${hasMultiple ? 'bg-slate-50/30' : ''}`}>
                        {/* 功能按鈕：編輯圖示 */}
                        <td className="px-3 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleEdit(primaryItem)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="編輯個案"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>

                        {/* 展開欄位：使用 + 和 - 符號代表展開與折疊狀態 */}
                        <td className="px-3 py-4 text-center">
                          {hasMultiple ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(caseId)}
                              className={`w-7 h-7 rounded-lg font-extrabold flex items-center justify-center text-sm shadow-sm transition cursor-pointer ${
                                isExpanded
                                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                  : 'bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200'
                              }`}
                              title={isExpanded ? "點擊收合多筆服務紀錄 (-)" : "點擊展開多筆服務紀錄 (+)"}
                            >
                              {isExpanded ? '-' : '+'}
                            </button>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>

                        {/* 區域 */}
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block px-2.5 py-1 bg-blue-50 text-[#1e3a8a] border border-blue-100 rounded-lg text-xs font-bold">
                            {primaryItem.area || '未設區'}
                          </span>
                        </td>

                        {/* 案號與服務碼別標籤 */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-medium text-slate-800">{caseId}</span>
                            {hasMultiple && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-extrabold shrink-0">
                                <Layers className="w-3 h-3" />
                                {items.length} 碼
                              </span>
                            )}
                          </div>
                          {/* 呈現該案號下所有服務碼別 badge */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {items.map((item) => (
                              <span
                                key={item.serviceContent}
                                className="inline-block px-1.5 py-0.2 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold"
                              >
                                {item.serviceContent}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* 姓名 */}
                        <td className="px-6 py-4">
                          <div className="flex items-center font-bold text-slate-700">
                            <span className={`inline-block w-2 h-2 rounded-full mr-2 shrink-0 ${primaryItem.gender === 'M' ? 'bg-[#3b82f6]' : 'bg-[#ec4899]'}`}></span>
                            {primaryItem.name}
                          </div>
                          {primaryItem.bUnitName && (
                            <div className="text-[10px] text-slate-400 truncate mt-0.5 max-w-[160px]">
                              {primaryItem.bUnitName} - {primaryItem.dispatchResult || '未回覆'}
                            </div>
                          )}
                        </td>

                        {/* 起日 (計畫最初送審日 / 轉介日期) */}
                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                          {hasMultiple ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(caseId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-lg border border-purple-200 transition cursor-pointer"
                              title={isExpanded ? "點擊收合多筆服務紀錄" : "點擊展開查看個案多筆日期紀錄"}
                            >
                              展開看更多
                            </button>
                          ) : (
                            primaryItem.recordCategory === 'referral' || (primaryItem.serviceContent && primaryItem.serviceContent.startsWith('轉介_')) ? (
                              <div>
                                <span className="block text-[10px] text-purple-600 font-bold mb-0.5">轉介日期</span>
                                <span>{primaryItem.referralDate ? formatDateTime(primaryItem.referralDate) : '-'}</span>
                              </div>
                            ) : (
                              formatDateTime(primaryItem.approvalDate)
                            )
                          )}
                        </td>

                        {/* 完成期限 / 轉介回覆日期 */}
                        <td className="px-6 py-4 font-mono text-slate-600 font-medium text-xs">
                          {hasMultiple ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(caseId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-lg border border-purple-200 transition cursor-pointer"
                              title={isExpanded ? "點擊收合多筆服務紀錄" : "點擊展開查看個案多筆期限紀錄"}
                            >
                              展開看更多
                            </button>
                          ) : (
                            primaryItem.recordCategory === 'referral' || (primaryItem.serviceContent && primaryItem.serviceContent.startsWith('轉介_')) ? (
                              <div>
                                <span className="block text-[10px] text-purple-600 font-bold mb-0.5">轉介回覆日期</span>
                                <span>{primaryItem.referralReplyDate ? formatDateTime(primaryItem.referralReplyDate) : '-'}</span>
                              </div>
                            ) : (
                              formatDateTime(primaryItem.deadlineDate)
                            )
                          )}
                        </td>

                        {/* 時效狀態 */}
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded text-xs font-bold ${
                            primaryItem.status === '超時效' 
                              ? 'bg-[#ffe4e6] text-[#e11d48]' 
                              : 'bg-[#dcfce7] text-[#16a34a]'
                          }`}>
                            {primaryItem.status}
                          </span>
                        </td>

                        {/* 主責個管 */}
                        <td className="px-6 py-4 text-slate-600 font-bold text-xs">
                          {primaryItem.supervisor}
                        </td>

                        {/* 結案按鈕 */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => triggerCloseCase(primaryItem)}
                            aria-label="結案歸檔"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#334155] hover:bg-[#1e293b] text-white text-xs font-bold rounded transition shadow-sm cursor-pointer"
                            title="結案歸檔"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            結案
                          </button>
                        </td>
                      </tr>

                      {/* 若為多服務碼別且處於展開狀態，渲染各碼別子項目列表 */}
                      {hasMultiple && isExpanded && items.map((subItem, idx) => {
                        const isSubReferral = subItem.recordCategory === 'referral' || (subItem.serviceContent && subItem.serviceContent.startsWith('轉介_'));
                        return (
                          <tr key={`${subItem.id}_${subItem.serviceContent}_${idx}`} className="bg-purple-50/40 hover:bg-purple-50/80 transition border-l-4 border-purple-500">
                            <td className="px-3 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleEdit(subItem)}
                                className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded transition cursor-pointer"
                                title={`編輯 ${subItem.serviceContent} 碼別資料`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                            <td className="px-3 py-2.5 text-center text-xs font-bold text-purple-600 font-mono">
                              └─
                            </td>
                            <td className="px-6 py-2.5 text-center">
                              <span className="inline-block px-2 py-0.5 bg-blue-50/80 text-[#1e3a8a] border border-blue-100 rounded text-[11px] font-bold">
                                {subItem.area || '未設區'}
                              </span>
                            </td>
                            <td className="px-6 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-semibold text-slate-700">{subItem.id}</span>
                                <span className="inline-block px-2 py-0.5 bg-purple-600 text-white rounded font-mono font-bold text-xs">
                                  {subItem.serviceContent} 碼
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-2.5 text-xs text-slate-700">
                              <div className="font-bold text-purple-950">{subItem.name}</div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[160px]">{subItem.bUnitName || '未指定單位'} - {subItem.dispatchResult || '未回覆'}</div>
                            </td>
                            <td className="px-6 py-2.5 font-mono text-xs text-slate-600">
                              {isSubReferral ? (
                                <div>
                                  <span className="block text-[10px] text-purple-600 font-bold mb-0.5">轉介日期</span>
                                  <span>{subItem.referralDate ? formatDateTime(subItem.referralDate) : '-'}</span>
                                </div>
                              ) : (
                                formatDateTime(subItem.approvalDate)
                              )}
                            </td>
                            <td className="px-6 py-2.5 font-mono text-xs text-slate-600">
                              {isSubReferral ? (
                                <div>
                                  <span className="block text-[10px] text-purple-600 font-bold mb-0.5">轉介回覆日期</span>
                                  <span>{subItem.referralReplyDate ? formatDateTime(subItem.referralReplyDate) : '-'}</span>
                                </div>
                              ) : (
                                formatDateTime(subItem.deadlineDate)
                              )}
                            </td>
                          <td className="px-6 py-2.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                              subItem.status === '超時效' 
                                ? 'bg-rose-100 text-rose-700' 
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {subItem.status}
                            </span>
                          </td>
                          <td className="px-6 py-2.5 text-xs text-slate-600">
                            {subItem.supervisor}
                          </td>
                          <td className="px-6 py-2.5 text-center">
                            <button
                              onClick={() => triggerCloseCase(subItem)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white text-[11px] font-bold rounded transition cursor-pointer"
                              title={`將 ${subItem.serviceContent} 碼別單獨結案`}
                            >
                              <Archive className="w-3 h-3" />
                              結案碼別
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增/編輯彈窗 */}
      {isFormOpen && (
        <CaseForm
          activeCase={editingCase}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      {/* 結案確認框 */}
      <ConfirmDialog
        isOpen={confirmCloseTarget !== null}
        title="確認結案歸檔？"
        message="結案歸檔後個案將移至「已結案存檔」，您與其他使用者仍可隨時進行編輯與資料補全。確定要結案嗎？"
        onConfirm={confirmClose}
        onCancel={() => setConfirmCloseTarget(null)}
      />
    </div>
  );
}
