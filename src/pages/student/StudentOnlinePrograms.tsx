import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlayCircle, CheckCircle2, Circle, Clock, Calendar, Lock, Star, GraduationCap, ChevronRight, ArrowLeft, Activity, ShoppingBag
} from 'lucide-react';
import { programService, Program, ProgramStep, ProgramEnrollment } from '../../services/programService';
import { useAuth } from '../../lib/AuthContext';
import { useCart } from '../../lib/CartContext';

export default function StudentOnlinePrograms() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [enrollments, setEnrollments] = useState<ProgramEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [progs, enrs] = await Promise.all([
      programService.getPrograms('student'),
      programService.getStudentEnrollments(user!.uid)
    ]);
    setPrograms(progs);
    setEnrollments(enrs);
    setLoading(false);
  };

  const handleAddToCart = (prog: Program) => {
    if (!prog.id) return;
    addToCart({
      itemId: prog.id,
      type: 'course',
      title: prog.title,
      price: prog.price || 0,
      image: prog.image,
      quantity: 1
    });
    setSuccessMessage(`"${prog.title}" sepete eklendi.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleEnroll = async (programId: string) => {
    if (!user) return;
    try {
      await programService.enrollStudent(user.uid, programId);
      loadData();
    } catch (e) {
      console.error(e);
      alert('Kayıt olurken hata oluştu.');
    }
  };

  if (loading && !selectedProgram) {
    return (
      <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Programlar Yükleniyor...</h2>
      </div>
    );
  }

  if (selectedProgram) {
    const enr = enrollments.find(e => e.programId === selectedProgram.id);
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
         <button onClick={() => setSelectedProgram(null)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Geri Dön
         </button>
         
         <div className="bg-slate-900/50 backdrop-blur-md rounded-[32px] border border-white/5 overflow-hidden">
            <div className="h-48 md:h-64 relative bg-slate-800">
               {selectedProgram.image ? (
                 <img src={selectedProgram.image} alt={selectedProgram.title} className="w-full h-full object-cover opacity-50" />
               ) : (
                 <div className="w-full h-full bg-gradient-to-tr from-indigo-900/50 to-purple-900/50" />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] to-transparent" />
               <div className="absolute bottom-6 left-6 md:left-10">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2 bg-indigo-500/10 w-fit px-3 py-1 rounded-lg border border-indigo-500/20">
                     {selectedProgram.completionType === 'flexible' ? 'Esnek Zamanlı' : 'Takvimli'}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-white">{selectedProgram.title}</h1>
               </div>
            </div>

            <div className="p-6 md:p-10">
               {enr ? (
                  <div className="mb-10 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                     <div className="flex-1 w-full">
                        <div className="flex justify-between items-end mb-2">
                          <p className="text-sm font-bold text-indigo-300">İlerleme Durumu</p>
                          <p className="text-2xl font-black text-white">{enr.progress}%</p>
                        </div>
                        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${enr.progress}%` }} />
                        </div>
                     </div>
                     {enr.completed && selectedProgram.rewardName && (
                        <div className="flex items-center gap-3 bg-amber-500/20 border border-amber-500/30 px-6 py-3 rounded-xl shrink-0">
                           <Star size={24} className="text-amber-500" />
                           <div>
                              <p className="text-[10px] uppercase font-black tracking-wider text-amber-500/70">Kazanılan Ödül</p>
                              <p className="text-amber-400 font-bold">{selectedProgram.rewardName}</p>
                           </div>
                        </div>
                     )}
                  </div>
               ) : (
                  <div className="mb-10 p-6 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                     <GraduationCap size={40} className="text-slate-600 mb-3" />
                     <h3 className="text-xl font-bold text-white mb-2">Programa Katıl</h3>
                     <p className="text-slate-400 mb-6 max-w-lg">Bu programı içeriğine erişmek ve kişisel gelişiminize hemen başlamak için kayıt olabilirsiniz.</p>
                     
                     <div className="flex items-center gap-4">
                        {selectedProgram.isPaid ? (
                           <button onClick={() => handleAddToCart(selectedProgram)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
                             Sepete Ekle ({selectedProgram.price} ₺) <ShoppingBag size={20} />
                           </button>
                        ) : (
                           <button onClick={() => handleEnroll(selectedProgram.id!)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
                             Ücretsiz Başla
                           </button>
                        )}
                     </div>
                  </div>
               )}

               <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white mb-4">Program Adımları</h3>
                  {Array.isArray(selectedProgram?.steps) && selectedProgram.steps.map((step, idx) => {
                     const completedStepsList = Array.isArray(enr?.completedSteps) ? enr.completedSteps : [];
                     const isCompleted = completedStepsList.includes(step.id);
                     let isLocked = false;
                     if (selectedProgram.orderType === 'fixed' && !enr) isLocked = true;
                     else if (selectedProgram.orderType === 'fixed' && enr) {
                        // find first uncompleted step index
                        const firstUncompletedIndex = selectedProgram.steps.findIndex(s => !completedStepsList.includes(s.id));
                        if (firstUncompletedIndex !== -1 && idx > firstUncompletedIndex) isLocked = true;
                     }

                     if (isLocked && selectedProgram.hideFutureSteps) return null;

                     return (
                       <ProgramStepItem 
                         key={step.id} 
                         step={step} 
                         index={idx}
                         isLocked={isLocked}
                         isCompleted={isCompleted || false}
                         enrollmentId={enr?.id}
                         isActive={!!enr && !isLocked}
                         totalSteps={(selectedProgram.steps || []).length}
                         currentCompleted={completedStepsList}
                         onComplete={() => loadData()}
                       />
                     );
                  })}
                  {(!Array.isArray(selectedProgram?.steps) || selectedProgram.steps.length === 0) && (
                     <p className="text-slate-500 italic">Bu programda henüz içerik bulunmamaktadır.</p>
                  )}
               </div>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg font-medium flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2">
              Kişisel Gelişim
           </div>
           <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
             Online Programlar
           </h1>
           <p className="text-slate-500 max-w-xl">
              Fiziksel ve zihinsel gelişiminizi destekleyecek interaktif eğitim süreçlerine katılın.
           </p>
        </div>
      </div>

      <div className="space-y-4">
        {programs.map((prog, idx) => {
          const enr = enrollments.find(e => e.programId === prog.id);
          return (
            <motion.div
              key={prog.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedProgram(prog)}
              className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row items-center gap-6 cursor-pointer group"
            >
               <div className="w-full sm:w-48 h-32 bg-black/40 rounded-xl border border-white/5 overflow-hidden shrink-0">
                  {prog.image ? (
                     <img src={prog.image} alt={prog.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                     <div className="w-full h-full bg-gradient-to-tr from-indigo-900/20 to-purple-900/20 flex flex-col justify-center items-center text-indigo-900/50 font-black text-4xl">ON</div>
                  )}
               </div>
               
               <div className="flex-1 w-full space-y-2">
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        {prog.completionType === 'flexible' ? 'Esnek Zamanlı' : 'Takvimli'}
                     </span>
                     {prog.isPaid && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                           Ücretli
                        </span>
                     )}
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{prog.title}</h3>
                  <p className="text-slate-400 text-sm line-clamp-2">{prog.description}</p>
               </div>

               <div className="w-full sm:w-auto shrink-0 flex flex-col items-end gap-2 border-t sm:border-t-0 sm:border-l border-white/5 pt-4 sm:pt-0 sm:pl-6">
                  {enr ? (
                     <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
                           <Activity size={16} /> <span className="text-sm">Kayıtlı</span>
                        </div>
                        <div className="w-32 h-1.5 bg-black/40 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${enr.progress}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 mt-1">% {enr.progress} Tamamlandı</span>
                     </div>
                  ) : (
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-lg">
                        <ChevronRight size={24} />
                      </div>
                  )}
               </div>
            </motion.div>
          );
        })}
        {programs.length === 0 && (
           <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
             <GraduationCap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
             <p className="text-slate-400 font-medium">Şu an aktif bir online program bulunmuyor.</p>
           </div>
        )}
      </div>
    </div>
  );
}

function ProgramStepItem({ step, index, isLocked, isCompleted, isActive, enrollmentId, totalSteps, currentCompleted, onComplete }: any) {
   const [open, setOpen] = useState(false);
   const [saving, setSaving] = useState(false);

   const handleComplete = async () => {
      if (!enrollmentId || saving) return;
      setSaving(true);
      try {
         await programService.completeStep(enrollmentId, step.id, totalSteps, currentCompleted);
         onComplete();
      } catch (e) {
         alert("Hata oluştu");
      }
      setSaving(false);
   };

   return (
      <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isLocked ? 'bg-black/20 border-white/5 opacity-50' : 'bg-slate-800/40 border-white/10'}`}>
         {/* Adım Başlığı */}
         <div 
            className={`p-4 flex items-center justify-between cursor-pointer ${!isLocked ? 'hover:bg-white/5' : ''}`}
            onClick={() => { if (!isLocked && isActive) setOpen(!open) }}
         >
            <div className="flex items-center gap-4">
               {isLocked ? (
                  <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-slate-600 border border-white/5">
                     <Lock size={16} />
                  </div>
               ) : isCompleted ? (
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                     <CheckCircle2 size={24} />
                  </div>
               ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                     <Circle size={16} />
                  </div>
               )}
               
               <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Adım {index + 1}</p>
                  <h4 className={`font-bold ${isLocked ? 'text-slate-500' : 'text-white'}`}>{step.title}</h4>
               </div>
            </div>
            {!isLocked && isActive && (
               <ChevronRight size={20} className={`text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`} />
            )}
         </div>

         {/* İçerik Gösterimi */}
         <AnimatePresence>
            {open && !isLocked && isActive && (
               <motion.div 
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: 'auto', opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="border-t border-white/5 bg-black/20 overflow-hidden"
               >
                  <div className="p-6">
                     <div className="bg-slate-900 border border-white/5 rounded-xl p-4 mb-6">
                        {step.type === 'photo_video' ? (
                           <div className="aspect-video bg-black rounded-lg flex items-center justify-center border border-white/10 relative group cursor-pointer">
                              <PlayCircle size={48} className="text-white/50 group-hover:text-white transition-colors" />
                              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur text-xs p-2 rounded text-slate-300">
                                 Simüle Video İçeriği: {step.content}
                              </div>
                           </div>
                        ) : step.type === 'text' ? (
                           <div className="prose prose-invert max-w-none text-slate-300">
                              <p className="whitespace-pre-wrap">{step.content}</p>
                           </div>
                        ) : step.type === 'quiz' ? (
                           <div className="space-y-4">
                              <h5 className="font-bold text-white mb-2">Değerlendirme Sorusu</h5>
                              <p className="text-slate-400 whitespace-pre-wrap">{step.content}</p>
                              <textarea className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500/50 min-h-[100px]" placeholder="Yanıtınızı buraya yazın..." />
                           </div>
                        ) : (
                           <p className="text-slate-400">{step.content}</p>
                        )}
                     </div>

                     {!isCompleted && (
                        <div className="flex justify-end">
                           <button 
                             onClick={handleComplete}
                             disabled={saving}
                             className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
                           >
                              {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={18} />}
                              Bu Adımı Tamamla
                           </button>
                        </div>
                     )}
                     {isCompleted && (
                        <div className="flex justify-end">
                           <div className="inline-flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                              <CheckCircle2 size={18} /> Adım Tamamlandı
                           </div>
                        </div>
                     )}
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
}
