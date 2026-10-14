import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingBag, Heart, ArrowRight, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ProductMedia from './ProductMedia';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { money, mediaUrl, discountPercent } from '../utils';

const EASE = [0.22, 1, 0.36, 1];

export default function QuickViewModal({ product, onClose }) {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [active, setActive] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => { setActive(0); setAdded(false); }, [product?.id]);

  // Close on Escape and stop the page behind from scrolling.
  useEffect(() => {
    if (!product) return undefined;
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [product, onClose]);

  const gallery = product && Array.isArray(product.media) && product.media.length
    ? product.media.filter(Boolean)
    : product ? [mediaUrl(product)] : [];
  const discount = product ? discountPercent(product.price, product.mrp) : 0;
  const wished = product ? isInWishlist(product.id) : false;

  const facts = product
    ? [
        ['Fabric', product.fabric],
        ['Colour', product.colour],
        ['Occasion', product.occasion],
        ['Work', product.workType],
        ['Pattern', product.pattern],
        ['Blouse', product.blousePiece],
      ].filter(([, v]) => v)
    : [];

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/55 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Quick view — ${product.name}`}
        >
          <motion.div
            className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-[20px] bg-paper sm:max-w-[900px] sm:rounded-[16px]"
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.42, ease: EASE }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              aria-label="Close quick view"
              className="absolute right-3 top-3 z-[3] grid h-9 w-9 place-items-center rounded-full bg-paper/90 text-ink shadow-sm backdrop-blur transition-transform hover:rotate-90"
            >
              <X size={17} />
            </button>

            <div className="grid gap-0 sm:grid-cols-[1.05fr_1fr]">
              {/* Gallery */}
              <div className="bg-ivory">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={gallery[active]}
                      className="h-full w-full"
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.45, ease: EASE }}
                    >
                      <ProductMedia url={gallery[active]} />
                    </motion.div>
                  </AnimatePresence>
                  {discount > 0 && (
                    <span className="absolute left-3 top-3 rounded-[4px] bg-wine px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                      {discount}% off
                    </span>
                  )}
                </div>

                {gallery.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto p-3">
                    {gallery.map((url, i) => (
                      <button
                        key={url}
                        onClick={() => setActive(i)}
                        aria-label={`View photo ${i + 1}`}
                        className={`h-14 w-12 shrink-0 overflow-hidden rounded-[6px] transition-all duration-300 ${
                          i === active ? 'ring-2 ring-wine ring-offset-1' : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        <ProductMedia url={url} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex flex-col p-5 sm:p-7">
                <span className="text-[10px] uppercase tracking-[0.24em] text-gold">{product.category}</span>
                <h3 className="mt-2 font-display text-[27px] leading-tight text-ink">{product.name}</h3>

                <div className="mt-3 flex items-baseline gap-2.5">
                  <span className="font-display text-[26px] text-ink">{money(product.price)}</span>
                  {discount > 0 && <s className="text-[13px] text-muted">{money(product.mrp)}</s>}
                </div>

                {product.description && (
                  <p className="mt-3.5 text-[13px] leading-[1.75] text-muted">{product.description}</p>
                )}

                {facts.length > 0 && (
                  <dl className="mt-4 grid grid-cols-2 gap-2.5">
                    {facts.map(([label, value]) => (
                      <div key={label} className="rounded-[8px] bg-ivory px-3 py-2">
                        <dt className="text-[9.5px] uppercase tracking-[0.14em] text-muted">{label}</dt>
                        <dd className="mt-0.5 text-[12.5px] text-ink">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {Number(product.stock ?? 0) > 0 ? (
                  <p className="mt-4 text-[12px] font-medium text-success">
                    {product.stock} in stock
                  </p>
                ) : (
                  <p className="mt-4 text-[12px] font-medium text-muted">Currently unavailable</p>
                )}

                <div className="mt-auto flex flex-col gap-2.5 pt-5">
                  <button
                    onClick={() => {
                      addToCart(product);
                      setAdded(true);
                      setTimeout(() => setAdded(false), 1600);
                      toast.success(`${product.name} added to bag`);
                    }}
                    className="as-shine flex items-center justify-center gap-2 rounded-[6px] bg-wine py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
                  >
                    {added ? <Check size={14} /> : <ShoppingBag size={14} />}
                    {added ? 'Added to bag' : 'Add to Bag'}
                  </button>

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => {
                        addToWishlist(product.id);
                        toast(wished ? 'Removed from wishlist' : 'Saved to wishlist', { icon: wished ? '💔' : '❤️' });
                      }}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-[6px] border py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                        wished ? 'border-wine bg-wine/10 text-wine' : 'border-ink/15 text-ink hover:bg-ivory'
                      }`}
                    >
                      <Heart size={13} fill={wished ? 'currentColor' : 'none'} />
                      {wished ? 'Saved' : 'Wishlist'}
                    </button>
                    <Link
                      to={`/product/${product.id}`}
                      onClick={onClose}
                      className="group flex flex-1 items-center justify-center gap-1.5 rounded-[6px] border border-ink/15 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ivory"
                    >
                      Full details
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
