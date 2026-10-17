import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  FALLBACK_CATEGORIES, getCategorySettings, getCategoryImageSettings,
  saveCategorySettings, saveCategoryImageSettings,
} from '../services/categories';

const CategoryContext = createContext(null);

function withRequiredCategories(list) {
  const required = ['New Arrivals', 'Festive Wear', 'Designer', 'Traditional Sarees'];
  const unique = [...new Set((Array.isArray(list) ? list : []).map(name => String(name).trim()).filter(Boolean))];
  return [...required, ...unique.filter(name => !required.includes(name))];
}

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [categoryImages, setCategoryImages] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getCategorySettings(), getCategoryImageSettings()])
      .then(([list, images]) => {
        if (!active) return;
        if (list) setCategories(withRequiredCategories(list));
        setCategoryImages(images || {});
      })
      .catch(error => console.warn('[categories] Could not load saved category settings.', error))
      .finally(() => active && setLoaded(true));
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    categories,
    categoryImages,
    loaded,
    async saveCategories(next) {
      const cleaned = withRequiredCategories(next);
      const images = await saveCategorySettings(cleaned);
      setCategories(cleaned);
      setCategoryImages(images || {});
      return cleaned;
    },
    async saveCategoryImages(next) {
      const cleaned = await saveCategoryImageSettings(next);
      setCategoryImages(cleaned || {});
      return cleaned;
    },
    async saveCategoryImage(name, url) {
      const next = { ...categoryImages };
      if (url) next[name] = url;
      else delete next[name];
      const cleaned = await saveCategoryImageSettings(next);
      setCategoryImages(cleaned || {});
      return cleaned;
    },
  }), [categories, categoryImages, loaded]);

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}

export function useCategories() {
  const ctx = useContext(CategoryContext);
  if (!ctx) throw new Error('useCategories must be used within CategoryProvider');
  return ctx;
}
