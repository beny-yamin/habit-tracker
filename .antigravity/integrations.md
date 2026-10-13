# THIRD-PARTY INTEGRATION DIRECTIVES

## 1. Firebase Authentication (Client & Server)
- Purpose: Identity management, user registration, login, and token generation.
- Client SDK: `client/src/config/firebase.ts` handles Google Sign-In and Email/Password auth.
- Server Admin SDK: `server/src/config/firebaseAdmin.ts` uses `firebase-admin` to cryptographically verify incoming Bearer tokens on protected endpoints (`req.headers.authorization`).
- Rule: NEVER store user passwords or local session cookies on the server; authenticate exclusively via Firebase ID tokens.

## 2. MongoDB Atlas & Mongoose
- Purpose: Cloud document persistence for users, habits, daily logs, and monthly reflections.
- Connection: Managed in `server/src/config/db.ts` using `mongoose.connect(process.env.MONGODB_URI)`.
- Multi-tenancy: Every document (`Habit`, `HabitLog`, `Reflection`) must include a `userId` field representing the Firebase `uid`.
- Idempotency: Daily habit entries must use the compound index `{ userId: 1, habitId: 1, date: 1 }` with Mongoose `bulkWrite` upserts to prevent duplicate records.

## 3. Environment Variable Enforcement
- Server (`server/.env`):
  - `MONGODB_URI`
  - `FIREBASE_PROJECT_ID=jaaamin-rox`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
  - `PORT=5173`
  - `CLIENT_ORIGIN=http://localhost:5173`
- Client (`client/.env`):
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_API_BASE_URL=http://localhost:5173/api`
- Rule: NEVER commit real credentials or keys to Git.