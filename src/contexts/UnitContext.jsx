/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../services/firebase';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';

const UnitContext = createContext();

const initialUnits = [
  { id: 'U001', name: '大同居家照顧服務所', services: ['BA'], isStopped: false, comments: [] },
  { id: 'U002', name: '中山長照居家機構', services: ['BA', 'DA'], isStopped: false, comments: [] },
  { id: 'U003', name: '萬華社區關懷協會', services: ['BA'], isStopped: false, comments: [] },
  { id: 'U004', name: '大安居家喘息服務處', services: ['DA'], isStopped: false, comments: [] },
  { id: 'U005', name: '信義停派居家機構', services: ['BA', 'DA'], isStopped: true, comments: [] },
];

export function UnitProvider({ children }) {
  const [units, setUnits] = useState(() => {
    const local = localStorage.getItem('local_units');
    return local ? JSON.parse(local) : initialUnits;
  });

  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const fetchUnits = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'units'));
        const isInitialized = localStorage.getItem('units_db_initialized') === 'true';

        if (querySnapshot.empty && !isInitialized) {
          // Seed the database
          for (const u of initialUnits) {
            await setDoc(doc(db, 'units', u.id), u);
          }
          localStorage.setItem('units_db_initialized', 'true');
          setUnits(initialUnits);
          localStorage.setItem('local_units', JSON.stringify(initialUnits));
        } else if (!querySnapshot.empty) {
          const fetchedUnits = [];
          for (const docSnapshot of querySnapshot.docs) {
            const data = docSnapshot.data();
            // 自動將資料庫中舊的 D 碼搬遷修正為 DA 碼，防止歷史數據殘留
            if (data.services && data.services.includes('D')) {
              const updatedServices = data.services.map(s => s === 'D' ? 'DA' : s);
              const updatedUnit = { ...data, services: updatedServices };
              await setDoc(doc(db, 'units', data.id), updatedUnit);
              fetchedUnits.push(updatedUnit);
            } else {
              fetchedUnits.push(data);
            }
          }
          // Sort by id to ensure a deterministic list order
          fetchedUnits.sort((a, b) => a.id.localeCompare(b.id));
          setUnits(fetchedUnits);
          localStorage.setItem('local_units', JSON.stringify(fetchedUnits));
          localStorage.setItem('units_db_initialized', 'true');
        }
      } catch (error) {
        console.error('Error fetching/migrating units in Firestore:', error);
      }
    };

    fetchUnits();
  }, []);

  const toggleStopUnit = async (id, currentStopCount = 0) => {
    let currentIsStopped = false;
    let nextStopCount = currentStopCount;
    const updated = units.map((u) => {
      if (u.id === id) {
        currentIsStopped = u.isStopped;
        nextStopCount = !currentIsStopped ? currentStopCount + 1 : currentStopCount;
        return { 
          ...u, 
          isStopped: !u.isStopped, 
          stopCount: nextStopCount 
        };
      }
      return u;
    });

    setUnits(updated);
    localStorage.setItem('local_units', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'units', id), { 
          isStopped: !currentIsStopped,
          stopCount: nextStopCount
        });
      } catch (error) {
        console.error('Error toggling stop unit in Firestore:', error);
      }
    }
  };

  const updateUnit = async (id, updatedFields) => {
    const updated = units.map((u) => (u.id === id ? { ...u, ...updatedFields } : u));
    setUnits(updated);
    localStorage.setItem('local_units', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'units', id), updatedFields);
      } catch (error) {
        console.error('Error updating unit in Firestore:', error);
      }
    }
  };

  const addUnit = async (newUnit) => {
    const newId = `U${String(units.length + 1).padStart(3, '0')}`;
    const formattedUnit = {
      ...newUnit,
      id: newId,
      isStopped: newUnit.isStopped || false,
      comments: newUnit.comments || [],
      rating: newUnit.rating || 0,
    };

    const updated = [...units, formattedUnit];
    setUnits(updated);
    localStorage.setItem('local_units', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'units', newId), formattedUnit);
      } catch (error) {
        console.error('Error adding unit to Firestore:', error);
      }
    }
  };

  const addComment = async (unitId, comment) => {
    let updatedComments = [];
    const updated = units.map((u) => {
      if (u.id === unitId) {
        updatedComments = [...(u.comments || []), comment];
        return { ...u, comments: updatedComments };
      }
      return u;
    });

    setUnits(updated);
    localStorage.setItem('local_units', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'units', unitId), { comments: updatedComments });
      } catch (error) {
        console.error('Error adding comment to Firestore:', error);
      }
    }
  };

  const updateComment = async (unitId, commentIndex, updatedFields) => {
    let updatedComments = [];
    const updated = units.map((u) => {
      if (u.id !== unitId) return u;
      updatedComments = (u.comments || []).map((c, i) =>
        i === commentIndex ? { ...c, ...updatedFields } : c
      );
      return { ...u, comments: updatedComments };
    });

    setUnits(updated);
    localStorage.setItem('local_units', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'units', unitId), { comments: updatedComments });
      } catch (error) {
        console.error('Error updating comment in Firestore:', error);
      }
    }
  };

  return (
    <UnitContext.Provider
      value={{
        units,
        setUnits,
        toggleStopUnit,
        updateUnit,
        addUnit,
        addComment,
        updateComment,
      }}
    >
      {children}
    </UnitContext.Provider>
  );
}

export function useUnits() {
  return useContext(UnitContext);
}
