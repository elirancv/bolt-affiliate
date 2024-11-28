import React from 'react';
import { FileText, Plus } from 'lucide-react';

export default function Pages() {
  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pages</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage custom pages for your store
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Page
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No pages created yet</h3>
        <p className="text-gray-500 mb-4">Create custom pages for your store</p>
      </div>
    </div>
  );
}