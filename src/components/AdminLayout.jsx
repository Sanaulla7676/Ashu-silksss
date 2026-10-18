import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Package, ClipboardList, Palette, Image as ImageIcon, Users, Sparkles as ImportIcon,
  Menu, X, LogOut, ExternalLink, Sparkles, FolderTree, MessageSquare, Images, BarChart3, Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/products/new', label: 'Add product', icon: Plus },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/enquiries', label: 'Enquiries', icon: MessageSquare },
  { to: '/admin/media', label: 'Media Library', icon: Images },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/import', label: 'Import Photos', icon: ImportIcon },
  { to: '/admin/bulk-import', label: 'Bulk Import', icon: ImportIcon },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/hero', label: 'Hero Content', icon: ImageIcon },
  { to: '/admin/theme', label: 'Theme & Design', icon: Palette },
  { to: '/admin/team', label: 'Team', icon: Users },
];

function SidebarLinks({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive ? 'bg-[#9f1239] text-white shadow-sm' : 'text-slate-600 hover:bg-rose-50 hover:text-[#9f1239]'
            }`
          }
        >
          <item.icon size={18} /> {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

function EmptyPage({ title, text, children }) {
  return (
    <div className="grid min-h-[70vh] place-items-center bg-slate-50 p-6">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <h2 className="font-display text-xl font-bold text-slate-900">{title}</h2>
        {text && <div className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">{text}</div>}
        {children && <div className="mt-5 flex flex-wrap items-center justify-center gap-3">{children}</div>}
        <Link to="/" className="btn-ghost mt-4 inline-flex">Back to site</Link>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [permissionError, setPermissionError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountActionError, setAccountActionError] = useState('');

  useEffect(() => {
    let active = true;
    setPermissionError('');
    if (user) {
      setAdmin(null);
      user.getIdTokenResult(true)
        .then(result => {
          if (active) setAdmin(result.claims.admin === true);
        })
        .catch(() => {
          if (active) {
            setPermissionError('Firebase sign-in succeeded, but the admin permission could not be verified. Check the account and Firebase project configuration.');
            setAdmin(false);
          }
        });
    } else if (!loading) {
      setAdmin(false);
    }
    return () => { active = false; };
  }, [user, loading]);

  const switchAccount = async () => {
    setAccountActionError('');
    try {
      await logout();
      navigate('/account', { replace: true, state: { from: location.pathname } });
    } catch {
      setAccountActionError('Could not sign out automatically. Refresh the page and open the admin sign-in screen again.');
    }
  };

  const retryPermissionCheck = async () => {
    if (!user) return;
    setAdmin(null);
    setPermissionError('');
    setAccountActionError('');
    try {
      await user.getIdToken(true);
      const result = await user.getIdTokenResult(true);
      setAdmin(result.claims.admin === true);
    } catch {
      setPermissionError('Firebase could not refresh the account token. Check the connection and sign in again.');
      setAdmin(false);
    }
  };

  if (loading || (user && admin === null)) return <EmptyPage title="Checking store-owner permissions..." text="Verifying the signed-in account with Firebase." />;
  if (!user) {
    return (
      <EmptyPage title="Admin sign-in required" text="Sign in with the approved Ashu Silks store-owner account to continue.">
        <Link to="/account" state={{ from: location.pathname }} className="dash-btn-primary">Sign in</Link>
      </EmptyPage>
    );
  }
  if (!admin) {
    return (
      <EmptyPage
        title={permissionError ? 'Could not verify admin access' : 'Signed in, but admin permission is missing'}
        text={
          <>
            <p>Firebase authenticated <b>{user.email || 'this account'}</b>, but this account does not have the required <code className="rounded bg-slate-100 px-1.5 py-0.5">admin=true</code> permission.</p>
            <p className="mt-2">Use the original store-owner account. Creating a new customer account will not grant admin access. If this is the correct owner account, the Firebase project administrator must grant its admin custom claim, then you must sign in again.</p>
            {permissionError && <p className="mt-2 text-amber-700">{permissionError}</p>}
            {accountActionError && <p role="alert" className="mt-2 text-red-700">{accountActionError}</p>}
          </>
        }
      >
        <button type="button" onClick={retryPermissionCheck} className="dash-btn-ghost">Retry permission check</button>
        <button type="button" onClick={switchAccount} className="dash-btn-primary">Sign out and switch account</button>
      </EmptyPage>
    );
  }

  return (
    <div className="admin-shell min-h-screen bg-[#faf6f7] text-slate-900">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-rose-100 bg-white py-5 shadow-sm lg:flex">
        <Link to="/admin" className="mb-6 flex items-center gap-2 px-5 font-display text-lg font-bold text-[#9f1239]">
          <Sparkles size={20} className="text-[#c89a3d]" /> Ashu Silks
        </Link>
        <SidebarLinks />
        <div className="mt-auto flex flex-col gap-1 px-3 pt-4">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-[#9f1239]">
            <ExternalLink size={18} /> View live site
          </a>
          <button onClick={logout} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-rose-100 bg-white py-5 shadow-sm lg:hidden"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.22 }}
            >
              <div className="mb-6 flex items-center justify-between px-5">
                <span className="flex items-center gap-2 font-display text-lg font-bold text-white"><Sparkles size={20} className="text-indigo-400" /> Ashu Silks</span>
                <button onClick={() => setDrawerOpen(false)} className="text-slate-600"><X size={22} /></button>
              </div>
              <SidebarLinks onNavigate={() => setDrawerOpen(false)} />
              <div className="mt-auto flex flex-col gap-1 px-3 pt-4">
                <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  <ExternalLink size={18} /> View live site
                </a>
                <button onClick={logout} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  <LogOut size={18} /> Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-rose-100 bg-white/95 px-4 sm:px-6 backdrop-blur">
          <button className="text-slate-600 lg:hidden" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <span className="font-display font-semibold text-[#9f1239]">Admin Dashboard</span>
          <span className="ml-auto truncate text-sm text-slate-500">{user.email}</span>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
