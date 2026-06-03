
export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition duration-150"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium shadow-md shadow-purple-500/20 transition duration-150"
          >
            確定
          </button>
        </div>
      </div>
    </div>
  );
}
