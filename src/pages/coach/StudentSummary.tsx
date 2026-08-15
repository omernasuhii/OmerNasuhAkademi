import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AlertTriangle, BookOpen, 
  TrendingUp, 
  Target,
  ChevronRight,
  Sparkles,
  BrainCircuit,
  BarChart3,
  Calendar,
  CheckCircle2,
  PieChart,
  Activity,
  History,
  AlertCircle,
  Trophy,
  Zap,
  Quote,
  Compass,
  MessageCircle
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useStudent } from '../../lib/StudentContext';
import { useAuth } from '../../lib/AuthContext';
import { tourService } from '../../services/tourService';
import { studentDataService } from '../../services/studentDataService';
import { OnboardingTour, TourStep } from '../../components/OnboardingTour';
import NoStudentSelected from '../../components/NoStudentSelected';
import { SAMPLE_DEMO_STUDENT } from './CoachStudents';
import { calculateSubjectMultipliers, calculateDailyCompletionWithMultipliers } from '../../lib/programCalculations';

export default function StudentSummary() {
  const { user, userData } = useAuth();
  const { selectedStudent, setSelectedStudent } = useStudent();
  const navigate = useNavigate();
  const location = useLocation();

  const [books, setBooks] = useState<any[]>([]);
  const [program, setProgram] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [dailyPrograms, setDailyPrograms] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyGoal, setMonthlyGoal] = useState<any>(null);
  const [selectedEvaluationWeek, setSelectedEvaluationWeek] = useState<string>('');
  const [evaluationText, setEvaluationText] = useState<string>('');
  const [isSavingEvaluation, setIsSavingEvaluation] = useState<boolean>(false);
  const [isGeneratingEval, setIsGeneratingEval] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [parentPhone, setParentPhone] = useState<string>('');

  const activeStudent = selectedStudent || (location.state?.startTour || location.state?.isDemo ? SAMPLE_DEMO_STUDENT : null);
  const isDemo = activeStudent?.isDemo || location.state?.isDemo;

  useEffect(() => {
    if (activeStudent) {
      const studentObj = activeStudent as any;
      if (studentObj.parentPhone) {
        setParentPhone(studentObj.parentPhone);
      } else if (studentObj.phone) {
        setParentPhone(studentObj.parentPhone || studentObj.phone);
      } else if (studentObj.parentUid) {
        getDoc(doc(db, 'users', studentObj.parentUid)).then(snap => {
          if (snap.exists()) {
            const pData = snap.data();
            setParentPhone(pData.phone || pData.phoneNumber || pData.parentPhone || '');
          }
        }).catch(console.error);
      } else if (studentObj.uid) {
        const qParent = query(collection(db, 'users'), where('role', '==', 'parent'), where('studentUid', '==', studentObj.uid));
        getDocs(qParent).then(snap => {
          if (!snap.empty) {
            const pData = snap.docs[0].data();
            setParentPhone(pData.phone || pData.phoneNumber || pData.parentPhone || '');
          } else {
            setParentPhone(studentObj.phone || '');
          }
        }).catch(console.error);
      }
    } else {
      setParentPhone('');
    }
  }, [activeStudent]);

  useEffect(() => {
    if (tourService.shouldAutoStartTour('student_summary', userData, location.state?.startTour)) {
      if (!selectedStudent) {
        setSelectedStudent(SAMPLE_DEMO_STUDENT);
      }
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedStudent, setSelectedStudent, location.state, userData]);

  const handleEndTour = () => {
    setIsTourOpen(false);
    tourService.markTourCompleted('student_summary', user?.uid);
    if (selectedStudent?.isDemo) {
      setSelectedStudent(null);
      navigate('/panel/koc');
    }
  };

  const studentSummaryTourSteps: TourStep[] = [
    {
      targetId: 'tour-student-summary-profile',
      title: 'Öğrenci Profili',
      description: 'Seçilen öğrencinin sınıf seviyesi, alan bilgisi, ve temel profili.',
      position: 'bottom',
      badge: 'Kimlik Kartı'
    },
    {
      targetId: 'tour-student-summary-goals',
      title: 'Akademik Hedefler',
      description: 'Öğrencinin hedef üniversitesi ve TYT/AYT net hedefleri bu alanda yer almaktadır.',
      position: 'bottom',
      badge: 'Hedefler'
    },
    {
      targetId: 'tour-student-summary-targets',
      title: 'Aylık İlerleme Grafikleri',
      description: 'Öğrencinin bu ayki konu tamamlama ve kitap bitirme hedeflerine yakınlık oranları hesaplanır.',
      position: 'left',
      badge: 'Gelişim Analizi'
    },
    {
      targetId: 'tour-student-summary-metrics',
      title: 'Haftalık Soru ve Ödev Metrikleri',
      description: 'Öğrencinin çözdüğü toplam soru ve eksik kalan görevleri buradan takip edilebilir.',
      position: 'bottom',
      badge: 'Performans Takibi'
    },
    {
      targetId: 'tour-student-summary-tyt-exams',
      title: 'TYT Deneme Ortalamaları',
      description: 'Son girilen TYT deneme sınavlarının net ortalamaları otomatik karşılaştırılır.',
      position: 'top',
      badge: 'Deneme Analizleri'
    },
    {
      targetId: 'tour-student-summary-ayt-exams',
      title: 'AYT Deneme Ortalamaları',
      description: 'Son girilen AYT deneme sınavlarının net ortalamaları burada gösterilir.',
      position: 'top',
      badge: 'Deneme Analizleri'
    },
    {
      targetId: 'tour-student-summary-evaluation',
      title: 'Haftalık Koç Değerlendirmesi & AI Asistan',
      description: 'Her hafta öğrencinize özel koç notu yazabilir veya Yapay Zeka butonuna basarak anında haftalık koçluk raporu üretebilirsiniz.',
      position: 'top',
      badge: 'AI Raporlama'
    },
    {
      targetId: 'tour-student-summary-coach-note',
      title: 'Koçun Notu',
      description: 'Öğrenciniz için bu aya özel yazdığınız genel değerlendirme notunu burada görebilirsiniz.',
      position: 'top',
      badge: 'Aylık Hedefler'
    },
    {
      targetId: 'tour-student-summary-weekly-reports',
      title: 'Haftalık Performans Özeti',
      description: 'Öğrencinizin geçmiş haftalardaki performans geçmişini, görev tamamlama oranlarını ve çözdüğü soruları inceleyebilirsiniz.',
      position: 'top',
      badge: 'Geçmiş Analiz'
    }
  ];

  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

const DEMO_EXAMS = [
  {
    examType: 'TYT',
    date: '2026-08-01',
    publisher: '3D Yayınları',
    name: '3D Türkiye Geneli TYT-1',
    analyzed: true,
    scores: {
      'Türkçe': { n: '34.5', d: 36, y: 4 },
      'Sosyal Bilimler': { n: '16.0', d: 17, y: 4 },
      'Matematik': { n: '32.5', d: 34, y: 6 },
      'Fen Bilimleri': { n: '17.5', d: 18, y: 2 },
      'totalNet': 100.5,
      'percentile': '1.2'
    }
  },
  {
    examType: 'AYT',
    date: '2026-08-02',
    publisher: 'Bilgi Sarmal',
    name: 'Bilgi Sarmal AYT-2',
    analyzed: true,
    scores: {
      'Matematik': { n: '34.0', d: 35, y: 4 },
      'Fen Bilimleri': { n: '34.0', d: 35, y: 4 },
      'Sos-1': { n: '0.0', d: 0, y: 0 },
      'Sos-2': { n: '0.0', d: 0, y: 0 },
      'Dil': { n: '0.0', d: 0, y: 0 },
      'totalNet': 68.0
    }
  }
];

const DEMO_MONTHLY_GOAL = {
  coachNote: "Ahmet bu ay TYT ve AYT genel denemelerinde %14 net artışı yakaladı. Özellikle Paragraf rutinleri ve Matematik branş denemelerindeki istikrarını tebrik ediyorum. Önümüzdeki ay İntegral ve Organik Kimya derin analizlerine geçeceğiz.",
  topicGoals: [
    { name: 'Türev & İntegral', isCompleted: true },
    { name: 'Elektrik & Manyetizma', isCompleted: true },
    { name: 'Organik Kimya', isCompleted: true },
    { name: 'Bitki Biyolojisi', isCompleted: false },
    { name: 'Paragraf Rutini (1000 Soru)', isCompleted: true }
  ],
  bookGoals: [
    { title: 'Palme Biyoloji Soru Bankası', progress: 75 },
    { title: 'Biyotik Biyoloji Soru Bankası', progress: 60 },
    { title: 'Bilgi Sarmal Fizik', progress: 70 }
  ]
};

const DEMO_BOOKS = [
  { id: '1', title: 'Palme Biyoloji Soru Bankası', totalPages: 240, completedPages: 180 },
  { id: '2', title: 'Biyotik Biyoloji Soru Bankası', totalPages: 200, completedPages: 120 },
  { id: '3', title: 'Bilgi Sarmal Fizik Soru Bankası', totalPages: 280, completedPages: 210 }
];

const DEMO_DAILY_PROGRAMS = [
  {
    date: '2026-08-01',
    tasks: [
      { type: 'Soru Çözümü', targetCount: 150, completedCount: 150, isDone: true },
      { type: 'Konu Çalışması', isDone: true }
    ]
  },
  {
    date: '2026-08-02',
    tasks: [
      { type: 'Deneme', targetCount: 120, completedCount: 120, isDone: true },
      { type: 'Soru Çözümü', targetCount: 100, completedCount: 100, isDone: true }
    ]
  }
];

  useEffect(() => {
    if (!activeStudent) {
      setLoading(false);
      return;
    }
    const activeUid = activeStudent.uid;
    setLoading(true);
    Promise.all([
      studentDataService.getBookTracking(activeUid),
      studentDataService.getWeeklyPrograms(activeUid),
      studentDataService.getWeeklyReports(activeUid),
      studentDataService.getAllDailyPrograms(activeUid),
      studentDataService.getExamResults(activeUid),
      studentDataService.getMonthlyGoal(activeUid, currentMonthStr)
    ]).then(([booksData, programData, reportsData, dailyProgramsData, examsData, monthlyGoalData]) => {
      const isDemoMode = isTourOpen;
      
      setBooks((booksData && booksData.length > 0) ? booksData : (isDemoMode ? DEMO_BOOKS : []));
      setProgram(programData[0] || null);
      setReports(reportsData);
      setDailyPrograms((dailyProgramsData && dailyProgramsData.length > 0) ? dailyProgramsData : (isDemoMode ? DEMO_DAILY_PROGRAMS : []));
      setExams((examsData && examsData.length > 0) ? examsData : (isDemoMode ? DEMO_EXAMS : []));
      setMonthlyGoal(monthlyGoalData || (isDemoMode ? DEMO_MONTHLY_GOAL : null));
      setLoading(false);
    }).catch(() => {
      const isDemoMode = isTourOpen;
      setBooks(isDemoMode ? DEMO_BOOKS : []);
      setDailyPrograms(isDemoMode ? DEMO_DAILY_PROGRAMS : []);
      setExams(isDemoMode ? DEMO_EXAMS : []);
      setMonthlyGoal(isDemoMode ? DEMO_MONTHLY_GOAL : null);
      setLoading(false);
    });
  }, [activeStudent, currentMonthStr, isTourOpen]);

  // Goal Progress Calculations
  const topicGoalsCount = monthlyGoal?.topicGoals?.length || 0;
  const completedTopicGoals = monthlyGoal?.topicGoals?.filter((t: any) => t.isCompleted)?.length || 0;
  const topicProgress = topicGoalsCount > 0 ? Math.round((completedTopicGoals / topicGoalsCount) * 100) : 0;

  const bookGoalsCount = monthlyGoal?.bookGoals?.length || 0;
  const avgBookProgress = bookGoalsCount > 0 
    ? Math.round(monthlyGoal.bookGoals.reduce((acc: number, b: any) => acc + (b.progress || 0), 0) / bookGoalsCount)
    : 0;

  const statsFromPrograms = useMemo(() => {
    let globalSolved = 0;
    let globalTarget = 0;
    let globalTaskDone = 0;
    let globalTaskNotDone = 0;
    let globalUnsolved = 0;
    let pendingResultsCount = 0;
    let expiredWaitingCount = 0;
    let firstDate: Date | null = null;
    
    const todayStr = new Date().toLocaleDateString('sv-SE');
    const multipliers = calculateSubjectMultipliers(exams, selectedStudent?.branch);
    const dailyTasksMap: Record<string, any[]> = {};

    // Group programs by week
    const weeklyData: Record<string, { target: number, solved: number, unsolved: number, taskDone: number, taskNotDone: number, earnedPoints: number, targetPoints: number }> = {};

    dailyPrograms.forEach(dp => {
      dailyTasksMap[dp.date] = dp.tasks || [];
      if (!dp.date || dp.date > todayStr) return;

      const dpParts = dp.date.split('-');
      const dpDate = new Date(Date.UTC(Number(dpParts[0]), Number(dpParts[1]) - 1, Number(dpParts[2])));
      if (!firstDate || dpDate < firstDate) firstDate = dpDate;
      
      // Calculate start of week (Monday) in UTC
      const day = dpDate.getUTCDay();
      const diff = dpDate.getUTCDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(Date.UTC(dpDate.getUTCFullYear(), dpDate.getUTCMonth(), diff)).toISOString().split('T')[0];

      if (!weeklyData[weekStart]) {
        weeklyData[weekStart] = { target: 0, solved: 0, unsolved: 0, taskDone: 0, taskNotDone: 0, earnedPoints: 0, targetPoints: 0 };
      }

      const weekStats = weeklyData[weekStart];

      if (dp.tasks) {
        dp.tasks.forEach((task: any) => {
          const taskDateStr = task.date || dp.date;
          let diffDays = 0;
          if (taskDateStr) {
            const parts = taskDateStr.split('-');
            if (parts.length === 3) {
              const tDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
              const today = new Date();
              const todayObj = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              diffDays = Math.floor((todayObj.getTime() - tDateObj.getTime()) / (1000 * 3600 * 24));
            }
          }
          const isWaitingExpired = task.isWaitingResult && diffDays >= 5;

          if (task.isWaitingResult) {
            if (isWaitingExpired) {
              expiredWaitingCount++;
            } else {
              pendingResultsCount++;
            }
          }

          const effectiveIsDone = task.isDone && !isWaitingExpired;
          let isQuestion = task.type === 'Soru Çözümü' || task.type === 'Deneme';

          if (isQuestion) {
            let solved = 0;
            let target = 0;
            if (!task.isExtra) {
              target = Number(task.targetCount) || 0;
              solved = effectiveIsDone ? Math.max(target, Number(task.completedCount) || 0) : (Number(task.completedCount) || 0);
              weekStats.target += target;
              globalTarget += target;
              
              const taskUnsolved = Math.max(0, target - solved);
              weekStats.unsolved += taskUnsolved;
              globalUnsolved += taskUnsolved;
              if (effectiveIsDone) {
                 weekStats.taskDone += 1;
                 globalTaskDone += 1;
              } else {
                 weekStats.taskNotDone += 1;
                 globalTaskNotDone += 1;
              }
            } else {
              solved = Number(task.completedCount) || 0;
              if (effectiveIsDone) {
                 weekStats.taskDone += 1;
                 globalTaskDone += 1;
              }
            }
            
            weekStats.solved += solved;
            globalSolved += solved;

          } else {
            if (!task.isExtra) {
               if (task.isDone) {
                 weekStats.taskDone += 1;
                 globalTaskDone += 1;
               } else {
                 weekStats.taskNotDone += 1;
                 globalTaskNotDone += 1;
               }
            } else {
               if (task.isDone) {
                  weekStats.taskDone += 1;
                  globalTaskDone += 1;
               }
            }
          }
        });
      }
    });

    let weekCount = 1;
    const startDate = selectedStudent?.createdAt ? new Date(selectedStudent.createdAt.seconds ? selectedStudent.createdAt.seconds * 1000 : selectedStudent.createdAt) : firstDate;
    if (startDate && !isNaN(startDate.getTime())) {
      const diffMs = new Date().getTime() - startDate.getTime();
      weekCount = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7)));
    }

    // Filter out future weeks
    const currentNow = new Date();
    const curTodayDay = currentNow.getUTCDay();
    const curTodayDiff = currentNow.getUTCDate() - curTodayDay + (curTodayDay === 0 ? -6 : 1);
    const currentWeekStartStr = new Date(Date.UTC(currentNow.getUTCFullYear(), currentNow.getUTCMonth(), curTodayDiff)).toISOString().split('T')[0];

    const pastOrCurrentWeekKeys = Object.keys(weeklyData).filter(weekStart => weekStart <= currentWeekStartStr);
    
    // Calculate accurate success percentage for each week
    const weeklySuccessMap: Record<string, { success: number, hasTasks: boolean }> = {};
    pastOrCurrentWeekKeys.forEach(weekStart => {
      const wParts = weekStart.split('-');
      let sum = 0;
      let validDays = 0;
      for (let i = 0; i < 7; i++) {
        const checkD = new Date(Date.UTC(Number(wParts[0]), Number(wParts[1]) - 1, Number(wParts[2])));
        checkD.setUTCDate(checkD.getUTCDate() + i);
        const checkDateStr = checkD.toISOString().split('T')[0];
        if (checkDateStr <= todayStr) {
           const dayTasks = dailyTasksMap[checkDateStr] || [];
           if (dayTasks.length > 0) {
             sum += calculateDailyCompletionWithMultipliers(dayTasks, multipliers);
             validDays++;
           }
        }
      }
      weeklySuccessMap[weekStart] = {
        success: validDays > 0 ? Math.round(sum / validDays) : 0,
        hasTasks: validDays > 0
      };
    });

    const validWeeksList = pastOrCurrentWeekKeys.map(k => weeklySuccessMap[k]).filter(w => w.hasTasks);
    const overallAvgCompletion = validWeeksList.length > 0 
      ? Math.round(validWeeksList.reduce((acc, val) => acc + val.success, 0) / validWeeksList.length)
      : 0;

    // Sort weeks descending to get last 4
    const sortedWeeks = pastOrCurrentWeekKeys.sort((a, b) => b.localeCompare(a)).slice(0, 4);
    const validLast4Weeks = sortedWeeks.map(k => weeklySuccessMap[k]).filter(w => w.hasTasks);
    const last4AvgCompletion = validLast4Weeks.length > 0
      ? Math.round(validLast4Weeks.reduce((acc, val) => acc + val.success, 0) / validLast4Weeks.length)
      : 0;
    
    const weeklyReportsArray = Object.keys(weeklyData)
      .filter(weekStart => weekStart <= currentWeekStartStr)
      .sort((a, b) => b.localeCompare(a)).map(weekStart => {
      const w = weeklyData[weekStart];
      const wParts = weekStart.split('-');
      const d = new Date(Date.UTC(Number(wParts[0]), Number(wParts[1]) - 1, Number(wParts[2])));
      
      const startStr = `${d.getUTCDate().toString().padStart(2, '0')}.${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`;
      d.setUTCDate(d.getUTCDate() + 6);
      const endStr = `${d.getUTCDate().toString().padStart(2, '0')}.${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`;
      const successPercentage = weeklySuccessMap[weekStart]?.success || 0;

      return {
        date: `${startStr} - ${endStr}`,
        weekNumber: '', 
        solvedCount: w.solved,
        unsolvedCount: w.unsolved,
        taskDone: w.taskDone,
        taskNotDone: w.taskNotDone,
        successPercentage: successPercentage,
        weekStartKey: weekStart
      };
    });

    return {
      totalSolved: globalSolved,
      totalUnsolved: globalUnsolved,
      avgSolved: Math.round(globalSolved / weekCount),
      avgUnsolved: Math.round(globalUnsolved / weekCount),
      overallAvgCompletion: overallAvgCompletion,
      last4AvgCompletion: last4AvgCompletion,
      derivedWeeklyReports: weeklyReportsArray,
      pendingResultsCount,
      expiredWaitingCount
    };
  }, [dailyPrograms, selectedStudent, exams]);

  const { totalSolved, totalUnsolved, avgSolved, avgUnsolved, overallAvgCompletion, last4AvgCompletion, derivedWeeklyReports, pendingResultsCount, expiredWaitingCount } = statsFromPrograms;

  useEffect(() => {
    if (derivedWeeklyReports.length > 0 && !selectedEvaluationWeek) {
      setSelectedEvaluationWeek(derivedWeeklyReports[0].weekStartKey);
    }
  }, [derivedWeeklyReports, selectedEvaluationWeek]);

  useEffect(() => {
    if (selectedStudent && selectedEvaluationWeek) {
      studentDataService.getWeeklyEvaluation(selectedStudent.uid, selectedEvaluationWeek)
        .then(evalData => {
          setEvaluationText(evalData?.evaluation || '');
        })
        .catch(console.error);
    } else {
      setEvaluationText('');
    }
  }, [selectedStudent, selectedEvaluationWeek]);

  const handleSaveEvaluation = async () => {
    const studentToUse = activeStudent || selectedStudent;
    if (!studentToUse || !selectedEvaluationWeek) return;
    setIsSavingEvaluation(true);
    try {
      await studentDataService.saveWeeklyEvaluation(studentToUse.uid, selectedEvaluationWeek, evaluationText);
      alert('Haftalık koç değerlendirmesi başarıyla kaydedildi.');
    } catch (err) {
      console.error(err);
      alert('Değerlendirme kaydedilirken bir hata oluştu.');
    } finally {
      setIsSavingEvaluation(false);
    }
  };

  const formatPhoneForWhatsApp = (rawPhone: string) => {
    let cleaned = rawPhone.replace(/\D/g, '');
    if (!cleaned) return '';
    if (cleaned.startsWith('0')) {
      cleaned = '90' + cleaned.substring(1);
    } else if (cleaned.length === 10) {
      cleaned = '90' + cleaned;
    }
    return cleaned;
  };

  const handleSaveAndSendWhatsApp = async () => {
    const studentToUse = activeStudent || selectedStudent;
    if (!studentToUse || !selectedEvaluationWeek) return;
    if (!evaluationText.trim()) {
      alert('Lütfen önce bir değerlendirme metni yazın.');
      return;
    }

    setIsSavingEvaluation(true);
    try {
      await studentDataService.saveWeeklyEvaluation(studentToUse.uid, selectedEvaluationWeek, evaluationText);
    } catch (err) {
      console.error(err);
      alert('Değerlendirme kaydedilirken bir hata oluştu.');
      setIsSavingEvaluation(false);
      return;
    } finally {
      setIsSavingEvaluation(false);
    }

    let targetPhone = parentPhone.trim() || studentToUse?.parentPhone || (studentToUse as any)?.phone || '';
    if (!targetPhone) {
      const inputPhone = prompt("Veli telefon numarası bulunamadı. Lütfen mesajın gönderileceği telefon numarasını giriniz (Örn: 05000000000):", "05000000000");
      if (!inputPhone) return;
      targetPhone = inputPhone;
      setParentPhone(inputPhone);
    }

    const formattedPhone = formatPhoneForWhatsApp(targetPhone);
    if (!formattedPhone) {
      alert("Geçersiz telefon numarası. Lütfen telefon numarasını kontrol edip tekrar deneyin.");
      return;
    }

    const selectedWeekReport = derivedWeeklyReports.find(r => r.weekStartKey === selectedEvaluationWeek);
    const studentName = studentToUse?.firstName && studentToUse?.lastName 
      ? `${studentToUse.firstName} ${studentToUse.lastName}` 
      : (studentToUse?.displayName || 'Öğrenci');

    const textMessage = `Sayın Velimiz,\n\n${studentName} isimli öğrencimizin haftalık koç değerlendirmesi (${selectedWeekReport?.date || ''}):\n\n${evaluationText}`;

    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(textMessage)}`;

    window.open(whatsappUrl, '_blank');
  };

  const handleGenerateAIEvaluation = async () => {
    if (!selectedStudent || !selectedEvaluationWeek) return;
    setIsGeneratingEval(true);
    try {
      const selectedWeekReport = derivedWeeklyReports.find(r => r.weekStartKey === selectedEvaluationWeek);
      if (!selectedWeekReport) return;
      
      const draft = `Öğrencimiz bu hafta toplam ${selectedWeekReport.taskDone} görev tamamladı, ${selectedWeekReport.taskNotDone} görev ise eksik kaldı. Toplam çözdüğü soru sayısı ${selectedWeekReport.solvedCount}, çözemediği/yanlış soru sayısı ise ${selectedWeekReport.unsolvedCount}. Genel başarı oranı ise %${selectedWeekReport.successPercentage} olarak gerçekleşti.`;
      
      let previousEvaluation = null;
      const currentIndex = derivedWeeklyReports.findIndex(r => r.weekStartKey === selectedEvaluationWeek);
      if (currentIndex !== -1 && currentIndex < derivedWeeklyReports.length - 1) {
        const prevWeek = derivedWeeklyReports[currentIndex + 1];
        const prev = await studentDataService.getWeeklyEvaluation(selectedStudent.uid, prevWeek.weekStartKey);
        if (prev) previousEvaluation = prev.evaluation;
      }
      
      const response = await fetch("/api/weekly-evaluation-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: draft, 
          previousEvaluation, 
          studentName: selectedStudent?.firstName || selectedStudent?.displayName 
        })
      });
      const data = await response.json();
      if (data.text) {
        setEvaluationText(data.text);
      } else {
        alert("Yapay zeka raporu oluşturulamadı.");
      }
    } catch (err) {
      console.error(err);
      alert("Yapay zeka raporu oluşturulurken bir hata oluştu.");
    } finally {
      setIsGeneratingEval(false);
    }
  };

  // Exam Average Calculations (Latest up to 4)
  const getExamAverages = (type: string, subjects: Record<string, string[]>) => {
    // Sort exams by date descending to get the latest ones
    const relevantExams = exams
      .filter(e => e.examType === type || e.examType === 'YKS')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);

    if (relevantExams.length === 0) return null;

    const avgs: any = {};
    
    Object.keys(subjects).forEach(sub => {
      const keysToSum = subjects[sub];
      const sum = relevantExams.reduce((acc, e) => {
        let eSum = 0;
        keysToSum.forEach(k => {
          let score = 0;
          if (e.examType === 'YKS') {
            const yksKey = `${type} ${k}`;
            if (e.scores?.[yksKey]) score = parseFloat(e.scores[yksKey].n) || 0;
            else if (e.scores?.[k]) score = parseFloat(e.scores[k].n) || 0;
          } else {
            if (e.scores?.[k]) score = parseFloat(e.scores[k].n) || 0;
          }
          eSum += score;
        });
        return acc + eSum;
      }, 0);
      avgs[sub] = (sum / relevantExams.length).toFixed(2);
    });

    avgs.totalNet = (relevantExams.reduce((acc, e) => {
      if (e.examType === 'YKS') {
        // Estimate total net for the sub-type if it's YKS, this is an approximation, better to use exact sum.
        let subTypeSum = 0;
        Object.keys(subjects).forEach(sub => {
          subjects[sub].forEach(k => {
             const yksKey = `${type} ${k}`;
             if (e.scores?.[yksKey]) subTypeSum += parseFloat(e.scores[yksKey].n) || 0;
             else if (e.scores?.[k]) subTypeSum += parseFloat(e.scores[k].n) || 0;
          });
        });
        return acc + subTypeSum;
      }
      return acc + (e.totalNet || 0);
    }, 0) / relevantExams.length).toFixed(2);
    
    avgs.percentile = (relevantExams.reduce((acc, e) => acc + (e.percentile || 0), 0) / relevantExams.length).toFixed(2);

    return avgs;
  };

  const tytAvgs = getExamAverages('TYT', {
    'Türkçe': ['Türkçe'],
    'Matematik': ['Matematik', 'Geometri'],
    'Fen Bilimleri': ['Fizik', 'Kimya', 'Biyoloji'],
    'Sosyal Bilimler': ['Tarih', 'Coğrafya', 'Felsefe', 'Din']
  });
  
  const aytAvgs = getExamAverages('AYT', {
    'Sos-1': ['Edebiyat', 'Tarih-1', 'Coğrafya-1'],
    'Sos-2': ['Tarih-2', 'Coğrafya-2', 'Felsefe Grubu', 'Din (Seçmeli)'],
    'Matematik': ['Matematik', 'Geometri'],
    'Fen Bilimleri': ['Fizik', 'Kimya', 'Biyoloji'],
    'Dil': ['Yabancı Dil']
  });

  const quickStats = [
    { 
      label: 'Toplam Yapılan', 
      value: totalSolved.toLocaleString(), 
      icon: CheckCircle2, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-400/10' 
    },
    { 
      label: 'Eksik Soru Sayısı', 
      value: totalUnsolved.toLocaleString(), 
      icon: History, 
      color: 'text-red-400', 
      bg: 'bg-red-400/10' 
    },
    { 
      label: 'Ortalama Yapılan', 
      value: avgSolved.toLocaleString(), 
      icon: TrendingUp, 
      color: 'text-blue-400', 
      bg: 'bg-blue-400/10' 
    },
    { 
      label: 'Ortalama Yapılmayan', 
      value: avgUnsolved.toLocaleString(), 
      icon: AlertCircle, 
      color: 'text-amber-400', 
      bg: 'bg-amber-400/10' 
    },
    { 
      label: 'Ortalama Program Bitirme', 
      value: `%${overallAvgCompletion}`, 
      icon: PieChart, 
      color: 'text-indigo-400', 
      bg: 'bg-indigo-400/10' 
    },
    { 
      label: 'Son 4 Hafta Ortalaması', 
      value: `%${last4AvgCompletion}`, 
      icon: Activity, 
      color: 'text-fuchsia-400', 
      bg: 'bg-fuchsia-400/10' 
    }
  ];

  if (loading) return <div className="text-center py-20 text-slate-500 font-bold italic animate-pulse">Veriler Yükleniyor...</div>;

  if (!activeStudent) {
    return <NoStudentSelected />;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <OnboardingTour
        steps={studentSummaryTourSteps}
        isOpen={isTourOpen}
        onClose={handleEndTour}
        onComplete={handleEndTour}
        onNextTour={() => {
          setIsTourOpen(false);
          tourService.markTourCompleted('student_summary', user?.uid);
          navigate('/panel/koc/ogrenci/veri-girisi', { state: { startTour: true, isDemo: true } });
        }}
        nextTourLabel="Kitap Takibi Turu"
        tourKey="student_summary"
      />

      {/* Student ID Card & Target Progress */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* ID Card */}
        {(pendingResultsCount > 0 || expiredWaitingCount > 0) && (
          <div className="xl:col-span-3 space-y-2">
            {pendingResultsCount > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-center gap-3">
                <AlertTriangle className="text-amber-400 shrink-0" size={18} />
                <div className="text-xs">
                  <span className="font-bold text-amber-400 uppercase tracking-wide mr-2">Sonuç Bekleyen Denemeler ({pendingResultsCount}):</span>
                  <span className="text-slate-300">Öğrencinin henüz sonuç açıklanmamış/girilmemiş deneme görevleri bulunuyor.</span>
                </div>
              </div>
            )}
            {expiredWaitingCount > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 flex items-center gap-3">
                <AlertTriangle className="text-red-400 shrink-0" size={18} />
                <div className="text-xs">
                  <span className="font-bold text-red-400 uppercase tracking-wide mr-2">5 Günü Geçen Bekleyen Görevler ({expiredWaitingCount}):</span>
                  <span className="text-slate-300">5 gün içerisinde sonucu girilmeyen denemeler yapılmadı olarak işaretlenmiştir.</span>
                </div>
              </div>
            )}
          </div>
        )}
        <div id="tour-student-summary-profile" className="xl:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-600/10 to-transparent blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
          <div className="relative flex flex-col md:flex-row gap-10">
            {/* Photo & Basic Info */}
            <div className="space-y-6 shrink-0 text-center md:text-left">
              <div className="relative inline-block group/photo">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-[32px] blur opacity-25 group-hover/photo:opacity-50 transition duration-500" />
                <div className="relative w-32 h-32 rounded-[30px] overflow-hidden border-2 border-white/10 bg-slate-800">
                  <img src={activeStudent?.photoURL || `https://ui-avatars.com/api/?name=${activeStudent?.displayName}&background=070b14&color=fff&size=128&bold=true`} alt={activeStudent?.displayName} className="w-full h-full object-cover" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{activeStudent?.displayName}</h2>
                <div className="flex items-center gap-2 mt-3 justify-center md:justify-start">
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded-lg border border-blue-500/20 uppercase tracking-widest">{activeStudent?.grade || 'Sınıf Belirtilmedi'}</span>
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black rounded-lg border border-indigo-500/20 uppercase tracking-widest">{activeStudent?.branch || 'Alan Belirtilmedi'}</span>
                </div>
              </div>
            </div>

            {/* Target Details */}
            <div id="tour-student-summary-goals" className="flex-1 grid grid-cols-2 gap-x-8 gap-y-6 pt-2">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Target size={12} className="text-blue-500" /> Hedef Üniversite / Bölüm
                </p>
                <div className="flex flex-col">
                  <p className="text-xs font-bold text-slate-200 uppercase truncate" title={activeStudent?.targetUniversity}>{activeStudent?.targetUniversity || 'Üni Girilmedi'}</p>
                  <p className="text-[10px] font-medium text-slate-400 uppercase truncate" title={activeStudent?.targetDepartment}>{activeStudent?.targetDepartment || 'Bölüm Girilmedi'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Trophy size={12} className="text-amber-500" /> Mevcut Başarı Puanı
                </p>
                <p className="text-sm font-bold text-white uppercase italic">478.250</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TYT Net Hedefi</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-white italic leading-none">{activeStudent?.targetTyt || 0}</span>
                  <span className="text-[10px] font-bold text-slate-500 pb-1 italic">/ 120 Net</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AYT Net Hedefi</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-white italic leading-none">{activeStudent?.targetAyt || 0}</span>
                  <span className="text-[10px] font-bold text-slate-500 pb-1 italic">/ 80 Net</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Target Progress Bars */}
        <div id="tour-student-summary-targets" className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 flex flex-col justify-between">
           <div className="space-y-6">
              <div className="space-y-3">
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aylık Konu Tamamlama</span>
                    <span className="text-xs font-black text-emerald-400 italic">%{topicProgress}</span>
                 </div>
                 <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${topicProgress}%` }}
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    />
                 </div>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aylık Kitap Bitirme</span>
                    <span className="text-xs font-black text-amber-400 italic">%{avgBookProgress}</span>
                 </div>
                 <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${avgBookProgress}%` }}
                      className="h-full bg-gradient-to-r from-amber-600 to-orange-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    />
                 </div>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TYT Hedef Yakınlığı</span>
                    <span className="text-xs font-black text-blue-400 italic">%{Math.round((parseFloat(tytAvgs?.totalNet) / (activeStudent?.targetTyt || 120)) * 100) || 0}</span>
                 </div>
                 <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (parseFloat(tytAvgs?.totalNet) / (activeStudent?.targetTyt || 120)) * 100) || 0}%` }}
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                    />
                 </div>
              </div>
              <div className="space-y-3 mt-4">
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AYT Hedef Yakınlığı</span>
                    <span className="text-xs font-black text-purple-400 italic">%{Math.round((parseFloat(aytAvgs?.totalNet) / (activeStudent?.targetAyt || 80)) * 100) || 0}</span>
                 </div>
                 <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (parseFloat(aytAvgs?.totalNet) / (activeStudent?.targetAyt || 80)) * 100) || 0}%` }}
                      transition={{ delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full shadow-[0_0_15px_rgba(147,51,234,0.4)]"
                    />
                 </div>
              </div>
           </div>
           
        </div>
      </div>

      {/* Question Stats Dashboard */}
      <div id="tour-student-summary-metrics" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {quickStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[24px] p-5 relative overflow-hidden group hover:border-white/10 hover:bg-slate-800/80 transition-all shadow-xl shadow-black/20"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rotate-[30deg] translate-x-12 -translate-y-12 group-hover:scale-110 group-hover:rotate-[45deg] transition-transform duration-700 pointer-events-none" />
             <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-[14px] flex items-center justify-center shadow-lg shadow-black/20 shrink-0`}>
                   <stat.icon size={18} strokeWidth={2.5} />
                </div>
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10 mb-1 leading-snug line-clamp-2 h-7">{stat.label}</p>
             <div className="flex items-end gap-2 relative z-10">
                <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
             </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TYT Stat Table */}
        <div id="tour-student-summary-tyt-exams" className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
           <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <BarChart3 className="text-blue-500" /> TYT Son 4 Deneme Ortalamaları
           </h3>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                       <th className="pb-4">Branş</th>
                       <th className="pb-4 text-center">Ortalama Net</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5 text-sm">
                    {[
                      { label: 'Türkçe', value: tytAvgs?.Türkçe },
                      { label: 'Matematik', value: tytAvgs?.Matematik },
                      { label: 'Fen Bilimleri', value: tytAvgs?.['Fen Bilimleri'] },
                      { label: 'Sosyal Bilimler', value: tytAvgs?.['Sosyal Bilimler'] },
                      { label: 'Toplam Net', value: tytAvgs?.totalNet, highlight: true },
                      { label: 'Sıralama (%)', value: tytAvgs?.percentile ? `%${tytAvgs.percentile}` : '-', highlight: true },
                    ].map((row, i) => (
                      <tr key={i} className={`group hover:bg-white/[0.02] ${row.highlight ? 'bg-blue-500/5' : ''}`}>
                         <td className={`py-4 font-bold ${row.highlight ? 'text-blue-400' : 'text-slate-400'}`}>{row.label}</td>
                         <td className={`py-4 text-center font-black ${row.highlight ? 'text-white' : 'text-slate-200'}`}>{row.value || '0.00'}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* AYT Stat Table */}
        <div id="tour-student-summary-ayt-exams" className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
           <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <BarChart3 className="text-indigo-500" /> AYT Son 4 Deneme Ortalamaları
           </h3>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                       <th className="pb-4">Branş</th>
                       <th className="pb-4 text-center">Ortalama Net</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5 text-sm">
                    {[
                      { label: 'Matematik', value: aytAvgs?.Matematik },
                      { label: 'Fen Bilimleri', value: aytAvgs?.['Fen Bilimleri'] },
                      { label: 'Edebiyat-Sos 1', value: aytAvgs?.['Sos-1'] },
                      { label: 'Sosyal 2', value: aytAvgs?.['Sos-2'] },
                      { label: 'Yabancı Dil', value: aytAvgs?.Dil },
                    ].map((row, i) => (
                      <tr key={i} className="group hover:bg-white/[0.02]">
                         <td className="py-4 font-bold text-slate-400">{row.label}</td>
                         <td className="py-4 text-center font-black text-slate-200">{row.value || '0.00'}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {[
                  { 
                    label: 'SAY', 
                    value: (parseFloat(aytAvgs?.Matematik || '0') + parseFloat(aytAvgs?.['Fen Bilimleri'] || '0')).toFixed(2), 
                    isActive: activeStudent?.branch === 'SAYISAL' || activeStudent?.branch === 'SAY' 
                  },
                  { 
                    label: 'EA', 
                    value: (parseFloat(aytAvgs?.Matematik || '0') + parseFloat(aytAvgs?.['Sos-1'] || '0')).toFixed(2), 
                    isActive: activeStudent?.branch === 'EŞİT AĞIRLIK' || activeStudent?.branch === 'EA' 
                  },
                  { 
                    label: 'SÖZ', 
                    value: (parseFloat(aytAvgs?.['Sos-1'] || '0') + parseFloat(aytAvgs?.['Sos-2'] || '0')).toFixed(2), 
                    isActive: activeStudent?.branch === 'SÖZEL' || activeStudent?.branch === 'SÖZ' 
                  },
                  { 
                    label: 'DİL', 
                    value: (parseFloat(aytAvgs?.Dil || '0')).toFixed(2), 
                    isActive: activeStudent?.branch === 'DİL' || activeStudent?.branch === 'DIL' 
                  },
              ].map((box, i) => (
                <div key={i} className={`rounded-2xl p-4 flex flex-col justify-center items-center gap-1 border transition-all ${box.isActive ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-slate-800/30 border-white/5 hover:bg-slate-800/50'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${box.isActive ? 'text-indigo-400' : 'text-slate-500'}`}>AYT {box.label}</span>
                    <span className={`text-xl font-black ${box.isActive ? 'text-white' : 'text-slate-300'}`}>{box.value}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Monthly Assessment & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Coach Note */}
        <div id="tour-student-summary-coach-note" className="lg:col-span-1 bg-slate-900/40 border border-white/5 rounded-3xl p-8 flex flex-col justify-between h-full">
           <div>
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-bold flex items-center gap-3">
                    <Quote className="text-purple-500" /> Koçun Notu (Bu Ay)
                 </h3>
              </div>
              <div className="bg-white/5 rounded-2xl p-6 border border-white/5 relative flex-1 flex flex-col justify-center min-h-[210px]">
                 <Sparkles size={24} className="absolute -top-3 -right-3 text-purple-500/50" />
                 {monthlyGoal?.coachNote ? (
                   <p className="text-sm text-slate-300 leading-relaxed italic">
                     "{monthlyGoal.coachNote}"
                   </p>
                 ) : (
                   <p className="text-sm text-slate-500 leading-relaxed italic text-center py-10">
                     Bu ay için henüz bir değerlendirme notu girilmemiş.
                   </p>
                 )}
              </div>
           </div>
           <Link to="hedefler" className="mt-6 text-[10px] font-black text-purple-400 hover:text-purple-300 uppercase tracking-widest flex items-center justify-center gap-1 transition-colors bg-white/5 py-3 rounded-xl border border-white/5">
              Notu Düzenle <ChevronRight size={14} />
           </Link>
        </div>

        {/* Weekly Coach Evaluation Section */}
        {derivedWeeklyReports.length > 0 && (
          <div id="tour-student-summary-evaluation" className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-3xl p-8 flex flex-col justify-between h-full space-y-6">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                   <h3 className="text-xl font-bold flex items-center gap-3">
                      <Sparkles className="text-emerald-400 animate-pulse" /> Haftalık Koç Değerlendirmesi Yaz / Düzenle
                   </h3>
                   <p className="text-xs text-slate-400 mt-1">Seçtiğiniz hafta için öğrenciye ve velisine iletilecek değerlendirmeyi girin.</p>
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-xs text-slate-400 font-bold">Hafta Seçin:</span>
                   <select 
                     value={selectedEvaluationWeek}
                     onChange={(e) => setSelectedEvaluationWeek(e.target.value)}
                     className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50 cursor-pointer"
                   >
                     {derivedWeeklyReports.map(report => (
                       <option key={report.weekStartKey} value={report.weekStartKey}>
                         {report.date}
                       </option>
                     ))}
                   </select>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <span className="text-xs font-black uppercase tracking-widest text-slate-400">Değerlendirme Notu</span>
                   <button 
                     onClick={handleGenerateAIEvaluation}
                     disabled={isGeneratingEval || !selectedEvaluationWeek}
                     className="bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-30 text-emerald-400 font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs border border-emerald-500/20"
                   >
                      {isGeneratingEval ? 'Oluşturuluyor...' : 'Yapay Zeka ile Taslak Oluştur'}
                   </button>
                </div>

                <textarea 
                   value={evaluationText}
                   onChange={(e) => setEvaluationText(e.target.value)}
                   placeholder="Bu hafta için koç değerlendirmesini buraya yazın..."
                   className="w-full bg-slate-950/50 border border-white/10 rounded-2xl p-4 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50 min-h-[160px] resize-y"
                />

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/5">
                   <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-bold text-slate-300">Veli Tel:</span>
                      <input 
                        type="text" 
                        value={parentPhone} 
                        onChange={(e) => setParentPhone(e.target.value)}
                        placeholder="905000000000" 
                        className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-mono placeholder-slate-600 outline-none focus:border-emerald-500/50 w-36 sm:w-44"
                      />
                   </div>
                   <div className="flex flex-wrap items-center justify-end gap-3">
                      <button 
                        onClick={handleSaveEvaluation}
                        disabled={isSavingEvaluation || !selectedEvaluationWeek}
                        className="bg-white/5 hover:bg-white/10 text-slate-200 font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs border border-white/10"
                      >
                         <CheckCircle2 size={16} /> Değerlendirmeyi Kaydet
                      </button>

                      <button 
                        onClick={handleSaveAndSendWhatsApp}
                        disabled={isSavingEvaluation || !selectedEvaluationWeek || !evaluationText.trim()}
                        className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs shadow-lg shadow-emerald-500/10 cursor-pointer"
                      >
                         <MessageCircle size={16} className="fill-slate-950 text-emerald-500" /> Değerlendirmeyi Kaydet ve WhatsApp'tan Gönder
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Weekly Reports Table */}
      <div id="tour-student-summary-weekly-reports" className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-bold flex items-center gap-3">
              <History className="text-emerald-500" /> Haftalık Performans Özeti
           </h3>
           <Link to="program" className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest flex items-center gap-1 transition-colors">
              Programa Git <ChevronRight size={14} />
           </Link>
        </div>
        
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                 <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                    <th className="pb-4 px-4">Tarih</th>
                    <th className="pb-4 px-4 text-center">Çözülen Soru</th>
                    <th className="pb-4 px-4 text-center">Eksik Soru</th>
                    <th className="pb-4 px-4 text-center">Biten Görev</th>
                    <th className="pb-4 px-4 text-center">Eksik Görev</th>
                    <th className="pb-4 px-4 text-center">Başarı Oranı</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                 {derivedWeeklyReports.map((report, i) => (
                    <tr key={i} className="group hover:bg-white/[0.02]">
                       <td className="py-4 px-4">
                          <span className="font-bold text-slate-300 block">{report.date}</span>
                       </td>
                       <td className="py-4 px-4 text-center font-black text-emerald-400">{report.solvedCount || 0}</td>
                       <td className="py-4 px-4 text-center font-black text-red-400">{report.unsolvedCount || 0}</td>
                       <td className="py-4 px-4 text-center font-black text-emerald-400">{report.taskDone || 0}</td>
                       <td className="py-4 px-4 text-center font-black text-red-400">{report.taskNotDone || 0}</td>
                       <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                             <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(report.successPercentage, 100)}%` }} />
                             </div>
                             <span className="font-black text-white">%{report.successPercentage || 0}</span>
                          </div>
                       </td>
                    </tr>
                 ))}
                 {derivedWeeklyReports.length === 0 && (
                    <tr>
                       <td colSpan={6} className="py-20 text-center text-slate-600 italic">Henüz program verisi bulunmuyor.</td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
  </div>
);
}
