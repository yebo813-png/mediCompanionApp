import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Search,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { MedicalAidClaim, Patient } from '../types';

interface BillingOverviewProps {
  claims: MedicalAidClaim[];
  patients: Patient[];
  onOpenSwitch?: () => void;
  onSelectClaim?: (claim: MedicalAidClaim) => void;
  isTrialActive?: boolean;
  onActivateTrial?: () => void;
}

// 6-Month Monthly Financial Data
interface MonthlyRevenueData {
  month: string;
  shortMonth: string;
  grossBilledZAR: number;
  settledZAR: number;
  coPayZAR: number;
  claimsCount: number;
  collectionRatePct: number;
}

const HISTORICAL_MONTHS: MonthlyRevenueData[] = [
  {
    month: 'November 2025',
    shortMonth: 'Nov',
    grossBilledZAR: 118400,
    settledZAR: 104200,
    coPayZAR: 14200,
    claimsCount: 142,
    collectionRatePct: 88.0,
  },
  {
    month: 'December 2025',
    shortMonth: 'Dec',
    grossBilledZAR: 94600,
    settledZAR: 86100,
    coPayZAR: 8500,
    claimsCount: 112,
    collectionRatePct: 91.0,
  },
  {
    month: 'January 2026',
    shortMonth: 'Jan',
    grossBilledZAR: 132800,
    settledZAR: 118200,
    coPayZAR: 14600,
    claimsCount: 156,
    collectionRatePct: 89.0,
  },
  {
    month: 'February 2026',
    shortMonth: 'Feb',
    grossBilledZAR: 141200,
    settledZAR: 129900,
    coPayZAR: 11300,
    claimsCount: 168,
    collectionRatePct: 92.0,
  },
  {
    month: 'March 2026',
    shortMonth: 'Mar',
    grossBilledZAR: 156400,
    settledZAR: 142300,
    coPayZAR: 14100,
    claimsCount: 184,
    collectionRatePct: 91.0,
  },
  {
    month: 'April 2026 (MTD)',
    shortMonth: 'Apr',
    grossBilledZAR: 168500,
    settledZAR: 153300,
    coPayZAR: 15200,
    claimsCount: 198,
    collectionRatePct: 91.0,
  },
];

// Payment Aging Buckets
interface AgingBucket {
  id: 'current' | '30d' | '60d' | '90d';
  label: string;
  daysRange: string;
  totalZAR: number;
  count: number;
  color: string;
  badgeClass: string;
  description: string;
}

const AGING_BUCKETS: AgingBucket[] = [
  {
    id: 'current',
    label: 'Current (0–30 Days)',
    daysRange: '0–30 days',
    totalZAR: 98400,
    count: 118,
    color: '#10B981', // Emerald
    badgeClass: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
    description: 'Active cycle claims submitted to Discovery, GEMS, and Medscheme awaiting standard remittance run.',
  },
  {
    id: '30d',
    label: '31–60 Days',
    daysRange: '31–60 days',
    totalZAR: 34200,
    count: 36,
    color: '#06B6D4', // Cyan
    badgeClass: 'text-cyan-400 bg-cyan-950/60 border-cyan-800',
    description: 'Pre-auth verification requests or secondary co-payments requiring patient SMS reminders.',
  },
  {
    id: '60d',
    label: '61–90 Days',
    daysRange: '61–90 days',
    totalZAR: 14800,
    count: 14,
    color: '#F59E0B', // Amber
    badgeClass: 'text-amber-400 bg-amber-950/60 border-amber-800',
    description: 'Tariff code disputes or missing referral authorizations pending scheme liaison resolution.',
  },
  {
    id: '90d',
    label: '90+ Days (Overdue)',
    daysRange: '90+ days',
    totalZAR: 8600,
    count: 7,
    color: '#EF4444', // Rose
    badgeClass: 'text-rose-400 bg-rose-950/60 border-rose-800',
    description: 'Prescribed PMB condition appeals or bad debt write-off candidates.',
  },
];

// Medical Scheme Distribution Data
interface SchemeDistribution {
  name: string;
  code: string;
  billedZAR: number;
  paidZAR: number;
  rejectionRatePct: number;
  averagePayDays: number;
}

const SCHEME_DISTRIBUTION: SchemeDistribution[] = [
  {
    name: 'Discovery Health',
    code: 'DH01',
    billedZAR: 78500,
    paidZAR: 74200,
    rejectionRatePct: 1.8,
    averagePayDays: 2,
  },
  {
    name: 'GEMS (Govt Employees)',
    code: 'GEMS',
    billedZAR: 38200,
    paidZAR: 34900,
    rejectionRatePct: 4.2,
    averagePayDays: 7,
  },
  {
    name: 'Bonitas Medical Fund',
    code: 'BON01',
    billedZAR: 24100,
    paidZAR: 21600,
    rejectionRatePct: 3.5,
    averagePayDays: 10,
  },
  {
    name: 'Medscheme (Bankmed/Fedhealth)',
    code: 'MEDS',
    billedZAR: 16900,
    paidZAR: 14800,
    rejectionRatePct: 5.1,
    averagePayDays: 14,
  },
  {
    name: 'Momentum Health',
    code: 'MOM01',
    billedZAR: 10800,
    paidZAR: 9800,
    rejectionRatePct: 2.9,
    averagePayDays: 8,
  },
];

export const BillingOverview: React.FC<BillingOverviewProps> = ({
  claims,
  patients,
  onOpenSwitch,
  onSelectClaim,
  isTrialActive = false,
  onActivateTrial,
}) => {
  // Filter States
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(5); // default latest month
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedAgingFilter, setSelectedAgingFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'6m' | '3m' | 'ytd'>('6m');

  // Month data
  const currentMonthData =
    selectedMonthIndex !== null ? HISTORICAL_MONTHS[selectedMonthIndex] : HISTORICAL_MONTHS[5];

  // Claims Distribution Stats
  const statusCounts = useMemo(() => {
    const counts = {
      ADJUDICATED_PAID: { label: 'Adjudicated Paid', count: 0, amount: 0, color: '#10B981' },
      PARTIALLY_PAID: { label: 'Partially Paid / Co-Pay', count: 0, amount: 0, color: '#06B6D4' },
      QUEUED: { label: 'Pending Pre-Auth / Switch', count: 0, amount: 0, color: '#F59E0B' },
      REJECTED: { label: 'Rejected / Disputed', count: 0, amount: 0, color: '#EF4444' },
    };

    claims.forEach((c) => {
      if (c.switchStatus === 'ADJUDICATED_PAID') {
        counts.ADJUDICATED_PAID.count += 1;
        counts.ADJUDICATED_PAID.amount += c.paidZAR || c.totalClaimZAR;
      } else if (c.switchStatus === 'PARTIALLY_PAID') {
        counts.PARTIALLY_PAID.count += 1;
        counts.PARTIALLY_PAID.amount += c.totalClaimZAR;
      } else if (c.switchStatus === 'REJECTED') {
        counts.REJECTED.count += 1;
        counts.REJECTED.amount += c.totalClaimZAR;
      } else {
        counts.QUEUED.count += 1;
        counts.QUEUED.amount += c.totalClaimZAR;
      }
    });

    // Provide rich statistical baseline if sample data is small
    if (counts.ADJUDICATED_PAID.count === 0 && counts.QUEUED.count === 0) {
      counts.ADJUDICATED_PAID = { label: 'Adjudicated Paid', count: 142, amount: 118400, color: '#10B981' };
      counts.PARTIALLY_PAID = { label: 'Partially Paid / Co-Pay', count: 28, amount: 24200, color: '#06B6D4' };
      counts.QUEUED = { label: 'Pending Pre-Auth / Switch', count: 18, amount: 16800, color: '#F59E0B' };
      counts.REJECTED = { label: 'Rejected / Disputed', count: 8, amount: 9100, color: '#EF4444' };
    }

    return counts;
  }, [claims]);

  const totalClaimsAmount = useMemo(() => {
    return Object.values(statusCounts).reduce((acc, curr) => acc + curr.amount, 0);
  }, [statusCounts]);

  const totalClaimsCount = useMemo(() => {
    return Object.values(statusCounts).reduce((acc, curr) => acc + curr.count, 0);
  }, [statusCounts]);

  // Donut Chart Math
  const donutSlices = useMemo(() => {
    let currentAngle = 0;
    const slices = Object.entries(statusCounts).map(([key, data]) => {
      const percentage = totalClaimsAmount > 0 ? data.amount / totalClaimsAmount : 0.25;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle += angle;

      return {
        key,
        label: data.label,
        count: data.count,
        amount: data.amount,
        color: data.color,
        percentage: (percentage * 100).toFixed(1),
        startAngle,
        endAngle,
      };
    });
    return slices;
  }, [statusCounts, totalClaimsAmount]);

  // Helper for SVG arc path
  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: centerX + r * Math.cos(angleInRadians),
        y: centerY + r * Math.sin(angleInRadians),
      };
    };

    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  // Filtered Claims List
  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      if (selectedStatusFilter !== 'ALL' && claim.switchStatus !== selectedStatusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = claim.patientName?.toLowerCase().includes(q);
        const matchScheme = claim.schemeName?.toLowerCase().includes(q);
        const matchRef = claim.claimRef?.toLowerCase().includes(q);
        if (!matchName && !matchScheme && !matchRef) return false;
      }
      return true;
    });
  }, [claims, selectedStatusFilter, searchQuery]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = 'ClaimRef,PatientName,Scheme,TotalZAR,PaidZAR,CoPayZAR,Status,Date\n';
    const rows = (filteredClaims.length > 0 ? filteredClaims : claims)
      .map(
        (c) =>
          `"${c.claimRef}","${c.patientName}","${c.schemeName}",${c.totalClaimZAR},${c.paidZAR},${c.coPayZAR},"${c.switchStatus}","${c.serviceDate}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MmediCompannion_Billing_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Max value for revenue bar scaling
  const maxRevenue = Math.max(...HISTORICAL_MONTHS.map((m) => m.grossBilledZAR), 180000);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner / Breadcrumb & High-Level Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
            <span>Clinical Operations</span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-400 font-semibold">Executive Practice Financials</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400">EDI Switch v4.8</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Billing Overview & Revenue Intelligence</span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-lg font-mono">
              ZAR / South Africa
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time reconciliation of medical scheme claims, debtor aging schedules, and EDI switch clearance for Dr. Thabo Ndlovu.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-2xl text-xs flex items-center space-x-2 transition"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export Financial Ledger (CSV)</span>
          </button>

          {onOpenSwitch && (
            <button
              onClick={onOpenSwitch}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-500 hover:from-cyan-500 hover:to-teal-400 text-white font-extrabold rounded-2xl text-xs flex items-center space-x-2 transition shadow-md shadow-cyan-950"
            >
              <CreditCard className="w-4 h-4" />
              <span>Open Switch Terminal</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Month-to-Date Gross Billings */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>April 2026 Gross Billed</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight tabular-nums">
            R168,500.00
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <span>+7.7% vs March (R156.4k)</span>
            <span aria-hidden="true">·</span>
            <span>198 Claims</span>
          </div>
        </div>

        {/* Metric 2: Settled Cash Collections */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>EDI Settled Collections</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300 font-mono tracking-tight tabular-nums">
            R153,300.00
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-medium">
            <span>91.0% adjudication rate</span>
            <span aria-hidden="true">·</span>
            <span>Avg 4.2d clearing</span>
          </div>
        </div>

        {/* Metric 3: Outstanding Co-Payments */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Patient Co-Payments</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono tracking-tight tabular-nums">
            R15,200.00
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium">
            <span>36 active follow-ups</span>
            <span aria-hidden="true">·</span>
            <span>SMS reminders queued</span>
          </div>
        </div>

        {/* Metric 4: Overdue Aging (>60 Days) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overdue Debt (&gt;60 Days)</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-300 font-mono tracking-tight tabular-nums">
            R23,400.00
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-medium">
            <span>21 claims flagged</span>
            <span aria-hidden="true">·</span>
            <span>PMB dispute required</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart Row (Revenue Trends & Claims Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================================= */}
        {/* CHART 1: Monthly Revenue Trend (SVG Multi-Bar & Efficiency Line)           */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="space-y-0.5">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Monthly Practice Revenue Trends</span>
              </h2>
              <p className="text-xs text-slate-400">
                Gross claims billed vs. settled medical scheme disbursements (last 6 months)
              </p>
            </div>

            {/* Timeframe Switcher */}
            <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setTimeframe('6m')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  timeframe === '6m' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Last 6M
              </button>
              <button
                onClick={() => setTimeframe('3m')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  timeframe === '3m' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Last 3M
              </button>
              <button
                onClick={() => setTimeframe('ytd')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  timeframe === 'ytd' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                2026 YTD
              </button>
            </div>
          </div>

          {/* Interactive Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-md bg-cyan-500"></span>
              <span className="text-slate-300 font-medium">Gross Billed</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500"></span>
              <span className="text-slate-300 font-medium">Settled (Paid)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-500"></span>
              <span className="text-slate-300 font-medium">Co-Payment / Shortfall</span>
            </div>
          </div>

          {/* SVG Bar & Line Chart Container */}
          <div className="relative pt-4 pb-2">
            <svg viewBox="0 0 600 240" className="w-full h-56 overflow-visible select-none">
              {/* Background Grid Lines */}
              {[0, 45000, 90000, 135000, 180000].map((val, i) => {
                const y = 200 - (val / 180000) * 170;
                return (
                  <g key={i}>
                    <line x1="40" y1={y} x2="580" y2={y} stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
                    <text x="35" y={y + 4} fill="#64748B" fontSize="9" textAnchor="end" fontFamily="monospace">
                      R{val >= 1000 ? `${val / 1000}k` : val}
                    </text>
                  </g>
                );
              })}

              {/* Multi-bars for each month */}
              {HISTORICAL_MONTHS.map((item, index) => {
                const xBase = 70 + index * 85;
                const barWidth = 18;

                const grossHeight = (item.grossBilledZAR / 180000) * 170;
                const settledHeight = (item.settledZAR / 180000) * 170;
                const coPayHeight = (item.coPayZAR / 180000) * 170;

                const isHovered = hoveredMonthIndex === index;
                const isSelected = selectedMonthIndex === index;

                return (
                  <g
                    key={item.month}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredMonthIndex(index)}
                    onMouseLeave={() => setHoveredMonthIndex(null)}
                    onClick={() => setSelectedMonthIndex(index)}
                  >
                    {/* Hover Highlight Column Background */}
                    <rect
                      x={xBase - 10}
                      y="20"
                      width={barWidth * 3 + 20}
                      height="190"
                      fill={isHovered || isSelected ? '#1E293B' : 'transparent'}
                      rx="8"
                      opacity={isHovered || isSelected ? 0.7 : 0}
                    />

                    {/* Bar 1: Gross Billed (Cyan) */}
                    <rect
                      x={xBase}
                      y={200 - grossHeight}
                      width={barWidth}
                      height={grossHeight}
                      fill="#06B6D4"
                      rx="4"
                      className="transition-all hover:brightness-110"
                    />

                    {/* Bar 2: Settled Paid (Emerald) */}
                    <rect
                      x={xBase + barWidth + 2}
                      y={200 - settledHeight}
                      width={barWidth}
                      height={settledHeight}
                      fill="#10B981"
                      rx="4"
                      className="transition-all hover:brightness-110"
                    />

                    {/* Bar 3: Co-payment (Amber) */}
                    <rect
                      x={xBase + (barWidth + 2) * 2}
                      y={200 - coPayHeight}
                      width={barWidth}
                      height={coPayHeight}
                      fill="#F59E0B"
                      rx="4"
                      className="transition-all hover:brightness-110"
                    />

                    {/* Month Label */}
                    <text
                      x={xBase + barWidth * 1.5}
                      y="218"
                      fill={isSelected ? '#38BDF8' : '#94A3B8'}
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      fontSize="11"
                      textAnchor="middle"
                    >
                      {item.shortMonth}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Interactive Tooltip Card */}
            {hoveredMonthIndex !== null && (
              <div
                className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-cyan-500/60 p-3 rounded-2xl shadow-2xl text-xs space-y-1 z-20 pointer-events-none animate-in fade-in"
                style={{
                  left: `${Math.min(Math.max((hoveredMonthIndex + 1) * 16, 25), 75)}%`,
                }}
              >
                <div className="font-extrabold text-white">
                  {HISTORICAL_MONTHS[hoveredMonthIndex].month}
                </div>
                <div className="flex items-center justify-between gap-4 text-cyan-300 font-mono">
                  <span>Gross Billed:</span>
                  <strong>R{HISTORICAL_MONTHS[hoveredMonthIndex].grossBilledZAR.toLocaleString()}</strong>
                </div>
                <div className="flex items-center justify-between gap-4 text-emerald-300 font-mono">
                  <span>Settled (Paid):</span>
                  <strong>R{HISTORICAL_MONTHS[hoveredMonthIndex].settledZAR.toLocaleString()}</strong>
                </div>
                <div className="flex items-center justify-between gap-4 text-amber-300 font-mono">
                  <span>Co-Payment:</span>
                  <strong>R{HISTORICAL_MONTHS[hoveredMonthIndex].coPayZAR.toLocaleString()}</strong>
                </div>
                <div className="text-[10px] text-slate-400 pt-0.5 border-t border-slate-800">
                  Efficiency: {HISTORICAL_MONTHS[hoveredMonthIndex].collectionRatePct}% ·{' '}
                  {HISTORICAL_MONTHS[hoveredMonthIndex].claimsCount} claims
                </div>
              </div>
            )}
          </div>

          {/* Selected Month Summary Strip */}
          <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="text-slate-300 font-semibold">Active Snapshot:</span>
              <strong className="text-white font-bold">{currentMonthData.month}</strong>
            </div>

            <div className="flex items-center gap-4 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 mr-1">Billed:</span>
                <span className="text-white font-bold">R{currentMonthData.grossBilledZAR.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 mr-1">Settled:</span>
                <span className="text-emerald-400 font-bold">R{currentMonthData.settledZAR.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 mr-1">Rate:</span>
                <span className="text-cyan-300 font-bold">{currentMonthData.collectionRatePct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CHART 2: Claims Status Distribution (Interactive SVG Donut)              */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="space-y-0.5 border-b border-slate-800/80 pb-3">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span>Claims Status Distribution</span>
            </h2>
            <p className="text-xs text-slate-400">
              EDI clearance lifecycle across all active medical scheme batches
            </p>
          </div>

          {/* SVG Donut Ring with Center Summary */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-2">
            <div className="relative w-44 h-44 shrink-0">
              <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
                {donutSlices.map((slice) => {
                  const isHovered = hoveredSlice === slice.key;
                  const isFiltered = selectedStatusFilter === slice.key;
                  const strokeWidth = isHovered || isFiltered ? 20 : 16;

                  return (
                    <path
                      key={slice.key}
                      d={describeArc(80, 80, 58, slice.startAngle, slice.endAngle - 0.5)}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth={strokeWidth}
                      className="cursor-pointer transition-all duration-150 hover:opacity-90"
                      onMouseEnter={() => setHoveredSlice(slice.key)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      onClick={() => {
                        setSelectedStatusFilter(selectedStatusFilter === slice.key ? 'ALL' : slice.key);
                      }}
                    />
                  );
                })}
              </svg>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Claims</span>
                <span className="text-xl font-extrabold text-white font-mono">{totalClaimsCount}</span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  R{(totalClaimsAmount / 1000).toFixed(1)}k
                </span>
              </div>
            </div>

            {/* Slices Legend / Clickable Filter Items */}
            <div className="space-y-2 flex-1 w-full text-xs">
              {donutSlices.map((slice) => {
                const isActive = selectedStatusFilter === slice.key;
                return (
                  <button
                    key={slice.key}
                    onClick={() => {
                      setSelectedStatusFilter(isActive ? 'ALL' : slice.key);
                    }}
                    onMouseEnter={() => setHoveredSlice(slice.key)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition ${
                      isActive
                        ? 'bg-slate-800 border-cyan-500 ring-1 ring-cyan-500'
                        : 'bg-slate-850/50 hover:bg-slate-800 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }}></span>
                      <span className="text-slate-200 font-medium truncate">{slice.label}</span>
                    </div>

                    <div className="flex items-center space-x-2 font-mono shrink-0">
                      <span className="text-slate-400">{slice.percentage}%</span>
                      <strong className="text-white">R{slice.amount.toLocaleString()}</strong>
                    </div>
                  </button>
                );
              })}

              {selectedStatusFilter !== 'ALL' && (
                <button
                  onClick={() => setSelectedStatusFilter('ALL')}
                  className="w-full text-center text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold pt-1"
                >
                  Clear Status Filter (Show All)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: Payment Aging Analysis (0–30, 31–60, 61–90, 90+ Days)          */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Payment Aging Analysis & Debtor Schedules</span>
            </h2>
            <p className="text-xs text-slate-400">
              Outstanding debtor balances categorized by age since initial EDI transmission date
            </p>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Total Outstanding Debtors:</span>
            <strong className="text-white font-mono font-bold">R156,000.00</strong>
          </div>
        </div>

        {/* Stacked Visual Bar for Aging */}
        <div className="space-y-2">
          <div className="w-full h-5 bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
            {AGING_BUCKETS.map((bucket) => {
              const pct = (bucket.totalZAR / 156000) * 100;
              return (
                <div
                  key={bucket.id}
                  style={{ width: `${pct}%`, backgroundColor: bucket.color }}
                  className="h-full transition-all hover:brightness-110 cursor-pointer"
                  title={`${bucket.label}: R${bucket.totalZAR.toLocaleString()} (${pct.toFixed(1)}%)`}
                  onClick={() => setSelectedAgingFilter(selectedAgingFilter === bucket.id ? null : bucket.id)}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Current (63.1%)</span>
            <span>31–60d (21.9%)</span>
            <span>61–90d (9.5%)</span>
            <span className="text-rose-400 font-semibold">90+d (5.5%)</span>
          </div>
        </div>

        {/* 4 Interactive Aging Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AGING_BUCKETS.map((bucket) => {
            const isSelected = selectedAgingFilter === bucket.id;
            return (
              <div
                key={bucket.id}
                onClick={() => setSelectedAgingFilter(isSelected ? null : bucket.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-slate-800 border-cyan-500 shadow-md ring-1 ring-cyan-500'
                    : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{bucket.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${bucket.badgeClass}`}>
                    {bucket.count} claims
                  </span>
                </div>

                <div className="text-xl font-extrabold text-white font-mono tabular-nums">
                  R{bucket.totalZAR.toLocaleString()}.00
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {bucket.description}
                </p>

                <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Action:</span>
                  <span className="text-cyan-400 hover:underline font-semibold flex items-center gap-1">
                    <span>Follow-Up</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: Medical Aid Scheme Performance Breakdown                       */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Medical Aid Scheme Distribution & Turnaround</span>
            </h2>
            <p className="text-xs text-slate-400">
              Clearance efficiency and rejection benchmarks by South African medical scheme
            </p>
          </div>

          <span className="text-xs text-slate-400">
            5 Schemes active on switch
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {SCHEME_DISTRIBUTION.map((scheme) => (
            <div
              key={scheme.code}
              className="p-3.5 bg-slate-800/50 rounded-2xl border border-slate-700/50 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate">{scheme.name}</span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold">{scheme.code}</span>
              </div>
              <div className="text-base font-extrabold text-white font-mono">
                R{scheme.billedZAR.toLocaleString()}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/40">
                <span>Avg Pay: <strong className="text-slate-200">{scheme.averagePayDays}d</strong></span>
                <span>Rejections: <strong className={scheme.rejectionRatePct > 4 ? 'text-amber-400' : 'text-emerald-400'}>{scheme.rejectionRatePct}%</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: Filterable Claims Reconciliation Ledger Table                  */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Claims Reconciliation Ledger</span>
            </h2>
            <p className="text-xs text-slate-400">
              Itemized electronic transaction records matched against switch EDI confirmations
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, scheme, claim..."
                className="pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-52 sm:w-64"
              />
            </div>

            {/* Filter by Status Pill */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="ADJUDICATED_PAID">Adjudicated Paid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="QUEUED">Queued / Pre-Auth</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 px-2">Claim Ref</th>
                <th className="pb-3 px-2">Patient</th>
                <th className="pb-3 px-2">Medical Aid Scheme</th>
                <th className="pb-3 px-2">Service Date</th>
                <th className="pb-3 px-2 text-right">Billed (ZAR)</th>
                <th className="pb-3 px-2 text-right">Paid (ZAR)</th>
                <th className="pb-3 px-2 text-right">Co-Pay (ZAR)</th>
                <th className="pb-3 px-2 text-center">EDI Status</th>
                <th className="pb-3 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredClaims.map((claim) => {
                const isPaid = claim.switchStatus === 'ADJUDICATED_PAID';
                const isPartial = claim.switchStatus === 'PARTIALLY_PAID';
                const isRejected = claim.switchStatus === 'REJECTED';

                return (
                  <tr key={claim.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-2 font-bold text-white">
                      {claim.claimRef}
                    </td>
                    <td className="py-3 px-2 font-sans font-semibold text-slate-200">
                      {claim.patientName}
                    </td>
                    <td className="py-3 px-2 font-sans text-slate-300">
                      {claim.schemeName}
                    </td>
                    <td className="py-3 px-2 text-slate-400">
                      {claim.serviceDate}
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-white">
                      R{claim.totalClaimZAR.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right text-emerald-400 font-bold">
                      R{claim.paidZAR.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-right text-amber-400 font-bold">
                      R{claim.coPayZAR.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-center font-sans">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            : isPartial
                            ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                            : isRejected
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {claim.switchStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-sans">
                      <button
                        onClick={() => {
                          if (onSelectClaim) onSelectClaim(claim);
                          else if (onOpenSwitch) onOpenSwitch();
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-[11px] font-semibold transition"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredClaims.length === 0 && (
            <div className="py-8 text-center text-slate-500 text-xs">
              No claims match the selected status or query.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
