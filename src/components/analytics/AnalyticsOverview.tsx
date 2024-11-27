import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Metric {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
}

interface AnalyticsOverviewProps {
  metrics: Metric[];
}

export default function AnalyticsOverview({ metrics }: AnalyticsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <div key={metric.title} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{metric.title}</p>
              <p className="text-2xl font-semibold mt-1">{metric.value}</p>
            </div>
            <div className={`${metric.color} p-3 rounded-lg`}>
              <metric.icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}