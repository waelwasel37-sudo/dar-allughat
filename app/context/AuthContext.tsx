'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

// 1. هيكل كائن المستخدم المخصص لقراءة وتطابق ميزات الواجهة الخلفية الناجحة
interface ServerUserPayload {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  role: string; // استقبال الـ role الموثق أونلاين
}

interface AuthContextType {
  user: ServerUserPayload | null; // يقرأ كائن السيرفر الكامل بمميزاته
  isAdmin: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ServerUserPayload | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken(true); 
          const response = await fetch('/api/auth/session-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken }),
          });

          const data = await response.json();

          // 2. المطابقة البرمجية: قراءة الـ Response الناجح القادم من السيرفر
          if (response.ok && data.status === "success") {
              // حفظ كائن المستخدم كامل الصلاحيات والمميزات في الواجهة الأمامية
              setUser(data.user);
              
              // قراءة ميزة الـ role المقررة والآتية من الواجهة الخلفية مباشرة
              const userIsAdmin = data.user.role === 'admin' && data.user.email === 'waelwasel37@gmail.com';
              setIsAdmin(userIsAdmin);
              
              if (userIsAdmin && pathname === '/login') {
                  window.location.href = '/admin'; // تحديث النطاق لبيئة SSR/ISR
              }
          } else {
              console.error('Server session login failed or unauthorized:', data.error);
              await signOut(auth);
              setUser(null);
              setIsAdmin(false);
          }
        } catch (e) {
          console.error('Error during token sync with backend:', e);
          setUser(null);
          setIsAdmin(false);
        }

      } else {
        setUser(null);
        setIsAdmin(false);
        await fetch('/api/auth/session-logout', { method: 'POST' });
        if (pathname.startsWith('/admin')) {
          window.location.href = '/login';
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname]);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      alert("فشل تسجيل الدخول باستخدام جوجل. يرجى المحاولة مرة أخرى.");
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/session-logout', { method: 'POST' });
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
      window.location.href = '/';
    } catch (error) {
      console.error("Error during sign-out:", error);
    }
  };

  const value = { user, isAdmin, loading, loginWithGoogle, logout };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
