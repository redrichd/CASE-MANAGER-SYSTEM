import { useState } from 'react';
import { CaseProvider } from './contexts/CaseContext';
import { UnitProvider } from './contexts/UnitContext';
import ActiveCases from './pages/ActiveCases';
import ClosedCases from './pages/ClosedCases';
import Units from './pages/Units';
import { Heart } from 'lucide-react';
import './App.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState('activeCases');

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 py-6 px-4 sm:px-8">
      
      {/* 頂部系統標題區 */}
      <div className="max-w-7xl mx-auto flex items-center gap-3 mb-6">
        <div className="bg-[#2563eb] p-2 rounded-xl text-white shadow-md shadow-blue-500/25">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1e3a8a] tracking-wide m-0">
            長照派案時效管控系統
          </h1>
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
        </div>

        {/* 分格線 */}
        <hr className="border-slate-100 mb-6" />

        {/* Tab 頁面呈現 */}
        <div className="transition-all duration-150">
          {activeTab === 'activeCases' && <ActiveCases />}
          {activeTab === 'closedCases' && <ClosedCases />}
          {activeTab === 'units' && <Units />}
        </div>
      </div>

      {/* 底部宣告 */}
      <footer className="max-w-7xl mx-auto py-6 mt-8 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-1">
          <span>長照個案派案管理系統 © 2026</span>
          <span>|</span>
          <span>用愛守護長者生命價值</span>
          <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
        </div>
      </footer>

    </div>
  );
}



export default function App() {
  return (
    <CaseProvider>
      <UnitProvider>
        <AppContent />
      </UnitProvider>
    </CaseProvider>
  );
}
