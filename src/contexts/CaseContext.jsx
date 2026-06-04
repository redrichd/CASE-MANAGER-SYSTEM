/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../services/firebase';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';

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
    isClosed: false,
  }
];

export function CaseProvider({ children }) {
  const [cases, setCases] = useState(initialCases);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const fetchCases = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'cases'));
        if (querySnapshot.empty) {
          // Seed the database
          for (const c of initialCases) {
            await setDoc(doc(db, 'cases', c.id), c);
          }
          setCases(initialCases);
        } else {
          const fetchedCases = [];
          querySnapshot.forEach((doc) => {
            fetchedCases.push(doc.data());
          });
          // Sort by id or date to ensure a deterministic list order
          fetchedCases.sort((a, b) => a.id.localeCompare(b.id));
          setCases(fetchedCases);
        }
      } catch (error) {
        console.error('Error fetching cases from Firestore:', error);
      }
    };

    fetchCases();
  }, []);

  const addCase = async (newCase) => {
    setCases((prev) => [...prev, newCase]);
    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'cases', newCase.id), newCase);
      } catch (error) {
        console.error('Error adding case to Firestore:', error);
      }
    }
  };

  const updateCase = async (id, updatedFields) => {
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c))
    );
    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'cases', id), updatedFields);
      } catch (error) {
        console.error('Error updating case in Firestore:', error);
      }
    }
  };

  const closeCase = async (id) => {
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isClosed: true } : c))
    );
    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'cases', id), { isClosed: true });
      } catch (error) {
        console.error('Error closing case in Firestore:', error);
      }
    }
  };

  return (
    <CaseContext.Provider value={{ cases, addCase, updateCase, closeCase }}>
      {children}
    </CaseContext.Provider>
  );
}

export function useCases() {
  return useContext(CaseContext);
}
