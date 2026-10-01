import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Shield, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, ArrowRight, Lock } from 'lucide-react';

interface TrialGateProps {
  isOpen: boolean;
  onClose: () => void;
  onTrialStarted: () => void;
}

export const TrialGateModal: React.FC<TrialGateProps> = ({ isOpen, onClose, onTrialStarted }) => {
  const { startTrial, getTrialStatus, user } = useAuth();
  const [step, setStep] = useState<'info' | 'payment' | 'processing' | 'success' | 'error'>('info');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trialStatus, setTrialStatus] = useState<{ daysRemaining: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkTrialStatus();
    }
  }, [isOpen]);

  const checkTrialStatus = async () => {
    const status = await getTrialStatus();
    setTrialStatus({ daysRemaining: status.daysRemaining });
    if (status.isOnTrial && status.daysRemaining > 0) {
      onTrialStarted();
      onClose();
    }
  };

  const handleStartTrial = async () => {
    setStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setStep('processing');

    // In production, this would integrate with Stripe/PayFast/Yoco
    // For demo, we'll simulate a payment method token
    const mockPaymentMethodId = `pm_demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const { error } = await startTrial(mockPaymentMethodId);
      if (error) {
        setError(error);
        setStep('error');
      } else {
        setStep('success');
        setTimeout(() => {
          onTrialStarted();
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError('Failed to start trial. Please try again.');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setStep('payment');
  };

  if (!isOpen) return null;

  const renderInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-cyan-950/50 border border-cyan-800 flex items-center justify-center">
          <Shield className="w-10 h-10 text-cyan-400" />
        </div>
        <h2 className="text-2xl font-extrabold text-white">Start Your 7-Day Free Trial</h2>
        <p className="text-slate-300 mt-2">Full access to MedSwitch SA Professional - no restrictions</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-800 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-white">R0 for 7 days</p>
            <p className="text-xs text-slate-400">No charge during trial period</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/50 border border-cyan-800 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Card required to start</p>
            <p className="text-xs text-slate-400">Pre-authorizes R0, auto-charges after trial if not cancelled</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950/50 border border-amber-800 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Cancel anytime</p>
            <p className="text-xs text-slate-400">No charge if cancelled before trial ends</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/50 border border-purple-800 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Secure & POPIA compliant</p>
            <p className="text-xs text-slate-400">We never store your card details</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded-2xl">
        <div className="flex items-center space-x-2 text-amber-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>After 7 days: R499/month (Professional) or R899/month (Practice). Cancel before trial ends to avoid charges.</span>
        </div>
      </div>

      <button
        onClick={handleStartTrial}
        className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white font-bold rounded-xl transition shadow-lg shadow-cyan-950/30 flex items-center justify-center space-x-2"
      >
        <span>Start Free Trial</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-xl font-extrabold text-white">Enter Card Details</h2>
        <p className="text-slate-400 text-sm">Secure payment processing via PayFast / Yoco</p>
      </div>

      <form onSubmit={handlePaymentSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Card Number</label>
          <input
            type="text"
            placeholder="4242 4242 4242 4242"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 font-mono text-sm"
            maxLength={19}
            required
            onChange={(e) => {
              const value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
              const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
              e.target.value = formatted;
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Expiry</label>
            <input
              type="text"
              placeholder="MM/YY"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 font-mono text-sm"
              maxLength={5}
              required
              onChange={(e) => {
                const value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
                const formatted = value.length > 2 ? `${value.slice(0, 2)}/${value.slice(2, 4)}` : value;
                e.target.value = formatted;
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">CVC</label>
            <input
              type="text"
              placeholder="123"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 font-mono text-sm"
              maxLength={4}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Name on Card</label>
          <input
            type="text"
            placeholder="DR THABO NDLOVU"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 text-sm"
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-rose-950/50 border border-rose-800/50 rounded-xl text-rose-300 text-sm flex items-center space-x-2">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Start 7-Day Trial (R0)</span>
              <Lock className="w-4 h-4" />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setStep('info')}
          className="w-full py-2.5 text-slate-400 hover:text-white text-sm font-medium"
        >
          Back
        </button>
      </form>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
      <h3 className="text-xl font-bold text-white">Activating your trial...</h3>
      <p className="text-slate-400">Setting up your practice workspace</p>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950/50 border border-emerald-800 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
      </div>
      <h3 className="text-xl font-bold text-white">Trial Activated!</h3>
      <p className="text-slate-300">Your 7-day free trial has started. Welcome to MedSwitch SA Professional.</p>
      <div className="p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-2xl text-emerald-200 text-sm">
        Trial ends in 7 days • Auto-renews at R499/month • Cancel anytime
      </div>
    </div>
  );

  const renderErrorStep = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-rose-950/50 border border-rose-800 flex items-center justify-center">
        <XCircle className="w-8 h-8 text-rose-400" />
      </div>
      <h3 className="text-xl font-bold text-white">Something went wrong</h3>
      <p className="text-slate-300">{error || 'Failed to start trial. Please try again.'}</p>
      <button
        onClick={handleRetry}
        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="p-6 pb-4">
          {step === 'info' && renderInfoStep()}
          {step === 'payment' && renderPaymentStep()}
          {step === 'processing' && renderProcessingStep()}
          {step === 'success' && renderSuccessStep()}
          {step === 'error' && renderErrorStep()}
        </div>
      </div>
    </div>
  );
};