export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products?: Product[];
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  image: string | null;
  image_url: string | null;
  sku: string | null;
  modifiers: string[] | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Table {
  id: number;
  table_number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  position_x: number | null;
  position_y: number | null;
  created_at: string;
  updated_at: string;
  current_order?: Order | null;
  orders?: Order[];
}

export interface Order {
  id: number;
  order_number: string;
  table_id: number | null;
  user_id: number | null;
  status: 'pending' | 'sent_to_kitchen' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'on_hold';
  subtotal: string;
  discount: string;
  service_charge: string;
  tax: string;
  total: string;
  notes: string | null;
  sent_to_kitchen_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  table?: Table;
  user?: User;
  items?: OrderItem[];
  payments?: Payment[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  total_price: string;
  modifiers: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface Payment {
  id: number;
  order_id: number;
  payment_method: 'cash' | 'card' | 'other';
  amount: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes: string | null;
  created_at: string;
  updated_at: string;
  order?: Order;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier' | 'waiter';
  pin: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Local cart item (before order is created)
export interface CartItem {
  product: Product;
  quantity: number;
  modifiers: string[];
  notes: string;
}

export interface CreateOrderRequest {
  table_id?: number;
  user_id?: number;
  notes?: string;
  order_type?: 'dine_in' | 'takeaway' | 'delivery';
  items: {
    product_id: number;
    quantity: number;
    modifiers?: string[];
    notes?: string;
  }[];
}

export interface CreatePaymentRequest {
  order_id: number;
  payment_method: 'cash' | 'card' | 'other';
  amount: number;
  notes?: string;
}

export interface Settings {
  service_charge_enabled: boolean;
  service_charge_rate: number;
  vat_enabled: boolean;
  vat_rate: number;
  table_count: number;
  seats_per_table: number;
  currency_code: string;
  currency_symbol: string;
}

