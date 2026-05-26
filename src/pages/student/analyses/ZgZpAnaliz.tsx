import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronRight, Brain, BookOpen, Clock, ArrowLeft, Loader2, Sparkles, CheckCircle2, ShieldCheck, Target, Search, Scale, AlertTriangle, Monitor, RotateCcw, PenTool, Eye, LineChart, HeartPulse, GraduationCap, Zap, Activity, ShieldAlert, Flag } from 'lucide-react';
import { analysisService } from '../../../services/analysisService';
import { useAuth } from '../../../lib/AuthContext';

const PLAN_STEPS = [
  {
    id: 'step1',
    title: 'SINAV HAFTASI (Son 7 Gün)',
    items: [
      "Yeni ve zor konu öğrenmek YASAK. Sadece MEB ve formül tekrarı.",
      "Her sabah sınav saatinde kalk (Jet-lag önleme).",
      "Dışarıdan yemek yeme (Zehirlenme riski).",
      "Sosyal Detoks: Felaket tellallarından uzak dur."
    ]
  },
  {
    id: 'step2',
    title: 'SON GECE RİTÜELİ',
    items: [
      "Çantayı hazırla (Giriş belgesi, kimlik, su).",
      "Elbiseni hazırla (Yeni kıyafet giyme).",
      "Uyku Stratejisi: Uykun gelince yat, zorlama.",
      "Kriz: Eğer uyuyamazsan panik yapma, gözlerini kapatmak bile dinlendirir."
    ]
  },
  {
    id: 'step3',
    title: 'BÜYÜK GÜN: SINAV SABAHI',
    items: [
      "Klasik Kahvaltı: Her zaman yediğin şeyleri ye.",
      "En az 45 dk önce okulda ol.",
      "Cam Fanus: Kimseyle sorular hakkında konuşma.",
      "Mükemmellik Çemberi: Kulaklığını tak ve kendini koltuğunda hayal et."
    ]
  },
  {
    id: 'step4',
    title: 'KRİZ ANLARI (Ne Yapmalı?)',
    items: [
      "Donup kalırsan: Kalemi bırak, 4-7-8 nefesi al, su iç.",
      "3 soru yapamazsan: İnatlaşma, branş değiştir.",
      "Dikkatin dağılırsa: Akıllı Tuş (çıpalama) hareketini yap.",
      "Bitiş: Kaydırma kontrolünü son saniyeye kadar sürdür."
    ]
  }
];

export default function ZgZpAnaliz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'plan' | 'loading'>('intro');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [confirmedItems, setCompletedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (currentIdx < PLAN_STEPS.length - 1) {
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
      const result = await analysisService.saveResult(user.uid, 'ZG-ZP', {
        readSteps: PLAN_STEPS.map(s => s.id)
      });

      if (result?.id) {
        navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`);
      }
    } catch (error: any) {
      alert("Hata: " + error.message);
      setStep('plan');
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
            <div className="w-20 h-20 bg-yellow-500/20 rounded-3xl flex items-center justify-center text-yellow-500 mx-auto shadow-xl border border-yellow-500/20">
              <Trophy size={40} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white tracking-tight">ZG-ZP: Zor Gün Senaryosu ve Zafer Planı</h1>
              <p className="text-xl text-slate-400 font-medium">Sürpriz Yok, Panik Yok, Sadece Plan Var.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-yellow-500 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert size={14} /> Amaç
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Sınav günü yaşanabilecek olası krizleri (uykusuzluk, panik) önceden senaryolaştırmak.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-blue-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                   <Flag size={14} /> Kurumsal Dayanak
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Kriz Yönetimi ve Ritüellerin kaygı üzerindeki etkisi.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Zap size={14} /> Yöntem
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Tapering (bakım) haftası ve Zafer Planı onayı.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('plan')}
              className="group relative px-12 py-5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-2xl font-black text-lg transition-all duration-300 shadow-2xl shadow-yellow-500/20 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Zafer Planını Gör <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        )}

        {step === 'plan' && (
          <motion.div
            key="plan"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
             <div className="flex items-center justify-between px-2 text-yellow-500 font-black text-xs uppercase tracking-widest italic">
               <span>STRATEJİ KARTI {currentIdx + 1} / {PLAN_STEPS.length}</span>
               <span className="animate-pulse flex items-center gap-2"><Sparkles size={12}/> PLAN ONAYI BEKLENİYOR</span>
             </div>

             <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 space-y-12">
                <div className="space-y-2">
                   <h2 className="text-3xl font-black text-white italic">{PLAN_STEPS[currentIdx].title}</h2>
                   <div className="h-2 w-32 bg-yellow-500 rounded-full" />
                </div>

                <div className="grid grid-cols-1 gap-4">
                   {PLAN_STEPS[currentIdx].items.map((item, i) => (
                     <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex gap-4 p-6 bg-white/5 border border-white/5 rounded-3xl"
                     >
                        <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 font-black text-xs">
                          {i + 1}
                        </div>
                        <p className="flex-1 text-lg font-bold text-slate-300 italic leading-relaxed">
                          "{item}"
                        </p>
                     </motion.div>
                   ))}
                </div>

                <button 
                  onClick={handleNext}
                  className="w-full py-5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-yellow-500/20 flex items-center justify-center gap-3"
                >
                  {currentIdx < PLAN_STEPS.length - 1 ? 'Sıradaki Bölümü Onayla' : 'Zafer Planını İmzala'} <CheckCircle2 size={24} />
                </button>
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
              <Loader2 size={64} className="text-yellow-500 animate-spin" />
              <div className="absolute inset-0 blur-2xl bg-yellow-500/20 animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">Zafer Planın Hazırlanıyor...</h3>
              <p className="text-slate-400 font-medium">Sürprizlere karşı AI kriz yönetimi stratejileri sentezleniyor.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
