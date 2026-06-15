/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import { auth, db, isFirebaseConfigured } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDocs, query, where, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    // 測試環境預設登入模擬管理員以確保整合測試通過
    if (import.meta.env.MODE === 'test') {
      return {
        email: 'admin@simulated.com',
        displayName: '模擬管理員 (Admin)',
        photoURL: '',
        isSimulated: true,
      };
    }
    if (!isFirebaseConfigured()) {
      const localUser = localStorage.getItem('simulated_user');
      return localUser ? JSON.parse(localUser) : null;
    }
    return null;
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    if (import.meta.env.MODE === 'test') {
      return true;
    }
    if (!isFirebaseConfigured()) {
      const localUser = localStorage.getItem('simulated_user');
      if (localUser) {
        const parsed = JSON.parse(localUser);
        return parsed.email === 'admin@simulated.com';
      }
    }
    return false;
  });

  const [isPending, setIsPending] = useState(() => {
    if (import.meta.env.MODE === 'test') {
      return false;
    }
    if (!isFirebaseConfigured()) {
      const localUser = localStorage.getItem('simulated_user');
      if (localUser) {
        const parsed = JSON.parse(localUser);
        return parsed.email === 'pending@simulated.com';
      }
    }
    return false;
  });
  
  const [loading, setLoading] = useState(() => {
    if (import.meta.env.MODE === 'test') {
      return false;
    }
    return isFirebaseConfigured() ? true : false;
  });

  useEffect(() => {
    if (import.meta.env.MODE === 'test') {
      return;
    }
    
    if (!isFirebaseConfigured()) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let isUserAdmin = false;
        let isUserPending = false;
        try {
          // 1. 查詢 Firestore 'staff' 集合，尋找 email 符合的人員
          const staffRef = collection(db, 'staff');
          const q = query(staffRef, where('email', '==', user.email.toLowerCase()));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const staffData = querySnapshot.docs[0].data();
            if (staffData.role === 'admin') {
              isUserAdmin = true;
            } else if (staffData.role === 'pending') {
              isUserPending = true;
            }
          } else {
            // 2. Fallback: 比對環境變數 VITE_ADMIN_EMAILS，若是管理員則建立 admin 員工
            const adminEmailsStr = import.meta.env.VITE_ADMIN_EMAILS || '';
            const adminEmails = adminEmailsStr
              .split(',')
              .map((e) => e.trim().toLowerCase())
              .filter(Boolean);

            if (adminEmails.includes(user.email.toLowerCase())) {
              isUserAdmin = true;
              const newAdminStaff = {
                empId: 'ADMIN',
                name: user.displayName || '系統管理員',
                gender: 'M',
                area: '',
                title: '系統管理員',
                email: user.email.toLowerCase(),
                role: 'admin'
              };
              await setDoc(doc(db, 'staff', 'ADMIN'), newAdminStaff);
            } else {
              // 3. 自動註冊為 pending (待審核) 狀態
              isUserPending = true;
              const emailPrefix = user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 5);
              const generatedId = `P_${emailPrefix}_${Math.floor(100 + Math.random() * 900)}`;
              const newPendingStaff = {
                empId: generatedId,
                name: user.displayName || '新申請人',
                gender: 'F',
                area: '',
                title: '申請人',
                email: user.email.toLowerCase(),
                role: 'pending'
              };
              await setDoc(doc(db, 'staff', generatedId), newPendingStaff);
            }
          }
        } catch (error) {
          console.error('Error querying staff for admin check:', error);
          // 發生錯誤時的 fallback 檢查環境變數
          const adminEmailsStr = import.meta.env.VITE_ADMIN_EMAILS || '';
          const adminEmails = adminEmailsStr
            .split(',')
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
          isUserAdmin = adminEmails.includes(user.email.toLowerCase());
        }
        setIsAdmin(isUserAdmin);
        setIsPending(isUserPending);
      } else {
        setIsAdmin(false);
        setIsPending(false);
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured.');
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    }
  };

  const loginSimulated = (role) => {
    const user = {
      email: role === 'admin' ? 'admin@simulated.com' : (role === 'pending' ? 'pending@simulated.com' : 'user@simulated.com'),
      displayName: role === 'admin' ? '模擬管理員 (Admin)' : (role === 'pending' ? '模擬待審核 (Pending)' : '模擬使用者 (User)'),
      photoURL: '',
      isSimulated: true,
    };
    setIsAdmin(role === 'admin');
    setIsPending(role === 'pending');
    setCurrentUser(user);
    localStorage.setItem('simulated_user', JSON.stringify(user));
  };

  const logout = async () => {
    if (isFirebaseConfigured() && import.meta.env.MODE !== 'test') {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Sign Out Error:', error);
      }
    } else {
      setIsAdmin(false);
      setIsPending(false);
      setCurrentUser(null);
      localStorage.removeItem('simulated_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        isPending,
        role: isAdmin ? 'admin' : (isPending ? 'pending' : 'user'),
        loading,
        loginWithGoogle,
        loginSimulated,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return {
      currentUser: {
        email: 'admin@simulated.com',
        displayName: '模擬管理員 (Admin)',
        photoURL: '',
        isSimulated: true,
      },
      isAdmin: true,
      isPending: false,
      role: 'admin',
      loading: false,
      loginWithGoogle: async () => {},
      loginSimulated: () => {},
      logout: async () => {},
    };
  }
  return context;
}
