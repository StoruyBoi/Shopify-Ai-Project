'use client';

import { useState } from 'react';

interface RequirementsInputProps {
  onChange?: (requirements: string) => void;
}

export default function RequirementsInput({ onChange }: RequirementsInputProps) {
  const [requirements, setRequirements] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRequirements(e.target.value);
    if (onChange) onChange(e.target.value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <h2 className="text-base font-medium text-gray-800 dark:text-gray-200">Requirements</h2>
      </div>
      
      <div className="p-4">
        <textarea
          id="requirements"
          rows={5}
          value={requirements}
          onChange={handleChange}
          placeholder="Example: Full-width hero section with background image, headline, subheadline, and CTA button. Text should be on the left, with animation on load. Should support mobile, tablet, and desktop layouts."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
        />
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md flex">
          <div className="text-blue-500 dark:text-blue-400 flex-shrink-0 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">For best results, be specific about your requirements</p>
            <p className="mt-1">
              Include details about layout, features, colors, responsive behavior, and any special functionality to get more accurate code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
