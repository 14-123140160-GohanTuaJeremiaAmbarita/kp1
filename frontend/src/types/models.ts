// src/types/models.ts

export interface ModelOption {
  id: string;        // model slug OpenRouter, dikirim apa adanya ke backend
  label: string;      // nama yang tampil di dropdown
  badge: string;       // deskripsi singkat (1-3 kata)
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "deepseek/deepseek-chat",
    label: "DeepSeek Chat",
    badge: "Default · Cepat & murah",
  },
  {
    id: "deepseek/deepseek-v4-pro",
    label: "DeepSeek V4 Pro",
    badge: "Reasoning terkuat",
  },
  {
    id: "deepseek/deepseek-v4-flash",
    label: "DeepSeek V4 flash",
    badge: "Stabil",
  },
  {
    id: "openai/gpt-4o-mini",
    label: "GPT-4o mini",
    badge: "Seimbang",
  },
  {
    id: "openai/gpt-5",
    label: "GPT-5",
    badge: "Kualitas tinggi",
  },
  {
    id: "google/gemini-3.5-flash",
    label: "Gemini 3.5 Flash",
    badge: "Cepat",
  },
  {
    id: "anthropic/claude-sonnet-4.5",
    label: "Claude Sonnet",
    badge: "Presisi tinggi",
  },
];

export const DEFAULT_MODEL_ID = MODEL_OPTIONS[0].id;