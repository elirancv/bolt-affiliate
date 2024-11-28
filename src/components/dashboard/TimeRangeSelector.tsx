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
        className="w-full bg-white px-3 py-2 text-sm border rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={onToggleTimeMenu}
      >
        <div className="flex items-center justify-between">
          <span className="block truncate">{selectedRange}</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </button>

      {showTimeMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => onToggleTimeMenu()}
          />
          <div className="absolute right-0 z-20 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
            {timeRanges.map((range) => (
              <button
                key={range.id}
                className={`
                  w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100
                  ${timeRange === range.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
                `}
                onClick={() => {
                  onTimeRangeChange(range.id);
                  onToggleTimeMenu();
                }}
              >
                {range.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
