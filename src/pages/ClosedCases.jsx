import { useState } from 'react';
import { useCases } from '../contexts/CaseContext';
import { useAuth } from '../contexts/AuthContext';
import CaseForm from '../components/CaseForm';
import { Search, Eye, Archive, Trash2, Edit3, RotateCcw, X } from 'lucide-react';

export default function ClosedCases() {
  const { cases, deleteCase, reopenCase } = useCases();
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [editingCase, setEditingCase] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleDelete = async (id) => {
    if (window.confirm('確定要刪除此已結案個案嗎？此動作無法復原！')) {
      await deleteCase(id);
      if (selectedCase?.id === id) {
        setSelectedCase(null);
      }
    }
  };

  const handleReopen = async (id) => {
    if (window.confirm('確定要將此個案重新恢復為「進行中在案個案」嗎？')) {
      await reopenCase(id);
      if (selectedCase?.id === id) {
        setSelectedCase(null);
      }
    }
  };

  const handleEdit = (c) => {
    setEditingCase(c);
    setIsFormOpen(true);
  };

  // 搜尋過濾已結案的個案
  const closedCasesList = cases.filter(
    (c) =>
      c.isClosed &&
      (c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.supervisor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* 頂部操作列 */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-[#f8fafc] border border-slate-200 rounded-xl p-3 mb-4 gap-4">
        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <Archive className="w-4 h-4 text-slate-400" />
          <span>已結案個案存檔</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-600">搜尋：</span>
          <div className="relative">
            <input
              type="text"
              placeholder="搜尋已結案案號、姓名、個管員姓名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-slate-250 pl-3 pr-8 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-64 shadow-inner"
            />
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* 列表與檢視區塊 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 左側：已結案列表 */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f1f5f9] border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                  <th className="px-6 py-3">案主資訊</th>
                  <th className="px-6 py-3 w-28">服務項目</th>
                  <th className="px-6 py-3">派案結果</th>
                  <th className="px-6 py-3 text-center w-28">時效</th>
                  <th className="px-6 py-3 text-right w-44">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {closedCasesList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                      目前無已歸檔個案
                    </td>
                  </tr>
                ) : (
                  closedCasesList.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center font-bold text-slate-700">
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 shrink-0 ${c.gender === 'M' ? 'bg-[#3b82f6]' : 'bg-[#ec4899]'}`}></span>
                          {c.name}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          案號：{c.id} | 主責：{c.supervisor}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                          {c.serviceContent}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-700 font-medium">{c.bUnitName || '（未派案）'}</div>
                        <div className="text-xs text-slate-400 mt-1">{c.dispatchResult}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                          c.status === '超時效' 
                            ? 'bg-[#ffe4e6] text-[#e11d48]' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedCase((prev) => (prev?.id === c.id ? null : c))}
                            className={`inline-flex items-center gap-0.5 text-xs font-bold transition cursor-pointer px-1.5 py-0.5 rounded ${
                              selectedCase?.id === c.id
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-blue-650 hover:text-blue-700 hover:bg-blue-50'
                            }`}
                            title={selectedCase?.id === c.id ? '收合詳細資料' : '檢視詳細資料'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            檢視
                          </button>
                          <button
                            onClick={() => handleEdit(c)}
                            className="inline-flex items-center gap-0.5 text-xs text-purple-650 hover:text-purple-700 font-bold transition cursor-pointer"
                            title="重複編輯 / 補全資料"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            編輯
                          </button>
                          <button
                            onClick={() => handleReopen(c.id)}
                            className="inline-flex items-center gap-0.5 text-xs text-emerald-650 hover:text-emerald-700 font-bold transition cursor-pointer"
                            title="恢復為進行中個案"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            重開
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="inline-flex items-center gap-0.5 text-xs text-red-650 hover:text-red-700 font-bold transition cursor-pointer"
                              title="刪除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 右側：詳細唯讀資訊 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 m-0">
              歸檔個案詳細資料
            </h3>
            {selectedCase && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(selectedCase)}
                  className="inline-flex items-center gap-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  補全/編輯此案
                </button>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                  title="收合詳細資料"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {selectedCase ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 block">案主姓名</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedCase.name}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 block">案號</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedCase.id}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 block">性別</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedCase.gender === 'M' ? '男' : '女'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 block">主責個管</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedCase.supervisor}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 block">區域</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedCase.area || '未設區'}</span>
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-500 text-xs">計畫最初送審日：</span>
                  <span className="text-slate-700 dark:text-slate-300 text-xs">
                    {selectedCase.approvalDate ? selectedCase.approvalDate.replace('T', ' ') : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-500 text-xs">系統規定完成期限：</span>
                  <span className="text-slate-700 dark:text-slate-300 text-xs">
                    {selectedCase.deadlineDate ? selectedCase.deadlineDate.replace('T', ' ') : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-slate-500 text-xs">照顧計畫審核通過日：</span>
                  <span className="text-slate-700 dark:text-slate-300 text-xs">
                    {selectedCase.submitDate ? selectedCase.submitDate.replace('T', ' ') : '-'}
                  </span>
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              <div className="space-y-2">
                <div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 block">指派 B 單位：</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedCase.bUnitName || '無'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 block">派案結果：</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedCase.dispatchResult || '無'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 block">B單位回復日期：</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedCase.bUnitReplyDate || '未填寫'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 block">第一次服務日期：</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedCase.firstServiceDate || '未填寫'}</span>
                </div>
                {selectedCase.secondRoundReason && (
                  <div className="bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/30 rounded-2xl p-3 mt-2">
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold block mb-1">
                      {selectedCase.dispatchResult ? `${selectedCase.dispatchResult} 原因/備註：` : '派案原因/備註：'}
                    </span>
                    <p className="text-xs text-slate-650 dark:text-slate-400 leading-relaxed">
                      {selectedCase.secondRoundReason}
                    </p>
                  </div>
                )}
                {selectedCase.delayReason && (
                  <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-3 mt-2">
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold block mb-1">
                      時效逾時說明：
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {selectedCase.delayReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
              點擊列表中的「檢視」按鈕查看詳細資訊
            </div>
          )}
        </div>

      </div>

      {/* 編輯/補全個案彈窗 */}
      {isFormOpen && (
        <CaseForm
          activeCase={editingCase}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
