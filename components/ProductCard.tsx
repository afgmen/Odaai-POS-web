'use client';

import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { useCurrency } from '@/hooks/useSettings';
import Image from 'next/image';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  viewMode?: 'card' | 'list';
}

export default function ProductCard({ product, onSelect, viewMode = 'card' }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const { currencyCode, currencySymbol } = useCurrency();
  const imageUrl = product.image_url || product.image;
  const showImage = imageUrl && !imageError;

  // List View
  if (viewMode === 'list') {
    return (
      <button
        onClick={() => onSelect(product)}
        className="bg-white rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow text-left w-full touch-manipulation active:scale-98 duration-100 flex items-center space-x-3"
        disabled={!product.is_available}
      >
        {/* Small Image */}
        {showImage ? (
          <div className="relative w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
            <Image
              src={`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}${imageUrl}`}
              alt={product.name}
              fill
              sizes="48px"
              className="object-cover"
              unoptimized
              onError={() => {
                console.error('Failed to load image for:', product.name);
                setImageError(true);
              }}
            />
          </div>
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-green-100 rounded-md flex items-center justify-center flex-shrink-0">
            <span className="text-xl">{product.category?.icon || '🍽️'}</span>
          </div>
        )}

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm truncate">
            {product.name}
          </h3>
              <span className="text-sm font-bold text-green-600">
                {formatPrice(product.price, currencyCode, currencySymbol)}
              </span>
          {!product.is_available && (
            <span className="block text-xs text-red-600 font-medium">Out of stock</span>
          )}
        </div>
      </button>
    );
  }

  // Card View (Original)
  return (
    <button
      onClick={() => onSelect(product)}
      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left w-full touch-manipulation active:scale-95 duration-100"
      disabled={!product.is_available}
    >
      <div className="flex flex-col h-full">
        {showImage ? (
          <div className="relative w-full h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden">
            <Image
              src={`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}${imageUrl}`}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover"
              unoptimized
              onError={() => {
                console.error('Failed to load image for:', product.name);
                setImageError(true);
              }}
            />
          </div>
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-green-50 to-green-100 rounded-lg mb-3 flex items-center justify-center">
            <span className="text-4xl">{product.category?.icon || '🍽️'}</span>
          </div>
        )}
        
        <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2 flex-grow">
            {product.description}
          </p>
        )}
        
          <div className="flex items-center justify-between mt-auto">
            <span className="text-xl font-bold text-green-600">
              {formatPrice(product.price, currencyCode, currencySymbol)}
            </span>
          {!product.is_available && (
            <span className="text-xs text-red-600 font-medium">Out of stock</span>
          )}
        </div>
      </div>
    </button>
  );
}

