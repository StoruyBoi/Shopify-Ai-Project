// components/Header.tsx
'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import CreditsDisplay from './CreditsDisplay';
import { ThemeToggle } from './ThemeToggle';
import UserSettingsMenu from './UserSettingsMenu';
import { useAuth } from '@/contexts/AuthContext';

const Header: React.FC = () => {
  const { isLoggedIn } = useAuth();

  return (
    <header
      className="
        border-b border-gray-200 dark:border-gray-800
        bg-white dark:bg-gray-900
        shadow-md dark:shadow-none
        sticky top-0 z-50 py-3 transition-colors
      "
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo and App Name */}
        <Link href="/" className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">
            <span className="hidden sm:inline">Shopify Image Wizard</span>
            <span className="sm:hidden">Image Wizard</span>
          </h1>
        </Link>

        {/* Right side controls - Mobile responsive */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Credits Display - now visible on all screen sizes */}
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
