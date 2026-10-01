import { createClient, SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase credentials not configured. Using mock client.');
      return createMockClient();
    }
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
  }
  return supabaseInstance;
}

function createMockClient(): SupabaseClient<Database> {
  return createClient<Database>('http://localhost:54321', 'mock-key');
}

export const supabase = getSupabaseClient();

export type AuthUser = User & {
  user_metadata: {
    full_name?: string;
    role?: string;
    practice_id?: string;
    trial_ends_at?: string;
    subscription_status?: string;
  };
  app_metadata: {
    provider?: string;
    providers?: string[];
  };
};

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  practiceName: string;
  practiceNumber: string;
  hpcsaNumber: string;
  phone: string;
  acceptTerms: boolean;
  acceptMarketing: boolean;
}

export interface SignInData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  password: string;
  confirmPassword: string;
}

export interface TrialStatus {
  isOnTrial: boolean;
  trialEndsAt: string | null;
  daysRemaining: number;
  hasPaymentMethod: boolean;
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'cancelled' | 'none';
  planName: string;
}

export class AuthService {
  private static instance: AuthService;
  private client: SupabaseClient<Database>;

  private constructor() {
    this.client = getSupabaseClient();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signUp(data: SignUpData): Promise<{ user: AuthUser | null; session: Session | null; error: AuthError | null }> {
    try {
      const { data: authData, error } = await this.client.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: 'doctor',
            practice_name: data.practiceName,
            practice_number: data.practiceNumber,
            hpcsa_number: data.hpcsaNumber,
            phone: data.phone,
            accept_terms: data.acceptTerms,
            accept_marketing: data.acceptMarketing,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) return { user: null, session: null, error };

      if (authData.user && !authData.session) {
        // Email confirmation required
        return { user: authData.user as AuthUser, session: null, error: null };
      }

      return { user: authData.user as AuthUser, session: authData.session, error: null };
    } catch (err) {
      return { user: null, session: null, error: err as AuthError };
    }
  }

  async signIn(data: SignInData): Promise<{ user: AuthUser | null; session: Session | null; error: AuthError | null }> {
    try {
      const { data: authData, error } = await this.client.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) return { user: null, session: null, error };

      return { user: authData.user as AuthUser, session: authData.session, error: null };
    } catch (err) {
      return { user: null, session: null, error: err as AuthError };
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.client.auth.signOut();
      return { error };
    } catch (err) {
      return { error: err as AuthError };
    }
  }

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      return { error };
    } catch (err) {
      return { error: err as AuthError };
    }
  }

  async updatePassword(password: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.client.auth.updateUser({ password });
      return { error };
    } catch (err) {
      return { error: err as AuthError };
    }
  }

  async getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.client.auth.getSession();
      return { session: data.session, error };
    } catch (err) {
      return { session: null, error: err as AuthError };
    }
  }

  async getUser(): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.client.auth.getUser();
      return { user: data.user as AuthUser | null, error };
    } catch (err) {
      return { user: null, error: err as AuthError };
    }
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.client.auth.onAuthStateChange(callback);
  }

  async getTrialStatus(): Promise<TrialStatus> {
    const { user } = await this.getUser();
    if (!user) {
      return {
        isOnTrial: false,
        trialEndsAt: null,
        daysRemaining: 0,
        hasPaymentMethod: false,
        subscriptionStatus: 'none',
        planName: 'Free',
      };
    }

    const trialEndsAt = user.user_metadata.trial_ends_at;
    const subscriptionStatus = user.user_metadata.subscription_status || 'none';
    const hasPaymentMethod = !!user.user_metadata.payment_method_id;

    let isOnTrial = false;
    let daysRemaining = 0;

    if (trialEndsAt && subscriptionStatus === 'trial') {
      const endDate = new Date(trialEndsAt);
      const now = new Date();
      isOnTrial = endDate > now;
      daysRemaining = isOnTrial ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    }

    return {
      isOnTrial,
      trialEndsAt,
      daysRemaining,
      hasPaymentMethod,
      subscriptionStatus: subscriptionStatus as TrialStatus['subscriptionStatus'],
      planName: user.user_metadata.plan_name || 'Free',
    };
  }

  async startTrial(paymentMethodId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      const { error } = await this.client.auth.updateUser({
        data: {
          trial_ends_at: trialEndsAt.toISOString(),
          subscription_status: 'trial',
          payment_method_id: paymentMethodId,
          plan_name: 'Professional (7-day trial)',
        },
      });

      if (error) return { success: false, error: error.message };

      // Create practice record
      const { data: userData } = await this.getUser();
      if (userData?.user) {
        await this.createPracticeForUser(userData.user.id, paymentMethodId, trialEndsAt);
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  private async createPracticeForUser(userId: string, paymentMethodId: string, trialEndsAt: Date) {
    const { data: userData } = await this.getUser();
    if (!userData?.user) return;

    const metadata = userData.user.user_metadata;
    const practiceName = metadata.practice_name || `${metadata.full_name || 'Dr'}'s Practice`;

    await this.client.from('practices').insert({
      id: userId,
      name: practiceName,
      practice_number: metadata.practice_number || '',
      hpcsa_number: metadata.hpcsa_number || '',
      address: {},
      contact: { phone: metadata.phone, email: userData.user.email },
      settings: {
        trial_ends_at: trialEndsAt.toISOString(),
        payment_method_id: paymentMethodId,
        subscription_status: 'trial',
      },
    });
  }

  async cancelSubscription(): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await this.client.auth.updateUser({
        data: {
          subscription_status: 'cancelled',
        },
      });

      if (error) return { success: false, error: error.message };

      // Update practice record
      const { data: userData } = await this.getUser();
      if (userData?.user) {
        await this.client
          .from('practices')
          .update({ settings: { subscription_status: 'cancelled' } })
          .eq('id', userData.user.id);
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}

export const authService = AuthService.getInstance();