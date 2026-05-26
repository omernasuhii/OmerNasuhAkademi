import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Target, 
  Info, 
  ShieldCheck, 
  Activity,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Star,
  Quote
} from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';

const branches = [
  { id: 'mat', name: 'Matematik', group: 'MATEMATİK' },
  { id: 'prob', name: 'Problemler', group: 'MATEMATİK' },
  { id: 'geo', name: 'Geometri', group: 'MATEMATİK' },
  { id: 'db', name: 'Dil Bilgisi / Edebiyat', group: 'TÜRKÇE' },
  { id: 'par', name: 'Paragraf', group: 'TÜRKÇE' },
  { id: 'fiz', name: 'Fizik', group: 'FEN BİLİMLERİ' },
  { id: 'kim', name: 'Kimya', group: 'FEN BİLİMLERİ' },
  { id: 'biy', name: 'Biyoloji', group: 'FEN BİLİMLERİ' },
  { id: 'tar', name: 'Tarih', group: 'SOSYAL BİLİMLER' },
  { id: 'cog', name: 'Coğrafya', group: 'SOSYAL BİLİMLER' },
  { id: 'fel', name: 'Felsefe', group: 'SOSYAL BİLİMLER' },
  { id: 'din', name: 'Din Kültürü', group: 'SOSYAL BİLİMLER' }
];

const attitudeQuestions = [
  { id: 1, text: "Bu dersin gerçek hayatta hiçbir işime yaramayacağını düşünüyorum.", category: "Cognitive" },
  { id: 2, text: "Bu dersi anlamak için 'özel bir zekâ' gerektiğini ve bende o zekânın olmadığını düşünüyorum.", category: "Cognitive" },
  { id: 3, text: "Konuları ne kadar çalışırsam çalışayım, sınavda yapamayacağıma inanıyorum.", category: "Cognitive" },
  { id: 4, text: "Bu dersin konuları bana çok soyut ve karmaşık geliyor.", category: "Cognitive" },
  { id: 5, text: "Temelim çok eksik olduğu için yeni konuları anlamakta zorlanıyorum.", category: "Cognitive" },
  { id: 6, text: "Ders programında bu dersi gördüğümde modum düşüyor, canım sıkılıyor.", category: "Affective" },
  { id: 7, text: "Ders başladığında uykum geliyor veya içim daralıyor.", category: "Affective" },
  { id: 8, text: "Sınavda bu dersin sorularını çözerken elim titriyor veya aşırı heyecanlanıyorum.", category: "Affective" },
  { id: 9, text: "Bu dersten yüksek not aldığımda bile 'şans eseri' olduğunu düşünüyorum.", category: "Affective" },
  { id: 10, text: "Öğretmenin dersteki tavrı beni dersten soğutuyor.", category: "Affective" },
  { id: 11, text: "Çalışma programımda bu dersi hep en sona atıyorum veya erteliyorum.", category: "Behavioral" },
  { id: 12, text: "Bu derse çalışırken sık sık mola veriyor, telefona bakıyorum.", category: "Behavioral" },
  { id: 13, text: "Derste not tutmak veya soru sormak içimden gelmiyor.", category: "Behavioral" },
  { id: 14, text: "Bu dersin ödevlerini ya yapmıyorum ya da arkadaşımdan geçiriyorum.", category: "Behavioral" },
  { id: 15, text: "Soru bankasında bu dersin testlerini çözmeden atlıyorum.", category: "Behavioral" }
];

export default function AdtoAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(true);
  const [section, setSection] = useState<'A' | 'B'>('A');
  const [currentBranchIdx, setCurrentBranchIdx] = useState(0);
  const [branchRatings, setBranchRatings] = useState<Record<string, { score: number, reason: string }>>({});
  const [attitudeAnswers, setAttitudeAnswers] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleSelectScore = (score: number) => {
    const branchId = branches[currentBranchIdx].id;
    const existingReason = branchRatings[branchId]?.reason || '';
    setBranchRatings(prev => ({ ...prev, [branchId]: { score, reason: existingReason } }));
    
    // Yüksek puanlarda (>= 7) otomatik geçiş yap, düşük puanlarda durakla ki neden yazılabilsin
    if (score >= 7) {
      setTimeout(() => {
        setBranchRatings(current => {
          if (current[branchId]?.score >= 7) {
            handleNextBranch(currentBranchIdx);
          }
          return current;
        });
      }, 600);
    }
  };

  const handleNextBranch = (fromIdx?: number) => {
    setCurrentBranchIdx(prev => {
      // Eğer bir index belirtilmişse (otomatik geçişten gelmişse) ve şu anki index o değilse işlem yapma
      // fromIdx'in sayı olup olmadığını kontrol ediyoruz, çünkü onClick doğrudan fonksiyona bağlanırsa event objesi gelir
      if (typeof fromIdx === 'number' && prev !== fromIdx) return prev;
      
      if (prev < branches.length - 1) {
        return prev + 1;
      } else {
        // Son branştaysak B bölümüne geç
        setTimeout(() => setSection('B'), 0);
        return prev;
      }
    });
  };

  const calculateDiagnosis = () => {
    // Teşhis Mantığı
    // Temel Eksikliği: Madde 4 ve 5 baskınsa (Bilişsel kategorisi içinde)
    // Öğretmen/Önyargı: Madde 1 ve 10 baskınsa
    // Kaçınma/Korku: Madde 3, 6, 11 baskınsa
    
    const results = {
      ratings: branchRatings,
      attitudes: attitudeAnswers,
      diagnosis: [] as string[]
    };

    if (attitudeAnswers[4] && attitudeAnswers[5]) results.diagnosis.push('TEMEL EKSİKLİĞİ');
    if (attitudeAnswers[1] && attitudeAnswers[10]) results.diagnosis.push('ÖĞRETMEN / ÖNYARGI');
    if (attitudeAnswers[3] && attitudeAnswers[6] && attitudeAnswers[11]) results.diagnosis.push('KAÇINMA / KORKU');

    return results;
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const results = calculateDiagnosis();
      const docId = await analysisService.saveResult(user.uid, 'ADT-Ö', results);
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
        <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-500">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white">Analiz Tamamlandı!</h2>
          <p className="text-slate-400 font-medium">Branş bazlı röntgenin çekildi, yapay zeka ders programını optimize ediyor...</p>
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
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <ChevronLeft size={16} />
            Analizlere Dön
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
            <Activity size={12} />
            BRANŞ BAZLI AKADEMİK TUTUM
          </div>
          <h1 className="text-4xl font-black text-white leading-tight underline decoration-indigo-500/30 decoration-8 underline-offset-8">ADT-Ö: Branş Bazlı Akademik Tutum ve Önyargı Analizi</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl">
            Her ders için zihnindeki ve kalbindeki "ısı haritasını" çıkar. Hangi derste öğrenilmiş çaresizlik yaşıyorsun, hangisinde temelden gelen bir direncin var? Keşfet.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Star size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Zihin (Bilişsel)</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Dersin gerekliliğine ve zorluğuna dair kemikleşmiş inançlarını ölçer.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400">
              <Activity size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Kalp (Duyuşsal)</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Dersle karşılaştığında hissettiğin heyecan, korku veya bıkkınlık durumunu analiz eder.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Target size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Eylem (Davranışsal)</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Dersi erteleme, ödev yapmama veya çalışma sırasındaki odaklanma sorunlarını tespit eder.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center gap-4 text-emerald-400">
            <ShieldCheck size={24} />
            <span className="font-bold uppercase tracking-widest text-sm">Kuramsal Dayanak</span>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed">
            Bu analiz, sosyal psikolojinin temel taşlarından biri olan <strong>ABC Tutum Modeli</strong> (Affective, Behavioral, Cognitive) üzerine kurgulanmıştır. Başarısızlığın branş bazındaki nörolojik ve psikolojik kökenlerini ayrıştırarak "nokta atışı" koçluk reçeteleri üretir.
          </p>
          <div className="flex items-start gap-4 p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-[28px]">
            <Quote className="text-indigo-500 shrink-0 mt-1" size={24} />
            <p className="text-sm text-slate-400 font-medium italic">
              "Öğrencinin matematikten başarısız olması her zaman zekâ ile ilgili değildir; bazen branşa yüklediği negatif anlam (ABC Tutumu) performansı kilitler."
            </p>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={() => setShowIntro(false)}
            className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-indigo-600/20 flex items-center gap-3"
          >
            Branş Analizini Başlat
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    );
  }

  if (section === 'A') {
    const currentBranch = branches[currentBranchIdx];
    
    // Güvenlik kontrolü: currentBranch undefined ise render etme (geçiş sırasında olabilir)
    if (!currentBranch) return null;

    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center px-4">
           <button 
            onClick={() => currentBranchIdx === 0 ? setShowIntro(true) : setCurrentBranchIdx(prev => prev - 1)}
            className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="text-center space-y-1">
             <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{currentBranch.group}</div>
             <h2 className="text-2xl font-black text-white">{currentBranch.name}</h2>
          </div>
          <span className="text-[10px] font-black text-slate-500 tracking-widest">{currentBranchIdx + 1} / {branches.length}</span>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-12 space-y-12">
           <div className="space-y-4 text-center">
              <h3 className="text-xl font-bold text-slate-300">Bu branşı ne kadar seviyorsun? (1-10)</h3>
              <div className="flex flex-wrap justify-center gap-2">
                 {[1,2,3,4,5,6,7,8,9,10].map(s => (
                   <button
                    key={s}
                    onClick={() => handleSelectScore(s)}
                    className={`w-12 h-12 rounded-xl font-black transition-all ${
                      branchRatings[currentBranch.id]?.score === s 
                      ? 'bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/20' 
                      : 'bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white'
                    }`}
                   >
                     {s}
                   </button>
                 ))}
              </div>
           </div>

           <AnimatePresence>
            {branchRatings[currentBranch.id]?.score && branchRatings[currentBranch.id].score < 8 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Neden düşük puan verdin? (Kısaca açıkla)</label>
                <input
                  type="text"
                  value={branchRatings[currentBranch.id]?.reason || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBranchRatings(prev => ({ 
                      ...prev, 
                      [currentBranch.id]: { ...prev[currentBranch.id], reason: val }
                    }));
                  }}
                  autoFocus
                  placeholder="Örn: Hoca çok sıkıcı, konular çok soyut, temelim yok..."
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </motion.div>
            )}
           </AnimatePresence>

           <button
            disabled={!branchRatings[currentBranch.id]}
            onClick={() => handleNextBranch()}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
           >
             {currentBranchIdx < branches.length - 1 ? 'Sonraki Branş' : 'Tutum Ölçeğine Geç'}
             <ChevronRight size={24} />
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-black text-white">TUTUM ÖLÇEĞİ</h2>
        <p className="text-slate-400 font-medium">Puanı 5'in altında verdiğin dersleri düşünerek dürüstçe cevapla.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {attitudeQuestions.map((q, idx) => (
          <div 
            key={q.id}
            className="bg-slate-900/50 border border-white/5 rounded-[32px] p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-white/10 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-white transition-colors shrink-0">
              <span className="font-black">{idx + 1}</span>
            </div>
            <p className="flex-1 text-slate-300 font-bold leading-relaxed">{q.text}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setAttitudeAnswers(prev => ({ ...prev, [q.id]: true }))}
                className={`px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${attitudeAnswers[q.id] === true ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
              >
                EVET
              </button>
              <button
                onClick={() => setAttitudeAnswers(prev => ({ ...prev, [q.id]: false }))}
                className={`px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${attitudeAnswers[q.id] === false ? 'bg-rose-500 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
              >
                HAYIR
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-8">
        <button
          onClick={handleSave}
          disabled={loading || Object.keys(attitudeAnswers).length < attitudeQuestions.length}
          className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-indigo-600/20 flex items-center gap-3 disabled:opacity-50"
        >
          {loading ? 'Analiz Kaydediliyor...' : 'Analizi Tamamla ve Gönder'}
          <Save size={24} />
        </button>
      </div>
    </div>
  );
}
