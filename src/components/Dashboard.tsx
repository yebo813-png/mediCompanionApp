import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Stethoscope,
  Users,
  RefreshCw,
  Phone,
  Video,
  ShieldAlert,
  Flame,
  FileText,
  Calendar,
  CreditCard,
  UserCheck,
  ChevronRight,
  TrendingUp,
  Activity,
  HeartPulse,
  Pill,
  ExternalLink,
  Info,
} from 'lucide-react';
import { Appointment, Patient, ClinicalConsultation, MedicalAidClaim, LocumSlotRequest } from '../types';
import { MediompanionApi } from '../services/api';
import { RevenueTrendWidget } from './RevenueTrendWidget';

interface DashboardProps {
  appointments: Appointment[];
  patients: Patient[];
  consultations: ClinicalConsultation[];
  claims: MedicalAidClaim[];
  locumSlots: LocumSlotRequest[];
  onStartConsultation: (apt: Appointment) => void;
  onOpenPatientFile: (patient: Patient) => void;
  onOpenTelehealth: () => void;
  onOpenSwitch: () => void;
  onOpenBillingOverview?: () => void;
  onOpenNewPatientModal: () => void;
  onUpdateAppointmentStatus: (aptId: string, newStatus: Appointment['status']) => void;
}

interface TriagedAppointment {
  appointmentId: string;
  patientName: string;
  urgencyLevel: 'URGENT - IMMEDIATE ATTENTION' | 'HIGH PRIORITY' | 'MODERATE' | 'ROUTINE';
  urgencyScore: number;
  isImmediateAttentionRequired: boolean;
  triageColor: 'red' | 'amber' | 'yellow' | 'green';
  clinicalRationale: string;
  redFlags: string[];
  recommendedImmediateActions: string[];
  suggestedInvestigations?: string[];
  estimatedSafeWaitMinutes: number;
}

interface TriageAnalysisResult {
  analyzedAt: string;
  totalAppointments: number;
  urgentCasesCount: number;
  highPriorityCount: number;
  clinicalAlertSummary: string;
  practiceActionItems: string[];
  triagedAppointments: TriagedAppointment[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  appointments,
  patients,
  consultations,
  claims,
  locumSlots,
  onStartConsultation,
  onOpenPatientFile,
  onOpenTelehealth,
  onOpenSwitch,
  onOpenBillingOverview,
  onOpenNewPatientModal,
  onUpdateAppointmentStatus,
}) => {
  const [triageData, setTriageData] = useState<TriageAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'all' | 'urgent' | 'waiting' | 'telehealth'>('all');
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<TriagedAppointment | null>(null);
  const [acknowledgedApts, setAcknowledgedApts] = useState<Record<string, boolean>>({});

  // Auto-run AI Triage on mount or when appointments change
  useEffect(() => {
    runAITriageAnalysis();
  }, [appointments.length]);

  const runAITriageAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await MediompanionApi.analyzeAppointmentsUrgency({
        appointments,
        patients,
        consultations,
      });

      if (response && response.success && response.data) {
        setTriageData(response.data);
      }
    } catch (error) {
      console.error('Failed to run AI Triage Analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getTriageForApt = (aptId: string): TriagedAppointment | undefined => {
    return triageData?.triagedAppointments?.find((t) => t.appointmentId === aptId);
  };

  const getPatientForApt = (patientId: string): Patient | undefined => {
    return patients.find((p) => p.id === patientId);
  };

  const getConsultationHistoryForApt = (patientId: string): ClinicalConsultation | undefined => {
    return consultations.find((c) => c.patientId === patientId);
  };

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    const triage = getTriageForApt(apt.id);
    if (filterMode === 'urgent') {
      return triage?.isImmediateAttentionRequired || apt.triageLevel === 'Urgent' || apt.triageLevel === 'Emergency';
    }
    if (filterMode === 'waiting') {
      return apt.status === 'Arrived';
    }
    if (filterMode === 'telehealth') {
      return apt.type === 'Telehealth';
    }
    return true;
  });

  // Calculate high-level stats
  const totalWaiting = appointments.filter((a) => a.status === 'Arrived').length;
  const urgentCount = triageData?.urgentCasesCount ?? appointments.filter((a) => a.triageLevel === 'Urgent').length;
  const highPriorityCount = triageData?.highPriorityCount ?? 1;
  const inConsultCount = appointments.filter((a) => a.status === 'In Consultation').length;
  const completedCount = appointments.filter((a) => a.status === 'Completed').length;

  const totalClaimsZAR = claims.reduce((acc, c) => acc + c.totalClaimZAR, 0);
  const totalPaidZAR = claims.reduce((acc, c) => acc + c.paidZAR, 0);

  // Find the top urgent patient in waiting room
  const mostUrgentWaitingApt = appointments.find((apt) => {
    const t = getTriageForApt(apt.id);
    return apt.status === 'Arrived' && t?.isImmediateAttentionRequired;
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome & Mediompanion AI Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        {/* Glow backdrop decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-600/10 via-teal-500/10 to-transparent rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/80 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Mediompanion AI Clinical Assistant
              </span>
              <span className="text-xs text-slate-400">
                South African Triage Scale (SATS) & Clinical Risk Stratifier
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Clinical Command Center
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Real-time AI triage actively synthesizes presenting complaints, recent SOAP notes, chronic PMB history, and vital trends to prioritize urgent clinical interventions.
            </p>
          </div>

          {/* Action buttons & AI Trigger */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={runAITriageAnalysis}
              disabled={isAnalyzing}
              className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-lg shadow-cyan-900/30 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing Clinical Records...' : 'Re-Analyze with Gemini AI'}</span>
            </button>

            <button
              onClick={onOpenNewPatientModal}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl font-semibold text-xs transition"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              <span>New Patient File</span>
            </button>

            <button
              onClick={onOpenTelehealth}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl font-semibold text-xs transition"
            >
              <Video className="w-4 h-4 text-teal-400" />
              <span>Telehealth Suite</span>
            </button>
          </div>
        </div>

        {/* Executive Clinical Alert Summary Banner */}
        {triageData && (
          <div className={`mt-6 p-4 rounded-2xl border transition-all ${
            urgentCount > 0
              ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
              : 'bg-slate-800/60 border-slate-700 text-slate-300'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-xl mt-0.5 ${
                  urgentCount > 0 ? 'bg-rose-900/60 text-rose-300' : 'bg-emerald-900/60 text-emerald-300'
                }`}>
                  {urgentCount > 0 ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : <CheckCircle2 className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm tracking-tight text-white">
                      {urgentCount > 0
                        ? `CRITICAL ATTENTION REQUIRED: ${urgentCount} Patient(s) Prioritized`
                        : 'Routine Flow: All Patients Stable'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-slate-400">
                      Evaluated: {new Date(triageData.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {triageData.clinicalAlertSummary}
                  </p>
                </div>
              </div>

              {mostUrgentWaitingApt && (
                <button
                  onClick={() => onStartConsultation(mostUrgentWaitingApt)}
                  className="inline-flex items-center justify-center space-x-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-rose-950/50 whitespace-nowrap transition"
                >
                  <Flame className="w-4 h-4" />
                  <span>Call {mostUrgentWaitingApt.patientName} into Room 1</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Practice Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Urgent Attention Count */}
        <div
          onClick={() => setFilterMode('urgent')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all ${
            urgentCount > 0
              ? 'bg-rose-950/20 border-rose-800/60 hover:border-rose-600 ring-1 ring-rose-500/20'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Urgent Attention</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              urgentCount > 0 ? 'bg-rose-900/50 text-rose-400' : 'bg-slate-800 text-slate-400'
            }`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-2xl sm:text-3xl font-black ${urgentCount > 0 ? 'text-rose-400' : 'text-white'}`}>
              {urgentCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">Cases flagged</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>+ {highPriorityCount} High priority</span>
            <span className="text-rose-400 font-semibold underline">Filter</span>
          </div>
        </div>

        {/* Waiting Room */}
        <div
          onClick={() => setFilterMode('waiting')}
          className="cursor-pointer bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Waiting Room</span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-400">{totalWaiting}</span>
            <span className="text-xs text-slate-400 font-medium">Patients present</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{inConsultCount} In consultation</span>
            <span className="text-amber-400 font-semibold underline">Filter</span>
          </div>
        </div>

        {/* Scheduled Today */}
        <div
          onClick={() => setFilterMode('all')}
          className="cursor-pointer bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Appointments</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{appointments.length}</span>
            <span className="text-xs text-slate-400 font-medium">Today</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{completedCount} Completed</span>
            <span className="text-cyan-400 font-semibold underline">View all</span>
          </div>
        </div>

        {/* Medical Aid EDI Switch & Billing Analytics Today */}
        <div
          onClick={() => {
            if (onOpenBillingOverview) onOpenBillingOverview();
            else onOpenSwitch();
          }}
          className="cursor-pointer bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-2xl p-4 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-emerald-400 transition">Billing & Switch</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              R {totalClaimsZAR.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="text-emerald-400 font-medium">98.4% Adjudicated</span>
            <span className="text-cyan-400 underline font-semibold">View Analytics →</span>
          </div>
        </div>
      </div>

      {/* Interactive Revenue & Claims Trend Summary Widget (Recharts) */}
      <RevenueTrendWidget
        claims={claims}
        onOpenBillingOverview={onOpenBillingOverview}
      />

      {/* Main Content Area: AI Triaged Appointments Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-cyan-400" />
              <span>Current Appointments & Clinical Risk Triage</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Highlighting cases requiring immediate clinical intervention based on notes, chronic conditions, and previous vitals.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterMode === 'all'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({appointments.length})
            </button>
            <button
              onClick={() => setFilterMode('urgent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                filterMode === 'urgent'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping mr-1" />
              <span>Urgent ({urgentCount})</span>
            </button>
            <button
              onClick={() => setFilterMode('waiting')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterMode === 'waiting'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              In Rooms ({totalWaiting})
            </button>
            <button
              onClick={() => setFilterMode('telehealth')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterMode === 'telehealth'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-teal-400 hover:text-teal-300'
              }`}
            >
              Telehealth
            </button>
          </div>
        </div>

        {/* Appointments List */}
        <div className="mt-6 space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-300">No appointments match current filter</p>
              <p className="text-xs text-slate-500 mt-1">Switch filter back to "All" to view the complete clinic diary.</p>
            </div>
          ) : (
            filteredAppointments.map((apt) => {
              const triage = getTriageForApt(apt.id);
              const pat = getPatientForApt(apt.patientId);
              const pastConsult = getConsultationHistoryForApt(apt.patientId);
              const isUrgent = triage?.isImmediateAttentionRequired || apt.triageLevel === 'Urgent';
              const isAcknowledged = acknowledgedApts[apt.id];

              return (
                <div
                  key={apt.id}
                  className={`rounded-2xl border transition-all duration-150 overflow-hidden ${
                    isUrgent
                      ? 'bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-900 border-rose-700/80 shadow-lg shadow-rose-950/20'
                      : triage?.urgencyLevel === 'HIGH PRIORITY'
                      ? 'bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 border-amber-700/70'
                      : 'bg-slate-850/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="p-5">
                    {/* Header line of card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 text-center">
                          <span className="text-xs font-bold text-slate-300">{apt.time}</span>
                          <span className="text-[10px] text-slate-400 uppercase">{apt.durationMinutes}m</span>
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-white text-base hover:text-cyan-400 transition cursor-pointer"
                                onClick={() => pat && onOpenPatientFile(pat)}>
                              {apt.patientName}
                            </h3>

                            {/* Status badge */}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              apt.status === 'Arrived'
                                ? 'bg-amber-500 text-slate-950 font-black animate-pulse'
                                : apt.status === 'In Consultation'
                                ? 'bg-cyan-500 text-slate-950 font-black'
                                : apt.status === 'Completed'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {apt.status === 'Arrived' ? 'IN WAITING ROOM' : apt.status.toUpperCase()}
                            </span>

                            {/* Type tag */}
                            <span className="text-[10px] font-medium bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                              {apt.type}
                            </span>
                          </div>

                          <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                            <span>ID: {pat?.idNumber || 'SA Patient'}</span>
                            <span>•</span>
                            <span className="text-cyan-400 font-medium">{apt.medicalAidName}</span>
                            {pat?.planName && <span className="text-slate-500">({pat.planName})</span>}
                          </div>
                        </div>
                      </div>

                      {/* Right Urgency Pill & Score */}
                      <div className="flex items-center space-x-3">
                        {triage ? (
                          <div className="text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {triage.urgencyLevel === 'URGENT - IMMEDIATE ATTENTION' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider bg-rose-950 text-rose-200 border border-rose-600 px-2.5 py-1 rounded-lg shadow-sm shadow-rose-900/40">
                                  <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                                  URGENT: IMMEDIATE ATTENTION
                                </span>
                              )}
                              {triage.urgencyLevel === 'HIGH PRIORITY' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-amber-950 text-amber-200 border border-amber-600 px-2.5 py-1 rounded-lg">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                  HIGH PRIORITY
                                </span>
                              )}
                              {triage.urgencyLevel === 'MODERATE' && (
                                <span className="text-[11px] font-semibold uppercase bg-yellow-950 text-yellow-300 border border-yellow-800 px-2.5 py-1 rounded-lg">
                                  Moderate
                                </span>
                              )}
                              {triage.urgencyLevel === 'ROUTINE' && (
                                <span className="text-[11px] font-semibold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded-lg">
                                  Routine / Stable
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              AI Risk Score: <span className="font-bold text-white">{triage.urgencyScore}/100</span>
                              {triage.estimatedSafeWaitMinutes === 0 && (
                                <span className="text-rose-400 font-bold ml-1">• Safe wait: 0 mins</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Triage pending...</span>
                        )}
                      </div>
                    </div>

                    {/* Clinical Notes & Presenting Complaints */}
                    <div className="mt-4 p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
                      <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Presenting Complaint & Booking Notes:</span>
                      </div>
                      <p className="text-slate-200 italic font-sans leading-relaxed">
                        "{apt.notes}"
                      </p>
                    </div>

                    {/* Patient Medical History & Risk Badges */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      {pat?.chronicConditions && pat.chronicConditions.length > 0 && (
                        <div className="flex items-center space-x-1 bg-cyan-950/70 border border-cyan-800 text-cyan-300 px-2 py-0.5 rounded-lg text-[11px]">
                          <Activity className="w-3 h-3 text-cyan-400" />
                          <span>Chronic PMB: {pat.chronicConditions.join(', ')}</span>
                        </div>
                      )}

                      {pat?.allergies && pat.allergies.length > 0 ? (
                        <div className="flex items-center space-x-1 bg-rose-950/70 border border-rose-800 text-rose-300 px-2 py-0.5 rounded-lg text-[11px] font-semibold">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>Allergies: {pat.allergies.join(', ')}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          NKDA (No known drug allergies)
                        </span>
                      )}

                      {pastConsult?.vitals?.bp && (
                        <div className="flex items-center space-x-1 bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-lg text-[11px]">
                          <HeartPulse className="w-3 h-3 text-slate-400" />
                          <span>Last BP: {pastConsult.vitals.bp} mmHg</span>
                        </div>
                      )}
                    </div>

                    {/* AI Clinical Rationale & Red Flags (Highlighted for Urgent & High Priority) */}
                    {triage && (isUrgent || triage.urgencyLevel === 'HIGH PRIORITY') && (
                      <div className="mt-4 p-3.5 rounded-xl bg-slate-900 border border-rose-900/50 space-y-2.5">
                        <div className="flex items-start space-x-2">
                          <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs font-bold text-white">AI Clinical Synthesis & Why This Is Urgent:</span>
                            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                              {triage.clinicalRationale}
                            </p>
                          </div>
                        </div>

                        {/* Red flags */}
                        {triage.redFlags && triage.redFlags.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/80">
                            <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Critical Red Flags:</span>
                            </div>
                            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                              {triage.redFlags.map((rf, idx) => (
                                <li key={idx} className="text-slate-300">{rf}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Recommended immediate actions */}
                        {triage.recommendedImmediateActions && triage.recommendedImmediateActions.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/80">
                            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                              Immediate Physician Recommendations:
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs text-slate-300">
                              {triage.recommendedImmediateActions.map((act, idx) => (
                                <div key={idx} className="flex items-start space-x-1.5 bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/60">
                                  <span className="text-cyan-400 font-bold">•</span>
                                  <span>{act}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Bar for the Doctor */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        {apt.status === 'Arrived' && (
                          <button
                            onClick={() => {
                              onUpdateAppointmentStatus(apt.id, 'In Consultation');
                              onStartConsultation(apt);
                            }}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition ${
                              isUrgent
                                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50 ring-2 ring-rose-500/40'
                                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                            }`}
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>Admit & Start Consultation</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {apt.status !== 'Arrived' && apt.status !== 'Completed' && (
                          <button
                            onClick={() => onStartConsultation(apt)}
                            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                          >
                            <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Open Consultation</span>
                          </button>
                        )}

                        {apt.type === 'Telehealth' && (
                          <button
                            onClick={onOpenTelehealth}
                            className="flex items-center space-x-1.5 bg-teal-900/60 hover:bg-teal-800 text-teal-200 border border-teal-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                          >
                            <Video className="w-3.5 h-3.5 text-teal-400" />
                            <span>Launch Telehealth</span>
                          </button>
                        )}

                        {pat && (
                          <button
                            onClick={() => onOpenPatientFile(pat)}
                            className="flex items-center space-x-1 text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 transition"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>View EHR File</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {isUrgent && (
                          <button
                            onClick={() => {
                              setAcknowledgedApts((prev) => ({ ...prev, [apt.id]: !prev[apt.id] }));
                            }}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                              isAcknowledged
                                ? 'bg-slate-800 text-emerald-400 border-emerald-800'
                                : 'text-slate-400 hover:text-slate-200 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            {isAcknowledged ? '✓ Triage Acknowledged' : 'Acknowledge Urgency'}
                          </button>
                        )}

                        <span className="text-[11px] text-slate-500">
                          Room: Suite 1A (Dr. Ndlovu)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Two Column Section: Clinical Priority Feed & Practice Support */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Clinical Alerts, Follow-ups, and Abnormal Lab Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Clinical Action Items & Doctor Reminders</h3>
              </div>
              <span className="text-xs text-slate-400">Generated by Mediompanion AI</span>
            </div>

            <div className="mt-4 space-y-3">
              {/* Alert 1: Urgent Asthma Triage */}
              <div className="p-3.5 bg-rose-950/20 border border-rose-900/60 rounded-2xl flex items-start space-x-3">
                <div className="p-2 bg-rose-900/50 text-rose-300 rounded-xl mt-0.5">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-300">Urgent Room Admission: Lerato Mokoena</span>
                    <span className="text-[10px] text-rose-400 font-bold bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                      Waiting 18 mins
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1">
                    Arrived with acute nocturnal wheezing refractory to salbutamol. History of Aspirin allergy. Doctor should prepare nebulizer with Salbutamol 5mg + Ipratropium Bromide.
                  </p>
                </div>
              </div>

              {/* Alert 2: Hypertensive Review */}
              <div className="p-3.5 bg-amber-950/20 border border-amber-900/60 rounded-2xl flex items-start space-x-3">
                <div className="p-2 bg-amber-900/50 text-amber-300 rounded-xl mt-0.5">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">BP Urgency Check: Sipho Zulu</span>
                    <span className="text-[10px] text-slate-400">Appointment 08:30</span>
                  </div>
                  <p className="text-slate-300 mt-1">
                    Occipital morning headaches and reported missed doses of Amlodipine. High target organ risk. Repeat bilateral manual blood pressure before adjusting dosage.
                  </p>
                </div>
              </div>

              {/* Alert 3: Abnormal Lab from Lancet */}
              <div className="p-3.5 bg-slate-800/60 border border-slate-700 rounded-2xl flex items-start space-x-3">
                <div className="p-2 bg-cyan-950 text-cyan-400 rounded-xl mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">Lancet Pathology Alert: Johan van der Merwe</span>
                    <span className="text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      HbA1c 8.4%
                    </span>
                  </div>
                  <p className="text-slate-400 mt-1">
                    Quarterly diabetic control elevated above 7.0% target. Consider adding SGLT2 inhibitor (Empagliflozin) or DPP-4 inhibitor under Bonitas chronic PMB basket.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Practice Resources, Locum & Switch Status */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" />
              <span>Practice Operations</span>
            </h3>

            {/* Healthbridge Live Switch Status */}
            <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400">Healthbridge Switch:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 18ms Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Discovery Health, GEMS, Bonitas, Momentum EDI active.
              </p>
            </div>

            {/* Locum Tenens Coverage */}
            <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400">Locum Coverage Today:</span>
                <span className="text-cyan-400 font-semibold">14:00 - 18:00</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Dr. Kgomotso Dlamini (HPCSA MP0719824) covering afternoon procedural clinic.
              </p>
            </div>

            {/* HPCSA CPD Compliance */}
            <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400">HPCSA CPD Compliance:</span>
                <span className="text-emerald-400 font-bold">15 / 30 CEU</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-emerald-500 h-full rounded-full w-1/2" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Ethics module pending (3 CEUs available online).
              </p>
            </div>

            {/* POPIA / HIPAA */}
            <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-300 block">EHR Encryption</span>
                <span className="text-[11px] text-slate-400">AES-256 GCM • POPIA Sec 19</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                AUDITED
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
