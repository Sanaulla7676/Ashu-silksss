import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, MessageCircle, Sparkles } from 'lucide-react';
import { storeInfo } from '../data';

const linkClass = 'flex items-start gap-2 text-white/72 transition-colors hover:text-gold-2';

export default function Footer() {
  return (
    <footer className="bg-wine-2 py-14 text-white">
      <div className="container grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <h3 className="flex items-center gap-2 font-display text-gold-2">
            <Sparkles size={20} /> {storeInfo.name}
          </h3>
          <p className="mt-3 text-white/72">{storeInfo.tagline}</p>
          <p className="mt-2 text-white/72">Premium sarees for weddings, festivals and everyday elegance.</p>
        </div>
        <div>
          <h3 className="font-display text-gold-2">Shop</h3>
          <div className="mt-3 flex flex-col gap-2.5">
            <Link className={linkClass} to="/products">All Products</Link>
            <Link className={linkClass} to="/products/Kanjeevaram Silk">Kanjeevaram</Link>
            <Link className={linkClass} to="/products/Bridal">Bridal</Link>
            <Link className={linkClass} to="/products/Designer">Designer</Link>
          </div>
        </div>
        <div>
          <h3 className="font-display text-gold-2">Customer Care</h3>
          <div className="mt-3 flex flex-col gap-2.5">
            <Link className={linkClass} to="/cart">Cart</Link>
            <Link className={linkClass} to="/wishlist">Wishlist</Link>
            <Link className={linkClass} to="/orders">Orders</Link>
            <Link className={linkClass} to="/contact">Enquire</Link>
          </div>
        </div>
        <div>
          <h3 className="font-display text-gold-2">Visit</h3>
          <div className="mt-3 flex flex-col gap-2.5">
            <p className={linkClass}><Phone size={14} className="mt-1 shrink-0" /> {storeInfo.phone}</p>
            <p className={linkClass}><Clock size={14} className="mt-1 shrink-0" /> {storeInfo.hours}</p>
            <p className={linkClass}><MapPin size={14} className="mt-1 shrink-0" /> {storeInfo.address}</p>
            <a className={linkClass} href={`https://wa.me/${storeInfo.whatsapp}`} target="_blank" rel="noreferrer">
              <MessageCircle size={14} className="mt-1 shrink-0" /> WhatsApp us
            </a>
          </div>
        </div>
      </div>
      <div className="container mt-10 border-t border-white/10 pt-6 text-xs text-white/50">
        © {new Date().getFullYear()} {storeInfo.name}. All rights reserved.
      </div>
    </footer>
  );
}
