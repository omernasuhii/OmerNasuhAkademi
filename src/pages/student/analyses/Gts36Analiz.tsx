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
  Compass,
  GraduationCap,
  Building,
  Target,
  AlertTriangle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';

export default function Gts36Analiz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(true);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const initialUniversities = Array(24).fill(null).map(() => ({
    name: '', academic: '', campus: '', network: '', alumni: '', score: ''
  }));

  const [formData, setFormData] = useState({
    targetProfession: '',
    interest: 5,
    ability: 5,
    value: 5,
    market: 5,
    universities: initialUniversities,
    studentRank: '',
    flightZone: '',
    realisticZone: '',
    safetyZone: '',
    familyVeto: ''
  });

  useEffect(() => {
    if (!user) return;
    const fetchLatest = async () => {
      try {
        const results = await analysisService.getResults(user.uid);
        const latestGTS = results?.find((r: any) => r.analysisType === 'GTS-36');
        if (latestGTS && latestGTS.data?.answers) {
          const loadedUnis = [...(latestGTS.data.answers.universities || [])];
          while (loadedUnis.length < 24) {
              loadedUnis.push({ name: '', academic: '', campus: '', network: '', alumni: '', score: '' });
          }
          setFormData({ ...latestGTS.data.answers, universities: loadedUnis.slice(0, 24) });
        }
      } catch (err) {
        console.error("Geçmiş veri alınamadı:", err);
      }
    };
    fetchLatest();
  }, [user]);

  const handleUniversityChange = (index: number, field: string, value: string) => {
    const newUnis = [...formData.universities];
    newUnis[index] = { ...newUnis[index], [field]: value };
    setFormData({ ...formData, universities: newUnis });
  };

  const moveUniversity = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
        const newUnis = [...formData.universities];
        const temp = newUnis[index - 1];
        newUnis[index - 1] = newUnis[index];
        newUnis[index] = temp;
        setFormData({ ...formData, universities: newUnis });
    } else if (direction === 'down' && index < formData.universities.length - 1) {
        const newUnis = [...formData.universities];
        const temp = newUnis[index + 1];
        newUnis[index + 1] = newUnis[index];
        newUnis[index] = temp;
        setFormData({ ...formData, universities: newUnis });
    }
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: parseInt(e.target.value)
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (!formData.targetProfession || !formData.studentRank || !formData.flightZone || !formData.realisticZone || !formData.safetyZone) {
        alert("Lütfen temel alanları (Meslek, Sıralama ve Tercih Bölgeleri) doldurun.");
        return;
    }

    setLoading(true);
    try {
      const payload = {
        answers: formData
      };

      const result = await analysisService.saveResult(user.uid, 'GTS-36', payload);
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

  if (completed && aiInsight) {
    return (
      <div className="max-w-5xl mx-auto space-y-12 pb-20 pt-8 animate-in fade-in duration-700 px-4">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black uppercase tracking-widest text-sm">
            <CheckCircle2 size={16} />
            GTS-36 Simülasyonu Tamamlandı
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">Tercih ve Gelecek Raporun</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
            Sonuçların başarıyla kaydedildi. İşte geleceğini şekillendirmede AI koçunun tavsiyeleri.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
             <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 space-y-6">
                <div className="flex items-center gap-3">
                   <Compass size={24} className="text-indigo-400" />
                   <h3 className="text-lg font-bold text-white">Tercih Profilin</h3>
                </div>
                <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Hedef Meslek</div>
                        <div className="text-sm text-slate-200">{formData.targetProfession}</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Öğrenci Sırası</div>
                        <div className="text-sm text-slate-200">{formData.studentRank}</div>
                    </div>
                </div>
             </div>
          </div>

          <div className="md:col-span-2">
             <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl">
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                         <Brain size={24} />
                      </div>
                      <div>
                         <h3 className="text-xl font-bold text-white">AI Tercih Simülasyonu</h3>
                         <p className="text-xs text-slate-400 font-medium tracking-wide">Kişiye Özel Hazırlanmıştır</p>
                      </div>
                   </div>
                </div>
                
                <div className="prose prose-invert prose-indigo max-w-none prose-headings:font-black prose-p:leading-relaxed prose-p:text-slate-300">
                   <Markdown>{aiInsight}</Markdown>
                </div>
             </div>

             <div className="flex justify-end mt-8">
                <button
                   onClick={() => navigate('/panel/ogrenci/analizler')}
                   className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all flex items-center gap-2"
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

  if (showIntro) {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
            <Compass size={12} />
            TERCİH VE GELECEK
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">GTS-36 Gelecek Tasarım ve Tercih Simülasyonu</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl">
            Sınav puanını değil, "Hayat Puanını" maksimize etmek için tasarlandı. Tercihlerini Hayal, Gerçek ve Güvenlik bölgelerine ayırarak açıkta kalma riskini sıfıra indiriyoruz.
          </p>
        </header>

        <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center gap-4 text-indigo-400">
            <ShieldCheck size={24} />
            <span className="font-bold text-lg">Kuramsal Dayanak</span>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed">
            <strong>Holland Mesleki İlgi Kuramı (RIASEC)</strong> ve Karar Ağacı Analizi. Kişilik tipi ile meslek uyumunu ölçerken, tercih sıralamasında matematiksel olasılıkları ve riskleri hesaplar.
          </p>
          <div className="flex items-start gap-4 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
            <Info className="text-indigo-500 shrink-0 mt-0.5" size={20} />
            <p className="text-xs text-slate-400 font-medium">
              <strong>Nasıl Uygulanır?</strong> Puanına bakmadan önce vizyonuna bakacağız. Meslek uygunluğunu 10 üzerinden değerleyip, 24 tercih hakkını A/B/C kalitesine göre inceleyecek ve listeni yukarı-aşağı taşıyarak güncelleyebileceksin. Eski listen otomatik yüklenir.
            </p>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={() => setShowIntro(false)}
            className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-indigo-600/20 flex items-center gap-3"
          >
            Simülasyonu Başlat
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in duration-500 px-4">
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={() => setShowIntro(true)}
          className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold"
        >
          <ChevronLeft size={20} />
          Girişe Dön
        </button>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-12 space-y-12 shadow-2xl">
        <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
              BÖLÜM A: MESLEKİ RUH EŞLEŞMESİ
            </div>
            <h2 className="text-2xl font-bold text-white leading-tight">
              Puanına bakmadan önce, kalbine bak
            </h2>
        </div>

        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-bold tracking-widest text-slate-300 uppercase">
                    Hedef Meslek
                </label>
                <input
                    type="text"
                    name="targetProfession"
                    value={formData.targetProfession}
                    onChange={handleChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                    placeholder="Örn: Bilgisayar Mühendisliği, Hukuk..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/5 p-6 rounded-3xl border border-white/5">
                <div className="space-y-4">
                    <label className="text-sm font-bold tracking-widest text-slate-300 uppercase flex justify-between">
                        1. İlgi (Tutku) <span className="text-indigo-400">{formData.interest}/10</span>
                    </label>
                    <p className="text-[10px] text-slate-500">Bu mesleğin derslerini okurken sıkılır mıyım?</p>
                    <input type="range" name="interest" min="1" max="10" value={formData.interest} onChange={handleRangeChange} className="w-full accent-indigo-500" />
                </div>
                <div className="space-y-4">
                    <label className="text-sm font-bold tracking-widest text-slate-300 uppercase flex justify-between">
                        2. Yetenek (Beceri) <span className="text-indigo-400">{formData.ability}/10</span>
                    </label>
                    <p className="text-[10px] text-slate-500">Bu mesleği yapacak doğal yeteneğim var mı?</p>
                    <input type="range" name="ability" min="1" max="10" value={formData.ability} onChange={handleRangeChange} className="w-full accent-indigo-500" />
                </div>
                <div className="space-y-4">
                    <label className="text-sm font-bold tracking-widest text-slate-300 uppercase flex justify-between">
                        3. Değer (Para/Statü) <span className="text-indigo-400">{formData.value}/10</span>
                    </label>
                    <p className="text-[10px] text-slate-500">Bana istediğim hayat standardını sağlar mı?</p>
                    <input type="range" name="value" min="1" max="10" value={formData.value} onChange={handleRangeChange} className="w-full accent-indigo-500" />
                </div>
                <div className="space-y-4">
                    <label className="text-sm font-bold tracking-widest text-slate-300 uppercase flex justify-between">
                        4. Piyasa (Gelecek) <span className="text-indigo-400">{formData.market}/10</span>
                    </label>
                    <p className="text-[10px] text-slate-500">10 yıl sonra bu meslek var olacak mı?</p>
                    <input type="range" name="market" min="1" max="10" value={formData.market} onChange={handleRangeChange} className="w-full accent-indigo-500" />
                </div>
            </div>
            {(formData.interest + formData.ability + formData.value + formData.market) / 4 < 7 && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-rose-200">
                        <strong>Uyarı:</strong> Puan ortalamanız 7'nin altında. Puanın yetse bile bu bölüm senin için "Ölü Tercih" olabilir!
                    </p>
                </div>
            )}
        </div>

        <div className="pt-8 border-t border-white/5 space-y-6">
            <div className="space-y-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
                  BÖLÜM B: BÖLÜM VE KAMPÜS MR'I
                </div>
                <h2 className="text-2xl font-bold text-white leading-tight">
                  Tabelaya değil, mutfağa bak
                </h2>
                <p className="text-sm text-slate-400">24 Tercih hakkını sırasıyla doldur ve planla (A: Kesin, B: Alternatif, C: Son Çare)</p>
            </div>
            
            <div className="space-y-4">
                {formData.universities.map((uni, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <div className="flex items-center gap-1 justify-center md:col-span-1">
                            <button onClick={() => moveUniversity(idx, 'up')} disabled={idx === 0} className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-transparent"><ArrowUp size={16} /></button>
                            <span className="font-bold text-slate-500 w-6 text-center text-sm">{idx + 1}</span>
                            <button onClick={() => moveUniversity(idx, 'down')} disabled={idx === 23} className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-transparent"><ArrowDown size={16} /></button>
                        </div>
                        <div className="md:col-span-3">
                             <input type="text" placeholder="Üni / Bölüm" value={uni.name} onChange={(e) => handleUniversityChange(idx, 'name', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
                        </div>
                        <div className="md:col-span-2">
                             <input type="text" placeholder="Kadrosu" value={uni.academic} onChange={(e) => handleUniversityChange(idx, 'academic', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
                        </div>
                        <div className="md:col-span-2">
                             <input type="text" placeholder="Kampüs/Yurt" value={uni.campus} onChange={(e) => handleUniversityChange(idx, 'campus', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
                        </div>
                        <div className="md:col-span-2">
                             <input type="text" placeholder="İş Bulma" value={uni.alumni} onChange={(e) => handleUniversityChange(idx, 'alumni', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
                        </div>
                        <div className="md:col-span-2">
                             <select value={uni.score} onChange={(e) => handleUniversityChange(idx, 'score', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
                                <option value="">Puan (A/B/C)</option>
                                <option value="A">A Kalite</option>
                                <option value="B">B Kalite</option>
                                <option value="C">C Kalite</option>
                             </select>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="pt-8 border-t border-white/5 space-y-6">
            <div className="space-y-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                  BÖLÜM C: TERCİH ROBOTU VE RİSK YÖNETİMİ
                </div>
                <h2 className="text-2xl font-bold text-white leading-tight">
                  Akordeon Stratejisi
                </h2>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold tracking-widest text-slate-300 uppercase">Tahmini veya Kesin Sıralamanız</label>
                <input type="number" name="studentRank" value={formData.studentRank} onChange={handleChange} placeholder="Örn: 100000" className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 bg-rose-500/5 border border-rose-500/10 p-4 rounded-2xl">
                    <label className="text-sm font-bold tracking-widest text-rose-400 uppercase">1. Uçuş Hattı (Hayal)</label>
                    <p className="text-[10px] text-slate-400">Sıralamanın üstündeki %10'luk dilim (Gelmez ama ya gelirse dediğin yerler).</p>
                    <textarea name="flightZone" rows={3} value={formData.flightZone} onChange={handleChange} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-rose-500 outline-none" />
                </div>
                <div className="space-y-2 bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl">
                    <label className="text-sm font-bold tracking-widest text-blue-400 uppercase">2. Gerçekçi Hat (Hedef)</label>
                    <p className="text-[10px] text-slate-400">Asıl yerleşeceğin yer. Sıralamana çok yakın bölgeler.</p>
                    <textarea name="realisticZone" rows={3} value={formData.realisticZone} onChange={handleChange} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-2 bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl">
                    <label className="text-sm font-bold tracking-widest text-emerald-400 uppercase">3. Güvenlik Hattı (Sigorta)</label>
                    <p className="text-[10px] text-slate-400">Ne olursa olsun açıkta kalmayayım dediğin yerler. Uyarı: Memnun olmayacaksan yazma!</p>
                    <textarea name="safetyZone" rows={3} value={formData.safetyZone} onChange={handleChange} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none" />
                </div>
            </div>
        </div>

        <div className="pt-8 border-t border-white/5 space-y-4">
             <div className="space-y-2">
                <label className="text-sm font-bold tracking-widest text-slate-300 uppercase">BÖLÜM D: Aile Konseyi / Veto Riskleri</label>
                <p className="text-[10px] text-slate-400">Şehir dışı engeli var mı? İstediğiniz bölüm ile ailenizin beklediği meslek (Tıp vs) baskısı uyumlu mu?</p>
                <textarea name="familyVeto" rows={2} value={formData.familyVeto} onChange={handleChange} placeholder="Örn: Ailem yaşadığım şehirden gitmemi istemiyor..." className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-purple-500 outline-none" />
            </div>
        </div>

        <div className="flex justify-center pt-8">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 md:px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-lg md:text-xl transition-all hover:scale-105 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 disabled:opacity-50 w-full md:w-auto"
          >
            {loading ? (
              <>
                 <Loader2 className="animate-spin" size={24} />
                 Analiz Ediliyor...
              </>
            ) : (
              <>
                 Tercih Simülasyonunu Tamamla
                 <Save size={24} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
