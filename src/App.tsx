import React, { useState, useEffect, useCallback, useId } from "react";
import { Header } from "./components/Header";
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
import {
  Mic,
  Users,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  AlertTriangle,
  Loader2,
  Trash2,
  BookmarkPlus,
  Radio,
  FileText,
} from "lucide-react";

export default function App() {
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>("Kore");
  const [selectedTone, setSelectedTone] = useState<ToneStyle>("natural");
  const [customInstruction, setCustomInstruction] = useState<string>("");
  const [text, setText] = useState<string>(
    "Hello! Welcome to Aawaz TTS. Powered by Gemini 3.1 Flash, you can convert any written script into natural, expressive human-like speech in seconds."
  );

  const [speakers, setSpeakers] = useState<DialogueSpeaker[]>([
    { speaker: "Alex", voice: "Puck" },
    { speaker: "Elena", voice: "Kore" },
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<TTSGenerationResult | null>(null);
  const [history, setHistory] = useState<TTSGenerationResult[]>([]);

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
      setErrorMessage("Please enter some text to synthesize.");
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
        throw new Error(data.error || "Your license is no longer valid. Please re-activate.");
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate speech. Please check your text and try again.");
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
      setErrorMessage(err.message || "An unexpected error occurred during synthesis.");
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

  const handleSelectPreset = (preset: typeof PRESET_SAMPLES[0]) => {
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

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = text.length;
  // Estimated reading duration: approx 150 words per minute
  const estimatedSeconds = Math.max(1, Math.round((wordCount / 150) * 60));

  // Still checking license status with the server — avoid flashing the
  // full app or the activation screen prematurely.
  if (activated === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!activated) {
    return <ActivationScreen onActivated={() => setActivated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6">
        {/* Error Notification Banner */}
        {errorMessage && (
          <div
            id="error-banner"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 shadow-xs animate-in fade-in"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                  Generation Error
                </h4>
                <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Workflow Grid: Studio Studio Config & Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main TTS Input Area (7 cols on desktop) */}
          <section className="lg:col-span-7 flex flex-col gap-5">
            {/* Mode Switcher & Presets */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-xs flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                {/* Single vs Multi Tabs */}
                <div className="flex items-center p-1 bg-slate-100 rounded-xl gap-1" id="mode-tabs">
                  <button
                    id="single-mode-tab"
                    type="button"
                    onClick={() => setMode("single")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      mode === "single"
                        ? "bg-white text-blue-700 shadow-xs ring-1 ring-slate-200/60"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5 text-blue-600" />
                    Single Speaker
                  </button>

                  <button
                    id="multi-mode-tab"
                    type="button"
                    onClick={() => setMode("multi")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      mode === "multi"
                        ? "bg-white text-blue-700 shadow-xs ring-1 ring-slate-200/60"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    Dialogue / Multi-Speaker
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                  <span className="text-[11px] font-medium text-slate-400 mr-1 hidden sm:inline">
                    Sample:
                  </span>
                  {PRESET_SAMPLES.map((preset) => (
                    <button
                      key={preset.id}
                      id={`preset-btn-${preset.id}`}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode-Specific Voice & Script Controls */}
              {mode === "single" ? (
                <div className="flex flex-col gap-4">
                  <VoiceSelector selectedVoice={selectedVoice} onSelectVoice={setSelectedVoice} />
                  <div className="border-t border-slate-100 pt-3">
                    <ToneSelector
                      selectedTone={selectedTone}
                      onSelectTone={setSelectedTone}
                      customInstruction={customInstruction}
                      onChangeCustomInstruction={setCustomInstruction}
                    />
                  </div>
                </div>
              ) : (
                <DialogueEditor
                  speakers={speakers}
                  onChangeSpeakers={setSpeakers}
                  scriptText={text}
                  onChangeScriptText={setText}
                />
              )}

              {/* Text Area */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="speech-text-input"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    {mode === "single" ? "Speech Script & Content" : "Conversation Script"}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setText("")}
                      className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    id="speech-text-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={6}
                    placeholder={
                      mode === "single"
                        ? "Type or paste the text you want converted to speech..."
                        : "Alex: Hello! How can I help you today?\nElena: I would like to learn more about Gemini audio synthesis."
                    }
                    className="w-full text-sm leading-relaxed p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white text-slate-800 transition-all font-sans resize-y placeholder:text-slate-400"
                  />
                </div>

                {/* Text Stats & Keyboard Hint */}
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-3">
                    <span>
                      <strong>{charCount}</strong> characters
                    </span>
                    <span>&bull;</span>
                    <span>
                      <strong>{wordCount}</strong> words
                    </span>
                    <span>&bull;</span>
                    <span className="text-slate-400">Est. ~{estimatedSeconds}s audio</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
                    <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">
                      Ctrl / ⌘
                    </kbd>
                    +
                    <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">
                      Enter
                    </kbd>
                    to synthesize
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  id="synthesize-speech-btn"
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading || !text.trim()}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${
                    isLoading || !text.trim()
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-blue-500/20"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating High-Fidelity Audio...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Convert Text to Speech</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Right Area: Active Audio Player & Session Library (5 cols on desktop) */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            {/* Active Output Player */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-blue-600" />
                  Active Audio Player
                </h3>
                {currentResult && (
                  <span className="text-[11px] font-medium text-slate-400">
                    Model: gemini-3.1-flash-tts-preview
                  </span>
                )}
              </div>

              {currentResult ? (
                <AudioPlayer result={currentResult} autoPlay={true} />
              ) : (
                <div
                  id="placeholder-player-card"
                  className="bg-white border border-slate-200 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 min-h-60"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Radio className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Ready to Synthesize</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                      Choose your preferred voice, enter your text, and click{" "}
                      <strong>Convert Text to Speech</strong> to generate high-fidelity speech.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* History and Library */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-xs">
              <HistoryList
                history={history}
                activeId={currentResult?.id}
                onSelectResult={(item) => setCurrentResult(item)}
                onLoadIntoEditor={handleLoadIntoEditor}
                onDeleteResult={handleDeleteHistoryItem}
                onClearHistory={handleClearHistory}
              />
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
