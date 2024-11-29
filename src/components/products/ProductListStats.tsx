import React from 'react';

interface ProductListStatsProps {
  total: number;
  active: number;
  inactive: number;
}

export function ProductListStats({ total, active, inactive }: ProductListStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 border-t border-gray-100 py-4">
      <div className="px-4 py-3 bg-blue-50 rounded-lg">
        <div className="text-sm font-medium text-blue-600">Total Products</div>
        <div className="text-2xl font-semibold text-blue-700">{total}</div>
      </div>
      <div className="px-4 py-3 bg-green-50 rounded-lg">
        <div className="text-sm font-medium text-green-600">Active</div>
        <div className="text-2xl font-semibold text-green-700">{active}</div>
      </div>
      <div className="px-4 py-3 bg-orange-50 rounded-lg">
        <div className="text-sm font-medium text-orange-600">Inactive</div>
        <div className="text-2xl font-semibold text-orange-700">{inactive}</div>
      </div>
    </div>
  );
}
