'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // 🎯 تصحيح قاتل لمنع الـ Loop: فصل منطق الـ session-logout في دالة منفصلة مستقرة
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
    // نستخدم متغير داخلي لتتبع حالة المستخدم الحالية لمنع التكرار الدائري
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
              setUser(null);
              setIsAdmin(false);
          }
        } catch (e) {
          console.error('Error during session creation lookup:', e);
          setUser(null);
          setIsAdmin(false);
        }

      } else {
        // 🎯 تصحيح قاتل: جلب الـ uid بشكل آمن بدون الاعتماد على كائن الـ user الخارجي لمنع التكرار اللانهائي
        const currentCachedUser = auth.currentUser;
        if (currentCachedUser) {
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

    return () => unsubscribe();
  }, [pathname, triggerServerLogout]); // ✅ تم إزالة user من هنا نهائياً لمنع التكرار اللانهائي والانهيار

  // 🎯 التثبيت الذكي لدالة الدخول بالذاكرة لمنع رندر الواجهة
  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      alert("فشل تسجيل الدخول باستخدام جوجل. يرجى المحاولة مرة أخرى.");
    }
  }, []);

  // 🎯 التثبيت الذكي لدالة الخروج بالذاكرة لمنع رندر الواجهة
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
      setUser(null);
      setIsAdmin(false);
      window.location.href = '/';
    } catch (error) {
      console.error("Error during sign-out:", error);
    }
  }, []);

  // 🎯 العلاج الشافي والنهائي لخطأ 306: حفظ كائن السياق بالكامل بـ useMemo
  const contextValue = useMemo(() => ({
    user,
    isAdmin,
    loading,
    loginWithGoogle,
    logout
  }), [user, isAdmin, loading, loginWithGoogle, logout]);

  // 🎯 تصحيح Next.js 15: تمرير الـ children مباشرة للسماح بالـ Server-side rendering النظيف للموقع والأقسام
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