import { createHash, createPublicKey, createVerify } from 'node:crypto';

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let cachedJwks;
let cachedJwksUntil = 0;

function jsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try {
    return JSON.parse(typeof req.body === 'string' ? req.body : String(req.body || '{}'));
  } catch {
    return {};
  }
}

async function getJwks() {
  if (cachedJwks && Date.now() < cachedJwksUntil) return cachedJwks;
  const response = await fetch(JWKS_URL);
  if (!response.ok) throw new Error('Unable to verify the Firebase sign-in token.');
  cachedJwks = await response.json();
  cachedJwksUntil = Date.now() + 45 * 60 * 1000;
  return cachedJwks;
}

async function verifyFirebaseAdminToken(token, projectId) {
  const pieces = String(token || '').split('.');
  if (pieces.length !== 3) throw new Error('Sign in with the store-owner account to continue.');

  let header;
  let payload;
  try {
    header = JSON.parse(Buffer.from(pieces[0], 'base64url').toString('utf8'));
    payload = JSON.parse(Buffer.from(pieces[1], 'base64url').toString('utf8'));
  } catch {
    throw new Error('The Firebase sign-in token is invalid.');
  }

  const now = Math.floor(Date.now() / 1000);
  if (
    header.alg !== 'RS256' ||
    !header.kid ||
    payload.aud !== projectId ||
    payload.iss !== 'https://securetoken.google.com/' + projectId ||
    !payload.sub ||
    Number(payload.exp) <= now ||
    Number(payload.iat) > now + 60
  ) {
    throw new Error('The Firebase sign-in token is invalid or expired.');
  }

  const keySet = await getJwks();
  const jwk = (keySet.keys || []).find(key => key.kid === header.kid && key.kty === 'RSA');
  if (!jwk) throw new Error('Unable to verify the Firebase sign-in token.');

  const verifier = createVerify('RSA-SHA256');
  verifier.update(pieces[0] + '.' + pieces[1]);
  verifier.end();
  const publicKey = createPublicKey({ key: jwk, format: 'jwk' });
  const valid = verifier.verify(publicKey, Buffer.from(pieces[2], 'base64url'));
  if (!valid) throw new Error('The Firebase sign-in token is invalid.');
  if (payload.admin !== true) {
    const error = new Error('Only the store-owner admin account can sign uploads.');
    error.statusCode = 403;
    throw error;
  }
}

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'Method not allowed.');
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!projectId || !cloudName || !apiKey || !apiSecret) {
    return sendError(res, 503, 'Cloudinary signed uploads are not configured on the server.');
  }

  const authHeader = req.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  if (!match) return sendError(res, 401, 'Sign in with the store-owner account to continue.');

  try {
    await verifyFirebaseAdminToken(match[1], projectId);
  } catch (error) {
    return sendError(res, error.statusCode || 401, error.message || 'Authentication failed.');
  }

  const body = jsonBody(req);
  const folder = String(body.folder || '');
  const publicId = String(body.publicId || '');
  const allowedFolder = /^ashu-silks\/(?:products\/[A-Za-z0-9_-]{1,90}(?:\/[A-Za-z0-9_-]{1,90})?|categories|hero)$/;
  if (!allowedFolder.test(folder)) {
    return sendError(res, 400, 'Upload folder is not permitted.');
  }
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(publicId)) {
    return sendError(res, 400, 'Image identifier is invalid.');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, public_id: publicId, timestamp };
  const toSign = Object.keys(params)
    .sort()
    .map(key => key + '=' + params[key])
    .join('&') + apiSecret;
  const signature = createHash('sha1').update(toSign).digest('hex');

  return res.status(200).json({
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
    publicId,
  });
}
