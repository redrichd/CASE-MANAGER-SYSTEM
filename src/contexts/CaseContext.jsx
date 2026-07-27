/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../services/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const CaseContext = createContext();

const initialCases = [
  {
    id: 'FL20093001',
    name: '王小明',
    gender: 'M',
    supervisor: '陳個管',
    area: '新莊區',
    date: '2026/06/01',
    superApprovalDate: '2026-06-01T09:00',
    approvalDate: '2026-06-01T09:00',
    deadlineDate: '2026-06-03T12:00',
    submitDate: '2026-06-02T11:00',
    status: '時效內',
    delayReason: '',
    dispatchType: '新案_初評',
    serviceContent: 'BA',
    stopReason: '',
    aUnitNotifyDate: '2026-06-01',
    bUnitName: '大同居家照顧服務所',
    bUnitStartDate: '2026-06-05',
    dispatchResult: '服務提供',
    isUnitCounseling: false,
    bUnitReplyDate: '2026-06-02',
    firstServiceDate: '2026-06-05',
    anomalyReasonType: '',
    anomalyCategory: '',
    anomalySummary: '',
    referralTarget: '',
    referralDate: '',
    referralReplyDate: '',
    hasReferralForm: true,
    isCMSRecorded: true,
    isClosed: false,
  },
  {
    id: 'FL20093002',
    name: '李美華',
    gender: 'F',
    supervisor: '張個管',
    area: '三蘆區',
    date: '2026/05/25',
    superApprovalDate: '2026-05-25T14:00',
    approvalDate: '2026-05-25T14:00',
    deadlineDate: '2026-05-28T12:00',
    submitDate: '2026-05-26T10:00',
    status: '時效內',
    delayReason: '',
    dispatchType: '新案_初評',
    serviceContent: 'D',
    stopReason: '',
    aUnitNotifyDate: '2026-05-25',
    bUnitName: '中山長照居家機構',
    bUnitStartDate: '2026-06-01',
    dispatchResult: '服務提供',
    isUnitCounseling: false,
    bUnitReplyDate: '2026-05-27',
    firstServiceDate: '2026-06-01',
    anomalyReasonType: '',
    anomalyCategory: '',
    anomalySummary: '',
    referralTarget: '',
    referralDate: '',
    referralReplyDate: '',
    hasReferralForm: true,
    isCMSRecorded: true,
    isClosed: true,
  },
  {
    id: 'FL20093003',
    name: '張大同',
    gender: 'M',
    supervisor: '陳個管',
    area: '板中永區',
    date: '2026/06/02',
    superApprovalDate: '2026-06-02T15:00',
    approvalDate: '2026-06-02T15:00',
    deadlineDate: '2026-06-05T12:00',
    submitDate: '',
    status: '時效內',
    delayReason: '',
    dispatchType: '複評',
    serviceContent: 'BA',
    stopReason: '',
    aUnitNotifyDate: '',
    bUnitName: '',
    bUnitStartDate: '',
    dispatchResult: '',
    isUnitCounseling: false,
    bUnitReplyDate: '',
    firstServiceDate: '',
    anomalyReasonType: '',
    anomalyCategory: '',
    anomalySummary: '',
    referralTarget: '',
    referralDate: '',
    referralReplyDate: '',
    hasReferralForm: true,
    isCMSRecorded: true,
    isClosed: false,
  },
  {
    id: '115X15023',
    name: '藍一彥',
    gender: 'M',
    supervisor: '黃凱琳',
    area: '新莊區',
    date: '2026/05/11',
    superApprovalDate: '2026-05-11T09:07:47',
    approvalDate: '2026-05-11T09:07:47',
    deadlineDate: '2026-05-12T12:00',
    submitDate: '2026-05-12T10:00',
    status: '時效內',
    delayReason: '',
    dispatchType: '新案_初評',
    serviceContent: 'BA',
    bUnitName: '悠康事業有限公司附設新北市私立悠康居家長照機構',
    dispatchResult: '服務提供',
    isClosed: false,
  },
  {
    id: '115X15023',
    name: '藍一彥',
    gender: 'M',
    supervisor: '黃凱琳',
    area: '新莊區',
    date: '2026/07/29',
    superApprovalDate: '2026-07-29T16:55:13',
    approvalDate: '2026-07-29T16:55:13',
    deadlineDate: '2026-07-31T12:00',
    submitDate: '',
    status: '時效內',
    delayReason: '',
    dispatchType: '新案_初評',
    serviceContent: 'DA',
    bUnitName: '大安居家喘息服務處',
    dispatchResult: '服務提供',
    isClosed: false,
  }
];

// 淨化並為每筆個案資料賦予獨立的 _recordId，剔除過往產生的完全重複垃圾資料
const sanitizeCases = (list) => {
  if (!Array.isArray(list)) return [];
  const seenKeys = new Map();
  const cleanList = [];

  list.forEach((item, index) => {
    if (!item || !item.id) return;
    // 判斷完全相同紀錄的特徵 key
    const sigKey = `${item.id}_${item.serviceContent || ''}_${item.bUnitName || ''}_${item.approvalDate || ''}_${item.referralDate || ''}_${item.date || ''}_${item.isClosed ? 'closed' : 'active'}`;
    if (!seenKeys.has(sigKey)) {
      seenKeys.set(sigKey, true);
      const _recordId = item._recordId || `${item.id}_${item.serviceContent || 'default'}_${index}_${Math.random().toString(36).substr(2, 5)}`;
      cleanList.push({ ...item, _recordId });
    }
  });

  return cleanList;
};

export function CaseProvider({ children }) {
  const [cases, setCases] = useState(() => {
    const local = localStorage.getItem('local_cases');
    if (!local) return sanitizeCases(initialCases);
    const parsed = JSON.parse(local);
    const hasTargetCase = parsed.some(c => c.id === '115X15023');
    if (!hasTargetCase) {
      const merged = [...initialCases, ...parsed.filter(c => c.id !== '115X15023')];
      const cleaned = sanitizeCases(merged);
      localStorage.setItem('local_cases', JSON.stringify(cleaned));
      return cleaned;
    }
    const cleaned = sanitizeCases(parsed);
    localStorage.setItem('local_cases', JSON.stringify(cleaned));
    return cleaned;
  });

  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const fetchCases = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'cases'));
        const isInitialized = localStorage.getItem('cases_db_initialized') === 'true';

        if (querySnapshot.empty && !isInitialized) {
          const seeded = sanitizeCases(initialCases);
          for (const c of seeded) {
            await setDoc(doc(db, 'cases', c._recordId || c.id), c);
          }
          localStorage.setItem('cases_db_initialized', 'true');
          setCases(seeded);
          localStorage.setItem('local_cases', JSON.stringify(seeded));
        } else if (!querySnapshot.empty) {
          const fetchedCases = [];
          querySnapshot.forEach((doc) => {
            fetchedCases.push(doc.data());
          });
          const cleaned = sanitizeCases(fetchedCases);
          cleaned.sort((a, b) => a.id.localeCompare(b.id));
          setCases(cleaned);
          localStorage.setItem('local_cases', JSON.stringify(cleaned));
          localStorage.setItem('cases_db_initialized', 'true');
        }
      } catch (error) {
        console.error('Error fetching cases from Firestore:', error);
      }
    };

    fetchCases();
  }, []);

  // 獨立精準比對個案紀錄 (優先使用 _recordId 避免影響同案號其他碼別紀錄)
  const isRecordMatch = (item, target) => {
    if (!item || !target) return false;
    if (typeof target === 'object') {
      if (target._recordId && item._recordId) {
        return item._recordId === target._recordId;
      }
      if (target.id && target.serviceContent) {
        return item.id === target.id && item.serviceContent === target.serviceContent;
      }
      if (target.id) return item.id === target.id;
    }
    return item._recordId === target || item.id === target;
  };

  const addCase = async (newCase) => {
    const caseToAdd = {
      ...newCase,
      _recordId: newCase._recordId || `${newCase.id}_${newCase.serviceContent || 'default'}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    };
    const updated = [...cases, caseToAdd];
    setCases(updated);
    localStorage.setItem('local_cases', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'cases', caseToAdd._recordId), caseToAdd);
      } catch (error) {
        console.error('Error adding case to Firestore:', error);
      }
    }
  };

  const updateCase = async (target, updatedFields) => {
    const updated = cases.map((c) => {
      if (isRecordMatch(c, target)) {
        return {
          ...c,
          ...updatedFields,
          // 保留原紀錄的 _recordId，避免變更服務碼別時失去獨立識別碼
          _recordId: c._recordId || updatedFields._recordId || (typeof target === 'object' ? target._recordId : undefined) || `${c.id}_${updatedFields.serviceContent || c.serviceContent}_${Date.now()}`
        };
      }
      return c;
    });
    setCases(updated);
    localStorage.setItem('local_cases', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        const docId = typeof target === 'object' ? (target._recordId || target.id) : target;
        await updateDoc(doc(db, 'cases', docId), updatedFields);
      } catch (error) {
        console.error('Error updating case in Firestore:', error);
      }
    }
  };

  const closeCase = async (target) => {
    const updated = cases.map((c) => (isRecordMatch(c, target) ? { ...c, isClosed: true } : c));
    setCases(updated);
    localStorage.setItem('local_cases', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        const docId = typeof target === 'object' ? (target._recordId || target.id) : target;
        await updateDoc(doc(db, 'cases', docId), { isClosed: true });
      } catch (error) {
        console.error('Error closing case in Firestore:', error);
      }
    }
  };

  const reopenCase = async (target) => {
    const updated = cases.map((c) => (isRecordMatch(c, target) ? { ...c, isClosed: false } : c));
    setCases(updated);
    localStorage.setItem('local_cases', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        const docId = typeof target === 'object' ? (target._recordId || target.id) : target;
        await updateDoc(doc(db, 'cases', docId), { isClosed: false });
      } catch (error) {
        console.error('Error reopening case in Firestore:', error);
      }
    }
  };

  const deleteCase = async (target) => {
    const updated = cases.filter((c) => !isRecordMatch(c, target));
    setCases(updated);
    localStorage.setItem('local_cases', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        const docId = typeof target === 'object' ? (target._recordId || target.id) : target;
        await deleteDoc(doc(db, 'cases', docId));
      } catch (error) {
        console.error('Error deleting case from Firestore:', error);
      }
    }
  };

  return (
    <CaseContext.Provider value={{ cases, addCase, updateCase, closeCase, reopenCase, deleteCase }}>
      {children}
    </CaseContext.Provider>
  );
}

export function useCases() {
  return useContext(CaseContext);
}
