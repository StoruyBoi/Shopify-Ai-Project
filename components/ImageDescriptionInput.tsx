'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { Upload } from 'lucide-react';

interface ImageDescriptionInputProps {
  onChange?: (imageDescription: string, file?: File, previewUrl?: string) => void;
}

export default function ImageDescriptionInput({ onChange }: ImageDescriptionInputProps) {
  const [imageDescription, setImageDescription] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': []
    },
    multiple: false,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDrop: (acceptedFiles) => {
      setIsDragging(false);
      
      if (acceptedFiles.length === 0) return;
      
      // Clean up any previous preview URL to avoid memory leaks
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      const file = acceptedFiles[0];
      
      // Create preview URL for the image
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(newPreviewUrl);
      setUploadedImage(file);
      
      // Create a description with just the file name for the API
      const newDescription = `Reference image: ${file.name}`;
      setImageDescription(newDescription);
      
      // Notify parent component with all three values
      if (onChange) onChange(newDescription, file, newPreviewUrl);
    }
  });

  const handleClearImage = () => {
    // Clean up object URL to prevent memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // Reset all state
    setUploadedImage(null);
    setPreviewUrl(null);
    setImageDescription('');
    
    // Notify parent component
    if (onChange) onChange('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 transition-colors">
        <h2 className="text-base font-medium text-gray-800 dark:text-gray-200 transition-colors">Reference Images</h2>
      </div>
      
      {previewUrl ? (
        <div className="p-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-colors">
            <div className="relative h-64 w-full bg-white dark:bg-gray-900 transition-colors">
              <Image 
                src={previewUrl} 
                alt={uploadedImage?.name || "Uploaded image"}
                fill
                style={{ objectFit: 'contain' }}
                sizes="100vw"
              />
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center transition-colors">
              <span title={uploadedImage?.name || ""} className="truncate">
                {uploadedImage?.name || "Uploaded image"}
              </span>
              <button
                onClick={handleClearImage}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                type="button"
              >
                Change Image
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg transition-all overflow-hidden cursor-pointer
              ${isDragActive || isDragging
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-gray-800'
              } transition-colors
            `}
          >
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className={`p-4 rounded-full ${isDragActive ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-gray-100 dark:bg-gray-700'} mb-2 transition-colors`}>
                <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 transition-colors">
                  {isDragActive ? 'Drop your image here' : 'Drag & drop your image here'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors">
                  or <span className="text-indigo-500 dark:text-indigo-400 cursor-pointer">browse files</span>
                </p>
              </div>
              <div className="flex gap-2 items-center justify-center mt-4">
                <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 transition-colors">JPEG</span>
                <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 transition-colors">PNG</span>
                <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 transition-colors">WebP</span>
              </div>
            </div>
            <input {...getInputProps()} />
          </div>
        </div>
      )}
    </div>
  );
}
