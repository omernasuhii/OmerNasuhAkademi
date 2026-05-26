import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Activity, ChevronRight, Brain, BookOpen, Clock, ArrowLeft, Loader2, Sparkles, CheckCircle2, Flame, Snowflake, Dumbbell } from 'lucide-react';
import { analysisService } from '../../../services/analysisService';
import { useAuth } from '../../../lib/AuthContext';

const QUESTIONS = [
  { id: 1, text: "Stresliyken çok çabuk sinirlenir, etrafa veya kendime kızarım.", type: 'A' },
  { id: 2, text: "Yerimde duramam, sürekli bir şeylerle oynarım (bacak sallama, kalem çevirme).", type: 'A' },
  { id: 3, text: "Zihnim susmaz, düşünceler yarış arabası gibi akar.", type: 'A' },
  { id: 4, text: "Geceleri uykuya dalmakta zorlanırım çünkü hala enerjim vardır.", type: 'A' },
  { id: 5, text: "Stres anında kaslarım gerilir, dişlerimi sıkarım veya yumruk yaparım.", type: 'A' },
  { id: 6, text: "\"Hadi çabuk olalım\" hissiyle sabırsızlanırım.", type: 'A' },
  { id: 7, text: "Stresliyken üzerime bir ağırlık çöker, yataktan çıkmak istemem.", type: 'B' },
  { id: 8, text: "Zihnim \"sisli\" gibidir, odaklanamam, boş bakarım.", type: 'B' },
  { id: 9, text: "Sorunlardan kaçmak için uyurum veya saatlerce telefona/diziye dalarım.", type: 'B' },
  { id: 10, text: "İçimde \"Ne yapsam boş\" hissi oluşur ve eylemsizleşirim (Atalet).", type: 'B' },
  { id: 11, text: "İnsanlardan uzaklaşmak, odama kapanmak ve kimseyle konuşmamak isterim.", type: 'B' },
  { id: 12, text: "Dersin başına otursam bile dakikalarca hiçbir şey yapmadan beklerim.", type: 'B' },
  { id: 13, text: "Stresliyken \"Her şeyi kontrol etmeliyim\" hissine kapılırım.", type: 'C' },
  { id: 14, text: "Başkalarını (ailemi/öğretmenimi) hayal kırıklığına uğratmaktan çok korkarım.", type: 'C' },
  { id: 15, text: "Asla \"Hayır\" diyemem, herkesin yükünü sırtlanırım.", type: 'C' },
  { id: 16, text: "Mükemmel olmazsa hiç yapmamayı tercih ederim (Ya Hep Ya Hiç).", type: 'C' },
  { id: 17, text: "Başım, boynum veya omuzlarım sürekli ağrır (Yük taşıma ağrısı).", type: 'C' },
  { id: 18, text: "Kendi ihtiyaçlarımı yok sayıp, sadece derse odaklanmaya çalışırım.", type: 'C' }
];

export default function SpBeAnaliz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'quiz' | 'loading'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);

  const handleChoice = (value: boolean) => {
    setAnswers(prev => ({ ...prev, [QUESTIONS[currentQuestion].id]: value }));
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const calculateResults = () => {
    const counts = { A: 0, B: 0, C: 0 };
    Object.entries(answers).forEach(([qId, value]) => {
      if (value) {
        const q = QUESTIONS.find(q => q.id === parseInt(qId));
        if (q) {
          counts[q.type as keyof typeof counts]++;
        }
      }
    });

    const max = Math.max(counts.A, counts.B, counts.C);
    let type = "";
    if (counts.A === max) type = "Volkan";
    else if (counts.B === max) type = "Buzdağı";
    else type = "Halterci";

    return { counts, dominantType: type };
  };

  const handleFinish = async () => {
    if (!user) return;
    setStep('loading');
    setLoading(true);

    try {
      const results = calculateResults();
      const result = await analysisService.saveResult(user.uid, 'SP-BE', {
        answers,
        results
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
            <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center text-rose-400 mx-auto shadow-xl border border-rose-500/20">
              <Activity size={40} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white tracking-tight">SP-BE: Stres Profili ve Başa Çıkma</h1>
              <p className="text-xl text-slate-400 font-medium">Stres anındaki baskın tepkini keşfet ve sana özel rahatlama stratejilerini öğren.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-rose-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Brain size={14} /> Amaç
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Stres altındayken gösterilen baskın tepkiyi (Volkan, Buzdağı, Halterci) tespit etmek.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <BookOpen size={14} /> Kurumsal Dayanak
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Walter Cannon'ın Savaş-Kaç ve Porges'un Polivagal teorisine dayanır.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-amber-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Activity size={14} /> Yöntem
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Bilişsel ve fiziksel tepki analizi.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('quiz')}
              className="group relative px-12 py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-lg transition-all duration-300 shadow-2xl shadow-rose-500/20 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Analizi Başlat <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
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
            <div className="flex items-center justify-between px-2">
              <button 
                onClick={() => setStep('intro')}
                className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex gap-1.5">
                {QUESTIONS.map((_, i) => (
                  <div 
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      i === currentQuestion ? 'w-8 bg-rose-500' : 
                      i < currentQuestion ? 'w-4 bg-rose-500/40' : 'w-4 bg-white/5'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-black text-rose-400 uppercase tracking-widest">{currentQuestion + 1} / {QUESTIONS.length}</span>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 space-y-12">
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-rose-400">
                  {QUESTIONS[currentQuestion].type === 'A' && <Flame size={32} />}
                  {QUESTIONS[currentQuestion].type === 'B' && <Snowflake size={32} />}
                  {QUESTIONS[currentQuestion].type === 'C' && <Dumbbell size={32} />}
                  <span className="text-xs font-black uppercase tracking-widest">
                    {QUESTIONS[currentQuestion].type === 'A' ? 'Volkan Tepkisi' : 
                     QUESTIONS[currentQuestion].type === 'B' ? 'Buzdağı Tepkisi' : 'Halterci Tepkisi'}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight underline decoration-rose-500/30 decoration-4 underline-offset-8 transition-all duration-500">
                  {QUESTIONS[currentQuestion].text}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleChoice(true)}
                  className="group flex flex-col items-center justify-center gap-4 p-8 bg-emerald-500/5 hover:bg-emerald-500 border border-emerald-500/10 hover:border-emerald-500 rounded-3xl transition-all duration-500 shadow-xl shadow-emerald-500/0 hover:shadow-emerald-500/20"
                >
                  <CheckCircle2 size={32} className="text-emerald-500 group-hover:text-white transition-colors" />
                  <span className="text-lg font-black text-emerald-500 group-hover:text-white transition-colors uppercase tracking-widest">Evet</span>
                </button>
                <button
                  onClick={() => handleChoice(false)}
                  className="group flex flex-col items-center justify-center gap-4 p-8 bg-rose-500/5 hover:bg-rose-500 border border-rose-500/10 hover:border-rose-500 rounded-3xl transition-all duration-500 shadow-xl shadow-rose-500/0 hover:shadow-rose-500/20"
                >
                  <Activity size={32} className="text-rose-500 group-hover:text-white transition-colors rotate-45" />
                  <span className="text-lg font-black text-rose-500 group-hover:text-white transition-colors uppercase tracking-widest">Hayır</span>
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
              <Loader2 size={64} className="text-rose-500 animate-spin" />
              <div className="absolute inset-0 blur-2xl bg-rose-500/20 animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">Stres Profilin Analiz Ediliyor...</h3>
              <p className="text-slate-400 font-medium">Biyolojik tepki haritan ve antrenman stratejin hazırlanıyor.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
