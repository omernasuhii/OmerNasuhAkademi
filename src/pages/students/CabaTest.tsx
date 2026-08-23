import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, 
  ChevronRight, 
  ChevronLeft, 
  Brain, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Loader2, 
  Download, 
  AlertTriangle,
  Info,
  Award,
  Flame,
  Heart
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import Markdown from 'react-markdown';

const LIKERT_QUESTIONS = [
  // Zaman Yönetimi ve Planlama
  { id: 1, category: 'Zaman Yönetimi ve Planlama', text: "Haftalık hedeflerimi net bir şekilde belirler, günümü planlar ve bu plana düzenli olarak sadık kalırım." },
  { id: 2, category: 'Zaman Yönetimi ve Planlama', text: "Ders çalışırken ne kadar süre çalışacağımı ve ne kadar mola vereceğimi önceden belirler ve buna uyarım." },
  // Akademik Öz-Disiplin ve Sorumluluk
  { id: 3, category: 'Akademik Öz-Disiplin ve Sorumluluk', text: "Masaya oturduğumda dikkatimi dağıtacak tüm dış etkenleri (telefon, sosyal medya vb.) kendimden uzaklaştırırım." },
  { id: 4, category: 'Akademik Öz-Disiplin ve Sorumluluk', text: "Sorumluluklarımı (ödevler, konu tekrarları, soru çözümleri) bir başkasının uyarısına veya takibine gerek kalmadan kendiliğimden yaparım." },
  // Duygusal Dayanıklılık ve Kaygı
  { id: 5, category: 'Duygusal Dayanıklılık ve Kaygı', text: "Sınav anında veya ders çalışırken yaşadığım stresi ve 'yetişmeyecek' kaygısını soğukkanlılıkla kontrol edebilirim." },
  { id: 6, category: 'Duygusal Dayanıklılık ve Kaygı', text: "Deneme sınavlarında beklediğimden düşük netler aldığımda demoralize olmak yerine hatalarımdan ders çıkarıp hemen toparlanırım." },
  { id: 7, category: 'Duygusal Dayanıklılık ve Kaygı', text: "Zorlandığım veya hata yaptığım konuları moral bozucu bir başarısızlık değil, geliştirilmesi gereken birer fırsat olarak görürüm." },
  // Motivasyon ve Farkındalık
  { id: 8, category: 'Motivasyon ve Farkındalık', text: "Ders çalışmamı ve başarılı olmamı sağlayan şey ailemin veya öğretmenlerimin baskısı değil, kendi gelecek hayallerim ve hedeflerimdir." },
  { id: 9, category: 'Motivasyon ve Farkındalık', text: "Hangi konularda eksik olduğumu, güçlü ve zayıf akademik yönlerimi dürüstçe analiz edebilir ve buna göre önlem alabilirim." },
  { id: 10, category: 'Motivasyon ve Farkındalık', text: "Bir konuyu sadece sınavda çıkacağı için yüzeysel olarak ezberlemek yerine, mantığını ve arka planındaki mantıksal yapıyı kavramaya çalışırım." },
  // Sınır Yönetimi ve Çevre
  { id: 11, category: 'Sınır Yönetimi ve Çevre', text: "Ders çalışmam gereken saatlerde arkadaşlarımın çağrılarına, sosyal medya davetlerine veya eğlence tekliflerine kararlılıkla 'Hayır' diyebilirim." },
  { id: 12, category: 'Sınır Yönetimi ve Çevre', text: "Çalışma ortamımı (odamı, masamı, ışığımı) dikkatimi maksimum düzeyde tutacak şekilde düzenli ve verimli tutarım." },
  { id: 13, category: 'Sınır Yönetimi ve Çevre', text: "Sınav sürecindeki başarımı ve kendime olan inancımı çevremin, arkadaşlarımın veya sosyal çevrenin yorumlarına göre şekillendirmem." },
  // Gelişim Zihniyeti
  { id: 14, category: 'Gelişim Zihniyeti', text: "Zekanın ve akademik başarının doğuştan gelen sabit yetenekler değil, planlı ve disiplinli bir çalışmayla geliştirilebilir olduğuna inanırım." },
  { id: 15, category: 'Gelişim Zihniyeti', text: "Çok zorlandığım, anlamakta güçlük çektiğim karmaşık konularla karşılaştığımda pes etmek yerine farklı yöntemler deneyerek üstüne giderim." }
];

const OPEN_ENDED_QUESTIONS = [
  { id: 1, key: 'gelecek_vizyonu', label: 'Gelecek Vizyonu', text: "Hedeflediğin üniversiteye veya liseye yerleştiğin, o büyük başarıyı kazandığın sabahı hayal et. Uyandığında hissedeceğin ilk duygu nedir ve bu başarı hayatında neleri değiştirecek?" },
  { id: 2, key: 'kok_inanc', label: 'Kök İnanç', text: "Akademik potansiyeline tamamen ulaşmanın önünde duran en büyük içsel/zihinsel engelin ne olduğunu düşünüyorsun? (Örn: 'Başarısızlık korkusu', 'Mükemmeliyetçilik', 'Sürekli onaylanma ihtiyacı' vb.)" },
  { id: 3, key: 'zaman_hirsizlari', label: 'Zaman Hırsızları', text: "Günlük yaşamında ders çalışmanı engelleyen, odağını bölen ve vaktini en çok 'çalan' dış etkenler veya alışkanlıklar nelerdir? Bunlara karşı koyabiliyor musun?" },
  { id: 4, key: 'hata_analizi', label: 'Hata Analizi', text: "Kötü geçen bir deneme sınavından sonra gösterdiğin ilk tepki ve izlediğin yöntem ne olur? Yanlış sorularının analizini dürüstçe yapıyor musun?" },
  { id: 5, key: 'yardim_isteme', label: 'Yardım İsteme', text: "Bir konuyu ya da soruyu anlamadığında, başkalarından (öğretmen, arkadaş, koç) yardım istemekten çekinir misin? Sence yardım istemek bir zayıflık mıdır yoksa stratejik bir adım mı?" },
  { id: 6, key: 'aile_etkisi', label: 'Aile Etkisi', text: "Ailenin senin akademik hedeflerine ve ders çalışma sürecine yaklaşımı seni nasıl etkiliyor? Sorumluluklarını yerine getirirken üstünde bir güven mi yoksa bir baskı mı hissediyorsun?" },
  { id: 7, key: 'oz_sefkat', label: 'Öz-Şefkat', text: "Ders çalışma sürecinde işler planladığın gibi gitmediğinde kendine yaklaşımın nasıldır? Kendini sertçe cezalandırır/eleştirir misin yoksa şefkat gösterip yeni bir planla devam mı edersin?" },
  { id: 8, key: 'erteleme', label: 'Erteleme', text: "Ders çalışmayı ertelemek istediğinde beyninin ürettiği en yaygın ve seni ikna eden 'bahane' ya da 'savunma mekanizması' nedir? (Örn: 'Akşam çalışırım', 'Konuyu zaten biliyorum' vb.)" },
  { id: 9, key: 'motivasyon_kaynagi', label: 'Motivasyon Kaynağı', text: "Seni masaya oturmaya ve çalışmaya zorlayan ana yakıt nedir? Hayallerine ulaşma arzusu mu, başarısızlık korkusu mu yoksa geleceğe dair sorumluluk bilinci mi?" },
  { id: 10, key: 'koctan_beklenti', label: 'Koçtan Beklenti', text: "Bir eğitim koçundan en büyük beklentin nedir? Seni sürekli takip eden bir disiplin mekanizması mı, moral veren bir rehber mi yoksa verimli ders çalışma taktikleri sunan bir mentör mü?" }
];

export default function CabaTest() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'intro' | 'likert' | 'openEnded' | 'results'>('intro');
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // State for answers
  const [likertAnswers, setLikertAnswers] = useState<Record<number, number>>({});
  const [openEndedAnswers, setOpenEndedAnswers] = useState<Record<string, string>>({});
  
  // Final Result State
  const [savedResult, setSavedResult] = useState<any>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Load existing test if any
  useEffect(() => {
    if (user?.uid) {
      const fetchTest = async () => {
        try {
          const docRef = doc(db, 'caba_tests', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setSavedResult(docSnap.data());
            setStep('results');
          }
        } catch (e) {
          console.error("ÇABA Testi yüklenemedi:", e);
        } finally {
          setLoading(false);
        }
      };
      fetchTest();
    }
  }, [user]);

  // Likert Options (1 to 5)
  const likertOptions = [
    { value: 1, label: 'Hiç Katılmıyorum' },
    { value: 2, label: 'Katılmıyorum' },
    { value: 3, label: 'Kararsızım' },
    { value: 4, label: 'Katılıyorum' },
    { value: 5, label: 'Tamamen Katılıyorum' }
  ];

  const handleLikertSelect = (val: number) => {
    const q = LIKERT_QUESTIONS[currentIdx];
    setLikertAnswers(prev => ({ ...prev, [q.id]: val }));
    
    // Auto next after 250ms for better UX
    setTimeout(() => {
      if (currentIdx < LIKERT_QUESTIONS.length - 1) {
        setCurrentIdx(prev => prev + 1);
      } else {
        // Go to open ended
        setStep('openEnded');
        setCurrentIdx(0);
      }
    }, 200);
  };

  const handleOpenEndedNext = () => {
    const q = OPEN_ENDED_QUESTIONS[currentIdx];
    const ans = openEndedAnswers[q.key] || '';
    if (!ans.trim()) return; // Must fill

    if (currentIdx < OPEN_ENDED_QUESTIONS.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step === 'likert') {
      if (currentIdx > 0) {
        setCurrentIdx(prev => prev - 1);
      } else {
        setStep('intro');
      }
    } else if (step === 'openEnded') {
      if (currentIdx > 0) {
        setCurrentIdx(prev => prev - 1);
      } else {
        setStep('likert');
        setCurrentIdx(LIKERT_QUESTIONS.length - 1);
      }
    }
  };

  const handleSubmit = async () => {
    if (!user || submitting) return;
    setSubmitting(true);

    try {
      // Calculate original likert score
      let score = 0;
      Object.values(likertAnswers).forEach(val => {
        score += val as number;
      });

      const pct = Math.round((score / 75) * 100);
      let calculatedZone = 'Sarı Bölge';
      if (pct >= 75) calculatedZone = 'Yeşil Bölge';
      else if (pct >= 45) calculatedZone = 'Sarı Bölge';
      else calculatedZone = 'Kırmızı Bölge';

      const studentName = userData?.displayName || `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || user.email || 'Öğrenci';

      // Call our secure AI Analyze route
      let aiResult = {
        classification: calculatedZone,
        suitabilityScore: pct,
        aiScore: pct,
        report: ''
      };

      try {
        const response = await fetch('/api/caba-analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            likertAnswers,
            openEndedAnswers,
            studentName
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.classification) {
            aiResult = { ...data, classification: calculatedZone }; // Always enforce calculated zone
          }
        }
      } catch (aiErr) {
        console.error("AI analysis failed, falling back to client-side heuristics:", aiErr);
      }

      const payload = {
        studentId: user.uid,
        studentName,
        studentEmail: user.email || '',
        likertAnswers,
        openEndedAnswers,
        likertScore: score,
        classification: aiResult.classification,
        suitabilityScore: aiResult.suitabilityScore,
        aiScore: aiResult.aiScore,
        aiReport: aiResult.report,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'caba_tests', user.uid), payload);
      setSavedResult(payload);
      setStep('results');

      // Trigger standard page reload/update so sidebar updates instantly
      window.dispatchEvent(new Event('caba_test_completed'));
    } catch (e) {
      console.error("Test kaydedilirken hata oluştu:", e);
      alert("Hata: Test kaydedilemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  // Convert to PDF
  const downloadPdf = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] text-center p-8 max-w-xl mx-auto">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-blue-650/10 border border-blue-500/30 rounded-3xl flex items-center justify-center text-blue-400 shadow-xl shadow-blue-500/15">
            <Brain size={48} className="animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400">
            <Sparkles size={12} className="animate-pulse" />
          </div>
        </div>
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight mb-3">
          Yapay Zeka Analiziniz Hazırlanıyor...
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Tüm yanıtlarınız <strong>"ON Asistan"</strong> yapay zeka motoru tarafından bütüncül olarak inceleniyor. Size özel gelişim önerileri, başarı skoru ve koçluk uyumluluk analiz raporu oluşturuluyor. Lütfen bu sayfayı kapatmayın veya yenilemeyin.
        </p>
        <div className="w-48 h-1.5 bg-slate-950 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
            animate={{ x: [-192, 192] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            style={{ width: "96px" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col py-6">
      <AnimatePresence mode="wait">
        
        {/* Step 1: INTRO */}
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-3xl mx-auto bg-slate-900/60 border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none"></div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
                <Brain size={32} />
              </div>
              <div>
                <span className="text-[11px] text-blue-400 font-bold uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                  ÇABA Testi
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-white mt-2 tracking-tight">
                  Çalışma Alışkanlıkları ve Başarı Analizi Testi
                </h1>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed text-base mb-8">
              Sevgili Öğrencimiz, bu test bir akademik sınav değildir. Eğitim koçunuzla birlikte yürüteceğiniz süreçte, sizi çok daha yakından tanımak, güçlü yönlerinizi keşfetmek ve ihtiyaç duyduğunuz gelişim alanlarını belirlemek için hazırlanmış özel bir <strong>"ayna tutma"</strong> çalışmasıdır. 
              <br/><br/>
              Soruları olabildiğince samimi ve dürüst bir şekilde cevaplamanız, size en uygun koçluk yol haritasını çıkarmamızı sağlayacaktır.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <div className="flex items-start gap-3 bg-slate-950/40 border border-white/5 p-4 rounded-2xl">
                <ClipboardList className="text-emerald-400 shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">15 Likert Sorusu</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">Öz-disiplin, kaygı yönetimi, motivasyon ve gelişim zihniyetini ölçeklendirir.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-slate-950/40 border border-white/5 p-4 rounded-2xl">
                <FileText className="text-blue-400 shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">10 Açık Uçlu Soru</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">Gelecek vizyonunuzu, zaman hırsızlarınızı ve koçluktan beklentilerinizi ölçer.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-8">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Info size={14} className="text-slate-400" />
                <span>Yaklaşık 15-20 dakika sürer.</span>
              </div>
              <button
                onClick={() => setStep('likert')}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-8 rounded-2xl transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
              >
                Testi Başlat
                <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: LIKERT QUESTIONS */}
        {step === 'likert' && (
          <motion.div
            key="likert"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-2xl mx-auto bg-slate-900/60 border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative"
          >
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-xs text-slate-400 font-semibold mb-2">
                <span>Likert Tipi Değerlendirme</span>
                <span>Soru {currentIdx + 1} / {LIKERT_QUESTIONS.length}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-300" 
                  style={{ width: `${((currentIdx + 1) / LIKERT_QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="min-h-[140px] flex flex-col justify-center py-6">
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-2">
                {LIKERT_QUESTIONS[currentIdx].category}
              </span>
              <h2 className="text-lg md:text-xl font-bold text-white leading-relaxed">
                {LIKERT_QUESTIONS[currentIdx].text}
              </h2>
            </div>

            {/* Selection Grid */}
            <div className="space-y-3 mb-8">
              {likertOptions.map((opt) => {
                const isSelected = likertAnswers[LIKERT_QUESTIONS[currentIdx].id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleLikertSelect(opt.value)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between group
                      ${isSelected 
                        ? 'bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-500/5' 
                        : 'bg-slate-950/40 border-white/5 text-slate-300 hover:border-white/10 hover:bg-slate-900'
                      }
                    `}
                  >
                    <span className="text-sm font-semibold tracking-wide">{opt.label}</span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-500 text-white' 
                        : 'border-slate-700 group-hover:border-slate-500'
                      }
                    `}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-bold cursor-pointer"
              >
                <ChevronLeft size={16} />
                Geri Git
              </button>
              
              <div className="text-xs text-slate-500 italic">
                Cevap verdiğinizde otomatik olarak sonraki soruya geçilir.
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: OPEN ENDED QUESTIONS */}
        {step === 'openEnded' && (
          <motion.div
            key="openEnded"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-2xl mx-auto bg-slate-900/60 border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl"
          >
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center text-xs text-slate-400 font-semibold mb-2">
                <span>Açık Uçlu Değerlendirme</span>
                <span>Soru {currentIdx + 1} / {OPEN_ENDED_QUESTIONS.length}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300" 
                  style={{ width: `${((currentIdx + 1) / OPEN_ENDED_QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="min-h-[100px] flex flex-col justify-center py-4">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-2">
                {OPEN_ENDED_QUESTIONS[currentIdx].label}
              </span>
              <h2 className="text-base md:text-lg font-bold text-white leading-relaxed">
                {OPEN_ENDED_QUESTIONS[currentIdx].text}
              </h2>
            </div>

            <div className="mb-6">
              <textarea
                value={openEndedAnswers[OPEN_ENDED_QUESTIONS[currentIdx].key] || ''}
                onChange={(e) => setOpenEndedAnswers(prev => ({ ...prev, [OPEN_ENDED_QUESTIONS[currentIdx].key]: e.target.value }))}
                placeholder="Lütfen buraya dürüst ve detaylı düşüncelerinizi yazın..."
                className="w-full h-32 md:h-40 bg-slate-950/60 border border-white/10 rounded-2xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-none transition-all"
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-bold cursor-pointer"
              >
                <ChevronLeft size={16} />
                Geri Git
              </button>
              
              <button
                onClick={handleOpenEndedNext}
                disabled={!(openEndedAnswers[OPEN_ENDED_QUESTIONS[currentIdx].key] || '').trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                {currentIdx < OPEN_ENDED_QUESTIONS.length - 1 ? (
                  <>
                    Sonraki Soru
                    <ChevronRight size={16} />
                  </>
                ) : (
                  <>
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        Testi Tamamla
                        <CheckCircle2 size={16} />
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: RESULTS */}
        {step === 'results' && savedResult && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-4xl mx-auto"
          >
            {/* Top Warning Banner (Shown ONLY once upon completion) */}
            <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex items-start gap-4 mb-6 shadow-xl relative overflow-hidden print:hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-[40px] rounded-full pointer-events-none"></div>
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle size={20} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-white mb-1">⚠️ ÖNEMLİ UYARI: Bu Rapor Sadece Bir Kez Gösterilecektir!</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Güvenlik ve kişisel veri gizliliği politikamız gereği, yapay zeka destekli bu detaylı analiz raporu size <strong>yalnızca bu ekran üzerinde bir kez</strong> gösterilecektir. Raporunuzu kaybetmemek için lütfen sağ üst köşedeki <strong>"PDF Olarak Kaydet"</strong> butonunu kullanarak raporu hemen cihazınıza indirin.
                </p>
              </div>
            </div>

            {/* Top Info Banner */}
            <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shadow-xl print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">ÇABA Testi Tamamlandı!</h4>
                  <p className="text-xs text-slate-400">Bu analiz sonucu koçluğa uygunluk potansiyelinizi gösterir.</p>
                </div>
              </div>
              <button
                onClick={downloadPdf}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} />
                PDF Olarak Kaydet
              </button>
            </div>

            {/* Report Layout */}
            <div 
              ref={resultRef}
              className="bg-slate-900 border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl space-y-10 text-slate-200 print:hidden"
            >
              {/* Report Header */}
              <div className="border-b border-white/5 pb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                      Akademik Portföy
                    </span>
                    <span className="text-slate-600 text-xs">•</span>
                    <span className="text-xs text-slate-400">Ömer Nasuh Akademi</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    ÇABA TESTİ ANALİZ RAPORU
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Öğrenci: <strong className="text-white">{savedResult.studentName}</strong> ({savedResult.studentEmail})
                  </p>
                </div>
                
                <div className="text-right text-xs text-slate-500 font-semibold md:border-l md:border-white/5 md:pl-6">
                  <p>Değerlendirme Tarihi</p>
                  <p className="text-sm font-bold text-slate-300 mt-1">
                    {savedResult.createdAt ? new Date(savedResult.createdAt).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>

              {/* Score Dashboard Grid (4-Columns layout for richer overview) */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Likert Score Widget */}
                <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full pointer-events-none"></div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                      Öz-Disiplin Skoru
                    </span>
                    <h3 className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                      <Award size={14} />
                      Likert Değerlendirme
                    </h3>
                  </div>
                  <div className="my-4 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{savedResult.likertScore}</span>
                    <span className="text-slate-500 text-sm font-bold"> / 75</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full" 
                      style={{ width: `${(savedResult.likertScore / 75) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 2. AI Overall Score Widget */}
                <div className="bg-gradient-to-br from-indigo-950/30 to-slate-950/40 border border-indigo-500/10 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none"></div>
                  <div>
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-1">
                      Yapay Zeka Başarı Skoru
                    </span>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-400" />
                      Bütüncül Test Analizi
                    </h3>
                  </div>
                  <div className="my-4 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-indigo-300">{savedResult.aiScore !== undefined ? savedResult.aiScore : Math.round((savedResult.likertScore / 75) * 100)}</span>
                    <span className="text-slate-500 text-sm font-bold"> / 100</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" 
                      style={{ width: `${savedResult.aiScore !== undefined ? savedResult.aiScore : Math.round((savedResult.likertScore / 75) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 3. Suitability Index Widget */}
                <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[50px] rounded-full pointer-events-none"></div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                      Koçluğa Uygunluk
                    </span>
                    <h3 className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                      <Heart size={14} />
                      Uyum Potansiyeli
                    </h3>
                  </div>
                  <div className="my-4 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">
                      {savedResult.suitabilityScore || Math.round((savedResult.likertScore / 75) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-500 h-full rounded-full" 
                      style={{ width: `${savedResult.suitabilityScore || Math.round((savedResult.likertScore / 75) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 4. Classification Widget */}
                <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none"></div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                      Mevcut Bölge / Profil
                    </span>
                    <h3 className={`text-xs font-bold flex items-center gap-1.5
                      ${savedResult.classification === 'Yeşil Bölge' ? 'text-emerald-400' : ''}
                      ${savedResult.classification === 'Sarı Bölge' ? 'text-amber-400' : ''}
                      ${savedResult.classification === 'Kırmızı Bölge' ? 'text-red-400' : ''}
                    `}>
                      <Flame size={14} />
                      {savedResult.classification || 'Sarı Bölge'}
                    </h3>
                  </div>
                  
                  <div className="my-3">
                    <span className={`text-lg font-extrabold tracking-tight block
                      ${savedResult.classification === 'Yeşil Bölge' ? 'text-emerald-400' : ''}
                      ${savedResult.classification === 'Sarı Bölge' ? 'text-amber-400' : ''}
                      ${savedResult.classification === 'Kırmızı Bölge' ? 'text-red-400' : ''}
                    `}>
                      {savedResult.classification === 'Yeşil Bölge' && 'Performans Grubu'}
                      {savedResult.classification === 'Sarı Bölge' && 'İdeal Koçluk Adayı'}
                      {savedResult.classification === 'Kırmızı Bölge' && 'Direnç & Destek'}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Sisteme adaptasyon derecesi.
                  </p>
                </div>
              </div>

              {/* AI Powered Analysis Raporu (Rendered with ReactMarkdown) */}
              {savedResult.aiReport ? (
                <div className="bg-slate-950/40 border border-emerald-500/10 rounded-2xl p-6 md:p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[60px] rounded-full pointer-events-none"></div>
                  <h3 className="text-base font-black text-white mb-4 flex items-center gap-2 text-emerald-400 border-b border-white/5 pb-3">
                    <Sparkles size={18} className="text-emerald-400 animate-pulse" />
                    Yapay Zeka Destekli Bütüncül Analiz Raporu
                  </h3>
                  <div className="markdown-body text-slate-300 text-sm leading-relaxed space-y-4 prose prose-invert max-w-none">
                    <Markdown>{savedResult.aiReport}</Markdown>
                  </div>
                </div>
              ) : (
                /* Fallback Core Description Analysis if no AI Report */
                <div className="bg-slate-950/20 border border-white/5 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400" />
                    Kişisel Analiz ve Değerlendirme
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {savedResult.classification === 'Yeşil Bölge' && (
                      <>
                        <strong>Tebrikler!</strong> Akademik öz-disiplininiz ve sorumluluk duygunuz oldukça gelişmiş durumda. Kendi koyduğunuz kurallara uyma, zamanı yönetme ve hedeflerinize yönelik içsel motivasyon seviyeniz takdire şayan. Koçluk sürecinde sizinle "disiplin" kurmaktan ziyade, deneme netlerini maksimuma çekme, zor soru analizleri ve sınav stratejileri üzerinde yoğunlaşacağız.
                      </>
                    )}
                    {savedResult.classification === 'Sarı Bölge' && (
                      <>
                        <strong>Harika bir potansiyele sahipsiniz!</strong> Hedeflerinizin farkındasınız ve başarma isteğiniz var; ancak bunu günlük rutine, planlamaya ve istikrarlı bir çalışmaya dökerken dış desteğe ihtiyaç duyuyorsunuz. Akademik koçunuz size bu planlama, sınır yönetimi ve sürdürülebilir motivasyon konularında yol göstererek potansiyelinizi tam kapasiteye ulaştıracaktır.
                      </>
                    )}
                    {savedResult.classification === 'Kırmızı Bölge' && (
                      <>
                        Şu sıralar ders çalışma süreçlerinde bazı bariyerlerle, odaklanma sorunlarıyla veya erteleme alışkanlığıyla mücadele ediyor olabilirsiniz. Bu son derece insani ve aşılabilir bir durumdur. Akademik koçunuzla birlikte ilk hedefimiz büyük yükler yerine küçük, başarılabilir adımlarla ilerlemek ve içsel motivasyon kilitlerinizi teker teker açmak olacaktır.
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Likert Categorized Breakdown */}
              <div>
                <h3 className="text-base font-bold text-white mb-4 border-b border-white/5 pb-2">
                  1. Likert Ölçeği Boyutsal Değerlendirme
                </h3>
                <div className="space-y-4">
                  {[
                    { name: 'Akademik Öz-Disiplin ve Sorumluluk', range: [1, 4], desc: 'Planlama, cep telefonu sınırı ve moladan masaya zamanında dönebilme becerisi.' },
                    { name: 'Duygusal Dayanıklılık ve Kaygı', range: [5, 7], desc: 'Gelecek kaygısını yönetme, hatalardan ders çıkarma ve başarısızlıktan hızlı toparlanabilme.' },
                    { name: 'Motivasyon ve Farkındalık', range: [8, 10], desc: 'İçsel motivasyon, güçlü/zayıf yön farkındalığı ve mantık odaklı derin öğrenme.' },
                    { name: 'Sınır Yönetimi ve Çevre', range: [11, 13], desc: 'Sosyal çevreye sınır koyabilme, kendiliğinden ödev yapma ve özgün kalabilme.' },
                    { name: 'Gelişim Zihniyeti', range: [14, 15], desc: 'Yeterince çalışırsa öğrenebileceğine inanma ve zorluklardan kaçmayıp üzerine gitme.' }
                  ].map((cat, idx) => {
                    // Calculate category points
                    let catSum = 0;
                    let catMax = 0;
                    for (let i = cat.range[0]; i <= cat.range[1]; i++) {
                      catSum += savedResult.likertAnswers[i] || 3;
                      catMax += 5;
                    }
                    const pct = Math.round((catSum / catMax) * 100);

                    return (
                      <div key={idx} className="bg-slate-950/40 border border-white/5 p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h4 className="text-sm font-bold text-white">{cat.name}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">{cat.desc}</p>
                          </div>
                          <span className="text-sm font-black text-blue-400">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300
                              ${pct >= 75 ? 'bg-emerald-500' : pct >= 45 ? 'bg-amber-500' : 'bg-red-500'}
                            `}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Printable Footer */}
              <div className="border-t border-white/5 pt-6 text-center text-xs text-slate-500 hidden print:block">
                Ömer Nasuh Akademi - ÇABA Testi Gelişim Raporu © {new Date().getFullYear()}
              </div>

            </div>

            {/* Yazdırılabilir Beyaz Rapor Tasarımı (Sadece Yazdırma Esnasında Gözükür) */}
            <div className="hidden print:block print-container bg-white text-slate-900 p-8 font-sans max-w-[210mm] mx-auto">
              <style>{`
                @media print {
                  body, html {
                    background-color: #ffffff !important;
                    background-image: none !important;
                    color: #0f172a !important;
                    height: auto !important;
                    overflow: visible !important;
                  }
                  body * {
                    visibility: hidden !important;
                  }
                  .print-container, .print-container * {
                    visibility: visible !important;
                  }
                  .print-container {
                    position: relative !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 20px !important;
                    background: #ffffff !important;
                    color: #0f172a !important;
                  }
                  .break-inside-avoid {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                  }
                }
              `}</style>
              {/* Header with Logo */}
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex items-center gap-4">
                  <img src="/images/ON-Logo.png" alt="ON Logo" className="w-24 h-auto" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 tracking-wider">ÖMER NASUH AKADEMİ</h2>
                    <p className="text-[10px] text-slate-500 font-medium tracking-widest">BİREYSEL EĞİTİM KOÇLUĞU VE GELİŞİM MERKEZİ</p>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p className="font-bold">ÇABA GELİŞİM RAPORU</p>
                  <p>{savedResult.createdAt ? new Date(savedResult.createdAt).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR')}</p>
                </div>
              </div>

              {/* Main Title */}
              <div className="text-center my-6">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  ÇALIŞMA ALIŞKANLIKLARI VE BAŞARI ANALİZİ (ÇABA) RAPORU
                </h1>
                <div className="w-24 h-1 bg-blue-600 mx-auto mt-2 rounded-full"></div>
              </div>

              {/* Student Metadata Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-500 font-medium">Öğrenci Adı Soyadı:</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{savedResult.studentName}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Öğrenci E-posta Adresi:</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{savedResult.studentEmail}</p>
                </div>
              </div>

              {/* KPI Dashboard */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 text-center">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Öz-Disiplin Skoru</p>
                  <p className="text-lg font-black text-slate-900 mt-1">{savedResult.likertScore} / 75</p>
                  <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-2">
                    <div className="bg-blue-600 h-full" style={{ width: `${(savedResult.likertScore / 75) * 100}%` }}></div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 text-center">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">AI Başarı Skoru</p>
                  <p className="text-lg font-black text-slate-900 mt-1">
                    {savedResult.aiScore !== undefined ? savedResult.aiScore : Math.round((savedResult.likertScore / 75) * 100)} / 100
                  </p>
                  <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-2">
                    <div className="bg-slate-800 h-full" style={{ width: `${savedResult.aiScore !== undefined ? savedResult.aiScore : Math.round((savedResult.likertScore / 75) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 text-center">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Koçluk Uyumluluğu</p>
                  <p className="text-lg font-black text-emerald-600 mt-1">
                    %{savedResult.suitabilityScore || Math.round((savedResult.likertScore / 75) * 100)}
                  </p>
                  <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-2">
                    <div className="bg-emerald-600 h-full" style={{ width: `${savedResult.suitabilityScore || Math.round((savedResult.likertScore / 75) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 text-center flex flex-col justify-between">
                  <div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Değerlendirme Bölgesi</p>
                    <p className={`text-xs font-black mt-1 uppercase
                      ${savedResult.classification === 'Yeşil Bölge' ? 'text-emerald-600' : ''}
                      ${savedResult.classification === 'Sarı Bölge' ? 'text-amber-600' : ''}
                      ${savedResult.classification === 'Kırmızı Bölge' ? 'text-red-600' : ''}
                    `}>
                      {savedResult.classification || 'Sarı Bölge'}
                    </p>
                  </div>
                  <p className="text-[8px] text-slate-400 font-medium">
                    {savedResult.classification === 'Yeşil Bölge' && 'Performans Grubu'}
                    {savedResult.classification === 'Sarı Bölge' && 'İdeal Koçluk Adayı'}
                    {savedResult.classification === 'Kırmızı Bölge' && 'Direnç & Destek'}
                  </p>
                </div>
              </div>

              {/* AI Analysis section */}
              <div className="border border-slate-200 rounded-xl p-5 mb-6 bg-slate-50/30">
                <h3 className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3 uppercase tracking-wider">
                  Yapay Zeka Destekli Bütüncül Analiz Raporu
                </h3>
                <div className="text-slate-800 text-xs leading-relaxed space-y-3 prose max-w-none print:prose-sm">
                  {savedResult.aiReport ? (
                    <Markdown>{savedResult.aiReport}</Markdown>
                  ) : (
                    <p>
                      {savedResult.classification === 'Yeşil Bölge' && (
                        "Akademik öz-disiplininiz ve sorumluluk duygunuz oldukça gelişmiş durumda. Kendi koyduğunuz kurallara uyma, zamanı yönetme ve hedeflerinize yönelik içsel motivasyon seviyeniz takdire şayan. Koçluk sürecinde sizinle disiplin kurmaktan ziyade, deneme netlerini maksimuma çekme, zor soru analizleri ve sınav stratejileri üzerinde yoğunlaşacağız."
                      )}
                      {savedResult.classification === 'Sarı Bölge' && (
                        "Harika bir potansiyele sahipsiniz! Hedeflerinizin farkındasınız ve başarma isteğiniz var; ancak bunu günlük rutine, planlamaya ve istikrarlı bir çalışmaya dökerken dış desteğe ihtiyaç duyuyorsunuz. Akademik koçunuz size bu planlama, sınır yönetimi ve sürdürülebilir motivasyon konularında yol göstererek potansiyelinizi tam kapasiteye ulaştıracaktır."
                      )}
                      {savedResult.classification === 'Kırmızı Bölge' && (
                        "Şu sıralar ders çalışma süreçlerinde bazı bariyerlerle, odaklanma sorunlarıyla veya erteleme alışkanlığıyla mücadele ediyor olabilirsiniz. Bu son derece insani ve aşılabilir bir durumdur. Akademik koçunuzla birlikte ilk hedefimiz büyük yükler yerine küçük, başarılabilir adımlarla ilerlemek ve içsel motivasyon kilitlerinizi teker teker açmak olacaktır."
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Dimensional (Likert) Evaluation */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3 uppercase tracking-wider">
                  1. LİKERT ÖLÇEĞİ BOYUTSAL DEĞERLENDİRME
                </h3>
                <div className="space-y-3">
                  {[
                    { name: 'Akademik Öz-Disiplin ve Sorumluluk', range: [1, 4], desc: 'Planlama, cep telefonu sınırı ve moladan masaya zamanında dönebilme becerisi.' },
                    { name: 'Duygusal Dayanıklılık ve Kaygı', range: [5, 7], desc: 'Gelecek kaygısını yönetme, hatalardan ders çıkarma ve başarısızlıktan hızlı toparlanabilme.' },
                    { name: 'Motivasyon ve Farkındalık', range: [8, 10], desc: 'İçsel motivasyon, güçlü/zayıf yön farkındalığı ve mantık odaklı derin öğrenme.' },
                    { name: 'Sınır Yönetimi ve Çevre', range: [11, 13], desc: 'Sosyal çevreye sınır koyabilme, kendiliğinden ödev yapma ve özgün kalabilme.' },
                    { name: 'Gelişim Zihniyeti', range: [14, 15], desc: 'Yeterince çalışırsa öğrenebileceğine inanma ve zorluklardan kaçmayıp üzerine gitme.' }
                  ].map((cat, idx) => {
                    let catSum = 0;
                    let catMax = 0;
                    for (let i = cat.range[0]; i <= cat.range[1]; i++) {
                      catSum += savedResult.likertAnswers[i] || 3;
                      catMax += 5;
                    }
                    const pct = Math.round((catSum / catMax) * 100);

                    return (
                      <div key={idx} className="border border-slate-200 p-3 rounded-lg bg-slate-50/20 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <div>
                            <h4 className="font-bold text-slate-800">{cat.name}</h4>
                            <p className="text-[10px] text-slate-500">{cat.desc}</p>
                          </div>
                          <span className="font-black text-blue-600">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full
                              ${pct >= 75 ? 'bg-emerald-600' : pct >= 45 ? 'bg-amber-500' : 'bg-red-600'}
                            `}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Printable Footer */}
              <div className="border-t border-slate-200 pt-4 mt-8 text-center text-[10px] text-slate-400 flex justify-between items-center">
                <span>FocusON Akademi &bull; ÇABA Gelişim Raporu</span>
                <span>Süreç ve Akademik Koçluk Planlaması © {new Date().getFullYear()}</span>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
