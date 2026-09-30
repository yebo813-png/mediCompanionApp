import { AIProvider, getProvider, AI_PROVIDERS } from './aiProviders';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  response_format?: { type: 'json_object' | 'text' };
  tools?: any[];
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIProviderConfig {
  providerId: string;
  modelId: string;
  apiKey?: string;
  baseUrl?: string;
  customHeaders?: Record<string, string>;
}

export class UniversalAIService {
  private config: AIProviderConfig;
  private provider: AIProvider;

  constructor(config: AIProviderConfig) {
    this.config = config;
    const provider = getProvider(config.providerId);
    if (!provider) {
      throw new Error(`Unknown provider: ${config.providerId}`);
    }
    this.provider = provider;
  }

  getProvider(): AIProvider {
    return this.provider;
  }

  getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const model = request.model || this.config.modelId || this.provider.defaultModel;
    
    switch (this.provider.type) {
      case 'gemini':
        return this.geminiChatCompletion(model, request);
      case 'openai':
      case 'openrouter':
      case 'anthropic':
      case 'groq':
      case 'xai':
      case 'azure':
      case 'deepseek':
      case 'mistral':
      case 'cohere':
      case 'nvidia':
      case 'sambanova':
      case 'cerebras':
      case 'aionlabs':
      case 'blackbox':
      case 'pollinations':
      case 'zai':
      case 'bytedance':
      case 'opencode-zen':
      case '9router':
      case 'omniroute':
        return this.openaiCompatibleChatCompletion(model, request);
      case 'vertex':
        return this.vertexChatCompletion(model, request);
      case 'ollama':
        return this.ollamaChatCompletion(model, request);
      default:
        return this.openaiCompatibleChatCompletion(model, request);
    }
  }

  async *streamChatCompletion(request: ChatCompletionRequest): AsyncGenerator<string, void, unknown> {
    const model = request.model || this.config.modelId || this.provider.defaultModel;
    
    if (this.provider.type === 'gemini') {
      yield* this.geminiStreamChatCompletion(model, request);
    } else {
      yield* this.openaiCompatibleStreamChatCompletion(model, request);
    }
  }

  private async geminiChatCompletion(model: string, request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const { GoogleGenAI } = await import('@google/genai');
    const apiKey = this.config.apiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const contents = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const systemInstruction = request.messages.find(m => m.role === 'system')?.content;

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.max_tokens,
        topP: request.top_p,
        responseMimeType: request.response_format?.type === 'json_object' ? 'application/json' : 'text/plain',
      },
    });

    return {
      id: `gemini-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{
        index: 0,
        message: { role: 'assistant', content: response.text || '' },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  }

  private async *geminiStreamChatCompletion(model: string, request: ChatCompletionRequest): AsyncGenerator<string> {
    const { GoogleGenAI } = await import('@google/genai');
    const apiKey = this.config.apiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const contents = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const systemInstruction = request.messages.find(m => m.role === 'system')?.content;

    const stream = await ai.models.generateContentStream({
      model,
      contents,
      config: {
        systemInstruction,
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.max_tokens,
        topP: request.top_p,
        responseMimeType: request.response_format?.type === 'json_object' ? 'application/json' : 'text/plain',
      },
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  }

  private async openaiCompatibleChatCompletion(model: string, request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const baseUrl = this.config.baseUrl || this.provider.baseUrl;
    const apiKey = this.config.apiKey || this.getEnvApiKey();
    
    if (!baseUrl) {
      throw new Error(`Base URL not configured for ${this.provider.name}`);
    }

    if (this.provider.requiresApiKey && !apiKey) {
      throw new Error(`${this.provider.name} API key not configured`);
    }

    const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      if (this.provider.type === 'anthropic') {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
    }

    if (this.config.customHeaders) {
      Object.assign(headers, this.config.customHeaders);
    }

    const body = {
      model,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
        name: m.name,
        tool_calls: m.tool_calls,
        tool_call_id: m.tool_call_id,
      })),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
      frequency_penalty: request.frequency_penalty,
      presence_penalty: request.presence_penalty,
      stream: false,
      response_format: request.response_format,
      tools: request.tools,
      tool_choice: request.tool_choice,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${this.provider.name} API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  }

  private async *openaiCompatibleStreamChatCompletion(model: string, request: ChatCompletionRequest): AsyncGenerator<string> {
    const baseUrl = this.config.baseUrl || this.provider.baseUrl;
    const apiKey = this.config.apiKey || this.getEnvApiKey();
    
    if (!baseUrl) {
      throw new Error(`Base URL not configured for ${this.provider.name}`);
    }

    const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      if (this.provider.type === 'anthropic') {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
    }

    const body = {
      model,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
        name: m.name,
      })),
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens,
      top_p: request.top_p,
      stream: true,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${this.provider.name} API error (${response.status}): ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }

  private async vertexChatCompletion(model: string, request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    throw new Error('Vertex AI requires Google Cloud SDK - use Gemini directly for now');
  }

  private async ollamaChatCompletion(model: string, request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const baseUrl = this.config.baseUrl || this.provider.baseUrl || 'http://localhost:11434';
    
    const messages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));
    
    const systemPrompt = request.messages.find(m => m.role === 'system')?.content;

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages,
        stream: false,
        options: {
          temperature: request.temperature ?? 0.7,
          num_predict: request.max_tokens,
          top_p: request.top_p,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${await response.text()}`);
    }

    const data = await response.json();
    
    return {
      id: `ollama-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{
        index: 0,
        message: { role: 'assistant', content: data.message?.content || '' },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: data.prompt_eval_count || 0,
        completion_tokens: data.eval_count || 0,
        total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
    };
  }

  private getEnvApiKey(): string | undefined {
    const keyMap: Record<string, string> = {
      openrouter: 'OPENROUTER_API_KEY',
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      groq: 'GROQ_API_KEY',
      xai: 'XAI_API_KEY',
      azure: 'AZURE_OPENAI_API_KEY',
      deepseek: 'DEEPSEEK_API_KEY',
      mistral: 'MISTRAL_API_KEY',
      cohere: 'COHERE_API_KEY',
      nvidia: 'NVIDIA_API_KEY',
      sambanova: 'SAMBANOVA_API_KEY',
      cerebras: 'CEREBRAS_API_KEY',
      aionlabs: 'AIONLABS_API_KEY',
      blackbox: 'BLACKBOX_API_KEY',
      zai: 'ZAI_API_KEY',
      bytedance: 'BYTEDANCE_API_KEY',
      'opencode-zen': 'OPENCODE_ZEN_API_KEY',
      '9router': 'NINEROUTER_API_KEY',
      omniroute: 'OMNIROUTE_API_KEY',
    };
    
    return process.env[keyMap[this.provider.id]];
  }

  async testConnection(): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const start = Date.now();
    try {
      const response = await this.chatCompletion({
        model: this.config.modelId || this.provider.defaultModel,
        messages: [{ role: 'user', content: 'Health check. Respond with: OK' }],
        max_tokens: 10,
      });
      
      const latency = Date.now() - start;
      const content = response.choices[0]?.message?.content || '';
      
      return {
        success: content.toLowerCase().includes('ok'),
        message: content.toLowerCase().includes('ok') 
          ? `Connected to ${this.provider.name} (${latency}ms)`
          : `Unexpected response: ${content}`,
        latencyMs: latency,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        latencyMs: Date.now() - start,
      };
    }
  }
}

export function createAIService(config: AIProviderConfig): UniversalAIService {
  return new UniversalAIService(config);
}

export function getAvailableProviders(): AIProvider[] {
  return AI_PROVIDERS;
}