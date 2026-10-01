import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  ShieldCheck,
  Zap,
  Stethoscope,
  Calendar,
  CreditCard,
  Users,
  Video,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Clock,
  TrendingUp,
  RefreshCw,
  Smartphone,
  ChevronRight,
  Star,
  Lock,
  Building2,
  Pill,
  BarChart3,
  Search,
  Check,
  ExternalLink,
  ChevronDown,
  Layers,
  Award,
  Sliders,
  DollarSign,
  HeartPulse,
  Bell,
  MessageSquare,
  Heart,
  Smile,
  Send,
  CheckCheck,
  X,
  HelpCircle,
  Filter,
  Mic,
} from 'lucide-react';
import autonomousCareTeamImg from '../assets/images/autonomous_care_team_1790688704458.jpg';
import patientInstantAlertsImg from '../assets/images/patient_instant_alerts_1790688724339.jpg';

// Dynamic Count-Up Hook for ROI Calculator with smooth easing
const useAnimatedNumber = (targetValue: number, duration: number = 450) => {
  const [displayValue, setDisplayValue] = useState<number>(targetValue);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const prevValueRef = useRef<number>(targetValue);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = targetValue;
    if (startValue === endValue) return;

    setIsAnimating(true);
    const startTime = performance.now();

    const updateNumber = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic: 1 - Math.pow(1 - progress, 3)
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * ease);

      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(updateNumber);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
        setIsAnimating(false);
      }
    };

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    animFrameRef.current = requestAnimationFrame(updateNumber);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [targetValue, duration]);

  return { displayValue, isAnimating };
};

interface HomepageProps {
  onLaunchSuite: (targetView?: string) => void;
  onOpenPatientPortal: () => void;
  onOpenTrialModal?: () => void;
  isTrialActive?: boolean;
  onOpenVoiceAssistant?: () => void;
}

export const Homepage: React.FC<HomepageProps> = ({
  onLaunchSuite,
  onOpenPatientPortal,
  onOpenTrialModal,
  isTrialActive = false,
  onOpenVoiceAssistant,
}) => {
  // Live Switch Simulator State
  const [selectedScheme, setSelectedScheme] = useState('Discovery Health');
  const [selectedOption, setSelectedOption] = useState('Classic Comprehensive');
  const [selectedTariff, setSelectedTariff] = useState('0190');
  const [selectedICD10, setSelectedICD10] = useState('J06.9');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    status: 'Approved' | 'Co-Pay Required' | 'Pre-Auth Needed';
    latencyMs: number;
    claimAmount: number;
    schemePaid: number;
    patientPortion: number;
    authCode: string;
    schemeNotes: string;
  } | null>({
    status: 'Approved',
    latencyMs: 19,
    claimAmount: 620.0,
    schemePaid: 620.0,
    patientPortion: 0.0,
    authCode: 'DH-2026-98124',
    schemeNotes: 'Covered 100% from Risk / In-Hospital GP benefits. Zero patient co-payment required.',
  });

  // ROI Calculator State
  const [monthlyConsults, setMonthlyConsults] = useState<number>(380);
  const [avgConsultFee, setAvgConsultFee] = useState<number>(650);
  const [rejectionRate, setRejectionRate] = useState<number>(14);

  // Active Workflow Tab
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'reception' | 'consult' | 'switch' | 'telehealth' | 'billing'>('switch');

  // Autonomous Care Phone Simulator State
  const [activePhoneNotification, setActivePhoneNotification] = useState<'switch' | 'whatsapp' | 'rx' | 'lab'>('switch');
  const [isAlertRinging, setIsAlertRinging] = useState<boolean>(false);

  const triggerTestAlert = (type: 'switch' | 'whatsapp' | 'rx' | 'lab') => {
    setActivePhoneNotification(type);
    setIsAlertRinging(true);
    setTimeout(() => setIsAlertRinging(false), 800);
  };

  // FAQ Search & Filter State
  const [faqSearchQuery, setFaqSearchQuery] = useState<string>('');
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>('All');
  const [openFaqId, setOpenFaqId] = useState<string | null>('switch-comparison');

  // Pricing Billing Cycle (Monthly / Yearly)
  const [pricingBillingCycle, setPricingBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  // Run Switch Simulation
  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      let claimAmt = 650;
      if (selectedTariff === '0190') claimAmt = 620;
      if (selectedTariff === '0109') claimAmt = 1250;
      if (selectedTariff === '0130') claimAmt = 540;
      if (selectedTariff === '0205') claimAmt = 890;

      let patientPortion = 0;
      let status: 'Approved' | 'Co-Pay Required' | 'Pre-Auth Needed' = 'Approved';
      let schemeNotes = 'Approved in real-time. Direct settlement to practice within 48 hours.';

      if (selectedOption.includes('KeyCare') || selectedOption.includes('Beryl')) {
        patientPortion = Math.round(claimAmt * 0.2);
        status = 'Co-Pay Required';
        schemeNotes = 'Network benefit applies. 20% co-payment due by patient at reception.';
      } else if (selectedTariff === '0109' && selectedScheme === 'GEMS') {
        patientPortion = 0;
        status = 'Approved';
        schemeNotes = 'Specialist GP referral verified on GEMS switchway. Covered at 100% of scheme rate.';
      }

      setSimulationResult({
        status,
        latencyMs: Math.floor(Math.random() * 15) + 12,
        claimAmount: claimAmt,
        schemePaid: claimAmt - patientPortion,
        patientPortion,
        authCode: `${selectedScheme.substring(0, 2).toUpperCase()}-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        schemeNotes,
      });
      setIsSimulating(false);
    }, 450);
  };

  // Calculations for ROI
  const totalBilledAnnual = monthlyConsults * avgConsultFee * 12;
  const annualSavedDebt = Math.round(totalBilledAnnual * (rejectionRate / 100) * 0.92);
  const hoursSavedPerMonth = Math.round((monthlyConsults * 8) / 60);
  const daysCashflowReduction = 32; // Days saved from 35 down to 3 days

  // Animated values for ROI dynamic count-up animation
  const { displayValue: animatedDebt, isAnimating: isDebtAnimating } = useAnimatedNumber(annualSavedDebt, 550);
  const { displayValue: animatedHours, isAnimating: isHoursAnimating } = useAnimatedNumber(hoursSavedPerMonth, 450);

  const schemes = [
    { name: 'Discovery Health', options: ['Classic Comprehensive', 'Essential Delta', 'KeyCare Plus', 'Executive'] },
    { name: 'GEMS', options: ['Ruby', 'Emerald Value', 'Sapphire', 'Onyx'] },
    { name: 'Medscheme / Bonitas', options: ['BonClassic', 'BonComplete', 'Standard Select', 'BonStart'] },
    { name: 'Momentum Health', options: ['Custom Option', 'Extender', 'Ingwe Network', 'Summit'] },
    { name: 'Fedhealth', options: ['flexiFED 2', 'flexiFED 3', 'maxima PLUS'] },
  ];

  const tariffs = [
    { code: '0190', label: 'Consultation - Standard GP (15-20 min)' },
    { code: '0109', label: 'Specialist Consultation - Initial Complex' },
    { code: '0130', label: 'Telemedicine Virtual Consultation' },
    { code: '0205', label: 'Minor Theatre Procedure & Suture' },
  ];

  const icd10Codes = [
    { code: 'J06.9', desc: 'Acute Upper Respiratory Infection' },
    { code: 'I10', desc: 'Essential Primary Hypertension' },
    { code: 'E11.9', desc: 'Type 2 Diabetes Mellitus without Complications' },
    { code: 'M54.5', desc: 'Low Back Pain (Musculoskeletal)' },
    { code: 'K21.9', desc: 'Gastro-Oesophageal Reflux Disease' },
  ];

  return (
    <div className="w-full text-slate-800 dark:text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Value Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 text-white border-b border-teal-800/40 py-2.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-400/30">
              NEXT-GEN CLOUD
            </span>
            <span className="text-slate-300">
              South Africa&apos;s High-Performance Medical Aid Switch & Intelligent EHR
            </span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400 text-[11px]">
            <span className="flex items-center space-x-1 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Switchway: Live (99.98% Uptime)</span>
            </span>
            <span className="hidden md:inline text-slate-500">·</span>
            <span className="hidden md:inline">POPIA & HPCSA Compliant</span>
            <button
              onClick={() => onLaunchSuite('diary')}
              className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-[11px] transition shadow-sm"
            >
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200 dark:border-slate-800/80 bg-radial-[at_top_center] from-teal-500/10 via-slate-50 to-white dark:from-teal-950/40 dark:via-slate-950 dark:to-slate-950">
        {/* Glow ambient background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-5xl h-96 bg-teal-500/15 dark:bg-teal-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-48 right-10 w-72 h-72 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Healthbridge Evolution Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 shadow-xs mb-6 text-xs text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-900 dark:text-white">Healthbridge-Inspired Next Generation Architecture</span>
              <span className="text-slate-400">·</span>
              <span className="text-teal-600 dark:text-teal-400 font-bold">Sub-Second Switch & EHR</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              The Intelligent Medical Practice Platform for <span className="bg-gradient-to-r from-teal-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">South African Doctors</span>
            </h1>

            {/* Sub-headline */}
            <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Eliminate claim rejections before the patient leaves the consultation chair.
              Experience real-time medical aid switching, AI clinical SOAP notes, smart waiting room triage, and automated eRA financial reconciliations.
            </p>

            {/* Hero CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                onClick={() => onLaunchSuite('diary')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-lg shadow-teal-600/25 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Launch Clinical Practice Suite</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onOpenTrialModal && (
                <button
                  onClick={onOpenTrialModal}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-sm shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isTrialActive ? 'Manage 7-Day Trial' : 'Try 7 Days Free (All Features)'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  const el = document.getElementById('switch-simulator');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-sm transition flex items-center justify-center space-x-2 shadow-xs"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Simulate Real-Time Switch</span>
              </button>

              <button
                onClick={onOpenPatientPortal}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium transition flex items-center justify-center space-x-2"
              >
                <Smartphone className="w-4 h-4 text-teal-500" />
                <span>Patient Portal View</span>
              </button>
            </div>

            {/* Fast Stats Row */}
            <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800/80 pt-8 text-left">
              <div className="p-3">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                  6,200+
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Active SA Practices & Specialists
                </div>
              </div>

              <div className="p-3">
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  R14.8B
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Annual Claims Switched
                </div>
              </div>

              <div className="p-3">
                <div className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                  &lt;1.2s
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Real-Time Adjudication Turnaround
                </div>
              </div>

              <div className="p-3">
                <div className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400 font-mono">
                  99.8%
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  First-Pass Clean Claim Rate
                </div>
              </div>
            </div>
          </div>

          {/* Scheme Compatibility Strip */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center">
            <div className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-4">
              Real-Time Direct Switchway Integration With All Major South African Medical Schemes
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {[
                'Discovery Health',
                'GEMS',
                'Medscheme',
                'Bonitas',
                'Momentum Health',
                'Fedhealth',
                'Bestmed',
                'Sizwe Hosmed',
                'Profmed',
                'Bankmed',
                'Polmed',
              ].map((scheme) => (
                <div
                  key={scheme}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs hover:border-teal-500/50 transition cursor-default flex items-center space-x-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{scheme}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Autonomous Practice Showcase: Multi-Racial Doctors & Nurses in Smiling Care While Patients Receive Instant Mobile Alerts */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white border-b border-slate-800 relative overflow-hidden">
        {/* Glow ambient background effects */}
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-teal-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-950/80 border border-teal-700/60 text-teal-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Autonomous Practice Ecosystem · Zero Administrative Burden</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Doctors Listen & Care. Nurses Comfort. <br />
              <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                The Platform Autonomously Handles Everything Else.
              </span>
            </h2>

            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              In legacy practices, doctors spend over 65% of the consultation staring at screens, typing notes, and calling medical aids. With MedSwitch SA, our diverse clinical teams dedicate 100% of their human focus, compassion, and presence to patient care — while the autonomous switchway and AI settle claims, route e-prescriptions, and alert patients on their smartphones in real-time.
            </p>
          </div>

          {/* Main Visual Showcase: Multi-Racial Medical Team + Live Patient Smartphone */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left 7 Columns: Doctors & Nurses Attending Patient */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-2xl group">
                <img
                  src={autonomousCareTeamImg}
                  alt="Multi-racial South African healthcare team providing attentive, unhurried patient care"
                  className="w-full h-[400px] sm:h-[460px] object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
                />

                {/* Subtle gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                {/* Floating Badge Top-Left: Doctor & Nurse Care */}
                <div className="absolute top-4 left-4 p-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/90 shadow-xl max-w-xs animate-in fade-in">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">
                        Dr. Thabo Ndlovu & Sr. Priya
                      </div>
                      <div className="text-[10px] text-teal-300 font-medium">
                        100% Focused Attentive Consultation
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-300 border-t border-slate-800 pt-1.5 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Zero keyboards touched · Pure doctor-patient connection</span>
                  </div>
                </div>

                {/* Floating Badge Top-Right: Autonomous Switch Status */}
                <div className="absolute top-4 right-4 hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-950/90 backdrop-blur-md border border-emerald-600/70 text-emerald-300 text-xs font-bold shadow-lg">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Autonomous Engine: Active</span>
                </div>

                {/* Floating Bottom Card: Background Telemetry */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">
                        Autonomous Background Tasks Executed During Consultation
                      </div>
                      <div className="text-white font-semibold text-xs sm:text-sm mt-0.5">
                        Claim Switched · ICD-10 Code Assigned · NAPPI Sent · WhatsApp Dispatched
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black font-mono">
                        0 MINS ADMIN OVERHEAD
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Caption */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                <span className="flex items-center space-x-1.5">
                  <Smile className="w-4 h-4 text-teal-400" />
                  <span>Doctors and nurses regain up to 2.5 hours every day for what truly matters: caring for patients.</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-400">100% Eye-Contact</span>
              </div>
            </div>

            {/* Right 5 Columns: The Patient's Smartphone with Live Alerts */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      The Patient&apos;s Smartphone (Live Alerts)
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full bg-emerald-400 ${isAlertRinging ? 'animate-ping' : ''}`} />
                    <span className="text-[11px] text-emerald-400 font-mono">Real-Time Push</span>
                  </div>
                </div>

                {/* Smartphone Device Frame */}
                <div className="mt-5 w-full max-w-xs mx-auto bg-slate-950 border-[5px] border-slate-800 rounded-[2.5rem] p-3 shadow-2xl relative">
                  {/* Dynamic Island / Speaker Notch */}
                  <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-2 flex items-center justify-center space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    <div className="w-2.5 h-1 bg-slate-800 rounded-full" />
                  </div>

                  {/* Phone Status Bar */}
                  <div className="flex justify-between items-center px-3 text-[10px] text-slate-400 font-mono mb-3">
                    <span>09:42</span>
                    <span className="flex items-center space-x-1">
                      <span>5G MTN SA</span>
                      <span>· 98%</span>
                    </span>
                  </div>

                  {/* Lockscreen Notifications Container */}
                  <div className="space-y-2.5 min-h-[310px]">
                    {/* Notification 1: Medical Aid Switch Settlement */}
                    <div
                      onClick={() => triggerTestAlert('switch')}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        activePhoneNotification === 'switch'
                          ? 'bg-gradient-to-r from-emerald-950/80 to-slate-900 border-emerald-500 shadow-md shadow-emerald-950/50 scale-[1.02]'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">
                            DH
                          </div>
                          <span className="font-bold text-emerald-300">Discovery Health Switch</span>
                        </div>
                        <span className="text-slate-400">Just now</span>
                      </div>
                      <div className="text-xs font-bold text-white">
                        Claim Approved: R620.00 (Tariff 0190)
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5 leading-tight">
                        Paid 100% from Risk Benefit. Patient co-payment: <span className="text-emerald-400 font-bold">R0.00</span>. Auth code: <span className="font-mono text-cyan-300">DH-2026-98124</span>.
                      </div>
                    </div>

                    {/* Notification 2: WhatsApp Medical Certificate & Receipt */}
                    <div
                      onClick={() => triggerTestAlert('whatsapp')}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        activePhoneNotification === 'whatsapp'
                          ? 'bg-gradient-to-r from-teal-950/80 to-slate-900 border-teal-500 shadow-md shadow-teal-950/50 scale-[1.02]'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-4 h-4 rounded bg-emerald-500 text-slate-950 flex items-center justify-center">
                            <MessageSquare className="w-2.5 h-2.5" />
                          </div>
                          <span className="font-bold text-teal-300">WhatsApp · Dr. Ndlovu</span>
                        </div>
                        <span className="text-slate-400">1m ago</span>
                      </div>
                      <div className="text-xs font-bold text-white">
                        Care Plan & Medical Certificate Ready
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5 leading-tight">
                        &quot;Hi Lerato, your Acute Bronchitis care summary and signed sick note (28-30 Sept) are attached as secure PDF.&quot;
                      </div>
                    </div>

                    {/* Notification 3: Dis-Chem / Clicks NAPPI e-Prescription */}
                    <div
                      onClick={() => triggerTestAlert('rx')}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        activePhoneNotification === 'rx'
                          ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 border-cyan-500 shadow-md shadow-cyan-950/50 scale-[1.02]'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-4 h-4 rounded bg-cyan-600 text-white flex items-center justify-center">
                            <Pill className="w-2.5 h-2.5" />
                          </div>
                          <span className="font-bold text-cyan-300">Dis-Chem Pharmacy</span>
                        </div>
                        <span className="text-slate-400">2m ago</span>
                      </div>
                      <div className="text-xs font-bold text-white">
                        E-Script #8841 Received & Packed
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5 leading-tight">
                        Amoxicillin 500mg & Sinupret Forte ready for express counter pickup at Sandton City or free home delivery.
                      </div>
                    </div>

                    {/* Notification 4: Ampath Lab QR Code */}
                    <div
                      onClick={() => triggerTestAlert('lab')}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        activePhoneNotification === 'lab'
                          ? 'bg-gradient-to-r from-purple-950/80 to-slate-900 border-purple-500 shadow-md shadow-purple-950/50 scale-[1.02]'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-4 h-4 rounded bg-purple-600 text-white flex items-center justify-center">
                            <Activity className="w-2.5 h-2.5" />
                          </div>
                          <span className="font-bold text-purple-300">Ampath Pathology</span>
                        </div>
                        <span className="text-slate-400">3m ago</span>
                      </div>
                      <div className="text-xs font-bold text-white">
                        Digital Lab Pass #AMP-992
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5 leading-tight">
                        Full Blood Count ordered. Show your digital barcode at any Ampath depot for zero-queue fast-track.
                      </div>
                    </div>
                  </div>

                  {/* Home indicator bar */}
                  <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-3" />
                </div>

                {/* Interactive Alert Simulator Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="text-[11px] font-bold text-slate-300 mb-2 flex items-center justify-between">
                    <span>Tap to test real-time patient alert dispatch:</span>
                    <span className="text-[10px] text-teal-400 font-normal">Interactive Demo</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      onClick={() => triggerTestAlert('switch')}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center space-x-1 ${
                        activePhoneNotification === 'switch'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span>Claim Settle</span>
                    </button>

                    <button
                      onClick={() => triggerTestAlert('whatsapp')}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center space-x-1 ${
                        activePhoneNotification === 'whatsapp'
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <MessageSquare className="w-3 h-3 text-teal-400" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => triggerTestAlert('rx')}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center space-x-1 ${
                        activePhoneNotification === 'rx'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <Pill className="w-3 h-3 text-cyan-400" />
                      <span>Pharmacy</span>
                    </button>

                    <button
                      onClick={() => triggerTestAlert('lab')}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center space-x-1 ${
                        activePhoneNotification === 'lab'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <Activity className="w-3 h-3 text-purple-400" />
                      <span>Lab Pass</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Secondary Visual: Patient Smiling with Relief in Clinic */}
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 flex items-center space-x-4">
                <img
                  src={patientInstantAlertsImg}
                  alt="Smiling South African patient receiving instant medical aid approval on smartphone"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shrink-0 border border-slate-700"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Patient Relief & Zero Anxiety</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 italic leading-relaxed">
                    &quot;Knowing my medical aid approved the visit before I even put my jacket on made me feel totally respected.&quot;
                  </p>
                  <div className="text-[10px] text-slate-400 mt-1 font-medium">
                    — Lerato K., Discovery Health Member, Sandton
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Autonomous Practice Pillars: 4 Key Telemetry Cards */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-teal-500/50 transition">
              <div className="w-10 h-10 rounded-xl bg-teal-950 text-teal-400 flex items-center justify-center mb-3">
                <Smile className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-white">
                Doctor Admin: 0 Minutes
              </div>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Doctors remain unhurried and attentive. Ambient medical listening converts dialogue into clinical SOAP notes and ICD-10 codes without touching a keyboard.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center mb-3">
                <Bell className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-white">
                Patient Alerts in &lt;2s
              </div>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Patients receive instant peace of mind on their phone: settled claims, digital sick certificates, and e-prescriptions sent straight to their chosen pharmacy.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center mb-3">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-white">
                18ms EDI Switchway
              </div>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Direct connections to Discovery, GEMS, Bonitas, and Medscheme eliminate phone queues and resolve co-payments at point of care.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 transition">
              <div className="w-10 h-10 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center mb-3">
                <CheckCheck className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-white">
                Auto-Reconciled eRA
              </div>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Electronic Remittance Advices match against bank statements autonomously, eliminating bad debt, claim tracing, and billing headaches.
              </p>
            </div>
          </div>

          {/* Doctor AI Voice Assistant Banner with Gemini 3.8 Live & Opt-In Reminders */}
          <div className="mt-10 p-6 rounded-3xl bg-gradient-to-r from-teal-950/70 via-slate-900 to-slate-950 border border-teal-500/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center shrink-0 shadow-inner">
                <Mic className="w-7 h-7 animate-pulse text-teal-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black uppercase tracking-wider text-teal-400">
                    Proactive Doctor Audio HUD
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-900/80 text-teal-200 border border-teal-700/60 font-mono">
                    gemini-3.8-live
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                  Doctor AI Voice Assistant with Opt-In Clinical Reminders
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Have hands-free, two-way conversations with your practice AI. If opted in, the assistant gently speaks alerts for patient penicillin allergies, 15-minute consultation pacing, waiting room delays, and unsubmitted EDI claims aloud.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0 w-full md:w-auto">
              {onOpenVoiceAssistant && (
                <button
                  onClick={onOpenVoiceAssistant}
                  className="w-full md:w-auto px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-teal-600/30"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Open Voice Assistant</span>
                </button>
              )}
              <button
                onClick={() => onLaunchSuite('diary')}
                className="w-full md:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
              >
                Launch Suite
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Switch Simulator Section */}
      <section id="switch-simulator" className="py-16 sm:py-24 bg-slate-100/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-10">
            {/* Left side text explanation */}
            <div className="lg:max-w-md">
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2">
                <Zap className="w-3.5 h-3.5" />
                <span>Zero-Latency Switching Engine</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Experience Instant Medical Aid Adjudication
              </h2>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Like Healthbridge&apos;s legendary EDI switch, our next-generation engine communicates directly with the medical aid switchway in milliseconds. Know exactly what the scheme pays and collect co-payments upfront.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Real-Time Member Validation</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Verifies active membership and remaining medical savings balances at arrival.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Sub-Second Co-Payment Calculation</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">No surprises or post-consultation bad debt. Collect member shortfalls immediately.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Automated eRA Reconciliation</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Electronic Remittance Advices automatically match against your clinical diary claims.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => onLaunchSuite('switch')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition flex items-center space-x-2"
                >
                  <span>Open Full Switch Module in App</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right side interactive simulator card */}
            <div className="flex-1 w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Live EDI Switch Terminal Simulator
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Switch Latency: <span className="text-emerald-500 font-bold">19ms</span>
                </div>
              </div>

              {/* Input Form Fields */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Medical Scheme */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Medical Scheme
                  </label>
                  <select
                    value={selectedScheme}
                    onChange={(e) => {
                      const scheme = e.target.value;
                      setSelectedScheme(scheme);
                      const matched = schemes.find((s) => s.name === scheme);
                      if (matched && matched.options[0]) {
                        setSelectedOption(matched.options[0]);
                      }
                    }}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    {schemes.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Plan Option */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Plan Option
                  </label>
                  <select
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    {schemes
                      .find((s) => s.name === selectedScheme)
                      ?.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Tariff Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tariff & Procedure Code
                  </label>
                  <select
                    value={selectedTariff}
                    onChange={(e) => setSelectedTariff(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    {tariffs.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.code} - {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ICD-10 Diagnosis */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    ICD-10 Clinical Diagnosis
                  </label>
                  <select
                    value={selectedICD10}
                    onChange={(e) => setSelectedICD10(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    {icd10Codes.map((icd) => (
                      <option key={icd.code} value={icd.code}>
                        {icd.code} · {icd.desc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Trigger */}
              <div className="mt-5 flex items-center justify-between">
                <button
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center space-x-2 transition disabled:opacity-50"
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Switching via EDI Network...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Send Real-Time Adjudication Test</span>
                    </>
                  )}
                </button>
                <span className="text-[11px] text-slate-400">Response in &lt;50ms</span>
              </div>

              {/* Live Result Output Terminal */}
              {simulationResult && (
                <div className="mt-6 p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 font-mono text-xs animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-sans font-bold">Adjudication Result</span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded font-sans ${
                          simulationResult.status === 'Approved'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {simulationResult.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-400">
                      EDI Roundtrip: {simulationResult.latencyMs}ms
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Total Tariff</div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        R {simulationResult.claimAmount.toFixed(2)}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/60">
                      <div className="text-[10px] text-emerald-400 uppercase">Scheme Covered</div>
                      <div className="text-sm font-bold text-emerald-300 mt-0.5">
                        R {simulationResult.schemePaid.toFixed(2)}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Patient Co-Pay</div>
                      <div className="text-sm font-bold text-amber-300 mt-0.5">
                        R {simulationResult.patientPortion.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-300">
                    <div>
                      <span className="text-slate-400 font-sans">Auth Reference: </span>
                      <span className="text-cyan-400 font-bold">{simulationResult.authCode}</span>
                    </div>
                    <div className="text-slate-400 truncate font-sans">
                      {simulationResult.schemeNotes}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Workflow Tour */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>End-to-End Clinical Flow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Designed for How South African Practices Actually Work
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm sm:text-base">
            From the moment the patient books online to the automated remittance reconciliation in your bank account.
          </p>
        </div>

        {/* Workflow Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {[
            { id: 'reception', label: '1. Reception & Smart Diary', icon: Calendar },
            { id: 'consult', label: '2. Clinical SOAP & Pen Notes', icon: Stethoscope },
            { id: 'switch', label: '3. Real-Time Switch & Claims', icon: CreditCard },
            { id: 'telehealth', label: '4. Telemedicine Suite', icon: Video },
            { id: 'billing', label: '5. Financials & Remittances', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeWorkflowTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveWorkflowTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Workflow Tab Content */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-lg transition-all">
          {activeWorkflowTab === 'reception' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-teal-600 dark:text-teal-400">Step 01</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  Smart Diary & Real-Time Waiting Room Triage
                </h3>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Automated WhatsApp and SMS reminders reduce missed appointments by up to 78%. Receptionists verify medical scheme membership instantly upon arrival, flagging high-risk clinical triage cases before the doctor opens the consultation.
                </p>
                <ul className="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Multi-doctor colour-coded diary with custom consultation intervals</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Patient arrival tracking (Arrived / In Consultation / Completed)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Automated Discovery, GEMS, and Medscheme benefit verification</span>
                  </li>
                </ul>
                <div className="mt-6 flex items-center space-x-3">
                  <button
                    onClick={() => onLaunchSuite('diary')}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center space-x-2 transition"
                  >
                    <span>Try Practice Diary</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onLaunchSuite('dashboard')}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <span>View Executive Dashboard</span>
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-[11px] font-sans">
                  <span className="font-bold text-slate-900 dark:text-white">Active Diary Schedule</span>
                  <span className="text-emerald-500 font-semibold">Today · 4 In Waiting Room</span>
                </div>
                <div className="mt-3 space-y-2.5">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white font-sans text-xs">09:00 - Sipho Sithole (34 M)</div>
                      <div className="text-[10px] text-slate-400 font-sans">Discovery Classic Comprehensive · Routine Asthma Followup</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-slate-950 font-sans">
                      ARRIVED
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white font-sans text-xs">09:30 - Maria van der Merwe (61 F)</div>
                      <div className="text-[10px] text-slate-400 font-sans">GEMS Ruby · Hypertension & Blood Glucose Check</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-500 text-slate-950 font-sans">
                      IN CONSULT
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeWorkflowTab === 'consult' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-teal-600 dark:text-teal-400">Step 02</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  Clinical SOAP, Digital Pen & AI Diagnostic Assistant
                </h3>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Chart at the speed of thought. Doctors can dictate voice notes, handwrite with a digital stylus or iPad pen, or utilize AI-assisted ICD-10 and NAPPI code prescribing with instant drug-drug interaction safeguards.
                </p>
                <ul className="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Automated SOAP note generation with South African clinical templates</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Electronic Prescriptions with valid NAPPI codes sent straight to Dis-Chem & Clicks</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Digital Stylus Canvas with OCR handwriting-to-text recognition</span>
                  </li>
                </ul>
                <div className="mt-6 flex items-center space-x-3">
                  <button
                    onClick={() => onLaunchSuite('consult')}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center space-x-2 transition"
                  >
                    <span>Open Clinical SOAP Suite</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onLaunchSuite('rx')}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <span>NAPPI Prescription Pad</span>
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 text-xs font-mono">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-[11px] font-sans">
                  <span className="font-bold text-slate-900 dark:text-white">Active SOAP Note · Dr. Thabo Ndlovu</span>
                  <span className="text-teal-500 font-semibold">Gemini AI Assistant: Ready</span>
                </div>
                <div className="mt-3 space-y-2 text-slate-700 dark:text-slate-300 font-sans">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase">Subjective:</span>
                    <p className="text-xs mt-0.5">Patient reports 3-day history of productive cough, fever (38.2°C), and bilateral wheezing.</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase">Assessment & ICD-10:</span>
                    <p className="text-xs mt-0.5 font-mono text-cyan-600 dark:text-cyan-400">J20.9 · Acute Bronchitis (Bacterial Etiology likely)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeWorkflowTab === 'switch' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-teal-600 dark:text-teal-400">Step 03</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  1-Click Medical Aid Claim Switch (EDI)
                </h3>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Upon concluding the consultation, click &quot;Submit Claim&quot;. The consultation automatically attaches valid ICD-10 codes, tariff 0190/0109, and member credentials to the Healthbridge switchway. Receive approval and auth codes in less than 2 seconds.
                </p>
                <ul className="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Real-time EDI switching to Discovery, GEMS, Bonitas, Momentum & 20+ schemes</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Automatic rejection prevention (validates gender, age limits, and referral rules)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Instant debit card and Ozow payment links for member co-payments</span>
                  </li>
                </ul>
                <div className="mt-6 flex items-center space-x-3">
                  <button
                    onClick={() => onLaunchSuite('switch')}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center space-x-2 transition"
                  >
                    <span>Launch Switch Module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onLaunchSuite('billing')}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <span>View Claims Ledger</span>
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 p-5 text-xs font-mono">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-sans font-bold">EDI Transaction Stream</span>
                  <span className="text-emerald-400 font-bold">ACK RECEIVED (200 OK)</span>
                </div>
                <div className="mt-3 space-y-2 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>SCHEME:</span>
                    <span className="text-white font-bold">DISCOVERY HEALTH (CLASSIC COMP)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>TARIFF:</span>
                    <span className="text-cyan-400 font-bold">0190 (GP CONSULTATION)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>DIAGNOSIS:</span>
                    <span className="text-white">J06.9 (ACUTE UPPER RESPIRATORY)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>SETTLEMENT:</span>
                    <span className="text-emerald-400 font-bold">R 620.00 (DIRECT PAY 48H)</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                    AUTH NO: DH-2026-9921 · BHF PRACTICE: 0142981
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeWorkflowTab === 'telehealth' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-teal-600 dark:text-teal-400">Step 04</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  Built-In Encrypted Telehealth Suite
                </h3>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  No third-party Zoom or Teams links required. Patients click a secure link received via SMS and join an encrypted video call right in their mobile browser. The doctor has patient vitals, previous notes, and prescription tools side-by-side.
                </p>
                <ul className="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>HPCSA Ethical Rules Compliant with consent capture</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Low-data video mode optimized for South African mobile networks</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Immediate digital e-script and sick note generation during the call</span>
                  </li>
                </ul>
                <div className="mt-6 flex items-center space-x-3">
                  <button
                    onClick={() => onLaunchSuite('telehealth')}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center space-x-2 transition"
                  >
                    <span>Test Telehealth Room</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-5 text-center relative overflow-hidden">
                <div className="h-44 rounded-xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 border border-teal-800/40 flex flex-col items-center justify-center p-4">
                  <Video className="w-10 h-10 text-teal-400 mb-2 animate-pulse" />
                  <span className="text-white text-xs font-bold font-sans">Encrypted HD Patient Call Active</span>
                  <span className="text-teal-400/80 text-[10px] font-mono mt-1">WebRTC 1080p · Latency: 22ms</span>
                </div>
              </div>
            </div>
          )}

          {activeWorkflowTab === 'billing' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-teal-600 dark:text-teal-400">Step 05</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  Financial Analytics & Automated Remittance Reconciliations
                </h3>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Say goodbye to manual paper remittance advice reconciliation. Electronic Remittance Advices (eRA) are automatically downloaded, matched against consultations, and marked as paid in your practice ledger.
                </p>
                <ul className="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Real-time practice age analysis (Current, 30, 60, 90+ days)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Automated debtor SMS reminders with payment portal links</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Seamless export to Xero, Sage Pastel, and accountant ledgers</span>
                  </li>
                </ul>
                <div className="mt-6 flex items-center space-x-3">
                  <button
                    onClick={() => onLaunchSuite('billing')}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center space-x-2 transition"
                  >
                    <span>View Financial Overview</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 text-xs font-mono">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-[11px] font-sans">
                  <span className="font-bold text-slate-900 dark:text-white">Practice Ledger Snapshot</span>
                  <span className="text-emerald-500 font-bold">98.4% Clean Claims Rate</span>
                </div>
                <div className="mt-3 space-y-2 font-sans">
                  <div className="flex justify-between items-center p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 text-xs">Total Billed This Month</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">R 168,450.00</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                    <span className="text-emerald-700 dark:text-emerald-300 text-xs font-medium">Auto-Reconciled via eRA</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">R 156,200.00</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Practice Benefits & Interactive ROI Calculator */}
      <section className="py-16 sm:py-24 bg-slate-900 text-white border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Practice Profitability & Time Saved</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Calculate Your Practice&apos;s Return on Investment
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              See how much revenue you recover by stopping claim rejections and automating manual paperwork with our intelligent switchway.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Sliders on Left (7 cols) */}
            <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                    Monthly Consultations
                  </label>
                  <span className="text-lg font-black text-cyan-400 font-mono">{monthlyConsults}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1200"
                  step="20"
                  value={monthlyConsults}
                  onChange={(e) => setMonthlyConsults(Number(e.target.value))}
                  className="w-full accent-teal-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>100 (Solo Part-time)</span>
                  <span>500 (Busy GP)</span>
                  <span>1,200 (Group Practice)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                    Average Consultation Tariff (ZAR)
                  </label>
                  <span className="text-lg font-black text-emerald-400 font-mono">R {avgConsultFee}</span>
                </div>
                <input
                  type="range"
                  min="450"
                  max="1600"
                  step="25"
                  value={avgConsultFee}
                  onChange={(e) => setAvgConsultFee(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>R450 (Standard GP)</span>
                  <span>R850 (Extended)</span>
                  <span>R1,600 (Specialist)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                    Current Claim Rejection / Bad Debt Rate on Legacy Software
                  </label>
                  <span className="text-lg font-black text-rose-400 font-mono">{rejectionRate}%</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="28"
                  step="1"
                  value={rejectionRate}
                  onChange={(e) => setRejectionRate(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>4% (Low)</span>
                  <span>14% (Average in SA)</span>
                  <span>28% (High Bad Debt)</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                <span>Based on verified Healthbridge and BHF clinical switch metrics across SA.</span>
                <span className="text-emerald-400 font-semibold font-mono">99.8% Recovery</span>
              </div>
            </div>

            {/* Metric Cards on Right (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div
                className={`p-6 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border transition-all duration-300 shadow-xl ${
                  isDebtAnimating
                    ? 'border-emerald-400 roi-card-emerald-active shadow-emerald-900/40 shadow-2xl scale-[1.01]'
                    : 'border-emerald-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    <span>Annual Prevented Bad Debt / Recovered Revenue</span>
                  </div>
                  {isDebtAnimating && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse font-mono">
                      CALCULATING...
                    </span>
                  )}
                </div>
                <div
                  className={`text-3xl sm:text-4xl font-black font-mono mt-2 transition-all duration-200 inline-block ${
                    isDebtAnimating ? 'text-emerald-300 roi-number-emerald-counting' : 'text-white'
                  }`}
                >
                  R {animatedDebt.toLocaleString()}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Saved annually by verifying member benefits in real-time and eliminating stale claim rejections.
                </p>
              </div>

              <div
                className={`p-6 rounded-3xl bg-slate-950 border transition-all duration-300 shadow-xl ${
                  isHoursAnimating
                    ? 'border-cyan-400 roi-card-cyan-active shadow-cyan-900/40 shadow-2xl scale-[1.01]'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>Admin & Paperwork Hours Saved Monthly</span>
                  </div>
                  {isHoursAnimating && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse font-mono">
                      UPDATING...
                    </span>
                  )}
                </div>
                <div
                  className={`text-3xl sm:text-4xl font-black font-mono mt-2 transition-all duration-200 inline-block ${
                    isHoursAnimating ? 'text-cyan-300 roi-number-cyan-counting' : 'text-white'
                  }`}
                >
                  {animatedHours} hours / month
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Voice SOAP dictation, auto-generated ICD-10 codes, and 1-click electronic remittance matching.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-800/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-teal-300">Days to Payment Reduced</div>
                  <div className="text-[11px] text-slate-400">From 35 days down to 48 hours direct to bank.</div>
                </div>
                <button
                  onClick={() => onLaunchSuite('diary')}
                  className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition"
                >
                  Start Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive Grid */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Complete Feature Suite</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Everything Your Medical Practice Needs in One Place
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm sm:text-base">
            Engineered to replace fragmented, costly legacy desktop software with a secure, high-availability cloud platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Medical Aid Switch */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/60 transition group flex flex-col justify-between shadow-xs">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-5 group-hover:scale-105 transition">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Real-Time Medical Aid Switching
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Connect directly to Discovery Health, Medscheme, GEMS, Momentum, Bonitas and 25+ medical schemes. Sub-second claim approval with real-time auth codes.
              </p>
            </div>
            <button
              onClick={() => onLaunchSuite('switch')}
              className="mt-6 flex items-center text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 group-hover:translate-x-1 transition"
            >
              <span>Explore Medical Aid Switch</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          {/* Card 2: Clinical SOAP & AI Assistant */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/60 transition group flex flex-col justify-between shadow-xs">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 flex items-center justify-center mb-5 group-hover:scale-105 transition">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Clinical SOAP Notes & AI Assistant
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Complete clinical charting with automated ICD-10 suggestions, chronic disease management plans, and integrated voice dictation.
              </p>
            </div>
            <button
              onClick={() => onLaunchSuite('consult')}
              className="mt-6 flex items-center text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 group-hover:translate-x-1 transition"
            >
              <span>Launch Clinical SOAP</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          {/* Card 3: Smart Practice Diary */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/60 transition group flex flex-col justify-between shadow-xs">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-5 group-hover:scale-105 transition">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Practice Diary & Patient Flow
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Color-coded calendar with waiting room tracking, automated WhatsApp confirmations, and patient arrival notifications.
              </p>
            </div>
            <button
              onClick={() => onLaunchSuite('diary')}
              className="mt-6 flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 group-hover:translate-x-1 transition"
            >
              <span>View Practice Diary</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          {/* Card 4: NAPPI e-Prescriptions */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/60 transition group flex flex-col justify-between shadow-xs">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-5 group-hover:scale-105 transition">
                <Pill className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                NAPPI Electronic Prescriptions
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Prescribe with validated South African NAPPI codes. Instant check for contraindications and direct electronic transmission to retail pharmacies.
              </p>
            </div>
            <button
              onClick={() => onLaunchSuite('rx')}
              className="mt-6 flex items-center text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 group-hover:translate-x-1 transition"
            >
              <span>Explore Prescription Pad</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          {/* Card 5: Telemedicine Suite */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/60 transition group flex flex-col justify-between shadow-xs">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-5 group-hover:scale-105 transition">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Telemedicine & Virtual Visits
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Zero-install browser consultations for patients with integrated screen sharing, clinical chart notes, and digital sick note dispatch.
              </p>
            </div>
            <button
              onClick={() => onLaunchSuite('telehealth')}
              className="mt-6 flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 group-hover:translate-x-1 transition"
            >
              <span>Test Virtual Consultation</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          {/* Card 6: Locum Marketplace & Referrals */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/60 transition group flex flex-col justify-between shadow-xs">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center mb-5 group-hover:scale-105 transition">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                LocumTenens SA & Specialist Referrals
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Connect with verified HPCSA locum doctors during leave. Seamlessly refer patients to cardiologists, surgeons, and radiologists with clinical attachments.
              </p>
            </div>
            <button
              onClick={() => onLaunchSuite('locum')}
              className="mt-6 flex items-center text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 group-hover:translate-x-1 transition"
            >
              <span>Access Locum Hub</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      </section>

      {/* Practitioner Testimonials */}
      <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Practitioner Testimonials</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Trusted by 6,200+ South African Medical Professionals
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm">
              Hear why doctors and practice managers transitioned to our intelligent cloud platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  &quot;The sub-second Discovery Health benefit switch eliminated our practice&apos;s bad debt entirely. We used to spend days on the phone chasing unapproved claims; now every single consultation is adjudicated before the patient steps out.&quot;
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 font-bold flex items-center justify-center text-xs">
                  NM
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Dr. Naledi Molefe</div>
                  <div className="text-[10px] text-slate-500">Specialist Physician · Morningside Mediclinic, Sandton</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  &quot;Migrating from legacy desktop software took less than an afternoon. The AI SOAP notes cut my evening charting time by 2 hours every single day. I actually have my evenings back with my family.&quot;
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 font-bold flex items-center justify-center text-xs">
                  JZ
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Dr. Johan van Zyl</div>
                  <div className="text-[10px] text-slate-500">Family Practitioner · Blouberg Family Practice, Cape Town</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  &quot;The integrated NAPPI prescription pad and telemed suite gave our practice a truly modern edge. When patients need emergency followups while travelling, we conduct secure telemed and script to their closest pharmacy.&quot;
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-bold flex items-center justify-center text-xs">
                  AP
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Dr. Anusha Pillay</div>
                  <div className="text-[10px] text-slate-500">Paediatrician · Life Westville Hospital, Durban</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & POPIA Compliance */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-8 sm:p-12 text-white">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">
                <ShieldCheck className="w-4 h-4" />
                <span>Bank-Grade Healthcare Security & Compliance</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                POPIA, HPCSA & FHIR R4 Compliant By Design
              </h2>
              <p className="mt-3 text-slate-300 text-xs sm:text-sm leading-relaxed">
                Your patient data is protected under the Protection of Personal Information Act (POPIA). Encrypted at rest (AES-256) and in transit (TLS 1.3), hosted exclusively in South African ISO 27001 data centers with granular role-based audit logging.
              </p>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-xs font-bold text-white">POPIA Certified</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">RSA Data Protection</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-xs font-bold text-white">HPCSA Ethical</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Guidelines Compliant</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-xs font-bold text-white">HL7 FHIR R4</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Interoperable API</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-xs font-bold text-white">BHF Accredited</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Practice Code Ready</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <button
                onClick={() => onLaunchSuite('compliance')}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition"
              >
                <Lock className="w-4 h-4" />
                <span>View Compliance & Audit Center</span>
              </button>
              <button
                onClick={() => onLaunchSuite('diary')}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center space-x-2 transition border border-slate-700"
              >
                <span>Launch Working Suite</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Transparent Practice Pricing & Plans Section */}
      <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Transparent Practice Investment</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Predictable Pricing Built for South African Healthcare
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              No multi-year lock-ins, no expensive server hardware, and no hidden maintenance fees. Everything your practice needs in one transparent subscription.
            </p>

            {/* Monthly / Yearly Toggle */}
            <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <button
                onClick={() => setPricingBillingCycle('monthly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  pricingBillingCycle === 'monthly'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setPricingBillingCycle('yearly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                  pricingBillingCycle === 'yearly'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Annual Billing</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-slate-950">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Tier Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Plan 1: Solo Practitioner */}
            <div className="rounded-3xl p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
              <div>
                <div className="inline-block px-3 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 mb-4">
                  Solo Practitioner
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Solo Starter</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Ideal for solo GPs, independent specialists, psychologists, and allied healthcare professionals.
                </p>

                <div className="mt-6 flex items-baseline space-x-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono">
                    R {pricingBillingCycle === 'yearly' ? '1,050' : '1,290'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ month</span>
                </div>
                {pricingBillingCycle === 'yearly' && (
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                    Billed annually (R 12,600 / yr · Saves R 2,880)
                  </div>
                )}

                <div className="my-6 border-t border-slate-100 dark:border-slate-800" />

                <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span><strong>1 Doctor Diary</strong> with BHF & HPCSA profiling</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span><strong>1 Receptionist seat</strong> included free</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Clinical SOAP charting & ICD-10 search</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>NAPPI database & QR-verified e-prescriptions</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Discovery & GEMS real-time switchway (R3.90/claim)</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Offline load shedding mode with local auto-sync</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>300 automated WhatsApp / SMS reminders / mo</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Free patient data import from GoodX or Med-e-Mass</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    if (onOpenTrialModal) onOpenTrialModal();
                    else onLaunchSuite('diary');
                  }}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>{isTrialActive ? 'Manage Active Trial' : 'Start 7-Day Free Trial'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="text-center text-[10px] text-slate-400 mt-2">R0 charged today · Cancel anytime before Day 7</div>
              </div>
            </div>

            {/* Plan 2: Professional Practice (Featured / Recommended) */}
            <div className="rounded-3xl p-8 bg-white dark:bg-slate-900 border-2 border-teal-500 shadow-xl relative flex flex-col justify-between">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-md">
                ⭐ Most Popular for Busy GPs
              </div>

              <div>
                <div className="inline-block px-3 py-1 rounded-lg text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/70 mb-4">
                  Full Automation
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Professional Practice</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Engineered for high-volume practices wanting hands-free AI voice assistance, automated eRA reconciliation, and instant co-payment recovery.
                </p>

                <div className="mt-6 flex items-baseline space-x-1">
                  <span className="text-3xl sm:text-4xl font-black text-teal-600 dark:text-teal-400 font-mono">
                    R {pricingBillingCycle === 'yearly' ? '1,750' : '2,190'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ doctor / mo</span>
                </div>
                {pricingBillingCycle === 'yearly' && (
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                    Billed annually (R 21,000 / yr · Saves R 5,280/year)
                  </div>
                )}

                <div className="my-6 border-t border-slate-100 dark:border-slate-800" />

                <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-200">
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                    <span><strong>Everything in Solo Starter, plus:</strong></span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                    <span><strong>Doctor Voice AI Assistant (Gemini 3.8 Live)</strong> with spoken allergy & delay alerts</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                    <span><strong>Unlimited receptionist & staff logins</strong></span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>Volume Medical Aid Switchway rate (R3.20/claim)</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>Automated electronic Remittance (eRA) ledger reconciliation</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>Instant co-payment calculation with Ozow / Card capture</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>1080p Telehealth suite with digital consent</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>1,000 WhatsApp reminders & 2-way reschedule bot / mo</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                    <span>Priority WhatsApp practice advisor support</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    if (onOpenTrialModal) onOpenTrialModal();
                    else onLaunchSuite('switch');
                  }}
                  className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs transition shadow-md shadow-teal-600/20 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isTrialActive ? 'Manage Active Trial' : 'Start 7-Day Free Trial'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="text-center text-[10px] text-slate-400 mt-2">All features unlocked · 1-click deactivation</div>
              </div>
            </div>

            {/* Plan 3: Group Practice & Clinic */}
            <div className="rounded-3xl p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
              <div>
                <div className="inline-block px-3 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 mb-4">
                  Multi-Doctor
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Group Practice & Clinic</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  For multi-disciplinary medical centres, day clinics, and partner practices requiring unified billing and locum cover.
                </p>

                <div className="mt-6 flex items-baseline space-x-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono">
                    R {pricingBillingCycle === 'yearly' ? '3,900' : '4,890'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ clinic / mo</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Includes up to 3 practitioners (+R790/mo per extra doctor)
                </div>
                {pricingBillingCycle === 'yearly' && (
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                    Billed annually (R 46,800 / yr · Saves R 11,880)
                  </div>
                )}

                <div className="my-6 border-t border-slate-100 dark:border-slate-800" />

                <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span><strong>Everything in Professional, plus:</strong></span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span><strong>Up to 3 Doctor diaries & BHF practice codes</strong></span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>LocumTenens SA matching hub with role-based access</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Lowest Tier Switchway rate: <strong>R2.80 / claim</strong></span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Practice Age Analysis & automated sync to Xero / Pastel</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Unlimited WhatsApp reminders & debtor SMS follow-ups</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Dedicated Onboarding Manager + live reception training</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>99.95% Enterprise SLA with custom FHIR R4 exports</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    if (onOpenTrialModal) onOpenTrialModal();
                    else onLaunchSuite('diary');
                  }}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>{isTrialActive ? 'Manage Active Trial' : 'Start 7-Day Clinic Trial'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="text-center text-[10px] text-slate-400 mt-2">Includes up to 3 doctors · Cancel before Day 7</div>
              </div>
            </div>
          </div>

          {/* Transparent Add-on & Comparison Breakdown Bar */}
          <div className="mt-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
              <div className="space-y-1 md:border-r border-slate-100 dark:border-slate-800 md:pr-6">
                <div className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  Medical Aid Switch Fees
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  R 2.80 – R 3.90 <span className="text-xs text-slate-500 font-normal">/ claim</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Up to 50% lower than Healthbridge (~R6.50+). Instant sub-second adjudication for Discovery, GEMS, Medscheme, and Bonitas.
                </p>
              </div>

              <div className="space-y-1 md:border-r border-slate-100 dark:border-slate-800 md:pr-6">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Zero Lock-In Contracts
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  30-Day Free Trial
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Migrate seamlessly in 15 minutes. If it doesn’t save you hours of paperwork and eliminate bad debt, cancel anytime with one click.
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                  POPIA & Data Ownership
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  100% Practice Owned
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your patient clinical charts and financial books belong exclusively to you. Export complete FHIR R4 and PDF records anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section with Real-Time Search & Category Filters */}
      <section className="py-16 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Practice Knowledge Base</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Everything South African doctors, practice managers, and reception teams need to know about switching, compliance, billing, hardware, and everyday workflows.
          </p>
        </div>

        {/* Real-Time FAQ Search Bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={faqSearchQuery}
              onChange={(e) => setFaqSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. Discovery switch, load shedding, GoodX, POPIA, NAPPI, pricing)..."
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 shadow-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
            />
            {faqSearchQuery && (
              <button
                onClick={() => setFaqSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Search Chips */}
          <div className="mt-3 flex items-center flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-medium mr-1 text-slate-400">Popular:</span>
            {[
              'Discovery switch',
              'Load shedding',
              'GoodX migration',
              'NAPPI codes',
              'POPIA compliance',
              'WhatsApp reminders',
              'Pricing',
              'eRA reconciliation',
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => setFaqSearchQuery(chip)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer border ${
                  faqSearchQuery.toLowerCase() === chip.toLowerCase()
                    ? 'bg-teal-50 dark:bg-teal-950/70 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Category Filter Tabs */}
        {(() => {
          const allFaqs: Array<{
            id: string;
            category: 'Switch & Claims' | 'Clinical & EHR' | 'Security & POPIA' | 'Hardware & Offline' | 'Practice Operations';
            q: string;
            a: string;
            tags: string[];
          }> = [
            {
              id: 'switch-comparison',
              category: 'Switch & Claims',
              q: 'How does the Medical Aid Switch compare to Healthbridge?',
              a: 'Our switchway communicates using the exact same South African EDI standards as Healthbridge, connecting directly to Discovery Health, Medscheme, GEMS, Momentum, Bonitas and 20+ other medical schemes. You get sub-second benefit checks (<1.2s), real-time auth codes, and automated remittance reconciliation (eRA) built seamlessly into your clinical notes with zero manual re-entry.',
              tags: ['healthbridge', 'switch', 'edi', 'discovery', 'gems', 'medscheme', 'speed', 'latency'],
            },
            {
              id: 'copay-calculation',
              category: 'Switch & Claims',
              q: 'How does real-time co-payment calculation and upfront collection work?',
              a: 'When reception checks in a patient or the doctor concludes a consultation, the medical aid returns the exact portion covered by the scheme (e.g. from savings or hospital risk) and the member shortfall or co-payment due. You can collect this co-payment at reception before the patient leaves via card or Ozow instant EFT, eliminating 30-90 day bad debt.',
              tags: ['copayment', 'co-pay', 'reception', 'bad debt', 'ozow', 'credit card', 'savings'],
            },
            {
              id: 'era-reconciliation',
              category: 'Switch & Claims',
              q: 'How does automated electronic Remittance Advice (eRA) reconciliation work?',
              a: 'When medical aids pay via EFT, electronic Remittance Advice (eRA) files are automatically downloaded, matched against consultations, and marked as settled in your practice ledger. Unmatched amounts or scheme short-payments are instantly highlighted for single-click debtor follow-up.',
              tags: ['era', 'remittance', 'reconciliation', 'ledger', 'accounting', 'eft', 'settlement'],
            },
            {
              id: 'nappi-icd10',
              category: 'Clinical & EHR',
              q: 'Does it support South African NAPPI codes and ICD-10 diagnostic rules?',
              a: 'Yes. The system includes the full South African NAPPI database for both ethical branded and generic medications, alongside ICD-10 diagnostic lookup with smart search, PMB (Prescribed Minimum Benefit) flagging, and real-time contraindication / drug-drug interaction warnings.',
              tags: ['nappi', 'icd-10', 'icd10', 'pmb', 'prescriptions', 'drugs', 'medication', 'generics'],
            },
            {
              id: 'eprescriptions-pharmacy',
              category: 'Clinical & EHR',
              q: 'How do e-prescriptions reach Dis-Chem, Clicks, and local pharmacies?',
              a: 'Prescriptions are generated with authentic NAPPI codes, doctor HPCSA/BHF registration numbers, and a secure tamper-proof verification QR code. They can be dispatched directly to the patient via WhatsApp/SMS or securely routed to participating Dis-Chem, Clicks, or independent pharmacies for counter pickup or delivery.',
              tags: ['dis-chem', 'clicks', 'pharmacy', 'script', 'e-script', 'qr code', 'whatsapp'],
            },
            {
              id: 'telehealth-compliance',
              category: 'Clinical & EHR',
              q: 'Is the built-in Telemedicine suite compliant with HPCSA rules?',
              a: 'Yes. Telehealth consultations are end-to-end encrypted (WebRTC 1080p), require upfront patient digital informed consent, and allow seamless switching to in-person consultations. Doctors can simultaneously review previous history, take SOAP notes, and dispatch e-scripts without switching apps.',
              tags: ['telehealth', 'telemedicine', 'video', 'hpcsa', 'consent', 'webrtc', 'virtual'],
            },
            {
              id: 'ai-clinical-soap',
              category: 'Clinical & EHR',
              q: 'How does the AI Diagnostic and Clinical SOAP assistant work?',
              a: 'The clinical assistant supports ambient voice dictation and structured SOAP formatting. It suggests relevant ICD-10 codes, cross-references patient chronic tags, and flags potential drug interactions without getting in the doctor’s way. Doctors always retain 100% editorial and clinical control.',
              tags: ['ai', 'soap', 'voice', 'dictation', 'diagnosis', 'triage', 'gemini'],
            },
            {
              id: 'security-popia',
              category: 'Security & POPIA',
              q: 'Is patient data protected under POPIA and HPCSA ethical guidelines?',
              a: 'Yes. All data is encrypted using military-grade AES-256 at rest and TLS 1.3 in transit. Our databases are hosted strictly in South Africa (AWS Cape Town and Microsoft Azure Johannesburg data centers) in full compliance with POPIA, Section 14 of the National Health Act, and HPCSA guidelines for clinical confidentiality.',
              tags: ['popia', 'security', 'encryption', 'hpcsa', 'privacy', 'confidentiality', 'ethics'],
            },
            {
              id: 'data-sovereignty',
              category: 'Security & POPIA',
              q: 'Where is our practice data hosted, and who owns the medical records?',
              a: 'Your medical practice retains 100% legal ownership of all patient records and audit histories. Data is hosted within South African territorial borders with automated geo-redundant daily backups. You can export complete patient charts and financial ledgers at any time in standard FHIR R4, PDF, or CSV formats.',
              tags: ['data', 'hosting', 'ownership', 'fhir', 'export', 'backups', 'south africa'],
            },
            {
              id: 'offline-loadshedding',
              category: 'Hardware & Offline',
              q: 'How does the platform handle load shedding, power outages, and poor internet?',
              a: 'The web app is engineered with local offline caching. During load shedding or fiber drops, you can continue taking patient notes and charting on battery-powered laptops or iPads. The app uses ultra-low bandwidth (runs smoothly on 3G/4G smartphone hotspots) and automatically syncs all claims and records to the cloud the moment connectivity is restored.',
              tags: ['loadshedding', 'load shedding', 'offline', 'power', 'internet', 'sync', '4g', 'eskom'],
            },
            {
              id: 'hardware-support',
              category: 'Hardware & Offline',
              q: 'What hardware, tablets, and operating systems are supported?',
              a: 'Because it is modern web-based software, it works across Windows PC, macOS MacBooks, Apple iPads, and Android tablets. Doctors can use Apple Pencil or Samsung S-Pen for digital handwriting on our digital pen canvas. No dedicated local servers or costly IT maintenance contracts are required.',
              tags: ['hardware', 'ipad', 'apple pencil', 'windows', 'mac', 'tablets', 'stylus', 'servers'],
            },
            {
              id: 'legacy-migration',
              category: 'Practice Operations',
              q: 'Can I import my existing patient files from GoodX, Med-e-Mass, CGM, or Solumed?',
              a: 'Yes. Our platform provides automated CSV, Excel, and FHIR R4 data importers. Demographics, contact details, medical aid numbers, and chronic tags can be imported in under 15 minutes without disrupting your active practice or having to manually re-type patient records.',
              tags: ['migration', 'goodx', 'med-e-mass', 'cgm', 'solumed', 'import', 'excel', 'csv'],
            },
            {
              id: 'whatsapp-automation',
              category: 'Practice Operations',
              q: 'How do automated WhatsApp and SMS appointment reminders work?',
              a: 'The system automatically dispatches personalized appointment confirmations and reminder messages 24 hours and 2 hours prior to the consult. Patients can confirm or request rescheduling with one tap, reducing practice no-shows by up to 78% while freeing your receptionist from manual phone calls.',
              tags: ['whatsapp', 'sms', 'reminders', 'no-show', 'booking', 'reception', 'automation'],
            },
            {
              id: 'multi-doctor-locums',
              category: 'Practice Operations',
              q: 'Can multiple doctors, locums, and group practices share one account?',
              a: 'Yes. Group practices can configure multiple doctor diaries, each with their own BHF practice number, consultation tariffs, and schedules. Receptionists have unified multi-calendar views, and the built-in LocumTenens SA module allows you to easily onboard temporary cover doctors with restricted access permissions.',
              tags: ['multi-doctor', 'group practice', 'locum', 'locums', 'bhf', 'schedules', 'diary'],
            },
            {
              id: 'pricing-contract',
              category: 'Practice Operations',
              q: 'What is the pricing model, and are there long-term lock-in contracts?',
              a: 'We offer transparent, practice-friendly monthly pricing with no multi-year lock-in contracts. You can choose between a flat monthly practitioner subscription or a usage-based EDI switch tier. All updates, NAPPI/ICD-10 updates, backups, and WhatsApp reminders are included with no hidden server maintenance fees.',
              tags: ['pricing', 'cost', 'contracts', 'subscription', 'trial', 'lock-in', 'monthly'],
            },
            {
              id: 'reception-support',
              category: 'Practice Operations',
              q: 'What training and customer support is included for my practice team?',
              a: 'Every practice receives a dedicated onboarding specialist who trains receptionists and doctors via live 30-minute video sessions. We provide dedicated WhatsApp practice support, same-day response for switchway questions, and a 24/7 self-help knowledge base.',
              tags: ['support', 'training', 'onboarding', 'receptionist', 'help', 'whatsapp support'],
            },
          ];

          const categories = ['All', 'Switch & Claims', 'Clinical & EHR', 'Security & POPIA', 'Hardware & Offline', 'Practice Operations'] as const;

          const query = faqSearchQuery.trim().toLowerCase();

          const filteredFaqs = allFaqs.filter((faq) => {
            const matchesCategory = selectedFaqCategory === 'All' || faq.category === selectedFaqCategory;
            if (!matchesCategory) return false;
            if (!query) return true;
            return (
              faq.q.toLowerCase().includes(query) ||
              faq.a.toLowerCase().includes(query) ||
              faq.tags.some((tag) => tag.toLowerCase().includes(query)) ||
              faq.category.toLowerCase().includes(query)
            );
          });

          return (
            <div>
              {/* Category Filter Pills & Results Counter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map((cat) => {
                    const count = cat === 'All' ? allFaqs.length : allFaqs.filter((f) => f.category === cat).length;
                    const isSelected = selectedFaqCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedFaqCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 ${
                          isSelected
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <span>{cat}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isSelected
                              ? 'bg-teal-700/80 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                  Showing <span className="font-bold text-teal-600 dark:text-teal-400">{filteredFaqs.length}</span> of {allFaqs.length} questions
                </div>
              </div>

              {/* FAQ Accordion List */}
              {filteredFaqs.length > 0 ? (
                <div className="space-y-3">
                  {filteredFaqs.map((faq) => {
                    const isOpen = openFaqId === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                          isOpen
                            ? 'border-teal-500/60 bg-white dark:bg-slate-900 shadow-md ring-1 ring-teal-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <button
                          onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                          className="w-full p-5 text-left flex items-start justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition"
                        >
                          <div className="space-y-1">
                            <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400 border border-slate-200 dark:border-slate-750">
                              {faq.category}
                            </span>
                            <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                              {faq.q}
                            </div>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 shrink-0 mt-1 transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-teal-600 dark:text-teal-400' : 'text-slate-400'
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3.5 bg-slate-50/50 dark:bg-slate-950/30">
                            <p>{faq.a}</p>
                            <div className="mt-3 flex items-center space-x-1.5 flex-wrap gap-1 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">Related tags:</span>
                              {faq.tags.map((tag) => (
                                <button
                                  key={tag}
                                  onClick={() => setFaqSearchQuery(tag)}
                                  className="text-[10px] px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition"
                                >
                                  #{tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Empty Search State */
                <div className="p-8 sm:p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    No questions found matching &ldquo;{faqSearchQuery}&rdquo;
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    We couldn&apos;t find an exact match in the &ldquo;{selectedFaqCategory}&rdquo; category. Try searching for &ldquo;switch&rdquo;, &ldquo;POPIA&rdquo;, &ldquo;NAPPI&rdquo;, or reset your filters.
                  </p>
                  <div className="mt-5 flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setFaqSearchQuery('');
                        setSelectedFaqCategory('All');
                      }}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition shadow-xs"
                    >
                      Clear search & view all questions
                    </button>
                    <button
                      onClick={() => onLaunchSuite('diary')}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                      Open Live Practice Suite
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </section>

      {/* Final Call to Action */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 to-teal-50/50 dark:from-slate-950 dark:to-teal-950/30 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-600/30">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Ready to Experience the Next Generation of Practice Management?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Join thousands of South African doctors, specialists, and allied healthcare practitioners who have eliminated bad debt and streamlined their patient care.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onLaunchSuite('diary')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-xl shadow-teal-600/30 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5"
            >
              <span>Launch Clinical Practice Suite</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onLaunchSuite('switch')}
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-sm transition shadow-xs"
            >
              <span>Test Live Medical Aid Switch</span>
            </button>

            <button
              onClick={onOpenPatientPortal}
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm transition hover:bg-slate-300 dark:hover:bg-slate-700"
            >
              <span>Open Patient Portal</span>
            </button>
          </div>

          <div className="mt-12 text-xs text-slate-500 dark:text-slate-400">
            MedSwitch SA Ecosystem · Compatible with all BHF practice numbers · Zero hardware setup required
          </div>
        </div>
      </section>
    </div>
  );
};
