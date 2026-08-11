import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs({ items }) {
  return (
    <div className="breadcrumbs container">
      <Link to="/">Home</Link>
      {items.map((item, index) => (
        <span key={item.label}>
          <ChevronRight size={14} />
          {item.to && index !== items.length - 1 ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
