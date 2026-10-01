import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { ModelSwitcherModal } from './components/ModelSwitcherModal';
import { DoctorVoiceAssistantModal } from './components/DoctorVoiceAssistantModal';
import { DoctorVoiceFloatingHUD } from './components/DoctorVoiceFloatingHUD';
import { TrialGateModal } from './components/TrialGateModal';
import { useAuth } from './context/AuthContext';
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

const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const PracticeDiary = lazy(() => import('./components/PracticeDiary').then(m => ({ default: m.PracticeDiary })));
const PatientList = lazy(() => import('./components/PatientList').then(m => ({ default: m.PatientList })));
const ConsultationSOAP = lazy(() => import('./components/ConsultationSOAP').then(m => ({ default: m.ConsultationSOAP })));
const DigitalPenCanvas = lazy(() => import('./components/DigitalPenCanvas').then(m => ({ default: m.DigitalPenCanvas })));
const PrescriptionManager = lazy(() => import('./components/PrescriptionManager').then(m => ({ default: m.PrescriptionManager })));
const MedicalAidSwitch = lazy(() => import('./components/MedicalAidSwitch').then(m => ({ default: m.MedicalAidSwitch })));
const ReferralsHub = lazy(() => import('./components/ReferralsHub').then(m => ({ default: m.ReferralsHub })));
const TelemedicineSuite = lazy(() => import('./components/TelemedicineSuite').then(m => ({ default: m.TelemedicineSuite })));
const LocumTenensMarketplace = lazy(() => import('./components/LocumTenensMarketplace').then(m => ({ default: m.LocumTenensMarketplace })));
const DoctorCPDTracker = lazy(() => import('./components/DoctorCPDTracker').then(m => ({ default: m.DoctorCPDTracker })));
const PatientPortalView = lazy(() => import('./components/PatientPortalView').then(m => ({ default: m.PatientPortalView })));
const ComplianceAndFHIR = lazy(() => import('./components/ComplianceAndFHIR').then(m => ({ default: m.ComplianceAndFHIR })));
const BillingOverview = lazy(() => import('./components/BillingOverview').then(m => ({ default: m.BillingOverview })));
const Homepage = lazy(() => import('./components/Homepage').then(m => ({ default: m.Homepage })));
const AIDiagnosticAssistant = lazy(() => import('./components/AIDiagnosticAssistant').then(m => ({ default: m.AIDiagnosticAssistant })));
const PatientOnboardingModal = lazy(() => import('./components/PatientOnboardingModal').then(m => ({ default: m.PatientOnboardingModal })));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuth();
  
  if (loading || !initialized) {
    return <LoadingFallback />;
  }
  
  if (!user) {
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  }
  
  return <>{children}</>;
}

function TrialGateWrapper({ children }: { children: React.ReactNode }) {
  const { user, getTrialStatus, startTrial } = useAuth();
  const [showTrialGate, setShowTrialGate] = useState(true);
  const [trialChecked, setTrialChecked] = useState(false);

  useEffect(() => {
    const checkTrial = async () => {
      if (user) {
        const status = await getTrialStatus();
        if (status.isOnTrial || status.subscriptionStatus === 'active') {
          setShowTrialGate(false);
        }
        setTrialChecked(true);
      } else {
        setTrialChecked(true);
      }
    };
    checkTrial();
  }, [user, getTrialStatus]);

  const handleTrialStarted = () => {
    setShowTrialGate(false);
  };

  if (!trialChecked) {
    return <LoadingFallback />;
  }

  if (showTrialGate) {
    return (
      <TrialGateModal
        isOpen={true}
        onClose={() => {}}
        onTrialStarted={handleTrialStarted}
      />
    );
  }

  return <>{children}</>;
}

export default function App() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const activeView = location.pathname.slice(1) || 'dashboard';
  const [isClientPortal, setIsClientPortal] = useState<boolean>(false);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [activeAIModel, setActiveAIModel] = useState<AIModelConfig>(AIModelService.getActiveModel());
  const [showModelSwitcher, setShowModelSwitcher] = useState<boolean>(false);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [voiceOptInSettings, setVoiceOptInSettings] = useState({
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
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);

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

  const triggerVoiceReminder = (text: string) => {
    if (!voiceOptInSettings.isEnabled) return;
    setLastSpokenReminder(text);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.volume = voiceOptInSettings.soundVolume;
      utt.rate = 1.05;
      utt.pitch = voiceOptInSettings.voicePersona === 'Fenrir' ? 0.85 : voiceOptInSettings.voicePersona === 'Puck' ? 1.15 : 1.0;
      utt.onstart = () => setIsVoiceAssistantSpeaking(true);
      utt.onend = () => setIsVoiceAssistantSpeaking(false);
      utt.onerror = () => setIsVoiceAssistantSpeaking(false);
      window.speechSynthesis.speak(utt);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    navigate('/patients');
    if (voiceOptInSettings.isEnabled && voiceOptInSettings.alertAllergies && patient.allergies?.length > 0) {
      triggerVoiceReminder(`Dr. Ndlovu, safety alert: ${patient.fullName} has a recorded allergy to ${patient.allergies.join(', ')}.`);
    }
  };

  const handleStartConsultationFromAppointment = (apt: Appointment) => {
    const matchedPatient = patients.find((p) => p.id === apt.patientId) || patients[0];
    setSelectedPatient(matchedPatient);
    navigate('/consult');
    if (voiceOptInSettings.isEnabled && voiceOptInSettings.alertAllergies && matchedPatient.allergies?.length > 0) {
      triggerVoiceReminder(`Dr. Ndlovu, safety alert: ${matchedPatient.fullName} has a documented allergy to ${matchedPatient.allergies.join(', ')}.`);
    }
  };

  const handleStartConsultationForPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    navigate('/consult');
    if (voiceOptInSettings.isEnabled && voiceOptInSettings.alertAllergies && patient.allergies?.length > 0) {
      triggerVoiceReminder(`Dr. Ndlovu, safety alert: ${patient.fullName} has a documented allergy to ${patient.allergies.join(', ')}.`);
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
    navigate('/switch');
  };

  const handleOpenRxWithItems = (rxItems: NappiMedication[]) => {
    setPresetRxItems(rxItems);
    navigate('/rx');
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
    navigate('/consult');
  };

  const handleRequestLocumFromDiary = (slotDate: string, slotTime: string) => {
    navigate('/locum');
  };

  const waitingCount = appointments.filter(
    (a) => a.date === new Date().toISOString().slice(0, 10) && (a.status === 'Arrived' || a.status === 'In Consultation')
  ).length;

  const openClaimsCount = claims.filter((c) => c.switchStatus === 'QUEUED' || c.switchStatus === 'PARTIALLY_PAID').length;
  const pendingLocumCount = locumSlots.filter((l) => l.status === 'AUTO_MATCHED' || l.status === 'OPEN_SEARCHING').length;
  const urgentCount = appointments.filter((a) => a.triageLevel === 'Urgent' || a.triageLevel === 'Emergency').length || 1;

  const goToView = (view: string) => navigate(view === 'home' ? '/home' : `/${view}`);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        <Suspense fallback={<LoadingFallback />}>
          <Homepage
            onLaunchSuite={(view) => navigate(view === 'diary' ? '/dashboard' : `/${view || 'dashboard'}`)}
            onOpenPatientPortal={() => navigate('/patient_portal')}
            onOpenVoiceAssistant={() => navigate('/dashboard')}
          />
        </Suspense>
      } />
      <Route path="/home" element={
        <Suspense fallback={<LoadingFallback />}>
          <Homepage
            onLaunchSuite={(view) => navigate(view === 'diary' ? '/dashboard' : `/${view || 'dashboard'}`)}
            onOpenPatientPortal={() => navigate('/patient_portal')}
            onOpenVoiceAssistant={() => navigate('/dashboard')}
          />
        </Suspense>
      } />

      {/* Auth Routes - Public */}
      <Route path="/login" element={<AuthLayout><SignInPage /></AuthLayout>} />
      <Route path="/signup" element={<AuthLayout><SignUpPage /></AuthLayout>} />
      <Route path="/forgot-password" element={<AuthLayout><ForgotPasswordPage /></AuthLayout>} />
      <Route path="/reset-password" element={<AuthLayout><ResetPasswordPage /></AuthLayout>} />

      {/* Protected Routes - Require Auth + Trial */}
      <Route element={
        <ProtectedRoute>
          <TrialGateWrapper>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
              <Header
                activeView={activeView}
                setActiveView={goToView}
                isClientPortal={isClientPortal}
                setIsClientPortal={setIsClientPortal}
                patients={patients}
                onSelectPatient={handleSelectPatient}
                isVoiceActive={isVoiceActive}
                setIsVoiceActive={setIsVoiceActive}
                isTrialActive={true}
                onActivateTrial={() => {}}
                onOpenTrialModal={() => {}}
                trialDaysRemaining={7}
                activeModel={activeAIModel}
                onOpenModelSwitcher={() => setShowModelSwitcher(true)}
                isVoiceOptedIn={voiceOptInSettings.isEnabled}
                onOpenVoiceAssistant={() => setShowVoiceModal(true)}
              />

              <Navigation
                activeView={activeView}
                setActiveView={goToView}
                waitingCount={waitingCount}
                openClaimsCount={openClaimsCount}
                pendingLocumCount={pendingLocumCount}
                urgentCount={urgentCount}
              />

              <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Suspense fallback={<LoadingFallback />}>
                  <Outlet />
                </Suspense>
              </main>

              <Suspense fallback={null}>
                <PatientOnboardingModal
                  isOpen={showOnboardingModal}
                  onClose={() => setShowOnboardingModal(false)}
                  onSavePatient={handleSavePatient}
                />
                <ModelSwitcherModal
                  isOpen={showModelSwitcher}
                  onClose={() => setShowModelSwitcher(false)}
                  activeModel={activeAIModel}
                  onSelectModel={(m) => { setActiveAIModel(m); }}
                />
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
                    if (lastSpokenReminder) triggerVoiceReminder(lastSpokenReminder);
                  }}
                />
              </Suspense>
            </div>
          </TrialGateWrapper>
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard
          appointments={appointments}
          patients={patients}
          consultations={consultations}
          claims={claims}
          locumSlots={locumSlots}
          onStartConsultation={handleStartConsultationFromAppointment}
          onOpenPatientFile={(p) => { setSelectedPatient(p); navigate('/patients'); }}
          onOpenTelehealth={() => navigate('/telehealth')}
          onOpenSwitch={() => navigate('/switch')}
          onOpenBillingOverview={() => navigate('/billing')}
          onOpenNewPatientModal={() => setShowOnboardingModal(true)}
          onUpdateAppointmentStatus={(aptId, newStatus) => {
            const apt = appointments.find((a) => a.id === aptId);
            if (apt) handleBookAppointment({ ...apt, status: newStatus });
          }}
        />} />
        <Route path="/diary" element={<PracticeDiary
          appointments={appointments}
          patients={patients}
          onStartConsultation={handleStartConsultationFromAppointment}
          onBookAppointment={handleBookAppointment}
          onRequestLocum={handleRequestLocumFromDiary}
          onOpenPatientFile={(p) => { setSelectedPatient(p); navigate('/patients'); }}
          onOpenTelehealth={() => navigate('/telehealth')}
          onOpenSwitch={() => navigate('/switch')}
          onOpenBillingOverview={() => navigate('/billing')}
          isVoiceActiveGlobal={isVoiceActive}
          setIsVoiceActiveGlobal={setIsVoiceActive}
          isTrialActive={true}
          onActivateTrial={() => {}}
        />} />
        <Route path="/patients" element={<PatientList
          patients={patients}
          onSelectPatient={handleSelectPatient}
          onOpenOnboarding={() => setShowOnboardingModal(true)}
          onStartConsultationForPatient={handleStartConsultationForPatient}
          onOpenSwitchForPatient={(p) => { setSelectedPatient(p); navigate('/switch'); }}
        />} />
        <Route path="/diagnostic" element={<AIDiagnosticAssistant
          currentPatient={selectedPatient}
          patients={patients}
          onSelectPatient={(p) => setSelectedPatient(p)}
          onCommitToPatientFile={(diag, plan, meds) => {
            if (selectedPatient) {
              const updatedPat = { ...selectedPatient, tags: [...new Set([...selectedPatient.tags, 'AI Diagnosis Confirmed', diag.split(' ')[0]])] };
              handleSavePatient(updatedPat);
            }
            if (meds.length > 0) { setPresetRxItems(meds); }
          }}
          onOpenPrescriptionPad={(meds) => { setPresetRxItems(meds); navigate('/rx'); }}
        />} />
        <Route path="/consult" element={<ConsultationSOAP
          currentPatient={selectedPatient}
          patients={patients}
          onSelectPatient={(p) => setSelectedPatient(p)}
          onOpenSwitchWithClaim={handleOpenSwitchWithClaim}
          onOpenRxWithItems={handleOpenRxWithItems}
          isVoiceActiveGlobal={isVoiceActive}
        />} />
        <Route path="/pen" element={<DigitalPenCanvas
          currentPatient={selectedPatient}
          onApplyTranscribedNotes={handleApplyTranscribedNotes}
        />} />
        <Route path="/rx" element={<PrescriptionManager
          currentPatient={selectedPatient}
          initialItems={presetRxItems}
        />} />
        <Route path="/switch" element={<MedicalAidSwitch
          claims={claims}
          patients={patients}
          onClaimCreated={handleClaimCreated}
          presetClaimData={presetClaimData}
        />} />
        <Route path="/billing" element={<BillingOverview
          claims={claims}
          patients={patients}
          onOpenSwitch={() => navigate('/switch')}
          onSelectClaim={(claim) => { setPresetClaimData(claim); navigate('/switch'); }}
          isTrialActive={true}
          onActivateTrial={() => {}}
        />} />
        <Route path="/referrals" element={<ReferralsHub
          referrals={referrals}
          patients={patients}
          onReferralCreated={handleReferralCreated}
        />} />
        <Route path="/telehealth" element={<TelemedicineSuite
          currentPatient={selectedPatient}
          patients={patients}
          onSelectPatient={(p) => setSelectedPatient(p)}
          onBookVirtualAppointment={handleBookAppointment}
          onOpenConsultationNotes={(p) => { setSelectedPatient(p); navigate('/consult'); }}
        />} />
        <Route path="/locum" element={<LocumTenensMarketplace
          locumSlots={locumSlots}
          onAddLocumSlot={handleAddLocumSlot}
          onConfirmLocum={handleConfirmLocum}
        />} />
        <Route path="/cpd" element={<DoctorCPDTracker
          cpdCertificates={cpdCerts}
          onAddCertificate={handleAddCertificate}
        />} />
        <Route path="/compliance" element={<ComplianceAndFHIR
          currentPatient={selectedPatient}
          patients={patients}
          auditLogs={auditLogs}
        />} />
        <Route path="/patient_portal" element={<PatientPortalView
          currentPatient={selectedPatient}
          patients={patients}
          reminders={reminders}
          onToggleTaken={handleToggleReminderTaken}
          onRequestRefill={handleRequestRefill}
          onOpenTelehealth={() => navigate('/telehealth')}
        />} />
      </Route>

      {/* Unknown paths fall back to the home page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Layout Components
function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <Suspense fallback={<LoadingFallback />}>
        {children}
      </Suspense>
    </div>
  );
}

// Import auth pages
const SignInPage = lazy(() => import('./pages/SignInPage').then(m => ({ default: m.SignInPage })));
const SignUpPage = lazy(() => import('./pages/SignUpPage').then(m => ({ default: m.SignUpPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));