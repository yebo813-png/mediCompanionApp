import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  PenTool,
  Pill,
  CreditCard,
  Share2,
  Video,
  UserPlus2,
  Award,
  Smartphone,
  ShieldCheck,
  BarChart3,
  Sparkles,
  Globe,
} from 'lucide-react';

interface NavigationProps {
  activeView: string;
  setActiveView: (view: string) => void;
  waitingCount: number;
  openClaimsCount: number;
  pendingLocumCount: number;
  urgentCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeView,
  setActiveView,
  waitingCount,
  openClaimsCount,
  pendingLocumCount,
  urgentCount = 1,
}) => {
  const tabs = [
    {
      id: 'home',
      label: 'Homepage & Solutions',
      icon: Globe,
      tag: 'OVERVIEW',
      highlight: true,
    },
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      badge: 'Revenue & Triage',
      badgeColor: 'bg-cyan-600 text-white font-bold',
      highlight: true,
    },
    {
      id: 'diary',
      label: 'Practice Diary',
      icon: Calendar,
      badge: waitingCount ? `${waitingCount} waiting` : '2 waiting',
      badgeColor: 'bg-amber-500 text-white font-bold',
      highlight: true,
    },
    { id: 'patients', label: 'Patient Files', icon: Users },
    { id: 'diagnostic', label: 'AI Diagnostic Assistant', icon: Sparkles, tag: 'GEMINI AI', highlight: true },
    { id: 'consult', label: 'Consultation & SOAP', icon: Stethoscope },
    { id: 'pen', label: 'Doctor Pen Charting', icon: PenTool, tag: 'STYLUS & OCR' },
    { id: 'rx', label: 'Auto-Prescription', icon: Pill, tag: 'NAPPI' },
    {
      id: 'billing',
      label: 'Billing Overview',
      icon: BarChart3,
      badge: 'R168k MTD',
      badgeColor: 'bg-emerald-600 text-white font-bold',
      highlight: true,
    },
    { id: 'switch', label: 'Medical Aid Switch', icon: CreditCard, badge: openClaimsCount ? `${openClaimsCount} EDI` : '1 EDI', badgeColor: 'bg-cyan-600 text-white' },
    { id: 'referrals', label: 'Auto Referrals', icon: Share2 },
    { id: 'telehealth', label: 'Telemedicine Suite', icon: Video, tag: 'WEBRTC' },
    { id: 'locum', label: 'LocumTenens SA', icon: UserPlus2, badge: pendingLocumCount ? `${pendingLocumCount} Slot` : null, badgeColor: 'bg-purple-600 text-white' },
    { id: 'cpd', label: 'Doctor CPD & Tests', icon: Award, tag: 'HPCSA' },
    { id: 'patient_portal', label: 'Client App Mode', icon: Smartphone, tag: 'Patient View' },
    { id: 'compliance', label: 'Security & FHIR', icon: ShieldCheck, tag: 'POPIA' },
  ];

  return (
    <nav className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur sticky top-16 z-30 overflow-x-auto scrollbar-none transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1.5 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'border border-teal-500 bg-teal-50/80 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>

                {tab.tag && (
                  <span
                    className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold ${
                      isActive
                        ? 'bg-teal-100 dark:bg-teal-900/80 text-teal-800 dark:text-teal-200'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {tab.tag}
                  </span>
                )}

                {tab.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
