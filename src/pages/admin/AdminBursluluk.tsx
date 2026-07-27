import React, { useEffect, useState, useRef } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  GraduationCap, 
  Search, 
  Filter, 
  Calendar, 
  Award, 
  Activity, 
  ChevronRight, 
  X, 
  Brain, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2, 
  Clock, 
  Download,
  Mail,
  User,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Markdown from 'react-markdown';

// CABA Questions for reference
const LIKERT_QUESTIONS = [
  { id: 1, category: 'Zaman Yönetimi ve Planlama', text: "Haftalık hedeflerimi net bir şekilde belirler, günümü planlar ve bu plana düzenli olarak sadık kalırım." },
  { id: 2, category: 'Zaman Yönetimi ve Planlama', text: "Ders çalışırken ne kadar süre çalışacağımı ve ne kadar mola vereceğimi önceden belirler ve buna uyarım." },
  { id: 3, category: 'Akademik Öz-Disiplin ve Sorumluluk', text: "Masaya oturduğumda dikkatimi dağıtacak tüm dış etkenleri (telefon, sosyal medya vb.) kendimden uzaklaştırırım." },
  { id: 4, category: 'Akademik Öz-Disiplin ve Sorumluluk', text: "Sorumluluklarımı (ödevler, konu tekrarları, soru çözümleri) bir başkasının uyarısına veya takibine gerek kalmadan kendiliğimden yaparım." },
  { id: 5, category: 'Duygusal Dayanıklılık ve Kaygı', text: "Sınav anında veya ders çalışırken yaşadığım stresi ve 'yetişmeyecek' kaygısını soğukkanlılıkla kontrol edebilirim." },
  { id: 6, category: 'Duygusal Dayanıklılık ve Kaygı', text: "Deneme sınavlarında beklediğimden düşük netler aldığımda demoralize olmak yerine hatalarımdan ders çıkarıp hemen toparlanırım." },
  { id: 7, category: 'Duygusal Dayanıklılık ve Kaygı', text: "Zorlandığım veya hata yaptığım konuları moral bozucu bir başarısızlık değil, geliştirilmesi gereken birer fırsat olarak görürüm." },
  { id: 8, category: 'Motivasyon ve Farkındalık', text: "Ders çalışmamı ve başarılı olmamı sağlayan şey ailemin veya öğretmenlerimin baskısı değil, kendi gelecek hayallerim ve hedeflerimdir." },
  { id: 9, category: 'Motivasyon ve Farkındalık', text: "Hangi konularda eksik olduğumu, güçlü ve zayıf akademik yönlerimi dürüstçe analiz edebilir ve buna göre önlem alabilirim." },
  { id: 10, category: 'Motivasyon ve Farkındalık', text: "Bir konuyu sadece sınavda çıkacağı için yüzeysel olarak ezberlemek yerine, mantığını ve arka planındaki mantıksal yapıyı kavramaya çalışırım." },
  { id: 11, category: 'Sınır Yönetimi ve Çevre', text: "Ders çalışmam gereken saatlerde arkadaşlarımın çağrılarına, sosyal medya davetlerine veya eğlence tekliflerine kararlılıkla 'Hayır' diyebilirim." },
  { id: 12, category: 'Sınır Yönetimi ve Çevre', text: "Çalışma ortamımı (odamı, masamı, ışığımı) dikkatimi maksimum düzeyde tutacak şekilde düzenli ve verimli tutarım." },
  { id: 13, category: 'Sınır Yönetimi ve Çevre', text: "Sınav sürecindeki başarımı ve kendime olan inancımı çevremin, arkadaşlarımın veya sosyal çevrenin yorumlarına göre şekillendirmem." },
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

export default function AdminBursluluk() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const cabaQuery = query(collection(db, 'caba_tests'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(cabaQuery);
      
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setCandidates(list);
    } catch (e) {
      console.error("CABA adayları yüklenirken hata:", e);
    } finally {
      setLoading(false);
    }
  };

  // Filter candidates
  const filteredCandidates = candidates.filter(c => {
    const matchSearch = 
      (c.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.studentEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchZone = selectedZone === 'all' || c.classification === selectedZone;
    return matchSearch && matchZone;
  });

  // Calculate statistics
  const totalCount = candidates.length;
  const yellowZoneCount = candidates.filter(c => c.classification === 'Sarı Bölge').length;
  const greenZoneCount = candidates.filter(c => c.classification === 'Yeşil Bölge').length;
  const redZoneCount = candidates.filter(c => c.classification === 'Kırmızı Bölge').length;

  // Calculate Category Scores for details view
  const getCategoryScores = (answers: Record<number, number> = {}) => {
    const categories: Record<string, { score: number, max: number }> = {
      'Zaman Yönetimi ve Planlama': { score: 0, max: 10 },
      'Akademik Öz-Disiplin ve Sorumluluk': { score: 0, max: 10 },
      'Duygusal Dayanıklılık ve Kaygı': { score: 0, max: 15 },
      'Motivasyon ve Farkındalık': { score: 0, max: 15 },
      'Sınır Yönetimi ve Çevre': { score: 0, max: 15 },
      'Gelişim Zihniyeti': { score: 0, max: 10 }
    };

    LIKERT_QUESTIONS.forEach(q => {
      const ansVal = answers[q.id] || 3; // Default to neutral if missing
      if (categories[q.category]) {
        categories[q.category].score += ansVal;
      }
    });

    return categories;
  };

  // Convert individual details view to PDF
  const downloadCandidatePdf = () => {
    window.print();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-96">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 text-white min-w-0 print:hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white flex items-center gap-3">
            <Award className="text-emerald-500" size={32} /> Bursluluk ve Kabul Değerlendirme (ÇABA)
          </h1>
          <p className="text-slate-400 mt-2 text-sm max-w-2xl">
            Öğrencilerin Çalışma Alışkanlıkları ve Başarı Analizi (ÇABA) testi sonuçları. Koçluk uyumluluğu, öz-disiplin seviyeleri ve zihinsel direnç analizlerini inceleyerek bursluluk ve kabul kararlarını yönetin.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 hover:border-emerald-500/20 transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplam Katılımcı</span>
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400"><User size={16} /></div>
          </div>
          <p className="text-3xl font-black text-white">{totalCount}</p>
          <p className="text-xs text-slate-500 mt-1">Sınavı tamamlayan aday sayısı</p>
        </div>

        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 hover:border-amber-500/20 transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Sarı Bölge (İdeal Koçluk)</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400"><Brain size={16} /></div>
          </div>
          <p className="text-3xl font-black text-amber-400">{yellowZoneCount}</p>
          <p className="text-xs text-slate-500 mt-1">Koçluktan en çok fayda sağlayacaklar</p>
        </div>

        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 hover:border-emerald-500/20 transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Yeşil Bölge (Yüksek Sorumluluk)</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400"><TrendingUp size={16} /></div>
          </div>
          <p className="text-3xl font-black text-emerald-400">{greenZoneCount}</p>
          <p className="text-xs text-slate-500 mt-1">Öz-disiplini ve farkındalığı yüksekler</p>
        </div>

        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 hover:border-red-500/20 transition-all">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Kırmızı Bölge (Yüksek Direnç)</span>
            <div className="p-2 bg-red-500/10 rounded-xl text-red-400"><AlertTriangle size={16} /></div>
          </div>
          <p className="text-3xl font-black text-red-400">{redZoneCount}</p>
          <p className="text-xs text-slate-500 mt-1">Öncelikli motivasyon desteği gerekenler</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/40 border border-white/5 p-4 rounded-3xl mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Aday Adı veya E-posta Ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/5 text-sm rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500/40 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter size={16} className="text-slate-500 shrink-0" />
          <div className="flex flex-wrap gap-2 w-full">
            {[
              { key: 'all', label: 'Tüm Bölgeler' },
              { key: 'Sarı Bölge', label: '🟡 Sarı Bölge' },
              { key: 'Yeşil Bölge', label: '🟢 Yeşil Bölge' },
              { key: 'Kırmızı Bölge', label: '🔴 Kırmızı Bölge' }
            ].map((z) => (
              <button
                key={z.key}
                onClick={() => setSelectedZone(z.key)}
                className={`text-xs px-3.5 py-2 rounded-xl border transition-all ${
                  selectedZone === z.key 
                    ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400 font-bold' 
                    : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                }`}
              >
                {z.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          {filteredCandidates.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <BookOpen size={48} className="text-slate-700" />
              <p className="text-lg font-bold">Aday Bulunamadı</p>
              <p className="text-sm text-slate-600">Aradığınız kriterlere uygun tamamlanmış ÇABA testi bulunmuyor.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <th className="py-4 px-6">Öğrenci Adı / E-posta</th>
                  <th className="py-4 px-6">Bölge & Uyumluluk Kararı</th>
                  <th className="py-4 px-6 text-center">Likert Puanı (Max 75)</th>
                  <th className="py-4 px-6">Koçluk Uygunluk Skoru</th>
                  <th className="py-4 px-6">Tamamlama Tarihi</th>
                  <th className="py-4 px-6 text-right">Detaylar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredCandidates.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center font-bold text-emerald-400">
                          {c.studentName?.substring(0, 2).toUpperCase() || 'ÖG'}
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-emerald-400 transition-colors">{c.studentName}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Mail size={12} /> {c.studentEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {c.classification === 'Yeşil Bölge' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          YEŞİL BÖLGE (Üst Düzey)
                        </span>
                      )}
                      {c.classification === 'Sarı Bölge' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                          SARI BÖLGE (İdeal Aday)
                        </span>
                      )}
                      {c.classification === 'Kırmızı Bölge' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-500/10 text-red-400 border border-red-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                          KIRMIZI BÖLGE (Yüksek Direnç)
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center font-black text-white text-base">
                      {c.likertScore} <span className="text-xs text-slate-500">/ 75</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-16 bg-slate-950/60 rounded-full h-2 overflow-hidden border border-white/5">
                          <div 
                            className={`h-full rounded-full ${
                              c.classification === 'Yeşil Bölge' ? 'bg-emerald-500' :
                              c.classification === 'Sarı Bölge' ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${c.suitabilityScore || 0}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-300 text-xs">%{c.suitabilityScore || 0}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-xs">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => setSelectedCandidate(c)}
                        className="bg-slate-800 hover:bg-emerald-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold text-slate-300 border border-white/5 flex items-center gap-2 ml-auto transition-all"
                      >
                        İncele <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Details Slide-Over Panel */}
      <AnimatePresence>
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCandidate(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Slide content */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-4xl bg-[#070b14] border-l border-white/10 h-full flex flex-col shadow-2xl z-10"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/60 sticky top-0 z-20 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10 shrink-0">
                    <Brain size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase">{selectedCandidate.studentName}</h2>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <Mail size={12} /> {selectedCandidate.studentEmail} &bull; <Calendar size={12} /> {formatDate(selectedCandidate.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={downloadCandidatePdf}
                    disabled={exportingPdf}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {exportingPdf ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Download size={14} />
                    )}
                    PDF Olarak Kaydet
                  </button>
                  <button 
                    onClick={() => setSelectedCandidate(null)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Scrollable Body */}
              <div ref={detailRef} className="flex-1 p-6 md:p-8 overflow-y-auto space-y-8 bg-[#070b14] print:bg-white print:text-black">
                
                {/* Visual Report Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Koçluk Değerlendirme Bölgesi</p>
                    {selectedCandidate.classification === 'Yeşil Bölge' && (
                      <div>
                        <p className="text-xl font-black text-emerald-400 uppercase">Yeşil Bölge</p>
                        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">Öz-disiplini ve yüksek sorumluluğa sahip performans odaklı aday.</p>
                      </div>
                    )}
                    {selectedCandidate.classification === 'Sarı Bölge' && (
                      <div>
                        <p className="text-xl font-black text-amber-400 uppercase">Sarı Bölge</p>
                        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">Farkındalığı yüksek, dış disipline ve koçluğa en uygun aday.</p>
                      </div>
                    )}
                    {selectedCandidate.classification === 'Kırmızı Bölge' && (
                      <div>
                        <p className="text-xl font-black text-red-400 uppercase">Kırmızı Bölge</p>
                        <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">Yüksek direnç / motivasyon kilitleri olan destek öncelikli aday.</p>
                      </div>
                    )}
                    <div className="absolute right-3 bottom-3 opacity-10">
                      <Award size={64} className={
                        selectedCandidate.classification === 'Yeşil Bölge' ? 'text-emerald-500' :
                        selectedCandidate.classification === 'Sarı Bölge' ? 'text-amber-500' : 'text-red-500'
                      } />
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Toplam Likert Skoru</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-white">{selectedCandidate.likertScore}</span>
                      <span className="text-sm font-semibold text-slate-500">/ 75 Puan</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">15 adet 5'li Likert sorusu toplamı</p>
                  </div>

                  <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Koçluğa Uygunluk Kararı</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-black text-emerald-400">%{selectedCandidate.suitabilityScore}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">Değerlendirme ve uyumluluk yüzdesi</p>
                  </div>
                </div>

                {/* AI Powered Analysis Raporu (Yönetici Paneli için) */}
                <div className="bg-slate-900/40 border border-emerald-500/10 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[60px] rounded-full pointer-events-none"></div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2 text-emerald-400 border-b border-white/5 pb-3">
                    <Brain size={18} className="text-emerald-400 animate-pulse" />
                    YAPAY ZEKA DESTEKLİ BÜTÜNCÜL ANALİZ RAPORU
                  </h3>
                  
                  {selectedCandidate.aiReport ? (
                    <div className="markdown-body text-slate-300 text-sm leading-relaxed space-y-4 prose prose-invert max-w-none">
                      <Markdown>{selectedCandidate.aiReport}</Markdown>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center py-6">
                      <p className="text-sm text-slate-400">
                        Bu adayın testi tamamlandığında henüz yapay zeka analiz raporu oluşturulmamış veya rapor yüklenememiş.
                      </p>
                      <button
                        onClick={async () => {
                          // Dynamic AI Analysis Generator for Admin
                          try {
                            setExportingPdf(true);
                            const pct = Math.round((selectedCandidate.likertScore / 75) * 100);
                            let calculatedZone = 'Sarı Bölge';
                            if (pct >= 75) calculatedZone = 'Yeşil Bölge';
                            else if (pct >= 45) calculatedZone = 'Sarı Bölge';
                            else calculatedZone = 'Kırmızı Bölge';

                            const response = await fetch('/api/caba-analyze', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                likertAnswers: selectedCandidate.likertAnswers,
                                openEndedAnswers: selectedCandidate.openEndedAnswers,
                                studentName: selectedCandidate.studentName,
                                calculatedZone
                              })
                            });
                            if (response.ok) {
                              const data = await response.json();
                              if (data && data.report) {
                                // Save back to Firestore for persistence
                                const docRef = doc(db, 'caba_tests', selectedCandidate.id);
                                const updatedCandidate = {
                                  ...selectedCandidate,
                                  aiReport: data.report,
                                  aiScore: data.aiScore !== undefined ? data.aiScore : pct,
                                  classification: calculatedZone, // ALWAYS use deterministic zone
                                  suitabilityScore: data.suitabilityScore || selectedCandidate.suitabilityScore || pct
                                };
                                await setDoc(docRef, updatedCandidate);
                                setSelectedCandidate(updatedCandidate);
                                // Refresh candidates list
                                setCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? updatedCandidate : c));
                              }
                            } else {
                              alert("Yapay zeka analizi üretilemedi.");
                            }
                          } catch (err) {
                            console.error("Hata:", err);
                            alert("Yapay zeka analizi sırasında bir bağlantı hatası oluştu.");
                          } finally {
                            setExportingPdf(false);
                          }
                        }}
                        disabled={exportingPdf}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 mx-auto cursor-pointer"
                      >
                        {exportingPdf ? (
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Brain size={14} />
                        )}
                        Yapay Zeka Analizini Şimdi Oluştur
                      </button>
                    </div>
                  )}
                </div>

                {/* Sub-categories Breakdown */}
                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Activity size={16} className="text-emerald-400" /> KATEGORİSEL ÖLÇÜM ANALİZİ
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(getCategoryScores(selectedCandidate.likertAnswers)).map(([catName, data]) => {
                      const pct = Math.round((data.score / data.max) * 100);
                      return (
                        <div key={catName} className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-300">{catName}</span>
                            <span className="font-black text-white">{data.score} / {data.max} Puan <span className="text-[10px] text-slate-500">(%{pct})</span></span>
                          </div>
                          <div className="w-full bg-slate-950/60 rounded-full h-2.5 overflow-hidden border border-white/5 shadow-inner">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                pct >= 80 ? 'bg-emerald-500' :
                                pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed Answers Section (Likert) */}
                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider pb-3 border-b border-white/5 flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-400" /> 15 LİKERT SORUSU DETAYLI YANITLARI
                  </h3>
                  
                  <div className="space-y-6 divide-y divide-white/5">
                    {LIKERT_QUESTIONS.map((q, idx) => {
                      const ans = selectedCandidate.likertAnswers?.[q.id] || 3;
                      return (
                        <div key={q.id} className={`pt-4 ${idx === 0 ? 'pt-0' : ''} space-y-3`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{q.category}</span>
                              <p className="text-sm font-semibold text-slate-100">{q.id}. {q.text}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 ${
                              ans >= 4 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              ans === 3 ? 'bg-slate-800 text-slate-400 border border-white/5' :
                              'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              Puan: {ans}
                            </span>
                          </div>

                          {/* Horizontal Options Indicator */}
                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
                            {[1, 2, 3, 4, 5].map((val) => (
                              <div 
                                key={val} 
                                className={`text-[10px] py-1.5 rounded-lg border text-center transition-all ${
                                  ans === val 
                                    ? 'bg-emerald-600/10 border-emerald-500 text-emerald-400 font-black' 
                                    : 'bg-slate-950/20 border-white/5 text-slate-500'
                                }`}
                              >
                                {val === 1 && 'H.Katılmıyorum'}
                                {val === 2 && 'Katılmıyorum'}
                                {val === 3 && 'Kararsızım'}
                                {val === 4 && 'Katılıyorum'}
                                {val === 5 && 'T.Katılıyorum'}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed Answers Section (Open-Ended) */}
                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider pb-3 border-b border-white/5 flex items-center gap-2">
                    <MessageSquare size={16} className="text-emerald-400" /> 10 AÇIK UÇLU SORU YANITLARI VE REHBERLİK NOTLARI
                  </h3>
                  
                  <div className="space-y-6">
                    {OPEN_ENDED_QUESTIONS.map((q) => {
                      const ans = selectedCandidate.openEndedAnswers?.[q.key] || 'Yanıtlanmamış.';
                      return (
                        <div key={q.id} className="space-y-2 bg-slate-950/60 border border-white/5 p-4 rounded-2xl relative">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                              {q.label}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold">Soru {q.id}</span>
                          </div>
                          <p className="text-xs text-slate-300 font-bold">{q.text}</p>
                          <div className="bg-slate-900/60 border-l-2 border-emerald-500 p-3 rounded-xl mt-2 text-sm text-slate-100 italic leading-relaxed">
                            "{ans}"
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Koçluğa Kabul Değerlendirme Raporu */}
                <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <Award size={16} /> ADAY KABUL VE REHBERLİK ÖNERİLERİ
                  </h3>
                  {selectedCandidate.classification === 'Yeşil Bölge' && (
                    <p className="text-sm text-slate-300 leading-relaxed">
                      <strong>Kabul ve Eşleştirme Kararı:</strong> Aday, öz-disiplini ve farkındalığı üst düzeyde bir öğrencidir. Koçluk planlama programı için doğrudan kabul edilebilir.
                      <br /><br />
                      <strong>Yol Haritası:</strong> Gevşek takip yerine tamamen <strong>hedef, performans, net artışı, ileri derece kaynak analizleri</strong> ve sınav stratejileri üzerine odaklanılmalıdır. Koç seçimi yapılırken öğrencinin branşına en hakim ve onu akademik olarak zorlayabilecek, yüksek tempo kaldırabilecek bir koç atanmalıdır.
                    </p>
                  )}
                  {selectedCandidate.classification === 'Sarı Bölge' && (
                    <p className="text-sm text-slate-300 leading-relaxed">
                      <strong>Kabul ve Eşleştirme Kararı:</strong> Aday, eğitim koçluğu sistemimiz için <strong>en ideal ve en yüksek fayda sağlayacak</strong> aday profildir. Doğrudan bursluluk veya standart programa kabul edilmelidir.
                      <br /><br />
                      <strong>Yol Haritası:</strong> Öğrencinin farkındalığı yüksektir ancak istikrar ve uygulama kısımlarında dış disipline ihtiyaç duymaktadır. Koçluk programında <strong>yakın takip, günlük ödev kontrolleri, haftalık planlama uyum ölçümleri</strong> ön planda tutulmalıdır. Eşleştirilecek koç, düzeni kurup disiplini sağlayacak kararlılıkta olmalıdır.
                    </p>
                  )}
                  {selectedCandidate.classification === 'Kırmızı Bölge' && (
                    <p className="text-sm text-slate-300 leading-relaxed">
                      <strong>Kabul ve Eşleştirme Kararı:</strong> Adayda yüksek ders çalışma direnci veya derin bir motivasyon tıkanması söz konusudur. Koçluk sürecine kabul edilmeli ancak ilk aşamada yoğun akademik baskı yerine psikolojik/duygusal bariyer aşma odaklı başlanmalıdır.
                      <br /><br />
                      <strong>Yol Haritası:</strong> Akademik ödev yığınlarından önce, adayın hedefleri, kaygıları ve erteleme bahaneleri üzerine çalışılmalıdır. <strong>Haftalık hedefler küçük parçalara bölünmeli</strong> ve aday her küçük başarımında ödüllendirilmelidir. Eşleştirilecek koçun pedagojik hassasiyeti ve empati yeteneği en üst seviyede olmalıdır.
                    </p>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>

    {/* Yazdırılabilir Beyaz Rapor Tasarımı (Sadece Yazdırma Esnasında Gözükür) */}
    {selectedCandidate && (
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
            <p>{selectedCandidate.createdAt ? new Date(selectedCandidate.createdAt).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR')}</p>
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
            <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedCandidate.studentName}</p>
          </div>
          <div>
            <p className="text-slate-500 font-medium">Öğrenci E-posta Adresi:</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedCandidate.studentEmail}</p>
          </div>
        </div>

        {/* KPI Dashboard */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 text-center">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Öz-Disiplin Skoru</p>
            <p className="text-lg font-black text-slate-900 mt-1">{selectedCandidate.likertScore} / 75</p>
            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-blue-600 h-full" style={{ width: `${(selectedCandidate.likertScore / 75) * 100}%` }}></div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 text-center">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">AI Başarı Skoru</p>
            <p className="text-lg font-black text-slate-900 mt-1">
              {selectedCandidate.aiScore !== undefined ? selectedCandidate.aiScore : Math.round((selectedCandidate.likertScore / 75) * 100)} / 100
            </p>
            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-slate-800 h-full" style={{ width: `${selectedCandidate.aiScore !== undefined ? selectedCandidate.aiScore : Math.round((selectedCandidate.likertScore / 75) * 100)}%` }}></div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 text-center">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Koçluk Uyumluluğu</p>
            <p className="text-lg font-black text-emerald-600 mt-1">
              %{selectedCandidate.suitabilityScore || Math.round((selectedCandidate.likertScore / 75) * 100)}
            </p>
            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-emerald-600 h-full" style={{ width: `${selectedCandidate.suitabilityScore || Math.round((selectedCandidate.likertScore / 75) * 100)}%` }}></div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 text-center flex flex-col justify-between">
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Değerlendirme Bölgesi</p>
              <p className={`text-xs font-black mt-1 uppercase
                ${selectedCandidate.classification === 'Yeşil Bölge' ? 'text-emerald-600' : ''}
                ${selectedCandidate.classification === 'Sarı Bölge' ? 'text-amber-600' : ''}
                ${selectedCandidate.classification === 'Kırmızı Bölge' ? 'text-red-600' : ''}
              `}>
                {selectedCandidate.classification || 'Sarı Bölge'}
              </p>
            </div>
            <p className="text-[8px] text-slate-400 font-medium">
              {selectedCandidate.classification === 'Yeşil Bölge' && 'Performans Grubu'}
              {selectedCandidate.classification === 'Sarı Bölge' && 'İdeal Koçluk Adayı'}
              {selectedCandidate.classification === 'Kırmızı Bölge' && 'Direnç & Destek'}
            </p>
          </div>
        </div>

        {/* AI Analysis section */}
        <div className="border border-slate-200 rounded-xl p-5 mb-6 bg-slate-50/30">
          <h3 className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3 uppercase tracking-wider">
            Yapay Zeka Destekli Bütüncül Analiz Raporu
          </h3>
          <div className="text-slate-800 text-xs leading-relaxed space-y-3 prose max-w-none print:prose-sm">
            {selectedCandidate.aiReport ? (
              <Markdown>{selectedCandidate.aiReport}</Markdown>
            ) : (
              <p>
                {selectedCandidate.classification === 'Yeşil Bölge' && (
                  "Akademik öz-disiplininiz ve sorumluluk duygunuz oldukça gelişmiş durumda. Kendi koyduğunuz kurallara uyma, zamanı yönetme ve hedeflerinize yönelik içsel motivasyon seviyeniz takdire şayan. Koçluk sürecinde sizinle disiplin kurmaktan ziyade, deneme netlerini maksimuma çekme, zor soru analizleri ve sınav stratejileri üzerinde yoğunlaşacağız."
                )}
                {selectedCandidate.classification === 'Sarı Bölge' && (
                  "Harika bir potansiyele sahipsiniz! Hedeflerinizin farkındasınız ve başarma isteğiniz var; ancak bunu günlük rutine, planlamaya ve istikrarlı bir çalışmaya dökerken dış desteğe ihtiyaç duyuyorsunuz. Akademik koçunuz size bu planlama, sınır yönetimi ve sürdürülebilir motivasyon konularında yol göstererek potansiyelinizi tam kapasiteye ulaştıracaktır."
                )}
                {selectedCandidate.classification === 'Kırmızı Bölge' && (
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
            {Object.entries(getCategoryScores(selectedCandidate.likertAnswers)).map(([catName, data], idx) => {
              const pct = Math.round((data.score / data.max) * 100);
              return (
                <div key={idx} className="border border-slate-200 p-3 rounded-lg bg-slate-50/20 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <h4 className="font-bold text-slate-800">{catName}</h4>
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
    )}
  </>
);
}
