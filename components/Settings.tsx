'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Percent, DollarSign, Upload, Trash2, Image as ImageIcon, Plus, Edit2, GripVertical } from 'lucide-react';
import { Settings as SettingsType, Product, Category } from '@/lib/types';
import { getSettings, updateSettings, getProducts, getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/api';
import { useDisplay } from '@/context/DisplayContext';
import useSWR from 'swr';
import axios from 'axios';
import Image from 'next/image';

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('charges');
  const [settings, setSettings] = useState<SettingsType>({
    service_charge_enabled: false,
    service_charge_rate: 5,
    vat_enabled: true,
    vat_rate: 10,
    table_count: 12,
    seats_per_table: 4,
    currency_code: 'VND',
    currency_symbol: '₫',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Product upload states
  const { data: products, mutate: mutateProducts } = useSWR('all-products', () => getProducts());
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  
  // Product editing states
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});

  // Category management states
  const { data: categories, mutate: mutateCategories } = useSWR('categories', getCategories);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    sort_order: 0,
    is_active: true,
  });

  // Display settings from context
  const { displayMode, setDisplayMode } = useDisplay();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      alert('Settings saved successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

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
      await mutateProducts();
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
      mutateProducts();
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
      mutateProducts();
      setEditingProduct(null);
      setEditForm({});
      alert('Product updated successfully!');
    } catch (error: any) {
      console.error('Update failed:', error);
      alert('Failed to update product: ' + (error.response?.data?.message || error.message));
    }
  };

  // Category handlers
  const handleAddCategory = () => {
    setCategoryForm({
      name: '',
      slug: '',
      description: '',
      icon: '🍽️',
      sort_order: categories?.length || 0,
      is_active: true,
    });
    setEditingCategory(null);
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category: Category) => {
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '🍽️',
      sort_order: category.sort_order,
      is_active: category.is_active,
    });
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryForm);
        alert('Category updated successfully!');
      } else {
        await createCategory(categoryForm);
        alert('Category created successfully!');
      }
      mutateCategories();
      setShowCategoryForm(false);
    } catch (error: any) {
      console.error('Failed to save category:', error);
      alert('Failed to save category: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category? All products in this category will be affected.')) return;

    try {
      await deleteCategory(categoryId);
      mutateCategories();
      alert('Category deleted successfully!');
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete category');
    }
  };

  // Calculate preview
  const sampleSubtotal = 1000000; // 1,000,000₫
  const sampleServiceCharge = settings.service_charge_enabled
    ? sampleSubtotal * (settings.service_charge_rate / 100)
    : 0;
  const sampleVAT = settings.vat_enabled
    ? (sampleSubtotal + sampleServiceCharge) * (settings.vat_rate / 100)
    : 0;
  const sampleTotal = sampleSubtotal + sampleServiceCharge + sampleVAT;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('charges')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'charges'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Charges & Tax
            </button>
            <button
              onClick={() => setActiveTab('display')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'display'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Display
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === 'menu'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Menu
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'charges' && (
            <div className="grid grid-cols-2 gap-8">
              {/* Settings Panel */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Tax & Charges Configuration</h3>

                {/* Service Charge */}
                <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">Service Charge</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.service_charge_enabled}
                        onChange={(e) =>
                          setSettings({ ...settings, service_charge_enabled: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {settings.service_charge_enabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={settings.service_charge_rate}
                        onChange={(e) =>
                          setSettings({ ...settings, service_charge_rate: parseFloat(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                {/* VAT */}
                <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Percent className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">VAT</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.vat_enabled}
                        onChange={(e) =>
                          setSettings({ ...settings, vat_enabled: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {settings.vat_enabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={settings.vat_rate}
                        onChange={(e) =>
                          setSettings({ ...settings, vat_rate: parseFloat(e.target.value) })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Panel */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4 h-fit sticky top-0">
                <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
                <p className="text-sm text-gray-600">Sample order: 1,000,000₫</p>
                <div className="space-y-3 border-t border-gray-300 pt-4">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-medium">{sampleSubtotal.toLocaleString()}₫</span>
                  </div>
                  {settings.service_charge_enabled && (
                    <div className="flex justify-between text-gray-700">
                      <span>Service Charge ({settings.service_charge_rate}%)</span>
                      <span className="font-medium text-blue-600">
                        +{sampleServiceCharge.toLocaleString()}₫
                      </span>
                    </div>
                  )}
                  {settings.vat_enabled && (
                    <div className="flex justify-between text-gray-700">
                      <span>VAT ({settings.vat_rate}%)</span>
                      <span className="font-medium text-blue-600">
                        +{sampleVAT.toLocaleString()}₫
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-300 pt-3">
                    <span>Total</span>
                    <span>{sampleTotal.toLocaleString()}₫</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900">Display Settings</h3>
              
              <div className="border border-gray-200 rounded-lg p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Menu Display Mode
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Card View Option */}
                    <button
                      onClick={() => setDisplayMode('card')}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        displayMode === 'card'
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className={`w-full h-24 rounded-lg ${displayMode === 'card' ? 'bg-green-200' : 'bg-gray-200'} flex items-center justify-center`}>
                          <div className="space-y-2 text-center">
                            <div className={`w-12 h-12 mx-auto rounded ${displayMode === 'card' ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                            <div className={`h-2 w-16 mx-auto rounded ${displayMode === 'card' ? 'bg-green-300' : 'bg-gray-300'}`}></div>
                          </div>
                        </div>
                        <div className="text-center">
                          <h4 className={`font-semibold ${displayMode === 'card' ? 'text-green-600' : 'text-gray-900'}`}>
                            Card View
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            Large images with details
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* List View Option */}
                    <button
                      onClick={() => setDisplayMode('list')}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        displayMode === 'list'
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className={`w-full h-24 rounded-lg ${displayMode === 'list' ? 'bg-green-200' : 'bg-gray-200'} p-1.5 grid grid-cols-2 gap-1`}>
                          <div className="flex items-center space-x-1 bg-white rounded p-1">
                            <div className={`w-4 h-4 rounded ${displayMode === 'list' ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                            <div className={`h-1 flex-1 rounded ${displayMode === 'list' ? 'bg-green-300' : 'bg-gray-300'}`}></div>
                          </div>
                          <div className="flex items-center space-x-1 bg-white rounded p-1">
                            <div className={`w-4 h-4 rounded ${displayMode === 'list' ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                            <div className={`h-1 flex-1 rounded ${displayMode === 'list' ? 'bg-green-300' : 'bg-gray-300'}`}></div>
                          </div>
                          <div className="flex items-center space-x-1 bg-white rounded p-1">
                            <div className={`w-4 h-4 rounded ${displayMode === 'list' ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                            <div className={`h-1 flex-1 rounded ${displayMode === 'list' ? 'bg-green-300' : 'bg-gray-300'}`}></div>
                          </div>
                          <div className="flex items-center space-x-1 bg-white rounded p-1">
                            <div className={`w-4 h-4 rounded ${displayMode === 'list' ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                            <div className={`h-1 flex-1 rounded ${displayMode === 'list' ? 'bg-green-300' : 'bg-gray-300'}`}></div>
                          </div>
                        </div>
                        <div className="text-center">
                          <h4 className={`font-semibold ${displayMode === 'list' ? 'text-green-600' : 'text-gray-900'}`}>
                            List View
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            2 columns, compact layout
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-start space-x-3 text-sm text-gray-600">
                    <div className="flex-shrink-0 mt-0.5">ℹ️</div>
                    <div>
                      <p className="font-medium text-gray-700 mb-1">Display Mode Info:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li><strong>Card View:</strong> Large product images with full details - best for visual browsing</li>
                        <li><strong>List View:</strong> Compact 2-column layout with small images - shows significantly more items on screen at once for faster ordering</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900">General Configuration</h3>
              
              {/* Currency Settings */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-gray-900">Currency</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={`${settings.currency_code}|${settings.currency_symbol}`}
                      onChange={(e) => {
                        const [code, symbol] = e.target.value.split('|');
                        setSettings({ ...settings, currency_code: code, currency_symbol: symbol });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="USD|$">USD ($) - US Dollar</option>
                      <option value="VND|₫">VND (₫) - Vietnamese Dong</option>
                      <option value="EUR|€">EUR (€) - Euro</option>
                      <option value="GBP|£">GBP (£) - British Pound</option>
                      <option value="JPY|¥">JPY (¥) - Japanese Yen</option>
                      <option value="KRW|₩">KRW (₩) - Korean Won</option>
                      <option value="THB|฿">THB (฿) - Thai Baht</option>
                      <option value="SGD|S$">SGD (S$) - Singapore Dollar</option>
                      <option value="MYR|RM">MYR (RM) - Malaysian Ringgit</option>
                      <option value="PHP|₱">PHP (₱) - Philippine Peso</option>
                      <option value="IDR|Rp">IDR (Rp) - Indonesian Rupiah</option>
                      <option value="CNY|¥">CNY (¥) - Chinese Yuan</option>
                      <option value="AUD|A$">AUD (A$) - Australian Dollar</option>
                      <option value="CAD|C$">CAD (C$) - Canadian Dollar</option>
                      <option value="INR|₹">INR (₹) - Indian Rupee</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preview
                    </label>
                    <div className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-lg font-semibold text-green-600">
                      {settings.currency_symbol}1,234.56
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Settings */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-gray-900">Table Configuration</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Table Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.table_count}
                    onChange={(e) =>
                      setSettings({ ...settings, table_count: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Seats Per Table
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.seats_per_table}
                    onChange={(e) =>
                      setSettings({ ...settings, seats_per_table: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Category Management</h3>
                  <p className="text-sm text-gray-600 mt-1">Manage your menu categories</p>
                </div>
                <button
                  onClick={handleAddCategory}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </div>

              {!categories ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading categories...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map((category: Category) => (
                    <div
                      key={category.id}
                      className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                        <div className="text-3xl">{category.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{category.name}</h4>
                          <p className="text-sm text-gray-600">{category.description || 'No description'}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">Slug: {category.slug}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${category.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {category.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Category Form Modal */}
              {showCategoryForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">
                        {editingCategory ? 'Edit Category' : 'Add Category'}
                      </h3>
                      <button
                        onClick={() => setShowCategoryForm(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Icon (Emoji)
                        </label>
                        <input
                          type="text"
                          value={categoryForm.icon}
                          onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl text-center"
                          placeholder="🍽️"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={categoryForm.name}
                          onChange={(e) => {
                            const name = e.target.value;
                            setCategoryForm({
                              ...categoryForm,
                              name,
                              slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                            });
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Food"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Slug *
                        </label>
                        <input
                          type="text"
                          value={categoryForm.slug}
                          onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="food"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Delicious food items"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={categoryForm.is_active}
                            onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Active</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={() => setShowCategoryForm(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveCategory}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        {editingCategory ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Menu Management</h3>
                  <p className="text-sm text-gray-600 mt-1">Edit prices, details, and upload product images</p>
                </div>
                <p className="text-sm text-gray-500">
                  Accepted: JPG, PNG, WEBP • Max size: 2MB
                </p>
              </div>
              
              {!products ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading products...</p>
                </div>
              ) : (
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
                            <label className="block text-xs font-medium text-gray-700 mb-1">Price ({settings.currency_symbol})</label>
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
                            {settings.currency_symbol}{parseFloat(product.price).toLocaleString()}
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
                            <span>Save</span>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 flex items-center justify-center space-x-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                          >
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
                          ref={(el) => (fileInputRefs.current[product.id] = el)}
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
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

