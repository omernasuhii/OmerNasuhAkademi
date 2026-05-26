import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Timer, ChevronRight, Brain, BookOpen, Clock, ArrowLeft, Loader2, Sparkles, CheckCircle2, ShieldCheck, Target, Search, Scale, AlertTriangle, Monitor, RotateCcw, PenTool, Eye, LineChart, Trophy, HeartPulse, GraduationCap, Zap, Activity } from 'lucide-react';
import { analysisService } from '../../../services/analysisService';
import { useAuth } from '../../../lib/AuthContext';

const AUDIT_ITEMS = [
  { id: 1, text: "Artık konu çalışmayı minimuma indirip, tamamen deneme çözmeye başladım mı?", category: 'AKADEMIK' },
  { id: 2, text: "Deneme sınavlarını, gerçek sınav saatinde ve masadan hiç kalkmadan çözüyor muyum?", category: 'AKADEMIK' },
  { id: 3, text: "\"Yapamadığım ama öğrenebileceğim\" konularla, \"Asla yapamadığım\" konuları birbirinden ayırdım mı?", category: 'AKADEMIK' },
  { id: 4, text: "Geçmiş denemelerde yaptığım hataları içeren bir \"Hata Defterim\" var mı?", category: 'AKADEMIK' },
  { id: 5, text: "Çıkmış soruları (Son 5-10 yıl) deneme ciddiyetinde çözdüm mü?", category: 'AKADEMIK' },
  { id: 6, text: "Sabahları alarm çalmadan veya zorlanmadan sınav saatinde uyanabiliyor muyum?", category: 'BIYOLOJIK' },
  { id: 7, text: "Gece yatış saatim sabit mi?", category: 'BIYOLOJIK' },
  { id: 8, text: "Sınav günü yiyeceğim kahvaltıyı prova ettim mi?", category: 'BIYOLOJIK' },
  { id: 9, text: "Kafein, şeker ve ekran kullanımını azalttım mı?", category: 'BIYOLOJIK' },
  { id: 10, text: "\"Ya kazanamazsam?\" düşüncesi geldiğinde onu durdurabiliyor muyum?", category: 'PSIKOLOJIK' },
  { id: 11, text: "Çevremdeki \"Felaket Tellallarından\" uzak duruyor muyum?", category: 'PSIKOLOJIK' },
  { id: 12, text: "Sınav anını zihnimde canlandırdığımda sakin kalabiliyor muyum?", category: 'PSIKOLOJIK' }
];

export default function Szp30Analiz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'audit' | 'loading'>('intro');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);

  const handleChoice = (value: boolean) => {
    setAnswers(prev => ({ ...prev, [AUDIT_ITEMS[currentIdx].id]: value }));
    if (currentIdx < AUDIT_ITEMS.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setStep('loading');
    setLoading(true);

    try {
      const result = await analysisService.saveResult(user.uid, 'SZP-30', {
        answers,
        totalYes: Object.values(answers).filter(v => v).length
      });

      if (result?.id) {
        navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`);
      }
    } catch (error: any) {
      alert("Hata: " + error.message);
      setStep('audit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 text-center space-y-8"
          >
            <div className="w-20 h-20 bg-red-600/20 rounded-3xl flex items-center justify-center text-red-500 mx-auto shadow-xl border border-red-600/20">
              <Timer size={40} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white tracking-tight">SZP-30: Son Viraj - Zirve Performans ve Kriz Yönetimi</h1>
              <p className="text-xl text-slate-400 font-medium">Sınava 30 gün kala uyku, beslenme ve çalışma rutinini sınav anına senkronize et.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-red-500 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Zap size={14} /> Amaç
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">"Yetişmeyecek" paniğini, "Elimdekiyle en iyisini yapacağım" stratejisine dönüştürmek.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-blue-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                   <Activity size={14} /> Kurumsal Dayanak
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Periyodizasyon (Antrenman Bilimi) ve Sirkadiyen Ritim prensipleri.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-amber-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={14} /> Yöntem
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Sıkıyönetim (Kamp) kuralları ve biyolojik saat provaları.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('audit')}
              className="group relative px-12 py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-lg transition-all duration-300 shadow-2xl shadow-red-600/20 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Denetimi Başlat <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        )}

        {step === 'audit' && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
             <div className="flex items-center justify-between px-2">
               <button onClick={() => setStep('intro')} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-colors"><ArrowLeft size={20} /></button>
               <span className="text-xs font-black text-red-500 uppercase tracking-widest">Madde {currentIdx + 1} / {AUDIT_ITEMS.length}</span>
             </div>

             <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 space-y-12">
                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-red-500">
                      <Clock size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest italic">{AUDIT_ITEMS[currentIdx].category}</span>
                   </div>
                   <h2 className="text-2xl sm:text-3xl font-bold text-white italic leading-tight underline decoration-red-500/30 decoration-4 underline-offset-8">
                      {AUDIT_ITEMS[currentIdx].text}
                   </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleChoice(true)}
                      className="group flex flex-col items-center justify-center gap-4 p-8 bg-emerald-500/5 hover:bg-emerald-500 border border-emerald-500/10 hover:border-emerald-500 rounded-3xl transition-all duration-500 shadow-xl shadow-emerald-500/0 hover:shadow-emerald-500/20"
                    >
                      <CheckCircle2 size={32} className="text-emerald-500 group-hover:text-white transition-colors" />
                      <span className="text-lg font-black text-emerald-500 group-hover:text-white transition-colors uppercase tracking-widest">Evet</span>
                    </button>
                    <button
                      onClick={() => handleChoice(false)}
                      className="group flex flex-col items-center justify-center gap-4 p-8 bg-rose-500/5 hover:bg-rose-500 border border-rose-500/10 hover:border-rose-500 rounded-3xl transition-all duration-500 shadow-xl shadow-rose-500/0 hover:shadow-rose-500/20"
                    >
                      <AlertTriangle size={32} className="text-rose-500 group-hover:text-white transition-colors" />
                      <span className="text-lg font-black text-rose-500 group-hover:text-white transition-colors uppercase tracking-widest">Hayır</span>
                    </button>
                </div>
             </div>
          </motion.div>
        )}

        {step === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 space-y-8"
          >
            <div className="relative">
              <Loader2 size={64} className="text-red-500 animate-spin" />
              <div className="absolute inset-0 blur-2xl bg-red-500/20 animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">Son Viraj Stratejin Hazırlanıyor...</h3>
              <p className="text-slate-400 font-medium">Acil eylem planın ve kamp kuralların AI tarafından sentezleniyor.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
