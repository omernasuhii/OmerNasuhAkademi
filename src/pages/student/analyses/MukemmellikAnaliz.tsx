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
  Zap,
  Target,
  IterationCcw,
  Sparkles,
  Trophy,
  Volume2,
  Palette,
  Timer
} from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';

const COLORS = [
  { id: 'gold', name: 'Altın Sarısı', class: 'bg-yellow-400', shadow: 'shadow-yellow-400/50' },
  { id: 'cyan', name: 'Kristal Mavi', class: 'bg-cyan-400', shadow: 'shadow-cyan-400/50' },
  { id: 'emerald', name: 'Zümrüt Yeşil', class: 'bg-emerald-400', shadow: 'shadow-emerald-400/50' },
  { id: 'fuchsia', name: 'Enerji Moru', class: 'bg-fuchsia-500', shadow: 'shadow-fuchsia-500/50' },
  { id: 'white', name: 'Saf Beyaz', class: 'bg-white', shadow: 'shadow-white/50' }
];

const EMOTIONS = [
  { id: 'courage', label: 'Cesaret', icon: '🦁' },
  { id: 'calm', label: 'Sakinlik', icon: '🌊' },
  { id: 'focus', label: 'Odaklanma', icon: '🎯' },
  { id: 'joy', label: 'Neşe/Enerji', icon: '⚡' },
  { id: 'wisdom', label: 'Zeka/Bilgelik', icon: '💡' }
];

export default function MukemmellikAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"intro" | "setup" | "resource" | "memory" | "anchor" | "result">("intro");
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    circleColor: COLORS[0],
    circleVibe: '',
    neededEmotion: EMOTIONS[0],
    memoryDescription: '',
    physicalAnchor: '',
    futureTest: ''
  });

  useEffect(() => {
    const checkExisting = async () => {
      if (!user) return;
      try {
        const results = await analysisService.getResults(user.uid, "MÇ-ZP");
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

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const payload = {
        form: formData
      };

      const result = await analysisService.saveResult(user.uid, "MÇ-ZP", payload);
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
        <Loader2 className="animate-spin text-yellow-500" size={40} />
        <p className="text-slate-400 font-bold animate-pulse">Kaynaklar Toplanıyor...</p>
      </div>
    );
  }

  if (step === "result" && aiInsight) {
    return (
      <div className="max-w-5xl mx-auto space-y-12 pb-20 pt-8 animate-in fade-in duration-700 px-4">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-black uppercase tracking-widest text-sm text-center">
            <CheckCircle2 size={16} />
            MÜKEMMELLİK ÇEMBERİ KURULDU
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">Yükleme Tamamlandı: <span className="text-yellow-400">{formData.neededEmotion.label}</span></h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
            Geçmişteki tüm gücünü ve başarı anlarını bu sanal çembere hapsettin. İşte özgüven portalın hakkında koçluk analizi.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="md:col-span-1 space-y-6">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 space-y-6">
                    <div className="flex items-center gap-3">
                        <Palette size={24} className="text-yellow-400" />
                        <h3 className="text-lg font-bold text-white">Çapa Detayları</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Çember Rengi</p>
                            <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full ${formData.circleColor.class}`} />
                                <span className="text-sm font-bold text-white">{formData.circleColor.name}</span>
                            </div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Fiziksel Çapa</p>
                            <p className="text-sm font-bold text-yellow-400">{formData.physicalAnchor}</p>
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
                   Çemberi Yeniden İnşa Et
                </button>
           </div>

           <div className="md:col-span-2">
                <div className="bg-gradient-to-br from-yellow-500/5 to-amber-500/5 border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl">
                    <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5">
                        <Sparkles size={24} className="text-yellow-400" />
                        <div>
                            <h3 className="text-xl font-bold text-white">AI Özgüven Analizi</h3>
                            <p className="text-xs text-slate-400 font-medium">Zirve Performans Yol Haritan</p>
                        </div>
                    </div>
                    <div className="prose prose-invert prose-yellow max-w-none prose-p:text-slate-300">
                        <Markdown>{aiInsight}</Markdown>
                    </div>
                </div>

                <div className="flex justify-end mt-8">
                    <button
                        onClick={() => navigate("/panel/ogrenci/analizler")}
                        className="px-8 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-yellow-600/20"
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-black uppercase tracking-widest">
            <Trophy size={12} />
            ZİRVE PERFORMANS
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">
            Mükemmellik Çemberi: Özgüven Butonu
          </h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl">
             En güçlü anlarını tek bir çembere toplayıp sınav sabahına taşımaya hazır mısın? Bu bir sihir değil, beynin nörolojiye dayalı bir antrenmanıdır.
          </p>
        </header>

        <div className="bg-slate-900 border border-white/5 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center gap-4 text-yellow-400">
            <ShieldCheck size={24} />
            <span className="font-bold text-lg">Kuramsal Dayanak</span>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed">
            Bu modül; <strong>NLP (Anchoring - Çapalama)</strong> ve <strong>Klasik Koşullanma</strong> ilkelerine dayanır. Beynin bir uyaran (hayali çember) ile bir tepki (özgüven/sakinlik) arasında nörolojik bağ kurmasını sağlar.
          </p>
          <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl flex items-start gap-3">
             <Info className="text-yellow-500 shrink-0 mt-0.5" size={20} />
             <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Önemli: Bu çalışma seni ders çalışmadan başarılı yapmaz. Ancak bildiğin her şeyi korkudan dolayı kullanamadığın o kilitleri (sınav stresi vb.) hızla açar.
             </p>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={() => setStep("setup")}
            className="px-12 py-5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-yellow-600/20 flex items-center gap-3"
          >
            Çemberi Kurmaya Başla
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    );
  }

  if (step === "setup") {
    return (
        <div className="max-w-2xl mx-auto space-y-12 pb-20 pt-8 animate-in slide-in-from-right duration-500 px-4">
            <div className="space-y-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-widest">ADIM 1: GÖRSELLEŞTİRME</div>
                <h2 className="text-3xl font-black text-white">Hayali Çemberini Tasarla</h2>
                <p className="text-slate-400">Önünde yerde bir çember olduğunu düşün. Bu senin güç alanın. Ona bir kimlik ver.</p>
            </div>

            <div className="space-y-8 bg-slate-900 border border-white/5 p-8 rounded-[32px]">
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Çemberin Rengi Ne Olsun?</label>
                    <div className="flex flex-wrap gap-4">
                        {COLORS.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setFormData({...formData, circleColor: c})}
                                className={`w-12 h-12 rounded-full transition-all duration-300 border-4 ${
                                    formData.circleColor.id === c.id ? 'border-white scale-110 shadow-lg ' + c.shadow : 'border-transparent opacity-50 grayscale-[0.5]'
                                } ${c.class}`}
                                title={c.name}
                            />
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Volume2 size={16} className="text-slate-500" />
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Işığı, Sesi, Isısı Nasıl?</label>
                    </div>
                    <textarea 
                        value={formData.circleVibe}
                        onChange={(e) => setFormData({...formData, circleVibe: e.target.value})}
                        placeholder="Örn: Parlak, altın sarısı dönen bir enerji, hafif bir uğultusu var ve sıcak hissettiriyor..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-yellow-500 outline-none h-24 resize-none transition-all"
                    />
                </div>

                <button
                    onClick={() => setStep("resource")}
                    disabled={!formData.circleVibe.trim()}
                    className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                    Kaynağı Belirle
                </button>
            </div>
        </div>
    );
  }

  if (step === "resource") {
    return (
        <div className="max-w-2xl mx-auto space-y-12 pb-20 pt-8 animate-in slide-in-from-right duration-500 px-4">
            <div className="space-y-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-widest">ADIM 2: İHTİYAÇ</div>
                <h2 className="text-3xl font-black text-white">Hangi Güce İhtiyacın Var?</h2>
                <p className="text-slate-400">Sınavda veya ders çalışırken o kilidi açacak "o tek duygu" hangisi?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {EMOTIONS.map(e => (
                    <button
                        key={e.id}
                        onClick={() => {
                            setFormData({...formData, neededEmotion: e});
                            setStep("memory");
                        }}
                        className={`p-6 rounded-[24px] border-2 transition-all flex items-center gap-4 group ${
                            formData.neededEmotion.id === e.id ? 'bg-yellow-500/10 border-yellow-500' : 'bg-slate-900 border-white/5 hover:border-white/10'
                        }`}
                    >
                        <span className="text-3xl group-hover:scale-125 transition-transform">{e.icon}</span>
                        <span className={`text-lg font-bold ${formData.neededEmotion.id === e.id ? 'text-white' : 'text-slate-400'}`}>{e.label}</span>
                    </button>
                ))}
            </div>
            
            <button
                onClick={() => setStep("setup")}
                className="w-full py-2 text-slate-500 text-sm font-bold hover:text-white transition-colors"
            >
                Geri Dön
            </button>
        </div>
    );
  }

  if (step === "memory") {
    return (
        <div className="max-w-2xl mx-auto space-y-12 pb-20 pt-8 animate-in slide-in-from-right duration-500 px-4">
            <div className="space-y-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-widest">ADIM 3: DUYGU ATEŞLEME</div>
                <h2 className="text-3xl font-black text-white">Geçmişteki Bir "Zirve" Anını Bul</h2>
                <p className="text-slate-400">Kendini en <span className="text-yellow-400 font-bold">{formData.neededEmotion.label}</span> hissettiğin o başarı veya huzur anını hatırla.</p>
            </div>

            <div className="bg-slate-900 border border-white/5 p-8 rounded-[32px] space-y-6">
                <p className="text-sm text-slate-400 leading-relaxed italic">
                    "Gözlerini bir an kapat ve o ana git. Ne görüyorsun? Sesler nasıl? Bedenindeki o sıcaklığı, o dik duruşu fark et. Şimdi o anı buraya kısaca yazarak sabitle."
                </p>
                <textarea 
                    value={formData.memoryDescription}
                    onChange={(e) => setFormData({...formData, memoryDescription: e.target.value})}
                    placeholder="Örn: 8. sınıfta o zor matematik sorusunu tahtada çözdüğüm ve herkesin alkışladığı o an..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-yellow-500 outline-none h-32 resize-none transition-all"
                />
                <button
                    onClick={() => setStep("anchor")}
                    disabled={!formData.memoryDescription.trim()}
                    className="w-full py-4 bg-yellow-600 text-white rounded-2xl font-black text-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                    Çapayı At
                </button>
            </div>
        </div>
    );
  }

  if (step === "anchor") {
    return (
        <div className="max-w-2xl mx-auto space-y-12 pb-20 pt-8 animate-in zoom-in duration-500 px-4 text-center relative">
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-widest">ADIM 4: ÇAPALAMA VE TEST</div>
                <h2 className="text-3xl font-black text-white">Şimdi Çemberin İçine Gir!</h2>
                <p className="text-slate-400">O hayali çemberin içinde olduğunu, altın ışığın seni sardığını hisset. Bu duyguyu bedensel bir hareketle sabitleyeceğiz.</p>
            </div>

            <div className="relative py-12">
                 <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.1, opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 2, repeatType: 'reverse' }}
                    className={`w-64 h-64 mx-auto rounded-full blur-3xl ${formData.circleColor.class} opacity-20`}
                 />
                 <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-4 border-dashed rounded-full animate-spin-slow border-yellow-500/30`} />
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Sparkles size={64} className="text-yellow-400 animate-pulse" />
                 </div>
            </div>

            <div className="space-y-8 pt-8">
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Bedensel Çapa Hareketi Seç</label>
                    <p className="text-xs text-slate-400 mb-4">Sıkıştığın an bu hareketi yapınca beynin özgüveni açacak. (Örn: Yumruğunu sık, elini kalbine koy, derin nefes al...)</p>
                    <input 
                        type="text" 
                        value={formData.physicalAnchor}
                        onChange={(e) => setFormData({...formData, physicalAnchor: e.target.value})}
                        placeholder="Hareketin nedir? (Örn: Sağ yumruğumu sıkmak)"
                        className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-white focus:border-yellow-500 text-center font-bold"
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Son Test: Yakın Gelecek</label>
                    <p className="text-xs text-slate-400 mb-4">Önümüzdeki ilk denemeyi düşün. Gözlerini kapatıp bu hareketi randa yaptığında ne hissediyorsun?</p>
                    <textarea 
                        value={formData.futureTest}
                        onChange={(e) => setFormData({...formData, futureTest: e.target.value})}
                        placeholder="Örn: Sıcaklık hissettim, korkum gitti ve kendimden emin oldum..."
                        className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-white focus:border-yellow-500 h-24 resize-none"
                    />
                </div>

                <button
                    onClick={handleFinish}
                    disabled={loading || !formData.physicalAnchor.trim()}
                    className="px-12 py-5 bg-yellow-600 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 flex items-center justify-center gap-3 w-full"
                >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                    Çemberi Mühürle ve Bitir
                </button>
            </div>
        </div>
    );
  }

  return null;
}
