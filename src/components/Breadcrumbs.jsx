import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs({ items }) {
  return (
    <div className="container flex flex-wrap items-center gap-2 py-4 text-sm text-muted">
      <Link to="/" className="font-bold text-wine">Home</Link>
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-2">
          <ChevronRight size={14} className="shrink-0" />
          {item.to && index !== items.length - 1 ? (
            <Link to={item.to} className="font-bold text-wine">{item.label}</Link>
          ) : (
            <span className="truncate">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
