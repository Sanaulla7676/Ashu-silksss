import { Frown } from 'lucide-react';
import ProductCard from './ProductCard';

export default function ProductGrid({ products }) {
  if (!products.length) {
    return (
      <div className="rounded-md border border-dashed border-ink/15 bg-paper p-10 text-center text-muted">
        <Frown size={40} className="mx-auto mb-3 text-gold" />
        <h3 className="font-display text-lg text-wine">No products found</h3>
        <p>Try changing your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
