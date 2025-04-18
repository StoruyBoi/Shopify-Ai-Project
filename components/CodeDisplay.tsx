// components/CodeDisplay.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Sparkles, Copy, Check, Download, Terminal, AlertTriangle, RefreshCw } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface CodeDisplayProps {
  code?: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function CodeDisplay({ code, isLoading = false, error = null, onRetry }: CodeDisplayProps) {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [displayedCode, setDisplayedCode] = useState<string>('');
  const [currentLine, setCurrentLine] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [localLoading, setLocalLoading] = useState(isLoading);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLoadingRef = useRef(isLoading);
  const prevCodeRef = useRef(code);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle state changes and transitions
  useEffect(() => {
    // Handle error state
    if (error) {
      setDisplayedCode('');
      setShowSkeleton(false);
      setIsTyping(false);
      setLocalLoading(false);
      return;
    }
    
    // Handle loading state changes
    if (!prevLoadingRef.current && isLoading) {
      // Just started loading - show skeleton
      setShowSkeleton(true);
      setIsTyping(false);
      setDisplayedCode('');
      setCurrentLine(0);
      setLocalLoading(true);
    } 
    else if (prevLoadingRef.current && !isLoading && code && code !== prevCodeRef.current) {
      // Just finished loading with new code - start typing animation
      setShowSkeleton(false);
      setIsTyping(true);
      setLocalLoading(false);
      startCodeTypingAnimation(code);
    }
    else if (prevLoadingRef.current && !isLoading) {
      // Loading finished but no new code (or same code)
      setShowSkeleton(false);
      setLocalLoading(false);
      
      // If we have code but weren't typing, show it immediately
      if (code && !isTyping) {
        setDisplayedCode(code);
      }
    }
    
    // Update refs for next render
    prevLoadingRef.current = isLoading;
    prevCodeRef.current = code;
    
    // Cleanup on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [code, isLoading, error, isTyping]);

  // Function to start code typing animation
  const startCodeTypingAnimation = (codeContent: string) => {
    setDisplayedCode('');
    
    const codeLines = codeContent.split('\n');
    let lineIndex = 0;
    
    const timePerLine = 80; // 80ms per line for faster typing effect
    const maxInitialLines = Math.min(codeLines.length, 100);
    
    const typingInterval = setInterval(() => {
      if (lineIndex < maxInitialLines) {
        setDisplayedCode(prev => prev + codeLines[lineIndex] + "\n");
        setCurrentLine(lineIndex + 1);
        lineIndex++;
        
        // Auto scroll to bottom
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      } else {
        clearInterval(typingInterval);
        
        // Show full code after animation
        typingTimeoutRef.current = setTimeout(() => {
          setDisplayedCode(codeContent);
          setIsTyping(false);
        }, 500);
      }
    }, timePerLine);
    
    return () => {
      clearInterval(typingInterval);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  };

  // Handle clipboard copy
  const copyToClipboard = () => {
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };
  
  // Handle download
  const downloadCode = () => {
    if (code) {
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'shopify-section.liquid';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Render header component
  const renderHeader = () => (
    <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2">
        {error ? (
          <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
        ) : (
          <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        )}
        <h3 className="font-medium text-sm text-gray-800 dark:text-gray-200 transition-colors">
          {error ? "Error Generating Code" : "Generated Output"}
        </h3>
        {(isTyping || showSkeleton || localLoading) && !error && (
          <div className="flex items-center gap-1.5 ml-2 text-xs text-indigo-600 dark:text-indigo-400 font-mono transition-colors">
            <Terminal className="h-3 w-3 animate-pulse" />
            <span className="animate-pulse">
              {showSkeleton || localLoading ? "Analyzing..." : "Generating..."}
            </span>
          </div>
        )}
      </div>
      
      {code && !localLoading && !showSkeleton && !error && !isTyping && (
        <div className="flex items-center gap-2">
          <button 
            onClick={downloadCode}
            className="inline-flex items-center px-2 py-1 text-xs rounded text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            <span>Download</span>
          </button>
          
          <button 
            onClick={copyToClipboard}
            className="inline-flex items-center px-2 py-1 text-xs rounded text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className="p-8 flex flex-col items-center justify-center text-center">
      <div className="inline-flex items-center justify-center p-3 rounded-full bg-red-100 dark:bg-red-900/20 mb-4 animate-pulse transition-colors">
        <AlertTriangle className="h-6 w-6 text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-medium mb-2 text-red-700 dark:text-red-400 transition-colors">Unable to Generate Code</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mx-auto max-w-xs mb-6 transition-colors">
        {error || "There was an error connecting to the AI service. This might be due to high demand or a temporary outage."}
      </p>
      
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg p-4 mb-6 max-w-md transition-colors">
        <div className="flex items-start">
          <div className="text-amber-500 dark:text-amber-400 mr-3 flex-shrink-0 mt-0.5 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-xs text-amber-800 dark:text-amber-300 transition-colors">
            <p className="font-medium mb-1">Note</p>
            <p className="leading-relaxed">
              The AI service might be experiencing high traffic. You can try again in a few moments or refine your image and requirements for better results.
            </p>
          </div>
        </div>
      </div>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="p-8 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 rounded-full border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent animate-spin transition-colors"></div>
      <p className="text-gray-800 dark:text-gray-200 font-medium transition-colors">Analyzing your design...</p>
      <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">This might take a few seconds</p>
      
      <div className="w-full max-w-md mt-4 space-y-2">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse transition-colors"></div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6 transition-colors"></div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse transition-colors"></div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6 transition-colors"></div>
      </div>
      
      <div className="flex items-center mt-4 text-gray-600 dark:text-gray-400 transition-colors">
        <div className="text-indigo-600 dark:text-indigo-400 mr-2 transition-colors">❯</div>
        <span className="text-sm font-mono">Preparing code generation...</span>
      </div>
      
      <div className="w-full max-w-md space-y-2">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse transition-colors"></div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4 transition-colors"></div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse transition-colors"></div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2 transition-colors"></div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/5 transition-colors"></div>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 max-w-md mt-4 transition-colors">
        <div className="flex items-start">
          <div className="text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0 mt-0.5 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-xs text-blue-800 dark:text-blue-300 transition-colors">
            <p className="font-medium mb-1">Note</p>
            <p className="leading-relaxed">
              The AI is analyzing your image and requirements to generate Shopify section code. 
              This typically takes 15-30 seconds depending on complexity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render code display
  const renderCodeDisplay = () => (
    <div className="relative">
      <div 
        ref={containerRef} 
        className="overflow-auto"
        style={{ maxHeight: "600px" }}
      >
        <SyntaxHighlighter
          language="liquid"
          style={theme === 'dark' ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            padding: '16px',
            borderRadius: 0,
            minHeight: '400px',
            fontSize: '14px',
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            transition: 'background-color 0.2s ease'
          }}
          showLineNumbers={true}
          wrapLines={true}
          lineProps={lineNumber => {
            const style = { display: 'block', width: '100%', transition: 'background-color 0.2s ease' };
            if (isTyping && lineNumber === currentLine) {
              return { 
                style: { 
                  ...style, 
                  backgroundColor: theme === 'dark' 
                    ? 'rgba(79, 70, 229, 0.2)' 
                    : 'rgba(79, 70, 229, 0.1)' 
                } 
              };
            }
            return { style };
          }}
        >
          {displayedCode}
        </SyntaxHighlighter>
      </div>
      
      {isTyping && (
        <div className="absolute bottom-4 right-4 bg-indigo-600 dark:bg-indigo-500 text-white text-xs py-1 px-2 rounded transition-colors">
          Line {currentLine}
        </div>
      )}
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-300 transition-colors">
        <div className="flex items-start">
          <div className="text-blue-500 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <span className="font-medium">Note:</span> This code is ready to be copied and pasted into your Shopify theme editor. You may need to customize product handles, collection IDs, or other specific elements for your store.
          </div>
        </div>
      </div>
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="py-12 px-4 text-center">
      <div className="inline-flex items-center justify-center p-3 rounded-full bg-gray-100 dark:bg-gray-800 mb-4 transition-colors">
        <Sparkles className="h-6 w-6 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200 transition-colors">Let s Create Some Code</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm mx-auto max-w-xs mb-6 transition-colors">
        Upload an image and I ll generate Shopify Liquid code for you. Just tell me what kind of section you need!
      </p>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto transition-colors">
        <div className="flex items-start">
          <div className="text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0 mt-0.5 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-xs text-blue-800 dark:text-blue-300 text-left transition-colors">
            <p className="font-medium mb-1">Pro Tip</p>
            <p className="leading-relaxed">
              For best results, upload a clear image of your desired section and provide specific details about layout, colors, and functionality you need.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render footer
  const renderFooter = () => (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 transition-colors">
      <h4 className="text-sm font-medium mb-1 text-gray-800 dark:text-gray-200 transition-colors">How It Works</h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
        This app uses Claude 3.7 AI to transform images into Shopify Liquid code. To get the best results, upload a clear image and provide detailed requirements.
      </p>
    </div>
  );

  // Determine which content to show
  const renderContent = () => {
    if (error) return renderError();
    if (showSkeleton || localLoading) return renderSkeleton();
    if (displayedCode) return renderCodeDisplay();
    return renderEmptyState();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
      {renderHeader()}
      {renderContent()}
      {renderFooter()}
    </div>
  );
}
