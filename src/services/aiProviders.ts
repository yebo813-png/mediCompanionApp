export interface AIProvider {
  id: string;
  name: string;
  type: 'gemini' | 'openai' | 'openrouter' | 'anthropic' | 'groq' | 'xai' | 'azure' | 'vertex' | 'ollama' | 'custom';
  baseUrl?: string;
  models: string[];
  defaultModel: string;
  requiresApiKey: boolean;
  supportsStreaming: boolean;
  supportsJson: boolean;
  freeTier?: boolean;
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    type: 'gemini',
    models: [
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite-preview',
      'gemini-flash-latest',
      'gemini-3.5-pro',
      'gemini-3.0-pro',
    ],
    defaultModel: 'gemini-3.8-flash',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
    freeTier: true,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    type: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      'openrouter/auto',
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-haiku',
      'google/gemini-pro-3.8',
      'google/gemini-flash-3.8',
      'meta-llama/llama-3.1-405b',
      'meta-llama/llama-3.1-70b',
      'mistralai/mistral-large',
      'nousresearch/hermes-3-llama-3.1-405b',
      'perplexity/llama-3.1-sonar-large',
      'qwen/qwen-2.5-72b-instruct',
    ],
    defaultModel: 'google/gemini-flash-3.8',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'o1-preview',
      'o1-mini',
    ],
    defaultModel: 'gpt-4o-mini',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    type: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ],
    defaultModel: 'claude-3-5-sonnet-20241022',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
  },
  {
    id: 'groq',
    name: 'Groq',
    type: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: [
      'llama-3.1-405b-reasoning',
      'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
      'whisper-large-v3',
    ],
    defaultModel: 'llama-3.1-70b-versatile',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
    freeTier: true,
  },
  {
    id: 'xai',
    name: 'xAI Grok',
    type: 'xai',
    baseUrl: 'https://api.x.ai/v1',
    models: [
      'grok-2',
      'grok-2-mini',
      'grok-1',
    ],
    defaultModel: 'grok-2',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
  },
  {
    id: 'azure',
    name: 'Azure OpenAI',
    type: 'azure',
    models: [
      'gpt-4o',
      'gpt-4',
      'gpt-35-turbo',
    ],
    defaultModel: 'gpt-4o',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
  },
  {
    id: 'vertex',
    name: 'Google Vertex AI',
    type: 'vertex',
    models: [
      'gemini-3.8-flash',
      'gemini-3.5-pro',
      'gemini-3.0-pro',
    ],
    defaultModel: 'gemini-3.8-flash',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    type: 'ollama',
    baseUrl: 'http://localhost:11434',
    models: [
      'llama3.1:70b',
      'llama3.1:8b',
      'mistral:7b',
      'codellama:34b',
      'gemma2:27b',
      'phi3:14b',
    ],
    defaultModel: 'llama3.1:8b',
    requiresApiKey: false,
    supportsStreaming: true,
    supportsJson: true,
    freeTier: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    type: 'openai',
    baseUrl: 'https://api.deepseek.com/v1',
    models: [
      'deepseek-chat',
      'deepseek-coder',
    ],
    defaultModel: 'deepseek-chat',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    type: 'openai',
    baseUrl: 'https://api.mistral.ai/v1',
    models: [
      'mistral-large-latest',
      'mistral-medium-latest',
      'mistral-small-latest',
      'pixtral-12b',
      'codestral-latest',
    ],
    defaultModel: 'mistral-large-latest',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
  },
  {
    id: 'cohere',
    name: 'Cohere',
    type: 'openai',
    baseUrl: 'https://api.cohere.ai/v1',
    models: [
      'command-r-plus',
      'command-r',
      'command-light',
    ],
    defaultModel: 'command-r-plus',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    type: 'openai',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    models: [
      'nvidia/nemotron-3-ultra',
      'meta/llama-3.1-405b-instruct',
      'meta/llama-3.1-70b-instruct',
      'mistralai/mistral-large',
      'google/gemma-2-27b',
    ],
    defaultModel: 'meta/llama-3.1-70b-instruct',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
  },
  {
    id: 'sambanova',
    name: 'SambaNova Cloud',
    type: 'openai',
    baseUrl: 'https://api.sambanova.ai/v1',
    models: [
      'Meta-Llama-3.1-405B-Instruct',
      'Meta-Llama-3.1-70B-Instruct',
      'Meta-Llama-3.1-8B-Instruct',
    ],
    defaultModel: 'Meta-Llama-3.1-70B-Instruct',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    type: 'openai',
    baseUrl: 'https://api.cerebras.ai/v1',
    models: [
      'llama3.1-70b',
      'llama3.1-8b',
    ],
    defaultModel: 'llama3.1-70b',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
  },
  {
    id: 'aionlabs',
    name: 'Aion Labs',
    type: 'openai',
    baseUrl: 'https://api.aionlabs.ai/v1',
    models: [
      'aion-medical-70b',
      'aion-clinical-8b',
    ],
    defaultModel: 'aion-medical-70b',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
  },
  {
    id: 'blackbox',
    name: 'Blackbox AI',
    type: 'openai',
    baseUrl: 'https://api.blackbox.ai/v1',
    models: [
      'blackbox-pro',
      'blackbox-basic',
    ],
    defaultModel: 'blackbox-pro',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
  },
  {
    id: 'pollinations',
    name: 'Pollinations AI',
    type: 'openai',
    baseUrl: 'https://text.pollinations.ai/openai',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'claude-3.5-sonnet',
      'gemini-1.5-pro',
      'llama-3.1-405b',
    ],
    defaultModel: 'gpt-4o-mini',
    requiresApiKey: false,
    supportsStreaming: true,
    supportsJson: true,
    freeTier: true,
  },
  {
    id: 'zai',
    name: 'Z.ai (Zhipu)',
    type: 'openai',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      'glm-4-plus',
      'glm-4-air',
      'glm-4-flash',
      'glm-4v-plus',
    ],
    defaultModel: 'glm-4-flash',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
  },
  {
    id: 'bytedance',
    name: 'ByteDance Ark',
    type: 'openai',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: [
      'doubao-pro-32k',
      'doubao-pro-256k',
      'doubao-lite-32k',
    ],
    defaultModel: 'doubao-pro-32k',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
  },
  {
    id: 'opencode-zen',
    name: 'OpenCode Zen',
    type: 'openai',
    baseUrl: 'https://opencode.ai/zen/v1',
    models: [
      'claude-sonnet-5',
      'gpt-6',
      'gemini-3.8-flash',
      'llama-3.1-405b',
    ],
    defaultModel: 'gemini-3.8-flash',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
  },
  {
    id: '9router',
    name: '9Router Gateway',
    type: 'openai',
    baseUrl: 'http://localhost:20128',
    models: [
      'gemini/gemini-3.8-flash',
      'gemini/gemini-3.1-flash-lite-preview',
      'openrouter/auto',
    ],
    defaultModel: 'gemini/gemini-3.8-flash',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
    freeTier: true,
  },
  {
    id: 'omniroute',
    name: 'OmniRoute Gateway',
    type: 'openai',
    baseUrl: 'http://localhost:20129',
    models: [
      'gemini-3.8-flash',
      'openrouter/auto',
      'anthropic/claude-3.5-sonnet',
      'gpt-4o',
    ],
    defaultModel: 'gemini-3.8-flash',
    requiresApiKey: true,
    supportsStreaming: true,
    supportsJson: true,
  },
];

export function getProvider(id: string): AIProvider | undefined {
  return AI_PROVIDERS.find(p => p.id === id);
}

export function getProviderModels(providerId: string): string[] {
  const provider = getProvider(providerId);
  return provider?.models || [];
}

export function getAllModels(): { providerId: string; modelId: string; name: string }[] {
  const models: { providerId: string; modelId: string; name: string }[] = [];
  for (const provider of AI_PROVIDERS) {
    for (const model of provider.models) {
      models.push({ providerId: provider.id, modelId: model, name: `${provider.name} - ${model}` });
    }
  }
  return models;
}

export const DEFAULT_PROVIDER = 'gemini';
export const DEFAULT_MODEL = 'gemini-3.8-flash';