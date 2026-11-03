import { useState } from 'react';
import { X, Save, Plus, Star, AlertTriangle } from 'lucide-react';
import { useUnits } from '../contexts/UnitContext';
import { 
  SERVICE_AREAS, 
  REFERRAL_SERVICE_ITEMS_PROFESSIONAL, 
  REFERRAL_SERVICE_ITEMS_MEDICAL, 
  REFERRAL_SERVICE_ITEMS_C_STATION 
} from '../constants/dispatchConstants';

export default function ReferralUnitEditModal({ unit, isOpen, onClose }) {
  const { referralUnits, updateReferralUnit, addReferralUnitComment } = useUnits();
  const [name, setName] = useState(unit?.name || '');
  const [services, setServices] = useState(unit?.services || []);
  const [serviceAreas, setServiceAreas] = useState(
    (unit?.serviceAreas || ['新莊區', '三重區', '永和區']).map(a => a === '三蘆區' ? '三重區' : (a === '板中永區' ? '永和區' : a))
  );
  const [hasLetterOfIntent, setHasLetterOfIntent] = useState(unit?.hasLetterOfIntent || false);
  const [isStopped, setIsStopped] = useState(unit?.isStopped || false);
  const [rating, setRating] = useState(unit?.rating || 0);
  const [author, setAuthor] = useState('');
  const [comment, setComment] = useState('');

  // 檢查是否與其他轉介單位名稱重複
  const trimmedName = name.trim();
  const isDuplicateName = trimmedName !== '' && referralUnits?.some(
    (u) => u.id !== unit?.id && u.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );

  const handleServiceToggle = (code) => {
    setServices((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleAreaToggle = (area) => {
    setServiceAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleSave = () => {
    if (!trimmedName) return;
    if (isDuplicateName) {
      alert(`系統中已存在其他名稱為「${trimmedName}」的轉介單位，名稱不可重複！`);
      return;
    }
    updateReferralUnit(unit.id, { 
      name: trimmedName, 
      services, 
      serviceAreas, 
      hasLetterOfIntent,
      isStopped, 
      rating 
    });
    onClose();
  };

  const handleAddComment = () => {
    if (!author.trim() || !comment.trim()) return;
    const newComment = {
      author: author.trim(),
      content: comment.trim(),
      timestamp: new Date().toISOString(),
    };
    addReferralUnitComment(unit.id, newComment);
    setAuthor('');
    setComment('');
  };

  if (!isOpen || !unit) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        {/* 表頭 */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold text-white mb-0 text-base">編輯轉介單位 - {unit.name}</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 捲動表單內容 */}
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
          {/* 單位名稱 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>單位名稱 <span className="text-red-500">*</span></span>
              {isDuplicateName && (
                <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  單位名稱已存在
                </span>
              )}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none transition ${
                isDuplicateName
                  ? 'border-rose-500 bg-rose-50/40 text-rose-900 focus:ring-2 focus:ring-rose-500'
                  : 'border-slate-250 bg-slate-50/50 focus:ring-2 focus:ring-purple-500'
              }`}
              placeholder="請輸入轉介單位名稱"
            />
          </div>

          {/* 可提供轉介服務 (分群複選) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              可提供轉介服務項目 (複選)
            </label>
            <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50 max-h-48 overflow-y-auto">
              <div>
                <span className="text-xs font-bold text-purple-700 block mb-1">【專業資源】</span>
                <div className="flex flex-wrap gap-2">
                  {REFERRAL_SERVICE_ITEMS_PROFESSIONAL.map((code) => (
                    <label key={code} className="flex items-center gap-1 text-xs cursor-pointer select-none bg-white px-2 py-1 rounded border border-slate-200">
                      <input
                        type="checkbox"
                        checked={services.includes(code)}
                        onChange={() => handleServiceToggle(code)}
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
                        checked={services.includes(code)}
                        onChange={() => handleServiceToggle(code)}
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
                        checked={services.includes(code)}
                        onChange={() => handleServiceToggle(code)}
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
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              服務區域 (複選)
            </label>
            <div className="flex flex-wrap gap-4 border border-slate-200 p-2.5 rounded-xl bg-slate-50/50">
              {SERVICE_AREAS.map((areaName) => (
                <label key={areaName} className="flex items-center gap-1.5 text-xs cursor-pointer select-none font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={serviceAreas.includes(areaName)}
                    onChange={() => handleAreaToggle(areaName)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  {areaName}
                </label>
              ))}
            </div>
          </div>

          {/* 意向書簽署 */}
          <div className="flex items-center gap-2 py-1">
            <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={hasLetterOfIntent}
                onChange={(e) => setHasLetterOfIntent(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
              意向書簽署
            </label>
          </div>

          {/* 停派設定 */}
          <div className="flex items-center gap-2 py-1">
            <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none text-rose-600">
              <input
                type="checkbox"
                checked={isStopped}
                onChange={(e) => setIsStopped(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              直接設定為停派/未合作
            </label>
          </div>

          {/* 單位評分 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              單位評分 (星級評分，選填)
            </label>
            <div className="flex gap-1.5 py-1">
              {[1, 2, 3].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRating(rating === val ? 0 : val)}
                  className="focus:outline-none cursor-pointer"
                >
                  <Star
                    className={`w-5 h-5 ${
                      val <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 hover:text-amber-300'
                    } transition`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* 留言板 */}
          <div className="border-t border-slate-200 pt-3 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              新增留言 / 備註
            </label>
            <input
              type="text"
              placeholder="個管師姓名 (實名)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full rounded-xl border border-slate-250 px-3 py-1.5 text-xs bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
            <textarea
              placeholder="請輸入留言內容..."
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-xl border border-slate-250 px-3 py-1.5 text-xs bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddComment}
                disabled={!author.trim() || !comment.trim()}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                送出留言
              </button>
            </div>

            {/* 歷史留言列表 */}
            {unit.comments && unit.comments.length > 0 && (
              <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                <span className="text-[11px] font-bold text-slate-400">歷史留言：</span>
                {unit.comments.map((c, i) => (
                  <div key={i} className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-700">{c.author}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.timestamp).toLocaleDateString('zh-TW')}
                      </span>
                    </div>
                    <p className="text-slate-650 m-0">{c.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-250 text-slate-650 hover:bg-slate-50 rounded-xl transition text-xs font-bold cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isDuplicateName}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              儲存變更
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

