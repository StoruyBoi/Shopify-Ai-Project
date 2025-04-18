// components/UserSettingsMenu.tsx
'use client';

import React, { useState } from 'react';
import { User, Crown, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { signOut, useSession } from 'next-auth/react';
import AuthModal from './AuthModal';
import ProfileSettingsModal from './ProfileSettingsModal';
import UpgradePlanModal from './UpgradePlanModal';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

const UserSettingsMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isLoggedIn, user, logout } = useAuth();
  const { data: session } = useSession();
  
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    setIsOpen(false);
  };
  
  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };
  
  const handleAuthSuccess = () => {
    setIsOpen(false);
  };
  
  // Get profile image from session directly
  const profileImage = session?.user?.image;
  const userName = session?.user?.name || user?.name || 'User';
  const userEmail = session?.user?.email || user?.email;
  
  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
    e.currentTarget.parentElement?.classList.add('fallback-icon');
  };
  
  return (
    <div className="relative">
      <button 
        className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
      >
        {profileImage ? (
          <div className="h-8 w-8 relative">
            <img 
              src={profileImage} 
              alt={userName}
              className="h-full w-full object-cover"
              onError={handleImageError}
            />
          </div>
        ) : (
          <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isLoggedIn ? "User Account" : "Not logged in"}
            </p>
            {isLoggedIn && userEmail && (
              <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">
                {userEmail}
              </p>
            )}
          </div>
          <div className="py-1">
            {isLoggedIn ? (
              <>
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
                  onClick={() => {
                    setShowProfileModal(true);
                    setIsOpen(false);
                  }}
                >
                  <User className="h-4 w-4" />
                  <span>Profile Settings</span>
                </button>
                <button 
                  className="w-full text-left px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
                  onClick={() => {
                    setShowUpgradeModal(true);
                    setIsOpen(false);
                  }}
                >
                  <Crown className="h-4 w-4" />
                  <span>Upgrade plan</span>
                </button>
              </>
            ) : (
              <button 
                className="w-full text-left px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
                onClick={() => {
                  setShowAuthModal(true);
                  setIsOpen(false);
                }}
              >
                <User className="h-4 w-4" />
                <span>Sign in / Register</span>
              </button>
            )}
            <button 
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
              onClick={toggleTheme}
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
            </button>
          </div>
          {isLoggedIn && (
            <div className="border-t border-gray-200 dark:border-gray-700 py-1">
              <button 
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
                onClick={handleLogout}
              >   
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
      
      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
      
      {/* Upgrade Plan Modal */}
      <UpgradePlanModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
};

export default UserSettingsMenu;
