'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  disabled
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1,
    disabled
  });

  return (
    <div className="space-y-4 w-full">
      <div
        {...getRootProps()}
        className={`
          relative
          cursor-pointer
          border-2
          border-dashed
          rounded-lg
          p-6
          transition
          flex
          flex-col
          items-center
          justify-center
          gap-4
          ${isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-green-400'}
        `}
      >
        <input {...getInputProps()} />
        {value ? (
          <div className="relative w-full aspect-video">
            <Image
              src={value}
              alt="Upload"
              fill
              className="object-cover rounded-lg"
            />
          </div>
        ) : (
          <div className="text-center">
            <div className="text-gray-600">
              {isDragActive ? 'Drop the image here' : 'Drag & drop an image here, or click to select'}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Supports: PNG, JPG, JPEG, GIF
            </div>
          </div>
        )}
      </div>
      {value && (
        <div className="text-xs text-gray-500">
          Click or drag another image to replace the current one
        </div>
      )}
    </div>
  );
};
