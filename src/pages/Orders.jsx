import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';

export default function Orders() {
  return (
    <>
      <Breadcrumbs items={[{ label: 'Orders' }]} />
      <section className="section page-section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Order History</span>
              <h2>Your Orders</h2>
              <p>Order tracking with login can be connected next. For now, each order is saved in Firebase and confirmed through WhatsApp.</p>
            </div>
          </div>
          <div className="empty">
            <Package size={54} />
            <h3>Order tracking coming soon</h3>
            <p>After placing an order, you will receive confirmation through WhatsApp. Store admins can view orders in Firebase Firestore.</p>
            <Link className="btn primary" to="/products">Continue shopping</Link>
          </div>
        </div>
      </section>
    </>
  );
}
