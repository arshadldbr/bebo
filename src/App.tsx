import React, { useState, useEffect } from "react";
import { Header, TtsLogoMark } from "./components/Header";
import { Footer } from "./components/Footer";
import { VoiceSelector } from "./components/VoiceSelector";
import { ToneSelector } from "./components/ToneSelector";
import { DialogueEditor } from "./components/DialogueEditor";
import { AudioPlayer } from "./components/AudioPlayer";
import { HistoryList } from "./components/HistoryList";
import { ActivationScreen } from "./components/ActivationScreen";
import { VoiceId, ToneStyle, DialogueSpeaker, TTSGenerationResult } from "./types";
import { PRESET_SAMPLES, VOICES } from "./data/presets";
import { getDeviceId, getStoredLicenseKey, isLocallyActivated, clearActivation } from "./lib/device";
import { AlertTriangle, Loader2, History, Radio } from "lucide-react";

// Short Urdu titles shown on the preset/template chips — the underlying
// preset data (text, suggested voice/tone, speakers) is unchanged.
const URDU_PRESET_TITLES: Record<string, string> = {
  "news-brief": "صبح کی خبریں",
  "wellness-meditation": "ذہنی سکون",
  "story-fantasy": "کہانی",
  "product-launch": "پروڈکٹ لانچ",
  "podcast-dialogue": "پوڈکاسٹ گفتگو",
  "coffee-shop-convo": "کافی شاپ گفتگو",
};

const SHADOW_MD = "0 6px 16px -4px rgba(15,23,42,0.12), 0 2px 6px -2px rgba(15,23,42,0.06)";
const SHADOW_GREEN = "0 10px 24px -6px rgba(1,65,28,0.4), 0 4px 10px -4px rgba(1,65,28,0.25)";

export default function App() {
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>("Kore");
  const [selectedTone, setSelectedTone] = useState<ToneStyle>("natural");
  const [customInstruction, setCustomInstruction] = useState<string>("");
  const [text, setText] = useState<string>(
    "خوش آمدید! آواز ٹی ٹی ایس میں۔ اپنا متن یہاں لکھیں اور اسے فطری، جاندار آواز میں تبدیل کریں۔"
  );

  const [speakers, setSpeakers] = useState<DialogueSpeaker[]>([
    { speaker: "Alex", voice: "Puck" },
    { speaker: "Elena", voice: "Kore" },
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<TTSGenerationResult | null>(null);
  const [history, setHistory] = useState<TTSGenerationResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // null = still checking, false = show activation screen, true = unlocked
  const [activated, setActivated] = useState<boolean | null>(null);

  // Re-validate the stored license against the server on every app load —
  // never trust the local "activated" flag alone (it could be stale if the
  // key was blocked, expired, or reset from the admin panel).
  useEffect(() => {
    const checkActivation = async () => {
      const storedKey = getStoredLicenseKey();
      if (!storedKey || !isLocallyActivated()) {
        setActivated(false);
        return;
      }
      try {
        const deviceId = getDeviceId();
        const response = await fetch("/api/license/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: storedKey, deviceId }),
        });
        const data = await response.json();
        if (data.valid) {
          setActivated(true);
        } else {
          clearActivation();
          setActivated(false);
        }
      } catch {
        // Network hiccup — trust the local flag rather than locking out a
        // paying user who's simply offline for a moment.
        setActivated(true);
      }
    };
    checkActivation();
  }, []);

  // Load history from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gemini_tts_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
          setCurrentResult(parsed[0]);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (newHistory: TTSGenerationResult[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("gemini_tts_history", JSON.stringify(newHistory.slice(0, 30)));
    } catch {
      // ignore
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setErrorMessage("براہ کرم آواز بنانے کے لیے کچھ متن درج کریں۔");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        mode,
        text: text.trim(),
        voice: selectedVoice,
        toneStyle: selectedTone,
        customInstruction: customInstruction.trim() || undefined,
        speakers: mode === "multi" ? speakers : undefined,
        licenseKey: getStoredLicenseKey(),
        deviceId: getDeviceId(),
      };

      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status === 403) {
        // License is no longer valid (blocked, expired, quota used up, or
        // reset from another device) — send the user back to activation.
        clearActivation();
        setActivated(false);
        throw new Error(data.error || "آپ کا لائسنس اب درست نہیں ہے۔ براہ کرم دوبارہ ایکٹیویٹ کریں۔");
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "آواز بنانے میں ناکامی۔ براہ کرم اپنا متن چیک کریں اور دوبارہ کوشش کریں۔");
      }

      const newResult: TTSGenerationResult = {
        id: `tts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        audioDataUri: data.audioDataUri,
        audioWavBase64: data.audioWavBase64,
        sampleRate: data.sampleRate || 24000,
        duration: data.duration || 0,
        voice: mode === "single" ? selectedVoice : undefined,
        speakers: mode === "multi" ? speakers : undefined,
        mode,
        text: text.trim(),
        toneStyle: selectedTone,
        customInstruction: customInstruction.trim() || undefined,
        characterCount: text.trim().length,
        wordCount: text.trim().split(/\s+/).filter(Boolean).length,
        timestamp: Date.now(),
      };

      setCurrentResult(newResult);
      saveHistory([newResult, ...history.filter((h) => h.id !== newResult.id)]);
    } catch (err: any) {
      console.error("TTS Generation Error:", err);
      setErrorMessage(err.message || "غیر متوقع خرابی پیش آگئی۔");
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard shortcut: Cmd+Enter or Ctrl+Enter to generate
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleSelectPreset = (preset: (typeof PRESET_SAMPLES)[0]) => {
    setSelectedPresetId((prev) => (prev === preset.id ? null : preset.id));
    setMode(preset.mode);
    setText(preset.text);
    if (preset.suggestedVoice) {
      setSelectedVoice(preset.suggestedVoice);
    }
    if (preset.suggestedTone) {
      setSelectedTone(preset.suggestedTone);
      setCustomInstruction("");
    }
    if (preset.speakers) {
      setSpeakers(preset.speakers);
    }
  };

  const handleLoadIntoEditor = (item: TTSGenerationResult) => {
    setMode(item.mode);
    setText(item.text);
    if (item.voice) setSelectedVoice(item.voice);
    if (item.toneStyle) setSelectedTone(item.toneStyle);
    if (item.customInstruction) setCustomInstruction(item.customInstruction);
    if (item.speakers) setSpeakers(item.speakers);
    setShowHistory(false);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    saveHistory(updated);
    if (currentResult?.id === id) {
      setCurrentResult(updated[0] || null);
    }
  };

  const handleClearHistory = () => {
    saveHistory([]);
    setCurrentResult(null);
  };

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;

  // Still checking license status with the server — avoid flashing the
  // full app or the activation screen prematurely.
  if (activated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#01411c" }} />
      </div>
    );
  }

  if (!activated) {
    return <ActivationScreen onActivated={() => setActivated(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col antialiased bg-slate-100">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col bg-slate-50 relative">
        <Header mode={mode} onModeChange={setMode} />

        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-5 flex flex-col gap-5">
          {/* Error Notification Banner */}
          {errorMessage && (
            <div
              id="error-banner"
              className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 animate-in fade-in"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                <p className="font-urdu text-xs text-rose-700" style={{ lineHeight: 1.8 }}>
                  {errorMessage}
                </p>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="font-urdu text-xs font-semibold text-rose-600 hover:text-rose-900 flex-shrink-0 cursor-pointer"
                style={{ lineHeight: 1.4 }}
              >
                بند کریں
              </button>
            </div>
          )}

          {/* Preset templates row */}
          <div className="flex items-center gap-2 overflow-x-auto -mx-0.5 px-0.5" style={{ scrollbarWidth: "none" }}>
            <span className="font-urdu text-[10px] font-semibold text-slate-400 flex-shrink-0" style={{ lineHeight: 1.4 }}>
              نمونے:
            </span>
            {PRESET_SAMPLES.map((preset) => {
              const active = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  id={`preset-btn-${preset.id}`}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="font-urdu flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all border cursor-pointer"
                  style={{
                    lineHeight: 1.4,
                    background: active ? "linear-gradient(145deg, #146c3a, #01411c)" : "white",
                    color: active ? "white" : "#475569",
                    borderColor: active ? "#01411c" : "#e2e8f0",
                    boxShadow: active ? SHADOW_GREEN : "0 1px 2px rgba(15,23,42,0.06)",
                  }}
                >
                  {URDU_PRESET_TITLES[preset.id] || preset.title}
                </button>
              );
            })}
          </div>

          {mode === "single" ? (
            <>
              {/* Text input card */}
              <div
                className="bg-white rounded-3xl p-4"
                style={{ boxShadow: SHADOW_MD, border: "1px solid rgba(15,23,42,0.05)" }}
              >
                <textarea
                  id="speech-text-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={5}
                  dir="rtl"
                  placeholder="یہاں اپنا متن درج کریں۔"
                  className="font-urdu w-full resize-y bg-transparent outline-hidden text-sm text-slate-800 placeholder:text-slate-400"
                  style={{ lineHeight: 2 }}
                />
                <div
                  className="font-urdu flex items-center justify-between mt-1 text-[10px] text-slate-400 pt-2 border-t border-slate-50"
                  style={{ lineHeight: 1.4 }}
                >
                  <span>حروف: {charCount}</span>
                  <span>الفاظ: {wordCount}</span>
                  <button
                    type="button"
                    onClick={() => setText("")}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    صاف کریں
                  </button>
                </div>
              </div>

              <VoiceSelector selectedVoice={selectedVoice} onSelectVoice={setSelectedVoice} />

              <ToneSelector
                selectedTone={selectedTone}
                onSelectTone={setSelectedTone}
                customInstruction={customInstruction}
                onChangeCustomInstruction={setCustomInstruction}
              />
            </>
          ) : (
            <>
              <DialogueEditor
                speakers={speakers}
                onChangeSpeakers={setSpeakers}
                scriptText={text}
                onChangeScriptText={setText}
              />

              <div
                className="bg-white rounded-2xl p-3.5"
                style={{ boxShadow: SHADOW_MD, border: "1px solid rgba(15,23,42,0.05)" }}
              >
                <textarea
                  id="dialogue-script-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={5}
                  dir="rtl"
                  placeholder="مکالمہ یہاں لکھیں، ہر سطر پر: نام: بات"
                  className="font-urdu w-full resize-y bg-transparent outline-hidden text-sm text-slate-800 placeholder:text-slate-400"
                  style={{ lineHeight: 2 }}
                />
              </div>
            </>
          )}

          {/* Active result / audio player */}
          {currentResult ? (
            <AudioPlayer result={currentResult} autoPlay={true} />
          ) : (
            <div
              id="placeholder-player-card"
              className="rounded-3xl p-6 text-center flex flex-col items-center justify-center gap-2.5 border border-dashed border-slate-200"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "#e6f2ec", color: "#01411c" }}
              >
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-urdu text-sm font-semibold text-slate-800" style={{ lineHeight: 1.6 }}>
                  آواز بنانے کے لیے تیار
                </h4>
                <p className="font-urdu text-xs text-slate-500 mt-1 max-w-xs leading-relaxed" style={{ lineHeight: 1.9 }}>
                  اپنی پسندیدہ آواز چنیں، متن درج کریں، اور نیچے دیے گئے بٹن سے آواز بنائیں۔
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Action bar — history button + generate button, always docked
            below the scrollable content, never overlapping anything */}
        <div
          className="flex-shrink-0 relative z-20 px-4 py-3 flex items-center gap-2.5"
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 -8px 20px -8px rgba(15,23,42,0.12)",
            borderTop: "1px solid rgba(15,23,42,0.04)",
          }}
        >
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="relative w-12 h-12 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 cursor-pointer"
            style={{ boxShadow: SHADOW_MD, border: "1px solid rgba(15,23,42,0.05)" }}
          >
            <History className="w-5 h-5 text-slate-500" />
            {history.length > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                style={{ background: "#01411c" }}
              >
                {history.length}
              </span>
            )}
          </button>
          <button
            id="synthesize-speech-btn"
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || !text.trim()}
            className="font-urdu flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-sm cursor-pointer disabled:cursor-not-allowed"
            style={{
              lineHeight: 1,
              background:
                isLoading || !text.trim()
                  ? "linear-gradient(160deg, #94a3b8, #64748b)"
                  : "linear-gradient(160deg, #146c3a, #01411c)",
              boxShadow: isLoading || !text.trim() ? "none" : `${SHADOW_GREEN}, inset 0 1px 1px rgba(255,255,255,0.25)`,
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                تیار ہو رہا ہے...
              </>
            ) : (
              <>
                <TtsLogoMark size={16} />
                آواز بنائیں
              </>
            )}
          </button>
        </div>

        <Footer />

        <HistoryList
          history={history}
          activeId={currentResult?.id}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          onSelectResult={(item) => {
            setCurrentResult(item);
            setShowHistory(false);
          }}
          onLoadIntoEditor={handleLoadIntoEditor}
          onDeleteResult={handleDeleteHistoryItem}
          onClearHistory={handleClearHistory}
        />
      </div>
    </div>
  );
}
