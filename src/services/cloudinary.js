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
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Upload failed.');
  return data.secure_url;
}

export async function uploadProductImage(file, productId = 'new') {
  if (!cloudinaryReady) throw new Error('Cloudinary is not configured.');
  if (!file) throw new Error('Choose an image first.');
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('Use JPG, PNG, WEBP or AVIF images.');
  if (file.size > MAX_SIZE) throw new Error('Image must be 8 MB or smaller.');
  return upload(file, { resourceType: 'image', folder: `ashu-silks/products/${productId}` });
}

// Accepts an image OR a short video for the homepage hero.
export async function uploadHeroMedia(file) {
  if (!cloudinaryReady) throw new Error('Cloudinary is not configured.');
  if (!file) throw new Error('Choose a file first.');
  if (IMAGE_TYPES.includes(file.type)) {
    if (file.size > MAX_SIZE) throw new Error('Image must be 8 MB or smaller.');
    const url = await upload(file, { resourceType: 'image', folder: 'ashu-silks/hero' });
    return { type: 'image', url };
  }
  if (VIDEO_TYPES.includes(file.type)) {
    if (file.size > MAX_VIDEO_SIZE) throw new Error('Video must be 60 MB or smaller.');
    const url = await upload(file, { resourceType: 'video', folder: 'ashu-silks/hero' });
    return { type: 'video', url };
  }
  throw new Error('Use a JPG/PNG/WEBP image or an MP4/WEBM video.');
}
