import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { User, Mail, Shield, Camera, Save, Globe, Award, Briefcase } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function CoachProfile() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    experience: userData?.experience || '6+ Yıl',
    expertise: userData?.expertise || ['YKS Sayısal', 'AYT Matematik', 'TYT Fizik', 'Zaman Yönetimi', 'Stres Yönetimi'],
    certificates: userData?.certificates || [
      { title: 'Profesyonel Koçluk Eğitimi', issuer: 'ICF Onaylı', year: '2021' },
      { title: 'Öğrenci Psikolojisi ve Motivasyon', issuer: 'MEB Sertifikalı', year: '2022' },
    ]
  });

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      alert('Profil güncellendi!');
      // Assuming a reload or context update happens later.
    } catch (err) {
      console.error(err);
      alert('Güncelleme sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">
             PROFİL AYARLARI
          </h1>
          <p className="text-slate-500 mt-1">Kişisel bilgilerinizi ve koçluk profilinizi güncelleyin.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
        >
           <Save size={20} /> {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Profile Photo & Summary */}
         <div className="space-y-6">
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 text-center flex flex-col items-center">
               <div className="relative group mb-6">
                  <div className="w-32 h-32 rounded-[40px] bg-slate-800 border-2 border-white/10 p-1 overflow-hidden transition-transform group-hover:scale-105">
                     {userData?.photoURL ? (
                        <img src={userData.photoURL} alt="" className="w-full h-full object-cover rounded-[36px]" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-500">
                           {userData?.firstName?.charAt(0)}
                        </div>
                     )}
                  </div>
                  <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-600 rounded-2xl border-4 border-[#070b14] flex items-center justify-center text-white hover:bg-emerald-500 transition-all shadow-xl">
                     <Camera size={18} />
                  </button>
               </div>
               <h2 className="text-2xl font-black text-white italic tracking-tight">{formData.firstName} {formData.lastName}</h2>
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-2">Profesyonel Eğitim Koçu</p>
               
               <div className="w-full grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-white/5 rounded-2xl p-4 text-left border border-white/5">
                     <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Deneyim</p>
                     <p className="text-sm font-bold text-slate-200">{formData.experience}</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 text-left border border-white/5">
                     <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Puan</p>
                     <p className="text-sm font-bold text-emerald-500">{userData?.rating || '4.9'} / 5.0</p>
                  </div>
               </div>
            </div>

            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
               <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Briefcase size={16} className="text-slate-500" /> Uzmanlık Alanları
               </h3>
               <div className="flex flex-wrap gap-2">
                  {formData.expertise.map((tag: string) => (
                     <span key={tag} className="bg-white/5 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold border border-white/5">
                        {tag}
                     </span>
                  ))}
               </div>
            </div>
         </div>

         {/* Settings Forms */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
               <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                  <User size={20} className="text-blue-500" /> Kişisel Bilgiler
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Adınız</label>
                     <div className="relative group">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                        <input 
                           type="text" 
                           value={formData.firstName}
                           onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                           className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold text-sm outline-none focus:border-blue-500/30 transition-all" 
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Soyadınız</label>
                     <div className="relative group">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                        <input 
                           type="text" 
                           value={formData.lastName}
                           onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                           className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold text-sm outline-none focus:border-blue-500/30 transition-all" 
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-Posta Adresi</label>
                     <div className="relative group">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                        <input 
                           type="email" 
                           value={userData?.email || ''}
                           disabled
                           className="w-full bg-white/2 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-slate-500 font-bold text-sm cursor-not-allowed uppercase italic" 
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dil / Bölge</label>
                     <div className="relative group">
                        <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                        <select className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-bold text-sm outline-none focus:border-blue-500/30 transition-all appearance-none">
                           <option>Türkçe (TR)</option>
                           <option>English (US)</option>
                        </select>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
               <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                  <Award size={20} className="text-amber-500" /> Sertifikalar & Eğitim
               </h3>
               <div className="space-y-4">
                  {formData.certificates.map((cert: any, i: number) => (
                     <div key={i} className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                              <Shield size={20} />
                           </div>
                           <div>
                              <h4 className="text-sm font-bold text-white">{cert.title}</h4>
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{cert.issuer} • {cert.year}</p>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
