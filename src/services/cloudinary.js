import { getAuth } from 'firebase/auth';
import { app, firebaseReady } from '../firebase';

const MAX_SIZE = 8 * 1024 * 1024;
const MAX_VIDEO_SIZE = 60 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
export const cloudinaryReady = Boolean(cloudName);

function uniquePublicId(prefix = 'upload') {
  const random = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now()) + '-' + Math.random().toString(36).slice(2);
  return prefix + '-' + random;
}

async function signUpload(folder, publicId) {
  if (!firebaseReady || !app) throw new Error('Firebase is not configured.');
  const user = getAuth(app).currentUser;
  if (!user) throw new Error('Sign in with the store-owner account to upload media.');
  const token = await user.getIdToken();
  const response = await fetch('/api/cloudinary-sign', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder, publicId }),
  });
  let data = {};
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) throw new Error(data.error || 'Could not authorize the Cloudinary upload.');
  if (!data.cloudName || !data.apiKey || !data.signature || !data.timestamp) throw new Error('Cloudinary returned incomplete upload authorization.');
  if (cloudName && data.cloudName !== cloudName) throw new Error('The storefront and upload service are configured for different Cloudinary accounts.');
  return data;
}

async function upload(file, options) {
  const signed = await signUpload(options.folder, options.publicId);
  const body = new FormData();
  body.append('file', file);
  body.append('api_key', signed.apiKey);
  body.append('timestamp', String(signed.timestamp));
  body.append('folder', signed.folder);
  body.append('public_id', signed.publicId);
  body.append('signature', signed.signature);
  const response = await fetch(
    'https://api.cloudinary.com/v1_1/' + signed.cloudName + '/' + options.resourceType + '/upload',
    { method: 'POST', body }
  );
  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) data = await response.json();
  else data = { error: { message: await response.text() } };
  if (!response.ok) throw new Error(data?.error?.message || 'Cloudinary upload failed (HTTP ' + response.status + ').');
  if (!data?.secure_url) throw new Error('Cloudinary finished without returning a media URL.');
  return data.secure_url;
}

function assertImage(file) {
  if (!file) throw new Error('Choose an image first.');
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('Use JPG, PNG, WEBP or AVIF images.');
  if (file.size > MAX_SIZE) throw new Error('Image must be 8 MB or smaller.');
}

export async function uploadProductImage(file, productId = 'new', publicId) {
  if (!cloudinaryReady) throw new Error('Cloudinary is not configured.');
  assertImage(file);
  const safeProductPath = String(productId || 'new').split('/').filter(Boolean)
    .map(part => part.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 90)).filter(Boolean).join('/');
  if (!safeProductPath) throw new Error('Product folder name is invalid.');
  return upload(file, {
    resourceType: 'image',
    folder: 'ashu-silks/products/' + safeProductPath,
    publicId: publicId || uniquePublicId('image'),
  });
}

export async function uploadCategoryImage(file) {
  if (!cloudinaryReady) throw new Error('Cloudinary is not configured.');
  assertImage(file);
  return upload(file, {
    resourceType: 'image',
    folder: 'ashu-silks/categories',
    publicId: uniquePublicId('category'),
  });
}

export async function uploadHeroMedia(file) {
  if (!cloudinaryReady) throw new Error('Cloudinary is not configured.');
  if (!file) throw new Error('Choose a file first.');
  if (IMAGE_TYPES.includes(file.type)) {
    if (file.size > MAX_SIZE) throw new Error('Image must be 8 MB or smaller.');
    return { type: 'image', url: await upload(file, {
      resourceType: 'image', folder: 'ashu-silks/hero', publicId: uniquePublicId('hero'),
    }) };
  }
  if (VIDEO_TYPES.includes(file.type)) {
    if (file.size > MAX_VIDEO_SIZE) throw new Error('Video must be 60 MB or smaller.');
    return { type: 'video', url: await upload(file, {
      resourceType: 'video', folder: 'ashu-silks/hero', publicId: uniquePublicId('hero-video'),
    }) };
  }
  throw new Error('Use a JPG/PNG/WEBP image or an MP4/WEBM video.');
}
