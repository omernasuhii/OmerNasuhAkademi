import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Target, 
  ShieldCheck, 
  Activity,
  Zap,
  CheckCircle2,
  AlertCircle,
  Layout,
  Clock,
  IterationCcw,
  Info,
  Calendar,
  Flame,
  Trophy,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';

const questions = [
  // BOYUT A: PLANLAMA VE ORGANİZASYON
  { id: 1, text: "Haftalık çalışma programımı Pazar akşamından veya Pazartesi sabahından yazılı hale getiririm.", category: "A" },
  { id: 2, text: "Masaya oturmadan önce 'Bugün tam olarak neyi bitireceğim?' sorusunun cevabı bellidir.", category: "A" },
  { id: 3, text: "Zor dersleri zihnimin en açık olduğu saatlere (sabah vb.) yerleştiririm.", category: "A" },
  { id: 4, text: "Çalışma masamda sadece o an çalışacağım dersin materyalleri bulunur, masa sadedir.", category: "A" },
  { id: 5, text: "Okul/Dershane programı ile kendi bireysel çalışma programımı dengeli birleştiririm.", category: "A" },
  { id: 6, text: "Beklenmedik durumlar (misafir, hastalık) için programımda 'telafi saatleri' bırakırım.", category: "A" },
  { id: 7, text: "Hangi derse hangi kaynaktan (kitap/video) çalışacağımı önceden belirlerim (Kaynak planı).", category: "A" },
  { id: 8, text: "Önceliklerimi belirlerken 'Acil' ve 'Önemli' ayrımını yaparım.", category: "A" },
  // BOYUT B: SÜREKLİLİK VE İSTİKRAR
  { id: 9, text: "Çalışma isteğim olmasa bile ('Canım istemiyor' desem de) programıma sadık kalıp masaya otururum.", category: "B" },
  { id: 10, text: "Bir gün programım aksasa bile, ertesi gün 'kaldığım yerden' devam ederim (Pes etmem).", category: "B" },
  { id: 11, text: "Hafta sonları veya tatil günlerinde de biyolojik saatimi (uyku-uyanıklık) bozmam.", category: "B" },
  { id: 12, text: "Başladığım bir soru bankasını veya fasikülü yarım bırakmam, sonuna kadar bitiririm.", category: "B" },
  { id: 13, text: "Sınav sonucum kötü gelse bile çalışma tempomu düşürmem (Duygusal dayanıklılık).", category: "B" },
  { id: 14, text: "'Zinciri Kırma' metodunu uygular, her gün az da olsa mutlaka çalışma yaparım.", category: "B" },
  { id: 15, text: "Zor bir konuyla karşılaştığımda hemen vazgeçmem, üzerine giderim.", category: "B" },
  { id: 16, text: "Çalışma rutinimi (başlama saati vb.) kolay kolay değiştirmem.", category: "B" },
  // BOYUT C: DİSİPLİN VE ODAK YÖNETİMİ
  { id: 17, text: "Ders çalışırken cep telefonumu odadan çıkarırım veya 'Rahatsız Etme' moduna alırım.", category: "C" },
  { id: 18, text: "Mola sürem dolduğunda (alarm çaldığında) ertelemeden hemen masaya dönerim.", category: "C" },
  { id: 19, text: "Ders sırasında aklıma başka şeyler gelse bile tekrar konuya odaklanmayı başarabilirim.", category: "C" },
  { id: 20, text: "Arkadaşlarım dışarı çağırdığında veya oyun teklif ettiğinde, ders saatimse 'Hayır' diyebilirim.", category: "C" },
  { id: 21, text: "Blok çalışma (Örn: 40 dk) yapıyorsam, süre dolmadan su içmeye veya tuvalete kalkmam.", category: "C" },
  { id: 22, text: "Uykum gelse veya sıkılsam bile o günkü hedefim (soru sayısı) bitmeden yatmam.", category: "C" },
  { id: 23, text: "Ders çalışırken müzik dinlemek, bir şeyler atıştırmak gibi 'yalancı odaklanma' tuzaklarına düşmem.", category: "C" },
  { id: 24, text: "Kendi kendime koyduğum kurallara (Örn: 'Bu test bitmeden kalkmak yok') uyarım.", category: "C" }
];

const likertOptions = [
  { value: 1, label: 'Hiçbir Zaman' },
  { value: 2, label: 'Nadiren' },
  { value: 3, label: 'Bazen' },
  { value: 4, label: 'Sık Sık' },
  { value: 5, label: 'Her Zaman' }
];

export default function CdoeAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleAnswer = (value: number) => {
    setAnswers(prev => ({ ...prev, [questions[currentIdx].id]: value }));
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const calculateResults = () => {
    let planSum = 0;
    let continuitySum = 0;
    let disciplineSum = 0;

    questions.forEach(q => {
      const val = answers[q.id] || 0;
      if (q.category === 'A') planSum += val;
      else if (q.category === 'B') continuitySum += val;
      else if (q.category === 'C') disciplineSum += val;
    });

    const total = planSum + continuitySum + disciplineSum;
    let profile = "";
    if (total <= 60) profile = "TURİST ÖĞRENCİ";
    else if (total <= 90) profile = "SAMAN ALEVİ";
    else profile = "PROFESYONEL ÖĞRENCİ";

    return {
      scores: {
        planning: planSum,
        continuity: continuitySum,
        discipline: disciplineSum,
        total
      },
      profile,
      answers,
      timestamp: new Date()
    };
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const results = calculateResults();
      const docId = await analysisService.saveResult(user.uid, 'ÇDÖ-E', results);
      setCompleted(true);
      setTimeout(() => navigate(`/panel/ogrenci/analizler/sonuc/${docId}`), 2000);
    } catch (error) {
      console.error("Kayıt hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-500">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white">Envanter Tamamlandı!</h2>
          <p className="text-slate-400 font-medium">Öz-disiplin profilin analiz ediliyor. Raporun hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  if (showIntro) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in duration-700">
        <header className="space-y-4">
          <button 
            onClick={() => navigate('/panel/ogrenci/analizler')}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <ChevronLeft size={16} />
            Analizlere Dön
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck size={12} />
            TESCİLLİ ÖLÇME ARACI
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">ÇDÖ-E: Çalışma Davranışı ve Öz-Disiplin Envanteri</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl">
            "Ne zaman yapacağım?", "Ne kadar devam ettirebilirim?" ve "Çeldiricilere karşı koyabilir miyim?" sorularına yanıt aradığımız, "akademik irade" profili ölçeği.
          </p>
        </header>

        <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="text-indigo-400" /> Analiz Amacı
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Öğrencinin çalışma alışkanlıklarını; Planlama, Süreklilik ve Disiplin boyutlarında ölçerek, başarı yolculuğundaki "davranışsal mimarisini" ortaya çıkarmaktır. Özellikle "bir gün çalışıp üç gün yatan" döngüsünü kırmayı hedefler.
              </p>
              
              <div className="space-y-4 pt-4">
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Kuramsal Dayanaklar</h4>
                 <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                       <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                          <BookOpen size={16} className="text-indigo-400" />
                       </div>
                       <div>
                          <p className="text-white text-sm font-bold">Zimmerman Modeli</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">Öz-Düzenlemeli Öğrenme</p>
                       </div>
                    </div>
                    <div className="flex gap-3 items-start">
                       <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0">
                          <Flame size={16} className="text-rose-400" />
                       </div>
                       <div>
                          <p className="text-white text-sm font-bold">Angela Duckworth – GRIT</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">Azim ve Sebat Teorisi</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-3xl p-8 border border-white/5 space-y-6">
               <h3 className="text-lg font-bold text-white underline decoration-emerald-500 decoration-2 underline-offset-4">Uygulama Talimatı</h3>
               <ul className="space-y-4">
                  {[
                    "Süre: 10-15 Dakika",
                    "Ölçek: 5'li Likert (Hiçbir Zaman - Her Zaman)",
                    "Dürüstlük: İdeal olanı değil, şu anki gerçek durumunu işaretle.",
                    "Konsantrasyon: Bireysel ve sessiz bir ortamda tamamla."
                  ].map((text, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-300 font-medium">
                       <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 text-[10px] font-black">
                          {i + 1}
                       </div>
                       {text}
                    </li>
                  ))}
               </ul>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col items-center gap-4">
          <button
            onClick={() => setShowIntro(false)}
            className="px-16 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[24px] font-black text-xl transition-all hover:scale-105 shadow-2xl shadow-emerald-600/20 flex items-center gap-3 group"
          >
            Envanteri Başlat
            <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Öneriye Dayalı Yapay Zeka Desteği Dahildir</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-4">
        <button 
          onClick={() => currentIdx === 0 ? setShowIntro(true) : setCurrentIdx(prev => prev - 1)}
          className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
           <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">
             {currentQuestion.category === 'A' ? 'Planlama' : currentQuestion.category === 'B' ? 'Süreklilik' : 'Disiplin'}
           </span>
           <div className="flex gap-1">
            {questions.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIdx ? 'w-6 bg-indigo-500' : idx < currentIdx ? 'w-2 bg-emerald-500/50' : 'w-2 bg-white/10'}`}
              />
            ))}
           </div>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-12 space-y-12">
        <div className="space-y-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Soru {currentIdx + 1} / {questions.length}</span>
          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
            {currentQuestion.text}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {likertOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleAnswer(opt.value)}
              className={`p-5 rounded-2xl text-left font-bold transition-all flex justify-between items-center group ${
                answers[currentQuestion.id] === opt.value
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 translate-x-2'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white hover:translate-x-1'
              }`}
            >
              <span>{opt.label}</span>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                answers[currentQuestion.id] === opt.value ? 'bg-white border-white' : 'border-white/10 group-hover:border-white/30'
              }`}>
                {answers[currentQuestion.id] === opt.value && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center pt-8 border-t border-white/5">
           <button
             onClick={() => currentIdx > 0 && setCurrentIdx(currentIdx - 1)}
             disabled={currentIdx === 0}
             className="px-6 py-3 rounded-xl text-slate-500 font-bold hover:text-white disabled:opacity-0 transition-all"
           >
             Geri
           </button>
           {currentIdx === questions.length - 1 && answers[currentQuestion.id] ? (
             <button
               onClick={handleSave}
               disabled={loading}
               className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black transition-all flex items-center gap-2"
             >
               {loading ? 'Analiz Kaydediliyor...' : 'Envanteri Tamamla'}
               <Save size={20} />
             </button>
           ) : (
             <div className="text-slate-600 text-xs font-black uppercase tracking-widest">Seçim Yapınız</div>
           )}
        </div>
      </div>
    </div>
  );
}
