import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  GraduationCap, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Target, 
  Info, 
  ShieldCheck, 
  Users,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';

const questions = [
  // ALT BOYUT A: DUYGUSAL DESTEK
  { id: 1, text: "Ailem, sınav sonucum ne olursa olsun beni seveceğini hissettirir.", category: "A" },
  { id: 2, text: "Sınav stresimi veya korkularımı ailemle rahatça konuşabilirim.", category: "A" },
  { id: 3, text: "Başarısız olduğumda beni yargılamak yerine moral verirler.", category: "A" },
  { id: 4, text: "Ailem bana güvendiğini sözleriyle ve davranışlarıyla belli eder.", category: "A" },
  { id: 5, text: "Ders çalışmadığım zamanlarda bile bana değer verirler.", category: "A" },
  { id: 6, text: "Ailem beni başkalarının çocuklarıyla (kuzen, komşu çocuğu vb.) kıyaslamaz.", category: "A" },
  { id: 7, text: "Sınav kaygısı yaşadığımda ailem beni sakinleştirir.", category: "A" },
  { id: 8, text: "Evde huzurlu ve sevgi dolu bir ortam olduğunu hissederim.", category: "A" },
  { id: 9, text: "Ailem kararlarıma (hedef, bölüm seçimi vb.) saygı duyar.", category: "A" },
  { id: 10, text: "Ailemle vakit geçirmek beni dinlendirir ve motive eder.", category: "A" },
  // ALT BOYUT B: AKADEMİK VE ARAÇSAL DESTEK
  { id: 11, text: "Ailem bana evde sessiz ve düzenli bir ders çalışma ortamı sağlar.", category: "B" },
  { id: 12, text: "İhtiyacım olan kitap, kaynak veya eğitim desteğini (dershane/koç) karşılarlar.", category: "B" },
  { id: 13, text: "Deneme sınavı sonuçlarımı takip ederler ancak baskı yapmazlar.", category: "B" },
  { id: 14, text: "Ailem sınav sistemi (LGS/YKS) ve derslerim hakkında bilgi sahibidir.", category: "B" },
  { id: 15, text: "Ders çalışırken dikkatimi dağıtmamaya (TV sesi, misafir vb.) özen gösterirler.", category: "B" },
  { id: 16, text: "Okul/Dershane toplantılarına düzenli katılır ve öğretmenlerimle iletişim kurarlar.", category: "B" },
  { id: 17, text: "Uyku ve beslenme düzenime dikkat etmem için bana yardımcı olurlar.", category: "B" },
  { id: 18, text: "Gelecek planlarım hakkında benimle mantıklı ve yapıcı sohbetler ederler.", category: "B" },
  { id: 19, text: "Ailem, çözemediğim sorunlarda (okul, arkadaş) bana rehberlik eder.", category: "B" },
  { id: 20, text: "Evdeki sorumluluklarımı (ev işleri vb.) ders programıma göre ayarlarlar.", category: "B" }
];

export default function AddeAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleAnswer = (value: number) => {
    setAnswers(prev => ({ ...prev, [questions[currentQuestion].id]: value }));
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const calculateResults = () => {
    let emotionalScore = 0;
    let academicScore = 0;

    questions.forEach(q => {
      const val = answers[q.id] || 0;
      if (q.category === 'A') emotionalScore += val;
      if (q.category === 'B') academicScore += val;
    });

    const total = emotionalScore + academicScore;

    let profile = '';
    if (emotionalScore >= 40 && academicScore >= 40) profile = 'İdeal Dengeli Destek';
    else if (emotionalScore < 25 && academicScore > 40) profile = 'Proje Çocuk Sendromu';
    else if (emotionalScore > 40 && academicScore < 25) profile = 'Sevgi Dolu Ama Yetersiz';
    else if (emotionalScore < 25 && academicScore < 25) profile = 'İhmalkar / Kopuk';
    else profile = 'Karma Destek Profili';

    return {
      scores: {
        emotional: emotionalScore,
        academic: academicScore,
        total
      },
      profile,
      answers
    };
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const results = calculateResults();
      const docId = await analysisService.saveResult(user.uid, 'ADDE-20', results);
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
          <h2 className="text-3xl font-black text-white">Analiz Tamamlandı!</h2>
          <p className="text-slate-400 font-medium">Sonuçlar kaydedildi, yapay zeka raporunuz hazırlanıyor...</p>
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest">
            <Users size={12} />
            AİLE DİNAMİKLERİ ANALİZİ
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">ADDE-20: Algılanan Aile Akademik ve Duygusal Destek Ölçeği</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl">
            Sınav hazırlık sürecinde ailenden aldığın desteğin niteliğini keşfet. Maddi imkanlar mı yoksa ruhsal destek mi senin için daha ön planda?
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400">
              <Heart size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Duygusal Destek</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Ailenin sana olan sevgisi, güveni ve başarısızlık anındaki tutumlarını içeren, sınav şemsiyesi altındaki huzurunu ölçer.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <GraduationCap size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Akademik Destek</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Çalışma ortamı, kaynak temini, zaman yönetimi desteği gibi fiziksel ve araçsal imkanların yeterliliğini değerlendirir.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center gap-4 text-emerald-400">
            <ShieldCheck size={24} />
            <span className="font-bold">Kuramsal Dayanak</span>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed">
            Bu ölçek, <strong>Cohen ve Wills’in Tampon Hipotezi</strong> (Social Support as a Buffer) ve <strong>Baumrind’in Ebeveynlik Stilleri</strong> teorileri üzerine kurgulanmıştır. Sosyal desteğin stres üzerindeki azaltıcı etkisini sayısallaştırarak akademik performansa olan yansımasını analiz eder.
          </p>
          <div className="flex items-start gap-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
            <Info className="text-amber-500 shrink-0 mt-0.5" size={20} />
            <p className="text-xs text-slate-400 font-medium">
              <strong>Gizlilik Taahhüdü:</strong> Cevapların ailene "aynen" iletilmez. Sadece genel bir destek tablosu ve iletişim önerileri raporlanır. Lütfen içtenlikle cevapla.
            </p>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={() => setShowIntro(false)}
            className="px-12 py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-rose-600/20 flex items-center gap-3"
          >
            Analize Başla
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-4">
        <button 
          onClick={() => currentQuestion === 0 ? setShowIntro(true) : setCurrentQuestion(prev => prev - 1)}
          className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 max-w-md mx-8">
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-rose-500"
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
          className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-12 space-y-12"
        >
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest">
              {questions[currentQuestion].category === 'A' ? 'Duygusal Boyut' : 'Akademik Boyut'}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
              {questions[currentQuestion].text}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Tamamen Katılıyorum', value: 5, color: 'hover:bg-emerald-500/20 hover:border-emerald-500/30' },
              { label: 'Katılıyorum', value: 4, color: 'hover:bg-blue-500/20 hover:border-blue-500/30' },
              { label: 'Kararsızım', value: 3, color: 'hover:bg-slate-500/20 hover:border-slate-500/30' },
              { label: 'Katılmıyorum', value: 2, color: 'hover:bg-orange-500/20 hover:border-orange-500/30' },
              { label: 'Hiç Katılmıyorum', value: 1, color: 'hover:bg-red-500/20 hover:border-red-500/30' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className={`w-full p-5 text-left rounded-2xl bg-white/5 border border-white/5 text-slate-300 font-bold transition-all ${option.color} group flex justify-between items-center`}
              >
                {option.label}
                <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {(Object.keys(answers).length === questions.length) && (
        <div className="flex justify-center animate-in slide-in-from-bottom duration-500">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-emerald-600/20 flex items-center gap-3 disabled:opacity-50"
          >
            {loading ? 'Kaydediliyor...' : 'Analizi Tamamla ve Gönder'}
            <Save size={24} />
          </button>
        </div>
      )}
    </div>
  );
}
