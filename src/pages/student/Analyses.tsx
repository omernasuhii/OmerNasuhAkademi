import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, Sparkles, ChevronRight, BookOpen, Target, Activity, BarChart3, 
  ShieldCheck, Clock, ShieldAlert, Zap, Users, Monitor, UserCheck, Candy, 
  Eye, Compass, Snowflake, Puzzle, Timer, IterationCcw, Layout, Trophy, 
  CheckCircle2, List, CheckSquare, Lock, Unlock, Award, Flame, X, 
  ArrowUpRight, HelpCircle, AlertCircle, Info, ArrowRight, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AnalysisResults from '../../components/profile/AnalysisResults';
import { useAuth } from '../../lib/AuthContext';
import { analysisService } from '../../services/analysisService';

export const analyses = [
  // Seviye 1 (0 - 1200 XP)
  {
    id: 'Ç-MOD',
    title: 'Ç-MOD: Çikolata Bankası',
    description: 'Ödül ekonomini yönet, iradeni güçlendir. Çalışarak kazan, hak ettiğinde harca.',
    icon: Candy,
    color: 'bg-amber-500',
    path: '/panel/ogrenci/analizler/c-mod'
  },
  {
    id: 'VAK-S',
    title: 'VAK-S: Öğrenme Stilleri',
    description: 'Bilgiyi en kolay nasıl öğrenirsin? Görsel, işitsel veya kinestetik profilini keşfet.',
    icon: Puzzle,
    color: 'bg-indigo-500',
    path: '/panel/ogrenci/analizler/vak-s'
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
    id: 'SP-BE',
    title: 'SP-BE: Stres Profili',
    description: 'Stres anındaki baskın tepkini (Volkan, Buzdağı, Halterci) ve rahatlama stratejilerini öğren.',
    icon: Activity,
    color: 'bg-rose-500',
    path: '/panel/ogrenci/analizler/sp-be'
  },

  // Seviye 2
  {
    id: 'ÇDÖ-E',
    title: 'ÇDÖ-E: Öz-Disiplin Envanteri',
    description: 'Çalışma alışkanlıklarını; planlama, süreklilik ve disiplin boyutlarında analiz et.',
    icon: UserCheck,
    color: 'bg-emerald-500',
    path: '/panel/ogrenci/analizler/cdo-e'
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
    id: 'OZ-AF',
    title: '360° Öz-Analiz ve Farkındalık',
    description: 'Akademik ve kişisel gelişimini SWOT ekseninde analiz et, metabilişsel süreçlerini yönet.',
    icon: Brain,
    color: 'bg-blue-500',
    path: '/panel/ogrenci/analizler/oz-af'
  },

  // Seviye 3
  {
    id: 'ADTE-20',
    title: 'ADTE-20: Odak ve Dikkat Yönetimi',
    description: 'Odaklanma sorununun kaynağını analiz et; motivasyon mu yoksa dikkat yönetimi mi olduğunu keşfet.',
    icon: Clock,
    color: 'bg-purple-500',
    path: '/panel/ogrenci/analizler/adte-20'
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
    id: 'ÇZ-8',
    title: 'ÇZ-8: Çoklu Zekâ Alanları',
    description: 'Baskın zekâ alanını keşfet, çalışma programını potansiyeline göre kişiselleştir.',
    icon: Brain,
    color: 'bg-indigo-500',
    path: '/panel/ogrenci/analizler/cz-8'
  },
  {
    id: 'DOPA',
    title: 'DOPA: Dikkat Analizi',
    description: 'Sıfır hata hedefinite ulaşmak için işlem hızı ve dikkat performansını analiz et.',
    icon: Eye,
    color: 'bg-cyan-500',
    path: '/panel/ogrenci/analizler/dopa'
  },

  // Seviye 4
  {
    id: 'SCM',
    title: 'SÇM: Sınav Check-Up',
    description: 'Hatalarının DNA\'sını çıkar: Bilgi mi, dikkat mi, yoksa strateji eksikliği mi?',
    icon: ShieldCheck,
    color: 'bg-amber-500',
    path: '/panel/ogrenci/analizler/scm'
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
    id: 'AYCE',
    title: 'AYÇE: Akademik Yetkinlik',
    description: 'Ders çalışma sürecindeki verimsizlik kaçaklarını tespit et, stratejik eksikliklerini keşfet.',
    icon: BookOpen,
    color: 'bg-orange-500',
    path: '/panel/ogrenci/analizler/ayce'
  },
  {
    id: 'SOC-A',
    title: 'SOÇ-A: Soru Okuma Analizi',
    description: 'Okuma ve çözüm stratejilerini analiz et, teknik hatalardan kaynaklanan net kayıplarını sıfırla.',
    icon: BookOpen,
    color: 'bg-indigo-500',
    path: '/panel/ogrenci/analizler/soc-a'
  },

  // Seviye 5
  {
    id: 'B-AVO',
    title: 'B-AVO: Anti-Virüs Modülü',
    description: 'Otomatik olumsuz düşünceleri (virüsleri) fark et, mantıklı alternatiflerle temizle.',
    icon: ShieldCheck,
    color: 'bg-emerald-500',
    path: '/panel/ogrenci/analizler/b-avo'
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
    id: 'ZS-ODO',
    title: 'ZS-ODÖ: Zihinsel Sabotaj',
    description: 'Akademik performansını sabote eden otomatik düşünceleri ve bilişsel çarpıtmaları temizle.',
    icon: Brain,
    color: 'bg-rose-600',
    path: '/panel/ogrenci/analizler/zs-odo'
  },
  {
    id: 'SI-GOZ',
    title: 'Sİ-GÖZ: Sihirli Gözlükler',
    description: 'Olaylara bakış açını değiştir, olumsuzluklardaki gizli fırsatları görmeyi öğren.',
    icon: Eye,
    color: 'bg-cyan-500',
    path: '/panel/ogrenci/analizler/si-goz'
  },

  // Seviye 6
  {
    id: 'APK-S',
    title: 'APK-S: Sınav Kaygısı ve Stresi',
    description: 'Bilişsel, fiziksel ve davranışsal belirtilerle sınav stresini analiz et, ketleyici boyutunu tespit et.',
    icon: Activity,
    color: 'bg-rose-500',
    path: '/panel/ogrenci/analizler/apk-s'
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
    id: 'AT-CM',
    title: 'AT-ÇM: Akıllı Tuş ve Çıpalama',
    description: 'Duygu kontrolü için nöro-psikolojik çıpalama tekniği ile kendine özel bir tetikleyici oluştur.',
    icon: Zap,
    color: 'bg-indigo-500',
    path: '/panel/ogrenci/analizler/at-cm'
  },
  {
    id: 'K-E-A',
    title: 'K-E-A: Kartopu Etkisi',
    description: 'Atalet prensibi ile başlangıç direncini kır, alışkanlıklarını inşa et.',
    icon: Snowflake,
    color: 'bg-cyan-500',
    path: '/panel/ogrenci/analizler/k-e-a'
  },

  // Seviye 7
  {
    id: 'AG-MOT',
    title: 'AG-MOT: Akademik Gelecek Beklentisi',
    description: 'Gelecek kaygısını, motivasyon blokajlarını ve bilişsel çarpıtmaları analiz eden ölçek.',
    icon: Target,
    color: 'bg-red-500',
    path: '/panel/ogrenci/analizler/ag-mot'
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
    id: 'AMID',
    title: 'AMİD: İnanç Değişim Protokolü',
    description: 'Kısıtlayıcı inançlarını (Genel yetenek, sözel/sayısal vb.) nöro-yazılım ayarlarıyla değiştir.',
    icon: Monitor,
    color: 'bg-violet-500',
    path: '/panel/ogrenci/analizler/amid'
  },
  {
    id: 'ABBA',
    title: 'ABBA: Aile, Benlik ve Akademik İnanç',
    description: 'Ebeveyn tutumlarını, öz-değerini ve akademik yeterlilik inancını dürüstçe ölçen envanter.',
    icon: Activity,
    color: 'bg-indigo-500',
    path: '/panel/ogrenci/analizler/abba'
  },

  // Seviye 8
  {
    id: 'APEA-3D',
    title: 'APEA-3D: Performans Engel Analizi',
    description: 'Başarı yolundaki engellerini keşfet; bilişsel, duygusal ve davranışsal boyutlarda kök nedenleri analiz et.',
    icon: ShieldAlert,
    color: 'bg-indigo-500',
    path: '/panel/ogrenci/analizler/apea-3d'
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
    id: 'HIRAT',
    title: 'HİRAT: Hedef İzleme ve Risk Analizi',
    description: 'Haftalık çalışma performansını verilerle analiz et, hedeften sapma oranını ve risklerini belirle.',
    icon: BarChart3,
    color: 'bg-emerald-500',
    path: '/panel/ogrenci/analizler/hirat'
  },
  {
    id: 'DART',
    title: 'DART: Hedef Yönetimi',
    description: 'Büyük hedefleri parçala, adımlarını takip et ve odaklan.',
    icon: Target,
    color: 'bg-rose-500',
    path: '/panel/ogrenci/analizler/dart'
  },

  // Seviye 9
  {
    id: 'MERCEK',
    title: 'MERCEK: Problem Çözme',
    description: 'Tünel bakışından çık, sorunlarını 6 farklı perspektifle yeniden çerçevele.',
    icon: Eye,
    color: 'bg-indigo-500',
    path: '/panel/ogrenci/analizler/mercek'
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
    id: 'MÇ-ZP',
    title: 'MÇ-ZP: Mükemmellik Çemberi',
    description: 'Özgüvenini sabitle, sınav anında zirve performansına anında geçiş yap.',
    icon: Zap,
    color: 'bg-yellow-500',
    path: '/panel/ogrenci/analizler/mukemmellik'
  },

  // Seviye 10
  {
    id: 'SD-SYE',
    title: 'SD-SYE: Sosyal Duruş ve Sınırlar',
    description: 'İletişim tarzını ve "hayır" diyebilme kapasiteni ölç, akademik sınırlarını koru.',
    icon: Users,
    color: 'bg-purple-500',
    path: '/panel/ogrenci/analizler/sd-sye'
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
    id: 'VGF-E',
    title: 'VGF-E: Veli Gözlem Envanteri',
    description: 'Ailenin seninle ilgili gözlemlerini analiz et, beklenti vs gerçeklik uyumunu gör.',
    icon: UserCheck,
    color: 'bg-emerald-500',
    path: '/panel/ogrenci/analizler/vgf-e'
  },
  {
    id: 'AB-CTE',
    title: 'AB-CTE: İçgörü Cümle Tamamlama',
    description: 'Ders çalışma, başarı ve gelecekle ilgili sansürsüz hislerini projektif yöntemlerle ortaya çıkar.',
    icon: BookOpen,
    color: 'bg-cyan-500',
    path: '/panel/ogrenci/analizler/ab-cte'
  },

  // Seviye 11
  {
    id: 'ADT-Ö',
    title: 'ADT-Ö: Branş Bazlı Tutum',
    description: 'Derslere karşı gizli dirençlerini ve önyargılarını branş bazında analiz et.',
    icon: BookOpen,
    color: 'bg-indigo-500',
    path: '/panel/ogrenci/analizler/adt-o'
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
    id: 'ZG-ZP',
    title: 'ZG-ZP: Zor Gün Senaryosu',
    description: 'Sınav günü krizlerine karşı Zafer Planı oluştur, sürprizlere hazırlıklı ol.',
    icon: Trophy,
    color: 'bg-yellow-600',
    path: '/panel/ogrenci/analizler/zg-zp'
  },
  {
    id: 'SZP-30',
    title: 'SZP-30: Son 30 Gün Virajı',
    description: 'Sınava bir ay kala zirve performans ve kriz yönetimi stratejini belirle.',
    icon: Timer,
    color: 'bg-red-500',
    path: '/panel/ogrenci/analizler/szp-30'
  },

  // Seviye 12
  {
    id: 'KLS',
    title: 'KLS: Kariyer Seçim Laboratuvarı',
    description: 'Puanına göre değil, yetenek ve değerlerine göre kariyer haritanı çıkar.',
    icon: Compass,
    color: 'bg-indigo-500',
    path: '/panel/ogrenci/analizler/kls'
  },
  {
    id: 'GTS-36',
    title: 'GTS-36: Tercih Simülasyonu',
    description: 'Sınav puanını değil "Hayat Puanını" maksimize et, tercih risklerini yönet.',
    icon: Compass,
    color: 'bg-indigo-500',
    path: '/panel/ogrenci/analizler/gts-36'
  }
];

// Automatically generate required XP (index * 600) for strict 600 XP progression
export const ANALYSIS_REQUIRED_XP: Record<string, { xp: number; index: number; levelName: string }> = {};

analyses.forEach((analysis, idx) => {
  const xpNeeded = idx * 600;
  ANALYSIS_REQUIRED_XP[analysis.id] = {
    xp: xpNeeded,
    index: idx,
    levelName: `${idx + 1}. Aşama (${xpNeeded} XP)`
  };
});

// Helper to calculate relative 600 XP level step progress
export const getLevelProgress = (idx: number, xp: number) => {
  if (idx <= 0) {
    return {
      baseXP: 0,
      targetCumulativeXP: 0,
      currentLevelXP: 0,
      targetLevelXP: 0,
      remainingXP: 0,
      percent: 100,
      isXPEnough: true
    };
  }
  const baseXP = (idx - 1) * 600;
  const targetCumulativeXP = idx * 600;
  const currentLevelXP = Math.min(600, Math.max(0, xp - baseXP));
  const remainingXP = Math.max(0, targetCumulativeXP - xp);
  const percent = Math.min(100, Math.round((currentLevelXP / 600) * 100));
  const isXPEnough = xp >= targetCumulativeXP;

  return {
    baseXP,
    targetCumulativeXP,
    currentLevelXP,
    targetLevelXP: 600,
    remainingXP,
    percent,
    isXPEnough
  };
};

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
const SILVER_ALLOWED_ANALYSES = ['Ç-MOD', 'VAK-S', 'SP-BE', 'SCM', 'ZS-ODO', 'APEA-3D', 'APK-S', 'ABBA', 'AID-Y', 'ADTE-20', 'OZ-AF'];

export default function Analyses() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked' | 'completed'>('all');
  const [activeTab, setActiveTab] = useState<'analizler' | 'tamamlananlar'>('analizler');
  const [completedCounts, setCompletedCounts] = useState<Record<string, number>>({ 'Ç-MOD': 1 });
  const [selectedLockedAnalysis, setSelectedLockedAnalysis] = useState<any | null>(null);

  const studentXP = userData?.xp || 0;

  // Helper to determine if an analysis is completed (Ç-MOD is automatically completed by default)
  const isAnalysisDone = (id: string) => {
    if (id === 'Ç-MOD') return true;
    return (completedCounts[id] || 0) > 0;
  };

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return;
      try {
        const results = (await analysisService.getResults(user.uid)).filter((r: any) => !['PARENT_REPORT', 'COACH_REPORT'].includes(r.analysisType));
        const counts: Record<string, number> = { 'Ç-MOD': 1 };
        results.forEach((r: any) => {
          counts[r.analysisType] = (counts[r.analysisType] || 0) + 1;
        });
        counts['Ç-MOD'] = Math.max(1, counts['Ç-MOD'] || 0);
        setCompletedCounts(counts);
      } catch (err) {
        console.error("Error fetching completed analyses:", err);
      }
    };
    fetchResults();
  }, [user]);

  // Find current active index (first uncompleted test in sequence)
  const currentActiveIndex = analyses.findIndex(a => !isAnalysisDone(a.id));

  // Find the target test for the top status banner:
  // If there's a test locked by XP, target the first test locked by XP, otherwise target currentActiveIndex
  const firstLockedByXPIndex = analyses.findIndex((_, idx) => studentXP < idx * 600);
  const targetTestIndex = firstLockedByXPIndex !== -1 
    ? firstLockedByXPIndex 
    : (currentActiveIndex === -1 ? analyses.length - 1 : currentActiveIndex);

  const targetTest = analyses[targetTestIndex];
  const targetProgress = getLevelProgress(targetTestIndex, studentXP);

  // Check how many tests are unlocked by XP (studentXP >= requiredXP)
  let unlockedCount = 0;
  analyses.forEach((analysis, idx) => {
    const reqXP = idx * 600;
    if (studentXP >= reqXP) {
      unlockedCount++;
    }
  });

  // Find the first uncompleted test in sequence that is currently unlocked and ready
  const firstAvailableUnlockedIndex = analyses.findIndex((a, idx) => {
    const reqXP = idx * 600;
    const isPrevDone = idx === 0 || isAnalysisDone(analyses[idx - 1].id);
    const isCompleted = isAnalysisDone(a.id);
    return studentXP >= reqXP && isPrevDone && !isCompleted;
  });
  const firstAvailableUnlockedTest = firstAvailableUnlockedIndex !== -1 ? analyses[firstAvailableUnlockedIndex] : null;

  const handleGoToPrevTest = () => {
    if (!selectedLockedAnalysis || !selectedLockedAnalysis.prevTest) return;

    const prevIdx = selectedLockedAnalysis.sequenceIndex - 1;
    if (prevIdx < 0) return;

    const prevAnalysis = analyses[prevIdx];
    const prevReqXP = prevIdx * 600;
    const prevCardProgress = getLevelProgress(prevIdx, studentXP);
    
    const grandPrevTest = prevIdx > 0 ? analyses[prevIdx - 1] : null;
    const isGrandPrevDone = prevIdx === 0 || isAnalysisDone(grandPrevTest?.id || '');
    const isPrevXPEnough = prevCardProgress.isXPEnough;

    const plan = userData?.subscriptionPlan || '';
    const isSilver = plan.includes('Gümüş');
    const isPrevLockedForSilver = isSilver && !SILVER_ALLOWED_ANALYSES.includes(prevAnalysis.id);

    const isPrevUnlocked = isPrevXPEnough && isGrandPrevDone && !isPrevLockedForSilver;

    if (isPrevUnlocked) {
      // Previous test is genuinely unlocked, navigate to it
      setSelectedLockedAnalysis(null);
      navigate(prevAnalysis.path);
    } else {
      // Previous test is ALSO locked! Update modal to show the lock reasons for the previous test
      setSelectedLockedAnalysis({
        ...prevAnalysis,
        sequenceIndex: prevIdx,
        reqXP: prevReqXP,
        cardProgress: prevCardProgress,
        prevTest: grandPrevTest,
        isPrevDone: isGrandPrevDone,
        isXPEnough: isPrevXPEnough
      });
    }
  };

  const lockedCount = analyses.length - unlockedCount;
  const completedTotal = Object.keys(completedCounts).filter(k => isAnalysisDone(k)).length;

  const filteredAnalyses = analyses.filter(analysis => {
    const category = categoryMap[analysis.id] || 'Genel Değerlendirme';
    const matchesCategory = selectedCategory === 'Tümü' || category === selectedCategory;
    const matchesSearch = analysis.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          analysis.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const idx = analyses.findIndex(a => a.id === analysis.id);
    const reqXP = idx * 600;
    const isXPEnough = studentXP >= reqXP;
    const isCompleted = isAnalysisDone(analysis.id);

    let matchesStatus = true;
    if (statusFilter === 'unlocked') matchesStatus = isXPEnough;
    if (statusFilter === 'locked') matchesStatus = !isXPEnough;
    if (statusFilter === 'completed') matchesStatus = isCompleted;

    return matchesCategory && matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest">
          <Sparkles size={14} className="animate-pulse text-amber-400" />
          Kişiselleştirilmiş Gelişim Rotası • 600 XP Adımlı Kilit Sistemi
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Zihinsel Performans & Kişilik Analizleri</h1>
        <p className="text-slate-400 font-medium max-w-3xl leading-relaxed text-sm sm:text-base">
          Her bir kişilik ve performans testi, haftalık ortalama <span className="text-amber-400 font-bold">600 XP</span> kazanımına ve <span className="text-emerald-400 font-bold">önceki testin tamamlanmış olmasına</span> bağlı olarak sırayla açılır. Koç müdahalesi olmadan kendi temponda ilerlersin.
        </p>
      </header>

      {/* XP & Level Status Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-blue-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          {/* Main Level & XP Gauge */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Flame size={14} className="text-amber-400 fill-amber-400" />
                Mevcut XP: {studentXP} XP
              </span>
              <span className="px-3 py-1 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Trophy size={14} className="text-blue-400" />
                Sıradaki Hedef: {targetTestIndex + 1}. Test ({targetTest?.title.split(':')[0]})
              </span>
              {currentActiveIndex !== -1 && currentActiveIndex < targetTestIndex && (
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Unlock size={14} className="text-emerald-400" />
                  {currentActiveIndex + 1}. Test Çözülmeye Hazır
                </span>
              )}
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                {currentActiveIndex === -1 
                  ? '🎉 Tüm Kişilik Testlerini Tamamladın!' 
                  : targetProgress.isXPEnough 
                    ? `Sıradaki Aktif Test: ${analyses[currentActiveIndex]?.title}`
                    : `Sıradaki Kilit: ${targetTest?.title}`}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
                {currentActiveIndex === -1 
                  ? 'Harika bir gelişim gösterdin! Tüm testler tamamlandı ve raporların oluşturuldu.'
                  : targetProgress.targetLevelXP === 0
                    ? 'İlk test başlangıç seviyesi olarak doğrudan erişime açıktır.'
                    : `Bu seviye kilit hedefi: 600 XP (Kazanılan: ${targetProgress.currentLevelXP} / 600 XP, Kalan: ${targetProgress.remainingXP} XP)`}
              </p>
            </div>

            {/* Progress Bar towards current target */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>Seviye Kilit İlerlemesi (%{targetProgress.percent})</span>
                <span className="text-amber-400">{targetProgress.currentLevelXP} / 600 XP</span>
              </div>
              <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-white/10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${targetProgress.percent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-amber-500 via-blue-500 to-emerald-400 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="lg:col-span-5 grid grid-cols-3 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center">
              <Unlock size={20} className="text-emerald-400 mb-1" />
              <span className="text-xl font-black text-white">{unlockedCount}</span>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Açık Test</span>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center">
              <Lock size={20} className="text-amber-400 mb-1" />
              <span className="text-xl font-black text-white">{lockedCount}</span>
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Kilitli Test</span>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center">
              <CheckCircle2 size={20} className="text-blue-400 mb-1" />
              <span className="text-xl font-black text-white">{completedTotal}</span>
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Tamamlanan</span>
            </div>
          </div>
        </div>

        {/* Info Tip Footer */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-blue-400 shrink-0" />
            <span><strong>Kilit Kuralları:</strong> 1) Her test için ortalama +600 XP gereklidir. 2) Bir sonraki testin açılması için bir önceki testin tamamlanması zorunludur.</span>
          </div>
          <button 
            onClick={() => navigate('/panel/ogrenci/kocluk')}
            className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold transition-colors"
          >
            Görev Çöz & XP Kazan <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Main Tabs (Analizler / Tamamlananlar) */}
      <div className="flex border-b border-white/5 pb-px gap-6">
        <button
          onClick={() => setActiveTab('analizler')}
          className={`flex items-center gap-2 pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors relative ${
            activeTab === 'analizler' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <List size={18} />
          Sıralı Gelişim Kataloğu ({analyses.length})
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
          Tamamlanan Raporlarım ({completedTotal})
          {activeTab === 'tamamlananlar' && (
            <motion.div layoutId="analysesTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
          )}
        </button>
      </div>

      {/* Arama, Kilit Durumu ve Kategori Filtreleme */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Analizlerde ara... (Örn: stres, odak, hedef, kaygı)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium text-sm"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === 'all' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tümü ({analyses.length})
            </button>
            <button
              onClick={() => setStatusFilter('unlocked')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
                statusFilter === 'unlocked' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <Unlock size={12} /> Açık ({unlockedCount})
            </button>
            <button
              onClick={() => setStatusFilter('locked')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
                statusFilter === 'locked' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <Lock size={12} /> Kilitli ({lockedCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
                statusFilter === 'completed' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-purple-400'
              }`}
            >
              <CheckCircle2 size={12} /> Biten ({completedTotal})
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
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

      {/* Main Grid Content */}
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
                  <AlertCircle size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-white">Sonuç Bulunamadı</h3>
                 <p className="text-slate-400 max-w-md mx-auto text-sm">
                   Aramanıza veya seçilen kilit filtresine uygun analiz bulunamadı.
                 </p>
                 <button 
                   onClick={() => { setSearchTerm(''); setSelectedCategory('Tümü'); setStatusFilter('all'); }}
                   className="mt-2 px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all"
                 >
                   Filtreleri Temizle
                 </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAnalyses.map((analysis, idx) => {
                  const sequenceIndex = analyses.findIndex(a => a.id === analysis.id);
                  const reqXP = sequenceIndex * 600;
                  const cardProgress = getLevelProgress(sequenceIndex, studentXP);
                  const prevTest = sequenceIndex > 0 ? analyses[sequenceIndex - 1] : null;
                  const isPrevDone = sequenceIndex === 0 || isAnalysisDone(prevTest?.id || '');
                  const isXPEnough = cardProgress.isXPEnough;

                  const plan = userData?.subscriptionPlan || '';
                  const isSilver = plan.includes('Gümüş');
                  const isLockedForSilver = isSilver && !SILVER_ALLOWED_ANALYSES.includes(analysis.id);

                  const isUnlocked = isXPEnough && isPrevDone && !isLockedForSilver;
                  const isCompleted = isAnalysisDone(analysis.id);

                  return (
                    <motion.div
                      key={analysis.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (idx % 12) * 0.03 }}
                      onClick={() => {
                        if (!isXPEnough || !isPrevDone) {
                          setSelectedLockedAnalysis({
                            ...analysis,
                            sequenceIndex,
                            reqXP,
                            cardProgress,
                            prevTest,
                            isPrevDone,
                            isXPEnough
                          });
                          return;
                        }
                        if (isLockedForSilver) {
                          alert("Bu analiz Altın Paket abonelerine özeldir. Paketinizi yükselterek bu analize erişebilirsiniz!");
                          return;
                        }
                        navigate(analysis.path);
                      }}
                      className={`group relative bg-slate-900/60 backdrop-blur-xl border rounded-[28px] p-6 text-left transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                        !isUnlocked 
                          ? 'border-amber-500/20 bg-slate-950/70 hover:border-amber-500/40 opacity-90' 
                          : 'border-white/10 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5'
                      }`}
                    >
                      {/* Sequence Badge Header */}
                      <div>
                        <div className="flex justify-between items-start w-full gap-2 mb-4">
                          <div className={`w-12 h-12 ${analysis.color}/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform duration-300 relative`}>
                            <analysis.icon size={24} />
                            {!isUnlocked && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg">
                                <Lock size={10} className="font-bold" />
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                              {sequenceIndex + 1}. Test
                            </span>

                            {/* Unlock Status Badge */}
                            {!isXPEnough ? (
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <Lock size={10} /> {cardProgress.currentLevelXP} / 600 XP
                              </span>
                            ) : !isPrevDone ? (
                              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <Lock size={10} /> Öncekini Çöz
                              </span>
                            ) : isLockedForSilver ? (
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <Lock size={10} /> Altın Paket
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <Unlock size={10} /> Açık
                              </span>
                            )}

                            {isCompleted && (
                              <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded-lg">
                                <CheckCircle2 size={11} />
                                <span className="text-[9px] font-bold">
                                  {analysis.id === 'Ç-MOD' ? 'Tamamlandı' : `${completedCounts[analysis.id] || 1}x Bitti`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-2">
                          <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                            {analysis.title}
                          </h3>
                          <p className="text-xs text-slate-400 leading-relaxed font-medium line-clamp-3">
                            {analysis.description}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Footer & Requirements */}
                      <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
                        {!isXPEnough && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                              <span>Seviye İlerlemesi (%{cardProgress.percent})</span>
                              <span className="text-amber-400">{cardProgress.currentLevelXP} / 600 XP</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                                style={{ width: `${cardProgress.percent}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {isXPEnough && !isPrevDone && prevTest && (
                          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-medium flex items-center justify-between">
                            <span className="truncate">Ön şart: {prevTest.title.split(':')[0]}</span>
                            <span className="font-bold text-rose-400 shrink-0 ml-1">Tamamlanmadı</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between w-full pt-1">
                          <span className="text-[10px] font-bold text-slate-400">
                            {sequenceIndex > 0 ? `Seviye Hedefi: 600 XP` : 'Başlangıç Testi'}
                          </span>
                          
                          {!isUnlocked ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:underline">
                              Kilidi Gör <Lock size={12} />
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 group-hover:translate-x-1 transition-transform">
                              {isCompleted ? (analysis.id === 'Ç-MOD' ? 'Banka & Ödülleri Yönet' : 'Tekrar Çöz') : 'Analize Başla'} <ChevronRight size={14} />
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
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

      {/* Locked Analysis Detail Modal */}
      <AnimatePresence>
        {selectedLockedAnalysis && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden"
            >
              <button
                onClick={() => setSelectedLockedAnalysis(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Lock size={28} />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                    {selectedLockedAnalysis.sequenceIndex + 1}. Sıradaki Test ({selectedLockedAnalysis.sequenceIndex * 600} XP Toplam)
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">{selectedLockedAnalysis.title}</h3>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                {selectedLockedAnalysis.description}
              </p>

              {/* Lock Conditions Check Panel */}
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2">
                  Kilit Açılma Şartları
                </h4>

                {/* Condition 1: XP Check */}
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    {selectedLockedAnalysis.isXPEnough ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : (
                      <X size={16} className="text-rose-400" />
                    )}
                    <span className={selectedLockedAnalysis.isXPEnough ? 'text-emerald-300' : 'text-slate-300'}>
                      1) 600 XP Seviye Hedefi
                    </span>
                  </div>
                  <span className={selectedLockedAnalysis.isXPEnough ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {selectedLockedAnalysis.cardProgress?.currentLevelXP || 0} / 600 XP
                  </span>
                </div>

                {/* Condition 2: Previous Test Check */}
                {selectedLockedAnalysis.prevTest && (
                  <div className="flex items-center justify-between text-xs font-bold pt-1">
                    <div className="flex items-center gap-2">
                      {selectedLockedAnalysis.isPrevDone ? (
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      ) : (
                        <X size={16} className="text-rose-400" />
                      )}
                      <span className={selectedLockedAnalysis.isPrevDone ? 'text-emerald-300' : 'text-slate-300'}>
                        2) Ön Şart Testi ({selectedLockedAnalysis.prevTest.title.split(':')[0]})
                      </span>
                    </div>
                    <span className={selectedLockedAnalysis.isPrevDone ? 'text-emerald-400' : 'text-rose-400'}>
                      {selectedLockedAnalysis.isPrevDone ? 'Tamamlandı' : 'Eksik'}
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons based on lock reason */}
              {!selectedLockedAnalysis.isPrevDone && selectedLockedAnalysis.prevTest ? (() => {
                const prevIdx = selectedLockedAnalysis.sequenceIndex - 1;
                const grandPrevTest = prevIdx > 0 ? analyses[prevIdx - 1] : null;
                const isGrandPrevDone = prevIdx <= 0 || isAnalysisDone(grandPrevTest?.id || '');
                const prevCardProgress = prevIdx >= 0 ? getLevelProgress(prevIdx, studentXP) : null;
                const isPrevXPEnough = prevCardProgress ? prevCardProgress.isXPEnough : false;

                const plan = userData?.subscriptionPlan || '';
                const isSilver = plan.includes('Gümüş');
                const isPrevLockedForSilver = isSilver && prevIdx >= 0 && !SILVER_ALLOWED_ANALYSES.includes(analyses[prevIdx].id);

                const isPrevUnlocked = isPrevXPEnough && isGrandPrevDone && !isPrevLockedForSilver;

                return (
                  <div className="space-y-3">
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 font-medium">
                      ⚠️ Bu testi açabilmek için öncelikle sıradaki test olan <strong>{selectedLockedAnalysis.prevTest.title}</strong> testini çözüp tamamlamalısınız!
                    </div>

                    {isPrevUnlocked ? (
                      <button
                        onClick={handleGoToPrevTest}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        Önceki Teste Başla ({selectedLockedAnalysis.prevTest.title.split(':')[0]}) <ArrowRight size={16} />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleGoToPrevTest}
                          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                        >
                          <Lock size={14} /> Önceki Testin Kilidini İncele ({selectedLockedAnalysis.prevTest.title.split(':')[0]}) <ArrowRight size={16} />
                        </button>

                        {firstAvailableUnlockedTest && (
                          <button
                            onClick={() => {
                              setSelectedLockedAnalysis(null);
                              navigate(firstAvailableUnlockedTest.path);
                            }}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                          >
                            <Unlock size={14} /> Şu An Açık Olan Teste Git ({firstAvailableUnlockedTest.title.split(':')[0]}) <ArrowRight size={16} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })() : !selectedLockedAnalysis.isXPEnough ? (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 font-medium">
                    💡 Kilidin açılmasına <strong>{selectedLockedAnalysis.cardProgress?.remainingXP || 600} XP</strong> kaldı. Günlük görev, kitap veya deneme ekleyerek XP biriktirebilirsin.
                  </div>
                  <button
                    onClick={() => {
                      setSelectedLockedAnalysis(null);
                      navigate('/panel/ogrenci/kocluk');
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    Görev Çöz & XP Kazan <ArrowUpRight size={16} />
                  </button>
                </div>
              ) : null}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedLockedAnalysis(null)}
                  className="w-full bg-white/5 hover:bg-white/10 text-slate-300 px-5 py-3 rounded-xl text-xs font-bold transition-all text-center"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
