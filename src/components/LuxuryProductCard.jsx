import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight, Check } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import toast from 'react-hot-toast';
import ProductMedia from './ProductMedia';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useImagePalette } from '../hooks/useImagePalette';
import { money, mediaUrl, discountPercent } from '../utils';

const EASE = [0.22, 1, 0.36, 1];

export const cardReveal = {
  hidden: { opacity: 0, y: 54, filter: 'blur(7px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE } },
};

// Editorial lines shown over the photo, chosen by what the saree is for.
const TAGLINES = {
  'Kanjeevaram Silk': ['A heritage', 'that lives', 'forever'],
  Bridal: ['Made', 'for your', 'special days'],
  Designer: ['Grace', 'in every', 'occasion'],
  Cotton: ['Simplicity', 'that never', 'fades'],
  'Tissue Silk': ['Soft', 'like a', 'story'],
  default: ['Woven', 'with', 'intent'],
};

function taglineFor(product) {
  return TAGLINES[product.category] || TAGLINES.default;
}

function subtitleFor(product) {
  const parts = [product.fabric, product.workType || product.pattern].filter(Boolean);
  if (parts.length) return parts.join(' · ');
  if (product.occasion) return product.occasion;
  return 'Pure silk · Handwoven';
}

export default function LuxuryProductCard({ product, badge }) {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const wished = isInWishlist(product.id);
  const image = mediaUrl(product);
  const palette = useImagePalette(image);
  const discount = discountPercent(product.price, product.mrp);

  const [heartPop, setHeartPop] = useState(false);
  const [added, setAdded] = useState(false);

  // Pointer-follow tilt on the photo.
  const frameRef = useRef(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [6, -6]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-7, 7]), { stiffness: 200, damping: 20 });

  const onPointerMove = e => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };
  const resetTilt = () => { px.set(0.5); py.set(0.5); };

  const swatches = palette.slice(0, 4);
  const extraSwatches = Math.max(palette.length - 4, 0);
  const tagline = taglineFor(product);

  const handleAdd = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
    toast.success(`${product.name} added to bag`);
  };

  return (
    <motion.article
      variants={cardReveal}
      className="group relative flex flex-col overflow-hidden rounded-[14px] border border-ink/[0.07] bg-paper shadow-[0_2px_14px_-6px_rgba(37,25,15,.16)] transition-all duration-[550ms] ease-out hover:-translate-y-1.5 hover:shadow-[0_28px_54px_-24px_rgba(37,25,15,.45)]"
      style={{ perspective: 1000 }}
    >
      {/* PHOTO */}
      <div
        ref={frameRef}
        onPointerMove={onPointerMove}
        onPointerLeave={resetTilt}
        className="relative aspect-[1.06] overflow-hidden bg-ivory"
      >
        <Link to={`/product/${product.id}`} className="block h-full w-full">
          <motion.div
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className="h-full w-full"
          >
            <div className="h-full w-full scale-[1.04] transition-transform duration-[900ms] ease-out group-hover:scale-[1.13]">
              <ProductMedia url={image} />
            </div>
          </motion.div>

          {/* Legibility wash behind the overlay copy */}
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(28,20,14,.46)_0%,rgba(28,20,14,.12)_46%,transparent_72%)]" />
          {/* Warm sweep on hover */}
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(28,20,14,.34),transparent_58%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </Link>

        {/* Badge */}
        {badge && (
          <motion.span
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
            className="as-shine absolute left-3 top-3 z-[3] rounded-[4px] bg-paper/95 px-2.5 py-[6px] text-[8.5px] font-semibold uppercase tracking-[0.16em] text-ink shadow-sm backdrop-blur"
          >
            {badge}
          </motion.span>
        )}

        {/* Wishlist */}
        <motion.button
          animate={heartPop ? { scale: [1, 1.4, 0.9, 1] } : { scale: 1 }}
          transition={{ duration: 0.45, ease: EASE }}
          whileTap={{ scale: 0.86 }}
          onClick={() => {
            setHeartPop(true);
            setTimeout(() => setHeartPop(false), 460);
            addToWishlist(product.id);
            toast(wished ? 'Removed from wishlist' : 'Saved to wishlist', { icon: wished ? '💔' : '❤️' });
          }}
          aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'}
          className={`absolute right-3 top-3 z-[3] grid h-[34px] w-[34px] place-items-center rounded-full shadow-sm backdrop-blur transition-colors duration-300 ${
            wished ? 'bg-wine text-white' : 'bg-paper/95 text-ink hover:bg-white'
          }`}
        >
          <Heart size={14.5} fill={wished ? 'currentColor' : 'none'} />
        </motion.button>

        {/* Editorial line over the photo */}
        <div className="pointer-events-none absolute left-4 top-[52px] z-[2] select-none">
          {tagline.map((line, i) => (
            <motion.span
              key={line}
              initial={{ opacity: 0, x: -14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.25 + i * 0.09 }}
              className="block text-[10.5px] uppercase leading-[1.55] tracking-[0.15em] text-white/92 drop-shadow-[0_1px_6px_rgba(0,0,0,.5)]"
            >
              {line}
            </motion.span>
          ))}
        </div>

        {discount > 0 && (
          <span className="absolute bottom-3 left-3 z-[3] rounded-[4px] bg-wine px-2.5 py-[5px] text-[9px] font-bold uppercase tracking-[0.12em] text-white">
            {discount}% off
          </span>
        )}
      </div>

      {/* DETAILS */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-[15px]">
        <Link
          to={`/product/${product.id}`}
          className="font-display text-[19px] leading-tight text-ink transition-colors duration-300 group-hover:text-wine"
        >
          {product.name}
        </Link>
        <p className="mt-[3px] text-[11.5px] text-muted">{subtitleFor(product)}</p>

        {/* Colours actually present in the photograph */}
        {swatches.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5" title="Colours in this saree">
            {swatches.map((c, i) => (
              <motion.span
                key={`${c}-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 340, damping: 18, delay: 0.15 + i * 0.07 }}
                className="h-[17px] w-[17px] rounded-full ring-1 ring-ink/10 transition-transform duration-300 hover:scale-125"
                style={{ background: c }}
              />
            ))}
            {extraSwatches > 0 && (
              <span className="ml-0.5 text-[10.5px] text-muted">+{extraSwatches}</span>
            )}
          </div>
        )}

        {product.description && (
          <p className="mt-2.5 line-clamp-2 text-[11.5px] leading-[1.65] text-muted">{product.description}</p>
        )}

        <div className="mt-3.5 flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[21px] text-ink">{money(product.price)}</span>
            {discount > 0 && <s className="text-[11px] text-muted">{money(product.mrp)}</s>}
          </div>
          <Link
            to={`/product/${product.id}`}
            className="group/link inline-flex shrink-0 items-center gap-1.5 text-[11.5px] text-muted transition-colors hover:text-wine"
          >
            View Details
            <ArrowRight size={12} className="transition-transform duration-300 group-hover/link:translate-x-1" />
          </Link>
        </div>

        <button
          onClick={handleAdd}
          className="relative mt-3.5 flex w-full items-center justify-center gap-2 overflow-hidden rounded-[6px] bg-ivory py-[11px] text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink transition-colors duration-500 hover:text-white"
        >
          {/* Fill sweeps in from the left on hover */}
          <span className="absolute inset-0 -translate-x-full bg-gold transition-transform duration-500 ease-out group-hover:translate-x-0" />
          <span className="relative z-[1] flex items-center gap-2">
            {added ? <Check size={13} /> : <ShoppingBag size={13} />}
            {added ? 'Added' : 'Add to Bag'}
          </span>
        </button>
      </div>
    </motion.article>
  );
}
