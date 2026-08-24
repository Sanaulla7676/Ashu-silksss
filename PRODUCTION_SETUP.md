# Ashu Silks Production Setup

## 1. Firebase

Create a Firebase project and enable:
- Authentication → Sign-in method → Email/Password
- Firestore Database

Add these Vite variables in Vercel/local environment:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_STORE_WHATSAPP=
```

Never add a Firebase Admin SDK service account or service-role secret to the frontend.

## 2. Firestore security

Deploy `firestore.rules`. Customer orders are readable only by the authenticated owner. Admin operations require a Firebase custom claim named `admin=true`.

## 3. Product catalogue

The current storefront still uses `src/data.js` as its catalogue source. Before replacing demo data with live inventory, create a `products` collection and migrate the catalogue. The supplied Firestore rules already allow public reads and admin writes.

## 4. Payments

The checkout currently supports store-confirmed methods such as Cash on Delivery, UPI on Delivery and Pay at Store. These are not online payment gateway transactions. Add Razorpay/Cashfree/another supported gateway only when merchant credentials and server-side payment verification are available.

## 5. Deployment

Build command:

```bash
npm ci
npm run build
```

Vercel output directory: `dist`

The repository now ignores `node_modules`, `dist`, local environment files and editor files. Existing committed generated folders must still be removed from Git history separately if repository size reduction is required.

## 6. Admin

For a real admin dashboard, use Firebase custom claims or another server-controlled authorization mechanism. Do not trust a client-editable profile field for admin privileges.

## 7. Final production checks

- Enable Firebase Email/Password authentication.
- Deploy Firestore rules.
- Configure all Vercel environment variables.
- Test registration, sign-in, sign-out and order history.
- Test checkout with real Firebase data.
- Add and verify payment gateway server-side verification before advertising online payments.
- Migrate products from `src/data.js` to Firestore before claiming live inventory management.
- Remove committed `node_modules/` and `dist/` if repository size matters.
