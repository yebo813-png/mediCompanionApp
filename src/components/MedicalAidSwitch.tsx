import React, { useState } from 'react';
import {
  CreditCard,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Radio,
  ArrowRight,
  RefreshCw,
  Search,
  Download,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';
import { Patient, MedicalAidClaim } from '../types';
import { MmediCompannionApi, PracticeStore } from '../services/api';

interface MedicalAidSwitchProps {
  claims: MedicalAidClaim[];
  patients: Patient[];
  onClaimCreated: (newClaim: MedicalAidClaim) => void;
  presetClaimData?: any;
}

export const MedicalAidSwitch: React.FC<MedicalAidSwitchProps> = ({
  claims,
  patients,
  onClaimCreated,
  presetClaimData,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState(
    presetClaimData?.patientId || patients[0]?.id || ''
  );
  const [tariffCode, setTariffCode] = useState('0190');
  const [tariffAmount, setTariffAmount] = useState('580.00');
  const [nappiCode, setNappiCode] = useState('702819001');
  const [nappiAmount, setNappiAmount] = useState('145.00');
  const [icd10Code, setIcd10Code] = useState(presetClaimData?.icd10Primary || 'I10');
  const [isPMB, setIsPMB] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [switchFeedback, setSwitchFeedback] = useState<any>(null);
  const [selectedClaimDetails, setSelectedClaimDetails] = useState<MedicalAidClaim | null>(claims[0] || null);

  const [filterScheme, setFilterScheme] = useState('ALL');

  const patient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  const handleSendClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;

    setIsSubmitting(true);
    setSwitchFeedback(null);

    const payload = {
      practiceNumber: '0548921',
      schemeCode: patient.medicalAidName,
      membershipNumber: patient.medicalAidNumber || '902184729',
      dependantCode: patient.dependantCode || '00',
      serviceDate: new Date().toISOString().slice(0, 10),
      tariffCodes: [{ code: tariffCode, units: 1, amountZAR: parseFloat(tariffAmount) || 580 }],
      nappiCodes: [{ nappi: nappiCode, quantity: 1, amountZAR: parseFloat(nappiAmount) || 145 }],
      icd10Primary: icd10Code,
      isPMB,
    };

    try {
      const res = await MmediCompannionApi.submitSwitchClaim(payload);
      if (res.success && res.data) {
        const sw = res.data;
        setSwitchFeedback(sw);

        const newClaimRecord: MedicalAidClaim = {
          id: `clm-${Date.now()}`,
          claimRef: sw.transactionId,
          patientId: patient.id,
          patientName: patient.fullName,
          schemeCode: patient.medicalAidName.toUpperCase(),
          schemeName: patient.medicalAidName,
          membershipNumber: patient.medicalAidNumber,
          dependantCode: patient.dependantCode,
          serviceDate: payload.serviceDate,
          submissionDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
          totalClaimZAR: sw.totalClaimAmountZAR,
          paidZAR: sw.paidAmountZAR,
          coPayZAR: sw.coPaymentZAR,
          switchStatus: sw.claimStatus === 'PAID' ? 'ADJUDICATED_PAID' : sw.claimStatus === 'PARTIALLY_PAID' ? 'PARTIALLY_PAID' : 'REJECTED',
          rejectionCode: sw.rejectionCode,
          rejectionReason: sw.rejectionReason,
          switchTransactionId: sw.transactionId,
          batchNumber: sw.batchNumber,
          items: sw.adjudicatedLines?.map((l: any) => ({
            type: l.type,
            code: l.code,
            description: l.type === 'TARIFF' ? `Tariff Consultation Code ${l.code}` : `NAPPI Item ${l.code}`,
            amountZAR: l.claimedZAR,
            paidZAR: l.paidZAR,
            status: l.status,
          })) || [],
        };

        onClaimCreated(newClaimRecord);
        setSelectedClaimDetails(newClaimRecord);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClaims = claims.filter((c) => {
    if (filterScheme === 'ALL') return true;
    return c.schemeName.toLowerCase().includes(filterScheme.toLowerCase());
  });

  const totalClaimedZAR = claims.reduce((acc, c) => acc + c.totalClaimZAR, 0);
  const totalPaidZAR = claims.reduce((acc, c) => acc + c.paidZAR, 0);
  const totalCoPayZAR = claims.reduce((acc, c) => acc + c.coPayZAR, 0);

  const getStatusBadge = (status: MedicalAidClaim['switchStatus']) => {
    switch (status) {
      case 'ADJUDICATED_PAID':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">Paid by Scheme</span>;
      case 'PARTIALLY_PAID':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800">Partially Paid (Co-pay)</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-950 text-red-300 border border-red-800">Claim Rejected</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Switch Gateway Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-cyan-900/30">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white tracking-tight">South African Medical Aid Switch API</h2>
                <span className="text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-400" />
                  Healthbridge & MediSwitch Gateway Online
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time electronic claims adjudication • Discovery Health, GEMS, Bonitas, Momentum, Medscheme
              </p>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="text-slate-400 block">Practice BHF Identifier:</span>
            <span className="text-white font-mono font-bold text-sm">0548921</span>
          </div>
        </div>

        {/* Claim Volume Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-800">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Total Switched Claims</span>
            <span className="text-xl font-bold text-white font-mono">R{(totalClaimedZAR ?? 0).toFixed(2)}</span>
          </div>

          <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/50">
            <span className="text-emerald-300 text-[11px] block">Scheme Remittance Settled</span>
            <span className="text-xl font-bold text-emerald-200 font-mono">R{(totalPaidZAR ?? 0).toFixed(2)}</span>
          </div>

          <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-800/50">
            <span className="text-amber-300 text-[11px] block">Member Co-payments Due</span>
            <span className="text-xl font-bold text-amber-200 font-mono">R{(totalCoPayZAR ?? 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Main 2-column layout: Direct Switch Submission on left, Claims Ledger & EDI Inspector on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: New EDI Switch Claim Creator */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-400" />
            Dispatch Real-time Electronic Claim (EDI)
          </h3>

          <form onSubmit={handleSendClaim} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Select Patient File</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} • {p.medicalAidName} (#{p.medicalAidNumber || 'None'})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 space-y-1">
              <div>
                Scheme: <span className="font-semibold text-white">{patient?.medicalAidName}</span>
              </div>
              <div>
                Member No: <span className="font-mono text-cyan-400">{patient?.medicalAidNumber || '902184729'}</span> • Dep:{' '}
                <span className="font-mono text-cyan-400">{patient?.dependantCode || '00'}</span>
              </div>
              <div>
                National ID: <span className="font-mono text-slate-400">{patient?.idNumber}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">BHF Tariff Code</label>
                <select
                  value={tariffCode}
                  onChange={(e) => {
                    setTariffCode(e.target.value);
                    if (e.target.value === '0190') setTariffAmount('580.00');
                    if (e.target.value === '0191') setTariffAmount('850.00');
                    if (e.target.value === '0192') setTariffAmount('1240.00');
                    if (e.target.value === '0130') setTariffAmount('510.00');
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                >
                  <option value="0190">0190 (Standard GP)</option>
                  <option value="0191">0191 (Extended &gt;20m)</option>
                  <option value="0192">0192 (Complex &gt;40m)</option>
                  <option value="0130">0130 (Telehealth)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tariff Amount (ZAR)</label>
                <input
                  type="text"
                  value={tariffAmount}
                  onChange={(e) => setTariffAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">NAPPI Medicine Code</label>
                <input
                  type="text"
                  value={nappiCode}
                  onChange={(e) => setNappiCode(e.target.value)}
                  placeholder="e.g. 702819001"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">NAPPI Amount (ZAR)</label>
                <input
                  type="text"
                  value={nappiAmount}
                  onChange={(e) => setNappiAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Primary ICD-10 Diagnostic Code</label>
              <input
                type="text"
                value={icd10Code}
                onChange={(e) => setIcd10Code(e.target.value)}
                placeholder="e.g. I10, E11.9, J45.9"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                required
              />
            </div>

            <label className="flex items-center space-x-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 cursor-pointer">
              <input
                type="checkbox"
                checked={isPMB}
                onChange={(e) => setIsPMB(e.target.checked)}
                className="rounded text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-[11px] text-slate-300">
                Prescribed Minimum Benefit (PMB / CDL Condition - Scheme Must Fund at Cost)
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow-md shadow-cyan-950"
            >
              {isSubmitting ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Transmitting to Healthbridge Switch...' : 'Transmit Electronic Claim Now'}</span>
            </button>
          </form>

          {/* Instant Switch Adjudication Result */}
          {switchFeedback && (
            <div className="mt-3 p-3.5 bg-slate-950 rounded-xl border border-cyan-800 text-xs space-y-2 animate-fade-in">
              <div className="flex justify-between items-center text-cyan-400 font-bold">
                <span>Switch Response: {switchFeedback.claimStatus}</span>
                <span className="text-[10px] text-slate-400 font-mono">{switchFeedback.transactionId}</span>
              </div>

              <div className="text-[11px] text-slate-300">
                Total: <span className="font-mono text-white">R{(switchFeedback.totalClaimAmountZAR ?? 0).toFixed(2)}</span> • Scheme Paid:{' '}
                <span className="font-mono text-emerald-400 font-bold">R{(switchFeedback.paidAmountZAR ?? 0).toFixed(2)}</span> • Co-pay:{' '}
                <span className="font-mono text-amber-400 font-bold">R{(switchFeedback.coPaymentZAR ?? 0).toFixed(2)}</span>
              </div>

              {switchFeedback.rejectionReason && (
                <div className="text-amber-400 text-[11px] bg-amber-950/40 p-2 rounded border border-amber-900">
                  {switchFeedback.rejectionReason}
                </div>
              )}

              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                <span>EFT: {switchFeedback.remittanceAdvice?.eftReference}</span>
                <span>Date: {switchFeedback.remittanceAdvice?.paymentRunDate}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Electronic Claims History & Remittance Advice Inspector */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Electronic Claims History & Remittance Advice
            </h3>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {['ALL', 'Discovery', 'GEMS', 'Bonitas'].map((sc) => (
                <button
                  key={sc}
                  onClick={() => setFilterScheme(sc)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] min-h-[36px] transition ${
                    filterScheme === sc ? 'bg-cyan-600 text-white font-semibold' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                  }`}
                >
                  {sc}
                </button>
              ))}
            </div>
          </div>

          {/* Claims List Table */}
          <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
            {filteredClaims.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-sm font-medium">No claims yet</p>
                <p className="text-xs mt-1 text-slate-600">Submit a claim to get started</p>
              </div>
            )}
            {filteredClaims.map((claim) => (
              <div
                key={claim.id}
                onClick={() => setSelectedClaimDetails(claim)}
                className={`p-3 rounded-xl transition cursor-pointer flex items-center justify-between text-xs ${
                  selectedClaimDetails?.id === claim.id ? 'bg-slate-800 border border-cyan-800/60' : 'hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{claim.patientName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({claim.schemeName})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Ref: <span className="font-mono text-cyan-400">{claim.claimRef}</span> • {claim.submissionDate}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-white text-xs">R{(claim.totalClaimZAR ?? 0).toFixed(2)}</div>
                  <div className="mt-0.5">{getStatusBadge(claim.switchStatus)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Claim Inspector (EDI Breakdown) */}
          {selectedClaimDetails && (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  EDI Remittance Advice: {selectedClaimDetails.claimRef}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Batch: {selectedClaimDetails.batchNumber}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Patient:</span>
                  <span className="text-white font-medium">{selectedClaimDetails.patientName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Membership No:</span>
                  <span className="text-white font-mono">{selectedClaimDetails.membershipNumber}-{selectedClaimDetails.dependantCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Scheme Paid:</span>
                  <span className="text-emerald-400 font-mono font-bold">R{(selectedClaimDetails.paidZAR ?? 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Member Co-Pay:</span>
                  <span className="text-amber-400 font-mono font-bold">R{(selectedClaimDetails.coPayZAR ?? 0).toFixed(2)}</span>
                </div>
              </div>

              {selectedClaimDetails.rejectionReason && (
                <div className="p-2.5 bg-amber-950/40 rounded-lg border border-amber-900/60 text-amber-300 text-[11px]">
                  <strong>Scheme Adjudication Note:</strong> {selectedClaimDetails.rejectionReason}
                </div>
              )}

              {/* Itemized lines */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold block">Adjudicated Line Items:</span>
                {selectedClaimDetails.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-800 text-[11px]">
                    <div>
                      <span className="font-mono text-cyan-400 font-bold">{it.code}</span> - {it.description}
                    </div>
                    <div className="text-right font-mono">
                      Claimed: R{(it.amountZAR ?? 0).toFixed(2)} | <span className="text-emerald-400 font-bold">Paid: R{(it.paidZAR ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
