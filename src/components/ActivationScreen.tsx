import React, { useState } from "react";
import { KeyRound, Loader2, MessageCircle, Sparkles, Check } from "lucide-react";
import { getDeviceId, setStoredLicenseKey } from "../lib/device";

interface ActivationScreenProps {
  onActivated: () => void;
}

const GREEN_DARK = "#01411c";
const GREEN_LIGHT = "#146c3a";

const PLANS = [
  {
    name: "Free",
    price: "مفت",
    chars: "1,000 حروف",
    minutes: "~1.3 منٹ آڈیو",
    note: "صرف ایک بار، ٹیسٹ کرنے کے لیے",
  },
  {
    name: "Basic",
    price: "Rs. 500 / ماہانہ",
    chars: "5,000 حروف",
    minutes: "~7 منٹ آڈیو",
  },
  {
    name: "Inter",
    price: "Rs. 1,000 / ماہانہ",
    chars: "15,000 حروف",
    minutes: "~20 منٹ آڈیو",
  },
  {
    name: "Pro",
    price: "Rs. 2,000 / ماہانہ",
    chars: "45,000 حروف",
    minutes: "~60 منٹ آڈیو",
  },
];

const urdu = { fontFamily: "'Noto Nastaliq Urdu', serif", lineHeight: 2, direction: "rtl" as const };

export function ActivationScreen({ onActivated }: ActivationScreenProps) {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivate = async () => {
    const trimmed = key.trim().toUpperCase();
    if (!trimmed) {
      setError("براہ کرم اپنی لائسنس کی درج کریں۔");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const deviceId = getDeviceId();
      const response = await fetch("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: trimmed, deviceId }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "ایکٹیویشن ناکام ہوئی۔ اپنی کی چیک کریں۔");
      }

      setStoredLicenseKey(trimmed);
      onActivated();
    } catch (err: any) {
      setError(err.message || "کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔");
    } finally {
      setLoading(false);
    }
  };

  const handleFreeTrial = async () => {
    setTrialLoading(true);
    setError(null);
    try {
      const deviceId = getDeviceId();
      const response = await fetch("/api/license/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "فری ٹرائل شروع نہیں ہو سکا۔");
      }

      setStoredLicenseKey(data.key);
      onActivated();
    } catch (err: any) {
      setError(err.message || "کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔");
    } finally {
      setTrialLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#f1f5f9" }}>
      <div
        className="w-full max-w-sm bg-white rounded-3xl overflow-hidden"
        style={{ boxShadow: "0 20px 50px -12px rgba(1,65,28,0.35)" }}
      >
        {/* Header */}
        <div
          className="px-6 pt-7 pb-6 text-center"
          style={{ background: `linear-gradient(160deg, ${GREEN_LIGHT}, ${GREEN_DARK})` }}
        >
          <div
            className="w-14 h-14 rounded-2xl bg-white mx-auto flex items-center justify-center mb-3"
            style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.25)" }}
          >
            <KeyRound className="w-7 h-7" style={{ color: GREEN_DARK }} />
          </div>
          <h1 className="text-white font-extrabold text-lg">Aawaz TTS</h1>
          <p className="text-emerald-100 text-sm mt-1" style={urdu}>
            اپنی لائسنس کی درج کریں
          </p>
        </div>

        <div className="px-6 py-5">
          {/* Key input */}
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleActivate()}
            placeholder="XXXX-XXXX-XXXX"
            autoCapitalize="characters"
            className="w-full text-sm font-mono tracking-wider px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-center uppercase"
            style={{ borderColor: key ? GREEN_DARK : undefined }}
          />

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mt-2" style={urdu}>
              {error}
            </p>
          )}

          <button
            onClick={handleActivate}
            disabled={loading || trialLoading}
            className="w-full mt-3 px-6 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-white"
            style={{
              background: `linear-gradient(160deg, ${GREEN_LIGHT}, ${GREEN_DARK})`,
              boxShadow: "0 6px 16px -4px rgba(1,65,28,0.5)",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span style={urdu}>فعال ہو رہا ہے...</span>
              </>
            ) : (
              <span style={urdu}>لائسنس فعال کریں</span>
            )}
          </button>

          {/* Free trial */}
          <button
            onClick={handleFreeTrial}
            disabled={loading || trialLoading}
            className="w-full mt-2.5 px-6 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderColor: "#c2ded0", color: GREEN_DARK, background: "#f0f9f4" }}
          >
            {trialLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span style={urdu}>مفت آزمائش شروع کریں</span>
          </button>

          {/* WhatsApp CTA */}
          <a
            href="https://wa.me/923149891182?text=Key"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-transform active:scale-[0.98]"
            style={{ background: "#25D366", boxShadow: "0 4px 12px -2px rgba(37,211,102,0.5)" }}
          >
            <MessageCircle className="w-4 h-4" />
            <span style={urdu}>لائسنس کی حاصل کرنے کے لیے واٹس ایپ کریں</span>
          </a>
          <p className="text-center text-[10px] text-slate-400 mt-1.5" style={urdu}>
            +92 314 9891182 پر "Key" لکھ کر بھیجیں
          </p>

          {/* Plans */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-500 mb-2.5 text-center" style={urdu}>
              پلانز اور قیمتیں
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className="rounded-xl p-2.5 border border-slate-200 bg-slate-50 flex flex-col gap-0.5"
                >
                  <span className="text-xs font-bold text-slate-800">{plan.name}</span>
                  <span className="text-[11px] font-semibold" style={{ color: GREEN_DARK }}>
                    {plan.price}
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1" style={urdu}>
                    <Check className="w-2.5 h-2.5 flex-shrink-0" style={{ color: GREEN_DARK }} />
                    {plan.chars}
                  </span>
                  <span className="text-[10px] text-slate-400" style={urdu}>
                    {plan.minutes}
                  </span>
                  {plan.note && (
                    <span className="text-[9px] text-slate-400 mt-0.5" style={urdu}>
                      {plan.note}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
