import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Mail, Lock, User, Phone, Building2, Shield, CheckCircle } from 'lucide-react';

export const SignUpPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    practiceName: '',
    practiceNumber: '',
    hpcsaNumber: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptMarketing: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^(\+27|0)[0-9]{9}$/.test(formData.phone.replace(/\s/g, ''))) newErrors.phone = 'Enter valid SA number (+27XXXXXXXXX)';
    if (!formData.practiceName.trim()) newErrors.practiceName = 'Practice name is required';
    if (!formData.practiceNumber.trim()) newErrors.practiceNumber = 'Practice number is required';
    if (!formData.hpcsaNumber.trim()) newErrors.hpcsaNumber = 'HPCSA number is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.acceptTerms) newErrors.acceptTerms = 'You must accept the terms and conditions';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setSubmitError(null);

    const { error } = await signUp({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      practiceName: formData.practiceName,
      practiceNumber: formData.practiceNumber,
      hpcsaNumber: formData.hpcsaNumber,
      phone: formData.phone,
      acceptTerms: formData.acceptTerms,
      acceptMarketing: formData.acceptMarketing,
    });

    setIsLoading(false);

    if (error) {
      setSubmitError(error);
    } else {
      setSuccess(true);
      setTimeout(() => navigate(from, { replace: true }), 2000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const Input = ({ label, name, type = 'text', placeholder, icon: Icon, error, ...props }: any) => (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-slate-300">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />}
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={formData[name]}
          onChange={handleChange}
          className={`w-full pl-10 pr-4 py-3 bg-slate-900 border rounded-xl text-white focus:outline-none focus:border-cyan-500 transition ${
            error ? 'border-rose-500' : 'border-slate-700 hover:border-slate-600'
          }`}
          {...props}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-rose-400 flex items-center space-x-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center animate-in zoom-in-95">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-950/50 border border-emerald-800 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Account Created!</h2>
          <p className="text-slate-300 mt-2">Check your email to verify your account, then sign in to start your trial.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg w-full animate-in slide-in-from-bottom-4">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-cyan-950/50 border border-cyan-800 flex items-center justify-center">
            <Shield className="w-7 h-7 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Create Your Practice Account</h1>
          <p className="text-slate-400 mt-1">Join thousands of SA doctors on MedSwitch</p>
        </div>

        {submitError && (
          <div className="mb-6 p-3 bg-rose-950/50 border border-rose-800/50 rounded-xl text-rose-300 text-sm flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" name="fullName" placeholder="Dr. Thabo Ndlovu" icon={User} error={errors.fullName} required />
            <Input label="Email" name="email" type="email" placeholder="dr.ndlovu@practice.co.za" icon={Mail} error={errors.email} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" name="phone" placeholder="+27 82 123 4567" icon={Phone} error={errors.phone} required />
            <Input label="HPCSA Number" name="hpcsaNumber" placeholder="MP0694821" icon={Shield} error={errors.hpcsaNumber} required />
          </div>

          <Input label="Practice Name" name="practiceName" placeholder="Rosebank Medical Centre" icon={Building2} error={errors.practiceName} required />
          <Input label="Practice Number" name="practiceNumber" placeholder="0548921" icon={Building2} error={errors.practiceNumber} required />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Password" name="password" type="password" placeholder="••••••••" icon={Lock} error={errors.password} required />
            <Input label="Confirm Password" name="confirmPassword" type="password" placeholder="••••••••" icon={Lock} error={errors.confirmPassword} required />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-sm text-slate-300 leading-relaxed">
                I agree to the <a href="/terms" className="text-cyan-400 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</a>
              </span>
            </label>
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="acceptMarketing"
                checked={formData.acceptMarketing}
                onChange={handleChange}
                className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-sm text-slate-300">Send me clinical updates and practice tips (optional)</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-cyan-950/30 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account & Start Trial</span>
                <CheckCircle className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account?{' '}
          <button onClick={() => navigate('/login', { state: { from } })} className="text-cyan-400 hover:underline font-medium">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};