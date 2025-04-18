'use client';

import { useState } from 'react';

export type SectionType = 'product' | 'slider' | 'banner' | 'collection' | 'announcement' | 'header' | 'footer' | 'image-with-text' | 'multicolumn' | 'custom';

const SECTION_OPTIONS: Array<{
  value: SectionType;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'product',
    title: 'Product Section',
    description: 'Product details with images and info',
    icon: '🛍️'
  },
  {
    value: 'slider',
    title: 'Slideshow',
    description: 'Multiple images in a carousel',
    icon: '📱'
  },
  {
    value: 'banner',
    title: 'Image Banner',
    description: 'Large image with overlay text',
    icon: '🏷️'
  },
  {
    value: 'collection',
    title: 'Collection List',
    description: 'Grid of product collections',
    icon: '📦'
  },
  {
    value: 'announcement',
    title: 'Announcement Bar',
    description: 'Top of page announcements',
    icon: '📢'
  },
  {
    value: 'header',
    title: 'Header',
    description: 'Navigation menu and logo',
    icon: '⬆️'
  },
  {
    value: 'footer',
    title: 'Footer',
    description: 'Links and info at page bottom',
    icon: '⬇️'
  },
  {
    value: 'image-with-text',
    title: 'Image with Text',
    description: 'Image alongside text content',
    icon: '🖼️'
  },
  {
    value: 'multicolumn',
    title: 'Multi-column',
    description: 'Content in multiple columns',
    icon: '⚙️'
  },
  {
    value: 'custom',
    title: 'Custom Section',
    description: 'Define your own section type',
    icon: '✨'
  }
];

interface SectionTypeSelectorProps {
  onSelect?: (sectionType: string, customType?: string) => void;
}

export default function SectionTypeSelector({ onSelect }: SectionTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<SectionType>('product');
  const [customType, setCustomType] = useState<string>('');

  const handleTypeSelect = (type: SectionType) => {
    setSelectedType(type);
    
    if (type === 'custom') {
      if (onSelect) onSelect(type, customType);
    } else {
      if (onSelect) onSelect(type);
    }
  };

  const handleCustomTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomType(e.target.value);
    if (onSelect) onSelect('custom', e.target.value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">Shopify Section Type</h3>
      </div>
      
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SECTION_OPTIONS.map((option) => (
          <div
            key={option.value}
            onClick={() => handleTypeSelect(option.value)}
            className={`relative p-3.5 rounded-lg border cursor-pointer transition-all
              ${selectedType === option.value 
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
              }
            `}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-2 text-lg">{option.icon}</div>
              <div className="flex-1">
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                  {option.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{option.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Custom Section Type Input */}
      {selectedType === 'custom' && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <label htmlFor="customType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Custom Section Type
          </label>
          <input
            id="customType"
            type="text"
            placeholder="Enter custom section type"
            value={customType}
            onChange={handleCustomTypeChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
          />
        </div>
      )}
    </div>
  );
}
