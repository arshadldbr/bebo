import React from "react";
import { TTSGenerationResult } from "../types";
import { Play, Trash2, Download, ArrowUpRight, X } from "lucide-react";

interface HistoryListProps {
  history: TTSGenerationResult[];
  activeId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (result: TTSGenerationResult) => void;
  onLoadIntoEditor: (result: TTSGenerationResult) => void;
  onDeleteResult: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  activeId,
  isOpen,
  onClose,
  onSelectResult,
  onLoadIntoEditor,
  onDeleteResult,
  onClearHistory,
}) => {
  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-40 flex flex-col justify-end" id="history-container">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white rounded-t-[2rem] p-4 max-h-[75vh] overflow-y-auto max-w-md w-full mx-auto"
        style={{ boxShadow: "0 -20px 40px rgba(0,0,0,0.2)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-urdu text-sm font-bold text-slate-800" style={{ lineHeight: 1.4 }}>
              تاریخچہ
            </h3>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {history.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <button
                type="button"
                id="clear-history-btn"
                onClick={onClearHistory}
                className="text-xs text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
            <button onClick={onClose} className="cursor-pointer">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {history.length === 0 ? (
          <div id="empty-history-state" className="p-8 text-center flex flex-col items-center justify-center gap-2">
            <p className="font-urdu text-sm text-slate-500" style={{ lineHeight: 1.6 }}>
              ابھی تک کوئی آواز نہیں بنائی گئی
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((item) => {
              const isActive = item.id === activeId;
              return (
                <div
                  key={item.id}
                  id={`history-item-${item.id}`}
                  onClick={() => onSelectResult(item)}
                  className="flex items-center gap-3 p-2.5 rounded-2xl border cursor-pointer transition-all"
                  style={{
                    borderColor: isActive ? "#01411c" : "#f1f5f9",
                    background: isActive ? "#e6f2ec" : "#f8fafc",
                  }}
                >
                  <button
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "linear-gradient(145deg, #146c3a, #01411c)",
                      boxShadow: "0 3px 8px rgba(1,65,28,0.4)",
                    }}
                  >
                    <Play className="w-3 h-3 text-white ml-0.5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 truncate" dir="auto">
                      {item.text}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {item.mode === "multi" ? "Dialogue" : item.voice || "Kore"} &bull;{" "}
                      {formatTimestamp(item.timestamp)} &bull; {item.duration}s
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoadIntoEditor(item);
                      }}
                      title="Load text into editor"
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDownload(e, item)}
                      title="Download WAV"
                      className="p-1.5 text-slate-400 hover:text-green-700 rounded-md transition-colors"
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
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
