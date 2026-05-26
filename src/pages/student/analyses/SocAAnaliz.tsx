import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, Brain, Clock, ArrowLeft, Loader2, Sparkles, CheckCircle2, ShieldCheck, Target, Search, Scale, AlertTriangle, Monitor, RotateCcw, PenTool, Eye } from 'lucide-react';
import { analysisService } from '../../../services/analysisService';
import { useAuth } from '../../../lib/AuthContext';

const SUB_DIMENSIONS = [
  {
    id: 'ALT_BOYUT_1',
    title: 'OKUMA HATALARI (Görsel Algı)',
    icon: Eye,
    color: 'text-cyan-400',
    items: [
      { id: 1, text: "Kök Yanılgısı: \"Değildir, Olamaz, Yoktur\" gibi olumsuz soru kökünü olumlu okudum." },
      { id: 2, text: "Kelime Atlama: Soruyu hızlı okurken aradaki kritik bir kelimeyi (daima, sadece, en az vb.) görmedim." },
      { id: 3, text: "Seçenek Körlüğü: Doğru cevabı A veya B şıkkında bulduğumu sanıp, diğer şıkları okumadan işaretledim." },
      { id: 4, text: "Grafik/Tablo Hatası: Grafiğin eksenlerini veya tablonun başlıklarını okumadan doğrudan verilere daldım." },
      { id: 5, text: "Ön Yargılı Okuma: Sorunun başını okuyup \"Ben bunu biliyorum\" diyerek sonunu zihnimde yanlış tamamladım." }
    ]
  },
  {
    id: 'ALT_BOYUT_2',
    title: 'DİKKAT VE İŞLEM HATALARI (Odaklanma)',
    icon: Target,
    color: 'text-rose-400',
    items: [
      { id: 6, text: "İşlem Hatası: Dört işlem hatası (toplama yerine çıkarma vb.) veya işaret hatası (+/-) yaptım." },
      { id: 7, text: "Kodlama Hatası: Kitapçıkta doğru buldum ama optiğe yanlış işaretledim veya kaydırma yaptım." },
      { id: 8, text: "Veri Transfer Hatası: Sorudaki sayıyı kağıdın boş yerine geçirirken yanlış yazdım." },
      { id: 9, text: "Zihinden İşlem: Kalem kullanmak yerine akıldan yapmaya çalışırken basamak hatası yaptım." },
      { id: 10, text: "Son Adım Hatası: Soruyu çözdüm ama benden isteneni (x'i değil x+2'yi) işaretlemeyi unuttum." }
    ]
  },
  {
    id: 'ALT_BOYUT_3',
    title: 'STRATEJİ VE ZAMAN YÖNETİMİ (Yöntem)',
    icon: Clock,
    color: 'text-indigo-400',
    items: [
      { id: 11, text: "Turlama Yapmama: Zor soruyla inatlaştım, yapamayınca moralim bozuldu ve çok zaman harcadım." },
      { id: 12, text: "Geri Dönüş Hatası: Boş bıraktığım soruya dönerken önceki hatalı işlemlerim üzerinden devam ettim." },
      { id: 13, text: "Öncül Eleme: Öncüllü sorularda (I, II, III) emin olduğum öncülü şıklardan eleyerek gitmedim." },
      { id: 14, text: "Kalem Kullanmama: Paragraf sorularında veya uzun problemlerde önemli yerlerin altını çizmedim." },
      { id: 15, text: "Blok Çözüm: Aralıksız çok uzun süre mola vermeden çözdüğüm için zihnim yoruldu." }
    ]
  }
];

export default function SocAAnaliz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'tally' | 'loading'>('intro');
  const [currentDimensionIdx, setCurrentDimensionIdx] = useState(0);
  const [tallies, setTallies] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  const handleTally = (id: number, delta: number) => {
    setTallies(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta)
    }));
  };

  const calculateResults = () => {
    const categories: Record<string, number> = {
      reading: 0,
       attention: 0,
       strategy: 0
    };

    SUB_DIMENSIONS[0].items.forEach(item => categories.reading += (tallies[item.id] || 0));
    SUB_DIMENSIONS[1].items.forEach(item => categories.attention += (tallies[item.id] || 0));
    SUB_DIMENSIONS[2].items.forEach(item => categories.strategy += (tallies[item.id] || 0));

    const total = categories.reading + categories.attention + categories.strategy;
    
    return { categories, total };
  };

  const handleFinish = async () => {
    if (!user) return;
    setStep('loading');
    setLoading(true);

    try {
      const results = calculateResults();
      const result = await analysisService.saveResult(user.uid, 'SOÇ-A', {
        tallies,
        results
      });

      if (result?.id) {
        navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`);
      }
    } catch (error: any) {
      alert("Hata: " + error.message);
      setStep('tally');
    } finally {
      setLoading(false);
    }
  };

  const currentDimension = SUB_DIMENSIONS[currentDimensionIdx];

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
              <PenTool size={40} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white tracking-tight">SOÇ-A: Soru Okuma ve Çözme Stratejileri</h1>
              <p className="text-xl text-slate-400 font-medium">Teknik hatalardan kaynaklanan net kayıplarını sıfırla.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-indigo-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} /> Amaç
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Bilgi eksikliğinden değil, hatalı okuma ve kurgu nedeniyle kaybettiğin netleri tespit etmek.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-blue-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                   <Brain size={14} /> Kurumsal Dayanak
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Üstbilişsel İzleme ve Bilgi İşleme Kuramı (Dikkat-Algı-Kodlama).</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-amber-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Search size={14} /> Yöntem
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Hata tetelemesi ve teknik hata haritası çıkarma.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('tally')}
              className="group relative px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg transition-all duration-300 shadow-2xl shadow-indigo-500/20 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Analizi Başlat <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        )}

        {step === 'tally' && (
          <motion.div
            key="tally"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
             <div className="flex items-center justify-between px-2 text-indigo-400 font-black text-xs uppercase tracking-widest">
              <span>BÖLÜM {currentDimensionIdx + 1} / {SUB_DIMENSIONS.length}</span>
              <span className="text-slate-500 italic">Hatalarının miktarını işaretle</span>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 space-y-12 transition-all duration-500">
               <div className="space-y-4">
                  <div className={`flex items-center gap-4 ${currentDimension.color}`}>
                     <currentDimension.icon size={32} />
                     <h2 className="text-2xl sm:text-3xl font-black text-white">{currentDimension.title}</h2>
                  </div>
                  <div className={`h-1.5 w-24 rounded-full bg-current ${currentDimension.color}`} />
               </div>

               <div className="grid grid-cols-1 gap-4">
                  {currentDimension.items.map((item) => (
                    <div 
                      key={item.id}
                      className="flex flex-col sm:flex-row items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl gap-4 hover:border-indigo-500/30 transition-all duration-500"
                    >
                      <div className="flex-1 space-y-1">
                         <span className={`text-[10px] font-black uppercase tracking-widest ${currentDimension.color}`}>HATA {item.id}</span>
                         <p className="text-lg font-bold text-slate-300 italic">"{item.text}"</p>
                      </div>
                      <div className="flex items-center gap-4 bg-black/20 p-2 rounded-2xl border border-white/5">
                        <button 
                          onClick={() => handleTally(item.id, -1)}
                          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all flex items-center justify-center font-black"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-2xl font-black text-white italic">
                          {tallies[item.id] || 0}
                        </span>
                        <button 
                           onClick={() => handleTally(item.id, 1)}
                           className="w-10 h-10 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-all flex items-center justify-center font-black"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
               </div>

               <div className="flex justify-between items-center pt-8 border-t border-white/5">
                  <button
                    disabled={currentDimensionIdx === 0}
                    onClick={() => setCurrentDimensionIdx(prev => prev - 1)}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl font-bold transition-all disabled:opacity-0"
                  >
                    Geri
                  </button>
                  <button
                    onClick={() => {
                      if (currentDimensionIdx < SUB_DIMENSIONS.length - 1) {
                        setCurrentDimensionIdx(prev => prev + 1);
                      } else {
                        handleFinish();
                      }
                    }}
                    className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-2"
                  >
                    {currentDimensionIdx < SUB_DIMENSIONS.length - 1 ? 'Sıradaki Bölüm' : 'Analizi Bitir'} <ChevronRight size={18} />
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
              <Loader2 size={64} className="text-indigo-500 animate-spin" />
              <div className="absolute inset-0 blur-2xl bg-indigo-500/20 animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">Teknik Hata Haritan Çıkarılıyor...</h3>
              <p className="text-slate-400 font-medium">Bilişsel algı ve strateji kaçakların yapay zeka tarafından analiz ediliyor.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
