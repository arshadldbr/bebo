import React, { useState } from "react";
import { ToneStyle } from "../types";
import { TONE_STYLES } from "../data/presets";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ToneSelectorProps {
  selectedTone: ToneStyle;
  onSelectTone: (tone: ToneStyle) => void;
  customInstruction: string;
  onChangeCustomInstruction: (val: string) => void;
}

const URDU_LABELS: Record<ToneStyle, string> = {
  natural: "فطری",
  cheerful: "خوش مزاج",
  calm: "پرسکون",
  professional: "پیشہ ورانہ",
  storyteller: "داستان گو",
  whisper: "سرگوشی",
  energetic: "توانا",
  urgent: "فوری",
};

export const ToneSelector: React.FC<ToneSelectorProps> = ({
  selectedTone,
  onSelectTone,
  customInstruction,
  onChangeCustomInstruction,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(Boolean(customInstruction));

  return (
    <div className="flex flex-col gap-2.5" id="tone-selector-container">
      <div className="flex items-center justify-between">
        <h2 className="font-urdu text-xs font-bold text-slate-700" style={{ lineHeight: 1.4 }}>
          انداز بیان
        </h2>
        <button
          type="button"
          id="toggle-custom-instruction-btn"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="font-urdu text-[10px] font-semibold flex items-center gap-0.5 cursor-pointer"
          style={{ color: "#01411c", lineHeight: 1.4 }}
        >
          {showAdvanced ? "بند کریں" : "+ مخصوص ہدایت"}
          {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Tone Chips */}
      <div className="flex flex-wrap gap-2">
        {TONE_STYLES.map((t) => {
          const isSelected = selectedTone === t.id && !customInstruction;
          return (
            <button
              key={t.id}
              id={`tone-chip-${t.id}`}
              type="button"
              onClick={() => {
                onSelectTone(t.id);
                if (customInstruction) onChangeCustomInstruction("");
              }}
              className="font-urdu px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer"
              style={{
                lineHeight: 1.4,
                background: isSelected ? "linear-gradient(145deg, #146c3a, #01411c)" : "white",
                color: isSelected ? "white" : "#475569",
                borderColor: isSelected ? "#01411c" : "#e2e8f0",
                boxShadow: isSelected
                  ? "0 10px 24px -6px rgba(1,65,28,0.4), 0 4px 10px -4px rgba(1,65,28,0.25)"
                  : "0 1px 2px rgba(15,23,42,0.06)",
              }}
              title={t.description}
            >
              {URDU_LABELS[t.id]}
            </button>
          );
        })}
      </div>

      {/* Custom Directive Input */}
      {showAdvanced && (
        <div
          className="mt-1 p-3.5 rounded-2xl border flex flex-col gap-1.5"
          style={{ background: "linear-gradient(160deg, #f0f9f4, #e6f2ec)", borderColor: "#c2ded0" }}
        >
          <p className="font-urdu text-[10px] font-semibold text-slate-600" style={{ lineHeight: 1.4 }}>
            مخصوص آواز کی ہدایت (پہلے سے طے شدہ انداز کی جگہ لے گی)
          </p>
          <input
            id="custom-instruction-input"
            type="text"
            dir="rtl"
            placeholder="مثلاً: ایک پرجوش کمنٹیٹر کی طرح بولیں"
            value={customInstruction}
            onChange={(e) => onChangeCustomInstruction(e.target.value)}
            className="font-urdu w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-green-700 focus:border-green-700 text-slate-800 placeholder:text-slate-400"
          />
        </div>
      )}
    </div>
  );
};
