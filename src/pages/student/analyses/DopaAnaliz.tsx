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
  Target,
  Eye,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';

const TEST_LINES = [
  "pqbglkdfhjbnmvcxzasdfghjklpoiuytrewqbnmdsa",
  "ghjkldsamnbvcxzpoiuytrewqlkjhgfdsamnbvcxz",
  "ytrewqbnmdsalkjhgfdsapoiuytrewqbnmvcxzdfg",
  "mnbvcxzasdfghjklpoiuytrewqpqbglkdfhjbnmds",
  "qwertyuiopasdfghjklzxcvbnmdbpqbglkdfhjjdsa"
];

const TARGET_LETTERS = ['b', 'd'];
const TIME_PER_LINE = 15; // 15 seconds per line for digital version

const SURVEY_QUESTIONS = [
  { id: 'q1', text: "Testi yaparken gözlerim çabuk yoruldu/karardı." },
  { id: 'q2', text: "Bir süre sonra harfler birbirine girmeye başladı (dans etti)." },
  { id: 'q3', text: "Testin sonlarına doğru sıkıldım ve 'bitse de gitsek' dedim." },
  { id: 'q4', text: "Dışarıdan gelen en ufak ses (kalem sesi vb.) dikkatimi dağıttı." },
  { id: 'q5', text: "Bazı harfleri gördüm ama elim gidene kadar yerini kaybettim." },
  { id: 'q6', text: "Hata yapmaktan korktuğum için çok yavaş ilerledim." },
  { id: 'q7', text: "Kendimi 'robot gibi' otomatiğe bağlamış hissettim." },
  { id: 'q8', text: "Sınavlarda da paragraf okurken tam olarak böyle (kopuk) hissediyorum." }
];

export default function DopaAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'intro' | 'test_instructions' | 'testing' | 'survey' | 'result'>('intro');
  const [loading, setLoading] = useState(false);

  // Test State
  const [currentLine, setCurrentLine] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_LINE);
  const [clickedIndices, setClickedIndices] = useState<Set<number>>(new Set());
  const [lineResults, setLineResults] = useState<Array<{ omissions: number, commissions: number, totalTargets: number }>>([]);

  // Survey State
  const [answers, setAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'testing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (step === 'testing' && timeLeft === 0) {
      handleLineComplete();
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const handleLineComplete = () => {
    const line = TEST_LINES[currentLine];
    let omissions = 0;
    let commissions = 0;
    let totalTargets = 0;

    for (let i = 0; i < line.length; i++) {
        const isTarget = TARGET_LETTERS.includes(line[i]);
        const isClicked = clickedIndices.has(i);

        if (isTarget) {
            totalTargets++;
            if (!isClicked) omissions++;
        } else {
            if (isClicked) commissions++;
        }
    }

    setLineResults(prev => [...prev, { omissions, commissions, totalTargets }]);
    setClickedIndices(new Set());

    if (currentLine < TEST_LINES.length - 1) {
      setCurrentLine(prev => prev + 1);
      setTimeLeft(TIME_PER_LINE);
    } else {
      setStep('survey');
    }
  };

  const handleLetterClick = (index: number) => {
    setClickedIndices(prev => {
        const newSet = new Set(prev);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        return newSet;
    });
  };

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const startTest = () => {
    setStep('testing');
    setCurrentLine(0);
    setTimeLeft(TIME_PER_LINE);
    setLineResults([]);
    setClickedIndices(new Set());
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (Object.keys(answers).length < SURVEY_QUESTIONS.length) {
        alert("Lütfen anketteki tüm soruları yanıtlayın.");
        return;
    }

    setLoading(true);
    try {
      let totalOmissions = 0;
      let totalCommissions = 0;
      let totalTargets = 0;
      lineResults.forEach((r: any) => {
          totalOmissions += r.omissions;
          totalCommissions += r.commissions;
          totalTargets += r.totalTargets;
      });

      const payload = {
        answers,
        performance: {
            lineResults,
            totalOmissions,
            totalCommissions,
            totalTargets
        }
      };

      const docId = await analysisService.saveResult(user.uid, 'DOPA', payload);
      navigate(`/panel/ogrenci/analizler/sonuc/${docId}`);
    } catch (error: any) {
      console.error("Kayıt hatası:", error);
      alert(error.message || "Analiz oluşturulurken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
            <Eye size={12} />
            DİKKAT VE ODAKLANMA
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">DOPA: Dikkat ve Odaklanma Performans Analizi</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl">
            Sürekli dikkat süreni, işlem hızını ve hata yapma eğilimini (dürtüsellik) ölçer. "Dikkatsizim" genellemesini somut verilere dökerek, sorunun odaklanma mı yoksa zihinsel yorgunluk mu olduğunu saptar.
          </p>
        </header>

        <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center gap-4 text-cyan-400">
            <ShieldCheck size={24} />
            <span className="font-bold text-lg">Kuramsal Dayanak</span>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed">
            Bourdon-Vos Testi ve Brickenkamp’ın d2 Dikkat Testi prensiplerine dayanır. Belirli bir uyaranı, karmaşık bir fon içinden seçip ayıklama becerisini ölçer.
          </p>
          <div className="flex items-start gap-4 p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl">
            <Info className="text-cyan-500 shrink-0 mt-0.5" size={20} />
            <p className="text-xs text-slate-400 font-medium">
              <strong>Nasıl Uygulanır?</strong> Ekranda rastgele harflerden oluşan satırlar göreceksin. Senden istenen <strong>'b'</strong> ve <strong>'d'</strong> harflerini bulup tıklaman. Her satır için 15 saniyen olacak. Hızlı ama dikkatli ol.
            </p>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={() => setStep('test_instructions')}
            className="px-12 py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-cyan-600/20 flex items-center gap-3"
          >
            Kuralları Oku ve Başla
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'test_instructions') {
    return (
        <div className="max-w-2xl mx-auto mt-20 bg-slate-900 border border-white/10 rounded-[40px] p-10 text-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 mx-auto">
                <Target size={40} />
            </div>
            <div>
                <h2 className="text-3xl font-black text-white mb-4">Görevin Başlıyor</h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                    Test başladığında ekranda harfler göreceksin. Sadece <strong className="text-cyan-400 font-black text-xl px-2">b</strong> ve <strong className="text-cyan-400 font-black text-xl px-2">d</strong> harflerine tıklayarak işaretle. 
                    <br /><br />
                    Diğer harflere dokunma. Her satır için 15 saniyen var. Hızlı ve hatasız ol!
                </p>
            </div>
            <button
                onClick={startTest}
                className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-2xl font-black text-lg transition-colors"
            >
                Anladım, Testi Başlat
            </button>
        </div>
    );
  }

  if (step === 'testing') {
    const currentLineData = TEST_LINES[currentLine];

    return (
        <div className="max-w-4xl mx-auto pt-20 px-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-8">
                <div className="text-slate-400 font-bold uppercase tracking-widest text-sm">
                    Satır {currentLine + 1} / {TEST_LINES.length}
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-full border border-white/10 text-cyan-400 font-black text-xl font-mono">
                    <Clock size={20} />
                    00:{timeLeft.toString().padStart(2, '0')}
                </div>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-[40px] p-8 md:p-16 text-center select-none shadow-2xl">
                <div className="flex flex-wrap justify-center gap-2 md:gap-4">
                    {currentLineData.split('').map((char, idx) => {
                        const isClicked = clickedIndices.has(idx);
                        return (
                            <button
                                key={idx}
                                onClick={() => handleLetterClick(idx)}
                                className={`w-10 h-10 md:w-14 md:h-14 flex items-center justify-center text-2xl md:text-3xl font-mono font-bold rounded-xl transition-all duration-100 ${
                                    isClicked 
                                    ? 'bg-cyan-500 text-slate-900 scale-110 shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                            >
                                {char}
                            </button>
                        );
                    })}
                </div>
            </div>
            
            <div className="text-center mt-8 text-slate-500 text-sm font-medium">
                Sadece <strong>'b'</strong> ve <strong>'d'</strong> harflerini seç. Süre dolduğunda otomatik geçecektir.
            </div>
        </div>
    );
  }

  if (step === 'survey') {
    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20 pt-16 animate-in fade-in duration-500 px-4">
            <div className="text-center space-y-4 mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-black uppercase tracking-widest text-sm">
                    Performans Testi Bitti
                </div>
                <h2 className="text-3xl font-black text-white">Öz-Değerlendirme Anketi</h2>
                <p className="text-slate-400">Lütfen aşağıdaki ifadelere, testi çözerken hissettiklerine göre 1 (Hiç) ile 5 (Tamamen) arası puan ver.</p>
            </div>

            <div className="space-y-6">
                {SURVEY_QUESTIONS.map((q, idx) => (
                    <div key={q.id} className="bg-slate-900 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
                         <h3 className="text-lg text-white font-medium leading-relaxed">
                            <span className="text-cyan-500 font-black mr-2">{idx + 1}.</span>
                            {q.text}
                        </h3>
                        <div className="flexjustify-between items-center max-w-md mx-auto">
                            <div className="flex justify-between w-full relative">
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 rounded-full z-0"></div>
                                {[1, 2, 3, 4, 5].map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => handleAnswer(q.id, val)}
                                        className={`relative z-10 w-10 h-10 md:w-12 md:h-12 rounded-full font-black text-sm md:text-lg transition-all duration-300 ${
                                        answers[q.id] === val 
                                            ? 'bg-cyan-500 text-slate-900 scale-110 shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                                            : 'bg-slate-800 text-slate-400 border border-white/10 hover:bg-slate-700'
                                        }`}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center pt-8 border-t border-white/5">
                <button
                    onClick={handleSave}
                    disabled={Object.keys(answers).length !== SURVEY_QUESTIONS.length || loading}
                    className="px-12 py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-cyan-600/20 flex items-center gap-3 disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={24} />
                            Analiz Ediliyor...
                        </>
                    ) : (
                        <>
                            Verileri Gönder ve Raporu Al
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
