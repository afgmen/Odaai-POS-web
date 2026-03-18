'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { useCurrency } from '@/hooks/useSettings';
import { X, Banknote, CreditCard, Wallet, UtensilsCrossed, ShoppingBag, Truck } from 'lucide-react';
import { createOrder, createPayment, updateOrder } from '@/lib/api';

type OrderType = 'dine_in' | 'takeaway' | 'delivery';

interface PaymentModalProps {
  onClose: () => void;
}

export default function PaymentModal({ onClose }: PaymentModalProps) {
  const { cart, selectedTable, currentUser, clearCart, getCartTotal, setSelectedTable } = useCart();
  const { currencyCode, currencySymbol } = useCurrency();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
  const [orderType, setOrderType] = useState<OrderType>(selectedTable ? 'dine_in' : 'takeaway');
  const [discount, setDiscount] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);

  const subtotal = getCartTotal();
  const total = subtotal - discount + serviceCharge;
  const change = paymentMethod === 'cash' && receivedAmount !== '' ? Math.max(0, Number(receivedAmount) - total) : 0;
  const isChangeInsufficient = paymentMethod === 'cash' && receivedAmount !== '' && Number(receivedAmount) < total;

  const handlePayment = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      let orderId: number;
      let orderNumber: string;

      // If table has an existing order, use it; otherwise create new
      if (selectedTable?.current_order) {
        orderId = selectedTable.current_order.id;
        orderNumber = selectedTable.current_order.order_number;
        // Apply discount/service charge updates if needed
        if (discount > 0 || serviceCharge > 0) {
          await updateOrder(orderId, { discount: String(discount), service_charge: String(serviceCharge) });
        }
      } else {
        const orderData = {
          table_id: orderType === 'dine_in' ? selectedTable?.id : undefined,
          user_id: currentUser?.id || 1,
          order_type: orderType,
          items: cart.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            modifiers: item.modifiers.length > 0 ? item.modifiers : undefined,
            notes: item.notes || undefined,
          })),
        };

        const order = await createOrder(orderData);
        orderId = order.id;
        orderNumber = order.order_number;

        if (discount > 0 || serviceCharge > 0) {
          await updateOrder(orderId, { discount: String(discount), service_charge: String(serviceCharge) });
        }
      }

      await createPayment({
        order_id: orderId,
        payment_method: paymentMethod,
        amount: total,
        notes: paymentMethod === 'cash' && receivedAmount !== '' ? `Received: ${receivedAmount}, Change: ${change}` : undefined,
      });

      alert(`Payment successful! Order ${orderNumber} completed.`);
      clearCart();
      setSelectedTable(null);
      onClose();
    } catch (error) {
      console.error('Failed to process payment:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex items-center justify-between flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Order Type */}
          {!selectedTable?.current_order && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Order Type</label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { type: 'dine_in' as OrderType, label: 'Dine In', icon: UtensilsCrossed },
                  { type: 'takeaway' as OrderType, label: 'Takeaway', icon: ShoppingBag },
                  { type: 'delivery' as OrderType, label: 'Delivery', icon: Truck },
                ]).map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    className={`p-4 rounded-xl border-2 transition-all touch-manipulation active:scale-95 ${
                      orderType === type
                        ? 'border-green-600 bg-green-50 text-green-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2" />
                    <span className="font-semibold block text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Table info */}
          {selectedTable && (
            <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm text-blue-700 font-medium">Table {selectedTable.table_number}</span>
              {selectedTable.current_order && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Order {selectedTable.current_order.order_number}
                </span>
              )}
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotal, currencyCode, currencySymbol)}</span>
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-gray-700">Discount</label>
              <input
                type="number"
                min="0"
                max={subtotal}
                step="1000"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-gray-700">Service Charge</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-xl font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-green-600">
                {formatPrice(total, currencyCode, currencySymbol)}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Payment Method</label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { method: 'cash' as const, label: 'Cash', icon: Banknote },
                { method: 'card' as const, label: 'Card', icon: CreditCard },
                { method: 'other' as const, label: 'Other', icon: Wallet },
              ]).map(({ method, label, icon: Icon }) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`p-4 rounded-xl border-2 transition-all touch-manipulation active:scale-95 ${
                    paymentMethod === method
                      ? 'border-green-600 bg-green-50 text-green-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-8 h-8 mx-auto mb-2" />
                  <span className="font-semibold block">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cash: Received Amount + Change */}
          {paymentMethod === 'cash' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Amount Received</label>
                <input
                  type="number"
                  min={total}
                  step="1000"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder={`Min: ${formatPrice(total, currencyCode, currencySymbol)}`}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none text-lg font-semibold ${
                    isChangeInsufficient
                      ? 'border-red-400 bg-red-50 focus:border-red-500'
                      : 'border-yellow-300 bg-white focus:border-green-600'
                  }`}
                />
                {isChangeInsufficient && (
                  <p className="text-red-600 text-sm">Amount received is less than total</p>
                )}
              </div>
              {receivedAmount !== '' && !isChangeInsufficient && (
                <div className="flex justify-between items-center pt-2 border-t border-yellow-200">
                  <span className="text-gray-700 font-semibold">Change</span>
                  <span className="text-2xl font-bold text-green-700">
                    {formatPrice(change, currencyCode, currencySymbol)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 p-6 flex-shrink-0">
          <button
            onClick={handlePayment}
            disabled={loading || cart.length === 0 || (paymentMethod === 'cash' && isChangeInsufficient)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl transition-colors touch-manipulation active:scale-[0.98] text-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : `Complete Payment · ${formatPrice(total, currencyCode, currencySymbol)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
