'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { createOrder } from '@/lib/api';
import { Send, Pause, X, CreditCard } from 'lucide-react';
import TableSelectorModal from './TableSelectorModal';
import { Table } from '@/lib/types';

interface OrderControlPanelProps {
  onPayment: () => void;
}

export default function OrderControlPanel({ onPayment }: OrderControlPanelProps) {
  const { cart, selectedTable, currentUser, clearCart, setSelectedTable } = useCart();
  const [loading, setLoading] = useState(false);
  const [showTableSelector, setShowTableSelector] = useState(false);

  const sendOrderToKitchen = async () => {
    setLoading(true);
    try {
      const orderData = {
        table_id: selectedTable?.id,
        user_id: currentUser?.id || 1, // Default to user 1 if not logged in
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          modifiers: item.modifiers.length > 0 ? item.modifiers : undefined,
          notes: item.notes || undefined,
        })),
      };

      const order = await createOrder(orderData);
      alert(`Order ${order.order_number} sent to kitchen for Table ${selectedTable?.table_number}!`);
      
      // Clear cart and selected table after successful order
      clearCart();
      setSelectedTable(null);
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;

    // Check if table is selected, if not, show table selector
    if (!selectedTable) {
      setShowTableSelector(true);
      return;
    }

    await sendOrderToKitchen();
  };

  const handleTableSelect = async (table: Table) => {
    setSelectedTable(table);
    setShowTableSelector(false);
    
    // Now send the order to kitchen
    // Wait a moment for state to update
    setTimeout(async () => {
      await sendOrderToKitchen();
    }, 100);
  };

  const handleHold = () => {
    // TODO: Implement hold order functionality
    alert('Hold order functionality coming soon!');
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this order?')) {
      clearCart();
    }
  };

  const disabled = cart.length === 0;

  return (
    <>
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="grid grid-cols-4 gap-3">
        <button
          onClick={handleSendToKitchen}
          disabled={disabled || loading}
          className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all touch-manipulation active:scale-95 ${
            disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          <Send className="w-6 h-6 mb-2" />
          <span className="font-semibold text-sm">
            {loading ? 'Sending...' : 'Send to Kitchen'}
          </span>
        </button>

        <button
          onClick={handleHold}
          disabled={disabled}
          className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all touch-manipulation active:scale-95 ${
            disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-yellow-600 text-white hover:bg-yellow-700'
          }`}
        >
          <Pause className="w-6 h-6 mb-2" />
          <span className="font-semibold text-sm">Hold Order</span>
        </button>

        <button
          onClick={handleCancel}
          disabled={disabled}
          className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all touch-manipulation active:scale-95 ${
            disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          <X className="w-6 h-6 mb-2" />
          <span className="font-semibold text-sm">Cancel</span>
        </button>

        <button
          onClick={onPayment}
          disabled={disabled}
          className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all touch-manipulation active:scale-95 ${
            disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          <CreditCard className="w-6 h-6 mb-2" />
          <span className="font-semibold text-sm">Pay</span>
        </button>
        </div>
      </div>

      {/* Table Selector Modal */}
      {showTableSelector && (
        <TableSelectorModal
          onClose={() => setShowTableSelector(false)}
          onSelectTable={handleTableSelect}
        />
      )}
    </>
  );
}

