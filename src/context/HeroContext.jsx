import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getHeroSettings, saveHeroSettings } from '../services/hero';

const DEFAULT_HERO = { type: 'video', url: '/ashuvedio.mp4' };

const HeroContext = createContext(null);

export function HeroProvider({ children }) {
  const [hero, setHero] = useState(DEFAULT_HERO);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    getHeroSettings()
      .then(data => { if (active && data?.url) setHero(data); })
      .finally(() => active && setLoaded(true));
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    hero,
    loaded,
    async saveHero(next) {
      await saveHeroSettings(next);
      setHero(next);
    },
    async resetHero() {
      await saveHeroSettings(DEFAULT_HERO);
      setHero(DEFAULT_HERO);
    },
  }), [hero, loaded]);

  return <HeroContext.Provider value={value}>{children}</HeroContext.Provider>;
}

export function useHero() {
  const ctx = useContext(HeroContext);
  if (!ctx) throw new Error('useHero must be used within HeroProvider');
  return ctx;
}
