export type VoiceId = "Kore" | "Puck" | "Charon" | "Fenrir" | "Zephyr";

export interface VoiceInfo {
  id: VoiceId;
  name: string;
  gender: string;
  tone: string;
  description: string;
  tags: string[];
  avatarColor: string;
}

export type ToneStyle =
  | "natural"
  | "cheerful"
  | "professional"
  | "calm"
  | "storyteller"
  | "whisper"
  | "energetic"
  | "urgent";

export interface ToneOption {
  id: ToneStyle;
  label: string;
  icon: string;
  description: string;
}

export interface DialogueSpeaker {
  speaker: string;
  voice: VoiceId;
}

export interface TTSGenerationResult {
  id: string;
  audioDataUri: string;
  audioWavBase64: string;
  sampleRate: number;
  duration: number;
  voice?: VoiceId;
  speakers?: DialogueSpeaker[];
  mode: "single" | "multi";
  text: string;
  toneStyle?: ToneStyle;
  customInstruction?: string;
  characterCount: number;
  wordCount: number;
  timestamp: number;
}

export interface PresetSample {
  id: string;
  title: string;
  category: string;
  mode: "single" | "multi";
  suggestedVoice?: VoiceId;
  suggestedTone?: ToneStyle;
  speakers?: DialogueSpeaker[];
  text: string;
}
