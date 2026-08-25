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
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_STORE_WHATSAPP=
```

Never add a Firebase Admin SDK service account or service-role secret to the frontend.

## 2. Firestore security

Deploy `firestore.rules`. Customer orders are readable only by the authenticated owner. Admin operations require a Firebase custom claim named `admin=true`.

## 3. Product images (Cloudinary)

Product image uploads in the admin dashboard go through Cloudinary, not Firebase Storage (Firebase Storage now requires the paid Blaze plan on new projects, which isn't necessary here).

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. Under **Settings → Upload → Upload presets**, add a new preset and set its signing mode to **Unsigned**.
3. Add these Vite variables:

```env
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

These values are not secret — an unsigned preset only allows uploads, not deletions or account changes — but keep the preset scoped to an images-only folder if you want tighter control.

## 4. Product catalogue

The current storefront still uses `src/data.js` as its catalogue source. Before replacing demo data with live inventory, create a `products` collection and migrate the catalogue. The supplied Firestore rules already allow public reads and admin writes.

## 5. Payments

The checkout currently supports store-confirmed methods such as Cash on Delivery, UPI on Delivery and Pay at Store. These are not online payment gateway transactions. Add Razorpay/Cashfree/another supported gateway only when merchant credentials and server-side payment verification are available.

## 6. Deployment (Vercel)

Build command:

```bash
npm ci
npm run build
```

Output directory: `dist`. `vercel.json` already rewrites every path to `index.html` so client-side routes (`/admin`, `/cart`, `/product/:id`, ...) don't 404 on direct load/refresh.

The repository ignores `node_modules`, `dist`, `.vercel`, local environment files and editor files.

## 7. Admin

For a real admin dashboard, use Firebase custom claims or another server-controlled authorization mechanism. Do not trust a client-editable profile field for admin privileges. Setting the `admin: true` custom claim requires a one-time script run locally with the Firebase Admin SDK and a service account key — never ship that key to the frontend or commit it.

## 8. Final production checks

- Enable Firebase Email/Password authentication.
- Deploy Firestore rules.
- Configure all Vercel environment variables (Firebase + Cloudinary + WhatsApp).
- Test registration, sign-in, sign-out and order history.
- Test checkout with real Firebase data.
- Add and verify payment gateway server-side verification before advertising online payments.
- Migrate products from `src/data.js` to Firestore before claiming live inventory management.
