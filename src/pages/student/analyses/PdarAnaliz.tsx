import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ChevronRight, Brain, Clock, ArrowLeft, Loader2, Sparkles, CheckCircle2, ShieldCheck, Target, Search, Scale, AlertTriangle, Monitor, RotateCcw, PenTool, Eye, LineChart, Trophy } from 'lucide-react';
import { analysisService } from '../../../services/analysisService';
import { useAuth } from '../../../lib/AuthContext';

export default function PdarAnaliz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'scores' | 'strategy' | 'loading'>('intro');
  const [formData, setFormData] = useState({
    scores: {
      tur: { s: 40, d: 0, y: 0, b: 0, h: 35 },
      mat: { s: 40, d: 0, y: 0, b: 0, h: 30 },
      fen: { s: 20, d: 0, y: 0, b: 0, h: 18 },
      sos: { s: 20, d: 0, y: 0, b: 0, h: 18 }
    },
    difficulty: "Orta",
    mood: "Sakin",
    strategy: {
      finishedOnTime: "Evet",
      trappedSubject: "",
      turlamaUsed: "Evet",
      focusLossTime: "Ortada"
    }
  });
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (!user) return;
    setStep('loading');
    setLoading(true);

    try {
      const result = await analysisService.saveResult(user.uid, 'PDAR-360', {
        form: formData
      });

      if (result?.id) {
        navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`);
      }
    } catch (error: any) {
      alert("Hata: " + error.message);
      setStep('strategy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 text-center space-y-8"
          >
            <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center text-emerald-400 mx-auto shadow-xl border border-emerald-500/20">
              <BarChart3 size={40} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white tracking-tight">PDAR-360: Panoramik Deneme Analiz Raporu</h1>
              <p className="text-xl text-slate-400 font-medium">Denemeyi bir Ar-Ge laboratuvarına dönüştür, gizli net kaçaklarını yakala.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} /> Amaç
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Netlerini düşüren gizli kaçakları (Dikkat, Süre, Stres) tespit edip strateji geliştirmek.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-blue-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Brain size={14} /> Kurumsal Dayanak
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Kaizen (Sürekli İyileştirme) felsefesi ve Metabilişsel İzleme.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-amber-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Search size={14} /> Yöntem
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">"Sanal Otopsi" ile her yanlışın DNA'sını inceleme.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('scores')}
              className="group relative px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg transition-all duration-300 shadow-2xl shadow-emerald-600/20 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Analize Başla <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        )}

        {step === 'scores' && (
          <motion.div
            key="scores"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 space-y-12">
               <div className="flex items-center gap-4 text-emerald-400">
                  <LineChart size={32} />
                  <h2 className="text-3xl font-black text-white italic">Genel Karne (Dashboard)</h2>
               </div>

               <div className="overflow-x-auto rounded-3xl border border-white/5 bg-black/20">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Ders</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Doğru</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Yanlış</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Boş</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Hedef</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Object.entries(formData.scores).map(([key, data]) => (
                        <tr key={key} className="hover:bg-white/5 transition-colors">
                          <td className="p-6 font-black text-white uppercase text-sm tracking-widest">
                            {key === 'tur' ? 'Türkçe' : key === 'mat' ? 'Matematik' : key === 'fen' ? 'Fen Bil.' : 'Sosyal'}
                          </td>
                          <td className="p-4">
                            <input 
                              type="number" 
                              value={data.d} 
                              onChange={(e) => setFormData(p => ({ ...p, scores: { ...p.scores, [key]: { ...p.scores[key as keyof typeof p.scores], d: parseInt(e.target.value) } } }))}
                              className="w-20 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2 text-center text-white font-bold"
                            />
                          </td>
                          <td className="p-4">
                            <input 
                              type="number" 
                              value={data.y} 
                              onChange={(e) => setFormData(p => ({ ...p, scores: { ...p.scores, [key]: { ...p.scores[key as keyof typeof p.scores], y: parseInt(e.target.value) } } }))}
                              className="w-20 bg-rose-500/10 border border-rose-500/20 rounded-xl p-2 text-center text-white font-bold"
                            />
                          </td>
                          <td className="p-4">
                            <input 
                              type="number" 
                              value={data.b} 
                              onChange={(e) => setFormData(p => ({ ...p, scores: { ...p.scores, [key]: { ...p.scores[key as keyof typeof p.scores], b: parseInt(e.target.value) } } }))}
                              className="w-20 bg-slate-500/10 border border-slate-500/20 rounded-xl p-2 text-center text-white font-bold"
                            />
                          </td>
                          <td className="p-6 text-sm font-black text-slate-500 italic">{data.h}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block italic">Sınav Zorluk Derecesi</label>
                     <div className="grid grid-cols-4 gap-2">
                        {["Kolay", "Orta", "Zor", "Çok Zor"].map(d => (
                          <button 
                            key={d} 
                            onClick={() => setFormData(p => ({ ...p, difficulty: d }))}
                            className={`p-3 rounded-xl border text-[10px] font-black uppercase transition-all ${formData.difficulty === d ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-400'}`}
                          >
                            {d}
                          </button>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block italic">Sınav Anı Ruh Hali</label>
                     <div className="grid grid-cols-4 gap-2">
                        {["Sakin", "Stresli", "Yorgun", "Odaklanmış"].map(m => (
                          <button 
                            key={m} 
                            onClick={() => setFormData(p => ({ ...p, mood: m }))}
                            className={`p-3 rounded-xl border text-[10px] font-black uppercase transition-all ${formData.mood === m ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-400'}`}
                          >
                            {m}
                          </button>
                        ))}
                     </div>
                  </div>
               </div>

               <button 
                onClick={() => setStep('strategy')}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all"
               >
                 Süre ve Strateji Bölümüne Geç
               </button>
            </div>
          </motion.div>
        )}

        {step === 'strategy' && (
          <motion.div
            key="strategy"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
             <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 space-y-12">
                <div className="flex items-center gap-4 text-emerald-400">
                    <Clock size={32} />
                    <h2 className="text-3xl font-black text-white italic">Süre ve Strateji Yönetimi</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                      <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest">Sınavı Yetiştirebildin mi?</h4>
                      <div className="flex flex-col gap-2">
                         {["Evet, süre arttı.", "Tam ucuna yetişti.", "Hayır, boş kaldı."].map(o => (
                           <button 
                             key={o} 
                             onClick={() => setFormData(p => ({ ...p, strategy: { ...p.strategy, finishedOnTime: o } }))}
                             className={`p-4 rounded-xl border text-left font-bold transition-all ${formData.strategy.finishedOnTime === o ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black/20 border-white/5 text-slate-500'}`}
                           >
                             {o}
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                      <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest">Turlama Tekniği Kullandın mı?</h4>
                      <div className="flex flex-col gap-2">
                         {["Evet (Zorları geçtim)", "Hayır (İnatlaştım)"].map(o => (
                           <button 
                             key={o} 
                             onClick={() => setFormData(p => ({ ...p, strategy: { ...p.strategy, turlamaUsed: o } }))}
                             className={`p-4 rounded-xl border text-left font-bold transition-all ${formData.strategy.turlamaUsed === o ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black/20 border-white/5 text-slate-500'}`}
                           >
                             {o}
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4 col-span-1 md:col-span-2">
                      <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest">Hangi dakikalarda odak koptu?</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                         {["Başlangıçta", "Ortada", "Sonda"].map(o => (
                           <button 
                             key={o} 
                             onClick={() => setFormData(p => ({ ...p, strategy: { ...p.strategy, focusLossTime: o } }))}
                             className={`p-4 rounded-xl border text-center font-bold transition-all ${formData.strategy.focusLossTime === o ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black/20 border-white/5 text-slate-500'}`}
                           >
                             {o}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="flex gap-4">
                   <button onClick={() => setStep('scores')} className="px-8 py-5 bg-white/5 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all">Geri</button>
                   <button 
                    onClick={handleFinish}
                    className="flex-1 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2"
                   >
                     Analizi Tamamla ve Kaydet <Trophy size={20} />
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
              <Loader2 size={64} className="text-emerald-500 animate-spin" />
              <div className="absolute inset-0 blur-2xl bg-emerald-500/20 animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">Sanal Otopsi Verileri İşleniyor...</h3>
              <p className="text-slate-400 font-medium">Netlerin, süren ve stratejin yapay zeka tarafından analiz ediliyor.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
