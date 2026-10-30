import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStudent } from "../../lib/StudentContext";
import { useAuth } from "../../lib/AuthContext";
import { tourService } from "../../services/tourService";
import { OnboardingTour, TourStep } from "../../components/OnboardingTour";
import NoStudentSelected from "../../components/NoStudentSelected";
import { SAMPLE_DEMO_STUDENT } from "./CoachStudents";
import {
  Search,
  Info,
  BarChart2,
  PieChart as PieChartIcon,
  TrendingUp,
  AlertCircle,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCurriculum } from "../../lib/CurriculumContext";
import { SUBTOPICS as DEFAULT_SUBTOPICS } from "../../constants/subtopics";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";

// Domain model definitions
const EXAM_TYPES = ["TYT", "AYT", "YDT", "9. Sınıf", "10. Sınıf", "11. Sınıf"];

const CATEGORY_TO_BRANCH: Record<string, Record<string, string[]>> = {
  TYT: {
    Genel: [
      "Türkçe",
      "Sosyal Bilimler",
      "Temel Matematik",
      "Fen Bilimleri",
      "Türkçe (TYT)",
      "Temel Matematik (TYT)",
      "Sosyal Bilimler (TYT)",
      "Fen Bilimleri (TYT)",
      "Tarih (TYT)",
      "Coğrafya (TYT)",
      "Felsefe (TYT)",
      "Din (TYT)",
      "Geometri (TYT)",
      "Fizik (TYT)",
      "Kimya (TYT)",
      "Biyoloji (TYT)",
    ],
    Türkçe: ["Türkçe", "Türkçe (TYT)"],
    Matematik: ["Temel Matematik", "Temel Matematik (TYT)", "Geometri (TYT)"],
    Sosyal: [
      "Sosyal Bilimler",
      "Sosyal Bilimler (TYT)",
      "Tarih (TYT)",
      "Coğrafya (TYT)",
      "Felsefe (TYT)",
      "Din (TYT)",
    ],
    Fen: [
      "Fen Bilimleri",
      "Fen Bilimleri (TYT)",
      "Fizik (TYT)",
      "Kimya (TYT)",
      "Biyoloji (TYT)",
    ],
    "Grafik Analizi": [
      "Türkçe",
      "Sosyal Bilimler",
      "Temel Matematik",
      "Fen Bilimleri",
      "Türkçe (TYT)",
      "Temel Matematik (TYT)",
      "Sosyal Bilimler (TYT)",
      "Fen Bilimleri (TYT)",
      "Tarih (TYT)",
      "Coğrafya (TYT)",
      "Felsefe (TYT)",
      "Din (TYT)",
      "Geometri (TYT)",
      "Fizik (TYT)",
      "Kimya (TYT)",
      "Biyoloji (TYT)",
    ],
  },
  AYT: {
    Genel: [
      "Matematik",
      "Ed-Sos-1",
      "Sosyal-2",
      "Fen Bilimleri (AYT)",
      "Matematik (AYT)",
      "Edebiyat-Sosyal-1 (AYT)",
      "Sosyal-2 (AYT)",
      "Edebiyat (AYT)",
      "Tarih-1 (AYT)",
      "Coğrafya-1 (AYT)",
      "Tarih-2 (AYT)",
      "Coğrafya-2 (AYT)",
      "Felsefe Grubu (AYT)",
      "Din (Seçmeli) (AYT)",
      "Fizik (AYT)",
      "Kimya (AYT)",
      "Biyoloji (AYT)",
      "Geometri (AYT)",
    ],
    Matematik: ["Matematik", "Matematik (AYT)", "Geometri (AYT)"],
    "Sos-1": [
      "Ed-Sos-1",
      "Edebiyat-Sosyal-1 (AYT)",
      "Edebiyat (AYT)",
      "Tarih-1 (AYT)",
      "Coğrafya-1 (AYT)",
    ],
    "Sos-2": [
      "Sosyal-2",
      "Sosyal-2 (AYT)",
      "Tarih-2 (AYT)",
      "Coğrafya-2 (AYT)",
      "Felsefe Grubu (AYT)",
      "Din (Seçmeli) (AYT)",
    ],
    Fen: [
      "Fen Bilimleri (AYT)",
      "Fizik (AYT)",
      "Kimya (AYT)",
      "Biyoloji (AYT)",
    ],
    "Grafik Analizi": [
      "Matematik",
      "Ed-Sos-1",
      "Sosyal-2",
      "Fen Bilimleri (AYT)",
      "Matematik (AYT)",
      "Edebiyat-Sosyal-1 (AYT)",
      "Sosyal-2 (AYT)",
      "Edebiyat (AYT)",
      "Tarih-1 (AYT)",
      "Coğrafya-1 (AYT)",
      "Tarih-2 (AYT)",
      "Coğrafya-2 (AYT)",
      "Felsefe Grubu (AYT)",
      "Din (Seçmeli) (AYT)",
      "Fizik (AYT)",
      "Kimya (AYT)",
      "Biyoloji (AYT)",
      "Geometri (AYT)",
    ],
  },
  YDT: {
    Genel: [
      "İngilizce",
      "Almanca",
      "Fransızca",
      "Arapça",
      "Rusça",
      "Yabancı Dil",
      "İngilizce (YDT)",
      "Almanca (YDT)",
      "Fransızca (YDT)",
      "Arapça (YDT)",
      "Rusça (YDT)",
    ],
    İngilizce: ["İngilizce", "İngilizce (YDT)"],
    Almanca: ["Almanca", "Almanca (YDT)"],
    Fransızca: ["Fransızca", "Fransızca (YDT)"],
    Arapça: ["Arapça", "Arapça (YDT)"],
    Rusça: ["Rusça", "Rusça (YDT)"],
    "Grafik Analizi": [
      "İngilizce",
      "Almanca",
      "Fransızca",
      "Arapça",
      "Rusça",
      "Yabancı Dil",
      "İngilizce (YDT)",
      "Almanca (YDT)",
      "Fransızca (YDT)",
      "Arapça (YDT)",
      "Rusça (YDT)",
    ],
  },
  "9. Sınıf": {
    Genel: [
      "Türk Dili ve Edebiyatı",
      "Tarih",
      "Coğrafya",
      "Matematik",
      "Fizik",
      "Kimya",
      "Biyoloji",
      "Din Kültürü",
    ],
    "Türk Dili ve Edebiyatı": ["Türk Dili ve Edebiyatı"],
    Matematik: ["Matematik"],
    Fen: ["Fizik", "Kimya", "Biyoloji"],
    Sosyal: ["Tarih", "Coğrafya", "Din Kültürü"],
    "Grafik Analizi": [
      "Türk Dili ve Edebiyatı",
      "Tarih",
      "Coğrafya",
      "Matematik",
      "Fizik",
      "Kimya",
      "Biyoloji",
      "Din Kültürü",
    ],
  },
  "10. Sınıf": {
    Genel: [
      "Türk Dili ve Edebiyatı",
      "Tarih",
      "Coğrafya",
      "Matematik",
      "Fizik",
      "Kimya",
      "Biyoloji",
      "Din Kültürü",
    ],
    "Türk Dili ve Edebiyatı": ["Türk Dili ve Edebiyatı"],
    Matematik: ["Matematik"],
    Fen: ["Fizik", "Kimya", "Biyoloji"],
    Sosyal: ["Tarih", "Coğrafya", "Din Kültürü"],
    "Grafik Analizi": [
      "Türk Dili ve Edebiyatı",
      "Tarih",
      "Coğrafya",
      "Matematik",
      "Fizik",
      "Kimya",
      "Biyoloji",
      "Din Kültürü",
    ],
  },
  "11. Sınıf": {
    Genel: [
      "Türk Dili ve Edebiyatı",
      "Tarih",
      "Coğrafya",
      "Matematik",
      "Fizik",
      "Kimya",
      "Biyoloji",
      "Din Kültürü",
    ],
    "Türk Dili ve Edebiyatı": ["Türk Dili ve Edebiyatı"],
    Matematik: ["Matematik"],
    Fen: ["Fizik", "Kimya", "Biyoloji"],
    Sosyal: ["Tarih", "Coğrafya", "Din Kültürü"],
    "Grafik Analizi": [
      "Türk Dili ve Edebiyatı",
      "Tarih",
      "Coğrafya",
      "Matematik",
      "Fizik",
      "Kimya",
      "Biyoloji",
      "Din Kültürü",
    ],
  },
};

const CATEGORIES: Record<string, string[]> = {
  TYT: Object.keys(CATEGORY_TO_BRANCH["TYT"]),
  AYT: Object.keys(CATEGORY_TO_BRANCH["AYT"]),
  YDT: Object.keys(CATEGORY_TO_BRANCH["YDT"]),
  "9. Sınıf": Object.keys(CATEGORY_TO_BRANCH["9. Sınıf"]),
  "10. Sınıf": Object.keys(CATEGORY_TO_BRANCH["10. Sınıf"]),
  "11. Sınıf": Object.keys(CATEGORY_TO_BRANCH["11. Sınıf"]),
};

const SUB_CATEGORIES: Record<string, string[]> = {
  Türkçe: ["Genel", "Grafik Analizi"],
  "Türk Dili ve Edebiyatı": ["Genel", "Grafik Analizi"],
  İngilizce: ["Genel", "Grafik Analizi"],
  Almanca: ["Genel", "Grafik Analizi"],
  Fransızca: ["Genel", "Grafik Analizi"],
  Arapça: ["Genel", "Grafik Analizi"],
  Rusça: ["Genel", "Grafik Analizi"],
  Matematik: ["Genel", "Matematik", "Geometri", "Grafik Analizi"],
  Sosyal: [
    "Genel",
    "Tarih",
    "Coğrafya",
    "Felsefe",
    "Din Kültürü",
    "Grafik Analizi",
  ],
  "Sos-1": ["Genel", "Edebiyat", "Tarih-1", "Coğrafya-1", "Grafik Analizi"],
  "Sos-2": [
    "Genel",
    "Tarih-2",
    "Coğrafya-2",
    "Felsefe Grubu",
    "Din Kültürü",
    "Grafik Analizi",
  ],
  Fen: ["Genel", "Fizik", "Kimya", "Biyoloji", "Grafik Analizi"],
  "Grafik Analizi": ["Genel"],
};

const SAMPLE_EXAMS = [
  {
    id: 'deep-demo-1',
    examName: '3D TYT Genel Deneme-1',
    examType: 'TYT',
    date: '2026-03-01',
    totalNet: 88.5,
    scores: {
      'Türkçe': { c: 32, i: 5, n: '30.75' },
      'Temel Matematik': { c: 26, i: 4, n: '25.00' },
      'Sosyal Bilimler': { c: 16, i: 3, n: '15.25' },
      'Fen Bilimleri': { c: 18, i: 2, n: '17.50' }
    }
  },
  {
    id: 'deep-demo-2',
    examName: 'Bilgi Sarmal TYT Genel Deneme-2',
    examType: 'TYT',
    date: '2026-03-15',
    totalNet: 93.75,
    scores: {
      'Türkçe': { c: 34, i: 3, n: '33.25' },
      'Temel Matematik': { c: 28, i: 3, n: '27.25' },
      'Sosyal Bilimler': { c: 17, i: 2, n: '16.50' },
      'Fen Bilimleri': { c: 17, i: 1, n: '16.75' }
    }
  }
];

const SAMPLE_ANALYSES = [
  {
    examId: 'deep-demo-1',
    data: {
      'Türkçe': [
        { questionNo: 4, topic: 'Paragrafta Anlam', subtopic: 'Paragrafta Ana Düşünce', errorType: 'dikkat' },
        { questionNo: 12, topic: 'Yazım Kuralları', subtopic: 'Büyük Harflerin Kullanımı', errorType: 'bilgi' },
        { questionNo: 14, topic: 'Yazım Kuralları', subtopic: 'De ve Ki Yazımı', errorType: 'kalip' },
        { questionNo: 18, topic: 'Noktalama İşaretleri', subtopic: 'Noktalı Virgül ve İki Nokta', errorType: 'kalip' },
        { questionNo: 29, topic: 'Paragrafta Yapı', subtopic: 'Paragrafı İkiye Bölme', errorType: 'zaman' },
        { questionNo: 35, topic: 'Cümlede Anlam', subtopic: 'Örtülü Anlam', errorType: 'dikkat' }
      ],
      'Temel Matematik': [
        { questionNo: 8, topic: 'Üslü Sayılar', subtopic: 'Üslü Denklemler', errorType: 'dikkat' },
        { questionNo: 15, topic: 'Problemler (Hız)', subtopic: 'Zıt Yönlü Hareket', errorType: 'zaman' },
        { questionNo: 22, topic: 'Fonksiyonlar', subtopic: 'Bileşke Fonksiyon', errorType: 'bilgi' },
        { questionNo: 31, topic: 'Üçgende Açılar', subtopic: 'Açıortay Bağıntıları', errorType: 'kalip' }
      ],
      'Sosyal Bilimler': [
        { questionNo: 3, topic: 'Osmanlı Kuruluş Dönemi', subtopic: 'İskan ve Tımar Sistemi', errorType: 'bilgi' },
        { questionNo: 9, topic: 'İklim Bilgisi', subtopic: 'Basınç ve Rüzgarlar', errorType: 'kalip' },
        { questionNo: 14, topic: 'Ahlak Felsefesi', subtopic: 'Evrensel Ahlak İlkeleri', errorType: 'dikkat' }
      ],
      'Fen Bilimleri': [
        { questionNo: 2, topic: 'Kuvvet ve Hareket', subtopic: 'Newton Hareket Yasaları', errorType: 'kalip' },
        { questionNo: 11, topic: 'Asitler ve Bazlar', subtopic: 'pH ve Nötralleşme', errorType: 'bilgi' }
      ]
    }
  },
  {
    examId: 'deep-demo-2',
    data: {
      'Türkçe': [
        { questionNo: 8, topic: 'Paragrafta Anlam', subtopic: 'Paragrafta Yardımcı Düşünce', errorType: 'dikkat' },
        { questionNo: 11, topic: 'Yazım Kuralları', subtopic: 'Bitişik ve Ayrı Yazılan Kelimeler', errorType: 'dikkat' },
        { questionNo: 15, topic: 'Ses Bilgisi', subtopic: 'Ünlü Daralması ve Düşmesi', errorType: 'bilgi' },
        { questionNo: 31, topic: 'Paragrafta Yardımçı Düşünce', subtopic: 'Değinilmemiştir Soruları', errorType: 'zaman' }
      ],
      'Temel Matematik': [
        { questionNo: 12, topic: 'Problemler (Yüzde)', subtopic: 'Kar-Zarar Problemleri', errorType: 'zaman' },
        { questionNo: 19, topic: 'Polinomlar', subtopic: 'Kalan Teoremi', errorType: 'bilgi' },
        { questionNo: 33, topic: 'Çember ve Daire', subtopic: 'Çemberde Açı ve Teğet', errorType: 'kalip' }
      ]
    }
  }
];

export default function DeepAnalysis() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { curriculum, subtopics: curriculumSubtopics } = useCurriculum();
  const { selectedStudent, setSelectedStudent } = useStudent();
  const [selectedExamType, setSelectedExamType] = useState("TYT");
  const [selectedCategory, setSelectedCategory] = useState("Genel");
  const [selectedSubCategory, setSelectedSubCategory] = useState("Genel");
  const [includeBranchExams, setIncludeBranchExams] = useState(false);
  const [filterDateRange, setFilterDateRange] = useState("Tüm Zamanlar");
  const [filterKademe, setFilterKademe] = useState<"all" | "level1" | "level2">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isTourOpen, setIsTourOpen] = useState(false);

  const activeStudent = selectedStudent || (location.state?.startTour || location.state?.isDemo ? SAMPLE_DEMO_STUDENT : null);

  useEffect(() => {
    if (!selectedStudent && (location.state?.startTour || location.state?.isDemo)) {
      setSelectedStudent(SAMPLE_DEMO_STUDENT);
    }
  }, [selectedStudent, setSelectedStudent, location.state]);

  useEffect(() => {
    if (tourService.shouldAutoStartTour('student_deep_analysis', userData, location.state?.startTour)) {
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.state, userData]);

  const handleEndTour = () => {
    setIsTourOpen(false);
    tourService.markTourCompleted('student_deep_analysis', user?.uid);
  };

  const tourSteps: TourStep[] = [
    {
      targetId: 'tour-deep-analysis-header',
      title: 'Derin Analiz ve Teşhis Paneli',
      description: `${activeStudent?.displayName || 'Seçili öğrenci'} için sadece sınav netlerini değil; soru bazlı hata nedenlerini (Bilgi Eksikliği, Dikkat Hatası, Zaman Yetmezliği, Soru Kalıbı Eksikliği) mikro düzeyde teşhis edebileceğiniz yapay zeka ve istatistik merkezidir.`,
      position: 'bottom'
    },
    {
      targetId: 'tour-deep-analysis-exam-types',
      title: '1. Seviye Filtre: Sınav Türü Seçimi',
      description: 'TYT, AYT, YDT veya ara sınıf (9, 10, 11. Sınıf) kademeleri arasında tek tıkla geçiş yapabilirsiniz. Seçtiğiniz kademeye göre ders ve konu ağacı otomatik olarak filtrelenir.',
      position: 'bottom'
    },
    {
      targetId: 'tour-deep-analysis-filters',
      title: '2. Seviye Filtre: Zaman, Yayın & Hata Türü Teşhisi',
      description: 'Öğrencinin son 1, 3, 6 ay veya spesifik deneme yayınlarına özel hatalarını süzebilirsiniz. En kritik özellik olan "Hata Türü" filtresi ile örneğin sadece "Bilgi Eksikliği" veya "Dikkat Hatası" sorularına odaklanabilirsiniz.',
      position: 'bottom'
    },
    {
      targetId: 'tour-deep-analysis-categories',
      title: '3. Seviye Filtre: Ders & Konu Kırılımları',
      description: 'Türkçe, Matematik, Sosyal ve Fen ana sekmelerinden alt derslere ve konulara inebilir; branş denemelerini dahil etme seçeneğiyle analiz derinliğini artırabilirsiniz.',
      position: 'bottom'
    },
    {
      targetId: 'tour-deep-analysis-data-view',
      title: 'Çoklu Sebep Analizi ve Hata Kök Nedenleri',
      description: 'Aynı konu için birden fazla farklı sebeple hata teşhisi yapılmış olabilir. Örneğin: Öğrenci "Yazım Kuralları" konusundan hem "Bilgi Eksikliği" hem de "Soru Kalıp Eksikliği" veya "Dikkat Hatası" nedeniyle soru kaçırmış olabilir. Sistem her bir soru hatasını kendi özel kök nedeni altında oranlayarak raporlar.',
      position: 'top'
    },
    {
      targetId: 'tour-deep-analysis-data-view',
      title: 'Grafik Analizi ve Başarı Oranı Görselleştirme',
      description: 'Grafik Analizi sekmesi; yayın bazlı yapılan/yapılamayan soru dağılımları, derse göre başarı yüzdeleri ve konu tamamlama oranlarını görselleştiren dinamik grafik panellerinden oluşur.',
      position: 'top'
    }
  ];

  const handleStepChange = (stepIndex: number, currentStep: TourStep) => {
    if (currentStep.title.includes('Grafik Analizi')) {
      handleCategoryChange('Grafik Analizi');
    } else if (stepIndex < 5 && selectedCategory === 'Grafik Analizi') {
      handleCategoryChange('Genel');
    }
  };

  useEffect(() => {
    const branch = activeStudent?.branch || "";
    if (["9. Sınıf", "10. Sınıf", "11. Sınıf"].includes(branch)) {
      setSelectedExamType(branch);
      setSelectedCategory("Genel");
      setSelectedSubCategory("Genel");
    } else {
      setSelectedExamType("TYT");
      setSelectedCategory("Genel");
      setSelectedSubCategory("Genel");
    }
  }, [activeStudent?.uid, activeStudent?.branch]);

  // Publishers multi-select
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);
  const [isPublisherDropdownOpen, setIsPublisherDropdownOpen] = useState(false);

  const [filterErrorType, setFilterErrorType] = useState("Tümü");

  const [exams, setExams] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      if (activeStudent) {
        try {
          setLoading(true);
          const { studentDataService } =
            await import("../../services/studentDataService");
          const results = await studentDataService.getExamResults(
            activeStudent.uid,
          );
          const analysesData = await studentDataService.getStudentAnalyses(
            activeStudent.uid,
          );

          if (results && results.length > 0) {
            setExams(results);
          } else {
            setExams(isTourOpen ? SAMPLE_EXAMS : []);
          }

          if (analysesData && analysesData.length > 0) {
            setAnalyses(analysesData);
          } else {
            setAnalyses(isTourOpen ? SAMPLE_ANALYSES : []);
          }
        } catch (e) {
          console.error("Failed to fetch data", e);
          setExams(isTourOpen ? SAMPLE_EXAMS : []);
          setAnalyses(isTourOpen ? SAMPLE_ANALYSES : []);
        } finally {
          setLoading(false);
        }
      } else {
        setExams(isTourOpen ? SAMPLE_EXAMS : []);
        setAnalyses(isTourOpen ? SAMPLE_ANALYSES : []);
        setLoading(false);
      }
    };
    fetchData();
  }, [activeStudent?.uid, isTourOpen]);


  // Effect to reset child tabs when parent changes
  const handleExamTypeChange = (type: string) => {
    setSelectedExamType(type);
    setSelectedCategory("Genel");
    setSelectedSubCategory("Genel");
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === "Grafik Analizi") {
      setSelectedSubCategory("Grafik Analizi");
    } else {
      setSelectedSubCategory("Genel");
    }
  };

  const currentCategories = CATEGORIES[selectedExamType] || [];
  const currentSubCategories = SUB_CATEGORIES[selectedCategory] || [];

  // Data processing
  const examsFilteredByType = exams.filter((e) => {
    // Check exam type
    let isCorrectType: boolean;
    if (includeBranchExams && e.examType === "BRANŞ") {
      if (selectedExamType === "TYT" && e.examName?.includes("TYT"))
        isCorrectType = true;
      else if (selectedExamType === "AYT" && e.examName?.includes("AYT"))
        isCorrectType = true;
      else if (selectedExamType === "YDT" && e.examName?.includes("YDT"))
        isCorrectType = true;
      else isCorrectType = false;
    } else {
      isCorrectType = e.examType === selectedExamType || e.examType === "YKS";
    }
    return isCorrectType;
  });

  const computedAvailablePublishers = Array.from(
    new Set(
      examsFilteredByType.map((e) => e.examName || e.publisher).filter(Boolean),
    ),
  );

  let filteredExams = examsFilteredByType.filter((e) => {
    // Check publishers
    const nameOrPub = e.examName || e.publisher;
    if (
      selectedPublishers.length > 0 &&
      nameOrPub &&
      !selectedPublishers.includes(nameOrPub)
    )
      return false;

    // Check Date Range
    if (filterDateRange !== "Tüm Zamanlar") {
      if (filterDateRange === "Belirli Tarih Aralığı") {
        const d = (selectedExamType === 'AYT' || selectedExamType === 'YDT') && e.examType === 'YKS' ? (e.aytDate || e.date) : e.date;
        const date = new Date(d);
        if (startDate && date < new Date(startDate)) return false;
        // Set endDate to end of day
        if (endDate) {
          const ed = new Date(endDate);
          ed.setHours(23, 59, 59, 999);
          if (date > ed) return false;
        }
      } else {
        const cutoff = new Date();
        if (filterDateRange === "Son 1 Ay")
          cutoff.setMonth(cutoff.getMonth() - 1);
        if (filterDateRange === "Son 3 Ay")
          cutoff.setMonth(cutoff.getMonth() - 3);
        if (filterDateRange === "Son 6 Ay")
          cutoff.setMonth(cutoff.getMonth() - 6);
        if (new Date(e.date) < cutoff) return false;
      }
    }
    return true;
  });

  const validExamIds = new Set(filteredExams.map((e) => e.id));
  const filteredAnalyses = analyses.filter((a) => validExamIds.has(a.examId));

  // Determine allowed branches
  const branchesToLookAt =
    CATEGORY_TO_BRANCH[selectedExamType]?.[selectedCategory] || [];

  // Get valid topics if SubCategory is selected
  let validTopicsSet = new Set<string>();
  let useTopicFilter = false;

  if (selectedSubCategory !== "Genel") {
    useTopicFilter = true;
    let topicList: string[] = [];
    const prefix = selectedExamType; // TYT, AYT, YDT

    if (selectedSubCategory === "Türkçe") {
      topicList = [
        ...(curriculum["Türkçe"] || []),
        ...(curriculum["Paragraf"] || []),
      ];
    } else if (
      selectedSubCategory === "Tarih" ||
      selectedSubCategory === "Tarih-1" ||
      selectedSubCategory === "Tarih-2"
    ) {
      topicList =
        prefix === "AYT"
          ? curriculum["AYT Tarih"] || []
          : curriculum["TYT Tarih"] || curriculum["Tarih"] || [];
    } else if (
      selectedSubCategory === "Coğrafya" ||
      selectedSubCategory === "Coğrafya-1" ||
      selectedSubCategory === "Coğrafya-2"
    ) {
      topicList =
        prefix === "AYT"
          ? curriculum["AYT Coğrafya"] || []
          : curriculum["TYT Coğrafya"] || curriculum["Coğrafya"] || [];
    } else if (
      selectedSubCategory === "Felsefe" ||
      selectedSubCategory === "Felsefe Grubu"
    ) {
      topicList =
        prefix === "AYT"
          ? curriculum["Felsefe Grubu"] || []
          : curriculum["Felsefe"] || [];
    } else if (
      selectedSubCategory === "Din Kültürü" ||
      selectedSubCategory === "Din" ||
      selectedSubCategory === "Din (Seçmeli)"
    ) {
      topicList =
        prefix === "AYT"
          ? curriculum["AYT Din"] || []
          : curriculum["Din"] || [];
    } else if (selectedSubCategory === "Matematik") {
      topicList =
        prefix === "AYT"
          ? [
              ...(curriculum["Matematik"] || []),
              ...(curriculum["Geometri"] || []),
            ]
          : [
              ...(curriculum["TYT Matematik"] || curriculum["Matematik"] || []),
              ...(curriculum["Problem"] || []),
              ...(curriculum["Geometri"] || []),
            ];
    } else if (selectedSubCategory === "Geometri") {
      topicList = curriculum["Geometri"] || [];
    } else if (selectedSubCategory === "Fizik") {
      topicList =
        prefix === "AYT"
          ? curriculum["Fizik"] || []
          : curriculum["TYT Fizik"] || curriculum["Fizik"] || [];
    } else if (selectedSubCategory === "Kimya") {
      topicList =
        prefix === "AYT"
          ? curriculum["Kimya"] || []
          : curriculum["TYT Kimya"] || curriculum["Kimya"] || [];
    } else if (selectedSubCategory === "Biyoloji") {
      topicList =
        prefix === "AYT"
          ? curriculum["Biyoloji"] || []
          : curriculum["TYT Biyoloji"] || curriculum["Biyoloji"] || [];
    } else {
      // Generic mapping
      topicList = curriculum[selectedSubCategory] || [];
    }

    topicList.forEach((t) => validTopicsSet.add(t));
  }

  // Structure to hold aggregated errors by lesson
  const lessonAggregates: Record<
    string,
    {
      total: number;
      examIds: Set<string>;
      topics: Record<
        string,
        {
          types: Record<string, number>;
          total: number;
          subtopics: Record<
            string,
            {
              types: Record<string, number>;
              total: number;
            }
          >;
        }
      >;
    }
  > = {};
  let totalErrorsCount = 0;
  const involvedExamIds = new Set<string>();

  const getLessonByContext = (
    topic: string,
    questionNo: number,
    branch: string,
    isAyt: boolean,
    isYdt: boolean,
  ) => {
    const strictBranch = branch
      .replace(" (TYT)", "")
      .replace(" (AYT)", "")
      .replace(" (YDT)", "")
      .trim();

    // 1. Question number based mapping for conglomerate branches
    if (strictBranch === "Sosyal Bilimler") {
      if (questionNo <= 5) return "Tarih";
      if (questionNo <= 10) return "Coğrafya";
      if (questionNo <= 15) return "Felsefe";
      return "Din Kültürü";
    }
    if (strictBranch === "Fen Bilimleri") {
      if (isAyt) {
        if (questionNo <= 14) return "Fizik";
        if (questionNo <= 27) return "Kimya";
        return "Biyoloji";
      } else {
        if (questionNo <= 7) return "Fizik";
        if (questionNo <= 14) return "Kimya";
        return "Biyoloji";
      }
    }
    if (strictBranch === "Temel Matematik" || strictBranch === "Matematik") {
      if (questionNo > 30) return "Geometri";
      return "Matematik";
    }
    if (strictBranch === "Ed-Sos-1" || strictBranch === "Edebiyat-Sosyal-1") {
      if (questionNo <= 24) return "Edebiyat";
      if (questionNo <= 34) return "Tarih";
      return "Coğrafya";
    }
    if (strictBranch === "Sosyal-2") {
      if (questionNo <= 11) return "Tarih";
      if (questionNo <= 22) return "Coğrafya";
      if (questionNo <= 34) return "Felsefe Grubu";
      return "Din Kültürü";
    }

    // 2. Topic list based mapping
    for (const [lesson, topics] of Object.entries(curriculum)) {
      if (
        ["TYT", "AYT", "YDT", "YKS", "SAYISAL", "SÖZEL", "EA", "SAY"].includes(
          lesson,
        )
      )
        continue;

      if (Array.isArray(topics) && (topics as string[]).includes(topic)) {
        return lesson.replace("TYT ", "").replace("AYT ", "");
      }
    }

    // 3. Fallback to branch name
    const genericBranches = [
      "Sosyal Bilimler",
      "Fen Bilimleri",
      "Temel Matematik",
      "Matematik",
      "Ed-Sos-1",
      "Sosyal-2",
      "Edebiyat-Sosyal-1",
    ];
    if (!genericBranches.includes(strictBranch)) {
      return strictBranch;
    }

    return "Diğer Konular";
  };

  filteredAnalyses.forEach((analysis) => {
    if (!analysis.data) return;

    const isAyt =
      analysis.examType === "AYT" ||
      (analysis.examType === "BRANŞ" && analysis.examName?.includes("AYT"));
    const isYdt =
      analysis.examType === "YDT" ||
      (analysis.examType === "BRANŞ" && analysis.examName?.includes("YDT"));

    let examHasErrors = false;

    branchesToLookAt.forEach((branch) => {
      if (analysis.data[branch]) {
        analysis.data[branch].forEach((q: any) => {
          const mainTopic = (q.topic || "Belirtilmedi").trim();
          const subTopic = (q.subtopic || "").trim();

          // Determine lesson even if no error, to count exam
          const lesson = getLessonByContext(
            mainTopic,
            q.questionNo,
            branch,
            isAyt,
            isYdt,
          );
          if (!lessonAggregates[lesson]) {
            lessonAggregates[lesson] = {
              total: 0,
              examIds: new Set(),
              topics: {},
            };
          }

          // If we are filtering by SubCategory topics, and this topic doesn't match, we might not count it
          if (useTopicFilter && !validTopicsSet.has(mainTopic)) return;

          // Count this exam for this lesson
          lessonAggregates[lesson].examIds.add(analysis.examId);

          if (q.errorType && q.errorType !== "none") {
            // Filter by errorType dropdown
            if (filterErrorType !== "Tümü" && q.errorType !== filterErrorType)
              return;

            examHasErrors = true;

            if (!lessonAggregates[lesson].topics[mainTopic]) {
              lessonAggregates[lesson].topics[mainTopic] = {
                types: {},
                total: 0,
                subtopics: {},
              };
            }

            const currentTopic = lessonAggregates[lesson].topics[mainTopic];
            currentTopic.types[q.errorType] =
              (currentTopic.types[q.errorType] || 0) + 1;
            currentTopic.total = (currentTopic.total || 0) + 1;

            if (subTopic) {
              if (!currentTopic.subtopics[subTopic]) {
                currentTopic.subtopics[subTopic] = {
                  types: {},
                  total: 0,
                };
              }
              currentTopic.subtopics[subTopic].types[q.errorType] =
                (currentTopic.subtopics[subTopic].types[q.errorType] || 0) + 1;
              currentTopic.subtopics[subTopic].total =
                (currentTopic.subtopics[subTopic].total || 0) + 1;
            }

            lessonAggregates[lesson].total++;
            totalErrorsCount++;
          }
        });
      }
    });

    if (examHasErrors) {
      involvedExamIds.add(analysis.examId);
    }
  });

  // Convert to array for rendering and sort by total errors
  const lessonsSummary = Object.keys(lessonAggregates)
    .filter((lesson) => lessonAggregates[lesson].total > 0)
    .map((lesson) => {
      const { total, examIds, topics: rawTopics } = lessonAggregates[lesson];

      const topics = Object.keys(rawTopics)
        .map((topic) => {
          const topicObj = rawTopics[topic];
          const subtopicsList = Object.keys(topicObj.subtopics || {})
            .map((stName) => ({
              subtopic: stName,
              total: topicObj.subtopics[stName].total,
              types: topicObj.subtopics[stName].types,
            }))
            .sort((a, b) => b.total - a.total);

          return {
            topic,
            types: topicObj.types,
            total: topicObj.total,
            subtopics: subtopicsList,
          };
        })
        .sort((a, b) => b.total - a.total);

      return { lesson, total, examCount: examIds.size, topics };
    })
    .sort((a, b) => b.total - a.total);

  // Simpler to just map through errorAggregates directly. Let's rebuild a hierarchical list from valid filtered analyses for Genel
  const errorAggregates: Record<
    string,
    {
      types: Record<string, number>;
      total: number;
      lesson: string;
      subtopics: Record<string, { types: Record<string, number>; total: number }>;
    }
  > = {};

  const allSubtopicsAggregates: Record<
    string,
    {
      subtopic: string;
      parentTopic: string;
      lesson: string;
      types: Record<string, number>;
      total: number;
    }
  > = {};

  filteredAnalyses.forEach((analysis) => {
    if (!analysis.data) return;

    const isAyt =
      analysis.examType === "AYT" ||
      (analysis.examType === "BRANŞ" && analysis.examName?.includes("AYT"));
    const isYdt =
      analysis.examType === "YDT" ||
      (analysis.examType === "BRANŞ" && analysis.examName?.includes("YDT"));

    branchesToLookAt.forEach((branch) => {
      if (analysis.data[branch]) {
        analysis.data[branch].forEach((q: any) => {
          if (q.errorType && q.errorType !== "none") {
            const mainTopic = (q.topic || "Belirtilmedi").trim();
            const subTopic = (q.subtopic || "").trim();

            if (filterErrorType !== "Tümü" && q.errorType !== filterErrorType)
              return;
            if (useTopicFilter && !validTopicsSet.has(mainTopic)) return;

            const lesson = getLessonByContext(
              mainTopic,
              q.questionNo,
              branch,
              isAyt,
              isYdt,
            );

            if (!errorAggregates[mainTopic]) {
              errorAggregates[mainTopic] = {
                types: {},
                total: 0,
                lesson,
                subtopics: {},
              };
            }
            errorAggregates[mainTopic].types[q.errorType] =
              (errorAggregates[mainTopic].types[q.errorType] || 0) + 1;
            errorAggregates[mainTopic].total++;

            if (subTopic) {
              if (!errorAggregates[mainTopic].subtopics[subTopic]) {
                errorAggregates[mainTopic].subtopics[subTopic] = {
                  types: {},
                  total: 0,
                };
              }
              errorAggregates[mainTopic].subtopics[subTopic].types[q.errorType] =
                (errorAggregates[mainTopic].subtopics[subTopic].types[q.errorType] || 0) + 1;
              errorAggregates[mainTopic].subtopics[subTopic].total++;

              const subKey = `${mainTopic}___${subTopic}`;
              if (!allSubtopicsAggregates[subKey]) {
                allSubtopicsAggregates[subKey] = {
                  subtopic: subTopic,
                  parentTopic: mainTopic,
                  lesson,
                  types: {},
                  total: 0,
                };
              }
              allSubtopicsAggregates[subKey].types[q.errorType] =
                (allSubtopicsAggregates[subKey].types[q.errorType] || 0) + 1;
              allSubtopicsAggregates[subKey].total++;
            }
          }
        });
      }
    });
  });

  const topicsSummary = Object.keys(errorAggregates)
    .map((topic) => {
      const item = errorAggregates[topic];
      const subtopicsList = Object.keys(item.subtopics || {})
        .map((st) => ({
          subtopic: st,
          total: item.subtopics[st].total,
          types: item.subtopics[st].types,
        }))
        .sort((a, b) => b.total - a.total);

      return {
        topic,
        types: item.types,
        total: item.total,
        lesson: item.lesson,
        subtopics: subtopicsList,
      };
    })
    .sort((a, b) => b.total - a.total);

  const subtopicsRankSummary = Object.values(allSubtopicsAggregates).sort(
    (a, b) => b.total - a.total,
  );

  // Data for Charts
  const errorTypeChartData = useMemo(() => {
    const counts: Record<string, number> = {
      bilgi: 0,
      kalip: 0,
      dikkat: 0,
      zaman: 0,
    };
    filteredAnalyses.forEach((analysis) => {
      if (!analysis.data) return;
      branchesToLookAt.forEach((branch) => {
        if (analysis.data[branch]) {
          analysis.data[branch].forEach((q: any) => {
            if (q.errorType && q.errorType !== "none") {
              if (counts.hasOwnProperty(q.errorType)) {
                counts[q.errorType]++;
              }
            }
          });
        }
      });
    });
    return [
      { name: "Bilgi Eksikliği", value: counts.bilgi, color: "#10b981" },
      { name: "Soru Kalıbı", value: counts.kalip, color: "#3b82f6" },
      { name: "Dikkat Hatası", value: counts.dikkat, color: "#f59e0b" },
      { name: "Zaman Hatası", value: counts.zaman, color: "#ef4444" },
    ].filter((d) => d.value > 0);
  }, [filteredAnalyses, branchesToLookAt]);

  const lessonErrorChartData = useMemo(() => {
    return lessonsSummary
      .map((l) => ({
        name: l.lesson,
        Hata: l.total,
      }))
      .slice(0, 8);
  }, [lessonsSummary]);

  const getScoreTuple = (
    exam: any,
    branchName: string,
    analysisBranchArray: any[],
  ) => {
    const safeBranchArray = Array.isArray(analysisBranchArray) ? analysisBranchArray : [];
    let c = 0;
    const pureName = branchName
      .replace(" (TYT)", "")
      .replace(" (AYT)", "")
      .replace(" (YDT)", "")
      .trim();
    const possibleNames = [
      branchName,
      pureName,
      branchName + " Denemesi",
      pureName + " Denemesi",
      branchName === "Temel Matematik" ? "Matematik" : null,
      branchName === "Matematik" ? "Temel Matematik" : null,
      branchName === "Fen Bilimleri" ? "Fen" : null,
      branchName === "Sosyal Bilimler" ? "Sosyal" : null,
    ].filter(Boolean) as string[];

    let scoreFound = false;
    if (exam && exam.scores) {
      for (const pn of possibleNames) {
        if (exam.scores[pn]) {
          c = Number(exam.scores[pn].c) || 0;
          scoreFound = true;
          break;
        }
      }
    }

    if (!scoreFound && exam && exam.examType === "BRANŞ" && exam.scores) {
      const keys = Object.keys(exam.scores);
      if (keys.length === 1) {
        c = Number(exam.scores[keys[0]].c) || 0;
        scoreFound = true;
      }
    }
    const max = safeBranchArray.length;
    if (scoreFound) {
      return { yapilan: c, yapilamayan: Math.max(0, max - c) };
    }

    let yapilanFallback = 0;
    let yapilamayanFallback = 0;
    safeBranchArray.forEach((q: any) => {
      if (q && q.errorType && q.errorType !== "none") yapilamayanFallback++;
      else yapilanFallback++;
    });
    return { yapilan: yapilanFallback, yapilamayan: yapilamayanFallback };
  };

  const publisherChartData = useMemo(() => {
    const dataMap: Record<
      string,
      { publisher: string; Yapılan: number; Yapılamayan: number }
    > = {};
    filteredExams.forEach((exam) => {
      const pub = exam.publisher || exam.examName || "Bilinmiyor";
      if (!dataMap[pub]) {
        dataMap[pub] = { publisher: pub, Yapılan: 0, Yapılamayan: 0 };
      }
      const analysis = filteredAnalyses.find((a) => a.examId === exam.id);
      if (analysis?.data) {
        branchesToLookAt.forEach((branch) => {
          if (analysis.data[branch]) {
            const { yapilan, yapilamayan } = getScoreTuple(
              exam,
              branch,
              analysis.data[branch],
            );
            dataMap[pub].Yapılan += yapilan;
            dataMap[pub].Yapılamayan += yapilamayan;
          }
        });
      }
    });
    return Object.values(dataMap);
  }, [filteredExams, filteredAnalyses, branchesToLookAt]);

  const lessonCompareChartData = useMemo(() => {
    const dataMap: Record<
      string,
      { lesson: string; Yapılan: number; Yapılamayan: number }
    > = {};
    filteredExams.forEach((exam) => {
      const analysis = filteredAnalyses.find((a) => a.examId === exam.id);
      if (analysis?.data) {
        branchesToLookAt.forEach((branch) => {
          if (analysis.data[branch]) {
            // conglomerate branches breakdown
            const isMajor = [
              "Sosyal Bilimler",
              "Fen Bilimleri",
              "Sosyal Bilimler (TYT)",
              "Fen Bilimleri (TYT)",
              "Sosyal-2",
              "Sosyal-2 (AYT)",
              "Temel Matematik",
              "Matematik",
              "Ed-Sos-1",
              "Edebiyat-Sosyal-1",
            ].includes(branch);

            if (isMajor) {
              analysis.data[branch].forEach((q: any) => {
                const isAyt = branch.includes("AYT");
                const isYdt = branch.includes("YDT");
                const lesson = getLessonByContext(
                  q.topic,
                  q.questionNo,
                  branch,
                  isAyt,
                  isYdt,
                );
                const cleanLesson = lesson
                  .replace("TYT ", "")
                  .replace("AYT ", "")
                  .replace("YDT ", "");

                if (!dataMap[cleanLesson]) {
                  dataMap[cleanLesson] = {
                    lesson: cleanLesson,
                    Yapılan: 0,
                    Yapılamayan: 0,
                  };
                }
                if (q.errorType && q.errorType !== "none") {
                  dataMap[cleanLesson].Yapılamayan++;
                } else {
                  dataMap[cleanLesson].Yapılan++;
                }
              });
            } else {
              const lessonName = branch
                .replace(" (TYT)", "")
                .replace(" (AYT)", "")
                .replace(" (YDT)", "");
              if (!dataMap[lessonName]) {
                dataMap[lessonName] = {
                  lesson: lessonName,
                  Yapılan: 0,
                  Yapılamayan: 0,
                };
              }
              const { yapilan, yapilamayan } = getScoreTuple(
                exam,
                branch,
                analysis.data[branch],
              );
              dataMap[lessonName].Yapılan += yapilan;
              dataMap[lessonName].Yapılamayan += yapilamayan;
            }
          }
        });
      }
    });
    return Object.values(dataMap)
      .map((item) => {
        const total = item.Yapılan + item.Yapılamayan;
        return {
          ...item,
          SuccessRate:
            total > 0 ? Number(((item.Yapılan / total) * 100).toFixed(1)) : 0,
        };
      })
      .sort((a, b) => b.SuccessRate - a.SuccessRate);
  }, [filteredExams, filteredAnalyses, branchesToLookAt]);

  const completionChartData = useMemo(() => {
    let toplamyapilan = 0;
    let topologyapilamayan = 0;
    filteredExams.forEach((exam) => {
      const analysis = filteredAnalyses.find((a) => a.examId === exam.id);
      if (analysis?.data) {
        branchesToLookAt.forEach((branch) => {
          if (analysis.data[branch]) {
            const { yapilan, yapilamayan } = getScoreTuple(
              exam,
              branch,
              analysis.data[branch],
            );
            toplamyapilan += yapilan;
            topologyapilamayan += yapilamayan;
          }
        });
      }
    });
    return [
      { name: "Yapılan", value: toplamyapilan, fill: "#10b981" },
      { name: "Yapılamayan", value: topologyapilamayan, fill: "#ef4444" },
    ];
  }, [filteredExams, filteredAnalyses, branchesToLookAt]);

  const questionNumberChartData = useMemo(() => {
    const counts: Record<number, number> = {};
    filteredAnalyses.forEach((analysis) => {
      if (analysis?.data) {
        branchesToLookAt.forEach((branch) => {
          if (analysis.data[branch]) {
            analysis.data[branch].forEach((q: any) => {
              if (q.errorType && q.errorType !== "none") {
                counts[q.questionNo] = (counts[q.questionNo] || 0) + 1;
              }
            });
          }
        });
      }
    });
    const maxQ = Math.max(...Object.keys(counts).map(Number), 0);
    const data = [];
    for (let i = 1; i <= maxQ; i++) {
      data.push({ questionNo: i, Hata: counts[i] || 0 });
    }
    return data;
  }, [filteredAnalyses, branchesToLookAt]);

  const questionErrorTableData = useMemo(() => {
    const list: any[] = [];
    filteredExams.forEach((exam) => {
      const analysis = filteredAnalyses.find((a) => a.examId === exam.id);
      if (analysis?.data) {
        branchesToLookAt.forEach((branch) => {
          if (analysis.data[branch]) {
            analysis.data[branch].forEach((q: any) => {
              if (q.errorType && q.errorType !== "none") {
                list.push({
                  examName: exam.examName || exam.publisher || "Bilinmeyen",
                  date: new Date(exam.date).toLocaleDateString("tr-TR"),
                  lesson: branch.replace(" (TYT)", "").replace(" (AYT)", ""),
                  questionNo: q.questionNo,
                  topic: q.topic || "Belirtilmedi",
                  subtopic: q.subtopic || "-",
                  errorType: q.errorType,
                });
              }
            });
          }
        });
      }
    });
    return list.sort((a, b) => {
      const dateA = a.date.split(".").reverse().join("-");
      const dateB = b.date.split(".").reverse().join("-");
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [filteredExams, filteredAnalyses, branchesToLookAt]);

  const timelineChartData = useMemo(() => {
    const sortedExams = [...filteredExams].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return sortedExams
      .map((exam) => {
        const analysis = filteredAnalyses.find((a) => a.examId === exam.id);
        let errorCount = 0;
        if (analysis?.data) {
          branchesToLookAt.forEach((branch) => {
            if (analysis.data[branch]) {
              analysis.data[branch].forEach((q: any) => {
                if (q.errorType && q.errorType !== "none") errorCount++;
              });
            }
          });
        }
        return {
          date: new Date(exam.date).toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "2-digit",
          }),
          Hata: errorCount,
          name: exam.examName || "Deneme",
        };
      })
      .slice(-15);
  }, [filteredExams, filteredAnalyses, branchesToLookAt]);

  if (!activeStudent) {
    return <NoStudentSelected />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <OnboardingTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={handleEndTour}
        onComplete={handleEndTour}
        onNextTour={() => {
          setIsTourOpen(false);
          tourService.markTourCompleted('student_deep_analysis', user?.uid);
          navigate('/panel/koc/ogrenci/ai-sohbetleri', { state: { startTour: true, isDemo: true } });
        }}
        nextTourLabel="Yapay Zeka Sohbetleri Turu"
        tourKey="student_deep_analysis"
        onStepChange={handleStepChange}
      />

      <div id="tour-deep-analysis-header">
        <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight flex items-center gap-3">
          <Search className="text-emerald-500" size={28} />
          DERİN ANALİZ
        </h1>
        <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm">
          <Info size={14} /> {activeStudent?.displayName || 'Seçili öğrenci'} adlı öğrencinin
          detaylı deneme performans analizleri.
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-visible relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />
        <div className="p-8">
          {/* Level 1: Exam Type */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 relative z-50 w-full border-b border-white/5 pb-6">
            <div id="tour-deep-analysis-exam-types" className="flex bg-black/40 p-1.5 rounded-2xl w-full sm:w-fit border border-white/5">
              {(() => {
                const branch = activeStudent?.branch || "";
                const isAra = ["9. Sınıf", "10. Sınıf", "11. Sınıf"].includes(branch);
                const available = isAra ? (branch === "11. Sınıf" ? ["11. Sınıf", "TYT"] : [branch]) : ["TYT", "AYT", "YDT"];
                return available.map((type) => (
                <button
                  key={type}
                  onClick={() => handleExamTypeChange(type)}
                  className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    selectedExamType === type
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {type}
                </button>
              ));
            })()}
            </div>

            <div id="tour-deep-analysis-filters" className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto relative">
              <div className="flex gap-2">
                <select
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 h-10"
                >
                  <option
                    value="Tüm Zamanlar"
                    className="bg-slate-900 text-white"
                  >
                    Tarih: Tüm Zamanlar
                  </option>
                  <option value="Son 1 Ay" className="bg-slate-900 text-white">
                    Son 1 Ay
                  </option>
                  <option value="Son 3 Ay" className="bg-slate-900 text-white">
                    Son 3 Ay
                  </option>
                  <option value="Son 6 Ay" className="bg-slate-900 text-white">
                    Son 6 Ay
                  </option>
                  <option
                    value="Belirli Tarih Aralığı"
                    className="bg-slate-900 text-white"
                  >
                    Belirli Tarih Aralığı
                  </option>
                </select>

                {filterDateRange === "Belirli Tarih Aralığı" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 h-10 [color-scheme:dark]"
                    />
                    <span className="text-white/50">-</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 h-10 [color-scheme:dark]"
                    />
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() =>
                    setIsPublisherDropdownOpen(!isPublisherDropdownOpen)
                  }
                  className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 flex flex-col justify-center h-10 min-w-[140px] text-left"
                >
                  <span className="truncate w-full block">
                    {selectedPublishers.length === 0
                      ? "Sınav / Deneme Adı: Tümü"
                      : `Seçili Deneme: ${selectedPublishers.length}`}
                  </span>
                </button>

                {isPublisherDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800 border border-white/10 rounded-2xl shadow-xl z-50 p-2 overflow-y-auto max-h-60">
                    {computedAvailablePublishers.length === 0 ? (
                      <p className="text-white/50 text-xs p-2">
                        Henüz deneme bulunamadı.
                      </p>
                    ) : (
                      computedAvailablePublishers.map((pub: string) => {
                        const isSelected = selectedPublishers.includes(pub);
                        return (
                          <label
                            key={pub}
                            className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedPublishers((prev) =>
                                    prev.filter((p) => p !== pub),
                                  );
                                } else {
                                  setSelectedPublishers((prev) => [
                                    ...prev,
                                    pub,
                                  ]);
                                }
                              }}
                              className="w-4 h-4 rounded border-white/20 bg-black/20 text-emerald-500 focus:ring-emerald-500/30"
                            />
                            <span className="text-sm font-medium text-slate-300">
                              {pub}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <select
                value={filterErrorType}
                onChange={(e) => setFilterErrorType(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 h-10"
              >
                <option value="Tümü" className="bg-slate-900 text-white">
                  Hata Türü: Tümü
                </option>
                <option value="bilgi" className="bg-slate-900 text-white">
                  Bilgi Eksikliği
                </option>
                <option value="kalip" className="bg-slate-900 text-white">
                  Soru Kalıp Eksikliği
                </option>
                <option value="dikkat" className="bg-slate-900 text-white">
                  Dikkat Hatası
                </option>
                <option value="zaman" className="bg-slate-900 text-white">
                  Zaman Yetmezliği
                </option>
              </select>

              {/* Kademe Filter Switcher */}
              <div className="flex items-center bg-slate-900 border border-white/10 p-1 rounded-xl h-10">
                <button
                  type="button"
                  onClick={() => setFilterKademe("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    filterKademe === "all"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Hem 1. Kademe Ana Konuları hem de alt başlık kırılımlarını gösterir"
                >
                  <Layers size={13} />
                  <span>Tüm Kademeler</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterKademe("level1")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    filterKademe === "level1"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Yalnızca 1. Kademe (Ana Konu) bazında göster"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  <span>1. Kademe (Ana Konu)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterKademe("level2")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    filterKademe === "level2"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Yalnızca 2. Kademe (Alt Başlık) bazında göster"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>2. Kademe (Alt Başlık)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Level 2: Subject Categories */}
          {currentCategories.length > 0 && (
            <div id="tour-deep-analysis-categories" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 relative z-10 w-full">
              <div className="flex flex-wrap gap-2">
                {currentCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedCategory === cat
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-black/20 text-slate-400 border border-white/5 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-3 cursor-pointer bg-black/20 px-4 py-2 rounded-xl border border-white/5 hover:bg-white/5 transition-colors w-full sm:w-auto shrink-0">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={includeBranchExams}
                    onChange={(e) => setIncludeBranchExams(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-8 h-4.5 bg-slate-700/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
                <span className="text-xs font-medium text-slate-300">
                  Branş / Ders denemelerini dahil et
                </span>
              </label>
            </div>
          )}

          {/* Level 3: Sub Categories (Lessons) */}
          <AnimatePresence mode="popLayout">
            {currentSubCategories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-wrap gap-2 mb-8 bg-white/5 p-3 rounded-2xl border border-white/5"
              >
                {currentSubCategories.map((subCat) => (
                  <button
                    key={subCat}
                    onClick={() => setSelectedSubCategory(subCat)}
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      selectedSubCategory === subCat
                        ? "bg-slate-700 text-white border border-slate-600 shadow-sm"
                        : "bg-transparent text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    {subCat}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Data View */}
          <div id="tour-deep-analysis-data-view" className="mt-8">
            {loading ? (
              <div className="border border-dashed border-white/10 rounded-3xl min-h-[400px] flex items-center justify-center p-8 bg-black/20">
                <p className="text-slate-400">Veriler yükleniyor...</p>
              </div>
            ) : (
                selectedSubCategory === "Grafik Analizi" ||
                selectedCategory === "Grafik Analizi"
                  ? (completionChartData[0]?.value || 0) +
                      (completionChartData[1]?.value || 0) ===
                    0
                  : selectedCategory === "Genel" ||
                      selectedSubCategory === "Genel"
                    ? topicsSummary.length === 0
                    : lessonsSummary.length === 0
              ) ? (
              <div className="border border-dashed border-white/10 rounded-3xl min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-black/20 relative z-10">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/20 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                  <BarChart2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Veri Bulunamadı
                </h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  Seçili filtrelere uygun analiz edilmiş hiçbir deneme veya hata
                  türü bulunmuyor. Lütfen filtrelerinizi değiştirin.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4 text-sm font-semibold text-emerald-400 bg-emerald-500/10 px-6 py-4 rounded-2xl border border-emerald-500/20">
                  <Info size={16} />
                  Belirtilen filtrelere göre toplam {totalErrorsCount} adet hata
                  kaydı bulundu. ({involvedExamIds.size} Denemede)
                </div>

                {selectedSubCategory === "Grafik Analizi" ||
                selectedCategory === "Grafik Analizi" ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Chart 1: Yayına Göre Yapılan ve Yapılamayan */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 lg:col-span-2">
                      <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                        <BarChart2 size={18} className="text-emerald-500" />
                        Yayına Göre Yapılan / Yapılamayan
                      </h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={publisherChartData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#ffffff10"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="publisher"
                              stroke="#94a3b8"
                              fontSize={10}
                              tick={{ fill: "#94a3b8" }}
                            />
                            <YAxis
                              stroke="#94a3b8"
                              fontSize={10}
                              tick={{ fill: "#94a3b8" }}
                            />
                            <RechartsTooltip
                              cursor={{ fill: "#ffffff05" }}
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "none",
                                borderRadius: "12px",
                                color: "#fff",
                              }}
                            />
                            <Legend
                              wrapperStyle={{
                                fontSize: "12px",
                                paddingTop: "10px",
                              }}
                            />
                            <Bar
                              dataKey="Yapılan"
                              stackId="a"
                              fill="#10b981"
                              radius={[0, 0, 4, 4]}
                            />
                            <Bar
                              dataKey="Yapılamayan"
                              stackId="a"
                              fill="#ef4444"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 2: Derse Göre Başarı Oranı */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                      <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                        <BarChart2 size={18} className="text-blue-500" />
                        Derse Göre Başarı Oranı (%)
                      </h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={lessonCompareChartData}
                            layout="vertical"
                            margin={{ left: 10, right: 30 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#ffffff10"
                              horizontal={true}
                              vertical={false}
                            />
                            <XAxis
                              type="number"
                              domain={[0, 100]}
                              stroke="#94a3b8"
                              fontSize={10}
                              tick={{ fill: "#94a3b8" }}
                            />
                            <YAxis
                              dataKey="lesson"
                              type="category"
                              stroke="#94a3b8"
                              fontSize={10}
                              tick={{ fill: "#94a3b8" }}
                              width={90}
                            />
                            <RechartsTooltip
                              cursor={{ fill: "#ffffff05" }}
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "none",
                                borderRadius: "12px",
                                color: "#fff",
                              }}
                              formatter={(value: any) => [
                                `%${value}`,
                                "Başarı Oranı",
                              ]}
                            />
                            <Bar
                              dataKey="SuccessRate"
                              fill="#3b82f6"
                              radius={[0, 4, 4, 0]}
                              label={{
                                position: "right",
                                fill: "#94a3b8",
                                fontSize: 10,
                                formatter: (val: any) => `%${val}`,
                              }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 3: Konu Tamamlama Oranı (Yarım Donut) */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                      <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                        <PieChartIcon size={18} className="text-emerald-500" />
                        Konu Tamamlama Oranı
                      </h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={completionChartData}
                              cx="50%"
                              cy="80%"
                              startAngle={180}
                              endAngle={0}
                              innerRadius={80}
                              outerRadius={120}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {completionChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "none",
                                borderRadius: "12px",
                                color: "#fff",
                              }}
                            />
                            <Legend verticalAlign="top" height={36} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 5: Hata Dağılımı */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                      <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                        <PieChartIcon size={18} className="text-orange-500" />
                        Hata Türü Dağılımı
                      </h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={errorTypeChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {errorTypeChartData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "none",
                                borderRadius: "12px",
                                color: "#fff",
                              }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 7: Hatalar kaçıncı sorularda */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                      <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-purple-500" />
                        Hataların Soru Numarasına Göre Dağılımı
                      </h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={questionNumberChartData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#ffffff10"
                            />
                            <XAxis
                              dataKey="questionNo"
                              stroke="#94a3b8"
                              fontSize={10}
                              tick={{ fill: "#94a3b8" }}
                            />
                            <YAxis
                              stroke="#94a3b8"
                              fontSize={10}
                              tick={{ fill: "#94a3b8" }}
                            />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "none",
                                borderRadius: "12px",
                                color: "#fff",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="Hata"
                              stroke="#a855f7"
                              strokeWidth={2}
                              dot={{ r: 2, fill: "#a855f7" }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 6: Kaçıncı Soru Neden Eksik Kaldı Tablosu */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 lg:col-span-2 overflow-hidden flex flex-col">
                      <div className="flex items-center justify-between mb-6 shrink-0 flex-wrap gap-2">
                        <h3 className="text-white font-bold flex items-center gap-2">
                          <Info size={18} className="text-amber-500" />
                          Hata Detay Tablosu
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">
                          1. Kademe (Ana Konu) & 2. Kademe (Alt Başlık) Detayları
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[760px]">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-xs font-semibold text-slate-400 p-3 pb-4">
                                Tarih
                              </th>
                              <th className="text-xs font-semibold text-slate-400 p-3 pb-4">
                                Yayın
                              </th>
                              <th className="text-xs font-semibold text-slate-400 p-3 pb-4">
                                Ders
                              </th>
                              <th className="text-xs font-semibold text-slate-400 p-3 pb-4">
                                Soru No
                              </th>
                              <th className="text-xs font-semibold text-slate-400 p-3 pb-4">
                                1. Kademe (Ana Konu)
                              </th>
                              <th className="text-xs font-semibold text-slate-400 p-3 pb-4">
                                2. Kademe (Alt Başlık)
                              </th>
                              <th className="text-xs font-semibold text-slate-400 p-3 pb-4">
                                Hata Türü
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {questionErrorTableData.map((row, idx) => {
                              let errColor = "text-slate-400";
                              let errLabel = row.errorType;
                              if (row.errorType === "bilgi") {
                                errColor = "text-emerald-400";
                                errLabel = "Bilgi Eksikliği";
                              } else if (row.errorType === "kalip") {
                                errColor = "text-blue-400";
                                errLabel = "Soru Kalıbı";
                              } else if (row.errorType === "dikkat") {
                                errColor = "text-amber-400";
                                errLabel = "Dikkat Hatası";
                              } else if (row.errorType === "zaman") {
                                errColor = "text-rose-400";
                                errLabel = "Zaman Hatası";
                              }

                              return (
                                <tr
                                  key={idx}
                                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                >
                                  <td className="p-3 text-sm text-slate-300">
                                    {row.date}
                                  </td>
                                  <td className="p-3 text-sm text-white font-medium">
                                    {row.examName}
                                  </td>
                                  <td className="p-3 text-sm text-indigo-300">
                                    {row.lesson}
                                  </td>
                                  <td className="p-3 text-sm text-slate-300 font-mono">
                                    {row.questionNo}
                                  </td>
                                  <td className="p-3 text-sm text-slate-200 font-medium">
                                    {row.topic}
                                  </td>
                                  <td className="p-3 text-sm text-emerald-400/90 font-medium">
                                    {row.subtopic && row.subtopic !== "-" ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs">
                                        {row.subtopic}
                                      </span>
                                    ) : (
                                      <span className="text-slate-500 text-xs">-</span>
                                    )}
                                  </td>
                                  <td
                                    className={`p-3 text-sm font-medium ${errColor}`}
                                  >
                                    {errLabel}
                                  </td>
                                </tr>
                              );
                            })}
                            {questionErrorTableData.length === 0 && (
                              <tr>
                                <td
                                  colSpan={7}
                                  className="p-8 text-center text-slate-500"
                                >
                                  Hata kaydı bulunamadı.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : filterKademe === "level2" ? (
                  /* 2. Kademe (Alt Başlıklar) Bağımsız Sıralama Görünümü */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                      <span>2. Kademe Alt Başlık Hata Sıralaması ({subtopicsRankSummary.length} Alt Başlık)</span>
                    </div>
                    {subtopicsRankSummary.length === 0 ? (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-slate-400">
                        Bu filtrelere ait alt başlık hata kaydı bulunamadı.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subtopicsRankSummary.map((item) => (
                          <div
                            key={`${item.parentTopic}___${item.subtopic}`}
                            className="bg-white/5 border border-emerald-500/20 rounded-2xl p-5 hover:bg-emerald-500/5 transition-all outline outline-1 outline-transparent hover:outline-emerald-500/30 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                                  2. Kademe • Alt Başlık
                                </span>
                                <span className="text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0">
                                  {item.total} Hata
                                </span>
                              </div>

                              <h4 className="text-white font-bold text-base mb-1 line-clamp-2" title={item.subtopic}>
                                {item.subtopic}
                              </h4>

                              <div className="flex flex-wrap items-center gap-1.5 mb-4 text-[11px] text-slate-400">
                                <span className="text-indigo-300 font-medium">{item.lesson}</span>
                                <span>•</span>
                                <span className="text-slate-300 truncate max-w-[200px]" title={item.parentTopic}>
                                  {item.parentTopic}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-3 border-t border-white/5">
                              {Object.entries(item.types)
                                .sort((a, b) => b[1] - a[1])
                                .map(([type, count]) => {
                                  let readableType = type;
                                  if (type === "bilgi") readableType = "Bilgi Eksikliği";
                                  else if (type === "kalip") readableType = "Soru Kalıp Eksikliği";
                                  else if (type === "dikkat") readableType = "Dikkat Hatası";
                                  else if (type === "zaman") readableType = "Zaman Yetmezliği";
                                  return (
                                    <div
                                      key={type}
                                      className="flex justify-between items-center text-xs"
                                    >
                                      <span className="text-slate-400">{readableType}</span>
                                      <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded text-xs">
                                        {count as React.ReactNode}
                                      </span>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : selectedCategory === "Genel" || selectedSubCategory === "Genel" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topicsSummary.map((item) => (
                      <div
                        key={item.topic}
                        className="bg-white/5 border border-emerald-500/10 rounded-2xl p-5 hover:bg-emerald-500/5 transition-all outline outline-1 outline-transparent hover:outline-emerald-500/20 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-wider">
                              1. Kademe • Ana Konu
                            </span>
                            <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-xs font-bold shrink-0">
                              {item.total} Hata
                            </span>
                          </div>
                          <h4 className="text-white font-bold mb-3 text-sm line-clamp-1" title={item.topic}>
                            {item.topic}
                          </h4>

                          <div className="space-y-1.5 mb-4">
                            {Object.entries(item.types)
                              .sort((a, b) => b[1] - a[1])
                              .map(([type, count]) => {
                                let readableType = type;
                                if (type === "bilgi")
                                  readableType = "Bilgi Eksikliği";
                                else if (type === "kalip")
                                  readableType = "Soru Kalıp Eksikliği";
                                else if (type === "dikkat")
                                  readableType = "Dikkat Hatası";
                                else if (type === "zaman")
                                  readableType = "Zaman Yetmezliği";
                                return (
                                  <div
                                    key={type}
                                    className="flex justify-between items-center text-xs"
                                  >
                                    <span className="text-slate-400">
                                      {readableType}
                                    </span>
                                    <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded text-xs">
                                      {count as React.ReactNode}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        {/* 2. Kademe (Alt Başlıklar) Nested Breakdown (Shown when filterKademe === "all") */}
                        {filterKademe === "all" && Array.isArray(item?.subtopics) && item.subtopics.length > 0 && (
                          <div className="pt-3 border-t border-white/10 space-y-2 mt-2">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Layers size={11} /> 2. Kademe Alt Başlıklar
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {item.subtopics.length} alt başlık
                              </span>
                            </div>
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                              {item.subtopics.map((st) => (
                                <div
                                  key={st.subtopic}
                                  className="bg-black/20 border border-white/5 rounded-lg p-2 text-xs flex flex-col gap-1"
                                >
                                  <div className="flex justify-between items-center gap-2">
                                    <span className="text-slate-200 font-medium truncate" title={st.subtopic}>
                                      {st.subtopic}
                                    </span>
                                    <span className="text-emerald-400 font-bold shrink-0 text-[11px]">
                                      {st.total} Hata
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1 text-[10px]">
                                    {Object.entries(st.types).map(([errT, c]) => (
                                      <span
                                        key={errT}
                                        className="text-slate-400 bg-white/5 px-1.5 py-0.5 rounded"
                                      >
                                        {errT === "bilgi"
                                          ? "Bilgi"
                                          : errT === "kalip"
                                          ? "Kalıp"
                                          : errT === "dikkat"
                                          ? "Dikkat"
                                          : "Zaman"}
                                        : {String(c)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-8">
                    {lessonsSummary.map((lessonInfo) => (
                      <div
                        key={lessonInfo.lesson}
                        className="space-y-4 relative"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {lessonInfo.topics.map((item) => (
                            <div
                              key={item.topic}
                              className="bg-white/5 border border-emerald-500/10 rounded-2xl p-5 hover:bg-emerald-500/5 transition-all outline outline-1 outline-transparent hover:outline-emerald-500/20 flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-wider">
                                    1. Kademe • Ana Konu
                                  </span>
                                  <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-xs font-bold shrink-0">
                                    {item.total} Hata
                                  </span>
                                </div>
                                <h4 className="text-white font-bold mb-3 text-sm line-clamp-1" title={item.topic}>
                                  {item.topic}
                                </h4>

                                <div className="space-y-1.5 mb-4">
                                  {Object.entries(item.types)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([type, count]) => {
                                      let readableType = type;
                                      if (type === "bilgi")
                                        readableType = "Bilgi Eksikliği";
                                      else if (type === "kalip")
                                        readableType = "Soru Kalıp Eksikliği";
                                      else if (type === "dikkat")
                                        readableType = "Dikkat Hatası";
                                      else if (type === "zaman")
                                        readableType = "Zaman Yetmezliği";
                                      return (
                                        <div
                                          key={type}
                                          className="flex justify-between items-center text-xs"
                                        >
                                          <span className="text-slate-400">
                                            {readableType}
                                          </span>
                                          <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded text-xs">
                                            {count as React.ReactNode}
                                          </span>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>

                              {/* 2. Kademe (Alt Başlıklar) Nested Breakdown (Shown when filterKademe === "all") */}
                              {filterKademe === "all" && Array.isArray(item?.subtopics) && item.subtopics.length > 0 && (
                                <div className="pt-3 border-t border-white/10 space-y-2 mt-2">
                                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                                    <span className="flex items-center gap-1 text-emerald-400">
                                      <Layers size={11} /> 2. Kademe Alt Başlıklar
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                      {item.subtopics.length} alt başlık
                                    </span>
                                  </div>
                                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                    {item.subtopics.map((st) => (
                                      <div
                                        key={st.subtopic}
                                        className="bg-black/20 border border-white/5 rounded-lg p-2 text-xs flex flex-col gap-1"
                                      >
                                        <div className="flex justify-between items-center gap-2">
                                          <span className="text-slate-200 font-medium truncate" title={st.subtopic}>
                                            {st.subtopic}
                                          </span>
                                          <span className="text-emerald-400 font-bold shrink-0 text-[11px]">
                                            {st.total} Hata
                                          </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 text-[10px]">
                                          {Object.entries(st.types).map(([errT, c]) => (
                                            <span
                                              key={errT}
                                              className="text-slate-400 bg-white/5 px-1.5 py-0.5 rounded"
                                            >
                                              {errT === "bilgi"
                                                ? "Bilgi"
                                                : errT === "kalip"
                                                ? "Kalıp"
                                                : errT === "dikkat"
                                                ? "Dikkat"
                                                : "Zaman"}
                                              : {String(c)}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
