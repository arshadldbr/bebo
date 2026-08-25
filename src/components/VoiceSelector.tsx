import React from "react";
import { VoiceId, VoiceInfo } from "../types";
import { VOICES } from "../data/presets";
import { Check, Mic } from "lucide-react";

interface VoiceSelectorProps {
  selectedVoice: VoiceId;
  onSelectVoice: (voiceId: VoiceId) => void;
  compact?: boolean;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  compact = false,
}) => {
  if (compact) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" id="compact-voice-selector">
        {VOICES.map((v) => {
          const isSelected = selectedVoice === v.id;
          return (
            <button
              key={v.id}
              id={`voice-btn-${v.id}`}
              type="button"
              onClick={() => onSelectVoice(v.id)}
              className={`flex items-center gap-2 p-2 rounded-xl text-left border text-xs transition-all ${
                isSelected
                  ? "border-blue-600 bg-blue-50/70 text-blue-900 font-medium ring-1 ring-blue-600 shadow-xs"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg bg-linear-to-br ${v.avatarColor} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}
              >
                {v.name[0]}
              </div>
              <div className="truncate">
                <p className="font-semibold leading-none truncate">{v.name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{v.gender}</p>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" id="voice-selector-container">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-blue-600" />
          Select Voice
        </label>
        <span className="text-xs text-slate-400">5 Prebuilt Voices</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {VOICES.map((v: VoiceInfo) => {
          const isSelected = selectedVoice === v.id;
          return (
            <button
              key={v.id}
              id={`voice-card-${v.id}`}
              type="button"
              onClick={() => onSelectVoice(v.id)}
              className={`relative flex flex-col justify-between p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                isSelected
                  ? "border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg bg-linear-to-br ${v.avatarColor} text-white flex items-center justify-center font-bold text-xs shadow-xs`}
                  >
                    {v.name[0]}
                  </div>
                  {isSelected ? (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {v.gender.split("/")[0].trim()}
                    </span>
                  )}
                </div>

                <div className="font-semibold text-sm text-slate-900">{v.name}</div>
                <div className="text-xs text-blue-600/90 font-medium mt-0.5">{v.tone}</div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-snug line-clamp-2">{v.description}</p>
              </div>

              <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-slate-100">
                {v.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] bg-slate-100/90 text-slate-600 px-1.5 py-0.5 rounded-md font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
