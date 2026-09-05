import { useEffect, useMemo, useState } from 'react';
import { fetchLiveProducts } from '../services/liveCatalog';

export function useProducts({ category = 'All', search = '', sort = 'featured' } = {}) {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchLiveProducts()
      .then(items => { if (active) setCatalog(items); })
      .catch(err => { if (active) { setError(err?.message || 'Unable to load catalogue.'); setCatalog([]); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const products = useMemo(() => {
    let result = [...catalog];
    if (category && category !== 'All') result = result.filter(p => p.category === category);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => [p.name,p.category,p.description,p.colour,p.fabric,p.occasion,p.sku].some(v => String(v || '').toLowerCase().includes(q)));
    }
    result = result.filter(p => Number(p.stock ?? 0) > 0);
    if (sort === 'price-low') result.sort((a,b) => Number(a.price)-Number(b.price));
    else if (sort === 'price-high') result.sort((a,b) => Number(b.price)-Number(a.price));
    else if (sort === 'newest') result.sort((a,b) => (b.createdAt?.seconds || b.createdAt || 0) - (a.createdAt?.seconds || a.createdAt || 0));
    else result.sort((a,b) => Number(b.featured)-Number(a.featured));
    return result;
  }, [catalog, category, search, sort]);

  const categories = useMemo(() => ['All', ...new Set(catalog.map(p => p.category).filter(Boolean))], [catalog]);
  const inStock = useMemo(() => catalog.filter(p => Number(p.stock ?? 0) > 0), [catalog]);
  const featuredProducts = useMemo(() => {
    const marked = inStock.filter(p => p.featured);
    return (marked.length ? marked : inStock).slice(0, 8);
  }, [inStock]);
  const byCategory = useMemo(() => {
    const map = {};
    inStock.forEach(p => {
      const cat = p.category || 'Other';
      (map[cat] ||= []).push(p);
    });
    return map;
  }, [inStock]);
  return { products, categories, featuredProducts, byCategory, allProducts: catalog, loading, error };
}
