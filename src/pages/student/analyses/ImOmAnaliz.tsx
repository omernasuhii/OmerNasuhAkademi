import React, { useState } from 'react';
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
  Zap,
  Flame,
  Terminal,
  Target
} from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';

const QUESTIONS = [
  { id: 'q1', type: 'mukemmeliyetcilik', text: "Mükemmel olmayacaksa hiç başlamamayı tercih ederim." },
  { id: 'q2', type: 'kaygili', text: "Yapılacak işin büyüklüğü gözümü korkutuyor, nereden başlayacağımı bilemiyorum." },
  { id: 'q3', type: 'hayalperest', text: "\"Daha çok zamanım var, son gece hallederim\" diye kendimi kandırırım." },
  { id: 'q4', type: 'isyankar', text: "Biri bana \"Ders çalış\" dediğinde inadına çalışasım gelmiyor." },
  { id: 'q5', type: 'hazci', text: "Masaya oturduğumda canım sıkılıyor ve hemen başka şeylerle ilgileniyorum." },
  { id: 'q6', type: 'bariyer', text: "Sabahları yataktan kalkmak ve güne başlamak bana çok zor geliyor." },
  { id: 'q7', type: 'bariyer', text: "Çalışmaya başladığımda enerjimin hemen tükendiğini hissediyorum." },
  { id: 'q8', type: 'bariyer', text: "Hedefim beni heyecanlandırmıyor, sadece \"mecbur olduğum için\" çalışıyorum." },
  { id: 'q9', type: 'bariyer', text: "Başarısız olmaktan o kadar korkuyorum ki denemek bile istemiyorum." },
  { id: 'q10', type: 'bariyer', text: "Kendi kendime söz veriyorum ama sözümü tutamıyorum (İrade Zayıflığı)." }
];

export default function ImOmAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'intro' | 'survey' | 'contract' | 'result'>('intro');
  const [loading, setLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [contractSigned, setContractSigned] = useState(false);

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
      
      const payload = {
        answers,
        totalScore
      };

      const result = await analysisService.saveResult(user.uid, 'IM-OM', payload);
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

  if (step === 'result' && aiInsight) {
    const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
    let category = '';
    let categoryColor = '';
    if (totalScore >= 40) { category = 'Motor Bozuk (Atalet Hali)'; categoryColor = 'text-rose-400'; }
    else if (totalScore >= 25) { category = 'Marş Basmıyor (İteklemek Lazım)'; categoryColor = 'text-orange-400'; }
    else { category = 'Motor Çalışıyor'; categoryColor = 'text-emerald-400'; }

    return (
      <div className="max-w-5xl mx-auto space-y-12 pb-20 pt-8 animate-in fade-in duration-700 px-4">
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-black uppercase tracking-widest text-sm">
            <CheckCircle2 size={16} />
            İM-OM Modülü Tamamlandı
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">Oto-Motivasyon Raporun</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
            Sonuçların kaydedildi. AI Koçu, erteleme türünü analiz etti ve sana özel eylem stratejisini oluşturdu.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
             <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 space-y-6">
                <div className="flex items-center gap-3">
                   <Target size={24} className="text-rose-400" />
                   <h3 className="text-lg font-bold text-white">Analiz Skoru</h3>
                </div>
                <div className="space-y-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center space-y-2">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Toplam Puan</div>
                        <div className={`text-4xl font-black ${categoryColor}`}>{totalScore} <span className="text-sm text-slate-500">/ 50</span></div>
                        <div className="text-sm font-medium text-slate-300">{category}</div>
                    </div>
                </div>
             </div>
          </div>

          <div className="md:col-span-2">
             <div className="bg-gradient-to-br from-rose-500/5 to-orange-500/5 border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl">
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
                         <Brain size={24} />
                      </div>
                      <div>
                         <h3 className="text-xl font-bold text-white">AI İçsel Motor Analizi</h3>
                         <p className="text-xs text-slate-400 font-medium tracking-wide">Kişiye Özel Hazırlanmıştır</p>
                      </div>
                   </div>
                </div>
                
                <div className="prose prose-invert prose-rose max-w-none prose-headings:font-black prose-p:leading-relaxed prose-p:text-slate-300">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest">
            <Zap size={12} />
            EYLEM VE İRADE
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">İM-OM: İçsel Motor ve Oto-Motivasyon Modülü</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl">
            Sürekli erteliyor musun? İlham perisini mi bekliyorsun? Bu modül, erteleme hastalığının türünü (mükemmeliyetçi, kaygılı, hazcı) teşhis edip seni harekete geçirecek taktikleri sunar.
          </p>
        </header>

        <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center gap-4 text-rose-400">
            <ShieldCheck size={24} />
            <span className="font-bold text-lg">Kuramsal Dayanak</span>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed">
            <strong>Mel Robbins (5 Saniye Kuralı)</strong>, <strong>Bj Fogg (Davranış Modeli)</strong> ve <strong>Pomodoro Tekniği'ne</strong> dayanır. Hedefi, çalışma isteğini dış faktörlere (korku, baskı) değil, içsel hedeflerine bağlamaktır.
          </p>
          <div className="flex items-start gap-4 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
            <Info className="text-rose-500 shrink-0 mt-0.5" size={20} />
            <p className="text-xs text-slate-400 font-medium">
              <strong>Nasıl Uygulanır?</strong> 10 soruluk bir anketi dolduracaksın. Dürüst ol. Eğer motorun sağlamsa çalışırsın, bozuksa sana özel eylem reçeteni oluşturacağız.
            </p>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={() => setStep('survey')}
            className="px-12 py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-rose-600/20 flex items-center gap-3"
          >
            Modüle Başla
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'survey') {
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
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    {Object.keys(answers).length} / {QUESTIONS.length}
                </div>
            </div>

            <div className="text-center space-y-4 mb-8">
                <h2 className="text-3xl font-black text-white">Neden Erteliyorsun? Düşmanını Tanı</h2>
                <p className="text-slate-400">Her madde için 1 (Hiçbir Zaman) ile 5 (Her Zaman) arasında puan ver.</p>
            </div>

            <div className="space-y-6">
                {QUESTIONS.map((q, idx) => (
                    <div key={q.id} className="bg-slate-900 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
                         <h3 className="text-lg text-white font-medium leading-relaxed">
                            <span className="text-rose-500 font-black mr-2">{idx + 1}.</span>
                            {q.text}
                        </h3>
                        <div className="flex justify-between items-center max-w-md mx-auto">
                            <div className="flex justify-between w-full relative">
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 rounded-full z-0"></div>
                                {[1, 2, 3, 4, 5].map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => handleAnswer(q.id, val)}
                                        className={`relative z-10 w-10 h-10 md:w-12 md:h-12 rounded-full font-black text-sm md:text-lg transition-all duration-300 ${
                                        answers[q.id] === val 
                                            ? 'bg-rose-500 text-slate-900 scale-110 shadow-[0_0_15px_rgba(244,63,94,0.4)]' 
                                            : 'bg-slate-800 text-slate-400 border border-white/10 hover:bg-slate-700'
                                        }`}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-md mx-auto relative px-2">
                            <span>Hiç</span>
                            <span>Her Zaman</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center pt-8 border-t border-white/5">
                <button
                    onClick={() => setStep('contract')}
                    disabled={Object.keys(answers).length !== QUESTIONS.length}
                    className="px-12 py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-rose-600/20 flex items-center gap-3 disabled:opacity-50"
                >
                    Analizi Tamamla ve Sözleşmeye Geç
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
  }

  if (step === 'contract') {
      return (
          <div className="max-w-2xl mx-auto space-y-8 pb-20 pt-16 animate-in zoom-in-95 duration-500 px-4">
              <div className="bg-slate-900 border border-white/10 rounded-[40px] p-8 md:p-12 space-y-8 text-center shadow-2xl">
                  <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-400 mx-auto">
                      <Terminal size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-white">Motivasyon Kontratı</h2>
                  
                  <div className="bg-white/5 p-6 rounded-3xl text-left border border-white/5 prose prose-invert prose-p:text-slate-300 font-medium">
                      <p>
                        "Biliyorum ki motivasyon bir 'his' değil, bir 'eylem' sonucudur. İlham perisi gelmeyecek. Canımın istemesi önemli değil. Ben hedeflerime, anlık duygularımdan daha fazla saygı duyuyorum. Bugün, şimdi, 5 saniye içinde başlıyorum."
                      </p>
                  </div>

                  <label className="flex items-center justify-center gap-4 cursor-pointer group">
                      <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                          contractSigned ? 'bg-rose-500 border-rose-500 text-slate-900' : 'bg-slate-800 border-slate-600 text-transparent group-hover:border-rose-500'
                      }`}>
                          <CheckCircle2 size={20} className={contractSigned ? 'opacity-100' : 'opacity-0'} />
                      </div>
                      <span className="font-bold text-slate-300 group-hover:text-white transition-colors">Okudum ve kendime söz veriyorum.</span>
                      <input type="checkbox" className="hidden" checked={contractSigned} onChange={(e) => setContractSigned(e.target.checked)} />
                  </label>

                  <button
                    onClick={handleSave}
                    disabled={!contractSigned || loading}
                    className="w-full py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-rose-600/20 flex justify-center items-center gap-3 disabled:opacity-50"
                  >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={24} />
                            Rapor Hazırlanıyor...
                        </>
                    ) : (
                        <>
                            İmzalıyorum ve Raporu Alıyorum
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
