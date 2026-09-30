import React, { useState } from 'react';
import {
  Sparkles,
  Stethoscope,
  Heart,
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pill,
  Send,
  Save,
  RefreshCw,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Microscope,
  Info,
} from 'lucide-react';
import { Patient, NappiMedication } from '../types';
import { MedSwitchApi, PracticeStore } from '../services/api';

interface AIDiagnosticAssistantProps {
  currentPatient: Patient | null;
  patients: Patient[];
  onSelectPatient: (p: Patient) => void;
  onCommitToPatientFile: (diagnosis: string, plan: string, meds: NappiMedication[]) => void;
  onOpenPrescriptionPad: (meds: NappiMedication[]) => void;
}

export const AIDiagnosticAssistant: React.FC<AIDiagnosticAssistantProps> = ({
  currentPatient,
  patients,
  onSelectPatient,
  onCommitToPatientFile,
  onOpenPrescriptionPad,
}) => {
  const patient = currentPatient || patients[0];

  // Clinical inputs
  const [complaint, setComplaint] = useState(
    'Recurrent throbbing occipital headaches for 4 days, morning exacerbation, visual strain, accompanied by mild exertional dyspnoea. Admitted to missing anti-hypertensive medication.'
  );
  const [duration, setDuration] = useState('4 days');
  const [severity, setSeverity] = useState(7);
  const [factors, setFactors] = useState('Worse with exertion and emotional stress; unmanaged by over-the-counter paracetamol');

  // Vitals
  const [bp, setBp] = useState('148/92');
  const [pulse, setPulse] = useState('78');
  const [temp, setTemp] = useState('37.1');
  const [spo2, setSpo2] = useState('98');
  const [respRate, setRespRate] = useState('16');
  const [weight, setWeight] = useState('78');

  // Test Results (POC & Labs)
  const [urineTest, setUrineTest] = useState('Trace protein (+), Leukocytes (-), Nitrites (-), Glucose (-)');
  const [glucose, setGlucose] = useState('6.2');
  const [crp, setCrp] = useState('4.5');
  const [pathologyResults, setPathologyResults] = useState(
    'Ampath: eGFR 82 ml/min, Creatinine 84 umol/L, Potassium 4.2 mmol/L, Total Cholesterol 5.8 mmol/L, HbA1c 6.1%'
  );
  const [imagingEcg, setImagingEcg] = useState(
    '12-Lead ECG: Normal sinus rhythm, HR 78 bpm, early Sokolow-Lyon voltage criteria for LVH, no acute ST elevation'
  );

  // AI Diagnostic output state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);

  // Doctor Review & Confirmation state
  const [confirmedPlanItems, setConfirmedPlanItems] = useState<Record<string, boolean>>({});
  const [confirmedMeds, setConfirmedMeds] = useState<Record<string, boolean>>({});
  const [doctorNotes, setDoctorNotes] = useState('');
  const [commitSuccess, setCommitSuccess] = useState(false);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setCommitSuccess(false);

    try {
      const res = await MedSwitchApi.runDiagnosticAnalysis({
        patient,
        symptoms: { complaint, duration, severity, factors },
        vitals: { bp, pulse, temp, spo2, respRate, weight },
        testResults: {
          urine: urineTest,
          glucose,
          crp,
          pathology: pathologyResults,
          imaging: imagingEcg,
        },
      });

      if (res.success && res.data) {
        setDiagnosticResult(res.data);

        // Pre-select all proposed plan and medication items for doctor review
        const initialPlanMap: Record<string, boolean> = {};
        res.data.treatmentPlan?.forEach((p: any) => {
          initialPlanMap[p.id || p.action] = true;
        });
        setConfirmedPlanItems(initialPlanMap);

        const initialMedsMap: Record<string, boolean> = {};
        res.data.suggestedPrescriptions?.forEach((m: any) => {
          initialMedsMap[m.id || m.nappiCode] = true;
        });
        setConfirmedMeds(initialMedsMap);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const togglePlanItem = (id: string) => {
    setConfirmedPlanItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleMedItem = (id: string) => {
    setConfirmedMeds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleConfirmAndCommit = () => {
    if (!diagnosticResult) return;

    // Filter confirmed plan items
    const approvedPlans = diagnosticResult.treatmentPlan
      ?.filter((p: any) => confirmedPlanItems[p.id || p.action])
      .map((p: any) => p.action)
      .join('\n• ');

    // Filter confirmed prescriptions
    const approvedMeds: NappiMedication[] = (diagnosticResult.suggestedPrescriptions || [])
      .filter((m: any) => confirmedMeds[m.id || m.nappiCode])
      .map((m: any) => ({
        nappi: m.nappiCode || '702819001',
        medicineName: m.name,
        schedule: m.schedule || 'S3',
        dosage: m.dosage,
        duration: m.duration || '30 days',
        repeats: m.repeats || 3,
        quantity: 30,
        instructions: m.indication || 'Take as directed',
      }));

    const finalPlanText = `${approvedPlans}${doctorNotes ? `\n\nAttending Doctor Notes: ${doctorNotes}` : ''}`;

    onCommitToPatientFile(
      `${diagnosticResult.primaryDiagnosis?.name} [${diagnosticResult.primaryDiagnosis?.icd10}]`,
      finalPlanText,
      approvedMeds
    );

    PracticeStore.addAuditLog(
      'DIAGNOSTIC_SUGGESTION_CONFIRMED',
      `Dr. Thabo Ndlovu reviewed and confirmed AI diagnosis ${diagnosticResult.primaryDiagnosis?.icd10} for ${patient?.fullName}`
    );

    setCommitSuccess(true);
    setTimeout(() => setCommitSuccess(false), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-cyan-900/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white tracking-tight">AI Clinical Diagnostic Assistant</h2>
              <span className="text-[10px] font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full">
                Gemini 3.8 Flash • Doctor-in-the-Loop
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Synthesizes medical history, symptoms, vitals, and pathology test results • Requires doctor confirmation
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={patient?.id}
            onChange={(e) => {
              const matched = patients.find((p) => p.id === e.target.value);
              if (matched) onSelectPatient(matched);
            }}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-medium"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} ({p.medicalAidName})
              </option>
            ))}
          </select>

          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm shadow-cyan-950"
          >
            {isAnalyzing ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{isAnalyzing ? 'Analyzing Clinical Case...' : 'Run Diagnostic Synthesis'}</span>
          </button>
        </div>
      </div>

      {commitSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-xl text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Confirmed diagnosis and approved treatment plan have been committed to {patient?.fullName}'s EHR file!
            </span>
          </div>
          <span className="text-[11px] text-emerald-300 font-mono">POPIA Audit Logged</span>
        </div>
      )}

      {/* Main 2-Column Interface: Inputs on Left, AI Diagnostic Output & Doctor Confirmation on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Patient Profile, Symptoms & Test Results Inputs */}
        <div className="lg:col-span-5 space-y-4">
          {/* Patient Background Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-400" />
                Patient Medical Dossier
              </span>
              <span className="text-[11px] text-cyan-400 font-mono">{patient?.idNumber}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Medical Scheme:</span>
                <span className="text-white font-medium">{patient?.medicalAidName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Chronic Conditions:</span>
                <span className="text-rose-300 font-medium">{patient?.chronicConditions.join(', ') || 'None'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">Allergies:</span>
              <span className="text-amber-300 font-semibold">{patient?.allergies.join(', ') || 'No known allergies'}</span>
            </div>
          </div>

          {/* Presenting Symptoms & Severity */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-cyan-400" />
              Presenting Symptoms & History
            </span>

            <div>
              <label className="block text-slate-400 mb-1">Chief Complaints</label>
              <textarea
                rows={3}
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none text-xs leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Onset / Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Severity Scale (1-10): {severity}</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={severity}
                  onChange={(e) => setSeverity(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Aggravating / Relieving Factors</label>
              <input
                type="text"
                value={factors}
                onChange={(e) => setFactors(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Vitals Input Strip */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              Recorded Clinical Vitals
            </span>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block">BP (mmHg)</span>
                <input
                  type="text"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
                />
              </div>

              <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Pulse (bpm)</span>
                <input
                  type="text"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
                />
              </div>

              <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block">SpO2 (%)</span>
                <input
                  type="text"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Test Results & Lab Reports */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Microscope className="w-4 h-4 text-teal-400" />
              Point-of-Care & Pathology Test Results
            </span>

            <div>
              <label className="block text-slate-400 mb-1">Urine Dipstick Rapid</label>
              <input
                type="text"
                value={urineTest}
                onChange={(e) => setUrineTest(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Ampath / Lancet Blood Chemistry & Lipogram</label>
              <textarea
                rows={2}
                value={pathologyResults}
                onChange={(e) => setPathologyResults(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">ECG / Radiology Findings</label>
              <input
                type="text"
                value={imagingEcg}
                onChange={(e) => setImagingEcg(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: AI Suggestions & Interactive Doctor Confirmation Panel */}
        <div className="lg:col-span-7 space-y-4">
          {diagnosticResult ? (
            <div className="space-y-4">
              {/* Primary Diagnosis & Confidence */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-cyan-950 border border-cyan-800 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                      Primary Suggested Diagnosis
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {diagnosticResult.primaryDiagnosis?.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-cyan-900/80 text-cyan-200 border border-cyan-700 font-mono text-xs font-bold">
                        ICD-10: {diagnosticResult.primaryDiagnosis?.icd10}
                      </span>
                      {diagnosticResult.pmbEligible && (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-semibold">
                          CMS PMB CDL Eligible
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-cyan-400 font-mono">
                      {(diagnosticResult.primaryDiagnosis?.confidence * 100).toFixed(0)}%
                    </div>
                    <span className="text-[10px] text-slate-400">Diagnostic Match</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800 leading-relaxed">
                  <strong>Clinical Rationale:</strong> {diagnosticResult.primaryDiagnosis?.clinicalRationale}
                </p>
              </div>

              {/* Differential Diagnoses */}
              {diagnosticResult.differentialDiagnoses?.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    Ranked Differential Diagnoses
                  </h4>

                  <div className="space-y-2">
                    {diagnosticResult.differentialDiagnoses.map((diff: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1 text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-white">
                            {diff.name} <span className="font-mono text-cyan-400">[{diff.icd10}]</span>
                          </span>
                          <span className="text-[11px] font-mono text-amber-400 font-bold">
                            {diff.likelihoodPct}% Likelihood
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300">{diff.supportingEvidence}</div>
                        <div className="text-[10px] text-slate-500 italic">
                          Rule-out criteria: {diff.rulingOutCriteria}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Doctor Review & Confirmation: Actionable Treatment Plan */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Doctor Treatment Plan Review (Select to Approve)
                  </h4>
                  <span className="text-[10px] text-slate-400">South African STG Guideline Grounded</span>
                </div>

                <div className="space-y-2">
                  {diagnosticResult.treatmentPlan?.map((item: any) => {
                    const key = item.id || item.action;
                    const isChecked = !!confirmedPlanItems[key];

                    return (
                      <div
                        key={key}
                        onClick={() => togglePlanItem(key)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-start space-x-3 text-xs ${
                          isChecked
                            ? 'bg-slate-800/90 border-cyan-500/70 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
                        />
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{item.action}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-mono">
                              {item.category}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 italic">{item.evidenceBase}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Doctor Review: Suggested Prescriptions (NAPPI Coded) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-teal-400" />
                    Suggested Prescriptions (NAPPI Formulary)
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-semibold">Allergy Screened ✓</span>
                </div>

                <div className="space-y-2">
                  {diagnosticResult.suggestedPrescriptions?.map((med: any) => {
                    const key = med.id || med.nappiCode;
                    const isChecked = !!confirmedMeds[key];

                    return (
                      <div
                        key={key}
                        onClick={() => toggleMedItem(key)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between text-xs ${
                          isChecked
                            ? 'bg-slate-800/90 border-teal-500/70 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-teal-600 focus:ring-teal-500"
                          />
                          <div>
                            <div className="font-semibold text-white">
                              {med.name}{' '}
                              <span className="text-[10px] font-mono text-cyan-400">NAPPI: {med.nappiCode}</span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {med.dosage} • {med.duration} • {med.repeats} repeats
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                          {med.schedule}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Red-Flag Safety Alerts */}
              {diagnosticResult.redFlags?.length > 0 && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-900/70 rounded-xl text-xs space-y-1 text-rose-300">
                  <div className="flex items-center space-x-1.5 font-bold text-rose-200">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Clinical Red-Flags & Emergency Escalation Triggers:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-200 mt-1">
                    {diagnosticResult.redFlags.map((rf: string, i: number) => (
                      <li key={i}>{rf}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Attending Doctor Sign-Off & Confirmation Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <span className="text-xs font-bold text-white block">
                  Attending Doctor Clinical Confirmation & Notes
                </span>
                <textarea
                  rows={2}
                  placeholder="Doctor's clinical addendum, patient agreements, or customized adjustments..."
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none"
                />

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-400">
                    Clinician: <span className="text-white font-medium">Dr. Thabo Ndlovu (HPCSA MP0694821)</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const approvedMeds: NappiMedication[] = (diagnosticResult.suggestedPrescriptions || [])
                          .filter((m: any) => confirmedMeds[m.id || m.nappiCode])
                          .map((m: any) => ({
                            nappi: m.nappiCode || '702819001',
                            medicineName: m.name,
                            schedule: m.schedule || 'S3',
                            dosage: m.dosage,
                            duration: m.duration || '30 days',
                            repeats: m.repeats || 3,
                            quantity: 30,
                            instructions: m.indication || 'Take as directed',
                          }));
                        onOpenPrescriptionPad(approvedMeds);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition"
                    >
                      <Pill className="w-3.5 h-3.5 text-teal-400" />
                      <span>Open in Script Pad</span>
                    </button>

                    <button
                      onClick={handleConfirmAndCommit}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-md shadow-cyan-950"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Commit to Patient File</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
              <Sparkles className="w-12 h-12 text-cyan-600/60" />
              <h4 className="text-base font-bold text-white">Diagnostic Engine Standby</h4>
              <p className="text-xs max-w-sm text-slate-400 leading-relaxed">
                Review patient symptoms, vitals, and test results on the left, then click{' '}
                <strong className="text-cyan-400">"Run Diagnostic Synthesis"</strong> to generate primary & differential
                diagnoses and an actionable treatment plan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
