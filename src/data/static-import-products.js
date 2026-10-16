import { VISUAL_PRODUCT_DETAILS } from './product-names-2026-10-15';

const BATCH = 'import-2026-10-15';

export function visualCategoryFor(name) {
  const value = String(name || '').toLowerCase();
  if (/checked|geometric|contrast|minimal|colour-block|color-block|woven-panel/.test(value)) return 'Designer';
  if (/heritage|ornamental|embellished|medallion|paisley|tassel|floral|botanical|motif|gold/.test(value)) return 'Festive Wear';
  return 'Traditional Sarees';
}

function inferPattern(name) {
  const value = String(name || '').toLowerCase();
  if (value.includes('checked')) return 'Checked';
  if (value.includes('geometric')) return 'Geometric motif';
  if (value.includes('paisley')) return 'Paisley-style motif';
  if (value.includes('medallion')) return 'Medallion motif';
  if (/floral|botanical|peacock|bird/.test(value)) return 'Floral / decorative motif';
  if (/ornamental|heritage/.test(value)) return 'Heritage motif';
  if (value.includes('woven')) return 'Woven pattern';
  if (value.includes('contrast')) return 'Contrast border';
  if (value.includes('border')) return 'Decorative border';
  if (value.includes('tassel')) return 'Tassel detail';
  if (value.includes('embellished')) return 'Embellished detail';
  return 'Traditional motif';
}

function inferOccasion(name) {
  const value = String(name || '').toLowerCase();
  if (/wedding|heritage|ornamental|tassel|gold|medallion|paisley|embellished|floral/.test(value)) return 'Festive / Wedding';
  if (/minimal|classic|contrast|geometric|checked/.test(value)) return 'Festive / Occasion Wear';
  return 'Celebration / Gifting';
}

// Names and colours are visual descriptions from the supplied photo batch.
// Exact fibre, weave, zari/work, price and stock are not guessed from photographs.
export const STATIC_IMPORT_PRODUCTS = Object.entries(VISUAL_PRODUCT_DETAILS).map(([sourceProductId, visual], index) => {
  const number = (sourceProductId.match(/\d+/) || [String(index + 1)])[0].padStart(3, '0');
  const sku = 'AS-IMP-20261015-' + number;
  const pattern = inferPattern(visual.name);
  const category = visualCategoryFor(visual.name);

  return {
    id: sku, name: visual.name, brand: 'Ashu Silks', category,
    collection: 'New Arrivals', sku, status: 'active',
    price: 0, mrp: 0, priceOnRequest: true, gstPercent: 5,
    stock: 0, stockOnRequest: true, colour: visual.colour, fabric: '',
    pattern, occasion: inferOccasion(visual.name), workType: '',
    blousePiece: '', sareeLength: '', washCare: '',
    description: visual.name + '. Colour and style labels are visual descriptions prepared from the supplied photo batch. Exact fabric composition, weave, zari/work details, dimensions, price and current stock have not been independently verified. Please enquire with Ashu Silks to confirm specifications and availability.',
    highlights: ['Visual colour: ' + visual.colour, 'Visual style: ' + pattern, 'Price and availability confirmed on enquiry'],
    tags: ['new arrival', 'saree', category.toLowerCase(), visual.colour.toLowerCase(), pattern.toLowerCase(), BATCH, sourceProductId.toLowerCase()],
    media: [], featured: false,
    createdAt: Date.parse('2026-10-15T00:00:00.000Z') - Number(number) * 1000,
    sourceBatch: BATCH, sourceProductId, imagePending: true,
  };
});
