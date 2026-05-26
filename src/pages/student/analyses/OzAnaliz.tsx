import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, ChevronRight, ChevronLeft, Save, AlertCircle, CheckCircle2, Star, Info } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';

const sections = [
  { id: 'swot', title: 'Bölüm 1: Kişisel SWOT Analizi' },
  { id: 'traffic', title: 'Bölüm 2: Trafik Işığı Yöntemi' },
  { id: 'wheel', title: 'Bölüm 3: Akademik Yaşam Çarkı' },
  { id: 'reflection', title: 'Bölüm 4: Yansıtma ve Taahhüt' }
];

const wheelAreas = [
  { id: 'Ders Başarısı', label: 'Ders Başarısı' },
  { id: 'Uyku Düzeni', label: 'Uyku Düzeni' },
  { id: 'Aile İlişkileri', label: 'Aile İlişkileri' },
  { id: 'Arkadaş İlişkileri', label: 'Arkadaş İlişkileri' },
  { id: 'Motivasyon / Ruh Hali', label: 'Motivasyon / Ruh Hali' },
  { id: 'Fiziksel Sağlık / Beslenme', label: 'Fiziksel Sağlık / Beslenme' }
];

export default function OzAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const [formData, setFormData] = useState({
    swot: {
      strengths: ['', '', ''],
      weaknesses: ['', '', ''],
      opportunities: ['', '', ''],
      threats: ['', '', '']
    },
    traffic: {
      stop: '',
      start: '',
      continue: ''
    },
    wheel: {
      'Ders Başarısı': 5,
      'Uyku Düzeni': 5,
      'Aile İlişkileri': 5,
      'Arkadaş İlişkileri': 5,
      'Motivasyon / Ruh Hali': 5,
      'Fiziksel Sağlık / Beslenme': 5
    },
    reflection: {
      improvement: '',
      commitment: ''
    }
  });

  const updateSwot = (type: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      swot: {
        ...prev.swot,
        [type]: prev.swot[type as keyof typeof prev.swot].map((v, i) => i === index ? value : v)
      }
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await analysisService.saveResult(user.uid, 'OZ-AF', formData);
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
          <h2 className="text-3xl font-black text-white">Analiz Tamamlandı!</h2>
          <p className="text-slate-400 font-medium">Verilerin başarıyla sistemine kaydedildi. Koçunla bu veriler üzerine konuşabilirsin.</p>
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
          <h1 className="text-4xl font-black text-white">360° Öz-Analiz ve Farkındalık Modülü</h1>
        </header>

        <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Brain size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Analiz Hakkında</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  Bu modül, öğrencinin akademik ve kişisel gelişimini; Güçlü/Zayıf yönler, Fırsatlar ve Tehditler (SWOT) ekseninde analiz etmesini sağlar. 
                  Dış denetim yerine iç denetim (öz-sorumluluk) bilincini geliştirmeyi hedefler.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Sparkles size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Bilimsel Temel</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  <strong>Metabiliş (Üstbiliş):</strong> Kişinin kendi düşünme süreçlerini izlemesi ve yönetmesi üzerine kuruludur. 
                  Stratejik planlama tekniği olan <strong>SWOT Analizi</strong>'nin kişisel gelişime uyarlanmış halidir.
                </p>
              </div>
            </div>

            <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl space-y-3 shadow-lg shadow-amber-500/5">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertCircle size={18} />
                <h4 className="text-sm font-black uppercase tracking-widest">Bilimsel Not ve Uyarı</h4>
              </div>
              <p className="text-xs text-amber-200/70 leading-relaxed font-medium">
                Bu analiz, eğitim koçluğu süreçlerini desteklemek amacıyla hazırlanmış bir farkındalık aracıdır. 
                Gerçek bilimsel araştırmalara ve SWOT metodolojisine dayanır; ancak bir <strong>klinik psikolojik test veya psikiyatrik tanı aracı değildir.</strong> 
                Elde edilen sonuçlar sadece gelişimsel rehberlik amacı taşır.
              </p>
            </div>

            <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl space-y-3">
              <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest">Nasıl Uygulanır?</h4>
              <ul className="text-sm text-slate-400 space-y-2 font-medium">
                <li className="flex items-center gap-2">• Kendine karşı tamamen dürüst olmalısın.</li>
                <li className="flex items-center gap-2">• Sessiz bir ortamda, yaklaşık 15-20 dakika sürecektir.</li>
                <li className="flex items-center gap-2">• Bu bir sınav değil, aynaya bakma çalışmasıdır.</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <button
              onClick={() => setShowIntro(false)}
              className="w-full md:w-auto px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3"
            >
              Analizi Başlat
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
            <Brain size={12} />
            360° ÖZ-AF MODÜLÜ
          </div>
          <h1 className="text-3xl font-black text-white">Öz-Analiz ve Farkındalık</h1>
          <p className="text-slate-400 font-medium leading-relaxed italic">
            "Bu kağıdı kimse yargılamayacak. Kendine karşı acımasız olma ama dürüst ol. Gelişimin ilk şartı, mevcut durumu kabul etmektir."
          </p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-4">
          <Info className="text-amber-500 shrink-0" size={20} />
          <p className="text-xs text-amber-200/80 leading-relaxed font-medium">
            <strong>Yasal Bildirim:</strong> Bu analiz akademik performans ve kişisel farkındalık gelişimi için kurgulanmış bilimsel bir araçtır. Klinik bir psikososyal değerlendirme veya terapötik bir müdahale yerine geçmez.
          </p>
        </div>
      </header>

      {/* Stepper Progress */}
      <div className="flex gap-2">
        {sections.map((_, idx) => (
          <div 
            key={idx} 
            className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
              idx <= currentStep ? 'bg-blue-500' : 'bg-white/5'
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
            className="space-y-10"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">{sections[currentStep].title}</h2>
              <p className="text-slate-500 text-sm font-medium">Bölümü dürüstçe doldurarak ilerlemeye devam et.</p>
            </div>

            {currentStep === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Güçlü Yönler */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-500 items-center justify-center text-white text-[10px] flex">G</span>
                    Güçlü Yönlerim
                  </label>
                  <div className="space-y-2 text-xs text-slate-500 font-medium mb-4">
                    Örn: İnatçıyım, matematiğim iyi, hızlı okurum.
                  </div>
                  {formData.swot.strengths.map((val, i) => (
                    <input
                      key={i}
                      type="text"
                      value={val}
                      onChange={(e) => updateSwot('strengths', i, e.target.value)}
                      placeholder={`${i + 1}. maddeyi giriniz...`}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30 font-medium transition-all"
                    />
                  ))}
                </div>

                {/* Zayıf Yönler */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-red-500 items-center justify-center text-white text-[10px] flex">Z</span>
                    Zayıf Yönlerim
                  </label>
                  <div className="space-y-2 text-xs text-slate-500 font-medium mb-4">
                    Örn: Çabuk sıkılırım, telefona çok bakarım.
                  </div>
                  {formData.swot.weaknesses.map((val, i) => (
                    <input
                      key={i}
                      type="text"
                      value={val}
                      onChange={(e) => updateSwot('weaknesses', i, e.target.value)}
                      placeholder={`${i + 1}. maddeyi giriniz...`}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/30 font-medium transition-all"
                    />
                  ))}
                </div>

                {/* Fırsatlar */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500 items-center justify-center text-white text-[10px] flex">F</span>
                    Fırsatlarım
                  </label>
                  <div className="space-y-2 text-xs text-slate-500 font-medium mb-4">
                    Örn: Odam sessiz, internetim var, destekleyici ailem var.
                  </div>
                  {formData.swot.opportunities.map((val, i) => (
                    <input
                      key={i}
                      type="text"
                      value={val}
                      onChange={(e) => updateSwot('opportunities', i, e.target.value)}
                      placeholder={`${i + 1}. maddeyi giriniz...`}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/30 font-medium transition-all"
                    />
                  ))}
                </div>

                {/* Tehditler */}
                <div className="space-y-4">
                  <label className="text-sm font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500 items-center justify-center text-white text-[10px] flex">T</span>
                    Tehditlerim
                  </label>
                  <div className="space-y-2 text-xs text-slate-500 font-medium mb-4">
                    Örn: Arkadaş grubum çok geziyor, ev çok gürültülü.
                  </div>
                  {formData.swot.threats.map((val, i) => (
                    <input
                      key={i}
                      type="text"
                      value={val}
                      onChange={(e) => updateSwot('threats', i, e.target.value)}
                      placeholder={`${i + 1}. maddeyi giriniz...`}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/30 font-medium transition-all"
                    />
                  ))}
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="space-y-4">
                   <label className="flex items-center gap-3 text-sm font-black text-red-500 uppercase tracking-widest">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                      🛑 DUR (Stop)
                   </label>
                   <textarea
                    value={formData.traffic.stop}
                    onChange={(e) => setFormData(p => ({ ...p, traffic: { ...p.traffic, stop: e.target.value } }))}
                    placeholder="Şu andan itibaren yapmayı bırakman gereken kötü alışkanlık ne? (Örn: Gece 02.00'ye kadar telefonda vakit öldürmeyi bırakıyorum.)"
                    className="w-full bg-white/5 border border-white/5 rounded-3xl p-6 text-white text-sm font-medium focus:outline-none focus:border-red-500/30 min-h-[120px] resize-none"
                   />
                </div>

                <div className="space-y-4">
                   <label className="flex items-center gap-3 text-sm font-black text-amber-500 uppercase tracking-widest">
                      <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                      🟡 BAŞLA (Start)
                   </label>
                   <textarea
                    value={formData.traffic.start}
                    onChange={(e) => setFormData(p => ({ ...p, traffic: { ...p.traffic, start: e.target.value } }))}
                    placeholder="Bugüne kadar yapmadığın ama artık yapman gereken yeni şey ne? (Örn: Her sabah 20 paragraf sorusu çözmeye başlıyorum.)"
                    className="w-full bg-white/5 border border-white/5 rounded-3xl p-6 text-white text-sm font-medium focus:outline-none focus:border-amber-500/30 min-h-[120px] resize-none"
                   />
                </div>

                <div className="space-y-4">
                   <label className="flex items-center gap-3 text-sm font-black text-emerald-500 uppercase tracking-widest">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      🟢 DEVAM ET (Continue)
                   </label>
                   <textarea
                    value={formData.traffic.continue}
                    onChange={(e) => setFormData(p => ({ ...p, traffic: { ...p.traffic, continue: e.target.value } }))}
                    placeholder="Hangi huyun/yöntemim çok iyi ve bunu korumalısın? (Örn: Derste not tutma alışkanlığımı aynen sürdüreceğim.)"
                    className="w-full bg-white/5 border border-white/5 rounded-3xl p-6 text-white text-sm font-medium focus:outline-none focus:border-emerald-500/30 min-h-[120px] resize-none"
                   />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8">
                <p className="text-sm font-medium text-slate-400">Her alana 1 ile 10 arasında bir puan ver.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  {wheelAreas.map((area) => (
                    <div key={area.id} className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-300">{area.label}</label>
                        <span className="text-lg font-black text-blue-400">{formData.wheel[area.id as keyof typeof formData.wheel]}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={formData.wheel[area.id as keyof typeof formData.wheel]}
                        onChange={(e) => setFormData(p => ({ ...p, wheel: { ...p.wheel, [area.id]: parseInt(e.target.value) } }))}
                        className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex justify-between text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                        <span>Kritik</span>
                        <span>Mükemmel</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-8 space-y-4">
                  <h3 className="text-lg font-bold text-blue-400">Gelişim Planı</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-sm">
                    Verdiğin puanlara bakılırsa en düşük gelişim alanına odaklanma vaktin geldi.
                  </p>
                  <textarea
                    value={formData.reflection.improvement}
                    onChange={(e) => setFormData(p => ({ ...p, reflection: { ...p.reflection, improvement: e.target.value } }))}
                    placeholder="En düşük puan verdiğin alanı 1 puan artırmak için ne yapabilirsin?"
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-6 text-white text-sm font-medium focus:outline-none focus:border-blue-500/30 min-h-[120px] resize-none mt-4"
                  />
                </div>

                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-8 space-y-4">
                  <h3 className="text-lg font-bold text-indigo-400">Kişisel Taahhüt</h3>
                  <textarea
                    value={formData.reflection.commitment}
                    onChange={(e) => setFormData(p => ({ ...p, reflection: { ...p.reflection, commitment: e.target.value } }))}
                    placeholder="Bu analizden sonra kendine verdiğin en büyük söz nedir?"
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-6 text-white text-sm font-medium focus:outline-none focus:border-indigo-500/30 min-h-[120px] resize-none"
                  />
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

              {currentStep < sections.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
                >
                  Devam Et
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-3 px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 disabled:opacity-50"
                >
                  {loading ? 'Kaydediliyor...' : 'Analizi Tamamla & Kaydet'}
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
