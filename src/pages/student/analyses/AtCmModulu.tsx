import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, ChevronRight, ChevronLeft, Save, Activity, Zap, Fingerprint, Target, Timer, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';

const steps = [
  {
    id: 1,
    title: '"TUŞ"U BELİRLEME',
    subtitle: 'Yer Seçimi',
    description: 'Sınavda kimseye fark ettirmeden yapabileceğin, benzersiz bir hareket seç (Örn: Sol baş parmak ve yüzük parmağını birleştirmek).',
    icon: Fingerprint,
    field: 'chosenAnchor',
    placeholder: 'Hangi hareketi seçtin? (Örn: Kulağımı hafifçe sıkmak)',
  },
  {
    id: 2,
    title: 'DUYGUYU SEÇME',
    subtitle: 'Kaynak Duygu',
    description: 'Sınav anında en çok hangi duyguya ihtiyacın var? Çelik gibi odaklanma mı, sonsuz bir sakinlik mi, yoksa sarsılmaz bir özgüven mi?',
    icon: Target,
    field: 'chosenEmotion',
    placeholder: 'Hangi duyguyu çapalamak istersin?',
  },
  {
    id: 3,
    title: 'ZİHİNSEL CANLANDIRMA',
    subtitle: 'Yükleme Aşaması',
    description: 'Gözlerini kapat. Bu duyguyu en yoğun hissettiğin o anı hatırla. O anın renklerini, seslerini ve hissini tüm vücuduna yay. Hazır olduğunda devam et.',
    icon: Brain,
    hasAction: true,
  },
  {
    id: 4,
    title: 'ÇIPALAMA ANI',
    subtitle: 'Mühürleme',
    description: 'Duygu zirve yaptığı anda (Peak Point), seçtiğin o hareketi yap ve 10 saniye boyunca bırakma. Duyguyu tuşuna hapsediyoruz!',
    icon: Zap,
    showTimer: true,
  },
  {
    id: 5,
    title: 'DURUMU BOZMA',
    subtitle: 'Beyni Resetleme',
    description: 'Şimdi gözlerini aç ve odağı dağıtalım. Dün akşam ne yedin? Telefon numaranın son hanesi kaç? (Hızlıca başka bir şey düşün!)',
    icon: RefreshCcw,
  },
  {
    id: 6,
    title: 'TEST ETME',
    subtitle: 'Ateşleme',
    description: 'Şimdi o hareketi (tuşu) tekrar yap. İçinde bir ısınma, o duyguya dair bir kıpırtı hissediyor musun? İşte bu senin gizli gücün.',
    icon: CheckCircle2,
    field: 'testResult',
    placeholder: 'Nasıl hissettin? (Örn: İçime bir güven geldi)',
  }
];

export default function AtCmModulu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setTimeLeft(10);
    } else {
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docId = await analysisService.saveResult(user.uid, 'AT-CM', {
        answers: formData,
        timestamp: new Date()
      });
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
          <h2 className="text-3xl font-black text-white">Akıllı Tuşunuz Hazır!</h2>
          <p className="text-slate-400 font-medium tracking-wide">NLP tabanlı çapalama verileriniz kaydedildi. Yapay zeka "Şarj Planınızı" hazırlıyor...</p>
        </div>
      </div>
    );
  }

  if (showIntro) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 pt-8">
        <header className="space-y-4">
          <button 
            onClick={() => navigate('/panel/ogrenci/analizler')}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mt-4"
          >
            <ChevronLeft size={16} />
            Laboratuvara Dön
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
            <Zap size={12} />
            NÖRO-PSİKOLOJİK MODÜL
          </div>
          <h1 className="text-4xl font-black text-white">Akıllı Tuş: Duygu Kontrol ve Çıpalama Modülü (AT-ÇM)</h1>
        </header>

        <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Brain size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Modülün Amacı</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  İhtiyaç duyduğun pozitif bir duyguyu (Özgüven, Odaklanma, Sakinlik) vücudundaki özel bir noktaya (tetikleyici) bağlamak. Sınav anında bu noktaya dokunarak, o duyguyu otomatik olarak geri çağırmanı sağlar.
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
                  <strong>Ivan Pavlov – Klasik Koşullanma</strong> ve <strong>NLP (Neuro-Linguistic Programming)</strong> tekniklerini temel alır. Nötr bir uyarıcının (hareket), şartlı bir tepki (duygu) yaratması prensibiyle çalışır.
                </p>
              </div>
            </div>

            <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl space-y-3">
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <Timer size={16} /> Önemli Not
              </h4>
              <p className="text-sm text-slate-400 font-medium">
                Bu modül interaktif bir rehberdir. Adımları takip ederken belirtilen süreleri ve yönergeleri tam uygulaman çapanın gücünü belirler. Sessiz bir ortamda olman önerilir.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 text-center">
            <button
              onClick={() => setShowIntro(false)}
              className="w-full md:w-auto px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
            >
              Uygulamayı Başlat
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeStep = steps[currentStep];
  const StepIcon = activeStep.icon;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500 pt-8">
      <div className="flex justify-between items-center px-4">
        <button 
          onClick={() => currentStep === 0 ? setShowIntro(true) : setCurrentStep(prev => prev - 1)}
          className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-2">
          {steps.map((_, idx) => (
            <div 
              key={idx} 
              className={`w-3 h-3 rounded-full transition-colors ${idx === currentStep ? 'bg-indigo-500' : idx < currentStep ? 'bg-emerald-500' : 'bg-white/10'}`}
            />
          ))}
        </div>
        <div className="w-10 opacity-0"></div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8"
        >
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <StepIcon size={40} />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">{activeStep.subtitle}</span>
              <h2 className="text-3xl font-black text-white">{activeStep.title}</h2>
              <p className="text-slate-400 font-medium leading-relaxed max-w-xl mx-auto">
                {activeStep.description}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {activeStep.field && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={formData[activeStep.field] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [activeStep.field!]: e.target.value }))}
                  placeholder={activeStep.placeholder}
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
            )}

            {activeStep.showTimer && (
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle 
                      cx="64" cy="64" r="60" 
                      className="fill-none stroke-white/5 stroke-[4]"
                    />
                    <circle 
                      cx="64" cy="64" r="60" 
                      className="fill-none stroke-indigo-500 stroke-[4] transition-all duration-1000"
                      style={{ 
                        strokeDasharray: 377, 
                        strokeDashoffset: 377 - (377 * timeLeft) / 10 
                      }}
                    />
                  </svg>
                  <span className="absolute text-3xl font-black text-white">{timeLeft}</span>
                </div>
                {!timerActive && timeLeft === 10 && (
                  <button 
                    onClick={() => setTimerActive(true)}
                    className="px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-bold flex items-center gap-2"
                  >
                    Tuşa Bas ve Tut!
                  </button>
                )}
                {timeLeft === 0 && (
                  <div className="text-emerald-400 font-bold flex items-center gap-2 animate-bounce">
                    <CheckCircle2 size={20} /> Mühürlendi!
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-8 border-t border-white/5">
            <button
              onClick={handleNext}
              disabled={loading || (activeStep.field && !formData[activeStep.field]) || (activeStep.showTimer && timeLeft > 0 && timerActive)}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? 'İnceleme Hazırlanıyor...' : currentStep === steps.length - 1 ? 'Çalışmayı Tamamla' : 'Sonraki Adıma Geç'}
              <ChevronRight size={24} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
