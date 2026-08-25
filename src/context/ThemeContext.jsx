import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getThemeSettings, saveThemeSettings } from '../services/theme';
import { DEFAULT_THEME, applyThemeVars, mergeTheme } from '../theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [savedTheme, setSavedTheme] = useState(DEFAULT_THEME);
  const [preview, setPreview] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    getThemeSettings()
      .then(data => { if (active && data) setSavedTheme(mergeTheme(DEFAULT_THEME, data)); })
      .finally(() => active && setLoaded(true));
    return () => { active = false; };
  }, []);

  const effectiveTheme = useMemo(
    () => (preview ? mergeTheme(savedTheme, preview) : savedTheme),
    [savedTheme, preview]
  );

  useEffect(() => { applyThemeVars(effectiveTheme); }, [effectiveTheme]);

  const value = useMemo(() => ({
    theme: savedTheme,
    loaded,
    previewTheme: partial => setPreview(partial),
    clearPreview: () => setPreview(null),
    async saveTheme(partial) {
      const merged = mergeTheme(savedTheme, partial);
      await saveThemeSettings(merged);
      setSavedTheme(merged);
      return merged;
    },
    async resetTheme() {
      await saveThemeSettings(DEFAULT_THEME);
      setSavedTheme(DEFAULT_THEME);
      return DEFAULT_THEME;
    },
  }), [savedTheme, loaded]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
