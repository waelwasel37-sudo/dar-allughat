'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth } from '../lib/firebase'; // Corrected relative path

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
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        const idToken = await currentUser.getIdToken(true); // إجبار توليد طازج للـ Token

        const response = await fetch('/api/auth/session-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // أساسي جداً للسماح بعبور وتخزين الـ Cookies بين النطاقات المختلفة
            body: JSON.stringify({ idToken }),
        });

        if (response.ok) {
            const ADMIN_EMAIL = 'waelwasel37@gmail.com'; 
            const userIsAdmin = currentUser.email === ADMIN_EMAIL;
            setIsAdmin(userIsAdmin);
            
            if (userIsAdmin && pathname === '/login') {
                // تأخير بسيط جداً لضمان ثبات الكوكي على الخادم قبل الانتقال
                setTimeout(() => {
                    router.push('/admin');
                }, 100);
            }
        } else {
            try {
                const errorData = await response.json();
                console.error('Failed to create server session (from JSON):', errorData.details || errorData.error);
            } catch (jsonError) {
                const errorText = await response.text();
                console.error('Failed to create server session (non-JSON response):', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText,
                });
            }
            setIsAdmin(false);
            setUser(null);
        }

      } else {
        setUser(null);
        setIsAdmin(false);
        await fetch('/api/auth/session-logout', { method: 'POST', credentials: 'include' });

        if (pathname.startsWith('/admin')) {
          router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

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
      await signOut(auth);
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
