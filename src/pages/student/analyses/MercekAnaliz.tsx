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
  Search,
  Target,
  IterationCcw,
  Eye,
  Telescope,
  Trash2,
  Plane,
  Microscope,
  Sun,
  Glasses
} from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';

interface MercekStep {
    id: string;
    title: string;
    icon: React.ElementType;
    color: string;
    description: string;
    questions: string[];
}

const MERCEKLER: MercekStep[] = [
    {
        id: 'mikroskop',
        title: 'Mikroskop: Detaycı Bakış',
        icon: Microscope,
        color: 'text-indigo-400',
        description: 'Duyguyu çıkarıp sadece verilere odaklanıyoruz. Bir bilim insanı gibi nesnel gerçekleri incele.',
        questions: [
            'Bu durumu bir bilim insanı gibi incelesek, elindeki somut kanıtlar neler?',
            'Yaşadığın bu durumun gerçekliğini destekleyen nesnel veriler var mı, yoksa bu senin bir yorumun mu?',
            'Bu olay tam olarak ne zaman başladı ve ne kadar sürdü?'
        ]
    },
    {
        id: 'teleskop',
        title: 'Teleskop: Uzak Bakış',
        icon: Telescope,
        color: 'text-blue-400',
        description: 'Zaman algımızı değiştiriyoruz. Şu anki devasa görünen sorunu 5-10 yıl sonrasına taşıyoruz.',
        questions: [
            'Bu olaydan 5 yıl sonra, hayatının bambaşka bir evresinde bu durumu hatırladığında sence ne kadar önemli olacak?',
            '10 yıl sonraki "Bilge Sen", şu anki sana bu durumla ilgili ne tavsiye verirdi?',
            'Bu sorun hayatının koca bir "filmi" olsaydı, bu sahne toplamda kaç dakika yer kaplardı?'
        ]
    },
    {
        id: 'helikopter',
        title: 'Helikopter: Objektif Bakış',
        icon: Plane,
        color: 'text-cyan-400',
        description: 'Kuş bakışı izliyoruz. Kendi hayatının dışına çıkıp bir kamera gibi sahneyi yukarıdan seyret.',
        questions: [
            'Şu an bulunduğun ortama tepeden bakan bir kamera olsaydın, seni ve çevrendekileri tam olarak nasıl görürdün?',
            'Olayın içinde olmayan, tamamen tarafsız bir gözlemci bu durumu haber yapsa en nesnel manşeti ne olurdu?',
            'Bu durumun parçalarından hangileri senin doğrudan kontrolünde, hangileri tamamen dışında?'
        ]
    },
    {
        id: 'ters-aci',
        title: 'Ters Açı: Empati Gözlüğü',
        icon: Glasses,
        color: 'text-orange-400',
        description: 'Karşı tarafın (veya olayın diğer öznelerinin) zihnine giriyoruz. Onların korkularını ve hedeflerini anlamaya çalışıyoruz.',
        questions: [
            'Şimdi olayın diğer tarafındaki kişinin (veya tarafların) yerine geç. Onlar şu an ne düşünüyor olabilir?',
            'Onların da kendi içlerinde bir stresi, korkusu veya ulaşmaya çalıştığı bir hedefi olabilir mi?',
            'Karşı taraf bu davranışı sana bilinçli bir "zarar vermek" için mi, yoksa kendi "doğrusu/ihtiyacı" olduğu için mi yapıyor?'
        ]
    },
    {
        id: 'filtre',
        title: 'Filtre: Fırsat Bakışı',
        icon: Sun,
        color: 'text-yellow-400',
        description: 'Krizin içindeki hediyeyi arıyoruz. Bu durumun seni hangi yönden geliştirdiğini bul.',
        questions: [
            'Bu zorlayıcı süreç sana ne öğretti? (Örn: Sabır, sınır çizme, kriz yönetimi)',
            'Bu sorunun içinde gizlenmiş, ileride kullanabileceğin bir "fayda" veya tecrübe olabilir mi?',
            'Bu durum sayesinde hangi karakter özelliğin (irade, dayanıklılık, farkındalık) güçlendi?'
        ]
    },
    {
        id: 'cop-kutusu',
        title: 'Çöp Kutusu: İrade Bakışı',
        icon: Trash2,
        color: 'text-rose-400',
        description: 'Gereksiz yükleri bırakıyoruz. Değiştiremeyeceğin kısımları imha etme vakti.',
        questions: [
            'Bu durumun hangi kısmını (geçmiş, başkalarının tavrı vb.) asla değiştiremezsin?',
            'Değiştiremeyeceğin bu "statik" kısımları şimdi zihnindeki çöp kutusuna atsan yükün ne kadar hafifler?'
        ]
    }
];

export default function MercekAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"intro" | "pre-test" | "mercekler" | "post-test" | "result">("intro");
  const [loading, setLoading] = useState(true);
  const [currentMercekIdx, setCurrentMercekIdx] = useState(0);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    problem: '',
    preScore: 5,
    postScore: 5,
    answers: {} as Record<string, string>
  });

  useEffect(() => {
    const checkExisting = async () => {
      if (!user) return;
      try {
        const results = await analysisService.getResults(user.uid, "MERCEK");
        if (results && results.length > 0) {
          const latest = results[0];
          setFormData(latest.data.form || latest.data);
          setAiInsight(latest.data.insight);
          setStep("result");
        }
      } catch (error) {
        console.error("Mevcut veri hatası:", error);
      } finally {
        setLoading(false);
      }
    };
    checkExisting();
  }, [user]);

  const handleAnswerChange = (qId: string, val: string) => {
    setFormData(prev => ({
        ...prev,
        answers: { ...prev.answers, [qId]: val }
    }));
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const payload = {
        form: formData,
        changeScore: formData.preScore - formData.postScore
      };

      const result = await analysisService.saveResult(user.uid, "MERCEK", payload);
      if (result?.id) {
        navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`);
      }
    } catch (error: any) {
      alert("Hata oluştu: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === "intro") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-cyan-500" size={40} />
        <p className="text-slate-400 font-bold animate-pulse">Mercekler Hazırlanıyor...</p>
      </div>
    );
  }

  if (step === "result" && aiInsight) {
    return (
      <div className="max-w-5xl mx-auto space-y-12 pb-20 pt-8 animate-in fade-in duration-700 px-4">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-black uppercase tracking-widest text-sm">
            <CheckCircle2 size={16} />
            MERCEK ANALİZİ TAMAMLANDI
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">Yük Skorun: <span className="text-emerald-400">{formData.postScore}/10</span></h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
             Bakış açını esneterek sorunu yeniden çerçeveledin. İşte AI Koçunun senin için hazırladığı derinlikli analiz.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="md:col-span-1 space-y-6">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 space-y-6">
                    <div className="flex items-center gap-3">
                        <Target size={24} className="text-cyan-400" />
                        <h3 className="text-lg font-bold text-white">Duygu Değişimi</h3>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Önce</p>
                            <p className="text-2xl font-black text-slate-400">{formData.preScore}</p>
                        </div>
                        <div className="flex flex-col items-center">
                            < ChevronRight className="text-cyan-500" size={24} />
                            <span className="text-[10px] font-bold text-emerald-400">-{formData.preScore - formData.postScore} Puan</span>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Sonra</p>
                            <p className="text-2xl font-black text-emerald-400">{formData.postScore}</p>
                        </div>
                    </div>
                </div>

                <button
                   onClick={() => {
                       setStep('intro');
                       setAiInsight(null);
                   }}
                   className="w-full px-6 py-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                >
                   <IterationCcw size={18} />
                   Farklı Bir Sorunla Dene
                </button>
           </div>

           <div className="md:col-span-2">
                <div className="bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5">
                        <Brain size={24} className="text-cyan-400" />
                        <div>
                            <h3 className="text-xl font-bold text-white">AI Bilişsel Analizi</h3>
                            <p className="text-xs text-slate-400 font-medium">Bilişsel Esneklik Değerlendirmen</p>
                        </div>
                    </div>
                    <div className="prose prose-invert prose-cyan max-w-none prose-p:text-slate-300">
                        <Markdown>{aiInsight}</Markdown>
                    </div>
                </div>

                <div className="flex justify-end mt-8">
                    <button
                        onClick={() => navigate("/panel/ogrenci/analizler")}
                        className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-cyan-600/20"
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
            <Eye size={12} />
            BİLİŞSEL ESNEKLİK
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">
            MERCEK: Çok Boyutlu Problem Çözme
          </h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl">
            Seni tıkayan, çözümsüz hissettiğin o soruna; farklı merceklerle, farklı açılardan bakmaya hazır mısın? Tünel bakışından çıkma vaktin geldi.
          </p>
        </header>

        <div className="bg-slate-900 border border-white/5 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center gap-4 text-indigo-400">
            <ShieldCheck size={24} />
            <span className="font-bold text-lg">Kuramsal Dayanak</span>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed">
            Bu modül; <strong>NLP (Algısal Pozisyonlar)</strong>, <strong>Stoacılık (Kontrol Dikotomisi)</strong> ve <strong>Gestalt Kuramına</strong> dayanır. Amacımız duygusal tıkanıklığı bilişsel esneklikle aşmaktır.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                <p className="text-xs font-black text-white">NLP Bakışı</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">Kendini başkasının veya tarafsız bir izleyicinin yerine koyarak algısal pozisyonunu değiştirir.</p>
             </div>
             <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                <p className="text-xs font-black text-white">Stoa İlkeleri</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">Enerjini sadece değiştirebileceğin (kontrolünde olan) kısımlara harcamayı öğretir.</p>
             </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-white/5 rounded-[32px] p-8 space-y-6">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Şu An Takıldığın O Sorun / Durum Nedir?</label>
            <textarea 
                value={formData.problem}
                onChange={(e) => setFormData({...formData, problem: e.target.value})}
                placeholder="Örneğin: Matematik hocamın bana takmış olması, denemede yaptığım o büyük hata, ailemle yaşadığım tartışma..."
                className="w-full bg-slate-800/50 border border-white/10 rounded-2xl p-4 text-white focus:border-indigo-500 outline-none h-32 resize-none transition-all"
            />
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={() => setStep("pre-test")}
            disabled={!formData.problem.trim()}
            className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-indigo-600/20 flex items-center gap-3 disabled:opacity-50"
          >
            Süreci Başlat
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    );
  }

  if (step === "pre-test") {
      return (
        <div className="max-w-2xl mx-auto space-y-12 pb-20 pt-12 animate-in fade-in zoom-in duration-500 px-4 text-center">
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest">AÇILIŞ DEĞERLENDİRMESİ</div>
                <h2 className="text-3xl font-black text-white">Yükün Ne Kadar Ağır?</h2>
                <p className="text-slate-400">Bu sorun şu an zihninde ne kadar yer kaplıyor, sana ne kadar yük veriyor? (1: Çok Hafif, 10: Felaket)</p>
            </div>

            <div className="flex flex-col gap-8 items-center">
                <div className="text-6xl font-black text-white">{formData.preScore}</div>
                <input 
                    type="range" min="1" max="10" 
                    value={formData.preScore}
                    onChange={(e) => setFormData({...formData, preScore: parseInt(e.target.value)})}
                    className="w-full h-3 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
                <button
                    onClick={() => setStep("mercekler")}
                    className="px-12 py-5 bg-white text-slate-900 rounded-3xl font-black text-xl transition-all hover:scale-105 active:scale-95"
                >
                    Merceklere Geç
                </button>
            </div>
        </div>
      );
  }

  if (step === "post-test") {
    return (
      <div className="max-w-2xl mx-auto space-y-12 pb-20 pt-12 animate-in fade-in zoom-in duration-500 px-4 text-center">
          <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest">KAPANIŞ DEĞERLENDİRMESİ</div>
              <h2 className="text-3xl font-black text-white">Şimdi Nasıl Hissediyorsun?</h2>
              <p className="text-slate-400">Tüm merceklerden baktıktan sonra bu sorun şu an sana ne kadar yük veriyor?</p>
          </div>

          <div className="flex flex-col gap-8 items-center">
              <div className="text-6xl font-black text-white">{formData.postScore}</div>
              <input 
                  type="range" min="1" max="10" 
                  value={formData.postScore}
                  onChange={(e) => setFormData({...formData, postScore: parseInt(e.target.value)})}
                  className="w-full h-3 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
              />
              <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="px-12 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 flex items-center gap-3"
              >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                  Analizi Tamamla
              </button>
          </div>
      </div>
    );
  }

  if (step === "mercekler") {
    const mercek = MERCEKLER[currentMercekIdx];
    const MercekIcon = mercek.icon;
    const progress = ((currentMercekIdx + 1) / MERCEKLER.length) * 100;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-8 animate-in slide-in-from-right duration-500 px-4">
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white/5 ${mercek.color}`}>
                        <MercekIcon size={20} />
                    </div>
                    <span className="text-sm font-bold text-white uppercase tracking-widest">{mercek.title}</span>
                </div>
                <div className="text-xs font-black text-slate-500">{currentMercekIdx + 1} / {MERCEKLER.length}</div>
            </div>

            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-500" style={{width: `${progress}%`}} />
            </div>

            <div className="space-y-4">
                <p className="text-lg text-slate-300 font-medium leading-relaxed italic">"{mercek.description}"</p>
            </div>

            <div className="space-y-6">
                {mercek.questions.map((q, idx) => (
                    <div key={idx} className="space-y-3 bg-slate-900 border border-white/5 p-6 rounded-[24px]">
                        <label className="text-sm font-bold text-white leading-relaxed">{q}</label>
                        <textarea 
                            value={formData.answers[`${mercek.id}_${idx}`] || ''}
                            onChange={(e) => handleAnswerChange(`${mercek.id}_${idx}`, e.target.value)}
                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-4 text-slate-300 focus:border-indigo-500 outline-none h-24 resize-none transition-all"
                            placeholder="Bu mercekten bakınca ne görüyorsun?..."
                        />
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center pt-4">
                <button
                    onClick={() => {
                        if (currentMercekIdx > 0) setCurrentMercekIdx(prev => prev - 1);
                        else setStep('pre-test');
                    }}
                    className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 transition-all"
                >
                    <ChevronLeft size={24} />
                </button>
                
                <button
                    onClick={() => {
                        if (currentMercekIdx < MERCEKLER.length - 1) setCurrentMercekIdx(prev => prev + 1);
                        else setStep('post-test');
                    }}
                    className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                    {currentMercekIdx === MERCEKLER.length - 1 ? 'Son Değerlendirme' : 'Sonraki Mercek'}
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
  }

  return null;
}
