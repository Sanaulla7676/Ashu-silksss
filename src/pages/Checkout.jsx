import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, MapPin, MessageCircle, ShoppingBag } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import { useCart } from '../hooks/useCart';
import { createOrder } from '../services/firestore';
import { generateOrderMessage, generateWhatsAppLink } from '../services/whatsapp';
import { generateOrderId, money } from '../utils';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, getTotal, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [order, setOrder] = useState(null);
  const [address, setAddress] = useState({
    name: '', phone: '', addressLine1: '', addressLine2: '', city: 'Bengaluru', state: 'Karnataka', pincode: '', notes: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');

  const subtotal = getTotal();
  const delivery = cart.length ? 99 : 0;
  const total = subtotal + delivery;

  if (!cart.length && !order) {
    return (
      <section className="section">
        <div className="container empty">
          <ShoppingBag size={54} />
          <h2>Your cart is empty</h2>
          <p>Add products before checkout.</p>
          <Link className="btn primary" to="/products">Shop products</Link>
        </div>
      </section>
    );
  }

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const orderData = {
        id: generateOrderId(),
        items: cart.map(({ id, name, price, quantity, sku, media }) => ({ id, name, price, quantity, sku, media })),
        subtotal,
        delivery,
        total,
        address,
        paymentMethod,
        userId: address.phone,
      };
      const savedOrder = await createOrder(orderData);
      setOrder(savedOrder);
      clearCart();
      const whatsapp = generateWhatsAppLink(generateOrderMessage(savedOrder));
      window.open(whatsapp, '_blank');
    } finally {
      setPlacing(false);
    }
  };

  if (order) {
    return (
      <section className="section page-section">
        <div className="container success-order">
          <CheckCircle size={72} />
          <h1>Order placed successfully!</h1>
          <p>Your order ID is <b>{order.id}</b>. We opened WhatsApp with order details for quick confirmation.</p>
          <div className="success-actions">
            <Link className="btn primary" to="/products">Continue shopping</Link>
            <button className="btn ghost" onClick={() => navigate('/orders')}>View orders</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
      <section className="section page-section">
        <div className="container checkout-grid">
          <div>
            <div className="section-head compact">
              <div>
                <span className="eyebrow">Secure Checkout</span>
                <h2>Place your order</h2>
              </div>
            </div>

            <div className="checkout-steps">
              <span className={step >= 1 ? 'active' : ''}>1 Address</span>
              <span className={step >= 2 ? 'active' : ''}>2 Payment</span>
              <span className={step >= 3 ? 'active' : ''}>3 Review</span>
            </div>

            {step === 1 && (
              <form className="form checkout-card" onSubmit={e => { e.preventDefault(); setStep(2); }}>
                <h3><MapPin size={20} /> Delivery Address</h3>
                <input required placeholder="Full name" value={address.name} onChange={e => setAddress({ ...address, name: e.target.value })} />
                <input required placeholder="Phone number" value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })} />
                <input required placeholder="Address line 1" value={address.addressLine1} onChange={e => setAddress({ ...address, addressLine1: e.target.value })} />
                <input placeholder="Address line 2" value={address.addressLine2} onChange={e => setAddress({ ...address, addressLine2: e.target.value })} />
                <input required placeholder="City" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} />
                <input required placeholder="State" value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} />
                <input required placeholder="Pincode" value={address.pincode} onChange={e => setAddress({ ...address, pincode: e.target.value })} />
                <textarea placeholder="Delivery notes (optional)" value={address.notes} onChange={e => setAddress({ ...address, notes: e.target.value })} />
                <button className="btn primary">Continue to payment</button>
              </form>
            )}

            {step === 2 && (
              <div className="checkout-card">
                <h3><CreditCard size={20} /> Payment Method</h3>
                {['Cash on Delivery', 'UPI on Delivery', 'Pay at Store'].map(method => (
                  <label className="payment-option" key={method}>
                    <input type="radio" checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} />
                    <span>{method}</span>
                  </label>
                ))}
                <div className="checkout-actions">
                  <button className="btn ghost" onClick={() => setStep(1)}>Back</button>
                  <button className="btn primary" onClick={() => setStep(3)}>Review order</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="checkout-card">
                <h3><CheckCircle size={20} /> Review & Confirm</h3>
                <p><b>Deliver to:</b> {address.name}, {address.addressLine1}, {address.city} - {address.pincode}</p>
                <p><b>Payment:</b> {paymentMethod}</p>
                <p className="muted">After placing, order details will be saved and sent to the store through WhatsApp for faster confirmation.</p>
                <div className="checkout-actions">
                  <button className="btn ghost" onClick={() => setStep(2)}>Back</button>
                  <button className="btn primary" disabled={placing} onClick={placeOrder}>
                    <MessageCircle size={18} /> {placing ? 'Placing...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="summary-card">
            <h3>Order Summary</h3>
            {cart.map(item => (
              <p key={item.id}><span>{item.name} × {item.quantity}</span><b>{money(item.price * item.quantity)}</b></p>
            ))}
            <p><span>Subtotal</span><b>{money(subtotal)}</b></p>
            <p><span>Delivery</span><b>{money(delivery)}</b></p>
            <p className="grand"><span>Total</span><b>{money(total)}</b></p>
          </aside>
        </div>
      </section>
    </>
  );
}
