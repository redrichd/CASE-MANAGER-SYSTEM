/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../services/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

const StaffContext = createContext();

const initialStaff = [
  { empId: '852', name: '曾玟文', gender: 'F', area: '新莊區', title: '個管員' },
  { empId: '855', name: '邱煌軒', gender: 'M', area: '新莊區', title: '個管員' },
  { empId: '856', name: '賴惠純', gender: 'F', area: '新莊區', title: '個管員' },
  { empId: '857', name: '葉湘芸', gender: 'F', area: '新莊區', title: '個管員' },
  { empId: '863', name: '黃凱琳', gender: 'F', area: '新莊區', title: '個管員' },
  { empId: '891', name: '王昱昕', gender: 'M', area: '', title: '督導' },
  { empId: '908', name: '林依珊', gender: 'F', area: '三蘆區', title: '個管員' },
  { empId: '913', name: '傅韶揚', gender: 'M', area: '三蘆區', title: '個管員' },
  { empId: '915', name: '楊文慧', gender: 'F', area: '三蘆區', title: '個管員' },
  { empId: '930', name: '龐豫',   gender: 'F', area: '三蘆區', title: '個管員' }
];

export function StaffProvider({ children }) {
  const [staffList, setStaffList] = useState(() => {
    const local = localStorage.getItem('local_staff_list');
    if (local) {
      const parsed = JSON.parse(local);
      // 自動合併 initialStaff，確保本機與離線狀態也能看到新名單
      const merged = [...parsed];
      let updated = false;
      for (const s of initialStaff) {
        if (!merged.some(m => m.empId === s.empId || m.name === s.name)) {
          merged.push(s);
          updated = true;
        }
      }
      if (updated) {
        merged.sort((a, b) => a.empId.localeCompare(b.empId));
        localStorage.setItem('local_staff_list', JSON.stringify(merged));
      }
      return merged;
    }
    return initialStaff;
  });

  const [areas, setAreas] = useState(() => {
    const local = localStorage.getItem('local_areas');
    return local ? JSON.parse(local) : ['新莊區', '三蘆區', '板中永區'];
  });

  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const fetchStaff = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'staff'));
        
        // 撈取資料庫目前已有的人員
        const fetchedStaff = [];
        querySnapshot.forEach((doc) => {
          fetchedStaff.push(doc.data());
        });

        // 自動合併 initialStaff，如果資料庫中沒有該工號或名字，就寫入（保證不重複且補齊名單）
        let updatedDb = false;
        for (const s of initialStaff) {
          const exists = fetchedStaff.some(
            (fs) => fs.empId === s.empId || fs.name === s.name
          );
          if (!exists) {
            await setDoc(doc(db, 'staff', s.empId), s);
            fetchedStaff.push(s);
            updatedDb = true;
          }
        }

        fetchedStaff.sort((a, b) => a.empId.localeCompare(b.empId));
        setStaffList(fetchedStaff);
        localStorage.setItem('local_staff_list', JSON.stringify(fetchedStaff));
        localStorage.setItem('staff_db_initialized', 'true');
      } catch (error) {
        console.error('Error fetching/merging staff in Firestore:', error);
      }
    };

    fetchStaff();
  }, []);

  const addStaff = async (newStaff) => {
    const updated = [...staffList, newStaff].sort((a, b) => a.empId.localeCompare(b.empId));
    setStaffList(updated);
    localStorage.setItem('local_staff_list', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'staff', newStaff.empId), newStaff);
      } catch (error) {
        console.error('Error adding staff to Firestore:', error);
      }
    }
  };

  const updateStaff = async (empId, updatedFields) => {
    const updated = staffList.map((s) => (s.empId === empId ? { ...s, ...updatedFields } : s));
    setStaffList(updated);
    localStorage.setItem('local_staff_list', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'staff', empId), updatedFields);
      } catch (error) {
        console.error('Error updating staff in Firestore:', error);
      }
    }
  };

  const deleteStaff = async (empId) => {
    const updated = staffList.filter((s) => s.empId !== empId);
    setStaffList(updated);
    localStorage.setItem('local_staff_list', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        await deleteDoc(doc(db, 'staff', empId));
      } catch (error) {
        console.error('Error deleting staff from Firestore:', error);
      }
    }
  };

  const addArea = (areaName) => {
    if (!areaName.trim()) return;
    setAreas((prev) => {
      if (prev.includes(areaName.trim())) return prev;
      const updated = [...prev, areaName.trim()];
      localStorage.setItem('local_areas', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteArea = async (areaName) => {
    const updatedAreas = areas.filter((a) => a !== areaName);
    setAreas(updatedAreas);
    localStorage.setItem('local_areas', JSON.stringify(updatedAreas));

    const updatedStaff = staffList.map((s) => (s.area === areaName ? { ...s, area: '' } : s));
    setStaffList(updatedStaff);
    localStorage.setItem('local_staff_list', JSON.stringify(updatedStaff));

    if (isFirebaseConfigured()) {
      try {
        const querySnapshot = await getDocs(collection(db, 'staff'));
        querySnapshot.forEach(async (d) => {
          const data = d.data();
          if (data.area === areaName) {
            await updateDoc(doc(db, 'staff', data.empId), { area: '' });
          }
        });
      } catch (error) {
        console.error('Error updating staff documents in Firestore after area deletion:', error);
      }
    }
  };

  return (
    <StaffContext.Provider value={{ staffList, addStaff, updateStaff, deleteStaff, areas, addArea, deleteArea }}>
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  return useContext(StaffContext);
}
