import React from 'react';
import { Upload, Link as LinkIcon, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import FormField from '../../ui/FormField';
import ImagePreview from '../../ui/ImagePreview';
import ImageUpload from '../../ui/ImageUpload';

interface ImageUploadSectionProps {
  isUrlMode: boolean;
  setIsUrlMode: (mode: boolean) => void;
  imageUrls: string[];
  imageFiles: (File | null)[];
  updateImageUrl: (index: number, url: string) => void;
  handleFileSelect: (file: File, index: number) => void;
  removeImageField: (index: number) => void;
  addImageField: () => void;
  error?: string;
}

export default function ImageUploadSection({
  isUrlMode,
  setIsUrlMode,
  imageUrls,
  imageFiles,
  updateImageUrl,
  handleFileSelect,
  removeImageField,
  addImageField,
  error
}: ImageUploadSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Product Images</h3>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsUrlMode(true)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isUrlMode 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <LinkIcon className="h-4 w-4 inline-block mr-1.5" />
            Add by URL
          </button>
          <button
            type="button"
            onClick={() => setIsUrlMode(false)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              !isUrlMode 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Upload className="h-4 w-4 inline-block mr-1.5" />
            Upload
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {imageUrls.map((url, index) => (
          <div key={index} className="space-y-3 bg-gray-50 rounded-lg p-4 relative group">
            {/* Preview Area */}
            <div className="aspect-square rounded-lg overflow-hidden bg-white border border-gray-200">
              {url ? (
                <ImagePreview url={url} className="w-full h-full object-contain p-4" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-gray-300" />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="space-y-2">
              {isUrlMode ? (
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateImageUrl(index, e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter image URL"
                />
              ) : (
                <ImageUpload
                  onFileSelect={(file) => handleFileSelect(file, index)}
                  onClear={() => updateImageUrl(index, '')}
                  className="h-24"
                />
              )}
            </div>

            {/* Remove Button */}
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeImageField(index)}
                className="absolute -top-2 -right-2 p-1.5 bg-white rounded-full shadow-sm border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}

        {/* Add Image Button */}
        {imageUrls.length < 4 && (
          <button
            type="button"
            onClick={addImageField}
            className="h-full min-h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Plus className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-600">Add Image</span>
            <span className="text-xs text-gray-500 mt-1">({4 - imageUrls.length} remaining)</span>
          </button>
        )}
      </div>

      <div className="text-sm text-gray-500">
        <p>• Maximum 4 images allowed</p>
        <p>• Recommended size: 1000x1000 pixels</p>
        <p>• Supported formats: JPG, PNG (max 5MB)</p>
      </div>
    </div>
  );
}