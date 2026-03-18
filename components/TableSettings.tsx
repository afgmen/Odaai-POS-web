'use client';

import { useState } from 'react';
import { Table as TableType } from '@/lib/types';
import { X, Plus, Edit2, Trash2, Save } from 'lucide-react';
import { createTable, updateTable, deleteTable } from '@/lib/api';

interface TableSettingsProps {
  tables: TableType[];
  onClose: () => void;
  onRefresh: () => void;
}

type Mode = 'list' | 'edit' | 'add';

export default function TableSettings({ tables, onClose, onRefresh }: TableSettingsProps) {
  const [mode, setMode] = useState<Mode>('list');
  const [editingTable, setEditingTable] = useState<TableType | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setTableNumber('');
    setCapacity(4);
    setPositionX(0);
    setPositionY(0);
    setError('');
  };

  const handleEditClick = (table: TableType) => {
    setEditingTable(table);
    setTableNumber(table.table_number);
    setCapacity(table.capacity);
    setPositionX(table.position_x || 0);
    setPositionY(table.position_y || 0);
    setError('');
    setMode('edit');
  };

  const handleAddClick = () => {
    setEditingTable(null);
    resetForm();
    setMode('add');
  };

  const handleSave = async () => {
    if (!tableNumber.trim()) {
      setError('Table number is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (mode === 'edit' && editingTable) {
        await updateTable(editingTable.id, {
          table_number: tableNumber.trim(),
          capacity,
          position_x: positionX,
          position_y: positionY,
        });
      } else {
        await createTable({
          table_number: tableNumber.trim(),
          capacity,
          position_x: positionX,
          position_y: positionY,
        });
      }
      setMode('list');
      resetForm();
      onRefresh();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.table_number?.[0];
      if (msg?.toLowerCase().includes('unique') || msg?.toLowerCase().includes('already')) {
        setError(`Table number "${tableNumber}" already exists. Please use a different name.`);
      } else {
        setError(msg || 'Failed to save table. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (table: TableType) => {
    if (table.status === 'occupied') {
      alert('Cannot delete an occupied table. Please close the order first.');
      return;
    }
    if (!confirm(`Delete Table ${table.table_number}? This cannot be undone.`)) return;

    try {
      await deleteTable(table.id);
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete table.');
    }
  };

  const handleCancel = () => {
    setMode('list');
    resetForm();
    setEditingTable(null);
  };

  const isFormMode = mode === 'edit' || mode === 'add';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Table Settings</h2>
            <p className="text-gray-600 mt-1">Manage tables and seating capacity</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Add / Edit Form */}
          {isFormMode && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {mode === 'add' ? 'Add New Table' : `Edit Table ${editingTable?.table_number}`}
              </h3>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Table Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => { setTableNumber(e.target.value); setError(''); }}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none ${
                      error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-green-600'
                    }`}
                    placeholder="e.g., 1, A1, VIP-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Seating Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Position X (Column)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={positionX}
                    onChange={(e) => setPositionX(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Position Y (Row)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={positionY}
                    onChange={(e) => setPositionY(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center space-x-2 touch-manipulation active:scale-95"
                >
                  <Save className="w-5 h-5" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-xl transition-colors touch-manipulation active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{tables.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total Tables</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {tables.filter((t) => t.status === 'available').length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Available</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {tables.reduce((sum, t) => sum + t.capacity, 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Seats</div>
            </div>
          </div>

          {/* Table List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">All Tables</h3>
              <button
                onClick={handleAddClick}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-colors touch-manipulation active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span>Add Table</span>
              </button>
            </div>

            <div className="grid gap-3">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`border-2 rounded-xl p-4 flex items-center justify-between transition-colors ${
                    mode === 'edit' && editingTable?.id === table.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      table.status === 'occupied' ? 'bg-red-100' :
                      table.status === 'reserved' ? 'bg-yellow-100' : 'bg-green-100'
                    }`}>
                      <span className={`text-lg font-bold ${
                        table.status === 'occupied' ? 'text-red-600' :
                        table.status === 'reserved' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {table.table_number}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Table {table.table_number}</div>
                      <div className="text-sm text-gray-600">
                        Capacity: {table.capacity} seats • Position: ({table.position_x ?? 0}, {table.position_y ?? 0})
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Status:{' '}
                        <span className={`font-semibold ${
                          table.status === 'available' ? 'text-green-600' :
                          table.status === 'occupied' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {table.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditClick(table)}
                      className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors touch-manipulation active:scale-95"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(table)}
                      disabled={table.status === 'occupied'}
                      className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors touch-manipulation active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      title={table.status === 'occupied' ? 'Cannot delete occupied table' : 'Delete table'}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            💡 Tables currently occupied cannot be deleted. Edit table number, capacity, or floor plan position here.
          </p>
        </div>
      </div>
    </div>
  );
}
