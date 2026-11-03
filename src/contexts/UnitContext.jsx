/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../services/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

const UnitContext = createContext();

const initialUnits = [
  { id: 'U001', name: '大同居家照顧服務所', services: ['BA'], serviceAreas: ['新莊區', '三重區', '永和區'], isStopped: false, comments: [] },
  { id: 'U002', name: '中山長照居家機構', services: ['BA', 'DA'], serviceAreas: ['新莊區', '三重區'], isStopped: false, comments: [] },
  { id: 'U003', name: '萬華社區關懷協會', services: ['BA'], serviceAreas: ['新莊區'], isStopped: false, comments: [] },
  { id: 'U004', name: '大安居家喘息服務處', services: ['DA'], serviceAreas: ['三重區', '永和區'], isStopped: false, comments: [] },
  { id: 'U005', name: '信義停派居家機構', services: ['BA', 'DA'], serviceAreas: ['永和區'], isStopped: true, comments: [] },
  { id: 'U007', name: '悠康事業有限公司附設新北市私立悠康居家長照機構', services: ['BA', 'GA09', 'SC09'], serviceAreas: ['新莊區', '三重區', '永和區'], isStopped: false, comments: [], rating: 3 },
];

const initialReferralUnits = [
  {
    id: 'RU001',
    name: '新北市立聯合醫院 (失智據點/居家醫療)',
    services: ['失智症社區服務據點', '居家醫療', '2-3級轉介巷弄長照站'],
    serviceAreas: ['新莊區', '三重區', '永和區'],
    hasLetterOfIntent: true,
    isStopped: false,
    rating: 3,
    comments: [],
  },
  {
    id: 'RU002',
    name: '新北市輔具資源中心',
    services: ['二手輔具/輔具資源中心'],
    serviceAreas: ['新莊區', '三重區', '永和區'],
    hasLetterOfIntent: true,
    isStopped: false,
    rating: 3,
    comments: [],
  },
  {
    id: 'RU003',
    name: '三重慈濟社區長照服務站',
    services: ['家照服務', '志工關懷訪視', '急難救助', '提供社照C巷弄長照站資訊'],
    serviceAreas: ['三重區'],
    hasLetterOfIntent: false,
    isStopped: false,
    rating: 2,
    comments: [],
  },
  {
    id: 'RU004',
    name: '安寧緩和醫療推廣診所',
    services: ['安寧緩和', '健保居家護理'],
    serviceAreas: ['新莊區', '三重區'],
    hasLetterOfIntent: true,
    isStopped: false,
    rating: 2,
    comments: [],
  },
  {
    id: 'RU005',
    name: '永和醫事C巷弄長照站',
    services: ['2-3級轉介巷弄長照站', '提供社照C巷弄長照站資訊'],
    serviceAreas: ['永和區'],
    hasLetterOfIntent: true,
    isStopped: false,
    rating: 2,
    comments: [],
  },
];

export function UnitProvider({ children }) {
  const [units, setUnits] = useState(() => {
    const local = localStorage.getItem('local_units');
    if (local) {
      const parsed = JSON.parse(local);
      const migrated = parsed.map(u => ({
        ...u,
        serviceAreas: (u.serviceAreas || ['新莊區', '三重區', '永和區']).map(a => a === '三蘆區' ? '三重區' : (a === '板中永區' ? '永和區' : a))
      }));
      if (JSON.stringify(migrated) !== local) {
        localStorage.setItem('local_units', JSON.stringify(migrated));
      }
      return migrated;
    }
    return initialUnits;
  });

  const [referralUnits, setReferralUnits] = useState(() => {
    const local = localStorage.getItem('local_referral_units');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error('Error parsing local_referral_units:', e);
      }
    }
    return initialReferralUnits;
  });

  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const fetchUnits = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'units'));
        const isInitialized = localStorage.getItem('units_db_initialized') === 'true';

        if (querySnapshot.empty && !isInitialized) {
          // Seed the database with writeBatch
          const batch = writeBatch(db);
          for (const u of initialUnits) {
            batch.set(doc(db, 'units', u.id), u);
          }
          await batch.commit();
          localStorage.setItem('units_db_initialized', 'true');
          setUnits(initialUnits);
          localStorage.setItem('local_units', JSON.stringify(initialUnits));
        } else if (!querySnapshot.empty) {
          const fetchedUnits = [];
          const batch = writeBatch(db);
          let hasMigration = false;
          for (const docSnapshot of querySnapshot.docs) {
            const data = docSnapshot.data();
            let updatedUnit = { ...data };
            let unitChanged = false;

            // 自動將資料庫中舊的 D 碼搬遷修正為 DA 碼，防止歷史數據殘留
            if (data.services && data.services.includes('D')) {
              updatedUnit.services = data.services.map(s => s === 'D' ? 'DA' : s);
              unitChanged = true;
            }
            if (!data.serviceAreas || !Array.isArray(data.serviceAreas)) {
              updatedUnit.serviceAreas = ['新莊區', '三重區', '永和區'];
              unitChanged = true;
            } else if (data.serviceAreas.includes('三蘆區') || data.serviceAreas.includes('板中永區')) {
              updatedUnit.serviceAreas = data.serviceAreas.map(a => a === '三蘆區' ? '三重區' : (a === '板中永區' ? '永和區' : a));
              unitChanged = true;
            }

            if (unitChanged) {
              batch.set(doc(db, 'units', data.id), updatedUnit);
              hasMigration = true;
            }
            fetchedUnits.push(updatedUnit);
          }
          if (hasMigration) {
            await batch.commit();
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
        const updatedUnit = { 
          ...u, 
          isStopped: !u.isStopped, 
          stopCount: nextStopCount 
        };
        if (u.overrideStats) {
          updatedUnit.overrideStats = {
            ...u.overrideStats,
            stopCount: nextStopCount
          };
        }
        return updatedUnit;
      }
      return u;
    });

    setUnits(updated);
    localStorage.setItem('local_units', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        const updatePayload = {
          isStopped: !currentIsStopped,
          stopCount: nextStopCount
        };
        const targetUnit = units.find(u => u.id === id);
        if (targetUnit && targetUnit.overrideStats) {
          updatePayload.overrideStats = {
            ...targetUnit.overrideStats,
            stopCount: nextStopCount
          };
        }
        await updateDoc(doc(db, 'units', id), updatePayload);
      } catch (error) {
        console.error('Error toggling stop unit in Firestore:', error);
      }
    }
  };

  const updateUnit = async (id, updatedFields) => {
    const updated = units.map((u) => {
      if (u.id === id) {
        const nextFields = { ...updatedFields };
        if (u.overrideStats && typeof updatedFields.stopCount === 'number') {
          nextFields.overrideStats = {
            ...u.overrideStats,
            stopCount: updatedFields.stopCount
          };
        }
        return { ...u, ...nextFields };
      }
      return u;
    });

    // Firestore payload 同步更新
    const targetUnit = units.find(u => u.id === id);
    const dbFields = { ...updatedFields };
    if (targetUnit && targetUnit.overrideStats && typeof updatedFields.stopCount === 'number') {
      dbFields.overrideStats = {
        ...targetUnit.overrideStats,
        stopCount: updatedFields.stopCount
      };
    }

    setUnits(updated);
    localStorage.setItem('local_units', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'units', id), dbFields);
      } catch (error) {
        console.error('Error updating unit in Firestore:', error);
      }
    }
  };

  const addUnit = async (newUnit) => {
    const trimmedName = newUnit.name?.trim();
    if (!trimmedName) return;

    if (units.some(u => u.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      console.warn(`Unit with name "${trimmedName}" already exists.`);
      return;
    }

    const ids = units.map(u => {
      const match = u.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    const newId = `U${String(maxId + 1).padStart(3, '0')}`;
    const formattedUnit = {
      ...newUnit,
      id: newId,
      serviceAreas: newUnit.serviceAreas || ['新莊區', '三重區', '永和區'],
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

  const deleteUnit = async (id) => {
    const updated = units.filter((u) => u.id !== id);
    setUnits(updated);
    localStorage.setItem('local_units', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        await deleteDoc(doc(db, 'units', id));
      } catch (error) {
        console.error('Error deleting unit in Firestore:', error);
      }
    }
  };

  // 轉介合作單位 (Referral Units) 增刪查改
  const addReferralUnit = async (newUnit) => {
    const trimmedName = newUnit.name?.trim();
    if (!trimmedName) return;

    if (referralUnits.some(u => u.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      console.warn(`Referral unit with name "${trimmedName}" already exists.`);
      return;
    }

    const ids = referralUnits.map(u => {
      const match = u.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    const newId = `RU${String(maxId + 1).padStart(3, '0')}`;
    const formattedUnit = {
      ...newUnit,
      id: newId,
      services: newUnit.services || [],
      serviceAreas: newUnit.serviceAreas || ['新莊區', '三重區', '永和區'],
      isStopped: newUnit.isStopped || false,
      hasLetterOfIntent: !!newUnit.hasLetterOfIntent,
      comments: newUnit.comments || [],
      rating: newUnit.rating || 0,
    };

    const updated = [...referralUnits, formattedUnit];
    setReferralUnits(updated);
    localStorage.setItem('local_referral_units', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(db, 'referralUnits', newId), formattedUnit);
      } catch (error) {
        console.error('Error adding referral unit to Firestore:', error);
      }
    }
  };

  const updateReferralUnit = async (id, updatedFields) => {
    const updated = referralUnits.map((u) => {
      if (u.id === id) {
        return { ...u, ...updatedFields };
      }
      return u;
    });

    setReferralUnits(updated);
    localStorage.setItem('local_referral_units', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'referralUnits', id), updatedFields);
      } catch (error) {
        console.error('Error updating referral unit in Firestore:', error);
      }
    }
  };

  const toggleStopReferralUnit = async (id, currentStopCount = 0) => {
    let currentIsStopped = false;
    let nextStopCount = currentStopCount;
    const updated = referralUnits.map((u) => {
      if (u.id === id) {
        currentIsStopped = u.isStopped;
        nextStopCount = !currentIsStopped ? currentStopCount + 1 : currentStopCount;
        return {
          ...u,
          isStopped: !u.isStopped,
          stopCount: nextStopCount,
        };
      }
      return u;
    });

    setReferralUnits(updated);
    localStorage.setItem('local_referral_units', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'referralUnits', id), {
          isStopped: !currentIsStopped,
          stopCount: nextStopCount,
        });
      } catch (error) {
        console.error('Error toggling stop referral unit in Firestore:', error);
      }
    }
  };

  const deleteReferralUnit = async (id) => {
    const updated = referralUnits.filter((u) => u.id !== id);
    setReferralUnits(updated);
    localStorage.setItem('local_referral_units', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        await deleteDoc(doc(db, 'referralUnits', id));
      } catch (error) {
        console.error('Error deleting referral unit in Firestore:', error);
      }
    }
  };

  const addReferralUnitComment = async (unitId, comment) => {
    let updatedComments = [];
    const updated = referralUnits.map((u) => {
      if (u.id === unitId) {
        updatedComments = [...(u.comments || []), comment];
        return { ...u, comments: updatedComments };
      }
      return u;
    });

    setReferralUnits(updated);
    localStorage.setItem('local_referral_units', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'referralUnits', unitId), { comments: updatedComments });
      } catch (error) {
        console.error('Error adding referral unit comment in Firestore:', error);
      }
    }
  };

  const updateReferralUnitComment = async (unitId, commentIndex, updatedFields) => {
    let updatedComments = [];
    const updated = referralUnits.map((u) => {
      if (u.id !== unitId) return u;
      updatedComments = (u.comments || []).map((c, i) =>
        i === commentIndex ? { ...c, ...updatedFields } : c
      );
      return { ...u, comments: updatedComments };
    });

    setReferralUnits(updated);
    localStorage.setItem('local_referral_units', JSON.stringify(updated));

    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(db, 'referralUnits', unitId), { comments: updatedComments });
      } catch (error) {
        console.error('Error updating referral unit comment in Firestore:', error);
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
        deleteUnit,
        addComment,
        updateComment,

        // 轉介單位
        referralUnits,
        setReferralUnits,
        addReferralUnit,
        updateReferralUnit,
        toggleStopReferralUnit,
        deleteReferralUnit,
        addReferralUnitComment,
        updateReferralUnitComment,
      }}
    >
      {children}
    </UnitContext.Provider>
  );
}

export function useUnits() {
  return useContext(UnitContext);
}
