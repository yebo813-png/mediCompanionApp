import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  Radio,
  UserCheck,
  Smartphone,
  Mic,
  MicOff,
  Search,
  CheckCircle2,
  Sparkles,
  Zap,
  Sun,
  Moon,
  Globe,
  ArrowRight,
  Clock,
  CreditCard,
} from 'lucide-react';
import { Patient } from '../types';
import { AIModelConfig } from '../services/aiModelService';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isClientPortal: boolean;
  setIsClientPortal: (val: boolean) => void;
  patients: Patient[];
  onSelectPatient: (p: Patient) => void;
  isVoiceActive: boolean;
  setIsVoiceActive: (val: boolean) => void;
  isTrialActive?: boolean;
  onActivateTrial?: () => void;
  activeModel?: AIModelConfig;
  onOpenModelSwitcher?: () => void;
  isVoiceOptedIn?: boolean;
  onOpenVoiceAssistant?: () => void;
  onOpenTrialModal?: () => void;
  trialDaysRemaining?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  isClientPortal,
  setIsClientPortal,
  patients,
  onSelectPatient,
  isVoiceActive,
  setIsVoiceActive,
  isTrialActive = false,
  onActivateTrial,
  activeModel,
  onOpenModelSwitcher,
  isVoiceOptedIn = false,
  onOpenVoiceAssistant,
  onOpenTrialModal,
  trialDaysRemaining = 7,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [isSwitchHovered, setIsSwitchHovered] = useState(false);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const filtered = patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q.toLowerCase()) ||
        p.idNumber.includes(q) ||
        p.medicalAidNumber.includes(q)
    );
    setSearchResults(filtered);
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white sticky top-0 z-40 shadow-sm transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Practice Branding matching screenshot */}
          <div
            onClick={() => setActiveView('home')}
            className="flex items-center space-x-3 shrink-0 cursor-pointer group"
            title="Go to Homepage & Solutions"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-600 dark:bg-teal-500 flex items-center justify-center shadow-sm text-white group-hover:scale-105 transition">
              <Activity className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                  MedSwitch SA
                </span>
                <span className="text-[10px] uppercase font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 px-1.5 py-0.2 rounded tracking-wider">
                  v4.8
                </span>
              </div>
              <div className="text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">
                CLINICAL OPERATIONS
              </div>
            </div>
          </div>

          {/* Search bar for quick patient lookup */}
          <div className="hidden md:block relative flex-1 max-w-md mx-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search patient, SA ID, scheme no..."
                className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-700/50">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectPatient(p);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="w-full text-left p-2.5 hover:bg-slate-700/60 transition flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-white">{p.fullName}</div>
                      <div className="text-[11px] text-slate-400">
                        ID: {p.idNumber} • {p.medicalAidName}
                      </div>
                    </div>
                    <span className="text-[10px] text-cyan-400 bg-cyan-950/70 border border-cyan-800 px-2 py-0.5 rounded-md">
                      Open EHR
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Action Controls: AI Model Switcher, Switch (Masked), Theme Toggle, Voice Dictate, Client App Mode, Profile */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Quick Homepage / Practice Suite Toggle */}
            {activeView === 'home' ? (
              <button
                onClick={() => setActiveView('diary')}
                className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition"
                title="Enter Doctor Practice Diary & Suite"
              >
                <span>Launch Suite</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setActiveView('home')}
                className="hidden md:flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                title="View Homepage, Features & Benefits"
              >
                <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Solutions</span>
              </button>
            )}
            {/* AI Model Switcher Button */}
            {onOpenModelSwitcher && (
              <button
                onClick={onOpenModelSwitcher}
                className="hidden sm:flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl text-xs transition"
                title="Switch Clinical AI Model (Free Gemini, Llama, DeepSeek, Ollama)"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />
                <span className="font-semibold text-slate-800 dark:text-white truncate max-w-[110px]">
                  {activeModel?.name || 'Gemini 3.8 Flash'}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    activeModel?.isFree !== false
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                  }`}
                >
                  {activeModel?.isFree !== false ? 'Free' : 'Custom'}
                </span>
              </button>
            )}

            {/* Medical Aid Switch Status (Matching screenshot green pill) */}
            <div className="relative">
              <button
                onClick={() => setShowSwitchModal(true)}
                onMouseEnter={() => setIsSwitchHovered(true)}
                onMouseLeave={() => setIsSwitchHovered(false)}
                className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-full text-xs font-semibold transition"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold tracking-tight">
                  HEALTHBRIDGE CONNECTED
                </span>
              </button>

              {/* Hover Tooltip - Revealing switch engine ONLY on hover */}
              {isSwitchHovered && (
                <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 text-[11px] space-y-1.5 animate-in fade-in zoom-in-95 pointer-events-none text-slate-700 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Switch Provider:</span>
                    <span className="text-teal-700 dark:text-cyan-300 font-semibold font-mono">Healthbridge EDI Engine</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Operating Mode:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {isTrialActive ? 'Production Trial (Active)' : 'Open-Source Sandbox API'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Latency:</span>
                    <span className="font-mono">18ms</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                    {isTrialActive
                      ? '✓ Live routing active for Discovery, GEMS, Bonitas & Medscheme.'
                      : 'ℹ️ Operating in Open-Source API Sandbox for testing.'}
                  </div>
                </div>
              )}
            </div>

            {/* 7-Day Free Trial Button / Active Pill */}
            {onOpenTrialModal && (
              <div>
                {isTrialActive ? (
                  <button
                    onClick={onOpenTrialModal}
                    className="flex items-center space-x-1.5 bg-teal-50 dark:bg-teal-950/80 hover:bg-teal-100 dark:hover:bg-teal-900/80 border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-xs cursor-pointer"
                    title="7-Day Trial Active. Click to view trial details or deactivate before billing starts."
                  >
                    <Clock className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <span className="hidden sm:inline">7-Day Trial:</span>
                    <span>{trialDaysRemaining}d left</span>
                    <span className="text-[10px] uppercase font-black px-1.5 py-0.2 rounded bg-teal-200 dark:bg-teal-800 text-teal-900 dark:text-teal-100">
                      Manage
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenTrialModal}
                    className="flex items-center space-x-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 px-3 py-1.5 rounded-full text-xs font-black shadow-xs transition cursor-pointer"
                    title="Input card details to activate 7-day trial with all features unlocked. Deactivate anytime before Day 7 to avoid charges."
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Try 7 Days Free</span>
                  </button>
                )}
              </div>
            )}

            {/* THEME TOGGLE (Moon / Sun) matching screenshot */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Doctor Voice AI Assistant (Gemini 3.8 Live) Button */}
            <button
              onClick={() => {
                if (onOpenVoiceAssistant) {
                  onOpenVoiceAssistant();
                } else {
                  setIsVoiceActive(!isVoiceActive);
                }
              }}
              className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
                isVoiceOptedIn
                  ? 'bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700 ring-2 ring-teal-400/40 shadow-xs'
                  : isVoiceActive
                  ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-600 ring-2 ring-rose-400/40'
                  : 'bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
              title="Doctor AI Voice Assistant (Gemini 3.8 Live & Opt-In Reminders)"
            >
              <Mic
                className={`w-3.5 h-3.5 ${
                  isVoiceOptedIn
                    ? 'text-teal-600 dark:text-teal-400 animate-pulse'
                    : isVoiceActive
                    ? 'text-rose-500 animate-pulse'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              />
              <span className="font-semibold">
                {isVoiceOptedIn ? 'Voice AI: Active' : isVoiceActive ? 'Voice: On' : 'Voice Assistant'}
              </span>
            </button>

            {/* Doctor Profile matching screenshot */}
            <div className="flex items-center space-x-2.5 pl-1.5 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden lg:block text-right">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Dr. Thabo Ndlovu
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  HPCSA MP 0694821
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center font-bold text-xs text-slate-800 dark:text-slate-200 shadow-sm">
                TN
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Switch Gateway Status & Free Trial Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">South African Medical Aid Switch Gateway</h3>
                  <p className="text-[11px] text-slate-400">Electronic Data Interchange (EDI) Routing Engine</p>
                </div>
              </div>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              {/* Notice about Open-Source Sandbox Mode */}
              <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Underlying Switch Provider:</span>
                  <span className="text-cyan-300 font-bold font-mono">Healthbridge EDI Engine v4.8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Gateway Mode:</span>
                  <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                    isTrialActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  }`}>
                    {isTrialActive ? 'Production 30-Day Trial (Active)' : 'Open-Source Testing Sandbox API'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Testing utilizes an open-source sandbox API compliant with South African BHF/EDI standards. Real-time claims to Discovery Health, GEMS, Bonitas, and Medscheme require active practice onboarding.
                </p>
              </div>

              {/* Free Trial Callout */}
              {!isTrialActive && (
                <div className="p-4 bg-gradient-to-br from-cyan-950/70 via-slate-800 to-teal-950/70 rounded-2xl border border-cyan-700/60 space-y-2.5">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white text-sm">7-Day Full Feature Practice Trial</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Test live direct claims dispatch, Gemini 3.8 Live Doctor Voice AI, and instant benefit checks for 7 days. R0.00 charged today. Deactivate anytime before Day 7 to stop billing.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                    <div>• Practice BHF: <strong className="text-white">0548921</strong></div>
                    <div>• HPCSA: <strong className="text-white">MP 0694821</strong></div>
                  </div>
                  <button
                    onClick={() => {
                      setShowSwitchModal(false);
                      if (onOpenTrialModal) {
                        onOpenTrialModal();
                      } else if (onActivateTrial) {
                        onActivateTrial();
                      }
                    }}
                    className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-cyan-950 flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Activate 7-Day Free Trial (Card Details)</span>
                  </button>
                </div>
              )}

              {isTrialActive && (
                <div className="p-4 bg-emerald-950/60 rounded-2xl border border-emerald-700 text-emerald-200 space-y-1">
                  <div className="flex items-center space-x-2 font-bold text-sm text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Production Switch Trial is Active</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Your practice is connected to the live Healthbridge switch clearinghouse for automated claim dispatch and instant eligibility verification. (29 days remaining).
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowSwitchModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
