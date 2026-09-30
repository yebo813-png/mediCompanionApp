import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  AlertCircle,
  Clock,
  Sparkles,
  X,
  Zap,
  Check,
  AlertTriangle,
  ChevronRight,
  Info,
  Smartphone,
  MessageSquare,
  Building,
  RotateCcw,
  ExternalLink,
  Calendar,
  HelpCircle,
  PlayCircle,
} from 'lucide-react';

export interface TrialSubscription {
  isActive: boolean;
  status: 'NOT_STARTED' | 'ACTIVE_TRIAL' | 'CANCELLED_BEFORE_CHARGE' | 'CONVERTED_TO_BILLING';
  startDate: string;
  endDate: string;
  daysRemaining: number;
  planId: 'solo' | 'professional' | 'group';
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  monthlyPriceZar: number;
  gateway: 'paystack' | 'peach' | 'ozow' | 'payfast';
  paystackAuthCode?: string;
  is3DS2Verified?: boolean;
  isExtended3Days?: boolean;
  cardDetails: {
    brand: 'visa' | 'mastercard' | 'amex';
    cardNumberMasked: string;
    expiry: string;
    cardholderName: string;
    postalCode: string;
  } | null;
  autoRenew: boolean;
  deactivatedAt: string | null;
}

interface TryTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  trialSubscription: TrialSubscription;
  onActivateTrial: (subscriptionData: TrialSubscription) => void;
  onDeactivateTrial: () => void;
  onExtendTrial3Days?: () => void;
  onLaunchSandbox?: () => void;
  initialPlan?: 'solo' | 'professional' | 'group';
  initialCycle?: 'monthly' | 'yearly';
}

export const TryTrialModal: React.FC<TryTrialModalProps> = ({
  isOpen,
  onClose,
  trialSubscription,
  onActivateTrial,
  onDeactivateTrial,
  onExtendTrial3Days,
  onLaunchSandbox,
  initialPlan = 'professional',
  initialCycle = 'monthly',
}) => {
  if (!isOpen) return null;

  // Dual Onboarding Path: 'card_trial' (Full Switchway) vs 'no_card_sandbox' (Instant Interactive Demo)
  const [onboardingPath, setOnboardingPath] = useState<'card_trial' | 'no_card_sandbox'>('card_trial');

  // Selected plan in modal
  const [selectedPlan, setSelectedPlan] = useState<'solo' | 'professional' | 'group'>(
    trialSubscription.isActive ? trialSubscription.planId : initialPlan
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    trialSubscription.isActive ? trialSubscription.billingCycle : initialCycle
  );

  // Gateway Selection (Recommendation 4)
  const [selectedGateway, setSelectedGateway] = useState<'paystack' | 'peach' | 'ozow' | 'payfast'>('paystack');

  // Form Fields
  const [cardholderName, setCardholderName] = useState<string>('Dr. Thabo Ndlovu');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [expiry, setExpiry] = useState<string>('');
  const [cvc, setCvc] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('8001');
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(true);

  // Bank for 3DS2 Simulation (FNB, Standard Bank, Capitec, Nedbank, Absa)
  const [selectedBank, setSelectedBank] = useState<string>('FNB');

  // Flow Steps: 'form' | '3ds2_challenge' | 'success'
  const [activeStep, setActiveStep] = useState<'form' | '3ds2_challenge' | 'success'>('form');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSimulatingBankPush, setIsSimulatingBankPush] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState<boolean>(false);

  // Recommendation 2: Interactive Day 5 WhatsApp & Email Notice Preview
  const [showDay5NoticePreview, setShowDay5NoticePreview] = useState<boolean>(false);

  // Plan Prices in ZAR
  const planPrices = {
    solo: { monthly: 1290, yearly: 1050, name: 'Solo Starter' },
    professional: { monthly: 2190, yearly: 1750, name: 'Professional Practice' },
    group: { monthly: 4890, yearly: 3900, name: 'Group Practice & Clinic' },
  };

  const currentPlanInfo = planPrices[selectedPlan];
  const recurringPrice =
    billingCycle === 'yearly' ? currentPlanInfo.yearly : currentPlanInfo.monthly;

  // Calculate 7-day end date
  const now = new Date();
  const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const day5Date = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  const formattedEndDate = endDate.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedDay5Date = day5Date.toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  // Card formatting
  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      setExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setExpiry(raw);
    }
  };

  // Quick fill test card
  const handleUseDemoCard = (type: 'visa' | 'mastercard') => {
    if (type === 'visa') {
      setCardNumber('4000 1234 5678 4242');
      setExpiry('12/28');
      setCvc('382');
      setCardholderName('Dr. Thabo Ndlovu');
      setPostalCode('8001');
    } else {
      setCardNumber('5500 0000 0000 8821');
      setExpiry('09/29');
      setCvc('749');
      setCardholderName('Dr. Thabo Ndlovu');
      setPostalCode('2196');
    }
    setErrorMessage(null);
  };

  // Step 1: Validate Card & Trigger Paystack 3DS2 Challenge (Recommendation 4)
  const handleInitiateCardAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCard = cardNumber.replace(/\s/g, '');
    if (cleanCard.length < 15) {
      setErrorMessage('Please enter a valid 16-digit credit card number.');
      return;
    }
    if (expiry.length < 5) {
      setErrorMessage('Please enter a valid expiry date (MM/YY).');
      return;
    }
    if (cvc.length < 3) {
      setErrorMessage('Please enter a 3 or 4-digit security code (CVC).');
      return;
    }
    if (!agreedToTerms) {
      setErrorMessage('Please agree to the trial terms and South African CPA Section 14 notice.');
      return;
    }

    setIsProcessing(true);

    // Transition to Paystack 3DS2 challenge screen
    setTimeout(() => {
      setIsProcessing(false);
      setActiveStep('3ds2_challenge');
    }, 700);
  };

  // Step 2: Complete simulated Paystack 3DS2 In-App Push Authorization
  const handleComplete3DS2Approval = () => {
    setIsSimulatingBankPush(true);
    setTimeout(() => {
      setIsSimulatingBankPush(false);
      const cleanCard = cardNumber.replace(/\s/g, '');
      const isVisa = cleanCard.startsWith('4');
      const isAmex = cleanCard.startsWith('34') || cleanCard.startsWith('37');
      const brand: 'visa' | 'mastercard' | 'amex' = isVisa ? 'visa' : isAmex ? 'amex' : 'mastercard';

      const subscription: TrialSubscription = {
        isActive: true,
        status: 'ACTIVE_TRIAL',
        startDate: new Date().toISOString(),
        endDate: endDate.toISOString(),
        daysRemaining: 7,
        planId: selectedPlan,
        planName: currentPlanInfo.name,
        billingCycle,
        monthlyPriceZar: recurringPrice,
        gateway: selectedGateway,
        paystackAuthCode: `AUTH_sa_token_${Math.random().toString(36).substring(2, 10)}`,
        is3DS2Verified: true,
        isExtended3Days: false,
        cardDetails: {
          brand,
          cardNumberMasked: `•••• •••• •••• ${cleanCard.slice(-4) || '4242'}`,
          expiry: expiry || '12/28',
          cardholderName: cardholderName || 'Dr. Thabo Ndlovu',
          postalCode: postalCode || '8001',
        },
        autoRenew: true,
        deactivatedAt: null,
      };

      onActivateTrial(subscription);
      setActiveStep('success');
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl text-slate-900 dark:text-slate-100 relative animate-in fade-in zoom-in-95 my-auto max-h-[95vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* VIEW 1: ACTIVE TRIAL MANAGEMENT & CPA COMPLIANCE */}
        {trialSubscription.isActive && !showDeactivateConfirm && activeStep !== 'success' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500 text-slate-950">
                    7-Day Live Switch Trial Active
                  </span>
                  {trialSubscription.is3DS2Verified && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Paystack 3DS2 Verified</span>
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  Practice Trial & Automated Billing Status
                </h2>
              </div>
            </div>

            {/* Trial Countdown Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-500/10 via-slate-50 to-cyan-500/10 dark:from-teal-950/40 dark:via-slate-900 dark:to-cyan-950/30 border border-teal-500/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Plan In Trial:</div>
                  <div className="text-lg font-black text-teal-600 dark:text-teal-400">
                    {trialSubscription.planName} ({trialSubscription.billingCycle})
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    First recurring billing of <strong className="font-mono text-slate-900 dark:text-white">R {trialSubscription.monthlyPriceZar.toLocaleString()}</strong> occurs on{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {new Date(trialSubscription.endDate).toLocaleDateString('en-ZA', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </strong>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                    {trialSubscription.daysRemaining} Days
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    Full Features Unlocked
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 pt-3 border-t border-teal-200/60 dark:border-teal-900/60">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
                  <span>Day 1 (Started Today)</span>
                  <span>Day 7 (Billing Starts)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full w-[14%] rounded-full" />
                </div>
              </div>
            </div>

            {/* Recommendation 3: +3 Days Extension Banner */}
            {!trialSubscription.isExtended3Days && onExtendTrial3Days && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-start space-x-2.5">
                  <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-900 dark:text-amber-200">
                      Need more time to test with reception?
                    </div>
                    <div className="text-amber-700 dark:text-amber-300 text-[11px]">
                      Medical aid batching and reception cycles take time. Extend your trial by +3 days for free.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onExtendTrial3Days}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shrink-0 cursor-pointer shadow-xs"
                >
                  Extend +3 Days Free
                </button>
              </div>
            )}

            {/* Recommendation 2: South African CPA Section 14 Notice Card */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white">
                  <Smartphone className="w-4 h-4 text-teal-500" />
                  <span>CPA Section 14 Pre-Billing Reminder: Active</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDay5NoticePreview(!showDay5NoticePreview)}
                  className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer flex items-center space-x-1"
                >
                  <span>{showDay5NoticePreview ? 'Hide Preview' : 'Preview WhatsApp Alert'}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                To guarantee zero surprise billing under South Africa&apos;s Consumer Protection Act, we will automatically dispatch an alert to your WhatsApp (<strong className="text-slate-900 dark:text-white">+27 82 901 7734</strong>) on <strong>{formattedDay5Date} at 09:00</strong> with a 1-tap deactivation link before any charge occurs.
              </p>

              {/* Interactive WhatsApp Day 5 Preview */}
              {showDay5NoticePreview && (
                <div className="mt-3 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-slate-200 text-xs space-y-2 font-sans animate-in fade-in">
                  <div className="flex items-center space-x-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Practice Notification (Scheduled for Day 5)</span>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-900/30 border border-emerald-800/40 text-[11px] leading-relaxed italic text-emerald-100">
                    &quot;Dr. Ndlovu, your 7-day trial of the Healthbridge-connected switch ends in 48 hours on {formattedEndDate}. If you are enjoying the automated switchway, no action is needed. If you want to cancel, reply &apos;STOP&apos; or tap here to deactivate in 1 click.&quot;
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method On File with Paystack Token */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Card On File for Trial</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                    {trialSubscription.cardDetails?.cardNumberMasked || '•••• •••• •••• 4242'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Paystack Tokenized · {trialSubscription.cardDetails?.cardholderName || 'Dr. Thabo Ndlovu'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                3DS2 Authorized
              </span>
            </div>

            {/* Deactivation / Cancellation Section */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Cancel before Day 7 to ensure you are never billed.
              </div>
              <button
                type="button"
                onClick={() => setShowDeactivateConfirm(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition cursor-pointer"
              >
                Deactivate Trial & Stop Billing
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: CONFIRM DEACTIVATION BEFORE DAY 7 */}
        {showDeactivateConfirm && (
          <div className="space-y-5 text-center py-2 animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Deactivate Trial & Cancel Future Billing?
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                If you deactivate now, your trial will end immediately and your credit card on file will <strong>never be charged</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Zero charges guaranteed (R0.00 billed)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Paystack recurring token invalidated immediately</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Patient records and test notes remain safely accessible in sandbox</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDeactivateConfirm(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Keep My 7-Day Trial
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeactivateTrial();
                  setShowDeactivateConfirm(false);
                  onClose();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Confirm Deactivation (Cancel Billing)
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: TRIAL ACTIVATION WITH RECOMMENDATIONS 1, 2, 4 */}
        {!trialSubscription.isActive && activeStep === 'form' && (
          <div className="space-y-6">
            {/* Recommendation 1: Dual-Path Selector (Live Switch vs Instant Sandbox) */}
            <div className="p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setOnboardingPath('card_trial')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                  onboardingPath === 'card_trial'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>7-Day Full Switch Trial (Card)</span>
              </button>
              <button
                type="button"
                onClick={() => setOnboardingPath('no_card_sandbox')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                  onboardingPath === 'no_card_sandbox'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Instant Sandbox (No Card Needed)</span>
              </button>
            </div>

            {/* SUB-VIEW A: NO-CARD INSTANT SANDBOX (Recommendation 1) */}
            {onboardingPath === 'no_card_sandbox' && (
              <div className="space-y-5 animate-in fade-in">
                <div className="text-center py-2">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-300 flex items-center justify-center mx-auto mb-3">
                    <PlayCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Explore the Interactive Practice Sandbox
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Test drive the complete doctor interface immediately with pre-loaded South African patient charts, clinical SOAP templates, and offline load shedding resilience. No payment details required.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2.5">
                  <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Instant access without entering credit card details</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Simulated claims switchway for Discovery, GEMS, Bonitas</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Nap-script NAPPI database & ICD-10 diagnostic tools</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onLaunchSandbox) onLaunchSandbox();
                      onClose();
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs transition flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                  >
                    <span>Launch Free Practice Sandbox</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnboardingPath('card_trial')}
                    className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    Ready for live claims? Unlock 7-Day Live Trial →
                  </button>
                </div>
              </div>
            )}

            {/* SUB-VIEW B: CARD TRIAL WITH PAYSTACK 3DS2 (Recommendation 1, 2, 4) */}
            {onboardingPath === 'card_trial' && (
              <form onSubmit={handleInitiateCardAuth} className="space-y-5 animate-in fade-in">
                {/* Header */}
                <div>
                  <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>7-Day Full Feature Trial</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    Unlock Live Switching & Doctor Voice AI
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    Input your card below for a ZAR 1.00 verification hold (immediately refunded). Cancel anytime before Day 7 with 1 click to avoid charges.
                  </p>
                </div>

                {/* Plan & Cycle Selection Bar */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Select Practice Plan:</span>
                    <div className="inline-flex items-center p-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          billingCycle === 'monthly'
                            ? 'bg-teal-600 text-white font-bold'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center space-x-1 ${
                          billingCycle === 'yearly'
                            ? 'bg-teal-600 text-white font-bold'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span>Annual</span>
                        <span className="text-[9px] font-black text-emerald-500 uppercase">-20%</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(['solo', 'professional', 'group'] as const).map((planKey) => {
                      const p = planPrices[planKey];
                      const price = billingCycle === 'yearly' ? p.yearly : p.monthly;
                      const isSelected = selectedPlan === planKey;
                      return (
                        <button
                          key={planKey}
                          type="button"
                          onClick={() => setSelectedPlan(planKey)}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer relative ${
                            isSelected
                              ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 ring-1 ring-teal-500/30'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                          }`}
                        >
                          {planKey === 'professional' && (
                            <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-teal-600 text-white">
                              Popular
                            </span>
                          )}
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</div>
                          <div className="text-sm font-black text-teal-600 dark:text-teal-400 font-mono mt-1">
                            R {price.toLocaleString()}
                            <span className="text-[10px] text-slate-500 font-normal">/mo</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Recommendation 4: Gateway Selector with Paystack 3DS2 */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Payment Gateway:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                      Paystack 3DS2 (Stripe)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>EMV 3DS 2.0 In-App Approval</span>
                  </div>
                </div>

                {/* Quick Demo Test Card Fill Bar */}
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/80 px-3.5 py-2.5 rounded-xl">
                  <div className="flex items-center space-x-1.5 text-cyan-800 dark:text-cyan-200 font-medium">
                    <Info className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span>Testing? Fill sample credentials:</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleUseDemoCard('visa')}
                      className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300 text-[11px] font-bold hover:bg-cyan-100/50 transition cursor-pointer"
                    >
                      Fill Demo Visa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUseDemoCard('mastercard')}
                      className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-cyan-300 dark:border-cyan-700 text-cyan-700 dark:text-cyan-300 text-[11px] font-bold hover:bg-cyan-100/50 transition cursor-pointer"
                    >
                      Fill Demo Mastercard
                    </button>
                  </div>
                </div>

                {/* Credit Card Input Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="e.g. Dr. Thabo Ndlovu"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <CreditCard className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        placeholder="4000 1234 5678 9010"
                        maxLength={19}
                        required
                        className="w-full pl-11 pr-14 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 tracking-wider"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1 text-[10px] font-bold text-slate-400">
                        <span>VISA</span>
                        <span>MC</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Expires
                      </label>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => handleExpiryChange(e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        CVC / CVV
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="123"
                          maxLength={4}
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                        />
                        <Lock className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Postal Code (ZA)
                      </label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value.slice(0, 5))}
                        placeholder="8001"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Recommendation 2: South African CPA Section 14 Notice Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-2 text-slate-600 dark:text-slate-300">
                  <div className="flex items-start space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white">CPA Section 14 Compliance:</strong> Automated WhatsApp & email reminder dispatched on Day 5 (48h before Day 7) with a 1-tap deactivation link.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white">R 1.00 Verification Hold:</strong> Paystack places a temporary R1 auth hold to verify 3DS2, immediately refunded.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white">1-Click Cancellation:</strong> Deactivate in your practice dashboard anytime before <strong>{formattedEndDate}</strong> to incur zero recurring charges.
                    </div>
                  </div>
                </div>

                {/* Agreement Checkbox */}
                <label className="flex items-start space-x-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>
                    I authorize the R1.00 verification hold via Paystack 3DS2 and understand that my subscription will begin on {formattedEndDate} unless deactivated prior to that date.
                  </span>
                </label>

                {/* Submit Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Paystack 256-Bit SSL · PASA Compliant</span>
                  </div>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs transition shadow-md shadow-teal-600/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Connecting to Paystack 3DS2...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Proceed to Paystack 3DS2 Verification</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* VIEW 3B: PAYSTACK 3D SECURE 2.0 CHALLENGE SIMULATION (Recommendation 4) */}
        {activeStep === '3ds2_challenge' && (
          <div className="space-y-6 py-3 animate-in fade-in zoom-in-95">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500 text-slate-950">
                Paystack EMV 3D Secure 2.0 Challenge
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                Authorize Practice Verification Hold
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                In compliance with the Payment Association of South Africa (PASA), please confirm the R1.00 card authorization on your banking app.
              </p>
            </div>

            {/* Select Bank for Simulation */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-750 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Select Your Issuing Bank:</span>
                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-mono font-bold">ZAR 1.00 (Refunded)</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {['FNB', 'Standard Bank', 'Capitec', 'Absa', 'Nedbank'].map((bank) => (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => setSelectedBank(bank)}
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition text-center cursor-pointer ${
                      selectedBank === bank
                        ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-300 ring-1 ring-teal-500'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Bank Push Notification Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/60 to-slate-900 border border-teal-800/60 text-slate-200 text-xs space-y-3">
              <div className="flex items-center space-x-2 text-teal-400 font-bold">
                <Smartphone className="w-4 h-4" />
                <span>Simulated {selectedBank} In-App Push Prompt:</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 font-mono text-[11px]">
                <div className="text-slate-400">Merchant: <strong className="text-white">Medical Practice Platform (Paystack)</strong></div>
                <div className="text-slate-400">Amount: <strong className="text-emerald-400">R 1.00 (Auth Hold - Auto Reversed)</strong></div>
                <div className="text-slate-400">Card: <strong className="text-white">•••• {cardNumber.slice(-4) || '4242'}</strong></div>
                <div className="text-[10px] text-slate-500 pt-1">EMV 3DS 2.0 Biometric / Fingerprint / Push notification sent.</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveStep('form')}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-semibold"
              >
                Back to Card Details
              </button>

              <button
                type="button"
                onClick={handleComplete3DS2Approval}
                disabled={isSimulatingBankPush}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs transition shadow-md shadow-teal-600/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
              >
                {isSimulatingBankPush ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Confirming 3DS2 Token with Paystack...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simulate &apos;Approve in {selectedBank} App&apos;</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: SUCCESS CONFIRMATION */}
        {activeStep === 'success' && (
          <div className="text-center py-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500 text-slate-950">
                Paystack 3DS2 Tokenized · Trial Active
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                Welcome to Your 7-Day Live Switch Trial!
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                Live medical aid switching, <strong>Gemini 3.8 Live Doctor Voice AI</strong>, and automated eRA remittances are now active until <strong>{formattedEndDate}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-left text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Card Authorized:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {trialSubscription.cardDetails?.cardNumberMasked}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Security Standard:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  EMV 3D Secure 2.0 (Liability Shifted)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Day 5 CPA WhatsApp Notice:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formattedDay5Date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">First Billing Date:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formattedEndDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Deactivation Policy:</span>
                <span className="text-teal-600 dark:text-teal-400 font-bold">
                  1-Click anytime in practice dashboard
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs transition shadow-md shadow-teal-600/20 flex items-center space-x-2 cursor-pointer"
              >
                <span>Launch Practice Suite Now</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
