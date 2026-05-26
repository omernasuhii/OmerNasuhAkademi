import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, ChevronRight, Brain, BookOpen, Clock, ArrowLeft, Loader2, Sparkles, CheckCircle2, ShieldCheck, Target, Search, Scale, Users, Heart, Star, AlertCircle } from 'lucide-react';
import { analysisService } from '../../../services/analysisService';
import { useAuth } from '../../../lib/AuthContext';

const SECTIONS = [
  {
    id: 'BÖLÜM A',
    title: 'AKADEMİK DİSİPLİN VE SORUMLULUK',
    questions: [
      { id: 1, text: "Çocuğum, biz hatırlatmadan kendi isteğiyle çalışma masasına oturur." },
      { id: 2, text: "Ders çalışma sürelerini verimli kullandığını (gerçekten odaklandığını) düşünüyorum." },
      { id: 3, text: "Okul veya dershane ödevlerini zamanında ve eksiksiz yapar." },
      { id: 4, text: "Çözemediği sorular veya anlamadığı konular için çaba gösterir, pes etmez." },
      { id: 5, text: "Teknoloji kullanımı (telefon, bilgisayar), ders başarısını olumsuz etkilemiyor." },
      { id: 6, text: "Geleceği ve hedefleri konusunda net bir plana sahip görünüyor." },
      { id: 7, text: "Deneme sınavı sonuçlarını bizimle dürüstçe paylaşır, saklamaz." }
    ]
  },
  {
    id: 'BÖLÜM B',
    title: 'DUYGUSAL DURUM VE DAYANIKLILIK',
    questions: [
      { id: 8, text: "Çocuğumun sınav veya gelecek kaygısını yönetebildiğini düşünüyorum (Aşırı panik yapmaz)." },
      { id: 9, text: "Başarısız olduğunda (düşük not aldığında) çabuk toparlanır, moralini bozmaz." },
      { id: 10, text: "Evde genel olarak mutlu ve huzurlu bir ruh hali içindedir." },
      { id: 11, text: "Kendine güveni yerindedir, \"Ben yapabilirim\" inancını taşır." },
      { id: 12, text: "Eleştiriye açıktır; hataları söylendiğinde savunmaya geçmez, dinler." },
      { id: 13, text: "Sınav sürecinde öfke patlamaları veya içe kapanma gibi davranışlar sergilemez." },
      { id: 14, text: "Bizimle iletişimi kuvvetlidir, duygularını ve sorunlarını paylaşır." }
    ]
  },
  {
    id: 'BÖLÜM C',
    title: 'YAŞAM BECERİLERİ (Uyku, Düzen, Sosyal)',
    questions: [
      { id: 15, text: "Uyku düzenine (yatış-kalkış saatleri) dikkat eder." },
      { id: 16, text: "Beslenme alışkanlıkları düzenli ve sağlıklıdır." },
      { id: 17, text: "Odasını ve çalışma masasını düzenli tutar." },
      { id: 18, text: "Arkadaş ilişkileri dengelidir; sosyallik derslerini engellemez." },
      { id: 19, text: "Sorumluluklarını (kendi işlerini) biz söylemeden yerine getirir." },
      { id: 20, text: "Sabahları okula/dershaneye gitmek için kolay uyanır ve isteklidir." }
    ]
  }
];

export default function VgfEAnaliz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'quiz' | 'feedback' | 'loading'>('intro');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState({
    strongTrait: "",
    biggestFear: "",
    expectation: ""
  });
  const [loading, setLoading] = useState(false);

  const flatQuestions = SECTIONS.flatMap(s => s.questions);

  const handleChoice = (value: number) => {
    setAnswers(prev => ({ ...prev, [flatQuestions[currentQuestionIdx].id]: value }));
    if (currentQuestionIdx < flatQuestions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setStep('feedback');
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setStep('loading');
    setLoading(true);

    try {
      const result = await analysisService.saveResult(user.uid, 'VGF-E', {
        answers,
        feedback,
        totalScore: Object.values(answers).reduce((a, b) => a + b, 0)
      });

      if (result?.id) {
        navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`);
      }
    } catch (error: any) {
      alert("Hata: " + error.message);
      setStep('feedback');
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
            <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto shadow-xl border border-emerald-500/20">
              <Users size={40} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white tracking-tight">VGF-E: Veli Gözlem ve Farkındalık Envanteri</h1>
              <p className="text-xl text-slate-400 font-medium">Ebeveynlerin gözünden çocuklarının akademik ve duygusal durumunu analiz edin.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-emerald-500 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} /> Amaç
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Velinin, öğrencisinin çalışma alışkanlıkları ve stres yönetimi hakkındaki gözlemlerini sayısallaştırmak.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-blue-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Brain size={14} /> Kurumsal Dayanak
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">360 Derece Değerlendirme ve Aile Sistemleri Teorisi.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-amber-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Search size={14} /> Yöntem
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">20 maddelik likert ölçeği ve açık uçlu geribildirim soruları.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('quiz')}
              className="group relative px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg transition-all duration-300 shadow-2xl shadow-emerald-500/20 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Envanteri Başlat <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
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
              <div className="flex gap-1 overflow-hidden max-w-[200px] sm:max-w-none">
                {flatQuestions.map((_, i) => (
                  <div 
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 flex-shrink-0 ${
                      i === currentQuestionIdx ? 'w-8 bg-emerald-500' : 
                      i < currentQuestionIdx ? 'w-4 bg-emerald-500/40' : 'w-4 bg-white/5'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">{currentQuestionIdx + 1} / {flatQuestions.length}</span>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 space-y-12">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-500">
                  <ShieldCheck size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest italic">{currentSection?.title}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  {flatQuestions[currentQuestionIdx].text}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: 1, label: "Kesinlikle Katılmıyorum" },
                  { value: 2, label: "Katılmıyorum" },
                  { value: 3, label: "Kararsızım" },
                  { value: 4, label: "Katılıyorum" },
                  { value: 5, label: "Kesinlikle Katılıyorum" }
                ].map((choice) => (
                  <button
                    key={choice.value}
                    onClick={() => handleChoice(choice.value)}
                    className="group flex items-center justify-between p-6 bg-white/5 hover:bg-emerald-600/10 border border-white/5 hover:border-emerald-500/30 rounded-3xl transition-all duration-300"
                  >
                    <span className="text-lg font-bold text-slate-300 group-hover:text-white">{choice.label}</span>
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center font-black text-slate-500 group-hover:text-emerald-400 group-hover:border-emerald-500/30">
                      {choice.value}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 'feedback' && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 space-y-12">
               <div className="text-center space-y-4">
                  <Star size={48} className="text-amber-400 mx-auto" />
                  <h2 className="text-3xl font-black text-white italic">Açık Uçlu Gözlemler (Koçluk Notu)</h2>
                  <p className="text-slate-400 font-medium">Bu bölüm dürüstlükle doldurulduğunda en doğru reçeteyi yazmamızı sağlar.</p>
               </div>

               <div className="space-y-6">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block italic flex items-center gap-2">
                        <Star size={12} /> Çocuğunuzun en güçlü bulduğunuz özelliği nedir?
                     </label>
                     <textarea
                        value={feedback.strongTrait}
                        onChange={(e) => setFeedback(prev => ({ ...prev, strongTrait: e.target.value }))}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white focus:ring-1 focus:ring-emerald-500 min-h-[100px] font-medium"
                        placeholder="Onu ne motive eder?"
                     />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest block italic flex items-center gap-2">
                        <AlertCircle size={12} /> En büyük korkunuz veya endişeniz nedir?
                     </label>
                     <textarea
                        value={feedback.biggestFear}
                        onChange={(e) => setFeedback(prev => ({ ...prev, biggestFear: e.target.value }))}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white focus:ring-1 focus:ring-rose-500 min-h-[100px] font-medium"
                        placeholder="Bu sınav süreciyle ilgili endişeleriniz..."
                     />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest block italic flex items-center gap-2">
                        <Target size={12} /> Bir Koç olarak bizden temel beklentiniz nedir?
                     </label>
                     <textarea
                        value={feedback.expectation}
                        onChange={(e) => setFeedback(prev => ({ ...prev, expectation: e.target.value }))}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white focus:ring-1 focus:ring-blue-500 min-h-[100px] font-medium"
                        placeholder="Net artışı mı, disiplin mi, motivasyon mu?"
                     />
                  </div>
               </div>

               <button
                 onClick={handleFinish}
                 className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-xl transition-all shadow-2xl shadow-emerald-600/30 uppercase tracking-widest"
               >
                 Tüm Verileri Kaydet ve Analizi Bitir
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
              <Loader2 size={64} className="text-emerald-500 animate-spin" />
              <div className="absolute inset-0 blur-2xl bg-emerald-500/20 animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">Aile Dinamikleri Analiz Ediliyor...</h3>
              <p className="text-slate-400 font-medium">Veli ve öğrenci perspektifleri karşılaştırmalı olarak sentezleniyor.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
