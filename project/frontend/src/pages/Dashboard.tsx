import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Users, ShoppingCart, DollarSign,
  AlertTriangle, TrendingUp, ArrowRight,
} from 'lucide-react';
import { dashboardApi } from '../services/api';
import type { DashboardStats } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import { getErrorMessage } from '../services/api';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  to,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  to: string;
}) {
  return (
    <Link to={to} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
      <div className="flex items-center gap-1 mt-4 text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
        View all <ArrowRight size={14} />
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    dashboardApi
      .stats()
      .then(setStats)
      .catch(e => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!stats) return null;

  const revenue = typeof stats.total_revenue === 'number'
    ? stats.total_revenue
    : parseFloat(String(stats.total_revenue));

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Total Products" value={stats.total_products} icon={Package} color="bg-blue-500" to="/products" />
        <StatCard label="Total Customers" value={stats.total_customers} icon={Users} color="bg-teal-500" to="/customers" />
        <StatCard label="Total Orders" value={stats.total_orders} icon={ShoppingCart} color="bg-orange-500" to="/orders" />
        <StatCard
          label="Total Revenue"
          value={`$${revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="bg-emerald-500"
          to="/orders"
        />
      </div>

      {/* Low stock section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className="font-semibold text-gray-800">Low Stock Alerts</h2>
            {stats.low_stock_products.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {stats.low_stock_products.length}
              </span>
            )}
          </div>
          <Link to="/products" className="text-sm text-blue-600 hover:underline font-medium">
            Manage inventory
          </Link>
        </div>

        {stats.low_stock_products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <TrendingUp size={32} className="text-emerald-400" />
            <p className="text-gray-500 text-sm">All products are well stocked.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wider bg-gray-50">
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.low_stock_products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">{p.name}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{p.sku}</td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${p.stock_quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.stock_quantity === 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {p.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
