import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ChevronRight, Brain, BookOpen, Clock, ArrowLeft, Loader2, Sparkles, CheckCircle2, Target, Search, Scale, AlertTriangle, Monitor, RotateCcw } from 'lucide-react';
import { analysisService } from '../../../services/analysisService';
import { useAuth } from '../../../lib/AuthContext';

const HATA_TIPLERI = [
  {
    id: 'KATEGORI_A',
    title: 'BİLGİ EKSİKLİĞİ (Donanım Hatası)',
    items: [
      { id: 'B1', text: "Konu Eksiği: Konuyu hiç bilmiyorum veya çalışmadım." },
      { id: 'B2', text: "Eksik Öğrenme: Çalıştım ama detayı hatırlayamadım / Formülü karıştırdım." },
      { id: 'B3', text: "Kavram Yanılgısı: Doğru bildiğim şey aslında yanlışmış." }
    ]
  },
  {
    id: 'KATEGORI_B',
    title: 'OKUMA VE YORUMLAMA HATASI (Yazılım Hatası)',
    items: [
      { id: 'O1', text: "Soru Kökü Körlüğü: \"Değildir, Olamaz, Yoktur\" ifadesini olumlu okudum." },
      { id: 'O2', text: "Kelime Atlama: \"Sadece, Daima, En Az\" gibi kısıtlayıcı kelimeleri görmedim." },
      { id: 'O3', text: "Şıkkı Tamamlamama: A şıkkını doğru sanıp işaretledim, D şıkkını okumadım." },
      { id: 'O4', text: "Görsel Yorumlama: Grafiğin eksenlerini veya tablonun başlığını yanlış okudum." }
    ]
  },
  {
    id: 'KATEGORI_C',
    title: 'DİKKAT VE İŞLEM HATASI (İşlemci Hatası)',
    items: [
      { id: 'D1', text: "İşlem Hatası: Dört işlem, işaret hatası, sayıları yanlış geçirme." },
      { id: 'D2', text: "Odak Kaybı: O an aklım başka yere gitti, sorudan koptum." },
      { id: 'D3', text: "Kodlama Hatası: Kitapçıkta doğru, optikte yanlış işaretledim." }
    ]
  },
  {
    id: 'KATEGORI_D',
    title: 'STRATEJİ VE ZAMANLAMA (Yönetim Hatası)',
    items: [
      { id: 'S1', text: "İnatlaşma: Bu soruya çok zaman ayırdım, beynim yandı." },
      { id: 'S2', text: "Turlama Yapmama: Zor soruyla boğuşurken kolay soruları göremedim." },
      { id: 'S3', text: "Boş Bırakamama: Fikrim yoktu ama salladım." }
    ]
  }
];

export default function ScmAnaliz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'quiz' | 'loading'>('intro');
  const [currentCategoryIdx, setCurrentCategoryIdx] = useState(0);
  const [tallies, setTallies] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const handleTally = (id: string, delta: number) => {
    setTallies(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta)
    }));
  };

  const handleFinish = async () => {
    if (!user) return;
    setStep('loading');
    setLoading(true);

    try {
      const result = await analysisService.saveResult(user.uid, 'SCM', {
        tallies
      });

      if (result?.id) {
        navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`);
      }
    } catch (error: any) {
      alert("Hata: " + error.message);
      setStep('quiz');
    } finally {
      setLoading(false);
    }
  };

  const currentCategory = HATA_TIPLERI[currentCategoryIdx];

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
            <div className="w-20 h-20 bg-amber-500/20 rounded-3xl flex items-center justify-center text-amber-500 mx-auto shadow-xl border border-amber-500/20">
              <ShieldCheck size={40} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white tracking-tight">SÇM: Sınav Check-Up Modülü</h1>
              <p className="text-xl text-slate-400 font-medium">Hatalarının kök nedenini analiz et: Bilgi mi, Dikkat mi, Strateji mi?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-amber-500 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} /> Amaç
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Hatalı şıkkı değil, onu doğuran asıl sebebi bulmak.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-blue-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Search size={14} /> Kurumsal Dayanak
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Kök Neden Analizi (Root Cause Analysis) prensibi.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-indigo-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <RotateCcw size={14} /> Yöntem
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Sanal sınav otopsisi ve hata taksonomisi.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('quiz')}
              className="group relative px-12 py-5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black text-lg transition-all duration-300 shadow-2xl shadow-amber-600/20 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Check-Up'ı Başlat <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        )}

        {step === 'quiz' && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between px-2 text-amber-500 font-black text-xs uppercase tracking-widest">
              <span>BÖLÜM {currentCategoryIdx + 1} / {HATA_TIPLERI.length}</span>
              <span className="text-slate-500 italic">Lütfen son denemendeki yanlışlarını işaretle</span>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 space-y-12">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white">{currentCategory.title}</h2>
                <div className="h-1.5 w-24 bg-amber-500 rounded-full" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {currentCategory.items.map((item) => (
                  <div 
                    key={item.id}
                    className="flex flex-col sm:flex-row items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl gap-4 hover:border-amber-500/30 transition-all duration-500"
                  >
                    <div className="flex-1 space-y-1">
                       <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{item.id}</span>
                       <p className="text-lg font-bold text-slate-300">{item.text}</p>
                    </div>
                    <div className="flex items-center gap-4 bg-black/20 p-2 rounded-2xl border border-white/5">
                      <button 
                        onClick={() => handleTally(item.id, -1)}
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all flex items-center justify-center font-black"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-2xl font-black text-white">
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
                  disabled={currentCategoryIdx === 0}
                  onClick={() => setCurrentCategoryIdx(prev => prev - 1)}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl font-bold transition-all disabled:opacity-0"
                >
                  Geri
                </button>
                <button
                  onClick={() => {
                    if (currentCategoryIdx < HATA_TIPLERI.length - 1) {
                      setCurrentCategoryIdx(prev => prev + 1);
                    } else {
                      handleFinish();
                    }
                  }}
                  className="px-10 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-amber-500/20 flex items-center gap-2"
                >
                  {currentCategoryIdx < HATA_TIPLERI.length - 1 ? 'Sıradaki Kategori' : 'Analizi Bitir'} <ChevronRight size={18} />
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
              <Loader2 size={64} className="text-amber-500 animate-spin" />
              <div className="absolute inset-0 blur-2xl bg-amber-500/20 animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">Sanal Otopsi Yapılıyor...</h3>
              <p className="text-slate-400 font-medium">Hata DNA'n analiz ediliyor ve özel reçeten hazırlanıyor.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
