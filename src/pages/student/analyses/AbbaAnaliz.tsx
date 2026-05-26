import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, ChevronRight, ChevronLeft, Save, AlertCircle, CheckCircle2, ShieldCheck, Heart, GraduationCap, Info } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';

const sections = [
  { id: 'family', title: 'Bölüm A: Algılanan Aile Tutumu', icon: Heart, color: 'text-pink-400' },
  { id: 'self', title: 'Bölüm B: Benlik Saygısı (Öz Değer)', icon: ShieldCheck, color: 'text-indigo-400' },
  { id: 'academic', title: 'Bölüm C: Akademik Benlik Tasarımı', icon: GraduationCap, color: 'text-emerald-400' }
];

const questions = [
  // SECTION A: Aile Tutumu (1-10)
  { id: 1, text: 'Ailem, sınav sonuçlarım ne olursa olsun beni sevdiğini hissettirir.', section: 'family', reverse: false },
  { id: 2, text: 'Evde sürekli "Ders çalış" uyarısı alırım, bu beni strese sokar.', section: 'family', reverse: true },
  { id: 3, text: 'Ailem beni sık sık başkalarının çocuklarıyla veya kardeşlerimle kıyaslar.', section: 'family', reverse: true },
  { id: 4, text: 'Ders dışındaki hobilerim (spor, müzik vb.) ailem tarafından desteklenir.', section: 'family', reverse: false },
  { id: 5, text: 'Notlarım düştüğünde ailem "Nerede hata yaptık, nasıl çözeriz?" diye sorar.', section: 'family', reverse: false },
  { id: 6, text: 'Notlarım düştüğünde ailem bana küser, kızar veya cezalandırır.', section: 'family', reverse: true },
  { id: 7, text: 'Geleceğimle ilgili kararları (bölüm, meslek) benim yerime ailem verir.', section: 'family', reverse: true },
  { id: 8, text: 'Ailem benden "mükemmel" olmamı bekler, küçük hataları kabul etmez.', section: 'family', reverse: true },
  { id: 9, text: 'Sınav kaygımı ailemle rahatça paylaşabilirim, beni dinlerler.', section: 'family', reverse: false },
  { id: 10, text: 'Ailem, başarısız olursam "emeklerinin boşa gideceğini" söyler.', section: 'family', reverse: true },

  // SECTION B: Benlik Saygısı (11-20)
  { id: 11, text: 'Kendimi genel olarak değerli ve sevilmeye layık bir insan olarak görüyorum.', section: 'self', reverse: false },
  { id: 12, text: 'Başarısız olduğumda kendimi tamamen "işe yaramaz" hissederim.', section: 'self', reverse: true },
  { id: 13, text: 'Hata yaptığımda kendimi affetmekte zorlanırım, sürekli kendimi suçlarım.', section: 'self', reverse: true },
  { id: 14, text: 'Başkalarının benim hakkımdaki düşünceleri, kendi düşüncemden daha önemlidir.', section: 'self', reverse: true },
  { id: 15, text: 'Zorluklarla karşılaştığımda pes etmek yerine mücadele gücünü kendimde bulurum.', section: 'self', reverse: false },
  { id: 16, text: 'Kendimi fiziksel, sosyal ve kişisel özelliklerimle barışık hissederim.', section: 'self', reverse: false },
  { id: 17, text: 'Sık sık "Keşke başka biri olsaydım" diye düşünürüm.', section: 'self', reverse: true },
  { id: 18, text: 'Bir toplulukta fikirlerimi rahatça ifade edebilirim.', section: 'self', reverse: false },
  { id: 19, text: 'Eleştirildiğimde aşırı savunmaya geçerim veya çok üzülürüm.', section: 'self', reverse: true },
  { id: 20, text: 'Geleceğe dair umutluyum, hayatın kontrolünün elimde olduğuna inanırım.', section: 'self', reverse: false },

  // SECTION C: Akademik Benlik (21-30)
  { id: 21, text: 'Yeterince çalışırsam her türlü konuyu öğrenebileceğime inanırım.', section: 'academic', reverse: false },
  { id: 22, text: 'Matematik/Fen gibi sayısal derslerde zihnimin "basmadığını" düşünürüm.', section: 'academic', reverse: true },
  { id: 23, text: 'Sınavlarda bildiğim soruları bile yapamayacağımdan korkarım.', section: 'academic', reverse: true },
  { id: 24, text: 'Sınıfımdaki diğer arkadaşlarımdan daha yavaş öğrendiğimi düşünüyorum.', section: 'academic', reverse: true },
  { id: 25, text: 'Yeni ve zor konular öğrenmek beni korkutmaz, aksine heyecanlandırır.', section: 'academic', reverse: false },
  { id: 26, text: 'Başarısız olursam bu "yeteneksizliğimden" değil, "yanlış çalışmamdan" kaynaklıdır.', section: 'academic', reverse: false },
  { id: 27, text: 'Öğretmenlerimin beni "başarılı bir öğrenci" olarak gördüğünü düşünürüm.', section: 'academic', reverse: false },
  { id: 28, text: 'Ders çalışırken dikkattim dağılsa bile tekrar odaklanmayı başarabilirim.', section: 'academic', reverse: false },
  { id: 29, text: 'Sınav anında heyecanımı kontrol edebilirim.', section: 'academic', reverse: false },
  { id: 30, text: 'Hedeflediğim üniversiteyi/liseyi kazanacak potansiyele sahibim.', section: 'academic', reverse: false }
];

export default function AbbaAnaliz() {
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

  const calculateScores = () => {
    const scores = {
      family: 0,
      self: 0,
      academic: 0
    };

    questions.forEach(q => {
      const value = answers[q.id] || 3;
      const score = q.reverse ? (6 - value) : value;
      scores[q.section as keyof typeof scores] += score;
    });

    return {
      scores,
      averages: {
        family: scores.family / 10,
        self: scores.self / 10,
        academic: scores.academic / 10
      }
    };
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
      const results = calculateScores();
      await analysisService.saveResult(user.uid, 'ABBA', {
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

  const currentSection = sections[currentStep];
  const sectionQuestions = questions.filter(q => q.section === currentSection.id);

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white">Analiz Başarıyla Tamamlandı!</h2>
          <p className="text-slate-400 font-medium">Bu veriler, koçunun seni daha iyi yönlendirmesini sağlayacak. Kendine dürüst olduğun için teşekkürler.</p>
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
          <h1 className="text-4xl font-black text-white">AİLE VE BENLİK BÜTÜNCÜL ANALİZ ENVANTERİ (ABBA)</h1>
        </header>

        <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
                <Heart size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Envanter Amacı</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  Bu envanter, aile ortamını nasıl algıladığını (Ebeveyn Tutumu), genel öz değerini (Benlik Saygısı) ve akademik becerilerine dair inancını ölçmek için tasarlanmıştır. 
                  Koçluk sürecindeki duygusal bariyerleri tespit etmemize yardımcı olur.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Bilimsel Temel</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  Bu test; <strong>Baumrind’in Ebeveynlik Stilleri</strong>, <strong>Rosenberg Benlik Saygısı Ölçeği</strong> ve <strong>Bandura’nın Öz-Yeterlilik Kuramı</strong> gibi akademik dayanaklar üzerine kurgulanmıştır.
                </p>
              </div>
            </div>

            <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl space-y-3 shadow-lg shadow-amber-500/5">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertCircle size={18} />
                <h4 className="text-sm font-black uppercase tracking-widest">Bilimsel Not ve Uyarı</h4>
              </div>
              <p className="text-xs text-amber-200/70 leading-relaxed font-medium">
                ABBA Envanteri, akademik koçluk ve öğrenci farkındalığını artırma odaklı bilimsel kuramlara (Baumrind, Bandura, Rosenberg) dayalı bir ölçektir. 
                Bu envanter <strong>bir psikolojik tanı veya klinik değerlendirme değildir.</strong> 
                Sonuçlar, öğrencinin duygusal/akademik algısını koçluk bağlamında iyileştirmek için bir yol haritası sunar.
              </p>
            </div>

            <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl space-y-3">
              <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Uygulama Notları</h4>
              <ul className="text-sm text-slate-400 space-y-2 font-medium">
                <li className="flex items-center gap-2">• Kesinlikle yalnız olduğun bir ortamda doldurmalısın.</li>
                <li className="flex items-center gap-2">• Toplam 30 madde bulunmaktadır, yaklaşık 20-25 dakika sürer.</li>
                <li className="flex items-center gap-2">• Cevapların ailenle doğrudan paylaşılmaz, sadece rehberlik amaçlı skorlar kullanılır.</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <button
              onClick={() => setShowIntro(false)}
              className="w-full md:w-auto px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
            >
              Envanteri Başlat
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="space-y-4">
        <button 
          onClick={() => navigate('/panel/ogrenci/analizler')}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <ChevronLeft size={16} />
          Geri Dön
        </button>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
            <Brain size={12} />
            AİLE VE BENLİK BÜTÜNCÜL ANALİZ ENVANTERİ (ABBA)
          </div>
          <h1 className="text-3xl font-black text-white">Aile, Benlik ve Akademik İnanç</h1>
          <p className="text-slate-400 font-medium leading-relaxed italic">
            "Kendine dürüst ol. Bu cevapları ailene aynen göstermeyeceğiz, sadece genel gelişim stratejilerini konuşacağız."
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-4">
          <Info className="text-amber-500 shrink-0" size={20} />
          <p className="text-xs text-amber-200/80 leading-relaxed font-medium">
            <strong>Yasal Bildirim:</strong> Bu analiz akademik koçluk süreci için bir farkındalık aracıdır. Klinik bir tanı veya psikolojik tedavi yerine geçmez. Duygusal zorlanmaların varsa mutlaka bir uzmana başvurmalısın.
          </p>
        </div>
      </header>

      {/* Stepper Progress */}
      <div className="flex gap-2">
        {sections.map((_, idx) => (
          <div 
            key={idx} 
            className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
              idx <= currentStep ? 'bg-indigo-500' : 'bg-white/5'
            }`} 
          />
        ))}
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-12 overflow-hidden relative">
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
                <p className="text-slate-500 text-sm font-medium">Soruları kendine en uygun şekilde puanla.</p>
              </div>
            </div>

            <div className="space-y-8">
              {sectionQuestions.map((q, idx) => (
                <div key={q.id} className="space-y-6 pt-8 first:pt-0 border-t border-white/5 first:border-0">
                  <div className="flex gap-4">
                    <span className="text-lg font-black text-slate-700 italic">{(currentStep * 10) + idx + 1}.</span>
                    <p className="text-lg text-slate-200 font-medium leading-normal">{q.text}</p>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() => handleAnswer(q.id, val)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300 ${
                          answers[q.id] === val 
                            ? 'bg-indigo-600 border-indigo-400 text-white scale-105 shadow-lg shadow-indigo-600/20' 
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
                      alert('Lütfen bu bölümdeki tüm soruları yanıtlayın.');
                    }
                  }}
                  className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all hover:scale-105"
                >
                  Sonraki Bölüm
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-3 px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 disabled:opacity-50"
                >
                  {loading ? 'Hesaplanıyor...' : 'Analizi Tamamla & Kaydet'}
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
