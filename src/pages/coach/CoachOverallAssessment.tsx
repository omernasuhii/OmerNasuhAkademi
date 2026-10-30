import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  Activity,
  ChevronRight,
  Archive
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { tourService } from '../../services/tourService';
import { studentDataService } from '../../services/studentDataService';
import { motion } from 'motion/react';
import { OnboardingTour, TourStep } from '../../components/OnboardingTour';
import { calculateSubjectMultipliers, calculateDailyCompletionWithMultipliers, TASK_WEIGHTS, getCanonicalSubjectName } from '../../lib/programCalculations';

export default function CoachOverallAssessment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [dailyPrograms, setDailyPrograms] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    if (tourService.shouldAutoStartTour('coach_overall_assessment', userData, location.state?.startTour)) {
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.state, userData]);

  const handleEndTour = () => {
    setIsTourOpen(false);
    tourService.markTourCompleted('coach_overall_assessment', user?.uid);
  };

  const tourSteps: TourStep[] = [
    {
      targetId: 'tour-overall-header',
      title: 'Genel Değerlendirme Paneli',
      description: 'Sorumlu olduğunuz tüm öğrencilerin çözdüğü toplam ve eksik soruları, ortalama program tamamlama yüzdelerini ve sınav net ortalamalarını tek bir ekranda derler.',
      position: 'bottom'
    },
    {
      targetId: 'tour-overall-stats',
      title: 'Genel Performans ve Metrik Kartları',
      description: 'Öğrencilerin toplam çözdüğü soru sayısı, tamamlanmayan eksik sorular, ortalama program bitirme oranları ve son 4 haftanın başarı yüzdesi burada anlık hesaplanır.',
      position: 'bottom'
    },
    {
      targetId: 'tour-overall-exams',
      title: 'TYT & AYT Grup Net Ortalamaları',
      description: 'Gruptaki tüm öğrencilerin son 4 deneme sınavındaki branş bazlı net ortalamaları ve grup yüzdelik dilimleri karşılaştırmalı olarak sunulur.',
      position: 'top'
    },
    {
      targetId: 'tour-overall-weekly',
      title: 'Haftalık Toplu İlerleme Raporu',
      description: 'Hafta hafta tüm sınıfın soru çözümleri, biten görevleri ve genel grup başarı oranı tarih bazlı raporlanır.',
      position: 'top'
    }
  ];

  useEffect(() => {
    if (user && userData) {
      loadData();
    }
  }, [user, userData]);

  const loadData = async () => {
    setLoading(true);
    try {
      const q = userData?.role === 'admin'
        ? query(collection(db, 'users'), where('role', '==', 'student'))
        : query(collection(db, 'users'), where('coachId', '==', user!.uid));
        
      const snap = await getDocs(q);
      const studentData = snap.docs.map(doc => ({
        uid: doc.id,
        isArchived: !!(doc.data().isArchived || doc.data().archived),
        ...doc.data()
      }));
      setStudents(studentData);

      const dpArray: any[] = [];
      const examsArray: any[] = [];

      await Promise.all(studentData.map(async (st) => {
         try {
           const dp = await studentDataService.getAllDailyPrograms(st.uid);
           if (Array.isArray(dp)) {
             dp.forEach(d => dpArray.push({...d, studentId: st.uid}));
           }
         } catch (e) {
           console.error("Error fetching daily programs for student:", st.uid, e);
         }
         
         try {
           const ex = await studentDataService.getExamResults(st.uid);
           if (Array.isArray(ex)) {
             ex.forEach(e => examsArray.push({...e, studentId: st.uid}));
           }
         } catch (e) {
           console.error("Error fetching exams for student:", st.uid, e);
         }
      }));

      setDailyPrograms(dpArray);
      setExams(examsArray);
    } catch(err) {
      console.error(err);
      setStudents([]);
      setDailyPrograms([]);
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const statsFromPrograms = useMemo(() => {
    let globalSolved = 0;
    let globalTarget = 0;
    let globalTaskDone = 0;
    let globalTaskNotDone = 0;
    let globalUnsolved = 0;
    
    const todayStr = new Date().toLocaleDateString('sv-SE');
    const weeklyData: Record<string, { target: number, solved: number, unsolved: number, taskDone: number, taskNotDone: number, earnedPoints: number, targetPoints: number }> = {};

    const studentMap = new Map<string, any>();
    const studentMultipliersMap = new Map<string, Record<string, number>>();
    (students || []).forEach(s => {
      if (s?.uid) {
        studentMap.set(s.uid, s);
        const stExams = (exams || []).filter((e: any) => e?.studentId === s.uid);
        studentMultipliersMap.set(s.uid, calculateSubjectMultipliers(stExams, s.branch));
      }
    });

    (dailyPrograms || []).forEach(dp => {
      if (!dp || !dp.date || typeof dp.date !== 'string' || dp.date > todayStr) return;

      const student = studentMap.get(dp.studentId);
      const isStudentArchived = !!(student?.isArchived || student?.archived);

      const dpParts = dp.date.split('-');
      if (dpParts.length !== 3) return;
      const dpDate = new Date(Date.UTC(Number(dpParts[0]), Number(dpParts[1]) - 1, Number(dpParts[2])));
      if (isNaN(dpDate.getTime())) return;
      
      const day = dpDate.getUTCDay();
      const diff = dpDate.getUTCDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(Date.UTC(dpDate.getUTCFullYear(), dpDate.getUTCMonth(), diff)).toISOString().split('T')[0];

      if (!weeklyData[weekStart]) {
        weeklyData[weekStart] = { target: 0, solved: 0, unsolved: 0, taskDone: 0, taskNotDone: 0, earnedPoints: 0, targetPoints: 0 };
      }

      const weekStats = weeklyData[weekStart];

      if (Array.isArray(dp.tasks)) {
        dp.tasks.forEach((task: any) => {
          if (!task) return;
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
          const effectiveIsDone = task.isDone && !isWaitingExpired;

          let isQuestion = task.type === 'Soru Çözümü' || task.type === 'Deneme';

          // Öğrenci arşive atıldıysa: SADECE tamamladığı soru sayısı alınır, diğer verileri hesaba katılmaz
          if (isStudentArchived) {
            if (isQuestion) {
              let solved = 0;
              if (!task.isExtra) {
                const target = Number(task.targetCount) || 0;
                solved = effectiveIsDone ? Math.max(target, Number(task.completedCount) || 0) : (Number(task.completedCount) || 0);
              } else {
                solved = Number(task.completedCount) || 0;
              }
              weekStats.solved += solved;
              globalSolved += solved;
            }
            // Diğer görevler, hedefler, eksikler ve puanlar hesaba katılmaz
            return;
          }

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

            const studentMults = studentMultipliersMap.get(dp.studentId) || {};
            const canonical = getCanonicalSubjectName(task.subject || '');
            const subjectMultiplier = (canonical && studentMults[canonical]) ? studentMults[canonical] : 1.0;
            const taskWeight = TASK_WEIGHTS[task.type as keyof typeof TASK_WEIGHTS] || 30;
            const finalWeight = taskWeight * subjectMultiplier;

            if (!task.isExtra) {
              weekStats.targetPoints += finalWeight;
            }

            const ratio = target > 0 ? Math.min(1, Math.max(0, solved / target)) : (effectiveIsDone ? 1 : 0);
            weekStats.earnedPoints += (finalWeight * ratio);
            if (task.isExtra && effectiveIsDone) {
              weekStats.earnedPoints += finalWeight;
            }
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

            const studentMults = studentMultipliersMap.get(dp.studentId) || {};
            const canonical = getCanonicalSubjectName(task.subject || '');
            const subjectMultiplier = (canonical && studentMults[canonical]) ? studentMults[canonical] : 1.0;
            let taskWeight = TASK_WEIGHTS[task.type as keyof typeof TASK_WEIGHTS] || 30;
            let finalWeight = taskWeight * subjectMultiplier;

            const isDeneme = task.topic?.includes('Deneme') || task.subject?.includes('Genel') || task.subject?.includes('YDT') || task.branch === 'Denemeler' || task.type === 'Deneme' || task.type === 'Deneme Sınavı';
            if (isDeneme && effectiveIsDone) {
              const relatedExam = exams.find((e: any) => e.studentId === dp.studentId && e.date === dp.date && e.analyzed);
              if (relatedExam) finalWeight *= 2;
            }

            if (!task.isExtra) {
              weekStats.targetPoints += finalWeight;
            }

            if (task.type === 'YouTube Video') {
              if (effectiveIsDone || Number(task.completedCount) >= 1) {
                weekStats.earnedPoints += finalWeight;
              }
            } else if (task.type === 'Konu Çalışması') {
              const target = Number(task.targetCount) || 0;
              if (target > 0) {
                const completed = Number(task.completedCount) || (effectiveIsDone ? target : 0);
                const ratio = Math.min(1, Math.max(0, completed / target));
                weekStats.earnedPoints += (finalWeight * ratio);
              } else {
                if (effectiveIsDone) weekStats.earnedPoints += finalWeight;
              }
            } else {
              if (effectiveIsDone) {
                weekStats.earnedPoints += finalWeight;
              }
            }
          }
        });
      }
    });

    let totalStudentWeeks = 0;
    const activeStudents = (students || []).filter(st => !st?.isArchived && !st?.archived);
    const studentsForWeeks = activeStudents.length > 0 ? activeStudents : (students || []);
    studentsForWeeks.forEach(st => {
       const stStartDate = st?.createdAt ? new Date(st.createdAt.seconds ? st.createdAt.seconds * 1000 : st.createdAt) : new Date();
       if (stStartDate && !isNaN(stStartDate.getTime())) {
          const diffMs = new Date().getTime() - stStartDate.getTime();
          totalStudentWeeks += Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7)));
       } else {
          totalStudentWeeks += 1;
       }
    });
    
    if (totalStudentWeeks === 0) totalStudentWeeks = 1;

    const weeksList = Object.values(weeklyData);
    const overallAvgCompletion = weeksList.length > 0 
      ? Math.round((weeksList.reduce((acc, w) => acc + (w.targetPoints > 0 ? (w.earnedPoints / w.targetPoints) : (w.earnedPoints > 0 ? 1 : 0)), 0) / weeksList.length) * 100)
      : 0;

    const sortedWeeks = Object.keys(weeklyData).sort((a, b) => b.localeCompare(a)).slice(0, 4);
    const last4AvgCompletion = sortedWeeks.length > 0
      ? Math.round((sortedWeeks.reduce((acc, wStart) => {
          const w = weeklyData[wStart];
          return acc + (w.targetPoints > 0 ? (w.earnedPoints / w.targetPoints) : (w.earnedPoints > 0 ? 1 : 0));
        }, 0) / sortedWeeks.length) * 100)
      : 0;

    
    const now = new Date();
    const todayDay = now.getUTCDay();
    const todayDiff = now.getUTCDate() - todayDay + (todayDay === 0 ? -6 : 1);
    const currentWeekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), todayDiff)).toISOString().split('T')[0];

    const weeklyReportsArray = Object.keys(weeklyData)
      .filter(weekStart => weekStart <= currentWeekStart)
      .sort((a, b) => b.localeCompare(a)).map(weekStart => {
      const w = weeklyData[weekStart];
      const wParts = typeof weekStart === 'string' ? weekStart.split('-') : [];
      if (wParts.length !== 3) {
        return {
          date: weekStart,
          weekNumber: '',
          solvedCount: w?.solved || 0,
          unsolvedCount: w?.unsolved || 0,
          taskDone: w?.taskDone || 0,
          taskNotDone: w?.taskNotDone || 0,
          successPercentage: 0
        };
      }
      const d = new Date(Date.UTC(Number(wParts[0]), Number(wParts[1]) - 1, Number(wParts[2])));
      
      const startStr = `${d.getUTCDate().toString().padStart(2, '0')}.${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`;
      d.setUTCDate(d.getUTCDate() + 6);
      const endStr = `${d.getUTCDate().toString().padStart(2, '0')}.${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`;
      const successPercentage = w.targetPoints > 0 ? Math.round((w.earnedPoints / w.targetPoints) * 100) : (w.earnedPoints > 0 ? 100 : 0);

      return {
        date: `${startStr} - ${endStr}`,
        weekNumber: '', 
        solvedCount: w.solved,
        unsolvedCount: w.unsolved,
        taskDone: w.taskDone,
        taskNotDone: w.taskNotDone,
        successPercentage: successPercentage
      };
    });

    return {
      totalSolved: globalSolved,
      totalUnsolved: globalUnsolved,
      avgSolved: Math.round(globalSolved / totalStudentWeeks),
      avgUnsolved: Math.round(globalUnsolved / totalStudentWeeks),
      overallAvgCompletion: overallAvgCompletion,
      last4AvgCompletion: last4AvgCompletion,
      derivedWeeklyReports: weeklyReportsArray
    };
  }, [dailyPrograms, students, exams]);

  const {
    totalSolved = 0,
    totalUnsolved = 0,
    avgSolved = 0,
    avgUnsolved = 0,
    overallAvgCompletion = 0,
    last4AvgCompletion = 0,
    derivedWeeklyReports = []
  } = statsFromPrograms || {};

  const getGroupExamAverages = (type: string, subjects: Record<string, string[]>) => {
    let studentCount = 0;
    const groupAvgs: any = { totalNet: 0, percentile: 0 };
    Object.keys(subjects).forEach(sub => groupAvgs[sub] = 0);

    const activeStudents = (students || []).filter(st => !st?.isArchived && !st?.archived);

    activeStudents.forEach(st => {
      const studentExams = (exams || [])
        .filter(e => e?.studentId === st.uid && (e?.examType === type || e?.examType === 'YKS'))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4);

      if (studentExams.length > 0) {
        studentCount++;
        
        Object.keys(subjects).forEach(sub => {
          const keysToSum = subjects[sub];
          const sum = studentExams.reduce((acc, e) => {
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
          groupAvgs[sub] += (sum / studentExams.length);
        });

        const totalNetSum = studentExams.reduce((acc, e) => {
          if (e.examType === 'YKS') {
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
        }, 0);
        groupAvgs.totalNet += (totalNetSum / studentExams.length);

        const percentileSum = studentExams.reduce((acc, e) => acc + (parseFloat(e.percentile) || 0), 0);
        groupAvgs.percentile += (percentileSum / studentExams.length);
      }
    });

    if (studentCount === 0) return null;

    const finalAvgs: any = {};
    Object.keys(subjects).forEach(sub => {
      finalAvgs[sub] = (groupAvgs[sub] / studentCount).toFixed(2);
    });
    finalAvgs.totalNet = (groupAvgs.totalNet / studentCount).toFixed(2);
    finalAvgs.percentile = (groupAvgs.percentile / studentCount).toFixed(2);

    return finalAvgs;
  };

  const tytAvgs = getGroupExamAverages('TYT', {
    'Türkçe': ['Türkçe'],
    'Matematik': ['Matematik', 'Geometri'],
    'Fen Bilimleri': ['Fizik', 'Kimya', 'Biyoloji'],
    'Sosyal Bilimler': ['Tarih', 'Coğrafya', 'Felsefe', 'Din']
  });
  
  const aytAvgs = getGroupExamAverages('AYT', {
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

  if (loading) {
    return (
      <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Veriler Hesaplanıyor...</h2>
        <p className="text-slate-400 text-sm">Tüm öğrencilerin analizleri derleniyor</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <OnboardingTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={handleEndTour}
        onComplete={handleEndTour}
        onNextTour={() => {
          setIsTourOpen(false);
          tourService.markTourCompleted('coach_overall_assessment', user?.uid);
          navigate('/panel/koc/profil', { state: { startTour: true, isDemo: true } });
        }}
        nextTourLabel="Profil Ayarları Turu"
        tourKey="coach_overall_assessment"
      />

      <div id="tour-overall-header" className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">
             GENEL DEĞERLENDİRME
          </h1>
          <p className="text-slate-500 mt-1">Tüm öğrencilerinizin performans metrikleri ve toplu analizleri.</p>
        </div>
      </div>

      {(() => {
        const archivedCount = (students || []).filter(s => s?.isArchived || s?.archived).length;
        if (archivedCount === 0) return null;
        return (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs px-4 py-3 rounded-2xl">
            <Archive size={16} className="shrink-0 text-amber-400" />
            <span>
              <strong>{archivedCount} öğrenci arşivde:</strong> Arşivlenen öğrencilerin yalnızca tamamladığı soru sayıları genel toplama eklenmektedir. Eksik sorular, görev tamamlama ve sınav netleri grup ortalamalarına dahil edilmez.
            </span>
          </div>
        );
      })()}

      <div id="tour-overall-stats" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
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

      <div id="tour-overall-exams" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TYT Stat Table */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
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
                      { label: 'Grup Ortalaması (Net)', value: tytAvgs?.totalNet, highlight: true },
                      { label: 'Grup Yüzdelik Ortalama', value: tytAvgs?.percentile ? `%${tytAvgs.percentile}` : '-', highlight: true },
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
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
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
        </div>
      </div>

      <div id="tour-overall-weekly" className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-bold flex items-center gap-3">
              <History className="text-emerald-500" /> Toplu Haftalık Performans Özeti
           </h3>
        </div>
        
        <div>
           {/* Desktop View Table */}
           <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                       <th className="pb-4 px-4">Tarih</th>
                       <th className="pb-4 px-4 text-center">Toplam Çözülen Soru</th>
                       <th className="pb-4 px-4 text-center">Toplam Eksik Soru</th>
                       <th className="pb-4 px-4 text-center">Biten Görev</th>
                       <th className="pb-4 px-4 text-center">Eksik Görev</th>
                       <th className="pb-4 px-4 text-center">Grup Başarı Oranı</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5 text-sm">
                    {(derivedWeeklyReports || []).map((report, i) => (
                       <tr key={i} className="group hover:bg-white/[0.02]">
                          <td className="py-4 px-4">
                             <span className="font-bold text-slate-300 block">{report?.date}</span>
                          </td>
                          <td className="py-4 px-4 text-center font-black text-emerald-400">{report?.solvedCount || 0}</td>
                          <td className="py-4 px-4 text-center font-black text-red-400">{report?.unsolvedCount || 0}</td>
                          <td className="py-4 px-4 text-center font-black text-emerald-400">{report?.taskDone || 0}</td>
                          <td className="py-4 px-4 text-center font-black text-red-400">{report?.taskNotDone || 0}</td>
                          <td className="py-4 px-4 text-center">
                             <div className="flex items-center justify-center gap-2">
                                <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                                   <div className="h-full bg-emerald-500" style={{ width: `${Math.min(report?.successPercentage || 0, 100)}%` }} />
                                </div>
                                <span className="font-black text-white">%{report?.successPercentage || 0}</span>
                             </div>
                          </td>
                       </tr>
                    ))}
                    {(!derivedWeeklyReports || derivedWeeklyReports.length === 0) && (
                       <tr>
                          <td colSpan={6} className="py-20 text-center text-slate-600 italic">Öğrencilerin henüz program verisi bulunmuyor.</td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>

           {/* Mobile View Card List */}
           <div className="md:hidden divide-y divide-white/5 bg-slate-950/20 rounded-2xl overflow-hidden border border-white/5">
             {(derivedWeeklyReports || []).map((report, i) => (
               <div key={i} className="p-4 space-y-4 hover:bg-white/[0.01] transition-colors">
                 <div className="flex items-center justify-between border-b border-white/5 pb-2">
                   <span className="text-sm font-bold text-slate-200">{report?.date}</span>
                   <div className="flex items-center gap-2">
                     <span className="text-[10px] text-slate-500 font-bold">Başarı:</span>
                     <span className="font-black text-emerald-400 text-sm">%{report?.successPercentage || 0}</span>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3 text-xs">
                   <div className="space-y-1">
                     <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">Soru Çözümü</span>
                     <div className="flex items-center justify-between bg-white/[0.02] p-2 rounded-lg border border-white/5">
                       <span className="text-emerald-400 font-bold">Çözülen: {report?.solvedCount || 0}</span>
                       <span className="text-red-400 font-bold">Eksik: {report?.unsolvedCount || 0}</span>
                     </div>
                   </div>
                   <div className="space-y-1">
                     <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">Görevler</span>
                     <div className="flex items-center justify-between bg-white/[0.02] p-2 rounded-lg border border-white/5">
                       <span className="text-emerald-400 font-bold">Biten: {report?.taskDone || 0}</span>
                       <span className="text-red-400 font-bold">Eksik: {report?.taskNotDone || 0}</span>
                     </div>
                   </div>
                 </div>
               </div>
             ))}
             {(!derivedWeeklyReports || derivedWeeklyReports.length === 0) && (
               <div className="py-12 text-center text-slate-600 italic text-sm">Öğrencilerin henüz program verisi bulunmuyor.</div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}

