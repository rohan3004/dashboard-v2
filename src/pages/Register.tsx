import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, MapPin, Code2, Loader2, ArrowRight, AtSign } from 'lucide-react';
import { api } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getDeviceFingerprint } from '../utils/device';
import type { RegistrationPayload } from '../types/auth';

const Register = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { loginSuccess, addNotification } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '', 
    fullName: '', 
    phoneNumber: '', 
    dateOfBirth: '', 
    gender: '', 
    country: '', 
    state: '', 
    city: '', 
    pinCode: '',
    codechefHandle: '', 
    leetcodeHandle: '', 
    codeforcesHandle: '', 
    gfgHandle: ''
  });

  useEffect(() => {
    if (!state?.registrationToken || !state?.email) {
      addNotification('error', 'Session invalid. Please login again.');
      navigate('/login');
    }
  }, [state, navigate, addNotification]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload: RegistrationPayload = {
      ...formData,
      registrationToken: state.registrationToken,
      ...getDeviceFingerprint() 
    };

    try {
      // Explicitly remove Auth header for the public endpoint
      const { data } = await api.post('/auth/complete-registration', payload, {
        headers: { 'Authorization': '' }
      });
      
      if (data.accessToken) {
        loginSuccess(data.accessToken);
        addNotification('success', 'Profile created successfully!');
        
        // ⚡ UPDATE: Pass the isNewUser flag to Dashboard to trigger the loading state
        navigate('/dashboard', { state: { isNewUser: true } });
      }
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data) {
          const msg = typeof err.response.data === 'string' 
              ? err.response.data 
              : err.response.data.message || 'Validation Failed. Check inputs.';
          addNotification('error', msg);
      } else {
          addNotification('error', err.response?.data?.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-10 px-4 flex items-center justify-center text-slate-100">
      <div className="max-w-3xl w-full bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
        <div className="bg-indigo-600/10 p-6 border-b border-slate-700 flex items-center gap-4">
           <div className="p-3 bg-indigo-500/20 rounded-full text-indigo-400"><User size={24} /></div>
           <div>
             <h1 className="text-xl font-bold text-white">Complete Profile</h1>
             <p className="text-sm text-slate-400">Verifying email: <span className="text-indigo-300">{state?.email}</span></p>
           </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Account Identity */}
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AtSign size={16} /> Account Identity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <input 
                    name="username" 
                    placeholder="Choose a Username (e.g. rohan3004)" 
                    onChange={handleChange} 
                    value={formData.username}
                    required 
                    pattern="^[a-zA-Z0-9._-]{3,20}$"
                    title="3-20 characters, alphanumeric, dots, underscores, hyphens only."
                    className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-500"
                  />
                  <p className="text-xs text-slate-500 mt-1 ml-1">Unique handle, 3-20 chars.</p>
               </div>
            </div>
          </section>

          {/* Personal Info */}
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User size={16} /> Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <input name="fullName" placeholder="Full Name" onChange={handleChange} value={formData.fullName} required className="bg-slate-900 border border-slate-600 rounded px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-500"/>
               <input name="phoneNumber" placeholder="Phone Number" onChange={handleChange} value={formData.phoneNumber} required className="bg-slate-900 border border-slate-600 rounded px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-500"/>
               <input name="dateOfBirth" type="date" onChange={handleChange} value={formData.dateOfBirth} required className="bg-slate-900 border border-slate-600 rounded px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-500"/>
               
               <select 
                 name="gender" 
                 onChange={handleChange} 
                 value={formData.gender} 
                 required
                 className="bg-slate-900 border border-slate-600 rounded px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-500"
               >
                 <option value="" disabled>Select Gender</option>
                 <option value="Male">Male</option>
                 <option value="Female">Female</option>
                 <option value="Other">Other</option>
               </select>
            </div>
          </section>

          {/* Location */}
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin size={16} /> Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <input name="country" placeholder="Country" onChange={handleChange} value={formData.country} required className="bg-slate-900 border border-slate-600 rounded px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-500"/>
               <input name="state" placeholder="State" onChange={handleChange} value={formData.state} required className="bg-slate-900 border border-slate-600 rounded px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-500"/>
               <input name="city" placeholder="City" onChange={handleChange} value={formData.city} required className="bg-slate-900 border border-slate-600 rounded px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-500"/>
               <input name="pinCode" placeholder="Pin Code" onChange={handleChange} value={formData.pinCode} required className="bg-slate-900 border border-slate-600 rounded px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-500"/>
            </div>
          </section>

          {/* Coding Handles */}
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Code2 size={16} /> Coding Profiles (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <input name="leetcodeHandle" placeholder="LeetCode Handle" onChange={handleChange} value={formData.leetcodeHandle} className="bg-slate-900 border border-slate-600 rounded px-4 py-2.5 text-white focus:border-emerald-500 outline-none placeholder:text-slate-500"/>
               <input name="codechefHandle" placeholder="CodeChef Handle" onChange={handleChange} value={formData.codechefHandle} className="bg-slate-900 border border-slate-600 rounded px-4 py-2.5 text-white focus:border-emerald-500 outline-none placeholder:text-slate-500"/>
               <input name="codeforcesHandle" placeholder="Codeforces Handle" onChange={handleChange} value={formData.codeforcesHandle} className="bg-slate-900 border border-slate-600 rounded px-4 py-2.5 text-white focus:border-emerald-500 outline-none placeholder:text-slate-500"/>
               <input name="gfgHandle" placeholder="GeeksForGeeks Handle" onChange={handleChange} value={formData.gfgHandle} className="bg-slate-900 border border-slate-600 rounded px-4 py-2.5 text-white focus:border-emerald-500 outline-none placeholder:text-slate-500"/>
            </div>
          </section>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Finalize Registration <ArrowRight size={18}/></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;