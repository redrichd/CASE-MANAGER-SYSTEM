/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext } from 'react';

const UnitContext = createContext();

const initialUnits = [
  { id: 'U001', name: '大同居家照顧服務所', services: ['BA'], isStopped: false },
  { id: 'U002', name: '中山長照居家機構', services: ['BA', 'D'], isStopped: false },
  { id: 'U003', name: '萬華社區關懷協會', services: ['BA'], isStopped: false },
  { id: 'U004', name: '大安居家喘息服務處', services: ['D'], isStopped: false },
  { id: 'U005', name: '信義停派居家機構', services: ['BA', 'D'], isStopped: true },
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
      },
    ]);
  };

  return (
    <UnitContext.Provider value={{ units, setUnits, toggleStopUnit, updateUnit, addUnit }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnits() {
  return useContext(UnitContext);
}
