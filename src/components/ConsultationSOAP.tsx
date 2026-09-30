import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Sparkles,
  Mic,
  MicOff,
  FileText,
  CreditCard,
  Pill,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Share2,
} from 'lucide-react';
import { Patient, Appointment, ICD10Code, TariffItem, NappiMedication } from '../types';
import { COMMON_ICD10, COMMON_TARIFFS, COMMON_NAPPI } from '../services/dataService';
import { MedSwitchApi, PracticeStore } from '../services/api';

interface ConsultationSOAPProps {
  currentPatient: Patient | null;
  patients: Patient[];
  onSelectPatient: (p: Patient) => void;
  onOpenSwitchWithClaim: (claimData: any) => void;
  onOpenRxWithItems: (rxItems: NappiMedication[]) => void;
  isVoiceActiveGlobal: boolean;
}

export const ConsultationSOAP: React.FC<ConsultationSOAPProps> = ({
  currentPatient,
  patients,
  onSelectPatient,
  onOpenSwitchWithClaim,
  onOpenRxWithItems,
  isVoiceActiveGlobal,
}) => {
  const patient = currentPatient || patients[0];

  // Vitals
  const [bp, setBp] = useState('132/86');
  const [pulse, setPulse] = useState('74');
  const [temp, setTemp] = useState('36.8');
  const [spo2, setSpo2] = useState('98');
  const [weight, setWeight] = useState('74.5');
  const [glucose, setGlucose] = useState('5.6');

  // SOAP State
  const [subjective, setSubjective] = useState(
    'Patient presents with a 4-day history of recurrent throbbing occipital headaches, worse in the mornings. Complains of mild fatigue and visual strain. Denies chest pain, shortness of breath, or focal neurological deficits. Admitted to missing morning anti-hypertensive medication while travelling.'
  );
  const [objective, setObjective] = useState(
    'Well-nourished, alert, in no acute distress. Vitals as recorded. CVS: S1 and S2 present, no murmurs or carotid bruits. Resp: Bilateral vesicular breath sounds, no rhonchi or crepitations. Abdomen: Soft, non-tender. CNS: Cranial nerves II-XII grossly intact, fundoscopy reveals mild arteriolar narrowing, no papilloedema.'
  );
  const [assessment, setAssessment] = useState(
    'Stage 2 Essential Hypertension with suboptimal medication compliance. Tension-type headache secondary to elevated systolic pressure.'
  );
  const [plan, setPlan] = useState(
    '1. Reinforce daily medication adherence. 2. Continue Amlodipine 5mg mane; add Hydrochlorothiazide 12.5mg if BP remains >140/90 at review. 3. Home BP monitoring log twice daily. 4. Lifestyle: low-sodium DASH diet, 30 min brisk walk. 5. Review in 14 days; seek emergency care if headache worsens with visual aura.'
  );

  // Diagnostic Codes & Tariffs
  const [selectedIcd10, setSelectedIcd10] = useState<ICD10Code[]>([
    { code: 'I10', description: 'Essential (primary) hypertension (PMB CDL)', isPrimary: true },
    { code: 'R51', description: 'Headache, unspecified', isPrimary: false },
  ]);

  const [selectedTariffs, setSelectedTariffs] = useState<TariffItem[]>([
    { code: '0190', description: 'Consultation: Established patient in rooms (standard GP)', units: 1, rateZAR: 580.0 },
    { code: '0001', description: 'Point-of-care rapid diagnostics: Urine dipstick / Blood glucose', units: 1, rateZAR: 110.0 },
  ]);

  const [selectedMeds, setSelectedMeds] = useState<NappiMedication[]>([
    {
      nappi: '702819001',
      medicineName: 'Amlodipine 5mg Tablets',
      schedule: 'S3',
      dosage: '1 tablet once daily in the morning',
      duration: '30 days',
      repeats: 5,
      quantity: 30,
      instructions: 'Take in the morning with a glass of water.',
    },
  ]);

  // AI & Voice Assistant States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [isDictating, setIsDictating] = useState(false);
  const [dictationTarget, setDictationTarget] = useState<'subjective' | 'objective' | 'plan'>('subjective');
  const [speechFeedback, setSpeechFeedback] = useState('');

  // Speech Recognition Hook
  useEffect(() => {
    let recognition: any = null;

    if (isDictating || isVoiceActiveGlobal) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-ZA'; // South African English

        recognition.onstart = () => {
          setSpeechFeedback('Dictation active: Speak naturally in rooms...');
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }

          if (event.results[event.results.length - 1].isFinal) {
            if (dictationTarget === 'subjective') {
              setSubjective((prev) => `${prev} ${currentTranscript.trim()}`);
            } else if (dictationTarget === 'objective') {
              setObjective((prev) => `${prev} ${currentTranscript.trim()}`);
            } else {
              setPlan((prev) => `${prev} ${currentTranscript.trim()}`);
            }
            setSpeechFeedback(`Transcribed: "${currentTranscript.trim()}"`);
          }
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition error', err);
          setSpeechFeedback('Voice dictation paused. Click Mic to resume.');
          setIsDictating(false);
        };

        try {
          recognition.start();
        } catch (e) {
          console.error(e);
        }
      } else {
        setSpeechFeedback('Web Speech API not supported in this browser; text typing available.');
      }
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {}
      }
    };
  }, [isDictating, isVoiceActiveGlobal, dictationTarget]);

  // Call Server-side Gemini AI for clinical treatment plan
  const handleGenerateAiPlan = async () => {
    setIsAiLoading(true);
    setAiSuggestions(null);
    try {
      const res = await MedSwitchApi.getAITreatmentPlan({
        patientName: patient?.fullName || 'Sipho Zulu',
        age: patient ? new Date().getFullYear() - parseInt(patient.dob.substring(0, 4)) : 40,
        gender: patient?.gender || 'Male',
        medicalAid: patient?.medicalAidName || 'Discovery Health',
        chronicConditions: patient?.chronicConditions || [],
        complaints: subjective,
        vitals: { bp, pulse, temp, spo2, weight },
        allergies: patient?.allergies || [],
      });

      if (res.success && res.data) {
        setAiSuggestions(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Format with AI SOAP Assistant
  const handleFormatAiSoap = async () => {
    setIsAiLoading(true);
    try {
      const res = await MedSwitchApi.getAISOAPNotes({
        roughNotes: `${subjective} \n Examination: ${objective} \n Vitals: BP ${bp}, HR ${pulse}`,
        patientSummary: `${patient?.fullName}, ${patient?.medicalAidName}`,
      });

      if (res.success && res.data) {
        if (res.data.subjective) setSubjective(res.data.subjective);
        if (res.data.objective) setObjective(res.data.objective);
        if (res.data.assessment) setAssessment(res.data.assessment);
        if (res.data.plan) setPlan(res.data.plan);
        if (res.data.icd10Codes?.length) setSelectedIcd10(res.data.icd10Codes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyAiSuggestion = (sugg: any) => {
    if (sugg.primaryDiagnosis) {
      setAssessment(sugg.primaryDiagnosis);
    }
    if (sugg.treatmentPlan) {
      setPlan(sugg.treatmentPlan.join('\n• '));
    }
    if (sugg.suggestedMedications?.length) {
      const newMeds: NappiMedication[] = sugg.suggestedMedications.map((m: any) => ({
        nappi: m.nappiCode || '702819001',
        medicineName: m.name,
        schedule: m.schedule || 'S3',
        dosage: m.dosage,
        duration: m.duration,
        repeats: 3,
        quantity: 30,
        instructions: m.rationale || 'As directed',
      }));
      setSelectedMeds([...selectedMeds, ...newMeds]);
    }
  };

  const totalTariffsZAR = selectedTariffs.reduce((acc, t) => acc + t.rateZAR * t.units, 0);

  const handleExportWord = () => {
    const docHtml = `
      <div class="header-box">
        <h2>DR. THABO NDLOVU | MBChB (Wits) FCFP (SA)</h2>
        <p>Family Physician & General Practitioner • Practice BHF No: 0548921 • HPCSA: MP 0694821</p>
        <p>Rosebank Medical Centre, 14 Hood Ave, Rosebank, 2196 • Tel: +27 11 880 2000</p>
      </div>

      <h3>CLINICAL CONSULTATION & ENCOUNTER SUMMARY</h3>
      <p><strong>Patient Name:</strong> ${patient?.fullName} | <strong>ID:</strong> ${patient?.idNumber} | <strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Medical Scheme:</strong> ${patient?.medicalAidName} (No: ${patient?.medicalAidNumber || 'N/A'}) - Dep: ${patient?.dependantCode || '00'}</p>
      <p><strong>Vitals:</strong> BP: ${bp} mmHg | Pulse: ${pulse} bpm | Temp: ${temp} °C | SpO2: ${spo2}% | Wt: ${weight} kg</p>

      <h4>SUBJECTIVE HISTORY:</h4>
      <p>${subjective}</p>

      <h4>OBJECTIVE EXAMINATION:</h4>
      <p>${objective}</p>

      <h4>ASSESSMENT & DIAGNOSES:</h4>
      <p>${assessment}</p>
      <p><strong>Primary ICD-10 Code:</strong> ${selectedIcd10[0]?.code} - ${selectedIcd10[0]?.description}</p>

      <h4>MANAGEMENT PLAN & MEDICATIONS:</h4>
      <p>${plan}</p>

      <table>
        <thead>
          <tr>
            <th>NAPPI Code</th>
            <th>Medication Name</th>
            <th>Schedule</th>
            <th>Dosage & Instructions</th>
            <th>Repeats</th>
          </tr>
        </thead>
        <tbody>
          ${selectedMeds
            .map(
              (m) =>
                `<tr><td>${m.nappi}</td><td>${m.medicineName}</td><td>${m.schedule}</td><td>${m.dosage} (${m.instructions})</td><td>${m.repeats}</td></tr>`
            )
            .join('')}
        </tbody>
      </table>

      <p style="margin-top: 30pt;">_______________________________<br/><strong>Dr. Thabo Ndlovu</strong><br/>Digital Electronic Signature (HPCSA Compliant)</p>
    `;

    MedSwitchApi.exportToWord(`Consultation_${patient?.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`, docHtml);
  };

  const handleLaunchSwitchClaim = () => {
    const claimData = {
      patientId: patient?.id,
      patientName: patient?.fullName,
      schemeCode: patient?.medicalAidName,
      membershipNumber: patient?.medicalAidNumber,
      dependantCode: patient?.dependantCode,
      serviceDate: new Date().toISOString().slice(0, 10),
      tariffCodes: selectedTariffs.map((t) => ({ code: t.code, units: t.units, amountZAR: t.rateZAR })),
      nappiCodes: selectedMeds.map((m) => ({ nappi: m.nappi, quantity: 1, amountZAR: 180.0 })),
      icd10Primary: selectedIcd10[0]?.code || 'I10',
      isPMB: selectedIcd10.some((c) => c.description.includes('PMB')),
    };

    onOpenSwitchWithClaim(claimData);
  };

  return (
    <div className="space-y-6">
      {/* Patient Switcher & Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-cyan-900/30">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Active Clinical Consultation</h2>
                <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full">
                  SOAP Charting Live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Patient: <span className="text-white font-medium">{patient?.fullName}</span> • SA ID:{' '}
                <span className="font-mono text-cyan-400">{patient?.idNumber}</span> • {patient?.medicalAidName}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 flex-wrap">
            {/* Free Speech Control Dictation */}
            <button
              onClick={() => setIsDictating(!isDictating)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border ${
                isDictating
                  ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Dictate consultation notes hands-free using microphone"
            >
              {isDictating ? <Mic className="w-4 h-4 text-rose-400" /> : <MicOff className="w-4 h-4" />}
              <span>{isDictating ? 'Dictating...' : 'Speech Dictate'}</span>
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={handleGenerateAiPlan}
              disabled={isAiLoading}
              className="bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAiLoading ? 'Analyzing Case...' : 'AI Clinical Plan'}</span>
            </button>

            {/* Export to Word */}
            <button
              onClick={handleExportWord}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition"
              title="Export complete SOAP note and prescription to Microsoft Word (.doc)"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export Word (.doc)</span>
            </button>
          </div>
        </div>

        {/* Speech Dictation Feedback Line */}
        {speechFeedback && (
          <div className="mt-3 py-1.5 px-3 bg-slate-800/80 rounded-lg border border-slate-700 text-[11px] text-cyan-300 flex items-center justify-between">
            <span>🎙️ {speechFeedback}</span>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Target Field:</span>
              {(['subjective', 'objective', 'plan'] as const).map((tgt) => (
                <button
                  key={tgt}
                  onClick={() => setDictationTarget(tgt)}
                  className={`capitalize px-2 py-0.5 rounded text-[10px] ${
                    dictationTarget === tgt ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tgt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Patient Vitals Entry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 mt-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-medium">BP (mmHg)</span>
            <input
              type="text"
              value={bp}
              onChange={(e) => setBp(e.target.value)}
              className="w-full bg-transparent text-white font-bold text-sm focus:outline-none font-mono"
            />
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-medium">Heart Rate (bpm)</span>
            <input
              type="text"
              value={pulse}
              onChange={(e) => setPulse(e.target.value)}
              className="w-full bg-transparent text-white font-bold text-sm focus:outline-none font-mono"
            />
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-medium">Temp (°C)</span>
            <input
              type="text"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              className="w-full bg-transparent text-white font-bold text-sm focus:outline-none font-mono"
            />
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-medium">SpO2 (%)</span>
            <input
              type="text"
              value={spo2}
              onChange={(e) => setSpo2(e.target.value)}
              className="w-full bg-transparent text-white font-bold text-sm focus:outline-none font-mono"
            />
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-medium">Weight (kg)</span>
            <input
              type="text"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-transparent text-white font-bold text-sm focus:outline-none font-mono"
            />
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-medium">Glucose (mmol/L)</span>
            <input
              type="text"
              value={glucose}
              onChange={(e) => setGlucose(e.target.value)}
              className="w-full bg-transparent text-white font-bold text-sm focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* AI Clinical Treatment Plan Suggestions Card (When loaded) */}
      {aiSuggestions && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-cyan-950 border border-cyan-800/60 rounded-2xl p-5 shadow-lg space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-spin-slow" />
              <h3 className="font-bold text-white text-sm">
                Gemini 3.8 Flash Clinical Decision Support (South African STG / EDL Guidelines)
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                aiSuggestions.triageLevel === 'Urgent' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-300'
              }`}>
                Triage: {aiSuggestions.triageLevel}
              </span>
              <button
                onClick={() => handleApplyAiSuggestion(aiSuggestions)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded-lg text-xs font-semibold transition"
              >
                Apply to Plan & Rx
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block font-semibold">Primary Diagnosis & ICD-10 Match:</span>
              <div className="text-white font-medium mt-0.5">{aiSuggestions.primaryDiagnosis}</div>

              {aiSuggestions.differentialDiagnoses?.length > 0 && (
                <div className="mt-2">
                  <span className="text-slate-400 text-[11px] block">Differential Diagnoses:</span>
                  <ul className="list-disc list-inside text-slate-300 space-y-0.5 mt-0.5 text-[11px]">
                    {aiSuggestions.differentialDiagnoses.map((d: string, idx: number) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block font-semibold">Actionable Treatment Plan:</span>
              <ul className="list-disc list-inside text-slate-200 space-y-1 mt-0.5 text-[11px]">
                {aiSuggestions.treatmentPlan?.map((step: string, idx: number) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>

              {aiSuggestions.redFlags?.length > 0 && (
                <div className="mt-2 p-2 bg-rose-950/40 rounded-lg border border-rose-900/60 text-rose-300 text-[11px]">
                  <strong>⚠️ Red Flags to Monitor:</strong> {aiSuggestions.redFlags.join(' • ')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main SOAP Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: SOAP Text Boxes */}
        <div className="lg:col-span-8 space-y-4">
          {/* Subjective */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">S</span>
                Subjective History (Presenting Complaints & Chronology)
              </label>
              <button
                onClick={() => setDictationTarget('subjective')}
                className={`text-[10px] px-2 py-0.5 rounded transition ${
                  dictationTarget === 'subjective' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dictate Here
              </button>
            </div>
            <textarea
              rows={4}
              value={subjective}
              onChange={(e) => setSubjective(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed"
            />
          </div>

          {/* Objective */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">O</span>
                Objective Findings (Physical Examination & Systems)
              </label>
              <button
                onClick={() => setDictationTarget('objective')}
                className={`text-[10px] px-2 py-0.5 rounded transition ${
                  dictationTarget === 'objective' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dictate Here
              </button>
            </div>
            <textarea
              rows={4}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed"
            />
          </div>

          {/* Assessment */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">A</span>
                Assessment & Clinical Synthesis
              </label>
              <button
                onClick={handleFormatAiSoap}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Auto-Format SOAP
              </button>
            </div>
            <textarea
              rows={3}
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed"
            />
          </div>

          {/* Plan */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">P</span>
                Management Plan & Follow-up Instructions
              </label>
              <button
                onClick={() => setDictationTarget('plan')}
                className={`text-[10px] px-2 py-0.5 rounded transition ${
                  dictationTarget === 'plan' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dictate Here
              </button>
            </div>
            <textarea
              rows={4}
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Right Column: ICD-10 Coding, Tariffs & Prescription Strip */}
        <div className="lg:col-span-4 space-y-4">
          {/* ICD-10 Diagnostics Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                South African ICD-10 Coding
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                BHF Required
              </span>
            </div>

            <div className="space-y-2 mb-3">
              {selectedIcd10.map((code) => (
                <div
                  key={code.code}
                  className="p-2 bg-slate-800/70 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-cyan-400 font-mono">{code.code}</span>
                    <div className="text-[11px] text-slate-300 leading-snug">{code.description}</div>
                  </div>
                  <button
                    onClick={() => setSelectedIcd10(selectedIcd10.filter((c) => c.code !== code.code))}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick add common ICD-10 */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Common Primary Care Codes:</span>
              <div className="flex flex-wrap gap-1">
                {COMMON_ICD10.slice(0, 4).map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      if (!selectedIcd10.some((x) => x.code === c.code)) {
                        setSelectedIcd10([...selectedIcd10, c]);
                      }
                    }}
                    className="text-[10px] bg-slate-800 hover:bg-slate-750 text-slate-300 px-2 py-0.5 rounded border border-slate-700"
                  >
                    +{c.code}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Billing Tariffs Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Medical Scheme Billing Tariffs
              </span>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                R{totalTariffsZAR.toFixed(2)}
              </span>
            </div>

            <div className="space-y-1.5 mb-3">
              {selectedTariffs.map((t) => (
                <div
                  key={t.code}
                  className="p-2 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white font-mono">{t.code}</span>
                    <span className="text-slate-400 text-[11px] block">{t.description}</span>
                  </div>
                  <span className="text-emerald-400 font-medium font-mono">R{t.rateZAR.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleLaunchSwitchClaim}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow-md shadow-cyan-950"
            >
              <CreditCard className="w-4 h-4" />
              <span>Submit Claim to Medical Aid Switch</span>
            </button>
          </div>

          {/* Prescriptions Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-teal-400" />
                Rx Items ({selectedMeds.length})
              </span>
              <button
                onClick={() => onOpenRxWithItems(selectedMeds)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Open Script Pad →
              </button>
            </div>

            <div className="space-y-1.5 mb-3">
              {selectedMeds.map((m) => (
                <div key={m.nappi} className="p-2 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-white">{m.medicineName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">NAPPI: {m.nappi}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {m.dosage} • {m.repeats} repeats
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onOpenRxWithItems(selectedMeds)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
            >
              <Pill className="w-3.5 h-3.5 text-teal-400" />
              <span>Issue Official Digital Script</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
