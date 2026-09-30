import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldAlert,
  Clock,
  CreditCard,
  FileText,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  RefreshCw,
  Send,
  X,
  Radio,
  Sliders,
  Bell,
  Check,
} from 'lucide-react';
import { Patient, Appointment } from '../types';

export interface DoctorVoiceOptInSettings {
  isEnabled: boolean;
  alertAllergies: boolean;
  alertWaitingDelays: boolean;
  alertUnsubmittedClaims: boolean;
  alertIcd10Suggestions: boolean;
  alertPacing15Min: boolean;
  alertPendingLabs: boolean;
  voicePersona: 'Zephyr' | 'Kore' | 'Puck' | 'Fenrir';
  soundVolume: number; // 0 to 1
}

interface DoctorVoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  optInSettings: DoctorVoiceOptInSettings;
  onUpdateSettings: (settings: DoctorVoiceOptInSettings) => void;
  activePatient?: Patient | null;
  patients: Patient[];
  appointments: Appointment[];
  onTriggerSpokenReminder?: (text: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'doctor' | 'assistant';
  text: string;
  timestamp: string;
  type?: 'reminder' | 'query' | 'alert';
}

export const DoctorVoiceAssistantModal: React.FC<DoctorVoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  optInSettings,
  onUpdateSettings,
  activePatient,
  patients,
  appointments,
  onTriggerSpokenReminder,
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'optin' | 'history'>('live');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connected' | 'simulated' | 'disconnected'>('simulated');
  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: "Good day Dr. Ndlovu. I am your Gemini 3.8 Live clinical voice assistant. I am standing by with real-time patient reminders, allergy safeguards, and ICD-10 suggestions.",
      timestamp: '08:00',
      type: 'reminder',
    },
  ]);

  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize Web Speech API synthesis reference
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Connect to Gemini 3.8 Live stream over WebSocket
  useEffect(() => {
    if (!isOpen) return;

    setIsConnecting(true);
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/live-stream`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnecting(false);
        setWsStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'text' && msg.text) {
            handleAssistantReply(msg.text);
          } else if (msg.type === 'audio' && msg.audio) {
            playRawPcmAudio(msg.audio);
          } else if (msg.type === 'status') {
            if (msg.status === 'connected') {
              setWsStatus('connected');
            }
          }
        } catch (e) {
          console.error('Error parsing live ws message:', e);
        }
      };

      ws.onerror = () => {
        setWsStatus('simulated');
        setIsConnecting(false);
      };

      ws.onclose = () => {
        setWsStatus('simulated');
        setIsConnecting(false);
      };
    } catch (e) {
      setWsStatus('simulated');
      setIsConnecting(false);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      stopMicrophone();
    };
  }, [isOpen]);

  // Play audio chunk via Web Audio API or Web Speech API fallback
  const playRawPcmAudio = (base64Audio: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      // If valid PCM
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768;
      }
      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();

      setIsSpeaking(true);
      source.onended = () => setIsSpeaking(false);
    } catch (err) {
      console.warn('PCM playback fallback:', err);
    }
  };

  // Speak aloud helper (Web Speech API)
  const speakTextAloud = (text: string) => {
    if (!optInSettings.isEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = optInSettings.soundVolume;
    utterance.rate = 1.05;
    utterance.pitch = optInSettings.voicePersona === 'Fenrir' ? 0.85 : optInSettings.voicePersona === 'Puck' ? 1.15 : 1.0;

    // Pick English South Africa or English UK voice if available
    const voices = window.speechSynthesis.getVoices();
    const saVoice = voices.find((v) => v.lang.includes('en-ZA') || v.lang.includes('en-GB') || v.name.includes('South Africa'));
    if (saVoice) {
      utterance.voice = saVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    if (onTriggerSpokenReminder) {
      onTriggerSpokenReminder(text);
    }
  };

  const handleAssistantReply = (replyText: string) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'assistant',
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
    speakTextAloud(replyText);
  };

  // Start Capturing Doctor's Microphone for Gemini 3.8 Live API
  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      source.connect(processor);
      processor.connect(audioCtx.destination);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        // Base64 encode
        let binary = '';
        const bytes = new Uint8Array(pcm16.buffer);
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'audio', audio: base64 }));
        }
      };

      setIsRecording(true);
    } catch (err: any) {
      console.warn('Microphone stream error, falling back to speech recognition:', err);
      // Fallback: Browser SpeechRecognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-ZA';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          handleSendQuery(transcript);
          setIsRecording(false);
        };
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        recognition.start();
        setIsRecording(true);
      } else {
        alert('Please allow microphone permissions to converse with Gemini 3.8 Live.');
      }
    }
  };

  const stopMicrophone = () => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
  };

  const handleSendQuery = (textToSend?: string) => {
    const query = textToSend || textInput;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'doctor',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setTextInput('');

    // Send to WebSocket
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'text', text: query }));
      // Also send simulate_query in case backend is in sandbox mode
      socketRef.current.send(JSON.stringify({ type: 'simulate_query', text: query }));
    } else {
      // Fallback via REST API
      fetch('/api/ai/voice-assistant/generate-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customPrompt: query,
          patient: activePatient,
          doctorName: 'Dr. Ndlovu',
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.reminderText) {
            handleAssistantReply(data.reminderText);
          }
        })
        .catch(() => {
          handleAssistantReply("Dr. Ndlovu, clinical assistant is standing by with patient safety reminders.");
        });
    }
  };

  // Trigger test reminder
  const handleTestReminder = (type: 'allergy' | 'waiting_room' | 'unsubmitted_claim' | 'icd10') => {
    fetch('/api/ai/voice-assistant/generate-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reminderType: type,
        patient: activePatient || patients[0],
        doctorName: 'Dr. Ndlovu',
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.reminderText) {
          handleAssistantReply(data.reminderText);
        }
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-900/10 via-slate-50 to-emerald-950/10 dark:from-teal-950/30 dark:via-slate-900 dark:to-emerald-950/30">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              {isSpeaking && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Doctor AI Voice Assistant
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  GEMINI 3.8 LIVE
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="flex items-center space-x-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="font-mono text-[11px]">
                    {wsStatus === 'connected' ? 'Live API Connected (38ms)' : 'Simulated Voice Stream'}
                  </span>
                </span>
                <span>·</span>
                <span>{optInSettings.isEnabled ? 'Voice Reminders Opted-In' : 'Voice Muted'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (isSpeaking) {
                  window.speechSynthesis?.cancel();
                  setIsSpeaking(false);
                }
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('live')}
            className={`py-3 px-3 border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'live'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live Voice Conversation</span>
          </button>

          <button
            onClick={() => setActiveTab('optin')}
            className={`py-3 px-3 border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'optin'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Opt-In Reminders & Persona</span>
            {optInSettings.isEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3 border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'history'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Transcript & Triggers</span>
          </button>
        </div>

        {/* Tab 1: Live Voice Conversation */}
        {activeTab === 'live' && (
          <div className="p-5 flex-1 overflow-y-auto space-y-4 flex flex-col justify-between">
            {/* Live Audio Visualizer Banner */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                  {isSpeaking ? (
                    <Volume2 className="w-6 h-6 animate-bounce" />
                  ) : isRecording ? (
                    <Mic className="w-6 h-6 text-rose-400 animate-pulse" />
                  ) : (
                    <Activity className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-2">
                    <span>
                      {isSpeaking
                        ? 'Assistant Speaking (Gemini Live Audio)...'
                        : isRecording
                        ? 'Listening to Doctor Ndlovu...'
                        : 'Gemini 3.8 Live Voice Assistant Ready'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {optInSettings.isEnabled
                      ? 'Proactive voice alerts opted-in · Hands-free clinical support'
                      : 'Voice alerts currently paused. Enable in Opt-In settings.'}
                  </div>
                </div>
              </div>

              {/* Wave animation */}
              <div className="flex items-center space-x-1 h-6">
                {[12, 20, 16, 24, 18, 22, 14, 20, 24, 16, 12].map((height, idx) => (
                  <span
                    key={idx}
                    style={{ height: isSpeaking || isRecording ? `${height}px` : '4px' }}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isSpeaking
                        ? 'bg-teal-400'
                        : isRecording
                        ? 'bg-rose-400'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 space-y-3 max-h-60 overflow-y-auto pr-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'doctor'
                        ? 'bg-teal-600 text-white rounded-br-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75">
                      <span className="font-bold">
                        {msg.sender === 'doctor' ? 'Dr. Ndlovu' : `AI Voice (${optInSettings.voicePersona})`}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div>{msg.text}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Voice Prompt Shortcuts */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Quick Doctor Queries & Spoken Tests
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  "Check Maria's recorded allergies",
                  'How many patients in my waiting room?',
                  'What is the ICD-10 code for bronchitis?',
                  'Remind me to submit Tariff 0190 claim',
                  'Can I prescribe Warfarin with NSAIDs?',
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => handleSendQuery(promptText)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1"
                  >
                    <span>&ldquo;{promptText}&rdquo;</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Mic and Input */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2">
              <button
                onClick={isRecording ? stopMicrophone : startMicrophone}
                className={`p-3 rounded-2xl flex items-center justify-center transition shadow-md ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-400/40'
                    : 'bg-teal-600 hover:bg-teal-500 text-white'
                }`}
                title={isRecording ? 'Click to stop speaking' : 'Click to speak to Gemini 3.8 Live'}
              >
                {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
              </button>

              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendQuery();
                }}
                placeholder="Ask clinical assistant or type query..."
                className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />

              <button
                onClick={() => handleSendQuery()}
                disabled={!textInput.trim()}
                className="p-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 disabled:opacity-40 hover:bg-slate-800 dark:hover:bg-slate-100 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Opt-In Reminders & Persona */}
        {activeTab === 'optin' && (
          <div className="p-5 flex-1 overflow-y-auto space-y-5">
            {/* Master Opt-in Toggle */}
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Enable Doctor Voice AI Reminders</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-600 text-white">
                    RECOMMENDED
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md">
                  When enabled, your AI clinical assistant proactively speaks reminders aloud during consultations, alerting you to drug interactions, delays, and billing checkpoints.
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={optInSettings.isEnabled}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...optInSettings,
                      isEnabled: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {/* Individual Reminder Checkpoints */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Configurable Doctor Voice Reminders
              </h4>
              <div className="space-y-2.5">
                {[
                  {
                    key: 'alertAllergies',
                    title: 'Severe Allergy & Contraindication Warnings',
                    desc: 'Speaks immediately if prescribed medication conflicts with patient chronic conditions or penicillin/NSAID allergies.',
                    icon: ShieldAlert,
                    badge: 'Critical Patient Safety',
                  },
                  {
                    key: 'alertWaitingDelays',
                    title: 'Waiting Room Delay Warnings (> 15 mins)',
                    desc: 'Speaks a gentle notification when any patient in reception has waited more than 15 minutes.',
                    icon: Clock,
                    badge: 'Patient Experience',
                  },
                  {
                    key: 'alertUnsubmittedClaims',
                    title: 'Unsubmitted Medical Aid Claim Check',
                    desc: 'Reminds you aloud to submit the real-time EDI claim before concluding the appointment or opening the next file.',
                    icon: CreditCard,
                    badge: 'Revenue Protection',
                  },
                  {
                    key: 'alertIcd10Suggestions',
                    title: 'Spoken ICD-10 & PMB Suggestions',
                    desc: 'Speaks recommended South African diagnosis codes during clinical SOAP charting to maximize clean-claim pass rate.',
                    icon: FileText,
                    badge: 'Coding Accuracy',
                  },
                  {
                    key: 'alertPacing15Min',
                    title: '15-Minute Consultation Pacing Chime',
                    desc: 'Gently chimes when a consultation reaches 15 minutes to help manage busy practice schedule.',
                    icon: Bell,
                    badge: 'Schedule Management',
                  },
                  {
                    key: 'alertPendingLabs',
                    title: 'Outstanding Lab & Pathology Flags',
                    desc: 'Reminds you if the patient has unreviewed Ampath, Lancet, or NHLS pathology results.',
                    icon: Activity,
                    badge: 'Clinical Continuity',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isChecked = (optInSettings as any)[item.key];
                  return (
                    <div
                      key={item.key}
                      onClick={() =>
                        onUpdateSettings({
                          ...optInSettings,
                          [item.key]: !isChecked,
                        })
                      }
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start justify-between ${
                        isChecked
                          ? 'bg-white dark:bg-slate-800/80 border-teal-500/50 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-850/40 border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isChecked
                              ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {item.title}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-slate-100 dark:bg-slate-750 text-slate-500">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition ${
                          isChecked
                            ? 'bg-teal-600 text-white'
                            : 'border border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Voice Persona & Volume */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block mb-1.5">
                  Gemini 3.8 Live Voice Persona
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Zephyr', label: 'Zephyr', trait: 'Clear / Calm' },
                    { id: 'Kore', label: 'Kore', trait: 'Warm / Gentle' },
                    { id: 'Puck', label: 'Puck', trait: 'Upbeat / Crisp' },
                    { id: 'Fenrir', label: 'Fenrir', trait: 'Deep / Direct' },
                  ].map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() =>
                        onUpdateSettings({
                          ...optInSettings,
                          voicePersona: voice.id as any,
                        })
                      }
                      className={`p-2.5 rounded-xl text-left border transition ${
                        optInSettings.voicePersona === voice.id
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-xs">{voice.label}</div>
                      <div className="text-[10px] text-slate-400">{voice.trait}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume Slider */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Spoken Reminder Volume
                  </span>
                  <span className="font-mono text-slate-500">
                    {Math.round(optInSettings.soundVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={optInSettings.soundVolume}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...optInSettings,
                      soundVolume: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-teal-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                />
              </div>

              {/* Spoken Test Trigger Buttons */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
                <button
                  onClick={() => handleTestReminder('allergy')}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 transition"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  <span>Test Allergy Alert Aloud</span>
                </button>

                <button
                  onClick={() => handleTestReminder('waiting_room')}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 transition"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Test Delay Alert Aloud</span>
                </button>

                <button
                  onClick={() => handleTestReminder('unsubmitted_claim')}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center space-x-1.5 transition"
                >
                  <CreditCard className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Test Claim Reminder Aloud</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: History & Live Triggers */}
        {activeTab === 'history' && (
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Below is the chronological log of all proactive reminders spoken to Dr. Ndlovu during today&apos;s consultations.
            </div>

            <div className="space-y-2">
              {[
                {
                  time: '08:15',
                  type: 'Allergy Safeguard',
                  text: 'Critical safety alert: Maria van der Merwe has a documented severe allergy to Penicillin. Verified Amoxicillin not prescribed.',
                  status: 'Acknowledged by Doctor',
                  icon: ShieldAlert,
                  color: 'text-rose-500',
                },
                {
                  time: '08:42',
                  type: 'Waiting Room Delay',
                  text: 'Sipho Sithole reached 18-minute waiting threshold for acute asthma follow-up.',
                  status: 'Doctor Called In',
                  icon: Clock,
                  color: 'text-amber-500',
                },
                {
                  time: '09:05',
                  type: 'ICD-10 Suggestion',
                  text: 'Suggested ICD-10 J06.9 (Acute Upper Respiratory Infection) for Discovery Classic Comprehensive claim.',
                  status: 'Applied to SOAP Note',
                  icon: FileText,
                  color: 'text-teal-500',
                },
                {
                  time: '09:28',
                  type: 'Claim Switch Warning',
                  text: 'Reminder spoken to submit Tariff 0190 claim prior to saving consultation.',
                  status: 'Claim Switched (R620.00)',
                  icon: CreditCard,
                  color: 'text-emerald-500',
                },
              ].map((log, idx) => {
                const Icon = log.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className={`w-4 h-4 ${log.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {log.type}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {log.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {log.text}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      {log.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Gemini 3.8 Live API Active</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (isSpeaking) {
                  window.speechSynthesis?.cancel();
                  setIsSpeaking(false);
                }
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow-xs"
            >
              Done & Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
