import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
      <section className="pb-16 pt-2 md:pb-24">
        <div className="container">
          <div className="mb-6">
            <span className="eyebrow">Shopping Bag</span>
            <h2 className="heading-xl">Your Cart</h2>
            <p className="text-muted">Review your sarees before checkout.</p>
          </div>

          {!cart.length ? (
            <div className="rounded-md border border-dashed border-ink/15 bg-paper p-10 text-center text-muted">
              <ShoppingBag size={48} className="mx-auto mb-3 text-gold" />
              <h3 className="font-display text-ink">Your cart is empty</h3>
              <p className="mt-1">Add beautiful sarees to place an order.</p>
              <Link className="btn-primary mt-4 inline-flex" to="/products">Continue shopping</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_380px]">
              <div className="grid gap-3.5">
                <AnimatePresence initial={false}>
                  {cart.map(item => (
                    <motion.div
                      className="grid grid-cols-[76px_1fr] items-start gap-4 rounded-md border border-ink/10 bg-paper p-3.5 sm:grid-cols-[92px_1fr_auto_auto] sm:items-center"
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <img className="h-24 w-[76px] rounded object-cover sm:h-[116px] sm:w-[92px]" src={mediaUrl(item)} alt="" />
                      <div>
                        <Link to={`/product/${item.id}`}><h3 className="text-[0.95rem] font-medium text-ink hover:text-wine sm:text-base">{item.name}</h3></Link>
                        <p className="my-1 text-sm text-muted">{item.category} · {item.fabric}</p>
                        <b className="text-ink">{money(item.price)}</b>
                      </div>
                      <div className="col-span-2 mt-2 flex items-center justify-between gap-2 sm:col-span-1 sm:mt-0 sm:justify-self-start">
                        <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-ivory p-1">
                          <button className="grid h-8 w-8 place-items-center rounded-full border border-ink/10 bg-paper" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button>
                          <span className="w-5 text-center font-bold">{item.quantity}</span>
                          <button className="grid h-8 w-8 place-items-center rounded-full border border-ink/10 bg-paper" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button>
                        </div>
                        <button className="grid h-9 w-9 place-items-center rounded-full border border-ink/10 bg-paper text-danger sm:h-8 sm:w-8" onClick={() => removeFromCart(item.id)}><Trash2 size={18} /></button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <aside className="card-surface sticky top-28 p-5 sm:p-6">
                <h3 className="mb-3 font-display text-ink">Order Summary</h3>
                <p className="flex justify-between border-b border-ink/10 pb-2.5 text-muted"><span>Subtotal</span><b className="text-ink">{money(total)}</b></p>
                <p className="flex justify-between border-b border-ink/10 py-2.5 text-muted"><span>Delivery</span><b className="text-ink">{money(delivery)}</b></p>
                <p className="flex justify-between py-2.5 text-lg font-bold text-ink"><span>Total</span><b>{money(total + delivery)}</b></p>
                <Link className="btn-primary mt-2 w-full" to="/checkout">Proceed to Checkout</Link>
                <Link className="btn-ghost mt-2.5 w-full" to="/products">Continue Shopping</Link>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
