import React, { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  barColor?: string;
  progressColor?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  currentTime,
  duration,
  onSeek,
  barColor = "#cbd5e1",
  progressColor = "#3b82f6",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Generate pseudo-random deterministic bar heights for a clean waveform look
  const barHeightsRef = useRef<number[]>([]);

  useEffect(() => {
    if (barHeightsRef.current.length === 0) {
      const bars: number[] = [];
      const count = 72;
      for (let i = 0; i < count; i++) {
        // Natural speech-like envelope (higher in middle, varied rhythm)
        const envelope = Math.sin((i / count) * Math.PI);
        const noise = Math.sin(i * 1.8) * 0.35 + Math.cos(i * 3.4) * 0.25;
        const h = Math.max(0.18, Math.min(1.0, envelope * 0.75 + noise * 0.35 + 0.15));
        bars.push(h);
      }
      barHeightsRef.current = bars;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let offset = 0;

    const render = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const bars = barHeightsRef.current;
      const barCount = bars.length;
      const spacing = 3;
      const totalSpacing = spacing * (barCount - 1);
      const barWidth = Math.max(2, (width - totalSpacing) / barCount);
      const progressFraction = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

      if (isPlaying) {
        offset += 0.08;
      }

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + spacing);
        let barH = bars[i];

        if (isPlaying) {
          // Subtle lively bounce during active playback
          const dynamicWave = Math.sin(offset + i * 0.3) * 0.18;
          barH = Math.max(0.15, Math.min(1.0, barH + dynamicWave));
        }

        const pixelHeight = barH * (height * 0.82);
        const y = (height - pixelHeight) / 2;

        const isPlayed = i / barCount <= progressFraction;

        ctx.fillStyle = isPlayed ? progressColor : barColor;

        // Rounded bar
        const radius = Math.min(barWidth / 2, 3);
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, pixelHeight, radius);
        } else {
          ctx.rect(x, y, barWidth, pixelHeight);
        }
        ctx.fill();
      }

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, duration, barColor, progressColor]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !duration) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(fraction * duration);
  };

  return (
    <div className="relative w-full h-16 cursor-pointer select-none group" id="waveform-container">
      <canvas
        id="waveform-canvas"
        ref={canvasRef}
        width={600}
        height={64}
        onClick={handleCanvasClick}
        className="w-full h-full block rounded-lg transition-opacity group-hover:opacity-95"
      />
    </div>
  );
};
