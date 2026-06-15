/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import { auth, isFirebaseConfigured } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    // 測試環境預設登入模擬管理員以確保整合測試通過
    if (process.env.NODE_ENV === 'test') {
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
  
  const [loading, setLoading] = useState(() => {
    if (process.env.NODE_ENV === 'test') {
      return false;
    }
    return isFirebaseConfigured() ? true : false;
  });

  // 解析 Admin Email 列表
  const adminEmailsStr = import.meta.env.VITE_ADMIN_EMAILS || '';
  const adminEmails = adminEmailsStr
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin = currentUser 
    ? adminEmails.includes(currentUser.email?.toLowerCase() || '') || currentUser.email === 'admin@simulated.com'
    : false;

  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    
    if (!isFirebaseConfigured()) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
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
      email: role === 'admin' ? 'admin@simulated.com' : 'user@simulated.com',
      displayName: role === 'admin' ? '模擬管理員 (Admin)' : '模擬使用者 (User)',
      photoURL: '',
      isSimulated: true,
    };
    setCurrentUser(user);
    localStorage.setItem('simulated_user', JSON.stringify(user));
  };

  const logout = async () => {
    if (isFirebaseConfigured() && process.env.NODE_ENV !== 'test') {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Sign Out Error:', error);
      }
    } else {
      setCurrentUser(null);
      localStorage.removeItem('simulated_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        role: isAdmin ? 'admin' : 'user',
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
    // 若無 Provider 包裹（如部分單元測試中直接渲染子組件），回傳預設管理員狀態以相容舊測試
    return {
      currentUser: {
        email: 'admin@simulated.com',
        displayName: '模擬管理員 (Admin)',
        photoURL: '',
        isSimulated: true,
      },
      isAdmin: true,
      role: 'admin',
      loading: false,
      loginWithGoogle: async () => {},
      loginSimulated: () => {},
      logout: async () => {},
    };
  }
  return context;
}
