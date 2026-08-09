import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStudent } from '../../lib/StudentContext';
import { useAuth } from '../../lib/AuthContext';
import { tourService } from '../../services/tourService';
import { studentDataService } from '../../services/studentDataService';
import { ClipboardCheck, ChevronDown, ChevronRight, LineChart, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OnboardingTour, TourStep } from '../../components/OnboardingTour';
import { SAMPLE_DEMO_STUDENT } from './CoachStudents';

const BRANCH_CATEGORIES = [
  {
    category: 'TYT Denemeleri',
    exams: [
      { name: 'Türkçe (TYT)', max: 40 },
      { name: 'Temel Matematik (TYT)', max: 40 },
      { name: 'Sosyal Bilimler (TYT)', max: 20 },
      { name: 'Fen Bilimleri (TYT)', max: 20 },
      { name: 'Tarih (TYT)', max: 5 },
      { name: 'Coğrafya (TYT)', max: 5 },
      { name: 'Felsefe (TYT)', max: 5 },
      { name: 'Din (TYT)', max: 5 },
      { name: 'Fizik (TYT)', max: 7 },
      { name: 'Kimya (TYT)', max: 7 },
      { name: 'Biyoloji (TYT)', max: 6 },
      { name: 'Geometri (TYT)', max: 10 }
    ]
  },
  {
    category: 'AYT Denemeleri',
    exams: [
      { name: 'Matematik (AYT)', max: 30 },
      { name: 'Edebiyat-Sosyal-1 (AYT)', max: 40 },
      { name: 'Sosyal-2 (AYT)', max: 40 },
      { name: 'Fen Bilimleri (AYT)', max: 40 },
      { name: 'Edebiyat (AYT)', max: 24 },
      { name: 'Tarih-1 (AYT)', max: 10 },
      { name: 'Coğrafya-1 (AYT)', max: 6 },
      { name: 'Tarih-2 (AYT)', max: 11 },
      { name: 'Coğrafya-2 (AYT)', max: 11 },
      { name: 'Felsefe Grubu (AYT)', max: 12 },
      { name: 'Din (Seçmeli) (AYT)', max: 6 },
      { name: 'Fizik (AYT)', max: 14 },
      { name: 'Kimya (AYT)', max: 13 },
      { name: 'Biyoloji (AYT)', max: 13 },
      { name: 'Geometri (AYT)', max: 10 }
    ]
  },
  {
    category: 'YDT Denemeleri',
    exams: [
      { name: 'İngilizce (YDT)', max: 80 },
      { name: 'Almanca (YDT)', max: 80 },
      { name: 'Fransızca (YDT)', max: 80 },
      { name: 'Arapça (YDT)', max: 80 },
      { name: 'Rusça (YDT)', max: 80 }
    ]
  }
];

const getBranchMax = (branchName: string) => {
  for (const cat of BRANCH_CATEGORIES) {
    const exam = cat.exams.find(e => e.name === branchName);
    if (exam) return exam.max;
  }
  return 40;
};

const safeGetTime = (dateVal: any) => {
  if (!dateVal) return 0;
  if (dateVal.toDate && typeof dateVal.toDate === 'function') {
    return dateVal.toDate().getTime();
  }
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

export default function StudentExamResults() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedStudent, setSelectedStudent } = useStudent();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('YKS');
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);
  const [isTourOpen, setIsTourOpen] = useState(false);

  const activeStudent = selectedStudent || (location.state?.startTour || location.state?.isDemo ? SAMPLE_DEMO_STUDENT : null);

  useEffect(() => {
    if (!selectedStudent && (location.state?.startTour || location.state?.isDemo)) {
      setSelectedStudent(SAMPLE_DEMO_STUDENT);
    }
  }, [selectedStudent, setSelectedStudent, location.state]);

  useEffect(() => {
    if (tourService.shouldAutoStartTour('student_exam_results', userData, location.state?.startTour)) {
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.state, userData]);

  const handleEndTour = () => {
    setIsTourOpen(false);
    tourService.markTourCompleted('student_exam_results', user?.uid);
  };

  const tourSteps: TourStep[] = [
    {
      targetId: 'tour-exam-results-header',
      title: 'Sınav Sonuçları Yönetimi',
      description: `${activeStudent?.displayName || 'Seçili öğrenci'} için girilen tüm TYT, AYT, YDT, YKS ve Branş deneme sınavı sonuçlarını buradan takip edebilirsiniz.`,
      position: 'bottom'
    },
    {
      targetId: 'tour-exam-results-tabs',
      title: 'Sınav Türü Filtreleme',
      description: 'YKS genel denemeleri, TYT, AYT veya Branş denemeleri arasında hızlıca geçiş yapabilir, hedef branş netlerini inceleyebilirsiniz.',
      position: 'bottom'
    },
    {
      targetId: 'tour-exam-results-list',
      title: 'Deneme Listesi ve Detay Dökümü',
      description: 'Sınav tarihlerine, genel net durumuna, Türkiye geneli sıralama ve yüzdelik dilimlerine göz atabilirsiniz. Satıra tıklayarak ders bazlı Doğru/Yanlış/Net detay tablosunu açabilirsiniz.',
      position: 'top'
    }
  ];

  const SAMPLE_EXAMS = [
    {
      id: 'demo-yks-1',
      examName: 'Bilgi Sarmal YKS Genel Deneme',
      examType: 'YKS',
      date: '2026-03-20',
      aytDate: '2026-03-21',
      totalNet: 162.75,
      rank: 1150,
      participantCount: 52000,
      percentile: 2.2,
      scores: {
        'TYT Türkçe': { c: 35, i: 3, n: '34.25' },
        'TYT Tarih': { c: 4, i: 1, n: '3.75' },
        'TYT Coğrafya': { c: 4, i: 1, n: '3.75' },
        'TYT Felsefe': { c: 5, i: 0, n: '5.00' },
        'TYT Din': { c: 5, i: 0, n: '5.00' },
        'TYT Matematik': { c: 26, i: 2, n: '25.50' },
        'TYT Geometri': { c: 8, i: 1, n: '7.75' },
        'TYT Fizik': { c: 5, i: 1, n: '4.75' },
        'TYT Kimya': { c: 6, i: 1, n: '5.75' },
        'TYT Biyoloji': { c: 5, i: 1, n: '4.75' },
        'AYT Edebiyat': { c: 20, i: 3, n: '19.25' },
        'AYT Tarih-1': { c: 8, i: 1, n: '7.75' },
        'AYT Coğrafya-1': { c: 5, i: 1, n: '4.75' },
        'AYT Matematik': { c: 34, i: 3, n: '33.25' },
        'AYT Fizik': { c: 11, i: 2, n: '10.50' },
        'AYT Kimya': { c: 12, i: 1, n: '11.75' },
        'AYT Biyoloji': { c: 13, i: 0, n: '13.00' }
      }
    },
    {
      id: 'demo-tyt-1',
      examName: '3D Türkiye Geneli TYT-1',
      examType: 'TYT',
      date: '2026-02-10',
      totalNet: 94.5,
      rank: 1420,
      participantCount: 48500,
      percentile: 2.9,
      scores: {
        'Türkçe': { c: 34, i: 4, n: '33.00' },
        'Tarih': { c: 4, i: 1, n: '3.75' },
        'Coğrafya': { c: 5, i: 0, n: '5.00' },
        'Felsefe': { c: 4, i: 1, n: '3.75' },
        'Din': { c: 5, i: 0, n: '5.00' },
        'Matematik': { c: 28, i: 2, n: '27.50' },
        'Geometri': { c: 9, i: 1, n: '8.75' },
        'Fizik': { c: 6, i: 1, n: '5.75' },
        'Kimya': { c: 6, i: 0, n: '6.00' },
        'Biyoloji': { c: 6, i: 0, n: '6.00' }
      }
    },
    {
      id: 'demo-ayt-1',
      examName: 'Özdebir Türkiye Geneli AYT-2',
      examType: 'AYT',
      date: '2026-03-01',
      totalNet: 68.25,
      rank: 890,
      participantCount: 32000,
      percentile: 2.7,
      scores: {
        'Matematik': { c: 26, i: 3, n: '25.25' },
        'Geometri': { c: 8, i: 1, n: '7.75' },
        'Fizik': { c: 11, i: 2, n: '10.50' },
        'Kimya': { c: 12, i: 1, n: '11.75' },
        'Biyoloji': { c: 13, i: 0, n: '13.00' }
      }
    }
  ];

  const EXAM_STRUCTURE: any = {
    'TYT': [
      { category: 'Türkçe', fields: [{ name: 'Türkçe', max: 40 }] },
      { category: 'Sosyal Bilimler', fields: [{ name: 'Tarih', max: 5 }, { name: 'Coğrafya', max: 5 }, { name: 'Felsefe', max: 5 }, { name: 'Din', max: 5 }] },
      { category: 'Temel Matematik', fields: [{ name: 'Matematik', max: 30 }, { name: 'Geometri', max: 10 }] },
      { category: 'Fen Bilimleri', fields: [{ name: 'Fizik', max: 7 }, { name: 'Kimya', max: 7 }, { name: 'Biyoloji', max: 6 }] }
    ],
    'AYT': [
      { category: 'Ed-Sos-1', fields: [{ name: 'Edebiyat', max: 24 }, { name: 'Tarih-1', max: 10 }, { name: 'Coğrafya-1', max: 6 }] },
      { category: 'Sosyal-2', fields: [{ name: 'Tarih-2', max: 11 }, { name: 'Coğrafya-2', max: 11 }, { name: 'Felsefe Grubu', max: 12 }, { name: 'Din (Seçmeli)', max: 6 }] },
      { category: 'Matematik', fields: [{ name: 'Matematik', max: 30 }, { name: 'Geometri', max: 10 }] },
      { category: 'Fen Bilimleri', fields: [{ name: 'Fizik', max: 14 }, { name: 'Kimya', max: 13 }, { name: 'Biyoloji', max: 13 }] }
    ],
    'YDT': [
      { category: 'Yabancı Dil', fields: [{ name: 'Yabancı Dil', max: 80 }] }
    ],
    'YKS': [
      { category: 'TYT Türkçe', fields: [{ name: 'TYT Türkçe', max: 40 }] },
      { category: 'TYT Sosyal', fields: [{ name: 'TYT Tarih', max: 5 }, { name: 'TYT Coğrafya', max: 5 }, { name: 'TYT Felsefe', max: 5 }, { name: 'TYT Din', max: 5 }] },
      { category: 'TYT Matematik', fields: [{ name: 'TYT Matematik', max: 30 }, { name: 'TYT Geometri', max: 10 }] },
      { category: 'TYT Fen', fields: [{ name: 'TYT Fizik', max: 7 }, { name: 'TYT Kimya', max: 7 }, { name: 'TYT Biyoloji', max: 6 }] },
      { category: 'AYT Ed-Sos-1', fields: [{ name: 'AYT Edebiyat', max: 24 }, { name: 'AYT Tarih-1', max: 10 }, { name: 'AYT Coğrafya-1', max: 6 }] },
      { category: 'AYT Sosyal-2', fields: [{ name: 'AYT Tarih-2', max: 11 }, { name: 'AYT Coğrafya-2', max: 11 }, { name: 'AYT Felsefe Grubu', max: 12 }, { name: 'AYT Din (Seçmeli)', max: 6 }] },
      { category: 'AYT Matematik', fields: [{ name: 'AYT Matematik', max: 40 }] },
      { category: 'AYT Fen', fields: [{ name: 'AYT Fizik', max: 14 }, { name: 'AYT Kimya', max: 13 }, { name: 'AYT Biyoloji', max: 13 }] },
      { category: 'YDT Yabancı Dil', fields: [{ name: 'YDT Yabancı Dil', max: 80 }] }
    ]
  };

  const getMappedScores = (exam: any, tab: string) => {
    if (exam.examType === tab) return exam.scores || {};
    if (exam.examType === 'YKS') {
        const mapped: any = {};
        if (tab === 'TYT') {
           mapped['Türkçe'] = exam.scores['TYT Türkçe'];
           mapped['Tarih'] = exam.scores['TYT Tarih'];
           mapped['Coğrafya'] = exam.scores['TYT Coğrafya'];
           mapped['Felsefe'] = exam.scores['TYT Felsefe'];
           mapped['Din'] = exam.scores['TYT Din'];
           mapped['Matematik'] = exam.scores['TYT Matematik'];
           mapped['Geometri'] = exam.scores['TYT Geometri'];
           mapped['Fizik'] = exam.scores['TYT Fizik'];
           mapped['Kimya'] = exam.scores['TYT Kimya'];
           mapped['Biyoloji'] = exam.scores['TYT Biyoloji'];
        } else if (tab === 'AYT') {
           mapped['Edebiyat'] = exam.scores['AYT Edebiyat'];
           mapped['Tarih-1'] = exam.scores['AYT Tarih-1'];
           mapped['Coğrafya-1'] = exam.scores['AYT Coğrafya-1'];
           mapped['Tarih-2'] = exam.scores['AYT Tarih-2'];
           mapped['Coğrafya-2'] = exam.scores['AYT Coğrafya-2'];
           mapped['Felsefe Grubu'] = exam.scores['AYT Felsefe Grubu'];
           mapped['Din (Seçmeli)'] = exam.scores['AYT Din (Seçmeli)'];
           mapped['Matematik'] = exam.scores['AYT Matematik'];
           mapped['Fizik'] = exam.scores['AYT Fizik'];
           mapped['Kimya'] = exam.scores['AYT Kimya'];
           mapped['Biyoloji'] = exam.scores['AYT Biyoloji'];
        } else if (tab === 'YDT') {
           mapped['Yabancı Dil'] = exam.scores['YDT Yabancı Dil'];
        }
        return mapped;
    }
    return exam.scores || {};
  };

  const getNetForTab = (exam: any, tab: string) => {
      if (exam.examType === tab) {
        if (tab === 'BRANŞ') {
            let total = 0;
            const mapped = getMappedScores(exam, tab);
            Object.keys(mapped).forEach(k => {
                total += parseFloat(mapped[k].n) || 0;
            });
            return parseFloat(total.toFixed(2));
        }
        return exam.totalNet || 0;
      }
      if (exam.examType === 'YKS') {
          let total = 0;
          const mapped = getMappedScores(exam, tab);
          const struct = EXAM_STRUCTURE[tab] || [];
          struct.forEach((cat: any) => {
              cat.fields.forEach((f: any) => {
                  if (mapped[f.name]) total += (parseFloat(mapped[f.name].n) || 0);
              });
          });
          return parseFloat(total.toFixed(2));
      }
      return exam.totalNet || 0;
  };

  const calculateAYTBranchScores = (mappedScores: any) => {
    const getNet = (name: string) => {
        const score = mappedScores[name] || mappedScores[`AYT ${name}`];
        return parseFloat(score?.n || 0);
    };

    const mat = getNet('Matematik');
    const geo = getNet('Geometri');
    const fizik = getNet('Fizik');
    const kimya = getNet('Kimya');
    const biyo = getNet('Biyoloji');
    const edb = getNet('Edebiyat');
    const tar1 = getNet('Tarih-1');
    const cog1 = getNet('Coğrafya-1');
    const tar2 = getNet('Tarih-2');
    const cog2 = getNet('Coğrafya-2');
    const fel = getNet('Felsefe Grubu');
    const din = getNet('Din (Seçmeli)');

    return {
      say: (mat + geo + fizik + kimya + biyo).toFixed(2),
      ea: (mat + geo + edb + tar1 + cog1).toFixed(2),
      soz: (edb + tar1 + cog1 + tar2 + cog2 + fel + din).toFixed(2)
    };
  };

  const fetchExams = async () => {
    setLoading(true);
    if (activeStudent) {
      const data = await studentDataService.getExamResults(activeStudent.uid);
      if (data && data.length > 0) {
        setExams(data);
      } else {
        setExams(SAMPLE_EXAMS);
      }
    } else {
      setExams(SAMPLE_EXAMS);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExams();
  }, [activeStudent?.uid]);

  const getDisplayExams = () => {
    const listToFilter = exams.length > 0 ? exams : SAMPLE_EXAMS;
    return listToFilter.filter(e => {
        if (activeTab === 'BRANŞ') return e.examType === 'BRANŞ';
        return e.examType === activeTab || (e.examType === 'YKS' && activeTab !== 'YKS');
    }).sort((a,b) => {
        const dateA = (activeTab === 'AYT' || activeTab === 'YDT') && a.examType === 'YKS' ? (a.aytDate || a.date) : a.date;
        const dateB = (activeTab === 'AYT' || activeTab === 'YDT') && b.examType === 'YKS' ? (b.aytDate || b.date) : b.date;
        return safeGetTime(dateB) - safeGetTime(dateA);
    });
  };

  const displayExams = getDisplayExams();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <OnboardingTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={handleEndTour}
        onComplete={handleEndTour}
        onNextTour={() => {
          setIsTourOpen(false);
          tourService.markTourCompleted('student_exam_results', user?.uid);
          navigate('/panel/koc/ogrenci/analizler', { state: { startTour: true, isDemo: true } });
        }}
        nextTourLabel="Sınav Analizleri Turu"
        tourKey="student_exam_results"
      />

      <div id="tour-exam-results-header" className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">
             SINAV SONUÇLARI
          </h1>
          <p className="text-slate-500 mt-1">{activeStudent?.displayName || 'Seçili öğrenci'} tüm sınav performans geçmişi.</p>
        </div>
        
        <div id="tour-exam-results-tabs" className="flex bg-slate-900/60 p-1 rounded-xl border border-white/5 overflow-x-auto custom-scrollbar">
          {['YKS', 'TYT', 'AYT', 'YDT', 'BRANŞ'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div id="tour-exam-results-list" className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden">
        {loading ? (
           <div className="text-center py-20 text-slate-500 font-bold italic animate-pulse">Sonuçlar Yükleniyor...</div>
        ) : displayExams.length === 0 ? (
           <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl m-6">
               <LineChart size={48} className="mx-auto text-slate-700 mb-4" />
               <p className="text-slate-400 font-bold text-sm">Öğrencinin henüz {activeTab} denemesi bulunmuyor.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <th className="px-8 py-6">Sınav Adı</th>
                  <th className="px-6 py-6">Tür</th>
                  <th className="px-6 py-6">Tarih</th>
                  <th className="px-6 py-6">Net</th>
                  <th className="px-6 py-6">Sıralama / Giren</th>
                  <th className="px-6 py-6">Yüzdelik</th>
                  <th className="px-8 py-6 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayExams.map((exam, i) => {
                  const mappedScores = getMappedScores(exam, activeTab);
                  return (
                  <React.Fragment key={exam.id || i}>
                    <tr 
                      onClick={() => setExpandedExamId(expandedExamId === (exam.id || i) ? null : (exam.id || i))}
                      className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                             <ClipboardCheck size={20} />
                          </div>
                          <span className="font-bold text-slate-200 uppercase">{exam.examName}</span>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        {exam.examType}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-sm text-slate-400 font-medium">
                      <div className="flex flex-col">
                        <span>{exam.examType === 'YKS' ? 'TYT: ' : ''}{exam.date}</span>
                        {exam.aytDate && <span className="text-xs mt-0.5">AYT/YDT: {exam.aytDate}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      {activeTab === 'AYT' || activeTab === 'YKS' ? (
                        <div className="flex flex-col gap-1 min-w-[120px]">
                          {activeTab === 'YKS' && (
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 border-b border-white/5 pb-1 mb-1">
                              <span>TYT NET</span>
                              <span className="text-indigo-300">{getNetForTab(exam, 'TYT')}</span>
                            </div>
                          )}
                          <div className="flex flex-col gap-0.5">
                            {(!selectedStudent?.branch || selectedStudent.branch.toUpperCase() === 'SAYISAL') && (
                              <div className="flex justify-between items-center text-[10px] font-black">
                                <span className="text-emerald-400">AYT SAY</span>
                                <span className="text-white bg-emerald-500/10 px-1 rounded">{calculateAYTBranchScores(mappedScores).say}</span>
                              </div>
                            )}
                            {(!selectedStudent?.branch || selectedStudent.branch.toUpperCase() === 'EŞİT AĞIRLIK') && (
                              <div className="flex justify-between items-center text-[10px] font-black">
                                <span className="text-blue-400">AYT EA</span>
                                <span className="text-white bg-blue-500/10 px-1 rounded">{calculateAYTBranchScores(mappedScores).ea}</span>
                              </div>
                            )}
                            {(!selectedStudent?.branch || selectedStudent.branch.toUpperCase() === 'SÖZEL') && (
                              <div className="flex justify-between items-center text-[10px] font-black">
                                <span className="text-orange-400">AYT SÖZ</span>
                                <span className="text-white bg-orange-500/10 px-1 rounded">{calculateAYTBranchScores(mappedScores).soz}</span>
                              </div>
                            )}
                            {(selectedStudent?.branch?.toUpperCase() === 'DİL') && (
                              <div className="flex justify-between items-center text-[10px] font-black">
                                <span className="text-pink-400">YDT NET</span>
                                <span className="text-white bg-pink-500/10 px-1 rounded">{getNetForTab(exam, 'YDT')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="font-black text-white">{getNetForTab(exam, activeTab)}</span>
                      )}
                    </td>
                    <td className="px-6 py-6 text-xs text-slate-500 font-bold italic">
                      {exam.rank || '-'}{exam.participantCount ? ` / ${exam.participantCount}` : ''}
                    </td>
                    <td className="px-6 py-6 text-xs text-slate-400 font-black">%{exam.percentile || '-'}</td>
                    <td className="px-8 py-6 text-right">
                       <button className="p-2 hover:bg-white/5 rounded-lg text-slate-600 hover:text-white transition-all">
                          {expandedExamId === (exam.id || i) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                       </button>
                    </td>
                  </tr>
                  <AnimatePresence>
                    {expandedExamId === (exam.id || i) && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <td colSpan={7} className="p-0 border-b border-white/5">
                          <div className="bg-slate-950 p-6 md:p-8 space-y-6 m-2 md:mx-6 md:mb-6 rounded-2xl border border-white/5">
                             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                               <h4 className="text-sm font-black text-white uppercase tracking-widest bg-white/5 inline-block px-3 py-1.5 rounded-lg border border-white/10">Sınav Netleri: {activeTab} {exam.examType === 'YKS' && activeTab !== 'YKS' ? '(YKS\'den)' : ''}</h4>
                               
                               {(activeTab === 'AYT' || activeTab === 'YKS') && (
                                 <div className="flex gap-4">
                                   <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                                     <p className="text-[10px] font-black text-emerald-400 uppercase">AYT SAY</p>
                                     <p className="text-sm font-black text-white">{calculateAYTBranchScores(mappedScores).say}</p>
                                   </div>
                                   <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl">
                                     <p className="text-[10px] font-black text-blue-400 uppercase">AYT EA</p>
                                     <p className="text-sm font-black text-white">{calculateAYTBranchScores(mappedScores).ea}</p>
                                   </div>
                                   <div className="bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-xl">
                                     <p className="text-[10px] font-black text-orange-400 uppercase">AYT SÖZ</p>
                                     <p className="text-sm font-black text-white">{calculateAYTBranchScores(mappedScores).soz}</p>
                                   </div>
                                 </div>
                               )}
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                 {activeTab === 'BRANŞ' ? (
                                     Object.keys(mappedScores || {}).map(branchName => {
                                         const score = mappedScores[branchName];
                                         return (
                                             <div key={branchName} className="bg-slate-800/20 border border-slate-700 rounded-2xl overflow-hidden p-1 shadow-lg h-fit">
                                                 <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center rounded-xl mb-2">
                                                    <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">{branchName}</span>
                                                 </div>
                                                 <div className="flex gap-2 items-center p-2 mx-1 justify-between">
                                                     <div className="flex flex-col text-center">
                                                         <span className="text-[10px] text-slate-500 uppercase font-bold mb-1">D</span>
                                                         <span className="font-medium text-white">{score.c}</span>
                                                     </div>
                                                     <div className="flex flex-col text-center">
                                                         <span className="text-[10px] text-slate-500 uppercase font-bold mb-1">Y</span>
                                                         <span className="font-medium text-white">{score.i}</span>
                                                     </div>
                                                     <div className="flex flex-col text-center">
                                                         <span className="text-[10px] text-slate-500 uppercase font-bold mb-1">B</span>
                                                         <span className="font-medium text-white">{(getBranchMax(branchName)) - (parseInt(score.c) || 0) - (parseInt(score.i) || 0)}</span>
                                                     </div>
                                                     <div className="flex flex-col text-center border-l border-white/10 pl-4 ml-2">
                                                         <span className="text-[10px] text-emerald-500 uppercase font-bold mb-1">Net</span>
                                                         <span className="font-bold text-white bg-white/5 py-1 px-3 rounded-lg">{score.n}</span>
                                                     </div>
                                                 </div>
                                             </div>
                                         )
                                     })
                                 ) : (
                                     (EXAM_STRUCTURE[activeTab] || []).map((categoryGroup: any, idx: number) => {
                                         let groupNet = 0;
                                         categoryGroup.fields.forEach((f: any) => {
                                             if(mappedScores?.[f.name]) groupNet += (parseFloat(mappedScores[f.name].n) || 0);
                                         });
    
                                         return (
                                         <div key={idx} className="bg-slate-800/20 border border-slate-700 rounded-2xl overflow-hidden p-1 shadow-lg h-fit">
                                             <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center rounded-xl mb-2">
                                                <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">{categoryGroup.category}</span>
                                                <span className="text-xs font-black text-white bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded">{groupNet.toFixed(2)} Net</span>
                                             </div>
    
                                             <div className="space-y-1">
                                                {categoryGroup.fields.map((fieldItem: any) => (
                                                    <div key={fieldItem.name} className="grid grid-cols-12 gap-2 items-center bg-transparent p-2 rounded-lg hover:bg-white/5 transition-colors mx-1">
                                                      <div className="col-span-5 flex-1 min-w-0">
                                                         <p className="text-[11px] font-bold text-slate-300 truncate" title={fieldItem.name}>{fieldItem.name}</p>
                                                      </div>
                                                      <div className="col-span-2 text-center text-[10px] font-bold text-emerald-500/70">
                                                          {mappedScores?.[fieldItem.name]?.c || '0'} D
                                                      </div>
                                                      <div className="col-span-2 text-center text-[10px] font-bold text-red-500/70">
                                                          {mappedScores?.[fieldItem.name]?.i || '0'} Y
                                                      </div>
                                                      <div className="col-span-3 text-right">
                                                          <span className="text-xs font-black text-white bg-slate-700/50 px-2 py-1.5 rounded inline-block min-w-[3rem] text-center">
                                                            {mappedScores?.[fieldItem.name]?.n || 0}
                                                          </span>
                                                      </div>
                                                    </div>
                                                ))}
                                             </div>
                                         </div>
                                         )
                                     })
                                 )}
                             </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
