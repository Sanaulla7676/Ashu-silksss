export const money = n => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(Number(n || 0));

export const mediaUrl = p => p?.media?.[0] || '';

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
