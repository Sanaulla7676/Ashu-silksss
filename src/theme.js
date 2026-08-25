// Central theme model. Every key here maps 1:1 to a CSS custom property
// consumed by Tailwind utilities across the whole site (see src/styles.css
// @theme block), so changing these values re-themes every page live.

export const DEFAULT_THEME = {
  colors: {
    wine: '#2874f0',
    wine2: '#1a56c4',
    wine3: '#172337',
    gold: '#ff9f00',
    gold2: '#fb641b',
    ivory: '#f1f3f6',
    paper: '#ffffff',
    ink: '#212121',
    muted: '#757575',
  },
  fonts: {
    display: 'Poppins, ui-sans-serif, system-ui, sans-serif',
    body: 'Inter, system-ui, -apple-system, sans-serif',
  },
  radius: 'soft',
};

export const RADIUS_VALUES = {
  square: '0px',
  soft: '0.375rem',
  round: '0.9rem',
  pill: '999px',
};

export const RADIUS_LABELS = {
  square: 'Square',
  soft: 'Soft',
  round: 'Round',
  pill: 'Pill',
};

// Each preset is a full, cohesive palette so hovering swaps the whole
// site's mood at once, not just one accent color.
export const COLOR_PRESETS = [
  {
    id: 'flipkart-blue',
    name: 'Marketplace Blue',
    colors: DEFAULT_THEME.colors,
  },
  {
    id: 'wine-gold',
    name: 'Wine & Gold',
    colors: { wine: '#5c1330', wine2: '#33091c', wine3: '#160711', gold: '#c9a227', gold2: '#efd978', ivory: '#fbf6ec', paper: '#fffaf1', ink: '#211411', muted: '#6d5b54' },
  },
  {
    id: 'emerald',
    name: 'Emerald Boutique',
    colors: { wine: '#0e7a55', wine2: '#0a5b3f', wine3: '#062f20', gold: '#d4af37', gold2: '#f0dfa0', ivory: '#f3faf6', paper: '#ffffff', ink: '#132921', muted: '#5c7568' },
  },
  {
    id: 'midnight',
    name: 'Midnight Luxe',
    colors: { wine: '#4338ca', wine2: '#312597', wine3: '#180f4a', gold: '#f59e0b', gold2: '#fde68a', ivory: '#f5f4fb', paper: '#ffffff', ink: '#1e1b2e', muted: '#6b6580' },
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    colors: { wine: '#b3435c', wine2: '#832f43', wine3: '#451a24', gold: '#c98a5e', gold2: '#f0d3b8', ivory: '#fdf5f1', paper: '#ffffff', ink: '#2e1a1f', muted: '#8a6b6f' },
  },
  {
    id: 'mono',
    name: 'Classic Mono',
    colors: { wine: '#18181b', wine2: '#000000', wine3: '#000000', gold: '#71717a', gold2: '#a1a1aa', ivory: '#fafafa', paper: '#ffffff', ink: '#18181b', muted: '#71717a' },
  },
];

// Fonts are preloaded in index.html so switching never causes a network
// wait on first swap.
export const FONT_PRESETS = [
  { id: 'roboto', label: 'Roboto', stack: 'Roboto, ui-sans-serif, system-ui, sans-serif' },
  { id: 'poppins', label: 'Poppins', stack: 'Poppins, ui-sans-serif, system-ui, sans-serif' },
  { id: 'montserrat', label: 'Montserrat', stack: 'Montserrat, ui-sans-serif, system-ui, sans-serif' },
  { id: 'playfair', label: 'Playfair Display', stack: '"Playfair Display", ui-serif, Georgia, serif' },
  { id: 'cinzel', label: 'Cinzel', stack: 'Cinzel, ui-serif, Georgia, serif' },
  { id: 'cormorant', label: 'Cormorant Garamond', stack: '"Cormorant Garamond", ui-serif, Georgia, serif' },
  { id: 'space-grotesk', label: 'Space Grotesk', stack: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif' },
  { id: 'inter', label: 'Inter', stack: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { id: 'work-sans', label: 'Work Sans', stack: '"Work Sans", ui-sans-serif, system-ui, sans-serif' },
  { id: 'open-sans', label: 'Open Sans', stack: '"Open Sans", ui-sans-serif, system-ui, sans-serif' },
  { id: 'source-sans', label: 'Source Sans 3', stack: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif' },
];

export const COLOR_FIELDS = [
  { key: 'wine', label: 'Primary' },
  { key: 'wine2', label: 'Primary (dark)' },
  { key: 'wine3', label: 'Primary (deep)' },
  { key: 'gold', label: 'Accent' },
  { key: 'gold2', label: 'Accent (light)' },
  { key: 'paper', label: 'Card surface' },
  { key: 'ivory', label: 'Page background' },
  { key: 'ink', label: 'Text' },
  { key: 'muted', label: 'Muted text' },
];

export function mergeTheme(base, partial) {
  if (!partial) return base;
  return {
    colors: { ...base.colors, ...(partial.colors || {}) },
    fonts: { ...base.fonts, ...(partial.fonts || {}) },
    radius: partial.radius || base.radius,
  };
}

export function applyThemeVars(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement.style;
  const c = theme.colors;
  root.setProperty('--color-wine', c.wine);
  root.setProperty('--color-wine-2', c.wine2);
  root.setProperty('--color-wine-3', c.wine3);
  root.setProperty('--color-gold', c.gold);
  root.setProperty('--color-gold-2', c.gold2);
  root.setProperty('--color-ivory', c.ivory);
  root.setProperty('--color-paper', c.paper);
  root.setProperty('--color-ink', c.ink);
  root.setProperty('--color-muted', c.muted);
  root.setProperty('--font-display', theme.fonts.display);
  root.setProperty('--font-serif', theme.fonts.display);
  root.setProperty('--font-sans', theme.fonts.body);
  root.setProperty('--radius-btn', RADIUS_VALUES[theme.radius] || RADIUS_VALUES.soft);
}
