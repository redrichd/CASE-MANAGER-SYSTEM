import { useState } from 'react';
import { useUnits } from '../contexts/UnitContext';
import { useCases } from '../contexts/CaseContext';
import { calculateUnitStats, sortUnits } from '../utils/unitSorter';
import { Search, Plus, Ban, CheckCircle, Calendar, X, Star, Edit3 } from 'lucide-react';
import { SERVICE_CONTENTS } from '../constants/dispatchConstants';
import UnitEditModal from '../components/UnitEditModal';

const SERVICE_FILTERS = [
  { key: 'ALL', label: '全部' },
  { key: 'BA', label: '居服 (BA)' },
  { key: 'BB', label: '日照 (BB)' },
  { key: 'BC', label: '家托 (BC)' },
  { key: 'CA', label: '專業 (CA)' },
  { key: 'CB', label: '專業 (CB)' },
  { key: 'CC', label: '專業 (CC)' },
  { key: 'CD', label: '專業 (CD)' },
  { key: 'DA', label: '交通 (DA)' },
  { key: 'GA09', label: '居喘 (GA09)' },
  { key: 'GA03_04', label: '日照喘 (GA03/04)' },
  { key: 'GA05', label: '機構喘 (GA05)' },
  { key: 'GA06', label: '小多機能 (GA06)' },
  { key: 'GA07', label: '巷弄長照 (GA07)' },
  { key: 'SC09', label: '短照 (SC09)' },
];

export default function Units() {
  const { units, toggleStopUnit, addUnit, updateUnit } = useUnits();
  const { cases } = useCases();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);

  // 管理員編輯數據狀態
  const [adminEditingUnit, setAdminEditingUnit] = useState(null);
  const [overrideDispatch, setOverrideDispatch] = useState(0);
  const [overrideSuccess, setOverrideSuccess] = useState(0);
  const [overrideThis, setOverrideThis] = useState(0);
  const [overrideOther, setOverrideOther] = useState(0);
  const [overrideStop, setOverrideStop] = useState(0);
  
  // 新單位表單狀態
  const [newName, setNewName] = useState('');
  const [newServices, setNewServices] = useState(['BA']);
  const [newIsStopped, setNewIsStopped] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newAuthor, setNewAuthor] = useState('');
  const [newComment, setNewComment] = useState('');

  // 篩選服務內容狀態
  const [selectedServiceFilter, setSelectedServiceFilter] = useState('ALL');

  // 根據選擇的服務類別來過濾 cases 作為統計底數
  const getFilteredCasesForStats = () => {
    if (selectedServiceFilter === 'ALL') {
      return cases;
    }
    return cases.filter((c) => {
      const code = c.serviceContent;
      if (selectedServiceFilter === 'BA') return code === 'BA';
      if (selectedServiceFilter === 'BB') return code === 'BB';
      if (selectedServiceFilter === 'BC') return code === 'BC';
      if (selectedServiceFilter === 'CA') return code === 'CA';
      if (selectedServiceFilter === 'CB') return code === 'CB';
      if (selectedServiceFilter === 'CC') return code === 'CC';
      if (selectedServiceFilter === 'CD') return code === 'CD';
      if (selectedServiceFilter === 'DA') return code === 'DA';
      if (selectedServiceFilter === 'GA09') return code === 'GA09';
      if (selectedServiceFilter === 'GA03_04') return code === 'GA03' || code === 'GA04';
      if (selectedServiceFilter === 'GA05') return code === 'GA05';
      if (selectedServiceFilter === 'GA06') return code === 'GA06';
      if (selectedServiceFilter === 'GA07') return code === 'GA07';
      if (selectedServiceFilter === 'SC09') return code === 'SC09';
      return false;
    });
  };

  // 1. 計算所有單位的即時統計數據與排序
  const filteredCasesForStats = getFilteredCasesForStats();
  const statsUnits = calculateUnitStats(units, filteredCasesForStats);

  // 2. 根據選擇的服務類別，過濾掉不提供該服務的單位 (當選擇全部時不進行過濾)
  const serviceFilteredUnits = statsUnits.filter((u) => {
    if (selectedServiceFilter === 'ALL') return true;
    if (selectedServiceFilter === 'GA03_04') {
      return u.services && (u.services.includes('GA03') || u.services.includes('GA04'));
    }
    return u.services && u.services.includes(selectedServiceFilter);
  });

  const sortedUnits = sortUnits(serviceFilteredUnits);

  // 2. 搜尋過濾：單位名稱
  const filteredUnits = sortedUnits.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 處理新增單位
  const handleAddUnit = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    const initialComments = [];
    if (newAuthor.trim() && newComment.trim()) {
      initialComments.push({
        author: newAuthor.trim(),
        content: newComment.trim(),
        timestamp: new Date().toISOString(),
      });
    }
    
    addUnit({
      name: newName,
      services: newServices,
      isStopped: newIsStopped,
      rating: newRating,
      comments: initialComments,
    });
    
    // 重設狀態
    setNewName('');
    setNewServices(['BA']);
    setNewIsStopped(false);
    setNewRating(0);
    setNewAuthor('');
    setNewComment('');
    setIsAddOpen(false);
  };

  const handleServiceChange = (service) => {
    setNewServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleOpenAdminEdit = (u) => {
    setAdminEditingUnit(u);
    setOverrideDispatch(u.dispatchCount || 0);
    setOverrideSuccess(u.successCount || 0);
    setOverrideThis(u.designatedThis || 0);
    setOverrideOther(u.designatedOther || 0);
    setOverrideStop(u.stopCount || 0);
  };

  const handleSaveAdminEdit = (e) => {
    e.preventDefault();
    updateUnit(adminEditingUnit.id, {
      overrideStats: {
        dispatchCount: Number(overrideDispatch),
        successCount: Number(overrideSuccess),
        designatedThis: Number(overrideThis),
        designatedOther: Number(overrideOther),
        stopCount: Number(overrideStop),
        latestSuccessTime: adminEditingUnit.latestSuccessTime || 0
      }
    });
    setAdminEditingUnit(null);
  };

  const handleResetAdminEdit = () => {
    setOverrideDispatch(0);
    setOverrideSuccess(0);
    setOverrideThis(0);
    setOverrideOther(0);
    setOverrideStop(0);
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
          <span className="text-sm font-bold text-slate-650">搜尋：</span>
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

      {/* 服務類別統計標籤 */}
      <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4">
        <div className="text-xs font-bold text-slate-500 mb-2.5 flex items-center gap-1.5">
          <span>統計服務類別篩選：</span>
          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">切換後僅統計該服務的數據且僅顯示提供該服務的單位</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SERVICE_FILTERS.map((f) => {
            const isActive = selectedServiceFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setSelectedServiceFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer shadow-sm ${
                  isActive
                    ? 'bg-purple-600 border-purple-600 text-white shadow-purple-600/10'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 單位列表 */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f1f5f9] border-b border-slate-200 text-xs font-bold text-slate-650 uppercase">
                <th className="px-6 py-4 text-center w-16">順位</th>
                <th className="px-6 py-4">單位名稱</th>
                <th className="px-6 py-4 text-center">服務內容</th>
                <th className="px-6 py-4 text-center">總派案</th>
                <th className="px-6 py-4 text-center">成功輪派</th>
                <th className="px-6 py-4 text-center">指定本單位</th>
                <th className="px-6 py-4 text-center">指定它單位</th>
                <th className="px-6 py-4 text-center">違規停派</th>
                <th className="px-6 py-4">最後成功接案日</th>
                <th className="px-6 py-4 text-right">合作狀態 / 操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-slate-400">
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
                          ? 'opacity-50 bg-slate-50/50 grayscale'
                          : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="px-6 py-4 text-center font-bold text-slate-500">
                        {displayIndex}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-850">
                            {u.name}
                          </span>
                          {u.rating > 0 && (
                            <div className="flex gap-0.5" title={`${u.rating}星級優秀單位`}>
                              {Array.from({ length: u.rating }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          ID: {u.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-1">
                          {u.services.map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.5 bg-slate-100 text-slate-650 rounded-md text-[10px] font-bold"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-slate-700">
                        {u.dispatchCount || 0}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-purple-600">
                        {u.successCount || 0}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-slate-700">
                        {u.designatedThis || 0}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-slate-700">
                        {u.designatedOther || 0}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-rose-500">
                        {u.stopCount || 0}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
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
                        <div className="flex justify-end gap-2 items-center">
                          <button
                            onClick={() => setEditingUnit(u)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-xl text-xs font-semibold hover:shadow-sm transition cursor-pointer"
                            title="編輯單位"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            編輯
                          </button>
                          
                          <button
                            onClick={() => handleOpenAdminEdit(u)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-750 border border-amber-200 rounded-xl text-xs font-semibold hover:shadow-sm transition cursor-pointer"
                            title="管理員編輯數據"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            管理員編輯
                          </button>

                          <button
                            onClick={() => {
                              if (u.isStopped || window.confirm(`是否確定要停派單位「${u.name}」？`)) {
                                toggleStopUnit(u.id, u.stopCount);
                              }
                            }}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all border ${
                              u.isStopped
                                ? 'bg-rose-50 border-rose-250 text-rose-600 hover:bg-rose-100'
                                : 'bg-emerald-50 border-emerald-250 text-emerald-600 hover:bg-emerald-100'
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
                        </div>
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
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold text-white mb-0">新增合作單位</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-full text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddUnit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  單位名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  placeholder="請輸入單位完整名稱"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  可提供服務 (複選)
                </label>
                <div className="flex flex-wrap gap-3 max-h-36 overflow-y-auto border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                  {SERVICE_CONTENTS.map((code) => (
                    <label key={code} className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newServices.includes(code)}
                        onChange={() => handleServiceChange(code)}
                        className="rounded text-purple-650 focus:ring-purple-500"
                      />
                      {code}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
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

              {/* 星級評分功能 (選填) */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  單位評分 (選填)
                </label>
                <div className="flex gap-1.5 py-1">
                  {[1, 2, 3].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setNewRating(newRating === val ? 0 : val)}
                      className="focus:outline-none cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          val <= newRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 hover:text-amber-300'
                        } transition`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* 留言板功能 (選填) */}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  初始留言 (選填)
                </label>
                <input
                  type="text"
                  placeholder="個管師姓名 (實名)"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
                <textarea
                  placeholder="請輸入留言內容..."
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition text-xs font-semibold"
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

      {/* 編輯單位彈窗 */}
      {editingUnit && (
        <UnitEditModal
          unit={editingUnit}
          isOpen={!!editingUnit}
          onClose={() => setEditingUnit(null)}
        />
      )}

      {/* 管理員編輯數據彈窗 */}
      {adminEditingUnit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[95vh] flex flex-col">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold text-white mb-0">管理員編輯 - {adminEditingUnit.name}</h3>
              <button
                onClick={() => setAdminEditingUnit(null)}
                className="p-1.5 hover:bg-white/10 rounded-full text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveAdminEdit} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
              <div className="bg-amber-50 border border-amber-150 text-amber-800 px-3.5 py-2.5 rounded-xl text-xs flex justify-between items-center gap-2">
                <span>點擊右側按鈕可一鍵將此單位所有統計數值歸零：</span>
                <button
                  type="button"
                  onClick={handleResetAdminEdit}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer shrink-0 font-bold"
                >
                  一鍵歸零
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    總派案數
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={overrideDispatch}
                    onChange={(e) => setOverrideDispatch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    成功輪派數
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={overrideSuccess}
                    onChange={(e) => setOverrideSuccess(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    指定本單位數
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={overrideThis}
                    onChange={(e) => setOverrideThis(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    指定它單位數
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={overrideOther}
                    onChange={(e) => setOverrideOther(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    違規停派數
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={overrideStop}
                    onChange={(e) => setOverrideStop(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setAdminEditingUnit(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition text-xs font-semibold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-md transition cursor-pointer"
                >
                  儲存變更
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
