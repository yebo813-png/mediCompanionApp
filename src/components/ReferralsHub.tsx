import React, { useState } from 'react';
import {
  Share2,
  FileText,
  Sparkles,
  Download,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  Building,
  User,
} from 'lucide-react';
import { Patient, SpecialistReferral } from '../types';
import { MmediCompannionApi, PracticeStore } from '../services/api';

interface ReferralsHubProps {
  referrals: SpecialistReferral[];
  patients: Patient[];
  onReferralCreated: (ref: SpecialistReferral) => void;
}

export const ReferralsHub: React.FC<ReferralsHubProps> = ({
  referrals,
  patients,
  onReferralCreated,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [specialistType, setSpecialistType] = useState('Cardiologist');
  const [doctorName, setDoctorName] = useState('Dr. Kevin Moodley (Cardiologist)');
  const [hospital, setHospital] = useState('Netcare Rosebank Hospital, Suite 302');
  const [urgency, setUrgency] = useState<SpecialistReferral['urgency']>('Routine (Within 2 weeks)');
  const [reason, setReason] = useState('Resistant Hypertension & Echocardiogram Evaluation');
  const [clinicalSummary, setClinicalSummary] = useState(
    'Patient with Stage 2 Hypertension for 4 years on dual ACEi + CCB therapy. Persistent systolic elevations >155mmHg. ECG shows Sokolow-Lyon criteria positive for Left Ventricular Hypertrophy.'
  );
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
  const [activeTabReferral, setActiveTabReferral] = useState<SpecialistReferral | null>(referrals[0] || null);

  const patient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  const handleGenerateAiLetter = async () => {
    setIsAiGenerating(true);
    try {
      const res = await MmediCompannionApi.generateReferralLetter({
        patient,
        specialistType,
        reason,
        clinicalFindings: clinicalSummary,
        urgency,
      });

      if (res.success && res.data) {
        const fullLetter = `${res.data.letterHead}\n\n${res.data.recipient}\n\n${res.data.patientDetails}\n\n${res.data.clinicalNarrative}\n\nINVESTIGATIONS:\n${res.data.investigationsSummary}\n\n${res.data.urgencyNote}\n\n${res.data.signOff}`;
        setGeneratedLetter(fullLetter);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleCreateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    const newRef: SpecialistReferral = {
      id: `ref-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.fullName,
      patientIdNumber: patient.idNumber,
      specialistType,
      doctorName,
      hospital,
      urgency,
      reason,
      clinicalSummary,
      investigationsSummary: 'FBC, U&E, Lipid profile, resting 12-lead ECG attached.',
      motivationLetter:
        generatedLetter ||
        `Formal colleague referral from Dr. Thabo Ndlovu for ${patient.fullName}. Reason: ${reason}. Findings: ${clinicalSummary}.`,
      dateCreated: new Date().toISOString().slice(0, 10),
      status: 'Sent via Switch',
    };

    onReferralCreated(newRef);
    setActiveTabReferral(newRef);
    setGeneratedLetter(null);
  };

  const handleExportWord = (ref: SpecialistReferral) => {
    const docHtml = `
      <div class="header-box">
        <h2>DR. THABO NDLOVU | MBChB (Wits) FCFP (SA)</h2>
        <p>Family Physician & General Practitioner • Practice BHF No: 0548921 • HPCSA: MP 0694821</p>
        <p>Rosebank Medical Centre, 14 Hood Avenue, Rosebank, 2196 • Tel: +27 11 880 2000</p>
      </div>

      <h3>CONFIDENTIAL SPECIALIST REFERRAL LETTER</h3>
      <p><strong>To:</strong> ${ref.doctorName} (${ref.specialistType}) • ${ref.hospital}</p>
      <p><strong>Date:</strong> ${ref.dateCreated} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Urgency:</strong> ${ref.urgency}</p>

      <div style="background-color: #f1f5f9; padding: 10pt; margin: 10pt 0;">
        <p><strong>Patient Name:</strong> ${ref.patientName} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>ID:</strong> ${ref.patientIdNumber}</p>
        <p><strong>Reason for Referral:</strong> ${ref.reason}</p>
      </div>

      <h4>CLINICAL NARRATIVE & FINDINGS:</h4>
      <p style="white-space: pre-wrap;">${ref.motivationLetter}</p>

      <p style="margin-top: 30pt;">Warm collegial regards,<br/><br/>_______________________________<br/><strong>Dr. Thabo Ndlovu</strong><br/>MBChB, FCFP (SA)</p>
    `;

    MmediCompannionApi.exportToWord(`Referral_${ref.patientName.replace(/\s+/g, '_')}_${ref.specialistType}`, docHtml);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-900/30">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Auto Specialist Referrals & Motivation Letters</h2>
            <p className="text-xs text-slate-400 mt-1">
              Automated referral transmission • AI motivation letter drafting • Microsoft Word (.doc) integration
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Total Referrals Dispatched:</span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-white font-mono font-bold text-xs">
            {referrals.length}
          </span>
        </div>
      </div>

      {/* Main 2-column layout: Referral Generator on left, Referrals Dossier on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Referral Creator */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            Create New Specialist Referral
          </h3>

          <form onSubmit={handleCreateReferral} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Patient</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} (ID: {p.idNumber}) - {p.medicalAidName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Specialty</label>
                <select
                  value={specialistType}
                  onChange={(e) => {
                    setSpecialistType(e.target.value);
                    if (e.target.value === 'Cardiologist') {
                      setDoctorName('Dr. Kevin Moodley (Cardiologist)');
                      setHospital('Netcare Rosebank Hospital');
                    } else if (e.target.value === 'Orthopaedic Surgeon') {
                      setDoctorName('Dr. Sarah Van Zyl (Orthopaedics)');
                      setHospital('Wits Donald Gordon Medical Centre');
                    } else if (e.target.value === 'Radiologist') {
                      setDoctorName('Dr. Ahmed Cassim (Radiologist)');
                      setHospital('Morton & Partners / Lake Smit & Partners');
                    } else {
                      setDoctorName('Dr. P. Naidoo (Neurologist)');
                      setHospital('Mediclinic Morningside');
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="Cardiologist">Cardiologist</option>
                  <option value="Orthopaedic Surgeon">Orthopaedic Surgeon</option>
                  <option value="Neurologist">Neurologist</option>
                  <option value="Radiologist">Radiologist (MRI/CT)</option>
                  <option value="Pathologist">Pathologist (Ampath / Lancet)</option>
                  <option value="General Surgeon">General Surgeon</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Clinical Urgency</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none font-medium"
                >
                  <option value="Routine (Within 2 weeks)">Routine (Within 2 weeks)</option>
                  <option value="Urgent (Within 48h)">Urgent (Within 48h)</option>
                  <option value="Emergency (Immediate Transfer)">Emergency (Immediate Transfer)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Consultant & Hospital</label>
              <input
                type="text"
                value={`${doctorName} • ${hospital}`}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Reason for Referral</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Suspected Meniscus Tear & MRI Evaluation"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Clinical Findings & History</label>
              <textarea
                rows={3}
                value={clinicalSummary}
                onChange={(e) => setClinicalSummary(e.target.value)}
                placeholder="Clinical presentation, timeline, physical examination findings..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none"
                required
              />
            </div>

            {/* AI Generator Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleGenerateAiLetter}
                disabled={isAiGenerating}
                className="bg-indigo-950 text-indigo-300 border border-indigo-800 hover:bg-indigo-900 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isAiGenerating ? 'Drafting with Gemini AI...' : 'AI Generate Motivation Letter'}</span>
              </button>

              <button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Referral</span>
              </button>
            </div>
          </form>

          {/* AI Preview Letter if generated */}
          {generatedLetter && (
            <div className="p-3 bg-slate-950 rounded-xl border border-indigo-800 text-xs space-y-2 animate-fadeIn">
              <span className="font-semibold text-indigo-300 block">AI-Generated Formal Referral Draft:</span>
              <pre className="font-sans text-slate-300 text-[11px] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                {generatedLetter}
              </pre>
            </div>
          )}
        </div>

        {/* Right: Referral Ledger & Word Preview */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            Specialist Referrals Ledger
          </h3>

          <div className="divide-y divide-slate-800">
            {referrals.map((ref) => (
              <div
                key={ref.id}
                onClick={() => setActiveTabReferral(ref)}
                className={`p-3 rounded-xl transition cursor-pointer flex items-center justify-between text-xs ${
                  activeTabReferral?.id === ref.id ? 'bg-slate-800 border border-indigo-800/60' : 'hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{ref.patientName}</span>
                    <span className="text-[10px] text-cyan-400 font-medium">→ {ref.specialistType}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {ref.doctorName} • {ref.hospital}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{ref.dateCreated}</div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {ref.status}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportWord(ref);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    title="Export to Word"
                  >
                    <Download className="w-3 h-3" /> Word (.doc)
                  </button>
                </div>
              </div>
            ))}
          </div>

          {activeTabReferral && (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2 mt-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="font-bold text-white">Referral Dossier: {activeTabReferral.patientName}</span>
                <span className="text-[10px] text-cyan-400 font-medium">{activeTabReferral.urgency}</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                {activeTabReferral.motivationLetter}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
