import React, { useState } from 'react';
import { User } from '../types';
import { ArrowRight, Lock, Mail, Building, User as UserIcon, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FirebaseService } from '../services/firebase';
import { BrandLogo } from './BrandLogo';

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState(''); // Used for Staff Name as well
  const [phone, setPhone] = useState('');
  
  // Staff Logic
  const [role, setRole] = useState<'owner' | 'staff'>('owner');
  const [businessCode, setBusinessCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (role === 'staff') {
        // --- STAFF LOGIC (Synthetic Auth) ---
        if (!ownerName || !businessCode) {
           throw new Error("Name and Business Code are required.");
        }
        
        // Generate deterministic credentials
        const sanitizedName = ownerName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const sanitizedCode = businessCode.trim();
        const syntheticEmail = `staff.${sanitizedCode}.${sanitizedName}@billflux.internal`;
        const syntheticPass = `staff-${sanitizedCode}-${sanitizedName}-secure`;

        try {
           // Try Login First
           const user = await FirebaseService.loginUser(syntheticEmail, syntheticPass);
           onLogin(user);
        } catch (loginErr: any) {
           // If user not found, Register them automatically
           if (loginErr.code === 'auth/invalid-credential' || loginErr.code === 'auth/user-not-found') {
              const user = await FirebaseService.registerUser(
                 syntheticEmail,
                 syntheticPass,
                 {
                    name: ownerName,
                    businessName: 'Joining...', // Will be resolved by service
                    phone: '',
                    gstin: '',
                    address: ''
                 },
                 'staff',
                 businessCode
              );
              onLogin(user);
           } else {
              throw loginErr;
           }
        }

      } else {
        // --- OWNER LOGIC (Standard) ---
        if (isLoginMode) {
          // Sign In
          const user = await FirebaseService.loginUser(email, password);
          onLogin(user);
        } else {
          // Sign Up
          if (!businessName || !ownerName) {
            throw new Error("Business details are required.");
          }
          if (password !== confirmPassword) {
            throw new Error("Passwords do not match.");
          }

          const user = await FirebaseService.registerUser(
            email, 
            password, 
            {
              name: ownerName,
              businessName: businessName,
              phone: phone,
              gstin: '',
              address: ''
            },
            role,
            // Owner doesn't need businessCode
          );
          onLogin(user);
        }
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Authentication failed. Please try again.";
      if (err.code === 'auth/invalid-credential') msg = "Invalid credentials.";
      if (err.code === 'auth/email-already-in-use') msg = "Email already in use. Please login.";
      if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
      if (err.message) msg = err.message;
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-slate-950">
      
      {/* LEFT SIDE: Feature Showcase */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden items-center justify-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 scale-105"
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop")',
          }} 
        ></div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/60 backdrop-blur-sm"></div>

        {/* Content */}
        <div className="relative z-10 p-16 w-full max-w-3xl">
           <div className="flex items-center gap-4 mb-10 animate-in fade-in slide-in-from-left-6 duration-700">
              <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xl shadow-teal-900/20">
                 <BrandLogo className="w-14 h-14" variant="white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight">Bill Flux</h1>
                <p className="text-teal-400 text-lg font-medium">Smart Business Intelligence</p>
              </div>
           </div>
           
           <h2 className="text-5xl font-extrabold text-white leading-tight mb-8 drop-shadow-lg">
             Automate Billing. <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Track Inventory.</span> <br/>
             Grow Faster.
           </h2>

           <div className="space-y-4 max-w-lg">
              <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md hover:bg-white/10 transition-colors">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Smart Analytics</h3>
                  <p className="text-slate-400 text-sm">Get real-time data to optimize your cash flow.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md hover:bg-white/10 transition-colors">
                 <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                 </div>
                 <div>
                  <h3 className="text-white font-semibold">GST Ready Invoicing</h3>
                  <p className="text-slate-400 text-sm">Create professional, compliant bills in seconds.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="w-full lg:w-[45%] relative flex items-center justify-center p-6 md:p-12">
         
         {/* Decorative Glows */}
         <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

         <div className="w-full max-w-md relative z-10">
            {/* Mobile Branding */}
            <div className="lg:hidden flex flex-col items-center mb-8">
               <BrandLogo className="w-16 h-16 mb-4" variant="color" />
               <h1 className="text-3xl font-bold text-white">Bill Flux</h1>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl">
                <div className="text-center mb-8">
                   <h2 className="text-2xl font-bold text-white mb-2">
                      {role === 'staff' ? 'Staff Login' : (isLoginMode ? 'Welcome Back' : 'Create Account')}
                   </h2>
                   <p className="text-slate-400 text-sm">
                     {role === 'staff' 
                       ? 'Enter your name and business code to access' 
                       : (isLoginMode ? 'Enter your credentials to access your dashboard' : 'Join thousands of businesses growing with us')}
                   </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl text-sm flex items-start gap-3 mb-6">
                     <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" /> 
                     <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                   
                   {/* Role Toggle */}
                   <div className="grid grid-cols-2 gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-white/10">
                      <button 
                        type="button"
                        onClick={() => { setRole('owner'); setIsLoginMode(true); setError(null); }} 
                        className={`py-2 text-sm font-medium rounded-lg transition-all ${role === 'owner' ? 'bg-slate-800 text-teal-400 shadow-sm border border-white/10' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Owner
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setRole('staff'); setError(null); }} 
                        className={`py-2 text-sm font-medium rounded-lg transition-all ${role === 'staff' ? 'bg-slate-800 text-teal-400 shadow-sm border border-white/10' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Staff
                      </button>
                   </div>

                   {/* --- STAFF FIELDS --- */}
                   {role === 'staff' && (
                     <div className="space-y-5 animate-in slide-in-from-right-4 fade-in">
                        <div className="relative group">
                           <input 
                             type="text" 
                             required
                             className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-white placeholder-slate-500 transition-all text-sm"
                             placeholder="Your Name"
                             value={ownerName}
                             onChange={e => setOwnerName(e.target.value)}
                           />
                           <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                        </div>
                        <div className="relative group">
                           <input 
                              type="text" 
                              required
                              className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-white placeholder-slate-500 transition-all text-sm"
                              placeholder="Business Code (Ask Owner)"
                              value={businessCode}
                              onChange={e => setBusinessCode(e.target.value)}
                           />
                           <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                        </div>
                     </div>
                   )}

                   {/* --- OWNER FIELDS --- */}
                   {role === 'owner' && (
                     <div className="space-y-5 animate-in slide-in-from-left-4 fade-in">
                        {!isLoginMode && (
                           <>
                              <div className="relative group">
                                 <input 
                                    type="text" 
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-white placeholder-slate-500 transition-all text-sm"
                                    placeholder="Owner Name"
                                    value={ownerName}
                                    onChange={e => setOwnerName(e.target.value)}
                                 />
                                 <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                              </div>
                              <div className="relative group">
                                 <input 
                                    type="text" 
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-white placeholder-slate-500 transition-all text-sm"
                                    placeholder="Business Name"
                                    value={businessName}
                                    onChange={e => setBusinessName(e.target.value)}
                                 />
                                 <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                              </div>
                           </>
                        )}

                        <div className="relative group">
                           <input 
                              type="email" 
                              required
                              className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-white placeholder-slate-500 transition-all text-sm"
                              placeholder="Email Address"
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                           />
                           <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                        </div>

                        <div className="relative group">
                           <input 
                              type="password" 
                              required
                              className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-white placeholder-slate-500 transition-all text-sm"
                              placeholder="Password"
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                           />
                           <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                        </div>

                        {!isLoginMode && (
                           <div className="relative group">
                              <input 
                                 type="password" 
                                 required
                                 className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-white placeholder-slate-500 transition-all text-sm"
                                 placeholder="Confirm Password"
                                 value={confirmPassword}
                                 onChange={e => setConfirmPassword(e.target.value)}
                              />
                              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors" />
                           </div>
                        )}
                     </div>
                   )}

                   <button 
                     type="submit" 
                     disabled={loading}
                     className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-teal-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                   >
                     {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                     {role === 'staff' ? 'Access Business' : (isLoginMode ? 'Sign In' : 'Create Account')}
                   </button>
                </form>

                {role === 'owner' && (
                  <div className="mt-8 text-center pt-6 border-t border-white/5">
                     <p className="text-sm text-slate-400">
                        {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                        <button 
                           onClick={() => { setIsLoginMode(!isLoginMode); setError(null); }}
                           className="ml-2 font-bold text-teal-400 hover:text-teal-300 transition-colors underline decoration-transparent hover:decoration-teal-400"
                        >
                           {isLoginMode ? "Sign up" : "Log in"}
                        </button>
                     </p>
                  </div>
                )}
            </div>
         </div>
      </div>
    </div>
  );
};