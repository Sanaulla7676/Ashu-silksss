import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, ShoppingBag, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getAllOrders } from '../services/admin';
import { money } from '../utils';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-amber-100 text-amber-700',
  processing: 'bg-amber-100 text-amber-700',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

function toDate(ts) {
  if (!ts) return new Date();
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return new Date(ts);
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

export default function AdminOverview() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { setOrders(await getAllOrders()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const pending = orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status || 'pending')).length;
    const avgOrder = orders.length ? totalRevenue / orders.length : 0;
    return { totalRevenue, totalOrders: orders.length, pending, avgOrder };
  }, [orders]);

  const chartData = useMemo(() => {
    const days = 14;
    const buckets = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return { key: d.toDateString(), label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), revenue: 0 };
    });
    const byKey = Object.fromEntries(buckets.map(b => [b.key, b]));
    orders.forEach(o => {
      const key = toDate(o.createdAt).toDateString();
      if (byKey[key]) byKey[key].revenue += Number(o.total) || 0;
    });
    return buckets;
  }, [orders]);

  const topProducts = useMemo(() => {
    const map = new Map();
    orders.forEach(o => (o.items || []).forEach(item => {
      const entry = map.get(item.id) || { name: item.name, qty: 0, revenue: 0 };
      entry.qty += Number(item.quantity) || 0;
      entry.revenue += (Number(item.price) || 0) * (Number(item.quantity) || 0);
      map.set(item.id, entry);
    }));
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Overview</h1>
          <p className="text-sm text-slate-500">Real numbers from your Firestore orders — nothing here is simulated.</p>
        </div>
        <button className="dash-btn-ghost" onClick={load} disabled={loading}><RefreshCw size={16} /> Refresh</button>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 font-medium text-red-700">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      ) : !orders.length ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No orders yet. Once customers check out, revenue and order analytics will appear here automatically.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={IndianRupee} label="Total revenue" value={money(stats.totalRevenue)} tint="bg-indigo-100 text-indigo-700" />
            <StatCard icon={ShoppingBag} label="Total orders" value={stats.totalOrders} tint="bg-blue-100 text-blue-700" />
            <StatCard icon={Clock} label="Needs attention" value={stats.pending} tint="bg-amber-100 text-amber-700" />
            <StatCard icon={TrendingUp} label="Avg. order value" value={money(stats.avgOrder)} tint="bg-emerald-100 text-emerald-700" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 font-semibold text-slate-900">Revenue — last 14 days</h2>
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
                      <td className="py-2.5 pr-4 text-slate-500">{toDate(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
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
