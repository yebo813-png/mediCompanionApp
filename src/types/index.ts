export interface Patient {
  id: string;
  fullName: string;
  idNumber: string; // South African 13-digit ID number
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  address: string;
  medicalAidName: string; // e.g. "Discovery Health", "GEMS", "Bonitas", "Private"
  medicalAidNumber: string;
  dependantCode: string; // e.g. "00" (main), "01" (spouse), "02" (child)
  planName: string; // e.g. "Classic Comprehensive", "Ruby", "Standard"
  savingsBalanceZAR: number;
  chronicAuthorised: boolean;
  chronicConditions: string[]; // e.g. ["Hypertension", "Type 2 Diabetes"]
  allergies: string[]; // e.g. ["Penicillin", "Sulphonamides"]
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  tags: string[];
  registeredDate: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  medicalAidName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  type: 'General Consultation' | 'Telehealth' | 'Follow-up' | 'Procedure' | 'Chronic Review';
  status: 'Confirmed' | 'Arrived' | 'In Consultation' | 'Completed' | 'No Show' | 'Cancelled';
  triageLevel: 'Routine' | 'Moderate' | 'Urgent' | 'Emergency';
  notes: string;
  whatsappReminderSent: boolean;
  isLocumCovered?: boolean;
  locumDoctorName?: string;
}

export interface ICD10Code {
  code: string;
  description: string;
  isPrimary?: boolean;
}

export interface TariffItem {
  code: string; // e.g. 0190
  description: string;
  units: number;
  rateZAR: number;
}

export interface NappiMedication {
  nappi: string; // 9-digit NAPPI code
  medicineName: string;
  schedule: 'S0' | 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6';
  dosage: string; // e.g. "1 tab BD pc"
  duration: string;
  repeats: number; // 0 to 5 repeats
  quantity: number;
  instructions: string;
}

export interface ClinicalConsultation {
  id: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  date: string;
  doctorName: string;
  vitals: {
    bp: string;
    pulse: number;
    temp: number;
    spo2: number;
    weight: number;
    glucose?: number;
  };
  soapNote: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  icd10Codes: ICD10Code[];
  tariffCodes: TariffItem[];
  prescriptions: NappiMedication[];
  handwrittenCanvasUrl?: string;
  handwrittenTranscription?: string;
  speechDictationRaw?: string;
  claimId?: string;
  claimStatus?: 'NOT_CLAIMED' | 'SUBMITTED' | 'PAID' | 'PARTIAL' | 'REJECTED';
  followUpDays?: number;
  isPMB?: boolean;
}

export interface MedicalAidClaim {
  id: string;
  claimRef: string;
  patientId: string;
  patientName: string;
  schemeCode: string;
  schemeName: string;
  membershipNumber: string;
  dependantCode: string;
  serviceDate: string;
  submissionDate: string;
  totalClaimZAR: number;
  paidZAR: number;
  coPayZAR: number;
  switchStatus: 'QUEUED' | 'SWITCHED' | 'ADJUDICATED_PAID' | 'PARTIALLY_PAID' | 'REJECTED' | 'PENDING_PREAUTH';
  rejectionCode?: string;
  rejectionReason?: string;
  switchTransactionId: string;
  batchNumber: string;
  items: Array<{
    type: 'TARIFF' | 'NAPPI';
    code: string;
    description: string;
    amountZAR: number;
    paidZAR: number;
    status: 'ACCEPTED' | 'REJECTED' | 'COPAY';
  }>;
}

export interface SpecialistReferral {
  id: string;
  patientId: string;
  patientName: string;
  patientIdNumber: string;
  specialistType: string; // e.g. "Cardiologist", "Neurologist", "Radiologist"
  doctorName: string;
  hospital: string;
  urgency: 'Routine (Within 2 weeks)' | 'Urgent (Within 48h)' | 'Emergency (Immediate Transfer)';
  reason: string;
  clinicalSummary: string;
  investigationsSummary: string;
  motivationLetter: string;
  dateCreated: string;
  status: 'Draft' | 'Sent via Switch' | 'Accepted by Specialist' | 'Consultation Completed';
}

export interface LocumSlotRequest {
  id: string;
  practiceRoom: string;
  date: string;
  timeSlot: string; // e.g. "08:00 - 13:00"
  hours: number;
  ratePerHourZAR: number;
  status: 'OPEN_SEARCHING' | 'AUTO_MATCHED' | 'CONFIRMED' | 'ACTIVE' | 'SETTLED';
  matchedDoctor?: {
    id: string;
    name: string;
    hpcsaNumber: string;
    qualification: string;
    rating: number;
    completedShifts: number;
    verifiedHPCSA: boolean;
    phone: string;
  };
}

export interface DoctorCPDCertificate {
  id: string;
  title: string;
  provider: string; // e.g. "SAMA", "HPCSA", "Wits Health Consortium", "Medscape"
  category: 'Clinical Medical' | 'Ethics, Human Rights & Medical Law';
  ceuPoints: number;
  dateCompleted: string;
  expiryDate: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'AVAILABLE';
  certificateUrl?: string;
}

export interface PatientMedicineReminder {
  id: string;
  patientId: string;
  medicineName: string;
  dosage: string;
  timeOfDay: string[]; // e.g. ["08:00", "20:00"]
  instructions: string;
  repeatsRemaining: number;
  nextRefillDate: string;
  takenToday: boolean;
  streakDays: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  details: string;
  ipAddress: string;
  standard: 'HIPAA §164.312(b)' | 'POPIA Act 4 2013' | 'HPCSA Ethical Guidelines';
  hash: string;
}
