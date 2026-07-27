import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { Shield, Camera, Save, CreditCard } from 'lucide-react';
import { doc, updateDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function CoachProfile() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [systemDeductionRate, setSystemDeductionRate] = useState(20);
  const [minSystemDeductionBronze, setMinSystemDeductionBronze] = useState(1000);
  const [minSystemDeductionSilver, setMinSystemDeductionSilver] = useState(1500);
  const [minSystemDeductionGold, setMinSystemDeductionGold] = useState(2000);

  const [formData, setFormData] = useState({
    coachCode: userData?.coachCode || '',
    bronzePrice: userData?.bronzePrice || 3000,
    silverPrice: userData?.silverPrice || 4500,
    goldPrice: userData?.goldPrice || 6000
  });

  useEffect(() => {
    async function fetchRate() {
       try {
         const snap = await getDoc(doc(db, 'settings', 'financial'));
         if (snap.exists()) {
            const data = snap.data();
            if (data.systemDeductionRate !== undefined) setSystemDeductionRate(data.systemDeductionRate);
            if (data.minSystemDeductionBronze !== undefined) setMinSystemDeductionBronze(data.minSystemDeductionBronze);
            if (data.minSystemDeductionSilver !== undefined) setMinSystemDeductionSilver(data.minSystemDeductionSilver);
            if (data.minSystemDeductionGold !== undefined) setMinSystemDeductionGold(data.minSystemDeductionGold);
         }
       } catch (err) {
         console.error("Error fetching settings", err);
       }
    }
    fetchRate();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const cleanCoachCode = formData.coachCode.trim();
      
      if (cleanCoachCode.toUpperCase() === 'FOCUS') {
         alert('FOCUS kodu genel sisteme aittir ve alınamaz.');
         setLoading(false);
         return;
      }

      if (cleanCoachCode !== '') {
         // Check if this code is already taken by another user
         const coachQuery = query(collection(db, 'users'), where('coachCode', '==', cleanCoachCode));
         const coachSnap = await getDocs(coachQuery);
         
         const isTaken = coachSnap.docs.some(doc => doc.id !== user.uid);
         if (isTaken) {
            alert('Bu koç kodu başkası tarafından kullanılıyor. Lütfen başka bir kod belirleyin.');
            setLoading(false);
            return;
         }
      }

      await updateDoc(doc(db, 'users', user.uid), {
        coachCode: cleanCoachCode,
        bronzePrice: Number(formData.bronzePrice) || 3000,
        silverPrice: Number(formData.silverPrice) || 4500,
        goldPrice: Number(formData.goldPrice) || 6000
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
          <p className="text-slate-500 mt-1">Koçluk profilinizi ve fiyatlandırmalarınızı güncelleyin.</p>
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
               <h2 className="text-2xl font-black text-white italic tracking-tight">{userData?.firstName} {userData?.lastName}</h2>
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-2">Profesyonel Eğitim Koçu</p>
            </div>

            {/* Koç Kodu Kartı (Profil Kartının Altında) */}
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Shield size={14} className="text-emerald-500" /> Koç Kodunuz (Öğrencilerinize Verin)
               </label>
               <div className="relative group">
                  <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input 
                     type="text" 
                     value={formData.coachCode}
                     onChange={(e) => setFormData({...formData, coachCode: e.target.value})}
                     maxLength={5}
                     placeholder="Örn: 1A2B3"
                     className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white font-bold text-sm outline-none focus:border-emerald-500/30 transition-all font-mono" 
                  />
               </div>
            </div>
         </div>

         {/* Settings Forms */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
               <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                     <CreditCard size={20} className="text-emerald-500" /> Paket Fiyatlandırmaları
                  </h3>
                  <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] px-3 py-2 rounded-xl flex items-center gap-2 max-w-sm">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                     Sistem kesintisi dinamik olarak hesaplanmaktadır. Minimum kesinti oranı paket bazında değişiklik gösterebilir.
                  </div>
               </div>
               
               <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-2xl">Öğrencilerinize sunacağınız aylık abonelik paketlerinin fiyatlarını belirleyin. Lütfen dikkat edin: Belirlediğiniz fiyatların içerisinden platform kullanım bedeli (sistem kesintisi) otomatik olarak hesaplanarak brüt kazancınız size aktarılır.</p>
               
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Bronze */}
                  <div className="bg-white/5 border border-orange-500/30 rounded-3xl p-6 flex flex-col relative overflow-hidden group hover:border-orange-500/50 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 blur-xl group-hover:opacity-20 transition-opacity">
                      <CreditCard size={100} className="text-orange-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                       <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                          <CreditCard size={20} />
                       </div>
                       <div>
                          <h4 className="text-orange-400 font-bold leading-tight">Bronz Paket</h4>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Aylık Abonelik</span>
                       </div>
                    </div>
                    
                    <div className="space-y-4 relative z-10 mt-auto">
                       <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Satış Fiyatı (₺)</label>
                          <div className="relative">
                             <input 
                                type="number" 
                                value={formData.bronzePrice}
                                onChange={(e) => setFormData({...formData, bronzePrice: Number(e.target.value) || 0})}
                                className="w-full bg-slate-950 border border-white/5 rounded-2xl py-3.5 px-4 text-white font-black text-lg outline-none focus:border-orange-500/50 transition-all font-mono pl-10" 
                             />
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold">₺</span>
                          </div>
                       </div>
                       
                       <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 space-y-3">
                          <div className="flex justify-between items-center text-xs">
                             <span className="text-slate-500 font-medium tracking-wide">Sistem Kesintisi</span>
                             <span className="text-red-400/80 font-mono font-bold">-{Math.max(Math.floor(Number(formData.bronzePrice) * (systemDeductionRate / 100)), minSystemDeductionBronze)} ₺</span>
                          </div>
                          <div className="h-px w-full bg-white/5" />
                          <div className="flex justify-between items-center">
                             <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">Net Kazanç</span>
                             <span className="text-emerald-400 font-mono font-black text-base">{Number(formData.bronzePrice) - Math.max(Math.floor(Number(formData.bronzePrice) * (systemDeductionRate / 100)), minSystemDeductionBronze)} ₺</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Silver */}
                  <div className="bg-white/5 border border-blue-500/30 rounded-3xl p-6 flex flex-col relative overflow-hidden group hover:border-blue-500/50 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 blur-xl group-hover:opacity-20 transition-opacity">
                      <CreditCard size={100} className="text-blue-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                       <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                          <CreditCard size={20} />
                       </div>
                       <div>
                          <h4 className="text-blue-400 font-bold leading-tight">Gümüş Paket</h4>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Aylık Abonelik</span>
                       </div>
                    </div>
                    
                    <div className="space-y-4 relative z-10 mt-auto">
                       <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Satış Fiyatı (₺)</label>
                          <div className="relative">
                             <input 
                                type="number" 
                                value={formData.silverPrice}
                                onChange={(e) => setFormData({...formData, silverPrice: Number(e.target.value) || 0})}
                                className="w-full bg-slate-950 border border-white/5 rounded-2xl py-3.5 px-4 text-white font-black text-lg outline-none focus:border-blue-500/50 transition-all font-mono pl-10" 
                             />
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold">₺</span>
                          </div>
                       </div>
                       
                       <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 space-y-3">
                          <div className="flex justify-between items-center text-xs">
                             <span className="text-slate-500 font-medium tracking-wide">Sistem Kesintisi</span>
                             <span className="text-red-400/80 font-mono font-bold">-{Math.max(Math.floor(Number(formData.silverPrice) * (systemDeductionRate / 100)), minSystemDeductionSilver)} ₺</span>
                          </div>
                          <div className="h-px w-full bg-white/5" />
                          <div className="flex justify-between items-center">
                             <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">Net Kazanç</span>
                             <span className="text-emerald-400 font-mono font-black text-base">{Number(formData.silverPrice) - Math.max(Math.floor(Number(formData.silverPrice) * (systemDeductionRate / 100)), minSystemDeductionSilver)} ₺</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Gold */}
                  <div className="bg-white/5 border border-yellow-500/30 rounded-3xl p-6 flex flex-col relative overflow-hidden group hover:border-yellow-500/50 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 blur-xl group-hover:opacity-20 transition-opacity">
                      <CreditCard size={100} className="text-yellow-500" />
                    </div>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                       <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                          <CreditCard size={20} />
                       </div>
                       <div>
                          <h4 className="text-yellow-400 font-bold leading-tight">Altın Paket</h4>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Aylık Abonelik</span>
                       </div>
                    </div>
                    
                    <div className="space-y-4 relative z-10 mt-auto">
                       <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Satış Fiyatı (₺)</label>
                          <div className="relative">
                             <input 
                                type="number" 
                                value={formData.goldPrice}
                                onChange={(e) => setFormData({...formData, goldPrice: Number(e.target.value) || 0})}
                                className="w-full bg-slate-950 border border-white/5 rounded-2xl py-3.5 px-4 text-white font-black text-lg outline-none focus:border-yellow-500/50 transition-all font-mono pl-10" 
                             />
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold">₺</span>
                          </div>
                       </div>
                       
                       <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 space-y-3">
                          <div className="flex justify-between items-center text-xs">
                             <span className="text-slate-500 font-medium tracking-wide">Sistem Kesintisi</span>
                             <span className="text-red-400/80 font-mono font-bold">-{Math.max(Math.floor(Number(formData.goldPrice) * (systemDeductionRate / 100)), minSystemDeductionGold)} ₺</span>
                          </div>
                          <div className="h-px w-full bg-white/5" />
                          <div className="flex justify-between items-center">
                             <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">Net Kazanç</span>
                             <span className="text-emerald-400 font-mono font-black text-base">{Number(formData.goldPrice) - Math.max(Math.floor(Number(formData.goldPrice) * (systemDeductionRate / 100)), minSystemDeductionGold)} ₺</span>
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
