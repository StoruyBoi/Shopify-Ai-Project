// contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';

// Define types
interface User {
  id: string;
  backendId: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface Credits {
  current: number;
  max: number;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  credits: Credits;
  login: (token: string) => void;
  logout: () => void;
  refreshCredits: () => Promise<void>;
  isRefreshingCredits: boolean;
  // Added the missing updateCredits function to the interface
  updateCredits: (current: number, max: number) => void;
}

// Default credits
const defaultCredits: Credits = { current: 0, max: 0 };

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<Credits>(defaultCredits);
  const [isRefreshingCredits, setIsRefreshingCredits] = useState(false);
  
  // Cache request tracking
  const lastCreditsFetchTime = useRef<number>(0);
  const CACHE_DURATION = 30000; // 30 seconds cache
  const pendingRequestRef = useRef<Promise<void> | null>(null);

  // Update user from session
  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id || '',
        backendId: session.user.backendId || '',
        name: session.user.name || null,
        email: session.user.email || null,
        image: session.user.image || null,
      });
      
      if (session.user.credits) {
        setCredits({
          current: session.user.credits.current,
          max: session.user.credits.max,
        });
      }
    } else {
      setUser(null);
    }
  }, [session]);

  // Login function
  const login = useCallback((token: string) => {
    localStorage.setItem('token', token);
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    signOut({ callbackUrl: '/' });
  }, []);

  // Add the missing updateCredits function
  const updateCredits = useCallback((current: number, max: number) => {
    setCredits({ current, max });
    // Dispatch a custom event to notify other components about credits update
    window.dispatchEvent(new CustomEvent('credits-updated'));
  }, []);

  // Refresh credits with caching and request deduplication
  const refreshCredits = useCallback(async () => {
    // Don't fetch if not logged in
    if (!user?.backendId) return;
    
    // Return cached data if it's recent enough
    const now = Date.now();
    if (now - lastCreditsFetchTime.current < CACHE_DURATION) {
      return;
    }
    
    // If there's already a pending request, return that instead of making a new one
    if (pendingRequestRef.current) {
      return pendingRequestRef.current;
    }
    
    // Start refreshing
    setIsRefreshingCredits(true);
    
    // Create a new request and store it
    pendingRequestRef.current = (async () => {
      try {
        const response = await fetch('/api/get-credits', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch credits');
        }
        
        const data = await response.json();
        
        // Use the updateCredits function to set credits
        updateCredits(data.credits_remaining, data.max_credits);
        
        // Update cache timestamp
        lastCreditsFetchTime.current = Date.now();
      } catch (error) {
        console.error('Error refreshing credits:', error);
      } finally {
        setIsRefreshingCredits(false);
        pendingRequestRef.current = null;
      }
    })();
    
    return pendingRequestRef.current;
  }, [user?.backendId, updateCredits]);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!user,
        user,
        credits,
        login,
        logout,
        refreshCredits,
        isRefreshingCredits,
        // Include the updateCredits function in the provider value
        updateCredits,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
