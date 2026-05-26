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
  UserCheck,
  Target,
  IterationCcw,
  Star,
  Zap,
  BarChart3,
  Smartphone,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';

const LIKERT_QUESTIONS = [
  "Ders çalışmaya başlamadan önce ne yapacağımı planlarım.",
  "Çalışma masam düzenli ve sadedir.",
  "Çalışırken cep telefonumu odadan çıkarırım/kapatırım.",
  "Anlamadığım konuları ertelemeden öğretmenime/koçuma sorarım.",
  "Deneme sınavı sonuçlarımı analiz eder, hatalarımı öğrenirim.",
  "Uykumu düzenli alırım (Günde en az 7-8 saat).",
  "Uzun süre masa başında dikkatim dağılmadan oturabilirim.",
  "Okul/Dershane dışında günlük tekrar yaparım.",
  "Sınav/Ders stresiyle başa çıkabilirim.",
  "Hedefim için içsel motivasyona sahibim (Aile zoruyla çalışmıyorum)."
];

export default function OtiAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"intro" | "academic" | "swot" | "behavior" | "digital" | "result">("intro");
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    academic: {
      favoriteDers: '',
      hardestDers: '',
      obp: '',
      target: '',
      importance: 5
    },
    swot: {
        strengths: ['', '', ''],
        weaknesses: ['', '', ''],
        opportunities: ['', '', ''],
        threats: ['', '', '']
    },
    behaviorAnswers: Array(10).fill(3),
    digital: {
        screenTime: '',
        apps: ['', '', ''],
        timeThief: ''
    }
  });

  useEffect(() => {
    const checkExisting = async () => {
      if (!user) return;
      try {
        const results = await analysisService.getResults(user.uid, "ÖTI-A");
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

  const calculateBehaviorScore = () => {
      return formData.behaviorAnswers.reduce((a, b) => a + b, 0);
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const score = calculateBehaviorScore();
      const payload = {
        form: formData,
        behaviorScore: score
      };

      const result = await analysisService.saveResult(user.uid, "ÖTI-A", payload);
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
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-slate-400 font-bold animate-pulse">Profil Hazırlanıyor...</p>
      </div>
    );
  }

  if (step === "result" && aiInsight) {
    const score = calculateBehaviorScore();
    let scoreColor = "text-rose-400";
    let scoreBg = "bg-rose-500/10";
    let scoreText = "Kırmızı Bölge: Disiplin İnşası Gerekli";

    if (score >= 26 && score <= 39) {
        scoreColor = "text-amber-400";
        scoreBg = "bg-amber-500/10";
        scoreText = "Sarı Bölge: Gelişime Açık";
    } else if (score >= 40) {
        scoreColor = "text-emerald-400";
        scoreBg = "bg-emerald-500/10";
        scoreText = "Yeşil Bölge: Performans Odaklı";
    }

    return (
      <div className="max-w-5xl mx-auto space-y-12 pb-20 pt-8 animate-in fade-in duration-700 px-4">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black uppercase tracking-widest text-sm text-center">
            <CheckCircle2 size={16} />
            ÖN ANALİZ TAMAMLANDI
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">Yol Haritan: <span className="text-emerald-400">YKS/LGS Strateji Belgesi</span></h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
            Hangi noktada olduğunu ve zirveye giden yolu haritalandırdık. AI Koçun verilerini analiz ederek sana bir baz plan çıkardı.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="md:col-span-1 space-y-6">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 space-y-6">
                    <div className="flex items-center gap-3">
                        <BarChart3 size={24} className="text-emerald-400" />
                        <h3 className="text-lg font-bold text-white">Çalışma Puanın</h3>
                    </div>
                    <div className={`p-6 rounded-2xl border border-white/5 text-center space-y-2 ${scoreBg}`}>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest opacity-50">Toplam Skor</p>
                        <p className={`text-5xl font-black ${scoreColor}`}>{score}<span className="text-xl text-slate-500">/50</span></p>
                        <p className={`text-xs font-bold ${scoreColor}`}>{scoreText}</p>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Hedef Önemi</p>
                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{width: `${formData.academic.importance * 10}%`}} />
                            </div>
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
                   Analizi Güncelle
                </button>
           </div>

           <div className="md:col-span-2">
                <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5">
                        <Brain size={24} className="text-emerald-400" />
                        <div>
                            <h3 className="text-xl font-bold text-white">AI Stratejik Analiz</h3>
                            <p className="text-xs text-slate-400 font-medium tracking-wide">Analiz Sonuçlarına Göre Özelleştirilmiştir</p>
                        </div>
                    </div>
                    <div className="prose prose-invert prose-emerald max-w-none prose-p:text-slate-300">
                        <Markdown>{aiInsight}</Markdown>
                    </div>
                </div>

                <div className="flex justify-end mt-8">
                    <button
                        onClick={() => navigate("/panel/ogrenci/analizler")}
                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <ClipboardList size={12} />
            TEMEL ANALİZ
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">
            ÖTI-A: Öğrenci Tanıma ve Ön Analiz
          </h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl">
            Sınav yolculuğuna başlamadan önce; kim olduğunu, nereden geldiğini ve hangi engellerle karşılaşacağını dürüstçe haritalandırıyoruz.
          </p>
        </header>

        <div className="bg-slate-900 border border-white/5 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center gap-4 text-emerald-400">
            <ShieldCheck size={24} />
            <span className="font-bold text-lg">Kuramsal Dayanak</span>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed">
            Bu modül; <strong>SWOT Analizi</strong> (Stratejik Yönetim), <strong>Bilişsel Davranışçı Yaklaşım</strong> ve <strong>Ekolojik Sistemler Kuramı</strong> temellerine dayanarak hazırlanmıştır.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                <p className="text-[10px] font-black text-white uppercase tracking-widest text-emerald-400">SWOT</p>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Güçlü ve zayıf yönlerini, fırsat ve tehditlerinle harmanlayarak strateji üretir.</p>
             </div>
             <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                <p className="text-[10px] font-black text-white uppercase tracking-widest text-emerald-400">BDY</p>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Bilişsel düzeydeki hedefin ile pratik davranışların arasındaki ilişkiyi ölçer.</p>
             </div>
             <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                <p className="text-[10px] font-black text-white uppercase tracking-widest text-emerald-400">Performans</p>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Dijital ayak izini ve zaman hırsızlarını tespit ederek verimlilik optimizasyonu sağlar.</p>
             </div>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={() => setStep("academic")}
            className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-emerald-600/20 flex items-center gap-3"
          >
            Analizi Başlat
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    );
  }

  if (step === "academic") {
      return (
          <div className="max-w-2xl mx-auto space-y-12 pb-20 pt-8 animate-in slide-in-from-right duration-500 px-4">
            <div className="space-y-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">BÖLÜM A: AKADEMİK KÜNYE</div>
                <h2 className="text-3xl font-black text-white text-center">Hedeflerini Tanımlayalım</h2>
                <p className="text-slate-400">Gideceğin yolu bilmezsen, rüzgarların sana faydası olmaz.</p>
            </div>

            <div className="bg-slate-900 border border-white/5 p-8 rounded-[32px] space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">En Başarılı Olduğun Ders</label>
                        <input 
                            type="text"
                            value={formData.academic.favoriteDers}
                            onChange={(e) => setFormData({...formData, academic: {...formData.academic, favoriteDers: e.target.value}})}
                            placeholder="Örn: Matematik"
                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">En Çok Zorlandığın Ders</label>
                        <input 
                            type="text"
                            value={formData.academic.hardestDers}
                            onChange={(e) => setFormData({...formData, academic: {...formData.academic, hardestDers: e.target.value}})}
                            placeholder="Örn: Fizik"
                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Mevcut Ortalaman (OBP) veya Net Ortalaman</label>
                    <input 
                        type="text"
                        value={formData.academic.obp}
                        onChange={(e) => setFormData({...formData, academic: {...formData.academic, obp: e.target.value}})}
                        placeholder="Örn: 92.5 veya TYT 65 Net"
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Hayalindeki Okul / Bölüm</label>
                    <input 
                        type="text"
                        value={formData.academic.target}
                        onChange={(e) => setFormData({...formData, academic: {...formData.academic, target: e.target.value}})}
                        placeholder="Örn: ODTÜ Mimarlık veya Kabataş Erkek Lisesi"
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none transition-all"
                    />
                </div>

                <div className="space-y-4 pt-4">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block text-center">Bu Hedefe Ulaşmak Senin İçin Ne Kadar Önemli? ({formData.academic.importance}/10)</label>
                    <input 
                        type="range" min="1" max="10" step="1"
                        value={formData.academic.importance}
                        onChange={(e) => setFormData({...formData, academic: {...formData.academic, importance: parseInt(e.target.value)}})}
                        className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        <span>Fark Etmez</span>
                        <span>Hayat Amacım</span>
                    </div>
                </div>

                <button
                    onClick={() => setStep("swot")}
                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xl transition-all shadow-lg shadow-emerald-600/20"
                >
                    SWOT Analizine Geç
                </button>
            </div>
          </div>
      );
  }

  if (step === "swot") {
      return (
          <div className="max-w-4xl mx-auto space-y-12 pb-20 pt-8 animate-in slide-in-from-right duration-500 px-4">
            <div className="space-y-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">BÖLÜM B: SWOT ANALİZİ</div>
                <h2 className="text-3xl font-black text-white text-center">İçinde ve Dışında Ne Oluyor?</h2>
                <p className="text-slate-400">Dürüstlük buradaki en büyük silahtır.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Strengths */}
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-[32px] space-y-4">
                    <div className="flex items-center gap-3 text-emerald-400">
                        <Zap size={20} />
                        <h3 className="font-black text-xs uppercase tracking-widest">Güçlü Yönlerin (S)</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">Örn: Ezberim kuvvetlidir, pes etmem, odaklanınca bırakmam.</p>
                    {formData.swot.strengths.map((s, i) => (
                        <input key={i} value={s} onChange={(e) => {
                            const newS = [...formData.swot.strengths];
                            newS[i] = e.target.value;
                            setFormData({...formData, swot: {...formData.swot, strengths: newS}});
                        }} className="w-full bg-slate-900 border border-white/5 p-3 rounded-xl text-sm focus:border-emerald-500 outline-none transition-all text-white" placeholder={`${i+1}. Örnek Özellik`} />
                    ))}
                </div>

                {/* Weaknesses */}
                <div className="bg-rose-500/5 border border-rose-500/10 p-6 rounded-[32px] space-y-4">
                    <div className="flex items-center gap-3 text-rose-400">
                        <Target size={20} />
                        <h3 className="font-black text-xs uppercase tracking-widest">Zayıf Yönlerin (W)</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">Örn: Çabuk sıkılırım, işlem hatası yaparım, sabah uyanamam.</p>
                    {formData.swot.weaknesses.map((s, i) => (
                        <input key={i} value={s} onChange={(e) => {
                            const newS = [...formData.swot.weaknesses];
                            newS[i] = e.target.value;
                            setFormData({...formData, swot: {...formData.swot, weaknesses: newS}});
                        }} className="w-full bg-slate-900 border border-white/5 p-3 rounded-xl text-sm focus:border-rose-500 outline-none transition-all text-white" placeholder={`${i+1}. Örnek Zayıflık`} />
                    ))}
                </div>

                {/* Opportunities */}
                <div className="bg-cyan-500/5 border border-cyan-500/10 p-6 rounded-[32px] space-y-4">
                    <div className="flex items-center gap-3 text-cyan-400">
                        <Star size={20} />
                        <h3 className="font-black text-xs uppercase tracking-widest">Fırsatların (O)</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">Örn: Kendime ait sessiz odam var, ailem çok destek.</p>
                    {formData.swot.opportunities.map((s, i) => (
                        <input key={i} value={s} onChange={(e) => {
                            const newS = [...formData.swot.opportunities];
                            newS[i] = e.target.value;
                            setFormData({...formData, swot: {...formData.swot, opportunities: newS}});
                        }} className="w-full bg-slate-900 border border-white/5 p-3 rounded-xl text-sm focus:border-cyan-500 outline-none transition-all text-white" placeholder={`${i+1}. Örnek Fırsat`} />
                    ))}
                </div>

                {/* Threats */}
                <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-[32px] space-y-4">
                    <div className="flex items-center gap-3 text-amber-400">
                        <ShieldCheck size={20} />
                        <h3 className="font-black text-xs uppercase tracking-widest">Tehditlerin (T)</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">Örn: Telefon bağımlılığım, gürültülü ev ortamı, yakın arkadaşlar.</p>
                    {formData.swot.threats.map((s, i) => (
                        <input key={i} value={s} onChange={(e) => {
                            const newS = [...formData.swot.threats];
                            newS[i] = e.target.value;
                            setFormData({...formData, swot: {...formData.swot, threats: newS}});
                        }} className="w-full bg-slate-900 border border-white/5 p-3 rounded-xl text-sm focus:border-amber-500 outline-none transition-all text-white" placeholder={`${i+1}. Örnek Tehdit`} />
                    ))}
                </div>
            </div>

            <div className="flex justify-between items-center pt-8">
                <button onClick={() => setStep("academic")} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 transition-all font-bold flex items-center gap-2">
                    <ChevronLeft /> Geri
                </button>
                <button
                    onClick={() => setStep("behavior")}
                    className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xl transition-all shadow-lg shadow-emerald-600/20"
                >
                    Davranış Analizine Geç
                </button>
            </div>
          </div>
      );
  }

  if (step === "behavior") {
      const progress = ((formData.behaviorAnswers.filter(a => a !== 0).length) / 10) * 100;
      
      return (
          <div className="max-w-3xl mx-auto space-y-12 pb-20 pt-8 animate-in slide-in-from-right duration-500 px-4">
            <div className="space-y-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">BÖLÜM C: ÇALIŞMA DAVRANIŞLARI</div>
                <h2 className="text-3xl font-black text-white text-center">Rutinin Ne Kadar Sağlam?</h2>
                <p className="text-slate-400">Senin çalışma kültürünü 1-5 arası puanla ölçüyoruz.</p>
            </div>

            <div className="space-y-4">
                {LIKERT_QUESTIONS.map((q, qIdx) => (
                    <div key={qIdx} className="bg-slate-900 border border-white/5 p-6 rounded-[24px] space-y-4">
                        <p className="font-bold text-white leading-relaxed text-sm">{qIdx + 1}. {q}</p>
                        <div className="grid grid-cols-5 gap-2">
                            {[1, 2, 3, 4, 5].map(val => (
                                <button
                                    key={val}
                                    onClick={() => {
                                        const newA = [...formData.behaviorAnswers];
                                        newA[qIdx] = val;
                                        setFormData({...formData, behaviorAnswers: newA});
                                    }}
                                    className={`p-3 rounded-xl border transition-all text-xs font-bold ${
                                        formData.behaviorAnswers[qIdx] === val 
                                            ? 'bg-emerald-500/10 border-emerald-500 text-white' 
                                            : 'bg-white/5 border-transparent text-slate-500'
                                    }`}
                                >
                                    {val === 1 && "Hiç"}
                                    {val === 2 && "Az"}
                                    {val === 3 && "Bazen"}
                                    {val === 4 && "Sık"}
                                    {val === 5 && "Hergün"}
                                    {val > 1 && val < 5 ? '' : ''}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center pt-8">
                <button onClick={() => setStep("swot")} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 transition-all font-bold flex items-center gap-2">
                    <ChevronLeft /> Geri
                </button>
                <button
                    onClick={() => setStep("digital")}
                    className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xl transition-all shadow-lg shadow-emerald-600/20"
                >
                    Son Bölüme Bakalım
                </button>
            </div>
          </div>
      );
  }

  if (step === "digital") {
      return (
          <div className="max-w-2xl mx-auto space-y-12 pb-20 pt-8 animate-in slide-in-from-right duration-500 px-4">
            <div className="space-y-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">BÖLÜM D: DİJİTAL AYAK İZİ</div>
                <h2 className="text-3xl font-black text-white text-center">Zaman Hırsızlarını Yakalayalım</h2>
                <p className="text-slate-400">Günde kaç saatini "başka dünyalarda" harcıyorsun?</p>
            </div>

            <div className="bg-slate-900 border border-white/5 p-8 rounded-[32px] space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Günlük Ortalama Ekran Süren (Saat)</label>
                    <div className="flex items-center gap-4">
                        <Smartphone className="text-emerald-500" size={32} />
                        <input 
                            type="text"
                            value={formData.digital.screenTime}
                            onChange={(e) => setFormData({...formData, digital: {...formData.digital, screenTime: e.target.value}})}
                            placeholder="Örn: 4.5"
                            className="flex-1 bg-slate-800/50 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest text-center block">En Çok Zaman Harcadığın Uygulamalar</label>
                    <div className="grid grid-cols-1 gap-2">
                        {formData.digital.apps.map((app, i) => (
                             <input key={i} value={app} onChange={(e) => {
                                const newApps = [...formData.digital.apps];
                                newApps[i] = e.target.value;
                                setFormData({...formData, digital: {...formData.digital, apps: newApps}});
                            }} className="w-full bg-white/5 border border-white/5 p-3 rounded-xl text-sm focus:border-emerald-500 outline-none transition-all text-white" placeholder={`${i+1}. Uygulama İsmi`} />
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Sence Zamanını En Çok Ne "Çalıyor"?</label>
                    <textarea 
                        value={formData.digital.timeThief}
                        onChange={(e) => setFormData({...formData, digital: {...formData.digital, timeThief: e.target.value}})}
                        placeholder="Örn: Instagram keşfet, arkadaş ortamı, bilgisayar oyunları, gündüz uykusu..."
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none h-24 resize-none transition-all"
                    />
                </div>

                <button
                    onClick={handleFinish}
                    disabled={loading}
                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3"
                >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                    Envanteri Bitir ve Raporu Al
                </button>
            </div>
          </div>
      );
  }

  return null;
}
