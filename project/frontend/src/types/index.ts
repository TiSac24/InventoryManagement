export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  created_at: string;
}

export interface ProductCreate {
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
}

export interface ProductUpdate {
  name?: string;
  sku?: string;
  price?: number;
  stock_quantity?: number;
}

export interface Customer {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  created_at: string;
}

export interface CustomerCreate {
  full_name: string;
  email: string;
  phone?: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  product?: Product;
}

export interface Order {
  id: number;
  customer_id: number;
  total_amount: number;
  created_at: string;
  customer?: Customer;
  order_items: OrderItem[];
}

export interface OrderCreate {
  customer_id: number;
  items: { product_id: number; quantity: number }[];
}

export interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
}

export interface DashboardStats {
  total_products: number;
  total_customers: number;
  total_orders: number;
  total_revenue: number;
  low_stock_products: LowStockProduct[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
