import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Puzzle, ChevronRight, Brain, BookOpen, Music, Activity, ArrowLeft, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { analysisService } from '../../../services/analysisService';
import { useAuth } from '../../../lib/AuthContext';

const QUESTIONS = [
  { id: 1, text: "Yeni bir elektronik eşya aldığında onu kullanmayı nasıl öğrenirsin?", choices: [
      { id: 'a', text: "Kullanma kılavuzundaki resimlere ve şemalara bakarım.", type: 'G' },
      { id: 'b', text: "Bilen birine sorarım veya anlatmasını isterim.", type: 'İ' },
      { id: 'c', text: "Doğrudan tuşlarına basarak, kurcalayarak öğrenirim.", type: 'K' }
  ]},
  { id: 2, text: "Sınava çalışırken en çok neyin faydasını görürsün?", choices: [
      { id: 'a', text: "Renkli kalemler, grafikler ve haritalar kullanmanın.", type: 'G' },
      { id: 'b', text: "Konuyu bir arkadaşımla tartışmanın veya sesli tekrar yapmanın.", type: 'İ' },
      { id: 'c', text: "Hareket etmenin, yazarak çalışmanın veya maket/deney yapmanın.", type: 'K' }
  ]},
  { id: 3, text: "Bir roman okurken zihninde ne canlanır?", choices: [
      { id: 'a', text: "Olayların geçtiği yerler ve karakterlerin görüntüleri film gibi akar.", type: 'G' },
      { id: 'b', text: "Karakterlerin konuşmaları ve ses tonları zihnimde yankılanır.", type: 'İ' },
      { id: 'c', text: "Olayın heyecanını, duygusunu ve hareketliliğini hissederim.", type: 'K' }
  ]},
  { id: 4, text: "Yol tarifi alırken hangisini tercih edersin?", choices: [
      { id: 'a', text: "Bir harita çizilmesini veya navigasyon ekranını görmeyi.", type: 'G' },
      { id: 'b', text: "Sözlü olarak anlatılmasını (\"Sağa dön, sonra düz git\" gibi).", type: 'İ' },
      { id: 'c', text: "Beni oraya götürmelerini veya parmakla işaret ederek tarif edilmesini.", type: 'K' }
  ]},
  { id: 5, text: "Boş zamanlarında hangisini yapmaktan daha çok hoşlanırsın?", choices: [
      { id: 'a', text: "Film izlemek, fotoğraf çekmek, resim yapmak.", type: 'G' },
      { id: 'b', text: "Müzik dinlemek, sohbet etmek, podcast dinlemek.", type: 'İ' },
      { id: 'c', text: "Spor yapmak, yürüyüşe çıkmak, bir şeyler tamir etmek/inşa etmek.", type: 'K' }
  ]},
  { id: 6, text: "Bir derste öğretmenin anlattıklarını en iyi nasıl hatırlarsın?", choices: [
      { id: 'a', text: "Tahtaya yazdıklarını veya gösterdiği slaytları hatırlayarak.", type: 'G' },
      { id: 'b', text: "Öğretmenin ses tonunu, vurgularını veya anlattığı bir hikayeyi hatırlayarak.", type: 'İ' },
      { id: 'c', text: "Derste yapılan bir etkinliği veya o sırada tuttuğum notları hatırlayarak.", type: 'K' }
  ]},
  { id: 7, text: "Çoktan seçmeli bir sınavda takıldığında ne yaparsın?", choices: [
      { id: 'a', text: "Soruyu zihnimde canlandırır, şekil varsa ona odaklanırım.", type: 'G' },
      { id: 'b', text: "Soruyu içimden veya fısıldayarak okurum.", type: 'İ' },
      { id: 'c', text: "Kalemle oynarım, bacağımı sallarım veya soruyu elle kapatıp açarım.", type: 'K' }
  ]},
  { id: 8, text: "Bir kelimenin nasıl yazıldığından emin değilsen ne yaparsın?", choices: [
      { id: 'a', text: "Kelimeyi zihnimde fotoğraf gibi görmeye çalışırım.", type: 'G' },
      { id: 'b', text: "Kelimeyi heceleyerek seslendiririm.", type: 'İ' },
      { id: 'c', text: "Elimle havaya veya kağıda yazarım, el alışkanlığıma güvenirim.", type: 'K' }
  ]},
  { id: 9, text: "Hangi tür öğretmen seni daha çok etkiler?", choices: [
      { id: 'a', text: "Ders notları düzenli olan, bol görsel materyal kullanan.", type: 'G' },
      { id: 'b', text: "Hitabeti güçlü olan, ses tonunu iyi kullanan, akıcı konuşan.", type: 'İ' },
      { id: 'c', text: "Öğrenciyi derse katan, laboratuvar/atölye çalışması yaptıran.", type: 'K' }
  ]},
  { id: 10, text: "Bir şeyi ezberlemen gerektiğinde ne yaparsın?", choices: [
      { id: 'a', text: "Post-it'lere yazar, göz önünde bir yere asarım.", type: 'G' },
      { id: 'b', text: "Yüksek sesle tekrar ederim veya şarkı haline getiririm.", type: 'İ' },
      { id: 'c', text: "Odayı turlayarak ezberlerim veya kartlara yazıp karıştırırım.", type: 'K' }
  ]},
  { id: 11, text: "Seni en çok ne rahatsız eder?", choices: [
      { id: 'a', text: "Dağınıklık, karmaşık görüntüler, kötü el yazısı.", type: 'G' },
      { id: 'b', text: "Gürültü, uğultu, arkadan gelen konuşma sesleri.", type: 'İ' },
      { id: 'c', text: "Uzun süre hareketsiz oturmak, rahatsız sandalye.", type: 'K' }
  ]},
  { id: 12, text: "Bir sunum yapacak olsan nasıl hazırlanırsın?", choices: [
      { id: 'a', text: "Güzel bir PowerPoint sunusu ve görseller hazırlarım.", type: 'G' },
      { id: 'b', text: "Ne konuşacağımı prova eder, cümlelerimi seçerim.", type: 'İ' },
      { id: 'c', text: "Kullanacağım materyalleri hazırlar, sahnede nasıl duracağımı planlarım.", type: 'K' }
  ]},
  { id: 13, text: "Birini ilk gördüğünde en çok ne dikkatini çeker?", choices: [
      { id: 'a', text: "Kıyafetı, yüzü, dış görünüşü.", type: 'G' },
      { id: 'b', text: "Ses tonu, konuşma tarzı, ismi.", type: 'İ' },
      { id: 'c', text: "Duruşu, hareketleri, tokalaşması.", type: 'K' }
  ]},
  { id: 14, text: "Karmaşık bir problemi çözerken:", choices: [
      { id: 'a', text: "Problemi şematize ederim, tablo çizerim.", type: 'G' },
      { id: 'b', text: "Problemi kendi kendime konuşarak adım adım çözerim.", type: 'İ' },
      { id: 'c', text: "Parçaları birleştirip ayırarak veya somut nesneler kullanarak çözerim.", type: 'K' }
  ]},
  { id: 15, text: "Hayal kurarken:", choices: [
      { id: 'a', text: "Net görüntüler görürüm.", type: 'G' },
      { id: 'b', text: "Konuşmalar duyarım.", type: 'İ' },
      { id: 'c', text: "Hareket ve hisler yaşarım.", type: 'K' }
  ]}
];

export default function VakAnaliz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'quiz' | 'loading'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChoice = (choiceId: string) => {
    setAnswers(prev => ({ ...prev, [QUESTIONS[currentQuestion].id]: choiceId }));
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const calculateResults = () => {
    const counts = { G: 0, İ: 0, K: 0 };
    Object.entries(answers).forEach(([qId, choiceId]) => {
      const q = QUESTIONS.find(q => q.id === parseInt(qId));
      const choice = q?.choices.find(c => c.id === choiceId);
      if (choice) {
        counts[choice.type as keyof typeof counts]++;
      }
    });

    const max = Math.max(counts.G, counts.İ, counts.K);
    let style = "";
    if (counts.G === max) style = "Görsel";
    else if (counts.İ === max) style = "İşitsel";
    else style = "Kinestetik";

    return { counts, dominantStyle: style };
  };

  const handleFinish = async () => {
    if (!user) return;
    setStep('loading');
    setLoading(true);

    try {
      const results = calculateResults();
      const result = await analysisService.saveResult(user.uid, 'VAK-S', {
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
            <div className="w-20 h-20 bg-indigo-500/20 rounded-3xl flex items-center justify-center text-indigo-400 mx-auto shadow-xl border border-indigo-500/20">
              <Puzzle size={40} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white tracking-tight">VAK-S: Öğrenme Stilleri Envanteri</h1>
              <p className="text-xl text-slate-400 font-medium">Bilgiyi en kolay hangi yolla (Görsel, İşitsel veya Kinestetik) aldığını keşfet.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-indigo-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Brain size={14} /> Amaç
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Çalışma yöntemlerini baskın öğrenme stiline göre optimize etmek.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <BookOpen size={14} /> Kurumsal Dayanak
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Fleming'in VARK Modeli temeline dayanır.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-amber-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Activity size={14} /> Yöntem
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">15 soruluk senaryo bazlı analiz.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('quiz')}
              className="group relative px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg transition-all duration-300 shadow-2xl shadow-indigo-500/20 overflow-hidden"
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
                      i === currentQuestion ? 'w-8 bg-indigo-500' : 
                      i < currentQuestion ? 'w-4 bg-indigo-500/40' : 'w-4 bg-white/5'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">{currentQuestion + 1} / {QUESTIONS.length}</span>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 space-y-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                {QUESTIONS[currentQuestion].text}
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {QUESTIONS[currentQuestion].choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleChoice(choice.id)}
                    className="group flex items-center gap-6 p-6 sm:p-8 bg-white/5 hover:bg-indigo-600/10 border border-white/5 hover:border-indigo-500/30 rounded-3xl text-left transition-all duration-300"
                  >
                    <div className="w-14 h-14 bg-white/5 group-hover:bg-indigo-500/20 rounded-2xl flex items-center justify-center text-xl font-black text-slate-500 group-hover:text-indigo-400 border border-white/5 group-hover:border-indigo-500/20 transition-all">
                      {choice.id.toUpperCase()}
                    </div>
                    <span className="flex-1 text-lg font-bold text-slate-300 group-hover:text-white transition-colors">
                      {choice.text}
                    </span>
                    <ChevronRight size={24} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-2 transition-all opacity-0 group-hover:opacity-100" />
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
              <Loader2 size={64} className="text-indigo-500 animate-spin" />
              <div className="absolute inset-0 blur-2xl bg-indigo-500/20 animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">Yapay Zeka Analiz Ediyor...</h3>
              <p className="text-slate-400 font-medium">Öğrenme stilin ve akademik stratejin hazırlanıyor.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
