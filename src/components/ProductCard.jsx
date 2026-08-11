import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Eye, Star } from 'lucide-react';
import ProductMedia from './ProductMedia';
import { money, mediaUrl, discountPercent } from '../utils';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const discount = discountPercent(product.price, product.mrp);
  const wished = isInWishlist(product.id);

  return (
    <article className="card product-card">
      <div className="media">
        <Link to={`/product/${product.id}`}>
          <ProductMedia url={mediaUrl(product)} />
        </Link>
        {product.featured && <span className="tag">Featured</span>}
        {discount > 0 && <span className="discount-badge">{discount}% OFF</span>}
        <span className={`stock ${product.stock <= 2 ? 'low' : ''}`}>
          {product.stock <= 2 ? 'Low stock' : 'In stock'}
        </span>
        <button
          className="wishlist-float"
          onClick={() => addToWishlist(product.id)}
          aria-label="Add to wishlist"
        >
          <Heart size={18} fill={wished ? '#c9a227' : 'none'} />
        </button>
      </div>

      <div className="card-body">
        <div className="rating-row">
          <span><Star size={14} fill="#c9a227" /> 4.8</span>
          <span>{product.category}</span>
        </div>
        <Link to={`/product/${product.id}`}>
          <h3>{product.name}</h3>
        </Link>
        <p>{product.description}</p>
        <div className="price-row">
          <b>{money(product.price)}</b>
          {product.mrp && <s>{money(product.mrp)}</s>}
        </div>
        <div className="card-actions three">
          <button className="btn primary" onClick={() => addToCart(product)}>
            <ShoppingBag size={16} /> Add
          </button>
          <Link className="btn ghost" to={`/product/${product.id}`}>
            <Eye size={16} /> View
          </Link>
        </div>
      </div>
    </article>
  );
}
