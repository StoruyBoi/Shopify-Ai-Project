// components/CreditsDisplay.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const CreditsDisplay: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { credits, refreshCredits, isRefreshingCredits } = useAuth();
  const progress = credits.max > 0 ? Math.max(0, Math.min(100, (credits.current / credits.max) * 100)) : 0;
  const lastRefreshTime = useRef<number>(0);
  const REFRESH_INTERVAL = 60000; // Only refresh once per minute

  // Throttled refresh function
  const throttledRefresh = () => {
    const now = Date.now();
    if (now - lastRefreshTime.current > REFRESH_INTERVAL && !isRefreshingCredits) {
      lastRefreshTime.current = now;
      refreshCredits();
    }
  };

  // Refresh credits when component mounts, but with throttling
  useEffect(() => {
    throttledRefresh();
    
    // Set up a simple interval to check credits periodically (not too frequently)
    const intervalId = setInterval(throttledRefresh, REFRESH_INTERVAL);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isRefreshingCredits, refreshCredits]);

  // Listen for credit update events with debouncing
  useEffect(() => {
    const handleCreditsUpdated = () => {
      throttledRefresh();
    };

    window.addEventListener('credits-updated', handleCreditsUpdated);
    return () => {
      window.removeEventListener('credits-updated', handleCreditsUpdated);
    };
  }, []);

  return (
    <div className="relative">
      <div 
        className="flex items-center gap-2 py-1 px-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium cursor-help transition-colors"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="text-gray-500 dark:text-gray-400"
        >
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M2 10h20" />
        </svg>
        <span className="whitespace-nowrap text-gray-700 dark:text-gray-300 transition-colors">
          {credits.current}/{credits.max} Credits
        </span>
        <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden transition-colors">
          <div 
            className="h-full bg-green-500 transition-all duration-500 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <Info className="h-3 w-3 text-gray-400 dark:text-gray-500 transition-colors" />
      </div>
      
      {showTooltip && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 w-48 transition-colors">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 transition-colors">
            Free plan: {credits.current} of {credits.max} daily credits remaining
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors">
            Credits reset every 24 hours
          </p>
        </div>
      )}
    </div>
  );
};

export default CreditsDisplay;
