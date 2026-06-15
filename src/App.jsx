import { useState } from 'react';
import { CaseProvider } from './contexts/CaseContext';
import { UnitProvider } from './contexts/UnitContext';
import { StaffProvider } from './contexts/StaffContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { isFirebaseConfigured } from './services/firebase';
import ActiveCases from './pages/ActiveCases';
import ClosedCases from './pages/ClosedCases';
import Units from './pages/Units';
import Staff from './pages/Staff';
import { Heart } from 'lucide-react';
import './App.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState('activeCases');
  const { currentUser, loading, loginWithGoogle, loginSimulated, logout, role, isPending } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-bold text-sm">系統載入中...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    const isFirebase = isFirebaseConfigured();
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white border border-slate-200 rounded-3xl p-8 shadow-lg">
          <div className="text-center">
            <div className="bg-[#2563eb] p-3 rounded-2xl text-white shadow-md shadow-blue-500/25 inline-block mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-[#1e3a8a] tracking-wide mb-1">
              悠康照顧計劃管理系統
            </h2>
            <p className="text-sm text-slate-500 font-medium mb-6">
              請登入以存取系統與個案資料
            </p>
          </div>

          <div className="space-y-4">
            {isFirebase ? (
              <button
                onClick={loginWithGoogle}
                className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.67 0 3.2.58 4.38 1.71l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.4 7.56l3.92 3.04C6.26 7.42 8.9 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.1 2.67-2.33 3.5l3.62 2.81c2.12-1.95 3.77-4.82 3.77-8.46z" />
                  <path fill="#FBBC05" d="M5.32 10.6c-.23-.69-.37-1.42-.37-2.18s.14-1.49.37-2.18L1.4 3.2C.5 5 0 7.02 0 9.18s.5 4.18 1.4 5.98l3.92-3.04c-.23-.69-.37-1.42-.37-2.18z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.62-2.81c-1.01.68-2.31 1.09-3.96 1.09-3.1 0-5.74-2.38-6.68-5.56l-3.92 3.04C3.37 19.35 7.35 23 12 23z" />
                </svg>
                使用 Google 帳號登入
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3.5 text-xs text-center font-bold">
                  ⚠️ 目前為離線 Fallback 模式，請使用模擬登入測試功能。
                </div>
                <button
                  onClick={() => loginSimulated('admin')}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition cursor-pointer"
                >
                  以 模擬管理員 (Admin) 登入
                </button>
                <button
                  onClick={() => loginSimulated('user')}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-505 transition cursor-pointer"
                >
                  以 模擬一般使用者 (User) 登入
                </button>
                <button
                  onClick={() => loginSimulated('pending')}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-slate-800 bg-amber-400 hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition cursor-pointer"
                >
                  以 模擬待審核 (Pending) 登入
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentUser && isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white border border-slate-200 rounded-3xl p-8 shadow-lg text-center">
          <div className="bg-amber-500 p-4 rounded-2xl text-white shadow-md shadow-amber-500/25 inline-block mb-4">
            <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-wide mb-1">
            帳號權限審核中
          </h2>
          <p className="text-sm text-slate-500 font-medium px-4">
            您的帳號目前尚未開通。請聯絡系統管理員審核您的申請，並將您的角色設定為一般使用者。
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left font-medium space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">申請姓名</span>
              <span className="text-slate-700 font-bold">{currentUser.displayName || '未提供'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">綁定信箱</span>
              <span className="text-slate-700 font-mono font-bold">{currentUser.email}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">目前狀態</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">待審核 (Pending)</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex justify-center py-3 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition cursor-pointer"
          >
            登出並切換帳號
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 py-6 px-4 sm:px-8">
      
      {/* 頂部系統標題區 */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-[#2563eb] p-2 rounded-xl text-white shadow-md shadow-blue-500/25">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1e3a8a] tracking-wide m-0">
              悠康照顧計劃管理系統
            </h1>
          </div>
        </div>

        {/* 使用者資訊與登出按鈕 */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm text-sm shrink-0">
          <div className="flex items-center gap-2">
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="Avatar" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                {currentUser.displayName ? currentUser.displayName.slice(0, 1) : '?'}
              </div>
            )}
            <div className="text-left">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <span>{currentUser.displayName || '使用者'}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  role === 'admin' 
                    ? 'bg-red-50 border border-red-200 text-red-750' 
                    : 'bg-slate-100 border border-slate-200 text-slate-650'
                }`}>
                  {role === 'admin' ? '管理員' : '一般使用者'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">{currentUser.email}</div>
            </div>
          </div>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <button
            onClick={logout}
            className="text-xs font-bold text-slate-500 hover:text-red-650 transition cursor-pointer"
          >
            登出
          </button>
        </div>
      </div>

      {/* 主要白色卡片容器 */}
      <div className="max-w-7xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        
        {/* 功能分頁選單 */}
        <div className="flex bg-[#f1f5f9] p-1.5 rounded-2xl w-fit border border-slate-250 mb-6">
          <button
            onClick={() => setActiveTab('activeCases')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'activeCases'
                ? 'bg-white text-[#1e3a8a] shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            個案
          </button>
          
          <button
            onClick={() => setActiveTab('closedCases')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'closedCases'
                ? 'bg-white text-[#1e3a8a] shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            結案
          </button>
          
          <button
            onClick={() => setActiveTab('units')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'units'
                ? 'bg-white text-[#1e3a8a] shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            派案單位
          </button>
          
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-white text-[#1e3a8a] shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            人員資訊
          </button>
        </div>

        {/* 分格線 */}
        <hr className="border-slate-100 mb-6" />

        {/* Tab 頁面呈現 */}
        <div className="transition-all duration-150">
          {activeTab === 'activeCases' && <ActiveCases />}
          {activeTab === 'closedCases' && <ClosedCases />}
          {activeTab === 'units' && <Units />}
          {activeTab === 'staff' && <Staff />}
        </div>
      </div>

      {/* 底部宣告 */}
      <footer className="max-w-7xl mx-auto py-6 mt-8 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-1">
          <span>長照個案派案管理系統 © 2026</span>
          <span>|</span>
          <span>悠康守護，跨齡照顧</span>
          <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CaseProvider>
        <UnitProvider>
          <StaffProvider>
            <AppContent />
          </StaffProvider>
        </UnitProvider>
      </CaseProvider>
    </AuthProvider>
  );
}
