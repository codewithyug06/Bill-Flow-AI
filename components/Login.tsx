
import React, { useState } from 'react';
import { User } from '../types';
import { ArrowRight, Lock, Mail, Building, User as UserIcon, Loader2, AlertCircle, FileText, BarChart3, Package, CheckCircle2 } from 'lucide-react';
import { FirebaseService } from '../services/firebase';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLoginMode) {
        // Sign In
        const user = await FirebaseService.loginUser(email, password);
        onLogin(user);
      } else {
        // Sign Up
        if (!businessName || !ownerName) {
          throw new Error("Business details are required.");
        }
        const user = await FirebaseService.registerUser(email, password, {
          name: ownerName,
          businessName: businessName,
          phone: phone,
          gstin: '',
          address: ''
        });
        onLogin(user);
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Authentication failed. Please try again.";
      if (err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
      if (err.code === 'auth/email-already-in-use') msg = "Email already in use. Please login.";
      if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-teal-200/40 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-indigo-200/40 rounded-full blur-[120px]" />
      </div>

      <div className="bg-white w-full max-w-[1100px] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[650px] relative z-10 border border-white/50">
        
        {/* LEFT SIDE: Feature Highlight */}
        <div className="md:w-5/12 bg-slate-900 relative p-8 md:p-12 text-white flex flex-col justify-between overflow-hidden">
          {/* Abstract Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            {/* Branding */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-teal-500/20">
                BF
              </div>
              <span className="text-xl font-bold tracking-tight">BillFlow AI</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-6">
              Powering Business with <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Intelligence.</span>
            </h2>
            
            <p className="text-slate-400 text-sm md:text-base mb-8 leading-relaxed">
              Streamline your invoicing, inventory, and accounting with our next-gen platform designed for modern growth.
            </p>

            {/* Feature Cards */}
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-100">Smart Invoicing</h4>
                  <p className="text-xs text-slate-400">GST compliant, professional bills in seconds.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-100">AI Analytics</h4>
                  <p className="text-xs text-slate-400">Deep insights into your sales & purchases.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-100">Inventory Sync</h4>
                  <p className="text-xs text-slate-400">Real-time stock tracking & adjustments.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-slate-800 flex items-center gap-6 text-[10px] text-slate-500 font-medium uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500"/> Secure Cloud</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500"/> 24/7 Support</span>
          </div>
        </div>

        {/* RIGHT SIDE: Login Form */}
        <div className="md:w-7/12 p-8 md:p-16 bg-white flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {isLoginMode ? 'Welcome Back' : 'Create Account'}
              </h3>
              <p className="text-gray-500">
                {isLoginMode ? 'Enter your credentials to access your dashboard' : 'Fill in your business details to get started'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3 mb-6 border border-red-100 animate-in slide-in-from-top-2">
                 <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> 
                 <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {!isLoginMode && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Owner Name</label>
                    <div className="relative group">
                      <input 
                        type="text" 
                        required={!isLoginMode}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-sm font-medium text-gray-900 placeholder-gray-400"
                        placeholder="John Doe"
                        value={ownerName}
                        onChange={e => setOwnerName(e.target.value)}
                      />
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Business Name</label>
                    <div className="relative group">
                      <input 
                        type="text" 
                        required={!isLoginMode}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-sm font-medium text-gray-900 placeholder-gray-400"
                        placeholder="Acme Corp"
                        value={businessName}
                        onChange={e => setBusinessName(e.target.value)}
                      />
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Email Address</label>
                <div className="relative group">
                  <input 
                    type="email" 
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-sm font-medium text-gray-900 placeholder-gray-400"
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Password</label>
                <div className="relative group">
                  <input 
                    type="password" 
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-sm font-medium text-gray-900 placeholder-gray-400"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold hover:bg-teal-700 active:scale-[0.98] transition-all shadow-lg shadow-teal-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4 text-sm"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                {loading ? (isLoginMode ? 'Signing In...' : 'Creating Account...') : (isLoginMode ? 'Sign In' : 'Create Account')} 
              </button>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {isLoginMode ? "New to BillFlow?" : "Already have an account?"}
                <button 
                  onClick={() => { setIsLoginMode(!isLoginMode); setError(null); }}
                  className="ml-2 font-bold text-teal-600 hover:text-teal-700 transition-colors hover:underline"
                >
                  {isLoginMode ? "Create an account" : "Sign in here"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
