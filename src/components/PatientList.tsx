import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Heart,
  AlertTriangle,
  CreditCard,
  FileText,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Activity,
  Send,
} from 'lucide-react';
import { Patient } from '../types';
import { MedSwitchApi } from '../services/api';

interface PatientListProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onOpenOnboarding: () => void;
  onStartConsultationForPatient: (patient: Patient) => void;
  onOpenSwitchForPatient: (patient: Patient) => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  onSelectPatient,
  onOpenOnboarding,
  onStartConsultationForPatient,
  onOpenSwitchForPatient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScheme, setSelectedScheme] = useState('ALL');
  const [selectedPatientFile, setSelectedPatientFile] = useState<Patient | null>(patients[0] || null);
  const [eligibilityChecking, setEligibilityChecking] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);

  const filtered = patients.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.idNumber.includes(searchTerm) ||
      p.medicalAidNumber.includes(searchTerm) ||
      p.phone.includes(searchTerm);

    if (!matchesSearch) return false;
    if (selectedScheme === 'ALL') return true;
    return p.medicalAidName === selectedScheme;
  });

  const checkEligibility = async (patient: Patient) => {
    setEligibilityChecking(true);
    setEligibilityResult(null);
    try {
      const res = await MedSwitchApi.verifyEligibility({
        schemeCode: patient.medicalAidName,
        membershipNumber: patient.medicalAidNumber,
        dependantCode: patient.dependantCode,
        patientIdNumber: patient.idNumber,
      });
      if (res.success) {
        setEligibilityResult(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEligibilityChecking(false);
    }
  };

  const schemes = ['ALL', 'Discovery Health', 'GEMS', 'Bonitas', 'Momentum Health', 'Fedhealth (Medscheme)', 'Private / Cash'];

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Master Patient Index & EHR Records</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compliant with Healthbridge & South African HPCSA electronic record guidelines • POPIA protected
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenOnboarding}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard Patient (SA ID)</span>
          </button>
        </div>
      </div>

      {/* Main 2-column layout: Directory on left, Detailed EHR file on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Patient List Directory */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[740px]">
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient name, SA ID, scheme no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {schemes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedScheme(s)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition ${
                    selectedScheme === s
                      ? 'bg-cyan-600 text-white font-medium'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s === 'ALL' ? 'All Schemes' : s.replace(' (Government Employees)', '')}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-800/80 overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No patients match the search criteria.
              </div>
            ) : (
              filtered.map((patient) => {
                const isSelected = selectedPatientFile?.id === patient.id;
                return (
                  <button
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatientFile(patient);
                      setEligibilityResult(null);
                    }}
                    className={`w-full text-left p-3.5 transition flex items-center justify-between ${
                      isSelected ? 'bg-slate-800/90 border-l-4 border-cyan-500' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white text-xs">{patient.fullName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({patient.gender[0]}, {new Date().getFullYear() - parseInt(patient.dob.substring(0, 4))}y)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        ID: {patient.idNumber}
                      </div>
                      <div className="text-[11px] text-cyan-400 font-medium mt-0.5">
                        {patient.medicalAidName} {patient.medicalAidNumber && `• #${patient.medicalAidNumber}`}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {patient.chronicAuthorised && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-medium">
                          PMB Active
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">{patient.registeredDate}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Detailed Patient EHR Dossier */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm overflow-y-auto h-[740px]">
          {selectedPatientFile ? (
            <div className="space-y-6">
              {/* Patient Header Card */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-cyan-900/30">
                    {selectedPatientFile.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {selectedPatientFile.fullName}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                        {selectedPatientFile.gender}
                      </span>
                    </h3>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      National ID: {selectedPatientFile.idNumber} • DOB: {selectedPatientFile.dob}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onStartConsultationForPatient(selectedPatientFile)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Open Consultation</span>
                  </button>
                  <button
                    onClick={() => onOpenSwitchForPatient(selectedPatientFile)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Switch Claims</span>
                  </button>
                </div>
              </div>

              {/* Medical Aid & Switch Verification Box */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-white text-xs">Medical Scheme & Switch Status</span>
                  </div>

                  <button
                    onClick={() => checkEligibility(selectedPatientFile)}
                    disabled={eligibilityChecking}
                    className="bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                  >
                    {eligibilityChecking ? (
                      <span className="animate-spin w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>{eligibilityChecking ? 'Connecting Switch...' : 'Verify Real-time Eligibility'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Scheme:</span>
                    <span className="text-white font-medium">{selectedPatientFile.medicalAidName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Member Number:</span>
                    <span className="text-white font-mono">{selectedPatientFile.medicalAidNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Dependant:</span>
                    <span className="text-white font-mono">{selectedPatientFile.dependantCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Savings Balance:</span>
                    <span className="text-emerald-400 font-bold">
                      R{selectedPatientFile.savingsBalanceZAR?.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Eligibility Result Banner */}
                {eligibilityResult && (
                  <div className="mt-3 p-3 bg-slate-900/90 rounded-xl border border-emerald-500/40 text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-emerald-400 font-semibold">
                      <span>✓ {eligibilityResult.statusMessage}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{eligibilityResult.switchReference}</span>
                    </div>
                    <div className="text-slate-300 text-[11px]">
                      Administrator: <span className="text-white">{eligibilityResult.administrator}</span> • Plan:{' '}
                      <span className="text-white">{eligibilityResult.dependant?.planName}</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Savings Available: <span className="text-emerald-300 font-mono">R{eligibilityResult.balances?.savingsAccountZAR?.toFixed(2)}</span> • Acute Medicine Limit: R{eligibilityResult.balances?.availableAcuteZAR?.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-cyan-300 italic">
                      {eligibilityResult.coPayments?.gpConsultationNetwork}
                    </div>
                  </div>
                )}
              </div>

              {/* Chronic Conditions & Allergies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-white mb-2">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span>Chronic PMB Conditions</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPatientFile.chronicConditions.length > 0 ? (
                      selectedPatientFile.chronicConditions.map((c) => (
                        <span key={c} className="px-2 py-0.5 rounded bg-rose-950/70 border border-rose-800 text-rose-200 text-xs">
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No chronic conditions registered</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-white mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Known Drug Allergies</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPatientFile.allergies.length > 0 ? (
                      selectedPatientFile.allergies.map((a) => (
                        <span key={a} className="px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800 text-amber-200 text-xs font-semibold">
                          ⚠️ {a}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-emerald-400 font-medium">✓ No Known Drug Allergies (NKDA)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 text-xs space-y-2">
                <span className="font-semibold text-white block">Patient Contact & Location</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{selectedPatientFile.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{selectedPatientFile.email || 'None on file'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="truncate">{selectedPatientFile.address || 'Gauteng, South Africa'}</span>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-3 text-xs flex justify-between items-center">
                <div>
                  <span className="text-slate-400 text-[11px] block">Emergency Contact:</span>
                  <span className="text-white font-medium">
                    {selectedPatientFile.emergencyContact.name} ({selectedPatientFile.emergencyContact.relationship})
                  </span>
                </div>
                <span className="text-cyan-400 font-mono">{selectedPatientFile.emergencyContact.phone}</span>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">Select a patient to inspect their full medical dossier</div>
          )}
        </div>
      </div>
    </div>
  );
};
