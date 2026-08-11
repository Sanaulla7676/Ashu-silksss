import { Link } from 'react-router-dom';
import { ShoppingBag, MessageCircle, Truck, ShieldCheck, Scissors, Award, Sparkles } from 'lucide-react';
import ProductGrid from '../components/ProductGrid';
import { useProducts } from '../hooks/useProducts';

export default function Home() {
  const { featuredProducts, categories } = useProducts();

  return (
    <>
      <section className="hero hero-fullscreen">
        <video className="hero-video-bg" src="/ashuvedio.mp4" autoPlay muted playsInline loop />
        <div className="hero-overlay" />
        <div className="container hero-content">
          <div className="hero-text">
            <span className="pill"><Sparkles size={16} /> Premium Bengaluru Sarees</span>
            <h1>Silks chosen like heirlooms.</h1>
            <p>
              Discover Kanjeevaram, bridal, designer and cotton sarees curated for weddings,
              festivals and everyday elegance. Shop online, enquire instantly, or visit our store.
            </p>
            <div className="hero-actions">
              <Link className="btn primary" to="/products">
                <ShoppingBag size={18} /> Shop Collection
              </Link>
              <Link className="btn ghost" to="/contact">
                <MessageCircle size={18} /> Enquire Now
              </Link>
            </div>
            <div className="stats">
              <div><b>500+</b><span>Curated sarees</span></div>
              <div><b>4.8★</b><span>Customer love</span></div>
              <div><b>10 PM</b><span>Open daily</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Why Ashu Silks</span>
              <h2>Luxury service, simple shopping</h2>
            </div>
          </div>
          <div className="feature-grid">
            <div className="feature"><div className="feature-icon"><Truck /></div><h3>Fast Delivery</h3><p>Carefully packed sarees delivered across Bengaluru and India.</p></div>
            <div className="feature"><div className="feature-icon"><ShieldCheck /></div><h3>Quality Checked</h3><p>Every saree is inspected for fabric, zari and finishing before dispatch.</p></div>
            <div className="feature"><div className="feature-icon"><Scissors /></div><h3>Blouse Support</h3><p>Ask us about blouse matching and finishing options.</p></div>
            <div className="feature"><div className="feature-icon"><Award /></div><h3>Wedding Ready</h3><p>Premium bridal picks for receptions, engagements and festivals.</p></div>
          </div>
        </div>
      </section>

      <section className="section story">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Featured Collection</span>
              <h2>Customer favourites</h2>
              <p>Handpicked sarees with beautiful texture, rich colours and festive presence.</p>
            </div>
            <Link className="btn dark" to="/products">View all</Link>
          </div>
          <ProductGrid products={featuredProducts} />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Shop by Style</span>
              <h2>Explore categories</h2>
            </div>
          </div>
          <div className="category-grid">
            {categories.filter(c => c !== 'All').map(category => (
              <Link key={category} className="category-card" to={`/products/${encodeURIComponent(category)}`}>
                <span>{category}</span>
                <b>Shop now</b>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
