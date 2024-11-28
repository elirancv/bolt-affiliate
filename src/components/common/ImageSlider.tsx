import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Plus, GripVertical } from 'lucide-react';

interface ImageSliderProps {
  images: string[];
  onImageClick: (index: number) => void;
  onRemoveImage: (index: number) => void;
  onAddImage: () => void;
  onReorderImages?: (images: string[]) => void;
}

export default function ImageSlider({ 
  images, 
  onImageClick, 
  onRemoveImage, 
  onAddImage,
  onReorderImages 
}: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
    if (images.length > 0) {
      onImageClick(currentIndex);
    }
  }, [currentIndex, onImageClick, images.length]);

  useEffect(() => {
    if (currentIndex >= images.length) {
      setCurrentIndex(Math.max(0, images.length - 1));
    }
  }, [images.length, currentIndex]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || !onReorderImages) return;

    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    // Update current index to follow the dragged image
    if (currentIndex === draggedIndex) {
      setCurrentIndex(dropIndex);
    } else if (currentIndex > draggedIndex && currentIndex <= dropIndex) {
      setCurrentIndex(currentIndex - 1);
    } else if (currentIndex < draggedIndex && currentIndex >= dropIndex) {
      setCurrentIndex(currentIndex + 1);
    }

    onReorderImages(newImages);
    setDraggedIndex(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
    setDraggedIndex(null);
  };

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
          <div
            key={url + index}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className="relative group"
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing bg-white/80 p-1 rounded-md shadow-sm">
              <GripVertical className="w-4 h-4 text-gray-500" />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setCurrentIndex(index);
              }}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                currentIndex === index
                  ? 'border-blue-500 shadow-sm'
                  : 'border-transparent hover:border-gray-300'
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
              {index === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-[10px] text-center py-0.5">
                  Main
                </div>
              )}
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={onAddImage}
          className="w-16 h-16 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-400 hover:text-gray-500 transition-colors"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
