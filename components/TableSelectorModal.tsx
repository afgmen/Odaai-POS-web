'use client';

import { X } from 'lucide-react';
import { Table } from '@/lib/types';
import useSWR from 'swr';
import { getTables } from '@/lib/api';

interface TableSelectorModalProps {
  onClose: () => void;
  onSelectTable: (table: Table) => void;
}

export default function TableSelectorModal({ onClose, onSelectTable }: TableSelectorModalProps) {
  const { data: tables, error } = useSWR('tables', getTables);

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md">
          <p className="text-red-600">Failed to load tables</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!tables) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6">
          <p className="text-gray-600">Loading tables...</p>
        </div>
      </div>
    );
  }

  const availableTables = tables.filter(table => table.status === 'available');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Select Table</h2>
            <p className="text-gray-600 mt-1">Choose a table for this order</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Table Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {availableTables.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No available tables</p>
              <p className="text-gray-500 text-sm mt-2">All tables are currently occupied</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {availableTables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => onSelectTable(table)}
                  className="aspect-square bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl flex flex-col items-center justify-center hover:from-green-100 hover:to-green-200 hover:border-green-400 transition-all touch-manipulation active:scale-95"
                >
                  <span className="text-3xl font-bold text-green-700">
                    {table.table_number}
                  </span>
                  <span className="text-xs text-green-600 mt-1">
                    {table.capacity} seats
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

