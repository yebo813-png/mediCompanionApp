import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, Mail, Lock, ArrowRight } from 'lucide-react';

export const SignInPage: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setSubmitError(null);

    const { error } = await signIn({ email: formData.email, password: formData.password, rememberMe: formData.rememberMe });
    setIsLoading(false);

    if (error) {
      setSubmitError(error);
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full animate-in slide-in-from-bottom-4">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-cyan-950/50 border border-cyan-800 flex items-center justify-center">
            <Lock className="w-7 h-7 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Welcome Back</h1>
          <p className="text-slate-400 mt-1">Sign in to your MedSwitch SA practice</p>
        </div>

        {submitError && (
          <div className="mb-6 p-3 bg-rose-950/50 border border-rose-800/50 rounded-xl text-rose-300 text-sm flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" name="email" type="email" placeholder="dr.ndlovu@practice.co.za" icon={Mail} error={errors.email} required />
          <Input label="Password" name="password" type="password" placeholder="••••••••" icon={Lock} error={errors.password} required />

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-sm text-slate-300">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => navigate('/forgot-password', { state: { from } })}
              className="text-sm text-cyan-400 hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-cyan-950/30 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Don't have an account?{' '}
          <button onClick={() => navigate('/signup', { state: { from } })} className="text-cyan-400 hover:underline font-medium">
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
};