/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../services/firebase';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';

const UnitContext = createContext();

const initialUnits = [
  { id: 'U001', name: '大同居家照顧服務所', services: ['BA'], isStopped: false, comments: [] },
  { id: 'U002', name: '中山長照居家機構', services: ['BA', 'D'], isStopped: false, comments: [] },
  { id: 'U003', name: '萬華社區關懷協會', services: ['BA'], isStopped: false, comments: [] },
  { id: 'U004', name: '大安居家喘息服務處', services: ['D'], isStopped: false, comments: [] },
  { id: 'U005', name: '信義停派居家機構', services: ['BA', 'D'], isStopped: true, comments: [] },
];

export function UnitProvider({ children }) {
  const [units, setUnits] = useState(initialUnits);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const fetchUnits = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'units'));
        if (querySnapshot.empty) {
          // Seed the database
          for (const u of initialUnits) {
            await setDoc(doc(db, 'units', u.id), u);
          }
          setUnits(initialUnits);
        } else {
          const fetchedUnits = [];
          querySnapshot.forEach((doc) => {
            fetchedUnits.push(doc.data());
          });
          // Sort by id to ensure a deterministic list order
          fetchedUnits.sort((a, b) => a.id.localeCompare(b.id));
          setUnits(fetchedUnits);
        }
      } catch (error) {
        console.error('Error fetching units from Firestore:', error);
      }
    };

    fetchUnits();
  }, []);

  const toggleStopUnit = async (id) => {
    let currentIsStopped = false;
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          currentIsStopped = u.isStopped;
          return { ...u, isStopped: !u.isStopped };
        }
        return u;
      })
    );

    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'units', id), { isStopped: !currentIsStopped });
      } catch (error) {
        console.error('Error toggling stop unit in Firestore:', error);
      }
    }
  };

  const updateUnit = async (id, updatedFields) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updatedFields } : u))
    );

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

    setUnits((prev) => [...prev, formattedUnit]);

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
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id === unitId) {
          updatedComments = [...(u.comments || []), comment];
          return { ...u, comments: updatedComments };
        }
        return u;
      })
    );

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
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id !== unitId) return u;
        updatedComments = (u.comments || []).map((c, i) =>
          i === commentIndex ? { ...c, ...updatedFields } : c
        );
        return { ...u, comments: updatedComments };
      })
    );

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
