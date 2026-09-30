import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  Play,
  Download,
  BookOpen,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { DoctorCPDCertificate } from '../types';

interface DoctorCPDTrackerProps {
  cpdCertificates: DoctorCPDCertificate[];
  onAddCertificate: (cert: DoctorCPDCertificate) => void;
}

export const DoctorCPDTracker: React.FC<DoctorCPDTrackerProps> = ({
  cpdCertificates,
  onAddCertificate,
}) => {
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // HPCSA 30 CEUs target calculation
  const totalPoints = cpdCertificates
    .filter((c) => c.status === 'COMPLETED')
    .reduce((acc, c) => acc + c.ceuPoints, 0);

  const ethicsPoints = cpdCertificates
    .filter((c) => c.status === 'COMPLETED' && c.category === 'Ethics, Human Rights & Medical Law')
    .reduce((acc, c) => acc + c.ceuPoints, 0);

  const clinicalPoints = totalPoints - ethicsPoints;

  // Realistic HPCSA accredited ethics & medical law test
  const quizQuestions = [
    {
      q: 'Under POPIA (Protection of Personal Information Act) Section 19 and HPCSA Booklet 10, what is required when transmitting electronic medical records to a medical aid switch?',
      options: [
        'Unencrypted email attachment is acceptable if marked confidential',
        'End-to-end encryption, verifiable audit logging, and lawful operator agreement with the switch',
        'Oral telephone consent without electronic record keeping',
        'No security protocols are required for healthcare providers in South Africa',
      ],
      correct: 1,
    },
    {
      q: 'Under the South African National Health Act, when can a clinician disclose confidential patient data without explicit consent?',
      options: [
        'Whenever an employer or insurance broker requests it verbally',
        'Under a court order, statutory reporting duty (notifiable condition), or imminent grave danger to public health',
        'To any family member who asks at reception',
        'Clinicians may never disclose confidential health data under any circumstances',
      ],
      correct: 1,
    },
    {
      q: 'What is the minimum annual CEU requirement mandated by the HPCSA for Medical Practitioners in South Africa?',
      options: [
        '10 CEUs with no ethics requirement',
        '30 CEUs per 12-month period, of which at least 5 CEUs must be in Ethics, Human Rights or Medical Law',
        '50 CEUs every 5 years',
        '100 CEUs per calendar year',
      ],
      correct: 1,
    },
    {
      q: 'When generating an electronic prescription under the SA Medicines and Related Substances Act, which detail is MANDATORY?',
      options: [
        "Patient's vehicle registration number",
        "Doctor's HPCSA registration number, BHF practice number, signature stamp, and full dosage instructions",
        'Only the trade name of the drug without dosage',
        'The pharmacy manager’s personal tax number',
      ],
      correct: 1,
    },
  ];

  const handleSelectAnswer = (idx: number) => {
    const updated = [...selectedAnswers];
    updated[currentQuestionIdx] = idx;
    setSelectedAnswers(updated);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < quizQuestions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      // Calculate score
      let correctCount = 0;
      selectedAnswers.forEach((ans, i) => {
        if (ans === quizQuestions[i].correct) correctCount++;
      });
      const scorePct = Math.round((correctCount / quizQuestions.length) * 100);
      setQuizScore(scorePct);
      setQuizFinished(true);

      if (scorePct >= 75) {
        // Award new Certificate
        const newCert: DoctorCPDCertificate = {
          id: `cpd-${Date.now()}`,
          title: 'HPCSA 2026 Medical Ethics, Informed Consent & POPIA in Digital Medicine',
          provider: 'HPCSA Accredited Digital Testing Portal',
          category: 'Ethics, Human Rights & Medical Law',
          ceuPoints: 4,
          dateCompleted: new Date().toISOString().slice(0, 10),
          expiryDate: new Date(Date.now() + 86400000 * 365).toISOString().slice(0, 10),
          status: 'COMPLETED',
          certificateUrl: `https://hpcsa-cpd.co.za/cert/HPCSA-ETH-${Math.floor(10000 + Math.random() * 90000)}`,
        };
        onAddCertificate(newCert);
      }
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIdx(0);
    setSelectedAnswers([]);
    setQuizFinished(false);
    setShowQuizModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & HPCSA Compliance Ring */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-white shadow-md shadow-amber-900/30">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white tracking-tight">HPCSA CPD Points & Certificate Vault</h2>
              <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                HPCSA Registered & In Good Standing
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Practitioner: Dr. Thabo Ndlovu (HPCSA: MP 0694821) • Annual Target: 30 CEUs (incl. 5 Ethics)
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setCurrentQuestionIdx(0);
            setSelectedAnswers([]);
            setQuizFinished(false);
            setShowQuizModal(true);
          }}
          className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>Complete External Test (+4 Ethics CEUs)</span>
        </button>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Total CPD Units (CEUs)</span>
            <span className="font-mono text-cyan-400 font-bold">{totalPoints} / 30 CEUs</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totalPoints / 30) * 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400">
            {totalPoints >= 30 ? (
              <span className="text-emerald-400 font-semibold">✓ Annual 30 CEU Requirement Met!</span>
            ) : (
              `${30 - totalPoints} CEUs needed before renewal cycle`
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Ethics, Law & Human Rights</span>
            <span className="font-mono text-amber-400 font-bold">{ethicsPoints} / 5 CEUs</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (ethicsPoints / 5) * 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400">
            {ethicsPoints >= 5 ? (
              <span className="text-emerald-400 font-semibold">✓ Mandatory 5 Ethics CEUs Satisfied</span>
            ) : (
              `${5 - ethicsPoints} Ethics units needed`
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Clinical Medicine CEUs</span>
            <span className="font-mono text-teal-400 font-bold">{clinicalPoints} CEUs</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (clinicalPoints / 25) * 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400">Cardiology, Endocrinology, Respiratory & Primary Care</div>
        </div>
      </div>

      {/* Certificates List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            Accredited Certificates & External Test Results
          </h3>
          <span className="text-xs text-slate-400">{cpdCertificates.length} Records Verified</span>
        </div>

        <div className="divide-y divide-slate-800">
          {cpdCertificates.map((cert) => (
            <div
              key={cert.id}
              className="p-3.5 hover:bg-slate-800/40 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white text-sm">{cert.title}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    cert.category.includes('Ethics')
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-teal-950 text-teal-300 border border-teal-800'
                  }`}>
                    {cert.category}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 mt-1">
                  Provider: <span className="text-slate-300 font-medium">{cert.provider}</span> • Completed:{' '}
                  <span className="font-mono text-white">{cert.dateCompleted || 'In Progress'}</span> • Valid until:{' '}
                  <span className="font-mono text-slate-400">{cert.expiryDate}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold text-xs">
                  +{cert.ceuPoints} CEUs
                </span>

                {cert.certificateUrl && (
                  <a
                    href={cert.certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                    title="View Certificate"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* External Test Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                HPCSA Accredited External CPD Assessment
              </h3>
              <button onClick={resetQuiz} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {!quizFinished ? (
              <div className="mt-4 space-y-4 text-xs">
                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>Question {currentQuestionIdx + 1} of {quizQuestions.length}</span>
                  <span className="text-amber-400 font-semibold">+4 Ethics CEUs</span>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 font-medium text-white text-xs leading-relaxed">
                  {quizQuestions[currentQuestionIdx].q}
                </div>

                <div className="space-y-2">
                  {quizQuestions[currentQuestionIdx].options.map((opt, optIdx) => (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectAnswer(optIdx)}
                      className={`w-full text-left p-3 rounded-xl border transition text-xs flex items-center space-x-2 ${
                        selectedAnswers[currentQuestionIdx] === optIdx
                          ? 'bg-amber-950 border-amber-600 text-white font-medium'
                          : 'bg-slate-800/50 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full border border-slate-500 flex items-center justify-center text-[10px]">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-slate-500">Passing score required: 75%</span>
                  <button
                    onClick={handleNextQuestion}
                    disabled={selectedAnswers[currentQuestionIdx] === undefined}
                    className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
                  >
                    {currentQuestionIdx < quizQuestions.length - 1 ? 'Next Question →' : 'Submit Assessment'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-center space-y-4 py-4 text-xs">
                <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-600 text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold">
                  {quizScore}%
                </div>

                <div>
                  <h4 className="font-bold text-white text-base">
                    {quizScore >= 75 ? 'Assessment Passed Successfully!' : 'Pass Mark Not Met (Requires 75%)'}
                  </h4>
                  <p className="text-slate-400 text-xs mt-1">
                    {quizScore >= 75
                      ? 'Congratulations Dr. Ndlovu! 4 Ethics CEUs have been accredited to your HPCSA profile.'
                      : 'Please review the HPCSA Ethical Guidelines Booklet and retry the assessment.'}
                  </p>
                </div>

                <button
                  onClick={resetQuiz}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-xl text-xs font-semibold transition"
                >
                  Done & Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
