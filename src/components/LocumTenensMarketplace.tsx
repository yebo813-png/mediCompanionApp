import React, { useState } from 'react';
import {
  UserPlus2,
  Calendar,
  Clock,
  CheckCircle2,
  Star,
  ShieldCheck,
  CreditCard,
  Plus,
  Send,
  UserCheck,
  Zap,
} from 'lucide-react';
import { LocumSlotRequest } from '../types';
import { PracticeStore } from '../services/api';

interface LocumTenensMarketplaceProps {
  locumSlots: LocumSlotRequest[];
  onAddLocumSlot: (slot: LocumSlotRequest) => void;
  onConfirmLocum: (slotId: string) => void;
}

export const LocumTenensMarketplace: React.FC<LocumTenensMarketplaceProps> = ({
  locumSlots,
  onAddLocumSlot,
  onConfirmLocum,
}) => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [slotDate, setSlotDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [slotTime, setSlotTime] = useState('08:00 - 13:00 (5 hrs)');
  const [room, setRoom] = useState('Rosebank Suite 2B');
  const [hours, setHours] = useState(5);
  const [ratePerHour, setRatePerHour] = useState(850);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Vetted South African Locum GPs database
  const availableLocums = [
    {
      id: 'doc-loc-01',
      name: 'Dr. Kgomotso Dlamini',
      hpcsaNumber: 'MP 0719824',
      qualification: 'MBChB (Pretoria), Dip Obst (SA)',
      rating: 4.9,
      completedShifts: 48,
      verifiedHPCSA: true,
      phone: '+27 82 901 7734',
      bio: 'Experienced primary care and urgent care GP. Full MPS malpractice insurance coverage.',
    },
    {
      id: 'doc-loc-02',
      name: 'Dr. Sean Miller',
      hpcsaNumber: 'MP 0683921',
      qualification: 'MBChB (UCT), DA (SA)',
      rating: 4.8,
      completedShifts: 62,
      verifiedHPCSA: true,
      phone: '+27 83 451 9920',
      bio: 'General practitioner with anaesthetics diploma. Skilled in minor surgical procedures & chronic reviews.',
    },
    {
      id: 'doc-loc-03',
      name: 'Dr. Fatima Essop',
      hpcsaNumber: 'MP 0744910',
      qualification: 'MBChB (Wits), Dip PEC (SA)',
      rating: 5.0,
      completedShifts: 34,
      verifiedHPCSA: true,
      phone: '+27 71 884 1209',
      bio: 'Emergency medicine background. Available for urgent morning and weekend practice coverage.',
    },
  ];

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = availableLocums[Math.floor(Math.random() * availableLocums.length)];

    const newSlot: LocumSlotRequest = {
      id: `loc-${Date.now()}`,
      practiceRoom: room,
      date: slotDate,
      timeSlot: slotTime,
      hours,
      ratePerHourZAR: ratePerHour,
      status: 'AUTO_MATCHED',
      matchedDoctor: matched,
    };

    onAddLocumSlot(newSlot);
    setShowRequestModal(false);
    setBookingSuccess(`Locum match found: ${matched.name} is ready to fill your practice slot on ${slotDate}!`);
    setTimeout(() => setBookingSuccess(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-900/30">
            <UserPlus2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white tracking-tight">LocumTenens SA Marketplace</h2>
              <span className="text-[10px] font-bold uppercase bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                Automated Doctor Slot Filler (Premium)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              On-demand verified HPCSA freelance medical doctors to cover practice slots, leave, or overflow
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Auto-Fill Practice Slot</span>
        </button>
      </div>

      {bookingSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-xl text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{bookingSuccess}</span>
          </div>
          <span className="text-[11px] text-emerald-300">Contract & Calendar Updated</span>
        </div>
      )}

      {/* Main Grid: Active Slots & Vetted Locum Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Practice Slot Requests */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              Practice Slot Coverage Ledger
            </h3>
            <span className="text-xs text-slate-400">{locumSlots.length} Slots Tracked</span>
          </div>

          <div className="space-y-3">
            {locumSlots.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No active slot fill requests. Click "Auto-Fill Practice Slot" to book a freelancer GP.
              </div>
            ) : (
              locumSlots.map((slot) => {
                const totalCost = slot.hours * slot.ratePerHourZAR;
                return (
                  <div
                    key={slot.id}
                    className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/80 hover:border-purple-800/80 transition space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{slot.date}</span>
                          <span className="text-xs text-slate-400 font-mono">({slot.timeSlot})</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{slot.practiceRoom}</div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-white text-sm">R{totalCost.toFixed(2)}</span>
                        <div className="text-[10px] text-slate-400">R{slot.ratePerHourZAR}/hr • {slot.hours} hrs</div>
                      </div>
                    </div>

                    {slot.matchedDoctor && (
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-purple-950 border border-purple-700 flex items-center justify-center text-purple-300 font-bold">
                            {slot.matchedDoctor.name.split(' ')[1]?.charAt(0) || 'D'}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-semibold text-white">{slot.matchedDoctor.name}</span>
                              <span title="HPCSA Verified">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              HPCSA: <span className="font-mono text-cyan-400">{slot.matchedDoctor.hpcsaNumber}</span> • {slot.matchedDoctor.qualification}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 text-amber-400 font-medium text-xs">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{slot.matchedDoctor.rating}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        slot.status === 'CONFIRMED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-purple-950 text-purple-300 border border-purple-800'
                      }`}>
                        {slot.status === 'CONFIRMED' ? '✓ Confirmed & Calendar Synced' : 'Auto-Matched • Awaiting Final Confirmation'}
                      </span>

                      {slot.status !== 'CONFIRMED' && (
                        <button
                          onClick={() => onConfirmLocum(slot.id)}
                          className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded-lg text-xs font-semibold transition"
                        >
                          Confirm & Book Locum
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Vetted HPCSA Freelance Doctors Roster */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Vetted HPCSA Freelance GP Roster
            </h3>
            <span className="text-[10px] text-slate-500">Live Active</span>
          </div>

          <div className="space-y-3">
            {availableLocums.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/60 hover:bg-slate-800/80 transition space-y-2 text-xs"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-1.5 font-bold text-white">
                      <span>{doc.name}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-[11px] text-cyan-400 font-mono mt-0.5">
                      {doc.hpcsaNumber} • {doc.qualification}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{doc.rating}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 italic leading-snug">{doc.bio}</p>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                  <span>{doc.completedShifts} Shifts Completed in Gauteng</span>
                  <span className="text-emerald-400 font-medium">Standard Rate: R850/hr</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-900/60 text-xs text-purple-200 space-y-1">
            <span className="font-semibold block">LocumTenens SA Practice Guarantee:</span>
            <p className="text-[11px] text-purple-300">
              All freelance doctors are independently verified with HPCSA annual register & MPS malpractice insurance.
            </p>
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <UserPlus2 className="w-5 h-5 text-purple-400" />
                Fill Practice Slot with Freelance GP
              </h3>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Date Needed</label>
                <input
                  type="date"
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Time Slot & Duration</label>
                <select
                  value={slotTime}
                  onChange={(e) => {
                    setSlotTime(e.target.value);
                    if (e.target.value.includes('4 hrs')) setHours(4);
                    if (e.target.value.includes('5 hrs')) setHours(5);
                    if (e.target.value.includes('8 hrs')) setHours(8);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="08:00 - 13:00 (5 hrs)">Morning Shift: 08:00 - 13:00 (5 hrs)</option>
                  <option value="14:00 - 18:00 (4 hrs)">Afternoon Shift: 14:00 - 18:00 (4 hrs)</option>
                  <option value="08:00 - 17:00 (8 hrs)">Full Day Shift: 08:00 - 17:00 (8 hrs)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Consulting Suite</label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs flex justify-between items-center">
                <div>
                  <span className="text-slate-400 text-[11px] block">Calculated Freelancer Fee:</span>
                  <span className="text-white font-bold text-sm font-mono">
                    R{(hours * ratePerHour).toFixed(2)}
                  </span>
                </div>
                <span className="text-[11px] text-purple-300">R{ratePerHour}/hr • No hidden fees</span>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-purple-950"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Auto-Match & Book Locum</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
