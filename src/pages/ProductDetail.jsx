import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart, MessageCircle, Share2, ShoppingBag, Star, Truck, ShieldCheck, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Breadcrumbs from '../components/Breadcrumbs';
import Modal from '../components/Modal';
import ProductGrid from '../components/ProductGrid';
import ProductGallery from '../components/ProductGallery';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { fetchLiveProduct, fetchLiveProducts } from '../services/liveCatalog';
import { createEnquiry } from '../services/firestore';
import { generateEnquiryMessage, generateWhatsAppLink } from '../services/whatsapp';
import { discountPercent, mediaUrl, money } from '../utils';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });

  useEffect(() => {
    let active = true;
    Promise.all([fetchLiveProduct(id), fetchLiveProducts()]).then(([found, all]) => {
      if (!active) return;
      setProduct(found);
      setRelated(found ? all.filter(p => p.id !== found.id && p.category === found.category && Number(p.stock ?? 0) > 0).slice(0, 4) : []);
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <section className="py-20">
        <div className="container grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="skeleton aspect-[3/4] rounded-md" />
          <div className="space-y-4">
            <div className="skeleton h-5 w-28 rounded" />
            <div className="skeleton h-10 w-3/4 rounded" />
            <div className="skeleton h-24 w-full rounded" />
            <div className="skeleton h-10 w-1/2 rounded" />
          </div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="py-20">
        <div className="container rounded-md border border-dashed border-ink/15 bg-paper p-10 text-center text-muted">
          <h2 className="font-display text-ink">Product not found</h2>
          <p className="mt-2">This saree is not available right now.</p>
          <Link className="btn-primary mt-4 inline-flex" to="/products">Back to products</Link>
        </div>
      </section>
    );
  }

  const discount = discountPercent(product.price, product.mrp);
  const wished = isInWishlist(product.id);

  const submitEnquiry = async e => {
    e.preventDefault();
    await createEnquiry({ productId: product.id, productName: product.name, productSku: product.sku, customerName: form.name, phone: form.phone, email: form.email, message: form.message });
    setSent(true);
    window.open(generateWhatsAppLink(generateEnquiryMessage(product, form)), '_blank');
  };

  const handleAdd = () => {
    addToCart(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlist = () => {
    addToWishlist(product.id);
    toast(wished ? 'Removed from wishlist' : 'Saved to wishlist', { icon: wished ? '💔' : '❤️' });
  };

  return (
    <>
      <Breadcrumbs items={[{ label: 'Products', to: '/products' }, { label: product.name }]} />
      <section className="pb-16 pt-2 md:pb-24">
        <div className="container grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <ProductGallery
              media={Array.isArray(product.media) ? product.media : [mediaUrl(product)]}
              badge={discount > 0 && (
                <span className="absolute left-4 top-4 rounded-sm bg-gold px-3 py-2 font-bold text-white">{discount}% OFF</span>
              )}
            />
            <div className="mt-4 flex items-center justify-between gap-2 rounded border border-ink/10 bg-paper p-3.5 text-ink">
              <span className="flex items-center gap-2"><Truck size={18} className="text-wine" /> Fast delivery</span>
              <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-wine" /> Quality checked</span>
            </div>
          </motion.div>

          <motion.div
            className="card-surface p-6 md:p-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="eyebrow">{product.category}</span>
            <h1 className="heading-xl text-[clamp(1.8rem,4vw,2.6rem)]">{product.name}</h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[0.96rem] text-muted">
              <span className="flex items-center gap-1 rounded-sm bg-success px-1.5 py-0.5 text-[0.8rem] font-bold text-white">4.8 <Star size={12} fill="#fff" stroke="none" /></span>
              <span>SKU: {product.sku}</span>
            </div>
            <p className="lead mt-4">{product.description}</p>
            <div className="my-5 flex flex-wrap items-center gap-3.5">
              <b className="text-3xl text-ink">{money(product.price)}</b>
              {product.mrp && <s className="text-lg text-muted">{money(product.mrp)}</s>}
              {discount > 0 && (
                <span className="rounded-sm bg-success-bg px-2.5 py-1.5 font-bold text-success">
                  You save {money(product.mrp - product.price)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Colour', product.colour], ['Fabric', product.fabric], ['Occasion', product.occasion], ['Care', product.care]].map(([label, value]) => (
                <div key={label} className="rounded border border-ink/10 bg-ivory p-3.5">
                  <span className="block text-[0.82rem] text-muted">{label}</span>
                  <b className="text-ink">{value}</b>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-2 rounded bg-success-bg p-3.5 font-extrabold text-success">
              <CheckCircle size={18} /> {product.stock} pieces available in store
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button className="btn-primary" onClick={handleAdd}><ShoppingBag size={18} /> Add to Cart</button>
              <button className="btn-dark" onClick={() => setEnquiryOpen(true)}><MessageCircle size={18} /> Enquire</button>
              <button className="btn-ghost" onClick={handleWishlist}>
                <Heart size={18} fill={wished ? '#cc0c39' : 'none'} stroke={wished ? '#cc0c39' : 'currentColor'} /> Wishlist
              </button>
              <button className="btn-ghost" onClick={() => navigator.share?.({ title: product.name, url: location.href })}>
                <Share2 size={18} /> Share
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-gradient-to-br from-paper to-white py-16 md:py-24">
          <div className="container">
            <div className="mb-6">
              <span className="eyebrow">You may also like</span>
              <h2 className="heading-xl">Related sarees</h2>
            </div>
            <ProductGrid products={related} />
          </div>
        </section>
      )}

      {enquiryOpen && (
        <Modal title={`Enquire about ${product.name}`} onClose={() => setEnquiryOpen(false)}>
          {sent ? (
            <div className="py-4 text-center">
              <CheckCircle size={48} className="mx-auto text-success" />
              <h3 className="mt-3 font-display text-ink">Enquiry sent!</h3>
              <p className="mt-1 text-muted">We opened WhatsApp with your product enquiry. Our team will respond shortly.</p>
              <button className="btn-primary mt-4" onClick={() => setEnquiryOpen(false)}>Done</button>
            </div>
          ) : (
            <form className="grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={submitEnquiry}>
              <input className="field sm:col-span-1" required placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input className="field sm:col-span-1" required placeholder="Phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <input className="field sm:col-span-2" type="email" placeholder="Email (optional)" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <input className="field sm:col-span-2" readOnly value={product.name} />
              <textarea className="field min-h-28 sm:col-span-2" placeholder="What would you like to know?" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              <button className="btn-primary sm:col-span-2" type="submit">Send Enquiry</button>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
