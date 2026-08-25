import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, RefreshCw } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import { useAuth } from '../context/AuthContext';
import { getUserOrders } from '../services/firestore';
import { money } from '../utils';

const statusStyles = {
  pending: 'bg-gold-2/30 text-wine-2',
  confirmed: 'bg-gold-2/30 text-wine-2',
  processing: 'bg-gold-2/30 text-wine-2',
  shipped: 'bg-success-bg text-success',
  delivered: 'bg-success-bg text-success',
  cancelled: 'bg-red-100 text-danger',
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = async () => {
    setLoading(true); setError('');
    try { setOrders(await getUserOrders(user.uid)); }
    catch (err) { setError(err?.message || 'Unable to load orders.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadOrders(); }, [user.uid]);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Orders' }]} />
      <section className="pb-16 pt-2 md:pb-24">
        <div className="container">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="eyebrow">Order History</span>
              <h2 className="heading-xl text-[clamp(1.8rem,4vw,2.6rem)]">Your Orders</h2>
              <p className="text-muted">Orders are linked to your signed-in account.</p>
            </div>
            <button className="btn-ghost" onClick={loadOrders}><RefreshCw size={17} /> Refresh</button>
          </div>

          {loading && (
            <div className="grid gap-3">
              {[0, 1, 2].map(i => <div key={i} className="skeleton h-24 rounded-md" />)}
            </div>
          )}
          {!loading && error && (
            <div className="rounded-md border border-dashed border-ink/15 bg-paper p-10 text-center text-muted">
              <h3 className="font-display text-ink">Could not load orders</h3>
              <p className="mt-1">{error}</p>
              <button className="btn-primary mt-4" onClick={loadOrders}>Try again</button>
            </div>
          )}
          {!loading && !error && !orders.length && (
            <div className="rounded-md border border-dashed border-ink/15 bg-paper p-10 text-center text-muted">
              <Package size={48} className="mx-auto mb-3 text-gold" />
              <h3 className="font-display text-ink">No orders yet</h3>
              <p className="mt-1">Your completed orders will appear here.</p>
              <Link className="btn-primary mt-4 inline-flex" to="/products">Start shopping</Link>
            </div>
          )}
          {!loading && !error && orders.length > 0 && (
            <div className="grid gap-3.5">
              {orders.map(order => (
                <article className="card-surface p-5" key={order.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="eyebrow">Order {order.id}</span>
                      <h3 className={`mt-1 inline-block rounded-full px-2.5 py-1 text-sm font-extrabold ${statusStyles[order.status] || statusStyles.pending}`}>
                        {order.status || 'pending'}
                      </h3>
                    </div>
                    <strong className="text-lg text-ink">{money(order.total)}</strong>
                  </div>
                  <p className="mt-2 text-muted">{order.items?.length || 0} item(s) · {order.paymentMethod}</p>
                  <p className="text-muted">{order.address?.city}, {order.address?.state} · {order.address?.pincode}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
