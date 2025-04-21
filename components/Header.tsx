// components/Header.tsx
'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
// Removed the unused router import
import CreditsDisplay from './CreditsDisplay';
import { ThemeToggle } from './ThemeToggle';
import UserSettingsMenu from './UserSettingsMenu';
import { useAuth } from '@/contexts/AuthContext';

const Header: React.FC = () => {
  const { isLoggedIn } = useAuth();
  // Removed the unused router variable

  // Function to handle logo click - forces a full page reload
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default Link behavior
    window.location.href = '/'; // Force a full page reload to home
  };

  return (
    <header
      className="
        border-b border-gray-200 dark:border-gray-800
        bg-white dark:bg-gray-900
        shadow-md dark:shadow-none
        sticky top-0 z-50 py-2.5 sm:py-3 transition-colors
      "
    >
      <div className="container mx-auto px-2 sm:px-4 flex items-center justify-between">
        {/* Logo and App Name with reload behavior */}
        <Link 
          href="/" 
          className="flex items-center gap-1.5 sm:gap-2"
          onClick={handleLogoClick}
        >
          <div className="p-1.5 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          {/* Title only visible on sm screens and up */}
          <h1 className="hidden sm:block text-xl font-bold text-gray-900 dark:text-white transition-colors">
            Shopify Image Wizard
          </h1>
        </Link>

        {/* Right side controls - Mobile responsive */}
        <div className="flex items-center gap-1.5 sm:gap-4">
          {/* Credits Display - visible on all screen sizes */}
          {isLoggedIn && (
            <div className="flex items-center">
              <CreditsDisplay />
            </div>
          )}

          {/* Powered By - only on larger screens */}
          <div className="text-sm text-gray-600 dark:text-gray-400 hidden md:block transition-colors">
            Powered by Claude 3.7
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <UserSettingsMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
