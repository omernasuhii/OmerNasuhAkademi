import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { tourService } from '../../services/tourService';
import { Shield, Camera, Save, CreditCard, Percent, X } from 'lucide-react';
import { doc, updateDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { OnboardingTour, TourStep } from '../../components/OnboardingTour';

interface CoachStudent {
  id: string;
  name: string;
  surname: string;
  specialDiscounts?: {
    bronze?: number;
    silver?: number;
    gold?: number;
  };
}

export default function CoachProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [myStudents, setMyStudents] = useState<CoachStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [savingDiscount, setSavingDiscount] = useState<string | null>(null);

  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    if (tourService.shouldAutoStartTour('coach_profile', userData, location.state?.startTour)) {
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.state, userData]);

  const handleEndTour = () => {
    setIsTourOpen(false);
    tourService.markTourCompleted('coach_profile', user?.uid);
  };

  const tourSteps: TourStep[] = [
    {
      targetId: 'tour-coach-profile-header',
      title: 'Profil Ayarları & Yönetim',
      description: 'Koçluk bilgilerinizi, kişisel bilgilerinizi ve abonelik fiyatlandırma tercihlerinizi yönetebileceğiniz merkez paneldir.',
      position: 'bottom'
    },
    {
      targetId: 'tour-coach-profile-photo',
      title: 'Kişisel Profil & Unvan',
      description: 'Profil fotoğrafınızı güncelleyebilir, platform üzerindeki ad ve unvan bilgilerinizi kontrol edebilirsiniz.',
      position: 'right'
    },
    {
      targetId: 'tour-coach-profile-code',
      title: 'Koç Kodu & İndirimler',
      description: 'Öğrencilerinizin sisteme kaydolurken sizi seçmelerini sağlayan 5 haneli özel kodunuz. Ayrıca öğrencilerinize özel burs ve indirim tanımları yapabilirsiniz.',
      position: 'right'
    },
    {
      targetId: 'tour-coach-profile-pricing',
      title: 'Abonelik Paket Fiyatlandırmaları',
      description: 'Bronz, Gümüş ve Altın paketler için aylık satış ücretlerinizi belirleyin. Sistem kesintisi sonrası brüt net kazancınız anlık hesaplanır.',
      position: 'left'
    }
  ];

  const [systemDeductionRate, setSystemDeductionRate] = useState(20);
  const [minSystemDeductionBronze, setMinSystemDeductionBronze] = useState(1000);
  const [minSystemDeductionSilver, setMinSystemDeductionSilver] = useState(1500);
  const [minSystemDeductionGold, setMinSystemDeductionGold] = useState(2000);

  const [formData, setFormData] = useState({
    coachCode: userData?.coachCode || '',
    bronzePrice: userData?.bronzePrice !== undefined && userData?.bronzePrice !== null ? userData.bronzePrice : 3000,
    silverPrice: userData?.silverPrice !== undefined && userData?.silverPrice !== null ? userData.silverPrice : 4500,
    goldPrice: userData?.goldPrice !== undefined && userData?.goldPrice !== null ? userData.goldPrice : 6000
  });

  useEffect(() => {
    if (userData) {
      setFormData(prev => ({
        ...prev,
        coachCode: userData.coachCode || prev.coachCode || '',
        bronzePrice: userData.bronzePrice !== undefined && userData.bronzePrice !== null ? userData.bronzePrice : prev.bronzePrice,
        silverPrice: userData.silverPrice !== undefined && userData.silverPrice !== null ? userData.silverPrice : prev.silverPrice,
        goldPrice: userData.goldPrice !== undefined && userData.goldPrice !== null ? userData.goldPrice : prev.goldPrice
      }));
    }
  }, [userData]);

  useEffect(() => {
    async function fetchRate() {
       try {
         const snap = await getDoc(doc(db, 'settings', 'financial'));
         let rate = 20, minB = 1000, minS = 1500, minG = 2000;
         if (snap.exists()) {
            const data = snap.data();
            if (data.systemDeductionRate !== undefined) rate = data.systemDeductionRate;
            if (data.minSystemDeductionBronze !== undefined) minB = data.minSystemDeductionBronze;
            if (data.minSystemDeductionSilver !== undefined) minS = data.minSystemDeductionSilver;
            if (data.minSystemDeductionGold !== undefined) minG = data.minSystemDeductionGold;
         }
         if (userData?.specialDeductionRate !== undefined) rate = userData.specialDeductionRate;
         if (userData?.specialMinDeductionBronze !== undefined) minB = userData.specialMinDeductionBronze;
         if (userData?.specialMinDeductionSilver !== undefined) minS = userData.specialMinDeductionSilver;
         if (userData?.specialMinDeductionGold !== undefined) minG = userData.specialMinDeductionGold;

         setSystemDeductionRate(rate);
         setMinSystemDeductionBronze(minB);
         setMinSystemDeductionSilver(minS);
         setMinSystemDeductionGold(minG);
       } catch (err) {
         console.error("Error fetching settings", err);
       }
    }
    fetchRate();
  }, [userData]);

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

      const bPrice = formData.bronzePrice !== undefined && formData.bronzePrice !== null && !isNaN(Number(formData.bronzePrice))
        ? Math.max(0, Number(formData.bronzePrice))
        : 3000;
      const sPrice = formData.silverPrice !== undefined && formData.silverPrice !== null && !isNaN(Number(formData.silverPrice))
        ? Math.max(0, Number(formData.silverPrice))
        : 4500;
      const gPrice = formData.goldPrice !== undefined && formData.goldPrice !== null && !isNaN(Number(formData.goldPrice))
        ? Math.max(0, Number(formData.goldPrice))
        : 6000;

      await updateDoc(doc(db, 'users', user.uid), {
        coachCode: cleanCoachCode,
        bronzePrice: bPrice,
        silverPrice: sPrice,
        goldPrice: gPrice
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

  const handleOpenDiscountModal = async () => {
    setShowDiscountModal(true);
    if (myStudents.length === 0 && user) {
      setStudentsLoading(true);
      try {
        const q = query(collection(db, 'users'), where('coachId', '==', user.uid));
        const snap = await getDocs(q);
        const students: CoachStudent[] = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data.displayName || data.firstName || data.name || '',
            surname: data.lastName || data.surname || '',
            specialDiscounts: data.specialDiscounts || {}
          };
        });
        setMyStudents(students);
      } catch (err) {
        console.error("Error fetching students:", err);
      } finally {
        setStudentsLoading(false);
      }
    }
  };

  const handleSaveDiscount = async (studentId: string, discounts: any) => {
    setSavingDiscount(studentId);
    try {
      const sanitizedDiscounts: Record<string, number> = {};
      if (discounts && typeof discounts === 'object') {
        Object.keys(discounts).forEach(key => {
          const val = discounts[key];
          if (typeof val === 'number' && val > 0 && !isNaN(val)) {
            sanitizedDiscounts[key] = val;
          }
        });
      }
      await updateDoc(doc(db, 'users', studentId), {
        specialDiscounts: sanitizedDiscounts
      });
      setMyStudents(prev => prev.map(s => s.id === studentId ? { ...s, specialDiscounts: sanitizedDiscounts } : s));
    } catch (err) {
      console.error(err);
      alert('İndirim kaydedilirken bir hata oluştu.');
    } finally {
      setSavingDiscount(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <OnboardingTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={handleEndTour}
        onComplete={handleEndTour}
        onNextTour={() => {
          setIsTourOpen(false);
          tourService.markTourCompleted('coach_profile', user?.uid);
          navigate('/panel/koc/cuzdan', { state: { startTour: true, isDemo: true } });
        }}
        nextTourLabel="Cüzdan & Kazanç Turu"
        tourKey="coach_profile"
      />

      <div id="tour-coach-profile-header" className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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
            <div id="tour-coach-profile-photo" className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 text-center flex flex-col items-center">
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
            <div id="tour-coach-profile-code" className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-3">
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
               
               <button onClick={handleOpenDiscountModal} className="w-full mt-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                 <Percent size={16} />
                 Öğrenci Özel İndirimleri
               </button>
            </div>
         </div>

         {/* Settings Forms */}
         <div className="lg:col-span-2 space-y-6">
            <div id="tour-coach-profile-pricing" className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
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
                  {(() => {
                    const bVal = formData.bronzePrice === '' ? 0 : Number(formData.bronzePrice);
                    const bCut = Math.max(Math.floor(bVal * (systemDeductionRate / 100)), minSystemDeductionBronze);
                    const bNet = bVal - bCut;
                    return (
                      <div className="bg-white/5 border border-orange-500/30 rounded-3xl p-6 flex flex-col relative overflow-hidden group hover:border-orange-500/50 transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 blur-xl group-hover:opacity-20 transition-opacity">
                          <CreditCard size={100} className="text-orange-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                           <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                              <CreditCard size={20} />
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-orange-400 font-bold leading-tight">Bronz Paket</h4>
                                {bVal === 0 && (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Ücretsiz</span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Aylık Abonelik</span>
                           </div>
                        </div>
                        
                        <div className="space-y-4 relative z-10 mt-auto">
                           <div className="flex flex-col gap-1.5">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Satış Fiyatı (₺)</label>
                                <span className="text-[9px] text-slate-500">0 ₺ = Ücretsiz</span>
                              </div>
                              <div className="relative">
                                 <input 
                                    type="number" 
                                    min="0"
                                    value={formData.bronzePrice}
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                                      setFormData({...formData, bronzePrice: val as any});
                                    }}
                                    className="w-full bg-slate-950 border border-white/5 rounded-2xl py-3.5 px-4 text-white font-black text-lg outline-none focus:border-orange-500/50 transition-all font-mono pl-10" 
                                 />
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold">₺</span>
                              </div>
                           </div>
                           
                           <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 space-y-3">
                              <div className="flex justify-between items-center text-xs">
                                 <span className="text-slate-500 font-medium tracking-wide">Sistem Kesintisi</span>
                                 <span className="text-red-400/80 font-mono font-bold">-{bCut} ₺</span>
                              </div>
                              <div className="h-px w-full bg-white/5" />
                              <div className="flex justify-between items-center">
                                 <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">Net Kazanç</span>
                                 <span className={`${bNet < 0 ? 'text-red-400' : 'text-emerald-400'} font-mono font-black text-base`}>{bNet} ₺</span>
                              </div>
                              {bVal === 0 && (
                                <div className="text-[10px] text-amber-400/90 font-medium pt-1 border-t border-white/5">
                                  * 0 ₺ satışta asgari sistem kesintisi ({bCut} ₺) koç cüzdanınızdan tahsil edilir.
                                </div>
                              )}
                           </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Silver */}
                  {(() => {
                    const sVal = formData.silverPrice === '' ? 0 : Number(formData.silverPrice);
                    const sCut = Math.max(Math.floor(sVal * (systemDeductionRate / 100)), minSystemDeductionSilver);
                    const sNet = sVal - sCut;
                    return (
                      <div className="bg-white/5 border border-blue-500/30 rounded-3xl p-6 flex flex-col relative overflow-hidden group hover:border-blue-500/50 transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 blur-xl group-hover:opacity-20 transition-opacity">
                          <CreditCard size={100} className="text-blue-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                           <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                              <CreditCard size={20} />
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-blue-400 font-bold leading-tight">Gümüş Paket</h4>
                                {sVal === 0 && (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Ücretsiz</span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Aylık Abonelik</span>
                           </div>
                        </div>
                        
                        <div className="space-y-4 relative z-10 mt-auto">
                           <div className="flex flex-col gap-1.5">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Satış Fiyatı (₺)</label>
                                <span className="text-[9px] text-slate-500">0 ₺ = Ücretsiz</span>
                              </div>
                              <div className="relative">
                                 <input 
                                    type="number" 
                                    min="0"
                                    value={formData.silverPrice}
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                                      setFormData({...formData, silverPrice: val as any});
                                    }}
                                    className="w-full bg-slate-950 border border-white/5 rounded-2xl py-3.5 px-4 text-white font-black text-lg outline-none focus:border-blue-500/50 transition-all font-mono pl-10" 
                                 />
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold">₺</span>
                              </div>
                           </div>
                           
                           <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 space-y-3">
                              <div className="flex justify-between items-center text-xs">
                                 <span className="text-slate-500 font-medium tracking-wide">Sistem Kesintisi</span>
                                 <span className="text-red-400/80 font-mono font-bold">-{sCut} ₺</span>
                              </div>
                              <div className="h-px w-full bg-white/5" />
                              <div className="flex justify-between items-center">
                                 <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">Net Kazanç</span>
                                 <span className={`${sNet < 0 ? 'text-red-400' : 'text-emerald-400'} font-mono font-black text-base`}>{sNet} ₺</span>
                              </div>
                              {sVal === 0 && (
                                <div className="text-[10px] text-amber-400/90 font-medium pt-1 border-t border-white/5">
                                  * 0 ₺ satışta asgari sistem kesintisi ({sCut} ₺) koç cüzdanınızdan tahsil edilir.
                                </div>
                              )}
                           </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Gold */}
                  {(() => {
                    const gVal = formData.goldPrice === '' ? 0 : Number(formData.goldPrice);
                    const gCut = Math.max(Math.floor(gVal * (systemDeductionRate / 100)), minSystemDeductionGold);
                    const gNet = gVal - gCut;
                    return (
                      <div className="bg-white/5 border border-yellow-500/30 rounded-3xl p-6 flex flex-col relative overflow-hidden group hover:border-yellow-500/50 transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 blur-xl group-hover:opacity-20 transition-opacity">
                          <CreditCard size={100} className="text-yellow-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-6 relative z-10">
                           <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                              <CreditCard size={20} />
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-yellow-400 font-bold leading-tight">Altın Paket</h4>
                                {gVal === 0 && (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Ücretsiz</span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Aylık Abonelik</span>
                           </div>
                        </div>
                        
                        <div className="space-y-4 relative z-10 mt-auto">
                           <div className="flex flex-col gap-1.5">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Satış Fiyatı (₺)</label>
                                <span className="text-[9px] text-slate-500">0 ₺ = Ücretsiz</span>
                              </div>
                              <div className="relative">
                                 <input 
                                    type="number" 
                                    min="0"
                                    value={formData.goldPrice}
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                                      setFormData({...formData, goldPrice: val as any});
                                    }}
                                    className="w-full bg-slate-950 border border-white/5 rounded-2xl py-3.5 px-4 text-white font-black text-lg outline-none focus:border-yellow-500/50 transition-all font-mono pl-10" 
                                 />
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold">₺</span>
                              </div>
                           </div>
                           
                           <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 space-y-3">
                              <div className="flex justify-between items-center text-xs">
                                 <span className="text-slate-500 font-medium tracking-wide">Sistem Kesintisi</span>
                                 <span className="text-red-400/80 font-mono font-bold">-{gCut} ₺</span>
                              </div>
                              <div className="h-px w-full bg-white/5" />
                              <div className="flex justify-between items-center">
                                 <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">Net Kazanç</span>
                                 <span className={`${gNet < 0 ? 'text-red-400' : 'text-emerald-400'} font-mono font-black text-base`}>{gNet} ₺</span>
                              </div>
                              {gVal === 0 && (
                                <div className="text-[10px] text-amber-400/90 font-medium pt-1 border-t border-white/5">
                                  * 0 ₺ satışta asgari sistem kesintisi ({gCut} ₺) koç cüzdanınızdan tahsil edilir.
                                </div>
                              )}
                           </div>
                        </div>
                      </div>
                    );
                  })()}
               </div>
            </div>
         </div>
      </div>

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-6 relative flex flex-col max-h-[85vh]">
            <button 
              onClick={() => setShowDiscountModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
            
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Percent size={20} className="text-indigo-400" /> Özel İndirimler
            </h2>
            <p className="text-sm text-slate-400 mb-6">Öğrencilerinize özel paket bazlı (Bronz, Gümüş, Altın) % indirim tanımlayabilirsiniz. Belirlediğiniz indirim sistem kesintisini etkilemez, direkt sizin net kazancınızdan düşülür.</p>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {studentsLoading ? (
                <div className="text-center py-8 text-slate-400">Yükleniyor...</div>
              ) : myStudents.length === 0 ? (
                <div className="text-center py-8 text-slate-400">Henüz öğrenciniz bulunmuyor.</div>
              ) : (
                myStudents.map(student => (
                  <div key={student.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="font-bold text-white mb-4">{student.name} {student.surname}</div>
                    <div className="grid grid-cols-3 gap-3">
                      {['bronze', 'silver', 'gold'].map((pkg) => {
                        const val = student.specialDiscounts?.[pkg as keyof typeof student.specialDiscounts] || '';
                        return (
                          <div key={pkg} className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                              {pkg === 'bronze' ? 'Bronz' : pkg === 'silver' ? 'Gümüş' : 'Altın'} İndirimi (%)
                            </label>
                            <input 
                              type="number"
                              min="0"
                              max="100"
                              value={val}
                              onChange={(e) => {
                                const newVal = parseInt(e.target.value) || 0;
                                const newDiscounts = { ...(student.specialDiscounts || {}) };
                                if (newVal > 0) {
                                  newDiscounts[pkg as keyof typeof newDiscounts] = newVal;
                                } else {
                                  delete newDiscounts[pkg as keyof typeof newDiscounts];
                                }
                                setMyStudents(prev => prev.map(s => s.id === student.id ? { ...s, specialDiscounts: newDiscounts } : s));
                              }}
                              className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                              placeholder="% 0"
                            />
                          </div>
                        );
                      })}
                    </div>
                    <button 
                      onClick={() => handleSaveDiscount(student.id, student.specialDiscounts || {})}
                      disabled={savingDiscount === student.id}
                      className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-sm transition-all"
                    >
                      {savingDiscount === student.id ? 'Kaydediliyor...' : 'İndirimi Kaydet'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
