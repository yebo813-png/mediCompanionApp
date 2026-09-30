import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  ArrowUpRight,
  CreditCard,
  Clock,
  CheckCircle2,
  BarChart3,
  Layers,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { MedicalAidClaim } from '../types';

interface RevenueTrendWidgetProps {
  claims?: MedicalAidClaim[];
  onOpenBillingOverview?: () => void;
  className?: string;
}

interface MonthlyDataPoint {
  month: string;
  fullName: string;
  income: number;
  outstanding: number;
  gross: number;
  collectionRate: number;
  claimsCount: number;
}

const HISTORICAL_FINANCIALS: MonthlyDataPoint[] = [
  {
    month: 'Nov',
    fullName: 'November 2025',
    income: 104200,
    outstanding: 14200,
    gross: 118400,
    collectionRate: 88.0,
    claimsCount: 142,
  },
  {
    month: 'Dec',
    fullName: 'December 2025',
    income: 86100,
    outstanding: 8500,
    gross: 94600,
    collectionRate: 91.0,
    claimsCount: 112,
  },
  {
    month: 'Jan',
    fullName: 'January 2026',
    income: 118200,
    outstanding: 14600,
    gross: 132800,
    collectionRate: 89.0,
    claimsCount: 156,
  },
  {
    month: 'Feb',
    fullName: 'February 2026',
    income: 129900,
    outstanding: 11300,
    gross: 141200,
    collectionRate: 92.0,
    claimsCount: 168,
  },
  {
    month: 'Mar',
    fullName: 'March 2026',
    income: 142300,
    outstanding: 14100,
    gross: 156400,
    collectionRate: 91.0,
    claimsCount: 184,
  },
  {
    month: 'Apr',
    fullName: 'April 2026 (MTD)',
    income: 153300,
    outstanding: 15200,
    gross: 168500,
    collectionRate: 91.0,
    claimsCount: 198,
  },
];

// Custom Tooltip component for Recharts
const CustomRevenueTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data: MonthlyDataPoint = payload[0].payload;
    return (
      <div className="bg-slate-950/95 border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl text-xs space-y-2 backdrop-blur-md min-w-[200px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span className="font-extrabold text-white">{data.fullName}</span>
          <span className="text-[10px] text-cyan-400 font-mono font-semibold">{data.claimsCount} claims</span>
        </div>

        <div className="space-y-1.5 font-mono text-[11px]">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Settled Income:</span>
            </span>
            <strong>R {data.income.toLocaleString()}.00</strong>
          </div>

          <div className="flex items-center justify-between text-amber-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Outstanding:</span>
            </span>
            <strong>R {data.outstanding.toLocaleString()}.00</strong>
          </div>

          <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800">
            <span>Gross Billed:</span>
            <strong className="text-white">R {data.gross.toLocaleString()}.00</strong>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          <span>Adjudication Efficiency:</span>
          <span className="text-cyan-300 font-bold">{data.collectionRate}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export const RevenueTrendWidget: React.FC<RevenueTrendWidgetProps> = ({
  claims = [],
  onOpenBillingOverview,
  className = '',
}) => {
  const [timeframe, setTimeframe] = useState<'6m' | '3m' | 'ytd'>('6m');
  const [chartStyle, setChartStyle] = useState<'composed' | 'area'>('composed');

  // Filtered dataset according to timeframe
  const displayData = useMemo(() => {
    if (timeframe === '3m') {
      return HISTORICAL_FINANCIALS.slice(3);
    }
    if (timeframe === 'ytd') {
      return HISTORICAL_FINANCIALS.slice(2);
    }
    return HISTORICAL_FINANCIALS;
  }, [timeframe]);

  // Aggregate metrics
  const totalSettled = useMemo(() => {
    return displayData.reduce((acc, curr) => acc + curr.income, 0);
  }, [displayData]);

  const totalOutstanding = useMemo(() => {
    return displayData.reduce((acc, curr) => acc + curr.outstanding, 0);
  }, [displayData]);

  const avgEfficiency = useMemo(() => {
    if (displayData.length === 0) return 0;
    const sum = displayData.reduce((acc, curr) => acc + curr.collectionRate, 0);
    return (sum / displayData.length).toFixed(1);
  }, [displayData]);

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 ${className}`}
    >
      {/* Header bar with contextual titles and toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-medium">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Recharts Analytics</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>Practice Income vs. Outstanding Claims</span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-400 font-mono">ZAR</span>
          </div>

          <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span>Revenue Trajectory & Switch Clearance</span>
          </h2>
        </div>

        {/* Interactive Controls: Style & Timeframe Switchers */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Chart View Toggle */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60 text-xs">
            <button
              onClick={() => setChartStyle('composed')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                chartStyle === 'composed'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Bar & Trend line composed view"
            >
              Bars + Trend
            </button>
            <button
              onClick={() => setChartStyle('area')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                chartStyle === 'area'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Area gradient curve view"
            >
              Area Waves
            </button>
          </div>

          {/* Timeframe Switcher */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60 text-xs">
            <button
              onClick={() => setTimeframe('6m')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                timeframe === '6m'
                  ? 'bg-slate-700 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              6M
            </button>
            <button
              onClick={() => setTimeframe('3m')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                timeframe === '3m'
                  ? 'bg-slate-700 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3M
            </button>
            <button
              onClick={() => setTimeframe('ytd')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                timeframe === 'ytd'
                  ? 'bg-slate-700 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              YTD
            </button>
          </div>

          {/* Direct Link to Full Billing Overview */}
          {onOpenBillingOverview && (
            <button
              onClick={onOpenBillingOverview}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl transition"
              title="Expand to Full Billing Overview & Debtors View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-800/40 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              Total Settled Income
            </span>
            <span className="text-lg font-black text-emerald-400 font-mono tracking-tight tabular-nums">
              R {totalSettled.toLocaleString()}.00
            </span>
          </div>
          <div className="w-7 h-7 rounded-xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-slate-800/40 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              Pending / Outstanding
            </span>
            <span className="text-lg font-black text-amber-400 font-mono tracking-tight tabular-nums">
              R {totalOutstanding.toLocaleString()}.00
            </span>
          </div>
          <div className="w-7 h-7 rounded-xl bg-amber-950/80 border border-amber-800 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-slate-800/40 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              Collection Efficiency
            </span>
            <span className="text-lg font-black text-cyan-300 font-mono tracking-tight tabular-nums">
              {avgEfficiency}%
            </span>
          </div>
          <div className="w-7 h-7 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Interactive Recharts Canvas */}
      <div className="h-64 sm:h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {chartStyle === 'composed' ? (
            <ComposedChart
              data={displayData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="settledIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="outstandingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#D97706" stopOpacity={0.6} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} vertical={false} />

              <XAxis
                dataKey="month"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />

              <YAxis
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `R${val / 1000}k`}
              />

              <Tooltip content={<CustomRevenueTooltip />} />

              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                formatter={(value) => (
                  <span className="text-slate-300 font-medium">
                    {value === 'income' ? 'Settled Income' : value === 'outstanding' ? 'Outstanding Claims' : 'Gross Billed Trend'}
                  </span>
                )}
              />

              {/* Bar 1: Settled Income */}
              <Bar
                dataKey="income"
                name="income"
                fill="url(#settledIncomeGrad)"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />

              {/* Bar 2: Outstanding Claims */}
              <Bar
                dataKey="outstanding"
                name="outstanding"
                fill="url(#outstandingGrad)"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />

              {/* Line: Gross Trend */}
              <Line
                type="monotone"
                dataKey="gross"
                name="gross"
                stroke="#06B6D4"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#06B6D4', strokeWidth: 1, stroke: '#FFFFFF' }}
                activeDot={{ r: 6, fill: '#38BDF8' }}
              />
            </ComposedChart>
          ) : (
            <AreaChart
              data={displayData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="areaIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="areaOutstanding" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} vertical={false} />

              <XAxis
                dataKey="month"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />

              <YAxis
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `R${val / 1000}k`}
              />

              <Tooltip content={<CustomRevenueTooltip />} />

              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                formatter={(value) => (
                  <span className="text-slate-300 font-medium">
                    {value === 'income' ? 'Settled Income' : 'Outstanding Claims'}
                  </span>
                )}
              />

              <Area
                type="monotone"
                dataKey="income"
                name="income"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#areaIncome)"
              />

              <Area
                type="monotone"
                dataKey="outstanding"
                name="outstanding"
                stroke="#F59E0B"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#areaOutstanding)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
        <div className="flex items-center space-x-2 text-slate-400">
          <CreditCard className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Discovery Health, GEMS, Bonitas, & Medscheme EDI clearance live.</span>
        </div>

        {onOpenBillingOverview && (
          <button
            onClick={onOpenBillingOverview}
            className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1.5 transition self-start sm:self-auto"
          >
            <span>View Full Financial Ledger & Debtor Aging</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
