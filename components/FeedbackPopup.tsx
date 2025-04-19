// components/FeedbackPopup.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Star, Send, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from 'next-auth/react';

interface FeedbackPopupProps {
  isOpen: boolean;
  onClose: () => void;
  generatedCode: string;
  sectionType?: string;
}

export default function FeedbackPopup({ 
  isOpen, 
  onClose, 
  generatedCode,
  sectionType = 'Not specified' 
}: FeedbackPopupProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { data: session } = useSession();
  
  // Reset the form when opened
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setComment('');
      setError(null);
      setIsSubmitted(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Get user info from auth context or session
      const userName = user?.name || session?.user?.name || 'Anonymous User';
      const userEmail = user?.email || session?.user?.email || 'No email provided';

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment,
          generatedCode: generatedCode.substring(0, 1500), // Limit code length
          timestamp: new Date().toISOString(),
          email: 'customersupport@xebrand.in', // Target email
          userName,
          userEmail,
          sectionType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to submit feedback');
      }

      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setRating(0);
        setComment('');
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit feedback';
      setError(errorMessage);
      console.error('Error submitting feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md p-4 sm:p-6 relative animate-fadeIn">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        
        {isSubmitted ? (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              Thank you for your feedback!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your feedback helps us improve our code generation.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-6 text-center text-gray-900 dark:text-white">
              How was your experience?
            </h2>
            
            <div className="flex justify-center mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(star)}
                  className="p-1.5 sm:p-2 transition-colors"
                  aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                >
                  <Star 
                    className={`h-7 w-7 sm:h-8 sm:w-8 ${
                      star <= rating 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-300 dark:text-gray-600'
                    }`} 
                  />
                </button>
              ))}
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Share your thoughts (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-white resize-none"
                placeholder="Tell us what you liked or how we can improve..."
              ></textarea>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <button
              type="button"
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium ${
                rating === 0 || isSubmitting
                  ? 'bg-indigo-400 dark:bg-indigo-700 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
              } text-white`}
            >
              {isSubmitting ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
