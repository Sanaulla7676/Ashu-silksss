const MAX_SIZE = 8 * 1024 * 1024;
const MAX_VIDEO_SIZE = 60 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
export const cloudinaryReady = Boolean(cloudName && uploadPreset);

async function upload(file, { resourceType, folder }) {
  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', uploadPreset);
  body.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, { method: 'POST', body });
  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = { error: { message: await res.text() } };
  }
  if (!res.ok) throw new Error(data?.error?.message || `Upload failed (HTTP ${res.status}).`);
  if (!data?.secure_url) throw new Error('Upload finished without an image URL. Check the Cloudinary upload preset.');
  return data.secure_url;
}

export async function uploadProductImage(file, productId = 'new') {
  if (!cloudinaryReady) throw new Error('Cloudinary is not configured.');
  if (!file) throw new Error('Choose an image first.');
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('Use JPG, PNG, WEBP or AVIF images.');
  if ¶»§q«^