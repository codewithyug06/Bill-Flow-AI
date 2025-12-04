import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Save, User as UserIcon, Building, Phone, CreditCard, MapPin, CheckCircle2, Copy, Users, Clock, Loader2, Download, Database, ShieldCheck, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { FirebaseService } from '../services/firebase';
import JSZip from 'jszip';

interface SettingsProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState<User>(user);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setFormData(user);
    if (user.role === 'owner') {
       fetchStaff();
    }
  }, [user]);

  const fetchStaff = async () => {
     setLoadingStaff(true);
     const staff = await FirebaseService.getStaffMembers(user.id);
     setStaffList(staff);
     setLoadingStaff(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'signatureUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size validation (Max 100KB for base64 to avoid FireStore issues)
    if (file.size > 100 * 1024) {
      alert("Image size too large. Please upload an image under 100KB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData({ ...formData, [field]: base64String });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (field: 'logoUrl' | 'signatureUrl') => {
    setFormData({ ...formData, [field]: undefined });
  };

  const handleSave = () => {
    onUpdateUser(formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const copyBusinessId = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatLastActive = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Helper to convert array of objects to CSV string
  const convertToCSV = (objArray: any[]) => {
      if (!objArray || objArray.length === 0) return '';
      // Ensure it's an array
      const array = Array.isArray(objArray) ? objArray : [objArray];
      
      // Collect all unique keys from all objects
      const allKeys = new Set<string>();
      array.forEach((item: any) => Object.keys(item).forEach(k => allKeys.add(k)));
      const headers = Array.from(allKeys);
      
      let str = headers.join(',') + '\r\n';

      for (let i = 0; i < array.length; i++) {
          let line = '';
          for (const index in headers) {
              if (line !== '') line += ',';
              const head = headers[index];
              let value = array[i][head];
              
              if (value === undefined || value === null) {
                  value = "";
              } else if (typeof value === 'object') {
                  // JSON stringify objects and escape double quotes
                  value = JSON.stringify(value).replace(/"/g, '""');
                  value = `"${value}"`; 
              } else {
                  value = value.toString().replace(/"/g, '""');
                  value = `"${value}"`;
              }
              line += value;
          }
          str += line + '\r\n';
      }
      return str;
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
       const zip = new JSZip();
       const businessId = user.businessId;

       // Fetch Data Collections
       const products = await FirebaseService.getAllCollectionData(businessId, 'products');
       const parties = await FirebaseService.getAllCollectionData(businessId, 'parties');
       const invoices = await FirebaseService.getAllCollectionData(businessId, 'invoices');
       const purchases = await FirebaseService.getAllCollectionData(businessId, 'purchases');
       const expenses = await FirebaseService.getAllCollectionData(businessId, 'expenses');
       const estimates = await FirebaseService.getAllCollectionData(businessId, 'estimates');

       // Add CSVs to Zip
       if (products.length) zip.file("products.csv", convertToCSV(products));
       if (parties.length) zip.file("parties.csv", convertToCSV(parties));
       if (invoices.length) zip.file("sales_invoices.csv", convertToCSV(invoices));
       if (purchases.length) zip.file("purchase_bills.csv", convertToCSV(purchases));
       if (expenses.length) zip.file("expenses.csv", convertToCSV(expenses));
       if (estimates.length) zip.file("estimates.csv", convertToCSV(estimates));

       // Generate and Download
       const content = await zip.generateAsync({ type: "blob" });
       const url = window.URL.createObjectURL(content);
       const a = document.createElement("a");
       a.href = url;
       const dateStr = new Date().toISOString().split('T')[0];
       a.download = `BillFlux_Backup_${user.businessName.replace(/\s+/g, '_')}_${dateStr}.zip`;
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
       window.URL.revokeObjectURL(url);
       
       setShowSuccess(true);
    } catch (e) {
       console.error("Export failed:", e);
       alert("Failed to export data. Please try again.");
    } finally {
       setIsExporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300 pb-20">
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your business profile and data</p>
      </header>

      {showSuccess && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-2 border border-emerald-100 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">Action completed successfully!</span>
        </div>
      )}
      
      {/* Business Profile Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <h2 className="text-lg font-semibold text-gray-800">Business Profile</h2>
           <p className="text-xs text-gray-500 mt-1">These details will be printed on your tax invoices.</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-400" /> Business Name
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="e.g. My Business Pvt Ltd"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-gray-400" /> Owner Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="Your Name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" /> Contact Number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="e.g. 9876543210"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" /> GSTIN
              </label>
              <input
                type="text"
                name="gstin"
                value={formData.gstin || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none uppercase"
                placeholder="e.g. 29ABCDE1234F1Z5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" /> Business Address
            </label>
            <textarea
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none resize-none"
              placeholder="Full address to be shown on invoice"
            />
          </div>
        </div>
      </div>

      {/* Branding Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <h2 className="text-lg font-semibold text-gray-800">Branding & Customization</h2>
           <p className="text-xs text-gray-500 mt-1">Customize your invoice look with logo and signature.</p>
        </div>
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Logo Upload */}
               <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 block">Business Logo</label>
                  <div className="flex items-start gap-4">
                     <div className="w-24 h-24 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                        {formData.logoUrl ? (
                           <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                           <ImageIcon className="w-8 h-8 text-gray-300" />
                        )}
                     </div>
                     <div className="space-y-2 flex-1">
                        <input 
                           type="file" 
                           id="logo-upload" 
                           className="hidden" 
                           accept="image/*"
                           onChange={(e) => handleFileChange(e, 'logoUrl')}
                        />
                        <label 
                           htmlFor="logo-upload"
                           className="flex items-center justify-center gap-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                           <Upload className="w-4 h-4" /> Upload Logo
                        </label>
                        {formData.logoUrl && (
                           <button 
                              onClick={() => removeImage('logoUrl')}
                              className="flex items-center justify-center gap-2 w-full px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                           >
                              <Trash2 className="w-4 h-4" /> Remove
                           </button>
                        )}
                        <p className="text-[10px] text-gray-400">Max 100KB (PNG/JPG)</p>
                     </div>
                  </div>
               </div>

               {/* Signature Upload */}
               <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 block">Digital Signature</label>
                  <div className="flex items-start gap-4">
                     <div className="w-32 h-16 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                        {formData.signatureUrl ? (
                           <img src={formData.signatureUrl} alt="Signature" className="w-full h-full object-contain" />
                        ) : (
                           <span className="text-xs text-gray-300">No Signature</span>
                        )}
                     </div>
                     <div className="space-y-2 flex-1">
                        <input 
                           type="file" 
                           id="sig-upload" 
                           className="hidden" 
                           accept="image/*"
                           onChange={(e) => handleFileChange(e, 'signatureUrl')}
                        />
                        <label 
                           htmlFor="sig-upload"
                           className="flex items-center justify-center gap-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                           <Upload className="w-4 h-4" /> Upload Sig
                        </label>
                        {formData.signatureUrl && (
                           <button 
                              onClick={() => removeImage('signatureUrl')}
                              className="flex items-center justify-center gap-2 w-full px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                           >
                              <Trash2 className="w-4 h-4" /> Remove
                           </button>
                        )}
                        <p className="text-[10px] text-gray-400">Max 100KB (PNG/JPG)</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex justify-end">
               <button 
                  onClick={handleSave}
                  className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 shadow-sm flex items-center gap-2 transition-colors"
               >
                  <Save className="w-4 h-4" /> Save Branding
               </button>
            </div>
        </div>
      </div>

      {/* Staff Invitation Card */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl overflow-hidden">
         <div className="p-4 bg-indigo-100/50 border-b border-indigo-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-indigo-800 uppercase tracking-wide">Multi-User Access</h2>
         </div>
         <div className="p-6">
            <p className="text-sm text-gray-700 mb-4">
              To add staff to your business, ask them to select <strong>"Join as Staff"</strong> during sign up and enter this Business Code:
            </p>
            <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-indigo-200">
               <code className="flex-1 font-mono text-lg font-bold text-indigo-700 tracking-wider text-center select-all">
                 {user.id}
               </code>
               <button 
                 onClick={copyBusinessId}
                 className="p-2 hover:bg-indigo-50 rounded-md text-indigo-600 transition-colors"
                 title="Copy Code"
               >
                 {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
               </button>
            </div>
         </div>
      </div>

      {/* Team Activity Section - Owner Only */}
      {user.role === 'owner' && (
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Team Activity</h2>
                <button onClick={fetchStaff} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-full transition-colors"><Clock className="w-4 h-4" /></button>
             </div>
             <div>
                {loadingStaff ? (
                   <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500"/></div>
                ) : staffList.length > 0 ? (
                   <div className="divide-y divide-gray-100">
                      {staffList.map((staff) => (
                         <div key={staff.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                  {staff.name.substring(0,2).toUpperCase()}
                                </div>
                               <div>
                                  <p className="text-sm font-semibold text-gray-900">{staff.name}</p>
                                  <p className="text-xs text-gray-500">Staff Member</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                               <span className={`w-2 h-2 rounded-full ${formatLastActive(staff.lastActive) === 'Just now' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></span>
                               {formatLastActive(staff.lastActive)}
                            </div>
                         </div>
                      ))}
                   </div>
                ) : (
                   <div className="p-6 text-center text-gray-400 text-sm">No staff members have joined yet.</div>
                )}
             </div>
         </div>
      )}

      {/* Data Backup Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="p-4 border-b border-gray-100 flex items-center gap-2">
             <Database className="w-4 h-4 text-gray-500" />
             <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Data & Security</h2>
         </div>
         <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1">
               <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Cloud Backup
               </h3>
               <p className="text-sm text-gray-500">
                 All your data is continuously synced to our secure cloud. However, you can download a full copy of your records (Invoices, Customers, Products) anytime for offline storage.
               </p>
            </div>
            <button 
              onClick={handleExportData}
              disabled={isExporting}
              className="shrink-0 flex items-center gap-2 bg-slate-800 text-white px-5 py-3 rounded-xl font-medium hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {isExporting ? 'Generating...' : 'Export All Data'}
            </button>
         </div>
      </div>

    </div>
  );
};