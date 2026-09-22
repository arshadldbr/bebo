import { getDb, admin } from "./firebaseAdmin";

/**
 * Gemini's real free-tier limits for gemini-3.1-flash-tts-preview, as
 * confirmed in the AI Studio "Rate Limits" panel: 5 requests/minute,
 * 10 requests/day. These apply GLOBALLY across every user of this app
 * (free or paid license) as long as GEMINI_TIER is "free" — because on
 * the free tier, everyone shares the same underlying Gemini quota
 * regardless of what plan they bought from us.
 *
 * Once real Gemini billing is enabled, set the GEMINI_TIER env var to
 * "paid" to bypass this limiter entirely (Gemini's own paid-tier limits
 * are far higher and don't need this extra layer).
 */
const RPD_LIMIT = 10;
const MIN_SECONDS_BETWEEN_REQUESTS = 13; // safely under 5 RPM (12s exactly)

const RATE_DOC_PATH = ["systemState", "geminiRateLimit"] as const;

function todayString(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: "daily_limit" | "rate_limit";
  retryAfterSeconds?: number;
  message?: string;
}

/**
 * Checks (and, if allowed, atomically reserves) capacity for one Gemini
 * TTS request. Call this right before calling Gemini — if allowed is
 * false, do NOT call Gemini; return the wait/retry info to the client
 * instead.
 */
export async function checkAndReserveGeminiSlot(): Promise<RateLimitResult> {
  // Paid-tier bypass: once real billing is on, Gemini's own limits are
  // generous enough that this extra layer isn't needed.
  if ((process.env.GEMINI_TIER || "free").toLowerCase() === "paid") {
    return { allowed: true };
  }

  const db = getDb();
  const ref = db.collection(RATE_DOC_PATH[0]).doc(RATE_DOC_PATH[1]);
  const today = todayString();

  try {
    return await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      const data = doc.exists ? doc.data()! : {};

      const storedDate = data.date as string | undefined;
      const requestsToday = storedDate === today ? (data.requestsToday as number) || 0 : 0;
      const lastRequestAtMs = data.lastRequestAtMs as number | undefined;

      // Daily cap check.
      if (requestsToday >= RPD_LIMIT) {
        const midnightUtc = new Date();
        midnightUtc.setUTCHours(24, 0, 0, 0);
        const secondsUntilReset = Math.max(1, Math.ceil((midnightUtc.getTime() - Date.now()) / 1000));
        return {
          allowed: false,
          reason: "daily_limit",
          retryAfterSeconds: secondsUntilReset,
          message: "Aaj ki free generation limit khatam ho gayi hai. Kal dobara koshish karein, ya turant chalane ke liye upgrade karein.",
        };
      }

      // Per-minute spacing check.
      const now = Date.now();
      if (lastRequestAtMs) {
        const elapsedSeconds = (now - lastRequestAtMs) / 1000;
        if (elapsedSeconds < MIN_SECONDS_BETWEEN_REQUESTS) {
          const wait = Math.ceil(MIN_SECONDS_BETWEEN_REQUESTS - elapsedSeconds);
          return {
            allowed: false,
            reason: "rate_limit",
            retryAfterSeconds: wait,
            message: `Is waqt bohot log free plan use kar rahe hain. Thoda intezar karein (~${wait} seconds), ya turant chalane ke liye upgrade karein.`,
          };
        }
      }

      // Reserve this slot.
      tx.set(
        ref,
        {
          date: today,
          requestsToday: requestsToday + 1,
          lastRequestAtMs: now,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { allowed: true };
    });
  } catch (err) {
    console.error("Rate limiter error:", err);
    // Fail open: a rate-limiter outage shouldn't block a user's request,
    // and Gemini itself will reject the call if the real quota is exceeded.
    return { allowed: true };
  }
}
