import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Layout, ChevronRight, Brain, BookOpen, Clock, ArrowLeft, Loader2, Sparkles, CheckCircle2, ShieldCheck, Target, Search, Scale, Glasses, Sparkle, Palette, Eye, Maximize2, Minimize2, Image as ImageIcon, History, FastForward, Flag, Star, Settings, AlertTriangle } from 'lucide-react';
import { analysisService } from '../../../services/analysisService';
import { useAuth } from '../../../lib/AuthContext';

export default function Wd3DAnaliz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'experience' | 'loading'>('intro');
  const [role, setRole] = useState<'dreamer' | 'realist' | 'critic'>('dreamer');
  const [formData, setFormData] = useState({
    dream: "",
    plan: "",
    risks: "",
    fixes: ""
  });
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (!user) return;
    setStep('loading');
    setLoading(true);

    try {
      const result = await analysisService.saveResult(user.uid, 'WD-3D', {
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
            <div className="w-20 h-20 bg-amber-600/20 rounded-3xl flex items-center justify-center text-amber-500 mx-auto shadow-xl border border-amber-600/20">
              <Layout size={40} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white tracking-tight">WD-3D: Walt Disney Planlama Modeli</h1>
              <p className="text-xl text-slate-400 font-medium">Hayal Et, Planla, Eleştir. Kusursuz bir yol haritası çıkar.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-amber-500 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Star size={14} /> Amaç
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Hedef belirleme sürecindeki içsel çatışmaları (istek vs korku) yönetmek.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-blue-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Brain size={14} /> Kurumsal Dayanak
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Robert Dilts Modellemesi - Walt Disney'in yaratıcı çalışma prensibi.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-rose-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle size={14} /> Yöntem
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">3 farklı bakış açısı (Hayalperest, Gerçekçi, Eleştirmen) döngüsü.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('experience')}
              className="group relative px-12 py-5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black text-lg transition-all duration-300 shadow-2xl shadow-amber-600/20 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Planlamaya Başla <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
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
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 overflow-hidden relative">
               
               <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-12">
                  <button 
                    onClick={() => setRole('dreamer')}
                    className={`p-4 rounded-3xl border flex flex-col items-center gap-2 transition-all duration-500 ${
                      role === 'dreamer' ? 'bg-amber-500 border-amber-400 scale-105 shadow-xl shadow-amber-500/20' : 'bg-slate-800/50 border-white/5 opacity-50'
                    }`}
                  >
                    <Star size={24} className={role === 'dreamer' ? 'animate-spin-slow' : ''} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Hayalperest</span>
                  </button>

                  <button 
                    onClick={() => setRole('realist')}
                    className={`p-4 rounded-3xl border flex flex-col items-center gap-2 transition-all duration-500 ${
                      role === 'realist' ? 'bg-blue-600 border-blue-400 scale-105 shadow-xl shadow-blue-500/20' : 'bg-slate-800/50 border-white/5 opacity-50'
                    }`}
                  >
                    <Settings size={24} className={role === 'realist' ? 'animate-spin-slow' : ''} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Gerçekçi</span>
                  </button>

                  <button 
                    onClick={() => setRole('critic')}
                    className={`p-4 rounded-3xl border flex flex-col items-center gap-2 transition-all duration-500 ${
                      role === 'critic' ? 'bg-rose-600 border-rose-400 scale-105 shadow-xl shadow-rose-500/20' : 'bg-slate-800/50 border-white/5 opacity-50'
                    }`}
                  >
                    <AlertTriangle size={24} className={role === 'critic' ? 'animate-pulse' : ''} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Eleştirmen</span>
                  </button>
               </div>

               <div className="min-h-[400px] flex flex-col">
                  <AnimatePresence mode="wait">
                    {role === 'dreamer' && (
                      <motion.div
                        key="dreamer"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="space-y-8 flex-1"
                      >
                         <div className="space-y-4">
                            <h3 className="text-3xl font-black text-amber-400 italic">"Her şey mümkün olsa ne isterdin?"</h3>
                            <p className="text-slate-400 font-medium">Bütçe, zaman, puan engeli yok. Hedefi en parlak haliyle canlandır.</p>
                         </div>
                         <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6">
                            <textarea
                              value={formData.dream}
                              onChange={(e) => setFormData(p => ({ ...p, dream: e.target.value }))}
                              placeholder="Hayalini buraya dök... Vizyonun ne?"
                              className="w-full bg-transparent border-none text-white text-xl font-bold focus:ring-0 min-h-[150px] placeholder:text-slate-700"
                            />
                         </div>
                         <button onClick={() => setRole('realist')} className="w-full py-5 bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-amber-500 transition-all flex items-center justify-center gap-2">Planlama Odasına Geç <Settings size={20} /></button>
                      </motion.div>
                    )}

                    {role === 'realist' && (
                      <motion.div
                        key="realist"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="space-y-8 flex-1"
                      >
                         <div className="space-y-4">
                            <h3 className="text-3xl font-black text-blue-400 italic">"Nasıl hayata geçireceğiz?"</h3>
                            <p className="text-slate-400 font-medium">Sen film yönetmenisin. Bu hayali eylem adımlarına dönüştür.</p>
                         </div>
                         <div className="bg-blue-600/10 border border-blue-500/20 rounded-3xl p-6">
                            <textarea
                              value={formData.plan}
                              onChange={(e) => setFormData(p => ({ ...p, plan: e.target.value }))}
                              placeholder="Adım adım yapılması gerekenler neler? Hangi kaynaklara ihtiyacın var?"
                              className="w-full bg-transparent border-none text-white text-xl font-bold focus:ring-0 min-h-[150px] placeholder:text-slate-700"
                            />
                         </div>
                         <button onClick={() => setRole('critic')} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2">Risk Odasına Geç <AlertTriangle size={20} /></button>
                      </motion.div>
                    )}

                    {role === 'critic' && (
                      <motion.div
                        key="critic"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="space-y-8 flex-1"
                      >
                         <div className="space-y-4">
                            <h3 className="text-3xl font-black text-rose-500 italic">"Gözden kaçan bir şey var mı?"</h3>
                            <p className="text-slate-400 font-medium">Planı test et. Engeller neler olabilir? Çözüm ne?</p>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-rose-600/10 border border-rose-500/20 rounded-3xl p-6">
                               <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-4 italic">OLASI RİSKLER</label>
                               <textarea
                                 value={formData.risks}
                                 onChange={(e) => setFormData(p => ({ ...p, risks: e.target.value }))}
                                 placeholder="Neler ters gidebilir?"
                                 className="w-full bg-transparent border-none text-white font-bold focus:ring-0 min-h-[100px] placeholder:text-slate-700"
                               />
                            </div>
                            <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-3xl p-6">
                               <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-4 italic">ÇÖZÜM / B PLANI</label>
                               <textarea
                                 value={formData.fixes}
                                 onChange={(e) => setFormData(p => ({ ...p, fixes: e.target.value }))}
                                 placeholder="Riskleri nasıl yönetiriz?"
                                 className="w-full bg-transparent border-none text-white font-bold focus:ring-0 min-h-[100px] placeholder:text-slate-700"
                               />
                            </div>
                         </div>
                         <button 
                            disabled={!formData.dream || !formData.plan}
                            onClick={handleFinish} 
                            className="w-full py-5 bg-rose-600 hover:bg-rose-500 disabled:opacity-30 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl shadow-rose-600/30 flex items-center justify-center gap-2"
                          >
                            Döngüyü Tamamla ve Kaydet <CheckCircle2 size={24} />
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
              <Loader2 size={64} className="text-amber-500 animate-spin" />
              <div className="absolute inset-0 blur-2xl bg-amber-500/20 animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">Planın AI Tarafından Onaylanıyor...</h3>
              <p className="text-slate-400 font-medium">Hayalin, stratejin ve risk analizin sentezleniyor.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
