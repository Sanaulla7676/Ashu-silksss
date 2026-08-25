import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star, BadgeCheck, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ProductMedia from './ProductMedia';
import { money, mediaUrl, discountPercent } from '../utils';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const discount = discountPercent(product.price, product.mrp);
  const wished = isInWishlist(product.id);

  const handleAdd = e => {
    e.preventDefault();
    addToCart(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlist = e => {
    e.preventDefault();
    addToWishlist(product.id);
    toast(wished ? 'Removed from wishlist' : 'Saved to wishlist', { icon: wished ? '💔' : '❤️' });
  };

  return (
    <motion.article
      className="card-surface group relative overflow-hidden transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.14)]"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-ivory">
          <div className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]">
            <ProductMedia url={mediaUrl(product)} />
          </div>
          {discount > 0 && (
            <span className="absolute left-2 top-2 z-[2] rounded-sm bg-gold px-1.5 py-0.5 text-[0.68rem] font-bold text-white">{discount}% OFF</span>
          )}
          <button
            className="absolute right-2 top-2 z-[3] grid h-8 w-8 place-items-center rounded-full bg-white/95 text-ink/60 shadow-[var(--shadow-soft)] transition-colors hover:text-danger"
            onClick={handleWishlist}
            aria-label="Add to wishlist"
          >
            <Heart size={16} fill={wished ? '#cc0c39' : 'none'} stroke={wished ? '#cc0c39' : 'currentColor'} />
          </button>
          {product.stock <= 2 && (
            <span className="absolute bottom-2 left-2 z-[2] rounded-sm bg-danger/90 px-1.5 py-0.5 text-[0.66rem] font-bold text-white">Only {product.stock} left</span>
          )}
        </div>

        <div className="p-3">
          <p className="mb-1 line-clamp-2 min-h-[2.5em] text-[0.86rem] font-medium text-ink">{product.name}</p>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-sm bg-success px-1.5 py-0.5 text-[0.72rem] font-bold text-white">
              4.8 <Star size={10} fill="#fff" stroke="none" />
            </span>
            <span className="truncate text-[0.76rem] text-muted">{product.category}</span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-baseline gap-1.5">
            <b className="text-[1.05rem] font-bold text-ink">{money(product.price)}</b>
            {product.mrp && <s className="text-[0.8rem] text-muted">{money(product.mrp)}</s>}
            {discount > 0 && <span className="text-[0.8rem] font-semibold text-success">{discount}% off</span>}
          </div>

          {product.featured && (
            <div className="mt-1 flex items-center gap-1 text-[0.72rem] font-bold text-wine">
              <BadgeCheck size={13} /> Ashu Assured
            </div>
          )}
          <div className="mt-1 flex items-center gap-1 text-[0.72rem] text-muted">
            <Truck size={12} /> Free delivery
          </div>
        </div>
      </Link>

      <div className="px-3 pb-3">
        <button className="btn-primary w-full py-2! text-[0.78rem]!" onClick={handleAdd}>
          <ShoppingBag size={14} /> Add to cart
        </button>
      </div>
    </motion.article>
  );
}
