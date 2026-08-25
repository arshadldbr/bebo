import React from "react";
import { TTSGenerationResult } from "../types";
import { Play, Trash2, Download, Clock, ArrowUpRight, FileAudio } from "lucide-react";

interface HistoryListProps {
  history: TTSGenerationResult[];
  activeId?: string;
  onSelectResult: (result: TTSGenerationResult) => void;
  onLoadIntoEditor: (result: TTSGenerationResult) => void;
  onDeleteResult: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  activeId,
  onSelectResult,
  onLoadIntoEditor,
  onDeleteResult,
  onClearHistory,
}) => {
  if (history.length === 0) {
    return (
      <div
        id="empty-history-state"
        className="p-8 text-center bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center gap-2"
      >
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <Clock className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-semibold text-slate-700">No Audio Generated Yet</h4>
        <p className="text-xs text-slate-500 max-w-xs">
          Your generated speech clips will appear here with instant replay and download options.
        </p>
      </div>
    );
  }

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleDownload = (e: React.MouseEvent, item: TTSGenerationResult) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = item.audioDataUri;
    const cleanSnippet = item.text.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "_");
    link.download = `speech_${item.voice || "tts"}_${cleanSnippet}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-3" id="history-container">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Session Library
          </h3>
          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {history.length}
          </span>
        </div>
        <button
          type="button"
          id="clear-history-btn"
          onClick={onClearHistory}
          className="text-xs text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
        {history.map((item) => {
          const isActive = item.id === activeId;
          return (
            <div
              key={item.id}
              id={`history-item-${item.id}`}
              onClick={() => onSelectResult(item)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                isActive
                  ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <FileAudio className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-800">
                        {item.mode === "multi" ? "Dialogue" : item.voice || "Kore"}
                      </span>
                      {item.toneStyle && item.toneStyle !== "natural" && (
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded capitalize">
                          {item.toneStyle}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {formatTimestamp(item.timestamp)} &bull; {item.duration}s &bull; {item.wordCount} words
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadIntoEditor(item);
                    }}
                    title="Load text into editor"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDownload(e, item)}
                    title="Download WAV"
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteResult(item.id);
                    }}
                    title="Delete clip"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/70 p-2 rounded-lg border border-slate-100 font-normal">
                {item.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
