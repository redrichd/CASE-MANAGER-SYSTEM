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
  const [staffList, setStaffList] = useState(initialStaff);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const fetchStaff = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'staff'));
        if (querySnapshot.empty) {
          // Seed the database
          for (const s of initialStaff) {
            await setDoc(doc(db, 'staff', s.empId), s);
          }
          setStaffList(initialStaff);
        } else {
          const fetchedStaff = [];
          querySnapshot.forEach((doc) => {
            fetchedStaff.push(doc.data());
          });
          // Sort by empId to ensure deterministic list order
          fetchedStaff.sort((a, b) => a.empId.localeCompare(b.empId));
          setStaffList(fetchedStaff);
        }
      } catch (error) {
        console.error('Error fetching staff from Firestore:', error);
      }
    };

    fetchStaff();
  }, []);

  const addStaff = async (newStaff) => {
    setStaffList((prev) => {
      const updated = [...prev, newStaff];
      return updated.sort((a, b) => a.empId.localeCompare(b.empId));
    });
    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'staff', newStaff.empId), newStaff);
      } catch (error) {
        console.error('Error adding staff to Firestore:', error);
      }
    }
  };

  const updateStaff = async (empId, updatedFields) => {
    setStaffList((prev) =>
      prev.map((s) => (s.empId === empId ? { ...s, ...updatedFields } : s))
    );
    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'staff', empId), updatedFields);
      } catch (error) {
        console.error('Error updating staff in Firestore:', error);
      }
    }
  };

  const deleteStaff = async (empId) => {
    setStaffList((prev) => prev.filter((s) => s.empId !== empId));
    if (isFirebaseConfigured()) {
      try {
        await deleteDoc(doc(db, 'staff', empId));
      } catch (error) {
        console.error('Error deleting staff from Firestore:', error);
      }
    }
  };

  return (
    <StaffContext.Provider value={{ staffList, addStaff, updateStaff, deleteStaff }}>
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  return useContext(StaffContext);
}
