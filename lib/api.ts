import axios from 'axios';
import {
  Category,
  Product,
  Table,
  Order,
  Payment,
  CreateOrderRequest,
  CreatePaymentRequest,
  Settings,
} from './types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const { data } = await api.get('/categories');
  return data;
};

export const getCategory = async (id: number): Promise<Category> => {
  const { data } = await api.get(`/categories/${id}`);
  return data;
};

export const createCategory = async (category: Partial<Category>): Promise<Category> => {
  const { data } = await api.post('/categories', category);
  return data;
};

export const updateCategory = async (id: number, updates: Partial<Category>): Promise<Category> => {
  const { data } = await api.put(`/categories/${id}`, updates);
  return data;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(`/categories/${id}`);
};

// Products
export const getProducts = async (params?: {
  category_id?: number;
  search?: string;
  is_available?: boolean;
}): Promise<Product[]> => {
  const { data } = await api.get('/products', { params });
  return data;
};

export const getProduct = async (id: number): Promise<Product> => {
  const { data } = await api.get(`/products/${id}`);
  return data;
};

// Tables
export const getTables = async (): Promise<Table[]> => {
  const { data } = await api.get('/tables');
  return data;
};

export const getTable = async (id: number): Promise<Table> => {
  const { data } = await api.get(`/tables/${id}`);
  return data;
};

export const createTable = async (table: Partial<Table>): Promise<Table> => {
  const { data } = await api.post('/tables', table);
  return data;
};

export const updateTable = async (id: number, updates: Partial<Table>): Promise<Table> => {
  const { data } = await api.put(`/tables/${id}`, updates);
  return data;
};

export const deleteTable = async (id: number): Promise<void> => {
  await api.delete(`/tables/${id}`);
};

// Orders
export const getOrders = async (params?: {
  status?: string;
  table_id?: number;
}): Promise<Order[]> => {
  const { data } = await api.get('/orders', { params });
  return data;
};

export const getOrder = async (id: number): Promise<Order> => {
  const { data } = await api.get(`/orders/${id}`);
  return data;
};

export const createOrder = async (orderData: CreateOrderRequest): Promise<Order> => {
  const { data } = await api.post('/orders', orderData);
  return data;
};

export const updateOrder = async (id: number, updates: Partial<Order>): Promise<Order> => {
  const { data } = await api.put(`/orders/${id}`, updates);
  return data;
};

export const sendOrderToKitchen = async (id: number): Promise<Order> => {
  const { data } = await api.post(`/orders/${id}/send-to-kitchen`);
  return data;
};

export const completeOrder = async (id: number): Promise<Order> => {
  const { data } = await api.post(`/orders/${id}/complete`);
  return data;
};

export const deleteOrder = async (id: number): Promise<void> => {
  await api.delete(`/orders/${id}`);
};

// Payments
export const getPayments = async (params?: {
  order_id?: number;
}): Promise<Payment[]> => {
  const { data } = await api.get('/payments', { params });
  return data;
};

export const createPayment = async (paymentData: CreatePaymentRequest): Promise<Payment> => {
  const { data } = await api.post('/payments', paymentData);
  return data;
};

// Settings
export const getSettings = async (): Promise<Settings> => {
  const { data } = await api.get('/settings');
  return data;
};

export const updateSettings = async (settings: Partial<Settings>): Promise<Settings> => {
  const { data } = await api.patch('/settings', settings);
  return data.settings;
};

export default api;

