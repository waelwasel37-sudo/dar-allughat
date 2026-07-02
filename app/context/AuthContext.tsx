'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
// 🎯 تعديل: استيراد getRedirectResult لإكمال نظام تسجيل الدخول الجديد
import { onAuthStateChanged, signOut, User, getRedirectResult } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  // 🎯 حذف: لم نعد بحاجة لدالة الدخول من هنا
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
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
    // 🎯 جديد: دالة مدمجة لمعالجة المصادقة عند التحميل
    const handleAuthFlow = async () => {
      // 🎯 أولاً: محاولة التقاط نتيجة إعادة التوجيه من جوجل
      // هذا يضمن أننا نعالج تسجيل الدخول الجديد فوراً عند عودة المستخدم
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("Firebase redirect result processed for user:", result.user.uid);
          // لا نحتاج لكتابة كود إضافي هنا، لأن المستمع onAuthStateChanged
          // سيتم تفعيله تلقائياً بالبيانات الصحيحة ويكمل المهمة.
        }
      } catch (error) {
        console.error("Error processing Firebase redirect result:", error);
      }

      // 🎯 ثانياً: المستمع الدائم لحالة المصادقة
      // هذا المستمع هو مصدر الحقيقة الوحيد لحالة تسجيل الدخول
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
                const ADMIN_EMAIL = 'waelwasel37@gmail.com';
                const userIsAdmin = currentUser.email === ADMIN_EMAIL;
                setIsAdmin(userIsAdmin);

                if (userIsAdmin && pathname === '/login') {
                    window.location.href = '/admin';
                }
            } else {
                console.error('Server session login failed.');
                await signOut(auth);
                // The onAuthStateChanged will fire again with null, handling the state update
            }
          } catch (e) {
            console.error('Error during session creation or token fetching:', e);
            await signOut(auth);
          }
        } else {
          // No user is signed in
          const currentCachedUser = auth.currentUser;
          if (currentCachedUser) {
            // This case is rare but handles cleanup if state is inconsistent
            await triggerServerLogout(currentCachedUser.uid);
          }
          setUser(null);
          setIsAdmin(false);

          if (pathname.startsWith('/admin')) {
            window.location.href = '/login';
          }
        }
        setLoading(false);
      });
      return unsubscribe;
    };

    const unsubscribePromise = handleAuthFlow();

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };

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
      // onAuthStateChanged will handle state cleanup
      window.location.href = '/';
    } catch (error) {
      console.error("Error during sign-out:", error);
    }
  }, []);

  const contextValue = useMemo(() => ({
    user,
    isAdmin,
    loading,
    logout
  }), [user, isAdmin, loading, logout]);

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