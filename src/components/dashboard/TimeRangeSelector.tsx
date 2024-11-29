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
  const timeRanges = [
    { id: '24h', name: 'Last 24 Hours' },
    { id: '7d', name: 'Last 7 Days' },
    { id: '30d', name: 'Last 30 Days' },
    { id: 'all', name: 'All Time' },
  ];

  const selectedRange = timeRanges.find(range => range.id === timeRange)?.name || 'Select Time Range';

  return (
    <div className="relative w-full sm:w-48">
      <button
        type="button"
        className="w-full bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors duration-200"
        onClick={onToggleTimeMenu}
      >
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center space-x-2 min-w-0">
            <Clock className="h-4 w-4 flex-shrink-0 text-gray-500" />
            <span className="block truncate text-gray-700 text-sm">{selectedRange}</span>
          </div>
          <ChevronDown 
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${showTimeMenu ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {showTimeMenu && (
        <>
          <div
            className="fixed inset-0 z-10 bg-black bg-opacity-5"
            onClick={() => onToggleTimeMenu()}
          />
          <div className="absolute right-0 z-20 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-gray-100">
            {timeRanges.map((range) => (
              <button
                key={range.id}
                onClick={() => {
                  onTimeRangeChange(range.id);
                  onToggleTimeMenu();
                }}
                className={`
                  w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm flex items-center space-x-2
                  ${timeRange === range.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}
                  transition-colors duration-150
                `}
              >
                <Clock className={`h-4 w-4 flex-shrink-0 ${timeRange === range.id ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className="truncate">{range.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
