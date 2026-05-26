import React, { useState, useMemo } from 'react';
import { useStudent } from '../../lib/StudentContext';
import { Search, Info, BarChart2, PieChart as PieChartIcon, TrendingUp, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BASE_TOPICS } from '../student/ExamAnalysis';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line 
} from 'recharts';

// Domain model definitions
const EXAM_TYPES = ['TYT', 'AYT', 'YDT'];

const CATEGORY_TO_BRANCH: Record<string, Record<string, string[]>> = {
  'TYT': {
    'Genel': ['Türkçe', 'Sosyal Bilimler', 'Temel Matematik', 'Fen Bilimleri', 'Türkçe (TYT)', 'Temel Matematik (TYT)', 'Sosyal Bilimler (TYT)', 'Fen Bilimleri (TYT)', 'Tarih (TYT)', 'Coğrafya (TYT)', 'Felsefe (TYT)', 'Din (TYT)', 'Geometri (TYT)', 'Fizik (TYT)', 'Kimya (TYT)', 'Biyoloji (TYT)'],
    'Türkçe': ['Türkçe', 'Türkçe (TYT)'],
    'Matematik': ['Temel Matematik', 'Temel Matematik (TYT)', 'Geometri (TYT)'],
    'Sosyal': ['Sosyal Bilimler', 'Sosyal Bilimler (TYT)', 'Tarih (TYT)', 'Coğrafya (TYT)', 'Felsefe (TYT)', 'Din (TYT)'],
    'Fen': ['Fen Bilimleri', 'Fen Bilimleri (TYT)', 'Fizik (TYT)', 'Kimya (TYT)', 'Biyoloji (TYT)'],
    'Grafik Analizi': ['Türkçe', 'Sosyal Bilimler', 'Temel Matematik', 'Fen Bilimleri', 'Türkçe (TYT)', 'Temel Matematik (TYT)', 'Sosyal Bilimler (TYT)', 'Fen Bilimleri (TYT)', 'Tarih (TYT)', 'Coğrafya (TYT)', 'Felsefe (TYT)', 'Din (TYT)', 'Geometri (TYT)', 'Fizik (TYT)', 'Kimya (TYT)', 'Biyoloji (TYT)']
  },
  'AYT': {
    'Genel': ['Matematik', 'Ed-Sos-1', 'Sosyal-2', 'Fen Bilimleri (AYT)', 'Matematik (AYT)', 'Edebiyat-Sosyal-1 (AYT)', 'Sosyal-2 (AYT)', 'Edebiyat (AYT)', 'Tarih-1 (AYT)', 'Coğrafya-1 (AYT)', 'Tarih-2 (AYT)', 'Coğrafya-2 (AYT)', 'Felsefe Grubu (AYT)', 'Din (Seçmeli) (AYT)', 'Fizik (AYT)', 'Kimya (AYT)', 'Biyoloji (AYT)', 'Geometri (AYT)'],
    'Matematik': ['Matematik', 'Matematik (AYT)', 'Geometri (AYT)'],
    'Sos-1': ['Ed-Sos-1', 'Edebiyat-Sosyal-1 (AYT)', 'Edebiyat (AYT)', 'Tarih-1 (AYT)', 'Coğrafya-1 (AYT)'],
    'Sos-2': ['Sosyal-2', 'Sosyal-2 (AYT)', 'Tarih-2 (AYT)', 'Coğrafya-2 (AYT)', 'Felsefe Grubu (AYT)', 'Din (Seçmeli) (AYT)'],
    'Fen': ['Fen Bilimleri (AYT)', 'Fizik (AYT)', 'Kimya (AYT)', 'Biyoloji (AYT)'],
    'Grafik Analizi': ['Matematik', 'Ed-Sos-1', 'Sosyal-2', 'Fen Bilimleri (AYT)', 'Matematik (AYT)', 'Edebiyat-Sosyal-1 (AYT)', 'Sosyal-2 (AYT)', 'Edebiyat (AYT)', 'Tarih-1 (AYT)', 'Coğrafya-1 (AYT)', 'Tarih-2 (AYT)', 'Coğrafya-2 (AYT)', 'Felsefe Grubu (AYT)', 'Din (Seçmeli) (AYT)', 'Fizik (AYT)', 'Kimya (AYT)', 'Biyoloji (AYT)', 'Geometri (AYT)']
  },
  'YDT': {
    'Genel': ['İngilizce', 'Almanca', 'Fransızca', 'Arapça', 'Rusça', 'Yabancı Dil', 'İngilizce (YDT)', 'Almanca (YDT)', 'Fransızca (YDT)', 'Arapça (YDT)', 'Rusça (YDT)'],
    'İngilizce': ['İngilizce', 'İngilizce (YDT)'],
    'Almanca': ['Almanca', 'Almanca (YDT)'],
    'Fransızca': ['Fransızca', 'Fransızca (YDT)'],
    'Arapça': ['Arapça', 'Arapça (YDT)'],
    'Rusça': ['Rusça', 'Rusça (YDT)'],
    'Grafik Analizi': ['İngilizce', 'Almanca', 'Fransızca', 'Arapça', 'Rusça', 'Yabancı Dil', 'İngilizce (YDT)', 'Almanca (YDT)', 'Fransızca (YDT)', 'Arapça (YDT)', 'Rusça (YDT)']
  }
};

const CATEGORIES: Record<string, string[]> = {
  'TYT': Object.keys(CATEGORY_TO_BRANCH['TYT']),
  'AYT': Object.keys(CATEGORY_TO_BRANCH['AYT']),
  'YDT': Object.keys(CATEGORY_TO_BRANCH['YDT'])
};

const SUB_CATEGORIES: Record<string, string[]> = {
  'Türkçe': ['Genel', 'Grafik Analizi'],
  'İngilizce': ['Genel', 'Grafik Analizi'],
  'Almanca': ['Genel', 'Grafik Analizi'],
  'Fransızca': ['Genel', 'Grafik Analizi'],
  'Arapça': ['Genel', 'Grafik Analizi'],
  'Rusça': ['Genel', 'Grafik Analizi'],
  'Matematik': ['Genel', 'Matematik', 'Geometri', 'Grafik Analizi'],
  'Sosyal': ['Genel', 'Tarih', 'Coğrafya', 'Felsefe', 'Din Kültürü', 'Grafik Analizi'],
  'Sos-1': ['Genel', 'Edebiyat', 'Tarih-1', 'Coğrafya-1', 'Grafik Analizi'],
  'Sos-2': ['Genel', 'Tarih-2', 'Coğrafya-2', 'Felsefe Grubu', 'Din Kültürü', 'Grafik Analizi'],
  'Fen': ['Genel', 'Fizik', 'Kimya', 'Biyoloji', 'Grafik Analizi'],
  'Grafik Analizi': ['Genel'],
};

export default function DeepAnalysis() {
  const { selectedStudent } = useStudent();
  const [selectedExamType, setSelectedExamType] = useState('TYT');
  const [selectedCategory, setSelectedCategory] = useState('Genel');
  const [selectedSubCategory, setSelectedSubCategory] = useState('Genel');
  const [includeBranchExams, setIncludeBranchExams] = useState(false);
  const [filterDateRange, setFilterDateRange] = useState('Tüm Zamanlar');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Publishers multi-select
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);
  const [isPublisherDropdownOpen, setIsPublisherDropdownOpen] = useState(false);

  const [filterErrorType, setFilterErrorType] = useState('Tümü');

  const [exams, setExams] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      if (selectedStudent) {
         try {
             setLoading(true);
             const { studentDataService } = await import('../../services/studentDataService');
             const results = await studentDataService.getExamResults(selectedStudent.uid);
             const analysesData = await studentDataService.getStudentAnalyses(selectedStudent.uid);
             
             setExams(results);
             setAnalyses(analysesData);
         } catch (e) {
             console.error("Failed to fetch data", e);
         } finally {
             setLoading(false);
         }
      }
    };
    fetchData();
  }, [selectedStudent]);

  if (!selectedStudent) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        Lütfen bir öğrenci seçin.
      </div>
    );
  }

  // Effect to reset child tabs when parent changes
  const handleExamTypeChange = (type: string) => {
    setSelectedExamType(type);
    setSelectedCategory('Genel');
    setSelectedSubCategory('Genel');
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === 'Grafik Analizi') {
        setSelectedSubCategory('Grafik Analizi');
    } else {
        setSelectedSubCategory('Genel');
    }
  };

  const currentCategories = CATEGORIES[selectedExamType] || [];
  const currentSubCategories = SUB_CATEGORIES[selectedCategory] || [];

  // Data processing
  const examsFilteredByType = exams.filter(e => {
    // Check exam type
    let isCorrectType: boolean;
    if (includeBranchExams && e.examType === 'BRANŞ') {
       if (selectedExamType === 'TYT' && e.examName?.includes('TYT')) isCorrectType = true;
       else if (selectedExamType === 'AYT' && e.examName?.includes('AYT')) isCorrectType = true;
       else if (selectedExamType === 'YDT' && e.examName?.includes('YDT')) isCorrectType = true;
       else isCorrectType = false;
    } else {
       isCorrectType = e.examType === selectedExamType || e.examType === 'YKS';
    }
    return isCorrectType;
  });

  const computedAvailablePublishers = Array.from(new Set(examsFilteredByType.map(e => e.examName || e.publisher).filter(Boolean)));

  let filteredExams = examsFilteredByType.filter(e => {
    // Check publishers
    const nameOrPub = e.examName || e.publisher;
    if (selectedPublishers.length > 0 && nameOrPub && !selectedPublishers.includes(nameOrPub)) return false;

    // Check Date Range
    if (filterDateRange !== 'Tüm Zamanlar') {
       if (filterDateRange === 'Belirli Tarih Aralığı') {
          const date = new Date(e.date);
          if (startDate && date < new Date(startDate)) return false;
          // Set endDate to end of day
          if (endDate) {
             const ed = new Date(endDate);
             ed.setHours(23, 59, 59, 999);
             if (date > ed) return false;
          }
       } else {
          const cutoff = new Date();
          if (filterDateRange === 'Son 1 Ay') cutoff.setMonth(cutoff.getMonth() - 1);
          if (filterDateRange === 'Son 3 Ay') cutoff.setMonth(cutoff.getMonth() - 3);
          if (filterDateRange === 'Son 6 Ay') cutoff.setMonth(cutoff.getMonth() - 6);
          if (new Date(e.date) < cutoff) return false;
       }
    }
    return true;
  });

  const validExamIds = new Set(filteredExams.map(e => e.id));
  const filteredAnalyses = analyses.filter(a => validExamIds.has(a.examId));

  // Determine allowed branches
  const branchesToLookAt = CATEGORY_TO_BRANCH[selectedExamType]?.[selectedCategory] || [];

  // Get valid topics if SubCategory is selected
  let validTopicsSet = new Set<string>();
  let useTopicFilter = false;

  if (selectedSubCategory !== 'Genel') {
      useTopicFilter = true;
      let topicList: string[] = [];
      const prefix = selectedExamType; // TYT, AYT, YDT
      
      if (selectedSubCategory === 'Tarih' || selectedSubCategory === 'Tarih-1' || selectedSubCategory === 'Tarih-2') {
         topicList = BASE_TOPICS[`${prefix} Tarih`] || [];
      } else if (selectedSubCategory === 'Coğrafya' || selectedSubCategory === 'Coğrafya-1' || selectedSubCategory === 'Coğrafya-2') {
         topicList = BASE_TOPICS[`${prefix} Coğrafya`] || [];
      } else if (selectedSubCategory === 'Fizik' || selectedSubCategory === 'Kimya' || selectedSubCategory === 'Biyoloji' || selectedSubCategory === 'Matematik') {
         topicList = BASE_TOPICS[`${prefix} ${selectedSubCategory}`] || [];
      } else {
         // Generic mapping for Felsefe, vs
         topicList = BASE_TOPICS[selectedSubCategory] || [];
      }
      
      topicList.forEach(t => validTopicsSet.add(t));
  }

  // Structure to hold aggregated errors by lesson
  const lessonAggregates: Record<string, { total: number, examIds: Set<string>, topics: Record<string, Record<string, number>> }> = {};
  let totalErrorsCount = 0;
  const involvedExamIds = new Set<string>();

  const getLessonByContext = (topic: string, questionNo: number, branch: string, isAyt: boolean, isYdt: boolean) => {
      const strictBranch = branch.replace(' (TYT)', '').replace(' (AYT)', '').replace(' (YDT)', '').trim();
      
      // 1. Question number based mapping for conglomerate branches
      if (strictBranch === 'Sosyal Bilimler') {
          if (questionNo <= 5) return 'Tarih';
          if (questionNo <= 10) return 'Coğrafya';
          if (questionNo <= 15) return 'Felsefe';
          return 'Din Kültürü';
      }
      if (strictBranch === 'Fen Bilimleri') {
          if (isAyt) {
              if (questionNo <= 14) return 'Fizik';
              if (questionNo <= 27) return 'Kimya';
              return 'Biyoloji';
          } else {
              if (questionNo <= 7) return 'Fizik';
              if (questionNo <= 14) return 'Kimya';
              return 'Biyoloji';
          }
      }
      if (strictBranch === 'Temel Matematik' || strictBranch === 'Matematik') {
          if (questionNo > 30) return 'Geometri';
          return 'Matematik';
      }
      if (strictBranch === 'Ed-Sos-1' || strictBranch === 'Edebiyat-Sosyal-1') {
          if (questionNo <= 24) return 'Edebiyat';
          if (questionNo <= 34) return 'Tarih';
          return 'Coğrafya';
      }
      if (strictBranch === 'Sosyal-2') {
          if (questionNo <= 11) return 'Tarih';
          if (questionNo <= 22) return 'Coğrafya';
          if (questionNo <= 34) return 'Felsefe Grubu';
          return 'Din Kültürü';
      }

      // 2. Topic list based mapping
      for (const [lesson, topics] of Object.entries(BASE_TOPICS)) {
          if (['TYT', 'AYT', 'YDT', 'YKS', 'SAYISAL', 'SÖZEL', 'EA', 'SAY'].includes(lesson)) continue;
          
          if (Array.isArray(topics) && topics.includes(topic)) {
              return lesson.replace('TYT ', '').replace('AYT ', '');
          }
      }

      // 3. Fallback to branch name
      const genericBranches = ['Sosyal Bilimler', 'Fen Bilimleri', 'Temel Matematik', 'Matematik', 'Ed-Sos-1', 'Sosyal-2', 'Edebiyat-Sosyal-1'];
      if (!genericBranches.includes(strictBranch)) {
          return strictBranch;
      }

      return 'Diğer Konular';
  };

  filteredAnalyses.forEach(analysis => {
      if (!analysis.data) return;
      
      const isAyt = analysis.examType === 'AYT' || (analysis.examType === 'BRANŞ' && analysis.examName?.includes('AYT'));
      const isYdt = analysis.examType === 'YDT' || (analysis.examType === 'BRANŞ' && analysis.examName?.includes('YDT'));

      let examHasErrors = false;

      branchesToLookAt.forEach(branch => {
          if (analysis.data[branch]) {
             analysis.data[branch].forEach((q: any) => {
                 // Determine lesson even if no error, to count exam
                 const lesson = getLessonByContext(q.topic, q.questionNo, branch, isAyt, isYdt);
                 if (!lessonAggregates[lesson]) {
                     lessonAggregates[lesson] = { total: 0, examIds: new Set(), topics: {} };
                 }
                 
                 // If we are filtering by SubCategory topics, and this topic doesn't match, we might not count it
                 if (useTopicFilter && !validTopicsSet.has(q.topic)) return;

                 // Count this exam for this lesson
                 lessonAggregates[lesson].examIds.add(analysis.examId);

                 if (q.errorType && q.errorType !== 'none') {
                     // Filter by errorType dropdown
                     if (filterErrorType !== 'Tümü' && q.errorType !== filterErrorType) return;

                     examHasErrors = true;

                     if (!lessonAggregates[lesson].topics[q.topic]) {
                         lessonAggregates[lesson].topics[q.topic] = {};
                     }
                     
                     lessonAggregates[lesson].topics[q.topic][q.errorType] = (lessonAggregates[lesson].topics[q.topic][q.errorType] || 0) + 1;
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
   .filter(lesson => lessonAggregates[lesson].total > 0)
   .map(lesson => {
      const { total, examIds, topics: rawTopics } = lessonAggregates[lesson];
      
      const topics = Object.keys(rawTopics).map(topic => {
          const types = rawTopics[topic];
          const topicTotal = Object.values(types).reduce((a, b) => a + b, 0);
          return { topic, types, total: topicTotal };
      }).sort((a, b) => b.total - a.total);

      return { lesson, total, examCount: examIds.size, topics };
  }).sort((a, b) => b.total - a.total);

  // Simpler to just map through errorAggregates directly. Let's rebuild a flat list from valid filtered analyses for Genel
  const errorAggregates: Record<string, Record<string, number>> = {};
  filteredAnalyses.forEach(analysis => {
      if (!analysis.data) return;
      
      const isAyt = analysis.examType === 'AYT' || (analysis.examType === 'BRANŞ' && analysis.examName?.includes('AYT'));
      const isYdt = analysis.examType === 'YDT' || (analysis.examType === 'BRANŞ' && analysis.examName?.includes('YDT'));

      branchesToLookAt.forEach(branch => {
          if (analysis.data[branch]) {
             analysis.data[branch].forEach((q: any) => {
                 if (q.errorType && q.errorType !== 'none') {
                     if (filterErrorType !== 'Tümü' && q.errorType !== filterErrorType) return;
                     if (useTopicFilter && !validTopicsSet.has(q.topic)) return;

                     if (!errorAggregates[q.topic]) {
                         errorAggregates[q.topic] = {};
                     }
                     errorAggregates[q.topic][q.errorType] = (errorAggregates[q.topic][q.errorType] || 0) + 1;
                 }
             });
          }
      });
  });

  const topicsSummary = Object.keys(errorAggregates).map(topic => {
      const types = errorAggregates[topic];
      const total = Object.values(types).reduce((a, b) => a + b, 0);
      return { topic, types, total };
  }).sort((a, b) => b.total - a.total);

  // Data for Charts
  const errorTypeChartData = useMemo(() => {
    const counts: Record<string, number> = { 'bilgi': 0, 'kalip': 0, 'dikkat': 0, 'zaman': 0 };
    filteredAnalyses.forEach(analysis => {
      if (!analysis.data) return;
      branchesToLookAt.forEach(branch => {
        if (analysis.data[branch]) {
          analysis.data[branch].forEach((q: any) => {
            if (q.errorType && q.errorType !== 'none') {
              if (counts.hasOwnProperty(q.errorType)) {
                counts[q.errorType]++;
              }
            }
          });
        }
      });
    });
    return [
      { name: 'Bilgi Eksikliği', value: counts.bilgi, color: '#10b981' },
      { name: 'Soru Kalıbı', value: counts.kalip, color: '#3b82f6' },
      { name: 'Dikkat Hatası', value: counts.dikkat, color: '#f59e0b' },
      { name: 'Zaman Hatası', value: counts.zaman, color: '#ef4444' }
    ].filter(d => d.value > 0);
  }, [filteredAnalyses, branchesToLookAt]);

  const lessonErrorChartData = useMemo(() => {
    return lessonsSummary.map(l => ({
      name: l.lesson,
      Hata: l.total
    })).slice(0, 8);
  }, [lessonsSummary]);

  const getScoreTuple = (exam: any, branchName: string, analysisBranchArray: any[]) => {
      let c = 0;
      const pureName = branchName.replace(' (TYT)', '').replace(' (AYT)', '').replace(' (YDT)', '').trim();
      const possibleNames = [
          branchName, 
          pureName, 
          branchName + ' Denemesi', 
          pureName + ' Denemesi',
          branchName === 'Temel Matematik' ? 'Matematik' : null,
          branchName === 'Matematik' ? 'Temel Matematik' : null,
          branchName === 'Fen Bilimleri' ? 'Fen' : null,
          branchName === 'Sosyal Bilimler' ? 'Sosyal' : null,
      ].filter(Boolean) as string[];

      let scoreFound = false;
      if (exam.scores) {
          for(const pn of possibleNames) {
              if(exam.scores[pn]) {
                  c = Number(exam.scores[pn].c) || 0;
                  scoreFound = true;
                  break;
              }
          }
      }

      if (!scoreFound && exam.examType === 'BRANŞ' && exam.scores) {
          const keys = Object.keys(exam.scores);
          if(keys.length === 1) {
              c = Number(exam.scores[keys[0]].c) || 0;
              scoreFound = true;
          }
      }
      const max = analysisBranchArray.length;
      if (scoreFound) {
          return { yapilan: c, yapilamayan: max - c };
      }
      
      let yapilanFallback = 0;
      let yapilamayanFallback = 0;
      analysisBranchArray.forEach((q: any) => {
          if (q.errorType && q.errorType !== 'none') yapilamayanFallback++;
          else yapilanFallback++;
      });
      return { yapilan: yapilanFallback, yapilamayan: yapilamayanFallback };
  };

  const publisherChartData = useMemo(() => {
    const dataMap: Record<string, { publisher: string; Yapılan: number; Yapılamayan: number }> = {};
    filteredExams.forEach(exam => {
      const pub = exam.publisher || exam.examName || 'Bilinmiyor';
      if (!dataMap[pub]) {
        dataMap[pub] = { publisher: pub, Yapılan: 0, Yapılamayan: 0 };
      }
      const analysis = filteredAnalyses.find(a => a.examId === exam.id);
      if (analysis?.data) {
        branchesToLookAt.forEach(branch => {
          if (analysis.data[branch]) {
            const { yapilan, yapilamayan } = getScoreTuple(exam, branch, analysis.data[branch]);
            dataMap[pub].Yapılan += yapilan;
            dataMap[pub].Yapılamayan += yapilamayan;
          }
        });
      }
    });
    return Object.values(dataMap);
  }, [filteredExams, filteredAnalyses, branchesToLookAt]);

  const lessonCompareChartData = useMemo(() => {
    const dataMap: Record<string, { lesson: string; Yapılan: number; Yapılamayan: number }> = {};
    filteredExams.forEach(exam => {
      const analysis = filteredAnalyses.find(a => a.examId === exam.id);
      if (analysis?.data) {
        branchesToLookAt.forEach(branch => {
          if (analysis.data[branch]) {
            // conglomerate branches breakdown
            const isMajor = ['Sosyal Bilimler', 'Fen Bilimleri', 'Sosyal Bilimler (TYT)', 'Fen Bilimleri (TYT)', 'Sosyal-2', 'Sosyal-2 (AYT)', 'Temel Matematik', 'Matematik', 'Ed-Sos-1', 'Edebiyat-Sosyal-1'].includes(branch);
            
            if (isMajor) {
               analysis.data[branch].forEach((q: any) => {
                  const isAyt = branch.includes('AYT');
                  const isYdt = branch.includes('YDT');
                  const lesson = getLessonByContext(q.topic, q.questionNo, branch, isAyt, isYdt);
                  const cleanLesson = lesson.replace('TYT ', '').replace('AYT ', '').replace('YDT ', '');

                  if (!dataMap[cleanLesson]) {
                    dataMap[cleanLesson] = { lesson: cleanLesson, Yapılan: 0, Yapılamayan: 0 };
                  }
                  if (q.errorType && q.errorType !== 'none') {
                    dataMap[cleanLesson].Yapılamayan++;
                  } else {
                    dataMap[cleanLesson].Yapılan++;
                  }
               });
            } else {
              const lessonName = branch.replace(' (TYT)', '').replace(' (AYT)', '').replace(' (YDT)', '');
              if (!dataMap[lessonName]) {
                dataMap[lessonName] = { lesson: lessonName, Yapılan: 0, Yapılamayan: 0 };
              }
              const { yapilan, yapilamayan } = getScoreTuple(exam, branch, analysis.data[branch]);
              dataMap[lessonName].Yapılan += yapilan;
              dataMap[lessonName].Yapılamayan += yapilamayan;
            }
          }
        });
      }
    });
    return Object.values(dataMap).map(item => {
      const total = item.Yapılan + item.Yapılamayan;
      return {
        ...item,
        SuccessRate: total > 0 ? Number(((item.Yapılan / total) * 100).toFixed(1)) : 0
      };
    }).sort((a,b) => (b.SuccessRate) - (a.SuccessRate));
  }, [filteredExams, filteredAnalyses, branchesToLookAt]);

  const completionChartData = useMemo(() => {
    let toplamyapilan = 0;
    let topologyapilamayan = 0;
    filteredExams.forEach(exam => {
      const analysis = filteredAnalyses.find(a => a.examId === exam.id);
      if (analysis?.data) {
        branchesToLookAt.forEach(branch => {
          if (analysis.data[branch]) {
            const { yapilan, yapilamayan } = getScoreTuple(exam, branch, analysis.data[branch]);
            toplamyapilan += yapilan;
            topologyapilamayan += yapilamayan;
          }
        });
      }
    });
    return [
      { name: 'Yapılan', value: toplamyapilan, fill: '#10b981' },
      { name: 'Yapılamayan', value: topologyapilamayan, fill: '#ef4444' }
    ];
  }, [filteredExams, filteredAnalyses, branchesToLookAt]);

  const questionNumberChartData = useMemo(() => {
    const counts: Record<number, number> = {};
    filteredAnalyses.forEach(analysis => {
      if (analysis?.data) {
        branchesToLookAt.forEach(branch => {
          if (analysis.data[branch]) {
            analysis.data[branch].forEach((q: any) => {
              if (q.errorType && q.errorType !== 'none') {
                counts[q.questionNo] = (counts[q.questionNo] || 0) + 1;
              }
            })
          }
        })
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
    filteredExams.forEach(exam => {
      const analysis = filteredAnalyses.find(a => a.examId === exam.id);
      if (analysis?.data) {
         branchesToLookAt.forEach(branch => {
           if (analysis.data[branch]) {
             analysis.data[branch].forEach((q: any) => {
               if (q.errorType && q.errorType !== 'none') {
                  list.push({
                     examName: exam.examName || exam.publisher || 'Bilinmeyen',
                     date: new Date(exam.date).toLocaleDateString('tr-TR'),
                     lesson: branch.replace(' (TYT)', '').replace(' (AYT)', ''),
                     questionNo: q.questionNo,
                     topic: q.topic || 'Belirtilmedi',
                     errorType: q.errorType
                  });
               }
             });
           }
         })
      }
    });
    return list.sort((a,b) => {
      const dateA = a.date.split('.').reverse().join('-');
      const dateB = b.date.split('.').reverse().join('-');
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [filteredExams, filteredAnalyses, branchesToLookAt]);

  const timelineChartData = useMemo(() => {
    const sortedExams = [...filteredExams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sortedExams.map(exam => {
      const analysis = filteredAnalyses.find(a => a.examId === exam.id);
      let errorCount = 0;
      if (analysis?.data) {
        branchesToLookAt.forEach(branch => {
          if (analysis.data[branch]) {
            analysis.data[branch].forEach((q: any) => {
              if (q.errorType && q.errorType !== 'none') errorCount++;
            });
          }
        });
      }
      return {
        date: new Date(exam.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
        Hata: errorCount,
        name: exam.examName || 'Deneme'
      };
    }).slice(-15);
  }, [filteredExams, filteredAnalyses, branchesToLookAt]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight flex items-center gap-3">
          <Search className="text-emerald-500" size={28} />
          DERİN ANALİZ
        </h1>
        <p className="text-slate-500 mt-2 flex items-center gap-2 text-sm">
          <Info size={14} /> {selectedStudent.displayName} adlı öğrencinin detaylı deneme performans analizleri.
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-visible relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />
        <div className="p-8">
          
          {/* Level 1: Exam Type */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 relative z-50 w-full border-b border-white/5 pb-6">
            <div className="flex bg-black/40 p-1.5 rounded-2xl w-full sm:w-fit border border-white/5">
              {EXAM_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => handleExamTypeChange(type)}
                  className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    selectedExamType === type
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto relative">
              <div className="flex gap-2">
                <select 
                  value={filterDateRange}
                  onChange={e => setFilterDateRange(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 h-10"
                >
                  <option value="Tüm Zamanlar" className="bg-slate-900 text-white">Tarih: Tüm Zamanlar</option>
                  <option value="Son 1 Ay" className="bg-slate-900 text-white">Son 1 Ay</option>
                  <option value="Son 3 Ay" className="bg-slate-900 text-white">Son 3 Ay</option>
                  <option value="Son 6 Ay" className="bg-slate-900 text-white">Son 6 Ay</option>
                  <option value="Belirli Tarih Aralığı" className="bg-slate-900 text-white">Belirli Tarih Aralığı</option>
                </select>

                {filterDateRange === 'Belirli Tarih Aralığı' && (
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
                  onClick={() => setIsPublisherDropdownOpen(!isPublisherDropdownOpen)}
                  className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 flex flex-col justify-center h-10 min-w-[140px] text-left"
                >
                  <span className="truncate w-full block">
                    {selectedPublishers.length === 0 ? 'Sınav / Deneme Adı: Tümü' : `Seçili Deneme: ${selectedPublishers.length}`}
                  </span>
                </button>

                {isPublisherDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800 border border-white/10 rounded-2xl shadow-xl z-50 p-2 overflow-y-auto max-h-60">
                    {computedAvailablePublishers.length === 0 ? (
                      <p className="text-white/50 text-xs p-2">Henüz deneme bulunamadı.</p>
                    ) : (
                      computedAvailablePublishers.map((pub: string) => {
                        const isSelected = selectedPublishers.includes(pub);
                        return (
                          <label key={pub} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedPublishers(prev => prev.filter(p => p !== pub));
                                } else {
                                  setSelectedPublishers(prev => [...prev, pub]);
                                }
                              }}
                              className="w-4 h-4 rounded border-white/20 bg-black/20 text-emerald-500 focus:ring-emerald-500/30"
                            />
                            <span className="text-sm font-medium text-slate-300">{pub}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <select 
                value={filterErrorType}
                onChange={e => setFilterErrorType(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 h-10"
              >
                <option value="Tümü" className="bg-slate-900 text-white">Hata Türü: Tümü</option>
                <option value="bilgi" className="bg-slate-900 text-white">Bilgi Eksikliği</option>
                <option value="kalip" className="bg-slate-900 text-white">Soru Kalıp Eksikliği</option>
                <option value="dikkat" className="bg-slate-900 text-white">Dikkat Hatası</option>
                <option value="zaman" className="bg-slate-900 text-white">Zaman Yetmezliği</option>
              </select>
            </div>
          </div>

          {/* Level 2: Subject Categories */}
          {currentCategories.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 relative z-10 w-full">
              <div className="flex flex-wrap gap-2">
                {currentCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedCategory === cat
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-black/20 text-slate-400 border border-white/5 hover:border-white/20 hover:text-white'
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
                <span className="text-xs font-medium text-slate-300">Branş / Ders denemelerini dahil et</span>
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
                {currentSubCategories.map(subCat => (
                  <button
                    key={subCat}
                    onClick={() => setSelectedSubCategory(subCat)}
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      selectedSubCategory === subCat
                        ? 'bg-slate-700 text-white border border-slate-600 shadow-sm'
                        : 'bg-transparent text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {subCat}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Data View */}
          <div className="mt-8">
             {loading ? (
                 <div className="border border-dashed border-white/10 rounded-3xl min-h-[400px] flex items-center justify-center p-8 bg-black/20">
                     <p className="text-slate-400">Veriler yükleniyor...</p>
                 </div>
             ) : (
                (selectedSubCategory === 'Grafik Analizi' || selectedCategory === 'Grafik Analizi') 
                  ? ((completionChartData[0]?.value || 0) + (completionChartData[1]?.value || 0) === 0)
                  : (selectedCategory === 'Genel' || selectedSubCategory === 'Genel' ? topicsSummary.length === 0 : lessonsSummary.length === 0)
             ) ? (
                 <div className="border border-dashed border-white/10 rounded-3xl min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-black/20 relative z-10">
                   <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/20 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                      <BarChart2 size={32} />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">
                      Veri Bulunamadı
                   </h3>
                   <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                     Seçili filtrelere uygun analiz edilmiş hiçbir deneme veya hata türü bulunmuyor. Lütfen filtrelerinizi değiştirin.
                   </p>
                 </div>
             ) : (
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4 text-sm font-semibold text-emerald-400 bg-emerald-500/10 px-6 py-4 rounded-2xl border border-emerald-500/20">
                        <Info size={16} /> 
                        Belirtilen filtrelere göre toplam {totalErrorsCount} adet hata kaydı bulundu. ({involvedExamIds.size} Denemede)
                    </div>

                    {(selectedSubCategory === 'Grafik Analizi' || selectedCategory === 'Grafik Analizi') ? (
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
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                            <XAxis dataKey="publisher" stroke="#94a3b8" fontSize={10} tick={{fill: '#94a3b8'}} />
                                            <YAxis stroke="#94a3b8" fontSize={10} tick={{fill: '#94a3b8'}} />
                                            <RechartsTooltip 
                                                cursor={{fill: '#ffffff05'}}
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                                            />
                                            <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                                            <Bar dataKey="Yapılan" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                                            <Bar dataKey="Yapılamayan" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
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
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={true} vertical={false} />
                                            <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={10} tick={{fill: '#94a3b8'}} />
                                            <YAxis dataKey="lesson" type="category" stroke="#94a3b8" fontSize={10} tick={{fill: '#94a3b8'}} width={90} />
                                            <RechartsTooltip 
                                                cursor={{fill: '#ffffff05'}}
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                                                formatter={(value: any) => [`%${value}`, 'Başarı Oranı']}
                                            />
                                            <Bar 
                                               dataKey="SuccessRate" 
                                               fill="#3b82f6" 
                                               radius={[0, 4, 4, 0]}
                                               label={{ position: 'right', fill: '#94a3b8', fontSize: 10, formatter: (val: any) => `%${val}` }}
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
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
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
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip 
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36}/>
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
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                            <XAxis dataKey="questionNo" stroke="#94a3b8" fontSize={10} tick={{fill: '#94a3b8'}} />
                                            <YAxis stroke="#94a3b8" fontSize={10} tick={{fill: '#94a3b8'}} />
                                            <RechartsTooltip 
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                                            />
                                            <Line type="monotone" dataKey="Hata" stroke="#a855f7" strokeWidth={2} dot={{ r: 2, fill: '#a855f7' }} activeDot={{ r: 5 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Chart 6: Kaçıncı Soru Neden Eksik Kaldı Tablosu */}
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 lg:col-span-2 overflow-hidden flex flex-col">
                                <h3 className="text-white font-bold mb-6 flex items-center gap-2 shrink-0">
                                    <Info size={18} className="text-amber-500" />
                                    Hata Detay Tablosu
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[700px]">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-xs font-semibold text-slate-400 p-3 pb-4">Tarih</th>
                                                <th className="text-xs font-semibold text-slate-400 p-3 pb-4">Yayın</th>
                                                <th className="text-xs font-semibold text-slate-400 p-3 pb-4">Ders</th>
                                                <th className="text-xs font-semibold text-slate-400 p-3 pb-4">Soru No</th>
                                                <th className="text-xs font-semibold text-slate-400 p-3 pb-4">Konu</th>
                                                <th className="text-xs font-semibold text-slate-400 p-3 pb-4">Hata Türü</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {questionErrorTableData.map((row, idx) => {
                                                let errColor = 'text-slate-400';
                                                let errLabel = row.errorType;
                                                if (row.errorType === 'bilgi') { errColor = 'text-emerald-400'; errLabel = 'Bilgi Eksikliği'; }
                                                else if (row.errorType === 'kalip') { errColor = 'text-blue-400'; errLabel = 'Soru Kalıbı'; }
                                                else if (row.errorType === 'dikkat') { errColor = 'text-amber-400'; errLabel = 'Dikkat Hatası'; }
                                                else if (row.errorType === 'zaman') { errColor = 'text-rose-400'; errLabel = 'Zaman Hatası'; }

                                                return (
                                                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                        <td className="p-3 text-sm text-slate-300">{row.date}</td>
                                                        <td className="p-3 text-sm text-white font-medium">{row.examName}</td>
                                                        <td className="p-3 text-sm text-indigo-300">{row.lesson}</td>
                                                        <td className="p-3 text-sm text-slate-300 font-mono">{row.questionNo}</td>
                                                        <td className="p-3 text-sm text-slate-300">{row.topic}</td>
                                                        <td className={`p-3 text-sm font-medium ${errColor}`}>{errLabel}</td>
                                                    </tr>
                                                );
                                            })}
                                            {questionErrorTableData.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="p-8 text-center text-slate-500">Hata kaydı bulunamadı.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : selectedCategory === 'Genel' || selectedSubCategory === 'Genel' ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {topicsSummary.map(item => (
                              <div key={item.topic} className="bg-white/5 border border-emerald-500/10 rounded-2xl p-5 hover:bg-emerald-500/5 transition-all outline outline-1 outline-transparent hover:outline-emerald-500/20">
                                 <h4 className="text-white font-bold mb-4 line-clamp-1 flex justify-between items-center gap-2">
                                     <span className="truncate" title={item.topic}>{item.topic}</span>
                                     <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded text-xs shrink-0">{item.total} Hata</span>
                                 </h4>
                                 <div className="space-y-2">
                                     {Object.entries(item.types).sort((a,b) => b[1] - a[1]).map(([type, count]) => {
                                        let readableType = type;
                                        if (type === 'bilgi') readableType = 'Bilgi Eksikliği';
                                        else if (type === 'kalip') readableType = 'Soru Kalıp Eksikliği';
                                        else if (type === 'dikkat') readableType = 'Dikkat Hatası';
                                        else if (type === 'zaman') readableType = 'Zaman Yetmezliği';
                                        return (
                                          <div key={type} className="flex justify-between items-center text-xs">
                                              <span className="text-slate-400">{readableType}</span>
                                              <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded w-8 text-center">{count as React.ReactNode}</span>
                                          </div>
                                        );
                                     })}
                                 </div>
                              </div>
                           ))}
                       </div>
                    ) : (
                       <div className="flex flex-col gap-8">
                           {lessonsSummary.map(lessonInfo => (
                              <div key={lessonInfo.lesson} className="space-y-4 relative">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {lessonInfo.topics.map(item => (
                                     <div key={item.topic} className="bg-white/5 border border-emerald-500/10 rounded-2xl p-5 hover:bg-emerald-500/5 transition-all outline outline-1 outline-transparent hover:outline-emerald-500/20">
                                        <h4 className="text-white font-bold mb-4 line-clamp-1 flex justify-between items-center gap-2">
                                            <span className="truncate" title={item.topic}>{item.topic}</span>
                                            <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded text-xs shrink-0">{item.total} Hata</span>
                                        </h4>
                                        <div className="space-y-2">
                                            {Object.entries(item.types).sort((a,b) => b[1] - a[1]).map(([type, count]) => {
                                               let readableType = type;
                                               if (type === 'bilgi') readableType = 'Bilgi Eksikliği';
                                               else if (type === 'kalip') readableType = 'Soru Kalıp Eksikliği';
                                               else if (type === 'dikkat') readableType = 'Dikkat Hatası';
                                               else if (type === 'zaman') readableType = 'Zaman Yetmezliği';
                                               return (
                                                 <div key={type} className="flex justify-between items-center text-xs">
                                                     <span className="text-slate-400">{readableType}</span>
                                                     <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded w-8 text-center">{count as React.ReactNode}</span>
                                                 </div>
                                               );
                                            })}
                                        </div>
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
