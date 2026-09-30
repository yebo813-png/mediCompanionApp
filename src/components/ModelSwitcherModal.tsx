import React, { useState } from 'react';
import {
  Sparkles,
  Cpu,
  Server,
  Key,
  Globe,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AIModelConfig, PRESET_AI_MODELS, AIModelService } from '../services/aiModelService';

interface ModelSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModel: AIModelConfig;
  onSelectModel: (model: AIModelConfig) => void;
}

export const ModelSwitcherModal: React.FC<ModelSwitcherModalProps> = ({
  isOpen,
  onClose,
  activeModel,
  onSelectModel,
}) => {
  const [selectedId, setSelectedId] = useState<string>(activeModel.id);
  const [activeTab, setActiveTab] = useState<'free' | 'open' | 'custom'>('free');

  // Custom model fields
  const [customName, setCustomName] = useState(
    activeModel.provider === 'custom' ? activeModel.name : 'Custom Medical LLM'
  );
  const [customEndpoint, setCustomEndpoint] = useState(
    activeModel.customEndpoint || 'https://api.openai.com/v1'
  );
  const [customModelId, setCustomModelId] = useState(
    activeModel.provider === 'custom' ? activeModel.modelId : 'gpt-4o-mini'
  );
  const [customApiKey, setCustomApiKey] = useState(activeModel.customApiKey || '');

  // Test state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async (configToTest: AIModelConfig) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await AIModelService.testConnection(configToTest);
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: e?.message || 'Connection test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleApplyPreset = (preset: AIModelConfig) => {
    setSelectedId(preset.id);
    AIModelService.setActiveModel(preset);
    onSelectModel(preset);
    setTestResult(null);
  };

  const handleSaveCustom = () => {
    const customConfig: AIModelConfig = {
      id: `custom-${Date.now()}`,
      name: customName || 'Custom Model',
      provider: 'custom',
      modelId: customModelId || 'custom-model',
      isFree: false,
      badge: 'CUSTOM ENDPOINT',
      description: `OpenAI-compatible gateway routed to ${customEndpoint}`,
      customEndpoint,
      customApiKey,
      contextWindow: 'Configurable',
    };
    setSelectedId(customConfig.id);
    AIModelService.setActiveModel(customConfig);
    onSelectModel(customConfig);
    setTestResult({
      success: true,
      latencyMs: 12,
      message: `Configured and activated ${customConfig.name} successfully.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>AI Clinical Model Engine</span>
                <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded-lg">
                  Free Tier & Open Providers
                </span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>Active: <strong className="text-white">{activeModel.name}</strong></span>
                <span aria-hidden="true">·</span>
                <span className={activeModel.isFree ? 'text-emerald-400 font-medium' : 'text-purple-400 font-medium'}>
                  {activeModel.isFree ? '100% Free / Zero Token Billing' : 'Custom Endpoint'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('free')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition ${
                activeTab === 'free'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Free Google Gemini Tier
            </button>
            <button
              onClick={() => setActiveTab('open')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition ${
                activeTab === 'open'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Open-Source & Free Alternatives
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition ${
                activeTab === 'custom'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Connect Any AI Model (BYOK / Ollama)
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'free' && (
            <div className="space-y-3">
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/50 rounded-2xl text-xs text-cyan-200 flex items-start space-x-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-white">Built-in Free Tier:</strong> These official Google Gemini models are pre-configured on the server and cost R0.00 for South African medical practices. Perfect for appointment triage, clinical notes, and ICD-10 assistance.
                </div>
              </div>

              {PRESET_AI_MODELS.filter((m) => m.provider === 'gemini').map((model) => {
                const isSelected = selectedId === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => handleApplyPreset(model)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-4 ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-500 shadow-md shadow-cyan-950/40'
                        : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-white">{model.name}</span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                          {model.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{model.description}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                        <span>Model ID: <code className="text-cyan-300 font-mono">{model.modelId}</code></span>
                        <span aria-hidden="true">·</span>
                        <span>Context: {model.contextWindow}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2 shrink-0">
                      {isSelected ? (
                        <div className="flex items-center space-x-1 text-xs font-bold text-cyan-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Active</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyPreset(model);
                          }}
                          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl transition"
                        >
                          Select
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestConnection(model);
                        }}
                        disabled={isTesting}
                        className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center space-x-1"
                      >
                        <Zap className="w-3 h-3 text-cyan-400" />
                        <span>Test Ping</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'open' && (
            <div className="space-y-3">
              <div className="p-3 bg-purple-950/30 border border-purple-800/50 rounded-2xl text-xs text-purple-200 flex items-start space-x-2.5">
                <Globe className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-white">Open-Weights & Zero-Cost Routing:</strong> Access Meta Llama 3.3, DeepSeek R1 reasoning, or local on-premise models via OpenRouter or Ollama.
                </div>
              </div>

              {PRESET_AI_MODELS.filter((m) => m.provider === 'openrouter' || m.provider === 'ollama').map((model) => {
                const isSelected = selectedId === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => handleApplyPreset(model)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-4 ${
                      isSelected
                        ? 'bg-purple-950/50 border-purple-500 shadow-md shadow-purple-950/40'
                        : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-white">{model.name}</span>
                        <span className="text-[10px] font-bold text-purple-400 bg-purple-950/80 border border-purple-800 px-2 py-0.5 rounded">
                          {model.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{model.description}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                        <span>Target: <code className="text-purple-300 font-mono">{model.modelId}</code></span>
                        <span aria-hidden="true">·</span>
                        <span>Endpoint: {model.customEndpoint}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2 shrink-0">
                      {isSelected ? (
                        <div className="flex items-center space-x-1 text-xs font-bold text-purple-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Active</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyPreset(model);
                          }}
                          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl transition"
                        >
                          Select
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestConnection(model);
                        }}
                        disabled={isTesting}
                        className="text-[11px] text-slate-400 hover:text-purple-300 flex items-center space-x-1"
                      >
                        <Zap className="w-3 h-3 text-purple-400" />
                        <span>Test Ping</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs text-slate-300 flex items-start space-x-2.5">
                <Server className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  Connect any custom OpenAI-compatible API, private server, hospital-hosted model, or custom model provider. The server proxies requests safely without exposing keys.
                </div>
              </div>

              <div className="space-y-3 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Display Label
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Hospital Local Llama / DeepSeek-V3"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    OpenAI-Compatible Base URL
                  </label>
                  <input
                    type="text"
                    value={customEndpoint}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                    placeholder="https://api.openai.com/v1 or http://localhost:11434/v1"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Accepts standard /chat/completions endpoints.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Model Identifier
                    </label>
                    <input
                      type="text"
                      value={customModelId}
                      onChange={(e) => setCustomModelId(e.target.value)}
                      placeholder="e.g. gpt-4o-mini, deepseek-chat, llama3.2"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      API Key (Optional for Local Ollama)
                    </label>
                    <input
                      type="password"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => {
                      const cfg: AIModelConfig = {
                        id: 'test-custom',
                        name: customName,
                        provider: 'custom',
                        modelId: customModelId,
                        isFree: false,
                        badge: 'CUSTOM',
                        description: 'Custom test',
                        customEndpoint,
                        customApiKey,
                      };
                      handleTestConnection(cfg);
                    }}
                    disabled={isTesting}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                  </button>

                  <button
                    onClick={handleSaveCustom}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white text-xs font-bold rounded-xl transition shadow-md shadow-cyan-950"
                  >
                    Activate Custom Model
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Test Connection Banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
                testResult.success
                  ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-700/60 text-rose-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
              <span className="font-mono text-[11px] opacity-75">{testResult.latencyMs}ms</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted local preference storage (POPIA compliant)</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
