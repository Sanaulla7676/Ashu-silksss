import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getAllOrders, updateOrderStatusAdmin } from '../services/admin';
import { money } from '../utils';

const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const { user, loading } = useAuth();
  const [admin, setAdmin] = useState(false);
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) user.getIdTokenResult(true).then(r => setAdmin(r.claims.admin === true)).catch(() => setAdmin(false));
  }, [user]);

  const load = async () => {
    setBusy(true);
    try { setOrders(await getAllOrders()); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  useEffect(() => { if (admin) load(); }, [admin]);

  if (loading) {
    return (
      <section className="py-16 md:py-24">
        <div className="container rounded-md border border-dashed border-ink/15 bg-paper p-10 text-center text-muted">
          <h2 className="font-display text-ink">Loading...</h2>
        </div>
      </section>
    );
  }
  if (!user || !admin) {
    return (
      <section className="py-16 md:py-24">
        <div className="container rounded-md border border-dashed border-ink/15 bg-paper p-10 text-center text-muted">
          <h2 className="font-display text-ink">Access denied</h2>
        </div>
      </section>
    );
  }

  return (
    <section className="pb-16 pt-2 md:pb-24">
      <div className="container">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="eyebrow">Ashu Silks</span>
            <h2 className="heading-xl text-[clamp(1.8rem,4vw,2.6rem)]">Orders</h2>
            <p className="text-muted">Manage customer orders and fulfillment status.</p>
          </div>
          <button className="btn-ghost" onClick={load} disabled={busy}><RefreshCw size={17} /> Refresh</button>
        </div>
        {error && <p className="mb-4 text-muted">{error}</p>}
        <div className="grid gap-2.5">
          {orders.map(o => (
            <article className="flex flex-col items-start gap-4 rounded border border-ink/10 bg-paper p-4 sm:flex-row sm:items-center sm:justify-between" key={o.id}>
              <div className="grid gap-0.5">
                <b className="text-ink">{o.id}</b>
                <span className="text-sm text-muted">{o.address?.name} · {o.address?.phone}</span>
                <span className="text-sm text-muted">{o.items?.length || 0} item(s) · {money(o.total)} · {o.address?.city}</span>
              </div>
              <select
                className="field w-full sm:w-auto"
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
          ))}
        </div>
      </div>
    </section>
  );
}
