# Deployment Guide - Air Tech Aviation OTA

This application is built with Next.js 15, Firebase, Amadeus, and Stripe.

## Prerequisites

1.  **Vercel Account**: For hosting the frontend/backend (Next.js).
2.  **Firebase Project**: For Authentication and Firestore Database.
3.  **Amadeus Developer Account**: For Flight Search API.
4.  **Stripe Account**: For Payment Processing.

## Environment Variables

Configure these in Vercel Project Settings:

### Amadeus API (Flight Search)
- `AMADEUS_CLIENT_ID`: Your Amadeus API Key.
- `AMADEUS_CLIENT_SECRET`: Your Amadeus API Secret.

### Firebase (Auth & DB)
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Web API Key.
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: `your-project.firebaseapp.com`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: `your-project-id`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: `your-project.firebasestorage.app`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Sender ID.
- `NEXT_PUBLIC_FIREBASE_APP_ID`: App ID.
- `FIREBASE_CLIENT_EMAIL`: Service Account Email (for Admin SDK).
- `FIREBASE_PRIVATE_KEY`: Service Account Private Key (handle newlines!).

### Stripe (Payments)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Public Key (pk_test_...).
- `STRIPE_SECRET_KEY`: Secret Key (sk_test_...).

## Post-Deployment Steps

1.  **Firestore Rules**: Ensure rules allow User read/write access (see `firestore.rules`).
2.  **Stripe Webhooks** (Optional): If implementing async events (not in MVP).
3.  **Admin Access**:
    - Sign up a user via `/auth/register`.
    - Go to Firestore Console -> `users` collection.
    - Find the user document and change property `role` from `"USER"` to `"ADMIN"`.
    - Access `/admin` dashboard.
