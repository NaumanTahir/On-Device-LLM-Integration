import { GoogleGenAI, ThinkingLevel, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Electron API Type Definition
declare global {
  interface Window {
    electronAPI: {
      getSystemStats: () => Promise<any>;
      runLocalCommand: (command: string) => Promise<any>;
      localInference: (data: { url: string; method: string; body: any }) => Promise<any>;
      searchWeb: (query: string) => Promise<any>;
      openExternal: (url: string) => Promise<void>;
      showItemInFolder: (path: string) => Promise<void>;
      saveLocalData: (filename: string, data: any) => Promise<string>;
      readLocalData: (filename: string) => Promise<any>;
      isElectron: boolean;
    };
  }
}

export type ModelType = 
  | "gemini-3.1-pro-preview" 
  | "gemini-3-flash-preview" 
  | "gemini-3.1-flash-lite-preview"
  | "gemini-3.1-flash-image-preview"
  | "gemini-3-pro-image-preview"
  | "veo-3.1-lite-generate-preview"
  | "local-llama-3"
  | "local-mistral";

export interface GenerationResult {
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  model3dUrl?: string;
  model: string;
  timestamp: number;
  metrics?: {
    responseTime: number;
    tokensPerSec: number;
    usage: {
      cpu: number;
      gpu: number;
      memory: number;
    };
  };
  feedback?: "positive" | "negative" | null;
  internetSearch?: boolean;
}

export interface SystemMetrics {
  cpu: number;
  gpu: number;
  memory: number;
  temp?: number;
  activeModels: number;
  onDeviceModels: {
    name: string;
    status: "running" | "idle" | "loading";
    type: "GGUF" | "LoRA" | "TensorRT";
    vram: string;
  }[];
}

export interface CatalogModel {
  id: string;
  name: string;
  version: string;
  size: string;
  description: string;
  category: "LLM" | "Vision" | "3D" | "Audio";
  isDownloaded: boolean;
  newUpdate?: boolean;
}

export const MODEL_CATALOG: CatalogModel[] = [
  { id: "llama-3.1-405b", name: "Llama 3.1 405B", version: "1.0.2", size: "230 GB", description: "State-of-the-art open weights model", category: "LLM", isDownloaded: false, newUpdate: true },
  { id: "stable-diffusion-3", name: "Stable Diffusion 3", version: "2.1.0", size: "12 GB", description: "Advanced image generation", category: "Vision", isDownloaded: true },
  { id: "tripo-sr", name: "TripoSR", version: "0.5.0", size: "4.5 GB", description: "Fast image-to-3D generation", category: "3D", isDownloaded: false },
  { id: "whisper-v3", name: "Whisper v3 Large", version: "3.0.0", size: "3.1 GB", description: "Robust speech recognition", category: "Audio", isDownloaded: true },
];

export const MODELS = [
  { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", type: "text", description: "Complex reasoning & coding" },
  { id: "gemini-3-flash-preview", name: "Gemini 3 Flash", type: "text", description: "Fast & efficient" },
  { id: "local-llama-3", name: "Llama 3 (Local)", type: "text", description: "On-device GGUF via Ollama" },
  { id: "local-mistral", name: "Mistral (Local)", type: "text", description: "On-device GGUF via Ollama" },
  { id: "gemini-3.1-flash-image-preview", name: "Gemini 3.1 Image", type: "image", description: "High-quality image gen" },
  { id: "veo-3.1-lite-generate-preview", name: "Veo 3.1 Lite", type: "video", description: "Video generation" },
  { id: "tripo-3d-gen", name: "Tripo 3D", type: "3d", description: "Prompt/Image to 3D" },
];

export function getMockMetrics() {
  return {
    responseTime: Math.floor(Math.random() * 2000) + 500,
    tokensPerSec: Math.floor(Math.random() * 40) + 20,
    usage: {
      cpu: Math.floor(Math.random() * 30) + 10,
      gpu: Math.floor(Math.random() * 60) + 20,
      memory: Math.floor(Math.random() * 4000) + 2000,
    }
  };
}

export async function getSystemStatus(): Promise<SystemMetrics> {
  if (window.electronAPI) {
    const stats = await window.electronAPI.getSystemStats();
    return {
      ...stats,
      activeModels: 2,
      onDeviceModels: [
        { name: "Llama-3-8B-Instruct", status: "running", type: "GGUF", vram: "5.4 GB" },
        { name: "Mistral-7B-v0.3", status: "idle", type: "LoRA", vram: "4.2 GB" },
      ]
    };
  }

  return {
    cpu: Math.floor(Math.random() * 100),
    gpu: Math.floor(Math.random() * 100),
    memory: Math.floor(Math.random() * 100),
    activeModels: 3,
    onDeviceModels: [
      { name: "Llama-3-8B-Instruct", status: "running", type: "GGUF", vram: "5.4 GB" },
      { name: "Mistral-7B-v0.3", status: "idle", type: "LoRA", vram: "4.2 GB" },
      { name: "Stable-Diffusion-XL", status: "idle", type: "TensorRT", vram: "8.1 GB" },
    ]
  };
}

export async function generateText(prompt: string, model: ModelType = "gemini-3-flash-preview", internetSearch: boolean = false): Promise<string> {
  let context = "";

  // Autonomous Internet Search
  if (internetSearch && window.electronAPI) {
    const searchResult = await window.electronAPI.searchWeb(prompt);
    if (searchResult.abstract) {
      context = `\n\n[Internet Search Context]: ${searchResult.abstract}\nSources: ${searchResult.source}\nRelated: ${searchResult.related.join(", ")}\n\n`;
    }
  }

  const finalPrompt = context ? `Using the following search context, answer the user prompt.\n${context}\nUser Prompt: ${prompt}` : prompt;

  // Local Inference Path
  if (window.electronAPI && (model === "local-llama-3" || model === "local-mistral")) {
    const localModelName = model === "local-llama-3" ? "llama3" : "mistral";
    const result = await window.electronAPI.localInference({
      url: "http://localhost:11434/api/generate",
      method: "POST",
      body: {
        model: localModelName,
        prompt: finalPrompt,
        stream: false
      }
    });
    return result.response || "Local model failed to respond. Ensure Ollama is running.";
  }

  // Cloud Path
  try {
    const response = await ai.models.generateContent({
      model: model.startsWith("local") ? "gemini-3-flash-preview" : model,
      contents: finalPrompt,
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Text generation error:", error);
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function selfEvolve(userInteractions: any[]): Promise<any> {
  const evolutionPrompt = `
    Analyze these user interactions and system metrics. 
    Suggest one "Evolutionary Update" for the OmniSandbox AI.
    The update should be one of:
    1. A new UI feature or UX mode.
    2. An efficiency optimization (e.g., "Switch to 4-bit quantization for Llama-3").
    3. A new recommended use case based on user behavior.

    Interactions: ${JSON.stringify(userInteractions.slice(-5))}
    
    Return JSON: { "id": "unique-id", "title": "Update Title", "description": "What it does", "code": "Implementation snippet", "category": "UI|Efficiency|Feature" }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: evolutionPrompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return null;
  }
}

export async function generateImage(prompt: string, options: { aspectRatio: string; size: string; model: ModelType }) {
  try {
    const response = await ai.models.generateContent({
      model: options.model,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: options.aspectRatio as any,
          imageSize: options.size as any,
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
}

export async function judgeAndRoute(prompt: string): Promise<{ model: ModelType; reason: string }> {
  // If in Electron, we can prefer local models for simple tasks
  if (window.electronAPI) {
    if (prompt.length < 100 && !prompt.toLowerCase().includes("code")) {
      return { model: "local-llama-3", reason: "Simple query routed to local engine for privacy and speed." };
    }
  }

  const routerPrompt = `
    Analyze the following user prompt and decide which AI model is best suited for it.
    Available models:
    - gemini-3.1-pro-preview: For complex reasoning, coding, math, or deep analysis.
    - gemini-3-flash-preview: For general text tasks, summarization, or simple Q&A.
    - gemini-3.1-flash-image-preview: For image generation requests.
    - veo-3.1-lite-generate-preview: For video generation requests.

    User Prompt: "${prompt}"

    Return JSON: { "model": "model-id", "reason": "why this model" }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: routerPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            model: { type: Type.STRING },
            reason: { type: Type.STRING },
          },
          required: ["model", "reason"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      model: result.model as ModelType,
      reason: result.reason,
    };
  } catch (error) {
    return { model: "gemini-3-flash-preview", reason: "Fallback due to error" };
  }
}
