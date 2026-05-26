import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Compass, ChevronRight, Brain, BookOpen, Clock, ArrowLeft, Loader2, Sparkles, CheckCircle2, ShieldCheck, Target, Search, Scale, AlertTriangle, Monitor, RotateCcw, PenTool, Eye, LineChart, Trophy, HeartPulse, GraduationCap } from 'lucide-react';
import { analysisService } from '../../../services/analysisService';
import { useAuth } from '../../../lib/AuthContext';

export default function SsDkmAnaliz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'psychology' | 'academic' | 'decision' | 'loading'>('intro');
  const [formData, setFormData] = useState({
    mood: 5,
    initialThought: "Bitti, kurtuldum.",
    academicGap: {
      tur: { h: 35, g: 0 },
      mat: { h: 30, g: 0 },
      fen: { h: 18, g: 0 }
    },
    decision: "Tercih Yapmalı"
  });
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (!user) return;
    setStep('loading');
    setLoading(true);

    try {
      const result = await analysisService.saveResult(user.uid, 'SS-DKM', {
        form: formData
      });

      if (result?.id) {
        navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`);
      }
    } catch (error: any) {
      alert("Hata: " + error.message);
      setStep('decision');
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
            <div className="w-20 h-20 bg-blue-500/20 rounded-3xl flex items-center justify-center text-blue-400 mx-auto shadow-xl border border-blue-500/20">
              <Compass size={40} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white tracking-tight">SS-DKM: Sınav Sonrası Durum Analizi ve Karar Matrisi</h1>
              <p className="text-xl text-slate-400 font-medium">Sınav travmasını yönet, akademik hasar tespiti yap ve doğru kararları ver.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-blue-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <HeartPulse size={14} /> Amaç
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Sınavdan sonraki ilk 48 saat içinde duygusal ve akademik dengeyi kurmak.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-purple-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                   <Brain size={14} /> Kurumsal Dayanak
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Yasın 5 Evresi (Kübler-Ross) ve Karar Teorisi.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-amber-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Scale size={14} /> Yöntem
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Psikolojik Debriefing ve Gap (Açık/Fark) analizi.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('psychology')}
              className="group relative px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg transition-all duration-300 shadow-2xl shadow-blue-600/20 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Analizi Başlat <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        )}

        {step === 'psychology' && (
          <motion.div
            key="psychology"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
             <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 space-y-12">
                <div className="flex items-center gap-4 text-blue-400">
                    <HeartPulse size={32} />
                    <h2 className="text-3xl font-black text-white italic">Psikolojik Debriefing (Duygu Dökümü)</h2>
                </div>

                <div className="space-y-12">
                   <div className="space-y-6">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block italic">Şu anki Ruh Halin (1-10)</label>
                      <div className="flex justify-between gap-2">
                         {[1,2,3,4,5,6,7,8,9,10].map(n => (
                           <button 
                             key={n} 
                             onClick={() => setFormData(p => ({ ...p, mood: n }))}
                             className={`flex-1 h-12 rounded-xl font-black text-sm transition-all ${formData.mood === n ? 'bg-blue-500 text-white scale-110 shadow-lg shadow-blue-500/30' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                           >
                             {n}
                           </button>
                         ))}
                      </div>
                      <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">
                         <span>Çöküş</span>
                         <span>Zafer</span>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block italic">Sınavdan çıktığın an ilk düşüncen neydi?</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         {["Bitti, kurtuldum.", "Keşke daha çok çalışsaydım.", "Hakkımı alamadım."].map(o => (
                           <button 
                             key={o} 
                             onClick={() => setFormData(p => ({ ...p, initialThought: o }))}
                             className={`p-6 rounded-3xl border font-bold text-sm transition-all text-center ${formData.initialThought === o ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-black/20 border-white/5 text-slate-500'}`}
                           >
                             {o}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>

                <button onClick={() => setStep('academic')} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all">Akademik Hasar Tespitine Geç</button>
             </div>
          </motion.div>
        )}

        {step === 'academic' && (
          <motion.div
            key="academic"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
             <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 space-y-12">
                <div className="flex items-center gap-4 text-emerald-400">
                    <Target size={32} />
                    <h2 className="text-3xl font-black text-white italic">Akademik Hasar Tespiti</h2>
                </div>

                <div className="space-y-8">
                   <div className="grid grid-cols-1 gap-6">
                      {Object.entries(formData.academicGap).map(([key, data]) => (
                        <div key={key} className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white/5 border border-white/5 rounded-3xl">
                           <div className="w-full sm:w-1/3">
                              <h4 className="text-xl font-black text-white uppercase tracking-widest">{key === 'tur' ? 'Türkçe' : key === 'mat' ? 'Matematik' : 'Fen/Sosyal'}</h4>
                              <p className="text-xs font-bold text-slate-500 italic">Hedef Net: {data.h}</p>
                           </div>
                           <div className="flex-1 w-full">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">GERÇEKLEŞEN (Tahmini Net)</label>
                              <input 
                                type="number"
                                value={data.g}
                                onChange={(e) => setFormData(p => ({ ...p, academicGap: { ...p.academicGap, [key]: { ...p.academicGap[key as keyof typeof p.academicGap], g: parseInt(e.target.value) } } }))}
                                className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-white text-2xl font-black placeholder-slate-700 focus:ring-1 focus:ring-emerald-500"
                              />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <button onClick={() => setStep('decision')} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 transition-all">Karar Matrisine Geç</button>
             </div>
          </motion.div>
        )}

        {step === 'decision' && (
          <motion.div
            key="decision"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
             <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 space-y-12 text-center">
                <div className="space-y-4">
                    <GraduationCap size={64} className="text-amber-500 mx-auto" />
                    <h2 className="text-3xl font-black text-white italic">Karar Matrisi: Yol Ayrımı</h2>
                    <p className="text-slate-400 font-medium">Şu anki hislerin ve gerçek netlerin ışığında hangi yol sana daha yakın?</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {["Tercih Yapmalı", "Mezuna Kalabilir", "Risk Alıp Tercih Yapmalı", "Kesinlikle Mezun"].map(d => (
                     <button
                        key={d}
                        onClick={() => setFormData(p => ({ ...p, decision: d }))}
                        className={`p-10 rounded-[32px] border-2 font-black uppercase tracking-widest transition-all ${formData.decision === d ? 'bg-amber-500 border-amber-400 text-white scale-105 shadow-2xl shadow-amber-500/30' : 'bg-black/20 border-white/5 text-slate-500 hover:border-white/20'}`}
                     >
                        {d}
                     </button>
                   ))}
                </div>

                <button onClick={handleFinish} className="w-full py-6 bg-white text-black rounded-3xl font-black text-xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl">Analizi Tamamla ve Kaydet</button>
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
              <Loader2 size={64} className="text-blue-500 animate-spin" />
              <div className="absolute inset-0 blur-2xl bg-blue-500/20 animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">Karar Matrisin Hesaplanıyor...</h3>
              <p className="text-slate-400 font-medium">Bilişsel ve akademik verilerin AI tarafından harmanlanıyor.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
