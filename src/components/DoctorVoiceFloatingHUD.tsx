import React, { useState } from 'react';
import {
  Mic,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldAlert,
  Clock,
  CreditCard,
  X,
  Play,
  Settings,
} from 'lucide-react';
import { DoctorVoiceOptInSettings } from './DoctorVoiceAssistantModal';

interface DoctorVoiceFloatingHUDProps {
  optInSettings: DoctorVoiceOptInSettings;
  onOpenModal: () => void;
  lastSpokenReminder: string | null;
  onDismissReminder: () => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
  onQuickReplay: () => void;
}

export const DoctorVoiceFloatingHUD: React.FC<DoctorVoiceFloatingHUDProps> = ({
  optInSettings,
  onOpenModal,
  lastSpokenReminder,
  onDismissReminder,
  isSpeaking,
  onStopSpeaking,
  onQuickReplay,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!optInSettings.isEnabled) {
    return null;
  }

  return (
    <aside aria-label="Clinical Voice Assistant Status" className="fixed bottom-6 right-6 z-40 max-w-sm w-full animate-in slide-in-from-bottom-5">
      {/* Active Spoken Alert Pop-up */}
      {lastSpokenReminder && !isMinimized && (
        <div className="mb-2 p-3.5 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 border border-teal-500/50 shadow-2xl backdrop-blur-md text-white text-xs">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center space-x-1.5 text-teal-400 font-bold text-[11px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Voice AI Clinical Alert ({optInSettings.voicePersona})</span>
            </div>
            <button
              onClick={onDismissReminder}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-slate-200 leading-relaxed font-sans text-xs">
            &ldquo;{lastSpokenReminder}&rdquo;
          </p>

          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-2">
              {isSpeaking ? (
                <button
                  onClick={onStopSpeaking}
                  className="flex items-center space-x-1 text-rose-400 font-semibold hover:underline"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Mute Voice</span>
                </button>
              ) : (
                <button
                  onClick={onQuickReplay}
                  className="flex items-center space-x-1 text-teal-400 font-semibold hover:underline"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Replay Reminder</span>
                </button>
              )}
            </div>

            <button
              onClick={onOpenModal}
              className="text-slate-400 hover:text-white underline underline-offset-2"
            >
              Converse / Settings
            </button>
          </div>
        </div>
      )}

      {/* Floating Pill Controller */}
      <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between gap-2">
        <div
          onClick={onOpenModal}
          className="flex items-center space-x-2.5 cursor-pointer group"
          title="Open Doctor AI Voice Assistant (Gemini 3.8 Live)"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center group-hover:scale-105 transition shadow-xs">
              <Mic className="w-4 h-4" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
          </div>

          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span>Voice AI Active</span>
              <span className="text-[9px] font-mono px-1 rounded bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold">
                LIVE
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Dr. Ndlovu · {optInSettings.voicePersona} Voice
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {isSpeaking && (
            <button
              onClick={onStopSpeaking}
              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition"
              title="Stop speaking"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Configure Reminders & Preferences"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
