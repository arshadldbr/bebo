import React from "react";
import { DialogueSpeaker, VoiceId } from "../types";
import { VOICES } from "../data/presets";
import { Users, Plus, MessageSquare } from "lucide-react";

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
    <div className="flex flex-col gap-4" id="dialogue-editor-container">
      {/* Speaker Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {speakers.map((spk, idx) => {
          const isSpk1 = idx === 0;
          return (
            <div
              key={idx}
              id={`speaker-card-${idx}`}
              className={`p-3.5 rounded-xl border ${
                isSpk1 ? "border-blue-200 bg-blue-50/30" : "border-emerald-200 bg-emerald-50/30"
              } flex flex-col gap-2.5`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      isSpk1 ? "bg-blue-600" : "bg-emerald-600"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-800">Speaker {idx + 1}</span>
                </div>
                <button
                  type="button"
                  onClick={() => insertSpeakerTag(spk.speaker)}
                  className="text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Insert Line
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id={`speaker-name-input-${idx}`}
                    value={spk.speaker}
                    onChange={(e) => updateSpeaker(idx, "speaker", e.target.value)}
                    placeholder={`Speaker ${idx + 1}`}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-600 text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                    Voice Actor
                  </label>
                  <select
                    id={`speaker-voice-select-${idx}`}
                    value={spk.voice}
                    onChange={(e) => updateSpeaker(idx, "voice", e.target.value)}
                    className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-600 text-slate-800 font-medium"
                  >
                    {VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.gender.split("/")[0].trim()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Script Format Helper */}
      <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
        <span className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
          Format: <strong>Speaker Name: text message</strong> per line
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => insertSpeakerTag(speakers[0]?.speaker || "Speaker 1")}
            className="text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded cursor-pointer"
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
