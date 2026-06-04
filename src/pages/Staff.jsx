import { useState } from 'react';
import { useStaff } from '../contexts/StaffContext';
import { Search, Plus, Edit3, Trash2, X, Save, User } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Staff() {
  const { staffList, addStaff, updateStaff, deleteStaff } = useStaff();

  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('全部區域');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // 新增人員表單狀態
  const [newEmpId, setNewEmpId] = useState('');
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState('F');
  const [newArea, setNewArea] = useState('新莊區');
  const [newTitle, setNewTitle] = useState('個管員');

  // 編輯人員表單狀態
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState('F');
  const [editArea, setEditArea] = useState('新莊區');
  const [editTitle, setEditTitle] = useState('個管員');

  // 過濾搜尋與區域
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.empId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = areaFilter === '全部區域' || s.area === areaFilter;
    return matchesSearch && matchesArea;
  });

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!newEmpId.trim() || !newName.trim()) {
      alert('請填寫員工編號與姓名！');
      return;
    }

    // 檢查編號是否重疊
    if (staffList.some((s) => s.empId === newEmpId.trim())) {
      alert('員工編號已存在，請使用不同的編號！');
      return;
    }

    addStaff({
      empId: newEmpId.trim(),
      name: newName.trim(),
      gender: newGender,
      area: newArea,
      title: newTitle.trim()
    });

    // 重設新增表單
    setNewEmpId('');
    setNewName('');
    setNewGender('F');
    setNewArea('新莊區');
    setNewTitle('個管員');
    setIsAddOpen(false);
  };

  const handleStartEdit = (staff) => {
    setEditingStaff(staff);
    setEditName(staff.name);
    setEditGender(staff.gender);
    setEditArea(staff.area);
    setEditTitle(staff.title);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('姓名不能為空！');
      return;
    }

    updateStaff(editingStaff.empId, {
      name: editName.trim(),
      gender: editGender,
      area: editArea,
      title: editTitle.trim()
    });

    setEditingStaff(null);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteStaff(deleteTarget.empId);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 頂部操作與篩選列 */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-[#f8fafc] border border-slate-200 rounded-xl p-3 mb-4 gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-sm transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#2563eb]" />
            新增工作人員
          </button>

          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="rounded-lg border border-slate-250 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
          >
            <option value="全部區域">全部區域</option>
            <option value="新莊區">新莊區</option>
            <option value="三蘆區">三蘆區</option>
            <option value="板中永區">板中永區</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-sm font-bold text-slate-600 shrink-0">搜尋：</span>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="搜尋編號或姓名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-250 pl-3 pr-8 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
            />
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* 人員列表 */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f1f5f9] border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <th className="px-6 py-4">員工編號</th>
                <th className="px-6 py-4">姓名</th>
                <th className="px-6 py-4">性別</th>
                <th className="px-6 py-4">服務區域</th>
                <th className="px-6 py-4">職稱</th>
                <th className="px-6 py-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    目前無符合條件之人員
                  </td>
                </tr>
              ) : (
                filteredStaff.map((s) => (
                  <tr key={s.empId} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-600">
                      {s.empId}
                    </td>
                    <td className="px-6 py-4">
                      {/* 性別顏色標示：女粉紅、男藍色 */}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
                        s.gender === 'F'
                          ? 'bg-pink-50 text-pink-700 border border-pink-250'
                          : 'bg-blue-50 text-blue-700 border border-blue-250'
                      }`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${s.gender === 'F' ? 'bg-pink-500' : 'bg-blue-500'}`} />
                        {s.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {s.gender === 'F' ? '女性' : '男性'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                        {s.area}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {s.title}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 items-center">
                        <button
                          onClick={() => handleStartEdit(s)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-xl text-xs font-semibold hover:shadow-sm transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          編輯
                        </button>
                        <button
                          onClick={() => setDeleteTarget(s)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold hover:shadow-sm transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新增工作人員彈窗 */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold text-white mb-0 flex items-center gap-2">
                <User className="w-5 h-5" />
                新增工作人員
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-full text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddStaff} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  員工編號 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newEmpId}
                  onChange={(e) => setNewEmpId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="請輸入唯一員工編號 (例: E0004)"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="請輸入姓名"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  性別
                </label>
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="F">女性</option>
                  <option value="M">男性</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  服務區域
                </label>
                <select
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="新莊區">新莊區</option>
                  <option value="三蘆區">三蘆區</option>
                  <option value="板中永區">板中永區</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  職稱
                </label>
                <select
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="個管員">個管員</option>
                  <option value="督導">督導</option>
                  <option value="社工師">社工師</option>
                  <option value="行政人員">行政人員</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition text-xs font-semibold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-650 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition cursor-pointer"
                >
                  確認建立
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 編輯工作人員彈窗 */}
      {editingStaff && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold text-white mb-0">編輯人員 - {editingStaff.empId}</h3>
              <button
                onClick={() => setEditingStaff(null)}
                className="p-1.5 hover:bg-white/10 rounded-full text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  員工編號
                </label>
                <input
                  type="text"
                  disabled
                  value={editingStaff.empId}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="請輸入姓名"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  性別
                </label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="F">女性</option>
                  <option value="M">男性</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  服務區域
                </label>
                <select
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="新莊區">新莊區</option>
                  <option value="三蘆區">三蘆區</option>
                  <option value="板中永區">板中永區</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  職稱
                </label>
                <select
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="個管員">個管員</option>
                  <option value="督導">督導</option>
                  <option value="社工師">社工師</option>
                  <option value="行政人員">行政人員</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition text-xs font-semibold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-650 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition cursor-pointer flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  儲存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 刪除確認對話框 */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="確認刪除人員"
        message={deleteTarget ? `確定要刪除「${deleteTarget.name}」（編號：${deleteTarget.empId}）嗎？此操作將不可復原。` : ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

    </div>
  );
}
