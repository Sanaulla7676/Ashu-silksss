import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeCatalogueProducts, fallbackPhotoCount } from '../src/services/catalogueMerge.js';
import { STATIC_IMPORT_PRODUCTS } from '../src/data/static-import-products.js';

test('static saree seed contains all 118 distinct SKUs and all 192 source photo tiles', () => {
  assert.equal(STATIC_IMPORT_PRODUCTS.length, 118);
  assert.equal(new Set(STATIC_IMPORT_PRODUCTS.map(product => product.sku)).size, 118);
  assert.equal(STATIC_IMPORT_PRODUCTS.reduce((sum, product) => sum + fallbackPhotoCount(product), 0), 192);
  for (const product of STATIC_IMPORT_PRODUCTS) {
    assert.ok(product.imageIndexes.length >= 1, `${product.sku} should have at least one image`);
    assert.deepEqual(product.imageIndexes, product.imageIndexes.map((_, i) => product.imageIndexes[0] + i));
  }
});

test('active Firestore product overrides the fallback copy with the same SKU', () => {
  const merged = mergeCatalogueProducts(
    [{ id: 'firestore-1', sku: 'A-1', name: 'Updated name', price: 3499, status: 'active' }],
    [{ id: 'seed-1', sku: 'A-1', name: 'Seed name', price: 0 }, { id: 'seed-2', sku: 'A-2', name: 'Other saree' }],
  );
  assert.deepEqual(merged.map(p => p.id), ['seed-2', 'firestore-1']);
  assert.equal(merged.find(p => p.sku === 'A-1').price, 3499);
});

test('draft record suppresses its fallback so a hidden product cannot reappear', () => {
  const merged = mergeCatalogueProducts(
    [{ id: 'firestore-1', sku: 'A-1', name: 'Hidden product', status: 'draft' }],
    [{ id: 'seed-1', sku: 'A-1', name: 'Old fallback' }, { id: 'seed-2', sku: 'A-2', name: 'Other saree' }],
  );
  assert.deepEqual(merged.map(p => p.sku), ['A-2']);
});

test('uncatalogued products without SKUs remain available from fallback data', () => {
  const merged = mergeCatalogueProducts([], [{ id: 'no-sku', name: 'One-off' }]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].name, 'One-off');
});
