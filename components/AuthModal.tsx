// components/AuthModal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  // Fix: Remove unused auth variable that's causing the ESLint error
  // const auth = useAuth();
  
  // Instead, if we need useAuth() for side effects only, call it without assignment:
  useAuth();
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap and escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    // Focus the modal when it opens
    modalRef.current?.focus();
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      console.log('Initiating Google sign-in...');
      const result = await signIn('google', { 
        callbackUrl: window.location.href,
        redirect: false 
      });
      
      console.log('Google sign-in result:', result);
      
      if (result?.error) {
        throw new Error(result.error);
      }
      
      if (result?.ok) {
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      console.error('Google authentication error:', err);
      // Handle the error with proper type checking
      if (err instanceof Error) {
        setError(err.message || 'Google authentication failed');
      } else {
        setError('Google authentication failed');
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
      aria-labelledby="auth-modal-title"
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-5 sm:p-6 relative animate-fadeIn"
      >
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="text-center mb-6">
          <div className="mx-auto bg-blue-50 dark:bg-blue-900/20 w-16 h-16 flex items-center justify-center rounded-full mb-4">
            <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
          
          <h2 
            id="auth-modal-title"
            className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-white"
          >
            Welcome to Image Wizard
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Sign in with your Google account to generate code and track your credits.
          </p>
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
          aria-busy={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          <span>{isLoading ? 'Signing in...' : 'Continue with Google'}</span>
        </button>
        
        <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
          <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            By continuing, you agree to our{' '}
            <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
