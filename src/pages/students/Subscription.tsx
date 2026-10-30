import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  Check, 
  Calendar, 
  Clock, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Trash2,
  Play,
  ChevronRight,
  Gift,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { studentDataService } from '../../services/studentDataService';
import { useCart } from '../../lib/CartContext';
import { notificationService } from '../../services/notificationService';
import { isSubscriptionActive, checkAndRenewSubscription } from '../../services/subscriptionService';
import { getDoc, getDocs, collection, query, where, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface SubscriptionPackage {
  name: string;
  price: number; 
  originalPrice?: number;
  systemDeduction: number;
  durationDays: number; 
  badgeText?: string;
  badgeBg?: string;
  borderColor: string;
  shadowColor: string;
  stripColor: string;
  buttonClass: string;
  iconColor: string;
  features: string[];
}

export const SUBSCRIPTION_PACKAGES: SubscriptionPackage[] = [
  {
    name: "Akademik Kıvılcım (Bronz Paket)",
    price: 3000,
    systemDeduction: 1000,
    durationDays: 28,
    badgeText: "Giriş Seviyesi",
    badgeBg: "bg-orange-600/20 text-orange-400 border border-orange-500/30",
    borderColor: "border-orange-500/20",
    shadowColor: "shadow-orange-500/5",
    stripColor: "from-orange-400 to-orange-600",
    buttonClass: "bg-orange-600/10 hover:bg-orange-600 border border-orange-500/30 text-orange-200 hover:text-white",
    iconColor: "text-orange-400",
    features: [
      "Haftalık Ders Çalışma Programı",
      "Haftalık Soru Takibi",
      "Haftalık Kitap Takibi",
      "Haftalık Konu Takibi",
      "Aylık Konu Hedefi ve Takibi",
      "Aylık Kitap Bitirme Programı",
      "Temel Deneme Takibi",
      "Veli Bilgilendirme Sistemi (aylık rapor)"
    ]
  },
  {
    name: "Akademik Momentum (Gümüş Paket)",
    price: 4500,
    systemDeduction: 1500,
    durationDays: 28,
    badgeText: "En Popüler",
    badgeBg: "bg-blue-600/20 text-blue-400 border border-blue-500/30",
    borderColor: "border-slate-300/20",
    shadowColor: "shadow-blue-500/5",
    stripColor: "from-blue-400 to-indigo-600",
    buttonClass: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25",
    iconColor: "text-blue-400",
    features: [
      "Haftalık Ders Çalışma Programı",
      "Haftalık Soru Takibi",
      "Haftalık Kitap Takibi",
      "Haftalık Konu Takibi",
      "Aylık Konu Hedefi ve Takibi",
      "Aylık Kitap Bitirme Programı",
      "Temel ve Kurumsal Deneme Takibi",
      "Veli Bilgilendirme Sistemi (Haftalık + Aylık rapor)",
      "Ayrıntılı Deneme Analizi",
      "Öğrenci Analizleri (10 Farklı Kişilik Analizi)",
      "Zaman Yönetim Asistanları (2 Adet)",
      "Destekleyici Online Programlar (9 Adet)"
    ]
  },
  {
    name: "Sınırsız Zirve VIP (Altın Paket)",
    price: 6000,
    systemDeduction: 2000,
    durationDays: 28,
    badgeText: "En Kapsamlı",
    badgeBg: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    borderColor: "border-yellow-400/20",
    shadowColor: "shadow-yellow-500/5",
    stripColor: "from-yellow-300 to-amber-500",
    buttonClass: "bg-yellow-500/10 hover:bg-yellow-500 border border-yellow-400/30 text-yellow-200 hover:text-yellow-950",
    iconColor: "text-yellow-400",
    features: [
      "Haftalık Ders Çalışma Programı",
      "Haftalık Soru Takibi",
      "Haftalık Kitap Takibi",
      "Haftalık Konu Takibi",
      "Aylık Konu Hedefi ve Takibi",
      "Aylık Kitap Bitirme Programı",
      "Temel ve Kurumsal Deneme Takibi",
      "Veli Bilgilendirme Sistemi (Haftalık + Aylık rapor)",
      "Kurumsal ve Ayrıntılı Deneme Analizi",
      "Öğrenci Analizleri (45 Farklı Kişilik Analizi)",
      "Zaman Yönetim Asistanları (3 Adet)",
      "Destekleyici Online Programlar (18 Adet)",
      "Otomatik Hata Telafi Testi",
      "Veliler için Kapsamlı Bilgilendirme Raporları",
      "Öğrenci ve Veliler için Yapay Zekâ Asistan",
      "140 Soruluk Yapay Zekâ Soru Çözümü"
    ]
  }
];

export default function Subscription() {
  const { userData, user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [processing, setProcessing] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const isChecking = useRef(false);
  
  // Modal states
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPackage | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedTrialPlan, setSelectedTrialPlan] = useState<SubscriptionPackage | null>(null);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [startingTrial, setStartingTrial] = useState(false);
  const [displayPackages, setDisplayPackages] = useState<SubscriptionPackage[]>(SUBSCRIPTION_PACKAGES);
  const [loadingPricing, setLoadingPricing] = useState(true);

  const isEligibleForTrial = !userData?.hasUsedTrial && !userData?.hasUsedSubscriptionTrial && !isSubscriptionActive(userData);

  useEffect(() => {
    async function loadPricing() {
      try {
        let bronze = 1000, silver = 1500, gold = 2000;
        let pBronze = 3000, pSilver = 4500, pGold = 6000;
        
        // Fetch deduction rate from settings
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

        const coachId = userData?.assignedCoachId || userData?.coachId;
        
        if (coachId) {
          const coachDoc = await getDoc(doc(db, 'users', coachId));
          if (coachDoc.exists()) {
            const data = coachDoc.data();
            pBronze = data.bronzePrice !== undefined && data.bronzePrice !== null ? data.bronzePrice : 3000;
            pSilver = data.silverPrice !== undefined && data.silverPrice !== null ? data.silverPrice : 4500;
            pGold = data.goldPrice !== undefined && data.goldPrice !== null ? data.goldPrice : 6000;
            if (data.specialDeductionRate !== undefined) rate = data.specialDeductionRate;
            if (data.specialMinDeductionBronze !== undefined) minRateBronze = data.specialMinDeductionBronze;
            if (data.specialMinDeductionSilver !== undefined) minRateSilver = data.specialMinDeductionSilver;
            if (data.specialMinDeductionGold !== undefined) minRateGold = data.specialMinDeductionGold;
          }
        } else {
          // If no coach, find minimum starting prices
          const q = query(collection(db, 'users'), where('role', '==', 'coach'));
          const snapshot = await getDocs(q);
          let minB = 3000, minS = 4500, minG = 6000;
          let foundCoach = false;
          snapshot.forEach(d_doc => {
             const d = d_doc.data();
             foundCoach = true;
             if (d.bronzePrice !== undefined && d.bronzePrice < minB) minB = d.bronzePrice;
             if (d.silverPrice !== undefined && d.silverPrice < minS) minS = d.silverPrice;
             if (d.goldPrice !== undefined && d.goldPrice < minG) minG = d.goldPrice;
          });
          
          if (foundCoach) {
             pBronze = Math.max(0, minB);
             pSilver = Math.max(0, minS);
             pGold = Math.max(0, minG);
          } else {
             pBronze = 3000;
             pSilver = 4500;
             pGold = 6000;
          }
        }

        const specialDiscounts = userData?.specialDiscounts || {};
        const dBronze = specialDiscounts.bronze ? Math.floor(pBronze * (specialDiscounts.bronze / 100)) : 0;
        const dSilver = specialDiscounts.silver ? Math.floor(pSilver * (specialDiscounts.silver / 100)) : 0;
        const dGold = specialDiscounts.gold ? Math.floor(pGold * (specialDiscounts.gold / 100)) : 0;

        const newPackages = [
          { 
            ...SUBSCRIPTION_PACKAGES[0], 
            price: Math.max(0, pBronze - dBronze), 
            originalPrice: pBronze, 
            systemDeduction: Math.max(Math.floor(pBronze * (rate / 100)), minRateBronze) 
          },
          { 
            ...SUBSCRIPTION_PACKAGES[1], 
            price: Math.max(0, pSilver - dSilver), 
            originalPrice: pSilver, 
            systemDeduction: Math.max(Math.floor(pSilver * (rate / 100)), minRateSilver) 
          },
          { 
            ...SUBSCRIPTION_PACKAGES[2], 
            price: Math.max(0, pGold - dGold), 
            originalPrice: pGold, 
            systemDeduction: Math.max(Math.floor(pGold * (rate / 100)), minRateGold) 
          }
        ];
        setDisplayPackages(newPackages);
        
        if (!isChecking.current) {
          checkAndHandleExpiration(newPackages);
        }
      } catch(e) {
        console.error("Pricing load error", e);
      } finally {
        setLoadingPricing(false);
      }
    }
    
    if (userData) {
      loadPricing();
    } else {
      setChecking(false);
      setLoadingPricing(false);
    }
  }, [userData?.uid, userData?.subscriptionEndDate, userData?.coachId, userData?.assignedCoachId]);

  // Check and handle subscription expiration
  const checkAndHandleExpiration = async (_loadedPackages: SubscriptionPackage[]) => {
    if (!userData || !user) {
      setChecking(false);
      return;
    }
    
    isChecking.current = true;
    try {
      const res = await checkAndRenewSubscription(userData, user.uid);
      if (res.renewed) {
        setSuccess(res.message || 'Aboneliğiniz başarıyla otomatik olarak yenilendi!');
      } else if (res.message && (userData.subscriptionStatus === 'expired' || new Date(userData.subscriptionEndDate) < new Date())) {
        setError(res.message);
      }
    } catch (e) {
      console.error("Subscription check error:", e);
    } finally {
      setChecking(false);
      isChecking.current = false;
    }
  };

  const handleSubscribeClick = (pkg: SubscriptionPackage) => {
    setSelectedPlan(pkg);
    setShowConfirmModal(true);
  };

  const handleStartTrialClick = (pkg: SubscriptionPackage) => {
    setSelectedTrialPlan(pkg);
    setShowTrialModal(true);
  };

  const executeTrialStart = async () => {
    if (!selectedTrialPlan || !user || !userData) return;
    try {
      setStartingTrial(true);
      setError(null);
      const studentName = `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Öğrenci';
      await studentDataService.startTrialSubscription(user.uid, selectedTrialPlan.name, studentName);
      
      setShowTrialModal(false);
      setSuccess(`🎉 Tebrikler! ${selectedTrialPlan.name} için 7 günlük ücretsiz denemeniz başarıyla başlatıldı.`);
      
      // Update local state smoothly
      const now = new Date();
      const trialEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      await studentDataService.updateStudentProfile(user.uid, {
        subscriptionPlan: selectedTrialPlan.name,
        subscriptionStartDate: now.toISOString(),
        subscriptionEndDate: trialEndDate.toISOString(),
        subscriptionStatus: 'active',
        isTrial: true,
        hasUsedTrial: true
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Deneme süresi başlatılırken bir hata oluştu.');
    } finally {
      setStartingTrial(false);
    }
  };

  const executeSubscription = () => {
    if (!selectedPlan || !user || !userData) return;

    addToCart({
      itemId: selectedPlan.name, // using name as id since it's unique
      type: 'subscription',
      title: selectedPlan.name,
      price: selectedPlan.price,
      quantity: 1,
      metadata: {
        durationDays: selectedPlan.durationDays,
        originalPrice: selectedPlan.originalPrice,
        systemDeduction: selectedPlan.systemDeduction
      }
    });

    setShowConfirmModal(false);
    navigate('/panel/ogrenci/sepet');
  };

  const handleToggleAutoRenew = async () => {
    if (!user || !userData) return;
    const currentAutoRenew = userData.autoRenew !== false; // defaults to true
    
    try {
      setProcessing(true);
      await studentDataService.updateStudentProfile(user.uid, {
        autoRenew: !currentAutoRenew
      });
      setSuccess(`Otomatik yenileme ayarı başarıyla ${!currentAutoRenew ? 'açıldı' : 'kapatıldı'}.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Ayar kaydedilirken bir hata meydana geldi.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !userData || !window.confirm("Aboneliği iptal etmek istediğinizden emin misiniz? Süre bitiminde yenilenmeyecektir.")) return;
    try {
      setProcessing(true);
      await studentDataService.updateStudentProfile(user.uid, {
        autoRenew: false
      });
      await notificationService.addNotification(user.uid, {
          title: 'Otomatik Yenileme İptal Edildi',
          message: 'Otomatik paket yenileme özelliği kapatıldı. Süre bitiminde aboneliğin yenilenmeyecek.',
          type: 'system',
          link: '/panel/ogrenci/abonelik'
      });
      setSuccess("Otomatik yenileme kapatıldı. Kalan süreniz bitince aboneliğiniz sona erecektir.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('İşlem iptal edilirken hata oluştu.');
    } finally {
      setProcessing(false);
    }
  };

  if (checking) {
    return (
      <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center animate-in fade-in duration-500 min-h-[50vh]">
        <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Abonelik Durumu Doğrulanıyor...</h2>
        <p className="text-slate-400 text-sm">Finansal tanımlamalarınız kontrol ediliyor</p>
      </div>
    );
  }

  const hasActiveSub = isSubscriptionActive(userData);
  const planExpiryDate = userData?.subscriptionEndDate ? new Date(userData.subscriptionEndDate) : null;
  const daysRemaining = planExpiryDate 
    ? Math.max(0, Math.ceil((planExpiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20 p-6 md:p-10">
      
      {/* Feedbacks */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-rose-500/10 border border-rose-500/20 text-rose-200 p-4 rounded-2xl flex items-start gap-3"
          >
            <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={18} />
            <div className="text-sm">
              <span className="font-bold">Hata:</span> {error}
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 p-4 rounded-2xl flex items-start gap-3"
          >
            <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={18} />
            <div className="text-sm">
              <span className="font-bold">Başarılı:</span> {success}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2">
            <Star size={12} className="fill-blue-400/30" />
            Öğrenci Abonelik Sistemi
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase italic">
            YKS Aboneliklerim
          </h1>
          <p className="text-slate-400 font-medium max-w-2xl text-sm leading-relaxed">
            Eğitim paketlerinizi yönetin, sistemdeki hak ve sınırlamaları genişletin. 
            Abonelik ücretleri cüzdanınızdan düşürülür.
          </p>
        </div>
      </div>

      {/* First-Time 7-Day Trial Announcement Banner */}
      {isEligibleForTrial && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500/20 via-indigo-900/30 to-purple-900/20 border border-amber-500/40 rounded-[32px] p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-amber-500/5"
        >
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 blur-[90px] pointer-events-none" />
          <div className="flex items-start md:items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Sparkles size={28} />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                <Gift size={12} /> İLK ABONELİĞİNİZE ÖZEL FIRSAT
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                7 Günlük Ücretsiz Deneme Süresi!
              </h2>
              <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
                FocusOn Akademi ayrıcalıklarını deneyimlemeniz için ilk aboneliğinize özel olarak dilediğiniz paketi <strong>7 gün boyunca tamamen ücretsiz</strong> deneyebilirsiniz. Kredi kartı veya bakiye zorunluluğu yoktur.
              </p>
            </div>
          </div>
          <div className="shrink-0 relative z-10 w-full md:w-auto text-center md:text-right">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20">
              <Zap size={14} className="fill-slate-950" />
              ₺0 ile 7 Gün Dene
            </div>
          </div>
        </motion.div>
      )}

      {hasActiveSub ? (
        /* CURRENT SUBSCRIPTION BANNER (BENTO GRID style) */
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
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">AKTİF ABONELİK PAKETİNİZ</p>
                  {userData?.isTrial && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles size={11} /> 7 Günlük Ücretsiz Deneme
                    </span>
                  )}
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight flex flex-col sm:flex-row sm:items-center gap-3">
                  <span>
                    {(() => {
                      const match = (userData.subscriptionPlan || "").match(/^(.*?)\s*(\(.*?\))$/);
                      if (match) {
                        return (
                          <span className="flex flex-col">
                            <span>{match[1]}</span>
                            <span className="text-sm font-semibold text-slate-400 mt-1">{match[2]}</span>
                          </span>
                        );
                      }
                      return userData.subscriptionPlan;
                    })()}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full self-start sm:self-auto border ${
                    userData?.isTrial 
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {userData?.isTrial ? 'Deneme Aktif' : 'Abonelik Aktif'}
                  </span>
                </h2>
              </div>
              <div className={`p-3 rounded-2xl border ${
                userData?.isTrial 
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
              }`}>
                {userData?.isTrial ? <Sparkles size={28} /> : <ShieldCheck size={28} />}
              </div>
            </div>

            {/* Progress of Subscription */}
            <div className="my-6 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Başlangıç: {new Date(userData.subscriptionStartDate).toLocaleDateString('tr-TR')}</span>
                <span className={`font-extrabold ${userData?.isTrial ? 'text-amber-300' : 'text-indigo-300'}`}>
                  {daysRemaining} Gün Kaldı {userData?.isTrial && '(Deneme Sürümü)'}
                </span>
                <span>Bitiş: {planExpiryDate?.toLocaleDateString('tr-TR')}</span>
              </div>
              <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (daysRemaining / (userData?.isTrial ? 7 : 28)) * 100)}%` }}
                  className={`h-full rounded-full ${
                    userData?.isTrial 
                      ? 'bg-gradient-to-r from-amber-400 to-amber-600' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  }`}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
              <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-md">
                {userData?.isTrial 
                  ? `7 günlük ücretsiz denemeniz aktif. Süre bitiminde (${planExpiryDate?.toLocaleDateString('tr-TR')}) bakiyeniz yeterliyse paketiniz normal 28 günlük periyotta devam eder veya dilediğiniz an iptal edebilirsiniz.`
                  : 'Aboneliğiniz 28 günde bir otomatik bakiye düşümü ile yenilenecektir. Cüzdan bakiyenizi takip etmeyi unutmayın.'}
              </p>
              
              <button 
                onClick={handleCancelSubscription}
                disabled={processing}
                className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 bg-rose-500/15 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
              >
                <Trash2 size={14} />
                Aboneliği İptal Et (Otomatik Yenilemeyi Kapat)
              </button>
            </div>
          </div>

          {/* Quick Settings & Balance Summary */}
          <div className="bg-slate-900/30 border border-white/5 rounded-[32px] p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">ABONELİK AYARLARI</h3>
              
              {/* Auto Renew Switch */}
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div>
                  <h4 className="text-sm font-bold text-slate-300">Otomatik Yenileme</h4>
                  <p className="text-xs text-slate-500">Süre bitiminde bakiyeden kesilsin</p>
                </div>
                <button
                  onClick={handleToggleAutoRenew}
                  disabled={processing}
                  className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 outline-none flex items-center ${
                    userData.autoRenew !== false ? 'bg-indigo-600 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <motion.div 
                    layout 
                    className="w-5 h-5 rounded-full bg-white shadow-md cursor-pointer"
                  />
                </button>
              </div>

              {/* Status Row */}
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-xs">
                <span className="text-slate-400">Yenilenme Sıklığı</span>
                <span className="text-slate-200 font-extrabold uppercase">
                  {userData?.isTrial ? '7 Günlük Deneme / Sonrası 4 Hafta' : 'Her 4 Haftada Bir'}
                </span>
              </div>
            </div>

            {/* Current Balance Card */}
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block mb-0.5">CÜZDAN BAKİYENİZ</span>
                <span className="text-2xl font-black text-white">₺{(userData.walletBalance || 0).toLocaleString('tr-TR')}</span>
              </div>
              <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                TL Bakiyesi
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        /* NO ACTIVE SUBSCRIPTION INVITATION BUILD */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-indigo-950/20 border border-indigo-500/20 rounded-[32px] p-10 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[100px] pointer-events-none" />
          <p className="text-sm font-black text-indigo-400 uppercase tracking-widest justify-center mb-3">SİSTEM KULLANIM DURUMU</p>
          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3">Abonelik Bulunamadı</h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-6">
            {isEligibleForTrial 
              ? 'İlk aboneliğinize özel 7 günlük ücretsiz deneme fırsatınız bulunmaktadır. Aşağıdaki paketlerden dilediğinizi seçerek hemen 7 gün ücretsiz deneyebilirsiniz.'
              : 'Herhangi bir aktif aboneliğiniz bulunmamaktadır. Aşağıdaki YKS uyumlu premium paketleri inceleyerek cüzdan bakiyeniz üzerinden anında üyeliğinizi başlatabilirsiniz.'}
          </p>
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-xs text-emerald-400 font-semibold">
            <Zap size={14} className="fill-emerald-400/20" />
            Cüzdan bakiyeniz: ₺{(userData?.walletBalance || 0).toLocaleString('tr-TR')}
          </div>
        </motion.div>
      )}

      {/* PACKAGES SELECTION PANEL */}
      <div className="space-y-8">
        <div className="text-left space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
             {hasActiveSub ? 'YENİ PLAN SEÇ VEYA PAKET DEĞİŞTİR' : 'ABONELİK PAKETLERİMİZ'}
          </h2>
          <p className="text-slate-500 text-sm max-w-2xl">
             YKS için en kapsamlı rehberliğe, yapay zeka entegrasyonuna ve analiz sistemlerine paketlerimizi yükselterek erişin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch pt-2">
          {displayPackages.map((plan, idx) => {
            const isCurrent = hasActiveSub && userData?.subscriptionPlan === plan.name;
            const hasCoach = !!(userData?.coachId || userData?.assignedCoachId);
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
                  <h3 className="text-center font-bold text-lg md:text-xl text-white tracking-tight mb-2 uppercase italic flex flex-col items-center">
                    {(() => {
                      const match = plan.name.match(/^(.*?)\s*(\(.*?\))$/);
                      if (match) {
                        return (
                          <>
                            <span>{match[1]}</span>
                            <span className="block text-xs md:text-sm opacity-85 font-semibold text-slate-300 mt-1 lowercase normal-case">{match[2]}</span>
                          </>
                        );
                      }
                      return plan.name;
                    })()}
                  </h3>
                  <div className="text-center mb-6 md:mb-8">
                    {plan.price === 0 ? (
                      <span className="text-3xl md:text-4xl font-black text-emerald-400 tracking-tight">Ücretsiz</span>
                    ) : (
                      <>
                        <span className="text-xs md:text-sm text-slate-400 mr-1">₺</span>
                        <span className="text-4xl md:text-5xl font-black text-white tracking-tight">{plan.price.toLocaleString('tr-TR')}</span>
                      </>
                    )}
                    {!hasCoach && (
                        <span className="block text-[10px] md:text-xs font-bold text-emerald-400 mt-2 mb-1 lowercase">'den başlayan fiyatlarla</span>
                    )}
                    <span className="block text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mt-2">4 haftalık kullanım için</span>
                  </div>
                  
                  {isEligibleForTrial && plan.price > 0 ? (
                    <div className="space-y-2 mb-6 md:mb-8">
                      <button 
                        onClick={() => handleStartTrialClick(plan)}
                        disabled={processing || startingTrial}
                        className="w-full font-black text-xs md:text-sm py-3 px-4 rounded-xl transition-all shadow-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Sparkles size={16} /> 7 Gün Ücretsiz Dene
                      </button>
                      <button 
                        onClick={() => handleSubscribeClick(plan)}
                        disabled={processing || startingTrial}
                        className="w-full text-center text-xs font-semibold py-2 px-3 text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1"
                      >
                        <span>Doğrudan Satın Al (4 Hafta)</span> <ChevronRight size={13} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleSubscribeClick(plan)}
                      disabled={isCurrent || processing}
                      className={`w-full font-bold text-sm py-3 px-4 rounded-xl transition-all shadow-lg mb-6 md:mb-8 ${isCurrent ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' : plan.buttonClass}`}
                    >
                      {isCurrent ? (userData?.isTrial ? 'Mevcut Deneme Paketiniz' : 'Mevcut Paketiniz') : (plan.price === 0 ? 'Ücretsiz Başlat' : (hasActiveSub ? 'Geçiş Yap / Yenile' : 'Abone Ol'))}
                    </button>
                  )}
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

      {/* DETAILED INFO & SUPPORT ACCORDION / BENTO PANEL */}
      <div className="bg-slate-900/40 border border-white/5 rounded-[32px] p-8 space-y-4">
        <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
          <HelpCircle className="text-slate-400" size={20} />
          ABONELİK SİSTEMİ NASIL ÇALIFIR?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-400 leading-relaxed">
          <div className="space-y-3">
            <p>
              <strong className="text-slate-200">1. Sistem Özeti & 7 Günlük Deneme:</strong> İlk kez abonelik başlatan tüm öğrencilerimiz için 7 günlük ücretsiz deneme imkanı sunulmaktadır. Deneme süresinde hiçbir bakiye kesintisi yapılmaz.
            </p>
            <p>
              <strong className="text-slate-200">2. Otomatik Yenileme Periyodu:</strong> Normal üyelik süreleriniz 4 hafta (28 gün) olarak belirlenmiştir. Otomatik yenileme seçeneğiniz açık olduğu sürece süre dolduğunda bakiyeniz olması koşuluyla yenileme otomatik gerçekleşir.
            </p>
          </div>
          <div className="space-y-3">
            <p>
              <strong className="text-slate-200">3. Paket Değişikliği (Upgrade/Downgrade):</strong> İstediğiniz zaman paketinizi yükseltebilir veya değiştirebilirsiniz. Yeni satın alma, önceki abonelik bitişinizi güncelleyerek anında devreye girer.
            </p>
            <p>
              <strong className="text-slate-200">4. Yetkilendirmeler:</strong> Şimdilik tüm yetkilendirmeler ve kısıtlamalar açık durumdadır. İlerleyen güncellemelerde paket kapsamına göre özellik sınırlandırmaları entegre edilecektir.
            </p>
          </div>
        </div>
      </div>

      {/* 7-DAY FREE TRIAL CONFIRMATION DIALOG MODAL */}
      {showTrialModal && selectedTrialPlan && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-amber-500/30 rounded-[32px] p-8 max-w-lg w-full space-y-6 relative overflow-hidden shadow-2xl shadow-amber-500/10"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 blur-[60px] pointer-events-none" />
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-300 rounded-2xl flex items-center justify-center border border-amber-500/30 shrink-0">
                <Sparkles size={24} />
              </div>
              <div>
                <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-400 tracking-wider">
                  <Gift size={11} /> SADECE İLK ABONELİKTE GEÇERLİ
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">7 GÜNLÜK ÜCRETSİZ DENEME</h3>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3 text-sm">
              <div className="flex justify-between items-start">
                <span className="text-slate-400">Seçilen Paket:</span>
                <span className="text-white font-bold text-right">{selectedTrialPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Deneme Süresi:</span>
                <span className="text-emerald-400 font-extrabold">7 Gün Tam Erişim</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-3">
                <span className="text-slate-400">Şimdi Ödenecek Tutar:</span>
                <span className="text-amber-400 font-black text-lg">₺0 (ÜCRETSİZ)</span>
              </div>
            </div>

            <div className="text-xs text-slate-300 bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl leading-relaxed flex items-start gap-3">
              <Sparkles size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300 mb-1">Deneme Süresi Koşulları:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  <li>7 gün boyunca paketin tüm özelliklerini ücretsiz deneyimleyebilirsiniz.</li>
                  <li>Altın Paket 7 günlük deneme süresinde Yapay Zeka Soru Çözüm Asistanı'na toplam 21 soru sorma hakkı tanımlanır (Normal 4 haftalık abonelikte 140 soru).</li>
                  <li>Cüzdanınızdan hiçbir ücret kesilmez.</li>
                  <li>Deneme süresi bitiminde, cüzdanınızda bakiye olması durumunda aboneliğiniz normal periyotla devam eder. Dilediğiniz an tek tıkla iptal edebilirsiniz.</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowTrialModal(false)}
                disabled={startingTrial}
                className="flex-1 py-3 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold text-slate-400 transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={executeTrialStart}
                disabled={startingTrial}
                className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
              >
                {startingTrial ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <>
                    <Sparkles size={16} /> 7 Günlük Denemeyi Başlat
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* CONFIRM PAY CONFIRMATION DIALOG MODAL */}
      {showConfirmModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-white/10 rounded-[32px] p-8 max-w-lg w-full space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px]" />
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20 shrink-0">
                <CreditCard size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">ABONELİK YAPILANDIRMASI</h3>
                <p className="text-slate-500 text-xs">Abonelik ödeme talimatı onayı</p>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3 text-sm">
              <div className="flex justify-between items-start">
                <span className="text-slate-400">Seçilen Paket:</span>
                <span className="text-white font-bold text-right">
                  {(() => {
                    const match = selectedPlan.name.match(/^(.*?)\s*(\(.*?\))$/);
                    return match ? (
                      <span className="flex flex-col items-end">
                        <span>{match[1]}</span>
                        <span className="text-xs text-slate-400 font-normal mt-0.5">{match[2]}</span>
                      </span>
                    ) : selectedPlan.name;
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ücret (4 Hafta):</span>
                <span className={selectedPlan.price === 0 ? "text-emerald-400 font-extrabold" : "text-yellow-400 font-extrabold"}>
                  {selectedPlan.price === 0 ? '₺0 (Ücretsiz)' : `₺${selectedPlan.price.toLocaleString('tr-TR')}`}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-3 text-xs">
                <span className="text-slate-500">Hesap Bakiyeniz:</span>
                <span className="text-slate-300">₺{(userData?.walletBalance || 0).toLocaleString('tr-TR')}</span>
              </div>
            </div>

            <div className="text-xs text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl leading-relaxed flex items-start gap-2">
              <Zap size={16} className="shrink-0 mt-0.5" />
              <span>
                {selectedPlan.price === 0 ? (
                  <><strong>Bilgi:</strong> Paket sepete eklenecektir. Sepette 0 ₺ olarak işleminizi onaylayabilirsiniz.</>
                ) : (
                  <><strong>Bilgi:</strong> Paket sepete eklenecektir. Sepette kupon kullanabilir ve ardından ödemenizi tamamlayabilirsiniz.</>
                )}
              </span>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold text-slate-400 transition-colors"
              >
                İptal Et
              </button>
              <button
                onClick={executeSubscription}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Onayla & Sepete Git <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
