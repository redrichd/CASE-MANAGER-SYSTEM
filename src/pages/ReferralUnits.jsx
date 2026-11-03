import { useState, useMemo } from 'react';
import { 
  Building2, Plus, Star, MapPin, Tag, Search, Edit3, Ban, 
  CheckCircle, FileText, X, AlertTriangle, MessageSquare, Check, Calendar 
} from 'lucide-react';
import { useUnits } from '../contexts/UnitContext';
import { useCases } from '../contexts/CaseContext';
import { useAuth } from '../contexts/AuthContext';
import ReferralUnitEditModal from '../components/ReferralUnitEditModal';
import { 
  SERVICE_AREAS, 
  REFERRAL_SERVICE_ITEMS_PROFESSIONAL, 
  REFERRAL_SERVICE_ITEMS_MEDICAL, 
  REFERRAL_SERVICE_ITEMS_C_STATION,
  ALL_REFERRAL_SERVICES 
} from '../constants/dispatchConstants';

export default function ReferralUnits() {
  const { referralUnits, addReferralUnit, toggleStopReferralUnit, updateReferralUnit } = useUnits();
  const { cases } = useCases();
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  // 搜尋與篩選狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServiceFilters, setSelectedServiceFilters] = useState(['ALL']);
  const [selectedAreaFilters, setSelectedAreaFilters] = useState(['ALL']);
  const [areaFilterMode, setAreaFilterMode] = useState('AND'); // 'AND' 或 'OR'

  // Modal 狀態
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);

  // 新增轉介單位表單狀態
  const [newName, setNewName] = useState('');
  const [newServices, setNewServices] = useState(['失智症社區服務據點']);
  const [newServiceAreas, setNewServiceAreas] = useState(['新莊區', '三重區', '永和區']);
  const [newHasLetterOfIntent, setNewHasLetterOfIntent] = useState(false);
  const [newIsStopped, setNewIsStopped] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newAuthor, setNewAuthor] = useState('');
  const [newComment, setNewComment] = useState('');

  // 檢查新增名稱重複
  const trimmedNewName = newName.trim();
  const isDuplicateNewName = trimmedNewName !== '' && referralUnits.some(
    (u) => u.name.trim().toLowerCase() === trimmedNewName.toLowerCase()
  );

  // 計算每個轉介單位的累計轉介次數與最近轉介時間
  const referralUnitStats = useMemo(() => {
    const statsMap = {};
    (cases || []).forEach((c) => {
      // 提取轉介紀錄
      const checkItems = [];
      if (c.recordCategory === 'referral' || c.referralType) {
        checkItems.push(c);
      }
      if (c.referrals && Array.isArray(c.referrals)) {
        checkItems.push(...c.referrals);
      }

      checkItems.forEach((ref) => {
        const uName = ref.referralUnitName || ref.bUnitName;
        if (!uName) return;
        if (!statsMap[uName]) {
          statsMap[uName] = { count: 0, latestDate: null };
        }
        statsMap[uName].count += 1;
        const rDate = ref.referralDate || c.date;
        if (rDate) {
          if (!statsMap[uName].latestDate || new Date(rDate) > new Date(statsMap[uName].latestDate)) {
            statsMap[uName].latestDate = rDate;
          }
        }
      });
    });
    return statsMap;
  }, [cases]);

  // 服務區域切換處理
  const handleToggleAreaFilter = (areaName) => {
    setSelectedAreaFilters((prev) => {
      if (areaName === 'ALL') {
        return ['ALL'];
      }
      const withoutAll = prev.filter((a) => a !== 'ALL');
      if (withoutAll.includes(areaName)) {
        const next = withoutAll.filter((a) => a !== areaName);
        return next.length === 0 ? ['ALL'] : next;
      } else {
        return [...withoutAll, areaName];
      }
    });
  };

  // 服務類別分類標籤切換處理
  const handleToggleServiceFilter = (serviceCode) => {
    setSelectedServiceFilters((prev) => {
      if (serviceCode === 'ALL') {
        return ['ALL'];
      }
      const withoutAll = prev.filter((s) => s !== 'ALL');
      if (withoutAll.includes(serviceCode)) {
        const next = withoutAll.filter((s) => s !== serviceCode);
        return next.length === 0 ? ['ALL'] : next;
      } else {
        return [...withoutAll, serviceCode];
      }
    });
  };

  // 篩選與搜尋轉介單位清單
  const filteredUnits = useMemo(() => {
    return referralUnits.filter((u) => {
      // 1. 關鍵字搜尋
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = u.name.toLowerCase().includes(term);
        const matchId = u.id.toLowerCase().includes(term);
        if (!matchName && !matchId) return false;
      }

      // 2. 服務區域篩選
      if (!selectedAreaFilters.includes('ALL')) {
        const unitAreas = u.serviceAreas || ['新莊區', '三重區', '永和區'];
        if (areaFilterMode === 'AND') {
          const hasAll = selectedAreaFilters.every((area) => unitAreas.includes(area));
          if (!hasAll) return false;
        } else {
          const hasAny = selectedAreaFilters.some((area) => unitAreas.includes(area));
          if (!hasAny) return false;
        }
      }

      // 3. 轉介服務類別標籤篩選
      if (!selectedServiceFilters.includes('ALL')) {
        const unitServices = u.services || [];
        const match = selectedServiceFilters.some((s) => unitServices.includes(s));
        if (!match) return false;
      }

      return true;
    });
  }, [referralUnits, searchTerm, selectedAreaFilters, areaFilterMode, selectedServiceFilters]);

  // 新增轉介單位送出
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!trimmedNewName || isDuplicateNewName) return;

    const initialComments = [];
    if (newAuthor.trim() && newComment.trim()) {
      initialComments.push({
        author: newAuthor.trim(),
        content: newComment.trim(),
        timestamp: new Date().toISOString(),
      });
    }

    addReferralUnit({
      name: trimmedNewName,
      services: newServices,
      serviceAreas: newServiceAreas,
      hasLetterOfIntent: newHasLetterOfIntent,
      isStopped: newIsStopped,
      rating: newRating,
      comments: initialComments,
    });

    // 重設表單
    setNewName('');
    setNewServices(['失智症社區服務據點']);
    setNewServiceAreas(['新莊區', '三重區', '永和區']);
    setNewHasLetterOfIntent(false);
    setNewIsStopped(false);
    setNewRating(0);
    setNewAuthor('');
    setNewComment('');
    setIsAddOpen(false);
  };

  // 頂部統計指標
  const activeCount = referralUnits.filter((u) => !u.isStopped).length;
  const letterCount = referralUnits.filter((u) => u.hasLetterOfIntent).length;
  const totalReferralCount = Object.values(referralUnitStats).reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="space-y-6">
      {/* 頂部數據概覽卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">總轉介單位</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">{referralUnits.length}</div>
          <div className="text-xs text-slate-400 mt-1">登記之轉介資源機構</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">合作中單位</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{activeCount}</div>
          <div className="text-xs text-slate-400 mt-1">狀態正常可轉介單位</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">簽署意向書單位</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600">{letterCount}</div>
          <div className="text-xs text-slate-400 mt-1">已簽訂合作意向書單位</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">累計轉介人次</span>
            <Tag className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{totalReferralCount}</div>
          <div className="text-xs text-slate-400 mt-1">全系統轉介連結次數</div>
        </div>
      </div>

      {/* 控制工具列：搜尋、區域篩選與新增按鈕 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          {/* 搜尋框 */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="搜尋轉介單位名稱或 ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-250 rounded-xl text-xs bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              新增轉介單位
            </button>
          </div>
        </div>

        {/* 服務區域篩選列 */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-650 flex items-center gap-1 mr-1">
            <MapPin className="w-3.5 h-3.5 text-purple-600" />
            服務區域：
          </span>
          <button
            type="button"
            onClick={() => handleToggleAreaFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              selectedAreaFilters.includes('ALL')
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部區域
          </button>
          {SERVICE_AREAS.map((areaName) => {
            const isSelected = selectedAreaFilters.includes(areaName);
            return (
              <button
                key={areaName}
                type="button"
                onClick={() => handleToggleAreaFilter(areaName)}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {areaName}
              </button>
            );
          })}

          {!selectedAreaFilters.includes('ALL') && selectedAreaFilters.length > 1 && (
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-2">
              <button
                type="button"
                onClick={() => setAreaFilterMode('AND')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                  areaFilterMode === 'AND' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-500'
                }`}
              >
                同時服務 (交集)
              </button>
              <button
                type="button"
                onClick={() => setAreaFilterMode('OR')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                  areaFilterMode === 'OR' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-500'
                }`}
              >
                任一服務 (聯集)
              </button>
            </div>
          )}
        </div>

        {/* 轉介服務分類標籤篩選列 */}
        <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-650 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-purple-600" />
              轉介服務類別篩選 (分類標籤)：
            </span>
            <button
              type="button"
              onClick={() => setSelectedServiceFilters(['ALL'])}
              className="text-[11px] text-purple-600 hover:underline font-bold"
            >
              重設為全選
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50/50 border border-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleToggleServiceFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                selectedServiceFilters.includes('ALL')
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              全部標籤 (ALL)
            </button>

            {ALL_REFERRAL_SERVICES.map((serviceName) => {
              const isSelected = selectedServiceFilters.includes(serviceName);
              const isMedical = REFERRAL_SERVICE_ITEMS_MEDICAL.includes(serviceName);
              const isCStation = REFERRAL_SERVICE_ITEMS_C_STATION.includes(serviceName);

              return (
                <button
                  key={serviceName}
                  type="button"
                  onClick={() => handleToggleServiceFilter(serviceName)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : isMedical
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                        : isCStation
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {serviceName}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 轉介單位列表表格 */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-slate-200 text-xs font-bold text-slate-650 uppercase">
                <th className="px-6 py-4 text-center w-16">順位</th>
                <th className="px-6 py-4">轉介單位名稱</th>
                <th className="px-6 py-4">服務項目 (分類標籤)</th>
                <th className="px-6 py-4 text-center">服務區域</th>
                <th className="px-6 py-4 text-center">累計轉介次數</th>
                <th className="px-6 py-4">最近轉介日期</th>
                <th className="px-6 py-4 text-center">意向書簽署</th>
                <th className="px-6 py-4 text-right">合作狀態 / 操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                    目前無符合條件之轉介單位
                  </td>
                </tr>
              ) : (
                filteredUnits.map((u, index) => {
                  const stats = referralUnitStats[u.name] || { count: 0, latestDate: null };

                  return (
                    <tr
                      key={u.id}
                      className={`transition ${
                        u.isStopped
                          ? 'opacity-50 bg-slate-50/50 grayscale'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="px-6 py-4 text-center font-bold text-slate-500">
                        {u.isStopped ? '-' : index + 1}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{u.name}</span>
                          {u.rating > 0 && (
                            <div className="flex gap-0.5" title={`${u.rating}星級優秀單位`}>
                              {Array.from({ length: u.rating }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          ID: {u.id}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {u.services && u.services.length > 0 ? (
                            u.services.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[10px] font-bold"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">未設定服務項目</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-wrap justify-center gap-1">
                          {(u.serviceAreas || ['新莊區', '三重區', '永和區']).map((a) => (
                            <span
                              key={a}
                              className="px-1.5 py-0.5 bg-slate-100 text-slate-650 rounded text-[10px] font-medium"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center font-black text-purple-700">
                        {stats.count}
                      </td>

                      <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{stats.latestDate ? stats.latestDate.split('T')[0] : '無紀錄'}</span>
                        </div>
                      </td>

                      {/* 意向書簽署勾選框 */}
                      <td className="px-6 py-4 text-center">
                        <label 
                          className="inline-flex items-center justify-center cursor-pointer select-none" 
                          title={u.hasLetterOfIntent ? "已簽署意向書 (點擊可切換)" : "未簽署意向書 (點擊可切換)"}
                        >
                          <input
                            type="checkbox"
                            checked={!!u.hasLetterOfIntent}
                            onChange={(e) => updateReferralUnit(u.id, { hasLetterOfIntent: e.target.checked })}
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                        </label>
                      </td>

                      {/* 操作 */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          <button
                            onClick={() => setEditingUnit(u)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-xl text-xs font-bold transition cursor-pointer"
                            title="編輯轉介單位"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            編輯
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (u.isStopped || window.confirm(`是否確定要停用轉介單位「${u.name}」？`)) {
                                  toggleStopReferralUnit(u.id);
                                }
                              }}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                                u.isStopped
                                  ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                              }`}
                            >
                              {u.isStopped ? (
                                <>
                                  <Ban className="w-3.5 h-3.5" />
                                  已停用 (點擊啟用)
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  合作中 (點擊停用)
                                </>
                              )}
                            </button>
                          )}
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

      {/* 新增轉介合作單位 Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold text-white mb-0 text-base flex items-center gap-2">
                <Plus className="w-5 h-5" />
                新增轉介合作單位
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-full text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>單位名稱 <span className="text-red-500">*</span></span>
                  {isDuplicateNewName && (
                    <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      單位名稱已存在
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  placeholder="請輸入轉介單位完整名稱..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none transition ${
                    isDuplicateNewName
                      ? 'border-rose-500 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-500'
                      : 'border-slate-250 bg-slate-50/50 focus:ring-2 focus:ring-purple-500'
                  }`}
                />
              </div>

              {/* 可提供轉介服務 (分類勾選項) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  可提供轉介服務 (分類複選)
                </label>
                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50 max-h-48 overflow-y-auto">
                  <div>
                    <span className="text-xs font-bold text-purple-700 block mb-1">【專業資源】</span>
                    <div className="flex flex-wrap gap-2">
                      {REFERRAL_SERVICE_ITEMS_PROFESSIONAL.map((code) => (
                        <label key={code} className="flex items-center gap-1 text-xs cursor-pointer select-none bg-white px-2 py-1 rounded border border-slate-200">
                          <input
                            type="checkbox"
                            checked={newServices.includes(code)}
                            onChange={() => {
                              setNewServices((prev) =>
                                prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
                              );
                            }}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          {code}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-2">
                    <span className="text-xs font-bold text-blue-700 block mb-1">【醫療相關資源】</span>
                    <div className="flex flex-wrap gap-2">
                      {REFERRAL_SERVICE_ITEMS_MEDICAL.map((code) => (
                        <label key={code} className="flex items-center gap-1 text-xs cursor-pointer select-none bg-white px-2 py-1 rounded border border-slate-200">
                          <input
                            type="checkbox"
                            checked={newServices.includes(code)}
                            onChange={() => {
                              setNewServices((prev) =>
                                prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
                              );
                            }}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          {code}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-2">
                    <span className="text-xs font-bold text-emerald-700 block mb-1">【醫事C巷弄長照站分類】</span>
                    <div className="flex flex-wrap gap-2">
                      {REFERRAL_SERVICE_ITEMS_C_STATION.map((code) => (
                        <label key={code} className="flex items-center gap-1 text-xs cursor-pointer select-none bg-white px-2 py-1 rounded border border-slate-200">
                          <input
                            type="checkbox"
                            checked={newServices.includes(code)}
                            onChange={() => {
                              setNewServices((prev) =>
                                prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
                              );
                            }}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          {code}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 服務區域 (複選) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  服務區域 (複選)
                </label>
                <div className="flex flex-wrap gap-4 border border-slate-200 p-2.5 rounded-xl bg-slate-50/50">
                  {SERVICE_AREAS.map((areaName) => (
                    <label key={areaName} className="flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none text-slate-700">
                      <input
                        type="checkbox"
                        checked={newServiceAreas.includes(areaName)}
                        onChange={() => {
                          setNewServiceAreas((prev) =>
                            prev.includes(areaName) ? prev.filter((a) => a !== areaName) : [...prev, areaName]
                          );
                        }}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      {areaName}
                    </label>
                  ))}
                </div>
              </div>

              {/* 意向書簽署勾選項 */}
              <div className="flex items-center gap-2 py-1">
                <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none text-slate-700">
                  <input
                    type="checkbox"
                    checked={newHasLetterOfIntent}
                    onChange={(e) => setNewHasLetterOfIntent(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  意向書簽署
                </label>
              </div>

              {/* 停用設定 */}
              <div className="flex items-center gap-2 py-1">
                <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none text-rose-600">
                  <input
                    type="checkbox"
                    checked={newIsStopped}
                    onChange={(e) => setNewIsStopped(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  直接設定為停用/未合作
                </label>
              </div>

              {/* 星級評分 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
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

              {/* 初始留言 */}
              <div className="border-t border-slate-200 pt-3 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  初始留言 (選填)
                </label>
                <input
                  type="text"
                  placeholder="個管師姓名 (實名)"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full rounded-xl border border-slate-250 px-3 py-1.5 text-xs bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
                <textarea
                  placeholder="請輸入留言內容..."
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full rounded-xl border border-slate-250 px-3 py-1.5 text-xs bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-250 text-slate-650 hover:bg-slate-50 rounded-xl transition text-xs font-bold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isDuplicateNewName}
                  className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md transition ${
                    isDuplicateNewName
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                  }`}
                >
                  確認建立
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 編輯轉介單位 Modal */}
      {editingUnit && (
        <ReferralUnitEditModal
          unit={editingUnit}
          isOpen={!!editingUnit}
          onClose={() => setEditingUnit(null)}
        />
      )}
    </div>
  );
}

