import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, MapPin, MessageCircle, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Breadcrumbs from '../components/Breadcrumbs';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../services/firestore';
import { generateOrderMessage, generateWhatsAppLink } from '../services/whatsapp';
import { generateOrderId, money } from '../utils';

const steps = ['Address', 'Payment', 'Review'];
const paymentMethods = ['Cash on Delivery', 'UPI on Delivery', 'Pay at Store'];

function EmptyState({ icon: Icon, title, text, cta, to }) {
  return (
    <section className="py-16 md:py-24">
      <div className="container rounded-md border border-dashed border-ink/15 bg-paper p-10 text-center text-muted">
        <Icon size={48} className="mx-auto mb-3 text-gold" />
        <h2 className="font-display text-ink">{title}</h2>
        <p className="mt-1">{text}</p>
        <Link className="btn-primary mt-4 inline-flex" to={to}>{cta}</Link>
      </div>
    </section>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, getTotal, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [address, setAddress] = useState({ name: user?.displayName || '', phone: '', addressLine1: '', addressLine2: '', city: 'Bengaluru', state: 'Karnataka', pincode: '', notes: '' });
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');

  const subtotal = getTotal();
  const delivery = cart.length ? 99 : 0;
  const total = subtotal + delivery;

  if (!user) {
    return <EmptyState icon={ShoppingBag} title="Sign in to checkout" text="Your account securely links orders to you." cta="Sign in / Create account" to="/account" />;
  }

  if (!cart.length && !order) {
    return <EmptyState icon={ShoppingBag} title="Your cart is empty" text="Add products before checkout." cta="Shop products" to="/products" />;
  }

  const placeOrder = async () => {
    setPlacing(true); setError('');
    try {
      const orderData = {
        customerUid: user.uid,
        items: cart.map(({ id, name, price, quantity, sku, media }) => ({ id, name, price, quantity, sku, media })),
        subtotal, delivery, total, address, paymentMethod, userId: user.uid,
      };
      const savedOrder = await createOrder(orderData);
      setOrder(savedOrder); clearCart();
      window.open(generateWhatsAppLink(generateOrderMessage({ ...savedOrder, id: savedOrder.id || generateOrderId() })), '_blank');
    } catch (err) {
      setError(err?.message || 'Unable to place your order. Please try again.');
    } finally { setPlacing(false); }
  };

  if (order) {
    return (
      <section className="py-16 md:py-24">
        <div className="container">
          <motion.div
            className="card-surface mx-auto max-w-xl p-8 text-center sm:p-12"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CheckCircle size={64} className="mx-auto text-success" />
            <h1 className="mt-4 font-display text-2xl text-ink sm:text-3xl">Order placed successfully!</h1>
            <p className="mt-2 text-muted">Your order ID is <b className="text-ink">{order.id}</b>. We opened WhatsApp with order details for quick confirmation.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link className="btn-primary" to="/products">Continue shopping</Link>
              <button className="btn-ghost" onClick={() => navigate('/orders')}>View orders</button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
      <section className="pb-16 pt-2 md:pb-24">
        <div className="container grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="mb-5">
              <span className="eyebrow">Secure Checkout</span>
              <h2 className="heading-xl text-[clamp(1.8rem,4vw,2.6rem)]">Place your order</h2>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2.5">
              {steps.map((label, i) => (
                <span
                  key={label}
                  className={`rounded border p-2.5 text-center text-sm font-bold sm:text-base ${
                    step >= i + 1 ? 'border-wine bg-wine text-white' : 'border-ink/15 bg-paper text-muted'
                  }`}
                >
                  {i + 1} {label}
                </span>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form
                  key="step1"
                  className="card-surface grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 sm:p-6"
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                  onSubmit={e => { e.preventDefault(); setStep(2); }}
                >
                  <h3 className="col-span-full flex items-center gap-2 text-ink"><MapPin size={20} /> Delivery Address</h3>
                  <input className="field" required placeholder="Full name" value={address.name} onChange={e => setAddress({ ...address, name: e.target.value })} />
                  <input className="field" required pattern="[0-9+() -]{8,}" placeholder="Phone number" value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })} />
                  <input className="field col-span-full" required placeholder="Address line 1" value={address.addressLine1} onChange={e => setAddress({ ...address, addressLine1: e.target.value })} />
                  <input className="field col-span-full" placeholder="Address line 2" value={address.addressLine2} onChange={e => setAddress({ ...address, addressLine2: e.target.value })} />
                  <input className="field" required placeholder="City" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} />
                  <input className="field" required placeholder="State" value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} />
                  <input className="field" required pattern="[0-9]{6}" inputMode="numeric" placeholder="Pincode" value={address.pincode} onChange={e => setAddress({ ...address, pincode: e.target.value })} />
                  <textarea className="field col-span-full min-h-28" placeholder="Delivery notes (optional)" value={address.notes} onChange={e => setAddress({ ...address, notes: e.target.value })} />
                  <button className="btn-primary col-span-full">Continue to payment</button>
                </motion.form>
              )}

              {step === 2 && (
                <motion.div key="step2" className="card-surface p-5 sm:p-6" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                  <h3 className="flex items-center gap-2 text-ink"><CreditCard size={20} /> Payment Method</h3>
                  <div className="mt-3 grid gap-2.5">
                    {paymentMethods.map(method => (
                      <label className="flex items-center gap-3 rounded border border-ink/15 bg-ivory p-4 font-semibold" key={method}>
                        <input type="radio" checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} />
                        <span>{method}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <button className="btn-ghost" onClick={() => setStep(1)}>Back</button>
                    <button className="btn-primary" onClick={() => setStep(3)}>Review order</button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" className="card-surface p-5 sm:p-6" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                  <h3 className="flex items-center gap-2 text-ink"><CheckCircle size={20} /> Review & Confirm</h3>
                  <p className="mt-3"><b>Deliver to:</b> {address.name}, {address.addressLine1}, {address.city} - {address.pincode}</p>
                  <p className="mt-1"><b>Payment:</b> {paymentMethod}</p>
                  <p className="mt-1 text-muted">The order is securely saved to your account and then shared with the store through WhatsApp.</p>
                  {error && <p className="mt-2 font-bold text-danger">{error}</p>}
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <button className="btn-ghost" onClick={() => setStep(2)}>Back</button>
                    <button className="btn-primary" disabled={placing} onClick={placeOrder}>
                      <MessageCircle size={18} /> {placing ? 'Placing...' : 'Place Order'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <aside className="card-surface sticky top-28 p-5 sm:p-6">
            <h3 className="mb-3 font-display text-ink">Order Summary</h3>
            {cart.map(item => (
              <p key={item.id} className="flex justify-between gap-3 border-b border-ink/10 py-2.5 text-muted">
                <span className="max-w-[220px] truncate">{item.name} × {item.quantity}</span>
                <b className="text-ink">{money(item.price * item.quantity)}</b>
              </p>
            ))}
            <p className="flex justify-between border-b border-ink/10 py-2.5 text-muted"><span>Subtotal</span><b className="text-ink">{money(subtotal)}</b></p>
            <p className="flex justify-between border-b border-ink/10 py-2.5 text-muted"><span>Delivery</span><b className="text-ink">{money(delivery)}</b></p>
            <p className="flex justify-between py-2.5 text-lg font-bold text-ink"><span>Total</span><b>{money(total)}</b></p>
          </aside>
        </div>
      </section>
    </>
  );
}
