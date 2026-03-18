'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getTables } from '@/lib/api';
import { Table as TableType } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { X, Users, Settings, ClipboardList } from 'lucide-react';
import TableSettings from './TableSettings';
import DailyClosingModal from './DailyClosingModal';

interface TableManagementProps {
  tables: TableType[];
  onClose: () => void;
  onRefresh?: () => void;
}

export default function TableManagement({ tables: initialTables, onClose, onRefresh }: TableManagementProps) {
  const { setSelectedTable } = useCart();
  const [showSettings, setShowSettings] = useState(false);
  const [showDailyClosing, setShowDailyClosing] = useState(false);

  // Poll tables every 5 seconds for real-time status
  const { data: tables = initialTables, mutate } = useSWR('tables-live', getTables, {
    refreshInterval: 5000,
    fallbackData: initialTables,
  });

  const handleRefresh = () => {
    mutate();
    if (onRefresh) onRefresh();
  };

  const handleTableSelect = (table: TableType) => {
    setSelectedTable(table);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Table Management</h2>
              <p className="text-gray-600 mt-1">Select a table to start an order</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowDailyClosing(true)}
                className="flex items-center space-x-2 bg-purple-100 hover:bg-purple-200 text-purple-900 px-4 py-2 rounded-lg font-semibold transition-colors touch-manipulation active:scale-95"
              >
                <ClipboardList className="w-5 h-5" />
                <span>Daily Closing</span>
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg font-semibold transition-colors touch-manipulation active:scale-95"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-300"></div>
                <span className="text-sm text-gray-700">Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300"></div>
                <span className="text-sm text-gray-700">Occupied</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-300"></div>
                <span className="text-sm text-gray-700">Reserved</span>
              </div>
              <div className="ml-auto text-xs text-gray-400">Auto-refreshes every 5s</div>
            </div>

            {/* Table Grid */}
            <div className="grid grid-cols-4 gap-4">
              {tables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => handleTableSelect(table)}
                  className={`p-6 rounded-xl border-2 transition-all touch-manipulation active:scale-95 ${getStatusColor(
                    table.status
                  )} hover:shadow-lg`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-2xl font-bold">Table {table.table_number}</span>
                    <div className="flex items-center space-x-1 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{table.capacity}</span>
                    </div>
                    <span className="text-xs font-medium uppercase">{table.status}</span>
                    {table.current_order && (
                      <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                        Order {table.current_order.order_number}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
        <TableSettings
          tables={tables}
          onClose={() => setShowSettings(false)}
          onRefresh={handleRefresh}
        />
      )}

      {showDailyClosing && (
        <DailyClosingModal onClose={() => setShowDailyClosing(false)} />
      )}
    </>
  );
}
