import React, { useState, useEffect } from 'react';
import { useStudent } from '../../lib/StudentContext';
import { BrainCircuit, Star, Zap, User, Target, Sparkles, Save, Loader2, GraduationCap, Info, AlertCircle } from 'lucide-react';
import { studentDataService } from '../../services/studentDataService';
import { calculateSubjectMultipliers, TASK_WEIGHTS } from '../../lib/programCalculations';
import { serverTimestamp } from 'firebase/firestore';

export default function StudentProfile() {
  const { selectedStudent, setSelectedStudent } = useStudent();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [multipliers, setMultipliers] = useState<Record<string, number>>({});
  const [academicInfo, setAcademicInfo] = useState({
    grade: '',
    branch: '',
    targetDepartment: '',
    targetTyt: '',
    targetAyt: '',
    subscriptionPlan: ''
  });

  useEffect(() => {
    if (selectedStudent) {
      setAcademicInfo({
        grade: selectedStudent.grade || '',
        branch: selectedStudent.branch || '',
        targetDepartment: selectedStudent.targetDepartment || '',
        targetTyt: selectedStudent.targetTyt?.toString() || '',
        targetAyt: selectedStudent.targetAyt?.toString() || '',
        subscriptionPlan: selectedStudent.subscriptionPlan || ''
      });
      studentDataService.getExamResults(selectedStudent.uid).then(exams => {
        setMultipliers(calculateSubjectMultipliers(exams, selectedStudent.branch));
      });
    }
  }, [selectedStudent]);

  const canUpdateSubscription = () => {
    if (!selectedStudent?.lastSubscriptionUpdate) return true;
    
    // Firestore timestamp or Date
    const lastUpdate = selectedStudent.lastSubscriptionUpdate.seconds 
      ? new Date(selectedStudent.lastSubscriptionUpdate.seconds * 1000)
      : new Date(selectedStudent.lastSubscriptionUpdate);
    
    if (isNaN(lastUpdate.getTime())) return true;

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastUpdate.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    return diffDays >= 30;
  };

  const daysUntilNextUpdate = () => {
    if (!selectedStudent?.lastSubscriptionUpdate) return 0;
    const lastUpdate = selectedStudent.lastSubscriptionUpdate.seconds 
      ? new Date(selectedStudent.lastSubscriptionUpdate.seconds * 1000)
      : new Date(selectedStudent.lastSubscriptionUpdate);
    
    const nextPossibleDate = new Date(lastUpdate.getTime() + (30 * 24 * 60 * 60 * 1000));
    const now = new Date();
    const diffTime = nextPossibleDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setLoading(true);
    setError(null);

    const currentPlan = selectedStudent.subscriptionPlan || '';
    const newPlan = academicInfo.subscriptionPlan || '';
    const subscriptionChanged = newPlan !== currentPlan;
    
    if (subscriptionChanged && !canUpdateSubscription()) {
      setError(`Abonelik planı ayda sadece 1 kez değiştirilebilir. Tekrar değiştirmek için ${daysUntilNextUpdate()} gün beklemeniz gerekiyor.`);
      setLoading(false);
      return;
    }

    try {
      const updatedData: any = {
        ...academicInfo,
        targetTyt: parseInt(academicInfo.targetTyt) || 0,
        targetAyt: parseInt(academicInfo.targetAyt) || 0,
      };

      if (subscriptionChanged) {
        updatedData.lastSubscriptionUpdate = serverTimestamp();
      }
      
      const res = await studentDataService.updateStudentProfile(selectedStudent.uid, updatedData);
      
      if (res) {
        setSelectedStudent({
          ...selectedStudent,
          ...updatedData,
          // Optimistically update timestamp on client to match local time for display until reload
          lastSubscriptionUpdate: subscriptionChanged ? new Date() : selectedStudent.lastSubscriptionUpdate
        });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
      setError('Bir hata oluştu, lütfen tekrar deneyin.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">
             ÖĞRENCİ PROFİLİ
          </h1>
          <p className="text-slate-500 mt-1">{selectedStudent?.displayName} akademik ve gelişim profili.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info Card */}
        <div className="space-y-6">
           <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[80px]" />
              <div className="flex flex-col items-center text-center">
                 <div className="w-24 h-24 rounded-[32px] bg-slate-800 border-2 border-white/10 p-1 mb-6 relative group-hover:scale-105 transition-transform">
                    {selectedStudent?.photoURL ? (
                       <img src={selectedStudent.photoURL} alt="" className="w-full h-full object-cover rounded-[28px]" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-500">
                          {selectedStudent?.displayName?.charAt(0)}
                       </div>
                    )}
                 </div>
                 <h2 className="text-2xl font-black text-white uppercase">{selectedStudent?.displayName}</h2>
                 <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
                    {academicInfo.branch || 'Alan Belirtilmedi'} • {academicInfo.grade || 'Sınıf Belirtilmedi'}
                 </p>
                 
                 <div className="w-full h-px bg-white/5 my-8" />
                 
                 <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="bg-white/5 rounded-2xl p-4 text-left border border-white/5">
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Hedef TYT</p>
                       <p className="text-sm font-bold text-white">{academicInfo.targetTyt || '-'}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 text-left border border-white/5">
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Hedef AYT</p>
                       <p className="text-sm font-bold text-white">{academicInfo.targetAyt || '-'}</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
              <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                 <Target className="text-emerald-500" size={16} /> Hedef Bölüm & Paket
              </h3>
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl mb-4">
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Hedef Bölüm/Meslek</p>
                 <p className="text-lg font-black text-white italic uppercase leading-tight">{academicInfo.targetDepartment || 'Henüz Belirlenmedi'}</p>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Mevcut Abonelik</p>
                 <p className="text-lg font-black text-white italic uppercase leading-tight">{academicInfo.subscriptionPlan || 'Abonelik Yok'}</p>
              </div>
           </div>
        </div>

        {/* Edit & Analysis */}
        <div className="lg:col-span-2 space-y-8">
           <form onSubmit={handleUpdate} className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-bold flex items-center gap-3">
                    <GraduationCap className="text-blue-500" /> Akademik Bilgileri Düzenle
                 </h3>
                 <button 
                   type="submit"
                   disabled={loading}
                   className="bg-white hover:bg-slate-200 text-[#070b14] px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                 >
                   {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                   {loading ? 'Kaydediliyor...' : 'Kaydet'}
                 </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Sınıf Seviyesi</label>
                    <select 
                      value={academicInfo.grade}
                      onChange={(e) => setAcademicInfo({...academicInfo, grade: e.target.value})}
                      className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                    >
                      <option value="">Seçiniz...</option>
                      {['9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf', 'Mezun'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                 </div>

                 <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Alan</label>
                    <select 
                      value={academicInfo.branch}
                      onChange={(e) => setAcademicInfo({...academicInfo, branch: e.target.value})}
                      className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                    >
                      <option value="">Seçiniz...</option>
                      {['SAYISAL', 'EŞİT AĞIRLIK', 'SÖZEL', 'DİL'].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                 </div>

                 <div className="space-y-2 md:col-span-2 text-left">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Hedef Bölüm/Meslek</label>
                    <input 
                      type="text"
                      value={academicInfo.targetDepartment}
                      onChange={(e) => setAcademicInfo({...academicInfo, targetDepartment: e.target.value})}
                      placeholder="Örn: Bilgisayar Mühendisliği"
                      className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                    />
                 </div>

                 <div className="space-y-2 md:col-span-2 text-left">
                    <div className="flex items-center justify-between mb-1 pr-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mevcut Abonelik Paketi</label>
                      {!canUpdateSubscription() && (
                        <span className="text-[9px] font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                          <AlertCircle size={10} /> Değişiklik için {daysUntilNextUpdate()} gün kaldı
                        </span>
                      )}
                    </div>
                    <select 
                      value={academicInfo.subscriptionPlan}
                      onChange={(e) => setAcademicInfo({...academicInfo, subscriptionPlan: e.target.value})}
                      disabled={!canUpdateSubscription()}
                      className={`w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all ${
                        !canUpdateSubscription() ? 'opacity-50 cursor-not-allowed grayscale' : 'focus:border-blue-500/50'
                      }`}
                    >
                      <option value="">Abonelik Seçilmedi</option>
                      <option value="Aylık Bronz Paket">Aylık Bronz Paket (3.000 ₺)</option>
                      <option value="Aylık Gümüş Paket">Aylık Gümüş Paket (4.500 ₺)</option>
                      <option value="Aylık Altın Paket">Aylık Altın Paket (6.000 ₺)</option>
                      <option value="Özel Anlaşma">Özel Anlaşma</option>
                    </select>
                    {!canUpdateSubscription() && (
                      <p className="text-[10px] text-slate-500 italic mt-1 pl-1">Abonelik paketi ayda sadece 1 kez güncellenebilir.</p>
                    )}
                 </div>

                 <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Hedef TYT Neti</label>
                    <input 
                      type="number"
                      value={academicInfo.targetTyt}
                      onChange={(e) => setAcademicInfo({...academicInfo, targetTyt: e.target.value})}
                      placeholder="100"
                      className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                    />
                 </div>

                 <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Hedef AYT Neti</label>
                    <input 
                      type="number"
                      value={academicInfo.targetAyt}
                      onChange={(e) => setAcademicInfo({...academicInfo, targetAyt: e.target.value})}
                      placeholder="70"
                      className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                    />
                 </div>
              </div>
              {success && <p className="text-emerald-400 text-[10px] font-bold mt-4 animate-in fade-in">Değişiklikler kaydedildi.</p>}
              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs font-bold animate-in shake duration-500">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
           </form>

           <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 mb-8">
               <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                  <Info className="text-blue-500" /> Program Tamamlama Kuralları ve Çarpanlar
               </h3>
               <div className="space-y-6">
                 <p className="text-sm text-slate-300 leading-relaxed text-left">
                   Günlük programların tamamlama yüzdesi, öğrencinin sınav performansı ve görev tipine göre hesaplanır. Soru Çözümü görevleri <b className="text-white">{TASK_WEIGHTS['Soru Çözümü']} puan</b>, Konu Çalışması ve YouTube Video görevleri <b className="text-white">{TASK_WEIGHTS['Konu Çalışması']} puan</b> değerindedir. Deneme analizlerinde <b className="text-white">sadece son 4 denemenin</b> net ortalaması dikkate alınır (böylece öğrencinin gelişimi katsayılara yansır). Net ortalaması düşük olan derslerin katsayıları 1.00 ile 2.50 arasında artış gösterir, böylece zayıf dersler program yüzdesini daha çok etkiler.
                 </p>
                 
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(multipliers).map(([subject, m]) => {
                       const multiplier = Number(m);
                       if (multiplier <= 1.0) return null;
                       return (
                         <div key={subject} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-1 items-center justify-center text-center">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{subject}</span>
                           <span className={`text-2xl font-black ${multiplier > 1.5 ? 'text-red-400' : 'text-orange-400'}`}>x{multiplier.toFixed(2)}</span>
                         </div>
                       );
                    })}
                 </div>

                 {Object.keys(multipliers).every(k => multipliers[k] === 1.0) && (
                   <div className="p-4 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-xl text-xs font-bold leading-relaxed flex items-start gap-3">
                      <Info size={16} className="mt-0.5 flex-shrink-0" />
                      <p className="text-left">Öğrencinin henüz değerlendirilmiş bir denemesi bulunmuyor veya alanına uyan derslerde tam net gösterdi. Bu nedenle tüm ders çarpanları <strong className="text-white">1.00</strong> olarak kabul ediliyor.</p>
                   </div>
                 )}
               </div>
            </div>

           <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                 <BrainCircuit className="text-purple-500" /> Gelişim Notları
              </h3>
              <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                 <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Sparkles size={12} /> Koç Tavsiyesi
                 </p>
                 <p className="text-sm text-slate-300 italic leading-relaxed text-left">
                    Öğrencinin akademik hedefleri periyodik olarak güncellenmeli ve deneme sonuçlarına göre revize edilmelidir.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
