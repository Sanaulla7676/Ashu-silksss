import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import ProductGrid from '../components/ProductGrid';
import Pagination from '../components/Pagination';
import Breadcrumbs from '../components/Breadcrumbs';
import { useProducts } from '../hooks/useProducts';

const PAGE_SIZE = 12;

export default function Products() {
  const { category: routeCategory } = useParams();
  const [searchParams] = useSearchParams();
  const initialCategory = routeCategory ? decodeURIComponent(routeCategory) : 'All';
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [sort, setSort] = useState('featured');
  const [page, setPage] = useState(1);

  const { products, categories } = useProducts({ category, search, sort });

  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return products.slice(start, start + PAGE_SIZE);
  }, [products, page]);

  const changeCategory = next => {
    setCategory(next);
    setPage(1);
  };

  return (
    <>
      <Breadcrumbs items={[{ label: 'Products' }]} />
      <section className="pb-16 pt-2 md:pb-24">
        <div className="container">
          <div className="mb-6">
            <span className="eyebrow">Online Saree Store</span>
            <h2 className="heading-xl">{category === 'All' ? 'All Products' : category}</h2>
            <p className="max-w-[650px] text-muted">{products.length} premium sarees found. Search, filter and order online.</p>
          </div>

          <div className="mb-5 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            {categories.map(cat => (
              <button
                key={cat}
                className={`shrink-0 whitespace-nowrap rounded-sm border px-3.5 py-2 text-sm font-semibold transition-colors ${
                  cat === category ? 'border-wine bg-wine text-white' : 'border-ink/15 bg-paper text-ink hover:border-wine'
                }`}
                onClick={() => changeCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_220px_auto]">
            <label className="col-span-full flex items-center gap-2.5 rounded border border-ink/10 bg-paper px-3.5 lg:col-span-1">
              <Search size={18} className="shrink-0 text-muted" />
              <input
                className="w-full bg-transparent py-3.5 outline-none"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search sarees, fabric, colour..."
              />
            </label>
            <select
              className="field"
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
            <button className="btn-ghost"><SlidersHorizontal size={18} /> Filters</button>
          </div>

          <ProductGrid products={paginatedProducts} />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </section>
    </>
  );
}
