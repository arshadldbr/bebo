import admin from "firebase-admin";
import fs from "fs";
import path from "path";

let initialized = false;

/**
 * Initializes the Firebase Admin SDK exactly once.
 *
 * Supports two ways of supplying credentials (checked in this order):
 *  1. FIREBASE_SERVICE_ACCOUNT_KEY — the full service account JSON as a
 *     single-line string in an environment variable. Use this on hosts
 *     like Render / Railway / Cloud Run where you set env vars in a
 *     dashboard and can't easily upload a file.
 *  2. A local secrets/serviceAccountKey.json file (used automatically in
 *     local development). This file is git-ignored and must NEVER be
 *     committed or shipped to the client/browser.
 */
function initFirebaseAdmin() {
  if (initialized || admin.apps.length > 0) {
    initialized = true;
    return;
  }

  const rawEnvKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const localKeyPath = path.join(process.cwd(), "secrets", "serviceAccountKey.json");

  let serviceAccount: admin.ServiceAccount;

  if (rawEnvKey && rawEnvKey.trim()) {
    try {
      serviceAccount = JSON.parse(rawEnvKey);
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY is set but is not valid JSON. Paste the full service account JSON as a single line."
      );
    }
  } else if (fs.existsSync(localKeyPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, "utf-8"));
  } else {
    throw new Error(
      "No Firebase service account credentials found. Set FIREBASE_SERVICE_ACCOUNT_KEY (env var) or place the key at secrets/serviceAccountKey.json."
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  initialized = true;
}

export function getDb(): admin.firestore.Firestore {
  initFirebaseAdmin();
  return admin.firestore();
}

export { admin };
