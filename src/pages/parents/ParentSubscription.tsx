import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Star, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useStudent } from '../../lib/StudentContext';
import { studentDataService } from '../../services/studentDataService';
import { isSubscriptionActive } from '../../services/subscriptionService';
import { SUBSCRIPTION_PACKAGES, SubscriptionPackage } from '../students/Subscription';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function ParentSubscription() {
  const { userData } = useAuth();
  const { selectedStudent } = useStudent();
  const [checking, setChecking] = useState(true);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [displayPackages, setDisplayPackages] = useState<SubscriptionPackage[]>(SUBSCRIPTION_PACKAGES);

  useEffect(() => {
    async function loadData() {
      if (!selectedStudent?.uid) {
        setChecking(false);
        return;
      }

      try {
        const profile = await studentDataService.getStudentProfile(selectedStudent.uid);
        setStudentProfile(profile);

        let bronze = 1000, silver = 1500, gold = 2000;
        let pBronze = 3000, pSilver = 4500, pGold = 6000;
        
        let rate = 20;
        let minRateBronze = 1000;
        let minRateSilver = 1500;
        let minRateGold = 2000;
        const rootSnap = await getDoc(doc(db, 'settings', 'financial'));
        if (rootSnap.exists()) {
          const data = rootSnap.data();
          if (data.systemDeductionRate !== undefined) rate = data.systemDeductionRate;
          if (data.minSystemDeductionBronze !== undefined) minRateBronze = data.minSystemDeductionBronze;
          if (data.minSystemDeductionSilver !== undefined) minRateSilver = data.minSystemDeductionSilver;
          if (data.minSystemDeductionGold !== undefined) minRateGold = data.minSystemDeductionGold;
        }

        const coachId = profile?.assignedCoachId || profile?.coachId;
        
        if (coachId) {
          const coachDoc = await getDoc(doc(db, 'users', coachId));
          if (coachDoc.exists()) {
            const data = coachDoc.data();
            pBronze = data.bronzePrice || 3000;
            pSilver = data.silverPrice || 4500;
            pGold = data.goldPrice || 6000;
            if (data.specialDeductionRate !== undefined) rate = data.specialDeductionRate;
            if (data.specialMinDeductionBronze !== undefined) minRateBronze = data.specialMinDeductionBronze;
            if (data.specialMinDeductionSilver !== undefined) minRateSilver = data.specialMinDeductionSilver;
            if (data.specialMinDeductionGold !== undefined) minRateGold = data.specialMinDeductionGold;
          }
        }

        const specialDiscounts = profile?.specialDiscounts || {};
        const dBronze = specialDiscounts.bronze ? Math.floor(pBronze * (specialDiscounts.bronze / 100)) : 0;
        const dSilver = specialDiscounts.silver ? Math.floor(pSilver * (specialDiscounts.silver / 100)) : 0;
        const dGold = specialDiscounts.gold ? Math.floor(pGold * (specialDiscounts.gold / 100)) : 0;

        const newPackages = [
          { ...SUBSCRIPTION_PACKAGES[0], price: pBronze - dBronze, originalPrice: pBronze, systemDeduction: Math.max(Math.floor(pBronze * (rate / 100)), minRateBronze) },
          { ...SUBSCRIPTION_PACKAGES[1], price: pSilver - dSilver, originalPrice: pSilver, systemDeduction: Math.max(Math.floor(pSilver * (rate / 100)), minRateSilver) },
          { ...SUBSCRIPTION_PACKAGES[2], price: pGold - dGold, originalPrice: pGold, systemDeduction: Math.max(Math.floor(pGold * (rate / 100)), minRateGold) }
        ];
        setDisplayPackages(newPackages);
        
      } catch(e) {
        console.error("Error loading subscription data", e);
      } finally {
        setChecking(false);
      }
    }
    
    loadData();
  }, [userData, selectedStudent]);

  if (checking) {
    return (
      <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center animate-in fade-in duration-500 min-h-[50vh]">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Öğrenci Abonelik Durumu Kontrol Ediliyor...</h2>
        <p className="text-slate-400 text-sm">Lütfen bekleyin</p>
      </div>
    );
  }

  const hasActiveSub = isSubscriptionActive(studentProfile);
  const planExpiryDate = studentProfile?.subscriptionEndDate ? new Date(studentProfile.subscriptionEndDate) : null;
  const daysRemaining = planExpiryDate 
    ? Math.max(0, Math.ceil((planExpiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20 p-6 md:p-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2">
            <Star size={12} className="fill-blue-400/30" />
            Veli - Abonelik Görüntüleme
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase italic">
            Öğrenci Abonelik Durumu
          </h1>
          <p className="text-slate-400 font-medium max-w-2xl text-sm leading-relaxed">
            Öğrencinizin mevcut abonelik paketini ve sistem haklarını bu ekrandan salt okunur olarak inceleyebilirsiniz.
          </p>
        </div>
      </div>

      {hasActiveSub ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Info */}
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-950/40 via-slate-900/40 to-slate-900/40 border border-indigo-500/20 rounded-[32px] p-8 relative overflow-hidden flex flex-col justify-between min-h-[250px]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />
            
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">AKTİF ABONELİK PAKETİ</p>
                <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight flex items-center gap-3">
                  {studentProfile.subscriptionPlan}
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                    Abonelik Aktif
                  </span>
                </h2>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                <ShieldCheck size={28} />
              </div>
            </div>

            {/* Progress of Subscription */}
            <div className="my-6 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Başlangıç: {new Date(studentProfile.subscriptionStartDate).toLocaleDateString('tr-TR')}</span>
                <span className="font-extrabold text-indigo-300">{daysRemaining} Gün Kaldı</span>
                <span>Bitiş: {planExpiryDate?.toLocaleDateString('tr-TR')}</span>
              </div>
              <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (daysRemaining / 28) * 100)}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/5">
                <p className="text-xs text-slate-500 font-medium">Bu bilgiler sadece görüntüleme amaçlıdır, değişiklikler öğrenci panelinden yapılabilir.</p>
            </div>
          </div>

          {/* Quick Settings & Balance Summary */}
          <div className="bg-slate-900/30 border border-white/5 rounded-[32px] p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">ABONELİK AYARLARI</h3>
              
              {/* Auto Renew Status */}
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div>
                  <h4 className="text-sm font-bold text-slate-300">Otomatik Yenileme</h4>
                  <p className="text-xs text-slate-500">Süre bitiminde bakiyeden kesilsin</p>
                </div>
                <div className={`text-xs font-bold px-3 py-1 rounded-full ${studentProfile.autoRenew !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {studentProfile.autoRenew !== false ? 'Açık' : 'Kapalı'}
                </div>
              </div>

              {/* Status Row */}
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-xs">
                <span className="text-slate-400">Yenilenme Sıklığı</span>
                <span className="text-slate-200 font-extrabold uppercase">Her 4 Haftada Bir</span>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-indigo-950/20 border border-indigo-500/20 rounded-[32px] p-10 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[100px] pointer-events-none" />
          <p className="text-sm font-black text-indigo-400 uppercase tracking-widest justify-center mb-3">SİSTEM KULLANIM DURUMU</p>
          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3">Aktif Abonelik Bulunamadı</h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-6">
            Öğrencinizin sistem üzerinde tanımlı aktif bir aboneliği bulunmamaktadır. Aşağıdaki paketleri inceleyerek sistem özellikleri hakkında fikir sahibi olabilirsiniz.
          </p>
        </motion.div>
      )}

      {/* PACKAGES SELECTION PANEL (Read Only) */}
      <div className="space-y-8">
        <div className="text-left space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
             MEVCUT ABONELİK PAKETLERİ
          </h2>
          <p className="text-slate-500 text-sm max-w-2xl">
             Öğrencinizin tercih edebileceği güncel paket seçenekleri aşağıda listelenmiştir. İşlemler yalnızca öğrenci paneli üzerinden yapılmaktadır.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch pt-2">
          {displayPackages.map((plan, idx) => {
            const isCurrent = hasActiveSub && studentProfile?.subscriptionPlan === plan.name;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-slate-900/40 backdrop-blur-xl rounded-[24px] md:rounded-[32px] overflow-hidden border shadow-2xl relative z-10 flex flex-col h-full ${plan.borderColor} ${plan.shadowColor} ${isCurrent ? 'ring-2 ring-indigo-500/50' : ''}`}
              >
                {/* Thin Stripe */}
                <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${plan.stripColor}`}></div>

                {/* Badges */}
                {plan.badgeText && (
                  <div className={`${plan.badgeBg} text-center py-1.5 md:py-2 px-4 text-[9px] md:text-[10px] font-extrabold uppercase tracking-widest shadow-lg mx-auto w-full backdrop-blur-md`}>
                    {plan.badgeText}
                  </div>
                )}
                
                <div className="p-6 md:p-8 pb-0 pt-6 md:pt-8">
                  <h3 className="text-center font-bold text-lg md:text-xl text-white tracking-tight mb-2 uppercase italic">{plan.name}</h3>
                  <div className="text-center mb-6 md:mb-8">
                    <span className="text-xs md:text-sm text-slate-400 mr-1">₺</span>
                    <span className="text-4xl md:text-5xl font-black text-white tracking-tight">{plan.price.toLocaleString('tr-TR')}</span>
                    <span className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mt-2">4 haftalık kullanım için</span>
                  </div>
                  
                  <div 
                    className={`w-full text-center font-bold text-sm py-3 px-4 rounded-xl shadow-lg mb-6 md:mb-8 ${isCurrent ? 'bg-slate-800 text-emerald-400 border border-emerald-500/50' : 'bg-slate-800/50 text-slate-500 border border-slate-700/50'}`}
                  >
                    {isCurrent ? 'Kullanılan Paket' : 'Diğer Paket Seçeneği'}
                  </div>
                </div>
                
                <div className="p-6 md:p-8 pt-0 flex-1">
                  <ul className="space-y-3.5">
                    {plan.features.map((feature, fIdx) => {
                      const isBronzeWrap = feature === "Bronz paket içeriklerinin tamamı";
                      const isSilverWrap = feature === "Gümüş paket içeriklerinin tamamı";
                      const isWrapItem = isBronzeWrap || isSilverWrap;

                      return (
                        <li key={fIdx} className={
                          isBronzeWrap ? "flex items-center gap-3 text-sm bg-gradient-to-r from-orange-600/10 to-transparent border border-orange-500/20 p-2.5 rounded-xl mb-4" :
                          isSilverWrap ? "flex items-center gap-3 text-sm bg-gradient-to-r from-blue-300/10 to-transparent border border-blue-400/20 p-2.5 rounded-xl mb-4" :
                          "flex items-start gap-3.5 text-xs text-slate-300"
                        }>
                          <div className={
                            isBronzeWrap ? "p-1 rounded-full shrink-0 border bg-orange-500/20 border-orange-500/40 text-orange-400" :
                            isSilverWrap ? "p-1 rounded-full shrink-0 border bg-blue-300/20 border-blue-400/40 text-blue-300" :
                            `p-0.5 rounded-full shrink-0 mt-0.5 border bg-white/5 border-white/10 ${plan.iconColor}`
                          }>
                            <Check size={isWrapItem ? 12 : 10} strokeWidth={4} />
                          </div>
                          <span className={
                            isBronzeWrap ? "text-orange-200 font-bold uppercase tracking-wide text-[10px]" :
                            isSilverWrap ? "text-blue-200 font-bold uppercase tracking-wide text-[10px]" :
                            "text-slate-300 leading-snug"
                          }>
                            {feature}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
