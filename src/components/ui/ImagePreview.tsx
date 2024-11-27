import React from 'react';
import { ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ImagePreviewProps {
  url: string;
  className?: string;
}

export default function ImagePreview({ url, className }: ImagePreviewProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  if (!url) {
    return (
      <div className={cn("bg-gray-100 rounded-lg flex items-center justify-center", className)}>
        <ImageIcon className="h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-lg overflow-hidden bg-gray-100", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500">
          <ImageIcon className="h-8 w-8 mb-2" />
          <span className="text-sm">Failed to load image</span>
        </div>
      ) : (
        <img
          src={url}
          alt="Product preview"
          className={cn(
            "w-full h-full object-contain transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}