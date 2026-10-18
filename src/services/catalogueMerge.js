import { mediaUrls, productPhotoCount } from '../utils.js';

const HIDDEN_STATUSES = new Set(['draft', 'archived', 'inactive', 'hidden', 'deleted', 'unpublished']);
const skuKey = product => String(product?.sku || '').trim().toLowerCase();
const statusOf = product => String(product?.status || 'active').trim().toLowerCase();
const isVisible = product => !HIDDEN_STATUSES.has(statusOf(product));

export function fallbackPhotoCount(product) {
  return productPhotoCount(product);
}

function normalizeProduct(product, isFallback = false) {
  const result = { ...product };
  const urls = mediaUrls(result);
  if (Array.isArray(result.media)) result.media = urls;
  if (Array.isArray(result.imageIndexes)) {
    result.imageIndexes = [...new Set(result.imageIndexes.map(Number).filter(
      index => Number.isInteger(index) && index >= 0 && index < 192
    ))];
    if (!result.imageIndexes.length) delete result.imageIndexes;
  }
  if (urls.length) {
    result.media = urls;
    // Keep assigned atlas tiles as supplemental gallery photos. The gallery
    // renders these only after the uploaded photos, rather than dropping them.
    delete result.imagePending;
  }
  if (isFallback) {
    delete result.isFallbackProduct;
    result.isStaticFallback = true;
  } else {
    delete result.isStaticFallback;
    delete result.isFallbackProduct;
  }
  return result;
}

export function mergeCatalogueProducts(liveProducts = [], fallbackProducts = []) {
  const fallbacks = Array.isArray(fallbackProducts) ? fallbackProducts : [];
  const live = Array.isArray(liveProducts) ? liveProducts : [];
  const fallbackBySku = new Map();
  for (const product of fallbacks) {
    const key = skuKey(product);
    if (key && !fallbackBySku.has(key)) fallbackBySku.set(key, product);
  }

  const liveBySku = new Map();
  const liveWithoutSku = [];
  const liveIds = new Set();
  for (const product of live) {
    const key = skuKey(product);
    if (key) {
      if (!liveBySku.has(key)) liveBySku.set(key, product);
      continue;
    }
    const id = String(product?.id || '');
    if (id && liveIds.has(id)) continue;
    if (id) liveIds.add(id);
    liveWithoutSku.push(product);
  }

  const output = [];
  const fallbackSkusSeen = new Set();
  const fallbackIdsSeen = new Set();
  for (const fallback of fallbacks) {
    const key = skuKey(fallback);
    if (key && (liveBySku.has(key) || fallbackSkusSeen.has(key))) continue;
    if (key) fallbackSkusSeen.add(key);
    const id = String(fallback?.id || '');
    if (!key && id && fallbackIdsSeen.has(id)) continue;
    if (!key && id) fallbackIdsSeen.add(id);
    if (!isVisible(fallback)) continue;
    output.push(normalizeProduct(fallback, true));
  }

  for (const [key, product] of liveBySku) {
    if (!isVisible(product)) continue;
    const fallback = fallbackBySku.get(key);
    const merged = { ...(fallback || {}), ...product, id: product.id };
    const actualMedia = mediaUrls(product);
    const supplementalIndexes = Array.isArray(product.imageIndexes) && product.imageIndexes.length
      ? product.imageIndexes
      : fallback?.imageIndexes;
    const supplementalIndex = product.imageIndex !== undefined ? product.imageIndex : fallback?.imageIndex;
    if (actualMedia.length) {
      merged.media = actualMedia;
      if (Array.isArray(supplementalIndexes) && supplementalIndexes.length) merged.imageIndexes = supplementalIndexes;
      else delete merged.imageIndexes;
      if (supplementalIndex !== undefined) merged.imageIndex = supplementalIndex;
      delete merged.imagePending;
    } else if (mediaUrls(fallback).length) {
      merged.media = mediaUrls(fallback);
      if (Array.isArray(supplementalIndexes) && supplementalIndexes.length) merged.imageIndexes = supplementalIndexes;
      else delete merged.imageIndexes;
      if (supplementalIndex !== undefined) merged.imageIndex = supplementalIndex;
      delete merged.imagePending;
    } else {
      merged.media = [];
      if (Array.isArray(supplementalIndexes) && supplementalIndexes.length) merged.imageIndexes = supplementalIndexes;
      if (supplementalIndex !== undefined) merged.imageIndex = supplementalIndex;
    }
    output.push(normalizeProduct(merged, false));
  }

  for (const product of liveWithoutSku) {
    if (isVisible(product)) output.push(normalizeProduct(product, false));
  }
  return output;
}
