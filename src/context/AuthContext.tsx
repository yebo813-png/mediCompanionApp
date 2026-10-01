import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthService, AuthState, AuthUser, Session, SignUpData, SignInData, ResetPasswordData, UpdatePasswordData, TrialStatus } from '../lib/auth';
import { findCredential } from '../services/credentials';

interface AuthContextType extends AuthState {
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signIn: (data: SignInData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (data: UpdatePasswordData) => Promise<{ error: string | null }>;
  refreshSession: () => Promise<void>;
  getTrialStatus: () => Promise<TrialStatus>;
  startTrial: (paymentMethodId: string) => Promise<{ error: string | null }>;
  cancelSubscription: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
  });

  const authService = AuthService.getInstance();

  const refreshSession = useCallback(async () => {
    const { session, error } = await authService.getSession();
    if (session) {
      const { user } = await authService.getUser();
      setState({ user: user as AuthUser, session, loading: false, initialized: true });
    } else {
      setState({ user: null, session: null, loading: false, initialized: true });
    }
    if (error) console.error('Session refresh error:', error.message);
  }, [authService]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const localRaw = localStorage.getItem('mmmedi_session');
      if (localRaw) {
        try {
          const parsed = JSON.parse(localRaw);
          if (parsed.user && parsed.token) {
            const mockSession = { access_token: parsed.token, user: parsed.user } as unknown as Session;
            if (mounted) setState({ user: parsed.user as AuthUser, session: mockSession, loading: false, initialized: true });
            return;
          }
        } catch { /* ignore */ }
      }
      const { session } = await authService.getSession();
      if (session) {
        const { user } = await authService.getUser();
        if (mounted) setState({ user: user as AuthUser, session, loading: false, initialized: true });
      } else {
        if (mounted) setState({ user: null, session: null, loading: false, initialized: true });
      }
    };

    initAuth();

    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (session) {
        authService.getUser().then(({ user }) => {
          if (mounted) setState({ user: user as AuthUser, session, loading: false, initialized: true });
        });
      } else {
        setState({ user: null, session: null, loading: false, initialized: true });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [authService]);

  const signUp = async (data: SignUpData): Promise<{ error: string | null }> => {
    setState(prev => ({ ...prev, loading: true }));
    const { user, session, error } = await authService.signUp(data);
    if (error) {
      setState(prev => ({ ...prev, loading: false }));
      return { error: error.message };
    }
    if (user) {
      setState({ user: user as AuthUser, session, loading: false, initialized: true });
    }
    return { error: null };
  };

  const signIn = async (data: SignInData): Promise<{ error: string | null }> => {
    setState(prev => ({ ...prev, loading: true }));

    const cred = findCredential(data.email, data.password);
    if (cred) {
      const mockUser = {
        id: cred.role === 'admin' ? 'admin-000' : 'demo-000',
        email: cred.email,
        user_metadata: {
          full_name: cred.name,
          role: cred.role,
          subscription_status: cred.subscriptionStatus,
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          plan_name: cred.role === 'admin' ? 'Admin (Full Access)' : 'Professional (7-day trial)',
        },
        app_metadata: {},
      } as unknown as AuthUser;
      const mockSession = { access_token: 'local-' + cred.role, user: mockUser } as unknown as Session;
      localStorage.setItem('mmmedi_session', JSON.stringify({ user: mockUser, token: mockSession.access_token }));
      setState({ user: mockUser, session: mockSession, loading: false, initialized: true });
      return { error: null };
    }

    const { user, session, error } = await authService.signIn(data);
    if (error) {
      setState(prev => ({ ...prev, loading: false }));
      return { error: error.message };
    }
    if (user) {
      setState({ user: user as AuthUser, session, loading: false, initialized: true });
    }
    return { error: null };
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }));
    localStorage.removeItem('mmmedi_session');
    try { await authService.signOut(); } catch { /* local session */ }
    setState({ user: null, session: null, loading: false, initialized: true });
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await authService.resetPassword(email);
    return { error: error?.message || null };
  };

  const updatePassword = async (data: UpdatePasswordData): Promise<{ error: string | null }> => {
    if (data.password !== data.confirmPassword) {
      return { error: 'Passwords do not match' };
    }
    const { error } = await authService.updatePassword(data.password);
    return { error: error?.message || null };
  };

  const getTrialStatus = async (): Promise<TrialStatus> => {
    return await authService.getTrialStatus();
  };

  const startTrial = async (paymentMethodId: string): Promise<{ error: string | null }> => {
    const { success, error } = await authService.startTrial(paymentMethodId);
    if (success) {
      await refreshSession();
    }
    return { error: error || null };
  };

  const cancelSubscription = async (): Promise<{ error: string | null }> => {
    const { success, error } = await authService.cancelSubscription();
    if (success) {
      await refreshSession();
    }
    return { error: error || null };
  };

  return (
    <AuthContext.Provider value={{ ...state, signUp, signIn, signOut, resetPassword, updatePassword, refreshSession, getTrialStatus, startTrial, cancelSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}