import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Download, Copy, Check, Repeat } from "lucide-react";
import { AudioVisualizer } from "./AudioVisualizer";
import { TTSGenerationResult } from "../types";

interface AudioPlayerProps {
  result: TTSGenerationResult;
  autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ result, autoPlay = true }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(result.duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    setDuration(result.duration || 0);

    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.loop = isLooping;

      if (autoPlay) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.id, autoPlay]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Playback error:", err));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (!isLooping) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play().then(() => setIsPlaying(true));
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) audioRef.current.volume = nextMuted ? 0 : volume;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (audioRef.current) audioRef.current.volume = newVol;
  };

  const toggleLoop = () => {
    const nextLoop = !isLooping;
    setIsLooping(nextLoop);
    if (audioRef.current) audioRef.current.loop = nextLoop;
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = result.audioDataUri;
    const cleanSnippet = result.text.slice(0, 24).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    link.download = `speech_${result.voice || "tts"}_${cleanSnippet || "audio"}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = Math.floor(secs % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div
      id="audio-player-card"
      className="rounded-3xl p-4 text-white flex flex-col gap-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(155deg, #146c3a, #01411c 70%)",
        boxShadow: "0 10px 24px -6px rgba(1,65,28,0.4), 0 4px 10px -4px rgba(1,65,28,0.25)",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-8 opacity-20 pointer-events-none"
        style={{ background: "linear-gradient(180deg, white, transparent)" }}
      />

      <audio
        ref={audioRef}
        src={result.audioDataUri}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="auto"
      />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div>
          <span className="text-sm font-semibold text-white">
            {result.mode === "multi" ? "Multi-Speaker Dialogue" : `Voice: ${result.voice || "Kore"}`}
          </span>
          <p className="text-[11px] text-emerald-100/80 mt-0.5">
            {result.wordCount} words &bull; {result.characterCount} characters &bull; {formatTime(duration)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="copy-text-btn"
            onClick={handleCopyText}
            title="Copy Prompt Text"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-white rounded-lg transition-colors"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            id="download-wav-btn"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-white rounded-lg transition-colors"
            style={{ background: "rgba(255,255,255,0.22)" }}
          >
            <Download className="w-3.5 h-3.5" />
            WAV
          </button>
        </div>
      </div>

      {/* Waveform Visualizer */}
      <div className="rounded-2xl p-3 relative z-10" style={{ background: "rgba(0,0,0,0.18)" }}>
        <AudioVisualizer
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          barColor="rgba(255,255,255,0.3)"
          progressColor="#ffffff"
        />
        <div className="flex items-center justify-between text-[11px] text-emerald-100/80 font-mono px-1 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2">
          <button
            id="restart-audio-btn"
            onClick={handleRestart}
            title="Replay from start"
            className="p-2 text-white/80 hover:text-white rounded-lg transition-colors"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            id="play-pause-btn"
            onClick={togglePlay}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white transition-transform active:scale-95"
            style={{ boxShadow: "0 4px 10px rgba(0,0,0,0.3)", color: "#01411c" }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            id="loop-toggle-btn"
            onClick={toggleLoop}
            title={isLooping ? "Disable Loop" : "Enable Loop"}
            className="p-2 rounded-lg transition-colors"
            style={{ background: isLooping ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)" }}
          >
            <Repeat className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-0.5 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.18)" }}>
          {speeds.map((rate) => (
            <button
              key={rate}
              id={`speed-btn-${rate}`}
              onClick={() => changePlaybackRate(rate)}
              className="px-1.5 py-1 text-[11px] font-medium rounded-lg transition-all"
              style={{
                background: playbackRate === rate ? "white" : "transparent",
                color: playbackRate === rate ? "#01411c" : "rgba(255,255,255,0.8)",
                fontWeight: playbackRate === rate ? 700 : 500,
              }}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-2">
          <button
            id="mute-toggle-btn"
            onClick={toggleMute}
            className="p-1.5 text-white/80 hover:text-white rounded-lg transition-colors"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            id="volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 sm:w-20 h-1.5 rounded-lg appearance-none cursor-pointer"
            style={{ background: "rgba(255,255,255,0.3)", accentColor: "#ffffff" }}
            aria-label="Volume slider"
          />
        </div>
      </div>
    </div>
  );
};
