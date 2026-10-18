export const money = n => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(Number(n || 0));

function mediaKey(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    url.search = '';
    url.hash = '';
    if (/(^|\.)cloudinary\.com$/i.test(url.hostname)) {
      const parts = url.pathname.split('/');
      const uploadIndex = parts.indexOf('upload');
      const versionIndex = parts.findIndex((part, index) => index > uploadIndex && /^v\d+$/.test(part));
      if (uploadIndex >= 0 && versionIndex > uploadIndex) {
        url.pathname = [...parts.slice(0, uploadIndex + 1), ...parts.slice(versionIndex)].join('/');
      }
    }
    return url.origin + url.pathname;
  } catch {
    return raw.split(/[?#]/, 1)[0];
  }
}

export const mediaUrls = product => {
  const media = product?.media;
  const candidates = Array.isArray(media) ? media : typeof media === 'string' ? media.split(/\r?\n/) : [];
  const seen = new Set();
  const result = [];
  for (const value of candidates) {
    if (typeof value !== 'string' || !value.trim()) continue;
    const url = value.trim();
    const key = mediaKey(url);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(url);
  }
  return result;
};

export const isVideoMedia = url => /\.(mp4|webm|mov)(?:[?#]|$)/i.test(String(url || ''))
  || String(url || '').includes('/video/upload/');

function productImageIndexes(product) {
  const indexes = Array.isArray(product?.imageIndexes) ? product.imageIndexes : [];
  const unique = [...new Set(indexes.map(Number).filter(
    index => Number.isInteger(index) && index >= 0 && index < 192
  ))];
  if (unique.length) return unique;
  const single = Number(product?.imageIndex);
  return product?.imageIndex !== undefined && Number.isInteger(single) && single >= 0 && single < 192
    ? [single]
    : [];
}

// Counts genuine image URLs and assigned atlas tiles without double-counting
// the same product's fallback tiles when some of those photos are already URLs.
export const productPhotoCount = product => {
  const uploadedPhotoCount = mediaUrls(product).filter(url => !isVideoMedia(url)).length;
  const fallbackPhotoCount = productImageIndexes(product).length;
  return Math.max(uploadedPhotoCount, fallbackPhotoCount);
};

export const mediaUrl = product => mediaUrls(product)[0] || '';

// Optimize Cloudinary delivery separately from the stored original: modern formats,
// automatic quality and a width cap reduce transfer size without changing catalogue data.
// The product backdrop treatment remains reversible and is skipped for studio/import photos.
const ALREADY_ON_CREAM = /\/ashu-silks\/products\/(import-\d{4}-\d{2}-\d{2}|studio-)/;

export const productImage = (url, requestedWidth = 900) => {
  if (!url || typeof url !== 'string') return url;
  if (!/^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//i.test(url)) return url;

  const width = Math.max(320, Math.min(1600, Math.round(Number(requestedWidth) || 900)));
  let parsed;
  try { parsed = new URL(url); } catch { return url; }

  const parts = parsed.pathname.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex < 0) return url;
  const versionIndex = parts.findIndex((part, index) => index > uploadIndex && /^v\d+$/.test(part));
  if (versionIndex < 0) return url;

  let transformations = parts.slice(uploadIndex + 1, versionIndex);
  const assetPath = parts.slice(versionIndex).join('/');
  const hasExistingTransform = transformations.length > 0;
  if (!hasExistingTransform) transformations = [`f_auto,q_auto:good,c_limit,w_${width}`];

  const isProductPhoto = /\/ashu-silks\/products\//.test(parsed.pathname);
  const alreadyHasBackgroundTreatment = transformations.some(part => part.includes('e_background_removal'))
    || parts.slice(uploadIndex + 1, versionIndex).includes('e_background_removal');
  if (isProductPhoto && !ALREADY_ON_CREAM.test(parsed.pathname) && !alreadyHasBackgroundTreatment) {
    transformations = [...transformations, 'e_background_removal', 'b_rgb:f9e6cb'];
  }

  parsed.pathname = [
    ...parts.slice(0, uploadIndex + 1),
    ...transformations,
    ...assetPath.split('/'),
  ].join('/');
  return parsed.toString();
};

export const discountPercent = (price, mrp) => {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
};

export const slugify = str =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const generateOrderId = () => {
  return 'AS' + Date.now().toString().slice(-8);
};

// Opens the customer's own UPI app (PhonePe/GPay/Paytm/...) with the amount
// pre-filled. No gateway involved, so there is no programmatic confirmation
// that the payment succeeded — the caller must get that from the customer.
export const generateUpiLink = ({ vpa, name, amount, note }) => {
  const params = new URLSearchParams({
    pa: vpa,
    pn: name,
    am: String(Math.round(amount)),
    cu: 'INR',
    tn: note || '',
  });
  return `upi://pay?${params.toString()}`;
};
