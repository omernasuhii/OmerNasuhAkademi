import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, ChevronRight, ChevronLeft, Save, CheckCircle2, Target, Users, Compass, ShieldAlert, BookOpen } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';

const questions = [
  // BOYUT A: AKADEMİK TUTUM
  { id: 1, section: 'akademik', text: 'Ders çalışmak benim için...' },
  { id: 2, section: 'akademik', text: 'Matematik dersi...' },
  { id: 3, section: 'akademik', text: 'Öğretmenlerim benim hakkımda...' },
  { id: 4, section: 'akademik', text: 'Sınıfta tahtaya kalktığımda...' },
  { id: 5, section: 'akademik', text: 'Ödevlerimi yaparken...' },
  { id: 6, section: 'akademik', text: 'Okula gitmek...' },
  { id: 7, section: 'akademik', text: 'Kitap okumak...' },
  // BOYUT B: BAŞARI VE YETERSİZLİK
  { id: 8, section: 'basari', text: 'En büyük korkum...' },
  { id: 9, section: 'basari', text: 'Hata yaptığım zaman...' },
  { id: 10, section: 'basari', text: 'Sınavdan düşük not aldığımda kendimi...' },
  { id: 11, section: 'basari', text: 'Aslında başarabilirim ama...' },
  { id: 12, section: 'basari', text: 'Deneme sınavı sonuçlarını görünce...' },
  { id: 13, section: 'basari', text: 'Kendime en çok kızdığım konu...' },
  { id: 14, section: 'basari', text: 'Başkaları beni başarılı bulsa da ben...' },
  // BOYUT C: AİLE VE ÇEVRE
  { id: 15, section: 'aile', text: 'Babam derslerimle ilgili...' },
  { id: 16, section: 'aile', text: 'Annem beni...' },
  { id: 17, section: 'aile', text: 'Ailem benim geleceğim hakkında...' },
  { id: 18, section: 'aile', text: 'Ders çalışmadığım zaman evdekiler...' },
  { id: 19, section: 'aile', text: 'Keşke ailem...' },
  // BOYUT D: GELECEK VE HEDEFLER
  { id: 20, section: 'gelecek', text: 'Gelecekte ben...' },
  { id: 21, section: 'gelecek', text: 'Üniversiteyi/Liseyi kazanırsam...' },
  { id: 22, section: 'gelecek', text: 'Eğer hedefime ulaşamazsam...' },
  { id: 23, section: 'gelecek', text: 'Hayat benim için...' },
  { id: 24, section: 'gelecek', text: 'En büyük hayalim...' },
  { id: 25, section: 'gelecek', text: 'Bence başarı...' }
];

const stages = [
  { id: 'intro', title: 'Hoş Geldiniz', icon: BookOpen },
  { id: 'akademik', title: 'Akademik Tutum', icon: Brain, description: 'Ders ve Okul Algısı' },
  { id: 'basari', title: 'Başarı ve Yetersizlik', icon: Target, description: 'Öz-Yeterlilik' },
  { id: 'aile', title: 'Aile ve Çevre', icon: Users, description: 'Baskı ve Destek' },
  { id: 'gelecek', title: 'Gelecek ve Hedefler', icon: Compass, description: 'Umut ve Kaygı' },
  { id: 'finish', title: 'Sonuçları Kaydet', icon: CheckCircle2 }
];

export default function AbcteAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stageIdx, setStageIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const currentStage = stages[stageIdx];
  const screenQuestions = questions.filter(q => {
      if (stageIdx === 1) return q.section === 'akademik';
      if (stageIdx === 2) return q.section === 'basari';
      if (stageIdx === 3) return q.section === 'aile';
      if (stageIdx === 4) return q.section === 'gelecek';
      return false;
  });

  const isStageComplete = () => {
    return screenQuestions.every(q => answers[q.id]?.trim().length > 0);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await analysisService.saveResult(user.uid, 'AB-CTE', {
        answers,
        // Skor hesaplanmıyor (projektif test). AI yorumlayacak.
        timestamp: new Date()
      });
      setCompleted(true);
      setTimeout(() => navigate('/panel/ogrenci/analizler'), 2000);
    } catch (error) {
      console.error(error);
      alert('Kaydedilirken bir hata oluştu');
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
          <h2 className="text-3xl font-black text-white italic tracking-tighter">ENVANTER TAMAMLANDI!</h2>
          <p className="text-slate-400 font-medium">Bilinçaltı yansımaların ve akademik algın başarıyla laboratuvara kaydedildi.</p>
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
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
            <Brain size={12} />
            AB-CTE ENVANTERİ
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter uppercase leading-none">AKADEMİK VE BİLİŞSEL ALGI</h1>
        </div>
      </header>

      <div className="flex gap-2">
        {stages.map((_, idx) => (
          <div 
            key={idx} 
            className={`flex-1 h-1.5 rounded-full transition-all duration-700 ${
              idx <= stageIdx ? 'bg-cyan-500' : 'bg-white/5'
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
            className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 space-y-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <div className="w-16 h-16 bg-cyan-500/20 rounded-3xl flex items-center justify-center text-cyan-400">
                        <BookOpen size={32} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Amacımız Ne?</h2>
                        <p className="text-slate-400 font-medium leading-relaxed">
                            Bu envanter; ders çalışma, başarı, aile, gelecek ve kendilik algın hakkındaki sansürsüz ve gerçek düşüncelerini ortaya çıkarmak için tasarlanmıştır. "Ders çalışmayı severim" derken, aslında içinde fırtınalar koptuğunu hissediyorsan, bu test gerçek yüzleşmeni sağlayacak.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4 hover:border-cyan-500/30 transition-colors">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Bilimsel Temel (Tescilli)</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-sm text-slate-300 font-medium">
                                <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400 shrink-0 mt-0.5">
                                    <Brain size={14} />
                                </div>
                                <span>
                                    <strong className="text-pink-400 block mb-1">Cümle Tamamlama Teknikleri (Rotter & Sacks)</strong> 
                                    Kişiye yarım bırakılmış bir uyaran (cümle kökü) verildiğinde, zihin o boşluğu kendi iç dünyasındaki en baskın duyguyla otomatik olarak doldurur (Projektif Psikoloji).
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start sm:items-center gap-4 text-amber-500 max-w-3xl mx-auto">
                <div className="bg-amber-500/20 p-2 rounded-xl">
                  <ShieldAlert size={24} className="shrink-0" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest leading-relaxed">Altın Kural: Sansürleme!</p>
                  <p className="text-[11px] font-medium leading-relaxed opacity-90">
                      Cümleleri okuyunca aklına gelen <strong>İLK ŞEYİ</strong> yaz. Düşünme, düzeltme, kendini sansürleme. 
                      Mantıklı olup olmaması veya "ayıp" olması hiç önemli değil. Tamamen dürüst ol.
                  </p>
                </div>
            </div>

            <button
              onClick={() => setStageIdx(1)}
              className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-3xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-cyan-600/20 flex items-center justify-center gap-3"
            >
              Envanteri Başlat
              <ChevronRight size={24} />
            </button>
          </motion.div>
        )}

        {(stageIdx >= 1 && stageIdx <= 4) && (
          <motion.div
            key={currentStage.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400">
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
                    <div key={q.id} className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 md:p-8 space-y-4 hover:border-cyan-500/20 transition-all group">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest italic">Cümle {q.id}</span>
                            <p className="text-xl md:text-2xl font-black text-white leading-snug tracking-tight">{q.text}</p>
                        </div>
                        <input
                           type="text"
                           value={answers[q.id] || ''}
                           onChange={(e) => handleAnswer(q.id, e.target.value)}
                           className="w-full bg-black/20 border-b-2 border-white/10 text-white px-2 py-3 focus:outline-none focus:border-cyan-500 text-lg md:text-xl font-medium transition-colors"
                           placeholder="...aklına gelen ilk şeyi yaz"
                           autoComplete="off"
                        />
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center bg-slate-900/80 backdrop-blur-md p-6 rounded-[32px] border border-white/5 sticky bottom-4 z-50 shadow-2xl">
                <button
                    onClick={() => setStageIdx(prev => prev - 1)}
                    className="flex items-center gap-2 px-6 py-3 text-slate-400 hover:text-white font-black uppercase tracking-widest text-xs transition-colors"
                >
                    <ChevronLeft size={18} />
                    Geri
                </button>
                
                <button
                    onClick={() => setStageIdx(prev => prev + 1)}
                    disabled={!isStageComplete()}
                    className="px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-cyan-600/20 flex items-center gap-2"
                >
                    {stageIdx === 4 ? 'Bitir' : 'Sonraki'}
                    <ChevronRight size={18} />
                </button>
            </div>
          </motion.div>
        )}

        {stageIdx === 5 && (
          <motion.div
            key="finish"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8 text-center"
          >
            <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 mx-auto">
              <CheckCircle2 size={40} />
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Tüm Cümleleri Tamamladın</h2>
              <p className="text-slate-400 font-medium">
                Bu yansımalar profesyonel yapay zeka analizine gönderilecek ve içgörüler oluşturulacak. Kaydetmek için butona tıkla.
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
                            Veritabanına İşle
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
