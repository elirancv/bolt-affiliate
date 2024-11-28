import React from 'react';
import { Clock, ChevronDown } from 'lucide-react';

interface TimeRangeSelectorProps {
  timeRange: string;
  showTimeMenu: boolean;
  onTimeRangeChange: (range: string) => void;
  onToggleTimeMenu: () => void;
}

export default function TimeRangeSelector({ 
  timeRange, 
  showTimeMenu, 
  onTimeRangeChange, 
  onToggleTimeMenu 
}: TimeRangeSelectorProps) {
  const timeRanges = {
    '24h': 'Last 24 hours',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    'all': 'All time'
  };

  return (
    <div className="relative">
      <button
        onClick={onToggleTimeMenu}
        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <Clock className="h-4 w-4" />
        <span>{timeRanges[timeRange as keyof typeof timeRanges]}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {showTimeMenu && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {Object.entries(timeRanges).map(([value, label]) => (
              <button
                key={value}
                onClick={() => {
                  onTimeRangeChange(value);
                  onToggleTimeMenu();
                }}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  timeRange === value
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                role="menuitem"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
