import React, { useState } from 'react';
import { User } from '../types';
import { ArrowRight, Lock, Phone, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length >= 10) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setStep('otp');
      }, 1000);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 4) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        // Simulate backend user fetch
        onLogin({
          id: 'u1',
          name: 'Sree Balaji Plastics',
          phone: phone,
          businessName: 'Sree Balaji Plastics Pvt Ltd'
        });
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side - Branding */}
        <div className="md:w-1/2 bg-[#0f172a] p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2 animate-blob animation-delay-2000"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-lg">BF</div>
              <h1 className="text-2xl font-bold tracking-tight">BillFlow AI</h1>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-3xl font-bold leading-tight">Manage your business <span className="text-teal-400">flow</span> with intelligence.</h2>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div> Smart Inventory Tracking</li>
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div> GST Compliant Invoicing</li>
                <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div> Automated Payment Reminders</li>
              </ul>
            </div>
          </div>

          <div className="relative z-10 mt-8 text-xs text-gray-500">
            © 2025 BillFlow AI. All rights reserved.
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {step === 'phone' ? 'Welcome Back' : 'Enter Verification Code'}
            </h3>
            <p className="text-gray-500 mb-8">
              {step === 'phone' ? 'Enter your mobile number to continue' : `We sent a 4-digit code to +91 ${phone}`}
            </p>

            {step === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">+91</span>
                    <input 
                      type="tel" 
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      required
                    />
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={loading || phone.length < 10}
                  className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {loading ? 'Sending...' : 'Get OTP'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                 <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">OTP Code (Use 1234)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all tracking-widest text-center text-lg font-bold"
                      placeholder="• • • •"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      autoFocus
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={loading || otp.length < 4}
                  className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {loading ? 'Verifying...' : 'Verify & Login'} <ShieldCheck className="w-4 h-4" />
                </button>
                <button 
                  type="button" 
                  onClick={() => setStep('phone')}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  Change Mobile Number
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};