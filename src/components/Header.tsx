import React, { useState } from "react";
import { Moon, Star, Sparkles, Info, X, Zap } from "lucide-react";

export const Header: React.FC = () => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <header className="border-b border-pk-green-800 bg-pk-green-700 sticky top-0 z-30 shadow-md relative overflow-hidden">
      {/* Flag-style white hoist band accent */}
      <div className="absolute left-0 top-0 h-full w-1.5 bg-white" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-pk-green-700 flex items-center justify-center shadow-sm relative">
            <Moon className="w-5 h-5" fill="currentColor" />
            <Star className="w-3 h-3 absolute -top-0.5 -right-0.5" fill="currentColor" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white leading-tight">Aawaz TTS</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/15 text-white border border-white/25">
                <Sparkles className="w-2.5 h-2.5" />
                gemini-3.1-flash-tts-preview
              </span>
            </div>
            <p className="text-xs text-pk-green-100 hidden sm:block">
              Urdu &amp; Pakistani awaazon ke liye AI speech studio
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="info-modal-toggle-btn"
            onClick={() => setShowInfo(!showInfo)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">Guide & Specs</span>
          </button>
        </div>
      </div>

      {/* Info Modal / Drawer */}
      {showInfo && (
        <div className="border-t border-pk-green-800 bg-white p-4 sm:p-6 transition-all animate-in fade-in slide-in-from-top-2">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-pk-green-600" />
                <h2 className="text-sm font-bold text-slate-900">About Aawaz TTS</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col gap-1">
                <span className="font-semibold text-slate-800">5 Neural Prebuilt Voices</span>
                <p className="text-slate-500 leading-relaxed">
                  High-fidelity Google voice models: Kore (Warm), Puck (Youthful), Charon (Authoritative), Fenrir (Crisp), and Zephyr (Calm).
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col gap-1">
                <span className="font-semibold text-slate-800">Direct Delivery & Emotion</span>
                <p className="text-slate-500 leading-relaxed">
                  Select vocal moods (Storyteller, Whisper, Cheerful, Urgent) or input custom vocal instructions like pace, accent, and inflection.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col gap-1">
                <span className="font-semibold text-slate-800">Multi-Speaker Dialogue</span>
                <p className="text-slate-500 leading-relaxed">
                  Generate conversations between two distinct voice actors in a single, synchronized audio stream with native dialogue parsing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
