import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Search, 
  Bug, 
  Terminal, 
  AlertTriangle, 
  CheckCircle2, 
  Activity,
  Smile,
  Frown,
  Info
} from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';

const distortions = [
  { id: 'catastrophizing', name: 'Felaketleştirme (Trojan)', description: '"Bu sınavdan düşük alırsam hayatım kayar, her şey biter."', color: 'text-red-400' },
  { id: 'labeling', name: 'Etiketleme (Malware)', description: '"Ben aptalım", "Ben tembelim", "Ben başarısızım".', color: 'text-orange-400' },
  { id: 'all_or_nothing', name: 'Ya Hep Ya Hiç (Binary Virus)', description: '"İlk 1000\'e giremezsem hiç girmeyeyim daha iyi."', color: 'text-amber-400' },
  { id: 'mind_reading', name: 'Zihin Okuma (Spyware)', description: '"Hoca bana bakıp içinden \'Bu çocuktan adam olmaz\' diyor."', color: 'text-rose-400' },
  { id: 'emotional_reasoning', name: 'Duygusal Mantık (Glitch)', description: '"Kendimi ezik hissediyorum, demek ki ben eziğim."', color: 'text-yellow-400' }
];

export default function BavoAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(true);
  const [step, setStep] = useState(1); // 1: Scan, 2: Clean, 3: Final
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  const [selectedDistortions, setSelectedDistortions] = useState<string[]>([]);
  const [thoughtRecords, setThoughtRecords] = useState<{
    negativeThought: string;
    distortionType: string;
    antiVirus: string;
  }[]>([]);
  
  const [scores, setScores] = useState({
    preAnxiety: 5,
    postAnxiety: 5
  });

  const handleAddRecord = () => {
    setThoughtRecords([...thoughtRecords, { negativeThought: '', distortionType: '', antiVirus: '' }]);
  };

  const updateRecord = (index: number, field: string, value: string) => {
    const newRecords = [...thoughtRecords];
    newRecords[index] = { ...newRecords[index], [field]: value };
    setThoughtRecords(newRecords);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const results = {
        selectedDistortions,
        thoughtRecords,
        scores: {
          ...scores,
          drop: scores.preAnxiety - scores.postAnxiety
        },
        timestamp: new Date()
      };
      const docId = await analysisService.saveResult(user.uid, 'B-AVO', results);
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
          <ShieldCheck size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white">Sistem Temizlendi!</h2>
          <p className="text-slate-400 font-medium">Bilişsel virüsler karantinaya alındı. Raporunuz hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  if (showIntro) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in duration-700">
        <header className="space-y-4">
          <button 
            onClick={() => navigate('/panel/ogrenci/analizler')}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mt-4"
          >
            <ChevronLeft size={16} />
            Analizlere Dön
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck size={12} />
            BİLİŞSEL GÜVENLİK MODÜLÜ
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">B-AVO: Bilişsel Anti-Virüs Operasyonu</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl">
            Zihnindeki olumsuz otomatik düşünceleri (virüsleri) temizle ve yerine mantıklı "anti-virüs" yazılımları yükle.
          </p>
        </header>

        <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Search size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Sistem Taraması</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Aaron Beck'in Bilişsel Modeli ve David Burns'ün Bilişsel Çarpıtmalar yöntemini kullanarak zihnindeki hatalı kodları tespit et.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Anti-Virüs Yükleme</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                Bulunan virüsleri "Yeniden Çerçeveleme" tekniği ile etkisiz hale getir ve sistem performansını (motivasyonunu) artır.
              </p>
            </div>
          </div>

          <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl space-y-3">
            <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <Info size={16} /> Metaforik Yaklaşım
            </h4>
            <p className="text-sm text-slate-400 font-medium italic">
              "Senin beynin süper güçlü bir bilgisayar. Ama şu an arka planda çalışan bazı virüsler (korkular) sistemi yavaşlatıyor. Şimdi seninle bir tarama yapacağız."
            </p>
          </div>

          <div className="pt-4 flex justify-center">
            <button
              onClick={() => setShowIntro(false)}
              className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-emerald-600/20 flex items-center gap-3"
            >
              Operasyonu Başlat
              <Zap size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center px-4">
        <button 
          onClick={() => step === 1 ? setShowIntro(true) : setStep(prev => prev - 1)}
          className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`h-2 rounded-full transition-all duration-500 ${s === step ? 'w-12 bg-emerald-500' : 'w-6 bg-white/10'}`}
            />
          ))}
        </div>
        <div className="w-10"></div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-white">SİSTEM TARAMASI</h2>
              <p className="text-slate-400 font-medium">Aşağıdaki virüslerden (düşünce hataları) hangileri zihninde "pop-up" olarak çıkıyor?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {distortions.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelectedDistortions(prev => 
                      prev.includes(d.id) ? prev.filter(id => id !== d.id) : [...prev, d.id]
                    );
                  }}
                  className={`p-6 rounded-3xl border text-left transition-all ${
                    selectedDistortions.includes(d.id)
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-900/50 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className={`text-sm font-black uppercase tracking-widest mb-2 ${d.color}`}>
                    {d.name}
                  </div>
                  <p className="text-sm text-slate-300 font-medium leading-relaxed italic">{d.description}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  if (selectedDistortions.length > 0) {
                    if (thoughtRecords.length === 0) handleAddRecord();
                    setStep(2);
                  }
                }}
                disabled={selectedDistortions.length === 0}
                className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg transition-all disabled:opacity-50"
              >
                Karantinaya Devam Et
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">KARANTİNA VE TEMİZLEME</h2>
              <p className="text-slate-400 font-medium">Virüslü düşünceleri yakala ve onları yeni yazılımlarla etkisiz hale getir.</p>
            </div>

            <div className="space-y-6">
              {thoughtRecords.map((record, index) => (
                <div key={index} className="bg-slate-900/50 border border-white/5 rounded-[32px] p-6 md:p-8 space-y-6 animate-in slide-in-from-bottom duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                        <Bug size={14} /> VİRÜSLÜ DÜŞÜNCE (NEGATİF)
                      </label>
                      <input
                        type="text"
                        value={record.negativeThought}
                        onChange={(e) => updateRecord(index, 'negativeThought', e.target.value)}
                        placeholder="Örn: Deneme kötü geçti, asla kazanamam."
                        className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-red-500/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">VİRÜS TÜRÜ</label>
                      <select
                        value={record.distortionType}
                        onChange={(e) => updateRecord(index, 'distortionType', e.target.value)}
                        className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                      >
                        <option value="">Seçiniz...</option>
                        {distortions.filter(d => selectedDistortions.includes(d.id)).map(d => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck size={14} /> ANTİ-VİRÜS (GERÇEKÇİ / İŞLEVSEL)
                    </label>
                    <textarea
                      value={record.antiVirus}
                      onChange={(e) => updateRecord(index, 'antiVirus', e.target.value)}
                      placeholder="Örn: Bu sadece bir denemeydi, hatalarıma bakıp öğreneceğim."
                      className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddRecord}
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-slate-500 font-bold hover:border-emerald-500/50 hover:text-emerald-500 transition-all flex items-center justify-center gap-2"
              >
                <Bug size={18} /> Yeni Virüs Ekle
              </button>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  if (thoughtRecords.every(r => r.negativeThought && r.antiVirus)) {
                    setStep(3);
                  }
                }}
                className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg transition-all"
              >
                Performans Testine Geç
                <ChevronRight size={24} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-white">SİSTEM DURUMU</h2>
              <p className="text-slate-400 font-medium">Bu çalışmadan sonra kaygı seviyendeki değişimi ölçelim.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 space-y-6 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500">
                    <Frown size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-widest">Önceki Kaygı (0-10)</h3>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={scores.preAnxiety}
                  onChange={(e) => setScores({ ...scores, preAnxiety: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <div className="text-4xl font-black text-red-500">{scores.preAnxiety}</div>
              </div>

              <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 space-y-6 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Smile size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-widest">Sonraki Kaygı (0-10)</h3>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={scores.postAnxiety}
                  onChange={(e) => setScores({ ...scores, postAnxiety: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="text-4xl font-black text-emerald-500">{scores.postAnxiety}</div>
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-emerald-600/20 flex items-center gap-3 disabled:opacity-50"
              >
                {loading ? 'Sistem Kaydediliyor...' : 'Operasyonu Tamamla'}
                <Save size={24} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
