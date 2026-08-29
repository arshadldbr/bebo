import React from "react";
import { DialogueSpeaker, VoiceId } from "../types";
import { VOICES } from "../data/presets";
import { Plus } from "lucide-react";

interface DialogueEditorProps {
  speakers: DialogueSpeaker[];
  onChangeSpeakers: (speakers: DialogueSpeaker[]) => void;
  scriptText: string;
  onChangeScriptText: (text: string) => void;
}

export const DialogueEditor: React.FC<DialogueEditorProps> = ({
  speakers,
  onChangeSpeakers,
  scriptText,
  onChangeScriptText,
}) => {
  const updateSpeaker = (index: number, field: "speaker" | "voice", value: string) => {
    const updated = [...speakers];
    if (field === "voice") {
      updated[index] = { ...updated[index], voice: value as VoiceId };
    } else {
      updated[index] = { ...updated[index], speaker: value };
    }
    onChangeSpeakers(updated);
  };

  const insertSpeakerTag = (speakerName: string) => {
    const prefix = scriptText && !scriptText.endsWith("\n") ? "\n" : "";
    onChangeScriptText(`${scriptText}${prefix}${speakerName}: `);
  };

  return (
    <div className="flex flex-col gap-3" id="dialogue-editor-container">
      {speakers.map((spk, idx) => (
        <div
          key={idx}
          id={`speaker-card-${idx}`}
          className="bg-white rounded-2xl p-3.5"
          style={{ boxShadow: "0 6px 16px -4px rgba(15,23,42,0.12)", border: "1px solid rgba(15,23,42,0.05)" }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(145deg, #146c3a, #01411c)" }}
              >
                {idx + 1}
              </span>
              <span className="font-urdu text-[11px] font-bold text-slate-600" style={{ lineHeight: 1.4 }}>
                بولنے والا {idx + 1}
              </span>
            </div>
            <button
              type="button"
              onClick={() => insertSpeakerTag(spk.speaker)}
              className="text-[10px] font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span className="font-urdu" style={{ lineHeight: 1.4 }}>
                لائن شامل کریں
              </span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              id={`speaker-name-input-${idx}`}
              value={spk.speaker}
              dir="rtl"
              onChange={(e) => updateSpeaker(idx, "speaker", e.target.value)}
              placeholder={`بولنے والا ${idx + 1}`}
              className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-green-700 text-slate-800"
            />
            <select
              id={`speaker-voice-select-${idx}`}
              value={spk.voice}
              onChange={(e) => updateSpeaker(idx, "voice", e.target.value)}
              className="w-full text-xs px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-green-700 text-slate-800 font-medium"
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}

      {/* Script Format Helper */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
        <span className="font-urdu" style={{ lineHeight: 1.4 }}>
          فارمیٹ: <strong>نام: بات</strong> ہر سطر پر
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => insertSpeakerTag(speakers[0]?.speaker || "Speaker 1")}
            className="text-[11px] font-medium px-2 py-0.5 rounded cursor-pointer"
            style={{ color: "#01411c", background: "#e6f2ec" }}
          >
            +{speakers[0]?.speaker || "Speaker 1"}
          </button>
          <button
            type="button"
            onClick={() => insertSpeakerTag(speakers[1]?.speaker || "Speaker 2")}
            className="text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded cursor-pointer"
          >
            +{speakers[1]?.speaker || "Speaker 2"}
          </button>
        </div>
      </div>
    </div>
  );
};
