import React, { useState } from 'react';
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
  PieChart,
  BarChart3,
  Target
} from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';

const categoryLabels: Record<string, string> = {
  S: 'Sözel - Dilsel Zekâ',
  M: 'Mantıksal - Matematiksel Zekâ',
  G: 'Görsel - Uzamsal Zekâ',
  R: 'Müziksel - Ritmik Zekâ',
  B: 'Bedensel - Kinestetik Zekâ',
  K: 'Kişilerarası (Sosyal) Zekâ',
  I: 'İçsel (Öze Dönük) Zekâ',
  D: 'Doğacı Zekâ'
};

const questions = [
  // S: Sözel
  { id: 1, text: "Kelime oyunlarını (Scrabble, bulmaca vb.) severim; yeni kelimeler öğrenmek ilgimi çeker.", category: "S" },
  { id: 2, text: "Okuduğum bir kitabı veya izlediğim bir filmi detaylarıyla anlatmakta başarılıyımdır.", category: "S" },
  { id: 3, text: "Ders çalışırken özet çıkarmak veya not tutmak benim için en iyi öğrenme yoludur.", category: "S" },
  // M: Mantıksal
  { id: 4, text: "Olaylar arasında neden-sonuç ilişkisi kurmayı ve 'Neden?' sorusunu sormayı severim.", category: "M" },
  { id: 5, text: "Zihinden hesaplama yapmak veya strateji oyunları (Satranç vb.) oynamak hoşuma gider.", category: "M" },
  { id: 6, text: "Ders çalışırken maddeler halinde, listelerle veya şemalarla çalışmak işimi kolaylaştırır.", category: "M" },
  // G: Görsel
  { id: 7, text: "Harita okumakta, yön bulmakta veya bir nesnenin 3 boyutlu halini hayal etmekte iyiyimdir.", category: "G" },
  { id: 8, text: "Kitaplardaki metinlerden çok resimler, grafikler ve tablolar dikkatimi çeker.", category: "G" },
  { id: 9, text: "Ders notlarımı renkli kalemlerle, şekiller çizerek veya zihin haritaları yaparak tutarım.", category: "G" },
  // R: Müziksel
  { id: 10, text: "Ders çalışırken arka planda hafif bir müzik olması veya ritim tutmak odaklanmamı artırır.", category: "R" },
  { id: 11, text: "Şarkı sözlerini ve melodileri çok çabuk ezberlerim.", category: "R" },
  { id: 12, text: "Ses tonlarındaki değişimlere karşı hassasım; birinin yalan söylediğini sesinden anlarım.", category: "R" },
  // B: Bedensel
  { id: 13, text: "Uzun süre hareketsiz oturmakta zorlanırım, ders çalışırken sık sık hareket etme ihtiyacı duyarım.", category: "B" },
  { id: 14, text: "Bir şeyi okuyarak değil, dokunarak, söküp takarak veya deneyerek daha iyi öğrenirim.", category: "B" },
  { id: 15, text: "El becerisi gerektiren işlerde (maket yapma, tamirat, dans, spor) yetenekliyimdir.", category: "B" },
  // K: Sosyal
  { id: 16, text: "Arkadaşlarımla grup halinde ders çalışmak tek başıma çalışmaktan daha verimlidir.", category: "K" },
  { id: 17, text: "Başkalarının duygularını, jest ve mimiklerini çabuk fark eder ve anlarım (Empati).", category: "K" },
  { id: 18, text: "Bir sorunu çözmek için başkalarından fikir almayı veya tartışmayı tercih ederim.", category: "K" },
  // I: İçsel
  { id: 19, text: "Kendi başıma kalıp düşünmekten ve bireysel çalışmaktan hoşlanırım.", category: "I" },
  { id: 20, text: "Güçlü ve zayıf yönlerimin farkındayım; kendi hedeflerimi kendim belirlerim.", category: "I" },
  { id: 21, text: "Kalabalık ortamlardansa sakin ve sessiz yerlerde daha iyi odaklanırım.", category: "I" },
  // D: Doğacı
  { id: 22, text: "Doğada vakit geçirmek, hayvanlar veya bitkilerle ilgilenmek beni dinlendirir.", category: "D" },
  { id: 23, text: "Biyoloji, coğrafya gibi doğayla ilgili konuları diğer derslerden daha kolay anlarım.", category: "D" },
  { id: 24, text: "Çevremdeki değişimleri (hava durumu, bitkilerdeki değişim vb.) çabuk fark ederim.", category: "D" }
];

export default function Cz8Analiz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const handleAnswer = (value: number) => {
    setAnswers(prev => ({ ...prev, [questions[currentQuestion].id]: value }));
    setCurrentQuestion(prev => prev + 1);
  };

  const calculateResults = () => {
    const scores: Record<string, number> = {
      S: 0, M: 0, G: 0, R: 0, B: 0, K: 0, I: 0, D: 0
    };

    questions.forEach(q => {
      const val = answers[q.id] || 0;
      scores[q.category] += val;
    });

    return scores;
  };

  const generateAiInsight = async (scores: Record<string, number>) => {
    const formattedScores = Object.entries(scores)
      .map(([cat, score]) => `${categoryLabels[cat]}: ${score}/15`)
      .join('\n');

    const prompt = `Sen uzman bir eğitim ve kariyer koçusun. Öğrenci, Howard Gardner'ın Çoklu Zekâ Kuramı'na (ÇZ-8) dayalı bir envanter çözdü.
    Öğrencinin puanları (her biri maksimum 15):
    ${formattedScores}
    
    Lütfen şu 3 başlıkta Türkçe ve öğrenciyi motive edecek bir analiz yap:
    1. Baskın Zekâ Alanların ve Gücün: Öğrencinin en yüksek puan aldığı 2-3 alanı vurgula ve bu zekâ türlerinin ona sağladığı doğal avantajları belirt.
    2. Gelişime Açık Yönlerin: Düşük puan aldığı alanları eleştirmeksizin, geliştirilebilir yönler olarak sun.
    3. Çalışma Stratejisi (Koçluk Taktikleri): Sınav (YKS/LGS) hazırlığı için baskın zekâ alanlarına uygun spesifik 3 adet ders çalışma taktiği ver.
    `;

    const response = await fetch('/api/chocolate-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error('AI Analiz servisi yanıt vermiyor.');
    }

    const data = await response.json();
    return data.text;
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const scores = calculateResults();
      const aiResponseText = await generateAiInsight(scores);
      
      const payload = {
        scores,
        answers,
        insight: aiResponseText
      };

      const docId = await analysisService.saveResult(user.uid, 'ÇZ-8', payload);
      setAiInsight(aiResponseText);
      setCompleted(true);
      
      // Delay to let the user see the result before redirecting them to the overall single analysis view
      // But instead of redirecting immediately, we'll show the results here
      // setTimeout(() => navigate(\`/panel/ogrenci/analizler/sonuc/\${docId}\`), 2000);
    } catch (error: any) {
      console.error("Kayıt hatası:", error);
      alert(error.message || "Analiz oluşturulurken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (completed && aiInsight) {
    const scores = calculateResults();
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topCategories = sortedScores.slice(0, 2);

    return (
      <div className="max-w-5xl mx-auto space-y-12 pb-20 pt-8 animate-in fade-in duration-700 px-4">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black uppercase tracking-widest text-sm">
            <CheckCircle2 size={16} />
            Analiz Tamamlandı
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">Yapay Zeka Analiz Raporun</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
            Sonuçların başarıyla kaydedildi. İşte senin çoklu zekâ profiline özel çalışma formülün.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
             <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 space-y-6">
                <div className="flex items-center gap-3">
                   <Target size={24} className="text-indigo-400" />
                   <h3 className="text-lg font-bold text-white">Zekâ Profilin</h3>
                </div>
                <div className="space-y-4">
                   {sortedScores.map(([cat, score], idx) => (
                     <div key={cat} className="space-y-2">
                        <div className="flex justify-between items-end text-sm">
                           <span className="text-slate-300 font-medium truncate pr-2">{categoryLabels[cat]}</span>
                           <span className="text-indigo-400 font-bold">{score}/15</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                           <div 
                              className={`h-full rounded-full ${idx < 2 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                              style={{ width: `${(score / 15) * 100}%` }}
                           />
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="md:col-span-2">
             <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl">
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                         <Brain size={24} />
                      </div>
                      <div>
                         <h3 className="text-xl font-bold text-white">AI Koçluk İçgörüsü</h3>
                         <p className="text-xs text-slate-400 font-medium tracking-wide">Kişiye Özel Hazırlanmıştır</p>
                      </div>
                   </div>
                </div>
                
                <div className="prose prose-invert prose-emerald max-w-none prose-headings:font-black prose-p:leading-relaxed prose-p:text-slate-300">
                   <Markdown>{aiInsight}</Markdown>
                </div>
             </div>

             <div className="flex justify-end mt-8">
                <button
                   onClick={() => navigate('/panel/ogrenci/analizler')}
                   className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all flex items-center gap-2"
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

  if (showIntro) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in duration-700 px-4">
        <header className="space-y-4">
          <button 
            onClick={() => navigate('/panel/ogrenci/analizler')}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <ChevronLeft size={16} />
            Analizlere Dön
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <Brain size={12} />
            ZİHİNSEL PROFİL DEĞERLENDİRMESİ
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">ÇZ-8: Çoklu Zekâ Alanları Değerlendirme Envanteri</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl">
            Öğrencinin "zeki olup olmadığını" ölçmek değil, "hangi yolla zeki olduğunu" bulup çalışma programını bu potansiyele göre kişiselleştirmeyi hedefler.
          </p>
        </header>

        <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center gap-4 text-amber-400">
            <ShieldCheck size={24} />
            <span className="font-bold text-lg">Kuramsal Dayanak</span>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed">
            <strong>Howard Gardner – Çoklu Zekâ Kuramı (1983).</strong> Zekânın tek bir faktörden oluşmadığını, birbirinden bağımsız en az 8 farklı alanda gelişebileceğini savunur.
          </p>
          <div className="flex items-start gap-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
            <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
            <p className="text-xs text-slate-400 font-medium">
              <strong>Nasıl Uygulanır?</strong> İfade edilen durumu 1'den 5'e kadar sana ne kadar uygun olduğunu düşünerek puanla. (1: Hiç Bana Uygun Değil - 5: Tamamen Beni Anlatıyor). Sonuçlar yapay zeka ile analiz edilerek çalışma alışkanlıklarına dair özel öneriler sunacaktır.
            </p>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={() => setShowIntro(false)}
            className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-emerald-600/20 flex items-center gap-3"
          >
            Farkındalık Analizini Başlat
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    );
  }

  if (currentQuestion >= questions.length) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in duration-500 px-4">
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={() => setCurrentQuestion(questions.length - 1)}
            className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold"
          >
            <ChevronLeft size={20} />
            Son Soruya Dön
          </button>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-16 space-y-8 shadow-2xl text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
            Harika, Tüm Soruları Tamamladın!
          </h2>
          <p className="text-slate-400 text-lg max-w-lg mx-auto">
            Yanıtların üzerinden zihin stiline en uygun koçluk formülünü çıkarmak için hazırız. Analizi tamamlayıp sonuçlarını görebilirsin.
          </p>
          <div className="flex justify-center pt-8">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-8 md:px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-lg md:text-xl transition-all hover:scale-105 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <>
                   <Loader2 className="animate-spin" size={24} />
                   Yapay Zeka Analiz Ediyor...
                </>
              ) : (
                <>
                   Analizi Tamamla ve Formülü Çıkar
                   <Save size={24} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in duration-500 px-4">
      <div className="flex justify-between items-center">
        <button 
          onClick={() => currentQuestion === 0 ? setShowIntro(true) : setCurrentQuestion(prev => prev - 1)}
          className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 max-w-md mx-4 md:mx-8">
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-black text-slate-500 tracking-widest">{currentQuestion + 1} / {questions.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-6 md:p-12 space-y-12 shadow-2xl"
        >
          <div className="space-y-4 text-center">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
               Soru {currentQuestion + 1}
             </div>
            <h2 className="text-xl md:text-3xl font-bold text-white leading-tight">
              {questions[currentQuestion].text}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: '5 - Tamamen Beni Anlatıyor', value: 5, color: 'hover:bg-emerald-500/20 hover:border-emerald-500/30 text-emerald-100' },
              { label: '4 - Genellikle Bana Uygun', value: 4, color: 'hover:bg-teal-500/20 hover:border-teal-500/30 text-teal-100' },
              { label: '3 - Kararsızım / Bazen', value: 3, color: 'hover:bg-blue-500/20 hover:border-blue-500/30 text-blue-100' },
              { label: '2 - Biraz Bana Uygun', value: 2, color: 'hover:bg-orange-500/20 hover:border-orange-500/30 text-orange-100' },
              { label: '1 - Hiç Bana Uygun Değil', value: 1, color: 'hover:bg-rose-500/20 hover:border-rose-500/30 text-rose-100' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className={`w-full p-5 text-left rounded-2xl bg-white/5 border border-white/5 font-bold transition-all ${option.color} group flex justify-between items-center`}
              >
                {option.label}
                <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
