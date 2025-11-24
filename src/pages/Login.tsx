import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, Lock, Loader2 } from 'lucide-react';
import { api } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { AuthResponse } from '../types/auth';

const Login = () => {
  const navigate = useNavigate();
  const { loginSuccess, addNotification, user } = useAuth();
  
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  // FIX: Only clear token if user is NOT logged in.
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    } else {
      // Only clear if we are genuinely on the login page as a guest
      localStorage.removeItem('accessToken');
    }
  }, [user, navigate]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { username });
      setStep('OTP');
      addNotification('success', `OTP sent to ${username}`);
    } catch (err: any) {
      if (err.response?.status === 429) {
         addNotification('error', 'Too many requests. Please wait 60 seconds.');
      } else {
         addNotification('error', err.response?.data?.error || 'Failed to send OTP.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const processResponse = (data: AuthResponse) => {
      if (data.newUser === true || data.isNewUser === true || data.registrationToken) {
        navigate('/complete-registration', { 
          state: { email: data.email || username, registrationToken: data.registrationToken } 
        });
        addNotification('info', 'New account detected. Please complete registration.');
      } 
      else if (data.accessToken) {
        loginSuccess(data.accessToken);
        addNotification('success', 'Authentication successful');
        navigate('/dashboard');
      }
    };

    try {
      const { data } = await api.post<AuthResponse>('/auth/verify-otp', { username, otp });
      processResponse(data);
    } catch (err: any) {
      if (err.response?.data && (err.response.data.newUser || err.response.data.registrationToken)) {
         processResponse(err.response.data);
      } else {
         addNotification('error', err.response?.data?.error || 'Invalid OTP or Expired');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-slate-100">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
        <div className="bg-indigo-600/10 p-8 text-center border-b border-slate-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 mb-4">
            <KeyRound className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Secure Access</h2>
          <p className="text-slate-400 text-sm mt-2">Enterprise Contact System</p>
        </div>

        <div className="p-8">
          {step === 'EMAIL' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-indigo-300 uppercase tracking-wider mb-2">Username / Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                  <input 
                    type="email" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="admin@company.com"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Request One-Time Password'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
               <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-indigo-300 uppercase tracking-wider">One-Time Password</label>
                  <button 
                    type="button" 
                    onClick={() => setStep('EMAIL')} 
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    Change Email
                  </button>
               </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all tracking-widest text-lg"
                    placeholder="123456"
                  />
                </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Verify & Login'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;