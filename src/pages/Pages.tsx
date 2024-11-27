import React from 'react';
import { FileText } from 'lucide-react';

export default function Pages() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pages</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No pages created yet</h3>
        <p className="text-gray-500 mb-4">Create custom pages for your store</p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Page
        </button>
      </div>
    </div>
  );
}