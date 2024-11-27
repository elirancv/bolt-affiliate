import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  onClear: () => void;
  className?: string;
  error?: string;
}

export default function ImageUpload({ onFileSelect, onClear, className, error }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files?.length) {
      handleFiles(files);
    }
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer",
          "hover:border-blue-500 transition-colors",
          "flex flex-col items-center justify-center space-y-2",
          error && "border-red-300",
          className
        )}
      >
        <Upload className="h-8 w-8 text-gray-400" />
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Drag and drop an image, or click to select
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG up to 5MB
          </p>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
}