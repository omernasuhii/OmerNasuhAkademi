import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, ChevronRight, ChevronLeft, Save, AlertCircle, CheckCircle2, Info, Activity } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';

const questions = [
  // BOYUT 1: ÖZ-BİLİNÇ
  { id: 1, text: "Öfkelendiğimde veya üzüldüğümde, buna neyin sebep olduğunu tam olarak bilirim.", category: "Öz-Bilinç" },
  { id: 2, text: "Şu anki ruh halimin ders çalışmamı nasıl etkilediğinin farkındayım.", category: "Öz-Bilinç" },
  { id: 3, text: "Güçlü ve zayıf yönlerimi dürüstçe kabul edebilirim.", category: "Öz-Bilinç" },
  { id: 4, text: "Duygularımı kelimelere dökmekte zorlanmam.", category: "Öz-Bilinç" },
  { id: 5, text: "Stresli olduğumda vücudumun verdiği tepkileri (baş ağrısı, terleme) fark ederim.", category: "Öz-Bilinç" },
  
  // BOYUT 2: ÖZ-YÖNETİM
  { id: 6, text: "Sınav anında paniklesem bile kendi kendimi sakinleştirebilirim.", category: "Öz-Yönetim" },
  { id: 7, text: "Öğretmenim veya arkadaşım beni eleştirdiğinde savunmaya geçmeden önce dinlerim.", category: "Öz-Yönetim" },
  { id: 8, text: "Çok sinirlendiğimde ani tepki vermem, sakinleşmeyi beklerim.", category: "Öz-Yönetim" },
  { id: 9, text: "Dikkatim dağıldığında kendimi toparlayıp tekrar odaklanabilirim.", category: "Öz-Yönetim" },
  { id: 10, text: "Beklenmedik bir sorunla (kötü not vb.) karşılaştığımda moralimi bozmak yerine çözüm ararım.", category: "Öz-Yönetim" },
  
  // BOYUT 3: MOTİVASYON
  { id: 11, text: "Başarısız olsam bile tekrar deneme isteğimi kaybetmem (Yılmazlık).", category: "Motivasyon" },
  { id: 12, text: "Gelecekle ilgili hedeflerim beni heyecanlandırır ve harekete geçirir.", category: "Motivasyon" },
  { id: 13, text: "Zevkli bir işi (oyun vb.), daha önemli bir hedef için erteleyebilirim (Haz Erteleme).", category: "Motivasyon" },
  { id: 14, text: "\"Yapabilirim\" inancım, karşılaştığım engellerden daha büyüktür.", category: "Motivasyon" },
  { id: 15, text: "Sadece sonuç odaklı değil, süreçten (öğrenmekten) de keyif alırım.", category: "Motivasyon" },

  // BOYUT 4: EMPATİ
  { id: 16, text: "Bir arkadaşımın üzgün olduğunu yüz ifadesinden veya ses tonundan anlarım.", category: "Empati" },
  { id: 17, text: "Başkalarının sorunlarını dinlerken onları yargılamadan anlamaya çalışırım.", category: "Empati" },
  { id: 18, text: "Farklı görüşteki insanlara saygı duyarım, onların penceresinden bakabilirim.", category: "Empati" },
  { id: 19, text: "Bir şaka yaptığımda karşımdakinin kırılıp kırılmadığını fark ederim.", category: "Empati" },
  { id: 20, text: "Yardım isteyen birine destek olmak benim için önemlidir.", category: "Empati" },

  // BOYUT 5: SOSYAL BECERİLER
  { id: 21, text: "Grup ödevlerinde veya takım oyunlarında uyumlu biriyimdir.", category: "Sosyal Beceriler" },
  { id: 22, text: "İnsanlarla kolayca iletişim kurar ve arkadaşlık başlatabilirim.", category: "Sosyal Beceriler" },
  { id: 23, text: "Bir tartışma veya çatışma çıktığında arabulucu olabilirim.", category: "Sosyal Beceriler" },
  { id: 24, text: "Duygu ve düşüncelerimi başkalarını kırmadan açıkça ifade edebilirim (Güvengenlik).", category: "Sosyal Beceriler" },
  { id: 25, text: "İnsanlardan yardım istemekten veya soru sormaktan çekinmem.", category: "Sosyal Beceriler" }
];

export default function AsEqAnaliz() {
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
    let selfAwareness = 0;
    let selfManagement = 0;
    let motivation = 0;
    let empathy = 0;
    let socialSkills = 0;
    let total = 0;

    Object.entries(answers).forEach(([idStr, val]) => {
      const id = parseInt(idStr);
      total += val;
      if (id >= 1 && id <= 5) selfAwareness += val;
      if (id >= 6 && id <= 10) selfManagement += val;
      if (id >= 11 && id <= 15) motivation += val;
      if (id >= 16 && id <= 20) empathy += val;
      if (id >= 21 && id <= 25) socialSkills += val;
    });

    return {
      scores: {
        'Öz-Bilinç': selfAwareness,
        'Öz-Yönetim': selfManagement,
         'Motivasyon': motivation,
         'Empati': empathy,
         'Sosyal Beceriler': socialSkills,
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
      const docId = await analysisService.saveResult(user.uid, 'AS-EQ', resultData);
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
            <Activity size={12} />
            YENİ NESİL ANALİZ
          </div>
          <h1 className="text-4xl font-black text-white">Akademik ve Sosyal Duygusal Zekâ Envanteri (AS-EQ)</h1>
        </header>

        <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Brain size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Analizin Amacı</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  Öğrencinin duygularını tanıma, yönetme, başkalarını anlama ve ilişkileri sürdürme kapasitesini ölçmektir. Akademik başarısızlığın veya sınav stresi gibi durumların ardındaki "duygusal okuryazarlık" eksikliğini tespit ederek gelişim alanları yaratır.
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
                  <strong>Daniel Goleman – Duygusal Zekâ Modeli (Mixed Model)</strong> temeline dayanmaktadır. Başarı, sadece IQ (Akademik zeka) ile değil, duyguların ne kadar iyi yönetildiğiyle (EQ) doğrudan ilişkilidir. Test toplam 5 alt boyuttan ve 25 maddeden oluşur.
                </p>
              </div>
            </div>

            <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl space-y-3">
              <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest">Nasıl Uygulanır?</h4>
              <ul className="text-sm text-slate-400 space-y-2 font-medium">
                <li className="flex items-center gap-2">• Kendine karşı tamamen dürüst olmalısın. Beklenen cevapları değil, olanı seçmelisin.</li>
                <li className="flex items-center gap-2">• Her maddeye 1'den (Hiçbir Zaman) 5'e (Her Zaman) kadar puan vermelisin.</li>
                <li className="flex items-center gap-2">• Sonuçların sonrasında gelişimin için kişiselleştirilmiş bir yapay zeka değerlendirmesi oluşturulacaktır.</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <button
              onClick={() => setShowIntro(false)}
              className="w-full md:w-auto px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
            >
              AS-EQ Analizine Başla
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / questions.length) * 100;

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
          <h1 className="text-3xl font-black text-white">Akademik ve Sosyal Duygusal Zekâ Envanteri</h1>
          <p className="text-slate-400 font-medium">
             Sana en uygun ifadeyi (1: Hiçbir Zaman ... 5: Her Zaman) seçerek değerlendir.
          </p>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-slate-900 border border-white/5 p-4 rounded-3xl space-y-3 sticky top-4 z-50">
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
              <span className="text-slate-400">İlerleme Durumu</span>
              <span className="text-indigo-400">{answeredCount} / {questions.length} Tamamlandı</span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                  style={{ width: `${progressPercent}%` }}
              />
          </div>
      </div>

      <div className="space-y-6">
          {questions.map((q, idx) => (
             <div key={q.id} className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 md:p-8 space-y-6 hover:border-indigo-500/30 transition-colors">
                <div className="space-y-2">
                    <h3 className="text-lg md:text-xl font-medium text-white leading-relaxed">
                        <span className="text-indigo-500 font-black mr-2">{q.id}.</span>
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
                                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
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
