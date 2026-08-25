import { NavLink } from 'react-router-dom';
import { Package, ClipboardList, Palette } from 'lucide-react';

const links = [
  { to: '/admin', label: 'Products', icon: Package, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/theme', label: 'Theme & Design', icon: Palette },
];

export default function AdminNav() {
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto">
      {links.map(l => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            `flex shrink-0 items-center gap-2 rounded-[var(--radius-btn)] border px-3.5 py-2 text-sm font-semibold transition-colors ${
              isActive ? 'border-wine bg-wine text-white' : 'border-ink/15 bg-paper text-ink hover:border-wine'
            }`
          }
        >
          <l.icon size={16} /> {l.label}
        </NavLink>
      ))}
    </div>
  );
}
