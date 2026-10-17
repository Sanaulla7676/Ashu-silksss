import test from 'node:test';
import assert from 'node:assert/strict';
import { mediaUrl, mediaUrls } from '../src/utils.js';

test('reads the first image from the current array format', () => {
  assert.equal(mediaUrl({ media: [' https://cdn.example/a.jpg ', 'https://cdn.example/b.jpg'] }), 'https://cdn.example/a.jpg');
});

test('supports a legacy single URL string', () => {
  assert.deepEqual(mediaUrls({ media: 'https://cdn.example/a.jpg' }), ['https://cdn.example/a.jpg']);
});

test('supports newline-separated legacy URLs without splitting commas inside a URL', () => {
  assert.deepEqual(mediaUrls({ media: 'https://cdn.example/image/upload/c_limit,w_1200/a.jpg\nhttps://cdn.example/b.jpg' }), [
    'https://cdn.example/image/upload/c_limit,w_1200/a.jpg',
    'https://cdn.example/b.jpg',
  ]);
});

test('deduplicates repeated photos and Cloudinary transformations of the same asset', () => {
  assert.deepEqual(mediaUrls({ media: [
    'https://res.cloudinary.com/demo/image/upload/c_limit,w_1200/v1700000000/ashu-silks/products/a.jpg?version=1',
    'https://res.cloudinary.com/demo/image/upload/q_auto/v1700000000/ashu-silks/products/a.jpg',
    'https://cdn.example/saree.jpg',
    'https://cdn.example/saree.jpg',
  ] }), [
    'https://res.cloudinary.com/demo/image/upload/c_limit,w_1200/v1700000000/ashu-silks/products/a.jpg?version=1',
    'https://cdn.example/saree.jpg',
  ]);
});

test('returns no media for empty or invalid values', () => {
  assert.deepEqual(mediaUrls({ media: null }), []);
  assert.deepEqual(mediaUrls({ media: 4 }), []);
  assert.equal(mediaUrl({}), '');
});
