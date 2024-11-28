import React from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

export default function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="relative max-w-4xl w-full bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
        <div className="p-2">
          <img
            src={imageUrl}
            alt="Product preview"
            className="w-full h-auto rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNCAxNlY0YTIgMiAwIDAgMSAyLTJoMTJhMiAyIDAgMCAxIDIgMnYxMk00IDIyaDEyYTIgMiAwIDAgMCAyLTJ2LTQiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0xMCAxMC41YTIuNSAyLjUgMCAxIDAgMC01IDIuNSAyLjUgMCAwIDAgMCA1WiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTIwIDEzLjVjMCAuOTQtLjUgMS44My0xLjM5IDIuMzJBMTMuMTEgMTMuMTEgMCAwIDEgMTIgMTlhMTMuMTEgMTMuMTEgMCAwIDEtNi42MS0zLjE4QzQuNSAxNS4zMyA0IDE0LjQ0IDQgMTMuNVY5LjUxYzAtLjg4LjQzLTEuNyAxLjE1LTIuMjFBMTIuOTUgMTIuOTUgMCAwIDEgMTIgNWMxLjYzIDAgMy4yNC4zOCA0LjY1IDEuMDhhMi45OCAyLjk4IDAgMCAxIDEuMzUgMi41djQuOTJaIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=';
            }}
          />
        </div>
      </div>
    </div>
  );
}
