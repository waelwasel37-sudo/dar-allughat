'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { onAuthStateChanged, signOut, User, getRedirectResult } from 'firebase/auth';
import { auth } from '../lib/firebase-client'; 

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isEditor: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
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
    getRedirectResult(auth).catch((error) => {
      console.error("Error processing Firebase redirect result:", error);
    });

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
              // 🎯 التصحيح الخرساني الصارم: قراءة الصلاحيات والملكيات والوظائف من السيرفر المأمن مباشرة
              const data = await response.json();
              setIsAdmin(data.isAdmin || false);
              setIsEditor(data.isEditor || false);

              // إذا كان المستخدم أدمن أو موظف معتمد يحاول دخول صفحة الـ Login يتم توجيهه للوحة التحكم فوراً
              if (data.isEditor && pathname === '/login') {
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