import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, ShoppingBag, Clock, TrendingUp, RefreshCw, Package, ImagePlus, FolderTree, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getAllOrders } from '../services/admin';
import { getAdminCatalogProducts } from '../services/catalog';
import { useCategories } from '../context/CategoryContext';
import { firebaseReady } from '../firebase';
import { cloudinaryReady } from '../services/cloudinary';
import { mediaUrls, money } from '../utils';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-amber-100 text-amber-700',
  processing: 'bg-amber-100 text-amber-700',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

function toDate(ts) {
  if (!ts) return null;
  const value = typeof ts.toDate === 'function' ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return Number.isNaN(value.getTime()) ? null : value;
}

function StatCard({ icon: Icon, label, value, tint }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className={`mb-3 grid h-10 w-10 place-items-center rounded-lg ${tint}`}>
        <Icon size={20} />
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}

function startDateTomorrow(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
}

export default function AdminOverview() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [catalogError, setCatalogError] = useState('');
  const [dateRange, setDateRange] = useState('30');
  const { categories, categoryImages } = useCategories();

  const load = async () => {
    setLoading(true); setError(''); setCatalogError('');
    const [orderResult, catalogResult] = await Promise.allSettled([getAllOrders(), getAdminCatalogProducts()]);
    if (orderResult.status === 'fulfilled') setOrders(orderResult.value);
    else setError(orderResult.reason?.message || 'Could not load orders.');
    if (catalogResult.status === 'fulfilled') setProducts(catalogResult.value);
    else setCatalogError(catalogResult.reason?.message || 'Could not load the catalogue.');
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const period = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (dateRange === '7') start.setDate(start.getDate() - 6);
    else if (dateRange === '30') start.setDate(start.getDate() - 29);
    else if (dateRange === 'month') start.setDate(1);
    return { start, end: new Date(startDateTomorrow(now)), days: Math.max(1, Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - start) / 86400000) + 1) };
  }, [dateRange]);

  const periodOrders = useMemo(() => orders.filter(order => {
    const date = toDate(order.createdAt);
    return date && date >= period.start && date < period.end;
  }), [orders, period]);

  const stats = useMemo(() => {
    // These totals are non-cancelled order value, not verified payment settlement.
    const openOrders = periodOrders.filter(o => o.status !== 'cancelled');
    const orderValue = openOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const pending = periodOrders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status || 'pending')).length;
    const avgOrder = openOrders.length ? orderValue / openOrders.length : 0;
    return { orderValue, totalOrders: periodOrders.length, pending, avgOrder };
  }, [periodOrders]);

  const catalogStats = useMemo(() => {
    const hasPhoto = product => mediaUrls(product).length > 0 || (Array.isArray(product.imageIndexes) && product.imageIndexes.length > 0) || product.imageIndex !== undefined;
    return {
      total: products.length,
      drafts: products.filter(p => p.status === 'draft').length,
      noPhoto: products.filter(p => !hasPhoto(p)).length,
      priceOnRequest: products.filter(p => p.priceOnRequest || Number(p.price || 0) <= 0).length,
      availabilityOnRequest: products.filter(p => p.stockOnRequest).length,
      categoryCovers: Object.keys(categoryImages || {}).filter(name => categories.includes(name)).length,
    };
  }, [products, categoryImages, categories]);

  const chartData = useMemo(() => {
    const buckets = Array.from({ length: period.days }, (_, i) => {
      const d = new Date(period.start);
      d.setDate(period.start.getDate() + i);
      return { key: d.toDateString(), label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), revenue: 0 };
    });
    const byKey = Object.fromEntries(buckets.map(b => [b.key, b]));
    periodOrders.forEach(order => {
      if (order.status === 'cancelled') return;
      const date = toDate(order.createdAt);
      if (!date) return;
      const bucket = byKey[new Date(date.getFullYear(), date.getMonth(), date.getDate()).toDateString()];
      if (bucket) bucket.revenue += Number(order.total) || 0;
    });
    return buckets;
  }, [period, periodOrders]);

  const topProducts = useMemo(() => {
    const map = new Map();
    periodOrders.filter(o => o.status !== 'cancelled').forEach(o => (o.items || []).forEach(item => {
      const entry = map.get(item.id) || { name: item.name, qty: 0, revenue: 0 };
      entry.qty += Number(item.quantity) || 0;
      entry.revenue += (Number(item.price) || 0) * (Number(item.quantity) || 0);
      map.set(item.id, entry);
    }));
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [periodOrders]);

  const recentOrders = useMemo(() => periodOrders.slice(0, 6), [periodOrders]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Overview</h1>
          <p className="text-sm text-slate-500">Real numbers from your Firestore orders — nothing here is simulated.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="overview-date-range">Analytics date range</label>
          <select id="overview-date-range" className="dash-field min-w-36" value={dateRange} onChange={event => setDateRange(event.target.value)}>
            <option value="today">Today</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="month">This month</option>
          </select>
          <button className="dash-btn-ghost" onClick={load} disabled={loading}><RefreshCw size={16} /> Refresh</button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 font-medium text-red-700">Orders: {error}</div>}
      {catalogError && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 font-medium text-red-700">Catalogue: {catalogError}</div>}

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="font-semibold text-slate-900">Store health & quick actions</h2><p className="mt-1 text-xs text-slate-500">A quick check before publishing product changes.</p></div>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${firebaseReady && !catalogError ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>
            {firebaseReady && !catalogError ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
            {firebaseReady && !catalogError ? 'Catalogue read successful' : 'Check catalogue connection'}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-slate-200 p-3"><div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Package size={16} /> Products</div><p className="mt-2 text-2xl font-bold text-slate-900">{loading ? '…' : catalogError ? '—' : catalogStats.total}</p><p className="text-xs text-slate-500">{catalogError ? 'Could not verify counts' : `${catalogStats.drafts} drafts · ${catalogStats.noPhoto} without photos`}</p><Link className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:underline" to="/admin/products">Manage catalogue →</Link></div>
          <div className="rounded-lg border border-slate-200 p-3"><div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><ImagePlus size={16} /> Photo uploads</div><p className="mt-2 text-lg font-bold text-slate-900">{cloudinaryReady ? 'Configured' : 'Needs setup'}</p><p className="text-xs leading-5 text-slate-500">Uploads use the server’s signed endpoint and require store-owner access.</p><Link className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:underline" to="/admin/bulk-import">Import multiple photos →</Link></div>
          <div className="rounded-lg border border-slate-200 p-3"><div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><FolderTree size={16} /> Category covers</div><p className="mt-2 text-2xl font-bold text-slate-900">{catalogStats.categoryCovers}</p><p className="text-xs text-slate-500">Custom covers saved</p><Link className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:underline" to="/admin/categories">Edit categories →</Link></div>
          <div className="rounded-lg border border-slate-200 p-3"><div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><IndianRupee size={16} /> Pricing review</div><p className="mt-2 text-2xl font-bold text-slate-900">{catalogError ? '—' : catalogStats.priceOnRequest}</p><p className="text-xs text-slate-500">Products without a public price</p><Link className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:underline" to="/admin/products">Set product prices →</Link></div>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      ) : error ? null : !orders.length ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No orders yet. Order analytics will appear here after customers place orders.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={IndianRupee} label="Non-cancelled order value" value={money(stats.orderValue)} tint="bg-indigo-100 text-indigo-700" />
            <StatCard icon={ShoppingBag} label="Total orders" value={stats.totalOrders} tint="bg-blue-100 text-blue-700" />
            <StatCard icon={Clock} label="Needs attention" value={stats.pending} tint="bg-amber-100 text-amber-700" />
            <StatCard icon={TrendingUp} label="Avg. order value" value={money(stats.avgOrder)} tint="bg-emerald-100 text-emerald-700" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-1 font-semibold text-slate-900">Non-cancelled order value · {dateRange === 'today' ? 'today' : dateRange === '7' ? 'last 7 days' : dateRange === 'month' ? 'this month' : 'last 30 days'}</h2><p className="mb-4 text-xs text-slate-500">This is order value, not verified payment settlement.</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} interval={1} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={36} tickFormatter={v => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} />
                    <Tooltip formatter={v => money(v)} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                    <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fill="url(#rev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 font-semibold text-slate-900">Top products</h2>
              {topProducts.length ? (
                <div className="grid gap-3">
                  {topProducts.map((p, i) => (
                    <div key={p.name + i} className="flex items-center gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.qty} sold</p>
                      </div>
                      <b className="shrink-0 text-sm text-slate-900">{money(p.revenue)}</b>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500">No sales yet.</p>}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Recent orders</h2>
              <Link to="/admin/orders" className="text-sm font-semibold text-indigo-600 hover:underline">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 pr-4 font-medium">Order</th>
                    <th className="pb-2 pr-4 font-medium">Customer</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Date</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2.5 pr-4 font-medium text-slate-900">{o.id}</td>
                      <td className="py-2.5 pr-4 text-slate-600">{o.address?.name || '—'}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColors[o.status] || statusColors.pending}`}>{o.status || 'pending'}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-500">{toDate(o.createdAt)?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) || '—'}</td>
                      <td className="py-2.5 text-right font-semibold text-slate-900">{money(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
