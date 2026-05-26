import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, ChevronRight, ChevronLeft, Save, AlertCircle, CheckCircle2, Target, History, Zap, Info } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';

const sections = [
  { id: 'future', title: 'Bölüm A: Umutsuzluk ve Çaresizlik', icon: History, color: 'text-red-400' },
  { id: 'cognitive', title: 'Bölüm B: Bilişsel Çarpıtmalar', icon: Zap, color: 'text-amber-400' },
  { id: 'resilience', title: 'Bölüm C: Olumlu Gelecek (Dayanıklılık)', icon: Target, color: 'text-emerald-400' }
];

const questions = [
  // SECTION A: UMUTSUZLUK (1-7)
  { id: 1, text: 'Geleceğe baktığımda karanlık ve belirsiz bir tablodan başka bir şey göremiyorum.', section: 'future', reverse: false },
  { id: 2, text: 'Ne kadar çalışırsam çalışayım, istediğim sonucu asla alamayacağıma inanıyorum.', section: 'future', reverse: false },
  { id: 3, text: 'Benim dışımdaki herkesin benden daha şanslı ve başarılı olduğunu düşünüyorum.', section: 'future', reverse: false },
  { id: 4, text: 'Hayallerime ulaşmak benim için imkansız görünüyor, boşuna kürek çekiyorum.', section: 'future', reverse: false },
  { id: 5, text: 'Sınavdan sonra hayatımın daha iyi olacağına dair hiçbir umudum yok.', section: 'future', reverse: false },
  { id: 6, text: 'Zaman geçtikçe konular yetişmeyecek ve ben başarısız olacağım hissi artıyor.', section: 'future', reverse: false },
  { id: 7, text: 'Çevremdekilerin bana olan inancı boşa çıkacak ve onları hayal kırıklığına uğratacağım.', section: 'future', reverse: false },

  // SECTION B: BİLİŞSEL ÇARPITMALAR (8-15)
  { id: 8, text: 'Eğer hedeflediğim sonucu alamazsam hayatım tamamen mahvolur.', section: 'cognitive', reverse: false },
  { id: 9, text: 'Bir denemede başarısız olursam, bu benim tamamen yetersiz biri olduğumu gösterir.', section: 'cognitive', reverse: false },
  { id: 10, text: 'Sınav anında kesinlikle elim ayağım birbirine dolaşacak ve her şeyi batıracağım.', section: 'cognitive', reverse: false },
  { id: 11, text: 'Kazanamazsam ailemin yüzüne bakamam, toplumda rezil olurum.', section: 'cognitive', reverse: false },
  { id: 12, text: 'Öğretmenlerimin ve arkadaşlarımın içten içe "Bu çocuk yapamaz" dediğini biliyorum.', section: 'cognitive', reverse: false },
  { id: 13, text: 'Matematikte bir konuyu anlamadıysam, diğerlerini de asla anlayamayacağım demektir.', section: 'cognitive', reverse: false },
  { id: 14, text: 'Kendimi başarısız hissediyorum, demek ki ben başarısız biriyim.', section: 'cognitive', reverse: false },
  { id: 15, text: 'Ben "tembel" veya "kapasitesiz" biriyim, bu benim karakterim.', section: 'cognitive', reverse: false },

  // SECTION C: OLUMLU GELECEK (16-20)
  { id: 16, text: 'Başarısız olsam bile hayatımda mutlu olabileceğim başka yollar bulabilirim.', section: 'resilience', reverse: true },
  { id: 17, text: 'Gelecek için beni heyecanlandıran planlarım var.', section: 'resilience', reverse: true },
  { id: 18, text: 'Yeterince çabalarsam durumumu değiştirebileceğime inanıyorum.', section: 'resilience', reverse: true },
  { id: 19, text: 'Zorluklar karşısında pes etmek yerine çözüm ararım.', section: 'resilience', reverse: true },
  { id: 20, text: 'Kendimi geliştirebilecek güce sahibim.', section: 'resilience', reverse: true }
];

export default function AgMotAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const calculateResults = () => {
    let totalScore = 0;
    questions.forEach(q => {
      const val = answers[q.id] || 3;
      const score = q.reverse ? (6 - val) : val;
      totalScore += score;
    });

    let riskLevel = 'Düşük';
    let riskColor = 'text-emerald-400';
    if (totalScore >= 70) {
      riskLevel = 'Yüksek / Kritik';
      riskColor = 'text-red-500';
    } else if (totalScore >= 46) {
      riskLevel = 'Orta';
      riskColor = 'text-amber-400';
    }

    return { totalScore, riskLevel, riskColor };
  };

  const handleSave = async () => {
    if (!user) return;
    const allAnswered = questions.every(q => answers[q.id]);
    if (!allAnswered) {
      alert('Lütfen tüm soruları yanıtlayın.');
      return;
    }

    setLoading(true);
    try {
      const results = calculateResults();
      await analysisService.saveResult(user.uid, 'AG-MOT', {
        answers,
        ...results
      });
      setCompleted(true);
      setTimeout(() => navigate('/panel/ogrenci/analizler'), 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white">Analiz Tamamlandı!</h2>
          <p className="text-slate-400 font-medium">Bilişsel haritan sistemine kaydedildi. ON Asistan senin için özel bir rapor hazırlıyor...</p>
        </div>
      </div>
    );
  }

  if (showIntro) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
        <header className="space-y-4">
          <button 
            onClick={() => navigate('/panel/ogrenci/analizler')}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <ChevronLeft size={16} />
            Laboratuvara Dön
          </button>
          <h1 className="text-4xl font-black text-white italic">AKADEMİK GELECEK VE MOTİVASYON BLOKAJLARI (AG-MOT)</h1>
        </header>

        <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <Target size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Analiz Amacı</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  Bu ölçek, geleceğe dair karamsarlık düzeyini, sınava yüklediğin hayati anlamı ve motivasyonunu düşüren hatalı düşünce kalıplarını (bilişsel çarpıtmaları) tespit etmeyi amaçlar.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Brain size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Bilimsel Temel</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  Aaron Beck’in <strong>Umutsuzluk Ölçeği</strong> ve David Burns’ün <strong>Bilişsel Çarpıtmalar</strong> kuramı üzerine inşa edilmiştir. "Düşünceler duyguları, duygular da davranışları yönetir" prensibini temel alır.
                </p>
              </div>
            </div>

            <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl space-y-3 shadow-lg shadow-amber-500/5">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertCircle size={18} />
                <h4 className="text-sm font-black uppercase tracking-widest">Bilimsel Uyarı</h4>
              </div>
              <p className="text-xs text-amber-200/70 leading-relaxed font-medium">
                Bu ölçek akademik motivasyonu ölçer, <strong>klinik bir depresyon teşhis aracı değildir.</strong> Eğer yoğun umutsuzluk ve kendine zarar verme düşüncelerin varsa lütfen acilen bir uzmana başvur.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <button
              onClick={() => setShowIntro(false)}
              className="w-full md:w-auto px-12 py-5 bg-red-600 hover:bg-red-500 text-white rounded-3xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-red-600/20 flex items-center justify-center gap-3"
            >
              Cevaplamaya Başla
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentSection = sections[currentStep];
  const sectionQuestions = questions.filter(q => q.section === currentSection.id);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="space-y-4">
        <button 
          onClick={() => setShowIntro(true)}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <ChevronLeft size={16} />
          Tanıtıma Dön
        </button>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest">
            <Sparkles size={12} />
            AG-MOT ANALİZİ
          </div>
          <h1 className="text-3xl font-black text-white">Gelecek Beklentisi ve Motivasyon</h1>
        </div>
      </header>

      <div className="flex gap-2">
        {sections.map((_, idx) => (
          <div 
            key={idx} 
            className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
              idx <= currentStep ? 'bg-red-500' : 'bg-white/5'
            }`} 
          />
        ))}
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-12"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${currentSection.color}`}>
                <currentSection.icon size={24} />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white tracking-tight">{currentSection.title}</h2>
                <p className="text-slate-500 text-sm font-medium">Bilişsel çarpıtmalarını fark etmek için dürüst ol.</p>
              </div>
            </div>

            <div className="space-y-10">
              {sectionQuestions.map((q, idx) => (
                <div key={q.id} className="space-y-6">
                  <div className="flex gap-4">
                    <span className="text-lg font-black text-slate-700 italic">{(currentStep === 0 ? 0 : currentStep === 1 ? 7 : 15) + idx + 1}.</span>
                    <p className="text-lg text-slate-200 font-medium leading-normal">{q.text}</p>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() => handleAnswer(q.id, val)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300 ${
                          answers[q.id] === val 
                            ? 'bg-red-600 border-red-400 text-white scale-105 shadow-lg shadow-red-600/20' 
                            : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-lg font-black">{val}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-center">
                          {val === 1 ? 'Hiç' : val === 5 ? 'Tam' : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-10 flex border-t border-white/5 justify-between">
              <button
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all ${
                  currentStep === 0 ? 'opacity-0' : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10'
                }`}
              >
                <ChevronLeft size={20} />
                Geri
              </button>

              {currentStep < sections.length - 1 ? (
                <button
                  onClick={() => {
                    const sectionAllAnswered = sectionQuestions.every(q => answers[q.id]);
                    if (sectionAllAnswered) {
                      setCurrentStep(prev => prev + 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      alert('Lütfen tüm soruları yanıtlayın.');
                    }
                  }}
                  className="flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-600/20 transition-all hover:scale-105"
                >
                  Devam Et
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-3 px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 disabled:opacity-50"
                >
                  {loading ? 'Hesaplanıyor...' : 'Analizi Kaydet'}
                  <Save size={20} />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
