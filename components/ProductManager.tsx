'use client';

import { useState, useRef } from 'react';
import { X, Upload, Trash2, Image as ImageIcon, Edit2, Save, XCircle } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCurrency } from '@/hooks/useSettings';
import useSWR from 'swr';
import { getProducts, getCategories } from '@/lib/api';
import axios from 'axios';
import Image from 'next/image';

interface ProductManagerProps {
  onClose: () => void;
}

export default function ProductManager({ onClose }: ProductManagerProps) {
  const { data: products, mutate } = useSWR('all-products', () => getProducts());
  const { data: categories } = useSWR('categories', getCategories);
  const { currencySymbol } = useCurrency();
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});

  const handleImageUpload = async (productId: number, file: File) => {
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('Uploading file:', file.name, 'for product:', productId);
    setUploading(productId);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/products/${productId}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          console.log('Upload progress:', progress);
          setUploadProgress((prev) => ({ ...prev, [productId]: progress }));
        },
      });

      console.log('Upload response:', response.data);
      
      // Refresh products
      await mutate();
      alert('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Upload failed:', error);
      console.error('Error response:', error.response?.data);
      alert('Failed to upload image: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(null);
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[productId];
        return newProgress;
      });
    }
  };

  const handleDeleteImage = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/products/${productId}/image`);
      mutate();
      alert('Image deleted successfully!');
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete image');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product.id);
    setEditForm({
      name: product.name,
      price: product.price,
      description: product.description,
      category_id: product.category_id,
      is_available: product.is_available,
    });
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditForm({});
  };

  const handleSaveProduct = async (productId: number) => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/products/${productId}`, editForm);
      mutate();
      setEditingProduct(null);
      setEditForm({});
      alert('Product updated successfully!');
    } catch (error: any) {
      console.error('Update failed:', error);
      alert('Failed to update product: ' + (error.response?.data?.message || error.message));
    }
  };

  if (!products) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Product Manager</h2>
            <p className="text-gray-600 mt-1">Edit prices, details, and upload product images</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product: Product) => (
              <div
                key={product.id}
                className="border border-gray-200 rounded-xl p-4 space-y-4"
              >
                {/* Image Preview */}
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  {product.image_url ? (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}${product.image_url}`}
                      alt={product.name}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={(e) => {
                        console.error('Image load error for product:', product.id);
                        // Hide broken image
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <ImageIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  {uploadProgress[product.id] !== undefined && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-lg font-semibold">
                        {uploadProgress[product.id]}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                {editingProduct === product.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Price ({currencySymbol})</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.price || ''}
                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={editForm.category_id || ''}
                        onChange={(e) => setEditForm({ ...editForm, category_id: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        {categories?.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.is_available || false}
                          onChange={(e) => setEditForm({ ...editForm, is_available: e.target.checked })}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">Available</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.category?.name}</p>
                    <p className="text-sm font-semibold text-green-600 mt-1">
                      {currencySymbol}{parseFloat(product.price).toLocaleString()}
                    </p>
                    {!product.is_available && (
                      <span className="inline-block mt-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        Out of Stock
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                {editingProduct === product.id ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSaveProduct(product.id)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 flex items-center justify-center space-x-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit Product</span>
                    </button>
                    <div className="flex space-x-2">
                      <input
                        ref={(el) => { fileInputRefs.current[product.id] = el; }}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            console.log('File selected:', file.name);
                            handleImageUpload(product.id, file);
                            // Reset input
                            e.target.value = '';
                          }
                        }}
                        disabled={uploading === product.id}
                      />
                      <button
                        onClick={() => {
                          console.log('Upload button clicked for product:', product.id);
                          fileInputRefs.current[product.id]?.click();
                        }}
                        className={`flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors ${
                          uploading === product.id
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-green-700 cursor-pointer'
                        }`}
                        disabled={uploading === product.id}
                      >
                        <Upload className="w-4 h-4" />
                        <span>{product.image_url ? 'Replace' : 'Upload'}</span>
                      </button>
                      {product.image_url && (
                        <button
                          onClick={() => handleDeleteImage(product.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          disabled={uploading === product.id}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-between items-center bg-gray-50">
          <p className="text-sm text-gray-600">
            Accepted: JPG, PNG, WEBP • Max size: 2MB
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

