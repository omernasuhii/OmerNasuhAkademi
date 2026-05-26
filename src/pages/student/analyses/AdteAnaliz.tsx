import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, ChevronRight, ChevronLeft, Save, AlertCircle, CheckCircle2, Clock, Zap, Activity, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';

const questions = [
  // BÖLÜM A: DİKKAT EKSİKLİĞİ
  { id: 1, section: 'A', text: 'Ders çalışırken veya sınavlarda, soruyu tam okumadan işlem yapıp basit (dikkatsizlik) hataları yaparım.' },
  { id: 2, section: 'A', text: 'Uzun paragrafları okurken veya dersi dinlerken dikkatimi sürdürmekte çok zorlanırım, zihnim kopar.' },
  { id: 3, section: 'A', text: 'Biri benimle doğrudan konuşurken bile aklım başka yerdeymiş gibi görünürüm (Dinlemiyor gibi).' },
  { id: 4, section: 'A', text: 'Ödevleri veya görevleri tamamlamadan yarım bırakıp başka bir işe geçerim.' },
  { id: 5, section: 'A', text: 'Çalışma masamı, çantamı veya zamanımı organize etmekte (planlamakta) büyük güçlük çekerim.' },
  { id: 6, section: 'A', text: 'Zihinsel çaba gerektiren (uzun testler, konu okuma) işlerden kaçınırım veya ertelerim.' },
  { id: 7, section: 'A', text: 'Sık sık eşyalarımı (kalem, silgi, kitap, cüzdan) kaybederim veya okulda unuturum.' },
  { id: 8, section: 'A', text: 'Dışarıdan gelen en ufak bir ses veya hareket (kapı sesi, sinek vızıldaması) dikkatimi hemen dağıtır.' },
  { id: 9, section: 'A', text: 'Günlük rutin işlerimi (ödev teslimi, randevu, ilaç alma) sık sık unuturum.' },
  { id: 10, section: 'A', text: 'Bir konuyu anlasam bile, detaylara inildiğinde sıkılır ve hata yaparım.' },
  // BÖLÜM B: HİPERAKTİVİTE VE DÜRTÜSELLİK
  { id: 11, section: 'B', text: 'Ders çalışırken veya sınıfta otururken ellerim ayaklarım kıpır kıpırdır, yerimde duramam.' },
  { id: 12, section: 'B', text: 'Sınıfta veya oturmam gereken durumlarda (yemek, sinema) sık sık kalkar dolaşırım.' },
  { id: 13, section: 'B', text: 'İçimde sürekli bir "motor çalışıyormuş" gibi huzursuzluk ve hareket etme isteği hissederim.' },
  { id: 14, section: 'B', text: 'Sessizce durup kitap okumak veya sakince oyun oynamak benim için zordur.' },
  { id: 15, section: 'B', text: 'Çok konuşurum, karşımdakinin sözünü bitirmesini bekleyemem.' },
  { id: 16, section: 'B', text: 'Sorulan soru daha bitmeden cevabı yapıştırırım (Düşünmeden atılırım).' },
  { id: 17, section: 'B', text: 'Sıra beklemek (kantin sırası, oyun sırası) benim için işkence gibidir.' },
  { id: 18, section: 'B', text: 'Başkalarının sözünü keserim veya konuşmalarına/oyunlarına izinsiz dalarım.' },
  { id: 19, section: 'B', text: 'Sonunu düşünmeden ani kararlar alırım (Ani harcama, ani ders bırakma vb.).' },
  { id: 20, section: 'B', text: 'Çabuk öfkelenir, çabuk parlarım (Duygu kontrolü zayıftır).' }
];

const sessions = [
  { id: 'intro', title: 'Hoş Geldiniz', icon: Brain },
  { id: 'partA', title: 'Bölüm A: Dikkat Yönetimi', icon: Zap },
  { id: 'partB', title: 'Bölüm B: Hareket ve Dürtü', icon: Activity },
  { id: 'finish', title: 'Sonuçları Kaydet', icon: CheckCircle2 }
];

export default function AdteAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessionIdx, setSessionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const calculateScores = () => {
    let scoreA = 0;
    let scoreB = 0;
    questions.forEach(q => {
      const val = answers[q.id] || 0;
      if (q.section === 'A') scoreA += val;
      else scoreB += val;
    });
    return { scoreA, scoreB };
  };

  const handleSave = async () => {
    if (!user) return;
    const { scoreA, scoreB } = calculateScores();
    
    setLoading(true);
    try {
      await analysisService.saveResult(user.uid, 'ADTE-20', {
        answers,
        scores: {
            partA: scoreA,
            partB: scoreB,
            total: scoreA + scoreB
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

  const currentSession = sessions[sessionIdx];
  const partAQuestions = questions.filter(q => q.section === 'A');
  const partBQuestions = questions.filter(q => q.section === 'B');

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white italic tracking-tighter">TARAMA TAMAMLANDI!</h2>
          <p className="text-slate-400 font-medium">Odak ve dikkat profilin laboratuvar kayıtlarına eklendi.</p>
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
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest">
            <Clock size={12} />
            ADTE-20 ENVANTERİ
          </div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">AKADEMİK ODAK VE DİKKAT YÖNETİMİ</h1>
        </div>
      </header>

      <div className="flex gap-2">
        {sessions.map((_, idx) => (
          <div 
            key={idx} 
            className={`flex-1 h-1.5 rounded-full transition-all duration-700 ${
              idx <= sessionIdx ? 'bg-purple-500' : 'bg-white/5'
            }`} 
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {sessionIdx === 0 && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-3xl flex items-center justify-center text-purple-400">
                        <Clock size={32} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Dikkatini Keşfet</h2>
                        <p className="text-slate-400 font-medium leading-relaxed italic">
                            "Dersi dinleyemiyorum, dalıp gidiyorum" veya "Masada oturduğumda sürekli kıpırdıyorum" mu diyorsun? Bu envanter senin odaklanma profilini analiz etmek için tasarlandı.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-white/5 order border-white/10 rounded-3xl space-y-4">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Önemli Talimatlar</h4>
                        <ul className="space-y-3">
                            {[
                                'Soruları son 6 ayı düşünerek cevapla.',
                                'Her iki ortamı da (okul ve ev) hesaba kat.',
                                'Dürüstlük, en doğru analizi sağlar.',
                                'Bu bir klinik tanı testi değildir.'
                            ].map((text, i) => (
                                <li key={i} className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-500">
                        <ShieldAlert size={20} className="shrink-0" />
                        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                            ⚠️ DİKKAT: BU TEST SADECE ÖN TARAMA AMAÇLIDIR.
                        </p>
                    </div>
                </div>
            </div>
            <button
              onClick={() => setSessionIdx(1)}
              className="w-full py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-3xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-purple-600/20 flex items-center justify-center gap-3"
            >
              Taramayı Başlat
              <ChevronRight size={24} />
            </button>
          </motion.div>
        )}

        {(sessionIdx === 1 || sessionIdx === 2) && (
          <motion.div
            key={currentSession.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400">
                    <currentSession.icon size={24} />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-white uppercase italic">{currentSession.title}</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {sessionIdx === 1 ? 'Zihinsel Odaklanma ve Dalgınlık' : 'Fren Mekanizması ve Hareketlilik'}
                    </p>
                 </div>
            </div>

            <div className="grid gap-4">
                {(sessionIdx === 1 ? partAQuestions : partBQuestions).map((q) => (
                    <div key={q.id} className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 hover:border-white/10 transition-colors">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest italic">Soru {q.id}</span>
                            <p className="text-lg font-bold text-white leading-snug">{q.text}</p>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                { label: 'Hiçbir Zaman', val: 0 },
                                { label: 'Bazen', val: 1 },
                                { label: 'Sık Sık', val: 2 },
                                { label: 'Çok Sık', val: 3 }
                            ].map((opt) => (
                                <button
                                    key={opt.val}
                                    onClick={() => handleAnswer(q.id, opt.val)}
                                    className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        answers[q.id] === opt.val
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400/50'
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

            <div className="flex justify-between items-center bg-slate-900/80 backdrop-blur-md p-6 rounded-[32px] border border-white/5 sticky bottom-4 z-50">
                <button
                    onClick={() => setSessionIdx(prev => prev - 1)}
                    className="flex items-center gap-2 px-6 py-3 text-slate-400 hover:text-white font-black uppercase tracking-widest text-xs"
                >
                    <ChevronLeft size={18} />
                    Geri
                </button>
                
                <button
                    onClick={() => setSessionIdx(prev => prev + 1)}
                    disabled={(sessionIdx === 1 ? partAQuestions : partBQuestions).some(q => answers[q.id] === undefined)}
                    className="px-10 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:scale-105 disabled:opacity-50 shadow-xl shadow-purple-600/20 flex items-center gap-2"
                >
                    {sessionIdx === 2 ? 'Değerlendirmeye Geç' : 'Sonraki Bölüm'}
                    <ChevronRight size={18} />
                </button>
            </div>
          </motion.div>
        )}

        {sessionIdx === 3 && (
          <motion.div
            key="finish"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8 text-center"
          >
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 mx-auto">
              <CheckCircle2 size={40} />
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Laboratuvar Kaydı Hazır</h2>
              <p className="text-slate-400 font-medium">
                Tüm soruları yanıtladın. Şimdi bu verileri laboratuvar sistemine kaydedip detaylı bir döküm oluşturacağız.
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
