import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getHeroSettings, saveHeroSettings } from '../services/hero';

export const DEFAULT_HERO = {
  type: 'video',
  url: '/ashuvedio.mp4',
  eyebrow: 'Ashu Silks · Pure Silk',
  headline: 'Drape in',
  headlineAccent: 'timeless silk.',
  subtext: 'Refined sarees for weddings, celebrations and the moments you keep forever — chosen for their weave, zari and drape.',
  buttons: [
    { label: 'Shop Silk Sarees', link: '/products', style: 'primary' },
    { label: 'Explore Collections ↗', link: '/products', style: 'link' },
  ],
};

export const BUTTON_STYLES = [
  { id: 'primary', label: 'Solid (Primary)' },
  { id: 'dark', label: 'Solid (Dark)' },
  { id: 'ghost', label: 'Outline' },
  { id: 'link', label: 'Text link' },
];

const HeroContext = createContext(null);

export function HeroProvider({ children }) {
  const [hero, setHero] = useState(DEFAULT_HERO);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    getHeroSettings()
      .then(data => { if (active && data?.url) setHero({ ...DEFAULT_HERO, ...data }); })
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
