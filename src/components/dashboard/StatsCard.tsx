import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  loading?: boolean;
  trend?: 'up' | 'down';
}

export default function StatsCard({
  title,
  value,
  icon,
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
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-hidden rounded-lg shadow-sm">
      <div className="p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gray-100">
              {icon}
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            <div className="mt-1 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
              {trend && (
                <p className={`ml-2 flex items-center text-sm font-medium ${
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  )}
                  <span className="sr-only">{trend === 'up' ? 'Increased' : 'Decreased'}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
