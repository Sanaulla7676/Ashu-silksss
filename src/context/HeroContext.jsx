import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getHeroSettings, saveHeroSettings } from '../services/hero';

export const DEFAULT_HERO = {
  type: 'video',
  url: '/ashuvedio.mp4',
  eyebrow: 'Ashu Silks · Pure Silk',
  headline: 'Drape in',
  headlineAccent: 'timeless silk.',
  subtext: 'Refined sarees for weddings, celebrations and the moments you keep forever — chosen for their weave, zari and drape.',
  textPosition: { x: 6, y: 24 },
  textAlign: 'left',
  buttonsPosition: { x: 6, y: 64 },
  buttons: [
    { label: 'Shop Silk Sarees', link: '/products', style: 'primary', shape: 'rounded', size: 'md', showIcon: true, bg: '', color: '' },
    { label: 'Explore Collections ↗', link: '/products', style: 'link', shape: 'rounded', size: 'md', showIcon: false, bg: '', color: '' },
  ],
};

export const BUTTON_STYLES = [
  { id: 'primary', label: 'Solid (Primary)' },
  { id: 'dark', label: 'Solid (Dark)' },
  { id: 'ghost', label: 'Outline' },
  { id: 'link', label: 'Text link' },
];

export const BUTTON_SHAPES = [
  { id: 'rounded', label: 'Rounded' },
  { id: 'pill', label: 'Pill' },
  { id: 'square', label: 'Square' },
];

export const BUTTON_SIZES = [
  { id: 'sm', label: 'Small' },
  { id: 'md', label: 'Medium' },
  { id: 'lg', label: 'Large' },
];

export const normalizeButton = btn => ({
  label: '', link: '/products', style: 'primary', shape: 'rounded', size: 'md', showIcon: true, bg: '', color: '',
  ...btn,
});

const SHAPE_CLASS = { rounded: '', pill: 'rounded-full', square: 'rounded-none' };
const SIZE_CLASS = {
  primary: { sm: 'min-h-[36px] px-4 py-2 text-[0.68rem]', md: '', lg: 'min-h-[50px] px-7 py-4 text-[0.86rem]' },
  link: { sm: 'text-[0.68rem]', md: 'text-xs', lg: 'text-sm' },
};

export function heroButtonClass(btn) {
  const b = normalizeButton(btn);
  if (b.style === 'link') {
    return `border-b border-white/50 pb-1 font-bold uppercase tracking-widest text-white transition-colors hover:border-gold-2 hover:text-gold-2 ${SIZE_CLASS.link[b.size] || ''}`;
  }
  const base = b.style === 'dark' ? 'btn-dark' : b.style === 'ghost' ? 'btn-outline-light' : 'btn-primary';
  return `${base} ${SHAPE_CLASS[b.shape] || ''} ${SIZE_CLASS.primary[b.size] || ''}`.trim();
}

export function heroButtonStyle(btn) {
  const b = normalizeButton(btn);
  const style = {};
  if (b.style !== 'link' && b.bg) style.backgroundColor = b.bg;
  if (b.color) style.color = b.color;
  return style;
}

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
