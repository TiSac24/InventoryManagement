import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react';
import { productsApi, getErrorMessage } from '../services/api';
import type { Product, ProductCreate, ProductUpdate } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastProvider';

function ProductForm({
  initial,
  onSubmit,
  loading,
}: {
  initial?: Product;
  onSubmit: (data: ProductCreate | ProductUpdate) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    sku: initial?.sku ?? '',
    price: initial?.price?.toString() ?? '',
    stock_quantity: initial?.stock_quantity?.toString() ?? '0',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: form.name,
      sku: form.sku,
      price: parseFloat(form.price),
      stock_quantity: parseInt(form.stock_quantity, 10),
    });
  };

  const field = (
    label: string,
    key: keyof typeof form,
    type = 'text',
    placeholder = ''
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        required
        value={form[key]}
        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {field('Product Name', 'name', 'text', 'e.g. Wireless Mouse')}
      {field('SKU', 'sku', 'text', 'e.g. WM-001')}
      {field('Price ($)', 'price', 'number', '0.00')}
      {field('Stock Quantity', 'stock_quantity', 'number', '0')}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Saving...' : initial ? 'Update Product' : 'Create Product'}
      </button>
    </form>
  );
}

export default function Products() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    setError('');
    productsApi
      .list()
      .then(data => {
        setProducts(data);
        setFiltered(data);
      })
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    const q = query.toLowerCase();
    setFiltered(
      products.filter(p =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      )
    );
  }, [query, products]);

  const handleCreate = async (data: ProductCreate) => {
    setSubmitting(true);
    try {
      const product = await productsApi.create(data);
      setProducts(prev => [product, ...prev]);
      setShowAdd(false);
      showToast('success', 'Product created successfully');
    } catch (e) {
      showToast('error', getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: ProductUpdate) => {
    if (!editing) return;
    setSubmitting(true);
    try {
      const updated = await productsApi.update(editing.id, data);
      setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      setEditing(null);
      showToast('success', 'Product updated successfully');
    } catch (e) {
      showToast('error', getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    setDeletingId(id);
    try {
      await productsApi.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast('success', 'Product deleted');
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
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or SKU…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Package size={36} className="text-gray-300" />
            <p className="text-gray-500">No products found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">{p.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 bg-gray-50/50">{p.sku}</td>
                    <td className="px-6 py-4 font-semibold text-gray-700">
                      ${parseFloat(String(p.price)).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.stock_quantity === 0
                            ? 'bg-red-100 text-red-700'
                            : p.stock_quantity <= 10
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditing(p)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
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

      {/* Add modal */}
      {showAdd && (
        <Modal title="Add Product" onClose={() => setShowAdd(false)}>
          <ProductForm onSubmit={d => handleCreate(d as ProductCreate)} loading={submitting} />
        </Modal>
      )}

      {/* Edit modal */}
      {editing && (
        <Modal title="Edit Product" onClose={() => setEditing(null)}>
          <ProductForm
            initial={editing}
            onSubmit={d => handleUpdate(d as ProductUpdate)}
            loading={submitting}
          />
        </Modal>
      )}
    </div>
  );
}
