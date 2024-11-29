import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  loading?: boolean;
  trend?: {
    value: string;
    label: string;
    positive: boolean;
  };
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  loading = false,
  trend
}: StatsCardProps) {
  if (loading) {
    return (
      <div className="bg-white overflow-hidden rounded-lg shadow-sm">
        <div className="p-5">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 h-[110px] sm:h-[120px] flex flex-col justify-between">
      <div className="p-3 sm:p-4 flex-1">
        <div className="h-full flex flex-col">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
            <div className={`flex-shrink-0 rounded-lg w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center ${
              trend?.positive ? 'bg-green-100' : 
              trend ? 'bg-red-100' : 
              'bg-gray-100'
            }`}>
              <Icon 
                className={`h-4 w-4 sm:h-5 sm:w-5 ${
                  trend?.positive ? 'text-green-600' : 
                  trend ? 'text-red-600' : 
                  'text-gray-600'
                }`} 
                aria-hidden="true" 
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</h3>
              <div className="flex items-baseline gap-x-2 mt-0.5 sm:mt-1">
                <p className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
                {description && (
                  <span className="text-xs sm:text-sm text-gray-500 truncate">
                    {description}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {trend && (
        <div className="bg-gray-50 px-3 py-1.5 sm:py-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 min-w-0">
              {trend.positive ? (
                <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-green-500" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-red-500" aria-hidden="true" />
              )}
              <span
                className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
                  trend.positive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.value}
              </span>
            </div>
            <span className="text-xs sm:text-sm text-gray-500 truncate max-w-[60%] text-right">{trend.label}</span>
          </div>
        </div>
      )}
    </div>
  );
}
