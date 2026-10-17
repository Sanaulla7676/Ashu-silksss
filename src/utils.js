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

export const mediaUrl = product => mediaUrls(product)[0] || '';

// Sarees photographed on the marble floor are shown on the same warm cream
// backdrop as the studio shoot of 2026-08-31. Cloudinary cuts the saree out
// at delivery time, so the uploaded original is untouched and this is
// reversible by deleting the transformation. Photos already taken in the
// studio keep their own backdrop — cutting them out would remove the props
// styled beside the saree.
const STUDIO_BACKDROP = 'c_limit,w_1200/e_background_removal/b_rgb:f9e6cb/q_auto';
const ALREADY_ON_CREAM = /\/ashu-silks\/products\/(import-\d{4}-\d{2}-\d{2}|studio-)/;

export const productImage = url => {
  if (!url || !/\/image\/upload\/v\d+\/ashu-silks\/products\//.test(url)) return url;
  if (ALREADY_ON_CREAM.test(url)) return url;
  return url.replace('/image/upload/', `/image/upload/${STUDIO_BACKDROP}/`);
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
