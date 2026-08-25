import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Modality } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { validateLicense, consumeQuota } from "./lib/license";

dotenv.config();

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function pcmToWav(
  pcmBuffer: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF identifier
  buffer.write("RIFF", 0);
  // file length minus 8
  buffer.writeUInt32LE(36 + dataSize, 4);
  // RIFF type
  buffer.write("WAVE", 8);
  // format chunk identifier
  buffer.write("fmt ", 12);
  // format chunk length
  buffer.writeUInt32LE(16, 16);
  // sample format (1 = PCM)
  buffer.writeUInt16LE(1, 20);
  // channel count
  buffer.writeUInt16LE(numChannels, 22);
  // sample rate
  buffer.writeUInt32LE(sampleRate, 24);
  // byte rate
  buffer.writeUInt32LE(byteRate, 28);
  // block align
  buffer.writeUInt16LE(blockAlign, 32);
  // bits per sample
  buffer.writeUInt16LE(bitsPerSample, 34);
  // data chunk identifier
  buffer.write("data", 36);
  // data chunk length
  buffer.writeUInt32LE(dataSize, 40);
  // copy PCM audio data
  pcmBuffer.copy(buffer, 44);

  return buffer;
}

const AVAILABLE_VOICES = [
  {
    id: "Kore",
    name: "Kore",
    gender: "Female",
    tone: "Warm, natural, clear & pleasant",
    description: "Versatile conversational voice ideal for narrations, explanations, and everyday audio.",
    tags: ["Warm", "Conversational", "Balanced"],
  },
  {
    id: "Puck",
    name: "Puck",
    gender: "Male / Neutral",
    tone: "Energetic, youthful, bright & lively",
    description: "Engaging and upbeat tone great for podcasts, gaming, youth content, and promotions.",
    tags: ["Upbeat", "Youthful", "Dynamic"],
  },
  {
    id: "Charon",
    name: "Charon",
    gender: "Male",
    tone: "Deep, resonant, authoritative & calm",
    description: "Commanding and trustworthy presence well-suited for documentaries, news, and executive briefings.",
    tags: ["Authoritative", "Deep", "Professional"],
  },
  {
    id: "Fenrir",
    name: "Fenrir",
    gender: "Male",
    tone: "Crisp, focused, clear & distinct",
    description: "Precise articulation for tutorials, audiobooks, announcements, and presentations.",
    tags: ["Crisp", "Focused", "Articulate"],
  },
  {
    id: "Zephyr",
    name: "Zephyr",
    gender: "Female / Soft",
    tone: "Calm, smooth, soothing & expressive",
    description: "Relaxed, gentle cadence perfect for mindfulness, relaxation, ambient narrations, and bedtime stories.",
    tags: ["Gentle", "Calm", "Expressive"],
  },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Endpoints
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      model: "gemini-3.1-flash-tts-preview",
    });
  });

  app.get("/api/voices", (_req, res) => {
    res.json({
      voices: AVAILABLE_VOICES,
      defaultVoice: "Kore",
    });
  });

  // Activates a license key for a device (first use only), or re-validates
  // it on subsequent app opens. All checks happen server-side against
  // Firestore via the Admin SDK — never trust a client-side check.
  app.post("/api/license/activate", async (req, res) => {
    const { key, deviceId } = req.body || {};
    const result = await validateLicense(key, deviceId, 0);
    if (!result.valid) {
      return res.status(403).json({ success: false, error: result.error });
    }
    return res.json({ success: true, license: result.license });
  });

  // Lightweight status check (used on app reload) — same validation,
  // just phrased as a GET-style check rather than "activate".
  app.post("/api/license/status", async (req, res) => {
    const { key, deviceId } = req.body || {};
    const result = await validateLicense(key, deviceId, 0);
    return res.json(result);
  });

  app.post("/api/tts/generate", async (req, res) => {
    try {
      const {
        mode = "single",
        text,
        voice = "Kore",
        toneStyle = "natural",
        customInstruction,
        speakers = [
          { speaker: "Speaker 1", voice: "Kore" },
          { speaker: "Speaker 2", voice: "Puck" },
        ],
        licenseKey,
        deviceId,
      } = req.body;

      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Text is required for TTS conversion." });
      }

      const trimmedText = text.trim();

      // Enforce license + character quota before spending any Gemini quota.
      const licenseCheck = await validateLicense(licenseKey, deviceId, trimmedText.length);
      if (!licenseCheck.valid) {
        return res.status(403).json({ error: licenseCheck.error || "Invalid or inactive license." });
      }

      const ai = getAiClient();

      let promptText = trimmedText;

      if (mode === "single") {
        // Build single speaker prompt with emotional or stylistic direction if requested
        if (customInstruction && customInstruction.trim()) {
          promptText = `[Style: ${customInstruction.trim()}] ${trimmedText}`;
        } else if (toneStyle && toneStyle !== "natural") {
          const toneDescriptions: Record<string, string> = {
            cheerful: "Say cheerfully and with enthusiasm",
            professional: "Read in a formal, clear, and professional tone",
            calm: "Speak softly, calmly, and at a soothing pace",
            storyteller: "Narrate with expressive storytelling cadence and rich emotion",
            whisper: "Speak in an intimate, soft, whispered voice",
            urgent: "Speak with rapid urgency, importance, and crisp focus",
            energetic: "Speak with high energy, excitement, and punchy cadence",
          };
          const directive = toneDescriptions[toneStyle] || `Speak with ${toneStyle} tone`;
          promptText = `[Instruction: ${directive}]: ${trimmedText}`;
        }

        const validVoice =
          AVAILABLE_VOICES.find((v) => v.id.toLowerCase() === voice.toLowerCase())?.id || "Kore";

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: promptText }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: validVoice },
              },
            },
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const rawBase64 = part?.inlineData?.data;

        if (!rawBase64) {
          throw new Error("The model did not return any audio data. Please try again.");
        }

        const pcmBuffer = Buffer.from(rawBase64, "base64");
        const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
        const wavBase64 = wavBuffer.toString("base64");
        const durationSeconds = +(pcmBuffer.length / (24000 * 2)).toFixed(2);

        await consumeQuota(licenseKey, trimmedText.length);

        return res.json({
          success: true,
          audioDataUri: `data:audio/wav;base64,${wavBase64}`,
          audioWavBase64: wavBase64,
          sampleRate: 24000,
          duration: durationSeconds,
          voice: validVoice,
          mode: "single",
          text: trimmedText,
          characterCount: trimmedText.length,
          wordCount: trimmedText.split(/\s+/).filter(Boolean).length,
        });
      } else {
        // Multi-speaker dialogue mode
        const spk1 = speakers[0] || { speaker: "Speaker 1", voice: "Kore" };
        const spk2 = speakers[1] || { speaker: "Speaker 2", voice: "Puck" };

        const dialoguePrompt = `TTS the following conversation between ${spk1.speaker} and ${spk2.speaker}:\n${trimmedText}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: dialoguePrompt }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                  {
                    speaker: spk1.speaker,
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: spk1.voice || "Kore" },
                    },
                  },
                  {
                    speaker: spk2.speaker,
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: spk2.voice || "Puck" },
                    },
                  },
                ],
              },
            },
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const rawBase64 = part?.inlineData?.data;

        if (!rawBase64) {
          throw new Error("The model did not return any audio data. Please try again.");
        }

        const pcmBuffer = Buffer.from(rawBase64, "base64");
        const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
        const wavBase64 = wavBuffer.toString("base64");
        const durationSeconds = +(pcmBuffer.length / (24000 * 2)).toFixed(2);

        await consumeQuota(licenseKey, trimmedText.length);

        return res.json({
          success: true,
          audioDataUri: `data:audio/wav;base64,${wavBase64}`,
          audioWavBase64: wavBase64,
          sampleRate: 24000,
          duration: durationSeconds,
          speakers: [spk1, spk2],
          mode: "multi",
          text: trimmedText,
          characterCount: trimmedText.length,
          wordCount: trimmedText.split(/\s+/).filter(Boolean).length,
        });
      }
    } catch (error: any) {
      console.error("TTS generation error:", error);
      return res.status(500).json({
        error: error.message || "Failed to generate speech audio from text.",
      });
    }
  });

  // Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TTS Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
