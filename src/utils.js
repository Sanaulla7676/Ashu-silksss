export const money = n => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(Number(n || 0));

export const mediaUrls = product => {
  const media = product?.media;
  if (Array.isArray(media)) {
    return media.filter(url => typeof url === 'string' && url.trim()).map(url => url.trim());
  }
  if (typeof media === 'string') {
    return media.split(/\r?\n/).map(url => url.trim()).filter(Boolean);
  }
  return [];
};

export const mediaUrl = product => mediaUrls(product)[0] || '';

// Sarees photographed on the marble floor are shown on the same warm cream
// backdrop as the studio shoot of 2026-08-31. Cloudinary cuts the saree out
// at delivery time, so the uploaded original is untouched and this is
// reversible by deleting the transformation. Photos already taken in the
// studio keep their own backdrop â€” cutting them out would remove the props
// styled beside the saree.
const STUDIO_BACKDROP = 'c_limit,w_1200/e_background_removal/b_rgb:f9e6cb/q_auto';
const ALREADY_ON_CREAM = /\/ashu-silks\/products\/(import-2026-08-31|studio-)/;

export const productImage = url => {
  if (!url || !/\/image\/upload\/v\d+\/ashu-silks\/products\//.test(url)) return url;
  if (ALREADY_ON_CREAM.test(url)) return url;
  return url.replace('/image/upload/', `/image/upload/${STUDIO_BACKDROP}/`);
};

export const discountPercent = (price, mrp) => {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);¶»§q«^