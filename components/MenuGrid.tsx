'use client';

import { useState } from 'react';
import { Product, Category } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { useDisplay } from '@/context/DisplayContext';
import ProductCard from './ProductCard';
import ModifierModal from './ModifierModal';
import { Search } from 'lucide-react';

interface MenuGridProps {
  categories: Category[];
}

export default function MenuGrid({ categories }: MenuGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { addToCart } = useCart();
  const { displayMode } = useDisplay();

  const filteredProducts = categories
    .flatMap((cat) => cat.products || [])
    .filter((product) => {
      const matchesCategory =
        !selectedCategory || product.category_id === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleAddToCart = (
    product: Product,
    quantity: number,
    modifiers: string[],
    notes: string
  ) => {
    addToCart({
      product,
      quantity,
      modifiers,
      notes,
    });
    setSelectedProduct(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-lg"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white sticky top-[88px] z-10">
        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all touch-manipulation active:scale-95 ${
              selectedCategory === null
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all touch-manipulation active:scale-95 flex items-center space-x-2 ${
                selectedCategory === category.id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.icon && <span className="text-xl">{category.icon}</span>}
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-lg">No products found</p>
            <p className="text-sm mt-2">Try a different search or category</p>
          </div>
        ) : displayMode === 'list' ? (
          <div className="grid grid-cols-2 gap-2">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={handleProductSelect}
                viewMode="list"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={handleProductSelect}
                viewMode="card"
              />
            ))}
          </div>
        )}
      </div>

      {/* Modifier Modal */}
      {selectedProduct && (
        <ModifierModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={handleAddToCart}
        />
      )}
    </div>
  );
}

