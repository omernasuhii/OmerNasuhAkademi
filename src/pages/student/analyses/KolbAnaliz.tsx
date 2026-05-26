import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Info, 
  ShieldCheck, 
  Brain,
  CheckCircle2,
  Loader2,
  Puzzle,
  Target,
  IterationCcw
} from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';

const QUESTIONS = [
  {
    id: 'q1',
    text: 'Yeni bir konu öğrenirken en çok neyi tercih edersin?',
    options: [
      { id: 'SY', text: 'Konuyla ilgili hislerime ve sezgilerime güvenirim.' },
      { id: 'YG', text: 'Önce dinlerim, izlerim ve sonra düşünürüm.' },
      { id: 'SK', text: 'Konunun mantığını ve teorik kurallarını anlamaya çalışırım.' },
      { id: 'AY', text: 'Hemen uygulamaya geçip pratik yaparak öğrenirim.' }
    ]
  },
  {
    id: 'q2',
    text: 'Bir problemle karşılaştığında ilk tepkin ne olur?',
    options: [
      { id: 'SY', text: 'İçgüdülerimle hareket ederim, duygularım beni yönlendirir.' },
      { id: 'YG', text: 'Durumu her açıdan inceler, başkalarının ne yaptığına bakarım.' },
      { id: 'SK', text: 'Mantıklı bir analiz yapar, neden-sonuç ilişkisi kurarım.' },
      { id: 'AY', text: 'Hemen bir çözüm denerim, işe yaramazsa başkasını denerim.' }
    ]
  },
  {
    id: 'q3',
    text: 'Sınıfta en verimli olduğun an hangisidir?',
    options: [
      { id: 'SY', text: 'Öğretmenle veya arkadaşlarla duygusal bir bağ kurduğumda.' },
      { id: 'YG', text: 'Dersi sessizce dinleyip not aldığımda.' },
      { id: 'SK', text: 'Konunun arkasındaki teoriyi ve sistemi kavradığımda.' },
      { id: 'AY', text: 'Laboratuvarda deney yaptığımda veya tahtada soru çözdüğümde.' }
    ]
  },
  {
    id: 'q4',
    text: 'Bir grup çalışmasında hangi rolü üstlenirsin?',
    options: [
      { id: 'SY', text: 'Grubun uyumunu sağlayan, fikirleri birleştiren kişi olurum.' },
      { id: 'YG', text: 'Gözlemci olurum, not tutarım ve sonra yorum yaparım.' },
      { id: 'SK', text: 'Planı yapan, mantıksal çerçeveyi kuran kişi olurum.' },
      { id: 'AY', text: 'İşi bitiren, harekete geçen ve grubu yöneten kişi olurum.' }
    ]
  },
  {
    id: 'q5',
    text: 'Sınava çalışırken tarzın nasıldır?',
    options: [
      { id: 'SY', text: 'Arkadaşlarımla çalışarak, tartışarak motive olurum.' },
      { id: 'YG', text: 'Tek başıma, sessizce okuyarak ve düşünerek çalışırım.' },
      { id: 'SK', text: 'Konu özetlerini mantıksal sıraya koyarak, şemalarla çalışırım.' },
      { id: 'AY', text: 'Bol bol test çözerek, pratik yaparak çalışırım.' }
    ]
  },
  {
    id: 'q6',
    text: 'Bir şeyi "öğrendim" demen için ne gerekir?',
    options: [
      { id: 'SY', text: 'O konuyu hissetmem ve içselleştirmem gerekir.' },
      { id: 'YG', text: 'O konuyu zihnimde iyice tartıp biçmem gerekir.' },
      { id: 'SK', text: 'O konunun mantığını tam olarak kavramam gerekir.' },
      { id: 'AY', text: 'O konuyu tek başıma uygulayabiliyor olmam gerekir.' }
    ]
  },
  {
    id: 'q7',
    text: 'Bir konu çok zor geldiğinde yaklaşımın nedir?',
    options: [
      { id: 'SY', text: 'Destek alabileceğim birine danışırım.' },
      { id: 'YG', text: 'Biraz uzaklaşır, üzerinde derinlemesine düşünürüm.' },
      { id: 'SK', text: 'Konuyu daha küçük ve mantıksal alt parçalara bölerim.' },
      { id: 'AY', text: 'Farklı çözüm yollarını hemen teker teker denerim.' }
    ]
  },
  {
    id: 'q8',
    text: 'Grup projelerinde başarı sence neye bağlıdır?',
    options: [
      { id: 'SY', text: 'Herkesin birbirini anlamasına ve uyumlu çalışmasına.' },
      { id: 'YG', text: 'Dikkatli bir gözlemle herkesin eksiklerini tespit etmeye.' },
      { id: 'SK', text: 'Projenin iyi ve sistematik bir şekilde planlanmasına.' },
      { id: 'AY', text: 'Hızlıca eyleme geçip görevlerin zamanında tamamlanmasına.' }
    ]
  },
  {
    id: 'q9',
    text: 'Yeni bir teknolojik alet aldığında nasıl kullanmayı öğrenirsin?',
    options: [
      { id: 'SY', text: 'Kullanırken hissettiğim düzene göre kendimce kurcalarım.' },
      { id: 'YG', text: 'Önce başkalarının nasıl kullandığını izlerim.' },
      { id: 'SK', text: 'Kullanım kılavuzunu dikkatlice okurum.' },
      { id: 'AY', text: 'Düğmelere basıp deneyerek aleti keşfederim.' }
    ]
  },
  {
    id: 'q10',
    text: 'Başarılı bir öğretmende aradığın en önemli özellik nedir?',
    options: [
      { id: 'SY', text: 'Öğrencilerle samimi ve sıcak bir iletişim kurması.' },
      { id: 'YG', text: 'Konuyu benim düşünmemi sağlayacak şekilde sunması.' },
      { id: 'SK', text: 'Konunun temel kavramlarını ve mantığını sistemli anlatması.' },
      { id: 'AY', text: 'Konuyu pratik hayatta kullanabileceğimiz şekilde göstermesi.' }
    ]
  },
  {
    id: 'q11',
    text: 'Gündelik hayatında karar alırken neye güvenirsin?',
    options: [
      { id: 'SY', text: 'İç sesime ve o anki duygularıma.' },
      { id: 'YG', text: 'Olayları dışarıdan izler ve ihtimalleri yavaşça değerlendirmeye.' },
      { id: 'SK', text: 'Gerçeklere, araştırmalara ve mantıksal çıkarımlara.' },
      { id: 'AY', text: 'Hızlıca bir karar verip sonuçlarını anında görmeye.' }
    ]
  },
  {
    id: 'q12',
    text: 'Boş zamanlarında yeni bir hobi edinirken tarzın nedir?',
    options: [
      { id: 'SY', text: 'Beni duygusal olarak iyi hissettirecek şeylere yönelirim.' },
      { id: 'YG', text: 'Önce o hobiyle ilgili başkalarının çalışmalarını izlerim.' },
      { id: 'SK', text: 'Hobinin kurallarını, tarihini ve tekniğini araştırarak öğrenirim.' },
      { id: 'AY', text: 'Hemen malzemeleri alır, yaparak ve deneyerek öğrenirim.' }
    ]
  }
];

export default function KolbAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"intro" | "survey" | "result">("intro");
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);

  // Load existing analysis if it exists
  useEffect(() => {
    const checkExisting = async () => {
      if (!user) return;
      try {
        const results = await analysisService.getResults(user.uid, "KOLB-DÖSE");
        if (results && results.length > 0) {
          const latest = results[0];
          if (latest.data && latest.data.answers) {
            setAnswers(latest.data.answers);
            setAiInsight(latest.data.insight);
            setStep("result");
          }
        }
      } catch (error) {
        console.error("Mevcut veri çekilirken hata:", error);
      } finally {
        setLoading(false);
      }
    };
    checkExisting();
  }, [user]);

  const handleSelectOption = (optionId: string) => {
    setAnswers({ ...answers, [QUESTIONS[currentQ].id]: optionId });
    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ((prev) => prev + 1), 300);
    }
  };

  const calculateType = () => {
    const counts = { SY: 0, YG: 0, SK: 0, AY: 0 };
    Object.values(answers).forEach((val) => {
      if (counts[val as keyof typeof counts] !== undefined) {
        counts[val as keyof typeof counts]++;
      }
    });

    const x = counts.AY - counts.YG; // İşleme Puanı
    const y = counts.SK - counts.SY; // Algılama Puanı

    let typeTitle = "";
    if (y >= 0 && x >= 0) typeTitle = "Ayrıştıran (Converging)";
    if (y >= 0 && x < 0) typeTitle = "Özümseyen (Assimilating)";
    if (y < 0 && x < 0) typeTitle = "Değiştiren / Yansıtan (Diverging)";
    if (y < 0 && x >= 0) typeTitle = "Yerleştiren / Girişken (Accommodating)";

    return { counts, x, y, typeTitle };
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const resultsData = calculateType();

      const payload = {
        answers,
        resultsData
      };

      const result = await analysisService.saveResult(user.uid, "KOLB-DÖSE", payload);
      if (result?.id) {
        navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`);
      }
    } catch (error: any) {
      console.error("Kayıt hatası:", error);
      alert(error.message || "Analiz oluşturulurken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === "intro") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-fuchsia-500" size={40} />
        <p className="text-slate-400 font-bold animate-pulse">Veriler Kontrol Ediliyor...</p>
      </div>
    );
  }

  if (step === "result" && aiInsight) {
    const { counts, typeTitle } = calculateType();
    
    return (
      <div className="max-w-5xl mx-auto space-y-12 pb-20 pt-8 animate-in fade-in duration-700 px-4">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 font-black uppercase tracking-widest text-sm">
            <CheckCircle2 size={16} />
            KOLB-DÖSE Tamamlandı
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">Öğrenme Stilin: <span className="text-fuchsia-400">{typeTitle}</span></h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
            Sonuçların kaydedildi. AI Koçu, test verilerine göre beyninin veriyi en iyi nasıl işlediğini analiz etti.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Target size={24} className="text-fuchsia-400" />
                <h3 className="text-lg font-bold text-white">Algı & İşleme Skoru</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                     <div className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest mb-1">Somut (SY)</div>
                     <div className="text-2xl font-bold text-white">{counts.SY}</div>
                 </div>
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                     <div className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest mb-1">Soyut (SK)</div>
                     <div className="text-2xl font-bold text-white">{counts.SK}</div>
                 </div>
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                     <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Yansıtıcı (YG)</div>
                     <div className="text-2xl font-bold text-white">{counts.YG}</div>
                 </div>
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                     <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Aktif (AY)</div>
                     <div className="text-2xl font-bold text-white">{counts.AY}</div>
                 </div>
              </div>
            </div>
            
            <div className="flex justify-center mt-4">
                <button
                   onClick={() => {
                       setStep('survey');
                       setCurrentQ(0);
                       setAnswers({});
                       setAiInsight(null);
                   }}
                   className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                >
                   <IterationCcw size={18} />
                   Testi Tekrar Çöz
                </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-gradient-to-br from-fuchsia-500/5 to-purple-500/5 border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400">
                  <Brain size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">AI Öğrenme Analizi</h3>
                  <p className="text-xs text-slate-400 font-medium tracking-wide">Kişiye Özel Hazırlanmıştır</p>
                </div>
              </div>

              <div className="prose prose-invert prose-fuchsia max-w-none prose-headings:font-black prose-p:leading-relaxed prose-p:text-slate-300 relative z-10">
                <Markdown>{aiInsight}</Markdown>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={() => navigate("/panel/ogrenci/analizler")}
                className="px-8 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-2xl font-bold transition-all flex items-center gap-2"
              >
                Analizlere Dön
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "intro") {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in duration-700 px-4">
        <header className="space-y-4">
          <button
            onClick={() => navigate("/panel/ogrenci/analizler")}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <ChevronLeft size={16} />
            Analizlere Dön
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-[10px] font-black uppercase tracking-widest">
            <Puzzle size={12} />
            BİLİŞSEL YAKLAŞIM
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">
            KOLB-DÖSE: Deneyimsel Öğrenme Stilleri
          </h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl">
            Teorik kitaplardan mı, yoksa deneme-yanılma yoluyla mı daha iyi öğreniyorsun? Beyninin doğal öğrenme patikasını keşfet.
          </p>
        </header>

        <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center gap-4 text-fuchsia-400">
            <ShieldCheck size={24} />
            <span className="font-bold text-lg">Kuramsal Dayanak</span>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed">
            <strong>David Kolb - Deneyimsel Öğrenme Kuramı'na</strong> dayanır. Öğrenme iki eksende gerçekleşir: 
            Bilgiyi Alma (Hissederek vs Düşünerek) ve İşleme (Yaparak vs İzleyerek).
          </p>
          <div className="flex items-start gap-4 p-4 bg-fuchsia-500/5 border border-fuchsia-500/10 rounded-2xl">
            <Info className="text-fuchsia-500 shrink-0 mt-0.5" size={20} />
            <p className="text-xs text-slate-400 font-medium">
              <strong>Nasıl Uygulanır?</strong> 12 soruluk testte, sana en çok uyan tek bir seçeneği işaretle. Sonuçlarda sana özel çalışma, tekrar ve soru çözme taktiklerini göreceksin.
            </p>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={() => setStep("survey")}
            className="px-12 py-5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-fuchsia-600/20 flex items-center gap-3"
          >
            Modüle Başla
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    );
  }

  if (step === "survey") {
    const question = QUESTIONS[currentQ];
    const isLastQuestion = currentQ === QUESTIONS.length - 1;
    const progress = ((currentQ) / QUESTIONS.length) * 100;

    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in duration-500 px-4">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => {
                if (currentQ > 0) setCurrentQ(prev => prev - 1);
                else setStep('intro');
            }}
            className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold"
          >
            <ChevronLeft size={20} />
            Geri
          </button>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            {currentQ + 1} / {QUESTIONS.length}
          </div>
        </div>

        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
                className="bg-fuchsia-500 h-full transition-all duration-500"
                style={{ width: `${progress}%` }}
            ></div>
        </div>

        <div className="text-center space-y-4 mb-8 pt-4">
          <h2 className="text-3xl font-black text-white leading-tight">
             {question.text}
          </h2>
          <p className="text-slate-400">Sana en uygun olanı seç.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.options.map((opt) => (
               <button
                 key={opt.id}
                 onClick={() => handleSelectOption(opt.id)}
                 className={`p-6 text-left rounded-3xl border-2 transition-all duration-300 ${
                   answers[question.id] === opt.id 
                     ? 'bg-fuchsia-500/10 border-fuchsia-500 text-white' 
                     : 'bg-slate-900 border-white/5 text-slate-300 hover:bg-white/5 hover:border-white/10'
                 }`}
               >
                  <p className="font-medium">{opt.text}</p>
               </button>
            ))}
        </div>

        {Object.keys(answers).length === QUESTIONS.length && isLastQuestion && (
           <div className="flex justify-center pt-8 animate-in slide-in-from-bottom flex-col items-center gap-4">
               <button
                 onClick={handleFinish}
                 disabled={loading}
                 className="px-12 py-5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-fuchsia-600/20 flex items-center justify-center gap-3 w-full md:w-auto"
               >
                 {loading ? (
                     <><Loader2 className="animate-spin" size={24} /> Analiz Ediliyor...</>
                 ) : (
                     <><Save size={24} /> Testi Bitir ve Kuramı Gör</>
                 )}
               </button>
           </div>
        )}
      </div>
    );
  }

  return null;
}
