import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductGrid from '../components/ProductGrid';
import { useWishlist } from '../hooks/useWishlist';
import { demoProducts } from '../data';

export default function Wishlist() {
  const { wishlist } = useWishlist();
  const products = demoProducts.filter(p => wishlist.includes(p.id));

  return (
    <>
      <Breadcrumbs items={[{ label: 'Wishlist' }]} />
      <section className="section page-section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Saved Products</span>
              <h2>Your Wishlist</h2>
              <p>Keep your favourite sarees ready for later.</p>
            </div>
          </div>
          {products.length ? <ProductGrid products={products} /> : (
            <div className="empty">
              <Heart size={54} />
              <h3>No wishlist items yet</h3>
              <p>Tap the heart on any saree to save it here.</p>
              <Link className="btn primary" to="/products">Browse sarees</Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
