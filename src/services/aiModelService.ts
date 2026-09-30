export interface AIModelConfig {
  id: string;
  name: string;
  provider: 'gemini' | 'custom' | 'openrouter' | 'ollama' | 'deepseek';
  modelId: string;
  isFree: boolean;
  badge: string;
  description: string;
  customEndpoint?: string;
  customApiKey?: string;
  contextWindow?: string;
}

export const PRESET_AI_MODELS: AIModelConfig[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'gemini',
    modelId: 'gemini-3.8-flash',
    isFree: true,
    badge: 'FREE · RECOMMENDED',
    description: "Google's fast, highly capable clinical reasoning model for diagnostic triage, treatment plans, and appointment risk analysis.",
    contextWindow: '1M tokens',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    provider: 'gemini',
    modelId: 'gemini-3.1-flash-lite',
    isFree: true,
    badge: 'FREE · ULTRA-FAST',
    description: 'Ultra-low latency model engineered for instantaneous clinical voice transcription and rapid queue triage.',
    contextWindow: '1M tokens',
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    provider: 'gemini',
    modelId: 'gemini-flash-latest',
    isFree: true,
    badge: 'FREE · AUTO-UPDATED',
    description: 'Always routes to the latest stable Google Gemini Flash iteration without code changes.',
    contextWindow: '1M tokens',
  },
  {
    id: 'openrouter-llama-free',
    name: 'Llama 3.3 70B Instruct (Free)',
    provider: 'openrouter',
    modelId: 'meta-llama/llama-3.3-70b-instruct:free',
    isFree: true,
    badge: 'OPEN SOURCE · FREE',
    description: 'Meta open-weights model hosted on OpenRouter with zero per-token cost for clinical assistance.',
    contextWindow: '128k tokens',
    customEndpoint: 'https://openrouter.ai/api/v1',
  },
  {
    id: 'openrouter-deepseek-free',
    name: 'DeepSeek R1 Distill (Free)',
    provider: 'openrouter',
    modelId: 'deepseek/deepseek-r1:free',
    isFree: true,
    badge: 'OPEN SOURCE · REASONING',
    description: 'DeepSeek open reasoning model via OpenRouter for complex clinical differential diagnosis.',
    contextWindow: '64k tokens',
    customEndpoint: 'https://openrouter.ai/api/v1',
  },
  {
    id: 'deepseek-api',
    name: 'DeepSeek-V3 Official',
    provider: 'deepseek',
    modelId: 'deepseek-chat',
    isFree: false,
    badge: 'CUSTOM / BYOK',
    description: 'Direct connection to DeepSeek API endpoint with custom API key.',
    contextWindow: '64k tokens',
    customEndpoint: 'https://api.deepseek.com/v1',
  },
  {
    id: 'ollama-local',
    name: 'Ollama Local (Meditron / Llama)',
    provider: 'ollama',
    modelId: 'llama3.2:latest',
    isFree: true,
    badge: 'LOCAL · 100% PRIVATE',
    description: 'Connect directly to your on-premise local Ollama instance running in your practice rooms (e.g. Meditron or Llama 3).',
    contextWindow: '128k tokens',
    customEndpoint: 'http://localhost:11434/v1',
  },
  {
    id: 'custom-endpoint',
    name: 'Custom OpenAI-Compatible Endpoint',
    provider: 'custom',
    modelId: 'custom-model',
    isFree: false,
    badge: 'ANY MODEL',
    description: 'Connect to any private hospital LLM, HuggingFace Inference Endpoint, vLLM, or custom AI gateway.',
    contextWindow: 'Configurable',
    customEndpoint: 'https://api.openai.com/v1',
  },
];

const STORAGE_KEY = 'medswitch_active_ai_model';

export const AIModelService = {
  getActiveModel(): AIModelConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load stored AI model config', e);
    }
    return PRESET_AI_MODELS[0]; // Default: Gemini 3.8 Flash (Free)
  },

  setActiveModel(config: AIModelConfig): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save AI model config', e);
    }
  },

  async testConnection(config: AIModelConfig): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const start = performance.now();
    try {
      const res = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config.provider,
          modelId: config.modelId,
          customEndpoint: config.customEndpoint,
          customApiKey: config.customApiKey,
        }),
      });

      const data = await res.json();
      const latencyMs = Math.round(performance.now() - start);

      if (res.ok && data.success) {
        return {
          success: true,
          latencyMs,
          message: data.message || `Successfully connected to ${config.name} (${latencyMs}ms)`,
        };
      } else {
        return {
          success: false,
          latencyMs,
          message: data.error || 'Connection failed. Please check endpoint and credentials.',
        };
      }
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      return {
        success: false,
        latencyMs,
        message: err.message || 'Network unreachable or server offline.',
      };
    }
  },
};
