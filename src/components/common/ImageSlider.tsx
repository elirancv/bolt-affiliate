import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Plus } from 'lucide-react';

interface ImageSliderProps {
  images: string[];
  onImageClick: (index: number) => void;
  onRemoveImage: (index: number) => void;
  onAddImage: () => void;
}

export default function ImageSlider({ images, onImageClick, onRemoveImage, onAddImage }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIndex);
    onImageClick(nextIndex);
  };

  const goToPrevious = () => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(prevIndex);
    onImageClick(prevIndex);
  };

  useEffect(() => {
    onImageClick(currentIndex);
  }, [currentIndex, onImageClick]);

  return (
    <div className="relative bg-white rounded-xl p-4 border border-gray-200">
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
        {images.length > 0 ? (
          <>
            <img
              src={images[currentIndex]}
              alt={`Product image ${currentIndex + 1}`}
              className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setCurrentIndex(currentIndex)}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNCAxNlY0YTIgMiAwIDAgMSAyLTJoMTJhMiAyIDAgMCAxIDIgMnYxMk00IDIyaDEyYTIgMiAwIDAgMCAyLTJ2LTQiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0xMCAxMC41YTIuNSAyLjUgMCAxIDAgMC01IDIuNSAyLjUgMCAwIDAgMCA1WiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTIwIDEzLjVjMCAuOTQtLjUgMS44My0xLjM5IDIuMzJBMTMuMTEgMTMuMTEgMCAwIDEgMTIgMTlhMTMuMTEgMTMuMTEgMCAwIDEtNi42MS0zLjE4QzQuNSAxNS4zMyA0IDE0LjQ0IDQgMTMuNVY5LjUxYzAtLjg4LjQzLTEuNyAxLjE1LTIuMjFBMTIuOTUgMTIuOTUgMCAwIDEgMTIgNWMxLjYzIDAgMy4yNC4zOCA0LjY1IDEuMDhhMi45OCAyLjk4IDAgMCAxIDEuMzUgMi41djQuOTJaIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=';
              }}
            />
            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 hover:bg-white shadow-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
            {/* Remove button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemoveImage(currentIndex);
                if (currentIndex === images.length - 1) {
                  setCurrentIndex(Math.max(0, currentIndex - 1));
                }
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
            No images
          </div>
        )}
      </div>

      {/* Thumbnails and Add Image */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
        {images.map((url, index) => (
          <button
            type="button"
            key={index}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentIndex(index);
              onImageClick(index);
            }}
            className={`relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
              index === currentIndex ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
            }`}
          >
            <img
              src={url}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNCAxNlY0YTIgMiAwIDAgMSAyLTJoMTJhMiAyIDAgMCAxIDIgMnYxMk00IDIyaDEyYTIgMiAwIDAgMCAyLTJ2LTQiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0xMCAxMC41YTIuNSAyLjUgMCAxIDAgMC01IDIuNSAyLjUgMCAwIDAgMCA1WiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTIwIDEzLjVjMCAuOTQtLjUgMS44My0xLjM5IDIuMzJBMTMuMTEgMTMuMTEgMCAwIDEgMTIgMTlhMTMuMTEgMTMuMTEgMCAwIDEtNi42MS0zLjE4QzQuNSAxNS4zMyA0IDE0LjQ0IDQgMTMuNVY5LjUxYzAtLjg4LjQzLTEuNyAxLjE1LTIuMjFBMTIuOTUgMTIuOTUgMCAwIDEgMTIgNWMxLjYzIDAgMy4yNC4zOCA0LjY1IDEuMDhhMi45OCAyLjk4IDAgMCAxIDEuMzUgMi41djQuOTJaIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=';
              }}
            />
          </button>
        ))}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddImage();
          }}
          className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-md border-2 border-dashed border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <Plus className="h-5 w-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
