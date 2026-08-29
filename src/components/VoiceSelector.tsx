import React from "react";
import { VoiceId, VoiceInfo } from "../types";
import { VOICES } from "../data/presets";

interface VoiceSelectorProps {
  selectedVoice: VoiceId;
  onSelectVoice: (voiceId: VoiceId) => void;
  compact?: boolean;
}

// Short Urdu taglines shown under each (English) voice name — the voice
// names themselves stay in English/Latin since they're proper nouns.
const URDU_TAGS: Record<VoiceId, string> = {
  Kore: "گرمجوش و واضح",
  Puck: "متحرک و توانا",
  Charon: "پروقار و گہری",
  Fenrir: "واضح و مرکوز",
  Zephyr: "دھیمی و پرسکون",
};

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoice, onSelectVoice }) => {
  return (
    <div className="flex flex-col gap-2.5" id="voice-selector-container">
      <h2 className="font-urdu text-xs font-bold text-slate-700" style={{ lineHeight: 1.4 }}>
        آواز منتخب کریں
      </h2>

      <div className="flex gap-3 overflow-x-auto pb-1 -mx-0.5 px-0.5" style={{ scrollbarWidth: "none" }}>
        {VOICES.map((v: VoiceInfo) => {
          const isSelected = selectedVoice === v.id;
          return (
            <button
              key={v.id}
              id={`voice-card-${v.id}`}
              type="button"
              onClick={() => onSelectVoice(v.id)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 w-16 cursor-pointer"
              title={v.description}
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-linear-to-br ${v.avatarColor} flex items-center justify-center text-white font-bold text-sm transition-all`}
                style={{
                  boxShadow: isSelected
                    ? "0 6px 16px -2px rgba(1,65,28,0.35), 0 0 0 2.5px white, 0 0 0 4.5px #01411c, inset 0 1px 1px rgba(255,255,255,0.4)"
                    : "0 3px 8px -2px rgba(0,0,0,0.25), inset 0 1px 1px rgba(255,255,255,0.3)",
                  opacity: isSelected ? 1 : 0.6,
                  transform: isSelected ? "translateY(-1px)" : "none",
                }}
              >
                {v.name[0]}
              </div>
              <span className="text-[10px] font-semibold text-slate-700">{v.name}</span>
              <span className="font-urdu text-[9px] text-slate-400 text-center leading-tight" style={{ lineHeight: 1.3 }}>
                {URDU_TAGS[v.id]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
