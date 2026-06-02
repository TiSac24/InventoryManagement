import { useEffect, useState } from 'react';
import { Plus, Trash2, Eye, ShoppingCart, X } from 'lucide-react';
import { ordersApi, productsApi, customersApi, getErrorMessage } from '../services/api';
import type { Order, OrderCreate, Product, Customer } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastProvider';

interface LineItem {
  product_id: number;
  quantity: number;
}

function OrderForm({
  products,
  customers,
  onSubmit,
  loading,
}: {
  products: Product[];
  customers: Customer[];
  onSubmit: (data: OrderCreate) => void;
  loading: boolean;
}) {
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ product_id: 0, quantity: 1 }]);

  const addLine = () => setItems(prev => [...prev, { product_id: 0, quantity: 1 }]);
  const removeLine = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateLine = (i: number, patch: Partial<LineItem>) =>
    setItems(prev => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const total = items.reduce((sum, l) => {
    const p = products.find(p => p.id === l.product_id);
    return sum + (p ? parseFloat(String(p.price)) * l.quantity : 0);
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      customer_id: parseInt(customerId, 10),
      items: items.filter(l => l.product_id > 0),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
        <select
          required
          value={customerId}
          onChange={e => setCustomerId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a customer…</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.full_name} — {c.email}</option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Order Items</label>
          <button type="button" onClick={addLine} className="text-xs text-blue-600 hover:underline font-medium">
            + Add item
          </button>
        </div>
        <div className="space-y-2">
          {items.map((line, i) => {
            const product = products.find(p => p.id === line.product_id);
            return (
              <div key={i} className="flex gap-2 items-start">
                <select
                  required
                  value={line.product_id || ''}
                  onChange={e => updateLine(i, { product_id: parseInt(e.target.value, 10) })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select product…</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} disabled={p.stock_quantity === 0}>
                      {p.name} (stock: {p.stock_quantity})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  required
                  min={1}
                  max={product?.stock_quantity ?? 9999}
                  value={line.quantity}
                  onChange={e => updateLine(i, { quantity: parseInt(e.target.value, 10) || 1 })}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {total > 0 && (
        <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-600">Estimated total</span>
          <span className="font-semibold text-gray-800">${total.toFixed(2)}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Creating…' : 'Create Order'}
      </button>
    </form>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <Modal title={`Order #${order.id}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Customer</p>
            <p className="font-medium text-gray-800">{order.customer?.full_name ?? '—'}</p>
            <p className="text-gray-500 text-xs">{order.customer?.email}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">Date</p>
            <p className="font-medium text-gray-800">{new Date(order.created_at).toLocaleDateString()}</p>
            <p className="text-gray-500 text-xs">{new Date(order.created_at).toLocaleTimeString()}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Items</p>
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            {order.order_items.map(item => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 bg-white text-sm">
                <div>
                  <p className="font-medium text-gray-800">{item.product?.name ?? `Product #${item.product_id}`}</p>
                  <p className="text-gray-500 text-xs">x{item.quantity} @ ${parseFloat(String(item.unit_price)).toFixed(2)}</p>
                </div>
                <p className="font-semibold text-gray-700">
                  ${(item.quantity * parseFloat(String(item.unit_price))).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="font-semibold text-gray-800">Total</span>
          <span className="text-lg font-bold text-blue-600">
            ${parseFloat(String(order.total_amount)).toFixed(2)}
          </span>
        </div>
      </div>
    </Modal>
  );
}

export default function Orders() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([ordersApi.list(), productsApi.list(), customersApi.list()])
      .then(([o, p, c]) => {
        setOrders(o);
        setProducts(p);
        setCustomers(c);
      })
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (data: OrderCreate) => {
    setSubmitting(true);
    try {
      const order = await ordersApi.create(data);
      // Refetch to get fresh stock quantities too
      const [fresh, freshProducts] = await Promise.all([
        ordersApi.list(),
        productsApi.list(),
      ]);
      setOrders(fresh);
      setProducts(freshProducts);
      setShowCreate(false);
      showToast('success', `Order #${order.id} created`);
    } catch (e) {
      showToast('error', getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Cancel this order? Stock will be restored.')) return;
    setDeletingId(id);
    try {
      await ordersApi.delete(id);
      const [freshOrders, freshProducts] = await Promise.all([
        ordersApi.list(),
        productsApi.list(),
      ]);
      setOrders(freshOrders);
      setProducts(freshProducts);
      showToast('success', 'Order cancelled and stock restored');
    } catch (e) {
      showToast('error', getErrorMessage(e));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> New Order
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <ShoppingCart size={36} className="text-gray-300" />
            <p className="text-gray-500">No orders yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3">Order #</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Items</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-medium text-gray-700">
                      #{String(o.id).padStart(4, '0')}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {o.customer?.full_name ?? `Customer #${o.customer_id}`}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {o.order_items.length} item{o.order_items.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      ${parseFloat(String(o.total_amount)).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewOrder(o)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(o.id)}
                          disabled={deletingId === o.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <Modal title="Create Order" onClose={() => setShowCreate(false)}>
          <OrderForm
            products={products}
            customers={customers}
            onSubmit={handleCreate}
            loading={submitting}
          />
        </Modal>
      )}

      {viewOrder && (
        <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} />
      )}
    </div>
  );
}
