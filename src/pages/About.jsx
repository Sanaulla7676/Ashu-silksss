import Breadcrumbs from '../components/Breadcrumbs';
import { Award, Heart, ShieldCheck, Sparkles } from 'lucide-react';

export default function About() {
  return (
    <>
      <Breadcrumbs items={[{ label: 'About' }]} />
      <section className="section page-section story">
        <div className="container story-grid">
          <div className="story-art">A</div>
          <div>
            <span className="eyebrow">Our Story</span>
            <h1>Ashu Silks</h1>
            <p className="lead">
              Ashu Silks brings together traditional Indian craftsmanship and modern shopping convenience.
              From rich bridal Kanjeevarams to breathable cotton sarees, every drape is chosen for beauty,
              comfort and lasting value.
            </p>
            <p>
              Visit our Bengaluru store for personal recommendations, or shop online with easy enquiry,
              WhatsApp support and order placement.
            </p>
            <div className="mini-grid about-values">
              <div className="feature"><div className="feature-icon"><Sparkles /></div><h3>Curated Designs</h3><p>Only sarees that feel premium and photograph beautifully.</p></div>
              <div className="feature"><div className="feature-icon"><ShieldCheck /></div><h3>Trusted Quality</h3><p>Fabric and finishing checked before every purchase.</p></div>
              <div className="feature"><div className="feature-icon"><Heart /></div><h3>Personal Care</h3><p>Friendly enquiry support for every customer.</p></div>
              <div className="feature"><div className="feature-icon"><Award /></div><h3>Wedding Ready</h3><p>Bridal selections for every ceremony and style.</p></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
