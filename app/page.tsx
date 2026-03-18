'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getCategories, getTables } from '@/lib/api';
import MenuGrid from '@/components/MenuGrid';
import OrderTicket from '@/components/OrderTicket';
import OrderControlPanel from '@/components/OrderControlPanel';
import TableManagement from '@/components/TableManagement';
import PaymentModal from '@/components/PaymentModal';
import Settings from '@/components/Settings';
import { useCart } from '@/context/CartContext';
import { Utensils, LayoutGrid, Settings as SettingsIcon } from 'lucide-react';

export default function HomePage() {
  const [showTables, setShowTables] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { selectedTable } = useCart();

  const { data: categories, error: categoriesError } = useSWR('categories', getCategories);
  const { data: tables, error: tablesError, mutate: mutateTables } = useSWR('tables', getTables);

  if (categoriesError || tablesError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Failed to load data</p>
          <p className="text-gray-600">Please check your backend connection</p>
        </div>
      </div>
    );
  }

  if (!categories || !tables) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Utensils className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Oda POS</h1>
              <p className="text-sm text-gray-600">Point of Sale System</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {selectedTable && (
              <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg font-semibold">
                Table {selectedTable.table_number}
              </div>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors touch-manipulation active:scale-95"
            >
              <SettingsIcon className="w-5 h-5" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => setShowTables(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors touch-manipulation active:scale-95"
            >
              <LayoutGrid className="w-5 h-5" />
              <span>Tables</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Menu Section */}
        <div className="flex-1 overflow-hidden">
          <MenuGrid categories={categories} />
        </div>

        {/* Order Ticket Sidebar */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          <OrderTicket />
        </div>
      </div>

      {/* Control Panel */}
      <OrderControlPanel onPayment={() => setShowPayment(true)} />

      {/* Modals */}
      {showTables && (
        <TableManagement 
          tables={tables} 
          onClose={() => setShowTables(false)}
          onRefresh={() => mutateTables()}
        />
      )}
      {showPayment && <PaymentModal onClose={() => setShowPayment(false)} />}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
