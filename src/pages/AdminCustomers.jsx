import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, Users, Mail, Phone } from 'lucide-react';
import { getAllOrders, getAllEnquiries } from '../services/admin';
import { money } from '../utils';

function dateValue(value) {
  if (!value) return null;
  const date = typeof value.toDate === 'function' ? value.toDate()
    : value.seconds ? new Date(value.seconds * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
function dateLabel(value) {
  const date = dateValue(value);
  return date ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}
function customerIdentity(record, id) {
  const email = String(record.email || '').trim().toLowerCase();
  const phone = String(record.phone || '').replace(/\D/g, '');
  const uid = String(record.userId || '').trim();
  if (email) return 'email:' + email;
  if (phone.length >= 7) return 'phone:' + phone;
  if (uid) return 'user:' + uid;
  return 'record:' + id;
}

function compileCustomers(orders, enquiries) {
  const customers = new Map();
  const obtain = (record, id) => {
    const key = customerIdentity(record, id);
    if (!customers.has(key)) customers.set(key, {
      id: key, name: record.name || record.customerName || 'Customer name not recorded',
      email: record.email || '', phone: record.phone || '', orders: 0,
      enquiries: 0, orderValue: 0, lastSeen: null,
    });
    const item = customers.get(key);
    if (!item.email && record.email) item.email = record.email;
    if (!item.phone && record.phone) item.phone = record.phone;
    if ((item.name === 'Customer name not recorded' || !item.name) && (record.name || record.customerName)) item.name = record.name || record.customerName;
    const date = dateValue(record.createdAt);
    if (date && (!item.lastSeen || date > item.lastSeen)) item.lastSeen = date;
    return item;
  };
  orders.forEach(order => {
    const address = order.address || {};
    const customer = obtain({
      name: address.name || order.customerName || '',
      email: address.email || order.email || '',
      phone: address.phone || order.phone || '',
      userId: order.userId,
      createdAt: order.createdAt,
    }, order.id);
    customer.orders += 1;
    if (order.status !== 'cancelled') customer.orderValue += Number(order.total) || 0;
  });
  enquiries.forEach(enquiry => {
    if (!enquiry.email && !enquiry.phone && !enquiry.userId) return;
    const customer = obtain({
      name: enquiry.customerName || enquiry.name || '',
      email: enquiry.email || '',
      phone: enquiry.phone || '',
      userId: enquiry.userId,
      createdAt: enquiry.createdAt,
    }, enquiry.id);
    customer.enquiries += 1;
  });
  return [...customers.values()].sort((a,b) => (b.lastSeen?.getTime() || 0) - (a.lastSeen?.getTime() || 0));
}

export default function AdminCustomers() {
  const [orders, setOrders] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [orderRows, enquiryRows] = await Promise.all([getAllOrders(), getAllEnquiries()]);
      setOrders(orderRows);
      setEnquiries(enquiryRows);
    } catch (err) {
      setError(err?.message || 'Customer data could not be loaded from Firestore.');
      setOrders([]);
      setEnquiries([]);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const customers = useMemo(() => compileCustomers(orders, enquiries), [orders, enquiries]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return customers.filter(customer => !term || [customer.name, customer.email, customer.phone].join(' ').toLowerCase().includes(term));
  }, [customers, search]);
  const orderCount = orders.length;
  const enquiryCount = enquiries.length;

  return <section>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Customers</h1>
        <p className="mt-1 text-sm text-slate-500">Customer summaries derived from recorded orders and enquiries, not fabricated CRM entries.</p>
      </div>
      <button className="dash-btn-ghost" onClick={load} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button>
    </div>

    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="dash-card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unique contact records</p><p className="mt-2 text-2xl font-bold text-slate-900">{loading || error ? '—' : customers.length}</p></div>
      <div className="dash-card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recorded orders</p><p className="mt-2 text-2xl font-bold text-slate-900">{loading || error ? '—' : orderCount}</p></div>
      <div className="dash-card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recorded enquiries</p><p className="mt-2 text-2xl font-bold text-slate-900">{loading || error ? '—' : enquiryCount}</p></div>
    </div>

    <div className="dash-card mb-4 p-4">
      <label className="relative block"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="dash-field pl-10" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, email or phone…" /></label>
    </div>

    <div className="dash-card overflow-hidden">
      {loading ? <p className="p-8 text-center text-sm text-slate-500">Loading order and enquiry records…</p>
        : error ? <p className="p-8 text-center text-sm text-slate-500">Customer summaries are unavailable because a source read failed.</p>
        : !filtered.length ? <div className="p-10 text-center"><Users size={28} className="mx-auto mb-3 text-slate-300" /><p className="font-semibold text-slate-700">No matching customer records</p><p className="mt-1 text-sm text-slate-500">Customers appear when an order or a contact-bearing enquiry is recorded.</p></div>
        : <div className="divide-y divide-slate-100">
          {filtered.map(customer => <article key={customer.id} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(90px,.6fr))] md:items-center">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{customer.name}</p>
              {customer.email && <a className="mt-1 flex items-center gap-1.5 break-all text-sm text-[#9f1239] hover:underline" href={'mailto:' + customer.email}><Mail size={13} /> {customer.email}</a>}
              {customer.phone && <a className="mt-1 flex items-center gap-1.5 text-sm text-slate-600 hover:text-[#9f1239]" href={'tel:' + customer.phone}><Phone size={13} /> {customer.phone}</a>}
            </div>
            <div><p className="text-lg font-bold text-slate-900">{customer.orders}</p><p className="text-xs text-slate-500">Orders</p></div>
            <div><p className="text-lg font-bold text-slate-900">{customer.enquiries}</p><p className="text-xs text-slate-500">Enquiries</p></div>
            <div><p className="text-lg font-bold text-slate-900">{money(customer.orderValue)}</p><p className="text-xs text-slate-500">Order value, not paid revenue</p><p className="mt-1 text-[11px] text-slate-400">Last activity {customer.lastSeen ? dateLabel(customer.lastSeen) : '—'}</p></div>
          </article>)}
        </div>}
      {!loading && !error && <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">Showing {filtered.length} of {customers.length} unique contact records, based on the contact details stored with source records.</div>}
    </div>
  </section>;
}
