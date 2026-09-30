import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { PracticeDiary } from './components/PracticeDiary';
import { PatientList } from './components/PatientList';
import { PatientOnboardingModal } from './components/PatientOnboardingModal';
import { ConsultationSOAP } from './components/ConsultationSOAP';
import { AIDiagnosticAssistant } from './components/AIDiagnosticAssistant';
import { DigitalPenCanvas } from './components/DigitalPenCanvas';
import { PrescriptionManager } from './components/PrescriptionManager';
import { MedicalAidSwitch } from './components/MedicalAidSwitch';
import { ReferralsHub } from './components/ReferralsHub';
import { TelemedicineSuite } from './components/TelemedicineSuite';
import { LocumTenensMarketplace } from './components/LocumTenensMarketplace';
import { DoctorCPDTracker } from './components/DoctorCPDTracker';
import { PatientPortalView } from './components/PatientPortalView';
import { ComplianceAndFHIR } from './components/ComplianceAndFHIR';
import { BillingOverview } from './components/BillingOverview';
import { ModelSwitcherModal } from './components/ModelSwitcherModal';
import { Homepage } from './components/Homepage';
import {
  DoctorVoiceAssistantModal,
  DoctorVoiceOptInSettings,
} from './components/DoctorVoiceAssistantModal';
import { DoctorVoiceFloatingHUD } from './components/DoctorVoiceFloatingHUD';
import { TryTrialModal, TrialSubscription } from './components/TryTrialModal';
import { PracticeStore } from './services/api';
import { AIModelService, AIModelConfig } from './services/aiModelService';
import {
  Patient,
  Appointment,
  ClinicalConsultation,
  MedicalAidClaim,
  SpecialistReferral,
  LocumSlotRequest,
  DoctorCPDCertificate,
  PatientMedicineReminder,
  AuditLog,
  NappiMedication,
} from './types';

export default function App() {
  // Navigation & Mode
  const [activeView, setActiveView] = useState<string>('home');
  const [isClientPortal, setIsClientPortal] = useState<boolean>(false);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [activeAIModel, setActiveAIModel] = useState<AIModelConfig>(AIModelService.getActiveModel());
  const [showModelSwitcher, setShowModelSwitcher] = useState<boolean>(false);

  // 7-Day Credit Card Trial & Subscription State
  const [showTrialModal, setShowTrialModal] = useState<boolean>(false);
  const [trialSubscription, setTrialSubscription] = useState<TrialSubscription>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('doctor_practice_trial_subscription');
        if (saved) {
          const parsed: TrialSubscription = JSON.parse(saved);
          if (parsed.isActive && parsed.endDate) {
            const msDiff = new Date(parsed.endDate).getTime() - Date.now();
            const daysLeft = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
            return {
              ...parsed,
              daysRemaining: daysLeft,
            };
          }
          return parsed;
        }
      } catch (err) {
        console.error('Failed to parse trial subscription from localStorage', err);
      }
    }
    return {
      isActive: false,
      status: 'NOT_STARTED',
      startDate: '',
      endDate: '',
      daysRemaining: 7,
      planId: 'professional',
      planName: 'Professional Practice',
      billingCycle: 'monthly',
      monthlyPriceZar: 2190,
      gateway: 'paystack',
      is3DS2Verified: false,
      isExtended3Days: false,
      cardDetails: null,
      autoRenew: true,
      deactivatedAt: null,
    };
  });

  const isTrialActive = trialSubscription.isActive;

  // Doctor AI Voice Assistant (Gemini 3.8 Live) & Opt-in Reminders State
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [voiceOptInSettings, setVoiceOptInSettings] = useState<DoctorVoiceOptInSettings>({
    isEnabled: true,
    alertAllergies: true,
    alertWaitingDelays: true,
    alertUnsubmittedClaims: true,
    alertIcd10Suggestions: true,
    alertPacing15Min: true,
    alertPendingLabs: true,
    voicePersona: 'Zephyr',
    soundVolume: 0.9,
  });
  const [lastSpokenReminder, setLastSpokenReminder] = useState<string | null>(null);
  const [isVoiceAssistantSpeaking, setIsVoiceAssistantSpeaking] = useState<boolean>(false);

  const triggerVoiceReminder = (text: string) => {
    if (!voiceOptInSettings.isEnabled) return;
    setLastSpokenReminder(text);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.volume = voiceOptInSettings.soundVolume;
      utt.rate = 1.05;
      utt.pitch =
        voiceOptInSettings.voicePersona === 'Fenrir'
          ? 0.85
          : voiceOptInSettings.voicePersona === 'Puck'
          ? 1.15
          : 1.0;
      utt.onstart = () => setIsVoiceAssistantSpeaking(true);
      utt.onend = () => setIsVoiceAssistantSpeaking(false);
      utt.onerror = () => setIsVoiceAssistantSpeaking(false);
      window.speechSynthesis.speak(utt);
    }
  };

  const handleActivateTrial = (sub: TrialSubscription) => {
    setTrialSubscription(sub);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('doctor_practice_trial_subscription', JSON.stringify(sub));
      } catch (e) {
        console.error(e);
      }
    }
    triggerVoiceReminder(
      'Congratulations Dr. Ndlovu. Your 7-day full features practice trial is now active. All production tools are unlocked.'
    );
  };

  const handleDeactivateTrial = () => {
    const updated: TrialSubscription = {
      ...trialSubscription,
      isActive: false,
      status: 'CANCELLED_BEFORE_CHARGE',
      autoRenew: false,
      deactivatedAt: new Date().toISOString(),
    };
    setTrialSubscription(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('doctor_practice_trial_subscription', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    triggerVoiceReminder(
      'Your trial has been deactivated. You will not be charged. Thank you for evaluating the platform.'
    );
  };

  const handleExtendTrial3Days = () => {
    if (!trialSubscription.isActive) return;
    const currentEnd = new Date(trialSubscription.endDate || Date.now());
    const newEnd = new Date(currentEnd.getTime() + 3 * 24 * 60 * 60 * 1000);
    const updated: TrialSubscription = {
      ...trialSubscription,
      endDate: newEnd.toISOString(),
      daysRemaining: trialSubscription.daysRemaining + 3,
      isExtended3Days: true,
    };
    setTrialSubscription(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('doctor_practice_trial_subscription', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    PracticeStore.addAuditLog(
      'TRIAL_EXTENSION_GRANTED',
      `Dr. Ndlovu extended full feature trial by 3 days. New billing date: ${newEnd.toLocaleDateString('en-ZA')}`
    );
    setAuditLogs(PracticeStore.getAuditLogs());
    triggerVoiceReminder(
      `Your practice trial has been extended by 3 days for free. Your new renewal date is ${newEnd.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long' })}.`
    );
  };

  // Core Data
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [consultations, setConsultations] = useState<ClinicalConsultation[]>([]);
  const [claims, setClaims] = useState<MedicalAidClaim[]>([]);
  const [referrals, setReferrals] = useState<SpecialistReferral[]>([]);
  const [locumSlots, setLocumSlots] = useState<LocumSlotRequest[]>([]);
  const [cpdCerts, setCpdCerts] = useState<DoctorCPDCertificate[]>([]);
  const [reminders, setReminders] = useState<PatientMedicineReminder[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Inter-view data pass-through
  const [presetClaimData, setPresetClaimData] = useState<any>(null);
  const [presetRxItems, setPresetRxItems] = useState<NappiMedication[]>([]);
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);

  // Initialize data from local store
  useEffect(() => {
    const loadedPatients = PracticeStore.getPatients();
    setPatients(loadedPatients);
    setSelectedPatient(loadedPatients[0] || null);
    setAppointments(PracticeStore.getAppointments());
    setConsultations(PracticeStore.getConsultations());
    setClaims(PracticeStore.getClaims());
    setReferrals(PracticeStore.getReferrals());
    setLocumSlots(PracticeStore.getLocums());
    setCpdCerts(PracticeStore.getCPD());
    setReminders(PracticeStore.getReminders());
    setAuditLogs(PracticeStore.getAuditLogs());
  }, []);

  // Handlers
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveView('patients');
    if (
      voiceOptInSettings.isEnabled &&
      voiceOptInSettings.alertAllergies &&
      patient.allergies &&
      patient.allergies.length > 0
    ) {
      triggerVoiceReminder(
        `Dr. Ndlovu, safety alert: ${patient.fullName} has a recorded allergy to ${patient.allergies.join(', ')}.`
      );
    }
  };

  const handleStartConsultationFromAppointment = (apt: Appointment) => {
    const matchedPatient = patients.find((p) => p.id === apt.patientId) || patients[0];
    setSelectedPatient(matchedPatient);
    setActiveView('consult');
    if (
      voiceOptInSettings.isEnabled &&
      voiceOptInSettings.alertAllergies &&
      matchedPatient.allergies &&
      matchedPatient.allergies.length > 0
    ) {
      triggerVoiceReminder(
        `Dr. Ndlovu, safety alert: ${matchedPatient.fullName} has a documented allergy to ${matchedPatient.allergies.join(', ')}.`
      );
    }
  };

  const handleStartConsultationForPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveView('consult');
    if (
      voiceOptInSettings.isEnabled &&
      voiceOptInSettings.alertAllergies &&
      patient.allergies &&
      patient.allergies.length > 0
    ) {
      triggerVoiceReminder(
        `Dr. Ndlovu, safety alert: ${patient.fullName} has a documented allergy to ${patient.allergies.join(', ')}.`
      );
    }
  };

  const handleBookAppointment = (apt: Appointment) => {
    const updated = PracticeStore.saveAppointment(apt);
    setAppointments(updated);
  };

  const handleSavePatient = (newPatient: Patient) => {
    const updated = PracticeStore.savePatient(newPatient);
    setPatients(updated);
    setSelectedPatient(newPatient);
  };

  const handleClaimCreated = (newClaim: MedicalAidClaim) => {
    const updated = PracticeStore.saveClaim(newClaim);
    setClaims(updated);
    setAuditLogs(PracticeStore.getAuditLogs());
  };

  const handleOpenSwitchWithClaim = (claimData: any) => {
    setPresetClaimData(claimData);
    setActiveView('switch');
  };

  const handleOpenRxWithItems = (rxItems: NappiMedication[]) => {
    setPresetRxItems(rxItems);
    setActiveView('rx');
  };

  const handleReferralCreated = (newRef: SpecialistReferral) => {
    const updated = PracticeStore.saveReferral(newRef);
    setReferrals(updated);
    setAuditLogs(PracticeStore.getAuditLogs());
  };

  const handleAddLocumSlot = (slot: LocumSlotRequest) => {
    const updated = PracticeStore.saveLocum(slot);
    setLocumSlots(updated);
  };

  const handleConfirmLocum = (slotId: string) => {
    const target = locumSlots.find((l) => l.id === slotId);
    if (!target) return;
    const updated = PracticeStore.saveLocum({ ...target, status: 'CONFIRMED' });
    setLocumSlots(updated);

    // Sync into appointments
    const locumApt: Appointment = {
      id: `apt-locum-${Date.now()}`,
      patientId: 'pat-locum-slot',
      patientName: 'Open Roster [Locum Doctor]',
      patientPhone: target.matchedDoctor?.phone || '+27 82 901 7734',
      medicalAidName: 'Locum Tenens Covered',
      date: target.date,
      time: target.timeSlot.split(' ')[0] || '14:00',
      durationMinutes: target.hours * 60,
      type: 'General Consultation',
      status: 'Confirmed',
      triageLevel: 'Routine',
      notes: `Locum GP coverage by ${target.matchedDoctor?.name} (${target.matchedDoctor?.hpcsaNumber})`,
      whatsappReminderSent: true,
      isLocumCovered: true,
      locumDoctorName: target.matchedDoctor?.name,
    };
    handleBookAppointment(locumApt);
  };

  const handleAddCertificate = (cert: DoctorCPDCertificate) => {
    const updated = PracticeStore.saveCPD(cert);
    setCpdCerts(updated);
    PracticeStore.addAuditLog('CPD_CERTIFICATE_ACCREDITED', `Accredited ${cert.title} (+${cert.ceuPoints} CEUs)`);
    setAuditLogs(PracticeStore.getAuditLogs());
  };

  const handleToggleReminderTaken = (reminderId: string) => {
    const target = reminders.find((r) => r.id === reminderId);
    if (!target) return;
    const updated = PracticeStore.saveReminder({
      ...target,
      takenToday: !target.takenToday,
      streakDays: !target.takenToday ? target.streakDays + 1 : Math.max(0, target.streakDays - 1),
    });
    setReminders(updated);
  };

  const handleRequestRefill = (rem: PatientMedicineReminder) => {
    PracticeStore.addAuditLog('REFILL_REQUEST_INITIATED', `Patient ${selectedPatient?.fullName} requested refill for ${rem.medicineName}`);
    setAuditLogs(PracticeStore.getAuditLogs());
  };

  const handleApplyTranscribedNotes = (text: string, structured: any) => {
    setActiveView('consult');
  };

  const handleRequestLocumFromDiary = (slotDate: string, slotTime: string) => {
    setActiveView('locum');
  };

  // Badge counts
  const waitingCount = appointments.filter(
    (a) => a.date === new Date().toISOString().slice(0, 10) && (a.status === 'Arrived' || a.status === 'In Consultation')
  ).length;

  const openClaimsCount = claims.filter((c) => c.switchStatus === 'QUEUED' || c.switchStatus === 'PARTIALLY_PAID').length;
  const pendingLocumCount = locumSlots.filter((l) => l.status === 'AUTO_MATCHED' || l.status === 'OPEN_SEARCHING').length;
  const urgentCount = appointments.filter((a) => a.triageLevel === 'Urgent' || a.triageLevel === 'Emergency').length || 1;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white transition-colors duration-150">
      {/* Top Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        isClientPortal={isClientPortal}
        setIsClientPortal={setIsClientPortal}
        patients={patients}
        onSelectPatient={handleSelectPatient}
        isVoiceActive={isVoiceActive}
        setIsVoiceActive={setIsVoiceActive}
        isTrialActive={isTrialActive}
        onActivateTrial={() => setShowTrialModal(true)}
        onOpenTrialModal={() => setShowTrialModal(true)}
        trialDaysRemaining={trialSubscription.daysRemaining}
        activeModel={activeAIModel}
        onOpenModelSwitcher={() => setShowModelSwitcher(true)}
        isVoiceOptedIn={voiceOptInSettings.isEnabled}
        onOpenVoiceAssistant={() => setShowVoiceModal(true)}
      />

      {/* Navigation Bar (When in Doctor Suite) */}
      {!isClientPortal && (
        <Navigation
          activeView={activeView}
          setActiveView={setActiveView}
          waitingCount={waitingCount}
          openClaimsCount={openClaimsCount}
          pendingLocumCount={pendingLocumCount}
          urgentCount={urgentCount}
        />
      )}

      {/* 7-Day Live Switch Trial Banner with CPA §14 Notice & Extension (Recommendations 1, 2, 3, 4) */}
      {isTrialActive && !isClientPortal && (
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-cyan-950 border-b border-teal-800/80 px-4 py-2.5 text-xs text-slate-200">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2.5 flex-wrap">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <span className="font-bold text-white">
                7-Day Live Switch & AI Trial:
              </span>
              <span className="text-teal-300 font-mono font-semibold">
                {trialSubscription.daysRemaining} days remaining
              </span>
              <span className="text-slate-400 text-[11px] hidden sm:inline">
                (Renews {new Date(trialSubscription.endDate || Date.now()).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} at R{trialSubscription.monthlyPriceZar.toLocaleString()}/mo)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center space-x-1">
                <span>Paystack 3DS2 Verified</span>
              </span>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {!trialSubscription.isExtended3Days && (
                <button
                  type="button"
                  onClick={handleExtendTrial3Days}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition cursor-pointer"
                  title="Need more time to test with reception? Extend trial by 3 days for free."
                >
                  +3 Days Grace Extension
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowTrialModal(true)}
                className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] transition cursor-pointer"
              >
                Manage / 1-Click Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 w-full ${activeView === 'home' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'}`}>
        {isClientPortal || activeView === 'patient_portal' ? (
          <PatientPortalView
            currentPatient={selectedPatient}
            patients={patients}
            reminders={reminders}
            onToggleTaken={handleToggleReminderTaken}
            onRequestRefill={handleRequestRefill}
            onOpenTelehealth={() => {
              setIsClientPortal(false);
              setActiveView('telehealth');
            }}
          />
        ) : (
          <>
            {activeView === 'home' && (
              <Homepage
                onLaunchSuite={(targetView = 'diary') => setActiveView(targetView)}
                onOpenPatientPortal={() => {
                  setIsClientPortal(true);
                  setActiveView('patient_portal');
                }}
                onOpenTrialModal={() => setShowTrialModal(true)}
                isTrialActive={isTrialActive}
                onOpenVoiceAssistant={() => setShowVoiceModal(true)}
              />
            )}

            {activeView === 'dashboard' && (
              <Dashboard
                appointments={appointments}
                patients={patients}
                consultations={consultations}
                claims={claims}
                locumSlots={locumSlots}
                onStartConsultation={handleStartConsultationFromAppointment}
                onOpenPatientFile={(p) => {
                  setSelectedPatient(p);
                  setActiveView('patients');
                }}
                onOpenTelehealth={() => setActiveView('telehealth')}
                onOpenSwitch={() => setActiveView('switch')}
                onOpenBillingOverview={() => setActiveView('billing')}
                onOpenNewPatientModal={() => setShowOnboardingModal(true)}
                onUpdateAppointmentStatus={(aptId, newStatus) => {
                  const apt = appointments.find((a) => a.id === aptId);
                  if (apt) {
                    handleBookAppointment({ ...apt, status: newStatus });
                  }
                }}
              />
            )}

            {activeView === 'diary' && (
              <PracticeDiary
                appointments={appointments}
                patients={patients}
                onStartConsultation={handleStartConsultationFromAppointment}
                onBookAppointment={handleBookAppointment}
                onRequestLocum={handleRequestLocumFromDiary}
                onOpenPatientFile={(p) => {
                  setSelectedPatient(p);
                  setActiveView('patients');
                }}
                onOpenTelehealth={() => setActiveView('telehealth')}
                onOpenSwitch={() => setActiveView('switch')}
                onOpenBillingOverview={() => setActiveView('billing')}
                isVoiceActiveGlobal={isVoiceActive}
                setIsVoiceActiveGlobal={setIsVoiceActive}
                isTrialActive={isTrialActive}
                onActivateTrial={() => setShowTrialModal(true)}
              />
            )}

            {activeView === 'patients' && (
              <PatientList
                patients={patients}
                onSelectPatient={(p) => setSelectedPatient(p)}
                onOpenOnboarding={() => setShowOnboardingModal(true)}
                onStartConsultationForPatient={handleStartConsultationForPatient}
                onOpenSwitchForPatient={(p) => {
                  setSelectedPatient(p);
                  setActiveView('switch');
                }}
              />
            )}

            {activeView === 'diagnostic' && (
              <AIDiagnosticAssistant
                currentPatient={selectedPatient}
                patients={patients}
                onSelectPatient={(p) => setSelectedPatient(p)}
                onCommitToPatientFile={(diag, plan, meds) => {
                  if (selectedPatient) {
                    const updatedPat = {
                      ...selectedPatient,
                      tags: [...new Set([...selectedPatient.tags, 'AI Diagnosis Confirmed', diag.split(' ')[0]])],
                    };
                    handleSavePatient(updatedPat);
                  }
                  if (meds.length > 0) {
                    setPresetRxItems(meds);
                  }
                }}
                onOpenPrescriptionPad={(meds) => {
                  setPresetRxItems(meds);
                  setActiveView('rx');
                }}
              />
            )}

            {activeView === 'consult' && (
              <ConsultationSOAP
                currentPatient={selectedPatient}
                patients={patients}
                onSelectPatient={(p) => setSelectedPatient(p)}
                onOpenSwitchWithClaim={handleOpenSwitchWithClaim}
                onOpenRxWithItems={handleOpenRxWithItems}
                isVoiceActiveGlobal={isVoiceActive}
              />
            )}

            {activeView === 'pen' && (
              <DigitalPenCanvas
                currentPatient={selectedPatient}
                onApplyTranscribedNotes={handleApplyTranscribedNotes}
              />
            )}

            {activeView === 'rx' && (
              <PrescriptionManager
                currentPatient={selectedPatient}
                initialItems={presetRxItems}
              />
            )}

            {activeView === 'switch' && (
              <MedicalAidSwitch
                claims={claims}
                patients={patients}
                onClaimCreated={handleClaimCreated}
                presetClaimData={presetClaimData}
              />
            )}

            {activeView === 'billing' && (
              <BillingOverview
                claims={claims}
                patients={patients}
                onOpenSwitch={() => setActiveView('switch')}
                onSelectClaim={(claim) => {
                  setPresetClaimData(claim);
                  setActiveView('switch');
                }}
                isTrialActive={isTrialActive}
                onActivateTrial={() => setShowTrialModal(true)}
              />
            )}

            {activeView === 'referrals' && (
              <ReferralsHub
                referrals={referrals}
                patients={patients}
                onReferralCreated={handleReferralCreated}
              />
            )}

            {activeView === 'telehealth' && (
              <TelemedicineSuite
                currentPatient={selectedPatient}
                patients={patients}
                onSelectPatient={(p) => setSelectedPatient(p)}
                onBookVirtualAppointment={handleBookAppointment}
                onOpenConsultationNotes={(p) => {
                  setSelectedPatient(p);
                  setActiveView('consult');
                }}
              />
            )}

            {activeView === 'locum' && (
              <LocumTenensMarketplace
                locumSlots={locumSlots}
                onAddLocumSlot={handleAddLocumSlot}
                onConfirmLocum={handleConfirmLocum}
              />
            )}

            {activeView === 'cpd' && (
              <DoctorCPDTracker
                cpdCertificates={cpdCerts}
                onAddCertificate={handleAddCertificate}
              />
            )}

            {activeView === 'compliance' && (
              <ComplianceAndFHIR
                currentPatient={selectedPatient}
                patients={patients}
                auditLogs={auditLogs}
              />
            )}
          </>
        )}
      </main>

      {/* Patient Onboarding Modal */}
      <PatientOnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onSavePatient={handleSavePatient}
      />

      {/* AI Model Switcher Modal (Free Gemini Tier, Open-Source & Custom Providers) */}
      <ModelSwitcherModal
        isOpen={showModelSwitcher}
        onClose={() => setShowModelSwitcher(false)}
        activeModel={activeAIModel}
        onSelectModel={(m) => {
          setActiveAIModel(m);
        }}
      />

      {/* Doctor AI Voice Assistant Modal (Gemini 3.8 Live & Opt-In Reminders) */}
      <DoctorVoiceAssistantModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        optInSettings={voiceOptInSettings}
        onUpdateSettings={(newSettings) => setVoiceOptInSettings(newSettings)}
        activePatient={selectedPatient}
        patients={patients}
        appointments={appointments}
        onTriggerSpokenReminder={(text) => setLastSpokenReminder(text)}
      />

      {/* Floating Doctor Voice Assistant HUD */}
      <DoctorVoiceFloatingHUD
        optInSettings={voiceOptInSettings}
        onOpenModal={() => setShowVoiceModal(true)}
        lastSpokenReminder={lastSpokenReminder}
        onDismissReminder={() => setLastSpokenReminder(null)}
        isSpeaking={isVoiceAssistantSpeaking}
        onStopSpeaking={() => {
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
          }
          setIsVoiceAssistantSpeaking(false);
        }}
        onQuickReplay={() => {
          if (lastSpokenReminder) {
            triggerVoiceReminder(lastSpokenReminder);
          }
        }}
      />

      {/* 7-Day Full Features Credit Card Trial Modal with All 4 Recommendations */}
      <TryTrialModal
        isOpen={showTrialModal}
        onClose={() => setShowTrialModal(false)}
        trialSubscription={trialSubscription}
        onActivateTrial={handleActivateTrial}
        onDeactivateTrial={handleDeactivateTrial}
        onExtendTrial3Days={handleExtendTrial3Days}
        onLaunchSandbox={() => {
          setActiveView('diary');
          setShowTrialModal(false);
        }}
      />
    </div>
  );
}
