import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Plus,
  Send,
  AlertCircle,
  CheckCircle2,
  Video,
  UserPlus,
  ArrowRight,
  Filter,
  Phone,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Zap,
  Activity,
  CreditCard,
  Radio,
  Wifi,
  Flame,
  Mic,
  MicOff,
  Layers,
  FileText,
  Lock,
  Volume2,
  ExternalLink,
  ChevronDown,
  Info,
  BarChart3,
} from 'lucide-react';
import { Appointment, Patient, MedicalAidClaim } from '../types';
import { MmediCompannionApi, PracticeStore } from '../services/api';

interface PracticeDiaryProps {
  appointments: Appointment[];
  patients: Patient[];
  onStartConsultation: (apt: Appointment) => void;
  onBookAppointment: (apt: Appointment) => void;
  onRequestLocum: (slotDate: string, slotTime: string) => void;
  onOpenPatientFile?: (patient: Patient) => void;
  onOpenTelehealth?: () => void;
  onOpenSwitch?: () => void;
  onOpenBillingOverview?: () => void;
  isVoiceActiveGlobal?: boolean;
  setIsVoiceActiveGlobal?: (val: boolean) => void;
  isTrialActive?: boolean;
  onActivateTrial?: () => void;
}

export const PracticeDiary: React.FC<PracticeDiaryProps> = ({
  appointments,
  patients,
  onStartConsultation,
  onBookAppointment,
  onRequestLocum,
  onOpenPatientFile,
  onOpenTelehealth,
  onOpenSwitch,
  onOpenBillingOverview,
  isVoiceActiveGlobal = false,
  setIsVoiceActiveGlobal,
  isTrialActive = false,
  onActivateTrial,
}) => {
  // Navigation & Filter states matching the screenshot layout
  const [activeNavFilter, setActiveNavFilter] = useState<'today' | 'week' | 'all' | 'waiting' | 'triage' | 'completed'>('today');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Modal and drawer states
  const [showNewAptModal, setShowNewAptModal] = useState(false);
  const [showLocumModal, setShowLocumModal] = useState(false);
  const [showRebookModal, setShowRebookModal] = useState(false);
  const [showSwitchTrialModal, setShowSwitchTrialModal] = useState(false);
  const [selectedAptDetails, setSelectedAptDetails] = useState<Appointment | null>(null);

  // Switch hover state (Masked switch requirement)
  const [isSwitchHovered, setIsSwitchHovered] = useState(false);

  // WhatsApp feedback banner
  const [whatsAppFeedback, setWhatsAppFeedback] = useState<string | null>(null);

  // Form states for new appointment
  const [newPatientId, setNewPatientId] = useState(patients[0]?.id || '');
  const [newTime, setNewTime] = useState('11:00');
  const [newType, setNewType] = useState<Appointment['type']>('General Consultation');
  const [newTriage, setNewTriage] = useState<Appointment['triageLevel']>('Routine');
  const [newNotes, setNewNotes] = useState('');

  // AI & Voice Assistant states
  const [isAiPrioritizing, setIsAiPrioritizing] = useState(false);
  const [aiPrioritizedOrder, setAiPrioritizedOrder] = useState<string[]>([]);
  const [aiAlertMessage, setAiAlertMessage] = useState<string | null>(
    'AI Triage Active: Lerato Mokoena prioritized (Acute nocturnal dyspnoea refractory to beta-2 agonists - SATS Priority Red Flag)'
  );
  const [voiceToast, setVoiceToast] = useState<{ text: string; action: string } | null>(null);
  const [isListening, setIsListening] = useState(isVoiceActiveGlobal);

  // Sync global voice state
  useEffect(() => {
    setIsListening(isVoiceActiveGlobal);
  }, [isVoiceActiveGlobal]);

  // Voice Recognition Engine
  useEffect(() => {
    let recognition: any = null;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isListening && SpeechRecognition) {
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-ZA';

        recognition.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
          handleVoiceCommand(transcript);
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition notice:', err);
        };

        recognition.start();
      } catch (e) {
        console.warn('Voice recognition initialization notice:', e);
      }
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (_) {}
      }
    };
  }, [isListening, appointments]);

  const handleVoiceCommand = (cmd: string) => {
    // Sound feedback simulation
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 587.33; // D5 note
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (_) {}

    if (cmd.includes('waiting') || cmd.includes('room')) {
      setActiveNavFilter('waiting');
      setFilterStatus('Arrived');
      setVoiceToast({ text: `Heard: "${cmd}"`, action: 'Filtered queue to Waiting Room (Arrived)' });
    } else if (cmd.includes('urgent') || cmd.includes('triage') || cmd.includes('priority')) {
      setActiveNavFilter('triage');
      setFilterStatus('ALL');
      setVoiceToast({ text: `Heard: "${cmd}"`, action: 'Filtered queue to Urgent & Priority cases' });
    } else if (cmd.includes('start consult') || cmd.includes('next patient') || cmd.includes('consult')) {
      // Find highest priority waiting patient
      const nextPat = appointments.find((a) => a.triageLevel === 'Urgent') || appointments.find((a) => a.status === 'Arrived') || appointments[0];
      if (nextPat) {
        setVoiceToast({ text: `Heard: "${cmd}"`, action: `Starting consultation for ${nextPat.patientName}` });
        setTimeout(() => onStartConsultation(nextPat), 1000);
      }
    } else if (cmd.includes('book') || cmd.includes('new appointment')) {
      setShowNewAptModal(true);
      setVoiceToast({ text: `Heard: "${cmd}"`, action: 'Opening Appointment Booking' });
    } else if (cmd.includes('locum')) {
      setShowLocumModal(true);
      setVoiceToast({ text: `Heard: "${cmd}"`, action: 'Opening Locum Doctor Request' });
    } else if (cmd.includes('all') || cmd.includes('clear') || cmd.includes('today')) {
      setActiveNavFilter('today');
      setFilterStatus('ALL');
      setVoiceToast({ text: `Heard: "${cmd}"`, action: 'Reset filters to All Patients' });
    } else if (cmd.includes('telemedicine') || cmd.includes('video')) {
      if (onOpenTelehealth) onOpenTelehealth();
      setVoiceToast({ text: `Heard: "${cmd}"`, action: 'Opening Telemedicine Suite' });
    } else if (cmd.includes('billing') || cmd.includes('claims') || cmd.includes('switch')) {
      if (onOpenSwitch) onOpenSwitch();
      setVoiceToast({ text: `Heard: "${cmd}"`, action: 'Opening Medical Aid Switch' });
    } else {
      setVoiceToast({ text: `Heard: "${cmd}"`, action: 'Voice Command: try "Waiting room", "Urgent", "Book", or "Start consult"' });
    }

    setTimeout(() => setVoiceToast(null), 5000);
  };

  // WhatsApp sender
  const handleSendWhatsApp = async (apt: Appointment) => {
    try {
      const res = await MmediCompannionApi.sendWhatsAppMessage({
        recipientPhone: apt.patientPhone,
        patientName: apt.patientName,
        templateType: 'APPOINTMENT_CONFIRMATION',
        details: { date: apt.date, time: apt.time },
      });

      if (res.success) {
        setWhatsAppFeedback(`WhatsApp reminder sent to ${apt.patientName} (${apt.patientPhone})`);
        setTimeout(() => setWhatsAppFeedback(null), 4000);
        if (res.data?.waWebDeepLink) {
          window.open(res.data.waWebDeepLink, '_blank');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create new appointment
  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === newPatientId);
    if (!patient) return;

    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      medicalAidName: patient.medicalAidName,
      date: selectedDate,
      time: newTime,
      durationMinutes: 30,
      type: newType,
      status: 'Confirmed',
      triageLevel: newTriage,
      notes: newNotes || 'Routine consultation booking',
      whatsappReminderSent: false,
    };

    onBookAppointment(newApt);
    setShowNewAptModal(false);
    setNewNotes('');
  };

  // Calculate high-level counts
  const todayApts = appointments.filter((a) => a.date === selectedDate);
  const totalBookingsCount = todayApts.length || 5;
  const waitingRoomCount = todayApts.filter((a) => a.status === 'Arrived' || a.status === 'In Consultation').length || 2;
  const urgentCount = todayApts.filter((a) => a.triageLevel === 'Urgent' || a.triageLevel === 'Emergency').length || 1;
  const locumCoveredCount = todayApts.filter((a) => a.isLocumCovered).length || 1;

  // Filter queue based on navigation and status pills
  const filteredAppointments = todayApts.filter((apt) => {
    // Left navigation filter
    if (activeNavFilter === 'waiting' && apt.status !== 'Arrived' && apt.status !== 'In Consultation') {
      return false;
    }
    if (activeNavFilter === 'triage' && apt.triageLevel !== 'Urgent' && apt.triageLevel !== 'Emergency') {
      return false;
    }
    if (activeNavFilter === 'completed' && apt.status !== 'Completed') {
      return false;
    }

    // Status pill filter
    if (filterStatus === 'Confirmed' && apt.status !== 'Confirmed') return false;
    if (filterStatus === 'Arrived' && apt.status !== 'Arrived') return false;
    if (filterStatus === 'In Consultation' && apt.status !== 'In Consultation') return false;
    if (filterStatus === 'Completed' && apt.status !== 'Completed') return false;

    return true;
  });

  // Sort queue by AI priority if triggered
  const displayAppointments = [...filteredAppointments].sort((a, b) => {
    if (aiPrioritizedOrder.length > 0) {
      const idxA = aiPrioritizedOrder.indexOf(a.id);
      const idxB = aiPrioritizedOrder.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
    }
    // Default: Urgent cases first, then time
    const triageWeight: Record<string, number> = { Emergency: 4, Urgent: 3, Moderate: 2, Routine: 1 };
    const diff = (triageWeight[b.triageLevel] || 1) - (triageWeight[a.triageLevel] || 1);
    if (diff !== 0 && activeNavFilter === 'triage') return diff;
    return a.time.localeCompare(b.time);
  });

  // Actionable KPI Card Clicks (as requested in prompt!)
  const handleMetricCardClick = (cardType: 'all' | 'waiting' | 'urgent' | 'locum') => {
    if (cardType === 'all') {
      setActiveNavFilter('today');
      setFilterStatus('ALL');
    } else if (cardType === 'waiting') {
      setActiveNavFilter('waiting');
      setFilterStatus('Arrived');
    } else if (cardType === 'urgent') {
      setActiveNavFilter('triage');
      setFilterStatus('ALL');
    } else if (cardType === 'locum') {
      setActiveNavFilter('today');
      setFilterStatus('ALL');
    }
  };

  // AI Re-analysis trigger
  const runAITriageOptimization = () => {
    setIsAiPrioritizing(true);
    setTimeout(() => {
      // Prioritize Lerato Mokoena (apt-102) first due to acute wheezing/asthma
      const reordered = [
        'apt-102',
        ...appointments.filter((a) => a.id !== 'apt-102').map((a) => a.id),
      ];
      setAiPrioritizedOrder(reordered);
      setAiAlertMessage('AI Risk Stratification Complete: Lerato Mokoena prioritized to top of queue (SATS Orange/Red criteria).');
      setIsAiPrioritizing(false);
    }, 1200);
  };

  // Triage border color coding (cyan = normal, amber = priority, red = urgent, purple = locum)
  const getCardBorderColor = (apt: Appointment) => {
    if (apt.isLocumCovered) return 'border-l-purple-500 hover:border-l-purple-400';
    if (apt.triageLevel === 'Emergency' || apt.triageLevel === 'Urgent') return 'border-l-rose-500 hover:border-l-rose-400';
    if (apt.triageLevel === 'Moderate') return 'border-l-amber-500 hover:border-l-amber-400';
    return 'border-l-cyan-500 hover:border-l-cyan-400';
  };

  const getTriageBadge = (level: Appointment['triageLevel']) => {
    switch (level) {
      case 'Emergency':
      case 'Urgent':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-rose-600 text-white shadow-xs">
            Urgent
          </span>
        );
      case 'Moderate':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Moderate
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Routine
          </span>
        );
    }
  };

  const getStatusPill = (status: Appointment['status']) => {
    switch (status) {
      case 'In Consultation':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Consulting
          </span>
        );
      case 'Arrived':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Arrived
          </span>
        );
      case 'Confirmed':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Confirmed
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400">
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Voice Toast Notification Banner */}
      {voiceToast && (
        <div className="bg-slate-900 border border-cyan-500/60 shadow-xl rounded-2xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Mic className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block">{voiceToast.text}</span>
              <span className="text-xs font-bold text-white">{voiceToast.action}</span>
            </div>
          </div>
          <button onClick={() => setVoiceToast(null)} className="text-xs text-slate-500 hover:text-white px-2">
            Dismiss
          </button>
        </div>
      )}

      {/* WhatsApp Feedback Banner */}
      {whatsAppFeedback && (
        <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-2xl text-xs flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Send className="w-4 h-4 text-emerald-400" />
            <span className="font-medium">{whatsAppFeedback}</span>
          </div>
          <span className="text-[11px] text-emerald-300 font-mono">WhatsApp Web Gateway Active</span>
        </div>
      )}

      {/* Main 3-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================================= */}
        {/* COLUMN 1: Persistent Left Navigation (Today, Waiting Room, Triage, Filters) */}
        {/* ========================================================================= */}
        <aside className="lg:col-span-3 space-y-4">
          {/* Section: Practice Diary */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
            <div className="flex items-center space-x-2 text-xs font-bold text-white px-2 pb-3 border-b border-slate-800/80">
              <CalendarIcon className="w-4 h-4 text-cyan-400" />
              <span>Practice Diary</span>
            </div>

            <div className="mt-3 space-y-1 text-xs">
              <button
                onClick={() => {
                  setActiveNavFilter('today');
                  setFilterStatus('ALL');
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl font-semibold transition ${
                  activeNavFilter === 'today'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Today</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeNavFilter === 'today' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  5
                </span>
              </button>

              <button
                onClick={() => setActiveNavFilter('week')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl font-medium transition ${
                  activeNavFilter === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span>This Week</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-400 font-semibold">
                  12
                </span>
              </button>

              <button
                onClick={() => setActiveNavFilter('all')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl font-medium transition ${
                  activeNavFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>All Appointments</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-400 font-semibold">
                  42
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveNavFilter('waiting');
                  setFilterStatus('Arrived');
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl font-medium transition ${
                  activeNavFilter === 'waiting'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Waiting Room</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  2
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveNavFilter('triage');
                  setFilterStatus('ALL');
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl font-medium transition ${
                  activeNavFilter === 'triage'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Triage</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800">
                  1
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveNavFilter('completed');
                  setFilterStatus('Completed');
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl font-medium transition ${
                  activeNavFilter === 'completed'
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Completed</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-400 font-semibold">
                  18
                </span>
              </button>
            </div>
          </div>

          {/* Section: Quick Filters */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
            <div className="flex items-center space-x-2 text-xs font-bold text-white px-2 pb-3 border-b border-slate-800/80">
              <Filter className="w-4 h-4 text-teal-400" />
              <span>Quick Filters</span>
            </div>

            <div className="mt-3 space-y-1 text-xs">
              {[
                { label: 'All Patients', id: 'ALL', count: 5 },
                { label: 'Confirmed', id: 'Confirmed', count: 3 },
                { label: 'Arrived', id: 'Arrived', count: 1 },
                { label: 'In Consultation', id: 'In Consultation', count: 0 },
                { label: 'Completed', id: 'Completed', count: 1 },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${
                    filterStatus === f.id
                      ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${filterStatus === f.id ? 'text-white' : 'text-slate-600'}`} />
                    <span>{f.label}</span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.2 rounded-md ${
                    filterStatus === f.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Command Helper / Interactive Simulator */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950/40 border border-slate-700/80 rounded-3xl p-4 shadow-lg text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-white">
                <Mic className="w-4 h-4 text-cyan-400" />
                <span>Voice Commands</span>
              </div>
              <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Speak or test instant voice actions:
            </p>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={() => handleVoiceCommand('show waiting room')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 p-1.5 rounded-lg text-[10px] text-left transition"
              >
                🎙️ "Waiting Room"
              </button>
              <button
                onClick={() => handleVoiceCommand('show urgent triage')}
                className="bg-slate-800 hover:bg-slate-700 text-amber-200 border border-slate-700 p-1.5 rounded-lg text-[10px] text-left transition"
              >
                🎙️ "Show Urgent"
              </button>
              <button
                onClick={() => handleVoiceCommand('start consult next patient')}
                className="bg-slate-800 hover:bg-slate-700 text-cyan-200 border border-slate-700 p-1.5 rounded-lg text-[10px] text-left transition"
              >
                🎙️ "Start Consult"
              </button>
              <button
                onClick={() => handleVoiceCommand('book new appointment')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 p-1.5 rounded-lg text-[10px] text-left transition"
              >
                🎙️ "Book Slot"
              </button>
            </div>
          </div>

          {/* Bottom Card: Need to rebook? */}
          <div
            onClick={() => setShowRebookModal(true)}
            className="bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-3xl p-4 cursor-pointer transition shadow-md group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-xs text-white flex items-center justify-between">
                  <span>Need to rebook?</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Manage missed and follow-up appointments from here.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* COLUMN 2: Center Queue & Interactive Command Center (Headers, Cards, CTAs)*/}
        {/* ========================================================================= */}
        <section className="lg:col-span-6 space-y-4">
          {/* Header Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shadow-inner">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                    Practice Diary & Triage Desk
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Rosebank Medical Centre • Rooms 28 • Daily Appointment Ledger & Waiting Room Queue
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-2.5 flex-wrap">
                <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300">
                  <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Thu, 29 Apr 2026</span>
                </div>

                <button
                  onClick={() => setShowNewAptModal(true)}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 transition shadow-md shadow-cyan-950"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book Appointment</span>
                </button>

                <button
                  onClick={() => onRequestLocum(selectedDate, '14:00 - 18:00')}
                  className="bg-purple-900/70 hover:bg-purple-800 text-purple-200 border border-purple-700/60 font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 transition"
                >
                  <UserPlus className="w-3.5 h-3.5 text-purple-300" />
                  <span>Request Locum Doctor</span>
                </button>
              </div>
            </div>

            {/* AI Triage Banner */}
            {aiAlertMessage && (
              <div className="mt-4 p-3 bg-gradient-to-r from-amber-950/50 via-slate-800/80 to-slate-900 border border-amber-800/60 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2.5 text-amber-200">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                  <span className="font-medium text-[11px] leading-tight">{aiAlertMessage}</span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={runAITriageOptimization}
                    disabled={isAiPrioritizing}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-[10px] transition disabled:opacity-50"
                  >
                    {isAiPrioritizing ? 'Analyzing...' : 'AI Prioritize Queue'}
                  </button>
                </div>
              </div>
            )}

            {/* 4 Actionable Metric Cards (Clicking them immediately filters the queue!) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800">
              {/* Metric 1: Total Bookings */}
              <button
                onClick={() => handleMetricCardClick('all')}
                className={`text-left p-3.5 rounded-2xl border transition group ${
                  activeNavFilter === 'today' && filterStatus === 'ALL'
                    ? 'bg-cyan-950/40 border-cyan-700/70 ring-1 ring-cyan-500/50'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Total Bookings Today</span>
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-2xl font-extrabold text-white tracking-tight">{totalBookingsCount}</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
                  <span>↑ 2 vs yesterday</span>
                </div>
              </button>

              {/* Metric 2: In Waiting Room */}
              <button
                onClick={() => handleMetricCardClick('waiting')}
                className={`text-left p-3.5 rounded-2xl border transition group ${
                  activeNavFilter === 'waiting'
                    ? 'bg-cyan-950/60 border-cyan-500 ring-1 ring-cyan-500'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-cyan-300 mb-1">
                  <span>In Waiting Room</span>
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-2xl font-extrabold text-cyan-200 tracking-tight">{waitingRoomCount}</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
                  <span>↓ 1 vs yesterday</span>
                </div>
              </button>

              {/* Metric 3: Urgent / Priority Triage */}
              <button
                onClick={() => handleMetricCardClick('urgent')}
                className={`text-left p-3.5 rounded-2xl border transition group ${
                  activeNavFilter === 'triage'
                    ? 'bg-amber-950/60 border-amber-500 ring-1 ring-amber-500'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-amber-300 mb-1">
                  <span>Urgent / Priority Triage</span>
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-2xl font-extrabold text-amber-200 tracking-tight">{urgentCount}</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                  <span>↔ 0 vs yesterday</span>
                </div>
              </button>

              {/* Metric 4: Locum Covered Slots */}
              <button
                onClick={() => handleMetricCardClick('locum')}
                className="text-left p-3.5 rounded-2xl border bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 transition group"
              >
                <div className="flex items-center justify-between text-[11px] text-purple-300 mb-1">
                  <span>Locum Covered Slots</span>
                  <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="text-2xl font-extrabold text-purple-200 tracking-tight">{locumCoveredCount}</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
                  <span>● Safety cover active</span>
                </div>
              </button>
            </div>
          </div>

          {/* Filter Status Strip */}
          <div className="flex items-center justify-between flex-wrap gap-2 px-1">
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-400 font-medium">Filter Status:</span>
              {['ALL', 'Confirmed', 'Arrived', 'In Consultation', 'Completed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                    filterStatus === st
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {st === 'ALL' ? 'All Patients' : st}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400">
              Showing <strong className="text-white font-bold">{displayAppointments.length}</strong> appointments
            </div>
          </div>

          {/* Interactive Appointment Rows (Triage-first color system, dominant CTA, strong hierarchy) */}
          <div className="space-y-3">
            {displayAppointments.map((apt) => {
              const patientObj = patients.find((p) => p.id === apt.patientId);

              return (
                <div
                  key={apt.id}
                  className={`bg-slate-900 border border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-lg hover:shadow-2xl border-l-4 ${getCardBorderColor(
                    apt
                  )} transition-all duration-150 flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
                >
                  {/* Left block: Time & Duration */}
                  <div className="flex items-center space-x-4 shrink-0">
                    <div className="text-center w-20 py-1 bg-slate-800/60 rounded-2xl border border-slate-700/50">
                      <span className="block text-lg font-black text-white font-mono tracking-tight">
                        {apt.time}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-medium">
                        {apt.durationMinutes} min
                      </span>
                    </div>

                    {/* Patient Core Info */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <User className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-base font-extrabold text-white tracking-tight hover:text-cyan-300 cursor-pointer transition">
                          {apt.patientName}
                        </span>

                        {/* Triage Badge */}
                        {getTriageBadge(apt.triageLevel)}

                        {/* Status Pill */}
                        {getStatusPill(apt.status)}
                      </div>

                      {/* Subtitle / Metadata row */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="text-slate-300 font-medium">{apt.type}</span>
                        <span>•</span>
                        <span className="inline-flex items-center space-x-1 text-cyan-300">
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{apt.medicalAidName}</span>
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center space-x-1 text-slate-400 font-mono">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{apt.patientPhone}</span>
                        </span>
                      </div>

                      {/* Clinical Note in Quotes */}
                      <p className="text-xs text-slate-300 italic pt-1 leading-relaxed">
                        "{apt.notes}"
                      </p>

                      {/* Locum Badge if Covered */}
                      {apt.isLocumCovered && (
                        <div className="text-[11px] text-purple-300 flex items-center space-x-1 pt-0.5">
                          <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                          <span>Covered by Locum: {apt.locumDoctorName || 'Dr. Kgomotso Dlamini (Locum GP)'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex items-center space-x-2.5 w-full md:w-auto justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                    {/* WhatsApp Button */}
                    <button
                      onClick={() => handleSendWhatsApp(apt)}
                      className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
                      title="Send WhatsApp confirmation / reminder"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp</span>
                    </button>

                    {/* Telehealth Video Ready Button (when applicable) */}
                    {apt.type === 'Telehealth' && (
                      <button
                        onClick={() => {
                          if (onOpenTelehealth) onOpenTelehealth();
                        }}
                        className="bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
                      >
                        <Video className="w-3.5 h-3.5 text-purple-300" />
                        <span>Video Ready</span>
                      </button>
                    )}

                    {/* Dominant CTA: Start Consult */}
                    <button
                      onClick={() => onStartConsultation(apt)}
                      className="bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-500 hover:from-cyan-500 hover:to-teal-400 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition shadow-lg shadow-cyan-950"
                    >
                      <span>Start Consult</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Chevron for Details Drawer */}
                    <button
                      onClick={() => setSelectedAptDetails(apt)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition"
                      title="View Full Appointment Record"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* COLUMN 3: Right Contextual Sidebar (Actions, Overview, Billing, Status)   */}
        {/* ========================================================================= */}
        <aside className="lg:col-span-3 space-y-4">
          {/* Section: Quick Actions */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
            <div className="flex items-center space-x-2 text-xs font-bold text-white px-1 pb-3 border-b border-slate-800">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Quick Actions</span>
            </div>

            <div className="mt-3 space-y-2">
              <button
                onClick={() => setShowNewAptModal(true)}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold p-3 rounded-2xl text-xs flex items-center justify-between transition shadow-md shadow-cyan-950"
              >
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Book Appointment</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-75" />
              </button>

              <button
                onClick={() => {
                  if (onOpenPatientFile && patients[0]) onOpenPatientFile(patients[0]);
                }}
                className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold p-3 rounded-2xl text-xs flex items-center justify-between transition"
              >
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>View Patient Files</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onRequestLocum(selectedDate, '14:00 - 18:00')}
                className="w-full bg-purple-900/70 hover:bg-purple-800 text-purple-200 border border-purple-700/60 font-semibold p-3 rounded-2xl text-xs flex items-center justify-between transition"
              >
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-purple-300" />
                  <span>Request Locum Doctor</span>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-300" />
              </button>

              <button
                onClick={() => {
                  if (onOpenTelehealth) onOpenTelehealth();
                }}
                className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold p-3 rounded-2xl text-xs flex items-center justify-between transition"
              >
                <div className="flex items-center space-x-2">
                  <Video className="w-4 h-4 text-teal-400" />
                  <span>Start Telemedicine</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Section: Today's Overview (Queue breakdown with vertical color bars) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
            <div className="flex items-center space-x-2 text-xs font-bold text-white px-1 pb-3 border-b border-slate-800">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Today's Overview</span>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-6 rounded-full bg-cyan-400"></span>
                  <span className="text-slate-300">Total Appointments</span>
                </div>
                <span className="font-extrabold text-white text-base">5</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-6 rounded-full bg-emerald-400"></span>
                  <span className="text-slate-300">In Waiting Room</span>
                </div>
                <span className="font-extrabold text-emerald-300 text-base">2</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-6 rounded-full bg-amber-400"></span>
                  <span className="text-slate-300">Urgent / Priority</span>
                </div>
                <span className="font-extrabold text-amber-300 text-base">1</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-6 rounded-full bg-purple-400"></span>
                  <span className="text-slate-300">Locum Covered</span>
                </div>
                <span className="font-extrabold text-purple-300 text-base">1</span>
              </div>
            </div>
          </div>

          {/* Section: Billing Overview (Requested by user) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
            <div className="flex items-center justify-between px-1 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Billing & Switch Overview</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">ZAR</span>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80">
                <span className="text-[11px] text-slate-400 block">Today's Claims Billed</span>
                <span className="text-xl font-extrabold text-white font-mono block mt-0.5">R3,420.00</span>
                <span className="text-[10px] text-emerald-400 font-medium">3 claims submitted to switch</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-800/60 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 block text-[10px]">Accepted (Paid)</span>
                  <span className="text-emerald-400 font-bold font-mono">R2,570.00</span>
                </div>
                <div className="p-2 bg-slate-800/60 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 block text-[10px]">Co-pay / Pending</span>
                  <span className="text-amber-400 font-bold font-mono">R850.00</span>
                </div>
              </div>

              {/* Free Trial / Open-Source Switch Status Banner */}
              <div className="p-2.5 bg-cyan-950/40 rounded-xl border border-cyan-800/60 text-[11px] space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-cyan-200">
                  <span>Switch Mode:</span>
                  <span className="text-emerald-400">
                    {isTrialActive ? 'Production Trial' : 'Open-Source Sandbox'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {isTrialActive
                    ? 'Active 30-Day live claim dispatch trial.'
                    : 'Running Open-Source API Sandbox for testing.'}
                </p>
                {!isTrialActive && (
                  <button
                    onClick={() => setShowSwitchTrialModal(true)}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-1.5 rounded-lg text-[10px] font-bold transition shadow-sm"
                  >
                    Start 30-Day Free Switch Trial
                  </button>
                )}
              </div>

              {/* View Full Analytics & Claims Button */}
              {onOpenBillingOverview && (
                <button
                  onClick={onOpenBillingOverview}
                  className="w-full py-2.5 px-3 bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 hover:border-emerald-500/50 rounded-xl text-xs font-bold text-emerald-300 flex items-center justify-between transition shadow-sm"
                >
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <span>View Full Analytics & Charts</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Section: Dedicated System Status Panel */}
          {/* Masked switch provider: "Dont state what switch it is unless hovered on" */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
            <div className="flex items-center space-x-2 text-xs font-bold text-white px-1 pb-3 border-b border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>System Status</span>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              {/* Medical Aid Switch status item (Masked until hovered) */}
              <div
                onMouseEnter={() => setIsSwitchHovered(true)}
                onMouseLeave={() => setIsSwitchHovered(false)}
                className="p-3 bg-slate-800/70 hover:bg-slate-800 rounded-2xl border border-slate-700/80 transition relative cursor-pointer"
                onClick={() => setShowSwitchTrialModal(true)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-semibold text-slate-200">Medical Aid Switch</span>
                  </div>
                  <span className="text-emerald-400 font-bold font-mono text-[11px] flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> 18ms
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {isTrialActive ? 'Connected (Production Trial Active)' : 'Connected (Open-Source Sandbox API)'}
                </div>

                {/* Hover reveal */}
                {isSwitchHovered && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 p-3 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 text-[11px] space-y-1 pointer-events-none">
                    <div className="text-cyan-300 font-bold">Healthbridge EDI Gateway v4.8</div>
                    <div className="text-slate-400 text-[10px]">
                      Bridge API: Open-Source Emulated Sandbox. Direct electronic clearinghouse for Discovery Health, GEMS, Bonitas, Medscheme.
                    </div>
                  </div>
                )}
              </div>

              {/* Compliance & Security Pills */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center space-x-1.5 p-2 bg-slate-800/60 rounded-xl border border-slate-700/50 text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>HIPAA & POPIA</span>
                </div>
                <div className="flex items-center space-x-1.5 p-2 bg-slate-800/60 rounded-xl border border-slate-700/50 text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>256-bit encryption</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ========================================================================= */}
      {/* MODALS & DRAWERS                                                          */}
      {/* ========================================================================= */}

      {/* Book Appointment Modal */}
      {showNewAptModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl text-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-cyan-400" />
                <span>Book Practice Appointment</span>
              </h3>
              <button
                onClick={() => setShowNewAptModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Patient File</label>
                <select
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.medicalAidName} - {p.idNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Time Slot</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Triage Priority</label>
                  <select
                    value={newTriage}
                    onChange={(e) => setNewTriage(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Urgent">Urgent Triage</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Consultation Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="General Consultation">General Consultation</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Telehealth">Telehealth Virtual Consultation</option>
                  <option value="Chronic Review">Chronic Review (PMB)</option>
                  <option value="Procedure">Procedure (Minor Surgery / Joint Aspiration)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Clinical Presenting Notes</label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Acute wheezing, blood pressure follow-up..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewAptModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-md shadow-cyan-950"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Switch Free Trial Modal */}
      {showSwitchTrialModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Radio className="w-5 h-5 text-cyan-400" />
                <h3 className="font-extrabold text-white text-base">30-Day Free Medical Aid Switch Trial</h3>
              </div>
              <button
                onClick={() => setShowSwitchTrialModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Switch Engine:</span>
                  <span className="text-cyan-300 font-mono font-bold">Healthbridge EDI Engine v4.8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Mode:</span>
                  <span className="text-amber-400 font-medium">Open-Source Testing Sandbox API</span>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-cyan-950/60 to-slate-850 rounded-2xl border border-cyan-800/60 space-y-2">
                <span className="font-bold text-white block">Upgrade to Live Production Electronic Switch</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Start sending real electronic claims directly to Discovery Health, GEMS, Bonitas, Medscheme, and Momentum with instant real-time adjudication, PMB CDL auto-basket matching, and zero claim transmission fees.
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                  <div>• Practice BHF: <strong className="text-white">0548921</strong></div>
                  <div>• HPCSA: <strong className="text-white">MP 0694821</strong></div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onActivateTrial) onActivateTrial();
                  setShowSwitchTrialModal(false);
                }}
                className="w-full bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-cyan-950 flex items-center justify-center space-x-2 transition"
              >
                <Zap className="w-4 h-4" />
                <span>Activate Free 30-Day Production Switch Trial</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Detail Drawer */}
      {selectedAptDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end p-0">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Appointment Details</h3>
              <button
                onClick={() => setSelectedAptDetails(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700">
                <span className="text-[11px] text-slate-400 block">Patient Name</span>
                <span className="text-base font-extrabold text-white block mt-0.5">{selectedAptDetails.patientName}</span>
                <span className="text-xs text-slate-400 block mt-1">{selectedAptDetails.medicalAidName} • {selectedAptDetails.patientPhone}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block text-[11px]">Time</span>
                  <span className="font-bold text-white font-mono text-sm">{selectedAptDetails.time}</span>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block text-[11px]">Duration</span>
                  <span className="font-bold text-white font-mono text-sm">{selectedAptDetails.durationMinutes} mins</span>
                </div>
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[11px] mb-1">Clinical Presenting Notes</span>
                <p className="text-slate-200 italic leading-relaxed">"{selectedAptDetails.notes}"</p>
              </div>

              <div className="pt-4 flex flex-col space-y-2">
                <button
                  onClick={() => {
                    const apt = selectedAptDetails;
                    setSelectedAptDetails(null);
                    onStartConsultation(apt);
                  }}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl transition shadow-md shadow-cyan-950 flex items-center justify-center space-x-2"
                >
                  <span>Start Consultation Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleSendWhatsApp(selectedAptDetails)}
                  className="w-full bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 py-2.5 rounded-xl font-semibold flex items-center justify-center space-x-2 transition"
                >
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Send WhatsApp Notification</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
