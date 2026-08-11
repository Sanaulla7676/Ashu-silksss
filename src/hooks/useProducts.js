import { useMemo } from 'react';
import { demoProducts } from '../data';

export function useProducts({ category = 'All', search = '', sort = 'featured' } = {}) {
  const products = useMemo(() => {
    let result = [...demoProducts];

    if (category && category !== 'All') {
      result = result.filter(p => p.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.colour.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'featured':
      default:
        result.sort((a, b) => Number(b.featured) - Number(a.featured));
        break;
    }

    return result;
  }, [category, search, sort]);

  const categories = useMemo(() => {
    return ['All', ...new Set(demoProducts.map(p => p.category))];
  }, []);

  const featuredProducts = useMemo(() => {
    return demoProducts.filter(p => p.featured).slice(0, 8);
  }, []);

  return { products, categories, featuredProducts, allProducts: demoProducts };
}

export function getProductById(id) {
  return demoProducts.find(p => p.id === id);
}

export function getRelatedProducts(product, limit = 4) {
  if (!product) return [];
  return demoProducts
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, limit);
}
