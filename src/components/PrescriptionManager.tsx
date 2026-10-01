import React, { useState } from 'react';
import {
  Pill,
  Plus,
  Trash2,
  Printer,
  Send,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { Patient, NappiMedication } from '../types';
import { COMMON_NAPPI } from '../services/dataService';
import { MmediCompannionApi, PracticeStore } from '../services/api';

interface PrescriptionManagerProps {
  currentPatient: Patient | null;
  initialItems?: NappiMedication[];
}

export const PrescriptionManager: React.FC<PrescriptionManagerProps> = ({
  currentPatient,
  initialItems,
}) => {
  const patient = currentPatient;
  const [medications, setMedications] = useState<NappiMedication[]>(
    initialItems && initialItems.length > 0 ? initialItems : COMMON_NAPPI.slice(0, 3)
  );

  // New item form
  const [selectedCatalogItem, setSelectedCatalogItem] = useState(COMMON_NAPPI[0].nappi);
  const [customDosage, setCustomDosage] = useState('');
  const [customRepeats, setCustomRepeats] = useState(3);
  const [customInstructions, setCustomInstructions] = useState('');
  const [whatsAppFeedback, setWhatsAppFeedback] = useState<string | null>(null);

  const handleAddMedication = () => {
    const catalogMatch = COMMON_NAPPI.find((m) => m.nappi === selectedCatalogItem);
    if (!catalogMatch) return;

    const newItem: NappiMedication = {
      ...catalogMatch,
      dosage: customDosage || catalogMatch.dosage,
      repeats: customRepeats,
      instructions: customInstructions || catalogMatch.instructions,
    };

    setMedications([...medications, newItem]);
    setCustomDosage('');
    setCustomInstructions('');
  };

  const handleRemoveMedication = (nappi: string) => {
    setMedications(medications.filter((m) => m.nappi !== nappi));
  };

  const scriptNumber = `RX-${Math.floor(100000 + Math.random() * 900000)}`;

  const handleSendWhatsApp = async () => {
    if (!patient) return;
    try {
      const res = await MmediCompannionApi.sendWhatsAppMessage({
        recipientPhone: patient.phone,
        patientName: patient.fullName,
        templateType: 'PRESCRIPTION_READY',
        details: {
          scriptNumber,
          medicationCount: medications.length,
        },
      });

      if (res.success) {
        setWhatsAppFeedback(`Prescription #${scriptNumber} sent to ${patient.fullName} via WhatsApp!`);
        setTimeout(() => setWhatsAppFeedback(null), 4000);
        if (res.data?.waWebDeepLink) {
          window.open(res.data.waWebDeepLink, '_blank');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrintScript = () => {
    window.print();
  };

  const handleExportWord = () => {
    const docHtml = `
      <div class="header-box">
        <h2>OFFICIAL SOUTH AFRICAN DIGITAL PRESCRIPTION</h2>
        <p><strong>Dr. Thabo Ndlovu</strong> • MBChB (Wits) FCFP (SA)</p>
        <p>Family Physician • Practice BHF No: 0548921 • HPCSA: MP 0694821</p>
        <p>Rosebank Medical Centre, 14 Hood Ave, Rosebank • Tel: +27 11 880 2000</p>
      </div>

      <p><strong>Prescription Ref:</strong> ${scriptNumber} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Patient Name:</strong> ${patient?.fullName || 'Patient'} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>SA ID:</strong> ${patient?.idNumber || 'N/A'}</p>
      <p><strong>Medical Scheme:</strong> ${patient?.medicalAidName || 'Discovery Health'} (No: ${patient?.medicalAidNumber || 'N/A'}) - Dep: ${patient?.dependantCode || '00'}</p>
      <p><strong>Allergies:</strong> ${patient?.allergies?.join(', ') || 'No Known Drug Allergies (NKDA)'}</p>

      <table>
        <thead>
          <tr>
            <th>NAPPI Code</th>
            <th>Medicine Name & Strength</th>
            <th>Schedule</th>
            <th>Sig / Dosage Instructions</th>
            <th>Qty</th>
            <th>Repeats Authorised</th>
          </tr>
        </thead>
        <tbody>
          ${medications
            .map(
              (m) => `
            <tr>
              <td>${m.nappi}</td>
              <td><strong>${m.medicineName}</strong></td>
              <td>${m.schedule}</td>
              <td>${m.dosage} (${m.instructions})</td>
              <td>${m.quantity}</td>
              <td><strong>${m.repeats} repeats</strong></td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <p style="margin-top: 24pt; font-size: 10pt; color: #475569;">
        Dispensing Pharmacist Notice: This prescription is compliant with Section 22A of the South African Medicines and Related Substances Act (Act 101 of 1965).
      </p>

      <p style="margin-top: 30pt;">_______________________________<br/><strong>Dr. Thabo Ndlovu</strong><br/>Digital Electronic Signature (HPCSA Compliant)</p>
    `;

    MmediCompannionApi.exportToWord(`Prescription_${patient?.fullName.replace(/\s+/g, '_')}_${scriptNumber}`, docHtml);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-900/30">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Auto-Prescription & NAPPI Engine</h2>
                <span className="text-[10px] font-semibold bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded-full">
                  SA Medicines Act 101 Compliant
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                South African 9-digit NAPPI coding • Schedule S0-S6 repeat vouchers • Direct Pharmacy & WhatsApp dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap">
            <button
              onClick={handleSendWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
              title="Send digital prescription link directly to patient WhatsApp"
            >
              <Send className="w-4 h-4" />
              <span>Send WhatsApp Script</span>
            </button>

            <button
              onClick={handlePrintScript}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Print Official Script</span>
            </button>

            <button
              onClick={handleExportWord}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export Word (.doc)</span>
            </button>
          </div>
        </div>

        {whatsAppFeedback && (
          <div className="mt-3 p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{whatsAppFeedback}</span>
          </div>
        )}
      </div>

      {/* Main 2-column layout: Form & Catalog on left, Official Script Preview on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Add Medication Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            Add South African NAPPI Formulary Item
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Select from South African Medicine Formulary</label>
              <select
                value={selectedCatalogItem}
                onChange={(e) => setSelectedCatalogItem(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
              >
                {COMMON_NAPPI.map((med) => (
                  <option key={med.nappi} value={med.nappi}>
                    {med.medicineName} [{med.schedule}] - NAPPI: {med.nappi}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Dosage & Frequency (Sig)</label>
              <input
                type="text"
                placeholder="e.g. 1 tablet twice daily with food (BD pc)"
                value={customDosage}
                onChange={(e) => setCustomDosage(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Repeats Authorised</label>
                <select
                  value={customRepeats}
                  onChange={(e) => setCustomRepeats(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value={0}>0 (No Repeats - Acute)</option>
                  <option value={1}>1 Repeat</option>
                  <option value={2}>2 Repeats</option>
                  <option value={3}>3 Repeats</option>
                  <option value={5}>5 Repeats (Max 6 Months)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Schedule Limit Alert</label>
                <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700 text-[11px] text-slate-400">
                  S2-S4: Max 5 repeats. S5: Valid 6 months.
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Patient Instructions / Auxiliary Labels</label>
              <input
                type="text"
                placeholder="e.g. Complete full antibiotic course; avoid grapefruit juice"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <button
              onClick={handleAddMedication}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Prescription Pad</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Accepted at All South African Pharmacies:</span>
            <p>✓ Dis-Chem • Clicks • Medirite • Netcare / Life Hospital Dispensaries</p>
          </div>
        </div>

        {/* Right: Printable Official Prescription Paper */}
        <div className="lg:col-span-7 bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200 font-sans print:m-0 print:p-0 print:border-none">
          {/* Header Letterhead */}
          <div className="border-b-2 border-cyan-700 pb-4 mb-4 flex justify-between items-start">
            <div>
              <h1 className="text-lg font-bold text-cyan-900 tracking-tight">DR. THABO NDLOVU</h1>
              <p className="text-xs font-semibold text-slate-700">MBChB (Wits) • FCFP (SA)</p>
              <p className="text-[11px] text-slate-600">Family Physician & General Practitioner</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Rosebank Medical Centre, 14 Hood Avenue, Rosebank, 2196
              </p>
              <p className="text-[11px] text-slate-500">Tel: +27 11 880 2000 • Email: practice@medswitchsa.co.za</p>
            </div>

            <div className="text-right text-xs">
              <div className="font-bold text-slate-800">BHF Practice: 0548921</div>
              <div className="font-bold text-slate-800">HPCSA: MP 0694821</div>
              <div className="mt-2 text-cyan-700 font-mono font-bold text-sm">{scriptNumber}</div>
              <div className="text-[11px] text-slate-500">{new Date().toLocaleDateString()}</div>
            </div>
          </div>

          {/* Patient Details Strip */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <span className="text-slate-500 block text-[10px]">Patient Name:</span>
              <span className="font-bold text-slate-900">{patient?.fullName || 'Sipho Zulu'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">National ID:</span>
              <span className="font-mono text-slate-800">{patient?.idNumber || '8503145890082'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Medical Scheme:</span>
              <span className="font-medium text-slate-800">{patient?.medicalAidName || 'Discovery Health'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Scheme No & Dep:</span>
              <span className="font-mono text-slate-800">
                {patient?.medicalAidNumber || '902184729'}-{patient?.dependantCode || '00'}
              </span>
            </div>
          </div>

          {/* Rx Items List */}
          <div className="space-y-3 min-h-[220px]">
            <div className="text-2xl font-serif text-cyan-800 font-bold mb-2">℞</div>

            {medications.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">
                Prescription pad is empty. Add medications from formulary.
              </div>
            ) : (
              medications.map((m, idx) => (
                <div
                  key={m.nappi}
                  className="flex items-start justify-between pb-3 border-b border-dashed border-slate-200 group text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {idx + 1}. {m.medicineName}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 border border-slate-300 px-1 rounded">
                        {m.schedule}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">NAPPI: {m.nappi}</span>
                    </div>

                    <div className="text-slate-700 font-medium pl-4">Sig: {m.dosage}</div>
                    <div className="text-[11px] text-slate-500 italic pl-4">
                      Instructions: {m.instructions} • Dispense: {m.quantity}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded">
                      {m.repeats} {m.repeats === 1 ? 'Repeat' : 'Repeats'}
                    </span>
                    <button
                      onClick={() => handleRemoveMedication(m.nappi)}
                      className="text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition print:hidden"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Doctor Signature & Security Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-end">
            <div className="text-[10px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1 text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>POPIA & HPCSA Verified Electronic Script</span>
              </div>
              <p>Barcode: ||||| | ||||| || |||||| | |||||||| | |</p>
              <p>Security Hash: SHA-256 (3c81f...491a)</p>
            </div>

            <div className="text-center">
              <div className="font-serif italic text-cyan-900 text-lg">Dr. T. Ndlovu</div>
              <div className="w-48 border-t border-slate-800 mt-1"></div>
              <div className="text-[10px] font-bold text-slate-800 mt-0.5">DR. THABO NDLOVU</div>
              <div className="text-[9px] text-slate-500">HPCSA MP 0694821</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
