// contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

type User = {
  id: string;
  name: string;
  email: string;
  image?: string;
  backendId?: string;
};

type Credits = {
  current: number;
  max: number;
};

type AuthContextType = {
  isLoggedIn: boolean;
  user: User | null;
  credits: Credits;
  login: (provider: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshCredits: () => Promise<void>;
  updateCredits: (current: number, max: number) => void;
  isRefreshingCredits: boolean;
};

const defaultCredits: Credits = { current: 0, max: 0 };

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  credits: defaultCredits,
  login: async () => {},
  logout: async () => {},
  refreshCredits: async () => {},
  updateCredits: () => {},
  isRefreshingCredits: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<Credits>(defaultCredits);
  const [isRefreshingCredits, setIsRefreshingCredits] = useState(false);

  // Update user when session changes
  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id || '',
        name: session.user.name || '',
        email: session.user.email || '',
        image: session.user.image,
        backendId: session.user.backendId,
      });
      
      // If session has credits info, update credits
      if (session.user.credits) {
        setCredits({
          current: session.user.credits.current,
          max: session.user.credits.max,
        });
      }
    } else {
      setUser(null);
      setCredits(defaultCredits);
    }
  }, [session]);

  const login = async (provider: string) => {
    await signIn(provider, { callbackUrl: '/' });
  };

  const logout = async () => {
    await signOut({ callbackUrl: '/' });
    setUser(null);
    setCredits(defaultCredits);
  };

  const refreshCredits = async () => {
    if (!user?.backendId) return;
    
    setIsRefreshingCredits(true);
    
    try {
      const response = await fetch('/api/get-credits', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCredits({
          current: data.credits_remaining,
          max: data.max_credits,
        });
      }
    } catch (error) {
      // Silently handle error
    } finally {
      setIsRefreshingCredits(false);
    }
  };

  const updateCredits = (current: number, max: number) => {
    setCredits({ current, max });
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!user,
        user,
        credits,
        login,
        logout,
        refreshCredits,
        updateCredits,
        isRefreshingCredits,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
