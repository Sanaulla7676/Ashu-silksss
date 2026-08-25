import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Package, ClipboardList, Palette, Image as ImageIcon, Users,
  Menu, X, LogOut, ExternalLink, Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
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
              isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <item.icon size={18} /> {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

function EmptyPage({ title, text }) {
  return (
    <div className="grid min-h-[70vh] place-items-center bg-slate-50 p-6">
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h2 className="font-display text-lg text-slate-900">{title}</h2>
        {text && <p className="mt-2 text-slate-500">{text}</p>}
        <Link to="/" className="btn-ghost mt-4 inline-flex">Back to site</Link>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const [admin, setAdmin] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (user) {
      user.getIdTokenResult(true).then(r => setAdmin(r.claims.admin === true)).catch(() => setAdmin(false));
    } else if (!loading) {
      setAdmin(false);
    }
  }, [user, loading]);

  if (loading || admin === null) return <EmptyPage title="Loading dashboard..." />;
  if (!user) return <EmptyPage title="Admin sign-in required" />;
  if (!admin) return <EmptyPage title="Access denied" text="Your account does not have the admin claim." />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-900 py-5 lg:flex">
        <Link to="/admin" className="mb-6 flex items-center gap-2 px-5 font-display text-lg font-bold text-white">
          <Sparkles size={20} className="text-indigo-400" /> Ashu Silks
        </Link>
        <SidebarLinks />
        <div className="mt-auto flex flex-col gap-1 px-3 pt-4">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
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
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 py-5 lg:hidden"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.22 }}
            >
              <div className="mb-6 flex items-center justify-between px-5">
                <span className="flex items-center gap-2 font-display text-lg font-bold text-white"><Sparkles size={20} className="text-indigo-400" /> Ashu Silks</span>
                <button onClick={() => setDrawerOpen(false)} className="text-slate-300"><X size={22} /></button>
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
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button className="text-slate-600 lg:hidden" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <span className="font-display font-semibold text-slate-900">Admin Dashboard</span>
          <span className="ml-auto truncate text-sm text-slate-500">{user.email}</span>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
