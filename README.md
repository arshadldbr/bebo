<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8d0d1f9d-2289-4a08-aa4b-8cc2c5d92861

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. `.env` is already filled in for you (Gemini API key + local service account key path). Do not commit or share this file.
3. Run the app:
   `npm run dev`

## License System

This app requires a valid license key (generated from your Firestore `licenses` admin panel) before it will run TTS generation.

- On first load, users see an **Activate Your License** screen.
- The key is validated **server-side** (`lib/license.ts`) using the Firebase Admin SDK — never trusted from the browser.
- A key is bound to one device on first activation (`deviceId`, stored in `localStorage`).
- Every `/api/tts/generate` call re-checks: blocked status, expiry date, device binding, and character quota (`totalChars` / `usedChars`) before generating audio, and only deducts quota on a successful generation.
- `secrets/serviceAccountKey.json` and `.env` are git-ignored — never commit them, upload them to GitHub, or send this zip file to anyone else. It contains your live Gemini key and Firebase admin credentials.

## 🔒 Firestore Lockdown — required, 3 steps

This package fixes the open-Firestore-rules vulnerability. Two of the three steps must be done in the Firebase Console (Claude has no access to your Google login, so these can't be automated):

**1. Enable Email/Password sign-in** (one-time)
Firebase Console → your project (`expense--tracker-be8e1`) → Authentication → Sign-in method → enable **Email/Password**.

**2. Create your admin login** (one-time)
Same Authentication section → Users tab → **Add user** → enter `arshadlaidbeer@gmail.com` and set any password you'll remember. This becomes your admin panel login — the old hardcoded `admin123` password is gone.

**3. Publish the locked-down rules** (one-time)
Firebase Console → Firestore Database → Rules tab → replace everything with the contents of `firestore.rules` (included in this package) → **Publish**.

After this, the `licenses` collection can only be read/written by someone signed in as `arshadlaidbeer@gmail.com` (the admin panel) or by your app's own backend via the Admin SDK (which always bypasses rules). No one else — no matter how technical — can create or edit license keys directly through the Firestore API anymore.

**Use `admin.html`** (included, in the project root) instead of your old admin panel file going forward — it now requires a real Firebase login instead of a JS password check.

## Files in this package
- `admin.html` — your license manager, now behind real Firebase Authentication
- `firestore.rules` — the locked-down security rules to paste into Firebase Console
- everything else — the TTS app itself, with server-side license enforcement already wired up and your Gemini key already configured
