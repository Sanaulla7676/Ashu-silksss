#!/usr/bin/env node

/**
 * Grant the trusted Ashu Silks store administrator the server-managed
 * Firebase custom claim required by the dashboard and Firestore rules.
 *
 * Run locally only with privileged Firebase Admin credentials. Never deploy
 * service-account credentials or this permission grant as a public endpoint.
 */
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

const email = argument('--email').trim().toLowerCase();
const uid = argument('--uid').trim();
const confirm = process.argv.includes('--confirm');
const projectId = String(process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '').trim();

if (Boolean(email) === Boolean(uid)) {
  console.error('Provide exactly one target: --email "admin@example.com" OR --uid "firebase-uid".');
  process.exit(2);
}
if (!projectId) {
  console.error('Set FIREBASE_PROJECT_ID (or GOOGLE_CLOUD_PROJECT) to the verified Firebase project ID.');
  process.exit(2);
}
if (!confirm) {
  console.error('Preview only: add --confirm after verifying the project and target account to make the change.');
}

try {
  const app = initializeApp({ credential: applicationDefault(), projectId });
  const auth = getAuth(app);
  const user = email ? await auth.getUserByEmail(email) : await auth.getUser(uid);

  console.log('Firebase project:', projectId);
  console.log('Target email:', user.email || '(no email)');
  console.log('Target UID:', user.uid);
  console.log('Email verified:', Boolean(user.emailVerified));
  console.log('Existing custom claims:', JSON.stringify(user.customClaims || {}));

  if (user.disabled) {
    throw new Error('This Firebase Auth account is disabled. Re-enable it only after verifying that it should be an administrator.');
  }
  if (!user.email || !user.emailVerified) {
    throw new Error('The target user must have a verified email address before admin permission is granted.');
  }

  const nextClaims = { ...(user.customClaims || {}), admin: true };
  if (nextClaims.admin === true) {
    console.log('No change needed: admin=true is already set.');
    process.exit(0);
  }
  if (!confirm) {
    console.log('No changes made. Re-run with --confirm to apply admin=true to this exact account.');
    process.exit(0);
  }

  await auth.setCustomUserClaims(user.uid, nextClaims);
  const updated = await auth.getUser(user.uid);
  if (updated.customClaims?.admin !== true) {
    throw new Error('Firebase did not return admin=true after the update. Verify project permissions and retry.');
  }

  console.log('\nSUCCESS: admin=true granted to', updated.email);
  console.log('Existing claims were preserved.');
  console.log('Next step: sign out of Ashu Silks and sign in again so the ID token refreshes.');
} catch (error) {
  console.error('\nCould not set the admin claim:', error?.message || error);
  process.exitCode = 1;
}
