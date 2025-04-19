// components/ProfileSettingsModal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Key, Save, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { user } = useAuth();
  const { data: session, update } = useSession();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Password validation states
  const [passwordLength, setPasswordLength] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  // Update form values when user data changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
    
    // Set profile image from session
    if (session?.user?.image) {
      setProfileImage(session.user.image);
      setImageError(false);
    }
  }, [user, session]);

  // Focus trap within modal
  useEffect(() => {
    if (isOpen) {
      // Focus first input on open
      const firstInput = modalRef.current?.querySelector('input') as HTMLElement;
      if (firstInput) firstInput.focus();
      
      // Handle escape key to close modal
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Password validation
  useEffect(() => {
    // Check password length requirement
    setPasswordLength(newPassword.length === 0 || newPassword.length >= 8);
    
    // Check if passwords match
    setPasswordsMatch(newPassword === confirmPassword || (!newPassword && !confirmPassword));
  }, [newPassword, confirmPassword]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate before submission
    if (!passwordLength || !passwordsMatch) {
      setError('Please fix the password errors before submitting');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Only validate passwords if user is trying to change password
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match');
        }
        
        if (newPassword.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
      }

      // Check if user is from Google - simply check if session exists
      // Removing the unused variable and just using the check directly where needed
      
      // Simulate successful update (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Profile updated successfully');
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Simulate session update
      if (session) {
        await update({
          ...session,
          user: {
            ...session.user,
            name: name
          }
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      aria-modal="true"
      role="dialog"
      aria-labelledby="profile-settings-title"
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md p-4 sm:p-6 relative animate-fadeIn"
      >
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h2 
          id="profile-settings-title"
          className="text-xl font-bold mb-6 text-center text-gray-900 dark:text-white"
        >
          Profile Settings
        </h2>
        
        {error && (
          <div 
            className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded text-sm"
            role="alert"
          >
            {error}
          </div>
        )}
        
        {success && (
          <div 
            className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-400 rounded text-sm"
            role="alert"
          >
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ring-4 ring-indigo-100 dark:ring-indigo-900">
                {profileImage && !imageError ? (
                  <div className="relative h-full w-full">
                    <Image 
                      src={profileImage} 
                      alt={name || "User profile"} 
                      fill
                      className="object-cover"
                      sizes="96px"
                      onError={() => setImageError(true)}
                      priority
                    />
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0">
                <div className="bg-indigo-600 dark:bg-indigo-500 text-white p-1.5 rounded-full cursor-not-allowed shadow-md">
                  <ImageIcon className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <User className="h-4 w-4 inline mr-2" />
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white transition-colors"
              required
              aria-required="true"
              autoComplete="name"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Mail className="h-4 w-4 inline mr-2" />
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white transition-colors ${
                session?.user ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
              }`}
              required
              aria-required="true"
              // Fixed: Explicitly cast boolean value for disabled attribute
              disabled={session?.user ? true : false}
              autoComplete="email"
            />
            {session?.user && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Email cannot be changed for Google accounts
              </p>
            )}
          </div>
          
          {!session?.user && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h3 className="text-md font-medium mb-3 text-gray-800 dark:text-gray-200">
                Change Password (Optional)
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Key className="h-4 w-4 inline mr-2" />
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white transition-colors"
                    autoComplete="current-password"
                  />
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Key className="h-4 w-4 inline mr-2" />
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full px-3 py-2 border ${
                      !passwordLength && newPassword ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'
                    } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white transition-colors`}
                    autoComplete="new-password"
                  />
                  {!passwordLength && newPassword && (
                    <p className="mt-1 text-xs text-red-500">
                      Password must be at least 8 characters
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Key className="h-4 w-4 inline mr-2" />
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-3 py-2 border ${
                      !passwordsMatch && confirmPassword ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'
                    } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white transition-colors`}
                    autoComplete="new-password"
                  />
                  {!passwordsMatch && confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">
                      Passwords do not match
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <button
            type="submit"
            // Fixed: Correct the boolean logic for button disabled state
            disabled={isLoading || (newPassword.length > 0 && !passwordLength) || (!passwordsMatch && (newPassword.length > 0 || confirmPassword.length > 0))}
            className={`w-full py-3 px-4 rounded-md font-medium flex items-center justify-center gap-2 ${
              isLoading || (newPassword.length > 0 && !passwordLength) || (!passwordsMatch && (newPassword.length > 0 || confirmPassword.length > 0))
                ? 'bg-indigo-400 dark:bg-indigo-700 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
            } text-white transition-colors`}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
