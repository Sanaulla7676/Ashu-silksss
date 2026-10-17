import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { productImage } from '../utils';

const PRODUCT_ATLAS = 'https://d2ol7oe51mr4n9.cloudfront.net/user_35mtirXTBJzeOp1GtU8b1ixSM0D/7ce5817a-03bc-47d3-89ae-89b99bca58b9.webp';
const ATLAS_COLUMNS = 12;
const ATLAS_ROWS = 16;

const TONES = [
  { match: /red|crimson|ruby|scarlet|vermilion|burgundy|maroon|wine|rust|coral|orange|saffron|copper/i, light: '#a34b57', dark: '#2c111b' },
  { match: /pink|fuchsia|magenta|rose|rani|blush|peach/i, light: '#b86b83', dark: '#321722' },
  { match: /purple|plum|mauve|violet|aubergine/i, light: '#78619a', dark: '#21172d' },
  { match: /blue|teal|turquoise|aqua|navy|slate|peacock/i, light: '#4b8290', dark: '#132630' },
  { match: /green|emerald|olive|sage|lime|forest/i, light: '#54836d', dark: '#12251b' },
  { match: /gold|mustard|yellow|beige|ivory|cream/i, light: '#a88d54', dark: '#2b2113' },
  { match: /black|charcoal|grey|gray|midnight/i, light: '#6f6670', dark: '#151318' },
];

function toneFor(colour) {
  return TONES.find(t => t.match.test(colour || '')) || { light: '#96616a', dark: '#24151b' };
}

function isValidImageIndex(imageIndex) {
  return Number.isInteger(Number(imageIndex)) && Number(imageIndex) >= 0 && Number(imageIndex) < 192;
}

function atlasStyle(imageIndex) {
  const index = Number(imageIndex);
  const column = index % ATLAS_COLUMNS;
  const row = Math.floor(index / ATLAS_COLUMNS);
  return {
    backgroundImage: `url("${PRODUCT_ATLAS}")`,
    backgroundSize: `${ATLAS_COLUMNS * 100}% ${ATLAS_ROWS * 100}%`,
    backgroundPosition: `${(column / (ATLAS_COLUMNS - 1)) * 100}% ${(row / (ATLAS_ROWS - 1)) * 100}%`,
    backgroundRepeat: 'no-repeat',
  };
}

export default function ProductMedia({ url, className = '', productName = '', colour = '', imageIndex }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);

  if (!url || failed) {
    if (isValidImageIndex(imageIndex)) {
      return (
        <div
          role="img"
          aria-label={`${productName || 'Ashu Silks product'} photo`}
          className={`h-full w-full bg-center bg-no-repeat ${className}`}
          style={atlasStyle(imageIndex)}
        />
      );
    }

    const tone = toneFor(colour);
    const title = String(productName || 'New arrival').replace(/\s+saree$/i, '');
    return (
      <div role="img" aria-label={productName ? productName + ' product photo pending' : 'Ashu Silks product photo pending'}
        className={`relative grid h-full w-full place-items-center overflow-hidden text-center ${className}`}
        style={{ background: `radial-gradient(circle at 50% 35%, ${tone.light} 0%, transparent 48%), linear-gradient(145deg, ${tone.dark}, #0f0d10)` }}>
        <div className="pointer-events-none absolute inset-3 border border-[#d2b774]/40" />
        <div className="relative z-[1] flex h-full w-full flex-col items-center justify-center px-5 py-7 text-[#f7e9cc]">
          <Sparkles size={25} strokeWidth={1.2} className="mb-4 opacity-80" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.34em]">Ashu Silks</span>
          <span className="my-4 block h-px w-12 bg-[#d2b774]" />
          <span className="line-clamp-3 max-w-[20rem] font-display text-lg leading-tight sm:text-xl">{title}</span>
          {colour && <span className="mt-2 text-[10px] uppercase tracking-[0.13em] opacity-85">{colour}</span>}
          <span className="mt-7 text-[8px] uppercase tracking-[0.18em] opacity-60">Product photo updating</span>
        </div>
      </div>
    );
  }

  const video = /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes('/video/upload/');
  const base = `h-full w-full object-cover ${className}`;
  if (video) return <video className={base} src={url} muted playsInline loop autoPlay onError={() => setFailed(true)} />;
  return <img className={base} src={productImage(url)} alt={productName || ''} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}
