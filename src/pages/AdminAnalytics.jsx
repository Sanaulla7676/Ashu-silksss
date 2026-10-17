import { useEffect, useMemo, useState } from 'react';
import { BarChart3, IndianRupee, ShoppingBag, MessageSquare, Package, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { getAllOrders, getAllEnquiries } from '../services/admin';
import { getAdminCatalogProducts } from '../services/catalog';
import { money } from '../utils';

function dateValue(value) {
  if (!value) return null;
  const date = typeof value.toDate === 'function' ? value.toDate() : value.seconds ? new Date(value.seconds * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
function startTomorrow(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1); }
function orderState(order) { return String(order.status || 'pending').toLowerCase(); }
function Stat({ icon: Icon, title, value, foot }) {
  return <article className="dash-card p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><span className="text-sm text-slate-500">{title}</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-50 text-[#9f1239]"><Icon size={18} /></span></div><p className="text-2xl font-bold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{foot}</p></article>;
}

export default function AdminAnalytics() {
  const [orders, setOrders] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [products, setProducts] = useState([]);
  const [range, setRange] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [orderRows, enquiryRows, catalogue] = await Promise.all([getAllOrders(), getAllEnquiries(), getAdminCatalogProducts()]);
      setOrders(orderRows); setEnquiries(enquiryRows); setProducts(catalogue);
    } catch (err) {
      setError(err?.message || 'Analytics source records could not be loaded.');
      setOrders([]); setEnquiries([]); setProducts([]);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const period = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (range === '7') start.setDate(start.getDate() - 6);
    else if (range === '30') start.setDate(start.getDate() - 29);
    else if (range === 'month') start.setDate(1);
    return { start, end: startTomorrow(now), days: Math.max(1, Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - start) / 86400000) + 1) };
  }, [range]);

  const windowOrders = useMemo(() => orders.filter(order => {
    const date = dateValue(order.createdAt);
    return date && date >= period.start && date < period.end;
  }), [orders, period]);
  const windowEnquiries = useMemo(() => enquiries.filter(enquiry => {
    const date = dateValue(enquiry.createdAt);
    return date && date >= period.start && date < period.end;
  }), [enquiries, period]);
  const activeProducts = useMemo(() => products.filter(product => !['draft','archived','hidden','inactive'].includes(String(product.status || 'active').toLowerCase())), [products]);

  const metrics = useMemo(() => {
    const validOrders = windowOrders.filter(order => orderState(order) !== 'cancelled');
    const orderValue = validOrders.reduce((total, order) => total + (Number(order.total) || 0), 0);
    return {
      orders: windowOrders.length,
      orderValue,
      averageOrder: validOrders.length ? orderValue / validOrders.length : 0,
      enquiries: windowEnquiries.length,
      lowStock: activeProducts.filter(product => !product.stockOnRequest && product.stock !== undefined && Number(product.stock) <= 2).length,
      published: activeProducts.length,
    };
  }, [windowOrders, windowEnquiries, activeProducts]);

  const trend = useMemo(() => {
    const points = Array.from({ length: period.days }, (_, i) => {
      const date = new Date(period.start); date.setDate(period.start.getDate() + i);
      return { key: date.toDateString(), label: date.toLocaleDateString('en-IN', { day:'numeric', month:'short' }), orderValue: 0, orders: 0 };
    });
    const byDate = new Map(points.map(point => [point.key, point]));
    windowOrders.filter(order => orderState(order) !== 'cancelled').forEach(order => {
      const date = dateValue(order.createdAt);
      if (!date) return;
      const key = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toDateString();
      const point = byDate.get(key);
      if (point) { point.orderValue += Number(order.total) || 0; point.orders += 1; }
    });
    return points;
  }, [period, windowOrders]);

  const bestSellers = useMemo(() => {
    const map = new Map();
    windowOrders.filter(order => orderState(order) !== 'cancelled').forEach(order => (order.items || []).forEach(item => {
      const key = String(item.id || item.sku || item.name || 'unknown');
      const previous = map.get(key) || { key, name: item.name || item.sku || 'Unnamed item', quantity: 0, value: 0 };
      const quantity = Number(item.quantity) || 0;
      previous.quantity += quantity;
      previous.value += (Number(item.price) || 0) * quantity;
      map.set(key, previous);
    }));
    return [...map.values()].sort((a,b) => b.quantity - a.quantity).slice(0,8);
  }, [windowOrders]);

  const statuses = useMemo(() => {
    const map = new Map();
    windowOrders.forEach(order => { const key = orderState(order); map.set(key, (map.get(key) || 0) + 1); });
    return [...map.entries()].map(([status, count]) => ({ status, count })).sort((a,b) => b.count - a.count);
  }, [windowOrders]);
  const label = range === 'today' ? 'Today' : range === '7' ? 'Last 7 days' : range === 'month' ? 'This month' : 'Last 30 days';

  return <section>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="font-display text-2xl font-bold text-slate-900">Analytics</h1><p className="mt-1 text-sm text-slate-500">Live calculations from Firestore source records. Order value is not confirmed paid revenue.</p></div>
      <div className="flex gap-2">
        <select className="dash-field min-w-36" aria-label="Analytics date range" value={range} onChange={event => setRange(event.target.value)}><option value="today">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="month">This month</option></select>
        <button className="dash-btn-ghost" onClick={load} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button>
      </div>
    </div>
    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}
    {loading ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0,1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}</div>
      : error ? <div className="dash-card p-8 text-center text-sm text-slate-500">Analytics are unavailable because at least one source read failed.</div>
      : <>
        <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Stat icon={IndianRupee} title="Order value" value={money(metrics.orderValue)} foot={label + ' · cancelled orders excluded'} />
          <Stat icon={ShoppingBag} title="Orders" value={metrics.orders} foot={label + ' · all recorded statuses'} />
          <Stat icon={MessageSquare} title="Enquiries" value={metrics.enquiries} foot={label + ' · Firestore records'} />
          <Stat icon={Package} title="Published catalogue" value={metrics.published} foot={metrics.lowStock + ' low-stock / ≤ 2 units'} />
        </div>
        <div className="mb-5 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <article className="dash-card p-4 sm:p-5">
            <h2 className="mb-1 font-semibold text-slate-900">Order value trend</h2><p className="mb-3 text-xs text-slate-500">{label}. This is order totals, not payment settlement.</p>
            {windowOrders.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{top:8,right:8,left:4,bottom:0}}><defs><linearGradient id="orderValueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9f1239" stopOpacity={0.25}/><stop offset="100%" stopColor="#9f1239" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1dfe4"/><XAxis dataKey="label" tick={{fontSize:10,fill:'#64748b'}} axisLine={false} tickLine={false} interval={period.days > 14 ? 4 : 0}/><YAxis tick={{fontSize:10,fill:'#64748b'}} axisLine={false} tickLine={false} width={44} tickFormatter={value => value >= 1000 ? '₹' + Math.round(value/1000) + 'k' : '₹' + value}/><Tooltip formatter={value => money(value)} contentStyle={{borderRadius:10,border:'1px solid #f1dfe4',fontSize:12}}/><Area type="monotone" dataKey="orderValue" stroke="#9f1239" strokeWidth={2} fill="url(#orderValueFill)"/></AreaChart></ResponsiveContainer></div> : <div className="grid h-64 place-items-center text-sm text-slate-500">No orders in this period to chart.</div>}
          </article>
          <article className="dash-card p-4 sm:p-5">
            <h2 className="mb-1 font-semibold text-slate-900">Order statuses</h2><p className="mb-3 text-xs text-slate-500">All recorded orders, including cancelled ones.</p>
            {statuses.length ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={statuses} layout="vertical" margin={{top:4,right:14,left:8,bottom:4}}><XAxis type="number" allowDecimals={false}/><YAxis type="category" dataKey="status" width={86}/><Tooltip/><Bar dataKey="count" fill="#9f1239" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer></div> : <div className="grid h-64 place-items-center text-sm text-slate-500">No order records for this period.</div>}
          </article>
        </div>
        <article className="dash-card overflow-hidden">
          <div className="border-b border-rose-100 p-4"><h2 className="font-semibold text-slate-900">Best-selling catalogue items</h2><p className="mt-1 text-xs text-slate-500">Ranked by units in non-cancelled order line items. Category history is not inferred from today's product category.</p></div>
          {bestSellers.length ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-rose-50/60 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-3">Product</th><th className="p-3 text-right">Units</th><th className="p-3 text-right">Line item value</th></tr></thead><tbody>{bestSellers.map(item => <tr key={item.key} className="border-t border-slate-100"><td className="p-3 font-medium text-slate-800">{item.name}</td><td className="p-3 text-right tabular-nums">{item.quantity}</td><td className="p-3 text-right tabular-nums">{money(item.value)}</td></tr>)}</tbody></table></div> : <p className="p-8 text-center text-sm text-slate-500">No qualifying line items in this period.</p>}
          <div className="border-t border-slate-100 p-3 text-xs text-slate-500">Source note: line-item values use the price and quantity captured on each order item. They are not a payment-confirmation report.</div>
        </article>
      </>}
  </section>;
}
