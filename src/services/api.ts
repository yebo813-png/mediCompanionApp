import {
  Patient,
  Appointment,
  ClinicalConsultation,
  MedicalAidClaim,
  SpecialistReferral,
  LocumSlotRequest,
  DoctorCPDCertificate,
  PatientMedicineReminder,
  AuditLog,
} from '../types';
import {
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_CONSULTATIONS,
  INITIAL_CLAIMS,
  INITIAL_REFERRALS,
  INITIAL_LOCUM_SLOTS,
  INITIAL_CPD,
  INITIAL_PATIENT_REMINDERS,
  INITIAL_AUDIT_LOGS,
} from './dataService';

// Local storage helpers for instant responsive persistence
const STORAGE_KEYS = {
  PATIENTS: 'medswitch_patients',
  APPOINTMENTS: 'medswitch_appointments',
  CONSULTATIONS: 'medswitch_consultations',
  CLAIMS: 'medswitch_claims',
  REFERRALS: 'medswitch_referrals',
  LOCUMS: 'medswitch_locums',
  CPD: 'medswitch_cpd',
  REMINDERS: 'medswitch_reminders',
  AUDIT_LOGS: 'medswitch_audit_logs',
};

function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Storage error', e);
  }
}

export const PracticeStore = {
  getPatients(): Patient[] {
    return getLocal<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
  },
  savePatient(patient: Patient): Patient[] {
    const list = this.getPatients();
    const idx = list.findIndex((p) => p.id === patient.id);
    let updated: Patient[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = patient;
    } else {
      updated = [patient, ...list];
    }
    setLocal(STORAGE_KEYS.PATIENTS, updated);
    this.addAuditLog('PATIENT_RECORD_SAVED', `Updated record for patient ${patient.fullName} (ID: ${patient.idNumber})`);
    return updated;
  },

  getAppointments(): Appointment[] {
    return getLocal<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
  },
  saveAppointment(appointment: Appointment): Appointment[] {
    const list = this.getAppointments();
    const idx = list.findIndex((a) => a.id === appointment.id);
    let updated: Appointment[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = appointment;
    } else {
      updated = [appointment, ...list];
    }
    setLocal(STORAGE_KEYS.APPOINTMENTS, updated);
    return updated;
  },

  getConsultations(): ClinicalConsultation[] {
    return getLocal<ClinicalConsultation[]>(STORAGE_KEYS.CONSULTATIONS, INITIAL_CONSULTATIONS);
  },
  saveConsultation(consult: ClinicalConsultation): ClinicalConsultation[] {
    const list = this.getConsultations();
    const idx = list.findIndex((c) => c.id === consult.id);
    let updated: ClinicalConsultation[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = consult;
    } else {
      updated = [consult, ...list];
    }
    setLocal(STORAGE_KEYS.CONSULTATIONS, updated);
    this.addAuditLog('CONSULTATION_NOTE_COMMITTED', `Saved clinical SOAP note for ${consult.patientName} (ICD-10: ${consult.icd10Codes?.map(c => c.code).join(', ')})`);
    return updated;
  },

  getClaims(): MedicalAidClaim[] {
    return getLocal<MedicalAidClaim[]>(STORAGE_KEYS.CLAIMS, INITIAL_CLAIMS);
  },
  saveClaim(claim: MedicalAidClaim): MedicalAidClaim[] {
    const list = this.getClaims();
    const idx = list.findIndex((c) => c.id === claim.id);
    let updated: MedicalAidClaim[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = claim;
    } else {
      updated = [claim, ...list];
    }
    setLocal(STORAGE_KEYS.CLAIMS, updated);
    this.addAuditLog('MEDICAL_AID_CLAIM_SWITCHED', `Dispatched EDI claim ${claim.claimRef} to ${claim.schemeName} via Healthbridge`);
    return updated;
  },

  getReferrals(): SpecialistReferral[] {
    return getLocal<SpecialistReferral[]>(STORAGE_KEYS.REFERRALS, INITIAL_REFERRALS);
  },
  saveReferral(ref: SpecialistReferral): SpecialistReferral[] {
    const list = this.getReferrals();
    const updated = [ref, ...list.filter((r) => r.id !== ref.id)];
    setLocal(STORAGE_KEYS.REFERRALS, updated);
    this.addAuditLog('SPECIALIST_REFERRAL_CREATED', `Generated referral for ${ref.patientName} to ${ref.doctorName}`);
    return updated;
  },

  getLocums(): LocumSlotRequest[] {
    return getLocal<LocumSlotRequest[]>(STORAGE_KEYS.LOCUMS, INITIAL_LOCUM_SLOTS);
  },
  saveLocum(locum: LocumSlotRequest): LocumSlotRequest[] {
    const list = this.getLocums();
    const updated = [locum, ...list.filter((l) => l.id !== locum.id)];
    setLocal(STORAGE_KEYS.LOCUMS, updated);
    this.addAuditLog('LOCUM_MARKETPLACE_UPDATED', `Slot request ${locum.timeSlot} status: ${locum.status}`);
    return updated;
  },

  getCPD(): DoctorCPDCertificate[] {
    return getLocal<DoctorCPDCertificate[]>(STORAGE_KEYS.CPD, INITIAL_CPD);
  },
  saveCPD(cert: DoctorCPDCertificate): DoctorCPDCertificate[] {
    const list = this.getCPD();
    const updated = [cert, ...list.filter((c) => c.id !== cert.id)];
    setLocal(STORAGE_KEYS.CPD, updated);
    return updated;
  },

  getReminders(): PatientMedicineReminder[] {
    return getLocal<PatientMedicineReminder[]>(STORAGE_KEYS.REMINDERS, INITIAL_PATIENT_REMINDERS);
  },
  saveReminder(reminder: PatientMedicineReminder): PatientMedicineReminder[] {
    const list = this.getReminders();
    const updated = [reminder, ...list.filter((r) => r.id !== reminder.id)];
    setLocal(STORAGE_KEYS.REMINDERS, updated);
    return updated;
  },

  getAuditLogs(): AuditLog[] {
    return getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },
  addAuditLog(action: string, details: string): void {
    const list = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      operator: 'Dr. Thabo Ndlovu (HPCSA MP0694821)',
      action,
      details,
      ipAddress: '196.25.1.14 (Rosebank Practice Network)',
      standard: action.includes('CLAIM') ? 'POPIA Act 4 2013' : 'HIPAA §164.312(b)',
      hash: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    };
    setLocal(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...list.slice(0, 49)]);
  },
};

// API Services contacting backend
export const MmediCompannionApi = {
  // Comprehensive AI Diagnostic Assistant
  async runDiagnosticAnalysis(payload: {
    patient: any;
    symptoms: any;
    vitals: any;
    testResults: any;
  }) {
    const res = await fetch('/api/gemini/diagnostic-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // AI Treatment plan
  async getAITreatmentPlan(payload: {
    patientName: string;
    age: number | string;
    gender: string;
    medicalAid: string;
    chronicConditions: string[];
    complaints: string;
    vitals: any;
    allergies: string[];
  }) {
    const res = await fetch('/api/gemini/treatment-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // AI SOAP Assistant
  async getAISOAPNotes(payload: { roughNotes: string; patientSummary: string }) {
    const res = await fetch('/api/gemini/soap-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // AI Handwriting OCR
  async transcribeHandwriting(imageBase64: string) {
    const res = await fetch('/api/gemini/handwriting-ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    });
    return res.json();
  },

  // AI Referral Letter
  async generateReferralLetter(payload: {
    patient: any;
    specialistType: string;
    reason: string;
    clinicalFindings: string;
    urgency: string;
  }) {
    const res = await fetch('/api/gemini/referral-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Medical Aid Switch Eligibility
  async verifyEligibility(payload: {
    schemeCode: string;
    membershipNumber: string;
    dependantCode: string;
    patientIdNumber: string;
  }) {
    const res = await fetch('/api/switch/verify-eligibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Medical Aid Claim Electronic Switch
  async submitSwitchClaim(payload: any) {
    const res = await fetch('/api/switch/submit-claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // WhatsApp Messaging
  async sendWhatsAppMessage(payload: {
    recipientPhone: string;
    patientName: string;
    templateType: string;
    details?: any;
  }) {
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // AI Appointment Urgency Triage & Clinical Risk Analyzer
  async analyzeAppointmentsUrgency(payload: {
    appointments: Appointment[];
    patients: Patient[];
    consultations?: ClinicalConsultation[];
  }) {
    const res = await fetch('/api/gemini/analyze-appointments-urgency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Export to Word document (.doc compatible)
  exportToWord(filename: string, contentHtml: string) {
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${filename}</title>
    <style>
      body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.5; }
      h1, h2, h3 { color: #0284c7; }
      .header-box { border-bottom: 2pt solid #0284c7; padding-bottom: 8pt; margin-bottom: 12pt; }
      table { border-collapse: collapse; width: 100%; margin-top: 10pt; }
      th, td { border: 1pt solid #cbd5e1; padding: 6pt; text-align: left; }
      th { background-color: #f1f5f9; }
    </style></head><body>`;
    const footer = `</body></html>`;
    const sourceHtml = header + contentHtml + footer;

    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHtml);
    const fileDownload = document.createElement('a');
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${filename}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  },
};

