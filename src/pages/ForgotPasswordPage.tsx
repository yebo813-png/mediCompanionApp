import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: err } = await resetPassword(email);
    setIsLoading(false);

    if (err) {
      setError(err);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full animate-in slide-in-from-bottom-4">
        <button
          onClick={() => navigate('/login')}
          className="mb-6 text-slate-400 hover:text-white flex items-center space-x-1"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Sign In</span>
        </button>

        <div className="text-center mb-8">
          {success ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-950/50 border border-emerald-800 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-extrabold text-white">Check Your Email</h1>
              <p className="text-slate-400 mt-2">We've sent a password reset link to <strong className="text-white">{email}</strong></p>
              <p className="text-slate-500 text-sm mt-4">The link expires in 1 hour. Check your spam folder if you don't see it.</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-cyan-950/50 border border-cyan-800 flex items-center justify-center">
                <Mail className="w-7 h-7 text-cyan-400" />
              </div>
              <h1 className="text-2xl font-extrabold text-white">Reset Password</h1>
              <p className="text-slate-400 mt-1">Enter your email and we'll send you a reset link</p>
            </>
          )}
        </div>

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-800/50 rounded-xl text-rose-300 text-sm flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  placeholder="dr.ndlovu@practice.co.za"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-lg shadow-cyan-950/30 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </form>
        )}

        {success && (
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition mt-4"
          >
            Back to Sign In
          </button>
        )}
      </div>
    </div>
  );
};