import { useState } from 'react';
import { useCases } from '../contexts/CaseContext';
import { useStaff } from '../contexts/StaffContext';
import CaseForm from '../components/CaseForm';
import ConfirmDialog from '../components/ConfirmDialog';
import { Search, UserPlus, Edit3, Archive, MapPin } from 'lucide-react';

export default function ActiveCases() {
  const { cases, closeCase } = useCases();
  const { staffList } = useStaff();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [confirmCloseId, setConfirmCloseId] = useState(null);
  const [selectedArea, setSelectedArea] = useState('全部');

  // 獲取所有人員實際服務的區域以做動態篩選
  const staffAreas = Array.from(new Set(staffList.map((s) => s.area).filter(Boolean)));

  // 搜尋與區域過濾：案號、姓名、個管員
  const activeCasesList = cases.filter(
    (c) =>
      !c.isClosed &&
      (selectedArea === '全部' || c.area === selectedArea) &&
      (c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.supervisor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (c) => {
    setEditingCase(c);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setEditingCase(null);
    setIsFormOpen(true);
  };

  const triggerCloseCase = (id) => {
    setConfirmCloseId(id);
  };

  const confirmClose = () => {
    closeCase(confirmCloseId);
    setConfirmCloseId(null);
  };

  // 格式化日期為 YYYY/MM/DD
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const datePart = dateStr.split('T')[0];
    return datePart.replace(/-/g, '/');
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
      
      {/* 頂部操作列（符合附圖二橫向灰底工具列佈局） */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-[#f8fafc] border border-slate-200 rounded-xl p-3 mb-4 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleNew}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-sm transition shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-blue-500" />
            新增個案
          </button>
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm shadow-sm">
            <MapPin className="w-4 h-4 text-red-500 shrink-0" />
            <span className="font-bold text-slate-650 shrink-0">區域篩選：</span>
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
        </div>
        
        <div className="flex items-center gap-2">
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

      {/* 列表區塊（符合附圖二表頭與欄位樣式，支援無人力等隱性資訊副標） */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f1f5f9] border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <th className="px-6 py-3 w-20 text-center">功能</th>
                <th className="px-6 py-3 w-28 text-center">區域</th>
                <th className="px-6 py-3 w-36">案號</th>
                <th className="px-6 py-3 w-40">姓名</th>
                <th className="px-6 py-3">計畫最初送審日 *</th>
                <th className="px-6 py-3 w-40">規定完成期限</th>
                <th className="px-6 py-3 text-center w-32">時效狀態</th>
                <th className="px-6 py-3 w-32">主責個管</th>
                <th className="px-6 py-3 text-center w-28">基本作業</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {activeCasesList.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-slate-400">
                    目前無符合條件之個案
                  </td>
                </tr>
              ) : (
                activeCasesList.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                    {/* 功能：編輯筆 */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleEdit(c)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition cursor-pointer"
                        title="編輯個案"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>

                    {/* 區域 */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-2.5 py-1 bg-blue-50 text-[#1e3a8a] border border-blue-100 rounded-lg text-xs font-bold">
                        {c.area || '未設區'}
                      </span>
                    </td>

                    {/* 案號 */}
                    <td className="px-6 py-4">
                      <div className="font-mono font-medium text-slate-800">{c.id}</div>
                      {/* 隱性資訊：服務類別 BA/D */}
                      <span className={`inline-block px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-bold mt-0.5`}>
                        {c.serviceContent}
                      </span>
                    </td>

                    {/* 姓名：性別點 + 姓名 */}
                    <td className="px-6 py-4">
                      <div className="flex items-center font-bold text-slate-700">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 shrink-0 ${c.gender === 'M' ? 'bg-[#3b82f6]' : 'bg-[#ec4899]'}`}></span>
                        {c.name}
                      </div>
                      {/* 隱性資訊：指派單位與派案結果 */}
                      {c.bUnitName && (
                        <div className="text-[10px] text-slate-400 truncate mt-0.5 max-w-[150px]">
                          {c.bUnitName} - {c.dispatchResult || '未回覆'}
                        </div>
                      )}
                    </td>

                    {/* 照專計畫通過日 (起日) * */}
                    <td className="px-6 py-4 text-slate-600 font-mono">
                      {formatDateTime(c.approvalDate)}
                    </td>

                    {/* 規定完成期限 */}
                    <td className="px-6 py-4 font-mono text-slate-600 font-medium">
                      {formatDateTime(c.deadlineDate)}
                    </td>

                    {/* 時效狀態 */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-bold ${
                        c.status === '超時效' 
                          ? 'bg-[#ffe4e6] text-[#e11d48]' 
                          : 'bg-[#dcfce7] text-[#16a34a]'
                      }`}>
                        {c.status}
                      </span>
                    </td>

                    {/* 主責個管 */}
                    <td className="px-6 py-4 text-slate-600 font-bold">
                      {c.supervisor}
                    </td>

                    {/* 基本作業：結案按鈕 */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => triggerCloseCase(c.id)}
                        aria-label="結案歸檔"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#334155] hover:bg-[#1e293b] text-white text-xs font-bold rounded transition shadow-sm cursor-pointer"
                        title="結案歸檔"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        結案
                      </button>
                    </td>
                  </tr>
                ))
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
        isOpen={confirmCloseId !== null}
        title="確認結案歸檔？"
        message="結案歸檔後個案資料將轉為唯讀唯讀狀態，且不可還原，確定要結案嗎？"
        onConfirm={confirmClose}
        onCancel={() => setConfirmCloseId(null)}
      />
    </div>
  );
}
