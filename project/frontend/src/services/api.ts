import axios from 'axios';
import type {
  Product, ProductCreate, ProductUpdate,
  Customer, CustomerCreate,
  Order, OrderCreate,
  DashboardStats,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: BASE_URL });

// ── Products ──────────────────────────────────────────────────────────────────
export const productsApi = {
  list: () => api.get<Product[]>('/products').then(r => r.data),
  get: (id: number) => api.get<Product>(`/products/${id}`).then(r => r.data),
  create: (data: ProductCreate) => api.post<Product>('/products', data).then(r => r.data),
  update: (id: number, data: ProductUpdate) =>
    api.put<Product>(`/products/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

// ── Customers ─────────────────────────────────────────────────────────────────
export const customersApi = {
  list: () => api.get<Customer[]>('/customers').then(r => r.data),
  get: (id: number) => api.get<Customer>(`/customers/${id}`).then(r => r.data),
  create: (data: CustomerCreate) => api.post<Customer>('/customers', data).then(r => r.data),
  delete: (id: number) => api.delete(`/customers/${id}`),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  list: () => api.get<Order[]>('/orders').then(r => r.data),
  get: (id: number) => api.get<Order>(`/orders/${id}`).then(r => r.data),
  create: (data: OrderCreate) => api.post<Order>('/orders', data).then(r => r.data),
  delete: (id: number) => api.delete(`/orders/${id}`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => api.get<DashboardStats>('/dashboard').then(r => r.data),
};

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((d: { msg: string }) => d.msg).join(', ');
  }
  return 'An unexpected error occurred';
}
