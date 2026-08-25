import React, { useState } from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { getDeviceId, setStoredLicenseKey } from "../lib/device";

interface ActivationScreenProps {
  onActivated: () => void;
}

export function ActivationScreen({ onActivated }: ActivationScreenProps) {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivate = async () => {
    const trimmed = key.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter your license key.");
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
        throw new Error(data.error || "Activation failed. Please check your key and try again.");
      }

      setStoredLicenseKey(trimmed);
      onActivated();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-8 flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <div>
          <h1 className="text-lg font-bold text-slate-900">Activate Your License</h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter the license key you received to unlock the Text to Speech Studio.
          </p>
        </div>

        <div className="w-full flex flex-col gap-2">
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleActivate()}
              placeholder="XXXX-XXXX-XXXX"
              autoCapitalize="characters"
              className="w-full text-sm font-mono tracking-wider pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-center uppercase"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleActivate}
            disabled={loading}
            className={`w-full px-6 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              loading
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Activating...
              </>
            ) : (
              "Activate"
            )}
          </button>
        </div>

        <p className="text-[11px] text-slate-400">Don't have a license key? Contact the seller to purchase one.</p>
      </div>
    </div>
  );
}
