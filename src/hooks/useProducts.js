import { useEffect, useMemo, useState } from 'react';
import { fetchLiveProducts } from '../services/liveCatalog';
import { demoProducts } from '../data';

export function useProducts({ category = 'All', search = '', sort = 'featured' } = {}) {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchLiveProducts()
      .then(items => { if (active) setCatalog(items.length ? items : demoProducts); })
      .catch(err => { if (active) { setError(err?.message || 'Unable to load catalogue.'); setCatalog(demoProducts); } })
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
  const featuredProducts = useMemo(() => catalog.filter(p => p.featured && Number(p.stock ?? 0) > 0).slice(0, 8), [catalog]);
  return { products, categories, featuredProducts, allProducts: catalog, loading, error };
}

export function getProductById(id) {
  return demoProducts.find(p => p.id === id);
}

export function getRelatedProducts(product, limit = 4) {
  if (!product) return [];
  return demoProducts.filter(p => p.id !== product.id && p.category === product.category).slice(0, limit);
}
