import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ShoppingBag, Heart, Menu, X, Phone, MapPin, UserCircle, Sparkles, LogOut } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../context/AuthContext';
import { storeInfo } from '../data';

export default function Header() {
  const [open, setOpen] = useState(false);
  const { getItemCount } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout } = useAuth();
  const close = () => setOpen(false);

  return <>
    <div className="topbar"><div className="container topbar-inner"><span><Phone size={14} /> {storeInfo.phone}</span><span><MapPin size={14} /> {storeInfo.address}</span><Link to="/contact">Visit store</Link></div></div>
    <header><nav className="container nav">
      <Link className="brand" to="/" onClick={close}><span className="mark"><Sparkles size={24} /></span><span>Ashu Silks</span></Link>
      <div className={`links ${open ? 'open' : ''}`}><NavLink to="/" onClick={close}>Home</NavLink><NavLink to="/products" onClick={close}>Shop</NavLink><NavLink to="/products/Bridal" onClick={close}>Bridal</NavLink><NavLink to="/about" onClick={close}>About</NavLink><NavLink to="/contact" onClick={close}>Contact</NavLink></div>
      <div className="nav-actions">
        <Link className="icon" to="/wishlist" aria-label="Wishlist"><Heart size={20} />{wishlist.length > 0 && <span>{wishlist.length}</span>}</Link>
        <Link className="icon" to="/cart" aria-label="Cart"><ShoppingBag size={20} />{getItemCount() > 0 && <span>{getItemCount()}</span>}</Link>
        {user ? <button className="icon hide-mobile" onClick={logout} aria-label="Sign out" title={user.email || 'Sign out'}><LogOut size={20} /></button> : <Link className="icon hide-mobile" to="/account" aria-label="Sign in"><UserCircle size={20} /></Link>}
        <button className="icon burger" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
    </nav></header>
  </>;
}
