import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, ChevronRight, BookOpen, Target, Activity, BarChart3, ShieldCheck, Clock, ShieldAlert, Zap, Users, Monitor, UserCheck, Candy, Eye, Compass, Snowflake, Puzzle, Timer, IterationCcw, Layout, Trophy, CheckCircle2, List, CheckSquare, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AnalysisResults from '../../components/profile/AnalysisResults';
import { useAuth } from '../../lib/AuthContext';
import { analysisService } from '../../services/analysisService';

export const analyses = [
  {
    id: 'VAK-S',
    title: 'VAK-S: Öğrenme Stilleri',
    description: 'Bilgiyi en kolay nasıl öğrenirsin? Görsel, işitsel veya kinestetik profilini keşfet.',
    icon: Puzzle,
    color: 'bg-indigo-500',
    path: '/panel/ogrenci/analizler/vak-s'
  },
  {
    id: 'SP-BE',
    title: 'SP-BE: Stres Profili',
    description: 'Stres anındaki baskın tepkini (Volkan, Buzdağı, Halterci) ve rahatlama stratejilerini öğren.',
    icon: Activity,
    color: 'bg-rose-500',
    path: '/panel/ogrenci/analizler/sp-be'
  },
  {
    id: 'PDAR-360',
    title: 'PDAR-360: Panoramik Deneme Analizi',
    description: 'Deneme sınavlarını bir Ar-Ge laboratuvarına dönüştür, gizli net kaçaklarını tespit et.',
    icon: BarChart3,
    color: 'bg-emerald-500',
    path: '/panel/ogrenci/analizler/pdar'
  },
  {
    id: 'SI-GOZ',
    title: 'Sİ-GÖZ: Sihirli Gözlükler',
    description: 'Olaylara bakış açını değiştir, olumsuzluklardaki gizli fırsatları görmeyi öğren.',
    icon: Eye,
    color: 'bg-cyan-500',
    path: '/panel/ogrenci/analizler/si-goz'
  },
  {
    id: 'SCM',
    title: 'SÇM: Sınav Check-Up',
    description: 'Hatalarının DNA\'sını çıkar: Bilgi mi, dikkat mi, yoksa strateji eksikliği mi?',
    icon: ShieldCheck,
    color: 'bg-amber-500',
    path: '/panel/ogrenci/analizler/scm'
  },
  {
    id: 'SS-DKM',
    title: 'SS-DKM: Sınav Sonrası Analiz',
    description: 'Sınav sonrası duygusal ve akademik hasar tespiti yap, doğru kararları ver.',
    icon: Compass,
    color: 'bg-blue-500',
    path: '/panel/ogrenci/analizler/ss-dkm'
  },
  {
    id: 'SZP-30',
    title: 'SZP-30: Son 30 Gün Virajı',
    description: 'Sınava bir ay kala zirve performans ve kriz yönetimi stratejini belirle.',
    icon: Timer,
    color: 'bg-red-500',
    path: '/panel/ogrenci/analizler/szp-30'
  },
  {
    id: 'SOC-A',
    title: 'SOÇ-A: Soru Okuma Analizi',
    description: 'Okuma ve çözüm stratejilerini analiz et, teknik hatalardan kaynaklanan net kayıplarını sıfırla.',
    icon: BookOpen,
    color: 'bg-indigo-500',
    path: '/panel/ogrenci/analizler/soc-a'
  },
  {
    id: 'SD-SYE',
    title: 'SD-SYE: Sosyal Duruş ve Sınırlar',
    description: 'İletişim tarzını ve "hayır" diyebilme kapasiteni ölç, akademik sınırlarını koru.',
    icon: Users,
    color: 'bg-purple-500',
    path: '/panel/ogrenci/analizler/sd-sye'
  },
  {
    id: 'SW-D',
    title: 'SW-D: SWISH İmaj Dönüştürme',
    description: 'Zihnindeki olumsuz görüntüleri anlık olarak pozitif olanlarla değiştirmeyi öğren.',
    icon: Zap,
    color: 'bg-fuchsia-500',
    path: '/panel/ogrenci/analizler/sw-d'
  },
  {
    id: 'TOTE',
    title: 'TOTE: Hedef ve Davranış Yönetimi',
    description: 'Hatalı stratejileri Loop\'ta yakala, hedefe ulaşana kadar sistemini optimize et.',
    icon: IterationCcw,
    color: 'bg-blue-600',
    path: '/panel/ogrenci/analizler/tote'
  },
  {
    id: 'VGF-E',
    title: 'VGF-E: Veli Gözlem Envanteri',
    description: 'Ailenin seninle ilgili gözlemlerini analiz et, beklenti vs gerçeklik uyumunu gör.',
    icon: UserCheck,
    color: 'bg-emerald-500',
    path: '/panel/ogrenci/analizler/vgf-e'
  },
  {
    id: 'WD-3D',
    title: 'WD-3D: Walt Disney Planlama',
    description: 'Hayalperest, Gerçekçi ve Eleştirmen rollerini kullanarak kusursuz planlar yap.',
    icon: Layout,
    color: 'bg-amber-600',
    path: '/panel/ogrenci/analizler/wd-3d'
  },
  {
    id: 'T-LINE',
    title: 'T-LINE: Zaman Çizgisi Motivasyonu',
    description: 'Geçmiş başarılarını bugüne taşı, gelecekteki hedefinle zihinsel bağını güçlendir.',
    icon: Compass,
    color: 'bg-indigo-600',
    path: '/panel/ogrenci/analizler/t-line'
  },
  {
    id: 'ZS-ODO',
    title: 'ZS-ODÖ: Zihinsel Sabotaj',
    description: 'Akademik performansını sabote eden otomatik düşünceleri ve bilişsel çarpıtmaları temizle.',
    icon: Brain,
    color: 'bg-rose-600',
    path: '/panel/ogrenci/analizler/zs-odo'
  },
  {
    id: 'ZG-ZP',
    title: 'ZG-ZP: Zor Gün Senaryosu',
    description: 'Sınav günü krizlerine karşı Zafer Planı oluştur, sürprizlere hazırlıklı ol.',
    icon: Trophy,
    color: 'bg-yellow-600',
    path: '/panel/ogrenci/analizler/zg-zp'
  },
  {
    id: 'ÖTI-A',
    title: 'ÖTI-A: Öğrenci Tanıma',
    description: 'Akademik durum, çalışma alışkanlıkları ve dijital bağımlılık haritanı bilimsel temellerle çıkar.',
    icon: UserCheck,
    color: 'bg-emerald-500',
    path: '/panel/ogrenci/analizler/oti'
  },
  {
    id: 'Ç-MOD',
    title: 'Ç-MOD: Çikolata Bankası',
    description: 'Ödül ekonomini yönet, iradeni güçlendir. Çalışarak kazan, hak ettiğinde harca. Banka müfettişi (AI) seni izliyor.',
    icon: Candy,
    color: 'bg-amber-500',
    path: '/panel/ogrenci/analizler/c-mod'
  },
  {
    id: 'OZ-AF',
    title: '360° Öz-Analiz ve Farkındalık Modülü',
    description: 'Akademik ve kişisel gelişimini SWOT ekseninde analiz et, metabilişsel süreçlerini yönet.',
    icon: Brain,
    color: 'bg-blue-500',
    path: '/panel/ogrenci/analizler/oz-af'
  },
  {
    id: 'ABBA',
    title: 'ABBA: Aile, Benlik ve Akademik İnanç',
    description: 'Ebeveyn tutumlarını, öz-değerini ve akademik yeterlilik inancını dürüstçe ölçen envanter.',
    icon: Activity,
    color: 'bg-indigo-500',
    path: '/panel/ogrenci/analizler/abba'
  },
  {
    id: 'AG-MOT',
    title: 'AG-MOT: Akademik Gelecek Beklentisi',
    description: 'Gelecek kaygısını, motivasyon blokajlarını ve bilişsel çarpıtmaları analiz eden ölçek.',
    icon: Target,
    color: 'bg-red-500',
    path: '/panel/ogrenci/analizler/ag-mot'
  },
  {
    id: 'HIRAT',
    title: 'HİRAT: Hedef İzleme ve Risk Analiz Tablosu',
    description: 'Haftalık çalışma performansını verilerle analiz et, hedeften sapma oranını ve risklerini belirle.',
    icon: BarChart3,
    color: 'bg-emerald-500',
    path: '/panel/ogrenci/analizler/hirat'
  },
  {
    id: 'AID-Y',
    title: 'AİD-Y: Akademik İnanç Dönüştürme',
    description: 'Akademik performansı sabote eden kök inançları tespit et ve zihinsel olarak yeniden yapılandır.',
    icon: ShieldCheck,
    color: 'bg-orange-500',
    path: '/panel/ogrenci/analizler/aid-y'
  },
  {
    id: 'ADTE-20',
    title: 'ADTE-20: Akademik Odak ve Dikkat Yönetimi',
    description: 'Odaklanma sorununun kaynağını analiz et; motivasyon mu yoksa dikkat yönetimi mi olduğunu keşfet.',
    icon: Clock,
    color: 'bg-purple-500',
    path: '/panel/ogrenci/analizler/adte-20'
  },
  {
    id: 'APEA-3D',
    title: 'APEA-3D: Akademik Performans Engel Analizi',
    description: 'Başarı yolundaki engellerini keşfet; bilişsel, duygusal ve davranışsal boyutlarda kök nedenleri analiz et.',
    icon: ShieldAlert,
    color: 'bg-indigo-500',
    path: '/panel/ogrenci/analizler/apea-3d'
  },
  {
    id: 'APK-S',
    title: 'APK-S: Sınav Kaygısı ve Stresi',
    description: 'Bilişsel, fiziksel ve davranışsal belirtilerle sınav stresini analiz et, ketleyici boyutunu tespit et.',
    icon: Activity,
    color: 'bg-rose-500',
    path: '/panel/ogrenci/analizler/apk-s'
  },
  {
    id: 'AB-CTE',
    title: 'AB-CTE: İçgörü Cümle Tamamlama',
    description: 'Ders çalışma, başarı ve gelecekle ilgili sansürsüz hislerini projektif yöntemlerle ortaya çıkar.',
    icon: BookOpen,
    color: 'bg-cyan-500',
    path: '/panel/ogrenci/analizler/ab-cte'
  },
  {
    id: 'AS-EQ',
    title: 'AS-EQ: Duygusal Zekâ Envanteri',
    description: 'Duygularını tanıma, yönetme ve stres anındaki kapasiteni akademik başarı perspektifinden değerlendir.',
    icon: Brain,
    color: 'bg-emerald-500',
    path: '/panel/ogrenci/analizler/aseq'
  },
  {
    id: 'AYCE',
    title: 'AYÇE: Akademik Yetkinlik ve Çalışma Stratejileri',
    description: 'Ders çalışma sürecindeki verimsizlik kaçaklarını tespit et, stratejik eksikliklerini keşfet.',
    icon: BookOpen,
    color: 'bg-orange-500',
    path: '/panel/ogrenci/analizler/ayce'
  },
  {
    id: 'AT-CM',
    title: 'AT-ÇM: Akıllı Tuş ve Çıpalama',
    description: 'Duygu kontrolü için nöro-psikolojik çıpalama tekniği ile kendine özel bir tetikleyici oluştur.',
    icon: Zap,
    color: 'bg-indigo-500',
    path: '/panel/ogrenci/analizler/at-cm'
  },
  {
    id: 'ADDE-20',
    title: 'ADDE-20: Aile Destek Ölçeği',
    description: 'Sınav hazırlık sürecinde ailenden aldığın akademik ve duygusal desteğin niteliğini tespit et.',
    icon: Users,
    color: 'bg-rose-500',
    path: '/panel/ogrenci/analizler/adde'
  },
  {
    id: 'B-AVO',
    title: 'B-AVO: Anti-Virüs Modülü',
    description: 'Otomatik olumsuz düşünceleri (virüsleri) fark et, mantıklı alternatiflerle temizle.',
    icon: ShieldCheck,
    color: 'bg-emerald-500',
    path: '/panel/ogrenci/analizler/b-avo'
  },
  {
    id: 'ADT-Ö',
    title: 'ADT-Ö: Branş Bazlı Tutum',
    description: 'Derslere karşı gizli dirençlerini ve önyargılarını branş bazında analiz et.',
    icon: BookOpen,
    color: 'bg-indigo-500',
    path: '/panel/ogrenci/analizler/adt-o'
  },
  {
    id: 'ÇDÖ-E',
    title: 'ÇDÖ-E: Öz-Disiplin Envanteri',
    description: 'Çalışma alışkanlıklarını; planlama, süreklilik ve disiplin boyutlarında analiz et.',
    icon: UserCheck,
    color: 'bg-emerald-500',
    path: '/panel/ogrenci/analizler/cdo-e'
  },
  {
    id: 'AMID',
    title: 'AMİD: İnanç Değişim Protokolü',
    description: 'Kısıtlayıcı inançlarını (Genel yetenek, sözel/sayısal vb.) nöro-yazılım ayarlarıyla değiştir.',
    icon: Monitor,
    color: 'bg-violet-500',
    path: '/panel/ogrenci/analizler/amid'
  },
  {
    id: 'İM-OM',
    title: 'İM-OM: Oto-Motivasyon',
    description: 'Erteleme hastalığını teşhis et, içsel motorunu çalıştıracak taktikleri öğren.',
    icon: Zap,
    color: 'bg-rose-500',
    path: '/panel/ogrenci/analizler/im-om'
  },
  {
    id: 'K-E-A',
    title: 'K-E-A: Kartopu Etkisi',
    description: 'Atalet prensibi ile başlangıç direncini kır, alışkanlıklarını inşa et.',
    icon: Snowflake,
    color: 'bg-cyan-500',
    path: '/panel/ogrenci/analizler/k-e-a'
  },
  {
    id: 'KOLB-DÖSE',
    title: 'KOLB: Öğrenme Stilleri',
    description: 'Teorik kitaplardan mı, yoksa deneme-yanılma yoluyla mı daha iyi öğrenirsin?',
    icon: Puzzle,
    color: 'bg-fuchsia-500',
    path: '/panel/ogrenci/analizler/kolb'
  },
  {
    id: 'MÇ-ZP',
    title: 'MÇ-ZP: Mükemmellik Çemberi',
    description: 'Özgüvenini sabitle, sınav anında zirve performansına anında geçiş yap.',
    icon: Zap,
    color: 'bg-yellow-500',
    path: '/panel/ogrenci/analizler/mukemmellik'
  },
  {
    id: 'MERCEK',
    title: 'MERCEK: Problem Çözme',
    description: 'Tünel bakışından çık, sorunlarını 6 farklı perspektifle yeniden çerçevele.',
    icon: Eye,
    color: 'bg-indigo-500',
    path: '/panel/ogrenci/analizler/mercek'
  },
  {
    id: 'GTS-36',
    title: 'GTS-36: Tercih Simülasyonu',
    description: 'Sınav puanını değil "Hayat Puanını" maksimize et, tercih risklerini yönet.',
    icon: Compass,
    color: 'bg-indigo-500',
    path: '/panel/ogrenci/analizler/gts-36'
  },
  {
    id: 'DART',
    title: 'DART: Hedef Yönetimi',
    description: 'Büyük hedefleri parçala, adımlarını takip et ve odaklan.',
    icon: Target,
    color: 'bg-rose-500',
    path: '/panel/ogrenci/analizler/dart'
  },
  {
    id: 'DOPA',
    title: 'DOPA: Dikkat Analizi',
    description: 'Sıfır hata hedefine ulaşmak için işlem hızı ve dikkat performansını analiz et.',
    icon: Eye,
    color: 'bg-cyan-500',
    path: '/panel/ogrenci/analizler/dopa'
  },
  {
    id: 'ÇZ-8',
    title: 'ÇZ-8: Çoklu Zekâ Alanları',
    description: 'Baskın zekâ alanını keşfet, çalışma programını potansiyeline göre kişiselleştir.',
    icon: Brain,
    color: 'bg-indigo-500',
    path: '/panel/ogrenci/analizler/cz-8'
  },
  {
    id: 'KLS',
    title: 'KLS: Kariyer Seçim Laboratuvarı',
    description: 'Puanına göre değil, yetenek ve değerlerine göre kariyer haritanı çıkar.',
    icon: Compass,
    color: 'bg-indigo-500',
    path: '/panel/ogrenci/analizler/kls'
  }
];

export const categoryMap: Record<string, string> = {
  'VAK-S': 'Öğrenme ve Odaklanma',
  'SP-BE': 'Psikoloji ve Motivasyon',
  'PDAR-360': 'Sınav ve Strateji Yönetimi',
  'SI-GOZ': 'Psikoloji ve Motivasyon',
  'SCM': 'Sınav ve Strateji Yönetimi',
  'SS-DKM': 'Sınav ve Strateji Yönetimi',
  'SZP-30': 'Sınav ve Strateji Yönetimi',
  'SOC-A': 'Sınav ve Strateji Yönetimi',
  'SD-SYE': 'Sınav ve Strateji Yönetimi',
  'SW-D': 'Psikoloji ve Motivasyon',
  'TOTE': 'Sınav ve Strateji Yönetimi',
  'VGF-E': 'Genel Değerlendirme',
  'WD-3D': 'Psikoloji ve Motivasyon',
  'T-LINE': 'Psikoloji ve Motivasyon',
  'ZS-ODO': 'Psikoloji ve Motivasyon',
  'ZG-ZP': 'Sınav ve Strateji Yönetimi',
  'ÖTI-A': 'Genel Değerlendirme',
  'Ç-MOD': 'Psikoloji ve Motivasyon',
  'OZ-AF': 'Genel Değerlendirme',
  'ABBA': 'Genel Değerlendirme',
  'AG-MOT': 'Psikoloji ve Motivasyon',
  'HIRAT': 'Sınav ve Strateji Yönetimi',
  'AID-Y': 'Psikoloji ve Motivasyon',
  'ADTE-20': 'Öğrenme ve Odaklanma',
  'APEA-3D': 'Sınav ve Strateji Yönetimi',
  'APK-S': 'Psikoloji ve Motivasyon',
  'AB-CTE': 'Psikoloji ve Motivasyon',
  'AS-EQ': 'Psikoloji ve Motivasyon',
  'AYCE': 'Sınav ve Strateji Yönetimi',
  'AT-CM': 'Psikoloji ve Motivasyon',
  'ADDE-20': 'Genel Değerlendirme',
  'B-AVO': 'Psikoloji ve Motivasyon',
  'ADT-Ö': 'Sınav ve Strateji Yönetimi',
  'ÇDÖ-E': 'Öğrenme ve Odaklanma',
  'AMID': 'Psikoloji ve Motivasyon',
  'İM-OM': 'Psikoloji ve Motivasyon',
  'K-E-A': 'Psikoloji ve Motivasyon',
  'KOLB-DÖSE': 'Öğrenme ve Odaklanma',
  'MÇ-ZP': 'Psikoloji ve Motivasyon',
  'MERCEK': 'Psikoloji ve Motivasyon',
  'GTS-36': 'Genel Değerlendirme',
  'DART': 'Sınav ve Strateji Yönetimi',
  'DOPA': 'Öğrenme ve Odaklanma',
  'ÇZ-8': 'Öğrenme ve Odaklanma',
  'KLS': 'Genel Değerlendirme'
};

const CATEGORIES = ['Tümü', 'Sınav ve Strateji Yönetimi', 'Psikoloji ve Motivasyon', 'Öğrenme ve Odaklanma', 'Genel Değerlendirme'];

const SILVER_ALLOWED_ANALYSES = ['VAK-S', 'SP-BE', 'SCM', 'ZS-ODO', 'APEA-3D', 'APK-S', 'ABBA', 'AID-Y', 'ADTE-20', 'OZ-AF'];

export default function Analyses() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [activeTab, setActiveTab] = useState<'analizler' | 'tamamlananlar'>('analizler');
  const [completedCounts, setCompletedCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return;
      try {
        const results = (await analysisService.getResults(user.uid)).filter((r: any) => !['PARENT_REPORT', 'COACH_REPORT'].includes(r.analysisType));
        const counts: Record<string, number> = {};
        results.forEach((r: any) => {
          counts[r.analysisType] = (counts[r.analysisType] || 0) + 1;
        });
        setCompletedCounts(counts);
      } catch (err) {
        console.error("Error fetching completed analyses:", err);
      }
    };
    fetchResults();
  }, [user]);

  const filteredAnalyses = analyses.filter(analysis => {
    const category = categoryMap[analysis.id] || 'Genel Değerlendirme';
    const matchesCategory = selectedCategory === 'Tümü' || category === selectedCategory;
    const matchesSearch = analysis.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          analysis.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
          <Sparkles size={12} />
          Öğrenci Analiz Laboratuvarı
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white">Zihinsel Performans Merkezi</h1>
        <p className="text-slate-400 font-medium max-w-2xl leading-relaxed">
          Burada kendine ayna tutman için bilimsel araştırmalara dayanan analizler bulacaksın. 
          <span className="block mt-2 text-amber-500/80 text-xs font-bold uppercase tracking-wider">
            ⚠️ Önemli Not: Bu testler bilimsel veriler ışığında hazırlanmış farkındalık araçlarıdır, klinik bir psikiyatrik veya psikolojik tanı koyma amacı gütmez.
          </span>
        </p>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-white/5 pb-px gap-6">
        <button
          onClick={() => setActiveTab('analizler')}
          className={`flex items-center gap-2 pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors relative ${
            activeTab === 'analizler' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <List size={18} />
          Analizler
          {activeTab === 'analizler' && (
            <motion.div layoutId="analysesTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('tamamlananlar')}
          className={`flex items-center gap-2 pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors relative ${
            activeTab === 'tamamlananlar' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <CheckSquare size={18} />
          Tamamlananlar
          {activeTab === 'tamamlananlar' && (
            <motion.div layoutId="analysesTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
          )}
        </button>
      </div>

      {/* Arama ve Filtreleme */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-4 sm:p-6 space-y-6">
        <div className="relative max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Analizlerde ara... (Örn: stres, odak, hedef)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 sm:py-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium text-sm sm:text-base"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                selectedCategory === category 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'analizler' && (
          <motion.div 
            key="analizler-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >

            {filteredAnalyses.length === 0 ? (
              <div className="bg-slate-900/50 border border-dashed border-white/10 rounded-[32px] p-12 flex flex-col items-center justify-center text-center gap-4">
                 <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-500 mb-2">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                 </div>
                 <h3 className="text-xl font-bold text-white">Sonuç Bulunamadı</h3>
                 <p className="text-slate-400 max-w-md mx-auto">
                   "{searchTerm}" aramasına ve seçilen kategoriye uygun analiz bulamadık. Lütfen farklı anahtar kelimeler deneyin.
                 </p>
                 <button 
                   onClick={() => { setSearchTerm(''); setSelectedCategory('Tümü'); }}
                   className="mt-4 px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all"
                 >
                   Filtreleri Temizle
                 </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAnalyses.map((analysis, idx) => {
                  const plan = userData?.subscriptionPlan || '';
                  const isSilver = plan.includes('Gümüş');
                  const isLockedForSilver = isSilver && !SILVER_ALLOWED_ANALYSES.includes(analysis.id);

                  return (
                    <motion.button
                      key={analysis.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (idx % 10) * 0.05 }}
                      onClick={() => {
                        if (isLockedForSilver) {
                          alert("Bu analiz sadece Altın Paket (Sınırsız Zirve VIP) abonelerine özeldir. Paketinizi yükselterek bu analize erişebilirsiniz!");
                          return;
                        }
                        navigate(analysis.path);
                      }}
                      className={`group relative bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 text-left hover:border-blue-500/30 transition-all duration-500 flex flex-col gap-6 ${isLockedForSilver ? 'opacity-50' : ''}`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <div className={`w-14 h-14 ${analysis.color}/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500`}>
                          <analysis.icon size={28} />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {isLockedForSilver ? (
                            <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg flex items-center gap-1 border border-amber-500/20">
                              <Lock size={10} /> Altın Paket
                            </span>
                          ) : categoryMap[analysis.id] && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-1 rounded-lg">
                              {categoryMap[analysis.id]?.split(' ')[0]}
                            </span>
                          )}
                          {completedCounts[analysis.id] > 0 && (
                            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg">
                              <CheckCircle2 size={12} />
                              <span className="text-[10px] font-bold">{completedCounts[analysis.id]}x Tamamlandı</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{analysis.title}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed font-medium">{analysis.description}</p>
                      </div>

                      <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/5 w-full">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          {isLockedForSilver ? 'Kilidi Aç' : 'Analize Başla'}
                        </span>
                        {isLockedForSilver ? (
                          <Lock size={16} className="text-amber-500" />
                        ) : (
                          <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'tamamlananlar' && (
          <motion.div
            key="tamamlananlar-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <AnalysisResults searchTerm={searchTerm} selectedCategory={selectedCategory} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
