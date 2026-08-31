import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, Heart, Eye, MessageCircle, Sparkles, Truck, RefreshCcw, ShieldCheck, X,
} from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import ProductMedia from '../components/ProductMedia';
import { useProducts } from '../hooks/useProducts';
import { useHero } from '../context/HeroContext';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { createEnquiry } from '../services/firestore';
import { money, mediaUrl, discountPercent } from '../utils';
import { storeInfo } from '../data';

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const trustPoints = [
  { icon: Sparkles, title: 'Pure Silk', text: 'Every weave checked before it reaches you.' },
  { icon: Truck, title: 'Fast Delivery', text: 'Carefully packed, tracked to your door.' },
  { icon: RefreshCcw, title: 'Easy Enquiry', text: 'WhatsApp us before you buy, any time.' },
  { icon: ShieldCheck, title: 'Trusted Store', text: 'A real Bengaluru boutique, not a dropshipper.' },
];

const confidencePoints = [
  { n: '01', title: 'Know the weave', text: 'Fabric, zari and occasion sit right on the product — not buried in a footer.' },
  { n: '02', title: 'Choose by occasion', text: 'Wedding, festive or everyday — find your saree by moment, not just category.' },
  { n: '03', title: 'Get human help', text: 'A visible WhatsApp line for colour, blouse pairing and availability questions.' },
];

function QuickView({ product, onClose }) {
  const { addToCart } = useCart();
  if (!product) return null;
  const discount = discountPercent(product.price, product.mrp);
  return (
    <Modal title="Quick view" onClose={onClose}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="aspect-[3/4] overflow-hidden rounded-lg bg-ivory">
          <ProductMedia url={mediaUrl(product)} />
        </div>
        <div>
          <span className="eyebrow">{product.category}</span>
          <h3 className="mt-1 font-display text-2xl text-ink">{product.name}</h3>
          <div className="mt-2 flex items-center gap-2.5">
            <b className="text-xl text-ink">{money(product.price)}</b>
            {product.mrp > product.price && <s className="text-muted">{money(product.mrp)}</s>}
            {discount > 0 && <span className="text-sm font-bold text-success">{discount}% off</span>}
          </div>
          <p className="mt-3 text-sm text-muted">{product.description}</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              className="btn-primary"
              onClick={() => { addToCart(product); toast.success(`${product.name} added to cart`); onClose(); }}
            >
              <ShoppingBag size={16} /> Add to bag
            </button>
            <Link className="btn-ghost" to={`/product/${product.id}`} onClick={onClose}>
              View full details
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function PremiumProductCard({ product, onQuickView }) {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const wished = isInWishlist(product.id);
  const discount = discountPercent(product.price, product.mrp);

  return (
    <motion.article variants={fadeUp} className="group relative overflow-hidden rounded-lg border border-ink/10 bg-paper">
      <div className="relative aspect-[4/5] overflow-hidden bg-ivory">
        <Link to={`/product/${product.id}`}>
          <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-105">
            <ProductMedia url={mediaUrl(product)} />
          </div>
        </Link>
        {discount > 0 && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-wine px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-white">
            {discount}% off
          </span>
        )}
        <button
          className="absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full bg-white/92 text-wine shadow-sm transition-transform hover:scale-110"
          onClick={() => { addToWishlist(product.id); toast(wished ? 'Removed from wishlist' : 'Saved to wishlist', { icon: wished ? '💔' : '❤️' }); }}
          aria-label="Add to wishlist"
        >
          <Heart size={16} fill={wished ? 'var(--color-gold)' : 'none'} />
        </button>
        <button
          className="absolute inset-x-2.5 bottom-2.5 flex h-10 translate-y-3 items-center justify-center gap-1.5 rounded-full border border-white/70 bg-white/92 text-[0.72rem] font-bold uppercase tracking-wide text-wine opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
          onClick={() => onQuickView(product)}
        >
          <Eye size={14} /> Quick view
        </button>
      </div>
      <div className="p-3.5">
        <p className="min-h-[2.4em] text-[0.85rem] leading-tight text-ink">{product.name}</p>
        <div className="mt-2 flex items-center justify-between">
          <b className="text-[0.95rem] text-ink">{money(product.price)}</b>
          <button
            className="grid h-8 w-8 place-items-center rounded-full bg-wine text-white transition-transform hover:scale-105"
            onClick={() => { addToCart(product); toast.success(`${product.name} added to cart`); }}
            aria-label="Add to cart"
          >
            <ShoppingBag size={14} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default function Home() {
  const { featuredProducts, categories, allProducts } = useProducts();
  const { hero } = useHero();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const artY = useTransform(scrollYProgress, [0, 1], ['0%', '16%']);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const shownCategories = categories.filter(c => c !== 'All').slice(0, 6);
  const categoryImage = cat => mediaUrl(allProducts.find(p => p.category === cat) || {});
  const editorialProduct = featuredProducts[0];

  const subscribe = async e => {
    e.preventDefault();
    setSubscribing(true);
    try {
      await createEnquiry({ type: 'newsletter', email });
      toast.success("You're on the Ashu Silks list");
      setEmail('');
    } catch {
      toast.error('Could not subscribe right now.');
    } finally { setSubscribing(false); }
  };

  return (
    <>
      {/* HERO */}
      <section ref={heroRef} className="relative min-h-[85vh] overflow-hidden bg-wine-3 md:min-h-[calc(100vh-108px)]">
        {hero.type === 'video' ? (
          <motion.video className="absolute inset-0 h-full w-full scale-110 object-cover" style={{ y: artY }} src={hero.url} autoPlay muted playsInline loop />
        ) : (
          <motion.img className="absolute inset-0 h-full w-full scale-110 object-cover" style={{ y: artY }} src={hero.url} alt="" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,7,15,.82)_0%,rgba(23,15,15,.42)_45%,rgba(23,15,15,.08)_100%),linear-gradient(0deg,rgba(15,7,10,.7)_0%,transparent_38%)]" />
        <div className="pointer-events-none absolute right-[8%] top-[10%] hidden h-64 w-64 rounded-t-full border border-gold/25 lg:block" />

        <motion.div
          className="absolute inset-x-6 bottom-28 z-[4] max-w-xl text-white sm:left-[6vw] sm:right-auto md:bottom-32"
          variants={stagger} initial="hidden" animate="show"
        >
          <motion.span variants={fadeUp} className="mb-4 block text-xs font-bold uppercase tracking-[0.28em] text-gold-2">
            Ashu Silks · Pure Silk
          </motion.span>
          <motion.h1 variants={fadeUp} className="font-display text-[clamp(2.4rem,7vw,5.2rem)] font-bold italic leading-[0.95]">
            Drape in <span className="text-gold-2">timeless silk.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-5 max-w-md text-[0.98rem] leading-relaxed text-white/85">
            Refined sarees for weddings, celebrations and the moments you keep forever — chosen for their weave, zari and drape.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-7 flex flex-wrap items-center gap-5">
            <Link className="btn-primary" to="/products">
              <ShoppingBag size={16} /> Shop Silk Sarees
            </Link>
            <Link className="border-b border-white/50 pb-1 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:border-gold-2 hover:text-gold-2" to="/products">
              Explore Collections ↗
            </Link>
          </motion.div>
          <motion.div variants={fadeUp} className="mt-8 flex gap-6">
            {[['100%', 'Pure Silk'], ['Handpicked', 'Curated Weaves'], ['Secure', 'Payments']].map(([b, s]) => (
              <span key={s} className="border-l border-white/25 pl-3.5">
                <b className="block text-[0.72rem] font-bold uppercase tracking-wide">{b}</b>
                <small className="text-[0.68rem] text-white/70">{s}</small>
              </span>
            ))}
          </motion.div>
        </motion.div>

        {shownCategories.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 z-[5] hidden grid-cols-4 border-t border-white/10 bg-black/45 backdrop-blur sm:grid">
            {shownCategories.slice(0, 4).map(cat => (
              <Link
                key={cat}
                to={`/products/${encodeURIComponent(cat)}`}
                className="flex items-center justify-center gap-2 border-r border-white/10 py-5 text-white transition-colors last:border-r-0 hover:bg-white/10"
              >
                <span className="font-display text-lg">{cat}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* TRUST BAR */}
      <section className="border-b border-ink/10 bg-paper">
        <div className="container grid grid-cols-2 gap-px md:grid-cols-4">
          {trustPoints.map(t => (
            <div key={t.title} className="flex items-start gap-3 p-5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-2/25 text-wine">
                <t.icon size={18} />
              </div>
              <div>
                <strong className="block text-[0.78rem] font-bold uppercase tracking-wide text-ink">{t.title}</strong>
                <span className="mt-1 block text-[0.78rem] text-muted">{t.text}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      {shownCategories.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <span className="eyebrow">Start with a weave</span>
                <h2 className="heading-xl">Shop by Category</h2>
              </div>
              <Link to="/products" className="hidden border-b border-ink pb-1 text-xs font-bold uppercase tracking-wide sm:block">View all →</Link>
            </div>
            <motion.div
              className="grid grid-cols-3 gap-4 sm:grid-cols-6"
              variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
            >
              {shownCategories.map(cat => (
                <motion.div key={cat} variants={fadeUp}>
                  <Link to={`/products/${encodeURIComponent(cat)}`} className="group block text-center">
                    <div className="mx-auto aspect-square w-full overflow-hidden rounded-full border-2 border-gold-2/60 bg-ivory p-1">
                      <div className="h-full w-full overflow-hidden rounded-full transition-transform duration-500 group-hover:scale-105">
                        <ProductMedia url={categoryImage(cat)} />
                      </div>
                    </div>
                    <h3 className="mt-3 text-[0.72rem] font-bold uppercase tracking-wide text-ink">{cat}</h3>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* EDITORIAL BANNER */}
      {editorialProduct && (
        <section className="py-4">
          <div className="container overflow-hidden rounded-lg shadow-[var(--shadow-lift)]">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="flex flex-col justify-center bg-wine p-10 text-white sm:p-14">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold-2">Featured Edit</span>
                <h3 className="mt-3 font-display text-3xl italic sm:text-4xl">{editorialProduct.name}</h3>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80">{editorialProduct.description}</p>
                <Link className="btn-outline-light mt-6 w-fit" to={`/product/${editorialProduct.id}`}>
                  Shop the edit
                </Link>
              </div>
              <div className="aspect-[4/3] md:aspect-auto">
                <ProductMedia url={mediaUrl(editorialProduct)} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PRODUCTS */}
      {featuredProducts.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <span className="eyebrow">Handpicked favourites</span>
                <h2 className="heading-xl">Trending Now</h2>
              </div>
              <Link to="/products" className="hidden border-b border-ink pb-1 text-xs font-bold uppercase tracking-wide sm:block">View all products →</Link>
            </div>
            <motion.div
              className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4"
              variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
            >
              {featuredProducts.map(p => (
                <PremiumProductCard key={p.id} product={p} onQuickView={setQuickViewProduct} />
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* CONFIDENCE */}
      <section className="bg-gradient-to-br from-paper to-white py-16 md:py-24">
        <div className="container">
          <div className="mb-8">
            <span className="eyebrow">Silk, explained</span>
            <h2 className="heading-xl">Shop with confidence</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {confidencePoints.map(c => (
              <div key={c.n} className="rounded-lg border border-ink/10 bg-gradient-to-br from-ivory to-white p-7">
                <span className="font-display text-3xl text-gold">{c.n}</span>
                <h3 className="mt-2.5 font-display text-lg italic text-ink">{c.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-4 pb-16 md:pb-24">
        <div className="container overflow-hidden rounded-lg border border-ink/10 bg-gradient-to-br from-gold-2/20 to-ivory p-8 sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <span className="eyebrow">Stay updated</span>
              <h3 className="mt-1 font-display text-2xl italic text-ink">Be first to see the next silk drop.</h3>
              <p className="mt-1 text-sm text-muted">New arrivals and festive edits, no inbox chaos.</p>
            </div>
            <form className="flex w-full max-w-md gap-2" onSubmit={subscribe}>
              <input
                type="email" required placeholder="Your email address" value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-12 flex-1 rounded-full border border-ink/15 bg-white px-4 text-sm outline-none focus:border-wine"
              />
              <button className="btn-primary rounded-full!" disabled={subscribing}>
                {subscribing ? '...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <a
        href={`https://wa.me/${storeInfo.whatsapp}`}
        target="_blank" rel="noreferrer"
        className="fixed bottom-5 right-5 z-[60] grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg"
        aria-label="WhatsApp enquiry"
      >
        <MessageCircle size={26} />
      </a>

      <AnimatePresence>
        {quickViewProduct && <QuickView product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />}
      </AnimatePresence>
    </>
  );
}
