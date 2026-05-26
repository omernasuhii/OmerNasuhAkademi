import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, ChevronRight, ChevronLeft, Save, AlertCircle, CheckCircle2, Info, Activity } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';

const questions = [
  // BOYUT 1: PLANLAMA VE HEDEFLEME
  { id: 1, text: "Haftalık çalışma programımı Pazar akşamından veya Pazartesi sabahından hazırlarım.", category: "Planlama ve Hedefleme" },
  { id: 2, text: "Günlük çalışmam gereken konuları ve çözeceğim soru sayılarını masaya oturmadan önce belirlerim.", category: "Planlama ve Hedefleme" },
  { id: 3, text: "Zor ve sevmediğim dersleri enerjimin en yüksek olduğu saatlere koyarım.", category: "Planlama ve Hedefleme" },
  { id: 4, text: "Çalışma planımda beklenmedik durumlar (hastalık, misafir) için \"telafi saatleri\" bırakırım.", category: "Planlama ve Hedefleme" },
  { id: 5, text: "Önceliklerimi belirlerken \"Acil\" ve \"Önemli\" ayrımını yaparım (Eisenhower Matrisi).", category: "Planlama ve Hedefleme" },
  
  // BOYUT 2: ETKİLİ TEKRAR VE HAFIZA
  { id: 6, text: "Okulda/Dershanede işlenen konuyu aynı günün akşamı mutlaka en az 15-20 dk tekrar ederim.", category: "Etkili Tekrar ve Hafıza" },
  { id: 7, text: "Geçmiş konuları unutmamak için haftalık veya aylık \"Genel Tekrar\" günleri yaparım.", category: "Etkili Tekrar ve Hafıza" },
  { id: 8, text: "Sadece okuyarak değil; anlatarak, yazarak veya soru çözerek aktif tekrar yaparım.", category: "Etkili Tekrar ve Hafıza" },
  { id: 9, text: "Yanlış yaptığım soruları hemen silmem, doğrusunu öğrenip belirli aralıklarla tekrar çözerim.", category: "Etkili Tekrar ve Hafıza" },
  { id: 10, text: "Uyumadan önce gün içinde öğrendiğim kritik bilgileri zihnimden geçiririm.", category: "Etkili Tekrar ve Hafıza" },
  
  // BOYUT 3: NOT ALMA VE AKTİF ÖĞRENME
  { id: 11, text: "Derste öğretmeni dinlerken sadece tahtadakileri değil, önemli vurgularını da not alırım.", category: "Not Alma ve Aktif Öğrenme" },
  { id: 12, text: "Kitaptaki bilgileri aynen deftere geçirmek yerine, kendi cümlelerimle özetlerim.", category: "Not Alma ve Aktif Öğrenme" },
  { id: 13, text: "Not alırken renkli kalemler, altını çizme veya semboller kullanarak görselliği artırırım.", category: "Not Alma ve Aktif Öğrenme" },
  { id: 14, text: "Cornell Tekniği veya Zihin Haritası gibi yapılandırılmış not alma yöntemlerini kullanırım.", category: "Not Alma ve Aktif Öğrenme" },
  { id: 15, text: "Ders çalışırken anlamadığım yerleri soru işareti (?) ile belirtip mutlaka bir bilene sorarım.", category: "Not Alma ve Aktif Öğrenme" },

  // BOYUT 4: SÜRE VE DİKKAT YÖNETİMİ
  { id: 16, text: "Ders çalışırken süre tutarım (Kronometre kullanırım).", category: "Süre ve Dikkat Yönetimi" },
  { id: 17, text: "Çalışma masamda dikkatimi dağıtacak eşyalar (telefon, tablet vb.) bulundurmam.", category: "Süre ve Dikkat Yönetimi" },
  { id: 18, text: "Mola sürelerime sadık kalırım (Örn: 10 dk mola dediysem 30 dakikaya uzatmam).", category: "Süre ve Dikkat Yönetimi" },
  { id: 19, text: "Blok çalışma (uzun süre) ile Pomodoro (kısa süre) ayrımını dersin zorluğuna göre yaparım.", category: "Süre ve Dikkat Yönetimi" },
  { id: 20, text: "\"Hayır\" diyebilirim; ders saatimde gelen arkadaş tekliflerini veya oyun isteklerini ertelerim.", category: "Süre ve Dikkat Yönetimi" }
];

export default function AyceAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  
  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const calculateResults = () => {
    let planning = 0;
    let repetition = 0;
    let noteTaking = 0;
    let timeManagement = 0;
    let total = 0;

    Object.entries(answers).forEach(([idStr, val]) => {
      const id = parseInt(idStr);
      total += val;
      if (id >= 1 && id <= 5) planning += val;
      if (id >= 6 && id <= 10) repetition += val;
      if (id >= 11 && id <= 15) noteTaking += val;
      if (id >= 16 && id <= 20) timeManagement += val;
    });

    return {
      scores: {
        'Planlama ve Hedefleme': planning,
        'Etkili Tekrar ve Hafıza': repetition,
         'Not Alma ve Aktif Öğrenme': noteTaking,
         'Süre ve Dikkat Yönetimi': timeManagement,
         total
      },
      answers
    };
  };

  const handleSave = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Lütfen değerlendirmeyi tamamlamak için tüm soruları yanıtlayın.");
      return;
    }

    if (!user) return;
    setLoading(true);
    try {
      const resultData = calculateResults();
      const docId = await analysisService.saveResult(user.uid, 'AYCE', resultData);
      setCompleted(true);
      setTimeout(() => navigate(`/panel/ogrenci/analizler/sonuc/${docId}`), 2000);
    } catch (error) {
      console.error("Kayıt hatası: ", error);
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
          <p className="text-slate-400 font-medium">Verilerin başarıyla sistemine kaydedildi ve yapay zeka analizine hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  if (showIntro) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
        <header className="space-y-4">
          <button 
            onClick={() => navigate('/panel/ogrenci/analizler')}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mt-8"
          >
            <ChevronLeft size={16} />
            Laboratuvara Dön
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest">
            <Activity size={12} />
            YENİ NESİL ANALİZ
          </div>
          <h1 className="text-4xl font-black text-white">Akademik Yetkinlik ve Çalışma Stratejileri Envanteri (AYÇE)</h1>
        </header>

        <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                <Brain size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Analizin Amacı</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  Bu envanter, öğrencinin ders çalışma sürecindeki "verimsizlik kaçaklarını" tespit etmeyi amaçlar. Öğrencinin bilgi eksikliğinden ziyade; yanlış planlama, etkisiz tekrar, pasif not alma veya zamanı yönetememe gibi stratejik eksikliklerini puanlayarak somutlaştırır.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Kuramsal Dayanak</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  <strong>Zimmerman’ın Öz-Düzenlemeli Öğrenme Modeli</strong> ve <strong>Ebbinghaus’un Unutma Eğrisi</strong> teorilerine dayanır. Başarılı öğrenmenin sadece zekâ ile değil, doğru stratejilerle (Plan-Performans-İzleme) gerçekleştiğini savunur. Test 4 alt boyuttan ve 20 maddeden oluşur.
                </p>
              </div>
            </div>

            <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl space-y-3">
              <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest">Nasıl Uygulanır?</h4>
              <ul className="text-sm text-slate-400 space-y-2 font-medium">
                <li className="flex items-center gap-2">• Kendine karşı tamamen dürüst olmalısın. İdeal olanı değil, şu an gerçekten yaptığını seçmelisin.</li>
                <li className="flex items-center gap-2">• Zekâyı değil, alışkanlıkları ölçer. Alışkanlıklar değiştirilebilir davranışlardır.</li>
                <li className="flex items-center gap-2">• Sonuçların sonrasında gelişimin için kişiselleştirilmiş bir yapay zeka değerlendirmesi oluşturulacaktır.</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <button
              onClick={() => setShowIntro(false)}
              className="w-full md:w-auto px-12 py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-3xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-orange-600/20 flex items-center justify-center gap-3"
            >
              AYÇE Analizine Başla
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / questions.length) * 100;
  const currentQuestion = questions.find(q => !answers[q.id]) || questions[questions.length - 1];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500 pt-8">
      <header className="space-y-4">
        <button 
          onClick={() => setShowIntro(true)}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <ChevronLeft size={16} />
          Tanıtım Sayfasına Dön
        </button>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white">Akademik Yetkinlik ve Çalışma Stratejileri Envanteri</h1>
          <p className="text-slate-400 font-medium">
             Şu anki gerçek durumunu yansıtan ifadeyi (1: Hiçbir Zaman ... 5: Her Zaman) seçerek değerlendir.
          </p>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-slate-900 border border-white/5 p-4 rounded-3xl space-y-3 sticky top-4 z-50">
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
              <span className="text-slate-400">İlerleme Durumu</span>
              <span className="text-orange-400">{answeredCount} / {questions.length} Tamamlandı</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                  className="h-full bg-orange-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                  style={{ width: `${progressPercent}%` }}
              />
          </div>
          <div className="flex justify-center pt-1">
              <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  Boyut: {currentQuestion.category}
              </span>
          </div>
      </div>

      <div className="space-y-6">
          {questions.map((q, idx) => (
             <div key={q.id} className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 md:p-8 space-y-6 hover:border-orange-500/30 transition-colors">
                <div className="space-y-2">
                    <h3 className="text-lg md:text-xl font-medium text-white leading-relaxed">
                        <span className="text-orange-500 font-black mr-2">{q.id}.</span>
                        {q.text}
                    </h3>
                </div>

                <div className="grid grid-cols-5 gap-2 md:gap-4 mt-6">
                   {[1, 2, 3, 4, 5].map(val => (
                       <button
                          key={val}
                          onClick={() => handleAnswer(q.id, val)}
                          className={`
                              py-3 md:py-4 rounded-xl flex flex-col items-center gap-1 transition-all
                              border 
                              ${answers[q.id] === val 
                                  ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-600/20' 
                                  : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                              }
                          `}
                       >
                           <span className="text-xl font-black">{val}</span>
                       </button>
                   ))}
                </div>
                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">
                    <span>Hiçbir Zaman</span>
                    <span>Her Zaman</span>
                </div>
             </div>
          ))}
      </div>

      <div className="pt-8 border-t border-white/5 flex justify-end">
          <button
              onClick={handleSave}
              disabled={loading || answeredCount < questions.length}
              className="flex items-center gap-3 px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
              {loading ? 'Kaydediliyor...' : 'Analizi Tamamla ve Sonuçları Gör'}
              <Save size={20} />
          </button>
      </div>

    </div>
  );
}
