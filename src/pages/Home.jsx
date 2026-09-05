import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ProductMedia from '../components/ProductMedia';
import { useProducts } from '../hooks/useProducts';
import { useHero } from '../context/HeroContext';
import { useWishlist } from '../hooks/useWishlist';
import { createEnquiry } from '../services/firestore';
import { money, mediaUrl } from '../utils';
import { storeInfo } from '../data';

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const services = [
  { sym: '✦', title: '100% Pure Silk', text: 'Authentic & Certified' },
  { sym: '◫', title: 'Free Shipping', text: 'Across India' },
  { sym: '♢', title: 'Secure Payments', text: 'Trusted Checkout' },
  { sym: '↺', title: 'Easy Returns', text: 'Hassle Free' },
  { sym: '◌', title: 'Dedicated Support', text: "We're Here for You" },
];

const CATEGORY_TAGLINES = {
  'Kanjeevaram Silk': 'Royal Heritage',
  Bridal: 'For Your Big Day',
  Designer: 'Modern Grace',
  Cotton: 'Everyday Ease',
  'Tissue Silk': 'Light & Graceful',
};

const OCCASIONS = [
  { title: 'Festive Collection', text: 'Shine Brighter →' },
  { title: 'Wedding Collection', text: "For Life's Grand Moments →" },
  { title: 'Everyday Elegance', text: 'Grace in Daily Living →' },
  { title: 'Gifting Collection', text: 'A Gift of Tradition →' },
];

// Warm panel tints derived from the live theme so the admin colour editor
// still drives this page instead of it being hardcoded beige.
const PANEL = 'color-mix(in srgb, var(--color-gold-2) 20%, var(--color-ivory))';
const PANEL_STRONG = 'color-mix(in srgb, var(--color-gold-2) 34%, var(--color-ivory))';

function ProductCard({ product, badge }) {
  const { addToWishlist, isInWishlist } = useWishlist();
  const wished = isInWishlist(product.id);

  return (
    <motion.article variants={fadeUp} className="group relative">
      <div className="relative aspect-[0.82] overflow-hidden rounded-[11px] bg-ivory">
        <Link to={`/product/${product.id}`}>
          <div className="h-full w-full transition-transform duration-[550ms] ease-out group-hover:scale-[1.045]">
            <ProductMedia url={mediaUrl(product)} />
          </div>
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.16] to-transparent to-[35%] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        </Link>
        <button
          className={`absolute right-3 top-3 z-[2] grid h-[35px] w-[35px] place-items-center rounded-full border border-ink/[0.12] transition-colors ${
            wished ? 'bg-ink text-white' : 'bg-paper/[0.92] text-ink'
          }`}
          onClick={() => {
            addToWishlist(product.id);
            toast(wished ? 'Removed from wishlist' : 'Saved to wishlist', { icon: wished ? '💔' : '❤️' });
          }}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={15} fill={wished ? 'currentColor' : 'none'} />
        </button>
        {badge && (
          <span
            className="absolute bottom-3 left-3 z-[2] rounded-[3px] px-[9px] py-[7px] text-[9px] uppercase tracking-[0.14em] text-ink"
            style={{ background: PANEL_STRONG }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="px-[3px] pt-[13px]">
        <Link to={`/product/${product.id}`} className="block text-[13px] leading-snug text-ink">
          {product.name}
        </Link>
        <div className="mt-[3px] font-display text-[20px] text-ink">{money(product.price)}</div>
        <div className="mt-[2px] text-[10px] text-muted">
          {[product.fabric, product.pattern].filter(Boolean).join(' · ') || 'Pure silk · Handwoven'}
        </div>
      </div>
    </motion.article>
  );
}

export default function Home() {
  const { featuredProducts, categories, allProducts, byCategory } = useProducts();
  const { hero } = useHero();
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const shownCategories = categories.filter(c => c !== 'All').slice(0, 6);
  const newArrivals = (featuredProducts.length ? featuredProducts : allProducts).slice(0, 4);
  // Decorative slots pull from the real catalogue so no stock photos are used.
  const artFor = i => mediaUrl(allProducts[i % Math.max(allProducts.length, 1)] || {});

  const subscribe = async e => {
    e.preventDefault();
    setSubscribing(true);
    try {
      await createEnquiry({ type: 'newsletter', email });
      toast.success("You're on the Ashu Silks list");
      setEmail('');
    } catch {
      toast.error('Could not subscribe right now.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <>
      <div className="bg-ink px-4 py-[10px] text-center text-[9px] uppercase tracking-[0.08em] text-ivory sm:text-[11px]">
        Complimentary Shipping Across India &nbsp;|&nbsp; 100% Pure Silk &nbsp;|&nbsp; Easy Returns
      </div>

      {/* HERO */}
      <section className="relative grid min-h-[620px] items-end overflow-hidden bg-wine-3 sm:min-h-[640px] lg:min-h-[680px]">
        <div className="absolute inset-0">
          <ProductMedia url={hero.url} />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(20,15,11,.78) 0%, rgba(20,15,11,.30) 50%, rgba(20,15,11,.15) 100%)',
            }}
          />
        </div>

        <div className="container relative z-[2]">
          <motion.div
            className="max-w-[520px] pb-[76px] pt-[70px] text-white lg:pb-[78px] lg:pt-[90px]"
            variants={stagger} initial="hidden" animate="show"
          >
            <motion.div variants={fadeUp} className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-2">
              {hero.eyebrow || 'Pure Heritage · Modern Grace'}
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="my-[21px] mb-[25px] font-display text-[clamp(3.75rem,8vw,6.5rem)] font-medium leading-[0.79] tracking-[-0.03em]"
            >
              {hero.headline || 'More Than'}
              <br />
              {hero.headlineAccent || 'A Saree'}
            </motion.h1>
            <motion.p variants={fadeUp} className="max-w-[390px] text-[13px] leading-[1.8] text-white/[0.82] sm:text-[15px]">
              {hero.subtext ||
                "A legacy of exquisite weaves and thoughtful craftsmanship, created for life's most beautiful moments."}
            </motion.p>
            <motion.div variants={fadeUp} className="mt-7">
              <Link
                to="/products"
                className="inline-flex items-center gap-[18px] rounded-[4px] border border-white/30 bg-white px-5 py-[14px] text-[12px] font-semibold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,.15)]"
              >
                Explore Collection <span>→</span>
              </Link>
            </motion.div>
          </motion.div>

          <div className="absolute inset-x-0 bottom-6 z-[2] flex items-center justify-between text-[8px] uppercase tracking-[0.24em] text-white/80 sm:text-[10px]">
            <span>Tradition &nbsp;|&nbsp; Craftsmanship &nbsp;|&nbsp; Timeless Beauty</span>
            <span className="flex gap-[7px]">
              <i className="h-px w-6 bg-white" />
              <i className="h-px w-6 bg-white/35" />
              <i className="h-px w-6 bg-white/35" />
            </span>
          </div>
        </div>
      </section>

      {/* SERVICE BAR */}
      <div className="border-b border-ink/[0.14] bg-paper">
        <div className="container flex overflow-x-auto py-[17px] sm:py-6 md:grid md:grid-cols-5 md:overflow-visible">
          {services.map((s, i) => (
            <div
              key={s.title}
              className={`flex min-w-[150px] items-center justify-center gap-[13px] px-[18px] py-[3px] sm:min-w-[170px] md:min-w-0 ${
                i < services.length - 1 ? 'border-r border-ink/[0.14]' : ''
              }`}
            >
              <div className="font-display text-[22px] text-gold sm:text-[28px]">{s.sym}</div>
              <div>
                <b className="block text-[12px] font-semibold text-ink">{s.title}</b>
                <span className="mt-1 block text-[10px] text-muted">{s.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORIES */}
      {shownCategories.length > 0 && (
        <section className="py-[68px] lg:py-[92px]">
          <div className="container">
            <div className="mb-[35px] flex items-center justify-between gap-4 sm:items-end">
              <div>
                <div className="mb-1.5 text-[10px] uppercase tracking-[0.28em] text-gold">Explore Our Weaves</div>
                <h2 className="m-0 font-display text-[37px] font-medium leading-none sm:text-[42px] lg:text-[48px]">
                  Signature Collections
                </h2>
              </div>
              <Link to="/products" className="shrink-0 text-[10px] underline underline-offset-[5px] sm:text-[12px]">
                View all →
              </Link>
            </div>

            <motion.div
              className="grid grid-cols-3 gap-x-2 gap-y-[25px] sm:gap-x-3 sm:gap-y-[30px] md:grid-cols-6 md:gap-[26px]"
              variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
            >
              {shownCategories.map(cat => (
                <motion.div key={cat} variants={fadeUp}>
                  <Link to={`/products/${encodeURIComponent(cat)}`} className="group block text-center">
                    <div className="mx-auto aspect-square w-[88px] overflow-hidden rounded-full shadow-[0_9px_30px_rgba(49,35,22,.09)] transition-transform duration-[350ms] group-hover:-translate-y-[5px] group-hover:scale-[1.02] sm:w-[105px] lg:w-[126px]">
                      <ProductMedia url={mediaUrl(byCategory[cat]?.[0] || {})} />
                    </div>
                    <h3 className="mb-1 mt-3.5 text-[11px] font-medium text-ink sm:text-[13px]">{cat}</h3>
                    <p className="m-0 text-[8px] text-muted sm:text-[10px]">{CATEGORY_TAGLINES[cat] || 'Handpicked'}</p>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* FEATURE PANEL */}
      <section className="pb-[68px] pt-0 lg:pb-[92px]">
        <div className="container">
          <div className="grid overflow-hidden rounded-[18px] shadow-[var(--shadow-lift)] md:grid-cols-[1.2fr_0.8fr]">
            <div className="min-h-[280px] sm:min-h-[360px] md:min-h-[420px]">
              <ProductMedia url={artFor(1)} />
            </div>
            <div
              className="flex flex-col justify-center px-[22px] py-[38px] sm:px-7 sm:py-11 md:px-14 md:py-[70px]"
              style={{ background: PANEL }}
            >
              <div className="text-[10px] uppercase tracking-[0.28em] text-gold">The Wedding Edit</div>
              <h2 className="mb-5 mt-3 font-display text-[45px] font-medium leading-[0.92] text-ink sm:text-[50px] lg:text-[58px]">
                Sarees for
                <br />
                your forever.
              </h2>
              <p className="max-w-[460px] text-[14px] leading-[1.8] text-muted">
                Heirloom-worthy silk, luminous zari and distinctive colours curated for weddings, rituals and the
                celebrations that become stories.
              </p>
              <Link
                to="/products/Bridal"
                className="mt-[14px] inline-flex w-fit items-center gap-[18px] rounded-[4px] bg-ink px-5 py-[14px] text-[12px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,.15)]"
              >
                Discover the Edit <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section className="pb-[68px] pt-5 lg:pb-[92px]">
          <div className="container">
            <div className="mb-[35px] flex items-center justify-between gap-4 sm:items-end">
              <div>
                <div className="mb-1.5 text-[10px] uppercase tracking-[0.28em] text-gold">Handpicked Just For You</div>
                <h2 className="m-0 font-display text-[37px] font-medium leading-none sm:text-[42px] lg:text-[48px]">
                  New Arrivals
                </h2>
              </div>
              <Link to="/products" className="shrink-0 text-[10px] underline underline-offset-[5px] sm:text-[12px]">
                View all →
              </Link>
            </div>
            <motion.div
              className="grid grid-cols-2 gap-x-3 gap-y-[22px] md:grid-cols-4 md:gap-[18px]"
              variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
            >
              {newArrivals.map((p, i) => (
                <ProductCard key={p.id} product={p} badge={i === 2 ? 'Bestseller' : 'New'} />
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ARTISAN */}
      <section className="bg-ink text-ivory">
        <div className="grid md:grid-cols-2">
          <div className="min-h-[280px] sm:min-h-[360px] md:min-h-[520px]">
            <ProductMedia url={artFor(2)} />
          </div>
          <div className="flex flex-col justify-center px-[22px] py-11 sm:px-10 md:px-[70px] md:py-[70px]">
            <div className="text-[10px] uppercase tracking-[0.28em] text-gold-2">The Art Behind Every Saree</div>
            <h2 className="mb-[23px] mt-2.5 font-display text-[45px] font-medium leading-[0.9] sm:text-[50px] lg:text-[64px]">
              Crafted by
              <br />
              Generations
            </h2>
            <p className="max-w-[470px] text-[14px] leading-[1.85] text-ivory/75">
              From the looms of India to your special moments, every Ashu Silks saree carries the legacy of skilled
              artisans, time-honoured techniques and a deep love for tradition.
            </p>
            <div className="mt-[38px] grid grid-cols-3 gap-2.5 border-t border-white/[0.16] pt-[27px] sm:gap-6">
              {[
                ['100+', 'Artisans'],
                ['50+', 'Unique Designs'],
                ['A Timeless', 'Legacy'],
              ].map(([n, label]) => (
                <div key={label}>
                  <strong className="block font-display text-[25px] font-medium sm:text-[32px]">{n}</strong>
                  <span className="text-[8px] text-ivory/60 sm:text-[10px]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* OCCASIONS */}
      <section className="py-[68px] lg:py-[92px]">
        <div className="container">
          <div className="mb-[35px]">
            <div className="mb-1.5 text-[10px] uppercase tracking-[0.28em] text-gold">Drape It Your Way</div>
            <h2 className="m-0 font-display text-[37px] font-medium leading-none sm:text-[42px] lg:text-[48px]">
              Collections for Every Occasion
            </h2>
          </div>
          <motion.div
            className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-[18px]"
            variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
          >
            {OCCASIONS.map((o, i) => (
              <motion.div key={o.title} variants={fadeUp}>
                <Link
                  to={`/products/${encodeURIComponent(shownCategories[i] || '')}`}
                  className="group relative block aspect-[1.05] overflow-hidden rounded-[12px]"
                >
                  <div className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]">
                    <ProductMedia url={artFor(i + 3)} />
                  </div>
                  <span className="absolute inset-0 bg-gradient-to-t from-black/[0.65] to-transparent to-[60%]" />
                  <div className="absolute bottom-5 left-5 z-[2] text-white">
                    <h3 className="m-0 mb-[3px] font-display text-[22px] font-medium sm:text-[27px]">{o.title}</h3>
                    <p className="m-0 text-[10px] tracking-[0.08em] text-white/80">{o.text}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <div className="py-[42px]" style={{ background: PANEL_STRONG }}>
        <div className="container flex flex-col items-start justify-between gap-[30px] md:flex-row md:items-center">
          <div>
            <div className="font-display text-[32px] text-ink sm:text-[38px]">Join Our Journey</div>
            <div className="mt-1 text-[12px] text-muted">
              Subscribe for exclusive updates, new arrivals and special offers.
            </div>
          </div>
          <form className="flex w-full border border-black/[0.08] bg-white md:w-[520px]" onSubmit={subscribe}>
            <input
              className="w-full min-w-0 flex-1 bg-white px-4 py-3.5 text-[14px] outline-none"
              type="email"
              required
              placeholder="Enter your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button className="shrink-0 bg-gold px-[22px] text-[13px] font-semibold text-white" disabled={subscribing}>
              {subscribing ? '...' : 'Subscribe →'}
            </button>
          </form>
        </div>
      </div>

      <a
        href={`https://wa.me/${storeInfo.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-[60] grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg"
        aria-label="WhatsApp enquiry"
      >
        <MessageCircle size={26} />
      </a>
    </>
  );
}
