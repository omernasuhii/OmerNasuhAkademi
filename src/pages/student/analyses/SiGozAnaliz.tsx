import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Eye, ChevronRight, Brain, BookOpen, Clock, ArrowLeft, Loader2, Sparkles, CheckCircle2, ShieldCheck, Target, Search, Scale, Glasses, Sparkle, Palette } from 'lucide-react';
import { analysisService } from '../../../services/analysisService';
import { useAuth } from '../../../lib/AuthContext';

const SCENARIOS = [
  {
    id: 1,
    title: "DENEME SINAVI KÖTÜ GEÇTİ",
    situation: "Netlerim düştü.",
    glasses: [
      { id: 'black', icon: Glasses, label: "SİYAH GÖZLÜK (Negatif)", color: 'text-slate-600', bg: 'bg-slate-900', text: "Ben aptalım. Asla kazanamayacağım. Emeklerim boşa gitti. Herkes bana gülecek." },
      { id: 'clear', icon: Glasses, label: "ŞEFFAF GÖZLÜK (Gerçekçi)", color: 'text-blue-400', bg: 'bg-blue-500/10', text: "Geçen sınav 80 netti, bu sınav 70 net. Matematikte 5 boşum var. Sadece veri bu." },
      { id: 'magic', icon: Sparkle, label: "SİHİRLİ GÖZLÜK (Fırsat)", color: 'text-amber-400', bg: 'bg-amber-500/10', text: "Harika! Sınavdan önce eksik olduğum 5 konuyu tespit ettim. Eğer bu sınavda yapabilseydim, eksik olduğumu bilmeyecektim ve gerçek sınavda patlayacaktım. Bu düşüş, bana eksiklerimi hediye etti." }
    ]
  },
  {
    id: 2,
    title: "ÖĞRETMEN SINIFTA FIRÇA ATTI",
    situation: "Hoca beni azarladı.",
    glasses: [
      { id: 'black', icon: Glasses, label: "SİYAH GÖZLÜK", color: 'text-slate-600', bg: 'bg-slate-900', text: "Hoca bana taktı. Beni sevmiyor. Beni rezil etmek istedi. Artık o dersi dinlemeyeceğim." },
      { id: 'clear', icon: Glasses, label: "ŞEFFAF GÖZLÜK", color: 'text-blue-400', bg: 'bg-blue-500/10', text: "Ödevimi yapmadım, öğretmen sesini yükseltti ve 'Sorumsuzluk yapma' dedi. Olay bundan ibaret." },
      { id: 'magic', icon: Sparkle, label: "SİHİRLİ GÖZLÜK", color: 'text-amber-400', bg: 'bg-amber-500/10', text: "Öğretmen benim potansiyelimi biliyor. Eğer beni önemsemeseydi, ödev yapmamam umurunda olmazdı. Benden beklentisi yüksek olduğu için tepki gösterdi. Bu bir uyarı fişeğiydi, toparlanmamı sağladı." }
    ]
  }
];

export default function SiGozAnaliz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'experience' | 'loading'>('intro');
  const [currentScenarioIdx, setCurrentScenarioIdx] = useState(0);
  const [selectedGlass, setSelectedGlass] = useState<string | null>(null);
  const [completedScenarios, setCompletedScenarios] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (currentScenarioIdx < SCENARIOS.length - 1) {
      setCurrentScenarioIdx(prev => prev + 1);
      setSelectedGlass(null);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setStep('loading');
    setLoading(true);

    try {
      const result = await analysisService.saveResult(user.uid, 'Sİ-GÖZ', {
        completed: true,
        scenariosCount: SCENARIOS.length
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

  const currentScenario = SCENARIOS[currentScenarioIdx];

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
            <div className="w-20 h-20 bg-cyan-500/20 rounded-3xl flex items-center justify-center text-cyan-400 mx-auto shadow-xl border border-cyan-500/20">
              <Eye size={40} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white tracking-tight">Sİ-GÖZ: Sihirli Gözlükler</h1>
              <p className="text-xl text-slate-400 font-medium">Bilişsel yeniden çerçeveleme ile olayların anlamını dönüştür.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-cyan-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Brain size={14} /> Amaç
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Olumsuz olaylardaki "gizli hediyeyi" görmeyi öğrenmek.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-purple-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Palette size={14} /> Kurumsal Dayanak
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Bilişsel Çerçeveleme (Cognitive Reframing) tekniğine dayanır.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-amber-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Sparkle size={14} /> Yöntem
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">3 farklı gözlük ile olayları analiz etme egzersizi.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('experience')}
              className="group relative px-12 py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black text-lg transition-all duration-300 shadow-2xl shadow-cyan-600/20 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Egzersizi Başlat <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        )}

        {step === 'experience' && (
          <motion.div
            key="experience"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
             <div className="flex items-center justify-between px-2">
              <button 
                onClick={() => setStep('intro')}
                className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">Senaryo {currentScenarioIdx + 1} / {SCENARIOS.length}</span>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em]">{currentScenario.title}</h2>
                <h3 className="text-3xl font-black text-white italic">"{currentScenario.situation}"</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currentScenario.glasses.map((glass) => (
                  <button
                    key={glass.id}
                    onClick={() => setSelectedGlass(glass.id)}
                    className={`relative p-6 rounded-3xl border transition-all duration-500 flex flex-col items-center gap-4 text-center ${
                      selectedGlass === glass.id 
                        ? 'bg-white/10 border-cyan-500/50 scale-105 shadow-2xl shadow-cyan-500/10' 
                        : 'bg-white/5 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${glass.bg} ${glass.color} border border-white/5`}>
                      <glass.icon size={24} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${glass.color}`}>
                      {glass.label}
                    </span>
                    {selectedGlass === glass.id && (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm font-medium text-slate-300 leading-relaxed italic"
                      >
                        "{glass.text}"
                      </motion.p>
                    )}
                  </button>
                ))}
              </div>

              {selectedGlass && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-center"
                >
                  <button
                    onClick={handleNext}
                    className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-cyan-500/20"
                  >
                    {currentScenarioIdx < SCENARIOS.length - 1 ? 'Sıradaki Senaryo' : 'Analizi Tamamla'} <ChevronRight size={18} />
                  </button>
                </motion.div>
              )}
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
              <Loader2 size={64} className="text-cyan-500 animate-spin" />
              <div className="absolute inset-0 blur-2xl bg-cyan-500/20 animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">Bakış Açın Güncelleniyor...</h3>
              <p className="text-slate-400 font-medium">Bilişsel çerçevelerini AI uzmanımız analiz ediyor.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
