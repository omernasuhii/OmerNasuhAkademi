import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Brain, ChevronRight, BookOpen, Clock, ArrowLeft, Loader2, Sparkles, CheckCircle2, ShieldAlert, Target, Search, Scale } from 'lucide-react';
import { analysisService } from '../../../services/analysisService';
import { useAuth } from '../../../lib/AuthContext';

const SECTIONS = [
  {
    id: 1,
    title: "YA HEP YA HİÇ (Siyah-Beyaz Düşünme)",
    questions: [
      { id: 1, text: "Bir denemede istediğim neti yapamazsam, o günkü tüm çalışmam boşa gitmiş sayılır." },
      { id: 2, text: "İlk 1000'e giremezsem, sınavı kazanmamın hiçbir anlamı yok." },
      { id: 3, text: "Konunun en ufak bir yerini anlamadıysam, \"Ben bu dersi bilmiyorum\" derim." }
    ]
  },
  {
    id: 2,
    title: "FELAKETLEŞTİRME (Kahinlik)",
    questions: [
      { id: 4, text: "Sınavda kesinlikle elim ayağım titreyacak ve her şeyi unutacağım." },
      { id: 5, text: "Bu konuyu şimdi anlamadıysam, sınavda da yapamayacağım ve üniversiteyi kazanamayacağım." },
      { id: 6, text: "Hoca bana soru sorduğunda bilemezsem herkese rezil olurum." }
    ]
  },
  {
    id: 3,
    title: "ZİHİN OKUMA (Niyet Okuma)",
    questions: [
      { id: 7, text: "Düşük not aldığımda öğretmenimin veya ailemin içinden \"Ne kadar tembel\" dediğini hissederim." },
      { id: 8, text: "Arkadaşlarım benden daha başarılı, kesin bana acıyarak bakıyorlar." },
      { id: 9, text: "Soru sorarsam herkesin benimle dalga geçeceğini düşünüyorum." }
    ]
  },
  {
    id: 4,
    title: "ETİKETLEME (Kendine Hakaret)",
    questions: [
      { id: 10, text: "Bir hata yaptığımda kendime \"Ne kadar aptalım/sakarım\" derim." },
      { id: 11, text: "Ben \"sayısalcı kafasına\" sahip değilim, o yüzden asla yapamam." },
      { id: 12, text: "Ben \"iradesiz\" biriyim, asla düzenli çalışamam." }
    ]
  },
  {
    id: 5,
    title: "-MELİ / -MALI (Zorunluluklar)",
    questions: [
      { id: 13, text: "Her zaman en yüksek notu almalıyım, hata yapma lüksüm yok." },
      { id: 14, text: "Ailemi asla hayal kırıklığına uğratmamalıyım." },
      { id: 15, text: "Hiç yorulmadan, robot gibi ders çalışmalıyım." }
    ]
  }
];

export default function ZsOdoAnaliz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'quiz' | 'loading'>('intro');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  const flatQuestions = SECTIONS.flatMap(s => s.questions);

  const handleChoice = (value: number) => {
    setAnswers(prev => ({ ...prev, [flatQuestions[currentQuestionIdx].id]: value }));
    if (currentQuestionIdx < flatQuestions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const calculateResults = () => {
    const scores = {
      allOrNothing: (answers[1] || 0) + (answers[2] || 0) + (answers[3] || 0),
      catastrophizing: (answers[4] || 0) + (answers[5] || 0) + (answers[6] || 0),
      mindReading: (answers[7] || 0) + (answers[8] || 0) + (answers[9] || 0),
      labeling: (answers[10] || 0) + (answers[11] || 0) + (answers[12] || 0),
      musts: (answers[13] || 0) + (answers[14] || 0) + (answers[15] || 0)
    };

    const max = Math.max(...Object.values(scores));
    let dominantType = "";
    if (scores.allOrNothing === max) dominantType = "Ya Hep Ya Hiç";
    else if (scores.catastrophizing === max) dominantType = "Felaketleştirme";
    else if (scores.mindReading === max) dominantType = "Zihin Okuma";
    else if (scores.labeling === max) dominantType = "Etiketleme";
    else dominantType = "-Meli / -Malı";

    return { scores, dominantType };
  };

  const handleFinish = async () => {
    if (!user) return;
    setStep('loading');
    setLoading(true);

    try {
      const results = calculateResults();
      const result = await analysisService.saveResult(user.uid, 'ZS-ODÖ', {
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

  const currentSection = SECTIONS.find(s => s.questions.some(q => q.id === flatQuestions[currentQuestionIdx].id));

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
            <div className="w-20 h-20 bg-rose-600/20 rounded-3xl flex items-center justify-center text-rose-500 mx-auto shadow-xl border border-rose-600/20">
              <ShieldAlert size={40} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white tracking-tight">ZS-ODÖ: Zihinsel Sabotaj Analizi</h1>
              <p className="text-xl text-slate-400 font-medium">Seni durduran otomatik düşünceleri ve bilişsel çarpıtmaları temizle.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-rose-500 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} /> Amaç
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Akademik performansı sabote eden zihinsel tuzakları tespit etmek.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-blue-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Scale size={14} /> Kurumsal Dayanak
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Bilişsel Davranışçı Terapi (BDT) ilkelerine dayanır.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-amber-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Search size={14} /> Yöntem
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Otomatik olumsuz düşüncelerin frekans analizi.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('quiz')}
              className="group relative px-12 py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-lg transition-all duration-300 shadow-2xl shadow-rose-600/20 overflow-hidden"
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
              <div className="flex gap-1.5 overflow-hidden max-w-[200px] sm:max-w-none">
                {flatQuestions.map((_, i) => (
                  <div 
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 flex-shrink-0 ${
                      i === currentQuestionIdx ? 'w-8 bg-rose-500' : 
                      i < currentQuestionIdx ? 'w-4 bg-rose-500/40' : 'w-4 bg-white/5'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-black text-rose-500 uppercase tracking-widest">{currentQuestionIdx + 1} / {flatQuestions.length}</span>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 space-y-12">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-rose-500">
                  <Brain size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{currentSection?.title}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  {flatQuestions[currentQuestionIdx].text}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: 1, label: "Asla" },
                  { value: 2, label: "Nadiren" },
                  { value: 3, label: "Bazen" },
                  { value: 4, label: "Sık Sık" },
                  { value: 5, label: "Her Zaman" }
                ].map((choice) => (
                  <button
                    key={choice.value}
                    onClick={() => handleChoice(choice.value)}
                    className="group flex items-center justify-between p-6 bg-white/5 hover:bg-rose-600/10 border border-white/5 hover:border-rose-500/30 rounded-3xl transition-all duration-300"
                  >
                    <span className="text-lg font-bold text-slate-300 group-hover:text-white">{choice.label}</span>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      choice.value >= 4 ? 'border-rose-500/30 text-rose-500' : 'border-slate-700 text-slate-600'
                    }`}>
                      {choice.value}
                    </div>
                  </button>
                ))}
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
              <h3 className="text-2xl font-black text-white">Zihinsel Virüsler Temizleniyor...</h3>
              <p className="text-slate-400 font-medium">Bilişsel çarpıtmaların analiz ediliyor ve panzehirler hazırlanıyor.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
