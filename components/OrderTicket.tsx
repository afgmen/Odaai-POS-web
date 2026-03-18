'use client';

import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { useCurrency } from '@/hooks/useSettings';
import { Trash2, Plus, Minus } from 'lucide-react';
import useSWR from 'swr';
import { getSettings } from '@/lib/api';

export default function OrderTicket() {
  const { cart, removeFromCart, updateCartItem, getCartTotal, selectedTable } = useCart();
  const { data: settings } = useSWR('settings', getSettings);
  const { currencyCode, currencySymbol } = useCurrency();

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateCartItem(productId, { quantity: newQuantity });
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
        <div className="text-6xl mb-4">🛒</div>
        <p className="text-lg text-center">No items in cart</p>
        <p className="text-sm text-center mt-2">Tap products to add them</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Current Order</h2>
        {selectedTable && (
          <p className="text-sm text-gray-600 mt-1">
            Table {selectedTable.table_number}
          </p>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.map((item, index) => (
          <div
            key={`${item.product.id}-${index}`}
            className="bg-gray-50 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {item.product.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {formatPrice(item.product.price, currencyCode, currencySymbol)} each
                </p>
              </div>
              <button
                onClick={() => removeFromCart(item.product.id)}
                className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation active:scale-95"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {item.modifiers && item.modifiers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.modifiers.map((mod, i) => (
                  <span
                    key={i}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                  >
                    {mod}
                  </span>
                ))}
              </div>
            )}

            {item.notes && (
              <p className="text-sm text-gray-600 italic">{item.notes}</p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() =>
                    handleQuantityChange(item.product.id, item.quantity - 1)
                  }
                  className="w-8 h-8 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center transition-colors touch-manipulation active:scale-95"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-bold text-gray-900 min-w-[24px] text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    handleQuantityChange(item.product.id, item.quantity + 1)
                  }
                  className="w-8 h-8 rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-colors touch-manipulation active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(parseFloat(item.product.price) * item.quantity, currencyCode, currencySymbol)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="border-t border-gray-200 p-6 bg-gray-50">
        {(() => {
          const subtotal = getCartTotal();
          const serviceCharge =
            settings?.service_charge_enabled
              ? subtotal * (settings.service_charge_rate / 100)
              : 0;
          const vat =
            settings?.vat_enabled
              ? (subtotal + serviceCharge) * (settings.vat_rate / 100)
              : 0;
          const total = subtotal + serviceCharge + vat;

          return (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">
                  {formatPrice(subtotal, currencyCode, currencySymbol)}
                </span>
              </div>
              
              {settings?.service_charge_enabled && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">
                    Service Charge ({settings.service_charge_rate}%)
                  </span>
                  <span className="font-semibold text-blue-600">
                    {formatPrice(serviceCharge, currencyCode, currencySymbol)}
                  </span>
                </div>
              )}
              
              {settings?.vat_enabled && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">VAT ({settings.vat_rate}%)</span>
                  <span className="font-semibold text-blue-600">
                    {formatPrice(vat, currencyCode, currencySymbol)}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatPrice(total, currencyCode, currencySymbol)}
                </span>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

