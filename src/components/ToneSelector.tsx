import React, { useState } from "react";
import { ToneStyle } from "../types";
import { TONE_STYLES } from "../data/presets";
import {
  Sparkles,
  Smile,
  Moon,
  Briefcase,
  BookOpen,
  VolumeX,
  Zap,
  AlertCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ToneSelectorProps {
  selectedTone: ToneStyle;
  onSelectTone: (tone: ToneStyle) => void;
  customInstruction: string;
  onChangeCustomInstruction: (val: string) => void;
}

const ICONS: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-3.5 h-3.5" />,
  Smile: <Smile className="w-3.5 h-3.5" />,
  Moon: <Moon className="w-3.5 h-3.5" />,
  Briefcase: <Briefcase className="w-3.5 h-3.5" />,
  BookOpen: <BookOpen className="w-3.5 h-3.5" />,
  VolumeX: <VolumeX className="w-3.5 h-3.5" />,
  Zap: <Zap className="w-3.5 h-3.5" />,
  AlertCircle: <AlertCircle className="w-3.5 h-3.5" />,
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
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-blue-600" />
          Delivery Style & Tone
        </label>
        <button
          type="button"
          id="toggle-custom-instruction-btn"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
        >
          {showAdvanced ? "Hide Custom Prompt" : "+ Custom Vocal Direction"}
          {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Tone Chips */}
      <div className="flex flex-wrap gap-1.5">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                isSelected
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
              title={t.description}
            >
              {ICONS[t.icon] || <Sparkles className="w-3.5 h-3.5" />}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Custom Directive Input */}
      {showAdvanced && (
        <div className="mt-1 p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800">Custom Vocal Instruction</span>
            <span className="text-[11px] text-slate-500">Overrides preset tone</span>
          </div>
          <input
            id="custom-instruction-input"
            type="text"
            placeholder="e.g., Speak excitedly like an enthusiastic soccer commentator"
            value={customInstruction}
            onChange={(e) => onChangeCustomInstruction(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-slate-800 placeholder:text-slate-400"
          />
        </div>
      )}
    </div>
  );
};
