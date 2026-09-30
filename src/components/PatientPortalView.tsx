import React, { useState } from 'react';
import {
  Smartphone,
  Pill,
  Calendar,
  CheckCircle2,
  Clock,
  Bell,
  Heart,
  Video,
  Send,
  RefreshCw,
  Flame,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Patient, PatientMedicineReminder } from '../types';

interface PatientPortalViewProps {
  currentPatient: Patient | null;
  patients: Patient[];
  reminders: PatientMedicineReminder[];
  onToggleTaken: (reminderId: string) => void;
  onRequestRefill: (reminder: PatientMedicineReminder) => void;
  onOpenTelehealth: () => void;
}

export const PatientPortalView: React.FC<PatientPortalViewProps> = ({
  currentPatient,
  patients,
  reminders,
  onToggleTaken,
  onRequestRefill,
  onOpenTelehealth,
}) => {
  const [selectedPatId, setSelectedPatId] = useState(currentPatient?.id || patients[0]?.id || '');
  const [refillNotice, setRefillNotice] = useState<string | null>(null);

  const patient = patients.find((p) => p.id === selectedPatId) || patients[0];
  const patientReminders = reminders.filter((r) => r.patientId === patient?.id);

  const handleRefillClick = (rem: PatientMedicineReminder) => {
    onRequestRefill(rem);
    setRefillNotice(`Refill request for ${rem.medicineName} dispatched to Dr. Thabo Ndlovu's reception!`);
    setTimeout(() => setRefillNotice(null), 4000);
  };

  const handleWhatsAppPractice = () => {
    const text = encodeURIComponent(
      `Hello Dr. Ndlovu's practice, this is ${patient?.fullName} (ID: ${patient?.idNumber}). I would like to query my chronic prescription renewal.`
    );
    window.open(`https://wa.me/27825550192?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-900/30">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Mediompanion • Patient Companion App</h2>
              <span className="text-[10px] font-bold bg-orange-950 text-orange-300 border border-orange-800 px-2 py-0.5 rounded-full">
                Client Mobile View
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active Patient: <span className="text-white font-medium">{patient?.fullName}</span> • Medical Scheme:{' '}
              <span className="text-cyan-400 font-medium">{patient?.medicalAidName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Simulate Patient:</span>
          <select
            value={selectedPatId}
            onChange={(e) => setSelectedPatId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} ({p.medicalAidName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {refillNotice && (
        <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-xl text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{refillNotice}</span>
          </div>
        </div>
      )}

      {/* Mobile Device Frame Simulation */}
      <div className="flex justify-center">
        <div className="w-full max-w-md bg-slate-950 border-4 border-slate-800 rounded-[38px] p-4 shadow-2xl overflow-hidden relative text-slate-200">
          {/* Phone Top Speaker & Notch */}
          <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-slate-900 mr-2" />
            <div className="w-10 h-1 bg-slate-700 rounded" />
          </div>

          {/* App Header Inside Phone */}
          <div className="bg-gradient-to-r from-cyan-900 to-teal-900 rounded-2xl p-4 mb-4 text-white shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-cyan-300 font-bold">Good Day</span>
                <h3 className="text-base font-bold">{patient?.fullName}</h3>
                <div className="text-[11px] text-cyan-200 mt-0.5">Dr. Thabo Ndlovu's Practice</div>
              </div>

              <div className="flex items-center space-x-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-xs font-bold">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>24 Days Streak</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-cyan-800/60 flex justify-between items-center text-xs">
              <span className="text-[11px] text-cyan-200">
                Scheme: <strong>{patient?.medicalAidName}</strong>
              </span>
              <span className="font-mono text-emerald-300 font-bold">
                R{patient?.savingsBalanceZAR?.toFixed(2)} Savings
              </span>
            </div>
          </div>

          {/* Teleconsult Shortcut Card */}
          <div className="bg-gradient-to-r from-indigo-950 to-purple-950 border border-indigo-800/80 rounded-2xl p-3.5 mb-4 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Telehealth Video Consult</span>
                <span className="text-[11px] text-indigo-300">Room 2B • Dr. Ndlovu Ready</span>
              </div>
            </div>
            <button
              onClick={onOpenTelehealth}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl font-semibold text-xs transition"
            >
              Join Call
            </button>
          </div>

          {/* Section: Today's Medicine Reminders & Alarms */}
          <div className="space-y-3 mb-5">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-teal-400" />
                Today's Medicine Schedule
              </span>
              <span className="text-[10px] text-slate-400">Alarm Synced</span>
            </div>

            {patientReminders.length === 0 ? (
              <div className="p-4 bg-slate-900 rounded-xl text-center text-slate-500 text-xs">
                No active medicine reminders set for this patient.
              </div>
            ) : (
              patientReminders.map((rem) => (
                <div
                  key={rem.id}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between text-xs ${
                    rem.takenToday
                      ? 'bg-emerald-950/30 border-emerald-800/60 text-slate-300'
                      : 'bg-slate-900 border-slate-800 text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onToggleTaken(rem.id)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition ${
                        rem.takenToday
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-slate-600 hover:border-cyan-400 text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span className={rem.takenToday ? 'line-through text-slate-400' : ''}>
                          {rem.medicineName}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400 font-normal">({rem.dosage})</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Times: {rem.timeOfDay.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-semibold bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                      {rem.repeatsRemaining} Repeats Left
                    </span>
                    <button
                      onClick={() => handleRefillClick(rem)}
                      className="block text-[10px] text-cyan-400 hover:text-cyan-300 mt-1 font-medium"
                    >
                      Request Refill →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Section: Upcoming Health Checkups */}
          <div className="space-y-2 mb-5">
            <span className="text-xs font-bold text-white block px-1">Upcoming Clinic Checkups</span>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white block">Hypertension & BP Review</span>
                  <span className="text-[10px] text-slate-400">Dr. Thabo Ndlovu • Tomorrow at 08:30</span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold">Confirmed</span>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white block">Ampath Blood Lipogram & Creatinine</span>
                  <span className="text-[10px] text-slate-400">Pathology Order • Due in 12 days</span>
                </div>
              </div>
              <span className="text-[10px] text-amber-400 font-semibold">Scheduled</span>
            </div>
          </div>

          {/* 1-Tap WhatsApp Reception Contact */}
          <button
            onClick={handleWhatsAppPractice}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-950/60"
          >
            <Send className="w-4 h-4" />
            <span>Chat with Practice on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
