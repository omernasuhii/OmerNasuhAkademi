import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Zap, ChevronRight, Brain, BookOpen, Clock, ArrowLeft, Loader2, Sparkles, CheckCircle2, ShieldCheck, Target, Search, Scale, Glasses, Sparkle, Palette, Eye, Maximize2, Minimize2, Image as ImageIcon } from 'lucide-react';
import { analysisService } from '../../../services/analysisService';
import { useAuth } from '../../../lib/AuthContext';

export default function SwDAnaliz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'setup' | 'swish' | 'loading'>('intro');
  const [negativeImage, setNegativeImage] = useState("");
  const [positiveImage, setPositiveImage] = useState("");
  const [swishCount, setSwishCount] = useState(0);
  const [isSwished, setIsSwished] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSwish = () => {
    if (swishCount >= 5) {
      handleFinish();
      return;
    }
    setIsSwished(true);
    setTimeout(() => {
      setIsSwished(false);
      setSwishCount(prev => prev + 1);
    }, 1000);
  };

  const handleFinish = async () => {
    if (!user) return;
    setStep('loading');
    setLoading(true);

    try {
      const result = await analysisService.saveResult(user.uid, 'SW-D', {
        negativeImage,
        positiveImage,
        swishSessions: 5
      });

      if (result?.id) {
        navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`);
      }
    } catch (error: any) {
      alert("Hata: " + error.message);
      setStep('swish');
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
            <div className="w-20 h-20 bg-fuchsia-500/20 rounded-3xl flex items-center justify-center text-fuchsia-400 mx-auto shadow-xl border border-fuchsia-500/20">
              <Zap size={40} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white tracking-tight">SW-D: SWISH İmaj Dönüştürme</h1>
              <p className="text-xl text-slate-400 font-medium">Zihnindeki olumsuz görüntüleri anlık olarak pozitif olanlarla değiştir.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-fuchsia-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                   <Brain size={14} /> Amaç
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Ders çalışmanı engelleyen negatif imgeleri motivasyonel karelerle değiştirmek.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-indigo-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <BookOpen size={14} /> Kurumsal Dayanak
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">NLP (Neuro-Linguistic Programming) - Swish Pattern tekniği.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-amber-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Sparkle size={14} /> Yöntem
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Zihinsel canlandırma ve hızlı modilite değişimi.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('setup')}
              className="group relative px-12 py-5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-2xl font-black text-lg transition-all duration-300 shadow-2xl shadow-fuchsia-500/20 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Modülü Başlat <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        )}

        {step === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
             <button onClick={() => setStep('intro')} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
             </button>

             <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 space-y-8">
                <div className="space-y-6">
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                     <h3 className="text-rose-400 font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                        <ImageIcon size={14} /> Negatif İmaj (Tetikleyici)
                     </h3>
                     <textarea
                        value={negativeImage}
                        onChange={(e) => setNegativeImage(e.target.value)}
                        placeholder="Seni durduran, modunu düşüren o görüntüyü tanımla... (Örn: Sınav sonucunun düşük geldiği o ekran)"
                        className="w-full bg-transparent border-none text-white placeholder-slate-600 focus:ring-0 min-h-[100px] font-medium resize-none"
                     />
                  </div>

                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                     <h3 className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Sparkle size={14} /> Pozitif İmaj (İdeal Benlik)
                     </h3>
                     <textarea
                        value={positiveImage}
                        onChange={(e) => setPositiveImage(e.target.value)}
                        placeholder="Hedefine ulaşmış, özgüvenli halini tanımla... (Örn: Üniversite kapısından girerkenki halin)"
                        className="w-full bg-transparent border-none text-white placeholder-slate-600 focus:ring-0 min-h-[100px] font-medium resize-none"
                     />
                  </div>
                </div>

                <button
                  disabled={!negativeImage || !positiveImage}
                  onClick={() => setStep('swish')}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-2xl font-black text-lg transition-all"
                >
                  Görüntüleri Sabitle ve Başla
                </button>
             </div>
          </motion.div>
        )}

        {step === 'swish' && (
          <motion.div
            key="swish"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 overflow-hidden relative min-h-[500px] flex flex-col items-center justify-center">
               
               <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
                  <div className="px-4 py-2 bg-black/40 rounded-full border border-white/10 flex items-center gap-2">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aşamalar:</span>
                     <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`w-3 h-1.5 rounded-full ${i <= swishCount ? 'bg-fuchsia-500' : 'bg-white/10'}`} />
                        ))}
                     </div>
                  </div>
                  <div className="text-xs font-black text-fuchsia-400 uppercase tracking-widest animate-pulse">SWISH MODU AKTİF</div>
               </div>

               <div className="relative w-full max-w-lg aspect-square">
                  {/* Negative Image Box */}
                  <motion.div
                    animate={{
                      scale: isSwished ? 0.05 : 1,
                      opacity: isSwished ? 0 : 1,
                      x: isSwished ? 300 : 0,
                      y: isSwished ? 300 : 0
                    }}
                    transition={{ duration: 0.3, ease: "circIn" }}
                    className="absolute inset-0 bg-slate-800 border-4 border-slate-700/50 rounded-3xl flex items-center justify-center p-8 text-center"
                  >
                     <div className="space-y-4">
                        <Minimize2 size={48} className="text-slate-600 mx-auto" />
                        <p className="text-slate-400 font-bold italic">{negativeImage}</p>
                     </div>
                  </motion.div>

                  {/* Positive Image Box */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: isSwished ? 1 : 0.1,
                      opacity: isSwished ? 1 : 0,
                      x: isSwished ? 0 : -200,
                      y: isSwished ? 0 : -200
                    }}
                    transition={{ duration: 0.3, ease: "circOut" }}
                    className="absolute inset-0 bg-emerald-500 border-8 border-white/20 rounded-3xl flex items-center justify-center p-8 text-center shadow-2xl shadow-emerald-500/50"
                  >
                     <div className="space-y-4">
                        <Sparkles size={64} className="text-white mx-auto animate-bounce" />
                        <p className="text-white text-2xl font-black italic">{positiveImage}</p>
                     </div>
                  </motion.div>
               </div>

               <button
                 onClick={handleSwish}
                 disabled={isSwished}
                 className={`mt-12 px-12 py-5 bg-white text-black rounded-2xl font-black text-xl transition-all hover:scale-110 active:scale-95 shadow-2xl ${isSwished ? 'opacity-0' : 'opacity-100'}`}
               >
                 SWISH!
               </button>

               <div className="mt-8 text-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest max-w-xs leading-relaxed">
                     Butona dokunduğunda negatif görüntü kaybolurken pozitif olanın tüm zihnini kapladığını hayal et.
                  </p>
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
              <Loader2 size={64} className="text-fuchsia-500 animate-spin" />
              <div className="absolute inset-0 blur-2xl bg-fuchsia-500/20 animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">Nöral Yollar Güncelleniyor...</h3>
              <p className="text-slate-400 font-medium">Zihinsel kestirmelerin yeniden yapılandırılıyor.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
