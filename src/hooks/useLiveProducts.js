import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db, firebaseReady } from '../firebase';

export function useLiveProducts({ category = 'All', search = '', sort = 'featured' } = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!firebaseReady) {
        setProducts([]); setLoading(false); return;
      }
      try {
        const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
        if (!cancelled) setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Unable to load products.');
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let result = products.filter(p => Number(p.stock ?? 0) > 0);
    if (category && category !== 'All') result = result.filter(p => p.category === category);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => [p.name,p.category,p.description,p.colour,p.fabric,p.occasion,p.sku].some(v => String(v || '').toLowerCase().includes(q)));
    }
    result.sort((a,b) => {
      if (sort === 'price-low') return Number(a.price) - Number(b.price);
      if (sort === 'price-high') return Number(b.price) - Number(a.price);
      if (sort === 'newest') return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      return Number(b.featured) - Number(a.featured);
    });
    return result;
  }, [products, category, search, sort]);

  const categories = useMemo(() => ['All', ...new Set(products.map(p => p.category).filter(Boolean))], [products]);
  const featuredProducts = useMemo(() => products.filter(p => p.featured && Number(p.stock ?? 0) > 0).slice(0, 8), [products]);
  return { products: filtered, allProducts: products, categories, featuredProducts, loading, error };
}

export async function getLiveProductById(id) {
  if (!firebaseReady) return null;
  const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
  const found = snap.docs.find(d => d.id === id);
  return found ? { id: found.id, ...found.data() } : null;
}
