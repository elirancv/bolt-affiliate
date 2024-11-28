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
    <div className="bg-white overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{value}</p>
                  {description && (
                    <p className="ml-2 flex items-baseline text-sm font-semibold text-gray-500">
                      {description}
                    </p>
                  )}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {trend && (
        <div className="bg-gray-50 px-5 py-3">
          <div className="flex items-center">
            {trend.positive ? (
              <ArrowUpRight className="h-5 w-5 text-green-500" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="h-5 w-5 text-red-500" aria-hidden="true" />
            )}
            <span
              className={`text-sm font-medium ${
                trend.positive ? 'text-green-600' : 'text-red-600'
              } truncate`}
            >
              {trend.value}
            </span>
            <span className="ml-2 text-sm text-gray-500 truncate">{trend.label}</span>
          </div>
        </div>
      )}
    </div>
  );
}
