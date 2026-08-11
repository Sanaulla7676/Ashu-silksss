import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import ProductGrid from '../components/ProductGrid';
import Pagination from '../components/Pagination';
import Breadcrumbs from '../components/Breadcrumbs';
import { useProducts } from '../hooks/useProducts';

const PAGE_SIZE = 12;

export default function Products() {
  const { category: routeCategory } = useParams();
  const initialCategory = routeCategory ? decodeURIComponent(routeCategory) : 'All';
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState('');
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
      <section className="section page-section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Online Saree Store</span>
              <h2>{category === 'All' ? 'All Products' : category}</h2>
              <p>{products.length} premium sarees found. Search, filter and order online.</p>
            </div>
          </div>

          <div className="chips">
            {categories.map(cat => (
              <button
                key={cat}
                className={cat === category ? 'active' : ''}
                onClick={() => changeCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="toolbar">
            <label className="search-box">
              <Search size={18} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search sarees, fabric, colour..."
              />
            </label>
            <select value={sort} onChange={e => setSort(e.target.value)}>
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
            <button className="btn ghost"><SlidersHorizontal size={18} /> Filters</button>
          </div>

          <ProductGrid products={paginatedProducts} />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </section>
    </>
  );
}
