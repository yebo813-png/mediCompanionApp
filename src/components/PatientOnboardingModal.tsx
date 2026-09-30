import React, { useState } from 'react';
import { UserPlus, ShieldCheck, Heart, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { Patient } from '../types';

interface PatientOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePatient: (patient: Patient) => void;
}

export const PatientOnboardingModal: React.FC<PatientOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSavePatient,
}) => {
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('+27 ');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [medicalAidName, setMedicalAidName] = useState('Discovery Health');
  const [medicalAidNumber, setMedicalAidNumber] = useState('');
  const [dependantCode, setDependantCode] = useState('00');
  const [planName, setPlanName] = useState('Classic Comprehensive');
  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergiesInput, setAllergiesInput] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('+27 ');
  const [emergencyRelation, setEmergencyRelation] = useState('Spouse');
  const [popiaConsent, setPopiaConsent] = useState(true);

  // South African ID breakdown state
  const [derivedDob, setDerivedDob] = useState('');
  const [derivedGender, setDerivedGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [idError, setIdError] = useState('');

  if (!isOpen) return null;

  const validateSaId = (id: string) => {
    setIdNumber(id);
    const clean = id.replace(/\D/g, '');
    if (clean.length === 13) {
      // Decode DOB: YYMMDD
      const yy = parseInt(clean.substring(0, 2), 10);
      const mm = clean.substring(2, 4);
      const dd = clean.substring(4, 6);
      const fullYear = yy > 26 ? `19${clean.substring(0, 2)}` : `20${clean.substring(0, 2)}`;
      setDerivedDob(`${fullYear}-${mm}-${dd}`);

      // Decode Gender: digits 6..10 (0000-4999 female, 5000-9999 male)
      const genderCode = parseInt(clean.substring(6, 10), 10);
      if (genderCode < 5000) {
        setDerivedGender('Female');
      } else {
        setDerivedGender('Male');
      }
      setIdError('');
    } else if (clean.length > 0 && clean.length !== 13) {
      setIdError('South African ID must be exactly 13 digits');
    } else {
      setIdError('');
    }
  };

  const toggleCondition = (cond: string) => {
    if (chronicConditions.includes(cond)) {
      setChronicConditions(chronicConditions.filter((c) => c !== cond));
    } else {
      setChronicConditions([...chronicConditions, cond]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!popiaConsent) {
      alert('Patient must acknowledge the POPIA Protection of Personal Information consent.');
      return;
    }

    const allAllergies = allergiesInput
      ? [...allergies, ...allergiesInput.split(',').map((s) => s.trim()).filter(Boolean)]
      : allergies;

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      fullName,
      idNumber: idNumber.replace(/\D/g, ''),
      dob: derivedDob || '1990-01-01',
      gender: derivedGender,
      phone,
      email,
      address,
      medicalAidName,
      medicalAidNumber,
      dependantCode,
      planName,
      savingsBalanceZAR: medicalAidName === 'Private / Cash' ? 0 : 5200.00,
      chronicAuthorised: chronicConditions.length > 0,
      chronicConditions,
      allergies: allAllergies,
      emergencyContact: {
        name: emergencyName || 'Relative',
        relationship: emergencyRelation,
        phone: emergencyPhone,
      },
      tags: chronicConditions.length > 0 ? ['Chronic PMB', 'Verified Switch'] : ['General Care'],
      registeredDate: new Date().toISOString().slice(0, 10),
    };

    onSavePatient(newPatient);
    onClose();
  };

  const commonConditions = [
    'Hypertension',
    'Type 2 Diabetes',
    'Asthma',
    'Hypercholesterolemia',
    'Gout',
    'Epilepsy',
    'Hypothyroidism',
    'HIV / ART Care',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-slate-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-white text-base">New Patient Onboarding (Healthbridge EHR Format)</h3>
              <p className="text-[11px] text-slate-400">South African National ID & Medical Scheme Card Ingestion</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          {/* Section 1: Demographics */}
          <div>
            <h4 className="text-slate-300 font-semibold mb-2 flex items-center gap-1.5 text-xs">
              <span className="w-4 h-4 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">1</span>
              Personal Demographics & National ID
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nomvula Dlamini"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">South African 13-Digit ID Number *</label>
                <input
                  type="text"
                  required
                  maxLength={13}
                  placeholder="e.g. 8503145890082"
                  value={idNumber}
                  onChange={(e) => validateSaId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
                {idError && <span className="text-red-400 text-[10px]">{idError}</span>}
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Calculated Date of Birth</label>
                <input
                  type="date"
                  value={derivedDob}
                  onChange={(e) => setDerivedDob(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Gender</label>
                <select
                  value={derivedGender}
                  onChange={(e) => setDerivedGender(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Mobile Phone (WhatsApp Enabled) *</label>
                <input
                  type="text"
                  required
                  placeholder="+27 82 555 1234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="patient@example.co.za"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="mt-2">
              <label className="block text-slate-400 mb-1">Residential Address</label>
              <input
                type="text"
                placeholder="Street address, suburb, city, postal code"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Section 2: Medical Aid Scheme */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-slate-300 font-semibold mb-2 flex items-center gap-1.5 text-xs">
              <span className="w-4 h-4 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">2</span>
              Medical Aid / Switch Billing Profile
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Medical Scheme</label>
                <select
                  value={medicalAidName}
                  onChange={(e) => setMedicalAidName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="Discovery Health">Discovery Health</option>
                  <option value="GEMS">GEMS (Government Employees)</option>
                  <option value="Bonitas">Bonitas Medical Fund</option>
                  <option value="Momentum Health">Momentum Health</option>
                  <option value="Fedhealth (Medscheme)">Fedhealth (Medscheme)</option>
                  <option value="Bestmed">Bestmed</option>
                  <option value="Private / Cash">Private / Cash Patient</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Membership Number</label>
                <input
                  type="text"
                  placeholder="e.g. 902184729"
                  value={medicalAidNumber}
                  onChange={(e) => setMedicalAidNumber(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Dependant Code</label>
                <select
                  value={dependantCode}
                  onChange={(e) => setDependantCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                >
                  <option value="00">00 (Main Member)</option>
                  <option value="01">01 (Adult / Spouse)</option>
                  <option value="02">02 (Child 1)</option>
                  <option value="03">03 (Child 2)</option>
                  <option value="04">04 (Dependant)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Clinical & Chronic History */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-slate-300 font-semibold mb-2 flex items-center gap-1.5 text-xs">
              <span className="w-4 h-4 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">3</span>
              Chronic PMB Conditions & Allergies
            </h4>

            <div className="mb-2">
              <span className="text-[11px] text-slate-400 block mb-1.5">Check any chronic PMB conditions:</span>
              <div className="flex flex-wrap gap-1.5">
                {commonConditions.map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    className={`px-2.5 py-1 rounded-lg border transition ${
                      chronicConditions.includes(cond)
                        ? 'bg-cyan-600 text-white border-cyan-500 font-semibold'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Known Allergies (e.g. Penicillin, NSAIDs, Sulpha)</label>
              <input
                type="text"
                placeholder="Comma separated allergies or leave blank for NKDA"
                value={allergiesInput}
                onChange={(e) => setAllergiesInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Section 4: POPIA Consent */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-start space-x-2.5 bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 cursor-pointer">
              <input
                type="checkbox"
                checked={popiaConsent}
                onChange={(e) => setPopiaConsent(e.target.checked)}
                className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500"
              />
              <div className="text-[11px] text-slate-300 leading-relaxed">
                <span className="font-semibold text-white">POPIA & HPCSA Electronic Consent:</span> Patient consents
                to the lawful collection and electronic processing of health records, medical switch claims transmission via
                Healthbridge / MediSwitch, and secure WhatsApp appointment notifications in compliance with South Africa
                POPIA Act 4 of 2013 and HPCSA Ethical Rule 10.
              </div>
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-950"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Create Patient File</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
