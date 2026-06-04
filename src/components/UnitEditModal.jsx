import { useState } from 'react';
import { X, Save, Plus, Star } from 'lucide-react';
import { useUnits } from '../contexts/UnitContext';
import { SERVICE_CONTENTS } from '../constants/dispatchConstants';

export default function UnitEditModal({ unit, isOpen, onClose }) {
  const { updateUnit, addComment } = useUnits();
  const [name, setName] = useState(unit?.name || '');
  const [services, setServices] = useState(unit?.services || []);
  const [isStopped, setIsStopped] = useState(unit?.isStopped || false);
  const [rating, setRating] = useState(unit?.rating || 0);
  const [author, setAuthor] = useState('');
  const [comment, setComment] = useState('');

  const handleServiceToggle = (code) => {
    setServices((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSave = () => {
    updateUnit(unit.id, { name, services, isStopped, rating });
    onClose();
  };

  const handleAddComment = () => {
    if (!author.trim() || !comment.trim()) return;
    const newComment = {
      author: author.trim(),
      content: comment.trim(),
      timestamp: new Date().toISOString(),
    };
    addComment(unit.id, newComment);
    setAuthor('');
    setComment('');
  };

  if (!isOpen || !unit) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        {/* 表頭 (符合設計風格) */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold text-white mb-0 text-base">編輯單位 - {unit.name}</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 捲動表單內容 */}
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* 單位名稱 */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              單位名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm bg-slate-50/50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              placeholder="請輸入單位名稱"
            />
          </div>

          {/* 可提供服務 (複選) */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              可提供服務 (複選)
            </label>
            <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto border border-slate-100 dark:border-slate-800 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950">
              {SERVICE_CONTENTS.map((code) => (
                <label key={code} className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={services.includes(code)}
                    onChange={() => handleServiceToggle(code)}
                    className="rounded text-purple-650 focus:ring-purple-500"
                  />
                  {code}
                </label>
              ))}
            </div>
          </div>

          {/* 停派設定 */}
          <div className="flex items-center gap-2 py-1">
            <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isStopped}
                onChange={(e) => setIsStopped(e.target.checked)}
                className="rounded text-purple-650 focus:ring-purple-500"
              />
              直接設定為停派/未合作
            </label>
          </div>

          {/* 單位評分 (星級評分，選填，可取消) */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              單位評分 (選填，點擊已選星星可取消)
            </label>
            <div className="flex gap-1.5 py-1">
              {[1, 2, 3].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRating(rating === val ? 0 : val)}
                  className="focus:outline-none cursor-pointer"
                  title={`${val}星`}
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

          {/* 留言歷史與留言板 (選填) */}
          <div className="border-t border-slate-150 dark:border-slate-800 pt-3">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              留言版歷程
            </label>
            
            {/* 歷史留言清單 */}
            <div className="max-h-36 overflow-y-auto space-y-2 mb-3 bg-slate-50/50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-850">
              {unit.comments && unit.comments.length > 0 ? (
                unit.comments.map((c, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-lg text-xs shadow-sm">
                    <div className="flex justify-between text-slate-400 dark:text-slate-500 font-medium mb-1">
                      <span>{c.author}</span>
                      <span>{new Date(c.timestamp).toLocaleString('zh-TW', { hour12: false })}</span>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 break-words leading-relaxed">
                      {c.content}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-450 dark:text-slate-500 text-xs py-4 text-center">
                  目前尚無留言紀錄
                </div>
              )}
            </div>

            {/* 新增新留言欄位 */}
            <div className="space-y-2 bg-slate-50/30 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <input
                type="text"
                placeholder="個管師姓名 (實名)"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500 transition"
              />
              <div className="flex gap-2 items-end">
                <textarea
                  placeholder="請輸入留言內容..."
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500 transition"
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-0.5" />
                  新增留言
                </button>
              </div>
            </div>
          </div>

          {/* 底部按鈕 */}
          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 rounded-xl transition text-xs font-semibold cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md transition cursor-pointer flex items-center gap-1"
            >
              <Save className="w-3.5 h-3.5" />
              儲存資料
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
