'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
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
        setUser(null);
        setIsAdmin(false);
        if (user) { // Check if user object exists before trying to logout
          await fetch('/api/auth/session-logout', { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uid: user.uid }),
          });
        }
        if (pathname.startsWith('/admin')) {
          window.location.href = '/login';
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, user]);

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
      if (user) {
        await fetch('/api/auth/session-logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uid: user.uid }),
        });
      }
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
