import React from "react";

interface HeaderProps {
  mode: "single" | "multi";
  onModeChange: (mode: "single" | "multi") => void;
}

// The app's signature mark: a microphone with sound waves — communicates
// "text-to-speech" at a glance, rather than a generic emblem.
export function TtsLogoMark({ size = 20, color = "#ffffff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="9.5" y="2.5" width="5" height="10" rx="2.5" fill={color} />
      <path d="M5.5 10.5a6.5 6.5 0 0 0 13 0" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <line x1="12" y1="17.2" x2="12" y2="21" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <line x1="8.3" y1="21" x2="15.7" y2="21" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M18.3 7.3c1.3 1.1 1.3 4.3 0 5.4" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
      <path d="M20.6 5.4c2.3 2.2 2.3 6.9 0 9.2" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

export const Header: React.FC<HeaderProps> = ({ mode, onModeChange }) => {
  return (
    <header
      className="flex-shrink-0 relative z-30"
      style={{
        background: "linear-gradient(160deg, #146c3a 0%, #01411c 55%, #012912 100%)",
        boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.08), 0 4px 16px -4px rgba(1,65,28,0.4)",
      }}
    >
      <div className="max-w-md mx-auto px-4 pt-4 pb-3.5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(155deg, #146c3a, #01411c)",
              boxShadow:
                "0 4px 12px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.25), inset 0 -1px 2px rgba(0,0,0,0.2)",
            }}
          >
            <TtsLogoMark size={19} />
          </div>
          <div>
            <h1
              className="text-white font-extrabold text-base leading-none tracking-tight"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
            >
              Aawaz TTS
            </h1>
            <p className="font-urdu text-emerald-100 text-[11px] mt-1.5" style={{ lineHeight: 1.4 }}>
              اردو کی اپنی آواز
            </p>
          </div>
        </div>

        {/* Mode toggle — sliding indicator */}
        <div
          className="mt-4 relative flex rounded-2xl p-1"
          style={{ background: "rgba(0,0,0,0.22)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.25)" }}
        >
          <div
            className="absolute top-1 bottom-1 rounded-xl transition-all duration-300 ease-out"
            style={{
              width: "calc(50% - 4px)",
              left: mode === "single" ? "4px" : "calc(50% + 0px)",
              background: "linear-gradient(180deg, #fff, #f1f5f9)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            }}
          />
          <button
            id="single-mode-tab"
            type="button"
            onClick={() => onModeChange("single")}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 relative z-10 cursor-pointer"
            style={{ color: mode === "single" ? "#01411c" : "rgba(255,255,255,0.75)" }}
          >
            <span className="font-urdu" style={{ lineHeight: 1 }}>
              ایک آواز
            </span>
          </button>
          <button
            id="multi-mode-tab"
            type="button"
            onClick={() => onModeChange("multi")}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 relative z-10 cursor-pointer"
            style={{ color: mode === "multi" ? "#01411c" : "rgba(255,255,255,0.75)" }}
          >
            <span className="font-urdu" style={{ lineHeight: 1 }}>
              مکالمہ
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
