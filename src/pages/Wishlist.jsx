import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductGrid from '../components/ProductGrid';
import { useWishlist } from '../hooks/useWishlist';
import { fetchLiveProducts } from '../services/liveCatalog';

export default function Wishlist() {
  const { wishlist } = useWishlist();
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    let active = true;
    fetchLiveProducts().then(items => { if (active) setCatalog(items); });
    return () => { active = false; };
  }, []);

  const products = catalog.filter(p => wishlist.includes(p.id));

  return (
    <>
      <Breadcrumbs items={[{ label: 'Wishlist' }]} />
      <section className="pb-16 pt-2 md:pb-24">
        <div className="container">
          <div className="mb-6">
            <span className="eyebrow">Saved Products</span>
            <h2 className="heading-xl">Your Wishlist</h2>
            <p className="text-muted">Keep your favourite sarees ready for later.</p>
          </div>
          {products.length ? <ProductGrid products={products} /> : (
            <div className="rounded-md border border-dashed border-ink/15 bg-paper p-10 text-center text-muted">
              <Heart size={48} className="mx-auto mb-3 text-gold" />
              <h3 className="font-display text-ink">No wishlist items yet</h3>
              <p className="mt-1">Tap the heart on any saree to save it here.</p>
              <Link className="btn-primary mt-4 inline-flex" to="/products">Browse sarees</Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
