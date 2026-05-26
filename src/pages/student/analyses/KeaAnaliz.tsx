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
  Snowflake,
  Terminal,
  Target,
  ArrowUpRight,
  IterationCcw
} from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';

export default function KeaAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'intro' | 'setup' | 'snowball' | 'contract' | 'result'>('intro');
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    subject: '',
    microTask: '',
    day1: '1',
    day2: '2',
    day3: '5',
    day4: '10',
    day5: '15',
    day6: '25',
    day7: '40'
  });
  
  const [contractSigned, setContractSigned] = useState(false);

  useEffect(() => {
    const checkExisting = async () => {
      if (!user) return;
      try {
        const results = await analysisService.getResults(user.uid, 'K-E-A');
        if (results && results.length > 0) {
          const latest = results[0];
          if (latest.data && latest.data.answers) {
            setFormData(latest.data.answers);
            setAiInsight(latest.data.insight);
            setStep('result');
          }
        }
      } catch (error) {
        console.error('Mevcut veri çekilirken hata:', error);
      } finally {
        setLoading(false);
      }
    };
    checkExisting();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (!formData.subject || !formData.microTask) {
        alert("Lütfen dersi ve mikro görevi doldurun.");
        return;
    }

    setLoading(true);
    try {
      const payload = { answers: formData };

      const result = await analysisService.saveResult(user.uid, 'K-E-A', payload);
      if (result?.id) {
        navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`);
      }
    } catch (error: any) {
      console.error("Kayıt hatası:", error);
      alert(error.message || "Analiz oluşturulurken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-cyan-500" size={40} />
        <p className="text-slate-400 font-bold animate-pulse">Kartopu Durumu Kontrol Ediliyor...</p>
      </div>
    );
  }

  if (step === 'result' && aiInsight) {
    return (
      <div className="max-w-5xl mx-auto space-y-12 pb-20 pt-8 animate-in fade-in duration-700 px-4">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-black uppercase tracking-widest text-sm">
            <CheckCircle2 size={16} />
            K-E-A Modülü Tamamlandı
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">Kartopu Etkisi Başlıyor</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
            Sonuçların kaydedildi. AI Koçu, parçaları yavaşça büyütme planını analiz etti ve stratejini onayladı.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
             <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 space-y-6">
                <div className="flex items-center gap-3">
                   <Target size={24} className="text-cyan-400" />
                   <h3 className="text-lg font-bold text-white">Çekirdek Plan</h3>
                </div>
                <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1">
                        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">DERS</div>
                        <div className="text-sm font-bold text-white">{formData.subject}</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1">
                        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">MİKRO GÖREV (1. GÜN)</div>
                        <div className="text-sm text-slate-200">{formData.microTask}</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1">
                        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">HEDEFLENEN (7. GÜN)</div>
                        <div className="text-sm text-slate-200">{formData.day7} Adet/Birim</div>
                    </div>
                </div>
             </div>
          </div>

          <div className="md:col-span-2">
             <div className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/5">
                   <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Brain size={24} />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-white">AI Büyüme Analizi</h3>
                      <p className="text-xs text-slate-400 font-medium tracking-wide">Parçaları Büyütme Taktiğin</p>
                   </div>
                </div>
                
                <div className="prose prose-invert prose-cyan max-w-none prose-headings:font-black prose-p:leading-relaxed prose-p:text-slate-300">
                   <Markdown>{aiInsight}</Markdown>
                </div>
             </div>

             <div className="flex justify-end gap-4 mt-8">
                <button
                   onClick={() => {
                       setStep('setup');
                       setAiInsight(null);
                   }}
                   className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-bold transition-all flex items-center gap-2"
                >
                   <IterationCcw size={18} />
                   Planı Yeniden Yap
                </button>
                <button
                   onClick={() => navigate('/panel/ogrenci/analizler')}
                   className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-bold transition-all flex items-center gap-2"
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

  if (step === 'intro') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in duration-700 px-4">
        <header className="space-y-4">
          <button 
            onClick={() => navigate('/panel/ogrenci/analizler')}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <ChevronLeft size={16} />
            Analizlere Dön
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
            <Snowflake size={12} />
            ATALET KIRICI
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">K-E-A: Kartopu Etkisi ve Alışkanlık Modülü</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl">
            Sürekli erteliyor musun? Amacımız eylemi devasa parçalar halinde yapmak değil, çok küçük bir parça ile başlayıp onu "birer birer" büyütmektir. 
          </p>
        </header>

        <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center gap-4 text-cyan-400">
            <ShieldCheck size={24} />
            <span className="font-bold text-lg">Kuramsal Dayanak</span>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed">
            <strong>James Clear (Atomik Alışkanlıklar)</strong> ve <strong>Newton’un Hareket Yasalarına</strong> dayanır. Hedefin "gülünç derecede küçük" tutularak başlangıç sürtünmesinin sıfırlanması hedeflenir. "Durmakta olan bir cisim durmaya, hareketli olan ise hareketine devam etmek ister."
          </p>
          <div className="flex items-start gap-4 p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl">
            <Info className="text-cyan-500 shrink-0 mt-0.5" size={20} />
            <p className="text-xs text-slate-400 font-medium">
              <strong>Nasıl Uygulanır?</strong> En çok ertelediğin bir dersi seç. Ona başlamak için yapabileceğin en küçük, en zahmetsiz "Mikro Görevi" (Çekirdek Eylem) yazacaksın. Ardından bu sayıyı 7 gün boyunca nasıl büyüteceğini tasarlayacağız.
            </p>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={() => setStep('setup')}
            className="px-12 py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-cyan-600/20 flex items-center gap-3"
          >
            Modüle Başla
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'setup') {
    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in duration-500 px-4">
             <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setStep('intro')}
                  className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold"
                >
                  <ChevronLeft size={20} />
                  Geri
                </button>
            </div>

            <div className="text-center space-y-4 mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
                  1. ADIM: ÇEKİRDEK EYLEM
                </div>
                <h2 className="text-3xl font-black text-white">"Gülünç Derecede Küçük" Görevi Seç</h2>
                <p className="text-slate-400 max-w-lg mx-auto">Masaya oturmakta zorlandığın "o ders" için, beyninin itiraz edemeyeceği kadar küçük bir giriş bileti belirle. Örneğin: "Sadece 1 problem sorusu", "1 paragraf oku", "2 dakika video izle".</p>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-[32px] p-6 md:p-10 space-y-8">
                <div className="space-y-6">
                     <div>
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Ertelediğin Dersin Adı</label>
                         <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="Örn: Matematik, Paragraf..." className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:border-cyan-500 outline-none transition-colors" />
                     </div>
                     <div>
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Mikro Görev (Reddedilemez Hedef)</label>
                         <input type="text" name="microTask" value={formData.microTask} onChange={handleChange} placeholder="Örn: Sadece 1 soru çözüp masadan kalkacağım." className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:border-cyan-500 outline-none transition-colors" />
                     </div>
                </div>
            </div>

            <div className="flex justify-center pt-8 border-t border-white/5">
                <button
                    onClick={() => setStep('snowball')}
                    disabled={!formData.subject || !formData.microTask}
                    className="px-12 py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-cyan-600/20 flex items-center gap-3 disabled:opacity-50"
                >
                    İleri: Büyüme Tablosu
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
  }

  if (step === 'snowball') {
    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in duration-500 px-4">
             <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={() => setStep('setup')}
                  className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold"
                >
                  <ChevronLeft size={20} />
                  Geri
                </button>
            </div>

            <div className="text-center space-y-4 mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
                  2. ADIM: İVME PLANLAYICI
                </div>
                <h2 className="text-3xl font-black text-white">Parçaları Birer Birer Büyüt</h2>
                <p className="text-slate-400 max-w-lg mx-auto">1. Gün sadece "{formData.microTask}" ile başlayacaksın. Zamanla ivme (momentum) kazanarak bunu "birer birer", azar azar büyüteceğiz. Kendi büyüme planını aşağıya gir:</p>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-[32px] p-6 md:p-10 space-y-6">
                {[
                  { day: 'day1', label: '1. Gün (Asla sıfır çekme)', bg: 'bg-cyan-500/5 border-cyan-500/20', textRef: 'Sadece başlamak için...' },
                  { day: 'day2', label: '2. Gün', bg: 'bg-white/5 border-white/5', textRef: 'Biraz daha ivme...' },
                  { day: 'day3', label: '3. Gün', bg: 'bg-white/5 border-white/5', textRef: 'Alışmaya başladın...' },
                  { day: 'day4', label: '4. Gün', bg: 'bg-white/5 border-white/5', textRef: 'Kartopu büyüyor...' },
                  { day: 'day5', label: '5. Gün', bg: 'bg-white/5 border-white/5', textRef: 'Artık daha kolay...' },
                  { day: 'day6', label: '6. Gün', bg: 'bg-white/5 border-white/5', textRef: 'Hız kazandın...' },
                  { day: 'day7', label: '7. Gün (Zirveye Ulaş)', bg: 'bg-blue-500/10 border-blue-500/30', textRef: 'İlk haftanın meyvesi.' }
                ].map((item, index) => (
                    <div key={item.day} className={`flex items-center gap-4 p-4 rounded-2xl border ${item.bg}`}>
                        <div className="w-12 h-12 shrink-0 bg-slate-800 rounded-xl flex items-center justify-center font-black text-slate-300">
                           {index + 1}
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</label>
                            <div className="flex items-center gap-3 mt-1">
                                <input 
                                    type="text" 
                                    name={item.day} 
                                    value={(formData as any)[item.day]} 
                                    onChange={handleChange} 
                                    className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-center focus:border-cyan-500 outline-none" 
                                    placeholder="Sayı" 
                                />
                                <span className="text-sm font-medium text-slate-400">{item.textRef}</span>
                            </div>
                        </div>
                        {index > 0 && index < 6 && (
                            <ArrowUpRight className="text-slate-600 shrink-0 hidden sm:block" size={24} />
                        )}
                        {index === 6 && (
                            <Target className="text-blue-400 shrink-0 hidden sm:block" size={24} />
                        )}
                    </div>
                ))}
            </div>

            <div className="flex justify-center pt-8 border-t border-white/5">
                <button
                    onClick={() => setStep('contract')}
                    className="px-12 py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-cyan-600/20 flex items-center gap-3"
                >
                    Plastik Onayla ve Kontrata Geç
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
  }

  if (step === 'contract') {
      return (
          <div className="max-w-3xl mx-auto space-y-8 pb-20 pt-16 animate-in zoom-in-95 duration-500 px-4">
              <div className="bg-slate-900 border border-white/10 rounded-[40px] p-8 md:p-12 space-y-8 text-center shadow-2xl">
                  <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 mx-auto">
                      <Terminal size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-white">Kartopu Kontratı</h2>
                  
                  <div className="bg-white/5 p-6 rounded-3xl text-left border border-white/5 prose prose-invert prose-p:text-slate-300 font-medium">
                      <p>
                        "Amacım bir günde devasa bir dağa tırmanıp tükenmek değil; küçük bir kartopu yapıp onu birer birer büyüterek çığa dönüştürmektir. En yorgun, en isteksiz olduğum günde bile 'sıfır' çekmeyip, belirlediğim ilk günkü mikro hedefi (çekirdek eylemi) gerçekleştireceğime söz veriyorum."
                      </p>
                  </div>

                  <label className="flex items-center justify-center gap-4 cursor-pointer group">
                      <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                          contractSigned ? 'bg-cyan-500 border-cyan-500 text-slate-900' : 'bg-slate-800 border-slate-600 text-transparent group-hover:border-cyan-500'
                      }`}>
                          <CheckCircle2 size={20} className={contractSigned ? 'opacity-100' : 'opacity-0'} />
                      </div>
                      <span className="font-bold text-slate-300 group-hover:text-white transition-colors">Kabul ediyor ve ilk adımı atıyorum.</span>
                      <input type="checkbox" className="hidden" checked={contractSigned} onChange={(e) => setContractSigned(e.target.checked)} />
                  </label>

                  <button
                    onClick={handleSave}
                    disabled={!contractSigned || loading}
                    className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-cyan-600/20 flex justify-center items-center gap-3 disabled:opacity-50"
                  >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={24} />
                            Analiz Ediliyor...
                        </>
                    ) : (
                        <>
                            Planı İmzala ve Raporu Al
                            <Save size={24} />
                        </>
                    )}
                  </button>
              </div>
          </div>
      );
  }

  return null;
}

