import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, ChevronRight, ChevronLeft, Save, AlertCircle, CheckCircle2, Clock, Zap, Activity, Heart, ShieldAlert, BarChart3 } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';

const questions = [
  // BOYUT 1: BİLİŞSEL FAKTÖRLER
  { id: 1, section: 'Bilişsel', text: 'Dersi dinlerken anladığımı sanıyorum ama soru çözerken yapamıyorum.' },
  { id: 2, section: 'Bilişsel', text: 'Geçmiş yıllardan gelen temel konu eksiklerim (Matematik/Fen vb.) var.' },
  { id: 3, section: 'Bilişsel', text: 'Uzun paragrafları veya karmaşık soruları okurken dikkatim dağılıyor, başa dönüyorum.' },
  { id: 4, section: 'Bilişsel', text: 'Soruların çözüm mantığını kurmakta zorlanıyorum, nereden başlayacağımı bilemiyorum.' },
  { id: 5, section: 'Bilişsel', text: 'Öğrendiğim bilgileri çok çabuk unutuyorum (Hafıza sorunu).' },
  { id: 6, section: 'Bilişsel', text: 'İşlem hatası veya okuma hatası nedeniyle bildiğim soruları kaçırıyorum.' },
  { id: 7, section: 'Bilişsel', text: 'Çalışma yöntemim yanlış; nasıl not alacağımı veya tekrar yapacağımı bilmiyorum.' },
  { id: 8, section: 'Bilişsel', text: 'Sınav süresini yetiştirmekte zorlanıyorum (Hız sorunu).' },
  { id: 9, section: 'Bilişsel', text: 'Soyut kavramları zihnimde somutlaştırmakta güçlük çekiyorum.' },
  { id: 10, section: 'Bilişsel', text: 'Konu çalışırken "önemli" ile "önemsiz" bilgiyi ayırt edemiyorum.' },
  // BOYUT 2: DUYGUSAL FAKTÖRLER
  { id: 11, section: 'Duygusal', text: '"Ne kadar çalışsam da yapamayacağım" düşüncesine kapılıyorum (Öğrenilmiş Çaresizlik).' },
  { id: 12, section: 'Duygusal', text: 'Sınav anında kalbim çarpıyor, elim titriyor veya zihnim boşalıyor (Sınav Kaygısı).' },
  { id: 13, section: 'Duygusal', text: 'Ailemin veya öğretmenlerimin beklentisi beni baskı altına alıyor.' },
  { id: 14, section: 'Duygusal', text: 'Ders çalışmaya karşı içimden hiç istek gelmiyor (Motivasyon Eksikliği).' },
  { id: 15, section: 'Duygusal', text: 'Başarısız olursam rezil olacağımı veya sevilmeyeceğimi düşünüyorum.' },
  { id: 16, section: 'Duygusal', text: 'Arkadaşlarımla kendimi kıyaslıyor ve kendimi yetersiz hissediyorum.' },
  { id: 17, section: 'Duygusal', text: 'Gelecekle ilgili bir hedefim veya hayalim yok, neden çalıştığımı bilmiyorum.' },
  { id: 18, section: 'Duygusal', text: 'Zorlandığımda hemen moralim bozuluyor ve bırakmak istiyorum (Düşük Dayanıklılık).' },
  { id: 19, section: 'Duygusal', text: 'Sınav sistemi veya belirsizlik beni öfkelendiriyor.' },
  { id: 20, section: 'Duygusal', text: 'Hata yapmaktan aşırı derecede korkuyorum (Mükemmeliyetçilik).' },
  // BOYUT 3: DAVRANIŞSAL FAKTÖRLER
  { id: 21, section: 'Davranışsal', text: 'Ders çalışmayı sürekli "birazdan başlarım" diyerek erteliyorum (Procrastination).' },
  { id: 22, section: 'Davranışsal', text: 'Telefon, sosyal medya veya oyun başında saatler harcıyorum (Dijital Çeldiriciler).' },
  { id: 23, section: 'Davranışsal', text: 'Düzenli bir çalışma programım yok, rastgele çalışıyorum.' },
  { id: 24, section: 'Davranışsal', text: 'Uyku düzenim bozuk (Çok geç yatıyorum veya uykusuzum).' },
  { id: 25, section: 'Davranışsal', text: 'Çalışma masam dağınık veya ortam gürültülü, odaklanamıyorum.' },
  { id: 26, section: 'Davranışsal', text: 'Zor derslerden kaçıp sadece sevdiğim/yapabildiğim dersleri çalışıyorum.' },
  { id: 27, section: 'Davranışsal', text: 'Deneme sınavlarına girmekten kaçıyorum veya sonuçlarımı analiz etmiyorum.' },
  { id: 28, section: 'Davranışsal', text: 'Okul/Dershane dışında evde hiç tekrar yapmıyorum.' },
  { id: 29, section: 'Davranışsal', text: 'Beslenme alışkanlıklarım düzensiz, derste sürekli uykum geliyor.' },
  { id: 30, section: 'Davranışsal', text: 'Verdiğim sözleri tutmakta (ödev, soru hedefi) zorlanıyorum (İrade Zayıflığı).' }
];

const stages = [
  { id: 'intro', title: 'Hoş Geldiniz', icon: ShieldAlert },
  { id: 'cog', title: 'Bilişsel Boyut', icon: Brain, description: 'Zihinsel Süreçler ve Temel' },
  { id: 'emo', title: 'Duygusal Boyut', icon: Heart, description: 'Hisler ve İnançlar' },
  { id: 'beh', title: 'Davranışsal Boyut', icon: Activity, description: 'Eylemler ve Alışkanlıklar' },
  { id: 'finish', title: 'Sonuçları Kaydet', icon: CheckCircle2 }
];

export default function ApeaAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stageIdx, setStageIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const calculateScores = () => {
    let cog = 0;
    let emo = 0;
    let beh = 0;
    questions.forEach(q => {
      const val = answers[q.id] || 0;
      if (q.section === 'Bilişsel') cog += val;
      else if (q.section === 'Duygusal') emo += val;
      else beh += val;
    });
    return { cog, emo, beh };
  };

  const handleSave = async () => {
    if (!user) return;
    const { cog, emo, beh } = calculateScores();
    
    setLoading(true);
    try {
      await analysisService.saveResult(user.uid, 'APEA-3D', {
        answers,
        scores: {
            cognitive: cog,
            emotional: emo,
            behavioral: beh,
            total: cog + emo + beh
        },
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

  const currentStage = stages[stageIdx];
  const screenQuestions = questions.filter(q => {
      if (stageIdx === 1) return q.section === 'Bilişsel';
      if (stageIdx === 2) return q.section === 'Duygusal';
      if (stageIdx === 3) return q.section === 'Davranışsal';
      return false;
  });

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white italic tracking-tighter">ANALİZ TAMAMLANDI!</h2>
          <p className="text-slate-400 font-medium">Performans engellerin laboratuvar kayıtlarına eklendi.</p>
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
          Laboratuvara Dön
        </button>
        <div className="space-y-2">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
            <ShieldAlert size={12} />
            APEA-3D ENVANTERİ
          </div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">AKADEMİK PERFORMANS ENGEL ANALİZİ</h1>
        </div>
      </header>

      <div className="flex gap-2">
        {stages.map((_, idx) => (
          <div 
            key={idx} 
            className={`flex-1 h-1.5 rounded-full transition-all duration-700 ${
              idx <= stageIdx ? 'bg-indigo-500' : 'bg-white/5'
            }`} 
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {stageIdx === 0 && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <div className="w-16 h-16 bg-indigo-500/20 rounded-3xl flex items-center justify-center text-indigo-400">
                        <ShieldAlert size={32} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Engellerini Kaldır</h2>
                        <p className="text-slate-400 font-medium leading-relaxed italic">
                            Potansiyelini performansa dönüştürmeni engelleyen "kök nedenleri" tespit etmek için tasarlanmış derinlemesine bir analiz.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-white/5 order border-white/10 rounded-3xl space-y-4">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Analiz Boyutları</h4>
                        <ul className="space-y-3">
                            {[
                                { t: 'Bilişsel:', d: 'Bilgi işleme ve temel eksikleri.' },
                                { t: 'Duygusal:', d: 'Kaygı ve motivasyon dengesi.' },
                                { t: 'Davranışsal:', d: 'Alışkanlıklar ve disiplin.' }
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-xs text-slate-300 font-medium">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1" />
                                    <span>
                                        <strong className="text-indigo-400">{item.t}</strong> {item.d}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-500">
                        <ShieldAlert size={20} className="shrink-0" />
                        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                            ⚠️ DİKKAT: BU TEST SENİ YARGILAMAK İÇİN DEĞİL, YÖN VERMEK İÇİNDİR.
                        </p>
                    </div>
                </div>
            </div>
            <button
              onClick={() => setStageIdx(1)}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
            >
              Analizi Başlat
              <ChevronRight size={24} />
            </button>
          </motion.div>
        )}

        {(stageIdx >= 1 && stageIdx <= 3) && (
          <motion.div
            key={currentStage.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                    <currentStage.icon size={24} />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-white uppercase italic">{currentStage.title}</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {currentStage.description}
                    </p>
                 </div>
            </div>

            <div className="grid gap-4">
                {screenQuestions.map((q) => (
                    <div key={q.id} className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 hover:border-white/10 transition-colors">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">Soru {q.id}</span>
                            <p className="text-lg font-bold text-white leading-snug">{q.text}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {[
                                { label: 'Hiçbir Zaman', val: 1 },
                                { label: 'Nadir', val: 2 },
                                { label: 'Bazen', val: 3 },
                                { label: 'Sık Sık', val: 4 },
                                { label: 'Her Zaman', val: 5 }
                            ].map((opt) => (
                                <button
                                    key={opt.val}
                                    onClick={() => handleAnswer(q.id, opt.val)}
                                    className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        answers[q.id] === opt.val
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/50'
                                            : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center bg-slate-900/80 backdrop-blur-md p-6 rounded-[32px] border border-white/5 sticky bottom-4 z-50 shadow-2xl">
                <button
                    onClick={() => setStageIdx(prev => prev - 1)}
                    className="flex items-center gap-2 px-6 py-3 text-slate-400 hover:text-white font-black uppercase tracking-widest text-xs"
                >
                    <ChevronLeft size={18} />
                    Geri
                </button>
                
                <button
                    onClick={() => setStageIdx(prev => prev + 1)}
                    disabled={screenQuestions.some(q => answers[q.id] === undefined)}
                    className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:scale-105 disabled:opacity-50 shadow-xl shadow-indigo-600/20 flex items-center gap-2"
                >
                    {stageIdx === 3 ? 'Değerlendirmeye Geç' : 'Sonraki Bölüm'}
                    <ChevronRight size={18} />
                </button>
            </div>
          </motion.div>
        )}

        {stageIdx === 4 && (
          <motion.div
            key="finish"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8 text-center"
          >
            <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 mx-auto">
              <CheckCircle2 size={40} />
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Engel Analizi Hazır</h2>
              <p className="text-slate-400 font-medium">
                Tüm boyutları tamamladın. Şimdi bu verileri laboratuvar sistemine kaydedip detaylı bir döküm oluşturacağız.
              </p>
            </div>

            <div className="pt-8 border-t border-white/5">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full md:w-auto px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 mx-auto"
                >
                    {loading ? (
                        <>Kaydediliyor...</>
                    ) : (
                        <>
                            Sonuçları Sisteme İşle
                            <Save size={24} />
                        </>
                    )}
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
