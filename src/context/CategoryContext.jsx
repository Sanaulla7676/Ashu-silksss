import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { FALLBACK_CATEGORIES, getCategorySettings, saveCategorySettings } from '../services/categories';

const CategoryContext = createContext(null);

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    getCategorySettings()
      .then(list => { if (active && list) setCategories(list); })
      .finally(() => active && setLoaded(true));
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    categories,
    loaded,
    async saveCategories(next) {
      const cleaned = next.map(c => c.trim()).filter(Boolean);
      await saveCategorySettings(cleaned);
      setCategories(cleaned);
      return cleaned;
    },
  }), [categories, loaded]);

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}

export function useCategories() {
  const ctx = useContext(CategoryContext);
  if (!ctx) throw new Error('useCategories must be used within CategoryProvider');
  return ctx;
}
