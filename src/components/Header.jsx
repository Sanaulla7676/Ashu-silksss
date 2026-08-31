import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Menu, X, Search, UserCircle, Sparkles, LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../context/AuthContext';

const categories = [
  { to: '/products', label: 'All' },
  { to: '/products/Kanjeevaram Silk', label: 'Kanjeevaram' },
  { to: '/products/Bridal', label: 'Bridal' },
  { to: '/products/Designer', label: 'Designer' },
  { to: '/products/Cotton', label: 'Cotton' },
  { to: '/products/Tissue Silk', label: 'Tissue Silk' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { getItemCount } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout } = useAuth();
  const close = () => setOpen(false);
  const cartCount = getItemCount();

  const submitSearch = e => {
    e.preventDefault();
    navigate(query.trim() ? `/products?q=${encodeURIComponent(query.trim())}` : '/products');
  };

  return (
    <header className="sticky top-0 z-20">
      <div className="bg-wine">
        <div className="container flex items-center gap-4 py-2.5 sm:py-3">
          <Link className="flex shrink-0 flex-col leading-none text-white" to="/" onClick={close}>
            <span className="flex items-center gap-1.5 font-display text-xl font-semibold tracking-wide sm:text-2xl"><Sparkles size={18} /> Ashu Silks</span>
            <span className="hidden text-[0.68rem] font-medium text-gold-2 sm:block">Pure Silk Emporium</span>
          </Link>

          <form className="hidden flex-1 items-center gap-2 rounded bg-white px-3.5 py-2.5 text-ink sm:flex" onSubmit={submitSearch}>
            <Search size={18} className="shrink-0 text-muted" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
              placeholder="Search for sarees, fabric, colour..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </form>

          <div className="ml-auto flex items-center gap-1 sm:ml-0">
            {user ? (
              <button className="hidden items-center gap-1.5 rounded bg-white px-4 py-2 text-sm font-bold text-wine sm:flex" onClick={logout}>
                <LogOut size={16} /> Sign out
              </button>
            ) : (
              <Link className="hidden items-center gap-1.5 rounded bg-white px-4 py-2 text-sm font-bold text-wine sm:flex" to="/account">
                <UserCircle size={16} /> Login
              </Link>
            )}
            <Link className="icon-btn text-white hover:bg-white/10" to="/wishlist" aria-label="Wishlist">
              <Heart size={20} />
              {wishlist.length > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-gold text-[0.65rem] font-bold text-white">{wishlist.length}</span>
              )}
            </Link>
            <Link className="icon-btn text-white hover:bg-white/10" to="/cart" aria-label="Cart">
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-gold text-[0.65rem] font-bold text-white">{cartCount}</span>
              )}
            </Link>
            <button className="icon-btn text-white hover:bg-white/10 sm:hidden" onClick={() => setOpen(o => !o)} aria-label="Menu">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        <form className="container flex items-center gap-2 rounded bg-white px-3.5 py-2.5 text-ink sm:hidden" onSubmit={submitSearch} style={{ marginBottom: '10px' }}>
          <Search size={18} className="shrink-0 text-muted" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
            placeholder="Search for sarees, fabric, colour..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="hidden border-b border-ink/10 bg-paper sm:block">
        <div className="container flex gap-7 overflow-x-auto py-3 text-sm font-medium text-ink">
          {categories.map(c => (
            <NavLink
              key={c.to}
              to={c.to}
              className={({ isActive }) => `shrink-0 whitespace-nowrap transition-colors hover:text-wine ${isActive ? 'font-bold text-wine' : ''}`}
            >
              {c.label}
            </NavLink>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="border-b border-ink/10 bg-paper shadow-[var(--shadow-lift)] sm:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="container flex flex-col gap-1 py-3">
              {categories.map(c => (
                <NavLink
                  key={c.to}
                  to={c.to}
                  onClick={close}
                  className={({ isActive }) => `rounded px-3 py-2.5 font-semibold ${isActive ? 'bg-wine/10 text-wine' : 'text-ink'}`}
                >
                  {c.label}
                </NavLink>
              ))}
              {user ? (
                <button className="flex items-center gap-2 rounded px-3 py-2.5 text-left font-semibold text-ink" onClick={() => { logout(); close(); }}>
                  <LogOut size={18} /> Sign out
                </button>
              ) : (
                <Link className="flex items-center gap-2 rounded px-3 py-2.5 font-semibold text-ink" to="/account" onClick={close}>
                  <UserCircle size={18} /> Login / Sign up
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
