import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Eye, 
  Volume2, 
  Hand, 
  Target, 
  Zap, 
  CheckCircle2, 
  Monitor, 
  Palette, 
  Sun, 
  Maximize, 
  Film
} from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';

const steps = [
  {
    id: 1,
    title: 'İNANÇLARI BELİRLEME',
    subtitle: 'Niyet ve Hedef',
    description: 'Seni geride tutan o eski inancı ve onun yerine koymak istediğin yeni, güçlü inancı belirle.',
    icon: Target,
    fields: [
      { id: 'oldBelief', label: 'Eski İnanç (Değiştirmek istediğin)', placeholder: 'Örn: Matematiği asla yapamam.' },
      { id: 'newBelief', label: 'Yeni İnanç (Yerine koymak istediğin)', placeholder: 'Örn: Çalışırsam matematiği öğrenebilirim.' }
    ]
  },
  {
    id: 2,
    title: 'ESKİ KODLARI ÇÖZME',
    subtitle: 'Görsel Analiz',
    description: 'Şimdi o eski "Yapamam" inancını zihninde canlandır ve özelliklerini işaretle.',
    icon: Eye,
    category: 'Görsel',
    factors: [
      { id: 'old_color', label: 'Renk', options: ['Renkli', 'Siyah/Beyaz'] },
      { id: 'old_brightness', label: 'Parlaklık', options: ['Parlak', 'Soluk/Karanlık'] },
      { id: 'old_distance', label: 'Uzaklık', options: ['Yakın', 'Uzak'] },
      { id: 'old_movement', label: 'Hareket', options: ['Hareketli', 'Durağan (Donmuş)'] }
    ]
  },
  {
    id: 3,
    title: 'YENİ KODLARI ÇIKARMA',
    subtitle: 'İdeal Durum',
    description: 'Şimdi de o yeni, güçlü "Yapabilirim" inancının zihninde nasıl göründüğünü analiz et.',
    icon: Sparkles,
    category: 'Görsel',
    factors: [
      { id: 'new_color', label: 'Renk', options: ['Renkli', 'Siyah/Beyaz'] },
      { id: 'new_brightness', label: 'Parlaklık', options: ['Parlak', 'Soluk/Karanlık'] },
      { id: 'new_distance', label: 'Uzaklık', options: ['Yakın', 'Uzak'] },
      { id: 'new_movement', label: 'Hareket', options: ['Hareketli', 'Durağan (Donmuş)'] }
    ]
  },
  {
    id: 4,
    title: 'HARİTALAMA VE DEĞİŞİM',
    subtitle: 'Yeniden Yazma',
    description: 'Gözlerini kapat. Eski inancın görüntüsünü, yeni inancın parlaklığına, rengine ve enerjisine dönüştür. Zihninde "Kaydet" tuşuna bas.',
    icon: Monitor,
    hasInteractiveAction: true
  },
  {
    id: 5,
    title: 'SON TEST',
    subtitle: 'İnanç-Metre',
    description: 'Şimdi eski düşünceyi tekrar hatırla. Hala eskisi kadar gerçekçi geliyor mu yoksa bir şeyler değişti mi?',
    icon: CheckCircle2,
    fields: [
      { id: 'preScore', label: 'Çalışma Öncesi İnanç Derecesi (0-10)', type: 'number', placeholder: 'Örn: 9' },
      { id: 'postScore', label: 'Çalışma Sonrası İnanç Derecesi (0-10)', type: 'number', placeholder: 'Örn: 2' },
      { id: 'feedback', label: 'Neler Hissettin?', type: 'textarea', placeholder: 'Görüntü uzaklaştı ve komik gelmeye başladı...' }
    ]
  }
];

export default function AmidModulu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isMapping, setIsMapping] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docId = await analysisService.saveResult(user.uid, 'AMID', {
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
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white">Nörolojik Değişim Gerçekleşti!</h2>
          <p className="text-slate-400 font-medium max-w-sm mx-auto">İnanç kodlarınız başarıyla güncellendi. Yapay zeka "Zihinsel Güncelleme Raporunuzu" hazırlıyor...</p>
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-widest">
            <Brain size={12} />
            NÖRO-YAZILIM MODÜLÜ
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">AMİD: Alt Modalite İnanç Değişim Protokolü</h1>
          <p className="text-xl text-slate-400 font-medium">Beynin "dosya uzantılarını" değiştirerek kısıtlayıcı inançlarını serbest bırak.</p>
        </header>

        <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                <Monitor size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Beyin Bir Bilgisayardır</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  İnançların beyinde statik dosyalar değildir. Her birinin parlaklık, renk, konum ve ses gibi "alt özellikleri" vardır. Bu özellikleri değiştirdiğinde, inancın hissettirdiği etki de anında değişir.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Palette size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Kuramsal Dayanak</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  <strong>Richard Bandler</strong> ve <strong>John Grinder</strong> tarafından geliştirilen <strong>NLP (Neuro-Linguistic Programming)</strong> tekniklerini temel alır. "Haritalama (Mapping Across)" yöntemiyle nöro-yazılım güncellenir.
                </p>
              </div>
            </div>

            <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl space-y-3">
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <Zap size={16} /> Önemli Not
              </h4>
              <p className="text-sm text-slate-400 font-medium">
                Bu modül derin bir odaklanma gerektirir. Lütfen adımları takip ederken zihninde oluşan görüntülere müdahale etme, sadece olanı fark et. Sessiz bir ortamda olman sonuçların kalıcılığını artırır.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 text-center">
            <button
              onClick={() => setShowIntro(false)}
              className="w-full md:w-auto px-12 py-5 bg-violet-600 hover:bg-violet-500 text-white rounded-3xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-violet-600/20 flex items-center justify-center gap-3"
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
              className={`w-3 h-3 rounded-full transition-all duration-500 ${idx === currentStep ? 'bg-violet-500 w-8' : idx < currentStep ? 'bg-emerald-500' : 'bg-white/10'}`}
            />
          ))}
        </div>
        <div className="w-10 opacity-0"></div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8"
        >
          <div className="flex flex-col items-center text-center space-y-6">
            <motion.div 
              key={activeStep.id}
              initial={{ rotateY: 180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              className="w-20 h-20 rounded-3xl bg-violet-500/20 flex items-center justify-center text-violet-400"
            >
              <StepIcon size={40} />
            </motion.div>
            <div className="space-y-2">
              <span className="text-xs font-black text-violet-500 uppercase tracking-widest">{activeStep.subtitle}</span>
              <h2 className="text-3xl font-black text-white">{activeStep.title}</h2>
              <p className="text-slate-400 font-medium leading-relaxed max-w-xl mx-auto">
                {activeStep.description}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {activeStep.fields && (
              <div className="space-y-4">
                {activeStep.fields.map(field => (
                  <div key={field.id} className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">{field.label}</label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                        placeholder={field.placeholder}
                        rows={3}
                        className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                      />
                    ) : (
                      <input
                        type={field.type || 'text'}
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-violet-500/50 transition-colors"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeStep.factors && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeStep.factors.map(factor => (
                  <div key={factor.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-300">{factor.label}</span>
                    <div className="flex bg-slate-950 rounded-lg p-1 border border-white/5">
                      {factor.options.map(option => (
                        <button
                          key={option}
                          onClick={() => setFormData(prev => ({ ...prev, [factor.id]: option }))}
                          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${formData[factor.id] === option ? 'bg-violet-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeStep.hasInteractiveAction && (
              <div className="space-y-8 flex flex-col items-center">
                <div className="grid grid-cols-2 gap-8 w-full max-w-sm">
                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-24 h-24 rounded-[32px] border-2 transition-all duration-1000 flex items-center justify-center ${isMapping ? 'scale-50 opacity-0' : 'bg-slate-900 border-white/10'}`}>
                      <Monitor className="text-slate-700" size={32} />
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Eski İnanç</span>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-24 h-24 rounded-[32px] border-2 transition-all duration-1000 flex items-center justify-center ${isMapping ? 'scale-125 bg-violet-500/20 border-violet-500 animate-pulse shadow-[0_0_30px_rgba(139,92,246,0.3)]' : 'bg-slate-900 border-white/5 opacity-20'}`}>
                      <Zap className={isMapping ? 'text-violet-400' : 'text-slate-800'} size={32} />
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Yeni İnanç</span>
                  </div>
                </div>

                {!isMapping ? (
                  <button 
                    onClick={() => {
                      setIsMapping(true);
                      setTimeout(() => setIsMapping(false), 5000);
                    }}
                    className="px-12 py-4 bg-violet-500 hover:bg-violet-400 text-white rounded-3xl font-black text-sm tracking-widest uppercase flex items-center gap-3 transition-all active:scale-95"
                  >
                    <Film size={20} /> Yazılımı Güncelle
                  </button>
                ) : (
                  <div className="text-violet-400 font-black animate-bounce tracking-widest flex items-center gap-2">
                    <Monitor className="animate-spin" size={20} /> VERİLER KOPYALANIYOR...
                  </div>
                )}
                
                <p className="text-xs text-slate-500 font-medium text-center max-w-sm">
                  "Şimdi o eski görüntünün rengini renklendir, parlat ve yeni inancın parlaklığına eriştir. Hazır olduğunda devam et."
                </p>
              </div>
            )}
          </div>

          <div className="pt-8 border-t border-white/5">
            <button
              onClick={handleNext}
              disabled={loading || (activeStep.fields && activeStep.fields.some(f => !formData[f.id])) || (activeStep.factors && activeStep.factors.some(f => !formData[f.id]))}
              className="w-full py-5 bg-violet-600 hover:bg-violet-500 text-white rounded-3xl font-black text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? 'Yazılım İşleniyor...' : currentStep === steps.length - 1 ? 'Değişimi Mühürle' : 'Sonraki Adıma Geç'}
              <ChevronRight size={24} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
