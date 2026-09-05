import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, ChevronDown } from 'lucide-react';
import { animate, motion, useInView, useScroll, useSpring, useTransform } from 'framer-motion';
import toast from 'react-hot-toast';
import ProductMedia from '../components/ProductMedia';
import { useProducts } from '../hooks/useProducts';
import { useHero } from '../context/HeroContext';
import { useWishlist } from '../hooks/useWishlist';
import { createEnquiry } from '../services/firestore';
import { money, mediaUrl } from '../utils';
import { storeInfo } from '../data';

const EASE = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const staggerFast = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

// Content rises and un-blurs as it enters view.
const reveal = {
  hidden: { opacity: 0, y: 46, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.75, ease: EASE } },
};
// Images unmask upward from behind their own frame.
const unmask = {
  hidden: { clipPath: 'inset(14% 0% 0% 0%)', scale: 1.08 },
  show: { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, transition: { duration: 1.05, ease: EASE } },
};
// Words of a headline swing up one after another.
const wordUp = {
  hidden: { opacity: 0, y: '0.9em', rotateX: -55 },
  show: { opacity: 1, y: '0em', rotateX: 0, transition: { duration: 0.85, ease: EASE } },
};
// Panels wipe in from the side.
const wipeLeft = {
  hidden: { opacity: 0, x: -40, filter: 'blur(5px)' },
  show: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE } },
};
const wipeRight = {
  hidden: { opacity: 0, x: 40, filter: 'blur(5px)' },
  show: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE } },
};
// Small chips pop in.
const pop = {
  hidden: { opacity: 0, scale: 0.82 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 18 } },
};

const inView = { initial: 'hidden', whileInView: 'show', viewport: { once: true, margin: '-70px' } };

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

/** Headline whose words swing up in sequence. */
function WordReveal({ text, className = '' }) {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.06em] align-bottom">
          <motion.span variants={wordUp} className="inline-block">
            {word}
            {i < text.split(' ').length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Counts up to a number the first time it scrolls into view. */
function CountUp({ to, suffix = '' }) {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, margin: '-60px' });

  useEffect(() => {
    if (!seen || !ref.current) return undefined;
    const node = ref.current;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.textContent = `${to}${suffix}`;
      return undefined;
    }
    const controls = animate(0, to, {
      duration: 1.6,
      ease: EASE,
      onUpdate: v => { node.textContent = `${Math.round(v)}${suffix}`; },
    });
    return () => controls.stop();
  }, [seen, to, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

/** Section heading with a gold sheen and an underline that draws itself in. */
function SectionHeading({ kicker, title, action }) {
  return (
    <motion.div
      variants={reveal}
      {...inView}
      className="as-in mb-[35px] flex items-center justify-between gap-4 sm:items-end"
    >
      <div>
        <motion.div variants={pop} className="mb-1.5 text-[10px] uppercase tracking-[0.28em] text-gold">
          {kicker}
        </motion.div>
        <h2 className="m-0 font-display text-[37px] font-medium leading-none sm:text-[42px] lg:text-[48px]">
          <span className="as-underline as-sheen">{title}</span>
        </h2>
      </div>
      {action}
    </motion.div>
  );
}

function ProductCard({ product, badge }) {
  const { addToWishlist, isInWishlist } = useWishlist();
  const wished = isInWishlist(product.id);
  const [popping, setPopping] = useState(false);

  return (
    <motion.article variants={reveal} className="group relative">
      <div className="as-lift relative aspect-[0.82] overflow-hidden rounded-[11px] bg-ivory">
        <Link to={`/product/${product.id}`}>
          <motion.div
            variants={unmask}
            className="h-full w-full transition-transform duration-[650ms] ease-out group-hover:scale-[1.07]"
          >
            <ProductMedia url={mediaUrl(product)} />
          </motion.div>
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.28] to-transparent to-[45%] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-ink/85 py-2.5 text-center text-[10px] uppercase tracking-[0.18em] text-ivory transition-transform duration-300 ease-out group-hover:translate-y-0">
            View details
          </span>
        </Link>

        <motion.button
          animate={popping ? { scale: [1, 1.35, 0.92, 1] } : { scale: 1 }}
          transition={{ duration: 0.42, ease: EASE }}
          className={`absolute right-3 top-3 z-[2] grid h-[35px] w-[35px] place-items-center rounded-full border border-ink/[0.12] transition-colors ${
            wished ? 'bg-ink text-white' : 'bg-paper/[0.92] text-ink hover:bg-paper'
          }`}
          onClick={() => {
            setPopping(true);
            setTimeout(() => setPopping(false), 450);
            addToWishlist(product.id);
            toast(wished ? 'Removed from wishlist' : 'Saved to wishlist', { icon: wished ? '💔' : '❤️' });
          }}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={15} fill={wished ? 'currentColor' : 'none'} />
        </motion.button>

        {badge && (
          <motion.span
            variants={pop}
            className="as-shine absolute bottom-3 left-3 z-[2] rounded-[3px] px-[9px] py-[7px] text-[9px] uppercase tracking-[0.14em] text-ink"
            style={{ background: PANEL_STRONG }}
          >
            {badge}
          </motion.span>
        )}
      </div>

      <div className="px-[3px] pt-[13px]">
        <Link
          to={`/product/${product.id}`}
          className="block text-[13px] leading-snug text-ink transition-colors duration-300 group-hover:text-gold"
        >
          {product.name}
        </Link>
        <div className="mt-[3px] font-display text-[20px] text-ink">{money(product.price)}</div>
        {product.description && (
          <p className="mt-[6px] line-clamp-2 text-[11px] leading-[1.6] text-muted">{product.description}</p>
        )}
        <div className="mt-[6px] text-[10px] text-muted">
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

  // Thin progress bar tracking how far down the page you are.
  const { scrollYProgress: pageProgress } = useScroll();
  const progress = useSpring(pageProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  // The hero stays pinned while the rest of the page rises over it.
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const heroDim = useTransform(scrollYProgress, [0, 1], [0, 0.55]);
  const heroTextY = useTransform(scrollYProgress, [0, 1], ['0%', '38%']);
  const heroTextFade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // Parallax for the two editorial images.
  const featureRef = useRef(null);
  const { scrollYProgress: featureProgress } = useScroll({ target: featureRef, offset: ['start end', 'end start'] });
  const featureY = useTransform(featureProgress, [0, 1], ['-7%', '7%']);

  const artisanRef = useRef(null);
  const { scrollYProgress: artisanProgress } = useScroll({ target: artisanRef, offset: ['start end', 'end start'] });
  const artisanY = useTransform(artisanProgress, [0, 1], ['-8%', '8%']);

  const shownCategories = categories.filter(c => c !== 'All').slice(0, 6);
  const featureList = featuredProducts.length ? featuredProducts : allProducts;
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

  const announcement = 'Complimentary Shipping Across India  ·  100% Pure Silk  ·  Easy Returns  ·  Handpicked in Bengaluru  ·  ';

  return (
    <>
      {/* Scroll progress */}
      <motion.div
        className="fixed inset-x-0 top-0 z-[70] h-[2px] origin-left bg-gold"
        style={{ scaleX: progress }}
      />

      {/* Announcement marquee */}
      <div className="overflow-hidden bg-ink py-[10px]">
        <div className="as-marquee-track text-[9px] uppercase tracking-[0.18em] text-ivory/90 sm:text-[11px]">
          <span>{announcement.repeat(3)}</span>
          <span>{announcement.repeat(3)}</span>
        </div>
      </div>

      {/* HERO — pinned; the page scrolls over it */}
      <section
        ref={heroRef}
        className="sticky top-0 z-0 grid min-h-[620px] items-end overflow-hidden bg-wine-3 sm:min-h-[640px] lg:min-h-[680px]"
      >
        <div className="absolute inset-0">
          <motion.div className="h-full w-full" style={{ scale: heroScale }}>
            <div className="as-kenburns h-full w-full">
              <ProductMedia url={hero.url} />
            </div>
          </motion.div>
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(20,15,11,.78) 0%, rgba(20,15,11,.30) 50%, rgba(20,15,11,.15) 100%)',
            }}
          />
          <motion.div className="absolute inset-0 bg-wine-3" style={{ opacity: heroDim }} />

          {/* Ambient gold orbs */}
          <div className="as-drift pointer-events-none absolute -right-16 top-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
          <div
            className="as-float pointer-events-none absolute bottom-24 right-1/3 h-32 w-32 rounded-full bg-gold-2/10 blur-2xl"
            style={{ animationDelay: '1.2s' }}
          />
        </div>

        <div className="container relative z-[2]">
          <motion.div
            className="max-w-[520px] pb-[76px] pt-[70px] text-white lg:pb-[78px] lg:pt-[90px]"
            variants={stagger} initial="hidden" animate="show"
            style={{ y: heroTextY, opacity: heroTextFade }}
          >
            <motion.div variants={pop} className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-2">
              {hero.eyebrow || 'Pure Heritage · Modern Grace'}
            </motion.div>

            <motion.h1
              variants={staggerFast}
              className="my-[21px] mb-[25px] font-display text-[clamp(3.75rem,8vw,6.5rem)] font-medium leading-[0.79] tracking-[-0.03em]"
              style={{ perspective: 800 }}
            >
              <WordReveal text={hero.headline || 'More Than'} className="block" />
              <WordReveal text={hero.headlineAccent || 'A Saree'} className="block text-gold-2" />
            </motion.h1>

            <motion.p variants={fadeUp} className="max-w-[390px] text-[13px] leading-[1.8] text-white/[0.82] sm:text-[15px]">
              {hero.subtext ||
                "A legacy of exquisite weaves and thoughtful craftsmanship, created for life's most beautiful moments."}
            </motion.p>

            <motion.div variants={fadeUp} className="mt-7">
              <Link
                to="/products"
                className="as-shine group inline-flex items-center gap-[18px] rounded-[4px] border border-white/30 bg-white px-5 py-[14px] text-[12px] font-semibold text-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,.2)]"
              >
                Explore Collection
                <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
              </Link>
            </motion.div>
          </motion.div>

          <div className="absolute inset-x-0 bottom-6 z-[2] flex items-center justify-between text-[8px] uppercase tracking-[0.24em] text-white/80 sm:text-[10px]">
            <span>Tradition &nbsp;|&nbsp; Craftsmanship &nbsp;|&nbsp; Timeless Beauty</span>
            <span className="as-cue hidden text-white/70 sm:block"><ChevronDown size={16} /></span>
          </div>
        </div>
      </section>

      {/* Everything below rides over the pinned hero as one sheet. */}
      <div className="relative z-10 -mt-8 rounded-t-[28px] bg-ivory shadow-[0_-30px_60px_-20px_rgba(20,15,11,.45)] sm:-mt-10 sm:rounded-t-[36px]">
        {/* SERVICE BAR */}
        <div className="overflow-hidden rounded-t-[28px] border-b border-ink/[0.14] bg-paper sm:rounded-t-[36px]">
          <motion.div
            variants={staggerFast} {...inView}
            className="container flex overflow-x-auto py-[17px] sm:py-6 md:grid md:grid-cols-5 md:overflow-visible"
          >
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                variants={pop}
                className={`group flex min-w-[150px] items-center justify-center gap-[13px] px-[18px] py-[3px] sm:min-w-[170px] md:min-w-0 ${
                  i < services.length - 1 ? 'border-r border-ink/[0.14]' : ''
                }`}
              >
                <div className="font-display text-[22px] text-gold transition-transform duration-500 group-hover:rotate-[18deg] group-hover:scale-110 sm:text-[28px]">
                  {s.sym}
                </div>
                <div>
                  <b className="block text-[12px] font-semibold text-ink">{s.title}</b>
                  <span className="mt-1 block text-[10px] text-muted">{s.text}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* CATEGORIES */}
        {shownCategories.length > 0 && (
          <section className="py-[68px] lg:py-[92px]">
            <div className="container">
              <SectionHeading
                kicker="Explore Our Weaves"
                title="Signature Collections"
                action={
                  <Link
                    to="/products"
                    className="group shrink-0 text-[10px] underline underline-offset-[5px] sm:text-[12px]"
                  >
                    View all <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                }
              />

              <motion.div
                className="grid grid-cols-3 gap-x-2 gap-y-[25px] sm:gap-x-3 sm:gap-y-[30px] md:grid-cols-6 md:gap-[26px]"
                variants={stagger} {...inView}
              >
                {shownCategories.map(cat => (
                  <motion.div key={cat} variants={reveal}>
                    <Link to={`/products/${encodeURIComponent(cat)}`} className="group block text-center">
                      <div className="as-ring mx-auto aspect-square w-[88px] overflow-hidden rounded-full shadow-[0_9px_30px_rgba(49,35,22,.09)] transition-all duration-[450ms] group-hover:-translate-y-[6px] group-hover:shadow-[0_18px_38px_rgba(49,35,22,.22)] sm:w-[105px] lg:w-[126px]">
                        <div className="h-full w-full transition-transform duration-[700ms] ease-out group-hover:scale-110">
                          <ProductMedia url={mediaUrl(byCategory[cat]?.[0] || {})} />
                        </div>
                      </div>
                      <h3 className="mb-1 mt-3.5 text-[11px] font-medium text-ink transition-colors group-hover:text-gold sm:text-[13px]">
                        {cat}
                      </h3>
                      <p className="m-0 text-[8px] text-muted sm:text-[10px]">{CATEGORY_TAGLINES[cat] || 'Handpicked'}</p>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        )}

        {/* FEATURE PANEL */}
        <section ref={featureRef} className="pb-[68px] pt-0 lg:pb-[92px]">
          <div className="container">
            <motion.div
              variants={stagger} {...inView}
              className="grid overflow-hidden rounded-[18px] shadow-[var(--shadow-lift)] md:grid-cols-[1.2fr_0.8fr]"
            >
              <motion.div variants={unmask} className="min-h-[280px] overflow-hidden sm:min-h-[360px] md:min-h-[420px]">
                <motion.div className="h-[114%] w-full" style={{ y: featureY }}>
                  <ProductMedia url={artFor(1)} />
                </motion.div>
              </motion.div>
              <motion.div
                variants={wipeRight}
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
                  className="as-shine group mt-[14px] inline-flex w-fit items-center gap-[18px] rounded-[4px] bg-ink px-5 py-[14px] text-[12px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,.25)]"
                >
                  Discover the Edit
                  <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ALL PRODUCTS */}
        {featureList.length > 0 && (
          <section className="pb-[68px] pt-5 lg:pb-[92px]">
            <div className="container">
              <SectionHeading
                kicker="Handpicked Just For You"
                title="The Collection"
                action={
                  <Link
                    to="/products"
                    className="group shrink-0 text-[10px] underline underline-offset-[5px] sm:text-[12px]"
                  >
                    View all <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                }
              />
              <motion.div
                className="grid grid-cols-2 gap-x-3 gap-y-[22px] md:grid-cols-4 md:gap-[18px]"
                variants={staggerFast} {...inView}
              >
                {featureList.map((p, i) => (
                  <ProductCard key={p.id} product={p} badge={i < 4 ? 'New' : i % 5 === 0 ? 'Bestseller' : null} />
                ))}
              </motion.div>
            </div>
          </section>
        )}

        {/* ARTISAN */}
        <section ref={artisanRef} className="overflow-hidden bg-ink text-ivory">
          <motion.div variants={stagger} {...inView} className="grid md:grid-cols-2">
            <motion.div variants={unmask} className="min-h-[280px] overflow-hidden sm:min-h-[360px] md:min-h-[520px]">
              <motion.div className="h-[116%] w-full" style={{ y: artisanY }}>
                <ProductMedia url={artFor(2)} />
              </motion.div>
            </motion.div>
            <motion.div
              variants={wipeLeft}
              className="flex flex-col justify-center px-[22px] py-11 sm:px-10 md:px-[70px] md:py-[70px]"
            >
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
                <div>
                  <strong className="block font-display text-[25px] font-medium sm:text-[32px]">
                    <CountUp to={100} suffix="+" />
                  </strong>
                  <span className="text-[8px] text-ivory/60 sm:text-[10px]">Artisans</span>
                </div>
                <div>
                  <strong className="block font-display text-[25px] font-medium sm:text-[32px]">
                    <CountUp to={50} suffix="+" />
                  </strong>
                  <span className="text-[8px] text-ivory/60 sm:text-[10px]">Unique Designs</span>
                </div>
                <div>
                  <strong className="block font-display text-[25px] font-medium sm:text-[32px]">A Timeless</strong>
                  <span className="text-[8px] text-ivory/60 sm:text-[10px]">Legacy</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* OCCASIONS */}
        <section className="py-[68px] lg:py-[92px]">
          <div className="container">
            <SectionHeading kicker="Drape It Your Way" title="Collections for Every Occasion" />
            <motion.div
              className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-[18px]"
              variants={stagger} {...inView}
            >
              {OCCASIONS.map((o, i) => (
                <motion.div key={o.title} variants={reveal}>
                  <Link
                    to={shownCategories[i] ? `/products/${encodeURIComponent(shownCategories[i])}` : '/products'}
                    className="as-lift group relative block aspect-[1.05] overflow-hidden rounded-[12px]"
                  >
                    <div className="h-full w-full transition-transform duration-[700ms] ease-out group-hover:scale-[1.08]">
                      <ProductMedia url={artFor(i + 3)} />
                    </div>
                    <span className="absolute inset-0 bg-gradient-to-t from-black/[0.65] to-transparent to-[60%] transition-opacity duration-300 group-hover:from-black/[0.78]" />
                    <div className="absolute bottom-5 left-5 z-[2] text-white transition-transform duration-[450ms] ease-out group-hover:-translate-y-1">
                      <h3 className="m-0 mb-[3px] font-display text-[22px] font-medium sm:text-[27px]">{o.title}</h3>
                      <p className="m-0 text-[10px] tracking-[0.08em] text-white/80">
                        <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">
                          {o.text}
                        </span>
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* NEWSLETTER */}
        <motion.div variants={reveal} {...inView} className="py-[42px]" style={{ background: PANEL_STRONG }}>
          <div className="container flex flex-col items-start justify-between gap-[30px] md:flex-row md:items-center">
            <div>
              <div className="font-display text-[32px] text-ink sm:text-[38px]">Join Our Journey</div>
              <div className="mt-1 text-[12px] text-muted">
                Subscribe for exclusive updates, new arrivals and special offers.
              </div>
            </div>
            <form
              className="flex w-full border border-black/[0.08] bg-white transition-shadow duration-300 focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-gold)_30%,transparent)] md:w-[520px]"
              onSubmit={subscribe}
            >
              <input
                className="w-full min-w-0 flex-1 bg-white px-4 py-3.5 text-[14px] outline-none"
                type="email"
                required
                placeholder="Enter your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <button
                className="as-shine group shrink-0 bg-gold px-[22px] text-[13px] font-semibold text-white transition-colors hover:brightness-110"
                disabled={subscribing}
              >
                {subscribing ? '...' : (
                  <>
                    Subscribe <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>

      <motion.a
        href={`https://wa.me/${storeInfo.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 1.1, type: 'spring', stiffness: 220, damping: 16 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-5 right-5 z-[60] grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg"
        aria-label="WhatsApp enquiry"
      >
        <MessageCircle size={26} />
      </motion.a>
    </>
  );
}
