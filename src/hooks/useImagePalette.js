import { useEffect, useState } from 'react';

// Dominant colours are read once per image and shared across cards.
const cache = new Map();
const inflight = new Map();

/** Cloudinary can hand back a thumbnail, so sampling costs almost nothing. */
function tinyUrl(url) {
  if (!url) return '';
  if (url.includes('/upload/')) return url.replace('/upload/', '/upload/w_40,c_fill,q_40/');
  return url;
}

function extract(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onerror = () => resolve([]);
    img.onload = () => {
      try {
        const size = 40;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        const buckets = new Map();
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const alpha = data[i + 3];
          if (alpha < 200) continue;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const light = (max + min) / 2;
          const sat = max === min ? 0 : (max - min) / (light > 127 ? 510 - max - min : max + min);

          // Studio backdrops are pale and washed out; skip them so the
          // swatches describe the saree rather than the table it sits on.
          if (light > 214 && sat < 0.35) continue;
          if (light < 26) continue;

          const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
          const found = buckets.get(key);
          if (found) {
            found.count += 1;
            found.r += r; found.g += g; found.b += b;
          } else {
            buckets.set(key, { count: 1, r, g, b });
          }
        }

        const ranked = [...buckets.values()]
          .sort((a, b) => b.count - a.count)
          .map(v => [Math.round(v.r / v.count), Math.round(v.g / v.count), Math.round(v.b / v.count)]);

        // Keep colours that are visibly different from the ones already chosen.
        const picked = [];
        for (const [r, g, b] of ranked) {
          const distinct = picked.every(
            ([pr, pg, pb]) => Math.abs(pr - r) + Math.abs(pg - g) + Math.abs(pb - b) > 90,
          );
          if (distinct) picked.push([r, g, b]);
          if (picked.length === 7) break;
        }

        resolve(picked.map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`));
      } catch {
        // Tainted canvas or no 2d context — fall back to no swatches.
        resolve([]);
      }
    };
    img.src = tinyUrl(url);
  });
}

/** Dominant colours of a product photo, for the colour swatch row. */
export function useImagePalette(url) {
  const [palette, setPalette] = useState(() => cache.get(url) || []);

  useEffect(() => {
    if (!url) return undefined;
    if (cache.has(url)) {
      setPalette(cache.get(url));
      return undefined;
    }

    let active = true;
    const pending = inflight.get(url) || extract(url);
    inflight.set(url, pending);

    pending.then(colours => {
      cache.set(url, colours);
      inflight.delete(url);
      if (active) setPalette(colours);
    });

    return () => { active = false; };
  }, [url]);

  return palette;
}
