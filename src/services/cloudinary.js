const MAX_SIZE = 8 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
export const cloudinaryReady = Boolean(cloudName && uploadPreset);

export async function uploadProductImage(file, productId = 'new') {
  if (!cloudinaryReady) throw new Error('Cloudinary is not configured.');
  if (!file) throw new Error('Choose an image first.');
  if (!TYPES.includes(file.type)) throw new Error('Use JPG, PNG, WEBP or AVIF images.');
  if (file.size > MAX_SIZE) throw new Error('Image must be 8 MB or smaller.');

  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', uploadPreset);
  body.append('folder', `ashu-silks/products/${productId}`);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Image upload failed.');
  return data.secure_url;
}
