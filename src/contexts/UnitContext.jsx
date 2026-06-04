/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext } from 'react';

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

  const toggleStopUnit = (id) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isStopped: !u.isStopped } : u))
    );
  };

  const updateUnit = (id, updatedFields) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updatedFields } : u))
    );
  };

  const addUnit = (newUnit) => {
    setUnits((prev) => [
      ...prev,
      {
        ...newUnit,
        id: `U${String(prev.length + 1).padStart(3, '0')}`,
        isStopped: newUnit.isStopped || false,
        comments: newUnit.comments || [],
      },
    ]);
  };

  const addComment = (unitId, comment) => {
    setUnits((prev) =>
      prev.map((u) =>
        u.id === unitId ? { ...u, comments: [...(u.comments || []), comment] } : u
      )
    );
  };

  const updateComment = (unitId, commentIndex, updatedFields) => {
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id !== unitId) return u;
        const newComments = (u.comments || []).map((c, i) =>
          i === commentIndex ? { ...c, ...updatedFields } : c
        );
        return { ...u, comments: newComments };
      })
    );
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
