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
  updateCredits: (current: number, max: number) => void;
}

// Default credits
const defaultCredits: Credits = { current: 5, max: 5 }; // Default to 5 credits as fallback

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
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Login function
  const login = useCallback((token: string) => {
    localStorage.setItem('token', token);
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    signOut({ callbackUrl: '/' });
  }, []);

  // Update credits function with proper event dispatching
  const updateCredits = useCallback((current: number, max: number) => {
    console.log(`Updating credits: ${current}/${max}`);
    setCredits({ current, max });
    
    // Dispatch a custom event to notify other components about credits update
    try {
      window.dispatchEvent(new CustomEvent('credits-updated'));
    } catch (error) {
      console.error('Failed to dispatch credits-updated event:', error);
    }
  }, []);

  // Refresh credits with caching, request deduplication and retry logic
  const refreshCredits = useCallback(async () => {
    // Don't fetch if not logged in
    if (!user?.backendId) {
      console.log('Skip refreshCredits: No user backendId available');
      return;
    }
    
    // Return cached data if it's recent enough
    const now = Date.now();
    if (now - lastCreditsFetchTime.current < CACHE_DURATION) {
      console.log('Using cached credits data');
      return;
    }
    
    // If there's already a pending request, return that instead of making a new one
    if (pendingRequestRef.current) {
      console.log('Using existing credits request');
      return pendingRequestRef.current;
    }
    
    console.log('Fetching fresh credits data');
    
    // Start refreshing
    setIsRefreshingCredits(true);
    
    // Create a new request and store it
    pendingRequestRef.current = (async () => {
      let retryCount = 3; // Try up to 3 times
      let delay = 500; // Start with 500ms delay
      
      while (retryCount > 0) {
        try {
          // Use relative URL instead of absolute
          const response = await fetch('/api/credits', {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
            cache: 'no-store',
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch credits: ${response.status} ${response.statusText}`);
          }
          
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Invalid response format: expected JSON');
          }
          
          const data = await response.json();
          console.log('Credits data received:', data);
          
          // Check if data contains expected fields
          if (data.credits_remaining !== undefined && data.max_credits !== undefined) {
            // Use the updateCredits function to set credits
            updateCredits(data.credits_remaining, data.max_credits);
            
            // Update cache timestamp
            lastCreditsFetchTime.current = Date.now();
            
            // Success - exit the retry loop
            break;
          } else {
            console.warn('Unexpected data format:', data);
            // Use fallback values
            updateCredits(defaultCredits.current, defaultCredits.max);
            lastCreditsFetchTime.current = Date.now();
            break;
          }
        } catch (error) {
          retryCount--;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error(`Error refreshing credits (${retryCount} retries left):`, errorMessage);
          
          if (retryCount <= 0) {
            // All retries failed, use fallback values
            console.warn('All retries failed, using default credits values');
            updateCredits(defaultCredits.current, defaultCredits.max);
            lastCreditsFetchTime.current = Date.now();
          } else {
            // Wait before retrying with exponential backoff
            await new Promise(resolve => {
              retryTimeoutRef.current = setTimeout(resolve, delay);
              delay *= 2; // Exponential backoff
            });
          }
        }
      }
      
      // Request complete
      setIsRefreshingCredits(false);
      pendingRequestRef.current = null;
    })();
    
    return pendingRequestRef.current;
  }, [user?.backendId, updateCredits]);

  // Create the context value object once to avoid unnecessary rerenders
  const contextValue = {
    isLoggedIn: !!user,
    user,
    credits,
    login,
    logout,
    refreshCredits,
    isRefreshingCredits,
    updateCredits,
  };

  return (
    <AuthContext.Provider value={contextValue}>
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
