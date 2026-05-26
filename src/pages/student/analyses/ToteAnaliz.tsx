import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { IterationCcw, ChevronRight, Brain, BookOpen, Clock, ArrowLeft, Loader2, Sparkles, CheckCircle2, ShieldCheck, Target, Search, Scale, Glasses, Sparkle, Palette, Eye, Maximize2, Minimize2, Image as ImageIcon, History, FastForward, Flag, Star, Settings, AlertTriangle, ArrowRightLeft, Repeat } from 'lucide-react';
import { analysisService } from '../../../services/analysisService';
import { useAuth } from '../../../lib/AuthContext';

export default function ToteAnaliz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'experience' | 'loading'>('intro');
  const [toteStep, setToteStep] = useState<'test1' | 'operate' | 'test2'>('test1');
  const [formData, setFormData] = useState({
    subject: "",
    targetState: "",
    currentState: "",
    gap: "",
    oldStrategy: "",
    newStrategy: "",
    test2Result: "",
    status: "LOOP"
  });
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (!user) return;
    setStep('loading');
    setLoading(true);

    try {
      const result = await analysisService.saveResult(user.uid, 'TOTE', {
        form: formData
      });

      if (result?.id) {
        navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`);
      }
    } catch (error: any) {
      alert("Hata: " + error.message);
      setStep('experience');
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
            <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center text-blue-400 mx-auto shadow-xl border border-blue-600/20">
              <IterationCcw size={40} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white tracking-tight">TOTE: Hedef ve Davranış Yönetimi</h1>
              <p className="text-xl text-slate-400 font-medium">İşe yaramayan stratejiyi değiştir, hedefe ulaşana kadar durma.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-blue-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Flag size={14} /> Amaç
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Hedefe ulaşamadığında "daha çok" değil "farklı" çalışmayı öğretmek.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Brain size={14} /> Kurumsal Dayanak
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Miller, Galanter & Pribram (1960) - TOTE Modeli.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-amber-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Repeat size={14} /> Yöntem
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Test - Operation - Test - Exit algoritması.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('experience')}
              className="group relative px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg transition-all duration-300 shadow-2xl shadow-blue-600/20 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Algoritmayı Başlat <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        )}

        {step === 'experience' && (
          <motion.div
            key="experience"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
             <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8">
               <div className="flex items-center justify-between mb-12 relative px-4">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/5 z-0" />
                  
                  {[
                    { id: 'test1', icon: Search, label: 'TEST 1' },
                    { id: 'operate', icon: Settings, label: 'OPERATE' },
                    { id: 'test2', icon: Repeat, label: 'TEST 2' }
                  ].map((s, i) => (
                    <motion.div 
                      key={s.id}
                      animate={{
                        scale: toteStep === s.id ? 1.2 : 0.9,
                        opacity: toteStep === s.id ? 1 : 0.4
                      }}
                      className={`relative z-10 flex flex-col items-center gap-2 ${toteStep === s.id ? 'text-blue-400' : 'text-slate-500'}`}
                    >
                      <div className={`p-4 rounded-2xl border ${toteStep === s.id ? 'bg-blue-600 border-blue-400' : 'bg-slate-800 border-white/10'}`}>
                        <s.icon size={20} className={toteStep === s.id ? 'text-white' : ''} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                    </motion.div>
                  ))}
               </div>

               <div className="px-4 pb-4">
                  <AnimatePresence mode="wait">
                    {toteStep === 'test1' && (
                      <motion.div
                        key="t1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-8"
                      >
                         <h3 className="text-2xl font-black text-white italic">"Farkı (GAP) Tespit Et"</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 font-bold">KONU / BRANŞ</label>
                               <input 
                                 value={formData.subject}
                                 onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))}
                                 placeholder="Örn: Paragraf"
                                 className="w-full bg-transparent border-none text-white focus:ring-0"
                               />
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">HEDEFLENEN NET</label>
                               <input 
                                 value={formData.targetState}
                                 onChange={(e) => setFormData(p => ({ ...p, targetState: e.target.value }))}
                                 placeholder="Örn: 20/20"
                                 className="w-full bg-transparent border-none text-white focus:ring-0"
                               />
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">MEVCUT DURUM</label>
                               <input 
                                 value={formData.currentState}
                                 onChange={(e) => setFormData(p => ({ ...p, currentState: e.target.value }))}
                                 placeholder="Örn: 14/20"
                                 className="w-full bg-transparent border-none text-white focus:ring-0"
                               />
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">GAP (NET FARKI)</label>
                               <input 
                                 value={formData.gap}
                                 onChange={(e) => setFormData(p => ({ ...p, gap: e.target.value }))}
                                 placeholder="Örn: -6 Net"
                                 className="w-full bg-transparent border-none text-white focus:ring-0"
                               />
                            </div>
                         </div>
                         <button onClick={() => setToteStep('operate')} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20">Operasyon Odasına Geç <Settings size={20} /></button>
                      </motion.div>
                    )}

                    {toteStep === 'operate' && (
                      <motion.div
                        key="op"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-8"
                      >
                         <h3 className="text-2xl font-black text-blue-400 italic">"Yeni Stratejini Belirle"</h3>
                         <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-6">
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">ESKİ STRATEJİN (İşe Yaramayan)</label>
                               <textarea
                                 value={formData.oldStrategy}
                                 onChange={(e) => setFormData(p => ({ ...p, oldStrategy: e.target.value }))}
                                 placeholder="Daha önce neyi denedin ama olmadı?"
                                 className="w-full bg-transparent border border-white/5 p-4 rounded-xl text-white focus:ring-0 min-h-[80px]"
                               />
                            </div>
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">YENİ STRATEJİN (Operasyon)</label>
                               <textarea
                                 value={formData.newStrategy}
                                 onChange={(e) => setFormData(p => ({ ...p, newStrategy: e.target.value }))}
                                 placeholder="Şimdi neyi farklı yapacaksın? (Örn: Video izlemek yerine kendim özet çıkaracağım)"
                                 className="w-full bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-white font-bold focus:ring-0 min-h-[120px]"
                               />
                            </div>
                         </div>
                         <button onClick={() => setToteStep('test2')} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20">Uygulama ve T2 Kontrolü <Repeat size={20} /></button>
                      </motion.div>
                    )}

                    {toteStep === 'test2' && (
                      <motion.div
                        key="t2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-8 text-center"
                      >
                         <h3 className="text-2xl font-black text-emerald-400 italic">"Son Kontrol: Hedef Gerçekleşti mi?"</h3>
                         <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[40px] space-y-6">
                            <p className="text-lg text-slate-400 font-medium">Yeni stratejin sonrası son denemedeki sonucun nedir?</p>
                            <input 
                              value={formData.test2Result}
                              onChange={(e) => setFormData(p => ({ ...p, test2Result: e.target.value }))}
                              placeholder="Sonuç... (Örn: 18/20)"
                              className="w-full bg-transparent border-b-2 border-emerald-500/30 text-white text-4xl font-black text-center focus:outline-none focus:border-emerald-500"
                            />
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                            <button
                               onClick={() => { setFormData(p => ({ ...p, status: 'EXIT' })); handleFinish(); }}
                               className="p-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 flex flex-col items-center gap-2"
                            >
                               <CheckCircle2 size={32} />
                               <span>Evet (EXIT)</span>
                            </button>
                            <button
                               onClick={() => { setFormData(p => ({ ...p, status: 'LOOP' })); handleFinish(); }}
                               className="p-6 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 flex flex-col items-center gap-2"
                            >
                               <Repeat size={32} />
                               <span>Hayır (LOOP)</span>
                            </button>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
              <Loader2 size={64} className="text-blue-500 animate-spin" />
              <div className="absolute inset-0 blur-2xl bg-blue-500/20 animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">Algoritma Analiz Ediliyor...</h3>
              <p className="text-slate-400 font-medium">Strateji döngün yapay zeka tarafından optimize ediliyor.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
