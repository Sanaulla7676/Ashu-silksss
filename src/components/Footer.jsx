import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, MessageCircle, Sparkles } from 'lucide-react';
import { storeInfo } from '../data';

export default function Footer() {
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <h3><Sparkles size={20} /> {storeInfo.name}</h3>
          <p>{storeInfo.tagline}</p>
          <p>Premium sarees for weddings, festivals and everyday elegance.</p>
        </div>
        <div>
          <h3>Shop</h3>
          <Link to="/products">All Products</Link>
          <Link to="/products/Kanjeevaram Silk">Kanjeevaram</Link>
          <Link to="/products/Bridal">Bridal</Link>
          <Link to="/products/Designer">Designer</Link>
        </div>
        <div>
          <h3>Customer Care</h3>
          <Link to="/cart">Cart</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/contact">Enquire</Link>
        </div>
        <div>
          <h3>Visit</h3>
          <p><Phone size={14} /> {storeInfo.phone}</p>
          <p><Clock size={14} /> {storeInfo.hours}</p>
          <p><MapPin size={14} /> {storeInfo.address}</p>
          <a href={`https://wa.me/${storeInfo.whatsapp}`} target="_blank" rel="noreferrer">
            <MessageCircle size={14} /> WhatsApp us
          </a>
        </div>
      </div>
    </footer>
  );
}
