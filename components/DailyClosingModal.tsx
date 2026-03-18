'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getOrders, getSettings } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { X, ClipboardList, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';

interface DailyClosingModalProps {
  onClose: () => void;
}

export default function DailyClosingModal({ onClose }: DailyClosingModalProps) {
  const [cashInDrawer, setCashInDrawer] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [closed, setClosed] = useState(false);
  const [closingTime] = useState(new Date());

  const { data: settings } = useSWR('settings', getSettings);
  const { data: allOrders } = useSWR('orders-today', () => getOrders());

  const currencyCode = settings?.currency_code || 'VND';
  const currencySymbol = settings?.currency_symbol || '₫';

  // Filter to today's orders only
  const today = new Date().toDateString();
  const todayOrders = (allOrders || []).filter(
    (o) => new Date(o.created_at).toDateString() === today
  );
  const completedOrders = todayOrders.filter((o) => o.status === 'completed');
  const pendingOrders = todayOrders.filter(
    (o) => !['completed', 'cancelled'].includes(o.status)
  );

  const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
  const cashRevenue = completedOrders
    .filter((o) => o.payments?.some((p) => p.payment_method === 'cash'))
    .reduce((sum, o) => sum + parseFloat(o.total), 0);
  const cardRevenue = completedOrders
    .filter((o) => o.payments?.some((p) => p.payment_method === 'card'))
    .reduce((sum, o) => sum + parseFloat(o.total), 0);
  const otherRevenue = completedOrders
    .filter((o) => o.payments?.some((p) => p.payment_method === 'other'))
    .reduce((sum, o) => sum + parseFloat(o.total), 0);

  const discrepancy =
    cashInDrawer !== '' ? Number(cashInDrawer) - cashRevenue : null;

  const handleClose = () => {
    if (pendingOrders.length > 0) {
      const proceed = confirm(
        `There are ${pendingOrders.length} pending order(s) still open.\nProceed with daily closing anyway?`
      );
      if (!proceed) return;
    }
    setClosed(true);
  };

  if (closed) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Day Closed</h2>
          <p className="text-gray-600 mb-4">
            {closingTime.toLocaleDateString()} — {closingTime.toLocaleTimeString()}
          </p>
          <div className="bg-green-50 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-bold text-green-600">{formatPrice(totalRevenue, currencyCode, currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Completed Orders</span>
              <span>{completedOrders.length}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <ClipboardList className="w-7 h-7 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Daily Closing</h2>
              <p className="text-gray-500 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Pending orders warning */}
          {pendingOrders.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-orange-800 font-semibold text-sm">
                ⚠️ {pendingOrders.length} order(s) are still open: {pendingOrders.map(o => o.order_number).join(', ')}
              </p>
            </div>
          )}

          {/* Revenue Summary */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Today's Revenue</span>
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-lg font-bold text-gray-900">Total Revenue</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatPrice(totalRevenue, currencyCode, currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">💵 Cash</span>
                <span className="font-semibold">{formatPrice(cashRevenue, currencyCode, currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">💳 Card</span>
                <span className="font-semibold">{formatPrice(cardRevenue, currencyCode, currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">📱 Other</span>
                <span className="font-semibold">{formatPrice(otherRevenue, currencyCode, currencySymbol)}</span>
              </div>
            </div>
          </div>

          {/* Order Count */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{completedOrders.length}</div>
              <div className="text-sm text-gray-600 mt-1">Completed Orders</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-gray-600">{todayOrders.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total Orders</div>
            </div>
          </div>

          {/* Cash Drawer Check */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-yellow-600" />
              <span>Cash Drawer Check</span>
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Actual Cash in Drawer ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={cashInDrawer}
                  onChange={(e) => setCashInDrawer(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
                  placeholder="Enter actual cash amount"
                />
              </div>
              {discrepancy !== null && (
                <div className={`p-3 rounded-lg text-sm font-semibold ${
                  discrepancy === 0
                    ? 'bg-green-50 text-green-700'
                    : discrepancy > 0
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {discrepancy === 0
                    ? '✓ Cash matches exactly'
                    : discrepancy > 0
                    ? `+${formatPrice(discrepancy, currencyCode, currencySymbol)} surplus`
                    : `${formatPrice(discrepancy, currencyCode, currencySymbol)} shortage`}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Closing Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
              placeholder="Any notes for today's shift..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex-shrink-0 space-y-3">
          <button
            onClick={handleClose}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-xl transition-colors touch-manipulation active:scale-[0.98] text-lg"
          >
            Close Day & Save Report
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
