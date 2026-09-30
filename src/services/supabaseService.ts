import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type Patient = Database['public']['Tables']['patients']['Row'];
type PatientInsert = Database['public']['Tables']['patients']['Insert'];
type PatientUpdate = Database['public']['Tables']['patients']['Update'];

type Appointment = Database['public']['Tables']['appointments']['Row'];
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

type Consultation = Database['public']['Tables']['consultations']['Row'];
type ConsultationInsert = Database['public']['Tables']['consultations']['Insert'];
type ConsultationUpdate = Database['public']['Tables']['consultations']['Update'];

type Claim = Database['public']['Tables']['claims']['Row'];
type ClaimInsert = Database['public']['Tables']['claims']['Insert'];
type ClaimUpdate = Database['public']['Tables']['claims']['Update'];

type Payment = Database['public']['Tables']['payments']['Row'];
type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];

type User = Database['public']['Tables']['users']['Row'];

export class SupabaseService {
  private practiceId: string;

  constructor(practiceId: string) {
    this.practiceId = practiceId;
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (error) return null;
    return data;
  }

  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
  }

  async signUp(email: string, password: string, metadata: { full_name: string; practice_id: string; role: string }) {
    return await supabase.auth.signUp({ email, password, options: { data: metadata } });
  }

  async signOut() {
    return await supabase.auth.signOut();
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  async getPatients(options?: { search?: string; limit?: number; offset?: number }): Promise<{ data: Patient[] | null; error: any }> {
    let query = supabase
      .from('patients')
      .select('*')
      .eq('practice_id', this.practiceId)
      .eq('is_active', true)
      .order('last_name', { ascending: true });

    if (options?.search) {
      query = query.or(`first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,id_number.ilike.%${options.search}%`);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    return await query;
  }

  async getPatient(id: string): Promise<{ data: Patient | null; error: any }> {
    return await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .eq('practice_id', this.practiceId)
      .single();
  }

  async createPatient(patient: PatientInsert): Promise<{ data: Patient | null; error: any }> {
    return await supabase
      .from('patients')
      .insert({ ...patient, practice_id: this.practiceId })
      .select()
      .single();
  }

  async updatePatient(id: string, updates: PatientUpdate): Promise<{ data: Patient | null; error: any }> {
    return await supabase
      .from('patients')
      .update(updates)
      .eq('id', id)
      .eq('practice_id', this.practiceId)
      .select()
      .single();
  }

  async deletePatient(id: string): Promise<{ error: any }> {
    return await supabase
      .from('patients')
      .update({ is_active: false })
      .eq('id', id)
      .eq('practice_id', this.practiceId);
  }

  async getAppointments(options?: { date?: string; status?: string; doctorId?: string; limit?: number }): Promise<{ data: Appointment[] | null; error: any }> {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        patients:patient_id (id, first_name, last_name, phone, email),
        doctors:doctor_id (id, full_name)
      `)
      .eq('practice_id', this.practiceId)
      .order('scheduled_at', { ascending: true });

    if (options?.date) {
      const start = new Date(options.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(options.date);
      end.setHours(23, 59, 59, 999);
      query = query.gte('scheduled_at', start.toISOString()).lte('scheduled_at', end.toISOString());
    }

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.doctorId) {
      query = query.eq('doctor_id', options.doctorId);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    return await query;
  }

  async getAppointment(id: string): Promise<{ data: Appointment | null; error: any }> {
    return await supabase
      .from('appointments')
      .select(`
        *,
        patients:patient_id (*),
        doctors:doctor_id (*)
      `)
      .eq('id', id)
      .eq('practice_id', this.practiceId)
      .single();
  }

  async createAppointment(appointment: AppointmentInsert): Promise<{ data: Appointment | null; error: any }> {
    return await supabase
      .from('appointments')
      .insert({ ...appointment, practice_id: this.practiceId })
      .select()
      .single();
  }

  async updateAppointment(id: string, updates: AppointmentUpdate): Promise<{ data: Appointment | null; error: any }> {
    return await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .eq('practice_id', this.practiceId)
      .select()
      .single();
  }

  async deleteAppointment(id: string): Promise<{ error: any }> {
    return await supabase
      .from('appointments')
      .delete()
      .eq('id', id)
      .eq('practice_id', this.practiceId);
  }

  async getConsultations(options?: { patientId?: string; limit?: number }): Promise<{ data: Consultation[] | null; error: any }> {
    let query = supabase
      .from('consultations')
      .select(`
        *,
        patients:patient_id (id, first_name, last_name),
        doctors:doctor_id (id, full_name)
      `)
      .eq('practice_id', this.practiceId)
      .order('created_at', { ascending: false });

    if (options?.patientId) {
      query = query.eq('patient_id', options.patientId);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    return await query;
  }

  async getConsultation(id: string): Promise<{ data: Consultation | null; error: any }> {
    return await supabase
      .from('consultations')
      .select('*')
      .eq('id', id)
      .eq('practice_id', this.practiceId)
      .single();
  }

  async createConsultation(consultation: ConsultationInsert): Promise<{ data: Consultation | null; error: any }> {
    return await supabase
      .from('consultations')
      .insert({ ...consultation, practice_id: this.practiceId })
      .select()
      .single();
  }

  async updateConsultation(id: string, updates: ConsultationUpdate): Promise<{ data: Consultation | null; error: any }> {
    return await supabase
      .from('consultations')
      .update(updates)
      .eq('id', id)
      .eq('practice_id', this.practiceId)
      .select()
      .single();
  }

  async getClaims(options?: { status?: string; patientId?: string; limit?: number }): Promise<{ data: Claim[] | null; error: any }> {
    let query = supabase
      .from('claims')
      .select(`
        *,
        patients:patient_id (id, first_name, last_name, medical_aid),
        consultations:consultation_id (id, type, total_amount)
      `)
      .eq('practice_id', this.practiceId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.patientId) {
      query = query.eq('patient_id', options.patientId);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    return await query;
  }

  async getClaim(id: string): Promise<{ data: Claim | null; error: any }> {
    return await supabase
      .from('claims')
      .select('*')
      .eq('id', id)
      .eq('practice_id', this.practiceId)
      .single();
  }

  async createClaim(claim: ClaimInsert): Promise<{ data: Claim | null; error: any }> {
    return await supabase
      .from('claims')
      .insert({ ...claim, practice_id: this.practiceId })
      .select()
      .single();
  }

  async updateClaim(id: string, updates: ClaimUpdate): Promise<{ data: Claim | null; error: any }> {
    return await supabase
      .from('claims')
      .update(updates)
      .eq('id', id)
      .eq('practice_id', this.practiceId)
      .select()
      .single();
  }

  async getPayments(options?: { patientId?: string; claimId?: string; status?: string; limit?: number }): Promise<{ data: Payment[] | null; error: any }> {
    let query = supabase
      .from('payments')
      .select(`
        *,
        patients:patient_id (id, first_name, last_name),
        claims:claim_id (id, claim_number)
      `)
      .eq('practice_id', this.practiceId)
      .order('created_at', { ascending: false });

    if (options?.patientId) {
      query = query.eq('patient_id', options.patientId);
    }

    if (options?.claimId) {
      query = query.eq('claim_id', options.claimId);
    }

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    return await query;
  }

  async createPayment(payment: PaymentInsert): Promise<{ data: Payment | null; error: any }> {
    return await supabase
      .from('payments')
      .insert({ ...payment, practice_id: this.practiceId })
      .select()
      .single();
  }

  async updatePayment(id: string, updates: PaymentUpdate): Promise<{ data: Payment | null; error: any }> {
    return await supabase
      .from('payments')
      .update(updates)
      .eq('id', id)
      .eq('practice_id', this.practiceId)
      .select()
      .single();
  }

  async getInvoices(options?: { patientId?: string; status?: string; limit?: number }): Promise<{ data: Invoice[] | null; error: any }> {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        patients:patient_id (id, first_name, last_name)
      `)
      .eq('practice_id', this.practiceId)
      .order('issue_date', { ascending: false });

    if (options?.patientId) {
      query = query.eq('patient_id', options.patientId);
    }

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    return await query;
  }

  async createInvoice(invoice: InvoiceInsert): Promise<{ data: Invoice | null; error: any }> {
    return await supabase
      .from('invoices')
      .insert({ ...invoice, practice_id: this.practiceId })
      .select()
      .single();
  }

  async getPracticeStats(): Promise<{ data: any[] | null; error: any }> {
    return await supabase.rpc('get_practice_stats', { practice_id: this.practiceId });
  }

  async getClaimsAging(asOfDate?: string): Promise<{ data: any[] | null; error: any }> {
    return await supabase.rpc('get_claims_aging', { 
      practice_id: this.practiceId,
      as_of_date: asOfDate || new Date().toISOString().split('T')[0]
    });
  }

  async logAudit(action: string, resourceType: string, resourceId: string | null, oldValues: any, newValues: any) {
    const { data: { user } } = await supabase.auth.getUser();
    return await supabase.from('audit_logs').insert({
      practice_id: this.practiceId,
      user_id: user?.id || null,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_values: oldValues,
      new_values: newValues,
    });
  }
}

export function createSupabaseService(practiceId: string) {
  return new SupabaseService(practiceId);
}