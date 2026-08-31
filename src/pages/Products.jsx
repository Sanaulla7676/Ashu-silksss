import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ChevronRight, ChevronDown, Heart, ShoppingBag, X, SlidersHorizontal,
  Leaf, Truck, ShieldCheck, PackageCheck, Headphones,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import DualRangeSlider from '../components/DualRangeSlider';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { money, mediaUrl, discountPercent } from '../utils';

const PAGE_SIZE = 12;
const EASE = [0.22, 1, 0.36, 1];

const COLOR_SWATCHES = [
  { name: 'Red', hex: '#c0392b' }, { name: 'Pink', hex: '#e08fb8' },
  { name: 'Purple', hex: '#7b3fa0' }, { name: 'Blue', hex: '#2f6fbe' },
  { name: 'Green', hex: '#3e8e5a' }, { name: 'Gold', hex: '#C89A3D' },
  { name: 'Orange', hex: '#d9822b' }, { name: 'Beige', hex: '#dcc9a3' },
  { name: 'White', hex: '#ffffff' }, { name: 'Black', hex: '#1a1a1a' },
];

const trustBar = [
  { icon: Leaf, title: '100% Pure Silk', text: 'Certified Authentic' },
  { icon: Truck, title: 'Free Shipping', text: 'On orders above ₹1999' },
  { icon: ShieldCheck, title: 'Secure Payment', text: '100% Protected' },
  { icon: PackageCheck, title: 'Easy Returns', text: 'Hassle free returns' },
  { icon: Headphones, title: 'Silk Concierge', text: "We're here to help" },
];

function FilterSection({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-ink/10 py-4 first:pt-0 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left text-[13px] font-semibold uppercase tracking-wide text-ink"
        onClick={() => setOpen(o => !o)}
      >
        {title}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.28, ease: EASE }}>
          <ChevronDown size={14} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="pt-3.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded px-2 py-1.5 text-left text-[12px] transition-colors duration-200 ${
        active ? 'bg-wine/10 font-semibold text-wine' : 'text-muted hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}

function badgeFor(product, newIds) {
  const discount = discountPercent(product.price, product.mrp);
  const badges = [];
  if (discount > 0) badges.push({ label: `-${discount}%`, className: 'bg-wine text-white' });
  if (newIds.has(product.id)) badges.push({ label: 'New', className: 'bg-wine-2 text-white' });
  if (!badges.length && product.featured) badges.push({ label: 'Bestseller', className: 'bg-gold text-white' });
  return badges;
}

function FiltersPanel({
  maxRange, setMaxRange, colour, setColour, occasion, setOccasion, occasionOptions,
  fabric, setFabric, fabricOptions, workType, setWorkType, workOptions,
  pattern, setPattern, patternOptions, availability, setAvailability, onApply, onClear,
}) {
  return (
    <>
      <h2 className="mb-1 text-[13px] font-bold uppercase tracking-wide text-ink">Filter By</h2>

      <FilterSection title="Price" defaultOpen>
        <DualRangeSlider min={1000} max={50000} step={500} value={maxRange} onChange={setMaxRange} />
        <div className="mt-2.5 flex justify-between text-[11px] text-muted">
          <span>{money(maxRange[0])}</span>
          <span>{maxRange[1] >= 50000 ? '₹50,000+' : money(maxRange[1])}</span>
        </div>
      </FilterSection>

      <FilterSection title="Colour" defaultOpen>
        <div className="flex flex-wrap gap-2.5">
          {COLOR_SWATCHES.map(c => (
            <button
              key={c.name} type="button" title={c.name}
              onClick={() => setColour(colour === c.name ? '' : c.name)}
              className={`h-[21px] w-[21px] rounded-full transition-transform duration-200 ${colour === c.name ? 'scale-110 ring-2 ring-wine ring-offset-2' : ''} ${c.name === 'White' ? 'border border-ink/15' : ''}`}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Occasion">
        {occasionOptions.length ? occasionOptions.map(o => (
          <FilterChip key={o} label={o} active={occasion === o} onClick={() => setOccasion(occasion === o ? '' : o)} />
        )) : <p className="text-[11px] text-muted">No data yet</p>}
      </FilterSection>

      <FilterSection title="Silk Type">
        {fabricOptions.length ? fabricOptions.map(f => (
          <FilterChip key={f} label={f} active={fabric === f} onClick={() => setFabric(fabric === f ? '' : f)} />
        )) : <p className="text-[11px] text-muted">No data yet</p>}
      </FilterSection>

      <FilterSection title="Zari Type">
        {workOptions.length ? workOptions.map(w => (
          <FilterChip key={w} label={w} active={workType === w} onClick={() => setWorkType(workType === w ? '' : w)} />
        )) : <p className="text-[11px] text-muted">No data yet</p>}
      </FilterSection>

      <FilterSection title="Pattern">
        {patternOptions.length ? patternOptions.map(p => (
          <FilterChip key={p} label={p} active={pattern === p} onClick={() => setPattern(pattern === p ? '' : p)} />
        )) : <p className="text-[11px] text-muted">No data yet</p>}
      </FilterSection>

      <FilterSection title="Availability">
        <FilterChip label="In stock" active={availability === 'in'} onClick={() => setAvailability(availability === 'in' ? '' : 'in')} />
        <FilterChip label="Low stock" active={availability === 'low'} onClick={() => setAvailability(availability === 'low' ? '' : 'low')} />
      </FilterSection>

      <button className="btn-primary mt-4 w-full min-h-[41px]!" onClick={onApply}>Apply Filters</button>
      <button className="mt-2.5 w-full text-center text-[12px] font-semibold text-wine hover:underline" onClick={onClear}>
        Clear All
      </button>
    </>
  );
}

function PremiumProductCard({ product, index, newIds, onQuickView }) {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [hovered, setHovered] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const wished = isInWishlist(product.id);
  const badges = badgeFor(product, newIds);
  const images = Array.isArray(product.media) ? product.media : [mediaUrl(product)];
  const secondImage = images[1];

  return (
    <motion.article
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE, delay: (index % PAGE_SIZE) * 0.06 } } }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="overflow-hidden rounded-lg border border-ink/10 bg-paper transition-shadow duration-250"
      style={{ boxShadow: hovered ? 'var(--shadow-lift)' : 'var(--shadow-soft)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-ivory">
        <Link to={`/product/${product.id}`} aria-label={product.name}>
          <motion.img
            src={images[0]}
            alt=""
            loading="lazy"
            onLoad={() => setLoaded(true)}
            animate={{ scale: hovered ? 1.045 : 1, opacity: !loaded ? 0 : (secondImage && hovered ? 0 : 1) }}
            transition={{ duration: 0.4, ease: EASE }}
            className={`absolute inset-0 h-full w-full object-cover transition-[filter] duration-500 ${loaded ? 'blur-0' : 'blur-md'}`}
          />
          {secondImage && (
            <motion.img
              src={secondImage}
              alt=""
              loading="lazy"
              animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1.045 : 1 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </Link>

        {badges.length > 0 && (
          <div className="absolute left-2.5 top-2.5 z-[2] flex flex-col gap-1.5">
            {badges.map(b => (
              <span key={b.label} className={`w-fit rounded-[5px] px-2 py-1 text-[11px] font-bold leading-none ${b.className}`}>
                {b.label}
              </span>
            ))}
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="absolute right-3 top-3 z-[2] grid h-9 w-9 place-items-center rounded-full bg-white/95 text-wine shadow-sm"
          onClick={() => { addToWishlist(product.id); toast(wished ? 'Removed from wishlist' : 'Saved to wishlist', { icon: wished ? '💔' : '❤️' }); }}
          aria-label="Add to wishlist"
        >
          <Heart size={17} fill={wished ? 'var(--color-gold)' : 'none'} />
        </motion.button>

        <motion.button
          initial={false}
          animate={{ y: hovered ? 0 : 14, opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="absolute inset-x-2.5 bottom-2.5 z-[2] flex h-9 items-center justify-center rounded-[6px] bg-wine-2/85 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm"
          onClick={() => onQuickView(product)}
        >
          Quick View
        </motion.button>
      </div>

      <div className="p-3.5">
        <Link to={`/product/${product.id}`}>
          <p className="line-clamp-2 min-h-[2.6em] text-[14px] font-medium leading-snug text-ink">{product.name}</p>
        </Link>

        <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
          <b className="text-[16px] font-bold text-wine">{money(product.price)}</b>
          {product.mrp > product.price && (
            <>
              <s className="text-[12px] text-muted">{money(product.mrp)}</s>
              <span className="text-[11px] font-bold text-wine">-{discountPercent(product.price, product.mrp)}%</span>
            </>
          )}
        </div>

        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {[product.fabric, product.pattern].filter(Boolean).slice(0, 2).map(tag => (
              <span key={tag} className="rounded-[4px] border border-ink/10 px-2 py-1 text-[10px] leading-none text-muted">
                {tag}
              </span>
            ))}
          </div>
          <motion.button
            whileHover={{ backgroundColor: 'var(--color-wine-2)' }}
            transition={{ duration: 0.2, ease: EASE }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[7px] bg-wine text-white"
            onClick={() => { addToCart(product); toast.success(`${product.name} added to cart`); }}
            aria-label="Add to bag"
          >
            <ShoppingBag size={16} />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

function QuickView({ product, onClose }) {
  const { addToCart } = useCart();
  if (!product) return null;
  const discount = discountPercent(product.price, product.mrp);
  return (
    <Modal title="Quick view" onClose={onClose}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="aspect-[4/5] overflow-hidden rounded-lg bg-ivory">
          <img src={mediaUrl(product)} alt="" className="h-full w-full object-cover" />
        </div>
        <div>
          <span className="eyebrow">{product.category}</span>
          <h3 className="mt-1 font-display text-2xl text-ink">{product.name}</h3>
          <div className="mt-2 flex items-center gap-2.5">
            <b className="text-xl text-wine">{money(product.price)}</b>
            {product.mrp > product.price && <s className="text-muted">{money(product.mrp)}</s>}
            {discount > 0 && <span className="text-sm font-bold text-wine">{discount}% off</span>}
          </div>
          <p className="mt-3 text-sm text-muted">{product.description}</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button className="btn-primary" onClick={() => { addToCart(product); toast.success(`${product.name} added to cart`); onClose(); }}>
              <ShoppingBag size={16} /> Add to bag
            </button>
            <Link className="btn-ghost" to={`/product/${product.id}`} onClick={onClose}>View full details</Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function MobileFilterSheet({ open, onClose, ...panelProps }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-ink/50 lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[81] max-h-[85vh] overflow-y-auto rounded-t-2xl bg-paper p-5 lg:hidden"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.4, ease: EASE }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[15px] font-bold text-ink">Filters</span>
              <button onClick={onClose} aria-label="Close filters"><X size={20} /></button>
            </div>
            <FiltersPanel {...panelProps} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Products() {
  const { category: routeCategory } = useParams();
  const [searchParams] = useSearchParams();
  const search = searchParams.get('q') || '';
  const category = routeCategory ? decodeURIComponent(routeCategory) : 'All';
  const [sort, setSort] = useState('featured');
  const [page, setPage] = useState(1);
  const [maxRange, setMaxRange] = useState([1000, 50000]);
  const [colour, setColour] = useState('');
  const [occasion, setOccasion] = useState('');
  const [fabric, setFabric] = useState('');
  const [workType, setWorkType] = useState('');
  const [pattern, setPattern] = useState('');
  const [availability, setAvailability] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const { allProducts } = useProducts({ category, sort });

  const inCategory = useMemo(
    () => (category === 'All' ? allProducts : allProducts.filter(p => p.category === category)),
    [allProducts, category]
  );

  const facetOptions = key => [...new Set(inCategory.map(p => p[key]).filter(Boolean))];
  const occasionOptions = facetOptions('occasion');
  const fabricOptions = facetOptions('fabric');
  const workOptions = facetOptions('workType');
  const patternOptions = facetOptions('pattern');

  const filtered = useMemo(() => {
    let result = inCategory.filter(p => Number(p.price) >= maxRange[0] && Number(p.price) <= maxRange[1]);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => [p.name, p.category, p.description, p.colour, p.fabric, p.occasion, p.sku].some(v => String(v || '').toLowerCase().includes(q)));
    }
    if (colour) result = result.filter(p => (p.colour || '').toLowerCase().includes(colour.toLowerCase()));
    if (occasion) result = result.filter(p => p.occasion === occasion);
    if (fabric) result = result.filter(p => p.fabric === fabric);
    if (workType) result = result.filter(p => p.workType === workType);
    if (pattern) result = result.filter(p => p.pattern === pattern);
    if (availability === 'in') result = result.filter(p => Number(p.stock ?? 0) > 2);
    else if (availability === 'low') result = result.filter(p => Number(p.stock ?? 0) > 0 && Number(p.stock ?? 0) <= 2);
    else result = result.filter(p => Number(p.stock ?? 0) > 0);

    if (sort === 'price-low') result = [...result].sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === 'price-high') result = [...result].sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === 'newest') result = [...result].sort((a, b) => (b.createdAt?.seconds || b.createdAt || 0) - (a.createdAt?.seconds || a.createdAt || 0));
    else result = [...result].sort((a, b) => Number(b.featured) - Number(a.featured));
    return result;
  }, [inCategory, maxRange, search, colour, occasion, fabric, workType, pattern, availability, sort]);

  const newIds = useMemo(() => {
    const sorted = [...inCategory].sort((a, b) => (b.createdAt?.seconds || b.createdAt || 0) - (a.createdAt?.seconds || a.createdAt || 0));
    return new Set(sorted.slice(0, 4).map(p => p.id));
  }, [inCategory]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageProducts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clearAll = () => {
    setMaxRange([1000, 50000]); setColour(''); setOccasion(''); setFabric(''); setWorkType(''); setPattern(''); setAvailability(''); setPage(1);
  };

  const panelProps = {
    maxRange, setMaxRange, colour, setColour, occasion, setOccasion, occasionOptions,
    fabric, setFabric, fabricOptions, workType, setWorkType, workOptions,
    pattern, setPattern, patternOptions, availability, setAvailability,
    onApply: () => { setPage(1); setMobileFiltersOpen(false); }, onClear: clearAll,
  };

  return (
    <div className="bg-ivory">
      <div className="mx-auto max-w-[1440px] px-5 py-4 sm:px-10">
        <nav className="flex items-center gap-1.5 text-[12px] text-muted">
          <Link to="/" className="hover:text-wine">Home</Link>
          <ChevronRight size={12} />
          <Link to="/products" className="hover:text-wine">Sarees</Link>
          {category !== 'All' && (<><ChevronRight size={12} /><span className="text-ink">{category} Sarees</span></>)}
        </nav>
      </div>

      <div className="mx-auto max-w-[1440px] px-5 pb-5 sm:px-10">
        <h1 className="font-display text-[36px] font-semibold tracking-tight text-ink sm:text-[42px]">
          {search ? `Results for "${search}"` : category === 'All' ? 'All Sarees' : `${category} Sarees`}
        </h1>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">Timeless weaves, rich zari and unmatched craftsmanship. Discover our exclusive collection of authentic sarees.</p>
      </div>

      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-5 pb-6 sm:px-10">
        <div className="hidden flex-1 items-center gap-2 sm:flex">
          <span className="h-px flex-1 bg-gold/25" />
          <span className="h-1.5 w-1.5 rotate-45 border border-gold" />
          <span className="h-px flex-1 bg-gold/25" />
        </div>
        <div className="flex flex-1 items-center justify-between gap-3 sm:flex-none sm:justify-end">
          <button
            className="flex h-10 items-center gap-1.5 rounded-[7px] border border-ink/15 px-3 text-[12px] font-semibold text-ink lg:hidden"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersHorizontal size={14} /> Filter
          </button>
          <span className="whitespace-nowrap text-[13px] text-muted">{filtered.length} Products</span>
          <select
            className="h-[44px] w-[240px] rounded-[7px] border border-ink/15 bg-paper px-3 text-[12px] text-ink outline-none"
            value={sort}
            onChange={e => { setSort(e.target.value); setPage(1); }}
          >
            <option value="featured">Sort by: Featured</option>
            <option value="newest">Sort by: Newest</option>
            <option value="price-low">Sort by: Price low to high</option>
            <option value="price-high">Sort by: Price high to low</option>
          </select>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-5 pb-16 sm:px-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden h-fit rounded-[9px] border border-ink/10 bg-paper p-4 shadow-[var(--shadow-soft)] lg:block">
          <FiltersPanel {...panelProps} />
        </aside>

        <div>
          {!pageProducts.length ? (
            <div className="rounded-lg border border-dashed border-ink/15 p-12 text-center text-muted">
              No sarees match these filters. Try clearing a few.
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 gap-x-[22px] gap-y-[28px] md:grid-cols-3 xl:grid-cols-4"
              initial="hidden" animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
            >
              {pageProducts.map((p, i) => (
                <PremiumProductCard key={p.id} product={p} index={i} newIds={newIds} onQuickView={setQuickViewProduct} />
              ))}
            </motion.div>
          )}
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <div className="border-t border-ink/10 bg-paper">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-6 px-5 py-8 sm:grid-cols-3 sm:px-10 md:grid-cols-5">
          {trustBar.map(t => (
            <div key={t.title} className="flex items-center gap-3">
              <t.icon size={26} className="shrink-0 text-gold" strokeWidth={1.5} />
              <div>
                <b className="block text-[13px] text-ink">{t.title}</b>
                <span className="text-[11px] text-muted">{t.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <MobileFilterSheet open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} {...panelProps} />
      <AnimatePresence>
        {quickViewProduct && <QuickView product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />}
      </AnimatePresence>
    </div>
  );
}
