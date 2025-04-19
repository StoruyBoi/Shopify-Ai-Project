// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import SectionTypeSelector from '@/components/SectionTypeSelector';
import RequirementsInput from '@/components/RequirementsInput';
import ImageDescriptionInput from '@/components/ImageDescriptionInput';
import CodeDisplay from '@/components/CodeDisplay';
import AuthModal from '@/components/AuthModal';
import FeedbackPopup from '@/components/FeedbackPopup'; // New import
import { Sparkles, Code } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { isLoggedIn, credits, updateCredits, refreshCredits } = useAuth();
  const [sectionType, setSectionType] = useState<string>('Hero');
  const [requirements, setRequirements] = useState<string>('');
  const [imageDescription, setImageDescription] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  // New state for feedback popup
  const [showFeedbackPopup, setShowFeedbackPopup] = useState<boolean>(false);

  // Progress bar logic
  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (90 - prev) * 0.1;
          return Math.min(newProgress, 90);
        });
      }, 300);
      return () => {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => setProgress(0), 1000);
      };
    }
  }, [isLoading]);

  // Only refresh credits when needed instead of on every page load
  useEffect(() => {
    if (isLoggedIn) {
      const currentTime = Date.now();
      // Only refresh if it's been more than 5 minutes since last refresh
      if (currentTime - lastRefreshTime > 5 * 60 * 1000) {
        console.log('Refreshing credits due to time elapsed since last refresh');
        refreshCredits()
          .then(() => setLastRefreshTime(currentTime))
          .catch(err => {
            console.error("Error refreshing credits on load:", err);
          });
      }
    }
  }, [isLoggedIn, refreshCredits, lastRefreshTime]);

  // Handle image upload
  const handleImageUpload = (desc: string, file?: File, preview?: string) => {
    setImageDescription(desc);
    if (preview) setPreviewUrl(preview);
    else {
      setPreviewUrl(null);
    }
  };

  // Generate code using the Next.js API route with improved error handling
  const handleGenerateCode = async () => {
    if (!previewUrl) {
      setError('Please upload an image to generate code');
      return;
    }
  
    // Check if user is logged in
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
  
    // Check if user has enough credits - use default value of 0 if credits.current is undefined
    const currentCredits = credits?.current ?? 0;
    if (currentCredits <= 0) {
      setError('You have no credits remaining. Please upgrade your plan or wait for your credits to reset.');
      return;
    }
  
    setIsLoading(true);
    setError(null);
  
    // Create a timeout to prevent loading state from getting stuck
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setError('Request timed out. The server took too long to respond. Please try again.');
      }
    }, 60000); // 60-second timeout
  
    try {
      console.log('Starting code generation process...');
      console.log('Request payload:', {
        sectionType,
        requirements,
        imageDescriptions: imageDescription,
      });
      
      // Use Next.js API route exclusively with improved caching control
      const response = await fetch('/api/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({
          sectionType,
          requirements,
          imageDescriptions: imageDescription,
        }),
        cache: 'no-store',
      });
  
      // Handle non-OK responses
      if (!response.ok) {
        console.error(`Error response: ${response.status} ${response.statusText}`);
        let errorMessage = `Failed to generate code (${response.status})`;
        
        // Provide more specific error messages based on status code
        if (response.status === 401) {
          errorMessage = 'Your session has expired. Please sign in again.';
        } else if (response.status === 402) {
          errorMessage = 'No credits remaining. Please upgrade your plan.';
        } else if (response.status === 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        }
        
        // Try to get more detailed error from the response
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } else {
            // For non-JSON errors, try to get text
            const errorText = await response.text();
            console.error('Non-JSON error response:', errorText);
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        
        throw new Error(errorMessage);
      }
  
      // Handle successful response
      try {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response. Please try again.');
        }
        
        const data = await response.json();
        console.log('Response data received:', data);
  
        // Set generated code if it exists
        if (data && data.code) {
          console.log('Setting generated code, length:', data.code.length);
          setGeneratedCode(data.code);
          
          // Update credits if available
          if (data.credits_remaining !== undefined && data.max_credits !== undefined) {
            console.log(`Updating credits to: ${data.credits_remaining}/${data.max_credits}`);
            updateCredits(data.credits_remaining, data.max_credits);
            // Update last refresh time since we just got fresh credit data
            setLastRefreshTime(Date.now());
          } else {
            console.warn('No credit information received from server');
          }
          
          // Show feedback popup after a short delay
          setTimeout(() => {
            setShowFeedbackPopup(true);
          }, 2000);
        } else {
          throw new Error('No code was generated. Please try again.');
        }
      } catch (e) {
        console.error('Error processing response:', e);
        throw new Error(e instanceof Error ? e.message : 'Invalid response from server. Please try again.');
      }
      
    } catch (err) {
      console.error('Error in handleGenerateCode:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      // Clear timeout to prevent it from firing
      clearTimeout(timeoutId);
      
      // Always set loading to false when done
      setIsLoading(false);
    }
  };
  
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Refresh credits after successful login
    refreshCredits()
      .then(() => setLastRefreshTime(Date.now()))
      .catch(err => console.error("Error refreshing credits after auth:", err));
    // Try generating code again after successful login
    setTimeout(handleGenerateCode, 500);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors">
      {/* Progress bar */}
      {progress > 0 && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 z-50 transition-colors">
          <div
            className="h-full bg-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
      
      {/* Feedback Popup - New Component */}
<FeedbackPopup
  isOpen={showFeedbackPopup}
  onClose={() => setShowFeedbackPopup(false)}
  generatedCode={generatedCode}
/>


      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl flex-grow">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-2 mb-3 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 transition-colors">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">AI-Powered Shopify Code Generator</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-400">
              Transform Images into Shopify Liquid Code
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto transition-colors">
            Upload an image of a website section and let our AI generate Shopify Liquid code to recreate it.
            Choose from product listings, sliders, banners and more.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 transition-colors">
                <span className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-sm">1</span>
                  Upload Your Image
                </span>
              </h2>
              <ImageDescriptionInput onChange={handleImageUpload} />
            </div>

            {previewUrl && (
              <div className="animate-fadeIn">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 transition-colors">
                  <span className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-sm">2</span>
                    Choose Section Type
                  </span>
                </h2>
                <SectionTypeSelector onSelect={setSectionType} />
              </div>
            )}

            {previewUrl && (
              <div className="animate-fadeIn">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 transition-colors">
                  <span className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-sm">3</span>
                    Section Requirements (Optional)
                  </span>
                </h2>
                <RequirementsInput onChange={setRequirements} />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded transition-colors">
                {error}
              </div>
            )}

            {previewUrl && (
              <div className="pt-4 animate-fadeIn">
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  disabled={isLoading}
                  className={`w-full py-3 px-4 font-medium rounded-lg shadow transition-colors ${
                    isLoading
                      ? 'bg-indigo-400 dark:bg-indigo-700 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Code className="h-4 w-4 animate-pulse" />
                      Generating Shopify Code...
                    </span>
                  ) : (
                    'Generate Shopify Section Code'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right: Sticky Code Output */}
          <div className="lg:sticky lg:top-8 self-start">
            <CodeDisplay
              code={generatedCode}
              isLoading={isLoading}
              error={error}
              onRetry={handleGenerateCode}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-colors">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2 transition-colors" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 transition-colors">Shopify Code Generator</span>
              <span className="mx-2 text-gray-300 dark:text-gray-700 transition-colors">|</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Powered by Claude AI</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
              &copy; {new Date().getFullYear()} • Made with ♥ for Shopify developers
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
