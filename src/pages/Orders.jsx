import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, RefreshCw } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import { useAuth } from '../context/AuthContext';
import { getUserOrders } from '../services/firestore';
import { money } from '../utils';

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

  return <>
    <Breadcrumbs items={[{ label: 'Orders' }]} />
    <section className="section page-section"><div className="container">
      <div className="section-head"><div><span className="eyebrow">Order History</span><h2>Your Orders</h2><p>Orders are linked to your signed-in account.</p></div><button className="btn ghost" onClick={loadOrders}><RefreshCw size={17} /> Refresh</button></div>
      {loading && <div className="empty"><Package size={54} /><h3>Loading orders...</h3></div>}
      {!loading && error && <div className="empty"><h3>Could not load orders</h3><p>{error}</p><button className="btn primary" onClick={loadOrders}>Try again</button></div>}
      {!loading && !error && !orders.length && <div className="empty"><Package size={54} /><h3>No orders yet</h3><p>Your completed orders will appear here.</p><Link className="btn primary" to="/products">Start shopping</Link></div>}
      {!loading && !error && orders.length > 0 && <div className="order-list">{orders.map(order => <article className="checkout-card" key={order.id}><div className="section-head compact"><div><span className="eyebrow">Order {order.id}</span><h3>{order.status || 'pending'}</h3></div><strong>{money(order.total)}</strong></div><p>{order.items?.length || 0} item(s) · {order.paymentMethod}</p><p>{order.address?.city}, {order.address?.state} · {order.address?.pincode}</p></article>)}</div>}
    </div></section>
  </>;
}
