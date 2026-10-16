import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { FALLBACK_CATEGORIES, getCategorySettings, saveCategorySettings } from '../services/categories';

const CategoryContext = createContext(null);

function withRequiredCategories(list) {
  const required = ['New Arrivals', 'Festive Wear', 'Designer', 'Traditional Sarees'];
  const unique = [...new Set((Array.isArray(list) ? list : []).map(name => String(name).trim()).filter(Boolean))];
  return [...required, ...unique.filter(name => !required.includes(name))];
}

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    getCategorySettings()
      .then(list => { if (active && list) setCategories(withRequiredCategories(list)); })
      .finally(() => active && setLoaded(true));
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    categories,
    loaded,
    async saveCategories(next) {
      const cleaned = withRequiredCategories(next);
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
