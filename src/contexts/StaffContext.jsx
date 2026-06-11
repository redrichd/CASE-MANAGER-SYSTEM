/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../services/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

const StaffContext = createContext();

const initialStaff = [
  {
    empId: 'E0001',
    name: '陳個管',
    gender: 'F',
    area: '新莊區',
    title: '個管員'
  },
  {
    empId: 'E0002',
    name: '張個管',
    gender: 'M',
    area: '三蘆區',
    title: '個管員'
  },
  {
    empId: 'E0003',
    name: '林督導',
    gender: 'F',
    area: '板中永區',
    title: '督導'
  }
];

export function StaffProvider({ children }) {
  const [staffList, setStaffList] = useState(() => {
    const local = localStorage.getItem('local_staff_list');
    return local ? JSON.parse(local) : initialStaff;
  });

  const [areas, setAreas] = useState(() => {
    const local = localStorage.getItem('local_areas');
    return local ? JSON.parse(local) : ['新莊區', '三蘆區', '板中永區'];
  });

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      localStorage.setItem('local_staff_list', JSON.stringify(staffList));
      localStorage.setItem('local_areas', JSON.stringify(areas));
      return;
    }

    const fetchStaff = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'staff'));
        const isInitialized = localStorage.getItem('staff_db_initialized') === 'true';

        if (querySnapshot.empty && !isInitialized) {
          for (const s of initialStaff) {
            await setDoc(doc(db, 'staff', s.empId), s);
          }
          localStorage.setItem('staff_db_initialized', 'true');
          setStaffList(initialStaff);
        } else if (!querySnapshot.empty) {
          const fetchedStaff = [];
          querySnapshot.forEach((doc) => {
            fetchedStaff.push(doc.data());
          });
          fetchedStaff.sort((a, b) => a.empId.localeCompare(b.empId));
          setStaffList(fetchedStaff);
          localStorage.setItem('staff_db_initialized', 'true');
        } else {
          setStaffList([]);
        }
      } catch (error) {
        console.error('Error fetching staff from Firestore:', error);
      }
    };

    fetchStaff();
  }, [areas, staffList]);

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
