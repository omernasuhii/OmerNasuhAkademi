import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, ChevronRight, ChevronLeft, Save, CheckCircle2, Activity, Heart, ShieldAlert, BookOpen } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';

const questions = [
  // BOYUT A: BİLİŞSEL BELİRTİLER
  { id: 1, section: 'bilişsel', text: 'Sınav sırasında bildiğim konuları bile unutacağımı düşünüyorum (Zihinsel Blokaj).' },
  { id: 2, section: 'bilişsel', text: '"Kazanamazsam aileme/çevreme ne derim?" düşüncesi aklımdan çıkmıyor.' },
  { id: 3, section: 'bilişsel', text: 'Sınav kitapçığını gördüğümde "Hiçbir şey bilmiyorum" hissine kapılıyorum.' },
  { id: 4, section: 'bilişsel', text: 'Başkalarının benden daha hızlı çözdüğünü görünce paniğe kapılıyorum.' },
  { id: 5, section: 'bilişsel', text: 'Sınavdan sonra sürekli yaptığım hataları düşünüp kendime kızıyorum.' },
  { id: 6, section: 'bilişsel', text: 'Geleceğimle ilgili sürekli en kötü senaryoları (felaketleri) hayal ediyorum.' },
  { id: 7, section: 'bilişsel', text: 'Okuduğum soruyu anlamayıp 3-4 kez tekrar okumak zorunda kalıyorum (Odak kaybı).' },
  { id: 8, section: 'bilişsel', text: 'Sınav yaklaştıkça "Zaman yetmeyecek" korkusuyla uykularım kaçıyor.' },
  // BOYUT B: FİZİKSEL BELİRTİLER
  { id: 9, section: 'fiziksel', text: 'Sınavdan önce veya sınav anında kalbim yerinden çıkacakmış gibi çarpıyor.' },
  { id: 10, section: 'fiziksel', text: 'Sınav sırasında ellerim titriyor, terliyor veya buz kesiyor.' },
  { id: 11, section: 'fiziksel', text: 'Sınav sabahları midem bulanıyor, karın ağrısı veya kramp giriyor.' },
  { id: 12, section: 'fiziksel', text: 'Ders çalışırken veya sınavda nefes almakta zorlanıyorum (Göğüste baskı).' },
  { id: 13, section: 'fiziksel', text: 'Sık sık tuvalete gitme ihtiyacı hissediyorum.' },
  { id: 14, section: 'fiziksel', text: 'Kaslarımın (boyun, omuz, çene) kasıldığını ve ağrıdığını hissediyorum.' },
  { id: 15, section: 'fiziksel', text: 'Sınav anında ağzım kuruyor, yutkunmakta zorlanıyorum.' },
  { id: 16, section: 'fiziksel', text: 'Baş dönmesi veya göz kararması yaşıyorum.' },
  // BOYUT C: DAVRANIŞSAL BELİRTİLER
  { id: 17, section: 'davranışsal', text: 'Deneme sınavlarına girmekten kaçıyorum veya bahaneler buluyorum (Hastalık vb.).' },
  { id: 18, section: 'davranışsal', text: 'Ders çalışmayı sürekli erteliyorum çünkü masaya oturmak beni geriyor.' },
  { id: 19, section: 'davranışsal', text: 'Sınavda zorlandığım bir soruyla karşılaşırsam hemen moralim bozulup testi bırakıyorum.' },
  { id: 20, section: 'davranışsal', text: 'Stresli olduğumda tırnak yeme, kalem ısırma veya ayak sallama gibi tiklerim artıyor.' },
  { id: 21, section: 'davranışsal', text: 'Sınavdan hemen sonra kitapçığı kontrol etmeye korkuyorum, atıp kaçıyorum.' },
  { id: 22, section: 'davranışsal', text: 'Çok hızlı çözüp (dikkatsizce) sınavdan bir an önce çıkmak istiyorum.' },
  { id: 23, section: 'davranışsal', text: 'Çalışırken sürekli mola veriyor, dikkati dağıtacak başka işlerle (temizlik vb.) uğraşıyorum.' },
  { id: 24, section: 'davranışsal', text: 'Ders çalışırken aşırı yemek yiyorum veya iştahım tamamen kesiliyor.' }
];

const stages = [
  { id: 'intro', title: 'Hoş Geldiniz', icon: BookOpen },
  { id: 'cog', title: 'Bilişsel Belirtiler', icon: Brain, description: 'Zihinsel Senaryolar' },
  { id: 'phy', title: 'Fiziksel Belirtiler', icon: Heart, description: 'Beden Tepkileri' },
  { id: 'beh', title: 'Davranışsal Belirtiler', icon: Activity, description: 'Kaçınma ve Alışkanlıklar' },
  { id: 'finish', title: 'Sonuçları Kaydet', icon: CheckCircle2 }
];

export default function ApksAnaliz() {
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
    let cognitive = 0;
    let physical = 0;
    let behavioral = 0;
    questions.forEach(q => {
      const val = answers[q.id] || 0;
      if (q.section === 'bilişsel') cognitive += val;
      else if (q.section === 'fiziksel') physical += val;
      else if (q.section === 'davranışsal') behavioral += val;
    });
    return { cognitive, physical, behavioral, total: cognitive + physical + behavioral };
  };

  const handleSave = async () => {
    if (!user) return;
    const scores = calculateScores();
    
    setLoading(true);
    try {
      await analysisService.saveResult(user.uid, 'APK-S', {
        answers,
        scores,
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

  const currentStage = stages[stageIdx];
  const screenQuestions = questions.filter(q => {
      if (stageIdx === 1) return q.section === 'bilişsel';
      if (stageIdx === 2) return q.section === 'fiziksel';
      if (stageIdx === 3) return q.section === 'davranışsal';
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
          <p className="text-slate-400 font-medium">Sınav kaygısı ve stres seviyen başarıyla laboratuvar kayıtlarına eklendi.</p>
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
            APK-S ENVANTERİ
          </div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">AKADEMİK PERFORMANS KAYGISI VE SINAV STRESİ</h1>
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
            className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 space-y-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-3xl flex items-center justify-center text-blue-400">
                        <BookOpen size={32} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Amacımız Ne?</h2>
                        <p className="text-slate-400 font-medium leading-relaxed">
                            Bu envanter; yaşadığın kaygının şiddetini ve türünü belirlemek,
                            kaygının sana rehberlik eden "dürtücü güç" 
                            (optimum düzey) olmaktan çıkıp "ketleyici güç" (blokaj) haline 
                            geldiği noktaları tespit etmek amacı ile geliştirilmiştir.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-6 bg-white/5 order border-white/10 rounded-3xl space-y-4">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Bilimsel Dayanak</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-sm text-slate-300 font-medium">
                                <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400 shrink-0 mt-0.5">
                                    <Brain size={14} />
                                </div>
                                <span>
                                    <strong className="text-pink-400 block mb-1">Bilişsel Davranışçı Terapi (BDT)</strong> 
                                    Düşünce, duygu ve bedensel tepkilerin döngüsü.
                                </span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-300 font-medium">
                                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                                    <Activity size={14} />
                                </div>
                                <span>
                                    <strong className="text-emerald-400 block mb-1">Yerkes-Dodson Yasası</strong>
                                    Belirli bir seviyeye kadar kaygının performansı artırdığı, aşırısının ise düşürdüğü (Ters U Eğrisi) ilkesi.
                                </span>
                            </li>
                        </ul>
                    </div>
                    
                </div>
            </div>
            
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-500 max-w-2xl mx-auto">
                <ShieldAlert size={20} className="shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                    DİKKAT: BU SORULAR HEM SINAV ANINI HEM DE DERS ÇALIŞMA ANLARINI KAPSAMAKTADIR. LÜTFEN BUNA GÖRE YANITLAYIN.
                </p>
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
              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Test Tamamlandı</h2>
              <p className="text-slate-400 font-medium">
                Tüm soruları yanıtladın. Şimdi bu verileri analiz edip sana özel bir rapor hazırlayacağız.
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
