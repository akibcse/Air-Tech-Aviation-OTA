# Firebase Integration

This project now uses Firebase Authentication and Firestore for user management.

## Setup Steps

1.  **Environment Variables**:
    The `.env.local` file has been updated with your provided Firebase credentials.

2.  **Firestore Rules**:
    Go to your Firebase Console -> Firestore Database -> Rules and paste the content of `firestore.rules`:
    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /users/{userId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    ```

3.  **Authentication Providers**:
    Go to your Firebase Console -> Authentication -> Sign-in method.
    Enable **Email/Password**.

4.  **Backend Verification (Optional)**:
    If you want backend API routes to verify Firebase tokens efficiently using the Admin SDK:
    - Go to Project Settings -> Service accounts.
    - Generate a new private key.
    - Add the following to `.env.local`:
      ```
      FIREBASE_CLIENT_EMAIL=your-client-email
      FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
      ```
    - The code in `src/lib/firebase-admin.ts` is already set up to use these variables.

## Features Added

- **User Registration**: `/auth/register`
- **User Login**: `/auth/login`
- **Forgot Password**: `/auth/forgot-password`
- **Dashboard**: `/dashboard` (Protected)
- **Role-Based Access**: User roles stored in Firestore.
- **Route Protection**: Payment page and Dashboard are protected.
- **Navbar**: Dynamic Login/Logout buttons.
- **Context**: `AuthContext` makes user data available globally.
