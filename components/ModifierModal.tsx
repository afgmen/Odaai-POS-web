'use client';

import { useState } from 'react';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { useCurrency } from '@/hooks/useSettings';
import { X, Plus, Minus } from 'lucide-react';

interface ModifierModalProps {
  product: Product;
  onClose: () => void;
  onAdd: (product: Product, quantity: number, modifiers: string[], notes: string) => void;
}

export default function ModifierModal({ product, onClose, onAdd }: ModifierModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const { currencyCode, currencySymbol } = useCurrency();

  const handleModifierToggle = (modifier: string) => {
    setSelectedModifiers((prev) =>
      prev.includes(modifier)
        ? prev.filter((m) => m !== modifier)
        : [...prev, modifier]
    );
  };

  const handleAdd = () => {
    onAdd(product, quantity, selectedModifiers, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
            <p className="text-lg font-semibold text-green-600 mt-1">
              {formatPrice(product.price, currencyCode, currencySymbol)}
            </p>
            {product.description && (
              <p className="text-gray-600 mt-2">{product.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quantity */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Quantity
            </label>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors touch-manipulation active:scale-95"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-3xl font-bold text-gray-900 min-w-[60px] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-colors touch-manipulation active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modifiers */}
          {product.modifiers && product.modifiers.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Customize your order
              </label>
              <div className="grid grid-cols-2 gap-3">
                {product.modifiers.map((modifier) => (
                  <button
                    key={modifier}
                    onClick={() => handleModifierToggle(modifier)}
                    className={`p-4 rounded-xl border-2 transition-all text-left touch-manipulation active:scale-95 ${
                      selectedModifiers.includes(modifier)
                        ? 'border-green-600 bg-green-50 text-green-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium">{modifier}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Special instructions
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special requests..."
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <button
            onClick={handleAdd}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl transition-colors touch-manipulation active:scale-[0.98] text-lg"
          >
            Add to Order · {formatPrice(parseFloat(product.price) * quantity, currencyCode, currencySymbol)}
          </button>
        </div>
      </div>
    </div>
  );
}

