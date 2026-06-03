import { useState } from 'react';
import { useUnits } from '../contexts/UnitContext';
import { useCases } from '../contexts/CaseContext';
import { calculateUnitStats, sortUnits } from '../utils/unitSorter';
import { Search, Plus, Ban, CheckCircle, Calendar, X } from 'lucide-react';

export default function Units() {
  const { units, toggleStopUnit, addUnit } = useUnits();
  const { cases } = useCases();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // 新單位表單狀態
  const [newName, setNewName] = useState('');
  const [newServices, setNewServices] = useState(['BA']);
  const [newIsStopped, setNewIsStopped] = useState(false);

  // 1. 計算所有單位的即時統計數據與排序
  const statsUnits = calculateUnitStats(units, cases);
  const sortedUnits = sortUnits(statsUnits);

  // 2. 搜尋過濾：單位名稱
  const filteredUnits = sortedUnits.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 處理新增單位
  const handleAddUnit = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    addUnit({
      name: newName,
      services: newServices,
      isStopped: newIsStopped,
    });
    
    // 重設狀態
    setNewName('');
    setNewServices(['BA']);
    setNewIsStopped(false);
    setIsAddOpen(false);
  };

  const handleServiceChange = (service) => {
    setNewServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 頂部操作列 */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-[#f8fafc] border border-slate-200 rounded-xl p-3 mb-4 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-sm transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-purple-600" />
            新增合作單位
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-600">搜尋：</span>
          <div className="relative">
            <input
              type="text"
              placeholder="搜尋單位名稱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-slate-250 pl-3 pr-8 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-64 shadow-inner"
            />
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* 單位列表 */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f1f5f9] border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <th className="px-6 py-4 text-center w-16">順位</th>
                <th className="px-6 py-4">單位名稱</th>
                <th className="px-6 py-4 text-center">服務內容</th>
                <th className="px-6 py-4 text-center">總派案</th>
                <th className="px-6 py-4 text-center">成功輪派</th>
                <th className="px-6 py-4 text-center">指定本/它</th>
                <th className="px-6 py-4 text-center">違規停派</th>
                <th className="px-6 py-4">最後成功接案日</th>
                <th className="px-6 py-4 text-right">合作狀態 / 操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    目前無符合條件之單位
                  </td>
                </tr>
              ) : (
                filteredUnits.map((u, index) => {
                  // 決定序號，若是停派狀態則顯示 "-"
                  const displayIndex = u.isStopped ? '-' : index + 1;
                  
                  return (
                    <tr
                      key={u.id}
                      className={`transition ${
                        u.isStopped
                          ? 'opacity-50 bg-slate-50/50 dark:bg-slate-950/20 grayscale'
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-850/30'
                      }`}
                    >
                      <td className="px-6 py-4 text-center font-bold text-slate-500 dark:text-slate-400">
                        {displayIndex}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {u.name}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          ID: {u.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-1">
                          {u.services.map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-md text-[10px] font-bold"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-slate-700 dark:text-slate-300">
                        {u.dispatchCount || 0}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-purple-600 dark:text-purple-400">
                        {u.successCount || 0}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-550 dark:text-slate-450 text-xs">
                        {u.designatedThis || 0} / {u.designatedOther || 0}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-rose-500">
                        {u.stopCount || 0}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {u.latestSuccessTime
                              ? new Date(u.latestSuccessTime).toLocaleString('zh-TW', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '無紀錄'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggleStopUnit(u.id)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all border ${
                            u.isStopped
                              ? 'bg-rose-50 border-rose-250 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 hover:bg-rose-100'
                              : 'bg-emerald-50 border-emerald-250 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100'
                          }`}
                        >
                          {u.isStopped ? (
                            <>
                              <Ban className="w-3.5 h-3.5" />
                              停派中 (點擊啟用)
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              啟用中 (點擊停派)
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增單位彈窗 */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-white mb-0">新增合作 B 單位</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-full text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddUnit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  單位名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm bg-slate-50/50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  placeholder="請輸入單位完整名稱"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  支援服務 (複選)
                </label>
                <div className="flex gap-4 py-1">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newServices.includes('BA')}
                      onChange={() => handleServiceChange('BA')}
                      className="rounded text-purple-650 focus:ring-purple-500"
                    />
                    BA (居家照顧)
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newServices.includes('D')}
                      onChange={() => handleServiceChange('D')}
                      className="rounded text-purple-650 focus:ring-purple-500"
                    />
                    D (日間照顧)
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newIsStopped}
                    onChange={(e) => setNewIsStopped(e.target.checked)}
                    className="rounded text-purple-650 focus:ring-purple-500"
                  />
                  直接設定為停派/未合作
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 rounded-xl transition text-xs font-semibold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
                >
                  確認建立
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
