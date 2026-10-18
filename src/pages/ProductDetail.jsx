import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart, MessageCircle, Share2, ShoppingBag, Truck, ShieldCheck, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Breadcrumbs from '../components/Breadcrumbs';
import Modal from '../components/Modal';
import ProductGrid from '../components/ProductGrid';
import ProductGallery from '../components/ProductGallery';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { subscribeToLiveProducts } from '../services/liveCatalog';
import { createEnquiry } from '../services/firestore';
import { generateEnquiryMessage, generateWhatsAppLink } from '../services/whatsapp';
import { discountPercent, mediaUrls, money, productPhotoCount } from '../utils';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });

  useEffect(() => {
    let active = true;
    let recordedProductId = null;
    const unsubscribe = subscribeToLiveProducts(all => {
      if (!active) return;
      const found = all.find(item => item.id === id || item.sku === id) || null;
      setProduct(found);
      setRelated(found ? all.filter(item =>
        item.id !== found.id &&
        item.category === found.category &&
        (Number(item.stock ?? 0) > 0 || item.stockOnRequest)
      ).slice(0, 4) : []);
      if (found && recordedProductId !== found.id) {
        recordedProductId = found.id;
        try {
          const stored = JSON.parse(localStorage.getItem('ashu_recently_viewed_ids') || '[]');
          const previousIds = Array.isArray(stored) ? stored.filter(value => typeof value === 'string') : [];
          const viewedIds = [found.id, ...previousIds.filter(value => value !== found.id)].slice(0, 6);
          localStorage.setItem('ashu_recently_viewed_ids', JSON.stringify(viewedIds));
          setRecentlyViewed(all
            .filter(item => item.id !== found.id && viewedIds.includes(item.id))
            .sort((a, b) => viewedIds.indexOf(a.id) - viewedIds.indexOf(b.id))
            .slice(0, 4));
        } catch {
          setRecentlyViewed([]);
        }
      }
      setLoading(false);
    }, error => {
      if (active) {
        console.warn('[product] Live catalogue subscription failed.', error);
        setLoading(false);
      }
    });
    return () => { active = false; unsubscribe?.(); };
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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url: window.location.href });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Product link copied');
      } else {
        toast.error('Sharing is not supported in this browser.');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') toast.error('Could not share product link.');
    }
  };

  return (
    <>
      <Breadcrumbs items={[{ label: 'Products', to: '/products' }, { label: product.name }]} />
      <section className="pb-28 pt-2 md:pb-24">
        <div className="container grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <ProductGallery
              media={mediaUrls(product)}
              productName={product.name}
              colour={product.colour}
              imageIndex={product.imageIndex}
              imageIndexes={product.imageIndexes}
              badge={discount > 0 && (
                <span className="absolute left-4 top-4 rounded-sm bg-gold px-3 py-2 font-bold text-white">{discount}% OFF</span>
              )}
            />
            <div className="mt-4 rounded border border-ink/10 bg-paper p-3.5 text-ink">
              <div className="flex items-start gap-2">
                <Truck size={18} className="mt-0.5 shrink-0 text-wine" />
                <div>
                  <b className="block text-[0.9rem]">Delivery</b>
                  <span className="mt-0.5 block text-[0.82rem] text-muted">
                    Within Bengaluru — 2 working days
                  </span>
                  <span className="block text-[0.82rem] text-muted">
                    Outside Bengaluru — 7 working days
                  </span>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-2 border-t border-ink/10 pt-2.5">
                <ShieldCheck size={18} className="shrink-0 text-wine" /> Quality checked
              </div>
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
            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[0.86rem] text-muted">
              {product.sku && <span>SKU: {product.sku}</span>}
              <span>{productPhotoCount(product)} product photo{productPhotoCount(product) === 1 ? '' : 's'}</span>
            </div>
            <p className="lead mt-4">{product.description}</p>
            {Array.isArray(product.highlights) && product.highlights.length > 0 && (
              <ul className="mt-3 grid gap-1.5">
                {product.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink">
                    <CheckCircle size={14} className="mt-0.5 shrink-0 text-success" /> {h}
                  </li>
                ))}
              </ul>
            )}
            <div className="my-5 flex flex-wrap items-center gap-3.5">
              <b className="text-3xl text-ink">{product.priceOnRequest ? 'Price on request' : money(product.price)}</b>
              {!product.priceOnRequest && product.mrp && <s className="text-lg text-muted">{money(product.mrp)}</s>}
              {!product.priceOnRequest && discount > 0 && (
                <span className="rounded-sm bg-success-bg px-2.5 py-1.5 font-bold text-success">
                  You save {money(product.mrp - product.price)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Colour', product.colour],
                ['Fabric', product.fabric],
                ['Occasion', product.occasion],
                ['Pattern', product.pattern],
                ['Work', product.workType],
                ['Blouse', product.blousePiece],
                ['Length', product.sareeLength],
                ['Care', product.washCare || product.care],
              ].filter(([, value]) => value).map(([label, value]) => (
                <div key={label} className="rounded border border-ink/10 bg-ivory p-3.5">
                  <span className="block text-[0.82rem] text-muted">{label}</span>
                  <b className="text-ink">{value}</b>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-2 rounded bg-success-bg p-3.5 font-extrabold text-success">
              <CheckCircle size={18} /> {product.stockOnRequest ? 'Availability confirmed on enquiry' : `${product.stock} pieces available in store`}
            </div>
            {!product.stockOnRequest && Number(product.stock) > 0 && Number(product.stock) <= 3 && (
              <p className="mt-2 text-sm font-semibold text-wine">
                Only {Number(product.stock)} left in the current stock count.
              </p>
            )}
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {!product.priceOnRequest && (
                <button className="btn-primary" onClick={handleAdd}><ShoppingBag size={18} /> Add to Cart</button>
              )}
              <button className="btn-dark" onClick={() => setEnquiryOpen(true)}><MessageCircle size={18} /> {product.priceOnRequest ? 'Enquire for Price' : 'Enquire'}</button>
              <button className="btn-ghost" onClick={handleWishlist}>
                <Heart size={18} fill={wished ? 'var(--color-gold)' : 'none'} stroke={wished ? 'var(--color-gold)' : 'currentColor'} /> Wishlist
              </button>
              <button className="btn-ghost" onClick={handleShare}>
                <Share2 size={18} /> Share
              </button>
            </div>
            <a
              href={generateWhatsAppLink(`Hello Ashu Silks! I’m interested in ${product.name} (SKU: ${product.sku || 'not listed'}). ${product.priceOnRequest ? 'Could you share the price and availability?' : 'Could you confirm availability and delivery details?'}`)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded border border-[#25D366]/35 bg-[#25D366]/10 px-4 py-3 text-center text-sm font-bold text-[#157347] transition-colors hover:bg-[#25D366]/15"
            >
              <MessageCircle size={17} /> Need help choosing? Chat with our saree team
            </a>
          </motion.div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-ink/10 bg-paper/95 px-3 py-3 shadow-[0_-8px_24px_rgba(20,15,12,0.1)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted">{product.name}</p>
            <p className="truncate text-sm font-bold text-wine">{product.priceOnRequest ? 'Price on request' : money(product.price)}</p>
          </div>
          {product.priceOnRequest ? (
            <button className="btn-dark min-h-11 shrink-0 px-4!" onClick={() => setEnquiryOpen(true)}>
              <MessageCircle size={16} /> Enquire
            </button>
          ) : (
            <button className="btn-primary min-h-11 shrink-0 px-4!" onClick={handleAdd}>
              <ShoppingBag size={16} /> Add to Cart
            </button>
          )}
        </div>
      </div>

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

      {recentlyViewed.length > 0 && (
        <section className="bg-paper py-12 md:py-16">
          <div className="container">
            <div className="mb-6">
              <span className="eyebrow">Continue browsing</span>
              <h2 className="heading-xl">Recently viewed</h2>
            </div>
            <ProductGrid products={recentlyViewed} />
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
