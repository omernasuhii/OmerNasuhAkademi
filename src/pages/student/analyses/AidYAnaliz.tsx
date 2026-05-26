import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, ChevronRight, ChevronLeft, Save, AlertCircle, CheckCircle2, ShieldCheck, Scale, Search, PenTool, Gavel } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';

const stages = [
  { id: 'detection', title: 'Aşama 1: İnanç Tespiti', subtitle: 'Sanık Sandalyesi', icon: Scale, color: 'text-orange-400' },
  { id: 'evidence', title: 'Aşama 2: Kanıt Toplama', subtitle: 'Çapraz Sorgu', icon: Search, color: 'text-blue-400' },
  { id: 'reframing', title: 'Aşama 3: Yeniden Çerçeveleme', subtitle: 'Savunma Makamı', icon: PenTool, color: 'text-indigo-400' },
  { id: 'reinforcement', title: 'Aşama 4: İnanç Pekiştirme', subtitle: 'Hüküm', icon: Gavel, color: 'text-emerald-400' }
];

export default function AidYAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const [formData, setFormData] = useState({
    negativeBelief: '',
    initialIntensity: 5,
    evidence1: '',
    evidence2: '',
    evidence3: '',
    evidence4: '',
    positiveBelief: '',
    finalIntensity: 5,
    actionPlan: ''
  });

  const handleSave = async () => {
    if (!user) return;
    
    // Validation
    if (!formData.negativeBelief || !formData.positiveBelief || !formData.actionPlan) {
      alert('Lütfen tüm alanları doldurunuz.');
      return;
    }

    setLoading(true);
    try {
      await analysisService.saveResult(user.uid, 'AID-Y', {
        ...formData,
        timestamp: new Date()
      });
      setCompleted(true);
      setTimeout(() => navigate('/panel/ogrenci/analizler'), 2000);
    } catch (error) {
      console.error(error);
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
          <h2 className="text-3xl font-black text-white">İnanç Dönüşümü Başladı!</h2>
          <p className="text-slate-400 font-medium">Zihinsel mahkemede hüküm verildi. Yeni inancın sisteme kaydedildi.</p>
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
          <h1 className="text-4xl font-black text-white leading-tight uppercase tracking-tighter italic">AKADEMİK İNANÇ DÖNÜŞTÜRME VE ZİHİNSEL YENİDEN YAPILANDIRMA (AİD-Y)</h1>
        </header>

        <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Analiz Amacı</h3>
                  <p className="text-slate-400 leading-relaxed font-medium text-sm">
                    Performansını sabote eden kök inançları (Örn: "Sayısal zekâm yok") tespit etmek ve onları gerçekçi, pozitif yeni inançlarla değiştirmek.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Brain size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Bilimsel Temel</h3>
                  <p className="text-slate-400 leading-relaxed font-medium text-sm">
                    Carol Dweck’in <strong>Gelişim Zihniyeti</strong> ve BDT (Bilişsel Davranışçı Terapi) temelli <strong>Zihinsel Yeniden Yapılandırma</strong> tekniklerine dayanır.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Uygulama Yöntemi: Zihinsel Mahkeme</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bu bir test değil, bir atölye çalışmasıdır. Süreç boyunca hem savcı hem avukat hem de hakim rolünü üstleneceksin. Yazılı olarak ilerlemek zihnindeki negatif kalıpları kırmanı sağlar.
                </p>
                <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                  <AlertCircle size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Süre: 30-40 Dakika</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <button
              onClick={() => setShowIntro(false)}
              className="w-full md:w-auto px-12 py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-3xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-orange-600/20 flex items-center justify-center gap-3"
            >
              Mahkemeyi Başlat
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStage = stages[currentStep];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="space-y-4">
        <button 
          onClick={() => setShowIntro(true)}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <ChevronLeft size={16} />
          Tanıtıma Dön
        </button>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest">
            <Sparkles size={12} />
            AİD-Y MODÜLÜ
          </div>
          <h1 className="text-3xl font-black text-white">İnanç Dönüştürme Atölyesi</h1>
        </div>
      </header>

      <div className="flex gap-2">
        {stages.map((_, idx) => (
          <div 
            key={idx} 
            className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
              idx <= currentStep ? 'bg-orange-500' : 'bg-white/5'
            }`} 
          />
        ))}
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5">
            <currentStage.icon size={120} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10 relative z-10"
          >
            <div className="space-y-2">
                <h2 className={`text-2xl font-black tracking-tight ${currentStage.color}`}>{currentStage.title}</h2>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">{currentStage.subtitle}</p>
            </div>

            {currentStep === 0 && (
              <div className="space-y-8">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest">Negatif İnanç</label>
                    <textarea
                        value={formData.negativeBelief}
                        onChange={(e) => setFormData(p => ({ ...p, negativeBelief: e.target.value }))}
                        placeholder="Seni en çok durduran, kendine söylediğin o acımasız cümle ne? (Örn: Ben Matematiği asla yapamam)"
                        className="w-full bg-slate-800/50 border border-white/10 rounded-2xl p-4 text-white font-medium focus:outline-none focus:border-orange-500/50 min-h-[120px]"
                    />
                </div>
                <div className="space-y-4">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest">İnanç Derecesi (0-10)</label>
                    <div className="flex items-center gap-6">
                        <input
                            type="range"
                            min="0"
                            max="10"
                            step="1"
                            value={formData.initialIntensity}
                            onChange={(e) => setFormData(p => ({ ...p, initialIntensity: parseInt(e.target.value) }))}
                            className="flex-1 h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-orange-500"
                        />
                        <span className="text-2xl font-black text-orange-400 w-10 text-center">{formData.initialIntensity}</span>
                    </div>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic text-center">Bu cümleye şu an ne kadar inanıyorsun?</p>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-8">
                {[
                    { id: 'evidence1', label: 'Kanıt 1', text: 'Hayatında bu alanda başardığın (küçük de olsa) tek bir an bile var mı?' },
                    { id: 'evidence2', label: 'Kanıt 2', text: 'Şu an yapamıyor olman, "zekan olmadığı" anlamına mı gelir, yoksa "yöntemini bilmediğin" anlamına mı?' },
                    { id: 'evidence3', label: 'Kanıt 3', text: 'Hiç çalışıp da yapamadığın oldu mu? Yoksa çalışmadığın için mi yapamadın?' },
                    { id: 'evidence4', label: 'Kanıt 4', text: 'Bu alanda sonradan öğrenen birini tanıyor musun? O yapabildiyse, senin ne eksiğin var?' }
                ].map((q) => (
                    <div key={q.id} className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-3">
                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{q.label}</label>
                        <p className="text-sm font-bold text-white mb-2">{q.text}</p>
                        <textarea
                            value={(formData as any)[q.id]}
                            onChange={(e) => setFormData(p => ({ ...p, [q.id]: e.target.value }))}
                            className="w-full bg-slate-800/50 border border-white/10 rounded-2xl p-4 text-white text-sm font-medium focus:outline-none focus:border-blue-500/50 min-h-[80px]"
                        />
                    </div>
                ))}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                    <label className="text-sm font-black text-indigo-400 uppercase tracking-widest">Yeni Güçlendirici Cümle</label>
                    <textarea
                        value={formData.positiveBelief}
                        onChange={(e) => setFormData(p => ({ ...p, positiveBelief: e.target.value }))}
                        placeholder="Şimdi bu inancı daha gerçekçi, daha adil ve geliştirilebilir bir cümleye çevir. (Örn: Matematikte şu an zorlanıyorum ama doğru yöntemle gelişebilirim)"
                        className="w-full bg-slate-800/50 border border-white/10 rounded-2xl p-4 text-white font-medium focus:outline-none focus:border-indigo-500/50 min-h-[120px]"
                    />
                </div>
                <div className="space-y-4">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest">Yeni İnanç Derecesi (0-10)</label>
                    <div className="flex items-center gap-6">
                        <input
                            type="range"
                            min="0"
                            max="10"
                            step="1"
                            value={formData.finalIntensity}
                            onChange={(e) => setFormData(p => ({ ...p, finalIntensity: parseInt(e.target.value) }))}
                            className="flex-1 h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-indigo-500"
                        />
                        <span className="text-2xl font-black text-indigo-400 w-10 text-center">{formData.finalIntensity}</span>
                    </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                    <label className="text-sm font-black text-emerald-400 uppercase tracking-widest">Eylem Planı</label>
                    <textarea
                        value={formData.actionPlan}
                        onChange={(e) => setFormData(p => ({ ...p, actionPlan: e.target.value }))}
                        placeholder="Bu yeni inanca sahip biri gibi davranman için BUGÜN ne yapman gerekir? (Örn: Masaya oturup en kolay konudan başlamak)"
                        className="w-full bg-slate-800/50 border border-white/10 rounded-2xl p-4 text-white font-medium focus:outline-none focus:border-emerald-500/50 min-h-[120px]"
                    />
                </div>
                <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-500">
                    <AlertCircle size={18} />
                    <h4 className="text-sm font-black uppercase tracking-widest">Etik ve Uyarı</h4>
                  </div>
                  <p className="text-[11px] text-amber-200/70 leading-relaxed font-medium">
                    Bu çalışma akademik benlik algısı içindir. Eğer inancın akademik değil, derin travmatik köklere dayanıyorsa ("Sevilmeyi hak etmiyorum" vb.) lütfen bir uzmana başvur.
                  </p>
                </div>
              </div>
            )}

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

              {currentStep < stages.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="flex items-center gap-2 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-600/20 transition-all hover:scale-105"
                >
                  Sonraki Aşama
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-3 px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 disabled:opacity-50"
                >
                  {loading ? 'Hüküm Yazılıyor...' : 'Mahkemeyi Tamamla'}
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
