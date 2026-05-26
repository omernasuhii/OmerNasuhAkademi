import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight, Brain, BookOpen, Clock, ArrowLeft, Loader2, Sparkles, CheckCircle2, ShieldAlert, Target, Search, Scale, ShieldCheck, Heart, UserPlus, Zap } from 'lucide-react';
import { analysisService } from '../../../services/analysisService';
import { useAuth } from '../../../lib/AuthContext';

const QUESTIONS = [
  { id: 1, text: "Ders çalışırken arkadaşlarım aradığında veya mesaj attığında, bakmazsam ayıp olur diye düşünürüm.", category: 'AKRAN' },
  { id: 2, text: "Arkadaşlarım ısrar ettiğinde, istemesem bile planımı bozar onlara katılırım.", category: 'AKRAN' },
  { id: 3, text: "Bir arkadaşım benden notlarımı veya ödevimi istediğinde, vermezsem bana küser diye korkarım.", category: 'AKRAN' },
  { id: 4, text: "Arkadaş grubunda fikrim sorulduğunda, \"Fark etmez, siz ne isterseniz o olsun\" derim.", category: 'AKRAN' },
  { id: 5, text: "Biri bana kaba davrandığında veya şaka yollu hakaret ettiğinde, gülüp geçerim (tepki veremem).", category: 'AKRAN' },
  { id: 6, text: "Hoşlanmadığım bir lakap takıldığında bile itiraz edemem.", category: 'AKRAN' },
  { id: 7, text: "Ödünç verdiğim bir eşyayı (kalem, kitap) geri istemeye çekinirim.", category: 'AKRAN' },
  { id: 8, text: "Öğretmenden dersi anlamadığımda soru sormaya çekinirim, \"kızar\" veya \"aptal sanır\" diye korkarım.", category: 'OTORITE' },
  { id: 9, text: "Ailem benim adıma bir karar verdiğinde (kurs, bölüm vb.), istemesem de \"Peki\" derim.", category: 'OTORITE' },
  { id: 10, text: "Sınavda haksız yere puanım kırılsa bile öğretmenin yanına gidip hakkımı arayamam.", category: 'OTORITE' },
  { id: 11, text: "Ailemi hayal kırıklığına uğratmamalıyım dese bile kendi hayallerimden vazgeçerim.", category: 'OTORITE' },
  { id: 12, text: "Otorite figürleri (büyükler) konuştuğunda, haklı olsam bile susmayı tercih ederim.", category: 'OTORITE' },
  { id: 13, text: "Başakalarından yardım istemek bana \"yük oluyormuşum\" gibi hissettirir.", category: 'OTORITE' },
  { id: 14, text: "\"Hayır\" dediğimde kendimi çok suçlu ve kötü hissederim.", category: 'ICSEL' },
  { id: 15, text: "Bir tartışma çıkmasındansa, haksız olmayı kabul ederim (Çatışmadan kaçınma).", category: 'ICSEL' },
  { id: 16, text: "Başkaları ne der, hakkımda ne düşünür diye sürekli endişe ederim (Sosyal Onay).", category: 'ICSEL' },
  { id: 17, text: "Kendi isteklerimi dile getirmek bana \"bencillik\" gibi gelir.", category: 'ICSEL' },
  { id: 18, text: "İnsanlar beni sevsin diye sürekli özür dilerim.", category: 'ICSEL' },
  { id: 19, text: "Öfkemi dışarı yansıtamam, içime atarım ve sonra kendime kızarım.", category: 'ICSEL' },
  { id: 20, text: "Başkalarının işlerini yapmaktan (ödevine yardım vb.) kendi işime zaman kalmaz.", category: 'ICSEL' }
];

export default function SdSyeAnaliz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'quiz' | 'loading'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  const handleChoice = (value: number) => {
    setAnswers(prev => ({ ...prev, [QUESTIONS[currentQuestion].id]: value }));
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const calculateResults = () => {
    const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
    
    let communicationStyle = "";
    if (totalScore <= 40) communicationStyle = "Güvengen (Assertive)";
    else if (totalScore <= 65) communicationStyle = "Riskli (Kibar/Tavizkar)";
    else communicationStyle = "Pasif (Boyun Eğici)";

    return { totalScore, communicationStyle };
  };

  const handleFinish = async () => {
    if (!user) return;
    setStep('loading');
    setLoading(true);

    try {
      const results = calculateResults();
      const result = await analysisService.saveResult(user.uid, 'SD-SYE', {
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
            <div className="w-20 h-20 bg-purple-500/20 rounded-3xl flex items-center justify-center text-purple-400 mx-auto shadow-xl border border-purple-500/20">
              <Users size={40} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white tracking-tight">SD-SYE: Sosyal Duruş ve Sınır Yönetimi</h1>
              <p className="text-xl text-slate-400 font-medium">İletişim tarzını analiz et, akademik önceliklerini koruma kapasiteni ölç.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-purple-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Brain size={14} /> Amaç
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">"Hayır" diyebilme ve kişisel sınırlarını savunabilme yetini ölçmek.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <UserPlus size={14} /> Kurumsal Dayanak
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">Jeffrey Young - Şema Terapi (Boyun Eğicilik) ekolüne dayanır.</p>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="text-amber-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Scale size={14} /> Yöntem
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-semibold">İletişim boyutları (Pasif, Güvengen, Saldırgan) analizi.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('quiz')}
              className="group relative px-12 py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-lg transition-all duration-300 shadow-2xl shadow-purple-500/20 overflow-hidden"
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
              <div className="flex gap-1 overflow-hidden max-w-[150px] sm:max-w-none">
                {QUESTIONS.map((_, i) => (
                  <div 
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 flex-shrink-0 ${
                      i === currentQuestion ? 'w-8 bg-purple-500' : 
                      i < currentQuestion ? 'w-4 bg-purple-500/40' : 'w-4 bg-white/5'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-black text-purple-400 uppercase tracking-widest">{currentQuestion + 1} / {QUESTIONS.length}</span>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 sm:p-12 space-y-12 transition-all duration-500">
              <div className="space-y-6">
                 <div className="flex items-center gap-2 text-purple-400">
                    <ShieldCheck size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                       {QUESTIONS[currentQuestion].category === 'AKRAN' ? 'Akran İlişkileri' : 
                        QUESTIONS[currentQuestion].category === 'OTORITE' ? 'Otorite İlişkileri' : 'İçsel Duygular'}
                    </span>
                 </div>
                 <h2 className="text-2xl sm:text-3xl font-bold text-white italic leading-tight">
                    {QUESTIONS[currentQuestion].text}
                 </h2>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: 1, label: "Asla" },
                  { value: 2, label: "Nadiren" },
                  { value: 3, label: "Bazen" },
                  { value: 4, label: "Sık Sık" },
                  { value: 5, label: "Her Zaman" }
                ].map((choice) => (
                  <button
                    key={choice.value}
                    onClick={() => handleChoice(choice.value)}
                    className="group flex items-center justify-between p-6 bg-white/5 hover:bg-purple-600/10 border border-white/5 hover:border-purple-500/30 rounded-3xl transition-all duration-300"
                  >
                    <span className="text-lg font-bold text-slate-300 group-hover:text-white transition-colors">
                      {choice.label}
                    </span>
                    <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center font-black transition-all ${
                      choice.value >= 4 ? 'text-rose-400 border-rose-500/30' : 'text-slate-500 group-hover:text-purple-400'
                    }`}>
                      {choice.value}
                    </div>
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
              <Loader2 size={64} className="text-purple-500 animate-spin" />
              <div className="absolute inset-0 blur-2xl bg-purple-500/20 animate-pulse"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">Sosyal Haritan Çiziliyor...</h3>
              <p className="text-slate-400 font-medium">İletişim tarzın ve sınır yönetim kapasiten analiz ediliyor.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
