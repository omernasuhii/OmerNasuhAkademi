import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ChevronRight, Brain, BookOpen, Clock, ArrowLeft, Loader2, Sparkles, CheckCircle2, ShieldCheck, Target, Search, Scale, AlertTriangle, Monitor, RotateCcw, PenTool, Eye, LineChart, HeartPulse, GraduationCap, Zap, Activity, ShieldAlert, Flag, Star, Map, Compass } from 'lucide-react';
import { analysisService } from '../../../services/analysisService';
import { useAuth } from '../../../lib/AuthContext';

const QUESTIONS = [
  { id: 1, text: "Gelecekte ne iş yapacağımdan çok, nasıl bir hayat yaşayacağım daha önemli.", type: 'DEGER' },
  { id: 2, text: "Bir ofis içinde sabit bir masada çalışmak bana göre değil.", type: 'KISI' },
  { id: 3, text: "Karmaşık problemleri çözmekten zevk alırım.", type: 'YETI' },
  { id: 4, text: "İnsanlara yardım etmek veya onlara bir şeyler öğretmek beni mutlu eder.", type: 'DEGER' },
  { id: 5, text: "Yaratıcı projeler üretmek, her gün rutini takip etmekten daha iyidir.", type: 'YETI' },
  { id: 6, text: "Kendi işimi kurmak, bir başkasının yanında çalışmaktan daha cazip geliyor.", type: 'KISI' }
];

export default function KlsAnaliz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'discovery' | 'loading'>('intro');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  const handleChoice = (value: number) => {
    setAnswers(prev => ({ ...prev, [QUESTIONS[currentIdx].id]: value }));
    if (currentIdx < QUESTIONS.length - 1) {
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
      const result = await analysisService.saveResult(user.uid, 'KLS', {
        answers
      });

      if (result?.id) {
        navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`);
      }
    } catch (error: any) {
      alert("Hata: " + error.message);
      setStep('discovery');
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
            <div className="w-20 h-20 bg-indigo-500/20 rounded-3xl flex items-center justify-center text-indigo-400 mx-auto shadow-xl border border-indigo-500/20">
              <Briefcase size={40} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white tracking-tight">KLS: Kariyer Laboratuvarı ve Seçim Matrisi</h1>
              <p className="text-xl text-slate-400 font-medium">Sadece Bir "Meslek" Değil, Bir "Yol" Seç.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-indigo-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Map size={14} /> Amaç
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Puanına göre değil, kişilik tipine ve yeteneklerine göre kariyer haritası çıkarmak.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-blue-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                   <Brain size={14} /> Kurumsal Dayanak
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Holland Mesleki İlgi Envanteri (RIASEC) ve Yetenek Setleri.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Compass size={14} /> Yöntem
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Deper, Yetenek ve Kişilik (DYK) üçgeninde çapraz analiz.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('discovery')}
              className="group relative px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg transition-all duration-300 shadow-2xl shadow-indigo-600/20 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Kariyer Keşfine Başla <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        )}

        {step === 'discovery' && (
          <motion.div
            key="discovery"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
             <div className="flex items-center justify-between px-2">
               <button onClick={() => setStep('intro')} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-colors"><ArrowLeft size={20} /></button>
               <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">Soru {currentIdx + 1} / {QUESTIONS.length}</span>
             </div>

             <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 space-y-12">
                <div className="space-y-4">
                   <div className="flex items-center gap-2 text-indigo-500">
                      <Star size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest italic">{QUESTIONS[currentIdx].type === 'DEGER' ? 'DEĞERLER' : QUESTIONS[currentIdx].type === 'KISI' ? 'KİŞİLİK' : 'YETENEK'}</span>
                   </div>
                   <h2 className="text-2xl sm:text-3xl font-bold text-white italic leading-tight underline decoration-indigo-500/30 decoration-4 underline-offset-8">
                      {QUESTIONS[currentIdx].text}
                   </h2>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: 1, label: "Hiç Bana Göre Değil" },
                    { value: 2, label: "Pek Katılmıyorum" },
                    { value: 3, label: "Kısmen Katılıyorum" },
                    { value: 4, label: "Tam Benlik" }
                  ].map((choice) => (
                    <button
                      key={choice.value}
                      onClick={() => handleChoice(choice.value)}
                      className="group flex items-center justify-between p-6 bg-white/5 hover:bg-indigo-600/10 border border-white/5 hover:border-indigo-500/30 rounded-3xl transition-all duration-300"
                    >
                      <span className="text-lg font-bold text-slate-300 group-hover:text-white">{choice.label}</span>
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center font-black text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/30">
                        {choice.value}
                      </div>
                    </button>
                  ))}
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
              <Loader2 size={64} className="text-indigo-500 animate-spin" />
              <div className="absolute inset-0 blur-2xl bg-indigo-500/20 animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">Kariyer Haritan Çiziliyor...</h3>
              <p className="text-slate-400 font-medium">Kişilik tipin ve tutkuların yapay zeka tarafından meslek setleriyle eşleştiriliyor.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
