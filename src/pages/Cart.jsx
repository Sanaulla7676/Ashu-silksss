import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import { useCart } from '../hooks/useCart';
import { mediaUrl, money } from '../utils';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, getTotal } = useCart();
  const delivery = cart.length ? 99 : 0;
  const total = getTotal();

  return (
    <>
      <Breadcrumbs items={[{ label: 'Cart' }]} />
      <section className="section page-section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Shopping Bag</span>
              <h2>Your Cart</h2>
              <p>Review your sarees before checkout.</p>
            </div>
          </div>

          {!cart.length ? (
            <div className="empty">
              <ShoppingBag size={54} />
              <h3>Your cart is empty</h3>
              <p>Add beautiful sarees to place an order.</p>
              <Link className="btn primary" to="/products">Continue shopping</Link>
            </div>
          ) : (
            <div className="cart-page-grid">
              <div className="cart-list">
                {cart.map(item => (
                  <div className="cart-row" key={item.id}>
                    <img src={mediaUrl(item)} alt="" />
                    <div>
                      <Link to={`/product/${item.id}`}><h3>{item.name}</h3></Link>
                      <p>{item.category} · {item.fabric}</p>
                      <b>{money(item.price)}</b>
                    </div>
                    <div className="qty-control">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button>
                    </div>
                    <button className="remove-btn" onClick={() => removeFromCart(item.id)}><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>

              <aside className="summary-card">
                <h3>Order Summary</h3>
                <p><span>Subtotal</span><b>{money(total)}</b></p>
                <p><span>Delivery</span><b>{money(delivery)}</b></p>
                <p className="grand"><span>Total</span><b>{money(total + delivery)}</b></p>
                <Link className="btn primary" to="/checkout">Proceed to Checkout</Link>
                <Link className="btn ghost" to="/products">Continue Shopping</Link>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
