import { getDb, admin } from "./firebaseAdmin";

export interface LicenseCheckResult {
  valid: boolean;
  error?: string;
  license?: {
    status: string;
    expiryDate: string | null;
    totalChars: number | null;
    usedChars: number;
    userName: string | null;
  };
}

function normalizeKey(key: string): string {
  return key.trim().toUpperCase();
}

function isExpired(expiryDate: string | null | undefined): boolean {
  if (!expiryDate) return false;
  const expiryTime = new Date(expiryDate).getTime();
  if (Number.isNaN(expiryTime)) return false;
  return Date.now() > expiryTime;
}

function toPublicLicense(data: FirebaseFirestore.DocumentData) {
  return {
    status: data.status ?? "unused",
    expiryDate: data.expiryDate ?? null,
    totalChars: data.totalChars ?? null,
    usedChars: data.usedChars ?? 0,
    userName: data.userName ?? null,
  };
}

/**
 * Validates a license key for a given device, and — on first use —
 * activates it (binds it to that device). Does NOT deduct character
 * quota; call consumeQuota() after a successful generation.
 *
 * Runs as a Firestore transaction so two simultaneous activation
 * attempts on the same fresh key can't both "win".
 */
export async function validateLicense(
  rawKey: string,
  deviceId: string,
  charsNeeded = 0
): Promise<LicenseCheckResult> {
  if (!rawKey || !rawKey.trim()) {
    return { valid: false, error: "License key is required." };
  }
  if (!deviceId || !deviceId.trim()) {
    return { valid: false, error: "Device ID is required." };
  }

  const key = normalizeKey(rawKey);
  const db = getDb();
  const ref = db.collection("licenses").doc(key);

  try {
    return await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);

      if (!doc.exists) {
        return { valid: false, error: "Invalid license key." };
      }

      const data = doc.data()!;

      if (data.status === "blocked") {
        return { valid: false, error: "This license has been blocked. Please contact support." };
      }

      if (isExpired(data.expiryDate)) {
        return { valid: false, error: "This license has expired. Please renew." };
      }

      if (data.status === "active" && data.deviceId && data.deviceId !== deviceId) {
        return { valid: false, error: "This license is already activated on another device." };
      }

      if (data.totalChars != null) {
        const used = data.usedChars || 0;
        if (used + charsNeeded > data.totalChars) {
          return { valid: false, error: "Character quota exceeded for this license." };
        }
      }

      // First-time activation: bind the key to this device.
      if (data.status === "unused") {
        const updates = {
          status: "active",
          deviceId,
          activatedAt: new Date().toISOString(),
        };
        tx.update(ref, updates);
        return { valid: true, license: toPublicLicense({ ...data, ...updates }) };
      }

      return { valid: true, license: toPublicLicense(data) };
    });
  } catch (err: any) {
    console.error("License validation error:", err);
    return { valid: false, error: "Could not verify license right now. Please try again." };
  }
}

/**
 * Increments usedChars after a successful TTS generation.
 * Call this only after Gemini has actually returned audio, so failed
 * requests don't burn the user's quota.
 */
export async function consumeQuota(rawKey: string, chars: number): Promise<void> {
  if (chars <= 0) return;
  const key = normalizeKey(rawKey);
  const db = getDb();
  const ref = db.collection("licenses").doc(key);

  try {
    await ref.update({
      usedChars: admin.firestore.FieldValue.increment(chars),
    });
  } catch (err) {
    // Non-fatal: the user already got their audio. Log for visibility only.
    console.error("Failed to update usedChars for license", key, err);
  }
}
