export const money = n => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(Number(n || 0));

export const mediaUrl = p => p?.media?.[0] || '';

// Sarees photographed on the marble floor are shown on the same warm cream
// backdrop as the studio shoot of 2026-08-31. Cloudinary cuts the saree out
// at delivery time, so the uploaded original is untouched and this is
// reversible by deleting the transformation.
const STUDIO_BACKDROP = 'c_limit,w_1200/e_background_removal/b_rgb:f9e6cb/q_auto';
const ALREADY_ON_CREAM = /\/ashu-silks\/products\/import-2026-08-31\//;

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
