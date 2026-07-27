import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Info, Edit2, Wallet, Users, Award, TrendingUp, Save } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SUBSCRIPTION_PACKAGES } from '../students/Subscription';

export default function AdminPaidSubscriptions() {
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deductionRate, setDeductionRate] = useState(20);
  const [minDeductionBronze, setMinDeductionBronze] = useState(1000);
  const [minDeductionSilver, setMinDeductionSilver] = useState(1500);
  const [minDeductionGold, setMinDeductionGold] = useState(2000);
  const [savingRate, setSavingRate] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'coach'));
        const [snap, settingsSnap] = await Promise.all([
          getDocs(q),
          getDoc(doc(db, 'settings', 'financial'))
        ]);
        
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCoaches(data);
        
        if (settingsSnap.exists()) {
          setDeductionRate(settingsSnap.data().systemDeductionRate ?? 20);
          setMinDeductionBronze(settingsSnap.data().minSystemDeductionBronze ?? 1000);
          setMinDeductionSilver(settingsSnap.data().minSystemDeductionSilver ?? 1500);
          setMinDeductionGold(settingsSnap.data().minSystemDeductionGold ?? 2000);
        }
      } catch (err) {
        console.error("Data loading error", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveRate = async () => {
    setSavingRate(true);
    try {
      await setDoc(doc(db, 'settings', 'financial'), {
        systemDeductionRate: deductionRate,
        minSystemDeductionBronze: minDeductionBronze,
        minSystemDeductionSilver: minDeductionSilver,
        minSystemDeductionGold: minDeductionGold
      }, { merge: true });
      alert('Sistem kesinti oranları başarıyla güncellendi!');
    } catch (err) {
      console.error(err);
      alert('Hata oluştu!');
    } finally {
      setSavingRate(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-purple-400" /> Ücretli Abonelik Ayarları
          </h1>
          <p className="text-slate-400 mt-1">Platformdaki koçların abonelik paketleri için belirlediği fiyat ve sistem kesintisi oranlarını yönetin.</p>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl flex flex-col md:flex-row md:items-center gap-6">
        <div className="p-3 bg-blue-500/20 rounded-2xl shrink-0">
          <Info className="text-blue-400" size={28} />
        </div>
        <div className="flex-1">
          <h4 className="text-blue-300 font-bold mb-2 text-lg">Dinamik Koç Fiyatlandırması ve Kesinti</h4>
          <p className="text-blue-200/80 text-sm leading-relaxed mb-4">
            Abonelik paketlerinin satışından platformun alacağı komisyonu yüzde ve minimum tutar olarak belirleyin. Yüzdelik hesaplama, belirlediğiniz minimum tutarın altında kalırsa, minimum kesinti tutarı geçerli olur.
          </p>
          <div className="flex flex-wrap items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-blue-500/20">
              <div className="flex flex-col gap-3">
                 <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3">
                       <label className="text-sm font-bold text-white">Yüzdelik Kesinti (%):</label>
                       <input 
                         type="number" 
                         min="0"
                         max="100"
                         value={deductionRate}
                         onChange={(e) => setDeductionRate(Number(e.target.value))}
                         className="w-20 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-blue-500 text-center"
                       />
                    </div>
                    <button 
                      onClick={handleSaveRate}
                      disabled={savingRate}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                    >
                       <Save size={16} /> {savingRate ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                    <div className="flex flex-col gap-1">
                       <label className="text-xs font-bold text-orange-400">Min. Kesinti (Bronz)</label>
                       <input 
                         type="number" 
                         min="0"
                         value={minDeductionBronze}
                         onChange={(e) => setMinDeductionBronze(Number(e.target.value))}
                         className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm outline-none focus:border-orange-500"
                       />
                    </div>
                    <div className="flex flex-col gap-1">
                       <label className="text-xs font-bold text-slate-300">Min. Kesinti (Gümüş)</label>
                       <input 
                         type="number" 
                         min="0"
                         value={minDeductionSilver}
                         onChange={(e) => setMinDeductionSilver(Number(e.target.value))}
                         className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm outline-none focus:border-slate-400"
                       />
                    </div>
                    <div className="flex flex-col gap-1">
                       <label className="text-xs font-bold text-yellow-400">Min. Kesinti (Altın)</label>
                       <input 
                         type="number" 
                         min="0"
                         value={minDeductionGold}
                         onChange={(e) => setMinDeductionGold(Number(e.target.value))}
                         className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm outline-none focus:border-yellow-400"
                       />
                    </div>
                 </div>
              </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {SUBSCRIPTION_PACKAGES.map((pkg, idx) => {
            const isGold = pkg.name.includes('Altın');
            const isSilver = pkg.name.includes('Gümüş');
            const baseColor = isGold ? 'yellow' : isSilver ? 'blue' : 'orange';

            // Extract relevant price field for each coach
            const priceField = isGold ? 'goldPrice' : isSilver ? 'silverPrice' : 'bronzePrice';
            const defaultPrice = isGold ? 6000 : isSilver ? 4500 : 3000;

            const sortedCoaches = [...coaches].sort((a, b) => (a[priceField] || defaultPrice) - (b[priceField] || defaultPrice));

            return (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-slate-900 border rounded-3xl overflow-hidden relative flex flex-col border-white/10`}
              >
                <div className={`h-2 w-full bg-gradient-to-r ${pkg.stripColor}`}></div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      {pkg.badgeText && (
                        <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold mb-3 ${pkg.badgeBg}`}>
                          {pkg.badgeText}
                        </div>
                      )}
                      <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Koç Fiyatlandırmaları</h4>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {sortedCoaches.map(coach => {
                        const isBronze = pkg.name.toLowerCase().includes('bronz');
                        const isSilver = pkg.name.toLowerCase().includes('gümüş');
                        const isGold = pkg.name.toLowerCase().includes('altın');
                        
                        const minDeduction = isGold ? minDeductionGold : isSilver ? minDeductionSilver : minDeductionBronze;
                        
                        const cPrice = coach[priceField] || defaultPrice;
                        const percentageCut = Math.floor(cPrice * (deductionRate / 100));
                        const sCut = Math.max(percentageCut, minDeduction);
                        return (
                          <div key={coach.id} className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col gap-2">
                             <div className="flex justify-between items-center">
                               <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                                     {coach.firstName?.charAt(0) || '?'}
                                  </div>
                                  <span className="text-sm font-bold text-slate-200">{coach.firstName} {coach.lastName}</span>
                               </div>
                               <span className="text-sm font-black text-white">{cPrice.toLocaleString('tr-TR')} ₺</span>
                             </div>
                             <div className="flex justify-between text-[10px] px-1 border-t border-white/5 pt-2">
                                <span className="text-slate-500">Kesinti: <span className="text-red-400 font-mono font-bold">{sCut.toLocaleString('tr-TR')} ₺</span></span>
                                <span className="text-slate-500">Net: <span className="text-emerald-400 font-mono font-bold">{(cPrice - sCut).toLocaleString('tr-TR')} ₺</span></span>
                             </div>
                          </div>
                        )
                      })}
                      {coaches.length === 0 && (
                        <div className="text-center p-4 text-slate-500 text-sm">Hiç koç bulunamadı.</div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  );
}
