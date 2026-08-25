import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllOrders, updateOrderStatusAdmin } from '../services/admin';
import { money } from '../utils';

const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const paymentBadge = {
  'reported-paid': { label: 'UPI · customer says paid, verify it', tint: 'bg-amber-100 text-amber-700' },
  'awaiting-payment': { label: 'UPI · awaiting payment', tint: 'bg-slate-100 text-slate-600' },
  'pay-on-delivery': { label: 'Cash on delivery', tint: 'bg-blue-100 text-blue-700' },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setBusy(true);
    try { setOrders(await getAllOrders()); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500">Manage customer orders and fulfillment status.</p>
        </div>
        <button className="dash-btn-ghost" onClick={load} disabled={busy}><RefreshCw size={16} /> Refresh</button>
      </div>
      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 font-medium text-red-700">{error}</div>}
      {!busy && !orders.length && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No orders yet.</div>
      )}
      <div className="grid gap-2.5">
        {orders.map(o => {
          const badge = paymentBadge[o.paymentStatus];
          return (
            <article className="dash-card flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center sm:justify-between" key={o.id}>
              <div className="grid gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <b className="text-slate-900">{o.id}</b>
                  {badge && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.tint}`}>{badge.label}</span>}
                </div>
                <span className="text-sm text-slate-500">{o.address?.name} · {o.address?.phone}</span>
                <span className="text-sm text-slate-500">{o.items?.length || 0} item(s) · {money(o.total)} · {o.address?.city}</span>
              </div>
              <select
                className="dash-field w-full sm:w-auto"
                value={o.status || 'pending'}
                onChange={async e => {
                  await updateOrderStatusAdmin(o.id, e.target.value);
                  setOrders(xs => xs.map(x => x.id === o.id ? { ...x, status: e.target.value } : x));
                  toast.success('Order status updated');
                }}
              >
                {statusOptions.map(s => <option key={s}>{s}</option>)}
              </select>
            </article>
          );
        })}
      </div>
    </div>
  );
}
