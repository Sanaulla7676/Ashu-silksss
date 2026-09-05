import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Menu, X, Search, UserCircle, LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../context/AuthContext';

const categories = [
  { to: '/products', label: 'All', end: true },
  { to: '/products/Kanjeevaram Silk', label: 'Kanjeevaram' },
  { to: '/products/Bridal', label: 'Bridal' },
  { to: '/products/Designer', label: 'Designer' },
  { to: '/products/Cotton', label: 'Cotton' },
  { to: '/products/Tissue Silk', label: 'Tissue Silk' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const EASE = [0.22, 1, 0.36, 1];

function CountBadge({ count }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0, y: -4 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18 }}
          className="absolute -right-1 -top-1 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-gold px-1 text-[0.6rem] font-bold text-white"
        >
          {count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [condensed, setCondensed] = useState(false);
  const navigate = useNavigate();
  const { getItemCount } = useCart();
  const { wishlist } = useWishlist();
  const { user, logout } = useAuth();
  const close = () => setOpen(false);
  const cartCount = getItemCount();

  // The bar tightens and gains a hairline once you start scrolling.
  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const submitSearch = e => {
    e.preventDefault();
    navigate(query.trim() ? `/products?q=${encodeURIComponent(query.trim())}` : '/products');
    close();
  };

  return (
    <header className="sticky top-0 z-50">
      <div
        className={`border-b bg-paper/95 backdrop-blur-xl transition-all duration-500 ${
          condensed ? 'border-ink/[0.09] shadow-[0_8px_30px_-18px_rgba(37,25,15,.4)]' : 'border-transparent'
        }`}
      >
        <div
          className={`container grid grid-cols-[auto_1fr_auto] items-center gap-4 transition-all duration-500 md:grid-cols-[1fr_auto_1fr] ${
            condensed ? 'py-2.5' : 'py-3.5 md:py-5'
          }`}
        >
          {/* Left — nav on desktop, menu button on mobile */}
          <button
            className="text-ink transition-transform hover:scale-110 md:hidden"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>

          <nav className="hidden items-center gap-7 text-[13px] md:flex" aria-label="Main navigation">
            {categories.slice(0, 4).map(c => (
              <NavLink
                key={c.to}
                to={c.to}
                end={c.end}
                className={({ isActive }) =>
                  `group relative whitespace-nowrap py-1 transition-colors hover:text-wine ${
                    isActive ? 'text-wine' : 'text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {c.label}
                    <span
                      className={`absolute -bottom-0.5 left-0 h-px bg-gold transition-all duration-300 ${
                        isActive ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Centre — wordmark */}
          <Link className="group text-center" to="/" onClick={close} aria-label="Ashu Silks home">
            <motion.div
              className={`font-display font-medium tracking-[0.12em] text-ink transition-all duration-500 ${
                condensed ? 'text-[22px]' : 'text-[26px] md:text-[31px]'
              }`}
            >
              ASHU SILKS
            </motion.div>
            <div
              className={`overflow-hidden text-[8px] uppercase tracking-[0.34em] text-muted transition-all duration-500 ${
                condensed ? 'max-h-0 opacity-0' : 'mt-1 max-h-4 opacity-100'
              }`}
            >
              Draped in Tradition
            </div>
          </Link>

          {/* Right — search + actions */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-3">
            <form
              className="hidden h-[38px] w-[190px] items-center gap-2 rounded-full bg-ivory px-3.5 text-muted transition-all duration-300 focus-within:w-[230px] focus-within:ring-2 focus-within:ring-gold/30 lg:flex"
              onSubmit={submitSearch}
            >
              <Search size={15} className="shrink-0" />
              <input
                className="w-full bg-transparent text-[12px] text-ink outline-none placeholder:text-muted"
                placeholder="Search for sarees..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </form>

            {user ? (
              <button
                className="hidden items-center gap-1.5 text-[12px] font-medium text-ink transition-colors hover:text-wine sm:flex"
                onClick={logout}
              >
                <LogOut size={16} /> Sign out
              </button>
            ) : (
              <Link
                className="hidden items-center gap-1.5 text-[12px] font-medium text-ink transition-colors hover:text-wine sm:flex"
                to="/account"
              >
                <UserCircle size={16} /> Account
              </Link>
            )}

            <Link className="relative p-1.5 text-ink transition-transform hover:scale-110" to="/wishlist" aria-label="Wishlist">
              <Heart size={19} />
              <CountBadge count={wishlist.length} />
            </Link>
            <Link className="relative p-1.5 text-ink transition-transform hover:scale-110" to="/cart" aria-label="Cart">
              <ShoppingBag size={19} />
              <CountBadge count={cartCount} />
            </Link>
          </div>
        </div>

        {/* Category strip */}
        <div className="hidden border-t border-ink/[0.07] md:block">
          <div className="container flex justify-center gap-8 overflow-x-auto py-2.5 text-[11px] uppercase tracking-[0.14em]">
            {categories.slice(0, 6).map(c => (
              <NavLink
                key={`strip-${c.to}`}
                to={c.to}
                end={c.end}
                className={({ isActive }) =>
                  `group relative shrink-0 whitespace-nowrap transition-colors hover:text-wine ${
                    isActive ? 'text-wine' : 'text-muted'
                  }`
                }
              >
                {c.label}
                <span className="absolute -bottom-1 left-1/2 h-px w-0 -translate-x-1/2 bg-gold transition-all duration-300 group-hover:w-full" />
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 top-0 z-40 bg-ink/40 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.div
              className="relative z-50 border-b border-ink/10 bg-paper shadow-[var(--shadow-lift)] md:hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <div className="container flex flex-col gap-1 py-4">
                <form className="mb-2 flex items-center gap-2 rounded-full bg-ivory px-4 py-2.5" onSubmit={submitSearch}>
                  <Search size={16} className="shrink-0 text-muted" />
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
                    placeholder="Search for sarees..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                </form>

                {categories.map((c, i) => (
                  <motion.div
                    key={c.to}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.035, duration: 0.35, ease: EASE }}
                  >
                    <NavLink
                      to={c.to}
                      end={c.end}
                      onClick={close}
                      className={({ isActive }) =>
                        `block rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors ${
                          isActive ? 'bg-wine/10 text-wine' : 'text-ink hover:bg-ivory'
                        }`
                      }
                    >
                      {c.label}
                    </NavLink>
                  </motion.div>
                ))}

                {user ? (
                  <button
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-ink"
                    onClick={() => { logout(); close(); }}
                  >
                    <LogOut size={18} /> Sign out
                  </button>
                ) : (
                  <Link className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink" to="/account" onClick={close}>
                    <UserCircle size={18} /> Login / Sign up
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
