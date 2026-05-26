import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Compass, ChevronRight, Brain, BookOpen, Clock, ArrowLeft, Loader2, Sparkles, CheckCircle2, ShieldCheck, Target, Search, Scale, Glasses, Sparkle, Palette, Eye, Maximize2, Minimize2, Image as ImageIcon, History, FastForward, Flag } from 'lucide-react';
import { analysisService } from '../../../services/analysisService';
import { useAuth } from '../../../lib/AuthContext';

export default function TLineAnaliz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'experience' | 'loading'>('intro');
  const [currentStage, setCurrentStage] = useState<'past' | 'present' | 'future'>('present');
  const [formData, setFormData] = useState({
    pastSuccess: "",
    pastStrength: "",
    futureTarget: "",
    futureFeeling: "",
    presentAction: ""
  });
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (!user) return;
    setStep('loading');
    setLoading(true);

    try {
      const result = await analysisService.saveResult(user.uid, 'T-LINE', {
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
            <div className="w-20 h-20 bg-indigo-600/20 rounded-3xl flex items-center justify-center text-indigo-400 mx-auto shadow-xl border border-indigo-600/20">
              <Compass size={40} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white tracking-tight">T-LINE: Zaman Çizgisi Motivasyonu</h1>
              <p className="text-xl text-slate-400 font-medium">Geçmişin gücünü arkana al, geleceğin ışığını önüne.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-indigo-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} /> Amaç
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Geçmiş başarı kaynaklarını bugüne taşıyıp, gelecekteki hedefinle zihinsel bağını güçlendirmek.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-blue-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Brain size={14} /> Kurumsal Dayanak
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Zimbardo'nun Zaman Perspektifi ve NLP Zaman Çizgisi Terapisi.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-amber-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <History size={14} /> Yöntem
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Doğrusal zaman kodlaması ve kaynak entegrasyonu.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('experience')}
              className="group relative px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg transition-all duration-300 shadow-2xl shadow-indigo-600/20 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Zaman Yolculuğuna Başla <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
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
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12">
               {/* Timeline Navigation */}
               <div className="flex items-center justify-center gap-4 sm:gap-12 mb-12 relative">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/5 z-0" />
                  
                  <button 
                    onClick={() => setCurrentStage('past')}
                    className={`relative z-10 p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all duration-500 ${
                      currentStage === 'past' ? 'bg-amber-500 border-amber-400 scale-110 shadow-xl shadow-amber-500/20' : 'bg-slate-800 border-white/5 opacity-50'
                    }`}
                  >
                    <History size={24} />
                    <span className="text-[10px] font-black uppercase">Geçmiş</span>
                  </button>

                  <button 
                    onClick={() => setCurrentStage('present')}
                    className={`relative z-10 p-6 rounded-3xl border flex flex-col items-center gap-2 transition-all duration-500 ${
                      currentStage === 'present' ? 'bg-indigo-600 border-indigo-400 scale-125 shadow-2xl shadow-indigo-500/30' : 'bg-slate-800 border-white/5 opacity-50'
                    }`}
                  >
                    <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                    <span className="text-[10px] font-black uppercase">Şimdi</span>
                  </button>

                  <button 
                    onClick={() => setCurrentStage('future')}
                    className={`relative z-10 p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all duration-500 ${
                      currentStage === 'future' ? 'bg-emerald-500 border-emerald-400 scale-110 shadow-xl shadow-emerald-500/20' : 'bg-slate-800 border-white/5 opacity-50'
                    }`}
                  >
                    <FastForward size={24} />
                    <span className="text-[10px] font-black uppercase">Gelecek</span>
                  </button>
               </div>

               <div className="min-h-[300px]">
                  <AnimatePresence mode="wait">
                    {currentStage === 'past' && (
                      <motion.div
                        key="past"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                      >
                         <h3 className="text-2xl font-black text-amber-400 flex items-center gap-3 italic">
                           <History size={24} /> Geçmişin Gücü
                         </h3>
                         <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Başarı Anın</label>
                               <textarea 
                                 value={formData.pastSuccess}
                                 onChange={(e) => setFormData(prev => ({ ...prev, pastSuccess: e.target.value }))}
                                 placeholder="Daha önce çok zorlandığın ama başardığın bir anı yaz (Örn: LGS sınavı, bir spor maçı...)"
                                 className="w-full bg-transparent border-none text-white focus:ring-0 min-h-[80px]"
                               />
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Baskın Gücün</label>
                               <input 
                                 value={formData.pastStrength}
                                 onChange={(e) => setFormData(prev => ({ ...prev, pastStrength: e.target.value }))}
                                 placeholder="O gün seni başarıya götüren hangi yeteneğindi? (İnat, sabır, zeka...)"
                                 className="w-full bg-transparent border-none text-white focus:ring-0"
                               />
                            </div>
                         </div>
                         <button onClick={() => setCurrentStage('present')} className="w-full py-4 bg-amber-500 text-white rounded-xl font-black uppercase tracking-widest hover:bg-amber-400 transition-colors">Şimdiye Dön</button>
                      </motion.div>
                    )}

                    {currentStage === 'future' && (
                      <motion.div
                        key="future"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                         <h3 className="text-2xl font-black text-emerald-400 flex items-center gap-3 italic">
                           <FastForward size={24} /> Gelecek Vizyonu
                         </h3>
                         <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Varış Noktan</label>
                               <input 
                                 value={formData.futureTarget}
                                 onChange={(e) => setFormData(prev => ({ ...prev, futureTarget: e.target.value }))}
                                 placeholder="Hedefine ulaştığın gün hangi tarihteyiz ve neredesin?"
                                 className="w-full bg-transparent border-none text-white focus:ring-0"
                               />
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Başarı Hissi</label>
                               <textarea 
                                 value={formData.futureFeeling}
                                 onChange={(e) => setFormData(prev => ({ ...prev, futureFeeling: e.target.value }))}
                                 placeholder="Etrafında ne görüyorsun, kimler var, ne hissediyorsun?"
                                 className="w-full bg-transparent border-none text-white focus:ring-0 min-h-[80px]"
                               />
                            </div>
                         </div>
                         <button onClick={() => setCurrentStage('present')} className="w-full py-4 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors">Şimdiye Dön</button>
                      </motion.div>
                    )}

                    {currentStage === 'present' && (
                      <motion.div
                        key="present"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                         <h3 className="text-2xl font-black text-indigo-400 flex items-center gap-3 italic">
                           <Flag size={24} /> Eylem Merkezi
                         </h3>
                         <p className="text-slate-400 font-medium">Geçmişten gücünü aldın, geleceğinden ışığını. Şimdi burada, bu masada ne yapacaksın?</p>
                         <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-4">BUGÜNKÜ İLK ADIMIN</label>
                            <textarea 
                              value={formData.presentAction}
                              onChange={(e) => setFormData(prev => ({ ...prev, presentAction: e.target.value }))}
                              placeholder="O muhteşem geleceğe giden yolu bugün hangi somut adımla başlatacaksın?"
                              className="w-full bg-transparent border-none text-white text-xl font-bold focus:ring-0 min-h-[120px] placeholder:text-slate-700"
                            />
                         </div>
                         <button
                           disabled={!formData.presentAction || !formData.futureTarget || !formData.pastSuccess}
                           onClick={handleFinish}
                           className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-2xl font-black text-xl transition-all shadow-2xl shadow-indigo-500/30"
                         >
                           Sistemi Kilitle ve Kaydet
                         </button>
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
              <Loader2 size={64} className="text-indigo-500 animate-spin" />
              <div className="absolute inset-0 blur-2xl bg-indigo-500/20 animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">Zaman Çizelgesi Entegre Ediliyor...</h3>
              <p className="text-slate-400 font-medium">Geçmiş ve gelecek arasındaki motivasyon köprüleri AI tarafından analiz ediliyor.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
