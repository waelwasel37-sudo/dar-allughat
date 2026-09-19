'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { onAuthStateChanged, signOut, User, getRedirectResult } from 'firebase/auth';
import { auth } from '../lib/firebase-client'; 

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isEditor: boolean; // إضافة صلاحية المحرر للكود
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditor, setIsEditor] = useState(false); // تتبع حالة المحررين الجداد
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const triggerServerLogout = useCallback(async (uid: string) => {
    try {
      await fetch('/api/auth/session-logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
    } catch (e) {
      console.error('Failed to trigger server logout:', e);
    }
  }, []);

  useEffect(() => {
    // 1️⃣ معالجة إعادة التوجيه في سطر منفصل فوراً
    getRedirectResult(auth).catch((error) => {
      console.error("Error processing Firebase redirect result:", error);
    });

    // 2️⃣ تشغيل مستمع الهوية المباشر وحقن الصلاحيات بالمليم
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        try {
          const idToken = await currentUser.getIdToken(true);
          const response = await fetch('/api/auth/session-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken }),
          });

          if (response.ok) {
              const userEmail = currentUser.email?.toLowerCase() || '';
              
              // 👑 المالك الأساسي والوحيد للمشروع (Owner)
              const ADMIN_EMAIL = 'waelwasel37@gmail.com';
              const userIsAdmin = userEmail === ADMIN_EMAIL;
              setIsAdmin(userIsAdmin);

              // 🛡️ قائمة الموظفين والمحررين المعتمدين والمحميين جوه الكود (Editors)
              const ALLOWED_EDITORS = [
                'dallughat@gmail.com',
                'bondka111@gmail.com'
              ];
              const userIsEditor = userIsAdmin || ALLOWED_EDITORS.includes(userEmail);
              setIsEditor(userIsEditor);

              // إذا كان المستخدم آدمن أو محرر معتمد يحاول الدخول لصفحة الـ Login يتم تحويله للوحة التحكم
              if (userIsEditor && pathname === '/login') {
                  window.location.replace('/admin');
              }
          } else {
              console.error('Server session login failed.');
              await signOut(auth);
          }
        } catch (e) {
          console.error('Error during session creation or token fetching:', e);
          await signOut(auth);
        }
      } else {
        const currentCachedUser = auth.currentUser;
        if (currentCachedUser) {
          await triggerServerLogout(currentCachedUser.uid);
        }
        setUser(null);
        setIsAdmin(false);
        setIsEditor(false);

        if (pathname.startsWith('/admin')) {
          window.location.href = '/login';
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, triggerServerLogout]);

  const logout = useCallback(async () => {
    try {
      const currentCachedUser = auth.currentUser;
      if (currentCachedUser) {
        await fetch('/api/auth/session-logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: currentCachedUser.uid }),
        });
      }
      await signOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error("Error during sign-out:", error);
    }
  }, []);

  const contextValue = useMemo(() => ({
    user,
    isAdmin,
    isEditor,
    loading,
    logout
  }), [user, isAdmin, isEditor, loading, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};